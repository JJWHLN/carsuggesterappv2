import { useEffect, useRef, useState } from 'react';
import { Analytics } from '@/services/analyticsService';

/**
 * Hook to track component render performance
 */
export function usePerformanceTracking(componentName: string) {
  const mountTimeRef = useRef<number>();
  const renderCountRef = useRef(0);
  const [isTracking, setIsTracking] = useState(true);

  useEffect(() => {
    if (!isTracking) return;

    // Track mount time
    mountTimeRef.current = Date.now();
    
    return () => {
      // Track unmount and calculate total mounted time
      if (mountTimeRef.current) {
        const mountedDuration = Date.now() - mountTimeRef.current;
        Analytics.trackPerformance(
          `${componentName}_mounted_duration`,
          mountedDuration,
          'ms',
          { 
            component: componentName,
            render_count: renderCountRef.current 
          }
        );
      }
    };
  }, [componentName, isTracking]);

  useEffect(() => {
    if (!isTracking) return;
    
    renderCountRef.current += 1;
    
    // Track excessive re-renders
    if (renderCountRef.current > 10) {
      Analytics.track('excessive_rerenders', {
        component: componentName,
        render_count: renderCountRef.current,
      });
    }
  });

  const trackUserInteraction = (action: string, properties?: Record<string, any>) => {
    Analytics.trackUserAction(action, componentName, {
      ...properties,
      render_count: renderCountRef.current,
    });
  };

  const trackLoadingTime = (duration: number) => {
    Analytics.trackLoadingTime(componentName, duration);
  };

  const stopTracking = () => {
    setIsTracking(false);
  };

  return {
    trackUserInteraction,
    trackLoadingTime,
    stopTracking,
    renderCount: renderCountRef.current,
  };
}

/**
 * Hook to track API call performance
 */
export function useApiPerformanceTracking() {
  const trackApiCall = async <T>(
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const startTime = Date.now();
    let success = false;
    let statusCode: number | undefined;

    try {
      const result = await apiCall();
      success = true;
      statusCode = 200; // Assume success if no error
      return result;
    } catch (error) {
      success = false;
      statusCode = error instanceof Error && 'status' in error ? (error as any).status : undefined;
      throw error;
    } finally {
      const duration = Date.now() - startTime;
      Analytics.trackApiCall(endpoint, duration, success, statusCode);
    }
  };

  return { trackApiCall };
}

/**
 * Hook to track search performance
 */
export function useSearchTracking() {
  const trackSearch = (query: string, results: number, searchType: 'basic' | 'ai' = 'basic') => {
    Analytics.trackSearch(query, results, searchType);
  };

  const trackSearchError = (query: string, error: Error, searchType: 'basic' | 'ai' = 'basic') => {
    Analytics.trackError(error, {
      context: 'search',
      query,
      search_type: searchType,
    });
  };

  const trackSearchPerformance = (query: string, duration: number, searchType: 'basic' | 'ai' = 'basic') => {
    Analytics.trackPerformance(
      `${searchType}_search_duration`,
      duration,
      'ms',
      {
        query_length: query.length,
        search_type: searchType,
      }
    );
  };

  return {
    trackSearch,
    trackSearchError,
    trackSearchPerformance,
  };
}

/**
 * Hook to track navigation performance
 */
export function useNavigationTracking() {
  const trackScreenView = (screenName: string, properties?: Record<string, any>) => {
    Analytics.trackScreenView(screenName, properties);
  };

  const trackNavigation = (from: string, to: string, duration?: number) => {
    Analytics.track('navigation', {
      from_screen: from,
      to_screen: to,
      duration,
    });

    if (duration) {
      Analytics.trackPerformance('navigation_duration', duration, 'ms', {
        from_screen: from,
        to_screen: to,
      });
    }
  };

  return {
    trackScreenView,
    trackNavigation,
  };
}

/**
 * Hook to track memory usage (simplified)
 */
export function useMemoryTracking(componentName: string, interval: number = 30000) {
  useEffect(() => {
    if (!__DEV__) return; // Only track in development

    const trackMemory = () => {
      // In React Native, we can't directly access memory usage like in browsers
      // This is a placeholder for when you have access to native memory metrics
      const memoryInfo = {
        timestamp: Date.now(),
        component: componentName,
      };

      Analytics.track('memory_usage', memoryInfo);
    };

    const intervalId = setInterval(trackMemory, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [componentName, interval]);
}

/**
 * Hook to track user engagement
 */
export function useEngagementTracking(screenName: string) {
  const startTimeRef = useRef<number>();
  const interactionCountRef = useRef(0);

  useEffect(() => {
    startTimeRef.current = Date.now();

    return () => {
      if (startTimeRef.current) {
        const timeSpent = Date.now() - startTimeRef.current;
        Analytics.track('screen_engagement', {
          screen_name: screenName,
          time_spent: timeSpent,
          interaction_count: interactionCountRef.current,
        });
      }
    };
  }, [screenName]);

  const trackInteraction = (interactionType: string, properties?: Record<string, any>) => {
    interactionCountRef.current += 1;
    Analytics.trackUserAction(interactionType, screenName, {
      ...properties,
      interaction_count: interactionCountRef.current,
    });
  };

  return { trackInteraction };
}
