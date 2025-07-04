import React, { memo } from 'react';
import { Pressable, PressableProps } from 'react-native';
import Animated from 'react-native-reanimated';
import { useScaleAnimation } from '@/hooks/useAnimatedValue';

interface AnimatedPressableProps extends PressableProps {
  children: React.ReactNode;
  pressedScaleValue?: number; // Changed from scaleValue
  animationDuration?: number; // New prop for duration
  hapticFeedback?: boolean;
}

const AnimatedPressable = memo<AnimatedPressableProps>(({
  children,
  onPressIn,
  onPressOut,
  pressedScaleValue = 0.95, // Default pressed scale, can be overridden by Button/Card
  animationDuration = 150, // Default duration
  hapticFeedback = true,
  ...props
}) => {
  const { scaleIn, scaleOut, animatedStyle } = useScaleAnimation(1, pressedScaleValue, animationDuration);

  const handlePressIn = (event: any) => {
    scaleOut(); // This will animate to pressedScaleValue
    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    scaleIn();
    onPressOut?.(event);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      {...props}
    >
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
});

AnimatedPressable.displayName = 'AnimatedPressable';

export { AnimatedPressable };