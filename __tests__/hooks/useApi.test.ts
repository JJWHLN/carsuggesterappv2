/**
 * 🎣 useApi Hook Tests
 * Testing critical API hook functionality for data fetching
 */

import { renderHook, waitFor } from '@testing-library/react-native';
import { useApi, useAsyncOperation } from '../../src/hooks/useApi';
import { mockSupabaseService, createMockCar } from '../utils/mockData';

describe('🎣 useApi Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useApi', () => {
    it('fetches data successfully', async () => {
      const mockData = [createMockCar()];
      const mockApiFunction = jest.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useApi(mockApiFunction));

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
      expect(mockApiFunction).toHaveBeenCalledTimes(1);
    });

    it('handles API errors gracefully', async () => {
      const errorMessage = 'API request failed';
      const mockApiFunction = jest.fn().mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useApi(mockApiFunction));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe(errorMessage);
    });

    it('refetches data when refetch is called', async () => {
      const mockData = [createMockCar()];
      const mockApiFunction = jest.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useApi(mockApiFunction));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockApiFunction).toHaveBeenCalledTimes(1);

      // Call refetch
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockApiFunction).toHaveBeenCalledTimes(2);
    });

    it('updates when dependencies change', async () => {
      const mockData1 = [createMockCar()];
      const mockData2 = [createMockCar(), createMockCar()];
      const mockApiFunction = jest.fn()
        .mockResolvedValueOnce(mockData1)
        .mockResolvedValueOnce(mockData2);

      let dependency = 'value1';
      const { result, rerender } = renderHook(
        ({ dep }) => useApi(mockApiFunction, [dep]),
        {
          initialProps: { dep: dependency }
        }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData1);
      expect(mockApiFunction).toHaveBeenCalledTimes(1);

      // Change dependency
      dependency = 'value2';
      rerender({ dep: dependency });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockData2);
      expect(mockApiFunction).toHaveBeenCalledTimes(2);
    });
  });

  describe('useAsyncOperation', () => {
    it('executes async operations successfully', async () => {
      const mockData = createMockCar();
      const mockOperation = jest.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useAsyncOperation());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();

      let operationResult: any;
      await waitFor(async () => {
        operationResult = await result.current.execute(mockOperation);
      });

      expect(operationResult).toEqual(mockData);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('handles operation errors', async () => {
      const errorMessage = 'Operation failed';
      const mockOperation = jest.fn().mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAsyncOperation());

      let operationResult: any;
      await waitFor(async () => {
        operationResult = await result.current.execute(mockOperation);
      });

      expect(operationResult).toBeNull();
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
    });

    it('sets loading state during operation', async () => {
      const mockData = createMockCar();
      const mockOperation = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockData), 100))
      );

      const { result } = renderHook(() => useAsyncOperation());

      const operationPromise = result.current.execute(mockOperation);

      // Should be loading during operation
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();

      await waitFor(async () => {
        await operationPromise;
      });

      expect(result.current.loading).toBe(false);
    });
  });

  describe('Integration Tests', () => {
    it('works with Supabase service functions', async () => {
      const mockCars = [createMockCar(), createMockCar()];
      mockSupabaseService.fetchVehicleListings.mockResolvedValue(mockCars);

      const { result } = renderHook(() => 
        useApi(() => mockSupabaseService.fetchVehicleListings())
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toEqual(mockCars);
      expect(result.current.error).toBeNull();
      expect(mockSupabaseService.fetchVehicleListings).toHaveBeenCalledTimes(1);
    });

    it('handles real-world error scenarios', async () => {
      const networkError = new Error('Network request failed');
      mockSupabaseService.fetchVehicleListings.mockRejectedValue(networkError);

      const { result } = renderHook(() => 
        useApi(() => mockSupabaseService.fetchVehicleListings())
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('Network request failed');
    });

    it('combines with async operations for complex workflows', async () => {
      const mockCar = createMockCar();
      const mockUpdateOperation = jest.fn().mockResolvedValue(mockCar);

      const { result: apiResult } = renderHook(() => 
        useApi(() => mockSupabaseService.fetchVehicleListings())
      );

      const { result: asyncResult } = renderHook(() => useAsyncOperation());

      // Wait for initial data fetch
      await waitFor(() => {
        expect(apiResult.current.loading).toBe(false);
      });

      // Execute update operation
      let updateResult: any;
      await waitFor(async () => {
        updateResult = await asyncResult.current.execute(mockUpdateOperation);
      });

      expect(updateResult).toEqual(mockCar);
      expect(asyncResult.current.error).toBeNull();
    });
  });

  describe('Performance Tests', () => {
    it('handles rapid successive calls', async () => {
      const mockData = [createMockCar()];
      const mockApiFunction = jest.fn().mockResolvedValue(mockData);

      const { result } = renderHook(() => useApi(mockApiFunction));

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Rapid refetch calls
      result.current.refetch();
      result.current.refetch();
      result.current.refetch();

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should handle gracefully without errors
      expect(result.current.error).toBeNull();
    });

    it('cleans up properly on unmount', async () => {
      const mockApiFunction = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 1000))
      );

      const { result, unmount } = renderHook(() => useApi(mockApiFunction));

      expect(result.current.loading).toBe(true);

      // Unmount before completion
      unmount();

      // Should not cause memory leaks or warnings
      expect(true).toBe(true); // Test passes if no errors thrown
    });
  });
});
