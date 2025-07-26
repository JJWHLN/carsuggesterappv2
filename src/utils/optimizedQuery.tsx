import React from 'react';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useInfiniteQuery,
} from '@tanstack/react-query';
import { focusManager, onlineManager } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { performanceMonitor } from '../src/utils/performance';

// Configure React Query for optimal performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time - data is fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time - data stays in cache for 30 minutes
      cacheTime: 30 * 60 * 1000,
      // Retry failed requests 3 times with exponential backoff
      retry: (failureCount, error: any) => {
        if (error?.status === 404 || error?.status === 401) {
          return false; // Don't retry for these errors
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on window focus (when app comes to foreground)
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect by default (we'll handle this manually)
      refetchOnReconnect: false,
      // Background refetch interval (30 minutes)
      refetchInterval: 30 * 60 * 1000,
      // Only refetch in background if data is stale
      refetchIntervalInBackground: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Setup network status monitoring
const setupNetworkStatusMonitoring = () => {
  if (Platform.OS !== 'web') {
    onlineManager.setEventListener((setOnline) => {
      return NetInfo.addEventListener((state) => {
        setOnline(!!state.isConnected);
      });
    });
  }
};

// Setup app state monitoring for React Native
const setupAppStateMonitoring = () => {
  if (Platform.OS !== 'web') {
    focusManager.setEventListener((handleFocus) => {
      const subscription = AppState.addEventListener('change', (state) => {
        handleFocus(state === 'active');
      });

      return () => subscription?.remove();
    });
  }
};

// Performance monitoring for queries
const addPerformanceMonitoring = () => {
  queryClient.getQueryCache().subscribe((event) => {
    if (event?.query && event.type === 'observerResult') {
      const query = event.query;
      const queryKey = JSON.stringify(query.queryKey);

      // Track successful queries
      if (query.state.status === 'success' && query.state.dataUpdatedAt) {
        const fetchTime = Date.now() - query.state.dataUpdatedAt;
        performanceMonitor.trackCustomMetric(
          'query-fetch-time',
          fetchTime,
          { good: 500, needsImprovement: 1000 },
          {
            queryKey,
            cacheStatus: query.state.fetchStatus,
            dataSize: JSON.stringify(query.state.data).length,
          },
        );
      }

      // Track failed queries
      if (query.state.status === 'error') {
        performanceMonitor.trackCustomMetric(
          'query-error-rate',
          1,
          { good: 0, needsImprovement: 0.05 },
          {
            queryKey,
            error: query.state.error?.message || 'Unknown error',
            retryCount: query.state.failureCount,
          },
        );
      }
    }
  });
};

// Initialize performance optimizations
export const initializeReactQuery = () => {
  setupNetworkStatusMonitoring();
  setupAppStateMonitoring();
  addPerformanceMonitoring();
};

// Optimized query hook with performance tracking
export function useOptimizedQuery<TData = unknown, TError = unknown>(
  queryKey: any[],
  queryFn: () => Promise<TData>,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    refetchOnMount?: boolean;
    refetchOnWindowFocus?: boolean;
    select?: (data: TData) => any;
    placeholderData?: TData;
    keepPreviousData?: boolean;
    priority?: 'high' | 'normal' | 'low';
  },
) {
  const startTime = React.useRef<number>();

  const optimizedOptions = React.useMemo(() => {
    const baseOptions = {
      staleTime: options?.priority === 'high' ? 2 * 60 * 1000 : 5 * 60 * 1000,
      cacheTime: options?.priority === 'high' ? 60 * 60 * 1000 : 30 * 60 * 1000,
      ...options,
    };

    return {
      ...baseOptions,
      onMutate: () => {
        startTime.current = Date.now();
      },
      onSettled: () => {
        if (startTime.current) {
          const queryTime = Date.now() - startTime.current;
          performanceMonitor.trackCustomMetric(
            'optimized-query-time',
            queryTime,
            { good: 300, needsImprovement: 600 },
            {
              queryKey: JSON.stringify(queryKey),
              priority: options?.priority || 'normal',
            },
          );
        }
      },
    };
  }, [options, queryKey]);

  return useQuery(queryKey, queryFn, optimizedOptions);
}

// Optimized infinite query for large lists
export function useOptimizedInfiniteQuery<TData = unknown, TError = unknown>(
  queryKey: any[],
  queryFn: ({ pageParam }: { pageParam?: any }) => Promise<TData>,
  options?: {
    getNextPageParam?: (lastPage: TData, allPages: TData[]) => any;
    enabled?: boolean;
    staleTime?: number;
    cacheTime?: number;
    keepPreviousData?: boolean;
    refetchOnMount?: boolean;
    pageSize?: number;
  },
) {
  return useInfiniteQuery(queryKey, queryFn, {
    staleTime: 10 * 60 * 1000, // 10 minutes for infinite queries
    cacheTime: 60 * 60 * 1000, // 1 hour cache time
    keepPreviousData: true,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    ...options,
    getNextPageParam: options?.getNextPageParam || (() => undefined),
  });
}

// Optimized mutation hook
export function useOptimizedMutation<
  TData = unknown,
  TError = unknown,
  TVariables = void,
>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: TError, variables: TVariables) => void;
    onSettled?: (
      data: TData | undefined,
      error: TError | null,
      variables: TVariables,
    ) => void;
    optimisticUpdate?: boolean;
    invalidateQueries?: any[][];
  },
) {
  const startTime = React.useRef<number>();

  return useMutation(mutationFn, {
    ...options,
    onMutate: (variables) => {
      startTime.current = Date.now();
      return options?.onSuccess ? variables : undefined;
    },
    onSuccess: (data, variables, context) => {
      // Track mutation performance
      if (startTime.current) {
        const mutationTime = Date.now() - startTime.current;
        performanceMonitor.trackCustomMetric(
          'mutation-time',
          mutationTime,
          { good: 500, needsImprovement: 1000 },
          {
            success: true,
            optimistic: options?.optimisticUpdate || false,
          },
        );
      }

      // Invalidate specified queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries(queryKey);
        });
      }

      options?.onSuccess?.(data, variables);
    },
    onError: (error, variables, context) => {
      // Track mutation errors
      if (startTime.current) {
        const mutationTime = Date.now() - startTime.current;
        performanceMonitor.trackCustomMetric(
          'mutation-error',
          mutationTime,
          { good: 0, needsImprovement: 0.05 },
          {
            error: error instanceof Error ? error.message : 'Unknown error',
            optimistic: options?.optimisticUpdate || false,
          },
        );
      }

      options?.onError?.(error, variables);
    },
    onSettled: options?.onSettled,
  });
}

