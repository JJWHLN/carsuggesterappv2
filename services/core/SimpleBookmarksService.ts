/**
 * Simple Car Bookmarks Service
 * Manages user's saved/favorite cars
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { Car } from '@/types/database';
import CarDataService from './CarDataService';

const STORAGE_KEY = 'user_bookmarks';

export interface Bookmark {
  carId: string;
  userId?: string;
  savedAt: string;
  carData?: Car; // Cache car data for offline access
}

/**
 * Simple Bookmarks Service
 * Handles saving and retrieving user's favorite cars
 */
export class SimpleBookmarksService {
  private static instance: SimpleBookmarksService;
  private carDataService: CarDataService;

  constructor() {
    this.carDataService = CarDataService.getInstance();
  }

  public static getInstance(): SimpleBookmarksService {
    if (!SimpleBookmarksService.instance) {
      SimpleBookmarksService.instance = new SimpleBookmarksService();
    }
    return SimpleBookmarksService.instance;
  }

  /**
   * Get user's bookmarks
   */
  async getBookmarks(userId?: string): Promise<Bookmark[]> {
    try {
      if (userId) {
        // Authenticated user - get from database
        return this.getBookmarksFromDatabase(userId);
      } else {
        // Anonymous user - get from local storage
        return this.getBookmarksFromStorage();
      }
    } catch (error) {
      console.error('Error getting bookmarks:', error);
      return [];
    }
  }

  /**
   * Add car to bookmarks
   */
  async addBookmark(carId: string, userId?: string): Promise<boolean> {
    try {
      const bookmark: Bookmark = {
        carId,
        userId,
        savedAt: new Date().toISOString()
      };

      // Get car data for caching
      const carData = await this.carDataService.getCarById(carId);
      if (carData) {
        bookmark.carData = carData;
      }

      if (userId) {
        // Authenticated user - save to database
        return this.addBookmarkToDatabase(bookmark);
      } else {
        // Anonymous user - save to local storage
        return this.addBookmarkToStorage(bookmark);
      }
    } catch (error) {
      console.error('Error adding bookmark:', error);
      return false;
    }
  }

  /**
   * Remove car from bookmarks
   */
  async removeBookmark(carId: string, userId?: string): Promise<boolean> {
    try {
      if (userId) {
        // Authenticated user - remove from database
        return this.removeBookmarkFromDatabase(carId, userId);
      } else {
        // Anonymous user - remove from local storage
        return this.removeBookmarkFromStorage(carId);
      }
    } catch (error) {
      console.error('Error removing bookmark:', error);
      return false;
    }
  }

  /**
   * Check if car is bookmarked
   */
  async isBookmarked(carId: string, userId?: string): Promise<boolean> {
    try {
      const bookmarks = await this.getBookmarks(userId);
      return bookmarks.some(bookmark => bookmark.carId === carId);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
      return false;
    }
  }

  /**
   * Get bookmarked cars with full data
   */
  async getBookmarkedCars(userId?: string): Promise<Car[]> {
    try {
      const bookmarks = await this.getBookmarks(userId);
      const cars: Car[] = [];

      for (const bookmark of bookmarks) {
        if (bookmark.carData) {
          // Use cached data if available
          cars.push(bookmark.carData);
        } else {
          // Fetch fresh data
          const carData = await this.carDataService.getCarById(bookmark.carId);
          if (carData) {
            cars.push(carData);
          }
        }
      }

      return cars;
    } catch (error) {
      console.error('Error getting bookmarked cars:', error);
      return [];
    }
  }

  /**
   * Sync local bookmarks with database (when user signs in)
   */
  async syncBookmarks(userId: string): Promise<void> {
    try {
      const localBookmarks = await this.getBookmarksFromStorage();
      
      for (const bookmark of localBookmarks) {
        await this.addBookmarkToDatabase({
          ...bookmark,
          userId
        });
      }

      // Clear local storage after sync
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error syncing bookmarks:', error);
    }
  }

  /**
   * Clear all bookmarks
   */
  async clearBookmarks(userId?: string): Promise<void> {
    try {
      if (userId) {
        // Clear from database
        const { error } = await supabase
          .from('saved_cars')
          .delete()
          .eq('user_id', userId);

        if (error) {
          console.error('Error clearing bookmarks from database:', error);
        }
      } else {
        // Clear from local storage
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Error clearing bookmarks:', error);
    }
  }

  // Private methods for database operations
  private async getBookmarksFromDatabase(userId: string): Promise<Bookmark[]> {
    try {
      const { data, error } = await supabase
        .from('saved_cars')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error getting bookmarks:', error);
        return [];
      }

      return data?.map(item => ({
        carId: item.vehicle_listing_id,
        userId: item.user_id,
        savedAt: item.created_at
      })) || [];

    } catch (error) {
      console.error('Error getting bookmarks from database:', error);
      return [];
    }
  }

  private async addBookmarkToDatabase(bookmark: Bookmark): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('saved_cars')
        .insert([{
          user_id: bookmark.userId,
          vehicle_listing_id: bookmark.carId,
          created_at: bookmark.savedAt
        }]);

      if (error) {
        console.error('Database error adding bookmark:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error adding bookmark to database:', error);
      return false;
    }
  }

  private async removeBookmarkFromDatabase(carId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('saved_cars')
        .delete()
        .eq('user_id', userId)
        .eq('vehicle_listing_id', carId);

      if (error) {
        console.error('Database error removing bookmark:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error removing bookmark from database:', error);
      return false;
    }
  }

  // Private methods for local storage operations
  private async getBookmarksFromStorage(): Promise<Bookmark[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting bookmarks from storage:', error);
      return [];
    }
  }

  private async addBookmarkToStorage(bookmark: Bookmark): Promise<boolean> {
    try {
      const bookmarks = await this.getBookmarksFromStorage();
      
      // Check if already exists
      const exists = bookmarks.some(b => b.carId === bookmark.carId);
      if (exists) return true;

      bookmarks.unshift(bookmark); // Add to beginning
      
      // Limit to 100 bookmarks for local storage
      if (bookmarks.length > 100) {
        bookmarks.length = 100;
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
      return true;
    } catch (error) {
      console.error('Error adding bookmark to storage:', error);
      return false;
    }
  }

  private async removeBookmarkFromStorage(carId: string): Promise<boolean> {
    try {
      const bookmarks = await this.getBookmarksFromStorage();
      const filtered = bookmarks.filter(b => b.carId !== carId);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('Error removing bookmark from storage:', error);
      return false;
    }
  }
}

export default SimpleBookmarksService;
