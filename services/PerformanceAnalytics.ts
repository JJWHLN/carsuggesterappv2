import AsyncStorage from '@react-native-async-storage/async-storage';

// Comprehensive Performance Analytics Service for Phase B
export interface PerformanceMetrics {
  screenLoadTimes: Record<string, number[]>;
  apiResponseTimes: Record<string, number[]>;
  userInteractions: {
    screenTime: Record<string, number>;
    buttonClicks: Record<string, number>;
    searchQueries: number;
    carViews: number;
    comparisons: number;
  };
  errors: {
    count: number;
    types: Record<string, number>;
    recent: Array<{
      type: string;
      message: string;
      timestamp: number;
      stack?: string;
    }>;
  };
  performance: {
    memoryUsage: number[];
    batteryImpact: number[];
    networkUsage: Array<{
      endpoint: string;
      responseTime: number;
      size: number;
      timestamp: number;
    }>;
  };
  insights: {
    popularScreens: Array<{ screen: string; visits: number; totalTime: number }>;
    slowestAPIs: Array<{ endpoint: string; avgTime: number; calls: number }>;
    errorHotspots: Array<{ type: string; count: number; trend: 'increasing' | 'decreasing' | 'stable' }>;
    userBehaviorPatterns: Array<{
      pattern: string;
      frequency: number;
      description: string;
    }>;
  };
  lastUpdated: number;
}

export interface PerformanceAlert {
  id: string;
  type: 'performance' | 'error' | 'usage' | 'memory';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  timestamp: number;
  resolved: boolean;
  data?: Record<string, any>;
}

export interface PerformanceConfig {
  enableTracking: boolean;
  trackScreenTime: boolean;
  trackApiCalls: boolean;
  trackUserInteractions: boolean;
  alertThresholds: {
    slowScreenLoadMs: number;
    slowApiResponseMs: number;
    highMemoryUsageMB: number;
    errorRatePercent: number;
  };
  dataRetentionDays: number;
  enableDetailedLogging: boolean;
}

class PerformanceAnalyticsService {
  private static instance: PerformanceAnalyticsService;
  private metrics: PerformanceMetrics;
  private alerts: PerformanceAlert[] = [];
  private config: PerformanceConfig;
  private activeTimers: Map<string, number> = new Map();
  private screenStartTime: number = 0;
  private currentScreen: string = '';
  private isInitialized = false;

  private constructor() {
    this.config = {
      enableTracking: true,
      trackScreenTime: true,
      trackApiCalls: true,
      trackUserInteractions: true,
      alertThresholds: {
        slowScreenLoadMs: 2000,
        slowApiResponseMs: 3000,
        highMemoryUsageMB: 100,
        errorRatePercent: 5,
      },
      dataRetentionDays: 30,
      enableDetailedLogging: false,
    };

    this.metrics = {
      screenLoadTimes: {},
      apiResponseTimes: {},
      userInteractions: {
        screenTime: {},
        buttonClicks: {},
        searchQueries: 0,
        carViews: 0,
        comparisons: 0,
      },
      errors: {
        count: 0,
        types: {},
        recent: [],
      },
      performance: {
        memoryUsage: [],
        batteryImpact: [],
        networkUsage: [],
      },
      insights: {
        popularScreens: [],
        slowestAPIs: [],
        errorHotspots: [],
        userBehaviorPatterns: [],
      },
      lastUpdated: Date.now(),
    };
  }

