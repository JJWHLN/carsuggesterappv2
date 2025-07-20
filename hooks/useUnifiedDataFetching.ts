import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiError } from '@/services/api';

/**
 * Unified data fetching hook that combines:
 * - Basic API calls (useApi)
 * - Pagination (useDataFetching)
 * - Infinite scrolling (useInfiniteScroll)
 * - Search functionality
 * - Error handling
 * - Loading states
 */

export interface UnifiedDataFetchingOptions<T> {
  // Basic options
  initialLoad?: boolean;
  enabled?: boolean;
  
  // Pagination options
  pageSize?: number;
  enablePagination?: boolean;
  enableInfiniteScroll?: boolean;
  
  // Search options
  enableSearch?: boolean;
  searchDebounceMs?: number;
  
  // Data transformation
  transformData?: (data: any) => T;
  
  // Initial data
  initialData?: T[];
}

export interface UnifiedDataFetchingReturn<T> {
  // Data state
  data: T | T[] | null;
  loading: boolean;
  error: string | null;
  
  // Pagination state
  hasMore: boolean;
  loadingMore: boolean;
  page: number;
  
  // Refresh state
  refreshing: boolean;
  
  // Search state
  searchQuery: string;
  searchLoading: boolean;
  
  // Actions
  refresh: () => void;
  loadMore: () => void;
  retry: () => void;
  refetch: () => void;
  search: (query: string) => void;
  clearSearch: () => void;
}

