import { BaseService } from './BaseService';

/**
 * Enhanced Analytics Service with consolidated patterns and better error handling
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

interface AnalyticsConfig {
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  enabled: boolean;
  development: boolean;
}

class AnalyticsService extends BaseService {
  private static instance: AnalyticsService;
  private currentUserId: string | null = null;
  private sessionId: string;
  private eventQueue: AnalyticsEvent[] = [];
  private config: AnalyticsConfig;
  private flushTimer: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.sessionId = this.generateSessionId();
    this.config = {
      batchSize: 20,
      flushInterval: 30000, // 30 seconds
      maxRetries: 3,
      enabled: true,
      development: __DEV__ || false,
    };
    this.startFlushTimer();
  }

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Set the current user ID for analytics tracking
   */
  setUserId(userId: string): void {
    this.currentUserId = userId;
  }

  /**
   * Clear user ID (for logout)
   */
  clearUserId(): void {
    this.currentUserId = null;
  }

  /**
   * Update analytics configuration
   */
  configure(config: Partial<AnalyticsConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Restart flush timer if interval changed
    if (config.flushInterval) {
      this.stopFlushTimer();
      this.startFlushTimer();
    }
  }

  /**
   * Track an analytics event
   */
  track(eventName: string, properties?: Record<string, any>): void {
    if (!this.config.enabled) return;

    const event: AnalyticsEvent = {
      name: eventName,
      properties: this.sanitizeProperties(properties),
      timestamp: new Date(),
      userId: this.currentUserId,
      sessionId: this.sessionId,
    };

    this.addToQueue(event);
    
    if (this.config.development) {
      console.log('🎯 Analytics Event:', event);
    }
  }

  /**
   * Track performance metrics
   */
  trackPerformance(
    metricName: string,
    value: number,
    unit: PerformanceMetric['unit'],
    metadata?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name: metricName,
      value,
      unit,
      timestamp: new Date(),
      metadata: this.sanitizeProperties(metadata),
    };

    this.track('performance_metric', {
      metric_name: metricName,
      metric_value: value,
      metric_unit: unit,
      ...metadata,
    });
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
   * Track user actions with consistent naming
   */
  trackUserAction(
    action: string,
    target: string,
    properties?: Record<string, any>
  ): void {
    this.track('user_action', {
      action,
      target,
      ...properties,
    });
  }

  /**
   * Track search events
   */
  trackSearch(
    query: string,
    results: number,
    searchType: 'basic' | 'ai' = 'basic',
    properties?: Record<string, any>
  ): void {
    this.track('search', {
      query: this.sanitizeSearchQuery(query),
      results_count: results,
      search_type: searchType,
      has_results: results > 0,
      ...properties,
    });
  }

  /**
   * Track car interactions
   */
  trackCarInteraction(
    action: 'view' | 'save' | 'share' | 'contact',
    carId: string,
    carDetails?: Record<string, any>
  ): void {
    this.track('car_interaction', {
      action,
      car_id: carId,
      ...carDetails,
    });
  }

  /**
   * Track errors with context
   */
  trackError(error: Error, context?: Record<string, any>): void {
    this.track('error', {
      error_name: error.name,
      error_message: error.message,
      error_stack: error.stack,
      ...context,
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
   * Track API calls
   */
  trackApiCall(
    endpoint: string,
    duration: number,
    success: boolean,
    statusCode?: number
  ): void {
    this.track('api_call', {
      endpoint,
      duration,
      success,
      status_code: statusCode,
    });
  }

  /**
   * Track business metrics
   */
  trackBusinessMetric(
    metric: string,
    value: number,
    properties?: Record<string, any>
  ): void {
    this.track('business_metric', {
      metric,
      value,
      ...properties,
    });
  }

  /**
   * Track funnel steps
   */
  trackFunnelStep(
    funnel: string,
    step: string,
    completed: boolean,
    properties?: Record<string, any>
  ): void {
    this.track('funnel_step', {
      funnel,
      step,
      completed,
      ...properties,
    });
  }

  /**
   * Sanitize properties to remove sensitive data
   */
  private sanitizeProperties(properties?: Record<string, any>): Record<string, any> | undefined {
    if (!properties) return undefined;

    const sanitized = { ...properties };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'email', 'phone'];
    
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Sanitize search queries
   */
  private sanitizeSearchQuery(query: string): string {
    // Remove potential PII from search queries
    return query.replace(/\b\d{3}-\d{3}-\d{4}\b/g, '[PHONE]')
                .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
  }

  /**
   * Add event to queue
   */
  private addToQueue(event: AnalyticsEvent): void {
    this.eventQueue.push(event);
    
    // Flush if queue is full
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush events to analytics provider
   */
  private async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await this.sendEvents(events);
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      // Re-queue events for retry (with limit)
      if (this.eventQueue.length < this.config.batchSize * 2) {
        this.eventQueue.unshift(...events);
      }
    }
  }

  /**
   * Send events to analytics provider
   */
  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    // In a real implementation, this would send to Firebase Analytics, Mixpanel, etc.
    if (this.config.development) {
      console.log('📊 Sending analytics events:', events);
    }
    
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * Start the flush timer
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  /**
   * Stop the flush timer
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Get analytics stats
   */
  getStats(): {
    queueSize: number;
    sessionId: string;
    userId: string | null;
    config: AnalyticsConfig;
  } {
    return {
      queueSize: this.eventQueue.length,
      sessionId: this.sessionId,
      userId: this.currentUserId,
      config: this.config,
    };
  }

  /**
   * Manually flush events
   */
  async forceFlush(): Promise<void> {
    await this.flush();
  }

  /**
   * Destroy the analytics instance
   */
  destroy(): void {
    this.stopFlushTimer();
    this.flush();
  }
}

// Export singleton instance
export const Analytics = AnalyticsService.getInstance();

// Export the service class
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

export const trackCarInteraction = (
  action: 'view' | 'save' | 'share' | 'contact',
  carId: string,
  carDetails?: Record<string, any>
) => {
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

export const trackBusinessMetric = (metric: string, value: number, properties?: Record<string, any>) => {
  Analytics.trackBusinessMetric(metric, value, properties);
};

export const trackFunnelStep = (funnel: string, step: string, completed: boolean, properties?: Record<string, any>) => {
  Analytics.trackFunnelStep(funnel, step, completed, properties);
};

export default Analytics;
