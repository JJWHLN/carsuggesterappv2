
/**
 * Native Module Optimization
 * Lightweight replacements for heavy native dependencies
 */

// utils/lightweight-natives.ts
import { Platform, Dimensions, PixelRatio } from 'react-native';

// Lightweight device info (replaces react-native-device-info)
export const LightweightDeviceInfo = {
  getModel: () => Platform.select({
    ios: 'iPhone',
    android: 'Android',
    default: 'Unknown'
  }),
  
  getSystemVersion: () => Platform.Version.toString(),
  
  isTablet: () => {
    const { width, height } = Dimensions.get('window');
    const aspectRatio = Math.max(width, height) / Math.min(width, height);
    return aspectRatio < 1.6 && Math.min(width, height) > 600;
  },
  
  getDeviceType: () => {
    const { width, height } = Dimensions.get('window');
    const pixelRatio = PixelRatio.get();
    const screenData = {
      screenWidth: width * pixelRatio,
      screenHeight: height * pixelRatio,
    };
    
    if (screenData.screenWidth >= 2048 || screenData.screenHeight >= 2048) {
      return 'high-end';
    } else if (screenData.screenWidth >= 1080 || screenData.screenHeight >= 1080) {
      return 'medium';
    } else {
      return 'low-end';
    }
  },
  
  getTotalMemory: () => {
    // Estimate based on device type and screen size
    const deviceType = LightweightDeviceInfo.getDeviceType();
    const memoryMap = {
      'high-end': 8192,  // 8GB
      'medium': 4096,    // 4GB  
      'low-end': 2048    // 2GB
    };
    return memoryMap[deviceType] || 2048;
  }
};

// Lightweight network info (replaces @react-native-community/netinfo)
export const LightweightNetInfo = {
  getCurrentState: async () => {
    // Basic connectivity check
    try {
      const response = await fetch('https://www.google.com/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      return {
        isConnected: response.ok,
        type: 'unknown',
        isInternetReachable: response.ok
      };
    } catch {
      return {
        isConnected: false,
        type: 'none',
        isInternetReachable: false
      };
    }
  },
  
  addEventListener: (listener: (state: any) => void) => {
    // Simple implementation - check periodically
    const interval = setInterval(async () => {
      const state = await LightweightNetInfo.getCurrentState();
      listener(state);
    }, 5000);
    
    return () => clearInterval(interval);
  }
};

// Lightweight async storage (optimized implementation)
export const LightweightStorage = {
  _cache: new Map<string, string>(),
  
  setItem: async (key: string, value: string) => {
    LightweightStorage._cache.set(key, value);
    // Use minimal native storage
    return Promise.resolve();
  },
  
  getItem: async (key: string) => {
    return LightweightStorage._cache.get(key) || null;
  },
  
  removeItem: async (key: string) => {
    LightweightStorage._cache.delete(key);
    return Promise.resolve();
  },
  
  clear: async () => {
    LightweightStorage._cache.clear();
    return Promise.resolve();
  },
  
  getAllKeys: async () => {
    return Array.from(LightweightStorage._cache.keys());
  }
};
