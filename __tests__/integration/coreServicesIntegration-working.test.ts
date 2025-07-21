/**
 * Core Services Integration Tests - Simplified Version
 * Tests the basic functionality and integration of core services
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

  describe('Service Initialization', () => {
    it('should initialize all services as singletons', () => {
      // Test singleton pattern
      const carService1 = CarDataService.getInstance();
      const carService2 = CarDataService.getInstance();
      expect(carService1).toBe(carService2);

      const recommendationService1 = SimpleRecommendationEngine.getInstance();
      const recommendationService2 = SimpleRecommendationEngine.getInstance();
      expect(recommendationService1).toBe(recommendationService2);

      const preferencesService1 = UserPreferencesService.getInstance();
      const preferencesService2 = UserPreferencesService.getInstance();
      expect(preferencesService1).toBe(preferencesService2);

      const bookmarksService1 = SimpleBookmarksService.getInstance();
      const bookmarksService2 = SimpleBookmarksService.getInstance();
      expect(bookmarksService1).toBe(bookmarksService2);
    });
  });

  describe('Car Search Functionality', () => {
    it('should search for cars with basic filters', async () => {
      const searchResult = await carDataService.searchCars({
        filters: {
          make: 'Toyota',
          priceRange: { min: 15000, max: 30000 }
        },
        searchTerm: 'toyota',
        limit: 5
      });

      expect(searchResult).toBeDefined();
      expect(searchResult.cars).toBeDefined();
      expect(Array.isArray(searchResult.cars)).toBe(true);
      expect(typeof searchResult.total).toBe('number');
      expect(typeof searchResult.hasMore).toBe('boolean');
    });

    it('should get featured cars', async () => {
      const featuredCars = await carDataService.getFeaturedCars(5);
      
      expect(Array.isArray(featuredCars)).toBe(true);
      featuredCars.forEach(car => {
        expect(car).toHaveProperty('id');
        expect(car).toHaveProperty('make');
        expect(car).toHaveProperty('model');
        expect(car).toHaveProperty('price');
      });
    });

    it('should get popular makes', async () => {
      const popularMakes = await carDataService.getPopularMakes();
      
      expect(Array.isArray(popularMakes)).toBe(true);
      popularMakes.forEach(makeData => {
        expect(makeData).toHaveProperty('make');
        expect(makeData).toHaveProperty('count');
        expect(typeof makeData.make).toBe('string');
        expect(typeof makeData.count).toBe('number');
      });
    });
  });

  describe('User Preferences Management', () => {
    it('should manage user preferences', async () => {
      // Get initial preferences
      const initialPrefs = await preferencesService.getPreferences();
      expect(initialPrefs).toBeDefined();

      // Update preferences
      const newPrefs = {
        budget: { min: 20000, max: 40000 },
        preferredMakes: ['Toyota', 'Honda']
      };

      await preferencesService.updatePreferences(newPrefs);

      // Verify preferences were updated
      const updatedPrefs = await preferencesService.getPreferences();
      expect(updatedPrefs.budget).toEqual(newPrefs.budget);
      expect(updatedPrefs.preferredMakes).toEqual(newPrefs.preferredMakes);
    });

    it('should track user behavior', async () => {
      // Track a behavior event
      const behaviorEvent = {
        type: 'view' as const,
        carId: 'test-car-123',
        make: 'Toyota',
        timestamp: Date.now()
      };

      await preferencesService.trackBehaviorEvent(behaviorEvent);

      // Get behavior data
      const behavior = await preferencesService.getBehavior();
      expect(behavior).toBeDefined();
      expect(behavior.viewedCars).toContain('test-car-123');
      expect(behavior.makeInteractions['Toyota']).toBeGreaterThan(0);
    });
  });

  describe('Bookmark Management', () => {
    it('should manage bookmarks for authenticated users', async () => {
      const testCarId = 'test-car-456';
      const testUserId = 'test-user-123';

      // Initially not bookmarked
      const initialStatus = await bookmarksService.isBookmarked(testCarId, testUserId);
      expect(initialStatus).toBe(false);

      // Add bookmark
      const addResult = await bookmarksService.addBookmark(testCarId, testUserId);
      expect(addResult).toBe(true);

      // Check if bookmarked
      const bookmarkedStatus = await bookmarksService.isBookmarked(testCarId, testUserId);
      expect(bookmarkedStatus).toBe(true);

      // Remove bookmark
      const removeResult = await bookmarksService.removeBookmark(testCarId, testUserId);
      expect(removeResult).toBe(true);

      // Verify removal
      const finalStatus = await bookmarksService.isBookmarked(testCarId, testUserId);
      expect(finalStatus).toBe(false);
    });

    it('should handle anonymous user bookmarks', async () => {
      const testCarId = 'test-car-789';

      // Add bookmark without user ID (anonymous)
      const addResult = await bookmarksService.addBookmark(testCarId);
      expect(addResult).toBe(true);

      // Check bookmark status
      const isBookmarked = await bookmarksService.isBookmarked(testCarId);
      expect(isBookmarked).toBe(true);

      // Get all bookmarks
      const bookmarks = await bookmarksService.getBookmarks();
      expect(Array.isArray(bookmarks)).toBe(true);
    });
  });

  describe('Recommendation Engine', () => {
    it('should generate new user recommendations', async () => {
      const recommendations = await recommendationEngine.getNewUserRecommendations(5);
      
      expect(Array.isArray(recommendations)).toBe(true);
      recommendations.forEach(car => {
        expect(car).toHaveProperty('id');
        expect(car).toHaveProperty('make');
        expect(car).toHaveProperty('model');
        expect(car).toHaveProperty('price');
      });
    });

    it('should generate budget-based recommendations', async () => {
      const budget = { min: 15000, max: 25000 };
      const budgetRecommendations = await recommendationEngine.getBudgetRecommendations(budget, 5);
      
      expect(Array.isArray(budgetRecommendations)).toBe(true);
      
      // Verify all recommendations are within budget
      budgetRecommendations.forEach(car => {
        expect(car.price).toBeGreaterThanOrEqual(budget.min);
        expect(car.price).toBeLessThanOrEqual(budget.max);
      });
    });

    it('should generate personalized recommendations', async () => {
      const testUserId = 'test-user-456';
      
      // Set up user preferences
      const preferences = {
        budget: { min: 20000, max: 40000 },
        preferredMakes: ['Toyota', 'Honda']
      };
      await preferencesService.updatePreferences(preferences);

      // Track some behavior
      await preferencesService.trackBehaviorEvent({
        type: 'view',
        carId: 'car-123',
        make: 'Toyota',
        timestamp: Date.now()
      });

      // Get recommendations
      const userPrefs = await preferencesService.getPreferences();
      const userBehavior = await preferencesService.getBehavior();
      
      const recommendations = await recommendationEngine.getRecommendations(
        testUserId,
        userPrefs,
        userBehavior,
        5
      );

      expect(recommendations).toBeDefined();
      expect(recommendations.cars).toBeDefined();
      expect(Array.isArray(recommendations.cars)).toBe(true);
      expect(recommendations.explanation).toBeDefined();
      expect(typeof recommendations.explanation).toBe('string');
    });
  });

  describe('Service Performance', () => {
    it('should respond to requests within reasonable time', async () => {
      const startTime = Date.now();
      
      const [searchResult, featuredCars, popularMakes] = await Promise.all([
        carDataService.searchCars({
          filters: { make: 'Toyota' },
          limit: 5
        }),
        carDataService.getFeaturedCars(5),
        carDataService.getPopularMakes()
      ]);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Should respond within 5 seconds for all operations
      expect(responseTime).toBeLessThan(5000);
      
      // All results should be defined
      expect(searchResult).toBeDefined();
      expect(featuredCars).toBeDefined();
      expect(popularMakes).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid search parameters gracefully', async () => {
      const result = await carDataService.searchCars({
        filters: {
          priceRange: { min: -1000, max: -500 }, // Invalid range
          make: '' // Empty make
        },
        limit: 0 // Invalid limit
      });

      // Should return valid result structure even with invalid input
      expect(result).toBeDefined();
      expect(result.cars).toBeDefined();
      expect(Array.isArray(result.cars)).toBe(true);
    });

    it('should handle missing car ID gracefully', async () => {
      const result = await carDataService.getCarById('nonexistent-car-id');
      expect(result).toBeNull();
    });

    it('should handle bookmark operations with invalid data', async () => {
      // Empty car ID should return false
      const result1 = await bookmarksService.addBookmark('');
      expect(result1).toBe(false);

      // Invalid bookmark check should return false
      const result2 = await bookmarksService.isBookmarked('');
      expect(result2).toBe(false);
    });
  });

  describe('Data Flow Integration', () => {
    it('should complete a full user interaction flow', async () => {
      const testUserId = 'integration-test-user';
      
      // 1. User searches for cars
      const searchResult = await carDataService.searchCars({
        filters: { make: 'Honda' },
        searchTerm: 'honda',
        limit: 3
      });
      
      expect(searchResult.cars.length).toBeGreaterThan(0);
      
      if (searchResult.cars.length > 0) {
        const selectedCar = searchResult.cars[0];
        
        // 2. User views car details
        const carDetails = await carDataService.getCarById(selectedCar.id);
        expect(carDetails).toBeDefined();
        expect(carDetails?.id).toBe(selectedCar.id);
        
        // 3. Track view behavior
        await preferencesService.trackBehaviorEvent({
          type: 'view',
          carId: selectedCar.id,
          make: selectedCar.make,
          timestamp: Date.now()
        });
        
        // 4. User bookmarks the car
        const bookmarkResult = await bookmarksService.addBookmark(selectedCar.id, testUserId);
        expect(bookmarkResult).toBe(true);
        
        // 5. Track save behavior
        await preferencesService.trackBehaviorEvent({
          type: 'save',
          carId: selectedCar.id,
          make: selectedCar.make,
          timestamp: Date.now()
        });
        
        // 6. Get similar cars
        const similarCars = await carDataService.getSimilarCars(selectedCar.id, 3);
        expect(Array.isArray(similarCars)).toBe(true);
        
        // 7. Get personalized recommendations
        const preferences = await preferencesService.getPreferences();
        const behavior = await preferencesService.getBehavior();
        
        const recommendations = await recommendationEngine.getRecommendations(
          testUserId,
          preferences,
          behavior,
          5
        );
        
        expect(recommendations.cars).toBeDefined();
        expect(Array.isArray(recommendations.cars)).toBe(true);
      }
    });
  });
});
