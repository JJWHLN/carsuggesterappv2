import React from 'react';
import { Platform } from 'react-native';

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface PerformanceReport {
  metrics: PerformanceMetric[];
  deviceInfo: {
    platform: string;
    version?: string;
    memory?: number;
  };
  appInfo: {
    version: string;
    buildId: string;
  };
}

class ReactNativePerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private isInitialized = false;
  private appStartTime: number;

  constructor() {
    this.appStartTime = Date.now();
    this.init();
  }

  private init() {
    if (this.isInitialized) return;
    this.isInitialized = true;
    
    this.trackAppStartTime();
    this.trackMemoryUsage();
    this.setupInteractionTracking();
  }

  private trackAppStartTime() {
    // Track app startup time
    const startupTime = Date.now() - this.appStartTime;
    this.addMetric({
      name: 'app-startup-time',
      value: startupTime,
      rating: startupTime < 2000 ? 'good' : startupTime < 4000 ? 'needs-improvement' : 'poor',
      timestamp: Date.now(),
      metadata: { platform: Platform.OS }
    });
  }

  private trackMemoryUsage() {
    // Track memory usage periodically
    const checkMemory = () => {
      if (Platform.OS === 'web' && 'memory' in performance) {
        const memInfo = (performance as any).memory;
        if (memInfo) {
          const usedMemory = memInfo.usedJSHeapSize / 1024 / 1024; // MB
          this.addMetric({
            name: 'memory-usage',
            value: usedMemory,
            rating: usedMemory < 50 ? 'good' : usedMemory < 100 ? 'needs-improvement' : 'poor',
            timestamp: Date.now(),
            metadata: { 
              total: memInfo.totalJSHeapSize / 1024 / 1024,
              limit: memInfo.jsHeapSizeLimit / 1024 / 1024
            }
          });
        }
      }
    };

    // Check memory every 30 seconds
    setInterval(checkMemory, 30000);
    checkMemory(); // Initial check
  }

  private setupInteractionTracking() {
    // Track user interactions and response times
    let interactionStart: number | null = null;

    const trackInteraction = (interactionType: string) => {
      if (interactionStart) {
        const responseTime = Date.now() - interactionStart;
        this.addMetric({
          name: 'interaction-response-time',
          value: responseTime,
          rating: responseTime < 100 ? 'good' : responseTime < 300 ? 'needs-improvement' : 'poor',
          timestamp: Date.now(),
          metadata: { type: interactionType }
        });
      }
      interactionStart = Date.now();
    };

    // Export for use in components
    (global as any).__trackInteraction = trackInteraction;
  }

  private addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
    
    // Log critical metrics in development
    if (__DEV__ && metric.rating === 'poor') {
      console.warn(`⚠️ Performance Issue: ${metric.name} = ${metric.value}ms`, metric.metadata);
    }
  }

  // Public methods
  public trackCustomMetric(
    name: string, 
    value: number, 
    thresholds?: { good: number; needsImprovement: number },
    metadata?: Record<string, any>
  ) {
    const defaultThresholds = { good: 100, needsImprovement: 200 };
    const { good, needsImprovement } = { ...defaultThresholds, ...thresholds };
    
    const rating = 
      value <= good ? 'good' :
      value <= needsImprovement ? 'needs-improvement' : 'poor';

    this.addMetric({
      name,
      value,
      rating,
      timestamp: Date.now(),
      metadata
    });
  }

  public trackRenderTime(componentName: string, renderTime: number) {
    this.trackCustomMetric(
      `render-${componentName}`,
      renderTime,
      { good: 16, needsImprovement: 32 },
      { component: componentName, target: '60fps' }
    );
  }

  public trackNavigationTime(routeName: string, navigationTime: number) {
    this.trackCustomMetric(
      'navigation-time',
      navigationTime,
      { good: 300, needsImprovement: 600 },
      { route: routeName }
    );
  }

  public trackAPICall(endpoint: string, duration: number, success: boolean) {
    this.trackCustomMetric(
      'api-call-duration',
      duration,
      { good: 500, needsImprovement: 1000 },
      { endpoint, success }
    );
  }

  public trackImageLoad(source: string, loadTime: number, size?: number) {
    this.trackCustomMetric(
      'image-load-time',
      loadTime,
      { good: 500, needsImprovement: 1000 },
      { source, size }
    );
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  public getReport(): PerformanceReport {
    return {
      metrics: this.getMetrics(),
      deviceInfo: {
        platform: Platform.OS,
        version: Platform.Version?.toString(),
        memory: (global as any).performance?.memory?.usedJSHeapSize
      },
      appInfo: {
        version: '1.0.0',
        buildId: __DEV__ ? 'development' : 'production'
      }
    };
  }

  public clearMetrics() {
    this.metrics = [];
  }

  public getAverageMetric(name: string): number | null {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return null;
    
    return metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
  }
}

// Singleton instance
export const performanceMonitor = new ReactNativePerformanceMonitor();

// React Hook for performance monitoring
export function usePerformanceMonitor() {
  const trackMetric = React.useCallback((
    name: string, 
    value: number, 
    thresholds?: { good: number; needsImprovement: number },
    metadata?: Record<string, any>
  ) => {
    performanceMonitor.trackCustomMetric(name, value, thresholds, metadata);
  }, []);

  const trackRender = React.useCallback((componentName: string, renderTime: number) => {
    performanceMonitor.trackRenderTime(componentName, renderTime);
  }, []);

  const trackNavigation = React.useCallback((routeName: string, navigationTime: number) => {
    performanceMonitor.trackNavigationTime(routeName, navigationTime);
  }, []);

  const trackAPI = React.useCallback((endpoint: string, duration: number, success: boolean) => {
    performanceMonitor.trackAPICall(endpoint, duration, success);
  }, []);

  const trackImage = React.useCallback((source: string, loadTime: number, size?: number) => {
    performanceMonitor.trackImageLoad(source, loadTime, size);
  }, []);

  const getMetrics = React.useCallback(() => performanceMonitor.getMetrics(), []);
  const getReport = React.useCallback(() => performanceMonitor.getReport(), []);
  const getAverage = React.useCallback((name: string) => performanceMonitor.getAverageMetric(name), []);

  return {
    trackMetric,
    trackRender,
    trackNavigation,
    trackAPI,
    trackImage,
    getMetrics,
    getReport,
    getAverage
  };
}

// Higher-order component for automatic performance tracking
export function withPerformanceTracking<T extends object>(
  Component: React.ComponentType<T>,
  componentName: string
) {
  const WrappedComponent = React.memo<T>((props) => {
    const startTime = React.useRef<number>();
    const { trackRender } = usePerformanceMonitor();
    
    React.useEffect(() => {
      startTime.current = Date.now();
    });

    React.useEffect(() => {
      return () => {
        if (startTime.current) {
          const renderTime = Date.now() - startTime.current;
          trackRender(componentName, renderTime);
        }
      };
    });

    return React.createElement(Component, props);
  });

  WrappedComponent.displayName = `withPerformanceTracking(${componentName})`;
  return WrappedComponent;
}

// Hook for tracking component render performance
export function useRenderTracking(componentName: string) {
  const { trackRender } = usePerformanceMonitor();
  const renderStart = React.useRef<number>();

  React.useEffect(() => {
    renderStart.current = Date.now();
  });

  React.useEffect(() => {
    if (renderStart.current) {
      const renderTime = Date.now() - renderStart.current;
      trackRender(componentName, renderTime);
    }
  });
}

export default performanceMonitor;
