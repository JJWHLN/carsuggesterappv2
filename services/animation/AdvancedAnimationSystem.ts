/**
 * Advanced Animation System for Phase 2
 * 
 * Provides sophisticated animations and micro-interactions for premium UX
 * Features:
 * - Micro-interactions for better user feedback
 * - Page transition animations
 * - Loading state animations
 * - Gesture-based interactions
 * - Performance-optimized animations
 */

import { Animated, Easing, InteractionManager } from 'react-native';
import { useRef, useEffect, useCallback } from 'react';

// Animation configuration
export const ANIMATION_CONFIG = {
  // Timing configurations
  FAST: 150,
  NORMAL: 250,
  SLOW: 400,
  VERY_SLOW: 600,
  
  // Easing curves
  EASE_OUT: Easing.out(Easing.cubic),
  EASE_IN: Easing.in(Easing.cubic),
  EASE_IN_OUT: Easing.inOut(Easing.cubic),
  BOUNCE: Easing.bounce,
  SPRING: Easing.elastic(1.3),
  
  // Spring configurations
  SPRING_CONFIG: {
    tension: 100,
    friction: 8,
    useNativeDriver: true,
  },
  
  GENTLE_SPRING: {
    tension: 50,
    friction: 7,
    useNativeDriver: true,
  },
  
  BOUNCY_SPRING: {
    tension: 120,
    friction: 6,
    useNativeDriver: true,
  },
};

// Micro-interaction animations
export class MicroInteractions {
  // Button press animation
  static createPressAnimation(scale: Animated.Value) {
    return {
      onPressIn: () => {
        Animated.spring(scale, {
          toValue: 0.95,
          ...ANIMATION_CONFIG.GENTLE_SPRING,
        }).start();
      },
      onPressOut: () => {
        Animated.spring(scale, {
          toValue: 1,
          ...ANIMATION_CONFIG.GENTLE_SPRING,
        }).start();
      },
    };
  }

  // Tap to highlight animation
  static createHighlightAnimation(
    opacity: Animated.Value,
    backgroundColor: Animated.Value
  ) {
    return () => {
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: ANIMATION_CONFIG.FAST,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: ANIMATION_CONFIG.FAST,
          useNativeDriver: true,
        }),
      ]).start();
    };
  }

  // Success feedback animation
  static createSuccessAnimation(scale: Animated.Value) {
    return () => {
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.1,
          ...ANIMATION_CONFIG.BOUNCY_SPRING,
        }),
        Animated.spring(scale, {
          toValue: 1,
          ...ANIMATION_CONFIG.GENTLE_SPRING,
        }),
      ]).start();
    };
  }

  // Error shake animation
  static createShakeAnimation(translateX: Animated.Value) {
    return () => {
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    };
  }
}

// Page transition animations
export class PageTransitions {
  // Slide from right transition
  static slideFromRight(translateX: Animated.Value) {
    return {
      enter: () => {
        translateX.setValue(300);
        Animated.timing(translateX, {
          toValue: 0,
          duration: ANIMATION_CONFIG.NORMAL,
          easing: ANIMATION_CONFIG.EASE_OUT,
          useNativeDriver: true,
        }).start();
      },
      exit: () => {
        Animated.timing(translateX, {
          toValue: -300,
          duration: ANIMATION_CONFIG.NORMAL,
          easing: ANIMATION_CONFIG.EASE_IN,
          useNativeDriver: true,
        }).start();
      },
    };
  }

  // Fade transition
  static fade(opacity: Animated.Value) {
    return {
      enter: () => {
        opacity.setValue(0);
        Animated.timing(opacity, {
          toValue: 1,
          duration: ANIMATION_CONFIG.NORMAL,
          useNativeDriver: true,
        }).start();
      },
      exit: () => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: ANIMATION_CONFIG.FAST,
          useNativeDriver: true,
        }).start();
      },
    };
  }

  // Scale transition
  static scale(scale: Animated.Value) {
    return {
      enter: () => {
        scale.setValue(0.8);
        Animated.spring(scale, {
          toValue: 1,
          ...ANIMATION_CONFIG.SPRING_CONFIG,
        }).start();
      },
      exit: () => {
        Animated.timing(scale, {
          toValue: 0.8,
          duration: ANIMATION_CONFIG.FAST,
          useNativeDriver: true,
        }).start();
      },
    };
  }
}