// Query client provider with performance monitoring
export const OptimizedQueryProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  React.useEffect(() => {
    initializeReactQuery();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Cache management utilities
export const cacheUtils = {
  // Clear all cached data
  clearCache: () => {
    queryClient.clear();
  },

  // Remove specific query from cache
  removeQuery: (queryKey: any[]) => {
    queryClient.removeQueries(queryKey);
  },

  // Prefetch data
  prefetchQuery: async function <TData>(
    queryKey: any[],
    queryFn: () => Promise<TData>,
    staleTime: number = 5 * 60 * 1000,
  ) {
    return queryClient.prefetchQuery(queryKey, queryFn, { staleTime });
  },

  // Set query data manually
  setQueryData: function <TData>(queryKey: any[], data: TData) {
    queryClient.setQueryData(queryKey, data);
  },

  // Get cache stats
  getCacheStats: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    return {
      totalQueries: queries.length,
      activeQueries: queries.filter((q) => q.getObserversCount() > 0).length,
      staleQueries: queries.filter((q) => q.isStale()).length,
      cacheSize: JSON.stringify(
        queries.reduce(
          (acc, q) => ({ ...acc, [JSON.stringify(q.queryKey)]: q.state.data }),
          {},
        ),
      ).length,
    };
  },
};

export { queryClient };
export default OptimizedQueryProvider;
