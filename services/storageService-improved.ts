import { BaseService } from './BaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole } from '../types/database';

/**
 * Enhanced Storage Service with consolidated patterns and better caching
 */

interface StorageItem<T = any> {
  value: T;
  timestamp: number;
  expiresAt?: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  compress?: boolean;
  encrypt?: boolean;
}

interface StorageStats {
  totalKeys: number;
  totalSize: number;
  expired: number;
  compressed: number;
  encrypted: number;
}

export class StorageService {
  private static instance: StorageService;
  private memoryCache = new Map<string, StorageItem>();
  private readonly CACHE_PREFIX = '@CarSuggester:';
  private readonly MAX_MEMORY_CACHE_SIZE = 100;

  private constructor() {
    super();
    this.initializeService();
  }

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Initialize the storage service
   */
  private async initializeService(): Promise<void> {
    try {
      await this.cleanupExpiredItems();
      await this.loadMemoryCache();
    } catch (error) {
      this.handleError(error, 'Failed to initialize storage service');
    }
  }

  /**
   * Store a value with optional caching and expiration
   */
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    return this.executeQuery(async () => {
      const storageKey = this.getStorageKey(key);
      const expiresAt = options.ttl ? Date.now() + options.ttl : undefined;
      
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        expiresAt,
      };

      // Process value if needed
      let processedValue = value;
      if (options.compress) {
        processedValue = await this.compressValue(value);
      }
      if (options.encrypt) {
        processedValue = await this.encryptValue(processedValue);
      }

      // Store in AsyncStorage
      await AsyncStorage.setItem(storageKey, JSON.stringify({
        ...item,
        value: processedValue,
      }));

      // Update memory cache
      this.updateMemoryCache(key, item);
    }, 'Failed to store value');
  }

  /**
   * Get a value with automatic cache checking and expiration
   */
  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    return this.executeQuery(async () => {
      // Check memory cache first
      const cachedItem = this.memoryCache.get(key);
      if (cachedItem && this.isItemValid(cachedItem)) {
        return cachedItem.value as T;
      }

      // Check AsyncStorage
      const storageKey = this.getStorageKey(key);
      const stored = await AsyncStorage.getItem(storageKey);
      
      if (!stored) {
        return defaultValue;
      }

      try {
        const item: StorageItem<T> = JSON.parse(stored);
        
        // Check expiration
        if (!this.isItemValid(item)) {
          await this.remove(key);
          return defaultValue;
        }

        // Update memory cache
        this.updateMemoryCache(key, item);
        
        return item.value;
      } catch (error) {
        console.warn('Failed to parse stored value for key:', key);
        return defaultValue;
      }
    }, 'Failed to get value', defaultValue);
  }

  /**
   * Remove a value from storage
   */
  async remove(key: string): Promise<void> {
    return this.executeQuery(async () => {
      const storageKey = this.getStorageKey(key);
      await AsyncStorage.removeItem(storageKey);
      this.memoryCache.delete(key);
    }, 'Failed to remove value');
  }

  /**
   * Clear all storage
   */
  async clear(): Promise<void> {
    return this.executeQuery(async () => {
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      await AsyncStorage.multiRemove(appKeys);
      this.memoryCache.clear();
    }, 'Failed to clear storage');
  }

  /**
   * Check if a key exists
   */
  async has(key: string): Promise<boolean> {
    return this.executeQuery(async () => {
      // Check memory cache first
      if (this.memoryCache.has(key)) {
        const item = this.memoryCache.get(key)!;
        if (this.isItemValid(item)) {
          return true;
        }
      }

      // Check AsyncStorage
      const storageKey = this.getStorageKey(key);
      const value = await AsyncStorage.getItem(storageKey);
      
      if (!value) return false;

      try {
        const item: StorageItem = JSON.parse(value);
        return this.isItemValid(item);
      } catch {
        return false;
      }
    }, 'Failed to check key existence', false);
  }

  /**
   * Get all keys with optional filter
   */
  async getKeys(filter?: string): Promise<string[]> {
    return this.executeQuery(async () => {
      const keys = await AsyncStorage.getAllKeys();
      let appKeys = keys
        .filter(key => key.startsWith(this.CACHE_PREFIX))
        .map(key => key.replace(this.CACHE_PREFIX, ''));

      if (filter) {
        appKeys = appKeys.filter(key => key.includes(filter));
      }

      return appKeys;
    }, 'Failed to get keys', []);
  }

  /**
   * Get storage statistics
   */
  async getStats(): Promise<StorageStats> {
    return this.executeQuery(async () => {
      const keys = await this.getKeys();
      let totalSize = 0;
      let expired = 0;
      let compressed = 0;
      let encrypted = 0;

      for (const key of keys) {
        try {
          const storageKey = this.getStorageKey(key);
          const value = await AsyncStorage.getItem(storageKey);
          if (value) {
            totalSize += value.length;
            const item: StorageItem = JSON.parse(value);
            
            if (!this.isItemValid(item)) {
              expired++;
            }
            // Note: In a real implementation, you'd track compression/encryption flags
          }
        } catch {
          // Skip invalid items
        }
      }

      return {
        totalKeys: keys.length,
        totalSize,
        expired,
        compressed,
        encrypted,
      };
    }, 'Failed to get storage stats', {
      totalKeys: 0,
      totalSize: 0,
      expired: 0,
      compressed: 0,
      encrypted: 0,
    });
  }

  /**
   * User-specific storage methods
   */
  async setUserData<T>(userId: string, key: string, value: T, options?: CacheOptions): Promise<void> {
    const userKey = `user:${userId}:${key}`;
    return this.set(userKey, value, options);
  }

  async getUserData<T>(userId: string, key: string, defaultValue?: T): Promise<T | undefined> {
    const userKey = `user:${userId}:${key}`;
    return this.get(userKey, defaultValue);
  }

  async removeUserData(userId: string, key: string): Promise<void> {
    const userKey = `user:${userId}:${key}`;
    return this.remove(userKey);
  }

  async clearUserData(userId: string): Promise<void> {
    return this.executeQuery(async () => {
      const keys = await this.getKeys(`user:${userId}:`);
      await Promise.all(keys.map(key => this.remove(key)));
    }, 'Failed to clear user data');
  }

  /**
   * Session storage methods
   */
  async setSessionData<T>(key: string, value: T): Promise<void> {
    const sessionKey = `session:${key}`;
    return this.set(sessionKey, value, { ttl: 24 * 60 * 60 * 1000 }); // 24 hours
  }

  async getSessionData<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const sessionKey = `session:${key}`;
    return this.get(sessionKey, defaultValue);
  }

  async clearSessionData(): Promise<void> {
    return this.executeQuery(async () => {
      const keys = await this.getKeys('session:');
      await Promise.all(keys.map(key => this.remove(key)));
    }, 'Failed to clear session data');
  }

  /**
   * Cache management methods
   */
  async setCache<T>(key: string, value: T, ttl: number = 60 * 60 * 1000): Promise<void> {
    const cacheKey = `cache:${key}`;
    return this.set(cacheKey, value, { ttl });
  }

  async getCache<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const cacheKey = `cache:${key}`;
    return this.get(cacheKey, defaultValue);
  }

  async invalidateCache(pattern?: string): Promise<void> {
    return this.executeQuery(async () => {
      const prefix = pattern ? `cache:${pattern}` : 'cache:';
      const keys = await this.getKeys(prefix);
      await Promise.all(keys.map(key => this.remove(key)));
    }, 'Failed to invalidate cache');
  }

  /**
   * Batch operations
   */
  async multiSet<T>(items: Array<{ key: string; value: T; options?: CacheOptions }>): Promise<void> {
    return this.executeQuery(async () => {
      await Promise.all(
        items.map(item => this.set(item.key, item.value, item.options))
      );
    }, 'Failed to set multiple items');
  }

  async multiGet<T>(keys: string[]): Promise<Array<{ key: string; value: T | undefined }>> {
    return this.executeQuery(async () => {
      const results = await Promise.all(
        keys.map(async key => ({
          key,
          value: await this.get<T>(key),
        }))
      );
      return results;
    }, 'Failed to get multiple items', []);
  }

  async multiRemove(keys: string[]): Promise<void> {
    return this.executeQuery(async () => {
      await Promise.all(keys.map(key => this.remove(key)));
    }, 'Failed to remove multiple items');
  }

  /**
   * Utility methods
   */
  private getStorageKey(key: string): string {
    return `${this.CACHE_PREFIX}${key}`;
  }

  private isItemValid(item: StorageItem): boolean {
    if (!item.expiresAt) return true;
    return Date.now() < item.expiresAt;
  }

  private updateMemoryCache<T>(key: string, item: StorageItem<T>): void {
    // Implement LRU cache
    if (this.memoryCache.size >= this.MAX_MEMORY_CACHE_SIZE) {
      const firstKey = this.memoryCache.keys().next().value;
      this.memoryCache.delete(firstKey);
    }
    this.memoryCache.set(key, item);
  }

  private async loadMemoryCache(): Promise<void> {
    try {
      // Load frequently used items into memory cache
      const recentKeys = ['user:current', 'app:settings', 'cache:recent_searches'];
      for (const key of recentKeys) {
        const value = await this.get(key);
        if (value !== undefined) {
          // Already loaded by get() call
        }
      }
    } catch (error) {
      console.warn('Failed to load memory cache:', error);
    }
  }

  private async cleanupExpiredItems(): Promise<void> {
    try {
      const keys = await this.getKeys();
      const cleanupPromises = keys.map(async (key) => {
        try {
          const storageKey = this.getStorageKey(key);
          const stored = await AsyncStorage.getItem(storageKey);
          if (stored) {
            const item: StorageItem = JSON.parse(stored);
            if (!this.isItemValid(item)) {
              await this.remove(key);
            }
          }
        } catch {
          // Skip invalid items
        }
      });

      await Promise.all(cleanupPromises);
    } catch (error) {
      console.warn('Failed to cleanup expired items:', error);
    }
  }

  private async compressValue<T>(value: T): Promise<T> {
    // In a real implementation, you would compress the value
    // For now, just return the value as-is
    return value;
  }

  private async encryptValue<T>(value: T): Promise<T> {
    // In a real implementation, you would encrypt the value
    // For now, just return the value as-is
    return value;
  }
}

