import { supabase } from '@/lib/supabase';
import PerformanceMonitor from './performanceMonitor';

interface UserEvent {
  id?: string;
  user_id: string;
  event_type: string;
  event_data: Record<string, any>;
  timestamp: string;
  session_id: string;
  device_info?: Record<string, any>;
}

interface UserPreference {
  user_id: string;
  preference_type: string;
  preference_value: any;
  confidence_score: number;
  created_at: string;
  updated_at: string;
}

interface PersonalizationProfile {
  userId: string;
  interests: string[];
  priceRange: { min: number; max: number };
  preferredBrands: string[];
  preferredFeatures: string[];
  location: string;
  searchHistory: string[];
  viewHistory: string[];
  savedCars: string[];
  behaviorScore: number;
  engagementLevel: 'low' | 'medium' | 'high';
}

class AdvancedAnalyticsService {
  private static instance: AdvancedAnalyticsService;
  private performanceMonitor: PerformanceMonitor;
  private sessionId: string;
  private eventQueue: UserEvent[] = [];
  private isOnline: boolean = true;
  private syncInterval?: NodeJS.Timeout;

  private constructor() {
    this.performanceMonitor = PerformanceMonitor.getInstance();
    this.sessionId = this.generateSessionId();
    this.startAnalytics();
  }

