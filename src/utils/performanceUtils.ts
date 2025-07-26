/**
 * ⚡ Performance Optimization Utilities
 * Advanced React optimization patterns and monitoring
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';

// ===== DEBOUNCING & THROTTLING =====

/**
 * Enhanced debounce with cancellation support
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {},
): T & { cancel: () => void; flush: () => void } => {
  const { leading = false, trailing = true } = options;
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  let result: ReturnType<T>;

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const flush = () => {
    if (timeoutId && lastArgs) {
      cancel();
      result = func(...lastArgs);
    }
    return result;
  };

  const debounced = (...args: Parameters<T>): ReturnType<T> => {
    lastArgs = args;

    if (leading && !timeoutId) {
      result = func(...args);
    }

    cancel();

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (trailing) {
        result = func(...args);
      }
    }, delay);

    return result;
  };

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced as T & { cancel: () => void; flush: () => void };
};

/**
 * Throttle function with options
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = {},
): T & { cancel: () => void } => {
  const { leading = true, trailing = true } = options;
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCallTime = 0;

  const cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const throttled = (...args: Parameters<T>): ReturnType<T> => {
    const now = Date.now();
    lastArgs = args;

    if (!lastCallTime && !leading) {
      lastCallTime = now;
    }

    const remaining = delay - (now - lastCallTime);

    if (remaining <= 0 || remaining > delay) {
      if (timeoutId) {
        cancel();
      }
      lastCallTime = now;
      return func(...args);
    } else if (!timeoutId && trailing) {
      timeoutId = setTimeout(() => {
        lastCallTime = leading ? 0 : Date.now();
        timeoutId = null;
        if (lastArgs) {
          func(...lastArgs);
        }
      }, remaining);
    }

    return undefined as ReturnType<T>;
  };

  throttled.cancel = cancel;
  return throttled as T & { cancel: () => void };
};

// ===== REACT HOOKS OPTIMIZATIONS =====

/**
 * Optimized useCallback with dependency comparison
 */
export const useOptimizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
): T => {
  const depsRef = useRef<React.DependencyList>(deps);
  const callbackRef = useRef<T>(callback);

  // Deep comparison for complex dependencies
  const depsChanged = useMemo(() => {
    if (depsRef.current.length !== deps.length) return true;
    return deps.some((dep, index) => !Object.is(dep, depsRef.current[index]));
  }, deps);

  if (depsChanged) {
    depsRef.current = deps;
    callbackRef.current = callback;
  }

  return useCallback(callbackRef.current, deps);
};

/**
 * Memoized value with custom equality function
 */
export const useDeepMemo = <T>(
  factory: () => T,
  deps: React.DependencyList,
  equalityFn?: (a: T, b: T) => boolean,
): T => {
  const valueRef = useRef<T>();
  const depsRef = useRef<React.DependencyList>();

  const value = useMemo(() => {
    const newValue = factory();

    if (valueRef.current && equalityFn) {
      if (equalityFn(valueRef.current, newValue)) {
        return valueRef.current;
      }
    }

    valueRef.current = newValue;
    return newValue;
  }, deps);

  return value;
};

/**
 * useRef that doesn't cause re-renders
 */
export const useStableRef = <T>(value: T): React.MutableRefObject<T> => {
  const ref = useRef<T>(value);
  ref.current = value;
  return ref;
};

// ===== PERFORMANCE MONITORING =====

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: ((metric: PerformanceMetric) => void)[] = [];

  /**
   * Track a performance metric
   */
  track(name: string, value: number, tags?: Record<string, string>): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      tags,
    };

    this.metrics.push(metric);
    this.observers.forEach((observer) => observer(metric));

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  /**
   * Measure function execution time
   */
  measure<T extends (...args: any[]) => any>(
    name: string,
    fn: T,
    tags?: Record<string, string>,
  ): T {
    return ((...args: Parameters<T>) => {
      const start = performance.now();
      const result = fn(...args);
      const duration = performance.now() - start;

      this.track(name, duration, { ...tags, unit: 'ms' });

      return result;
    }) as T;
  }

  /**
   * Measure async function execution time
   */
  measureAsync<T extends (...args: any[]) => Promise<any>>(
    name: string,
    fn: T,
    tags?: Record<string, string>,
  ): T {
    return (async (...args: Parameters<T>) => {
      const start = performance.now();
      const result = await fn(...args);
      const duration = performance.now() - start;

      this.track(name, duration, { ...tags, unit: 'ms' });

      return result;
    }) as T;
  }

  /**
   * Get metrics by name
   */
  getMetrics(name?: string): PerformanceMetric[] {
    if (!name) return [...this.metrics];
    return this.metrics.filter((metric) => metric.name === name);
  }

  /**
   * Subscribe to metric updates
   */
  subscribe(observer: (metric: PerformanceMetric) => void): () => void {
    this.observers.push(observer);
    return () => {
      const index = this.observers.indexOf(observer);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Hook to track component render performance
 */
export const useRenderPerformance = (componentName: string): void => {
  const renderCount = useRef(0);
  const mountTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const renderTime = performance.now() - mountTime.current;

    performanceMonitor.track(`${componentName}.render`, renderTime, {
      renderCount: renderCount.current.toString(),
    });
  });
};

// ===== MEMORY OPTIMIZATION =====

/**
 * WeakMap-based memoization for object keys
 */
export const createObjectMemo = <K extends object, V>(): {
  get: (key: K) => V | undefined;
  set: (key: K, value: V) => void;
  has: (key: K) => boolean;
  delete: (key: K) => boolean;
} => {
  const cache = new WeakMap<K, V>();

  return {
    get: (key: K) => cache.get(key),
    set: (key: K, value: V) => cache.set(key, value),
    has: (key: K) => cache.has(key),
    delete: (key: K) => cache.delete(key),
  };
};

/**
 * LRU Cache implementation
 */
export class LRUCache<K, V> {
  private maxSize: number;
  private cache = new Map<K, V>();

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}
