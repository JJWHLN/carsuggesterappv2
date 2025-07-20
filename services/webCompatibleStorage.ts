import { Platform } from 'react-native';

/**
 * Web-compatible storage wrapper that handles platform differences
 */
class WebCompatibleStorage {
  private isWeb = Platform.OS === 'web';
  private asyncStorage: any = null;

  constructor() {
    // Only import AsyncStorage on non-web platforms
    if (!this.isWeb) {
      try {
        // Dynamic import for AsyncStorage only on native platforms
        this.asyncStorage = require('@react-native-async-storage/async-storage').default;
      } catch (error) {
        logger.warn('AsyncStorage not available, falling back to memory storage');
      }
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (this.isWeb) {
        // Use localStorage on web
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      } else {
        // Use AsyncStorage on native
        return this.asyncStorage ? await this.asyncStorage.getItem(key) : null;
      }
    } catch (error) {
      logger.warn(`Error getting item ${key}:`, error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (this.isWeb) {
        // Use localStorage on web
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } else {
        // Use AsyncStorage on native
        if (this.asyncStorage) {
          await this.asyncStorage.setItem(key, value);
        }
      }
    } catch (error) {
      logger.warn(`Error setting item ${key}:`, error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (this.isWeb) {
        // Use localStorage on web
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } else {
        // Use AsyncStorage on native
        if (this.asyncStorage) {
          await this.asyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      logger.warn(`Error removing item ${key}:`, error);
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      if (this.isWeb) {
        // Use localStorage on web
        if (typeof window !== 'undefined' && window.localStorage) {
          return Object.keys(window.localStorage);
        }
        return [];
      } else {
        // Use AsyncStorage on native
        return this.asyncStorage ? await this.asyncStorage.getAllKeys() : [];
      }
    } catch (error) {
      logger.warn('Error getting all keys:', error);
      return [];
    }
  }

  async multiRemove(keys: string[]): Promise<void> {
    try {
      if (this.isWeb) {
        // Use localStorage on web
        if (typeof window !== 'undefined' && window.localStorage) {
          keys.forEach(key => window.localStorage.removeItem(key));
        }
      } else {
        // Use AsyncStorage on native
        if (this.asyncStorage) {
          await this.asyncStorage.multiRemove(keys);
        }
      }
    } catch (error) {
      logger.warn('Error removing multiple items:', error);
    }
  }

  async clear(): Promise<void> {
    try {
      if (this.isWeb) {
        // Use localStorage on web
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.clear();
        }
      } else {
        // Use AsyncStorage on native
        if (this.asyncStorage) {
          await this.asyncStorage.clear();
        }
      }
    } catch (error) {
      logger.warn('Error clearing storage:', error);
    }
  }
}

// Create a singleton instance
export const webCompatibleStorage = new WebCompatibleStorage();

// Export as default for compatibility
export default webCompatibleStorage;
