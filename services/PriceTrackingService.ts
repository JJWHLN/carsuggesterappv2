/**
 * Price Tracking Service - Core Business Feature
 * 
 * Tracks car prices and sends alerts to users when prices change.
 * Essential for user engagement and conversion.
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import { marketInsightsService } from './MarketInsightsService';
import { notificationService } from './NotificationService';

export interface PriceAlert {
  id?: string;
  user_id: string;
  car_id: string;
  car_make: string;
  car_model: string;
  car_year: number;
  target_price: number;
  current_price: number;
  alert_type: 'price_drop' | 'target_reached' | 'back_in_stock';
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  triggered_at?: string;
}

export interface PriceHistory {
  id?: string;
  car_id: string;
  price: number;
  recorded_at: string;
  source: string;
}

class PriceTrackingService {
  private static instance: PriceTrackingService;

  static getInstance(): PriceTrackingService {
    if (!PriceTrackingService.instance) {
      PriceTrackingService.instance = new PriceTrackingService();
    }
    return PriceTrackingService.instance;
  }

  /**
   * Create a price alert for a car
   */
  async createPriceAlert(
    userId: string,
    carId: string,
    targetPrice: number,
    carDetails: { make: string; model: string; year: number; currentPrice: number }
  ): Promise<PriceAlert> {
    try {
      logger.info('Creating price alert', { carId, targetPrice });

      const alertData: Partial<PriceAlert> = {
        user_id: userId,
        car_id: carId,
        car_make: carDetails.make,
        car_model: carDetails.model,
        car_year: carDetails.year,
        target_price: targetPrice,
        current_price: carDetails.currentPrice,
        alert_type: targetPrice < carDetails.currentPrice ? 'price_drop' : 'target_reached',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: alert, error } = await supabase
        .from('price_alerts')
        .insert([alertData])
        .select()
        .single();

      if (error) throw error;

      logger.info('Price alert created successfully', alert.id);
      return alert;
    } catch (error) {
      logger.error('Failed to create price alert', error);
      throw new Error('Failed to create price alert. Please try again.');
    }
  }

  /**
   * Get user's active price alerts
   */
  async getUserPriceAlerts(userId: string): Promise<PriceAlert[]> {
    try {
      const { data: alerts, error } = await supabase
        .from('price_alerts')
        .select(`
          *,
          vehicle_listings (
            id, make, model, year, price, images
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return alerts || [];
    } catch (error) {
      logger.error('Failed to fetch user price alerts', error);
      return [];
    }
  }

  /**
   * Update price alert
   */
  async updatePriceAlert(alertId: string, updates: Partial<PriceAlert>): Promise<void> {
    try {
      const { error } = await supabase
        .from('price_alerts')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;

      logger.info('Price alert updated', { alertId, updates });
    } catch (error) {
      logger.error('Failed to update price alert', error);
      throw error;
    }
  }

  /**
   * Deactivate price alert
   */
  async deactivatePriceAlert(alertId: string): Promise<void> {
    try {
      await this.updatePriceAlert(alertId, { is_active: false });
      logger.info('Price alert deactivated', alertId);
    } catch (error) {
      logger.error('Failed to deactivate price alert', error);
      throw error;
    }
  }

  /**
   * Record price history for a car
   */
  async recordPriceHistory(carId: string, price: number, source: string = 'manual'): Promise<void> {
    try {
      const historyData: Partial<PriceHistory> = {
        car_id: carId,
        price,
        source,
        recorded_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('price_history')
        .insert([historyData]);

      if (error) throw error;

      logger.info('Price history recorded', { carId, price });

      // Check for triggered alerts
      await this.checkTriggeredAlerts(carId, price);
    } catch (error) {
      logger.error('Failed to record price history', error);
      throw error;
    }
  }

  /**
   * Get price history for a car
   */
  async getCarPriceHistory(carId: string, limit: number = 30): Promise<PriceHistory[]> {
    try {
      const { data: history, error } = await supabase
        .from('price_history')
        .select('*')
        .eq('car_id', carId)
        .order('recorded_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return history || [];
    } catch (error) {
      logger.error('Failed to fetch price history', error);
      return [];
    }
  }

  /**
   * Get price trend for a car (up, down, stable)
   */
  async getCarPriceTrend(carId: string): Promise<{
    trend: 'up' | 'down' | 'stable';
    change: number;
    changePercent: number;
    period: string;
  }> {
    try {
      const history = await this.getCarPriceHistory(carId, 7); // Last 7 entries

      if (history.length < 2) {
        return { trend: 'stable', change: 0, changePercent: 0, period: 'insufficient_data' };
      }

      const latestPrice = history[0].price;
      const previousPrice = history[1].price;
      const change = latestPrice - previousPrice;
      const changePercent = (change / previousPrice) * 100;

      let trend: 'up' | 'down' | 'stable';
      if (Math.abs(changePercent) < 1) {
        trend = 'stable';
      } else if (change > 0) {
        trend = 'up';
      } else {
        trend = 'down';
      }

      return {
        trend,
        change,
        changePercent,
        period: '7_days',
      };
    } catch (error) {
      logger.error('Failed to calculate price trend', error);
      return { trend: 'stable', change: 0, changePercent: 0, period: 'error' };
    }
  }

  /**
   * Get market insights for similar cars
   */
  async getMarketInsights(carId: string): Promise<{
    averagePrice: number;
    priceRange: { min: number; max: number };
    totalListings: number;
    recommendation: 'good_deal' | 'fair_price' | 'overpriced';
  }> {
    try {
      // This would integrate with market data when available
      // For now, return mock insights
      return {
        averagePrice: 25000,
        priceRange: { min: 20000, max: 30000 },
        totalListings: 156,
        recommendation: 'good_deal',
      };
    } catch (error) {
      logger.error('Failed to get market insights', error);
      return {
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        totalListings: 0,
        recommendation: 'fair_price',
      };
    }
  }

  /**
   * Private: Check if any alerts should be triggered by new price
   */
  private async checkTriggeredAlerts(carId: string, newPrice: number): Promise<void> {
    try {
      // Get active alerts for this car
      const { data: alerts, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('car_id', carId)
        .eq('is_active', true);

      if (error || !alerts) return;

      for (const alert of alerts) {
        let shouldTrigger = false;

        if (alert.alert_type === 'price_drop' && newPrice < alert.current_price) {
          shouldTrigger = true;
        } else if (alert.alert_type === 'target_reached' && newPrice <= alert.target_price) {
          shouldTrigger = true;
        }

        if (shouldTrigger) {
          await this.triggerAlert(alert, newPrice);
        } else {
          // Update current price for comparison
          await this.updatePriceAlert(alert.id!, { current_price: newPrice });
        }
      }
    } catch (error) {
      logger.error('Failed to check triggered alerts', error);
    }
  }

  /**
   * Private: Trigger an alert
   */
  private async triggerAlert(alert: PriceAlert, newPrice: number): Promise<void> {
    try {
      // Update alert as triggered
      await this.updatePriceAlert(alert.id!, {
        triggered_at: new Date().toISOString(),
        current_price: newPrice,
      });

      // Send notification to user
      await this.sendPriceAlertNotification(alert, newPrice);

      logger.info('Price alert triggered', { alertId: alert.id, newPrice });
    } catch (error) {
      logger.error('Failed to trigger alert', error);
    }
  }

  /**
   * Private: Send price alert notification
   */
  private async sendPriceAlertNotification(alert: PriceAlert, newPrice: number): Promise<void> {
    try {
      // Get car details for notification
      const { data: car } = await supabase
        .from('vehicle_listings')
        .select('make, model, year')
        .eq('id', alert.car_id)
        .single();

      if (car) {
        const carTitle = `${car.year} ${car.make} ${car.model}`;
        const savings = alert.target_price - newPrice;

        await notificationService.sendPriceDropNotification(alert.user_id, {
          type: 'price_drop',
          carId: alert.car_id,
          carTitle,
          oldPrice: alert.current_price,
          newPrice,
          targetPrice: alert.target_price,
          savings,
        });
      }

      logger.info('Price alert notification sent', { alertId: alert.id, newPrice });
    } catch (error) {
      logger.error('Failed to send price alert notification', error);
    }
  }

  /**
   * Get enhanced market insights using market intelligence
   */
  async getEnhancedMarketInsights(carId: string): Promise<any> {
    try {
      return await marketInsightsService.getMarketInsights(carId);
    } catch (error) {
      logger.error('Failed to get enhanced market insights', error);
      // Return fallback basic insights
      return {
        averagePrice: 0,
        priceRange: { min: 0, max: 0 },
        totalListings: 0,
        recommendation: 'fair_price',
        confidenceScore: 0,
      };
    }
  }

  /**
   * Get competitor analysis for a car
   */
  async getCompetitorAnalysis(carId: string): Promise<any> {
    try {
      return await marketInsightsService.getCompetitorAnalysis(carId);
    } catch (error) {
      logger.error('Failed to get competitor analysis', error);
      return {
        similarCars: [],
        pricePosition: 'average',
        marketShare: { make: 0, model: 0 },
      };
    }
  }
}

export const priceTrackingService = PriceTrackingService.getInstance();
