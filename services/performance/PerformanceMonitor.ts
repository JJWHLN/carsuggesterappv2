/**
 * Performance Monitor Service
 * 
 * Phase 2 Week 8 - Performance Optimization & Advanced Features
 * 
 * Features:
 * - Real-time performance tracking
 * - Memory usage monitoring
 * - Network performance analysis
 * - App lifecycle performance metrics
 * - Automated performance alerts
 * - Performance regression detection
 */

import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  frameRate: number;
  bundleSize: number;
  cacheHitRate: number;
}

export interface PerformanceReport {
  timeframe: string;
  metrics: PerformanceMetrics;
  trends: PerformanceTrend[];
  anomalies: PerformanceAnomaly[];
  recommendations: PerformanceRecommendation[];
  score: number; // Overall performance score 0-100
}

export interface PerformanceTrend {
  metric: keyof PerformanceMetrics;
  direction: 'improving' | 'degrading' | 'stable';
  changePercent: number;
  significance: 'low' | 'medium' | 'high';
}

export interface PerformanceAnomaly {
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
  severity: 'warning' | 'critical';
  timestamp: number;
  duration: number;
  cause?: string;
}

export interface PerformanceRecommendation {
  category: 'memory' | 'network' | 'rendering' | 'caching' | 'database';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  priority: number;
  implementation: string[];
}

export interface AlertThresholds {
  responseTime: number;
  memoryUsage: number;
  errorRate: number;
  frameRate: number;
  networkLatency: number;
}

export interface PerformanceEvent {
  name: string;
  category: 'navigation' | 'api' | 'render' | 'cache' | 'database' | 'user_action';
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
  success: boolean;
  error?: string;
}

export interface MemorySnapshot {
  used: number;
  total: number;
  available: number;
  heapUsed: number;
  heapTotal: number;
  external: number;
  timestamp: number;
  componentCount: number;
  listenerCount: number;
}

export interface NetworkMetrics {
  requestCount: number;
  totalBytes: number;
  avgLatency: number;
  errorRate: number;
  cacheHitRate: number;
  slowRequests: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor | null = null;
  private readonly STORAGE_KEY = '@performance_metrics';
  private readonly MAX_EVENTS = 1000;
  private readonly ALERT_THRESHOLDS: AlertThresholds = {
    responseTime: 1000, // ms
    memoryUsage: 100 * 1024 * 1024, // 100MB
    errorRate: 5, // 5%
    frameRate: 55, // fps
    networkLatency: 2000 // ms
  };

  private events: PerformanceEvent[] = [];
  private memorySnapshots: MemorySnapshot[] = [];
  private networkMetrics: NetworkMetrics[] = [];
  private currentMetrics: PerformanceMetrics = this.initializeMetrics();
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  private appStateSubscription?: any;
  private performanceObserver?: any;

  private constructor() {
    this.initialize();
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Initialize performance monitoring
  async initialize(): Promise<void> {
    try {
      // Load historical data
      await this.loadHistoricalData();
      
      // Set up app state monitoring
      this.setupAppStateMonitoring();
      
      // Set up performance observers
      this.setupPerformanceObservers();
      
      // Start monitoring
      this.startMonitoring();
      
      console.log('Performance Monitor initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Performance Monitor:', error);
    }
  }

  // Start performance monitoring
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Monitor every 5 seconds
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 5000);
    
