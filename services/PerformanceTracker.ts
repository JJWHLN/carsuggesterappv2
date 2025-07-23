import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PerformanceMetric {
  id: string;
  type: 'navigation' | 'search' | 'api' | 'render' | 'interaction' | 'error';
  name: string;
  duration?: number;
  timestamp: string;
  userId?: string;
  metadata?: { [key: string]: any };
  screen?: string;
  action?: string;
  value?: number;
}

export interface UserInteraction {
  id: string;
  type: 'tap' | 'swipe' | 'scroll' | 'search' | 'filter' | 'bookmark' | 'compare';
  element: string;
  screen: string;
  timestamp: string;
  userId?: string;
  duration?: number;
  success: boolean;
  metadata?: { [key: string]: any };
}

export interface ErrorMetric {
  id: string;
  type: 'javascript' | 'network' | 'render' | 'navigation' | 'service';
  message: string;
  stack?: string;
  screen?: string;
  timestamp: string;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  metadata?: { [key: string]: any };
}

export interface PerformanceAnalytics {
  // App Performance
  averageStartupTime: number;
  averageNavigationTime: number;
  averageSearchTime: number;
  averageRenderTime: number;
  memoryUsage: {
    average: number;
    peak: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  };

  // User Engagement
  sessionDuration: {
    average: number;
    median: number;
    p95: number;
  };
  screenViews: { screen: string; count: number; averageDuration: number }[];
  userFlows: { flow: string; completionRate: number; dropOffPoint?: string }[];
  
  // Feature Usage
  searchMetrics: {
    totalSearches: number;
    averageResponseTime: number;
    successRate: number;
    popularQueries: string[];
    filterUsage: { [filter: string]: number };
  };
  bookmarkMetrics: {
    totalBookmarks: number;
    averageBookmarksPerUser: number;
    conversionRate: number;
    popularCars: string[];
  };
  comparisonMetrics: {
    totalComparisons: number;
    averageCarsPerComparison: number;
    conversionRate: number;
    popularComparisons: string[];
  };

  // Error Tracking
  errorRate: number;
  criticalErrors: number;
  topErrors: { message: string; count: number; lastSeen: string }[];
  errorTrends: { date: string; count: number }[];

  // Performance Trends
  performanceTrends: {
    date: string;
    startupTime: number;
    searchTime: number;
    navigationTime: number;
    errorCount: number;
  }[];
}

