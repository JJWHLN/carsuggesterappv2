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
  
  const loadingRef = useRef(false);
  const pageRef = useRef(0);
  const hasMoreRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const initialLoadDoneRef = useRef(false);
  const fetchDataRef = useRef(fetchData);

  useEffect(() => {
    loadingRef.current = loading;
    pageRef.current = page;
    hasMoreRef.current = hasMore;
    fetchDataRef.current = fetchData;
  }, [loading, page, hasMore, fetchData]);

  const loadData = useCallback(async (pageNum: number, reset = false) => {
    if (!enabled || loadingRef.current) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const newData = await fetchDataRef.current(pageNum, pageSize);
      
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      if (reset) {
        setData(newData);
      } else {
        setData(prev => {
          const existingIds = new Set(prev.map((item: any) => item.id));
          const uniqueNewData = newData.filter((item: any) => !existingIds.has(item.id));
          return [...prev, ...uniqueNewData];
        });
      }
      
      setHasMore(newData.length === pageSize);
      setPage(pageNum);
    } catch (err) {
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

  useEffect(() => {
    if (enabled && !initialLoadDoneRef.current) {
      setPage(0);
      setHasMore(true);
      setError(null);
      setData([]);
      
      loadData(0, true);
      initialLoadDoneRef.current = true;
    } else if (!enabled) {
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