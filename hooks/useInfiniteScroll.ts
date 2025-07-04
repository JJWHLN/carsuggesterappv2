import { useState, useCallback, useRef, useEffect } from 'react';

interface UseInfiniteScrollProps<T> {
  fetchData: (page: number, limit: number) => Promise<T[]>;
  pageSize?: number;
  initialData?: T[];
  enabled?: boolean;
}

interface UseInfiniteScrollReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  retry: () => void;
  isRefreshing: boolean;
}

export function useInfiniteScroll<T>({
  fetchData,
  pageSize = 10,
  initialData = [],
  enabled = true,
}: UseInfiniteScrollProps<T>): UseInfiniteScrollReturn<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  
  // Use refs to prevent stale closures and track internal state
  const loadingRef = useRef(false);
  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const initialLoadDoneRef = useRef(false);
  const fetchDataRef = useRef(fetchData);

  // Update refs when state changes
  useEffect(() => {
    loadingRef.current = loading;
    pageRef.current = page;
    hasMoreRef.current = hasMore;
    fetchDataRef.current = fetchData;
  }, [loading, page, hasMore, fetchData]);

  const loadData = useCallback(async (pageNum: number, reset = false) => {
    if (!enabled || loadingRef.current) return;

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      // Use the ref to get the latest fetchData function
      const newData = await fetchDataRef.current(pageNum, pageSize);
      
      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      if (reset) {
        setData(newData);
      } else {
        setData(prev => {
          // Prevent duplicates by checking IDs
          const existingIds = new Set(prev.map((item: any) => item.id));
          const uniqueNewData = newData.filter((item: any) => !existingIds.has(item.id));
          return [...prev, ...uniqueNewData];
        });
      }
      
      setHasMore(newData.length === pageSize);
      setPage(pageNum);
    } catch (err) {
      // Don't set error if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while loading data';
      setError(errorMessage);
      console.error('Infinite scroll error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      abortControllerRef.current = null;
    }
  }, [pageSize, enabled]);

  // Handle initial data loading when enabled changes
  // This effect only runs when enabled changes, not when fetchData changes
  useEffect(() => {
    if (enabled && !initialLoadDoneRef.current) {
      // Reset state for initial load
      setPage(0);
      setHasMore(true);
      setError(null);
      setData([]);
      
      // Load initial data
      loadData(0, true);
      initialLoadDoneRef.current = true;
    } else if (!enabled) {
      // Reset when disabled
      initialLoadDoneRef.current = false;
    }
  }, [enabled, loadData]);

  const loadMore = useCallback(() => {
    if (hasMoreRef.current && !loadingRef.current && enabled && initialLoadDoneRef.current) {
      loadData(pageRef.current + 1);
    }
  }, [loadData, enabled]);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    
    setIsRefreshing(true);
    setPage(0);
    setHasMore(true);
    setError(null);
    setData([]);
    initialLoadDoneRef.current = false;
    await loadData(0, true);
    initialLoadDoneRef.current = true;
  }, [loadData, enabled]);

  const retry = useCallback(() => {
    if (error && !loading && enabled) {
      loadData(pageRef.current);
    }
  }, [error, loading, loadData, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    retry,
    isRefreshing,
  };
}