export function useUnifiedDataFetching<T>(
  fetchFunction: (...args: any[]) => Promise<T | T[]>,
  dependencies: any[] = [],
  options: UnifiedDataFetchingOptions<T> = {}
): UnifiedDataFetchingReturn<T> {
  const {
    initialLoad = true,
    enabled = true,
    pageSize = 10,
    enablePagination = false,
    enableInfiniteScroll = false,
    enableSearch = false,
    searchDebounceMs = 300,
    transformData,
    initialData = []
  } = options;

  // Core state
  const [data, setData] = useState<T | T[] | null>(
    enablePagination || enableInfiniteScroll ? initialData : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  
  // Refresh state
  const [refreshing, setRefreshing] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  
  // Refs for cleanup and optimization
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const initialLoadDoneRef = useRef(false);
  const loadingRef = useRef(false);

  // Debounced search
  useEffect(() => {
    if (!enableSearch) return;
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, searchDebounceMs);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchDebounceMs, enableSearch]);

  // Main data loading function
  const loadData = useCallback(async (
    reset = false,
    searchTerm?: string,
    pageNum?: number
  ) => {
    if (!enabled || loadingRef.current) return;
    
    // Handle abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Set loading states
    loadingRef.current = true;
    if (reset) {
      setLoading(true);
      setError(null);
      if (enablePagination || enableInfiniteScroll) {
        setPage(0);
      }
    } else if (enablePagination || enableInfiniteScroll) {
      setLoadingMore(true);
    }

    try {
      const currentPage = pageNum ?? (reset ? 0 : page);
      const query = searchTerm ?? (enableSearch ? debouncedSearchQuery : undefined);
      
      // Prepare function arguments based on hook type
      let args: any[] = [];
      if (enablePagination || enableInfiniteScroll) {
        args = [currentPage, pageSize];
        if (enableSearch && query) {
          args.push(query);
        }
      } else if (enableSearch && query) {
        args = [query];
      }
      
      const result = await fetchFunction(...args);
      
      // Handle abort
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      // Transform data if needed
      const processedResult = transformData ? transformData(result) : result;
      
      // Update data based on hook type
      if (enablePagination || enableInfiniteScroll) {
        const newData = Array.isArray(processedResult) ? processedResult : [processedResult];
        
        if (reset) {
          setData(newData);
        } else {
          setData(prev => {
            const prevArray = Array.isArray(prev) ? prev : [];
            // Remove duplicates if items have IDs
            const existingIds = new Set(prevArray.map((item: any) => item.id).filter(Boolean));
            const uniqueNewData = newData.filter((item: any) => 
              !item.id || !existingIds.has(item.id)
            );
            return [...prevArray, ...uniqueNewData];
          });
        }
        
        setHasMore(newData.length === pageSize);
        setPage(currentPage + 1);
      } else {
        setData(processedResult);
      }
      
    } catch (err) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      let errorMessage: string;
      if (err instanceof ApiError) {
        errorMessage = err.userFriendlyMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else {
        errorMessage = 'An unexpected error occurred';
      }
      
      setError(errorMessage);
      logger.error('Data fetching error:', err);
      
      if (reset && (enablePagination || enableInfiniteScroll)) {
        setData([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
      setSearchLoading(false);
      loadingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [
    fetchFunction, 
    enabled, 
    enablePagination, 
    enableInfiniteScroll, 
    enableSearch, 
    pageSize, 
    page, 
    debouncedSearchQuery, 
    transformData
  ]);

  // Actions
  const refresh = useCallback(async () => {
    setRefreshing(true);
    if (enablePagination || enableInfiniteScroll) {
      setData([]);
      setHasMore(true);
      initialLoadDoneRef.current = false;
    }
    await loadData(true);
    if (enablePagination || enableInfiniteScroll) {
      initialLoadDoneRef.current = true;
    }
  }, [loadData, enablePagination, enableInfiniteScroll]);

  const loadMore = useCallback(() => {
    if (!loadingRef.current && hasMore && (enablePagination || enableInfiniteScroll)) {
      const currentData = Array.isArray(data) ? data : [];
      if (currentData.length > 0) {
        loadData(false);
      }
    }
  }, [loadData, hasMore, enablePagination, enableInfiniteScroll, data]);

  const retry = useCallback(() => {
    if (error && !loading) {
      loadData(true);
    }
  }, [error, loading, loadData]);

  const refetch = useCallback(() => {
    loadData(true);
  }, [loadData]);

  const search = useCallback((query: string) => {
    if (enableSearch) {
      setSearchQuery(query);
      setSearchLoading(true);
    }
  }, [enableSearch]);

  const clearSearch = useCallback(() => {
    if (enableSearch) {
      setSearchQuery('');
      setDebouncedSearchQuery('');
      setSearchLoading(false);
    }
  }, [enableSearch]);

  // Initial load effect
  useEffect(() => {
    if (initialLoad && enabled && !initialLoadDoneRef.current) {
      loadData(true);
      initialLoadDoneRef.current = true;
    }
  }, [initialLoad, enabled, ...dependencies]);

  // Search effect
  useEffect(() => {
    if (enableSearch && debouncedSearchQuery !== '' && initialLoadDoneRef.current) {
      loadData(true, debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, enableSearch, loadData]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    hasMore,
    loadingMore,
    page,
    refreshing,
    searchQuery,
    searchLoading,
    refresh,
    loadMore,
    retry,
    refetch,
    search,
    clearSearch,
  };
}

// Convenience hooks for specific use cases
export function useSimpleApi<T>(
  apiFunction: () => Promise<T>,
  dependencies: any[] = []
) {
  return useUnifiedDataFetching(apiFunction, dependencies, {
    initialLoad: true,
    enabled: true,
  });
}

export function usePaginatedApi<T>(
  fetchFunction: (page: number, limit: number, searchQuery?: string) => Promise<T[]>,
  dependencies: any[] = [],
  options: Partial<UnifiedDataFetchingOptions<T>> = {}
) {
  return useUnifiedDataFetching(fetchFunction, dependencies, {
    enablePagination: true,
    pageSize: 10,
    ...options,
  });
}

export function useInfiniteScrollApi<T>(
  fetchFunction: (page: number, limit: number) => Promise<T[]>,
  dependencies: any[] = [],
  options: Partial<UnifiedDataFetchingOptions<T>> = {}
) {
  return useUnifiedDataFetching(fetchFunction, dependencies, {
    enableInfiniteScroll: true,
    pageSize: 10,
    ...options,
  });
}

export function useSearchableApi<T>(
  fetchFunction: (searchQuery: string) => Promise<T[]>,
  dependencies: any[] = [],
  options: Partial<UnifiedDataFetchingOptions<T>> = {}
) {
  return useUnifiedDataFetching(fetchFunction, dependencies, {
    enableSearch: true,
    searchDebounceMs: 300,
    ...options,
  });
}
