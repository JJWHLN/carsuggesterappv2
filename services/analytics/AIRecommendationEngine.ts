/**
 * AI-Powered Recommendation Engine
 * 
 * Phase 2 Week 7 - Advanced Analytics & AI Intelligence
 * 
 * Features:
 * - Machine learning-based car recommendations
 * - Collaborative filtering and content-based filtering
 * - Real-time personalization and adaptation
 * - Behavioral pattern recognition
 * - Multi-factor recommendation scoring
 */

import { supabase } from '../../lib/supabase';
import AdvancedAnalyticsEngine from './AdvancedAnalyticsEngine';

export interface CarRecommendation {
  carId: string;
  score: number;
  confidence: number;
  reasons: RecommendationReason[];
  category: 'similar_cars' | 'price_range' | 'behavioral' | 'trending' | 'personalized';
  priority: 'low' | 'medium' | 'high';
  metadata: {
    make: string;
    model: string;
    year: number;
    price: number;
    features: string[];
    dealerName: string;
    images: string[];
  };
}

export interface RecommendationReason {
  type: 'price_match' | 'feature_similarity' | 'brand_preference' | 'user_behavior' | 
        'popularity' | 'location' | 'availability' | 'market_trend';
  description: string;
  weight: number;
  evidence: any;
}

export interface UserProfile {
  userId: string;
  preferences: {
    priceRange: { min: number; max: number };
    preferredBrands: string[];
    preferredFeatures: string[];
    bodyTypes: string[];
    fuelTypes: string[];
    transmissionTypes: string[];
  };
  behavior: {
    searchHistory: SearchPattern[];
    viewHistory: ViewPattern[];
    interactionHistory: InteractionPattern[];
    purchaseHistory: PurchasePattern[];
  };
  demographics: {
    ageRange?: string;
    location?: string;
    income?: string;
    lifestyle?: string[];
  };
  contextual: {
    currentSession: SessionContext;
    recentActivity: ActivityPattern[];
    timeOfDay: string;
    seasonality: string;
  };
}

export interface SearchPattern {
  query: string;
  filters: Record<string, any>;
  results: number;
  clickedResults: string[];
  timestamp: number;
}

export interface ViewPattern {
  carId: string;
  duration: number;
  interactions: string[];
  timestamp: number;
  context: string;
}

export interface InteractionPattern {
  action: string;
  target: string;
  context: Record<string, any>;
  timestamp: number;
}

export interface PurchasePattern {
  carId: string;
  price: number;
  dealerId: string;
  features: string[];
  timestamp: number;
}

export interface SessionContext {
  intent: 'browsing' | 'researching' | 'comparing' | 'purchasing' | 'urgent';
  budget?: number;
  timeline?: string;
  location?: string;
  companions?: number;
}

export interface ActivityPattern {
  type: string;
  frequency: number;
  recency: number;
  context: Record<string, any>;
}

export class AIRecommendationEngine {
  private static instance: AIRecommendationEngine | null = null;
  private analytics: AdvancedAnalyticsEngine;
  private userProfiles: Map<string, UserProfile> = new Map();
  private modelCache: Map<string, any> = new Map();
  private isInitialized = false;

  private constructor() {
    this.analytics = AdvancedAnalyticsEngine.getInstance();
  }

  static getInstance(): AIRecommendationEngine {
    if (!AIRecommendationEngine.instance) {
      AIRecommendationEngine.instance = new AIRecommendationEngine();
    }
    return AIRecommendationEngine.instance;
  }

  // Initialize recommendation engine
  async initialize(): Promise<void> {
    try {
      // Load pre-trained models (in production, these would be real ML models)
      await this.loadRecommendationModels();
      
      // Initialize collaborative filtering data
      await this.initializeCollaborativeFiltering();
      
      this.isInitialized = true;
      console.log('AI Recommendation Engine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize recommendation engine:', error);
    }
  }

