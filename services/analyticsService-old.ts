/**
 * Analytics Service for tracking user interactions and app performance
 * In production, this would integrate with services like Firebase Analytics, 
 * Amplitude, or Mixpanel
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'bytes' | 'count' | 'percentage';
  timestamp: Date;
  metadata?: Record<string, any>;
}

class AnalyticsService {
  private static instance: AnalyticsService;
  private sessionId: string;
  private events: AnalyticsEvent[] = [];
  private metrics: PerformanceMetric[] = [];
  private userId?: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeSession();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeSession(): void {
    this.track('session_started', {
      platform: 'react-native',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Set the current user ID for analytics tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
    this.track('user_identified', { userId });
  }

  /**
   * Track an analytics event
   */
  track(eventName: string, properties?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: new Date(),
      userId: this.userId,
      sessionId: this.sessionId,
    };

    this.events.push(event);
    
    // Log for development - in production, send to analytics service
    console.log('📊 Analytics Event:', event);

    // Batch send events to prevent performance issues
    if (this.events.length >= 10) {
      this.flushEvents();
    }
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metricName: string, value: number, unit: PerformanceMetric['unit'], metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name: metricName,
      value,
      unit,
      timestamp: new Date(),
      metadata,
    };

    this.metrics.push(metric);
    
    console.log('⚡ Performance Metric:', metric);

    // Batch send metrics
    if (this.metrics.length >= 5) {
      this.flushMetrics();
    }
  }

  /**
   * Track screen views
   */
  trackScreenView(screenName: string, properties?: Record<string, any>): void {
    this.track('screen_view', {
      screen_name: screenName,
      ...properties,
    });
  }

  /**
   * Track user actions
   */
  trackUserAction(action: string, target: string, properties?: Record<string, any>): void {
    this.track('user_action', {
      action,
      target,
      ...properties,
    });
  }

  /**
   * Track search queries
   */
  trackSearch(query: string, results: number, searchType: 'basic' | 'ai' = 'basic'): void {
    this.track('search_performed', {
      query,
      results_count: results,
      search_type: searchType,
      query_length: query.length,
    });
  }

  /**
   * Track car interactions
   */
  trackCarInteraction(action: 'view' | 'save' | 'share' | 'contact', carId: string, carDetails?: Record<string, any>): void {
    this.track('car_interaction', {
      action,
      car_id: carId,
      ...carDetails,
    });
  }

  /**
   * Track errors and crashes
   */
  trackError(error: Error, context?: Record<string, any>): void {
    this.track('error_occurred', {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      context,
    });
  }

  /**
   * Track loading times
   */
  trackLoadingTime(component: string, duration: number): void {
    this.trackPerformance(`${component}_load_time`, duration, 'ms', {
      component,
    });
  }

  /**
   * Track app launch time
   */
  trackAppLaunch(duration: number): void {
    this.trackPerformance('app_launch_time', duration, 'ms');
  }

  /**
   * Track API response times
   */
  trackApiCall(endpoint: string, duration: number, success: boolean, statusCode?: number): void {
    this.track('api_call', {
      endpoint,
      duration,
      success,
      status_code: statusCode,
    });

    this.trackPerformance(`api_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}_duration`, duration, 'ms', {
      endpoint,
      success,
      status_code: statusCode,
    });
  }

  /**
   * Advanced crash reporting with context
   */
  reportCrash(error: Error, context?: Record<string, any>): void {
    const crashReport = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context: {
        ...context,
        userId: this.userId,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        appVersion: '1.0.0', // This should come from app config
        platform: 'react-native',
        userAgent: navigator.userAgent || 'unknown',
      },
      breadcrumbs: this.getBreadcrumbs(),
      userJourney: this.getUserJourney(),
      deviceInfo: this.getDeviceInfo(),
    };

    // In production, send to crash reporting service (Sentry, Bugsnag, etc.)
    console.error('💥 Crash Report:', crashReport);
    
    // Store locally for retry mechanism
    this.storeCrashReport(crashReport);
    
    // Track crash event
    this.track('app_crashed', {
      error_type: error.name,
      error_message: error.message,
      has_context: !!context,
      breadcrumb_count: this.getBreadcrumbs().length,
    });
  }

  /**
   * Track user journey and conversion funnels
   */
  trackUserJourney(step: string, funnel: string, metadata?: Record<string, any>): void {
    const journeyEvent = {
      funnel,
      step,
      step_index: this.getStepIndex(funnel, step),
      timestamp: new Date().toISOString(),
      time_since_start: this.getTimeSinceFunnelStart(funnel),
      metadata,
    };

    this.track('user_journey_step', journeyEvent);
    this.storeFunnelStep(funnel, step, journeyEvent);
  }

  /**
   * Track conversion events with revenue data
   */
  trackConversion(event: string, revenue?: number, currency: string = 'USD', metadata?: Record<string, any>): void {
    this.track('conversion', {
      conversion_event: event,
      revenue,
      currency,
      ...metadata,
    });

    // Track in separate revenue stream
    if (revenue) {
      this.trackRevenue(revenue, currency, event, metadata);
    }
  }

  /**
   * Track feature usage and adoption
   */
  trackFeatureUsage(feature: string, action: string, metadata?: Record<string, any>): void {
    this.track('feature_usage', {
      feature,
      action,
      first_time_use: this.isFirstTimeFeatureUse(feature),
      ...metadata,
    });

    this.updateFeatureUsageStats(feature, action);
  }

  /**
   * Track search behavior and results
   */
  trackSearchBehavior(query: string, results: any[], filters?: Record<string, any>): void {
    this.track('search_performed', {
      query,
      query_length: query.length,
      results_count: results.length,
      has_filters: !!filters && Object.keys(filters).length > 0,
      filters,
      search_type: this.classifySearchType(query),
    });

    // Track search result interactions
    this.startSearchResultsTracking(query, results);
  }

  /**
   * Track A/B test variants and outcomes
   */
  trackABTest(testName: string, variant: string, outcome?: string): void {
    this.track('ab_test_exposure', {
      test_name: testName,
      variant,
      outcome,
    });

    // Store for later analysis
    this.storeABTestData(testName, variant, outcome);
  }

  /**
   * Track business metrics
   */
  trackBusinessMetric(metric: string, value: number, unit: string, metadata?: Record<string, any>): void {
    this.track('business_metric', {
      metric_name: metric,
      metric_value: value,
      metric_unit: unit,
      ...metadata,
    });

    this.trackPerformance(metric, value, unit as any, metadata);
  }

  /**
   * Send events to analytics service (mock implementation)
   */
  private async flushEvents(): Promise<void> {
    if (this.events.length === 0) return;

    try {
      // In production, this would send to your analytics service
      // await analyticsAPI.sendEvents(this.events);
      
      console.log(`📤 Flushing ${this.events.length} analytics events`);
      
      // Clear events after successful send
      this.events = [];
    } catch (error) {
      console.error('Failed to send analytics events:', error);
    }
  }

  /**
   * Send metrics to performance monitoring service (mock implementation)
   */
  private async flushMetrics(): Promise<void> {
    if (this.metrics.length === 0) return;

    try {
      // In production, this would send to your performance monitoring service
      // await performanceAPI.sendMetrics(this.metrics);
      
      console.log(`📤 Flushing ${this.metrics.length} performance metrics`);
      
      // Clear metrics after successful send
      this.metrics = [];
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
    }
  }

  /**
   * Manually flush all pending events and metrics
   */
  async flush(): Promise<void> {
    await Promise.all([
      this.flushEvents(),
      this.flushMetrics(),
    ]);
  }

  /**
   * Get analytics summary for debugging
   */
  getSummary(): { eventsCount: number; metricsCount: number; sessionId: string; userId?: string } {
    return {
      eventsCount: this.events.length,
      metricsCount: this.metrics.length,
      sessionId: this.sessionId,
      userId: this.userId,
    };
  }

  /**
   * Get user breadcrumbs for crash context
   */
  private getBreadcrumbs(): Array<{ action: string; timestamp: string; metadata?: any }> {
    return this.events
      .slice(-20) // Last 20 events
      .map(event => ({
        action: event.name,
        timestamp: event.timestamp.toISOString(),
        metadata: event.properties,
      }));
  }

  /**
   * Get user journey for crash context
   */
  private getUserJourney(): Array<{ screen: string; duration: number; timestamp: string }> {
    const screenEvents = this.events.filter(e => e.name === 'screen_viewed');
    const journey = [];
    
    for (let i = 0; i < screenEvents.length; i++) {
      const current = screenEvents[i];
      const next = screenEvents[i + 1];
      
      journey.push({
        screen: current.properties?.screen_name || 'unknown',
        duration: next ? next.timestamp.getTime() - current.timestamp.getTime() : 0,
        timestamp: current.timestamp.toISOString(),
      });
    }
    
    return journey.slice(-10); // Last 10 screens
  }

  /**
   * Get device information for debugging
   */
  private getDeviceInfo(): Record<string, any> {
    return {
      // This would be populated with actual device info in a real app
      platform: 'react-native',
      app_version: '1.0.0',
      build_number: '1',
      device_id: 'simulated',
      memory_usage: this.getMemoryUsage(),
      network_type: 'wifi', // Would get actual network type
    };
  }

  /**
   * Store crash report locally for retry
   */
  private storeCrashReport(crashReport: any): void {
    try {
      const crashReports = JSON.parse(localStorage.getItem('crash_reports') || '[]');
      crashReports.push(crashReport);
      
      // Keep only last 10 crash reports
      if (crashReports.length > 10) {
        crashReports.splice(0, crashReports.length - 10);
      }
      
      localStorage.setItem('crash_reports', JSON.stringify(crashReports));
    } catch (error) {
      console.warn('Failed to store crash report locally:', error);
    }
  }

  /**
   * Track funnel steps and conversion rates
   */
  private storeFunnelStep(funnel: string, step: string, data: any): void {
    const funnelKey = `funnel_${funnel}`;
    const existingData = JSON.parse(localStorage.getItem(funnelKey) || '[]');
    existingData.push(data);
    localStorage.setItem(funnelKey, JSON.stringify(existingData));
  }

  /**
   * Get step index in funnel
   */
  private getStepIndex(funnel: string, step: string): number {
    const funnelDefinitions: Record<string, string[]> = {
      'vehicle_purchase': ['search', 'view_listing', 'contact_dealer', 'schedule_test_drive', 'purchase'],
      'user_onboarding': ['sign_up', 'verify_email', 'complete_profile', 'first_search'],
      'listing_creation': ['start_listing', 'add_photos', 'add_details', 'submit_listing'],
    };

    const steps = funnelDefinitions[funnel] || [];
    return steps.indexOf(step);
  }

  /**
   * Get time since funnel started
   */
  private getTimeSinceFunnelStart(funnel: string): number {
    const funnelKey = `funnel_${funnel}`;
    const funnelData = JSON.parse(localStorage.getItem(funnelKey) || '[]');
    
    if (funnelData.length === 0) return 0;
    
    const firstStep = funnelData[0];
    return Date.now() - new Date(firstStep.timestamp).getTime();
  }

  /**
   * Track revenue separately
   */
  private trackRevenue(amount: number, currency: string, event: string, metadata?: Record<string, any>): void {
    this.track('revenue', {
      amount,
      currency,
      revenue_event: event,
      ...metadata,
    });
  }

  /**
   * Check if this is first time using a feature
   */
  private isFirstTimeFeatureUse(feature: string): boolean {
    const usageKey = `feature_${feature}_used`;
    const hasUsed = localStorage.getItem(usageKey);
    
    if (!hasUsed) {
      localStorage.setItem(usageKey, 'true');
      return true;
    }
    
    return false;
  }

  /**
   * Update feature usage statistics
   */
  private updateFeatureUsageStats(feature: string, action: string): void {
    const statsKey = `feature_stats_${feature}`;
    const stats = JSON.parse(localStorage.getItem(statsKey) || '{}');
    
    stats[action] = (stats[action] || 0) + 1;
    stats.total_uses = (stats.total_uses || 0) + 1;
    stats.last_used = new Date().toISOString();
    
    localStorage.setItem(statsKey, JSON.stringify(stats));
  }

  /**
   * Classify search type for analytics
   */
  private classifySearchType(query: string): string {
    const lowerQuery = query.toLowerCase();
    
    if (/\b(honda|toyota|ford|chevrolet|bmw|mercedes|audi)\b/.test(lowerQuery)) {
      return 'brand_search';
    }
    
    if (/\b(suv|sedan|truck|coupe|convertible|hatchback)\b/.test(lowerQuery)) {
      return 'body_type_search';
    }
    
    if (/\$|under|over|budget|price/.test(lowerQuery)) {
      return 'price_search';
    }
    
    if (/\b(reliable|family|luxury|sporty|fuel|efficient)\b/.test(lowerQuery)) {
      return 'feature_search';
    }
    
    return 'general_search';
  }

  /**
   * Start tracking interactions with search results
   */
  private startSearchResultsTracking(query: string, results: any[]): void {
    const searchId = `search_${Date.now()}`;
    
    // Track which results were viewed
    setTimeout(() => {
      this.track('search_results_interaction', {
        search_id: searchId,
        query,
        results_shown: results.length,
        interaction_type: 'view',
      });
    }, 1000);
  }

  /**
   * Store A/B test data for analysis
   */
  private storeABTestData(testName: string, variant: string, outcome?: string): void {
    const testKey = `ab_test_${testName}`;
    const testData = JSON.parse(localStorage.getItem(testKey) || '{}');
    
    testData.variant = variant;
    testData.exposure_time = new Date().toISOString();
    
    if (outcome) {
      testData.outcome = outcome;
      testData.conversion_time = new Date().toISOString();
    }
    
    localStorage.setItem(testKey, JSON.stringify(testData));
  }

  /**
   * Get current memory usage (simplified)
   */
  private getMemoryUsage(): any {
    // In a real React Native app, you'd use a native module
    return {
      used: 'unknown',
      total: 'unknown',
      available: 'unknown',
    };
  }
}

// Export singleton instance
export const Analytics = AnalyticsService.getInstance();

// Export the service instance for direct use
export { AnalyticsService };

// Convenience functions for common tracking patterns
export const trackScreenView = (screenName: string, properties?: Record<string, any>) => {
  Analytics.trackScreenView(screenName, properties);
};

export const trackUserAction = (action: string, target: string, properties?: Record<string, any>) => {
  Analytics.trackUserAction(action, target, properties);
};

export const trackSearch = (query: string, results: number, searchType: 'basic' | 'ai' = 'basic') => {
  Analytics.trackSearch(query, results, searchType);
};

export const trackCarInteraction = (action: 'view' | 'save' | 'share' | 'contact', carId: string, carDetails?: Record<string, any>) => {
  Analytics.trackCarInteraction(action, carId, carDetails);
};

export const trackError = (error: Error, context?: Record<string, any>) => {
  Analytics.trackError(error, context);
};

export const trackLoadingTime = (component: string, duration: number) => {
  Analytics.trackLoadingTime(component, duration);
};

export const trackApiCall = (endpoint: string, duration: number, success: boolean, statusCode?: number) => {
  Analytics.trackApiCall(endpoint, duration, success, statusCode);
};