// Loading animations
export class LoadingAnimations {
  // Pulse animation for loading states
  static createPulseAnimation(scale: Animated.Value) {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.05,
          duration: ANIMATION_CONFIG.NORMAL,
          easing: ANIMATION_CONFIG.EASE_IN_OUT,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: ANIMATION_CONFIG.NORMAL,
          easing: ANIMATION_CONFIG.EASE_IN_OUT,
          useNativeDriver: true,
        }),
      ])
    );
    
    return {
      start: () => pulse.start(),
      stop: () => pulse.stop(),
    };
  }

  // Rotation animation for spinners
  static createSpinAnimation(rotate: Animated.Value) {
    const spin = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    return {
      start: () => spin.start(),
      stop: () => spin.stop(),
    };
  }

  // Skeleton shimmer animation
  static createShimmerAnimation(translateX: Animated.Value, width: number) {
    const shimmer = Animated.loop(
      Animated.timing(translateX, {
        toValue: width,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    return {
      start: () => {
        translateX.setValue(-width);
        shimmer.start();
      },
      stop: () => shimmer.stop(),
    };
  }
}

// Gesture-based animations
export class GestureAnimations {
  // Swipe to delete animation
  static createSwipeDeleteAnimation(
    translateX: Animated.Value,
    opacity: Animated.Value,
    onDelete: () => void
  ) {
    return {
      onSwipeStart: () => {
        // Visual feedback on swipe start
      },
      onSwipeComplete: () => {
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 300,
            duration: ANIMATION_CONFIG.NORMAL,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: ANIMATION_CONFIG.NORMAL,
            useNativeDriver: true,
          }),
        ]).start(onDelete);
      },
      onSwipeCancel: () => {
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            ...ANIMATION_CONFIG.SPRING_CONFIG,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: ANIMATION_CONFIG.FAST,
            useNativeDriver: true,
          }),
        ]).start();
      },
    };
  }

  // Pull to refresh animation
  static createPullToRefreshAnimation(
    translateY: Animated.Value,
    rotate: Animated.Value
  ) {
    return {
      onPull: (progress: number) => {
        translateY.setValue(progress * 100);
        rotate.setValue(progress * 2);
      },
      onRefresh: () => {
        const spin = Animated.loop(
          Animated.timing(rotate, {
            toValue: 1,
            duration: 1000,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        );
        spin.start();
        return () => spin.stop();
      },
      onComplete: () => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: ANIMATION_CONFIG.NORMAL,
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 0,
            duration: ANIMATION_CONFIG.NORMAL,
            useNativeDriver: true,
          }),
        ]).start();
      },
    };
  }
}

// Custom hooks for animations
export const useAnimatedValue = (initialValue = 0) => {
  return useRef(new Animated.Value(initialValue)).current;
};

export const useFadeAnimation = (duration = ANIMATION_CONFIG.NORMAL) => {
  const opacity = useAnimatedValue(0);
  
  const fadeIn = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    }).start();
  }, [opacity, duration]);

  const fadeOut = useCallback(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration,
      useNativeDriver: true,
    }).start();
  }, [opacity, duration]);

  return { opacity, fadeIn, fadeOut };
};

export const useScaleAnimation = () => {
  const scale = useAnimatedValue(1);
  
  const scaleIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      ...ANIMATION_CONFIG.SPRING_CONFIG,
    }).start();
  }, [scale]);

  const scaleOut = useCallback(() => {
    Animated.timing(scale, {
      toValue: 0,
      duration: ANIMATION_CONFIG.FAST,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const press = MicroInteractions.createPressAnimation(scale);

  return { scale, scaleIn, scaleOut, ...press };
};

export const useSlideAnimation = (direction: 'up' | 'down' | 'left' | 'right' = 'up') => {
  const translateX = useAnimatedValue(0);
  const translateY = useAnimatedValue(0);
  
  const slideIn = useCallback(() => {
    const animatedValue = direction === 'left' || direction === 'right' ? translateX : translateY;
    const initialValue = direction === 'up' ? 50 : direction === 'down' ? -50 : 
                        direction === 'left' ? 50 : -50;
    
    animatedValue.setValue(initialValue);
    Animated.spring(animatedValue, {
      toValue: 0,
      ...ANIMATION_CONFIG.SPRING_CONFIG,
    }).start();
  }, [translateX, translateY, direction]);

  const slideOut = useCallback(() => {
    const animatedValue = direction === 'left' || direction === 'right' ? translateX : translateY;
    const finalValue = direction === 'up' ? -50 : direction === 'down' ? 50 : 
                      direction === 'left' ? -50 : 50;
    
    Animated.timing(animatedValue, {
      toValue: finalValue,
      duration: ANIMATION_CONFIG.FAST,
      useNativeDriver: true,
    }).start();
  }, [translateX, translateY, direction]);

  return { 
    translateX, 
    translateY, 
    slideIn, 
    slideOut,
    transform: [
      { translateX },
      { translateY }
    ]
  };
};

// Performance optimized animation manager
export class AnimationManager {
  private static activeAnimations = new Set<string>();
  
  static startAnimation(id: string, animation: Animated.CompositeAnimation) {
    if (this.activeAnimations.has(id)) {
      return; // Animation already running
    }
    
    this.activeAnimations.add(id);
    
    // Use InteractionManager to ensure animations don't block user interactions
    InteractionManager.runAfterInteractions(() => {
      animation.start(() => {
        this.activeAnimations.delete(id);
      });
    });
  }
  
  static stopAnimation(id: string) {
    this.activeAnimations.delete(id);
  }
  
  static isAnimationActive(id: string): boolean {
    return this.activeAnimations.has(id);
  }
  
  static stopAllAnimations() {
    this.activeAnimations.clear();
  }
}

export default {
  MicroInteractions,
  PageTransitions,
  LoadingAnimations,
  GestureAnimations,
  AnimationManager,
  ANIMATION_CONFIG,
};
