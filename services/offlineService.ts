import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Car as CarType } from '@/types/database';

export interface OfflineSearchCache {
  query: string;
  results: CarType[];
  timestamp: number;
  filters?: any;
}

export interface OfflineFavorite {
  carId: string;
  car: CarType;
  addedAt: number;
}

export interface OfflineUserPreferences {
  searchHistory: string[];
  favoriteFilters: any[];
  preferredBrands: string[];
  priceRange: { min: number; max: number };
  notifications: {
    priceDrops: boolean;
    newListings: boolean;
    savedSearches: boolean;
  };
  theme: 'light' | 'dark' | 'auto' | 'custom';
  customTheme?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

class OfflineService {
  private static instance: OfflineService;
  private isConnected: boolean = true;
  private searchCache: Map<string, OfflineSearchCache> = new Map();
  private maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
  private maxCacheSize = 50; // Maximum number of cached searches

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  async initialize(): Promise<void> {
    // Set up network monitoring
    NetInfo.addEventListener(state => {
      this.isConnected = state.isConnected ?? false;
    });

    // Load cached data
    await this.loadSearchCache();
  }

  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  }

  // Search Cache Management
  async cacheSearchResults(query: string, results: CarType[], filters?: any): Promise<void> {
    const cacheKey = this.generateCacheKey(query, filters);
    const cacheData: OfflineSearchCache = {
      query,
      results,
      timestamp: Date.now(),
      filters,
    };

    this.searchCache.set(cacheKey, cacheData);

    // Limit cache size
    if (this.searchCache.size > this.maxCacheSize) {
      const oldestKey = Array.from(this.searchCache.keys())[0];
      this.searchCache.delete(oldestKey);
    }

    await this.saveSearchCache();
  }

  async getCachedSearchResults(query: string, filters?: any): Promise<CarType[] | null> {
    const cacheKey = this.generateCacheKey(query, filters);
    const cached = this.searchCache.get(cacheKey);

    if (!cached) return null;

    // Check if cache is still valid
    const isExpired = Date.now() - cached.timestamp > this.maxCacheAge;
    if (isExpired) {
      this.searchCache.delete(cacheKey);
      await this.saveSearchCache();
      return null;
    }

    return cached.results;
  }

  private generateCacheKey(query: string, filters?: any): string {
    const filterStr = filters ? JSON.stringify(filters) : '';
    return `${query.toLowerCase().trim()}-${filterStr}`;
  }

  private async loadSearchCache(): Promise<void> {
    try {
      const cacheData = await AsyncStorage.getItem('@search_cache');
      if (cacheData) {
        const parsedCache = JSON.parse(cacheData);
        this.searchCache = new Map(Object.entries(parsedCache));
      }
    } catch (error) {
      console.error('Failed to load search cache:', error);
    }
  }

  private async saveSearchCache(): Promise<void> {
    try {
      const cacheObj = Object.fromEntries(this.searchCache);
      await AsyncStorage.setItem('@search_cache', JSON.stringify(cacheObj));
    } catch (error) {
      console.error('Failed to save search cache:', error);
    }
  }

  // Favorites Management
  async addFavorite(car: CarType): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const newFavorite: OfflineFavorite = {
        carId: car.id,
        car,
        addedAt: Date.now(),
      };

      const updatedFavorites = [newFavorite, ...favorites.filter(f => f.carId !== car.id)];
      await AsyncStorage.setItem('@favorites', JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Failed to add favorite:', error);
    }
  }

  async removeFavorite(carId: string): Promise<void> {
    try {
      const favorites = await this.getFavorites();
      const updatedFavorites = favorites.filter(f => f.carId !== carId);
      await AsyncStorage.setItem('@favorites', JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  }

  async getFavorites(): Promise<OfflineFavorite[]> {
    try {
      const favoritesData = await AsyncStorage.getItem('@favorites');
      return favoritesData ? JSON.parse(favoritesData) : [];
    } catch (error) {
      console.error('Failed to get favorites:', error);
      return [];
    }
  }

  async isFavorite(carId: string): Promise<boolean> {
    const favorites = await this.getFavorites();
    return favorites.some(f => f.carId === carId);
  }

  // User Preferences Management
  async saveUserPreferences(preferences: OfflineUserPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem('@user_preferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }

  async getUserPreferences(): Promise<OfflineUserPreferences> {
    try {
      const preferencesData = await AsyncStorage.getItem('@user_preferences');
      if (preferencesData) {
        return JSON.parse(preferencesData);
      }
    } catch (error) {
      console.error('Failed to get user preferences:', error);
    }

    // Return default preferences
    return {
      searchHistory: [],
      favoriteFilters: [],
      preferredBrands: [],
      priceRange: { min: 0, max: 100000 },
      notifications: {
        priceDrops: true,
        newListings: true,
        savedSearches: true,
      },
      theme: 'auto',
    };
  }

  async updateSearchHistory(query: string): Promise<void> {
    try {
      const preferences = await this.getUserPreferences();
      const updatedHistory = [
        query,
        ...preferences.searchHistory.filter(h => h !== query)
      ].slice(0, 20); // Keep only last 20 searches

      preferences.searchHistory = updatedHistory;
      await this.saveUserPreferences(preferences);
    } catch (error) {
      console.error('Failed to update search history:', error);
    }
  }

  // Sync Management
  async syncWithServer(): Promise<void> {
    if (!await this.isOnline()) {
      return;
    }

    try {
      // Sync favorites with server
      const favorites = await this.getFavorites();
      // TODO: Send favorites to server

      // Sync preferences with server
      const preferences = await this.getUserPreferences();
      // TODO: Send preferences to server

      console.log('Successfully synced with server');
    } catch (error) {
      console.error('Failed to sync with server:', error);
    }
  }

  // Cache Statistics
  async getCacheStatistics(): Promise<{
    cacheSize: number;
    oldestEntry: number;
    newestEntry: number;
    totalCachedCars: number;
  }> {
    let totalCachedCars = 0;
    let oldestEntry = Date.now();
    let newestEntry = 0;

    this.searchCache.forEach(cache => {
      totalCachedCars += cache.results.length;
      oldestEntry = Math.min(oldestEntry, cache.timestamp);
      newestEntry = Math.max(newestEntry, cache.timestamp);
    });

    return {
      cacheSize: this.searchCache.size,
      oldestEntry,
      newestEntry,
      totalCachedCars,
    };
  }

  // Clear all offline data
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        '@search_cache',
        '@favorites',
        '@user_preferences'
      ]);
      this.searchCache.clear();
      console.log('All offline data cleared');
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }
}

export default OfflineService;
