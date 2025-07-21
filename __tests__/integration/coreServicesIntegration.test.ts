/**
 * Integration Tests for Core Services Architecture
 * Tests the interaction between all major services and components
 */

import CarDataService from '@/services/core/CarDataService';
import SimpleRecommendationEngine from '@/services/core/SimpleRecommendationEngine';
import UserPreferencesService from '@/services/core/UserPreferencesService';
import SimpleBookmarksService from '@/services/core/SimpleBookmarksService';

describe('Core Services Integration Tests', () => {
  let carDataService: CarDataService;
  let recommendationEngine: SimpleRecommendationEngine;
  let preferencesService: UserPreferencesService;
  let bookmarksService: SimpleBookmarksService;

  beforeAll(() => {
    // Initialize all services
    carDataService = CarDataService.getInstance();
    recommendationEngine = SimpleRecommendationEngine.getInstance();
    preferencesService = UserPreferencesService.getInstance();
    bookmarksService = SimpleBookmarksService.getInstance();
  });

  beforeEach(() => {
    // Clear any cached data before each test
    jest.clearAllMocks();
  });

  describe('Car Search and Recommendation Flow', () => {
    it('should complete a full user journey from search to recommendations', async () => {
      // 1. User searches for cars
      const searchResult = await carDataService.searchCars({
        filters: {
          make: 'Toyota',
          priceRange: { min: 15000, max: 30000 }
        },
        searchTerm: 'toyota',
        limit: 10
      });

      expect(searchResult).toBeDefined();
      expect(searchResult.cars).toBeDefined();
      expect(Array.isArray(searchResult.cars)).toBe(true);

      if (searchResult.cars.length > 0) {
        // 2. User views a car (track behavior)
        const firstCar = searchResult.cars[0];
        
        await preferencesService.trackBehaviorEvent({
          type: 'view',
          carId: firstCar.id,
          make: firstCar.make,
          priceRange: { min: firstCar.price * 0.9, max: firstCar.price * 1.1 },
          timestamp: Date.now()
        });

        // 3. Get user preferences and behavior
        const preferences = await preferencesService.getPreferences();
        const behavior = await preferencesService.getBehavior();

        expect(preferences).toBeDefined();
        expect(behavior).toBeDefined();

        // 4. Generate recommendations based on behavior
        const recommendations = await recommendationEngine.getRecommendations(
          preferences,
          behavior,
          5
        );

        expect(recommendations).toBeDefined();
        expect(recommendations.cars).toBeDefined();
        expect(recommendations.scores).toBeDefined();
        expect(recommendations.explanation).toBeDefined();
      }
    });

    it('should handle bookmark functionality across services', async () => {
      // 1. Search for cars
      const searchResult = await carDataService.searchCars({
        filters: { make: 'Honda' },
        searchTerm: 'honda',
        limit: 5
      });

      if (searchResult.cars.length > 0) {
        const testCar = searchResult.cars[0];
        const testUserId = 'test-user-123';

        // 2. Add bookmark
        const addResult = await bookmarksService.addBookmark(testCar.id, testUserId);
        expect(addResult).toBe(true);

        // 3. Check if bookmarked
        const isBookmarked = await bookmarksService.isBookmarked(testCar.id, testUserId);
        expect(isBookmarked).toBe(true);

        // 4. Track save behavior
        await preferencesService.trackBehaviorEvent({
          type: 'save',
          carId: testCar.id,
          make: testCar.make,
          timestamp: Date.now()
        });

        // 5. Remove bookmark
        const removeResult = await bookmarksService.removeBookmark(testCar.id, testUserId);
        expect(removeResult).toBe(true);

        // 6. Verify bookmark removed
        const isStillBookmarked = await bookmarksService.isBookmarked(testCar.id, testUserId);
        expect(isStillBookmarked).toBe(false);
      }
    });
  });

  describe('Recommendation Accuracy Tests', () => {
    it('should provide relevant recommendations based on user preferences', async () => {
      // Set specific user preferences
      const testPreferences = {
        budget: { min: 20000, max: 40000 },
        preferredMakes: ['Toyota', 'Honda', 'Nissan']
      };

      await preferencesService.updatePreferences(testPreferences);

      // Simulate user behavior
      await preferencesService.trackBehaviorEvent({
        type: 'search',
        searchTerm: 'toyota camry',
        timestamp: Date.now()
      });

      // Get recommendations
      const preferences = await preferencesService.getPreferences();
      const behavior = await preferencesService.getBehavior();
      const recommendations = await recommendationEngine.getRecommendations(
        preferences,
        behavior,
        10
      );

      // Verify recommendations respect preferences
      expect(recommendations.cars.length).toBeGreaterThan(0);
      
      // Check if at least some recommendations match preferred makes
      const matchingMakes = recommendations.cars.filter(car => 
        testPreferences.preferredMakes.includes(car.make)
      );
      expect(matchingMakes.length).toBeGreaterThan(0);

      // Check if recommendations have explanations
      expect(recommendations.explanation).toBeTruthy();
      expect(recommendations.scores.length).toBe(recommendations.cars.length);
    });

    it('should provide budget-appropriate recommendations', async () => {
      const budget = { min: 15000, max: 25000 };
      
      const budgetRecommendations = await recommendationEngine.getBudgetRecommendations(
        budget,
        5
      );

      expect(budgetRecommendations.cars.length).toBeGreaterThan(0);
      
      // Verify all recommendations are within budget
      budgetRecommendations.cars.forEach(car => {
        expect(car.price).toBeGreaterThanOrEqual(budget.min);
        expect(car.price).toBeLessThanOrEqual(budget.max);
      });
    });
  });

  describe('Service Performance Tests', () => {
    it('should respond quickly to search queries', async () => {
      const startTime = Date.now();
      
      const results = await carDataService.searchCars('toyota', {
        make: 'Toyota',
        priceMin: 10000,
        priceMax: 50000
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Should respond within 3 seconds
      expect(responseTime).toBeLessThan(3000);
      expect(results).toBeDefined();
    });

    it('should handle concurrent operations efficiently', async () => {
      const promises = [
        carDataService.searchCars('honda'),
        carDataService.getFeaturedCars(5),
        carDataService.getPopularMakes(),
        preferencesService.getPreferences(),
        bookmarksService.getBookmarks()
      ];

      const startTime = Date.now();
      const results = await Promise.all(promises);
      const endTime = Date.now();
      
      // All operations should complete within 5 seconds
      expect(endTime - startTime).toBeLessThan(5000);
      
      // All results should be defined
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle invalid search parameters gracefully', async () => {
      // Test with invalid filters
      const results = await carDataService.searchCars('', {
        priceMin: -1000,
        priceMax: 'invalid' as any,
        make: null as any
      });

      // Should return empty array instead of throwing
      expect(Array.isArray(results)).toBe(true);
    });

    it('should handle missing car ID gracefully', async () => {
      const result = await carDataService.getCarById('nonexistent-id');
      expect(result).toBeNull();
    });

    it('should handle bookmark operations with invalid data', async () => {
      const result = await bookmarksService.addBookmark('', '');
      expect(result).toBe(false);
    });
  });

  describe('Data Consistency Tests', () => {
    it('should maintain consistency between search and detail views', async () => {
      const searchResults = await carDataService.searchCars('bmw');
      
      if (searchResults.length > 0) {
        const carFromSearch = searchResults[0];
        const carFromDetail = await carDataService.getCarById(carFromSearch.id);
        
        expect(carFromDetail).toBeDefined();
        expect(carFromDetail?.id).toBe(carFromSearch.id);
        expect(carFromDetail?.make).toBe(carFromSearch.make);
        expect(carFromDetail?.model).toBe(carFromSearch.model);
        expect(carFromDetail?.price).toBe(carFromSearch.price);
      }
    });

    it('should provide similar cars that are actually similar', async () => {
      const searchResults = await carDataService.searchCars('toyota');
      
      if (searchResults.length > 0) {
        const baseCar = searchResults[0];
        const similarCars = await carDataService.getSimilarCars(baseCar.id, 3);
        
        if (similarCars.length > 0) {
          // At least one similar car should be from the same make or similar price range
          const sameMake = similarCars.some(car => car.make === baseCar.make);
          const similarPrice = similarCars.some(car => 
            Math.abs(car.price - baseCar.price) <= baseCar.price * 0.3
          );
          
          expect(sameMake || similarPrice).toBe(true);
        }
      }
    });
  });

  describe('User Behavior Tracking Tests', () => {
    it('should accurately track and retrieve user behavior', async () => {
      // Clear existing behavior
      await preferencesService.clearUserData();
      
      // Track multiple events
      const events = [
        { type: 'view' as const, carId: 'car1', make: 'Toyota', timestamp: Date.now() },
        { type: 'save' as const, carId: 'car2', make: 'Honda', timestamp: Date.now() + 1000 },
        { type: 'search' as const, searchTerm: 'luxury cars', timestamp: Date.now() + 2000 }
      ];

      for (const event of events) {
        await preferencesService.trackBehaviorEvent(event);
      }

      // Retrieve behavior
      const behavior = await preferencesService.getBehavior();
      
      expect(behavior.viewedCars).toContain('car1');
      expect(behavior.savedCars).toContain('car2');
      expect(behavior.searchHistory).toContain('luxury cars');
      expect(behavior.makeInteractions['Toyota']).toBe(1);
      expect(behavior.makeInteractions['Honda']).toBe(1);
    });
  });
});

/**
 * Mock data and utilities for testing
 */
export const mockCar = {
  id: 'test-car-1',
  make: 'Toyota',
  model: 'Camry',
  year: 2022,
  price: 25000,
  mileage: 15000,
  location: 'New York, NY',
  condition: 'used' as const,
  images: ['https://example.com/car1.jpg'],
  description: 'Test car for integration testing'
};

export const mockUserPreferences = {
  budget: { min: 20000, max: 40000 },
  preferredMakes: ['Toyota', 'Honda'],
  preferredBodyTypes: ['sedan'],
  maxMileage: 50000
};

export const mockUserBehavior = {
  viewedCars: ['car1', 'car2'],
  savedCars: ['car1'],
  searchHistory: ['toyota camry', 'honda accord'],
  makeInteractions: { Toyota: 3, Honda: 2 },
  priceRangeViews: [{ min: 20000, max: 30000, count: 5 }]
};
