
/**
 * Optimized Storage Solution
 * Lightweight alternative to AsyncStorage where possible
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple storage for basic key-value pairs
export const SimpleStorage = {
  // Use native storage for simple strings
  setString: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      logger.error('Storage error:', error);
    }
  },
  
  getString: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      logger.error('Storage error:', error);
      return null;
    }
  },
  
  // For complex objects, use JSON (but consider if necessary)
  setObject: async (key: string, value: object) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      logger.error('Storage error:', error);
    }
  },
  
  getObject: async <T>(key: string): Promise<T | null> => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Storage error:', error);
      return null;
    }
  },
  
  remove: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      logger.error('Storage error:', error);
    }
  },
  
  clear: async () => {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      logger.error('Storage error:', error);
    }
  }
};

// Hook for reactive storage
export const useStorage = <T>(key: string, defaultValue: T) => {
  const [value, setValue] = useState<T>(defaultValue);
  
  useEffect(() => {
    SimpleStorage.getObject<T>(key).then(stored => {
      if (stored !== null) setValue(stored);
    });
  }, [key]);
  
  const updateValue = useCallback(async (newValue: T) => {
    setValue(newValue);
    await SimpleStorage.setObject(key, newValue);
  }, [key]);
  
  return [value, updateValue] as const;
};