  // Get personalized recommendations for user
  async getRecommendations(
    userId: string,
    limit: number = 10,
    context?: Partial<SessionContext>
  ): Promise<CarRecommendation[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Get or build user profile
      const userProfile = await this.getUserProfile(userId);
      
      // Update context if provided
      if (context) {
        userProfile.contextual.currentSession = {
          ...userProfile.contextual.currentSession,
          ...context
        };
      }

      // Generate recommendations using multiple strategies
      const recommendations = await Promise.all([
        this.getCollaborativeRecommendations(userProfile, limit),
        this.getContentBasedRecommendations(userProfile, limit),
        this.getBehavioralRecommendations(userProfile, limit),
        this.getTrendingRecommendations(userProfile, limit),
        this.getContextualRecommendations(userProfile, limit)
      ]);

      // Merge and rank recommendations
      const mergedRecommendations = this.mergeRecommendations(recommendations.flat());
      
      // Apply personalization boost
      const personalizedRecommendations = this.applyPersonalizationBoost(
        mergedRecommendations,
        userProfile
      );

      // Filter and sort by score
      const finalRecommendations = personalizedRecommendations
        .filter(rec => rec.score > 0.3) // Minimum confidence threshold
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // Track recommendation generation
      this.analytics.track('recommendations_generated', 'business', {
        user_id: userId,
        recommendation_count: finalRecommendations.length,
        strategies_used: recommendations.map(r => r.length).join(','),
        top_categories: finalRecommendations.slice(0, 3).map(r => r.category)
      });

      return finalRecommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  // Get similar cars based on content features
  async getSimilarCars(carId: string, limit: number = 5): Promise<CarRecommendation[]> {
    try {
      const { data: targetCar, error } = await supabase
        .from('cars')
        .select('*')
        .eq('id', carId)
        .single();

      if (error || !targetCar) return [];

      // Get cars with similar features
      const { data: similarCars, error: similarError } = await supabase
        .from('cars')
        .select('*')
        .neq('id', carId)
        .limit(limit * 3); // Get more to filter later

      if (similarError || !similarCars) return [];

      // Calculate similarity scores
      const recommendations: CarRecommendation[] = similarCars
        .map(car => {
          const similarity = this.calculateContentSimilarity(targetCar, car);
          return this.buildRecommendation(car, similarity, 'similar_cars', [
            {
              type: 'feature_similarity',
              description: `Similar to your viewed car`,
              weight: 0.8,
              evidence: { targetCar: targetCar.make + ' ' + targetCar.model }
            }
          ]);
        })
        .filter(rec => rec.score > 0.4)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return recommendations;
    } catch (error) {
      console.error('Error getting similar cars:', error);
      return [];
    }
  }

  // Update user profile based on interaction
  async updateUserProfile(
    userId: string,
    interaction: {
      type: 'view' | 'search' | 'save' | 'share' | 'contact' | 'purchase';
      data: any;
    }
  ): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);
      
      switch (interaction.type) {
        case 'view':
          profile.behavior.viewHistory.push({
            carId: interaction.data.carId,
            duration: interaction.data.duration || 0,
            interactions: interaction.data.interactions || [],
            timestamp: Date.now(),
            context: interaction.data.context || 'unknown'
          });
          break;
          
        case 'search':
          profile.behavior.searchHistory.push({
            query: interaction.data.query,
            filters: interaction.data.filters || {},
            results: interaction.data.results || 0,
            clickedResults: interaction.data.clickedResults || [],
            timestamp: Date.now()
          });
          break;
          
        case 'purchase':
          profile.behavior.purchaseHistory.push({
            carId: interaction.data.carId,
            price: interaction.data.price,
            dealerId: interaction.data.dealerId,
            features: interaction.data.features || [],
            timestamp: Date.now()
          });
          break;
      }

      // Update preferences based on behavior
      this.updatePreferencesFromBehavior(profile);
      
      // Save updated profile
      await this.saveUserProfile(profile);
      
