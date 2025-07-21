/**
 * User Preferences Service
 * Manages user preferences and behavior for recommendations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPreferences, UserBehavior } from './SimpleRecommendationEngine';

export interface UserProfile {
  id: string;
  preferences: UserPreferences;
  behavior: UserBehavior;
  lastUpdated: string;
}

export interface BehaviorEvent {
  type: 'view' | 'save' | 'unsave' | 'search' | 'contact_dealer' | 'share';
  carId?: string;
  make?: string;
  searchTerm?: string;
  priceRange?: { min: number; max: number };
  timestamp: number;
}

const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  USER_BEHAVIOR: 'user_behavior',
  RECENT_SEARCHES: 'recent_searches',
  VIEWED_CARS: 'viewed_cars',
  SAVED_CARS: 'saved_cars'
};

/**
 * User Preferences Service
 * Handles user preferences and behavior tracking for personalized experience
 */
export class UserPreferencesService {
  private static instance: UserPreferencesService;

  public static getInstance(): UserPreferencesService {
    if (!UserPreferencesService.instance) {
      UserPreferencesService.instance = new UserPreferencesService();
    }
    return UserPreferencesService.instance;
  }

  /**
   * Get user preferences
   */
  async getPreferences(): Promise<UserPreferences> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      return stored ? JSON.parse(stored) : this.getDefaultPreferences();
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    try {
      const current = await this.getPreferences();
      const updated = { ...current, ...preferences };
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  }

