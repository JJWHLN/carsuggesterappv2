import React, { memo, useCallback } from 'react';
import {
  Pressable,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
} from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ModernButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ModernButton = memo<ModernButtonProps>(
  ({
    title,
    onPress,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    style,
    textStyle,
    testID,
    accessibilityLabel,
    accessibilityHint,
  }) => {
    const { colors } = useThemeColors();

    // Animation values
    const scale = useSharedValue(1);
    const opacity = useSharedValue(1);

    // Animated styles
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }));

    // Handle press animations
    const handlePressIn = useCallback(() => {
      scale.value = withSpring(0.95, { damping: 20, stiffness: 300 });
      if (variant === 'ghost' || variant === 'outline') {
        opacity.value = withTiming(0.7, { duration: 150 });
      }
    }, [variant]);

    const handlePressOut = useCallback(() => {
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 150 });
    }, []);

    const handlePress = useCallback(() => {
      if (!disabled && !loading) {
        onPress();
      }
    }, [disabled, loading, onPress]);

    // Get button styles based on variant and size
    const getButtonStyles = () => {
      const baseStyles = [
        styles.base,
        styles[size],
        fullWidth && styles.fullWidth,
      ];

      switch (variant) {
        case 'primary':
          return [
            ...baseStyles,
            { backgroundColor: colors.primary },
            styles.primary,
          ];
        case 'secondary':
          return [
            ...baseStyles,
            { backgroundColor: colors.white, borderColor: colors.border },
            styles.secondary,
          ];
        case 'outline':
          return [
            ...baseStyles,
            { borderColor: colors.primary, backgroundColor: 'transparent' },
            styles.outline,
          ];
        case 'ghost':
          return [
            ...baseStyles,
            { backgroundColor: 'transparent' },
            styles.ghost,
          ];
        case 'danger':
          return [
            ...baseStyles,
            { backgroundColor: colors.error },
            styles.danger,
          ];
        default:
          return baseStyles;
      }
    };

    // Get text styles based on variant
    const getTextStyles = () => {
      const baseTextStyles = [styles.text, styles[`${size}Text`]];

      switch (variant) {
        case 'primary':
          return [...baseTextStyles, { color: colors.white }];
        case 'secondary':
          return [...baseTextStyles, { color: colors.primary }];
        case 'outline':
          return [...baseTextStyles, { color: colors.primary }];
        case 'ghost':
          return [...baseTextStyles, { color: colors.primary }];
        case 'danger':
          return [...baseTextStyles, { color: colors.white }];
        default:
          return baseTextStyles;
      }
    };

    // Get loading indicator color
    const getLoadingColor = () => {
      switch (variant) {
        case 'primary':
        case 'danger':
          return colors.white;
        default:
          return colors.primary;
      }
    };

    const buttonStyles = getButtonStyles();
    const textStyles = getTextStyles();

    const renderContent = () => {
      if (loading) {
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={getLoadingColor()} />
          </View>
        );
      }

      const iconElement = icon && (
        <View
          style={[
            styles.iconContainer,
            iconPosition === 'right' && styles.iconRight,
          ]}
        >
          {icon}
        </View>
      );

      return (
        <View style={styles.contentContainer}>
          {iconPosition === 'left' && iconElement}
          <Text style={[textStyles, textStyle]} numberOfLines={1}>
            {title}
          </Text>
          {iconPosition === 'right' && iconElement}
        </View>
      );
    };

    // Use gradient for primary variant
    if (variant === 'primary' && !disabled) {
      return (
        <AnimatedPressable
          style={[animatedStyle, style]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          disabled={disabled || loading}
          testID={testID}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel || title}
          accessibilityHint={accessibilityHint}
          accessibilityState={{ disabled: disabled || loading }}
        >
          <LinearGradient
            colors={['#48cc6c', '#56d478']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[buttonStyles, disabled && styles.disabled]}
          >
            {renderContent()}
          </LinearGradient>
        </AnimatedPressable>
      );
    }

    return (
      <AnimatedPressable
        style={[
          animatedStyle,
          buttonStyles,
          disabled && styles.disabled,
          style,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || loading}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: disabled || loading }}
      >
        {renderContent()}
      </AnimatedPressable>
    );
  },
);

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },

  // Sizes
  small: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    minHeight: 52,
  },

  // Variants
  primary: {
    ...Shadows.button,
  },
  secondary: {
    borderWidth: 1,
    ...Shadows.sm,
  },
  outline: {
    borderWidth: 2,
  },
  ghost: {
    borderWidth: 0,
  },
  danger: {
    ...Shadows.button,
  },

  // Text sizes
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    ...Typography.sm,
  },
  mediumText: {
    ...Typography.base,
  },
  largeText: {
    ...Typography.lg,
  },

  // States
  disabled: {
    opacity: 0.5,
  },
  fullWidth: {
    width: '100%',
  },

  // Content layout
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginRight: 0,
    marginLeft: Spacing.sm,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

ModernButton.displayName = 'ModernButton';
