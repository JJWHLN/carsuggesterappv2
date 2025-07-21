import AsyncStorage from '@react-native-async-storage/async-storage';

// Enhanced Performance Metrics Types
export interface PerformanceMetric {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  value?: number;
  metadata?: Record<string, any>;
  tags?: Record<string, string>;
}

export interface MemoryUsage {
  used: number;
  total: number;
  free: number;
  timestamp: number;
}

interface NetworkMetric {
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  responseSize?: number;
  status?: number;
  error?: string;
}

interface RenderMetric {
  componentName: string;
  renderTime: number;
  renderCount: number;
  lastRenderTime: number;
  propsChanged: boolean;
}

interface PerformanceReport {
  appStartTime: number;
  totalMetrics: number;
  averageRenderTime: number;
  slowestOperations: PerformanceMetric[];
  memoryUsage: MemoryUsage[];
  networkMetrics: NetworkMetric[];
  renderMetrics: RenderMetric[];
  recommendations: string[];
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: PerformanceMetric[] = [];
  private networkMetrics: NetworkMetric[] = [];
  private renderMetrics: Map<string, RenderMetric> = new Map();
  private memoryUsage: MemoryUsage[] = [];
  private appStartTime: number = Date.now();
  private isMonitoring: boolean = false;
  private memoryCheckInterval?: NodeJS.Timeout;
  private maxMetricsCount = 1000;
  private maxNetworkMetricsCount = 500;
  private maxMemoryReadings = 100;
  private maxRenderMetrics = 200;
  private originalErrorHandler?: any; // Store original error handler for cleanup

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Cleanup singleton instance - useful for testing and memory management
   */
  static destroyInstance(): void {
    if (PerformanceMonitor.instance) {
      PerformanceMonitor.instance.stopMonitoring();
      PerformanceMonitor.instance.clearMetrics();
      PerformanceMonitor.instance = null as any;
    }
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.appStartTime = Date.now();
    
    // Enhanced error tracking for Phase 2 UX improvements
    this.originalErrorHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error, isFatal) => {
      // Enhanced error categorization for modern UI patterns
      const errorCategory = this.categorizeError(error);
      
      this.metrics.push({
        name: 'GlobalError',
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 0,
        metadata: { 
          error: error.message || 'Unknown error',
          stack: error.stack,
          isFatal,
          category: errorCategory,
          context: 'Phase2_ModernUI'
        }
      });
      
      // Call original handler if it exists
      if (this.originalErrorHandler) {
        this.originalErrorHandler(error, isFatal);
      }
    });
    
    // Start memory monitoring
    this.startMemoryMonitoring();
    
    // Monitor JavaScript performance with enhanced tracking
    this.monitorJavaScriptPerformance();
    
    // Monitor modern UI performance patterns (Instagram, TikTok, Zillow-style)
    this.monitorModernUIPatterns();
    
    logger.debug('📱 Enhanced Performance monitoring started for Phase 2 UX');
  }

  private categorizeError(error: any): string {
    const message = error.message || '';
    
    if (message.includes('Network') || message.includes('fetch')) {
      return 'network';
    } else if (message.includes('Component') || message.includes('render')) {
      return 'ui_component';
    } else if (message.includes('ModernCarCard') || message.includes('ZillowStyle')) {
      return 'phase2_component';
    } else if (message.includes('TouchableOpacity') || message.includes('Animated')) {
      return 'interaction';
    } else {
      return 'general';
    }
  }

  private monitorModernUIPatterns(): void {
    // Track Instagram-style stories performance
    this.startTimer('InstagramStoriesLoad');
    
    // Track TikTok-style infinite scroll
    this.startTimer('TikTokScrollPerformance');
    
    // Track Zillow-style search and filters
    this.startTimer('ZillowSearchExperience');
    
    logger.debug('🎨 Modern UI pattern monitoring initialized');
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    // Clear memory monitoring interval
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = undefined;
    }

    // Restore original error handler
    if (this.originalErrorHandler) {
      ErrorUtils.setGlobalHandler(this.originalErrorHandler);
      this.originalErrorHandler = undefined;
    }
    
    logger.debug('Performance monitoring stopped');
  }

  // Performance Timing
  startTimer(name: string, metadata?: Record<string, any>): string {
    const timerId = `${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const metric: PerformanceMetric = {
      name,
      startTime: Date.now(),
      metadata,
    };
    
    this.metrics.push(metric);
    
    // Keep metrics array manageable
    if (this.metrics.length > this.maxMetricsCount) {
      this.metrics = this.metrics.slice(-this.maxMetricsCount);
    }
    
    return timerId;
  }

  endTimer(name: string, metadata?: Record<string, any>): number | null {
    const metric = this.metrics
      .slice()
      .reverse()
      .find(m => m.name === name && !m.endTime);
    
    if (metric) {
      metric.endTime = Date.now();
      metric.duration = metric.endTime - metric.startTime;
      if (metadata) {
        metric.metadata = { ...metric.metadata, ...metadata };
      }
      
      return metric.duration;
    }
    
    return null;
  }

  // Measure function execution time
  measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const startTime = Date.now();
      
      try {
        const result = await fn();
        const duration = Date.now() - startTime;
        
        this.metrics.push({
          name,
          startTime,
          endTime: Date.now(),
          duration,
          metadata: { ...metadata, success: true },
        });
        
        resolve(result);
      } catch (error) {
        const duration = Date.now() - startTime;
        
        this.metrics.push({
          name,
          startTime,
          endTime: Date.now(),
          duration,
          metadata: { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' },
        });
        
        reject(error);
      }
    });
  }

  measureSync<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    const startTime = Date.now();
    
    try {
      const result = fn();
      const duration = Date.now() - startTime;
      
      this.metrics.push({
        name,
        startTime,
        endTime: Date.now(),
        duration,
        metadata: { ...metadata, success: true },
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.metrics.push({
        name,
        startTime,
        endTime: Date.now(),
        duration,
        metadata: { ...metadata, success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      });
      
      throw error;
    }
  }

  // Network Performance Monitoring
  trackNetworkRequest(url: string, method: string): {
    end: (status?: number, responseSize?: number, error?: string) => void;
  } {
    const startTime = Date.now();
    
    const networkMetric: NetworkMetric = {
      url,
      method,
      startTime,
    };
    
    this.networkMetrics.push(networkMetric);
    
    // Keep network metrics manageable
    if (this.networkMetrics.length > this.maxNetworkMetricsCount) {
      this.networkMetrics = this.networkMetrics.slice(-this.maxNetworkMetricsCount);
    }
    
    return {
      end: (status?: number, responseSize?: number, error?: string) => {
        networkMetric.endTime = Date.now();
        networkMetric.duration = networkMetric.endTime - networkMetric.startTime;
        networkMetric.status = status;
        networkMetric.responseSize = responseSize;
        networkMetric.error = error;
      }
    };
  }

  // React Component Render Monitoring
  trackRender(componentName: string, renderTime: number, propsChanged: boolean = false): void {
    const existing = this.renderMetrics.get(componentName);
    
    if (existing) {
      existing.renderCount++;
      existing.lastRenderTime = renderTime;
      existing.propsChanged = propsChanged;
    } else {
      this.renderMetrics.set(componentName, {
        componentName,
        renderTime,
        renderCount: 1,
        lastRenderTime: renderTime,
        propsChanged,
      });

      // Keep render metrics manageable
      if (this.renderMetrics.size > this.maxRenderMetrics) {
        // Remove oldest entries
        const entries = Array.from(this.renderMetrics.entries());
        const toKeep = entries.slice(-this.maxRenderMetrics);
        this.renderMetrics.clear();
        toKeep.forEach(([key, value]) => this.renderMetrics.set(key, value));
      }
    }
  }

  // Memory Monitoring
  private startMemoryMonitoring(): void {
    // Check memory usage every 30 seconds
    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage();
    }, 30000);
    
    // Initial check
    this.checkMemoryUsage();
  }

  private checkMemoryUsage(): void {
    // In a real React Native app, you'd use native modules to get accurate memory info
    // For now, we'll simulate memory data
    const memoryData: MemoryUsage = {
      used: Math.random() * 200 + 50, // Simulated MB
      total: 512, // Simulated total MB
      free: Math.random() * 300 + 200, // Simulated free MB
      timestamp: Date.now(),
    };
    
    this.memoryUsage.push(memoryData);
    
    // Keep only last memory readings manageable
    if (this.memoryUsage.length > this.maxMemoryReadings) {
      this.memoryUsage = this.memoryUsage.slice(-this.maxMemoryReadings);
    }
    
    // Log memory warnings
    if (memoryData.used > 150) {
      logger.warn('High memory usage detected:', memoryData.used, 'MB');
    }
  }

  // JavaScript Performance Monitoring
  private monitorJavaScriptPerformance(): void {
    // Monitor global errors
    if (typeof global !== 'undefined' && (global as any).ErrorUtils) {
      const originalHandler = (global as any).ErrorUtils.getGlobalHandler();
      
      (global as any).ErrorUtils.setGlobalHandler((error: any, isFatal: boolean) => {
        this.metrics.push({
          name: 'JavaScript Error',
          startTime: Date.now(),
          endTime: Date.now(),
          duration: 0,
          metadata: {
            error: error.message,
            stack: error.stack,
            isFatal,
          },
        });
        
        if (originalHandler) {
          originalHandler(error, isFatal);
        }
      });
    }
  }

  // Enhanced Performance Analysis for Modern UI Patterns
  generateReport(): PerformanceReport {
    const completedMetrics = this.metrics.filter(m => m.duration !== undefined);
    const averageRenderTime = this.calculateAverageRenderTime();
    const slowestOperations = this.getSlowestOperations(10);
    const recommendations = this.generateModernUIRecommendations();
    
    return {
      appStartTime: this.appStartTime,
      totalMetrics: this.metrics.length,
      averageRenderTime,
      slowestOperations,
      memoryUsage: [...this.memoryUsage],
      networkMetrics: [...this.networkMetrics],
      renderMetrics: Array.from(this.renderMetrics.values()),
      recommendations,
    };
  }

  private generateModernUIRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Check for Instagram-style stories performance
    const storiesMetrics = this.getMetricsByName('InstagramStoriesLoad');
    if (storiesMetrics.length > 0) {
      const avgStoriesTime = this.getAverageTimeByName('InstagramStoriesLoad');
      if (avgStoriesTime > 500) {
        recommendations.push(
          `📸 Instagram-style stories loading slowly (${avgStoriesTime}ms) - consider lazy loading or image optimization`
        );
      }
    }
    
    // Check for TikTok-style scroll performance
    const scrollMetrics = this.getMetricsByName('TikTokScrollPerformance');
    if (scrollMetrics.length > 0) {
      const avgScrollTime = this.getAverageTimeByName('TikTokScrollPerformance');
      if (avgScrollTime > 50) {
        recommendations.push(
          `📱 TikTok-style scroll lagging (${avgScrollTime}ms) - optimize FlatList or implement windowing`
        );
      }
    }
    
    // Check for Zillow-style search performance
    const searchMetrics = this.getMetricsByName('ZillowSearchExperience');
    if (searchMetrics.length > 0) {
      const avgSearchTime = this.getAverageTimeByName('ZillowSearchExperience');
      if (avgSearchTime > 1000) {
        recommendations.push(
          `🏠 Zillow-style search taking too long (${avgSearchTime}ms) - implement search debouncing or caching`
        );
      }
    }
    
    // Check for ModernCarCard rendering performance
    const modernCardRenders = Array.from(this.renderMetrics.values())
      .filter(metric => metric.componentName.includes('ModernCarCard'))
      .filter(metric => metric.renderTime > 30); // More than 30ms
    
    if (modernCardRenders.length > 0) {
      recommendations.push(
        `🚗 ModernCarCard rendering slowly - consider memoization or image optimization`
      );
    }
    
    // Check Phase 2 component errors
    const phase2Errors = this.metrics.filter(m => 
      m.metadata && m.metadata.category === 'phase2_component'
    );
    
    if (phase2Errors.length > 0) {
      recommendations.push(
        `⚠️  ${phase2Errors.length} Phase 2 component errors detected - review ModernCarCard and ZillowStyleSearch implementations`
      );
    }
    
    // General performance recommendations from base class
    const baseRecommendations = this.generateBaseRecommendations();
    
    return [...recommendations, ...baseRecommendations];
  }

  private generateBaseRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Check for slow renders
    const slowRenders = Array.from(this.renderMetrics.values())
      .filter(metric => metric.renderTime > 16) // More than 16ms render time
      .sort((a, b) => b.renderTime - a.renderTime);
    
    if (slowRenders.length > 0) {
      recommendations.push(
        `Consider optimizing ${slowRenders[0].componentName} - render time: ${slowRenders[0].renderTime}ms`
      );
    }
    
    // Check for frequent re-renders
    const frequentRenders = Array.from(this.renderMetrics.values())
      .filter(metric => metric.renderCount > 50)
      .sort((a, b) => b.renderCount - a.renderCount);
    
    if (frequentRenders.length > 0) {
      recommendations.push(
        `${frequentRenders[0].componentName} re-rendered ${frequentRenders[0].renderCount} times - consider memoization`
      );
    }
    
    // Check for slow network requests
    const slowNetworkRequests = this.networkMetrics
      .filter(metric => metric.duration && metric.duration > 5000)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0));
    
    if (slowNetworkRequests.length > 0) {
      recommendations.push(
        `Slow network request detected: ${slowNetworkRequests[0].url} (${slowNetworkRequests[0].duration}ms)`
      );
    }
    
    // Check memory usage
    const latestMemory = this.memoryUsage[this.memoryUsage.length - 1];
    if (latestMemory && latestMemory.used > 150) {
      recommendations.push(`High memory usage: ${latestMemory.used}MB - consider optimizing data structures`);
    }
    
    // Check for errors
    const errorCount = this.metrics.filter(m => 
      m.metadata && m.metadata.error
    ).length;
    
    if (errorCount > 0) {
      recommendations.push(`${errorCount} errors detected - check error logs`);
    }
    
    return recommendations;
  }

  private calculateAverageRenderTime(): number {
    const renderMetrics = Array.from(this.renderMetrics.values());
    if (renderMetrics.length === 0) return 0;
    
    const totalTime = renderMetrics.reduce((sum, metric) => sum + metric.renderTime, 0);
    return totalTime / renderMetrics.length;
  }

  private getSlowestOperations(count: number): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.duration !== undefined)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, count);
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Check for slow renders
    const slowRenders = Array.from(this.renderMetrics.values())
      .filter(metric => metric.renderTime > 16) // More than 16ms render time
      .sort((a, b) => b.renderTime - a.renderTime);
    
    if (slowRenders.length > 0) {
      recommendations.push(
        `Consider optimizing ${slowRenders[0].componentName} - render time: ${slowRenders[0].renderTime}ms`
      );
    }
    
    // Check for frequent re-renders
    const frequentRenders = Array.from(this.renderMetrics.values())
      .filter(metric => metric.renderCount > 50)
      .sort((a, b) => b.renderCount - a.renderCount);
    
    if (frequentRenders.length > 0) {
      recommendations.push(
        `${frequentRenders[0].componentName} re-rendered ${frequentRenders[0].renderCount} times - consider memoization`
      );
    }
    
    // Check for slow network requests
    const slowNetworkRequests = this.networkMetrics
      .filter(metric => metric.duration && metric.duration > 5000)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0));
    
    if (slowNetworkRequests.length > 0) {
      recommendations.push(
        `Slow network request detected: ${slowNetworkRequests[0].url} (${slowNetworkRequests[0].duration}ms)`
      );
    }
    
    // Check memory usage
    const latestMemory = this.memoryUsage[this.memoryUsage.length - 1];
    if (latestMemory && latestMemory.used > 150) {
      recommendations.push(`High memory usage: ${latestMemory.used}MB - consider optimizing data structures`);
    }
    
    // Check for errors
    const errorCount = this.metrics.filter(m => 
      m.metadata && m.metadata.error
    ).length;
    
    if (errorCount > 0) {
      recommendations.push(`${errorCount} errors detected - check error logs`);
    }
    
    return recommendations;
  }

  // Performance Utilities
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  getAverageTimeByName(name: string): number {
    const metrics = this.getMetricsByName(name).filter(m => m.duration !== undefined);
    if (metrics.length === 0) return 0;
    
    const totalTime = metrics.reduce((sum, metric) => sum + (metric.duration || 0), 0);
    return totalTime / metrics.length;
  }

  clearMetrics(): void {
    this.metrics = [];
    this.networkMetrics = [];
    this.renderMetrics.clear();
    this.memoryUsage = [];
    logger.debug('Performance metrics cleared');
  }

  // Debug Logging
  logPerformanceSummary(): void {
    logger.debug('=== Performance Summary ===');
    logger.debug(`App running for: ${Date.now() - this.appStartTime}ms`);
    logger.debug(`Total metrics: ${this.metrics.length}`);
    logger.debug(`Network requests: ${this.networkMetrics.length}`);
    logger.debug(`Tracked components: ${this.renderMetrics.size}`);
    logger.debug(`Memory readings: ${this.memoryUsage.length}`);
    
    const slowestOps = this.getSlowestOperations(5);
    if (slowestOps.length > 0) {
      logger.debug('\nSlowest operations:');
      slowestOps.forEach((op, index) => {
        logger.debug(`${index + 1}. ${op.name}: ${op.duration}ms`);
      });
    }
    
    const recommendations = this.generateRecommendations();
    if (recommendations.length > 0) {
      logger.debug('\nRecommendations:');
      recommendations.forEach((rec, index) => {
        logger.debug(`${index + 1}. ${rec}`);
      });
    }
  }
}

// React Hook for Performance Monitoring
export const usePerformanceMonitor = () => {
  const monitor = PerformanceMonitor.getInstance();
  
  const measureRender = (componentName: string) => {
    const startTime = Date.now();
    
    return () => {
      const renderTime = Date.now() - startTime;
      monitor.trackRender(componentName, renderTime);
    };
  };
  
  const measureOperation = (operationName: string) => {
    return {
      start: () => monitor.startTimer(operationName),
      end: (name: string) => monitor.endTimer(name),
      measureAsync: <T>(fn: () => Promise<T>) => monitor.measureAsync(operationName, fn),
      measureSync: <T>(fn: () => T) => monitor.measureSync(operationName, fn),
    };
  };
  
  return {
    measureRender,
    measureOperation,
    generateReport: () => monitor.generateReport(),
    clearMetrics: () => monitor.clearMetrics(),
  };
};

export default PerformanceMonitor;