  public static getInstance(): PerformanceAnalyticsService {
    if (!PerformanceAnalyticsService.instance) {
      PerformanceAnalyticsService.instance = new PerformanceAnalyticsService();
    }
    return PerformanceAnalyticsService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Promise.all([
        this.loadMetrics(),
        this.loadConfig(),
        this.loadAlerts(),
      ]);

      this.startBackgroundAnalysis();
      this.isInitialized = true;

      console.log('Performance Analytics Service initialized');
    } catch (error) {
      console.error('Failed to initialize Performance Analytics:', error);
    }
  }

  // Screen Performance Tracking
  public startScreenTimer(screenName: string): void {
    if (!this.config.enableTracking || !this.config.trackScreenTime) return;

    this.currentScreen = screenName;
    this.screenStartTime = Date.now();
    this.activeTimers.set(`screen_${screenName}`, Date.now());
  }

  public endScreenTimer(screenName: string): number {
    if (!this.config.enableTracking || !this.config.trackScreenTime) return 0;

    const startTime = this.activeTimers.get(`screen_${screenName}`);
    if (!startTime) return 0;

    const loadTime = Date.now() - startTime;
    this.activeTimers.delete(`screen_${screenName}`);

    // Record screen load time
    if (!this.metrics.screenLoadTimes[screenName]) {
      this.metrics.screenLoadTimes[screenName] = [];
    }
    this.metrics.screenLoadTimes[screenName].push(loadTime);

    // Check for slow screen loads
    if (loadTime > this.config.alertThresholds.slowScreenLoadMs) {
      this.createAlert('performance', 'medium', 
        `Slow Screen Load: ${screenName}`,
        `Screen took ${loadTime}ms to load (threshold: ${this.config.alertThresholds.slowScreenLoadMs}ms)`,
        { screenName, loadTime }
      );
    }

    this.saveMetrics();
    return loadTime;
  }

  public recordScreenTime(screenName: string, timeSpent: number): void {
    if (!this.config.enableTracking || !this.config.trackScreenTime) return;

    if (!this.metrics.userInteractions.screenTime[screenName]) {
      this.metrics.userInteractions.screenTime[screenName] = 0;
    }
    this.metrics.userInteractions.screenTime[screenName] += timeSpent;
    this.saveMetrics();
  }

  // API Performance Tracking
  public startApiTimer(endpoint: string): void {
    if (!this.config.enableTracking || !this.config.trackApiCalls) return;
    this.activeTimers.set(`api_${endpoint}`, Date.now());
  }

  public endApiTimer(endpoint: string, success: boolean = true, responseSize: number = 0): number {
    if (!this.config.enableTracking || !this.config.trackApiCalls) return 0;

    const startTime = this.activeTimers.get(`api_${endpoint}`);
    if (!startTime) return 0;

    const responseTime = Date.now() - startTime;
    this.activeTimers.delete(`api_${endpoint}`);

    // Record API response time
    if (!this.metrics.apiResponseTimes[endpoint]) {
      this.metrics.apiResponseTimes[endpoint] = [];
    }
    this.metrics.apiResponseTimes[endpoint].push(responseTime);

    // Record network usage
    this.metrics.performance.networkUsage.push({
      endpoint,
      responseTime,
      size: responseSize,
      timestamp: Date.now(),
    });

    // Check for slow API responses
    if (responseTime > this.config.alertThresholds.slowApiResponseMs) {
      this.createAlert('performance', 'medium',
        `Slow API Response: ${endpoint}`,
        `API took ${responseTime}ms to respond (threshold: ${this.config.alertThresholds.slowApiResponseMs}ms)`,
        { endpoint, responseTime, success }
      );
    }

    this.saveMetrics();
    return responseTime;
  }

  // User Interaction Tracking
  public recordButtonClick(buttonName: string): void {
    if (!this.config.enableTracking || !this.config.trackUserInteractions) return;

    if (!this.metrics.userInteractions.buttonClicks[buttonName]) {
      this.metrics.userInteractions.buttonClicks[buttonName] = 0;
    }
    this.metrics.userInteractions.buttonClicks[buttonName]++;
    this.saveMetrics();
  }

  public recordSearch(): void {
    if (!this.config.enableTracking || !this.config.trackUserInteractions) return;
    this.metrics.userInteractions.searchQueries++;
    this.saveMetrics();
  }

  public recordCarView(): void {
    if (!this.config.enableTracking || !this.config.trackUserInteractions) return;
    this.metrics.userInteractions.carViews++;
    this.saveMetrics();
  }

  public recordComparison(): void {
    if (!this.config.enableTracking || !this.config.trackUserInteractions) return;
    this.metrics.userInteractions.comparisons++;
    this.saveMetrics();
  }

  // Error Tracking
  public recordError(type: string, message: string, stack?: string): void {
    if (!this.config.enableTracking) return;

    this.metrics.errors.count++;
    
    if (!this.metrics.errors.types[type]) {
      this.metrics.errors.types[type] = 0;
    }
    this.metrics.errors.types[type]++;

    // Add to recent errors (keep last 50)
    this.metrics.errors.recent.push({
      type,
      message,
      timestamp: Date.now(),
      stack,
    });

    if (this.metrics.errors.recent.length > 50) {
      this.metrics.errors.recent = this.metrics.errors.recent.slice(-50);
    }

    // Check error rate
    this.checkErrorRate();
    this.saveMetrics();
  }

  // Performance Monitoring
  public recordMemoryUsage(memoryMB: number): void {
    if (!this.config.enableTracking) return;

    this.metrics.performance.memoryUsage.push(memoryMB);
    
    // Keep only last 100 readings
    if (this.metrics.performance.memoryUsage.length > 100) {
      this.metrics.performance.memoryUsage = this.metrics.performance.memoryUsage.slice(-100);
    }

    // Check for high memory usage
    if (memoryMB > this.config.alertThresholds.highMemoryUsageMB) {
      this.createAlert('memory', 'high',
        'High Memory Usage',
        `Memory usage is ${memoryMB}MB (threshold: ${this.config.alertThresholds.highMemoryUsageMB}MB)`,
        { memoryUsage: memoryMB }
      );
    }

    this.saveMetrics();
  }

  public recordBatteryImpact(impact: number): void {
    if (!this.config.enableTracking) return;

    this.metrics.performance.batteryImpact.push(impact);
    
    // Keep only last 100 readings
    if (this.metrics.performance.batteryImpact.length > 100) {
      this.metrics.performance.batteryImpact = this.metrics.performance.batteryImpact.slice(-100);
    }

    this.saveMetrics();
  }

  // Analytics and Insights
  public generateInsights(): void {
    this.generatePopularScreensInsight();
    this.generateSlowestAPIsInsight();
    this.generateErrorHotspotsInsight();
    this.generateUserBehaviorPatternsInsight();
    this.metrics.lastUpdated = Date.now();
    this.saveMetrics();
  }

  private generatePopularScreensInsight(): void {
    const screenData = Object.entries(this.metrics.userInteractions.screenTime)
      .map(([screen, totalTime]) => ({
        screen,
        visits: this.metrics.screenLoadTimes[screen]?.length || 0,
        totalTime,
      }))
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 10);

    this.metrics.insights.popularScreens = screenData;
  }

  private generateSlowestAPIsInsight(): void {
    const apiData = Object.entries(this.metrics.apiResponseTimes)
      .map(([endpoint, times]) => ({
        endpoint,
        avgTime: times.reduce((sum, time) => sum + time, 0) / times.length,
        calls: times.length,
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10);

    this.metrics.insights.slowestAPIs = apiData;
  }

  private generateErrorHotspotsInsight(): void {
    const errorData = Object.entries(this.metrics.errors.types)
      .map(([type, count]) => ({
        type,
        count,
        trend: this.calculateErrorTrend(type),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    this.metrics.insights.errorHotspots = errorData;
  }

  private calculateErrorTrend(errorType: string): 'increasing' | 'decreasing' | 'stable' {
    const recentErrors = this.metrics.errors.recent
      .filter(error => error.type === errorType)
      .slice(-10);

    if (recentErrors.length < 5) return 'stable';

    const firstHalf = recentErrors.slice(0, Math.floor(recentErrors.length / 2));
    const secondHalf = recentErrors.slice(Math.floor(recentErrors.length / 2));

    if (secondHalf.length > firstHalf.length * 1.2) return 'increasing';
    if (secondHalf.length < firstHalf.length * 0.8) return 'decreasing';
    return 'stable';
  }

  private generateUserBehaviorPatternsInsight(): void {
    const patterns: Array<{ pattern: string; frequency: number; description: string }> = [];

    // Search to view ratio
    const searchToViewRatio = this.metrics.userInteractions.carViews / 
      Math.max(this.metrics.userInteractions.searchQueries, 1);
    
    if (searchToViewRatio > 3) {
      patterns.push({
        pattern: 'High Search Engagement',
        frequency: searchToViewRatio,
        description: 'Users view many cars per search, indicating good search relevance',
      });
    }

    // Comparison usage
    const comparisonRate = this.metrics.userInteractions.comparisons / 
      Math.max(this.metrics.userInteractions.carViews, 1);
    
    if (comparisonRate > 0.1) {
      patterns.push({
        pattern: 'Active Comparison Users',
        frequency: comparisonRate,
        description: 'Users frequently compare cars, showing detailed consideration',
      });
    }

    // Screen time patterns
    const homeScreenTime = this.metrics.userInteractions.screenTime['index'] || 0;
    const searchScreenTime = this.metrics.userInteractions.screenTime['search'] || 0;
    
    if (searchScreenTime > homeScreenTime * 2) {
      patterns.push({
        pattern: 'Search-Focused Behavior',
        frequency: searchScreenTime / homeScreenTime,
        description: 'Users spend more time searching than browsing, indicating specific needs',
      });
    }

    this.metrics.insights.userBehaviorPatterns = patterns;
  }

  // Alert Management
  private createAlert(
    type: PerformanceAlert['type'],
    severity: PerformanceAlert['severity'],
    title: string,
    description: string,
    data?: Record<string, any>
  ): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      title,
      description,
      timestamp: Date.now(),
      resolved: false,
      data,
    };

    this.alerts.push(alert);
    this.saveAlerts();

    if (this.config.enableDetailedLogging) {
      console.warn(`Performance Alert [${severity.toUpperCase()}]:`, title, description);
    }
  }

  private checkErrorRate(): void {
    const totalInteractions = this.metrics.userInteractions.searchQueries + 
      this.metrics.userInteractions.carViews + this.metrics.userInteractions.comparisons;
    
    if (totalInteractions > 0) {
      const errorRate = (this.metrics.errors.count / totalInteractions) * 100;
      
      if (errorRate > this.config.alertThresholds.errorRatePercent) {
        this.createAlert('error', 'high',
          'High Error Rate',
          `Error rate is ${errorRate.toFixed(1)}% (threshold: ${this.config.alertThresholds.errorRatePercent}%)`,
          { errorRate, totalErrors: this.metrics.errors.count, totalInteractions }
        );
      }
    }
  }

  // Data Access Methods
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  public getScreenPerformance(screenName: string): {
    averageLoadTime: number;
    loadCount: number;
    totalScreenTime: number;
  } {
    const loadTimes = this.metrics.screenLoadTimes[screenName] || [];
    const totalScreenTime = this.metrics.userInteractions.screenTime[screenName] || 0;

    return {
      averageLoadTime: loadTimes.length > 0 
        ? loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length 
        : 0,
      loadCount: loadTimes.length,
      totalScreenTime,
    };
  }

  public getApiPerformance(endpoint: string): {
    averageResponseTime: number;
    callCount: number;
    lastCallTime?: number;
  } {
    const responseTimes = this.metrics.apiResponseTimes[endpoint] || [];
    const networkCalls = this.metrics.performance.networkUsage
      .filter(call => call.endpoint === endpoint);

    return {
      averageResponseTime: responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0,
      callCount: responseTimes.length,
      lastCallTime: networkCalls.length > 0 
        ? Math.max(...networkCalls.map(call => call.timestamp))
        : undefined,
    };
  }

  public getPerformanceSummary(): {
    totalScreens: number;
    totalAPICalls: number;
    totalErrors: number;
    averageMemoryUsage: number;
    alertCount: number;
    lastUpdated: number;
  } {
    const memoryUsage = this.metrics.performance.memoryUsage;
    const averageMemoryUsage = memoryUsage.length > 0 
      ? memoryUsage.reduce((sum, usage) => sum + usage, 0) / memoryUsage.length 
      : 0;

    return {
      totalScreens: Object.keys(this.metrics.screenLoadTimes).length,
      totalAPICalls: Object.values(this.metrics.apiResponseTimes)
        .reduce((sum, times) => sum + times.length, 0),
      totalErrors: this.metrics.errors.count,
      averageMemoryUsage,
      alertCount: this.alerts.filter(alert => !alert.resolved).length,
      lastUpdated: this.metrics.lastUpdated,
    };
  }

  // Configuration Management
  public updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
  }

  public getConfig(): PerformanceConfig {
    return { ...this.config };
  }

  // Alert Management
  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      this.saveAlerts();
    }
  }

  public clearResolvedAlerts(): void {
    this.alerts = this.alerts.filter(alert => !alert.resolved);
    this.saveAlerts();
  }

  // Background Analysis
  private startBackgroundAnalysis(): void {
    // Generate insights every 5 minutes
    setInterval(() => {
      this.generateInsights();
    }, 5 * 60 * 1000);

    // Clean up old data daily
    setInterval(() => {
      this.cleanupOldData();
    }, 24 * 60 * 60 * 1000);

    // Monitor memory usage every 30 seconds
    setInterval(() => {
      // In a real app, get actual memory usage
      const mockMemoryUsage = 40 + Math.random() * 40; // 40-80 MB
      this.recordMemoryUsage(mockMemoryUsage);
    }, 30 * 1000);
  }

  private cleanupOldData(): void {
    const cutoffTime = Date.now() - (this.config.dataRetentionDays * 24 * 60 * 60 * 1000);

    // Clean up recent errors
    this.metrics.errors.recent = this.metrics.errors.recent
      .filter(error => error.timestamp > cutoffTime);

    // Clean up network usage
    this.metrics.performance.networkUsage = this.metrics.performance.networkUsage
      .filter(usage => usage.timestamp > cutoffTime);

    // Clean up resolved alerts older than 7 days
    const alertCutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(alert => 
      !alert.resolved || alert.timestamp > alertCutoffTime
    );

    this.saveMetrics();
    this.saveAlerts();
  }

  // Data Persistence
  private async loadMetrics(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('performance_metrics');
      if (data) {
        this.metrics = { ...this.metrics, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Failed to load performance metrics:', error);
    }
  }

  private async saveMetrics(): Promise<void> {
    try {
      await AsyncStorage.setItem('performance_metrics', JSON.stringify(this.metrics));
    } catch (error) {
      console.error('Failed to save performance metrics:', error);
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('performance_config');
      if (data) {
        this.config = { ...this.config, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Failed to load performance config:', error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem('performance_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save performance config:', error);
    }
  }

  private async loadAlerts(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('performance_alerts');
      if (data) {
        this.alerts = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load performance alerts:', error);
    }
  }

  private async saveAlerts(): Promise<void> {
    try {
      await AsyncStorage.setItem('performance_alerts', JSON.stringify(this.alerts));
    } catch (error) {
      console.error('Failed to save performance alerts:', error);
    }
  }

  // Development and Debug Methods
  public exportData(): {
    metrics: PerformanceMetrics;
    alerts: PerformanceAlert[];
    config: PerformanceConfig;
  } {
    return {
      metrics: this.metrics,
      alerts: this.alerts,
      config: this.config,
    };
  }

  public clearAllData(): void {
    this.metrics = {
      screenLoadTimes: {},
      apiResponseTimes: {},
      userInteractions: {
        screenTime: {},
        buttonClicks: {},
        searchQueries: 0,
        carViews: 0,
        comparisons: 0,
      },
      errors: {
        count: 0,
        types: {},
        recent: [],
      },
      performance: {
        memoryUsage: [],
        batteryImpact: [],
        networkUsage: [],
      },
      insights: {
        popularScreens: [],
        slowestAPIs: [],
        errorHotspots: [],
        userBehaviorPatterns: [],
      },
      lastUpdated: Date.now(),
    };

    this.alerts = [];
    this.saveMetrics();
    this.saveAlerts();
  }
}

// Singleton instance
export const performanceAnalytics = PerformanceAnalyticsService.getInstance();

// React Hook for Performance Analytics
export const usePerformanceAnalytics = () => {
  return {
    startScreenTimer: performanceAnalytics.startScreenTimer.bind(performanceAnalytics),
    endScreenTimer: performanceAnalytics.endScreenTimer.bind(performanceAnalytics),
    recordScreenTime: performanceAnalytics.recordScreenTime.bind(performanceAnalytics),
    startApiTimer: performanceAnalytics.startApiTimer.bind(performanceAnalytics),
    endApiTimer: performanceAnalytics.endApiTimer.bind(performanceAnalytics),
    recordButtonClick: performanceAnalytics.recordButtonClick.bind(performanceAnalytics),
    recordSearch: performanceAnalytics.recordSearch.bind(performanceAnalytics),
    recordCarView: performanceAnalytics.recordCarView.bind(performanceAnalytics),
    recordComparison: performanceAnalytics.recordComparison.bind(performanceAnalytics),
    recordError: performanceAnalytics.recordError.bind(performanceAnalytics),
    getMetrics: performanceAnalytics.getMetrics.bind(performanceAnalytics),
    getAlerts: performanceAnalytics.getAlerts.bind(performanceAnalytics),
    getPerformanceSummary: performanceAnalytics.getPerformanceSummary.bind(performanceAnalytics),
  };
};

export default performanceAnalytics;
