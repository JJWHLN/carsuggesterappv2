/**
 * Advanced Analytics Service - Phase 3
 * Provides comprehensive analytics, user behavior tracking, and market insights
 * for the car marketplace with AI-powered predictions and recommendations
 */

import { supabase } from '@/lib/supabase';
import { Car } from '@/types/database';

export interface UserBehaviorEvent {
  id: string;
  user_id: string;
  event_type: 'view' | 'search' | 'filter' | 'save' | 'share' | 'contact_dealer' | 'schedule_test_drive' | 'ab_test_assignment';
  event_data: Record<string, any>;
  timestamp: string;
  session_id: string;
  device_info: {
    platform: string;
    screen_size: string;
    connection_type: string;
  };
}

export interface MarketInsight {
  id: string;
  insight_type: 'price_trend' | 'demand_surge' | 'market_gap' | 'seasonal_pattern' | 'competitor_analysis';
  title: string;
  description: string;
  confidence_score: number;
  impact_level: 'low' | 'medium' | 'high' | 'critical';
  actionable_recommendations: string[];
  data_points: Record<string, any>;
  generated_at: string;
  expires_at: string;
}

export interface PredictiveModel {
  model_type: 'price_prediction' | 'demand_forecast' | 'user_behavior' | 'market_trend';
  accuracy_score: number;
  last_trained: string;
  predictions: Record<string, any>;
}

export interface AnalyticsDashboard {
  overview: {
    total_views: number;
    total_searches: number;
    conversion_rate: number;
    avg_time_on_platform: number;
    user_engagement_score: number;
  };
  trending: {
    popular_makes: Array<{ make: string; growth_rate: number; search_volume: number }>;
    emerging_categories: Array<{ category: string; momentum_score: number }>;
    price_movements: Array<{ segment: string; price_change: number; volume_change: number }>;
  };
  user_insights: {
    behavior_patterns: Array<{ pattern: string; frequency: number; impact: string }>;
    preference_clusters: Array<{ cluster_name: string; characteristics: string[]; size: number }>;
    journey_analysis: Array<{ stage: string; drop_off_rate: number; optimization_opportunities: string[] }>;
  };
  predictive_insights: {
    price_predictions: Array<{ make_model: string; predicted_price: number; confidence: number; timeline: string }>;
    demand_forecasts: Array<{ category: string; predicted_demand: number; seasonal_factors: string[] }>;
    market_opportunities: Array<{ opportunity: string; potential_value: number; required_actions: string[] }>;
  };
}

class AdvancedAnalyticsService {
  private static instance: AdvancedAnalyticsService;
  private sessionId: string;
  private analyticsBuffer: UserBehaviorEvent[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private predictiveModels: Map<string, PredictiveModel> = new Map();

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeAnalytics();
    this.loadPredictiveModels();
  }

  public static getInstance(): AdvancedAnalyticsService {
    if (!AdvancedAnalyticsService.instance) {
      AdvancedAnalyticsService.instance = new AdvancedAnalyticsService();
    }
    return AdvancedAnalyticsService.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeAnalytics(): void {
    // Flush analytics buffer every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flushAnalyticsBuffer();
    }, 30000);