// Export singleton instance
export const Storage = StorageService.getInstance();

// Convenience functions for common storage patterns
export const setUserPreference = async <T>(userId: string, key: string, value: T): Promise<void> => {
  return Storage.setUserData(userId, `preferences:${key}`, value);
};

export const getUserPreference = async <T>(userId: string, key: string, defaultValue?: T): Promise<T | undefined> => {
  return Storage.getUserData(userId, `preferences:${key}`, defaultValue);
};

export const setAppSetting = async <T>(key: string, value: T): Promise<void> => {
  return Storage.set(`app:settings:${key}`, value);
};

export const getAppSetting = async <T>(key: string, defaultValue?: T): Promise<T | undefined> => {
  return Storage.get(`app:settings:${key}`, defaultValue);
};

export const cacheApiResponse = async <T>(endpoint: string, data: T, ttl?: number): Promise<void> => {
  return Storage.setCache(`api:${endpoint}`, data, ttl);
};

export const getCachedApiResponse = async <T>(endpoint: string): Promise<T | undefined> => {
  return Storage.getCache(`api:${endpoint}`);
};

export const setRecentSearch = async (query: string, userId?: string): Promise<void> => {
  const key = userId ? `recent_searches:${userId}` : 'recent_searches:guest';
  const recent = await Storage.get<string[]>(key, []);
  const updated = [query, ...recent.filter(q => q !== query)].slice(0, 10);
  return Storage.set(key, updated, { ttl: 7 * 24 * 60 * 60 * 1000 }); // 7 days
};

export const getRecentSearches = async (userId?: string): Promise<string[]> => {
  const key = userId ? `recent_searches:${userId}` : 'recent_searches:guest';
  return Storage.get(key, []);
};

export default Storage;