      // Track profile update
      this.analytics.track('user_profile_updated', 'user_action', {
        user_id: userId,
        interaction_type: interaction.type,
        profile_completeness: this.calculateProfileCompleteness(profile)
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
    }
  }

  // Track recommendation interaction
  async trackRecommendationInteraction(
    userId: string,
    recommendationId: string,
    action: 'viewed' | 'clicked' | 'saved' | 'shared' | 'dismissed',
    context?: Record<string, any>
  ): Promise<void> {
    this.analytics.track('recommendation_interaction', 'user_action', {
      user_id: userId,
      recommendation_id: recommendationId,
      action,
      context
    });

    // Use interaction to improve future recommendations
    await this.updateRecommendationFeedback(userId, recommendationId, action);
  }

  // Private methods for recommendation generation

  private async getCollaborativeRecommendations(
    profile: UserProfile,
    limit: number
  ): Promise<CarRecommendation[]> {
    // Simplified collaborative filtering
    // In production, this would use proper ML algorithms
    
    try {
      // Find users with similar preferences/behavior
      const similarUsers = await this.findSimilarUsers(profile);
      
      // Get cars liked by similar users
      const recommendations: CarRecommendation[] = [];
      
      for (const similarUser of similarUsers.slice(0, 5)) {
        const userCars = await this.getUserLikedCars(similarUser.userId);
        
        for (const car of userCars.slice(0, 3)) {
          if (!this.hasUserInteractedWith(profile, car.id)) {
            recommendations.push(this.buildRecommendation(car, 0.7, 'behavioral', [
              {
                type: 'user_behavior',
                description: 'Users with similar preferences liked this car',
                weight: 0.7,
                evidence: { similar_users: similarUsers.length }
              }
            ]));
          }
        }
      }
      
      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('Error generating collaborative recommendations:', error);
      return [];
    }
  }

  private async getContentBasedRecommendations(
    profile: UserProfile,
    limit: number
  ): Promise<CarRecommendation[]> {
    try {
      const { data: cars, error } = await supabase
        .from('cars')
        .select('*')
        .gte('price', profile.preferences.priceRange.min)
        .lte('price', profile.preferences.priceRange.max)
        .limit(limit * 2);

      if (error || !cars) return [];

      return cars
        .map(car => {
          const score = this.calculateContentScore(car, profile);
          const reasons = this.buildContentReasons(car, profile);
          return this.buildRecommendation(car, score, 'personalized', reasons);
        })
        .filter(rec => rec.score > 0.4)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error generating content-based recommendations:', error);
      return [];
    }
  }

