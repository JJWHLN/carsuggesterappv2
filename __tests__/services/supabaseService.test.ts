/**
 * 🧪 Supabase Service Tests
 * Testing critical backend service functionality
 */

import {
  fetchVehicleListings,
  fetchVehicleListingById,
  searchVehiclesWithFilters,
  fetchCarReviews,
  getCurrentUser,
  signInWithEmail,
  signUpWithEmail
} from '../../src/services/supabaseService';

import { createMockCar, createMockUser, createMockReview } from '../utils/mockData';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
  }
};

jest.mock('../../src/lib/supabase', () => ({
  supabase: mockSupabaseClient
}));

describe('🧪 Supabase Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchVehicleListings', () => {
    it('fetches vehicle listings successfully', async () => {
      const mockData = [createMockCar(), createMockCar()];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await fetchVehicleListings();

      expect(result).toEqual(mockData);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('vehicle_listings');
      expect(mockQuery.select).toHaveBeenCalled();
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('handles fetch errors', async () => {
      const mockError = { message: 'Database connection failed' };
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: null, error: mockError })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await expect(fetchVehicleListings()).rejects.toThrow('Database connection failed');
    });

    it('handles empty results', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await fetchVehicleListings();
      expect(result).toEqual([]);
    });

    it('applies pagination correctly', async () => {
      const mockData = [createMockCar()];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await fetchVehicleListings(0, 10);

      expect(mockQuery.range).toHaveBeenCalledWith(0, 9);
      expect(result).toEqual(mockData);
    });
  });

  describe('fetchVehicleListingById', () => {
    it('fetches vehicle by ID successfully', async () => {
      const mockCar = createMockCar();
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockCar, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await fetchVehicleListingById('test-id');

      expect(result).toEqual(mockCar);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('vehicle_listings');
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'test-id');
    });

    it('returns null for non-existent vehicle', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await fetchVehicleListingById('nonexistent-id');
      expect(result).toBeNull();
    });

    it('handles database errors', async () => {
      const mockError = { message: 'Record not found' };
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: mockError })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await expect(fetchVehicleListingById('test-id')).rejects.toThrow('Record not found');
    });
  });

  describe('searchVehiclesWithFilters', () => {
    it('searches with make filter', async () => {
      const mockData = [createMockCar()];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await searchVehiclesWithFilters({ make: 'Toyota' });

      expect(result).toEqual(mockData);
      expect(mockQuery.ilike).toHaveBeenCalledWith('make', '%Toyota%');
    });

    it('searches with price range filter', async () => {
      const mockData = [createMockCar()];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await searchVehiclesWithFilters({ 
        minPrice: 20000, 
        maxPrice: 50000 
      });

      expect(result).toEqual(mockData);
      expect(mockQuery.gte).toHaveBeenCalledWith('price', 20000);
      expect(mockQuery.lte).toHaveBeenCalledWith('price', 50000);
    });

    it('searches with multiple filters', async () => {
      const mockData = [createMockCar()];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await searchVehiclesWithFilters({
        make: 'Toyota',
        year: 2023,
        minPrice: 25000
      });

      expect(result).toEqual(mockData);
      expect(mockQuery.ilike).toHaveBeenCalledWith('make', '%Toyota%');
      expect(mockQuery.eq).toHaveBeenCalledWith('year', 2023);
      expect(mockQuery.gte).toHaveBeenCalledWith('price', 25000);
    });

    it('handles empty search results', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await searchVehiclesWithFilters({ make: 'NonexistentBrand' });
      expect(result).toEqual([]);
    });
  });

  describe('fetchCarReviews', () => {
    it('fetches reviews with pagination', async () => {
      const mockReviews = [createMockReview(), createMockReview()];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockReviews, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await fetchCarReviews(0, 10);

      expect(result).toEqual(mockReviews);
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('reviews');
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('handles no reviews found', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await fetchCarReviews();
      expect(result).toEqual([]);
    });

    it('searches reviews with query', async () => {
      const mockReviews = [createMockReview()];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockReviews, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const result = await fetchCarReviews(0, 10, 'great car');

      expect(result).toEqual(mockReviews);
      expect(mockQuery.ilike).toHaveBeenCalled();
    });
  });

  describe('Authentication', () => {
    describe('getCurrentUser', () => {
      it('returns current user when authenticated', async () => {
        const mockUser = createMockUser();
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: mockUser },
          error: null
        });

        const result = await getCurrentUser();
        expect(result).toEqual(mockUser);
      });

      it('returns null when not authenticated', async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null
        });

        const result = await getCurrentUser();
        expect(result).toBeNull();
      });

      it('handles auth errors', async () => {
        const mockError = { message: 'Authentication failed' };
        mockSupabaseClient.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: mockError
        });

        await expect(getCurrentUser()).rejects.toThrow('Authentication failed');
      });
    });

    describe('signInWithEmail', () => {
      it('signs in successfully', async () => {
        const mockUser = createMockUser();
        mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
          data: { user: mockUser },
          error: null
        });

        const result = await signInWithEmail('test@example.com', 'password123');
        expect(result).toEqual(mockUser);
        expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
      });

      it('handles invalid credentials', async () => {
        const mockError = { message: 'Invalid credentials' };
        mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
          data: { user: null },
          error: mockError
        });

        await expect(signInWithEmail('wrong@example.com', 'wrongpass'))
          .rejects.toThrow('Invalid credentials');
      });
    });

    describe('signUpWithEmail', () => {
      it('signs up successfully', async () => {
        const mockUser = createMockUser();
        mockSupabaseClient.auth.signUp.mockResolvedValue({
          data: { user: mockUser },
          error: null
        });

        const result = await signUpWithEmail('new@example.com', 'password123');
        expect(result).toEqual(mockUser);
        expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
          email: 'new@example.com',
          password: 'password123'
        });
      });

      it('handles duplicate email', async () => {
        const mockError = { message: 'Email already registered' };
        mockSupabaseClient.auth.signUp.mockResolvedValue({
          data: { user: null },
          error: mockError
        });

        await expect(signUpWithEmail('existing@example.com', 'password123'))
          .rejects.toThrow('Email already registered');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles network errors gracefully', async () => {
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Network connection failed');
      });

      await expect(fetchVehicleListings()).rejects.toThrow('Network connection failed');
    });

    it('handles timeout errors', async () => {
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error('Request timeout'))
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      await expect(fetchVehicleListings()).rejects.toThrow('Request timeout');
    });
  });

  describe('Performance Tests', () => {
    it('handles large result sets efficiently', async () => {
      const largeDataSet = Array(1000).fill(null).map(() => createMockCar());
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: largeDataSet, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const startTime = Date.now();
      const result = await fetchVehicleListings();
      const endTime = Date.now();

      expect(result).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(100); // Should handle large datasets quickly
    });

    it('handles concurrent requests', async () => {
      const mockData = [createMockCar()];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: mockData, error: null })
      };
      
      mockSupabaseClient.from.mockReturnValue(mockQuery);

      const promises = [
        fetchVehicleListings(),
        fetchVehicleListings(),
        fetchVehicleListings()
      ];

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => expect(result).toEqual(mockData));
    });
  });
});