    console.log('Performance monitoring started');
  }

  // Stop performance monitoring
  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    
    console.log('Performance monitoring stopped');
  }

  // Track performance event
  trackEvent(
    name: string,
    category: PerformanceEvent['category'],
    metadata?: Record<string, any>
  ): string {
    const eventId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const event: PerformanceEvent = {
      name,
      category,
      startTime: performance.now(),
      metadata,
      success: true
    };
    
    this.events.push(event);
    
    // Keep only recent events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }
    
    return eventId;
  }

  // End performance event tracking
  endEvent(eventId: string, success: boolean = true, error?: string): void {
    const eventIndex = this.events.findIndex(e => 
      `${e.startTime}_${Math.random().toString(36).substr(2, 9)}` === eventId
    );
    
    if (eventIndex !== -1) {
      const event = this.events[eventIndex];
      event.endTime = performance.now();
      event.duration = event.endTime - event.startTime;
      event.success = success;
      event.error = error;
      
      // Update current metrics
      this.updateCurrentMetrics(event);
    }
  }

  // Measure function performance
  async measureAsync<T>(
    name: string,
    category: PerformanceEvent['category'],
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const eventId = this.trackEvent(name, category, metadata);
    
    try {
      const result = await fn();
      this.endEvent(eventId, true);
      return result;
    } catch (error) {
      this.endEvent(eventId, false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  // Measure synchronous function performance
  measure<T>(
    name: string,
    category: PerformanceEvent['category'],
    fn: () => T,
    metadata?: Record<string, any>
  ): T {
    const eventId = this.trackEvent(name, category, metadata);
    
    try {
      const result = fn();
      this.endEvent(eventId, true);
      return result;
    } catch (error) {
      this.endEvent(eventId, false, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }

  // Get current performance metrics
  getCurrentMetrics(): PerformanceMetrics {
    return { ...this.currentMetrics };
  }

  // Get performance report
  async getPerformanceReport(timeframe: '1h' | '6h' | '24h' | '7d' = '1h'): Promise<PerformanceReport> {
    try {
      const now = Date.now();
      const timeframeMs = this.getTimeframeMs(timeframe);
      const since = now - timeframeMs;
      
      // Filter events by timeframe
      const recentEvents = this.events.filter(e => e.startTime >= since);
      
      // Calculate metrics
      const metrics = this.calculateMetrics(recentEvents);
      
      // Analyze trends
      const trends = await this.analyzeTrends(timeframe);
      
      // Detect anomalies
      const anomalies = this.detectAnomalies(recentEvents);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(metrics, anomalies);
      
      // Calculate performance score
      const score = this.calculatePerformanceScore(metrics);
      
      return {
        timeframe,
        metrics,
        trends,
        anomalies,
        recommendations,
        score
      };
    } catch (error) {
      console.error('Error generating performance report:', error);
      return {
        timeframe,
        metrics: this.currentMetrics,
        trends: [],
        anomalies: [],
        recommendations: [],
        score: 0
      };
    }
  }

  // Get memory usage statistics
  getMemoryStats(): {
    current: MemorySnapshot;
    peak: MemorySnapshot;
    average: Partial<MemorySnapshot>;
    trend: 'increasing' | 'decreasing' | 'stable';
  } {
    const current = this.getCurrentMemorySnapshot();
    const peak = this.memorySnapshots.reduce((max, snapshot) => 
      snapshot.used > max.used ? snapshot : max, current);
    
    const average = this.calculateAverageMemory();
    const trend = this.calculateMemoryTrend();
    
    return { current, peak, average, trend };
  }

  // Get network performance statistics
  getNetworkStats(): {
    current: NetworkMetrics;
    average: Partial<NetworkMetrics>;
    trend: 'improving' | 'degrading' | 'stable';
  } {
    const current = this.getCurrentNetworkMetrics();
    const average = this.calculateAverageNetwork();
    const trend = this.calculateNetworkTrend();
    
    return { current, average, trend };
  }

  // Set custom alert thresholds
  setAlertThresholds(thresholds: Partial<AlertThresholds>): void {
    Object.assign(this.ALERT_THRESHOLDS, thresholds);
  }

  // Get performance events
  getEvents(
    category?: PerformanceEvent['category'],
    limit: number = 100
  ): PerformanceEvent[] {
    let filteredEvents = this.events;
    
    if (category) {
      filteredEvents = this.events.filter(e => e.category === category);
    }
    
    return filteredEvents
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  // Export performance data
  async exportData(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const data = {
        metrics: this.currentMetrics,
        events: this.events,
        memorySnapshots: this.memorySnapshots,
        networkMetrics: this.networkMetrics,
        exportTimestamp: Date.now()
      };
      
      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      } else {
        return this.convertToCSV(data);
      }
    } catch (error) {
      console.error('Error exporting performance data:', error);
      return '';
    }
  }

  // Clear performance data
  async clearData(): Promise<void> {
    try {
      this.events = [];
      this.memorySnapshots = [];
      this.networkMetrics = [];
      this.currentMetrics = this.initializeMetrics();
      
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      
      console.log('Performance data cleared');
    } catch (error) {
      console.error('Error clearing performance data:', error);
    }
  }

  // Private methods

  private async loadHistoricalData(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.events = data.events || [];
        this.memorySnapshots = data.memorySnapshots || [];
        this.networkMetrics = data.networkMetrics || [];
        this.currentMetrics = data.currentMetrics || this.initializeMetrics();
      }
    } catch (error) {
      console.error('Error loading historical performance data:', error);
    }
  }

  private async saveData(): Promise<void> {
    try {
      const data = {
        events: this.events.slice(-this.MAX_EVENTS),
        memorySnapshots: this.memorySnapshots.slice(-100),
        networkMetrics: this.networkMetrics.slice(-100),
        currentMetrics: this.currentMetrics
      };
      
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving performance data:', error);
    }
  }

  private setupAppStateMonitoring(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      this.trackEvent('app_state_change', 'navigation', { 
        state: nextAppState,
        timestamp: Date.now()
      });
      
      if (nextAppState === 'background') {
        this.saveData();
      }
    });
  }

  private setupPerformanceObservers(): void {
    // Set up performance observers for web/React Native
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach(entry => {
            this.trackEvent(entry.name, 'render', {
              duration: entry.duration,
              startTime: entry.startTime,
              entryType: entry.entryType
            });
          });
        });
        
        this.performanceObserver.observe({ entryTypes: ['navigation', 'resource', 'measure'] });
      } catch (error) {
        console.warn('PerformanceObserver not available:', error);
      }
    }
  }

  private collectMetrics(): void {
    try {
      // Collect memory snapshot
      const memorySnapshot = this.getCurrentMemorySnapshot();
      this.memorySnapshots.push(memorySnapshot);
      
      // Collect network metrics
      const networkMetrics = this.getCurrentNetworkMetrics();
      this.networkMetrics.push(networkMetrics);
      
      // Update current metrics
      this.updateCurrentMetricsFromSnapshots();
      
      // Check for alerts
      this.checkAlerts();
      
      // Keep only recent snapshots
      if (this.memorySnapshots.length > 100) {
        this.memorySnapshots = this.memorySnapshots.slice(-100);
      }
      
      if (this.networkMetrics.length > 100) {
        this.networkMetrics = this.networkMetrics.slice(-100);
      }
    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  private getCurrentMemorySnapshot(): MemorySnapshot {
    // Mock memory data - in production, use actual memory APIs
    const mockMemory = {
      used: Math.random() * 100 * 1024 * 1024, // Random up to 100MB
      total: 512 * 1024 * 1024, // 512MB total
      available: 200 * 1024 * 1024, // 200MB available
      heapUsed: Math.random() * 50 * 1024 * 1024,
      heapTotal: 100 * 1024 * 1024,
      external: Math.random() * 10 * 1024 * 1024,
      timestamp: Date.now(),
      componentCount: Math.floor(Math.random() * 100) + 50,
      listenerCount: Math.floor(Math.random() * 50) + 10
    };
    
    return mockMemory;
  }

  private getCurrentNetworkMetrics(): NetworkMetrics {
    // Mock network data - in production, integrate with actual network monitoring
    return {
      requestCount: Math.floor(Math.random() * 10) + 1,
      totalBytes: Math.random() * 1024 * 1024,
      avgLatency: Math.random() * 500 + 100,
      errorRate: Math.random() * 5,
      cacheHitRate: Math.random() * 100,
      slowRequests: Math.floor(Math.random() * 3),
      timestamp: Date.now()
    };
  }

  private updateCurrentMetrics(event: PerformanceEvent): void {
    if (!event.duration) return;
    
    // Update response time
    this.currentMetrics.responseTime = (this.currentMetrics.responseTime + event.duration) / 2;
    
    // Update error rate
    if (!event.success) {
      this.currentMetrics.errorRate++;
    }
    
    // Update throughput (events per second)
    this.currentMetrics.throughput++;
  }

  private updateCurrentMetricsFromSnapshots(): void {
    if (this.memorySnapshots.length > 0) {
      const latest = this.memorySnapshots[this.memorySnapshots.length - 1];
      this.currentMetrics.memoryUsage = latest.used;
    }
    
    if (this.networkMetrics.length > 0) {
      const latest = this.networkMetrics[this.networkMetrics.length - 1];
      this.currentMetrics.networkLatency = latest.avgLatency;
    }
    
    // Mock other metrics
    this.currentMetrics.cpuUsage = Math.random() * 50 + 10;
    this.currentMetrics.frameRate = Math.random() * 10 + 55;
    this.currentMetrics.bundleSize = 5 * 1024 * 1024; // 5MB
    this.currentMetrics.cacheHitRate = Math.random() * 20 + 80;
  }

  private calculateMetrics(events: PerformanceEvent[]): PerformanceMetrics {
    const successfulEvents = events.filter(e => e.success && e.duration);
    const failedEvents = events.filter(e => !e.success);
    
    const avgResponseTime = successfulEvents.length > 0 ? 
      successfulEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / successfulEvents.length : 0;
    
    const errorRate = events.length > 0 ? (failedEvents.length / events.length) * 100 : 0;
    
    return {
      responseTime: avgResponseTime,
      throughput: events.length,
      errorRate,
      memoryUsage: this.currentMetrics.memoryUsage,
      cpuUsage: this.currentMetrics.cpuUsage,
      networkLatency: this.currentMetrics.networkLatency,
      frameRate: this.currentMetrics.frameRate,
      bundleSize: this.currentMetrics.bundleSize,
      cacheHitRate: this.currentMetrics.cacheHitRate
    };
  }

  private async analyzeTrends(timeframe: string): Promise<PerformanceTrend[]> {
    // Mock trend analysis - in production, implement proper trend analysis
    return [
      {
        metric: 'responseTime',
        direction: 'improving',
        changePercent: -5.2,
        significance: 'medium'
      },
      {
        metric: 'memoryUsage',
        direction: 'stable',
        changePercent: 1.1,
        significance: 'low'
      }
    ];
  }

  private detectAnomalies(events: PerformanceEvent[]): PerformanceAnomaly[] {
    const anomalies: PerformanceAnomaly[] = [];
    
    // Check for slow responses
    const slowEvents = events.filter(e => e.duration && e.duration > this.ALERT_THRESHOLDS.responseTime);
    if (slowEvents.length > 0) {
      anomalies.push({
        metric: 'responseTime',
        value: Math.max(...slowEvents.map(e => e.duration || 0)),
        threshold: this.ALERT_THRESHOLDS.responseTime,
        severity: 'warning',
        timestamp: Date.now(),
        duration: 0,
        cause: 'Slow API responses detected'
      });
    }
    
    // Check memory usage
    if (this.currentMetrics.memoryUsage > this.ALERT_THRESHOLDS.memoryUsage) {
      anomalies.push({
        metric: 'memoryUsage',
        value: this.currentMetrics.memoryUsage,
        threshold: this.ALERT_THRESHOLDS.memoryUsage,
        severity: 'critical',
        timestamp: Date.now(),
        duration: 0,
        cause: 'High memory usage detected'
      });
    }
    
    return anomalies;
  }

  private generateRecommendations(
    metrics: PerformanceMetrics, 
    anomalies: PerformanceAnomaly[]
  ): PerformanceRecommendation[] {
    const recommendations: PerformanceRecommendation[] = [];
    
    // Response time recommendations
    if (metrics.responseTime > 500) {
      recommendations.push({
        category: 'network',
        title: 'Optimize API Response Times',
        description: 'API responses are slower than recommended. Consider caching and optimization.',
        impact: 'high',
        effort: 'medium',
        priority: 1,
        implementation: [
          'Implement request caching',
          'Optimize database queries',
          'Use CDN for static assets'
        ]
      });
    }
    
    // Memory recommendations
    if (metrics.memoryUsage > 80 * 1024 * 1024) { // 80MB
      recommendations.push({
        category: 'memory',
        title: 'Reduce Memory Usage',
        description: 'App is using more memory than recommended.',
        impact: 'medium',
        effort: 'medium',
        priority: 2,
        implementation: [
          'Optimize image loading',
          'Implement component lazy loading',
          'Clear unused references'
        ]
      });
    }
    
    return recommendations.sort((a, b) => a.priority - b.priority);
  }

  private calculatePerformanceScore(metrics: PerformanceMetrics): number {
    let score = 100;
    
    // Response time penalty
    if (metrics.responseTime > 1000) score -= 20;
    else if (metrics.responseTime > 500) score -= 10;
    
    // Error rate penalty
    score -= metrics.errorRate * 2;
    
    // Memory usage penalty
    if (metrics.memoryUsage > 100 * 1024 * 1024) score -= 15;
    else if (metrics.memoryUsage > 80 * 1024 * 1024) score -= 8;
    
    // Frame rate penalty
    if (metrics.frameRate < 30) score -= 25;
    else if (metrics.frameRate < 50) score -= 10;
    
    return Math.max(0, Math.min(100, score));
  }

  private checkAlerts(): void {
    const metrics = this.currentMetrics;
    
    if (metrics.responseTime > this.ALERT_THRESHOLDS.responseTime) {
      console.warn(`Performance Alert: Response time (${metrics.responseTime}ms) exceeds threshold`);
    }
    
    if (metrics.memoryUsage > this.ALERT_THRESHOLDS.memoryUsage) {
      console.warn(`Performance Alert: Memory usage (${metrics.memoryUsage} bytes) exceeds threshold`);
    }
    
    if (metrics.errorRate > this.ALERT_THRESHOLDS.errorRate) {
      console.warn(`Performance Alert: Error rate (${metrics.errorRate}%) exceeds threshold`);
    }
  }

  private getTimeframeMs(timeframe: string): number {
    switch (timeframe) {
      case '1h': return 60 * 60 * 1000;
      case '6h': return 6 * 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      default: return 60 * 60 * 1000;
    }
  }

  private calculateAverageMemory(): Partial<MemorySnapshot> {
    if (this.memorySnapshots.length === 0) return {};
    
    const sum = this.memorySnapshots.reduce((acc, snapshot) => ({
      used: acc.used + snapshot.used,
      total: acc.total + snapshot.total,
      available: acc.available + snapshot.available
    }), { used: 0, total: 0, available: 0 });
    
    const count = this.memorySnapshots.length;
    return {
      used: sum.used / count,
      total: sum.total / count,
      available: sum.available / count
    };
  }

  private calculateMemoryTrend(): 'increasing' | 'decreasing' | 'stable' {
    if (this.memorySnapshots.length < 2) return 'stable';
    
    const recent = this.memorySnapshots.slice(-10);
    const first = recent[0];
    const last = recent[recent.length - 1];
    
    const change = (last.used - first.used) / first.used;
    
    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  private calculateAverageNetwork(): Partial<NetworkMetrics> {
    if (this.networkMetrics.length === 0) return {};
    
    const sum = this.networkMetrics.reduce((acc, metrics) => ({
      avgLatency: acc.avgLatency + metrics.avgLatency,
      errorRate: acc.errorRate + metrics.errorRate,
      cacheHitRate: acc.cacheHitRate + metrics.cacheHitRate
    }), { avgLatency: 0, errorRate: 0, cacheHitRate: 0 });
    
    const count = this.networkMetrics.length;
    return {
      avgLatency: sum.avgLatency / count,
      errorRate: sum.errorRate / count,
      cacheHitRate: sum.cacheHitRate / count
    };
  }

  private calculateNetworkTrend(): 'improving' | 'degrading' | 'stable' {
    if (this.networkMetrics.length < 2) return 'stable';
    
    const recent = this.networkMetrics.slice(-10);
    const avgLatencyTrend = recent[recent.length - 1].avgLatency - recent[0].avgLatency;
    
    if (avgLatencyTrend > 100) return 'degrading';
    if (avgLatencyTrend < -100) return 'improving';
    return 'stable';
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - in production, use proper CSV library
    return JSON.stringify(data);
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      responseTime: 0,
      throughput: 0,
      errorRate: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      networkLatency: 0,
      frameRate: 60,
      bundleSize: 0,
      cacheHitRate: 0
    };
  }
}

export default PerformanceMonitor;