  /**
   * Get user behavior data
   */
  async getBehavior(): Promise<UserBehavior> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.USER_BEHAVIOR);
      return stored ? JSON.parse(stored) : this.getDefaultBehavior();
    } catch (error) {
      console.error('Error getting user behavior:', error);
      return this.getDefaultBehavior();
    }
  }

  /**
   * Track user behavior event
   */
  async trackBehaviorEvent(event: BehaviorEvent): Promise<void> {
    try {
      const behavior = await this.getBehavior();
      
      switch (event.type) {
        case 'view':
          if (event.carId) {
            this.addToArray(behavior.viewedCars, event.carId, 50); // Keep last 50 viewed cars
          }
          if (event.make) {
            behavior.makeInteractions[event.make] = (behavior.makeInteractions[event.make] || 0) + 1;
          }
          if (event.priceRange) {
            this.trackPriceRangeView(behavior, event.priceRange);
          }
          break;

        case 'save':
          if (event.carId) {
            this.addToArray(behavior.savedCars, event.carId, 100); // Keep last 100 saved cars
          }
          if (event.make) {
            behavior.makeInteractions[event.make] = (behavior.makeInteractions[event.make] || 0) + 2; // Higher weight for saves
          }
          break;

        case 'unsave':
          if (event.carId) {
            behavior.savedCars = behavior.savedCars.filter(id => id !== event.carId);
          }
          break;

        case 'search':
          if (event.searchTerm) {
            this.addToArray(behavior.searchHistory, event.searchTerm, 20); // Keep last 20 searches
          }
          break;

        case 'contact_dealer':
        case 'share':
          if (event.make) {
            behavior.makeInteractions[event.make] = (behavior.makeInteractions[event.make] || 0) + 3; // Highest weight for serious actions
          }
          break;
      }

      await AsyncStorage.setItem(STORAGE_KEYS.USER_BEHAVIOR, JSON.stringify(behavior));
    } catch (error) {
      console.error('Error tracking behavior event:', error);
    }
  }

  /**
   * Get budget suggestions based on user behavior
   */
  async getBudgetSuggestions(): Promise<Array<{ min: number; max: number; label: string; popularity: number }>> {
    const behavior = await this.getBehavior();
    
    const defaultBudgets = [
      { min: 0, max: 15000, label: 'Under $15k', popularity: 0 },
      { min: 15000, max: 30000, label: '$15k - $30k', popularity: 0 },
      { min: 30000, max: 50000, label: '$30k - $50k', popularity: 0 },
      { min: 50000, max: 75000, label: '$50k - $75k', popularity: 0 },
      { min: 75000, max: 100000, label: '$75k - $100k', popularity: 0 },
      { min: 100000, max: 999999, label: '$100k+', popularity: 0 }
    ];

    // Calculate popularity based on user's price range views
    behavior.priceRangeViews.forEach(range => {
      defaultBudgets.forEach(budget => {
        const overlap = this.calculateRangeOverlap(range, budget);
        if (overlap > 0) {
          budget.popularity += range.count * overlap;
        }
      });
    });

    return defaultBudgets.sort((a, b) => b.popularity - a.popularity);
  }

  /**
   * Get make suggestions based on user behavior
   */
  async getMakeSuggestions(): Promise<Array<{ make: string; score: number }>> {
    const behavior = await this.getBehavior();
    
    return Object.entries(behavior.makeInteractions)
      .map(([make, interactions]) => ({ make, score: interactions }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  /**
   * Clear user data (for privacy/reset)
   */
  async clearUserData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_BEHAVIOR),
        AsyncStorage.removeItem(STORAGE_KEYS.RECENT_SEARCHES),
        AsyncStorage.removeItem(STORAGE_KEYS.VIEWED_CARS),
        AsyncStorage.removeItem(STORAGE_KEYS.SAVED_CARS)
      ]);
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

  /**
   * Get personalized search suggestions
   */
  async getSearchSuggestions(): Promise<string[]> {
    try {
      const behavior = await this.getBehavior();
      const makeSuggestions = await this.getMakeSuggestions();
      
      const suggestions = [
        ...behavior.searchHistory.slice(0, 5), // Recent searches
        ...makeSuggestions.slice(0, 5).map(s => s.make), // Preferred makes
        'Used cars under $20k',
        'Low mileage cars',
        'Recent listings',
        'Certified pre-owned'
      ];

      // Remove duplicates and return unique suggestions
      return [...new Set(suggestions)].slice(0, 8);
    } catch (error) {
      console.error('Error getting search suggestions:', error);
      return ['Recent listings', 'Under $20k', 'Low mileage', 'Popular makes'];
    }
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      budget: { min: 10000, max: 30000 },
      preferredMakes: [],
      preferredBodyTypes: [],
      preferredFuelTypes: [],
      maxMileage: 100000,
      preferredYearRange: { min: 2018, max: new Date().getFullYear() }
    };
  }

  private getDefaultBehavior(): UserBehavior {
    return {
      viewedCars: [],
      savedCars: [],
      searchHistory: [],
      makeInteractions: {},
      priceRangeViews: []
    };
  }

  private addToArray(array: string[], item: string, maxLength: number): void {
    // Remove existing occurrence if any
    const index = array.indexOf(item);
    if (index > -1) {
      array.splice(index, 1);
    }

    // Add to beginning
    array.unshift(item);

    // Trim to max length
    if (array.length > maxLength) {
      array.length = maxLength;
    }
  }

  private trackPriceRangeView(behavior: UserBehavior, priceRange: { min: number; max: number }): void {
    const existing = behavior.priceRangeViews.find(range => 
      range.min === priceRange.min && range.max === priceRange.max
    );

    if (existing) {
      existing.count += 1;
    } else {
      behavior.priceRangeViews.push({
        min: priceRange.min,
        max: priceRange.max,
        count: 1
      });
    }

    // Keep only top 20 price range views
    behavior.priceRangeViews.sort((a, b) => b.count - a.count);
    if (behavior.priceRangeViews.length > 20) {
      behavior.priceRangeViews.length = 20;
    }
  }

  private calculateRangeOverlap(range1: { min: number; max: number }, range2: { min: number; max: number }): number {
    const overlapMin = Math.max(range1.min, range2.min);
    const overlapMax = Math.min(range1.max, range2.max);
    
    if (overlapMin >= overlapMax) return 0;
    
    const overlapSize = overlapMax - overlapMin;
    const range1Size = range1.max - range1.min;
    const range2Size = range2.max - range2.min;
    
    return overlapSize / Math.min(range1Size, range2Size);
  }
}

export default UserPreferencesService;
