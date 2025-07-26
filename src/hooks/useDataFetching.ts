import { useState, useEffect, useCallback } from 'react';

/**
 * Generic hook for data fetching with loading, error, and pagination states
 */
export function useDataFetching<T>(
  fetchFunction: (
    page?: number,
    limit?: number,
    searchQuery?: string,
  ) => Promise<T[]>,
  dependencies: any[] = [],
  options: {
    initialLoad?: boolean;
    pageSize?: number;
    enableSearch?: boolean;
  } = {},
) {
  const { initialLoad = true, pageSize = 10, enableSearch = false } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = useCallback(
    async (reset = false, customSearchQuery?: string) => {
      try {
        if (reset) {
          setLoading(true);
          setError(null);
          setPage(0);
        } else {
          setLoadingMore(true);
        }

        const currentPage = reset ? 0 : page;
        const query =
          customSearchQuery !== undefined ? customSearchQuery : searchQuery;

        const newData = await fetchFunction(
          currentPage,
          pageSize,
          enableSearch ? query || undefined : undefined,
        );

        if (newData && Array.isArray(newData)) {
          if (reset) {
            setData(newData);
          } else {
            setData((prev) => [...prev, ...newData]);
          }

          setHasMore(newData.length === pageSize);
          setPage(currentPage + 1);
        } else {
          if (reset) {
            setData([]);
          }
          setHasMore(false);
        }
      } catch (err) {
        logger.error('Error loading data:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMessage);

        if (reset) {
          setData([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [fetchFunction, page, pageSize, searchQuery, enableSearch],
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(true);
  }, [loadData]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && data.length > 0) {
      loadData(false);
    }
  }, [loadingMore, hasMore, data.length, loadData]);

  const handleSearch = useCallback(
    (query: string) => {
      if (enableSearch) {
        setSearchQuery(query);
        loadData(true, query);
      }
    },
    [enableSearch, loadData],
  );

  const retry = useCallback(() => {
    loadData(true);
  }, [loadData]);

  // Initial load
  useEffect(() => {
    if (initialLoad) {
      loadData(true);
    }
  }, dependencies);

  // Search effect
  useEffect(() => {
    if (enableSearch && searchQuery !== '') {
      const timeoutId = setTimeout(() => {
        loadData(true);
      }, 500); // Debounce search

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, enableSearch, loadData]);

  return {
    data,
    loading,
    error,
    refreshing,
    loadingMore,
    hasMore,
    searchQuery,
    setSearchQuery: handleSearch,
    refresh: handleRefresh,
    loadMore: handleLoadMore,
    retry,
    reload: () => loadData(true),
  };
}

/**
 * Hook for simple data fetching without pagination
 */
export function useSimpleDataFetching<T>(
  fetchFunction: () => Promise<T>,
  dependencies: any[] = [],
  initialLoad = true,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchFunction();
      setData(result);
    } catch (err) {
      logger.error('Error loading data:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  const retry = useCallback(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (initialLoad) {
      loadData();
    }
  }, dependencies);

  return {
    data,
    loading,
    error,
    retry,
    reload: loadData,
  };
}
