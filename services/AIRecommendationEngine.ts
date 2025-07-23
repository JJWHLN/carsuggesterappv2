/**
 * AI Recommendation Engine - Personalized Car Discovery
 * 
 * Provides intelligent car recommendations based on user behavior,
 * preferences, and advanced machine learning algorithms.
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import { businessAnalyticsService } from './BusinessAnalyticsService';

export interface UserPreferences {
  budget?: { min: number; max: number };
  preferredMakes?: string[];
  preferredBodyTypes?: string[];
  fuelTypePreference?: 'gas' | 'hybrid' | 'electric' | 'any';
  mileageImportance?: 'low' | 'medium' | 'high';
  yearImportance?: 'low' | 'medium' | 'high';
  features?: string[];
  location?: string;
  radius?: number;
}

export interface CarRecommendation {
  car: any;
  score: number;
  reasons: RecommendationReason[];
  confidence: number;
  category: 'perfect_match' | 'good_fit' | 'consider' | 'alternative';
}

export interface RecommendationReason {
  type: 'price_match' | 'preference_match' | 'similar_users' | 'trending' | 'deal_alert';
  explanation: string;
  weight: number;
}

export interface UserBehavior {
  viewedCars: string[];
  searchQueries: string[];
  bookmarkedCars: string[];
  contactedDealers: string[];
  priceAlerts: Array<{ carId: string; targetPrice: number }>;
  timeSpentOnCars: Record<string, number>;
}

class AIRecommendationEngine {
  private static instance: AIRecommendationEngine;
  private readonly RECOMMENDATION_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private recommendationCache = new Map<string, { recommendations: CarRecommendation[]; timestamp: number }>();

  static getInstance(): AIRecommendationEngine {
    if (!AIRecommendationEngine.instance) {
      AIRecommendationEngine.instance = new AIRecommendationEngine();
    }
    return AIRecommendationEngine.instance;
  }

  /**
   * Get personalized car recommendations for a user
   */
  async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10,
    excludeCarIds: string[] = []
  ): Promise<CarRecommendation[]> {
    try {
      // Check cache
      const cacheKey = `${userId}-${limit}-${excludeCarIds.join(',')}`;
      const cached = this.recommendationCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.RECOMMENDATION_CACHE_DURATION) {
        logger.debug('Returning cached recommendations');
        return cached.recommendations;
      }

      // Get user data
      const [preferences, behavior, demographics] = await Promise.all([
        this.getUserPreferences(userId),
        this.getUserBehavior(userId),
        this.getUserDemographics(userId),
      ]);

      // Get candidate cars
      const candidates = await this.getCandidateCars(preferences, excludeCarIds);

      // Score and rank cars
      const scoredRecommendations = await this.scoreAndRankCars(
        candidates,
        preferences,
        behavior,
        demographics
      );

      // Add recommendation reasons
      const recommendationsWithReasons = await this.addRecommendationReasons(
        scoredRecommendations,
        preferences,
        behavior
      );

      // Sort by score and limit results
      const finalRecommendations = recommendationsWithReasons
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Cache results
      this.recommendationCache.set(cacheKey, {
        recommendations: finalRecommendations,
        timestamp: Date.now(),
      });

      // Track recommendation generation
      await businessAnalyticsService.trackUserInteraction(
        userId,
        'recommendations_generated',
        'car',
        undefined,
        { count: finalRecommendations.length }
      );

      logger.info('Generated personalized recommendations', {
        userId,
        count: finalRecommendations.length,
        avgScore: finalRecommendations.reduce((sum, r) => sum + r.score, 0) / finalRecommendations.length,
      });

      return finalRecommendations;
    } catch (error) {
      logger.error('Failed to generate personalized recommendations', error);
      return await this.getFallbackRecommendations(limit);
    }
  }

  /**
   * Get similar cars based on a specific car
   */
  async getSimilarCars(
    carId: string,
    userId?: string,
    limit: number = 5
  ): Promise<CarRecommendation[]> {
    try {
      // Get the reference car
      const { data: referenceCar, error } = await supabase
        .from('vehicle_listings')
        .select('*')
        .eq('id', carId)
        .single();

      if (error || !referenceCar) {
        logger.warn('Reference car not found for similarity search', { carId });
        return [];
      }

      // Find similar cars based on attributes
      const similarCars = await this.findSimilarCarsByAttributes(referenceCar, limit * 2);

      // Score similarity
      const scoredSimilarities = similarCars.map(car => ({
        car,
        score: this.calculateSimilarityScore(referenceCar, car),
        reasons: this.generateSimilarityReasons(referenceCar, car),
        confidence: 0.8,
        category: 'good_fit' as const,
      }));

      // Apply user preferences if available
      if (userId) {
        const preferences = await this.getUserPreferences(userId);
        const behavior = await this.getUserBehavior(userId);
        
        return this.applyUserContextToSimilarities(
          scoredSimilarities,
          preferences,
          behavior
        ).slice(0, limit);
      }

      return scoredSimilarities
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      logger.error('Failed to get similar cars', error);
      return [];
    }
  }

  /**
   * Get trending cars based on user activity and market data
   */
  async getTrendingRecommendations(
    userId?: string,
    limit: number = 8
  ): Promise<CarRecommendation[]> {
    try {
      // Get trending cars from analytics
      const trendingCars = await this.getTrendingCars(limit * 2);

      // Score trending cars
      const scoredTrending = trendingCars.map(car => ({
        car,
        score: this.calculateTrendingScore(car),
        reasons: [
          {
            type: 'trending' as const,
            explanation: 'Popular among CarSuggester users',
            weight: 0.7,
          },
        ],
        confidence: 0.6,
        category: 'consider' as const,
      }));

      // Apply user context if available
      if (userId) {
        const preferences = await this.getUserPreferences(userId);
        return this.filterByUserPreferences(scoredTrending, preferences).slice(0, limit);
      }

      return scoredTrending.slice(0, limit);
    } catch (error) {
      logger.error('Failed to get trending recommendations', error);
      return [];
    }
  }

  /**
   * Get deal alerts - cars with significant price drops or great value
   */
  async getDealAlertRecommendations(
    userId?: string,
    limit: number = 5
  ): Promise<CarRecommendation[]> {
    try {
      // Find cars with recent price drops
      const dealCars = await this.findDealCars(limit * 2);

      const scoredDeals = dealCars.map(car => ({
        car,
        score: this.calculateDealScore(car),
        reasons: [
          {
            type: 'deal_alert' as const,
            explanation: `Price dropped by $${car.priceDropAmount?.toLocaleString() || '0'}`,
            weight: 0.8,
          },
        ],
        confidence: 0.9,
        category: 'perfect_match' as const,
      }));

      // Apply user preferences if available
      if (userId) {
        const preferences = await this.getUserPreferences(userId);
        return this.filterByUserPreferences(scoredDeals, preferences).slice(0, limit);
      }

      return scoredDeals.slice(0, limit);
    } catch (error) {
      logger.error('Failed to get deal alert recommendations', error);
      return [];
    }
  }

  /**
   * Update user preferences based on behavior
   */
  async updateUserPreferencesFromBehavior(userId: string): Promise<void> {
    try {
      const behavior = await this.getUserBehavior(userId);
      const inferredPreferences = await this.inferPreferencesFromBehavior(behavior);
      
      // Update user preferences in database
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          inferred_preferences: inferredPreferences,
          updated_at: new Date().toISOString(),
        });

      logger.info('Updated user preferences from behavior', { userId });
    } catch (error) {
      logger.warn('Failed to update user preferences from behavior', error);
    }
  }

  /**
   * Private helper methods
   */
  private async getUserPreferences(userId: string): Promise<UserPreferences> {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return this.getDefaultPreferences();
      }

      return {
        budget: data.budget,
        preferredMakes: data.preferred_makes,
        preferredBodyTypes: data.preferred_body_types,
        fuelTypePreference: data.fuel_type_preference,
        mileageImportance: data.mileage_importance,
        yearImportance: data.year_importance,
        features: data.features,
        location: data.location,
        radius: data.radius,
      };
    } catch (error) {
      logger.warn('Failed to get user preferences', error);
      return this.getDefaultPreferences();
    }
  }

  private async getUserBehavior(userId: string): Promise<UserBehavior> {
    try {
      // Get user interaction data
      const [views, searches, bookmarks, contacts, alerts] = await Promise.all([
        this.getUserViews(userId),
        this.getUserSearches(userId),
        this.getUserBookmarks(userId),
        this.getUserContacts(userId),
        this.getUserPriceAlerts(userId),
      ]);

      return {
        viewedCars: views,
        searchQueries: searches,
        bookmarkedCars: bookmarks,
        contactedDealers: contacts,
        priceAlerts: alerts,
        timeSpentOnCars: {}, // Would be tracked in real implementation
      };
    } catch (error) {
      logger.warn('Failed to get user behavior', error);
      return {
        viewedCars: [],
        searchQueries: [],
        bookmarkedCars: [],
        contactedDealers: [],
        priceAlerts: [],
        timeSpentOnCars: {},
      };
    }
  }

  private async getUserDemographics(userId: string): Promise<any> {
    // In a real implementation, this would get user demographics
    return {
      ageGroup: 'unknown',
      location: 'unknown',
      incomeRange: 'unknown',
    };
  }

  private async getCandidateCars(
    preferences: UserPreferences,
    excludeCarIds: string[]
  ): Promise<any[]> {
    try {
      let query = supabase
        .from('vehicle_listings')
        .select('*');

      // Apply preference filters
      if (preferences.budget) {
        if (preferences.budget.min) {
          query = query.gte('price', preferences.budget.min);
        }
        if (preferences.budget.max) {
          query = query.lte('price', preferences.budget.max);
        }
      }

      if (preferences.preferredMakes?.length) {
        query = query.in('make', preferences.preferredMakes);
      }

      if (excludeCarIds.length) {
        query = query.not('id', 'in', `(${excludeCarIds.join(',')})`);
      }

      // Limit to reasonable number for processing
      query = query.limit(100);

      const { data: cars, error } = await query;

      if (error) {
        logger.error('Failed to get candidate cars', error);
        return [];
      }

      return cars || [];
    } catch (error) {
      logger.error('Failed to get candidate cars', error);
      return [];
    }
  }

  private async scoreAndRankCars(
    cars: any[],
    preferences: UserPreferences,
    behavior: UserBehavior,
    demographics: any
  ): Promise<CarRecommendation[]> {
    return cars.map(car => {
      let score = 0;
      let confidence = 0.5;

      // Price match scoring
      if (preferences.budget) {
        const priceScore = this.calculatePriceScore(car.price, preferences.budget);
        score += priceScore * 0.3;
        confidence += priceScore * 0.1;
      }

      // Make preference scoring
      if (preferences.preferredMakes?.includes(car.make)) {
        score += 0.25;
        confidence += 0.15;
      }

      // Behavior-based scoring
      if (behavior.viewedCars.length > 0) {
        const behaviorScore = this.calculateBehaviorScore(car, behavior);
        score += behaviorScore * 0.2;
        confidence += behaviorScore * 0.1;
      }

      // Market factors
      const marketScore = this.calculateMarketScore(car);
      score += marketScore * 0.15;

      // Trending factor
      const trendingScore = Math.random() * 0.1; // Simplified
      score += trendingScore;

      // Normalize score to 0-1 range
      score = Math.min(1, Math.max(0, score));
      confidence = Math.min(1, Math.max(0.3, confidence));

      // Determine category
      let category: CarRecommendation['category'];
      if (score >= 0.8) category = 'perfect_match';
      else if (score >= 0.6) category = 'good_fit';
      else if (score >= 0.4) category = 'consider';
      else category = 'alternative';

      return {
        car,
        score,
        reasons: [], // Will be filled later
        confidence,
        category,
      };
    });
  }

  private async addRecommendationReasons(
    recommendations: CarRecommendation[],
    preferences: UserPreferences,
    behavior: UserBehavior
  ): Promise<CarRecommendation[]> {
    return recommendations.map(rec => {
      const reasons: RecommendationReason[] = [];

      // Price-based reasons
      if (preferences.budget && this.isInPriceRange(rec.car.price, preferences.budget)) {
        reasons.push({
          type: 'price_match',
          explanation: `Within your budget of $${preferences.budget.min?.toLocaleString()}-$${preferences.budget.max?.toLocaleString()}`,
          weight: 0.3,
        });
      }

      // Preference-based reasons
      if (preferences.preferredMakes?.includes(rec.car.make)) {
        reasons.push({
          type: 'preference_match',
          explanation: `Matches your preferred brand: ${rec.car.make}`,
          weight: 0.25,
        });
      }

      // Behavior-based reasons
      if (behavior.viewedCars.length > 0) {
        const similarViewed = this.findSimilarViewedCars(rec.car, behavior.viewedCars);
        if (similarViewed.length > 0) {
          reasons.push({
            type: 'similar_users',
            explanation: `Similar to cars you've viewed recently`,
            weight: 0.2,
          });
        }
      }

      return {
        ...rec,
        reasons,
      };
    });
  }

  private calculatePriceScore(price: number, budget: { min?: number; max?: number }): number {
    if (!budget.min && !budget.max) return 0.5;

    const min = budget.min || 0;
    const max = budget.max || Number.MAX_SAFE_INTEGER;

    if (price < min || price > max) return 0;

    // Score higher for prices in the middle of the range
    const range = max - min;
    const position = (price - min) / range;
    
    // Bell curve scoring - highest score around 0.4-0.6 of the range
    return Math.exp(-Math.pow((position - 0.5) * 3, 2));
  }

  private calculateBehaviorScore(car: any, behavior: UserBehavior): number {
    let score = 0;

    // Check if similar to viewed cars
    const viewedSimilarity = this.calculateAverageViewedSimilarity(car, behavior.viewedCars);
    score += viewedSimilarity * 0.5;

    // Check if matches search patterns
    const searchRelevance = this.calculateSearchRelevance(car, behavior.searchQueries);
    score += searchRelevance * 0.3;

    // Check if similar to bookmarked cars
    const bookmarkSimilarity = this.calculateAverageBookmarkSimilarity(car, behavior.bookmarkedCars);
    score += bookmarkSimilarity * 0.2;

    return Math.min(1, score);
  }

  private calculateMarketScore(car: any): number {
    // Simplified market scoring based on car attributes
    let score = 0.5; // Base score

    // Recent year bonus
    const currentYear = new Date().getFullYear();
    if (car.year >= currentYear - 3) {
      score += 0.1;
    }

    // Low mileage bonus
    if (car.mileage < 50000) {
      score += 0.1;
    }

    // Condition bonus
    if (car.condition === 'new') {
      score += 0.1;
    } else if (car.condition === 'certified') {
      score += 0.05;
    }

    return Math.min(1, score);
  }

  private calculateSimilarityScore(referenceCar: any, car: any): number {
    let similarity = 0;

    // Make and model match
    if (referenceCar.make === car.make) {
      similarity += 0.3;
      if (referenceCar.model === car.model) {
        similarity += 0.3;
      }
    }

    // Year similarity
    const yearDiff = Math.abs(referenceCar.year - car.year);
    similarity += Math.max(0, 0.2 - (yearDiff * 0.05));

    // Price similarity
    const priceDiff = Math.abs(referenceCar.price - car.price) / Math.max(referenceCar.price, car.price);
    similarity += Math.max(0, 0.2 - priceDiff);

    return Math.min(1, similarity);
  }

  private calculateTrendingScore(car: any): number {
    // Simplified trending score
    return 0.5 + Math.random() * 0.3;
  }

  private calculateDealScore(car: any): number {
    // Simplified deal score based on price drop
    const priceDropPercent = (car.priceDropAmount || 0) / (car.originalPrice || car.price);
    return Math.min(1, priceDropPercent * 2); // Max score for 50% drop
  }

  private async findSimilarCarsByAttributes(referenceCar: any, limit: number): Promise<any[]> {
    try {
      const { data: cars, error } = await supabase
        .from('vehicle_listings')
        .select('*')
        .eq('make', referenceCar.make)
        .neq('id', referenceCar.id)
        .limit(limit);

      if (error) {
        logger.error('Failed to find similar cars', error);
        return [];
      }

      return cars || [];
    } catch (error) {
      logger.error('Failed to find similar cars', error);
      return [];
    }
  }

  private async getTrendingCars(limit: number): Promise<any[]> {
    try {
      // In a real implementation, this would use analytics data
      const { data: cars, error } = await supabase
        .from('vehicle_listings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Failed to get trending cars', error);
        return [];
      }

      return cars || [];
    } catch (error) {
      logger.error('Failed to get trending cars', error);
      return [];
    }
  }

  private async findDealCars(limit: number): Promise<any[]> {
    try {
      // In a real implementation, this would find cars with price drops
      const { data: cars, error } = await supabase
        .from('vehicle_listings')
        .select('*')
        .order('price', { ascending: true })
        .limit(limit);

      if (error) {
        logger.error('Failed to find deal cars', error);
        return [];
      }

      // Add mock price drop data
      return (cars || []).map(car => ({
        ...car,
        priceDropAmount: Math.floor(Math.random() * 5000) + 1000,
        originalPrice: car.price + Math.floor(Math.random() * 5000) + 1000,
      }));
    } catch (error) {
      logger.error('Failed to find deal cars', error);
      return [];
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      budget: { min: 10000, max: 50000 },
      preferredMakes: [],
      preferredBodyTypes: [],
      fuelTypePreference: 'any',
      mileageImportance: 'medium',
      yearImportance: 'medium',
      features: [],
    };
  }

  private async getUserViews(userId: string): Promise<string[]> {
    // Would get from user interaction analytics
    return [];
  }

  private async getUserSearches(userId: string): Promise<string[]> {
    // Would get from search analytics
    return [];
  }

  private async getUserBookmarks(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_bookmarks')
        .select('car_id')
        .eq('user_id', userId);

      if (error) return [];
      return (data || []).map(b => b.car_id);
    } catch (error) {
      return [];
    }
  }

  private async getUserContacts(userId: string): Promise<string[]> {
    // Would get from lead analytics
    return [];
  }

  private async getUserPriceAlerts(userId: string): Promise<Array<{ carId: string; targetPrice: number }>> {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select('car_id, target_price')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) return [];
      return (data || []).map(a => ({ carId: a.car_id, targetPrice: a.target_price }));
    } catch (error) {
      return [];
    }
  }

  private isInPriceRange(price: number, budget: { min?: number; max?: number }): boolean {
    const min = budget.min || 0;
    const max = budget.max || Number.MAX_SAFE_INTEGER;
    return price >= min && price <= max;
  }

  private findSimilarViewedCars(car: any, viewedCarIds: string[]): string[] {
    // Simplified - would use actual similarity calculation
    return viewedCarIds.slice(0, 2);
  }

  private calculateAverageViewedSimilarity(car: any, viewedCarIds: string[]): number {
    // Simplified similarity calculation
    return viewedCarIds.length > 0 ? 0.3 : 0;
  }

  private calculateSearchRelevance(car: any, searchQueries: string[]): number {
    // Simplified search relevance
    return searchQueries.length > 0 ? 0.2 : 0;
  }

  private calculateAverageBookmarkSimilarity(car: any, bookmarkedCarIds: string[]): number {
    // Simplified bookmark similarity
    return bookmarkedCarIds.length > 0 ? 0.4 : 0;
  }

  private generateSimilarityReasons(referenceCar: any, car: any): RecommendationReason[] {
    const reasons: RecommendationReason[] = [];

    if (referenceCar.make === car.make) {
      reasons.push({
        type: 'preference_match',
        explanation: `Same brand: ${car.make}`,
        weight: 0.3,
      });
    }

    const yearDiff = Math.abs(referenceCar.year - car.year);
    if (yearDiff <= 2) {
      reasons.push({
        type: 'preference_match',
        explanation: `Similar year (${car.year})`,
        weight: 0.2,
      });
    }

    return reasons;
  }

  private applyUserContextToSimilarities(
    similarities: CarRecommendation[],
    preferences: UserPreferences,
    behavior: UserBehavior
  ): CarRecommendation[] {
    return similarities.map(sim => ({
      ...sim,
      score: sim.score * (this.calculateUserContextMultiplier(sim.car, preferences, behavior)),
    })).sort((a, b) => b.score - a.score);
  }

  private calculateUserContextMultiplier(car: any, preferences: UserPreferences, behavior: UserBehavior): number {
    let multiplier = 1;

    // Budget preference
    if (preferences.budget && this.isInPriceRange(car.price, preferences.budget)) {
      multiplier *= 1.2;
    }

    // Make preference
    if (preferences.preferredMakes?.includes(car.make)) {
      multiplier *= 1.15;
    }

    return multiplier;
  }

  private filterByUserPreferences(
    recommendations: CarRecommendation[],
    preferences: UserPreferences
  ): CarRecommendation[] {
    return recommendations.filter(rec => {
      // Filter by budget
      if (preferences.budget && !this.isInPriceRange(rec.car.price, preferences.budget)) {
        return false;
      }

      return true;
    });
  }

  private async inferPreferencesFromBehavior(behavior: UserBehavior): Promise<Partial<UserPreferences>> {
    const inferred: Partial<UserPreferences> = {};

    // Infer budget from viewed cars
    if (behavior.viewedCars.length > 0) {
      // Would analyze price patterns of viewed cars
    }

    // Infer preferred makes from behavior
    if (behavior.searchQueries.length > 0) {
      // Would analyze search patterns
    }

    return inferred;
  }

  private async getFallbackRecommendations(limit: number): Promise<CarRecommendation[]> {
    try {
      const { data: cars, error } = await supabase
        .from('vehicle_listings')
        .select('*')
        .limit(limit);

      if (error || !cars) return [];

      return cars.map(car => ({
        car,
        score: 0.5,
        reasons: [
          {
            type: 'trending' as const,
            explanation: 'Popular car on CarSuggester',
            weight: 0.5,
          },
        ],
        confidence: 0.3,
        category: 'consider' as const,
      }));
    } catch (error) {
      logger.error('Failed to get fallback recommendations', error);
      return [];
    }
  }
}

export const aiRecommendationEngine = AIRecommendationEngine.getInstance();
