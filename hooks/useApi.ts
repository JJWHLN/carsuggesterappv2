import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiResponse, ApiError } from '@/services/api';

export function useApi<T>(
  apiFunction: () => Promise<T>,
  dependencies: any[] = []
): ApiResponse<T> & { refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Use ref to avoid stale closure issues
  const apiRef = useRef(apiFunction);
  apiRef.current = apiFunction;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiRef.current();
      setData(result);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.userFriendlyMessage);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []); // Remove dependencies to avoid unnecessary re-creation

  useEffect(() => {
    fetchData();
  }, [...dependencies, fetchData]); // Move dependencies to useEffect

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, error, loading, refetch };
}

export function useAsyncOperation<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      return result;
    } catch (err) {
      let errorMessage: string;
      if (err instanceof ApiError) {
        errorMessage = err.userFriendlyMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else {
        errorMessage = 'An unexpected operation error occurred.';
      }
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { execute, loading, error };
}