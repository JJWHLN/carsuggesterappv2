/**
 * 🚀 Advanced Lazy Loading System
 * Optimized code splitting with preloading and error boundaries
 * Consolidated styling approach using React Native StyleSheet
 */

import React, { Suspense, ComponentType, lazy } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/Colors';

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
      return React.createElement(FallbackComponent);
    }

    return this.props.children;
  }
}

// Performance-optimized loading component using consolidated styling
const DefaultLoadingComponent = React.memo(() =>
  React.createElement(
    View,
    { style: styles.loadingCenter },
    React.createElement(ActivityIndicator, {
      size: 'large',
      color: Colors.light.primary,
    }),
  ),
);

const DefaultErrorComponent = React.memo(() =>
  React.createElement(
    View,
    { style: styles.errorCenter },
    // Error UI would go here
  ),
);

/**
 * Creates a lazy-loaded component with advanced optimization features
 */
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {},
) => {
  const LazyComponent = lazy(importFn);

  const LazyWrapper = React.memo((props: React.ComponentProps<T>) => {
    const FallbackComponent = options.fallback || DefaultLoadingComponent;

    const content = React.createElement(
      Suspense,
      {
        fallback: React.createElement(FallbackComponent),
      },
      React.createElement(LazyComponent, props),
    );

    if (options.errorBoundary !== false) {
      return React.createElement(
        LazyErrorBoundary,
        {
          fallback: options.fallback,
        },
        content,
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
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
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

// Consolidated styles using React Native StyleSheet
const styles = StyleSheet.create({
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  errorCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    padding: 24,
  },
});
