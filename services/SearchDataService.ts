/**
 * SearchDataService - Real Data Persistence for Search
 * 
 * Replaces broken TODO comments with actual AsyncStorage implementation.
 * This is Phase 1 Week 2 of the recovery plan - fixing data persistence.
 * 
 * FIXES:
 * - Broken AsyncStorage TODOs in search.tsx
 * - Missing data persistence throughout app
 * - No actual save/load functionality
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface RecentSearch {
  query: string;
  timestamp: number;
  filters?: Record<string, any>;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: Record<string, any>;
  createdAt: number;
  lastUsed?: number;
}

interface SearchPreferences {
  sortBy: string;
  viewMode: 'list' | 'grid';
  filters: Record<string, any>;
  location?: string;
}

export class SearchDataService {
  private static readonly RECENT_SEARCHES_KEY = '@recent_searches';
  private static readonly SAVED_SEARCHES_KEY = '@saved_searches';
  private static readonly SEARCH_PREFERENCES_KEY = '@search_preferences';
  private static readonly MAX_RECENT_SEARCHES = 10;
  private static readonly MAX_SAVED_SEARCHES = 50;

  // Recent Searches Management
  static async getRecentSearches(): Promise<RecentSearch[]> {
    try {
      const stored = await AsyncStorage.getItem(this.RECENT_SEARCHES_KEY);
      if (!stored) return [];
      
      const searches: RecentSearch[] = JSON.parse(stored);
      
      // Filter out searches older than 30 days
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const validSearches = searches.filter(search => search.timestamp > thirtyDaysAgo);
      
      // Sort by most recent first
      return validSearches.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error loading recent searches:', error);
      return [];
    }
  }

  static async addRecentSearch(query: string, filters?: Record<string, any>): Promise<void> {
    try {
      if (!query.trim()) return;

      const recentSearches = await this.getRecentSearches();
      
      // Remove any existing search with the same query
      const filteredSearches = recentSearches.filter(search => 
        search.query.toLowerCase() !== query.toLowerCase()
      );
      
      // Add new search at the beginning
      const newSearch: RecentSearch = {
        query: query.trim(),
        timestamp: Date.now(),
        filters: filters || {}
      };
      
      filteredSearches.unshift(newSearch);
      
      // Keep only the most recent searches
      const trimmedSearches = filteredSearches.slice(0, this.MAX_RECENT_SEARCHES);
      
      await AsyncStorage.setItem(this.RECENT_SEARCHES_KEY, JSON.stringify(trimmedSearches));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  }

  static async clearRecentSearches(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Error clearing recent searches:', error);
    }
  }

  static async removeRecentSearch(query: string): Promise<void> {
    try {
      const recentSearches = await this.getRecentSearches();
      const filteredSearches = recentSearches.filter(search => 
        search.query.toLowerCase() !== query.toLowerCase()
      );
      
      await AsyncStorage.setItem(this.RECENT_SEARCHES_KEY, JSON.stringify(filteredSearches));
    } catch (error) {
      console.error('Error removing recent search:', error);
    }
  }

  // Saved Searches Management
  static async getSavedSearches(): Promise<SavedSearch[]> {
    try {
      const stored = await AsyncStorage.getItem(this.SAVED_SEARCHES_KEY);
      if (!stored) return [];
      
      const searches: SavedSearch[] = JSON.parse(stored);
      
      // Sort by most recently used, then by creation date
      return searches.sort((a, b) => {
        const aTime = a.lastUsed || a.createdAt;
        const bTime = b.lastUsed || b.createdAt;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error loading saved searches:', error);
      return [];
    }
  }

  static async saveSearch(name: string, query: string, filters: Record<string, any>): Promise<string> {
    try {
      const savedSearches = await this.getSavedSearches();
      
      const id = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newSavedSearch: SavedSearch = {
        id,
        name: name.trim(),
        query: query.trim(),
        filters: filters || {},
        createdAt: Date.now()
      };
      
      savedSearches.unshift(newSavedSearch);
      
      // Keep only the most recent saved searches
      const trimmedSearches = savedSearches.slice(0, this.MAX_SAVED_SEARCHES);
      
      await AsyncStorage.setItem(this.SAVED_SEARCHES_KEY, JSON.stringify(trimmedSearches));
      
      return id;
    } catch (error) {
      console.error('Error saving search:', error);
      throw error;
    }
  }

  static async deleteSavedSearch(id: string): Promise<void> {
    try {
      const savedSearches = await this.getSavedSearches();
      const filteredSearches = savedSearches.filter(search => search.id !== id);
      
      await AsyncStorage.setItem(this.SAVED_SEARCHES_KEY, JSON.stringify(filteredSearches));
    } catch (error) {
      console.error('Error deleting saved search:', error);
    }
  }

  static async updateSavedSearchLastUsed(id: string): Promise<void> {
    try {
      const savedSearches = await this.getSavedSearches();
      const updatedSearches = savedSearches.map(search => 
        search.id === id 
          ? { ...search, lastUsed: Date.now() }
          : search
      );
      
      await AsyncStorage.setItem(this.SAVED_SEARCHES_KEY, JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Error updating saved search last used:', error);
    }
  }

  // Search Preferences Management  
  static async getSearchPreferences(): Promise<SearchPreferences> {
    try {
      const stored = await AsyncStorage.getItem(this.SEARCH_PREFERENCES_KEY);
      if (!stored) {
        // Return default preferences
        return {
          sortBy: 'relevance',
          viewMode: 'list',
          filters: {},
        };
      }
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading search preferences:', error);
      return {
        sortBy: 'relevance',
        viewMode: 'list', 
        filters: {},
      };
    }
  }

  static async saveSearchPreferences(preferences: Partial<SearchPreferences>): Promise<void> {
    try {
      const currentPreferences = await this.getSearchPreferences();
      const updatedPreferences = { ...currentPreferences, ...preferences };
      
      await AsyncStorage.setItem(this.SEARCH_PREFERENCES_KEY, JSON.stringify(updatedPreferences));
    } catch (error) {
      console.error('Error saving search preferences:', error);
    }
  }

  static async saveSortPreference(sortBy: string): Promise<void> {
    try {
      await this.saveSearchPreferences({ sortBy });
    } catch (error) {
      console.error('Error saving sort preference:', error);
    }
  }

  static async saveViewMode(viewMode: 'list' | 'grid'): Promise<void> {
    try {
      await this.saveSearchPreferences({ viewMode });
    } catch (error) {
      console.error('Error saving view mode:', error);
    }
  }

  static async saveFilters(filters: Record<string, any>): Promise<void> {
    try {
      await this.saveSearchPreferences({ filters });
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  }

  // Clear all search data
  static async clearAllSearchData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.removeItem(this.RECENT_SEARCHES_KEY),
        AsyncStorage.removeItem(this.SAVED_SEARCHES_KEY),
        AsyncStorage.removeItem(this.SEARCH_PREFERENCES_KEY),
      ]);
    } catch (error) {
      console.error('Error clearing all search data:', error);
    }
  }

  // Data export/import for debugging
  static async exportSearchData(): Promise<any> {
    try {
      const [recentSearches, savedSearches, preferences] = await Promise.all([
        this.getRecentSearches(),
        this.getSavedSearches(),
        this.getSearchPreferences(),
      ]);
      
      return {
        recentSearches,
        savedSearches,
        preferences,
        exportedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error exporting search data:', error);
      return null;
    }
  }

  // Get storage usage stats
  static async getStorageStats(): Promise<{
    recentSearchesCount: number;
    savedSearchesCount: number;
    estimatedSize: number;
  }> {
    try {
      const [recentSearches, savedSearches] = await Promise.all([
        this.getRecentSearches(),
        this.getSavedSearches(),
      ]);
      
      const recentSize = JSON.stringify(recentSearches).length;
      const savedSize = JSON.stringify(savedSearches).length;
      
      return {
        recentSearchesCount: recentSearches.length,
        savedSearchesCount: savedSearches.length,
        estimatedSize: recentSize + savedSize, // bytes
      };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return {
        recentSearchesCount: 0,
        savedSearchesCount: 0,
        estimatedSize: 0,
      };
    }
  }
}

export default SearchDataService;
