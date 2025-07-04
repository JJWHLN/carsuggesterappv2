import { useRef, useCallback } from 'react';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring,
  runOnJS,
  Easing
} from 'react-native-reanimated';

interface AnimationConfig {
  duration?: number;
  easing?: any;
  onComplete?: () => void;
}

export function useAnimatedValue(initialValue: number = 0) {
  const value = useSharedValue(initialValue);

  const animateTo = useCallback((
    toValue: number, 
    config: AnimationConfig = {}
  ) => {
    const { duration = 250, easing = Easing.out(Easing.quad), onComplete } = config;
    
    value.value = withTiming(toValue, { duration, easing }, (finished) => {
      if (finished && onComplete) {
        runOnJS(onComplete)();
      }
    });
  }, [value]);

  const springTo = useCallback((
    toValue: number,
    config: { damping?: number; stiffness?: number; onComplete?: () => void } = {}
  ) => {
    const { damping = 15, stiffness = 150, onComplete } = config;
    
    value.value = withSpring(toValue, { damping, stiffness }, (finished) => {
      if (finished && onComplete) {
        runOnJS(onComplete)();
      }
    });
  }, [value]);

  return { value, animateTo, springTo };
}

export function useFadeAnimation(initialOpacity: number = 0) {
  const opacity = useSharedValue(initialOpacity);

  const fadeIn = useCallback((duration: number = 250) => {
    opacity.value = withTiming(1, { duration });
  }, [opacity]);

  const fadeOut = useCallback((duration: number = 250) => {
    opacity.value = withTiming(0, { duration });
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return { fadeIn, fadeOut, animatedStyle, opacity };
}

export function useScaleAnimation(
  initialScale: number = 1,
  pressedScaleValue: number = 0.95, // Default pressed scale
  animationDuration: number = 150 // Default duration
) {
  const scale = useSharedValue(initialScale);

  const scaleIn = useCallback(() => { // Renaming to "animateToInitial" or similar might be clearer
    scale.value = withTiming(initialScale, { duration: animationDuration, easing: Easing.out(Easing.ease) });
  }, [scale, initialScale, animationDuration]);

  const scaleOut = useCallback(() => { // Renaming to "animateToPressed"
    scale.value = withTiming(pressedScaleValue, { duration: animationDuration, easing: Easing.out(Easing.ease) });
  }, [scale, pressedScaleValue, animationDuration]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // Returning scaleIn and scaleOut as before, but they now use withTiming and configurable parameters
  return { scaleIn, scaleOut, animatedStyle, scale };
}