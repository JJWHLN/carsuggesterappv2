/**
 * 🔧 Core Services Tests
 * Tests for essential service functionality - 70% coverage target
 */

import { mockSupabaseService, createMockCar, createMockCarList, simulateAsyncSuccess, simulateAsyncError } from '../utils/mockData';

// Mock the actual service
jest.mock('@/services/supabaseService', () => mockSupabaseService);
jest.mock('@/src/services/supabaseService', () => mockSupabaseService);

import { fetchVehicleListings, fetchVehicleListingById, fetchFeaturedCars, searchVehiclesWithFilters } from '../../services/supabaseService';

describe('🔧 Core Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchVehicleListings', () => {
    it('should fetch vehicle listings successfully', async () => {
      const mockCars = createMockCarList(3);
      mockSupabaseService.fetchVehicleListings.mockResolvedValue(mockCars);

      const result = await fetchVehicleListings();

      expect(mockSupabaseService.fetchVehicleListings).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockCars);
      expect(result).toHaveLength(3);
    });

    it('should handle pagination parameters', async () => {
      const mockCars = createMockCarList(2);
      mockSupabaseService.fetchVehicleListings.mockResolvedValue(mockCars);

      await fetchVehicleListings(1, 10);

      expect(mockSupabaseService.fetchVehicleListings).toHaveBeenCalledWith(1, 10, undefined);
    });

    it('should handle search query', async () => {
      const mockCars = [createMockCar({ make: 'Toyota' })];
      mockSupabaseService.fetchVehicleListings.mockResolvedValue(mockCars);

      await fetchVehicleListings(0, 10, 'Toyota');

      expect(mockSupabaseService.fetchVehicleListings).toHaveBeenCalledWith(0, 10, 'Toyota');
    });

    it('should handle service errors', async () => {
      const errorMessage = 'Database connection failed';
      mockSupabaseService.fetchVehicleListings.mockRejectedValue(new Error(errorMessage));

      await expect(fetchVehicleListings()).rejects.toThrow(errorMessage);
    });
  });

  describe('fetchVehicleListingById', () => {
    it('should fetch single vehicle by ID', async () => {
      const mockCar = createMockCar({ id: 'test-id-123' });
      mockSupabaseService.fetchVehicleListingById.mockResolvedValue(mockCar);

      const result = await fetchVehicleListingById('test-id-123');

      expect(mockSupabaseService.fetchVehicleListingById).toHaveBeenCalledWith('test-id-123');
      expect(result).toEqual(mockCar);
      expect(result?.id).toBe('test-id-123');
    });

    it('should return null for non-existent ID', async () => {
      mockSupabaseService.fetchVehicleListingById.mockResolvedValue(null);

      const result = await fetchVehicleListingById('non-existent');

      expect(result).toBeNull();
    });

    it('should handle invalid ID format', async () => {
      mockSupabaseService.fetchVehicleListingById.mockRejectedValue(new Error('Invalid ID format'));

      await expect(fetchVehicleListingById('')).rejects.toThrow('Invalid ID format');
    });
  });

  describe('fetchFeaturedCars', () => {
    it('should fetch featured cars', async () => {
      const featuredCars = createMockCarList(5).map(car => ({ ...car, featured: true }));
      mockSupabaseService.fetchFeaturedCars.mockResolvedValue(featuredCars);

      const result = await fetchFeaturedCars();

      expect(mockSupabaseService.fetchFeaturedCars).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(5);
      expect(result.every(car => car.featured)).toBeTruthy();
    });

    it('should handle empty featured cars', async () => {
      mockSupabaseService.fetchFeaturedCars.mockResolvedValue([]);

      const result = await fetchFeaturedCars();

      expect(result).toEqual([]);
    });

    it('should handle network errors', async () => {
      mockSupabaseService.fetchFeaturedCars.mockRejectedValue(new Error('Network error'));

      await expect(fetchFeaturedCars()).rejects.toThrow('Network error');
    });
  });

  describe('searchVehiclesWithFilters', () => {
    it('should search with make filter', async () => {
      const toyotaCars = [createMockCar({ make: 'Toyota' })];
      mockSupabaseService.searchVehiclesWithFilters.mockResolvedValue(toyotaCars);

      const searchParams = { make: 'Toyota' };
      const result = await searchVehiclesWithFilters(searchParams);

      expect(mockSupabaseService.searchVehiclesWithFilters).toHaveBeenCalledWith(searchParams);
      expect(result).toEqual(toyotaCars);
    });

    it('should search with price range', async () => {
      const affordableCars = createMockCarList(2).map(car => ({ ...car, price: 25000 }));
      mockSupabaseService.searchVehiclesWithFilters.mockResolvedValue(affordableCars);

      const searchParams = { minPrice: 20000, maxPrice: 30000 };
      const result = await searchVehiclesWithFilters(searchParams);

      expect(result.every(car => car.price >= 20000 && car.price <= 30000)).toBeTruthy();
    });

    it('should search with multiple filters', async () => {
      const filteredCars = [createMockCar({ make: 'Honda', year: 2023, price: 28000 })];
      mockSupabaseService.searchVehiclesWithFilters.mockResolvedValue(filteredCars);

      const searchParams = {
        make: 'Honda',
        year: 2023,
        minPrice: 25000,
        maxPrice: 35000
      };

      const result = await searchVehiclesWithFilters(searchParams);

      expect(mockSupabaseService.searchVehiclesWithFilters).toHaveBeenCalledWith(searchParams);
      expect(result).toEqual(filteredCars);
    });

    it('should handle empty search results', async () => {
      mockSupabaseService.searchVehiclesWithFilters.mockResolvedValue([]);

      const result = await searchVehiclesWithFilters({ make: 'NonExistentBrand' });

      expect(result).toEqual([]);
    });

    it('should handle invalid search parameters', async () => {
      mockSupabaseService.searchVehiclesWithFilters.mockRejectedValue(new Error('Invalid search parameters'));

      await expect(searchVehiclesWithFilters({ minPrice: -1000 })).rejects.toThrow('Invalid search parameters');
    });
  });

  describe('Service Integration', () => {
    it('should handle concurrent requests', async () => {
      const mockCars = createMockCarList(2);
      const mockFeatured = createMockCarList(3);
      
      mockSupabaseService.fetchVehicleListings.mockResolvedValue(mockCars);
      mockSupabaseService.fetchFeaturedCars.mockResolvedValue(mockFeatured);

      const [listings, featured] = await Promise.all([
        fetchVehicleListings(),
        fetchFeaturedCars()
      ]);

      expect(listings).toHaveLength(2);
      expect(featured).toHaveLength(3);
      expect(mockSupabaseService.fetchVehicleListings).toHaveBeenCalledTimes(1);
      expect(mockSupabaseService.fetchFeaturedCars).toHaveBeenCalledTimes(1);
    });

    it('should handle partial failures', async () => {
      const mockCars = createMockCarList(2);
      
      mockSupabaseService.fetchVehicleListings.mockResolvedValue(mockCars);
      mockSupabaseService.fetchFeaturedCars.mockRejectedValue(new Error('Featured cars unavailable'));

      const results = await Promise.allSettled([
        fetchVehicleListings(),
        fetchFeaturedCars()
      ]);

      expect(results[0].status).toBe('fulfilled');
      expect(results[1].status).toBe('rejected');
      expect((results[0] as any).value).toEqual(mockCars);
    });
  });

  describe('Performance & Reliability', () => {
    it('should timeout long-running requests', async () => {
      jest.setTimeout(5000);
      
      // Simulate slow response
      mockSupabaseService.fetchVehicleListings
        .mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 6000)));

      const startTime = Date.now();
      
      try {
        await Promise.race([
          fetchVehicleListings(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
        ]);
      } catch (error) {
        expect(error.message).toBe('Timeout');
        expect(Date.now() - startTime).toBeLessThan(4000);
      }
    });

    it('should handle network connectivity issues', async () => {
      mockSupabaseService.fetchVehicleListings.mockRejectedValue(new Error('Network unavailable'));

      await expect(fetchVehicleListings()).rejects.toThrow('Network unavailable');
    });
  });
});
