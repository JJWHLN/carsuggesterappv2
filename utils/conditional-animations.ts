
/**
 * Conditional Animation Loading
 * Loads animation libraries only when needed
 */

import { useState, useEffect } from 'react';

let Reanimated: any = null;
let GestureHandler: any = null;

export const loadAnimationLibraries = async () => {
  if (!Reanimated) {
    try {
      Reanimated = await import('react-native-reanimated');
      GestureHandler = await import('react-native-gesture-handler');
      return { Reanimated, GestureHandler };
    } catch (error) {
      logger.warn('Animation libraries not available:', error);
      return null;
    }
  }
  return { Reanimated, GestureHandler };
};

// Hook for conditional animation loading
export const useAnimations = () => {
  const [animations, setAnimations] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const loadAnimations = async () => {
    if (animations) return animations;
    
    setLoading(true);
    const libs = await loadAnimationLibraries();
    setAnimations(libs);
    setLoading(false);
    return libs;
  };
  
  return { animations, loadAnimations, loading };
};

// Lightweight animation fallbacks
export const SimpleAnimations = {
  // Basic opacity animation without reanimated
  fadeIn: (ref: any, duration = 300) => {
    // Fallback to simple opacity change
    if (ref?.current) {
      ref.current.setNativeProps({ 
        style: { opacity: 1 },
        pointerEvents: 'auto'
      });
    }
  },
  
  fadeOut: (ref: any, duration = 300) => {
    if (ref?.current) {
      ref.current.setNativeProps({ 
        style: { opacity: 0 },
        pointerEvents: 'none'
      });
    }
  }
};