  static getInstance(): AdvancedAnalyticsService {
    if (!AdvancedAnalyticsService.instance) {
      AdvancedAnalyticsService.instance = new AdvancedAnalyticsService();
    }
    return AdvancedAnalyticsService.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startAnalytics(): void {
    // Start periodic sync of queued events
    this.syncInterval = setInterval(() => {
      this.syncQueuedEvents();
    }, 30000); // Sync every 30 seconds

    logger.debug('🔬 Advanced Analytics Service started');
  }

  // TikTok-style engagement tracking
  trackUserEngagement(eventType: string, data: Record<string, any>, userId?: string): void {
    const event: UserEvent = {
      user_id: userId || 'anonymous',
      event_type: eventType,
      event_data: {
        ...data,
        timestamp: Date.now(),
        page_url: data.page || 'unknown',
        user_agent: 'React Native App',
      },
      timestamp: new Date().toISOString(),
      session_id: this.sessionId,
      device_info: this.getDeviceInfo(),
    };

    // Add to queue for batch processing
    this.eventQueue.push(event);

    // Performance monitoring integration
    this.performanceMonitor.startTimer(`UserEngagement_${eventType}`, data);

    logger.debug(`📊 Tracked engagement: ${eventType}`, data);
  }

  // Instagram-style story interaction tracking
  trackStoryInteraction(storyType: string, action: string, userId?: string): void {
    this.trackUserEngagement('story_interaction', {
      story_type: storyType,
      action: action,
      engagement_level: this.calculateEngagementLevel(action),
    }, userId);
  }

  // Zillow-style search analytics
  trackSearchBehavior(searchQuery: string, filters: Record<string, any>, resultsCount: number, userId?: string): void {
    this.trackUserEngagement('search_performed', {
      search_query: searchQuery,
      filters_applied: filters,
      results_count: resultsCount,
      search_intent: this.analyzeSearchIntent(searchQuery),
    }, userId);
  }

  // Car viewing analytics with dwell time
  trackCarView(carId: string, viewDuration: number, scrollDepth: number, userId?: string): void {
    this.trackUserEngagement('car_viewed', {
      car_id: carId,
      view_duration: viewDuration,
      scroll_depth: scrollDepth,
      engagement_quality: this.calculateViewQuality(viewDuration, scrollDepth),
    }, userId);
  }

  // Conversion tracking
  trackConversion(conversionType: string, value: number, metadata: Record<string, any>, userId?: string): void {
    this.trackUserEngagement('conversion', {
      conversion_type: conversionType,
      conversion_value: value,
      ...metadata,
    }, userId);
  }

  // Real-time personalization
  async updateUserPreferences(userId: string, preferences: Partial<UserPreference>): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        logger.error('Error updating user preferences:', error);
      } else {
        logger.debug('✅ User preferences updated');
      }
    } catch (error) {
      logger.error('Failed to update preferences:', error);
    }
  }

  // Netflix-style recommendation engine
  async generatePersonalizedRecommendations(userId: string): Promise<string[]> {
    try {
      // Get user's interaction history
      const userEvents = await this.getUserEvents(userId, 100);
      const profile = await this.buildPersonalizationProfile(userId, userEvents);

      // Generate recommendations based on behavior
      const recommendations = await this.computeRecommendations(profile);
      
      this.trackUserEngagement('recommendations_generated', {
        recommendations_count: recommendations.length,
        user_profile: profile,
      }, userId);

      return recommendations;
    } catch (error) {
      logger.error('Error generating recommendations:', error);
      return [];
    }
  }

  // A/B testing framework
  async getExperimentVariant(experimentId: string, userId?: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('ab_experiments')
        .select('*')
        .eq('experiment_id', experimentId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return 'control';
      }

      // Deterministic assignment based on user ID
      const hash = this.hashString(userId || 'anonymous');
      const variant = hash % 2 === 0 ? 'control' : 'treatment';

      // Track experiment exposure
      this.trackUserEngagement('experiment_exposure', {
        experiment_id: experimentId,
        variant: variant,
      }, userId);

      return variant;
    } catch (error) {
      logger.error('Error getting experiment variant:', error);
      return 'control';
    }
  }

  // Real-time analytics dashboard data
  async getRealtimeMetrics(): Promise<Record<string, any>> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const { data: recentEvents, error } = await supabase
        .from('user_events')
        .select('*')
        .gte('timestamp', oneHourAgo.toISOString())
        .order('timestamp', { ascending: false });

      if (error) {
        logger.error('Error fetching realtime metrics:', error);
        return {};
      }

      const metrics = this.calculateRealtimeMetrics(recentEvents || []);
      return metrics;
    } catch (error) {
      logger.error('Failed to get realtime metrics:', error);
      return {};
    }
  }

  // Privacy-compliant data export
  async exportUserData(userId: string): Promise<Record<string, any>> {
    try {
      const [events, preferences, profile] = await Promise.all([
        this.getUserEvents(userId),
        this.getUserPreferences(userId),
        this.buildPersonalizationProfile(userId),
      ]);

      return {
        user_id: userId,
        session_data: {
          events: events,
          preferences: preferences,
          personalization_profile: profile,
        },
        export_timestamp: new Date().toISOString(),
        data_retention_policy: '90 days',
      };
    } catch (error) {
      logger.error('Error exporting user data:', error);
      return {};
    }
  }

  // GDPR compliance - data deletion
  async deleteUserData(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_events')
        .delete()
        .eq('user_id', userId);

      if (error) {
        logger.error('Error deleting user data:', error);
        return false;
      }

      logger.debug('✅ User data deleted successfully');
      return true;
    } catch (error) {
      logger.error('Failed to delete user data:', error);
      return false;
    }
  }

  // Helper methods
  private async syncQueuedEvents(): Promise<void> {
    if (this.eventQueue.length === 0 || !this.isOnline) return;

    try {
      const eventsToSync = [...this.eventQueue];
      this.eventQueue = [];

      const { error } = await supabase
        .from('user_events')
        .insert(eventsToSync);

      if (error) {
        logger.error('Error syncing events:', error);
        // Re-add events to queue for retry
        this.eventQueue.unshift(...eventsToSync);
      } else {
        logger.debug(`✅ Synced ${eventsToSync.length} events`);
      }
    } catch (error) {
      logger.error('Failed to sync events:', error);
    }
  }

  private async getUserEvents(userId: string, limit: number = 1000): Promise<UserEvent[]> {
    const { data, error } = await supabase
      .from('user_events')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('Error fetching user events:', error);
      return [];
    }

    return data || [];
  }

  private async getUserPreferences(userId: string): Promise<UserPreference[]> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      logger.error('Error fetching user preferences:', error);
      return [];
    }

    return data || [];
  }

  private async buildPersonalizationProfile(userId: string, events?: UserEvent[]): Promise<PersonalizationProfile> {
    const userEvents = events || await this.getUserEvents(userId);
    
    // Analyze user behavior patterns
    const interests = this.extractInterests(userEvents);
    const priceRange = this.extractPriceRange(userEvents);
    const preferredBrands = this.extractPreferredBrands(userEvents);
    const behaviorScore = this.calculateBehaviorScore(userEvents);
    
    return {
      userId,
      interests,
      priceRange,
      preferredBrands,
      preferredFeatures: this.extractPreferredFeatures(userEvents),
      location: this.extractLocation(userEvents),
      searchHistory: this.extractSearchHistory(userEvents),
      viewHistory: this.extractViewHistory(userEvents),
      savedCars: this.extractSavedCars(userEvents),
      behaviorScore,
      engagementLevel: this.determineEngagementLevel(behaviorScore),
    };
  }

  private async computeRecommendations(profile: PersonalizationProfile): Promise<string[]> {
    // Simplified recommendation algorithm
    // In production, this would use ML models
    const recommendations: string[] = [];
    
    // Add cars based on preferred brands
    profile.preferredBrands.forEach(brand => {
      recommendations.push(`${brand}_recommendation`);
    });
    
    // Add cars in price range
    recommendations.push(`price_range_${profile.priceRange.min}_${profile.priceRange.max}`);
    
    return recommendations.slice(0, 10); // Limit to 10 recommendations
  }

  private calculateRealtimeMetrics(events: UserEvent[]): Record<string, any> {
    const totalEvents = events.length;
    const uniqueUsers = new Set(events.map(e => e.user_id)).size;
    const eventTypes = events.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total_events: totalEvents,
      unique_users: uniqueUsers,
      events_by_type: eventTypes,
      average_session_length: this.calculateAverageSessionLength(events),
      top_events: Object.entries(eventTypes)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5),
    };
  }

  private calculateEngagementLevel(action: string): number {
    const engagementWeights: Record<string, number> = {
      'view': 1,
      'tap': 2,
      'swipe': 2,
      'share': 5,
      'save': 7,
      'contact': 10,
    };
    return engagementWeights[action] || 1;
  }

  private analyzeSearchIntent(query: string): string {
    const lowercaseQuery = query.toLowerCase();
    
    if (lowercaseQuery.includes('cheap') || lowercaseQuery.includes('budget')) {
      return 'budget_conscious';
    } else if (lowercaseQuery.includes('luxury') || lowercaseQuery.includes('premium')) {
      return 'luxury_seeker';
    } else if (lowercaseQuery.includes('family') || lowercaseQuery.includes('suv')) {
      return 'family_oriented';
    } else if (lowercaseQuery.includes('sport') || lowercaseQuery.includes('fast')) {
      return 'performance_oriented';
    } else {
      return 'general_browsing';
    }
  }

  private calculateViewQuality(duration: number, scrollDepth: number): string {
    if (duration > 30000 && scrollDepth > 0.7) {
      return 'high';
    } else if (duration > 10000 && scrollDepth > 0.3) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  private getDeviceInfo(): Record<string, any> {
    return {
      platform: 'react-native',
      timestamp: Date.now(),
    };
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private extractInterests(events: UserEvent[]): string[] {
    // Extract interests from user behavior
    const interests = new Set<string>();
    
    events.forEach(event => {
      if (event.event_type === 'car_viewed' && event.event_data.car_category) {
        interests.add(event.event_data.car_category);
      }
      if (event.event_type === 'search_performed' && event.event_data.search_intent) {
        interests.add(event.event_data.search_intent);
      }
    });
    
    return Array.from(interests);
  }

  private extractPriceRange(events: UserEvent[]): { min: number; max: number } {
    const priceViews = events
      .filter(e => e.event_type === 'car_viewed' && e.event_data.car_price)
      .map(e => e.event_data.car_price);
    
    if (priceViews.length === 0) {
      return { min: 0, max: 100000 };
    }
    
    const min = Math.min(...priceViews) * 0.8; // 20% below min viewed
    const max = Math.max(...priceViews) * 1.2; // 20% above max viewed
    
    return { min, max };
  }

  private extractPreferredBrands(events: UserEvent[]): string[] {
    const brandCounts = new Map<string, number>();
    
    events.forEach(event => {
      if (event.event_type === 'car_viewed' && event.event_data.car_brand) {
        const brand = event.event_data.car_brand;
        brandCounts.set(brand, (brandCounts.get(brand) || 0) + 1);
      }
    });
    
    return Array.from(brandCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([brand]) => brand);
  }

  private extractPreferredFeatures(events: UserEvent[]): string[] {
    // Similar to brands but for features
    return [];
  }

  private extractLocation(events: UserEvent[]): string {
    // Extract location from events
    return 'Unknown';
  }

  private extractSearchHistory(events: UserEvent[]): string[] {
    return events
      .filter(e => e.event_type === 'search_performed')
      .map(e => e.event_data.search_query)
      .slice(0, 20);
  }

  private extractViewHistory(events: UserEvent[]): string[] {
    return events
      .filter(e => e.event_type === 'car_viewed')
      .map(e => e.event_data.car_id)
      .slice(0, 50);
  }

  private extractSavedCars(events: UserEvent[]): string[] {
    return events
      .filter(e => e.event_type === 'car_saved')
      .map(e => e.event_data.car_id);
  }

  private calculateBehaviorScore(events: UserEvent[]): number {
    let score = 0;
    
    events.forEach(event => {
      switch (event.event_type) {
        case 'car_viewed':
          score += 1;
          break;
        case 'car_saved':
          score += 5;
          break;
        case 'contact_dealer':
          score += 10;
          break;
        case 'search_performed':
          score += 2;
          break;
        default:
          score += 0.5;
      }
    });
    
    return Math.min(score, 1000); // Cap at 1000
  }

  private determineEngagementLevel(score: number): 'low' | 'medium' | 'high' {
    if (score < 50) return 'low';
    if (score < 200) return 'medium';
    return 'high';
  }

  private calculateAverageSessionLength(events: UserEvent[]): number {
    const sessionGroups = new Map<string, number[]>();
    
    events.forEach(event => {
      if (!sessionGroups.has(event.session_id)) {
        sessionGroups.set(event.session_id, []);
      }
      sessionGroups.get(event.session_id)!.push(new Date(event.timestamp).getTime());
    });
    
    const sessionLengths: number[] = [];
    
    sessionGroups.forEach(timestamps => {
      if (timestamps.length > 1) {
        const sessionLength = Math.max(...timestamps) - Math.min(...timestamps);
        sessionLengths.push(sessionLength);
      }
    });
    
    if (sessionLengths.length === 0) return 0;
    
    return sessionLengths.reduce((sum, length) => sum + length, 0) / sessionLengths.length;
  }

  public cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    // Sync any remaining events
    this.syncQueuedEvents();
    
    logger.debug('🧹 Advanced Analytics Service cleaned up');
  }
}

export default AdvancedAnalyticsService;
