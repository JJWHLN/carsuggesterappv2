/**
 * 🚀 Advanced Lazy Loading System
 * Optimized code splitting with preloading and error boundaries
 */

import React, { Suspense, ComponentType, lazy } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

interface LazyLoadOptions {
  fallback?: React.ComponentType;
  preload?: boolean;
  chunkName?: string;
  errorBoundary?: boolean;
}

interface LazyComponentState {
  hasError: boolean;
  error?: Error;
}

// Error boundary for lazy components
class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType },
  LazyComponentState
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): LazyComponentState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorComponent;
      return <FallbackComponent />;
    }

    return this.props.children;
  }
}

// Performance-optimized loading component
const DefaultLoadingComponent = React.memo(() => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#48cc6c" />
  </View>
));

const DefaultErrorComponent = React.memo(() => (
  <View style={styles.errorContainer}>{/* Error UI would go here */}</View>
));

/**
 * Creates a lazy-loaded component with advanced optimization features
 */
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {},
): React.ComponentType<React.ComponentProps<T>> => {
  const LazyComponent = lazy(importFn);

  const LazyWrapper = React.memo((props: React.ComponentProps<T>) => {
    const FallbackComponent = options.fallback || DefaultLoadingComponent;

    const content = (
      <Suspense fallback={<FallbackComponent />}>
        <LazyComponent {...props} />
      </Suspense>
    );

    if (options.errorBoundary !== false) {
      return (
        <LazyErrorBoundary fallback={options.fallback}>
          {content}
        </LazyErrorBoundary>
      );
    }

    return content;
  });

  // Set display name for debugging
  LazyWrapper.displayName = `Lazy(${options.chunkName || 'Component'})`;

  return LazyWrapper;
};

/**
 * Preload a component to improve perceived performance
 */
export const preloadComponent = (importFn: () => Promise<any>, delay = 100) => {
  // Use requestIdleCallback if available, otherwise setTimeout
  const schedulePreload = (callback: () => void) => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(callback, { timeout: 2000 });
    } else {
      setTimeout(callback, delay);
    }
  };

  schedulePreload(() => {
    importFn().catch(() => {
      // Silently handle preload failures
    });
  });
};

/**
 * Batch preload multiple components
 */
export const preloadComponents = (
  importFns: Array<() => Promise<any>>,
  options: { delay?: number; concurrent?: number } = {},
) => {
  const { delay = 100, concurrent = 3 } = options;

  // Limit concurrent preloads to avoid overwhelming the network
  let index = 0;
  const loadNext = () => {
    if (index >= importFns.length) return;

    const batch = importFns.slice(index, index + concurrent);
    index += concurrent;

    Promise.all(batch.map((fn) => fn().catch(() => null))).then(() => {
      if (index < importFns.length) {
        setTimeout(loadNext, delay);
      }
    });
  };

  loadNext();
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
});