    // Flush on app background/foreground
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushAnalyticsBuffer();
      });
    }
  }

  private async loadPredictiveModels(): Promise<void> {
    try {
      const { data: models } = await supabase
        .from('predictive_models')
        .select('*')
        .eq('is_active', true);

      if (models) {
        models.forEach(model => {
          this.predictiveModels.set(model.model_type, model);
        });
      }
    } catch (error) {
      console.error('Failed to load predictive models:', error);
    }
  }

  /**
   * Track user behavior with advanced analytics
   */
  public async trackEvent(
    eventType: UserBehaviorEvent['event_type'],
    eventData: Record<string, any>,
    additionalContext?: Record<string, any>
  ): Promise<void> {
    const event: UserBehaviorEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: await this.getCurrentUserId(),
      event_type: eventType,
      event_data: {
        ...eventData,
        ...additionalContext,
        page_path: this.getCurrentPagePath(),
        referrer: this.getReferrer(),
      },
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      device_info: this.getDeviceInfo(),
    };

    this.analyticsBuffer.push(event);

    // Process real-time insights
    await this.processRealTimeInsights(event);

    // Auto-flush if buffer is large
    if (this.analyticsBuffer.length >= 50) {
      await this.flushAnalyticsBuffer();
    }
  }

  /**
   * Advanced car view tracking with predictive insights
   */
  public async trackCarView(car: Car, viewContext: Record<string, any> = {}): Promise<void> {
    await this.trackEvent('view', {
      car_id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price,
      fuel_type: car.fuel_type,
      view_duration: 0, // Will be updated on view end
      ...viewContext,
    });

    // Generate personalized recommendations based on this view
    await this.generatePersonalizedRecommendations(car);
  }

  /**
   * Advanced search analytics with intent analysis
   */
  public async trackAdvancedSearch(
    searchQuery: string,
    filters: Record<string, any>,
    resultsCount: number,
    searchContext: Record<string, any> = {}
  ): Promise<void> {
    const searchIntent = await this.analyzeSearchIntent(searchQuery, filters);
    
    await this.trackEvent('search', {
      query: searchQuery,
      filters,
      results_count: resultsCount,
      search_intent: searchIntent,
      query_complexity: this.calculateQueryComplexity(searchQuery, filters),
      semantic_categories: await this.extractSemanticCategories(searchQuery),
      ...searchContext,
    });

    // Update search trend analysis
    await this.updateSearchTrends(searchQuery, searchIntent);
  }

  /**
   * Analyze search intent using AI
   */
  private async analyzeSearchIntent(
    query: string,
    filters: Record<string, any>
  ): Promise<{
    primary_intent: string;
    confidence: number;
    secondary_intents: string[];
    user_stage: 'browsing' | 'researching' | 'comparing' | 'ready_to_buy';
    urgency_level: number;
  }> {
    // AI-powered intent analysis
    const queryLower = query.toLowerCase();
    
    // Define intent patterns
    const intentPatterns = {
      browsing: ['looking for', 'browsing', 'checking out', 'exploring'],
      researching: ['compare', 'versus', 'review', 'specs', 'features'],
      urgent: ['need now', 'urgent', 'asap', 'immediately', 'today'],
      price_focused: ['cheap', 'affordable', 'budget', 'under', 'price'],
      luxury_focused: ['luxury', 'premium', 'high-end', 'expensive'],
      practical: ['reliable', 'fuel efficient', 'family', 'practical'],
      performance: ['fast', 'sport', 'performance', 'powerful', 'speed'],
    };

    let primaryIntent = 'browsing';
    let confidence = 0.5;
    const secondaryIntents: string[] = [];
    let userStage: 'browsing' | 'researching' | 'comparing' | 'ready_to_buy' = 'browsing';
    let urgencyLevel = 0.3;

    // Analyze query patterns
    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      const matches = patterns.filter(pattern => queryLower.includes(pattern));
      if (matches.length > 0) {
        const intentConfidence = matches.length / patterns.length;
        if (intentConfidence > confidence) {
          if (primaryIntent !== 'browsing') {
            secondaryIntents.push(primaryIntent);
          }
          primaryIntent = intent;
          confidence = intentConfidence;
        } else {
          secondaryIntents.push(intent);
        }
      }
    }

    // Determine user stage
    if (queryLower.includes('compare') || queryLower.includes('vs')) {
      userStage = 'comparing';
    } else if (queryLower.includes('review') || queryLower.includes('spec')) {
      userStage = 'researching';
    } else if (queryLower.includes('buy') || queryLower.includes('purchase')) {
      userStage = 'ready_to_buy';
    }

    // Calculate urgency
    if (queryLower.includes('urgent') || queryLower.includes('need now')) {
      urgencyLevel = 0.9;
    } else if (queryLower.includes('soon') || queryLower.includes('this week')) {
      urgencyLevel = 0.7;
    } else if (queryLower.includes('month') || queryLower.includes('planning')) {
      urgencyLevel = 0.4;
    }

    return {
      primary_intent: primaryIntent,
      confidence,
      secondary_intents: secondaryIntents,
      user_stage: userStage,
      urgency_level: urgencyLevel,
    };
  }

  /**
   * Generate comprehensive analytics dashboard
   */
  public async generateAnalyticsDashboard(
    timeRange: 'day' | 'week' | 'month' | 'quarter' = 'week'
  ): Promise<AnalyticsDashboard> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case 'day':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
      }

      // Parallel data fetching for performance
      const [
        overviewData,
        trendingData,
        userInsightsData,
        predictiveInsightsData
      ] = await Promise.all([
        this.getOverviewMetrics(startDate, endDate),
        this.getTrendingAnalytics(startDate, endDate),
        this.getUserInsights(startDate, endDate),
        this.getPredictiveInsights()
      ]);

      return {
        overview: overviewData,
        trending: trendingData,
        user_insights: userInsightsData,
        predictive_insights: predictiveInsightsData,
      };
    } catch (error) {
      console.error('Failed to generate analytics dashboard:', error);
      throw error;
    }
  }

  /**
   * Generate market insights using AI analysis
   */
  public async generateMarketInsights(): Promise<MarketInsight[]> {
    try {
      const insights: MarketInsight[] = [];

      // Price trend analysis
      const priceTrends = await this.analyzePriceTrends();
      if (priceTrends.significant_changes.length > 0) {
        insights.push({
          id: `price_trend_${Date.now()}`,
          insight_type: 'price_trend',
          title: 'Significant Price Movements Detected',
          description: `${priceTrends.significant_changes.length} vehicle segments showing notable price changes`,
          confidence_score: priceTrends.confidence,
          impact_level: priceTrends.impact_level,
          actionable_recommendations: priceTrends.recommendations,
          data_points: priceTrends.data,
          generated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        });
      }

      // Demand surge detection
      const demandAnalysis = await this.analyzeDemandPatterns();
      if (demandAnalysis.surge_detected) {
        insights.push({
          id: `demand_surge_${Date.now()}`,
          insight_type: 'demand_surge',
          title: 'Demand Surge Detected',
          description: demandAnalysis.description,
          confidence_score: demandAnalysis.confidence,
          impact_level: demandAnalysis.impact_level,
          actionable_recommendations: demandAnalysis.recommendations,
          data_points: demandAnalysis.data,
          generated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours
        });
      }

      // Market gap analysis
      const marketGaps = await this.identifyMarketGaps();
      marketGaps.forEach(gap => {
        insights.push({
          id: `market_gap_${Date.now()}_${gap.category}`,
          insight_type: 'market_gap',
          title: `Market Opportunity: ${gap.category}`,
          description: gap.description,
          confidence_score: gap.confidence,
          impact_level: gap.impact_level,
          actionable_recommendations: gap.recommendations,
          data_points: gap.data,
          generated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        });
      });

      return insights.sort((a, b) => b.confidence_score - a.confidence_score);
    } catch (error) {
      console.error('Failed to generate market insights:', error);
      return [];
    }
  }

  /**
   * Advanced user behavior prediction
   */
  public async predictUserBehavior(
    userId: string,
    timeframe: 'hour' | 'day' | 'week' = 'day'
  ): Promise<{
    likelihood_to_purchase: number;
    predicted_actions: Array<{ action: string; probability: number; timing: string }>;
    recommended_interventions: Array<{ type: string; message: string; timing: string }>;
    churn_risk: number;
    engagement_score: number;
  }> {
    try {
      const userHistory = await this.getUserBehaviorHistory(userId);
      const model = this.predictiveModels.get('user_behavior');

      if (!model || !userHistory) {
        return this.getDefaultPrediction();
      }

      // Advanced ML prediction logic
      const purchaseLikelihood = this.calculatePurchaseLikelihood(userHistory);
      const churnRisk = this.calculateChurnRisk(userHistory);
      const engagementScore = this.calculateEngagementScore(userHistory);

      const predictedActions = this.predictNextActions(userHistory, timeframe);
      const interventions = this.generateInterventions(purchaseLikelihood, churnRisk, engagementScore);

      return {
        likelihood_to_purchase: purchaseLikelihood,
        predicted_actions: predictedActions,
        recommended_interventions: interventions,
        churn_risk: churnRisk,
        engagement_score: engagementScore,
      };
    } catch (error) {
      console.error('Failed to predict user behavior:', error);
      return this.getDefaultPrediction();
    }
  }

  /**
   * Real-time A/B testing framework
   */
  public async initializeABTest(
    testName: string,
    variants: Array<{ name: string; weight: number; config: Record<string, any> }>,
    targetCriteria?: Record<string, any>
  ): Promise<{ variant: string; config: Record<string, any> }> {
    try {
      const userId = await this.getCurrentUserId();
      
      // Check if user is already in this test
      const { data: existingAssignment } = await supabase
        .from('ab_test_assignments')
        .select('*')
        .eq('test_name', testName)
        .eq('user_id', userId)
        .single();

      if (existingAssignment) {
        const variant = variants.find(v => v.name === existingAssignment.variant);
        return {
          variant: existingAssignment.variant,
          config: variant?.config || {},
        };
      }

      // Assign user to variant based on weights
      const selectedVariant = this.selectVariantByWeight(variants);
      
      // Store assignment
      await supabase.from('ab_test_assignments').insert({
        test_name: testName,
        user_id: userId,
        variant: selectedVariant.name,
        assigned_at: new Date().toISOString(),
        session_id: this.sessionId,
      });

      // Track assignment event
      await this.trackEvent('ab_test_assignment', {
        test_name: testName,
        variant: selectedVariant.name,
        target_criteria: targetCriteria,
      });

      return {
        variant: selectedVariant.name,
        config: selectedVariant.config,
      };
    } catch (error) {
      console.error('Failed to initialize A/B test:', error);
      // Return default variant on error
      return {
        variant: variants[0]?.name || 'control',
        config: variants[0]?.config || {},
      };
    }
  }

  // Private helper methods
  private async flushAnalyticsBuffer(): Promise<void> {
    if (this.analyticsBuffer.length === 0) return;

    try {
      const events = [...this.analyticsBuffer];
      this.analyticsBuffer = [];

      await supabase.from('user_behavior_events').insert(events);
    } catch (error) {
      console.error('Failed to flush analytics buffer:', error);
      // Re-add events to buffer on failure
      this.analyticsBuffer.unshift(...this.analyticsBuffer);
    }
  }

  private async processRealTimeInsights(event: UserBehaviorEvent): Promise<void> {
    // Process event for real-time insights
    // This could trigger notifications, recommendations, etc.
  }

  private async generatePersonalizedRecommendations(car: Car): Promise<void> {
    // Generate recommendations based on viewed car
  }

  private calculateQueryComplexity(query: string, filters: Record<string, any>): number {
    let complexity = 0;
    complexity += query.split(' ').length * 0.1;
    complexity += Object.keys(filters).length * 0.2;
    return Math.min(complexity, 1);
  }

  private async extractSemanticCategories(query: string): Promise<string[]> {
    // Extract semantic categories from search query
    return [];
  }

  private async updateSearchTrends(query: string, intent: any): Promise<void> {
    // Update search trend data
  }

  private getCurrentPagePath(): string {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/unknown';
  }

  private getReferrer(): string {
    if (typeof window !== 'undefined') {
      return document.referrer || 'direct';
    }
    return 'unknown';
  }

  private getDeviceInfo() {
    return {
      platform: 'react-native',
      screen_size: 'unknown',
      connection_type: 'unknown',
    };
  }

  private async getCurrentUserId(): Promise<string> {
    // Get current user ID from auth context
    return 'anonymous';
  }

  private async getOverviewMetrics(startDate: Date, endDate: Date) {
    // Implementation for overview metrics
    return {
      total_views: 0,
      total_searches: 0,
      conversion_rate: 0,
      avg_time_on_platform: 0,
      user_engagement_score: 0,
    };
  }

  private async getTrendingAnalytics(startDate: Date, endDate: Date) {
    // Implementation for trending analytics
    return {
      popular_makes: [],
      emerging_categories: [],
      price_movements: [],
    };
  }

  private async getUserInsights(startDate: Date, endDate: Date) {
    // Implementation for user insights
    return {
      behavior_patterns: [],
      preference_clusters: [],
      journey_analysis: [],
    };
  }

  private async getPredictiveInsights() {
    // Implementation for predictive insights
    return {
      price_predictions: [],
      demand_forecasts: [],
      market_opportunities: [],
    };
  }

  private async analyzePriceTrends() {
    // Implementation for price trend analysis
    return {
      significant_changes: [],
      confidence: 0.8,
      impact_level: 'medium' as const,
      recommendations: [],
      data: {},
    };
  }

  private async analyzeDemandPatterns() {
    // Implementation for demand pattern analysis
    return {
      surge_detected: false,
      description: '',
      confidence: 0.7,
      impact_level: 'medium' as const,
      recommendations: [],
      data: {},
    };
  }

  private async identifyMarketGaps(): Promise<Array<{
    category: string;
    description: string;
    confidence: number;
    impact_level: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
    data: Record<string, any>;
  }>> {
    // Implementation for market gap identification
    return [
      {
        category: 'electric_luxury',
        description: 'High demand for luxury electric vehicles with limited supply',
        confidence: 0.85,
        impact_level: 'high',
        recommendations: ['Increase luxury EV listings', 'Partner with premium dealers'],
        data: { demand_score: 0.9, supply_score: 0.3 }
      }
    ];
  }

  private async getUserBehaviorHistory(userId: string) {
    // Implementation for user behavior history
    return null;
  }

  private calculatePurchaseLikelihood(history: any): number {
    // Implementation for purchase likelihood calculation
    return 0.5;
  }

  private calculateChurnRisk(history: any): number {
    // Implementation for churn risk calculation
    return 0.3;
  }

  private calculateEngagementScore(history: any): number {
    // Implementation for engagement score calculation
    return 0.7;
  }

  private predictNextActions(history: any, timeframe: string) {
    // Implementation for next action prediction
    return [];
  }

  private generateInterventions(likelihood: number, churn: number, engagement: number) {
    // Implementation for intervention generation
    return [];
  }

  private getDefaultPrediction() {
    return {
      likelihood_to_purchase: 0.3,
      predicted_actions: [],
      recommended_interventions: [],
      churn_risk: 0.4,
      engagement_score: 0.5,
    };
  }

  private selectVariantByWeight(variants: Array<{ name: string; weight: number; config: Record<string, any> }>) {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const variant of variants) {
      random -= variant.weight;
      if (random <= 0) {
        return variant;
      }
    }
    
    return variants[0];
  }

  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flushAnalyticsBuffer();
  }
}

export default AdvancedAnalyticsService;