  private async getBehavioralRecommendations(
    profile: UserProfile,
    limit: number
  ): Promise<CarRecommendation[]> {
    // Analyze user behavior patterns to recommend cars
    const recommendations: CarRecommendation[] = [];
    
    try {
      // Get frequently viewed brands/models
      const viewedBrands = this.extractBrandsFromHistory(profile.behavior.viewHistory);
      const topBrands = Object.entries(viewedBrands)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([brand]) => brand);

      if (topBrands.length > 0) {
        const { data: behavioralCars, error } = await supabase
          .from('cars')
          .select('*')
          .in('make', topBrands)
          .limit(limit);

        if (!error && behavioralCars) {
          behavioralCars.forEach(car => {
            recommendations.push(this.buildRecommendation(car, 0.6, 'behavioral', [
              {
                type: 'brand_preference',
                description: `You frequently view ${car.make} vehicles`,
                weight: 0.6,
                evidence: { view_count: viewedBrands[car.make] || 0 }
              }
            ]));
          });
        }
      }

      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('Error generating behavioral recommendations:', error);
      return [];
    }
  }

  private async getTrendingRecommendations(
    profile: UserProfile,
    limit: number
  ): Promise<CarRecommendation[]> {
    try {
      // Get trending cars based on recent activity
      const { data: trendingCars, error } = await supabase
        .from('cars')
        .select('*, view_count, save_count')
        .order('view_count', { ascending: false })
        .limit(limit);

      if (error || !trendingCars) return [];

      return trendingCars.map(car => 
        this.buildRecommendation(car, 0.5, 'trending', [
          {
            type: 'popularity',
            description: 'Popular among other users',
            weight: 0.5,
            evidence: { view_count: car.view_count }
          }
        ])
      );
    } catch (error) {
      console.error('Error generating trending recommendations:', error);
      return [];
    }
  }

  private async getContextualRecommendations(
    profile: UserProfile,
    limit: number
  ): Promise<CarRecommendation[]> {
    // Recommendations based on current context (time, location, intent, etc.)
    const recommendations: CarRecommendation[] = [];
    const context = profile.contextual.currentSession;

    try {
      let query = supabase.from('cars').select('*');

      // Apply contextual filters
      if (context.budget) {
        query = query.lte('price', context.budget);
      }

      if (context.intent === 'urgent') {
        // Show immediately available cars
        query = query.eq('availability', 'available');
      }

      const { data: contextualCars, error } = await query.limit(limit);

      if (!error && contextualCars) {
        contextualCars.forEach(car => {
          const reasons: RecommendationReason[] = [];
          
          if (context.budget && car.price <= context.budget) {
            reasons.push({
              type: 'price_match',
              description: 'Within your budget',
              weight: 0.7,
              evidence: { budget: context.budget, price: car.price }
            });
          }

          recommendations.push(this.buildRecommendation(car, 0.6, 'personalized', reasons));
        });
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating contextual recommendations:', error);
      return [];
    }
  }

  // Helper methods

  private mergeRecommendations(recommendations: CarRecommendation[]): CarRecommendation[] {
    const merged = new Map<string, CarRecommendation>();

    recommendations.forEach(rec => {
      const existing = merged.get(rec.carId);
      if (existing) {
        // Combine scores and reasons
        existing.score = Math.max(existing.score, rec.score);
        existing.confidence = (existing.confidence + rec.confidence) / 2;
        existing.reasons = [...existing.reasons, ...rec.reasons];
      } else {
        merged.set(rec.carId, rec);
      }
    });

    return Array.from(merged.values());
  }

  private applyPersonalizationBoost(
    recommendations: CarRecommendation[],
    profile: UserProfile
  ): CarRecommendation[] {
    return recommendations.map(rec => {
      let boost = 0;

      // Boost based on preferred brands
      if (profile.preferences.preferredBrands.includes(rec.metadata.make)) {
        boost += 0.1;
      }

      // Boost based on price range preference
      const priceScore = this.calculatePricePreferenceScore(rec.metadata.price, profile);
      boost += priceScore * 0.15;

      // Boost based on recent activity
      const recentActivityBoost = this.calculateRecentActivityBoost(rec, profile);
      boost += recentActivityBoost;

      return {
        ...rec,
        score: Math.min(1.0, rec.score + boost)
      };
    });
  }

  private calculateContentSimilarity(car1: any, car2: any): number {
    let similarity = 0;
    let factors = 0;

    // Brand similarity
    if (car1.make === car2.make) {
      similarity += 0.3;
    }
    factors++;

    // Price similarity (within 20%)
    const priceDiff = Math.abs(car1.price - car2.price) / Math.max(car1.price, car2.price);
    if (priceDiff < 0.2) {
      similarity += 0.2;
    }
    factors++;

    // Year similarity (within 3 years)
    const yearDiff = Math.abs(car1.year - car2.year);
    if (yearDiff <= 3) {
      similarity += 0.2;
    }
    factors++;

    // Body type similarity
    if (car1.body_type === car2.body_type) {
      similarity += 0.15;
    }
    factors++;

    // Fuel type similarity
    if (car1.fuel_type === car2.fuel_type) {
      similarity += 0.15;
    }
    factors++;

    return similarity;
  }

  private calculateContentScore(car: any, profile: UserProfile): number {
    let score = 0;

    // Price range match
    if (car.price >= profile.preferences.priceRange.min && 
        car.price <= profile.preferences.priceRange.max) {
      score += 0.3;
    }

    // Brand preference
    if (profile.preferences.preferredBrands.includes(car.make)) {
      score += 0.2;
    }

    // Feature preferences
    const carFeatures = car.features || [];
    const matchingFeatures = carFeatures.filter((feature: string) =>
      profile.preferences.preferredFeatures.includes(feature)
    );
    score += (matchingFeatures.length / Math.max(profile.preferences.preferredFeatures.length, 1)) * 0.2;

    // Body type preference
    if (profile.preferences.bodyTypes.includes(car.body_type)) {
      score += 0.15;
    }

    // Fuel type preference
    if (profile.preferences.fuelTypes.includes(car.fuel_type)) {
      score += 0.15;
    }

    return Math.min(1.0, score);
  }

  private buildContentReasons(car: any, profile: UserProfile): RecommendationReason[] {
    const reasons: RecommendationReason[] = [];

    if (car.price >= profile.preferences.priceRange.min && 
        car.price <= profile.preferences.priceRange.max) {
      reasons.push({
        type: 'price_match',
        description: 'Matches your price range',
        weight: 0.3,
        evidence: { price: car.price, range: profile.preferences.priceRange }
      });
    }

    if (profile.preferences.preferredBrands.includes(car.make)) {
      reasons.push({
        type: 'brand_preference',
        description: `You prefer ${car.make} vehicles`,
        weight: 0.2,
        evidence: { brand: car.make }
      });
    }

    return reasons;
  }

  private buildRecommendation(
    car: any,
    score: number,
    category: CarRecommendation['category'],
    reasons: RecommendationReason[]
  ): CarRecommendation {
    return {
      carId: car.id,
      score,
      confidence: Math.min(score + 0.1, 1.0),
      reasons,
      category,
      priority: score > 0.7 ? 'high' : score > 0.5 ? 'medium' : 'low',
      metadata: {
        make: car.make,
        model: car.model,
        year: car.year,
        price: car.price,
        features: car.features || [],
        dealerName: car.dealer_name || 'Unknown Dealer',
        images: car.images || []
      }
    };
  }

  // User profile management
  private async getUserProfile(userId: string): Promise<UserProfile> {
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId)!;
    }

    // Load from database or create new profile
    const profile = await this.loadUserProfile(userId) || this.createDefaultProfile(userId);
    this.userProfiles.set(userId, profile);
    return profile;
  }

  private createDefaultProfile(userId: string): UserProfile {
    return {
      userId,
      preferences: {
        priceRange: { min: 0, max: 100000 },
        preferredBrands: [],
        preferredFeatures: [],
        bodyTypes: [],
        fuelTypes: [],
        transmissionTypes: []
      },
      behavior: {
        searchHistory: [],
        viewHistory: [],
        interactionHistory: [],
        purchaseHistory: []
      },
      demographics: {},
      contextual: {
        currentSession: {
          intent: 'browsing'
        },
        recentActivity: [],
        timeOfDay: new Date().getHours() < 12 ? 'morning' : 
                   new Date().getHours() < 18 ? 'afternoon' : 'evening',
        seasonality: this.getCurrentSeason()
      }
    };
  }

  private async loadUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      return {
        userId,
        preferences: data.preferences || {},
        behavior: data.behavior || {},
        demographics: data.demographics || {},
        contextual: data.contextual || {}
      };
    } catch {
      return null;
    }
  }

  private async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      await supabase
        .from('user_profiles')
        .upsert({
          user_id: profile.userId,
          preferences: profile.preferences,
          behavior: profile.behavior,
          demographics: profile.demographics,
          contextual: profile.contextual,
          updated_at: new Date().toISOString()
        });

      // Update cache
      this.userProfiles.set(profile.userId, profile);
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  }

  // Utility methods
  private async loadRecommendationModels(): Promise<void> {
    // In production, load pre-trained ML models
    // For now, just mark as loaded
    console.log('Loading recommendation models...');
  }

  private async initializeCollaborativeFiltering(): Promise<void> {
    // Initialize collaborative filtering data structures
    console.log('Initializing collaborative filtering...');
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  private extractBrandsFromHistory(viewHistory: ViewPattern[]): Record<string, number> {
    // This would extract brands from actual car data
    // Simplified implementation
    return {};
  }

  private async findSimilarUsers(profile: UserProfile): Promise<Array<{ userId: string; similarity: number }>> {
    // Find users with similar preferences and behavior
    // Simplified implementation
    return [];
  }

  private async getUserLikedCars(userId: string): Promise<any[]> {
    // Get cars that user has liked/saved/purchased
    try {
      const { data, error } = await supabase
        .from('user_car_interactions')
        .select('car_id, cars(*)')
        .eq('user_id', userId)
        .in('interaction_type', ['like', 'save', 'purchase']);

      return error ? [] : data.map(d => d.cars).filter(Boolean);
    } catch {
      return [];
    }
  }

  private hasUserInteractedWith(profile: UserProfile, carId: string): boolean {
    return profile.behavior.viewHistory.some(v => v.carId === carId) ||
           profile.behavior.purchaseHistory.some(p => p.carId === carId);
  }

  private calculatePricePreferenceScore(price: number, profile: UserProfile): number {
    const { min, max } = profile.preferences.priceRange;
    if (price < min || price > max) return 0;
    
    const range = max - min;
    const position = (price - min) / range;
    
    // Prefer middle of range
    return 1 - Math.abs(position - 0.5) * 2;
  }

  private calculateRecentActivityBoost(rec: CarRecommendation, profile: UserProfile): number {
    // Boost based on recent similar activity
    let boost = 0;
    
    const recentViews = profile.behavior.viewHistory.slice(-10);
    const recentBrands = recentViews.map(v => v.carId); // Would map to actual brands
    
    if (recentBrands.length > 0) {
      boost += 0.05; // Small boost for recent activity
    }
    
    return boost;
  }

  private updatePreferencesFromBehavior(profile: UserProfile): void {
    // Update preferences based on recent behavior
    // This is a simplified implementation
    
    // Update preferred brands based on view history
    const viewedBrands = this.extractBrandsFromHistory(profile.behavior.viewHistory);
    const topBrands = Object.entries(viewedBrands)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([brand]) => brand);
    
    profile.preferences.preferredBrands = [
      ...new Set([...profile.preferences.preferredBrands, ...topBrands])
    ].slice(0, 10);
  }

  private calculateProfileCompleteness(profile: UserProfile): number {
    let completeness = 0;
    let totalFields = 0;

    // Check preferences
    if (profile.preferences.preferredBrands.length > 0) completeness++;
    totalFields++;
    
    if (profile.preferences.priceRange.min > 0 || profile.preferences.priceRange.max < 100000) completeness++;
    totalFields++;
    
    // Check behavior history
    if (profile.behavior.viewHistory.length > 0) completeness++;
    totalFields++;
    
    if (profile.behavior.searchHistory.length > 0) completeness++;
    totalFields++;
    
    // Check demographics
    if (Object.keys(profile.demographics).length > 0) completeness++;
    totalFields++;

    return completeness / totalFields;
  }

  private async updateRecommendationFeedback(
    userId: string,
    recommendationId: string,
    action: string
  ): Promise<void> {
    // Store feedback for improving future recommendations
    try {
      await supabase
        .from('recommendation_feedback')
        .insert({
          user_id: userId,
          recommendation_id: recommendationId,
          action,
          timestamp: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error storing recommendation feedback:', error);
    }
  }
}

export default AIRecommendationEngine;