export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private metrics: PerformanceMetric[] = [];
  private interactions: UserInteraction[] = [];
  private errors: ErrorMetric[] = [];
  private sessionStartTime: number = Date.now();
  private isEnabled: boolean = true;
  private batchSize: number = 50;
  private maxStorageItems: number = 1000;

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  private constructor() {
    this.loadStoredData();
    this.setupGlobalErrorHandler();
    this.startPerformanceMonitoring();
  }

  private async loadStoredData(): Promise<void> {
    try {
      const [metricsData, interactionsData, errorsData] = await Promise.all([
        AsyncStorage.getItem('performance_metrics'),
        AsyncStorage.getItem('user_interactions'),
        AsyncStorage.getItem('error_metrics'),
      ]);

      if (metricsData) {
        this.metrics = JSON.parse(metricsData);
      }
      if (interactionsData) {
        this.interactions = JSON.parse(interactionsData);
      }
      if (errorsData) {
        this.errors = JSON.parse(errorsData);
      }

      // Clean old data (keep only last 7 days)
      this.cleanOldData();
    } catch (error) {
      console.warn('Failed to load performance data:', error);
    }
  }

  private async saveData(): Promise<void> {
    try {
      // Limit storage to prevent excessive growth
      const recentMetrics = this.metrics.slice(-this.maxStorageItems);
      const recentInteractions = this.interactions.slice(-this.maxStorageItems);
      const recentErrors = this.errors.slice(-this.maxStorageItems);

      await Promise.all([
        AsyncStorage.setItem('performance_metrics', JSON.stringify(recentMetrics)),
        AsyncStorage.setItem('user_interactions', JSON.stringify(recentInteractions)),
        AsyncStorage.setItem('error_metrics', JSON.stringify(recentErrors)),
      ]);
    } catch (error) {
      console.warn('Failed to save performance data:', error);
    }
  }

  private cleanOldData(): void {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    this.metrics = this.metrics.filter(m => 
      new Date(m.timestamp).getTime() > sevenDaysAgo
    );
    this.interactions = this.interactions.filter(i => 
      new Date(i.timestamp).getTime() > sevenDaysAgo
    );
    this.errors = this.errors.filter(e => 
      new Date(e.timestamp).getTime() > sevenDaysAgo
    );
  }

  private setupGlobalErrorHandler(): void {
    // Note: In a real React Native app, you'd use react-native-exception-handler
    // or similar library for comprehensive error tracking
    try {
      const globalAny = global as any;
      if (typeof globalAny !== 'undefined' && globalAny.ErrorUtils) {
        const originalHandler = globalAny.ErrorUtils.getGlobalHandler();
        
        globalAny.ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
          this.trackError({
            type: 'javascript',
            message: error?.message || 'Unknown error',
            stack: error?.stack,
            severity: isFatal ? 'critical' : 'high',
            metadata: { isFatal },
          });

          if (originalHandler) {
            originalHandler(error, isFatal);
          }
        });
      }
    } catch (setupError) {
      console.warn('Failed to setup global error handler:', setupError);
    }
  }

  private startPerformanceMonitoring(): void {
    // Monitor memory usage periodically
    setInterval(() => {
      if (this.isEnabled) {
        this.trackMetric({
          type: 'render',
          name: 'memory_check',
          value: this.getMemoryUsage(),
        });
      }
    }, 30000); // Every 30 seconds
  }

  private getMemoryUsage(): number {
    // In React Native, you'd use react-native-device-info or similar
    // For now, we'll simulate memory usage
    return Math.floor(Math.random() * 200) + 50; // Simulated MB usage
  }

  // Public API for tracking metrics
  
  trackMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    if (!this.isEnabled) return;

    const fullMetric: PerformanceMetric = {
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...metric,
    };

    this.metrics.push(fullMetric);
    
    // Save in batches to avoid excessive I/O
    if (this.metrics.length % this.batchSize === 0) {
      this.saveData();
    }
  }

  trackUserInteraction(interaction: Omit<UserInteraction, 'id' | 'timestamp'>): void {
    if (!this.isEnabled) return;

    const fullInteraction: UserInteraction = {
      id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...interaction,
    };

    this.interactions.push(fullInteraction);
    
    if (this.interactions.length % this.batchSize === 0) {
      this.saveData();
    }
  }

  trackError(error: Omit<ErrorMetric, 'id' | 'timestamp' | 'resolved'>): void {
    if (!this.isEnabled) return;

    const fullError: ErrorMetric = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      resolved: false,
      ...error,
    };

    this.errors.push(fullError);
    this.saveData(); // Save errors immediately
  }

  // Navigation tracking
  trackScreenView(screenName: string, previousScreen?: string): void {
    const now = Date.now();
    
    this.trackMetric({
      type: 'navigation',
      name: 'screen_view',
      screen: screenName,
      metadata: { previousScreen },
    });

    this.trackUserInteraction({
      type: 'tap',
      element: 'navigation',
      screen: screenName,
      success: true,
      metadata: { previousScreen },
    });
  }

  trackNavigationTiming(screenName: string, startTime: number): void {
    const duration = Date.now() - startTime;
    
    this.trackMetric({
      type: 'navigation',
      name: 'navigation_timing',
      duration,
      screen: screenName,
    });
  }

  // Search tracking
  trackSearchPerformance(query: string, resultCount: number, duration: number): void {
    this.trackMetric({
      type: 'search',
      name: 'search_performance',
      duration,
      metadata: { query, resultCount },
    });

    this.trackUserInteraction({
      type: 'search',
      element: 'search_bar',
      screen: 'search',
      success: resultCount > 0,
      duration,
      metadata: { query, resultCount },
    });
  }

  trackSearchFilter(filterType: string, filterValue: string, resultCount: number): void {
    this.trackUserInteraction({
      type: 'filter',
      element: `filter_${filterType}`,
      screen: 'search',
      success: true,
      metadata: { filterType, filterValue, resultCount },
    });
  }

  // Feature usage tracking
  trackBookmarkAction(action: 'add' | 'remove', carId: string): void {
    this.trackUserInteraction({
      type: 'bookmark',
      element: 'bookmark_button',
      screen: 'car_detail',
      success: true,
      metadata: { action, carId },
    });
  }

  trackComparison(carIds: string[], action: 'add' | 'remove' | 'compare'): void {
    this.trackUserInteraction({
      type: 'compare',
      element: 'comparison_tool',
      screen: 'comparison',
      success: true,
      metadata: { action, carIds, carCount: carIds.length },
    });
  }

  // API performance tracking
  trackApiCall(endpoint: string, method: string, duration: number, success: boolean): void {
    this.trackMetric({
      type: 'api',
      name: 'api_call',
      duration,
      metadata: { endpoint, method, success },
    });
  }

  // Render performance tracking
  trackRenderTime(componentName: string, duration: number): void {
    this.trackMetric({
      type: 'render',
      name: 'render_time',
      duration,
      metadata: { componentName },
    });
  }

  // Analytics and reporting
  async getAnalytics(): Promise<PerformanceAnalytics> {
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    // Recent metrics for calculations
    const recentMetrics = this.metrics.filter(m => 
      new Date(m.timestamp).getTime() > oneWeekAgo
    );
    const recentInteractions = this.interactions.filter(i => 
      new Date(i.timestamp).getTime() > oneWeekAgo
    );
    const recentErrors = this.errors.filter(e => 
      new Date(e.timestamp).getTime() > oneWeekAgo
    );

    // App Performance
    const navigationMetrics = recentMetrics.filter(m => m.type === 'navigation' && m.duration);
    const searchMetrics = recentMetrics.filter(m => m.type === 'search' && m.duration);
    const renderMetrics = recentMetrics.filter(m => m.type === 'render' && m.duration);

    const averageNavigationTime = navigationMetrics.length > 0 
      ? navigationMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / navigationMetrics.length
      : 0;

    const averageSearchTime = searchMetrics.length > 0 
      ? searchMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / searchMetrics.length
      : 0;

    const averageRenderTime = renderMetrics.length > 0 
      ? renderMetrics.reduce((sum, m) => sum + (m.duration || 0), 0) / renderMetrics.length
      : 0;

    // Memory usage
    const memoryMetrics = recentMetrics
      .filter(m => m.name === 'memory_check' && m.value)
      .map(m => m.value!);
    
    const memoryUsage = {
      average: memoryMetrics.length > 0 
        ? memoryMetrics.reduce((sum, val) => sum + val, 0) / memoryMetrics.length 
        : 0,
      peak: memoryMetrics.length > 0 ? Math.max(...memoryMetrics) : 0,
      trend: 'stable' as const, // Would calculate actual trend
    };

    // User Engagement
    const sessions = this.calculateSessions(recentInteractions);
    const sessionDurations = sessions.map(s => s.duration);
    
    const sessionDuration = {
      average: sessionDurations.length > 0 
        ? sessionDurations.reduce((sum, d) => sum + d, 0) / sessionDurations.length 
        : 0,
      median: this.calculateMedian(sessionDurations),
      p95: this.calculatePercentile(sessionDurations, 95),
    };

    // Screen views
    const screenViewCounts: { [screen: string]: { count: number; totalDuration: number } } = {};
    recentInteractions
      .filter(i => i.type === 'tap' && i.element === 'navigation')
      .forEach(i => {
        if (!screenViewCounts[i.screen]) {
          screenViewCounts[i.screen] = { count: 0, totalDuration: 0 };
        }
        screenViewCounts[i.screen].count++;
        screenViewCounts[i.screen].totalDuration += i.duration || 0;
      });

    const screenViews = Object.entries(screenViewCounts).map(([screen, data]) => ({
      screen,
      count: data.count,
      averageDuration: data.count > 0 ? data.totalDuration / data.count : 0,
    }));

    // Search metrics
    const searchInteractions = recentInteractions.filter(i => i.type === 'search');
    const searchSuccess = searchInteractions.filter(i => i.success);
    
    const searchQueries = searchInteractions
      .map(i => i.metadata?.query)
      .filter(Boolean) as string[];
    
    const queryCount: { [query: string]: number } = {};
    searchQueries.forEach(query => {
      queryCount[query] = (queryCount[query] || 0) + 1;
    });
    
    const popularQueries = Object.entries(queryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([query]) => query);

    // Filter usage
    const filterInteractions = recentInteractions.filter(i => i.type === 'filter');
    const filterUsage: { [filter: string]: number } = {};
    filterInteractions.forEach(i => {
      const filterType = i.metadata?.filterType;
      if (filterType) {
        filterUsage[filterType] = (filterUsage[filterType] || 0) + 1;
      }
    });

    // Bookmark metrics
    const bookmarkInteractions = recentInteractions.filter(i => i.type === 'bookmark');
    const bookmarkAdds = bookmarkInteractions.filter(i => i.metadata?.action === 'add');

    // Comparison metrics
    const comparisonInteractions = recentInteractions.filter(i => i.type === 'compare');
    const comparisonCounts = comparisonInteractions
      .map(i => i.metadata?.carCount || 0)
      .filter(count => count > 0);

    // Error metrics
    const totalInteractions = recentInteractions.length;
    const errorRate = totalInteractions > 0 ? (recentErrors.length / totalInteractions) * 100 : 0;
    const criticalErrors = recentErrors.filter(e => e.severity === 'critical').length;

    // Top errors
    const errorCounts: { [message: string]: { count: number; lastSeen: string } } = {};
    recentErrors.forEach(error => {
      if (!errorCounts[error.message]) {
        errorCounts[error.message] = { count: 0, lastSeen: error.timestamp };
      }
      errorCounts[error.message].count++;
      if (new Date(error.timestamp) > new Date(errorCounts[error.message].lastSeen)) {
        errorCounts[error.message].lastSeen = error.timestamp;
      }
    });

    const topErrors = Object.entries(errorCounts)
      .sort(([,a], [,b]) => b.count - a.count)
      .slice(0, 10)
      .map(([message, data]) => ({
        message,
        count: data.count,
        lastSeen: data.lastSeen,
      }));

    // Performance trends (last 7 days)
    const performanceTrends = this.calculatePerformanceTrends(recentMetrics, recentErrors);

    return {
      averageStartupTime: 1200, // Would track actual startup time
      averageNavigationTime,
      averageSearchTime,
      averageRenderTime,
      memoryUsage,
      sessionDuration,
      screenViews,
      userFlows: [], // Would implement flow analysis
      searchMetrics: {
        totalSearches: searchInteractions.length,
        averageResponseTime: averageSearchTime,
        successRate: searchInteractions.length > 0 
          ? (searchSuccess.length / searchInteractions.length) * 100 
          : 0,
        popularQueries,
        filterUsage,
      },
      bookmarkMetrics: {
        totalBookmarks: bookmarkAdds.length,
        averageBookmarksPerUser: 3.5, // Would calculate from user data
        conversionRate: 15.8, // Would calculate actual conversion
        popularCars: [], // Would extract from bookmark data
      },
      comparisonMetrics: {
        totalComparisons: comparisonInteractions.length,
        averageCarsPerComparison: comparisonCounts.length > 0 
          ? comparisonCounts.reduce((sum, count) => sum + count, 0) / comparisonCounts.length 
          : 0,
        conversionRate: 22.3, // Would calculate actual conversion
        popularComparisons: [], // Would extract from comparison data
      },
      errorRate,
      criticalErrors,
      topErrors,
      errorTrends: [], // Would implement error trend calculation
      performanceTrends,
    };
  }

  private calculateSessions(interactions: UserInteraction[]): { duration: number }[] {
    // Simple session calculation - gap of more than 30 minutes starts new session
    const sessionGap = 30 * 60 * 1000; // 30 minutes
    const sessions: { start: number; end: number; duration: number }[] = [];
    
    const sortedInteractions = interactions
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    if (sortedInteractions.length === 0) {
      return [];
    }

    let sessionStart = new Date(sortedInteractions[0].timestamp).getTime();
    let sessionEnd = sessionStart;

    for (let i = 1; i < sortedInteractions.length; i++) {
      const currentTime = new Date(sortedInteractions[i].timestamp).getTime();
      
      if (currentTime - sessionEnd > sessionGap) {
        // End current session and add to sessions array
        sessions.push({
          start: sessionStart,
          end: sessionEnd,
          duration: sessionEnd - sessionStart,
        });
        
        // Start new session
        sessionStart = currentTime;
        sessionEnd = currentTime;
      } else {
        // Continue current session
        sessionEnd = currentTime;
      }
    }

    // Add the final session
    sessions.push({
      start: sessionStart,
      end: sessionEnd,
      duration: sessionEnd - sessionStart,
    });

    return sessions;
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  private calculatePerformanceTrends(
    metrics: PerformanceMetric[], 
    errors: ErrorMetric[]
  ): PerformanceAnalytics['performanceTrends'] {
    const trends: { [date: string]: {
      startupTime: number[];
      searchTime: number[];
      navigationTime: number[];
      errorCount: number;
    } } = {};

    // Group metrics by date
    metrics.forEach(metric => {
      const date = metric.timestamp.split('T')[0];
      if (!trends[date]) {
        trends[date] = {
          startupTime: [],
          searchTime: [],
          navigationTime: [],
          errorCount: 0,
        };
      }

      if (metric.type === 'navigation' && metric.duration) {
        trends[date].navigationTime.push(metric.duration);
      } else if (metric.type === 'search' && metric.duration) {
        trends[date].searchTime.push(metric.duration);
      }
    });

    // Count errors by date
    errors.forEach(error => {
      const date = error.timestamp.split('T')[0];
      if (trends[date]) {
        trends[date].errorCount++;
      }
    });

    return Object.entries(trends).map(([date, data]) => ({
      date,
      startupTime: 1200, // Would calculate actual startup time
      searchTime: data.searchTime.length > 0 
        ? data.searchTime.reduce((sum, time) => sum + time, 0) / data.searchTime.length 
        : 0,
      navigationTime: data.navigationTime.length > 0 
        ? data.navigationTime.reduce((sum, time) => sum + time, 0) / data.navigationTime.length 
        : 0,
      errorCount: data.errorCount,
    }));
  }

  // Configuration methods
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  setBatchSize(size: number): void {
    this.batchSize = Math.max(1, Math.min(size, 100));
  }

  // Data export for analytics
  async exportData(): Promise<{
    metrics: PerformanceMetric[];
    interactions: UserInteraction[];
    errors: ErrorMetric[];
  }> {
    return {
      metrics: [...this.metrics],
      interactions: [...this.interactions],
      errors: [...this.errors],
    };
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    this.metrics = [];
    this.interactions = [];
    this.errors = [];
    await AsyncStorage.multiRemove([
      'performance_metrics',
      'user_interactions',
      'error_metrics',
    ]);
  }
}

export default PerformanceTracker;
