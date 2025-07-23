/**
 * Market Insights Service - Core Business Intelligence
 * 
 * Provides market analysis, pricing trends, and competitive insights
 * for cars to help users make informed decisions and set price alerts.
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export interface MarketInsight {
  carId: string;
  averagePrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  totalListings: number;
  recommendation: 'good_deal' | 'fair_price' | 'overpriced';
  confidenceScore: number; // 0-100
  lastUpdated: string;
}

export interface PriceTrend {
  carId: string;
  currentPrice: number;
  previousPrice: number;
  changeAmount: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  trendDuration: number; // days
  historicalData: Array<{
    date: string;
    price: number;
  }>;
}

export interface CompetitorAnalysis {
  carId: string;
  similarCars: Array<{
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    mileage: number;
    location: string;
    similarity: number; // 0-100
  }>;
  pricePosition: 'lowest' | 'below_average' | 'average' | 'above_average' | 'highest';
  marketShare: {
    make: number;
    model: number;
  };
}

class MarketInsightsService {
  /**
   * Get comprehensive market insights for a car
   */
  async getMarketInsights(carId: string): Promise<MarketInsight> {
    try {
      // Get car details
      const { data: car, error: carError } = await supabase
        .from('vehicle_listings')
        .select('*')
        .eq('id', carId)
        .single();

      if (carError || !car) {
        throw new Error('Car not found');
      }

      // Find similar cars for market analysis
      const similarCars = await this.findSimilarCars(car);
      
      // Calculate market metrics
      const prices = similarCars.map(c => c.price);
      const averagePrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      // Determine recommendation
      const pricePosition = car.price / averagePrice;
      let recommendation: MarketInsight['recommendation'];
      let confidenceScore: number;

      if (pricePosition <= 0.9) {
        recommendation = 'good_deal';
        confidenceScore = Math.min(95, 70 + (0.9 - pricePosition) * 100);
      } else if (pricePosition <= 1.1) {
        recommendation = 'fair_price';
        confidenceScore = Math.max(60, 85 - Math.abs(pricePosition - 1) * 100);
      } else {
        recommendation = 'overpriced';
        confidenceScore = Math.min(90, 70 + (pricePosition - 1.1) * 50);
      }

      const insight: MarketInsight = {
        carId,
        averagePrice: Math.round(averagePrice),
        priceRange: {
          min: minPrice,
          max: maxPrice,
        },
        totalListings: similarCars.length,
        recommendation,
        confidenceScore: Math.round(confidenceScore),
        lastUpdated: new Date().toISOString(),
      };

      // Cache the insight
      await this.cacheMarketInsight(insight);

      return insight;
    } catch (error) {
      logger.error('Failed to get market insights', error);
      throw error;
    }
  }

  /**
   * Get price trend analysis for a car
   */
  async getPriceTrend(carId: string): Promise<PriceTrend> {
    try {
      // Get price history from our tracking
      const { data: priceHistory, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('car_id', carId)
        .order('date', { ascending: true });

      if (error) {
        logger.warn('Failed to get price history', error);
        // Return current price as stable trend if no history
        const { data: car } = await supabase
          .from('vehicle_listings')
          .select('price')
          .eq('id', carId)
          .single();

        return {
          carId,
          currentPrice: car?.price || 0,
          previousPrice: car?.price || 0,
          changeAmount: 0,
          changePercent: 0,
          trend: 'stable',
          trendDuration: 0,
          historicalData: [],
        };
      }

      const currentPrice = priceHistory[priceHistory.length - 1]?.price || 0;
      const previousPrice = priceHistory[priceHistory.length - 2]?.price || currentPrice;
      const changeAmount = currentPrice - previousPrice;
      const changePercent = previousPrice > 0 ? (changeAmount / previousPrice) * 100 : 0;

      let trend: PriceTrend['trend'] = 'stable';
      if (Math.abs(changePercent) > 2) {
        trend = changePercent > 0 ? 'up' : 'down';
      }

      // Calculate trend duration
      let trendDuration = 1;
      if (priceHistory.length > 2) {
        const isIncreasing = changeAmount > 0;
        for (let i = priceHistory.length - 2; i > 0; i--) {
          const prevChange = priceHistory[i].price - priceHistory[i - 1].price;
          if ((isIncreasing && prevChange > 0) || (!isIncreasing && prevChange < 0)) {
            trendDuration++;
          } else {
            break;
          }
        }
      }

      return {
        carId,
        currentPrice,
        previousPrice,
        changeAmount,
        changePercent,
        trend,
        trendDuration,
        historicalData: priceHistory.map(h => ({
          date: h.date,
          price: h.price,
        })),
      };
    } catch (error) {
      logger.error('Failed to get price trend', error);
      throw error;
    }
  }

  /**
   * Get competitor analysis for a car
   */
  async getCompetitorAnalysis(carId: string): Promise<CompetitorAnalysis> {
    try {
      const { data: car, error: carError } = await supabase
        .from('vehicle_listings')
        .select('*')
        .eq('id', carId)
        .single();

      if (carError || !car) {
        throw new Error('Car not found');
      }

      // Find similar cars
      const similarCars = await this.findSimilarCars(car, 20);
      
      // Calculate similarity scores
      const competitorCars = similarCars
        .filter(c => c.id !== carId)
        .map(c => ({
          id: c.id,
          make: c.make,
          model: c.model,
          year: c.year,
          price: c.price,
          mileage: c.mileage,
          location: c.location,
          similarity: this.calculateSimilarity(car, c),
        }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 10);

      // Determine price position
      const allPrices = similarCars.map(c => c.price).sort((a, b) => a - b);
      const carPriceRank = allPrices.findIndex(p => p >= car.price);
      const percentile = carPriceRank / allPrices.length;

      let pricePosition: CompetitorAnalysis['pricePosition'];
      if (percentile <= 0.2) pricePosition = 'lowest';
      else if (percentile <= 0.4) pricePosition = 'below_average';
      else if (percentile <= 0.6) pricePosition = 'average';
      else if (percentile <= 0.8) pricePosition = 'above_average';
      else pricePosition = 'highest';

      // Calculate market share
      const makeCount = similarCars.filter(c => c.make === car.make).length;
      const modelCount = similarCars.filter(c => c.make === car.make && c.model === car.model).length;

      return {
        carId,
        similarCars: competitorCars,
        pricePosition,
        marketShare: {
          make: makeCount / similarCars.length,
          model: modelCount / similarCars.length,
        },
      };
    } catch (error) {
      logger.error('Failed to get competitor analysis', error);
      throw error;
    }
  }

  /**
   * Update price tracking for all monitored cars
   */
  async updatePriceTracking(): Promise<void> {
    try {
      // Get all cars that have active price alerts
      const { data: alertedCars, error } = await supabase
        .from('price_alerts')
        .select('car_id')
        .eq('is_active', true);

      if (error || !alertedCars) {
        logger.warn('No cars to track or error getting alerts', error);
        return;
      }

      const uniqueCarIds = [...new Set(alertedCars.map(a => a.car_id))];

      for (const carId of uniqueCarIds) {
        await this.trackCarPrice(carId);
      }

      logger.info(`Updated price tracking for ${uniqueCarIds.length} cars`);
    } catch (error) {
      logger.error('Failed to update price tracking', error);
    }
  }

  /**
   * Private helper methods
   */
  private async findSimilarCars(targetCar: any, limit: number = 50): Promise<any[]> {
    // Build query for similar cars
    let query = supabase
      .from('vehicle_listings')
      .select('*')
      .eq('make', targetCar.make)
      .eq('model', targetCar.model)
      .gte('year', targetCar.year - 2)
      .lte('year', targetCar.year + 2)
      .limit(limit);

    const { data: similarCars, error } = await query;

    if (error) {
      logger.warn('Failed to find similar cars', error);
      return [];
    }

    return similarCars || [];
  }

  private calculateSimilarity(car1: any, car2: any): number {
    let similarity = 0;
    
    // Exact make/model match
    if (car1.make === car2.make && car1.model === car2.model) similarity += 40;
    else if (car1.make === car2.make) similarity += 20;
    
    // Year similarity
    const yearDiff = Math.abs(car1.year - car2.year);
    similarity += Math.max(0, 20 - yearDiff * 5);
    
    // Mileage similarity
    const mileageDiff = Math.abs(car1.mileage - car2.mileage);
    const mileageSimilarity = Math.max(0, 20 - (mileageDiff / 10000) * 5);
    similarity += mileageSimilarity;
    
    // Price similarity
    const priceDiff = Math.abs(car1.price - car2.price);
    const pricePercDiff = priceDiff / Math.max(car1.price, car2.price);
    similarity += Math.max(0, 20 - pricePercDiff * 100);

    return Math.min(100, Math.max(0, similarity));
  }

  private async trackCarPrice(carId: string): Promise<void> {
    try {
      const { data: car, error } = await supabase
        .from('vehicle_listings')
        .select('price')
        .eq('id', carId)
        .single();

      if (error || !car) {
        logger.warn(`Car ${carId} not found for price tracking`);
        return;
      }

      // Insert price history record
      await supabase
        .from('price_history')
        .insert({
          car_id: carId,
          price: car.price,
          date: new Date().toISOString(),
        });

    } catch (error) {
      logger.warn(`Failed to track price for car ${carId}`, error);
    }
  }

  private async cacheMarketInsight(insight: MarketInsight): Promise<void> {
    try {
      await supabase
        .from('market_insights_cache')
        .upsert({
          car_id: insight.carId,
          data: insight,
          updated_at: new Date().toISOString(),
        });
    } catch (error) {
      logger.warn('Failed to cache market insight', error);
    }
  }
}

export const marketInsightsService = new MarketInsightsService();
