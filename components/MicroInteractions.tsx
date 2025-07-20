import React, { memo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useThemeColors } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Shadows } from '@/constants/Colors';

const { width, height } = Dimensions.get('window');

interface MicroInteractionProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  enabled?: boolean;
  hapticFeedback?: 'light' | 'medium' | 'heavy' | 'selection';
  animationType?: 'scale' | 'bounce' | 'glow';
  style?: any;
}

export const MicroInteraction = memo<MicroInteractionProps>(({
  children,
  onPress,
  onLongPress,
  enabled = true,
  hapticFeedback = 'light',
  animationType = 'scale',
  style,
}) => {
  const { colors } = useThemeColors();
  const styles = getThemedStyles(colors);

  // Animation values
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const pressProgress = useSharedValue(0);

  // Haptic feedback helper
  const triggerHaptics = useCallback(async (type: string) => {
    if (!enabled) return;
    
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'selection':
        await Haptics.selectionAsync();
        break;
    }
  }, [enabled]);

  const handlePressIn = useCallback(() => {
    if (!enabled) return;
    
    triggerHaptics(hapticFeedback);
    pressProgress.value = withTiming(1, { duration: 150 });
    
    switch (animationType) {
      case 'scale':
        scale.value = withSpring(0.95, { stiffness: 400 });
        break;
      case 'bounce':
        scale.value = withSpring(0.9, { stiffness: 600 });
        break;
      case 'glow':
        glowOpacity.value = withTiming(0.3, { duration: 150 });
        break;
    }
  }, [enabled, hapticFeedback, animationType]);

  const handlePressOut = useCallback(() => {
    if (!enabled) return;
    
    pressProgress.value = withTiming(0, { duration: 200 });
    
    switch (animationType) {
      case 'scale':
      case 'bounce':
        scale.value = withSpring(1, { stiffness: 400 });
        break;
      case 'glow':
        glowOpacity.value = withTiming(0, { duration: 300 });
        break;
    }
  }, [enabled, animationType]);

  // Animated styles based on animation type
  const animatedStyle = useAnimatedStyle(() => {
    const interpolatedScale = interpolate(
      pressProgress.value,
      [0, 1],
      [1, animationType === 'bounce' ? 0.85 : 0.95],
      Extrapolate.CLAMP
    );

    return {
      transform: [
        { scale: scale.value * interpolatedScale },
      ],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
    };
  });

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!enabled}
      style={style}
    >
      <Animated.View style={[styles.container, animatedStyle]}>
        {/* Glow effect for 'glow' animation type */}
        {animationType === 'glow' && (
          <Animated.View style={[styles.glowEffect, glowStyle]}>
            <LinearGradient
              colors={[colors.primary + '40', colors.primary + '20', 'transparent']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        )}
        
        {/* Content */}
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
});

// Enhanced Floating Action Button with micro-interactions
interface FloatingActionButtonProps {
  onPress: () => void;
  icon: React.ReactNode;
  style?: any;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'danger';
}

export const FloatingActionButton = memo<FloatingActionButtonProps>(({
  onPress,
  icon,
  style,
  size = 'medium',
  variant = 'primary',
}) => {
  const { colors } = useThemeColors();
  const styles = getThemedStyles(colors);

  const sizeStyle = {
    small: { width: 48, height: 48, borderRadius: 24 },
    medium: { width: 56, height: 56, borderRadius: 28 },
    large: { width: 64, height: 64, borderRadius: 32 },
  };

  const variantColors = {
    primary: [colors.primary, colors.primaryHover] as const,
    secondary: [colors.textSecondary, colors.text] as const,
    danger: ['#EF4444', '#DC2626'] as const,
  };

  return (
    <MicroInteraction
      onPress={onPress}
      hapticFeedback="medium"
      animationType="bounce"
      style={[styles.fab, sizeStyle[size], style]}
    >
      <LinearGradient
        colors={variantColors[variant]}
        style={[StyleSheet.absoluteFillObject, sizeStyle[size]]}
      >
        <View style={styles.fabContent}>
          {icon}
        </View>
      </LinearGradient>
    </MicroInteraction>
  );
});

const getThemedStyles = (colors: any) => {
  return StyleSheet.create({
    container: {
      position: 'relative',
    },
    glowEffect: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: BorderRadius.lg,
      zIndex: -1,
    },
    fab: {
      ...Shadows.large,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    fabContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
};
