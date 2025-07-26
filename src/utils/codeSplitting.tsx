import React, { Suspense, lazy, ComponentType } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { ErrorBoundary } from '../../components/ui/ErrorBoundary';
import { performanceMonitor } from './performance';

// Loading component for code splitting
const LoadingFallback: React.FC<{ name?: string }> = ({
  name = 'Component',
}) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#3b82f6" />
    <Text style={styles.loadingText}>Loading {name}...</Text>
  </View>
);

// Error fallback for code splitting
const ErrorFallback: React.FC<{
  error?: Error;
  name?: string;
  onRetry?: () => void;
}> = ({ error, name = 'Component', onRetry }) => (
  <View style={styles.errorContainer}>
    <Text style={styles.errorTitle}>Failed to load {name}</Text>
    <Text style={styles.errorMessage}>
      {error?.message || 'Unknown error occurred'}
    </Text>
    {onRetry && (
      <Text style={styles.retryButton} onPress={onRetry}>
        Tap to retry
      </Text>
    )}
  </View>
);

// Higher-order component for lazy loading with performance tracking
export function withLazyLoading<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  componentName: string,
  options?: {
    fallback?: React.ComponentType;
    errorFallback?: React.ComponentType<{
      error?: Error;
      onRetry?: () => void;
    }>;
    preload?: boolean;
    priority?: 'high' | 'normal' | 'low';
  },
) {
  // Track loading performance
  const trackLoadingPerformance = (loadTime: number, success: boolean) => {
    performanceMonitor.trackCustomMetric(
      'code-splitting-load-time',
      loadTime,
      { good: 500, needsImprovement: 1000 },
      {
        component: componentName,
        success,
        priority: options?.priority || 'normal',
      },
    );
  };

  // Enhanced import function with performance tracking
  const enhancedImportFn = async () => {
    const startTime = Date.now();

    try {
      const module = await importFn();
      const loadTime = Date.now() - startTime;
      trackLoadingPerformance(loadTime, true);
      return module;
    } catch (error) {
      const loadTime = Date.now() - startTime;
      trackLoadingPerformance(loadTime, false);

      // Track error
      performanceMonitor.trackCustomMetric(
        'code-splitting-error',
        1,
        { good: 0, needsImprovement: 0.05 },
        {
          component: componentName,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      );

      throw error;
    }
  };

  const LazyComponent = lazy(enhancedImportFn);

  const WrappedComponent: React.FC<T> = (props) => {
    const [retryKey, setRetryKey] = React.useState(0);

    const handleRetry = React.useCallback(() => {
      setRetryKey((prev) => prev + 1);
    }, []);

    const FallbackComponent =
      options?.fallback || (() => <LoadingFallback name={componentName} />);
    const ErrorFallbackComponent =
      options?.errorFallback ||
      ((errorProps: any) => (
        <ErrorFallback
          {...errorProps}
          name={componentName}
          onRetry={handleRetry}
        />
      ));

    return (
      <ErrorBoundary
        fallback={(error) => (
          <ErrorFallbackComponent error={error} onRetry={handleRetry} />
        )}
        onError={(error) => {
          console.error(
            `Error in lazy-loaded component ${componentName}:`,
            error,
          );
        }}
      >
        <Suspense fallback={<FallbackComponent />} key={retryKey}>
          <LazyComponent {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `LazyLoaded(${componentName})`;

  // Preload if specified
  if (options?.preload) {
    // Preload after a short delay to not block initial render
    setTimeout(
      () => {
        enhancedImportFn().catch(() => {
          // Ignore preload errors
        });
      },
      options.priority === 'high' ? 100 : 1000,
    );
  }

  // Attach preload method
  (WrappedComponent as any).preload = enhancedImportFn;

  return WrappedComponent;
}

// Route-based lazy loading for Expo Router
export const createLazyRoute = (
  importFn: () => Promise<{ default: ComponentType<any> }>,
  routeName: string,
) => {
  return withLazyLoading(importFn, routeName, {
    priority: 'high',
    preload: false,
  });
};

// Component-based lazy loading for heavy features
export const createLazyComponent = (
  importFn: () => Promise<{ default: ComponentType<any> }>,
  componentName: string,
  priority: 'high' | 'normal' | 'low' = 'normal',
) => {
  return withLazyLoading(importFn, componentName, {
    priority,
    preload: priority === 'high',
  });
};

// Preloader utility for critical resources
export class ResourcePreloader {
  private static preloadPromises = new Map<string, Promise<any>>();

  static preloadComponent<T>(
    key: string,
    importFn: () => Promise<{ default: ComponentType<T> }>,
  ): Promise<{ default: ComponentType<T> }> {
    if (!this.preloadPromises.has(key)) {
      const promise = importFn().catch((error) => {
        // Remove failed preload from cache
        this.preloadPromises.delete(key);
        throw error;
      });

      this.preloadPromises.set(key, promise);
    }

    return this.preloadPromises.get(key)!;
  }

  static preloadImage(url: string): Promise<void> {
    if (!this.preloadPromises.has(`image:${url}`)) {
      const promise = new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });

      this.preloadPromises.set(`image:${url}`, promise);
    }

    return this.preloadPromises.get(`image:${url}`)!;
  }

  static preloadFont(fontFamily: string, url: string): Promise<void> {
    if (!this.preloadPromises.has(`font:${fontFamily}`)) {
      const promise = new Promise<void>((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
        link.href = url;
        link.onload = () => resolve();
        link.onerror = reject;

        document.head.appendChild(link);
      });

      this.preloadPromises.set(`font:${fontFamily}`, promise);
    }

    return this.preloadPromises.get(`font:${fontFamily}`)!;
  }

  static clearCache() {
    this.preloadPromises.clear();
  }

  static getCacheStats() {
    return {
      cachedResources: this.preloadPromises.size,
      resources: Array.from(this.preloadPromises.keys()),
    };
  }
}

// Hook for managing component loading states
export function useComponentLoader() {
  const [loadingComponents, setLoadingComponents] = React.useState<Set<string>>(
    new Set(),
  );
  const [errors, setErrors] = React.useState<Map<string, Error>>(new Map());

  const startLoading = React.useCallback((componentName: string) => {
    setLoadingComponents((prev) => new Set([...prev, componentName]));
    setErrors((prev) => {
      const newErrors = new Map(prev);
      newErrors.delete(componentName);
      return newErrors;
    });
  }, []);

  const finishLoading = React.useCallback(
    (componentName: string, error?: Error) => {
      setLoadingComponents((prev) => {
        const newSet = new Set(prev);
        newSet.delete(componentName);
        return newSet;
      });

      if (error) {
        setErrors((prev) => new Map([...prev, [componentName, error]]));
      }
    },
    [],
  );

  const isLoading = React.useCallback(
    (componentName: string) => {
      return loadingComponents.has(componentName);
    },
    [loadingComponents],
  );

  const getError = React.useCallback(
    (componentName: string) => {
      return errors.get(componentName);
    },
    [errors],
  );

  const retry = React.useCallback((componentName: string) => {
    setErrors((prev) => {
      const newErrors = new Map(prev);
      newErrors.delete(componentName);
      return newErrors;
    });
  }, []);

  return {
    startLoading,
    finishLoading,
    isLoading,
    getError,
    retry,
    loadingComponents: Array.from(loadingComponents),
    errorCount: errors.size,
  };
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default withLazyLoading;
