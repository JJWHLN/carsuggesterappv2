import React, { memo } from 'react';
import {
  TouchableOpacity,
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
import { useTheme } from '@/theme/ThemeContext';
import { Typography, ComponentSizes, BorderRadius, Spacing } from '@/theme/Theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  destructive?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const Button = memo<ButtonProps>(({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  destructive = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  testID,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  // Animation handlers
  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 100 });
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 100 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Get button height based on size
  const getButtonHeight = () => {
    switch (size) {
      case 'small':
        return ComponentSizes.buttonHeight.small;
      case 'large':
        return ComponentSizes.buttonHeight.large;
      default:
        return ComponentSizes.buttonHeight.medium;
    }
  };

  // Get typography based on size
  const getTypography = () => {
    switch (size) {
      case 'small':
        return Typography.buttonSmall;
      default:
        return Typography.button;
    }
  };

  // Get button styles based on variant
  const getButtonStyles = () => {
    const baseStyle = {
      height: getButtonHeight(),
      borderRadius: BorderRadius.lg,
      paddingHorizontal: size === 'small' ? Spacing.md : Spacing.lg,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      width: fullWidth ? '100%' as const : undefined,
    };

    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors.secondary,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: colors.primary,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: colors.error,
        };
      default:
        return baseStyle;
    }
  };

  // Get text styles based on variant
  const getTextStyles = () => {
    const baseTypography = getTypography();
    
    switch (variant) {
      case 'primary':
        return {
          ...baseTypography,
          color: colors.textInverse,
        };
      case 'secondary':
        return {
          ...baseTypography,
          color: colors.text,
        };
      case 'outline':
        return {
          ...baseTypography,
          color: colors.primary,
        };
      case 'ghost':
        return {
          ...baseTypography,
          color: colors.primary,
        };
      case 'danger':
        return {
          ...baseTypography,
          color: colors.textInverse,
        };
      default:
        return baseTypography;
    }
  };

  // Render button content
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator 
            size="small" 
            color={variant === 'primary' || variant === 'danger' ? colors.textInverse : colors.primary}
          />
          <Text style={[getTextStyles(), styles.loadingText, textStyle]}>
            {title}
          </Text>
        </View>
      );
    }

    const iconElement = icon && (
      <View style={[
        styles.iconContainer,
        iconPosition === 'right' && styles.iconRight
      ]}>
        {icon}
      </View>
    );

    return (
      <View style={styles.contentContainer}>
        {iconPosition === 'left' && iconElement}
        <Text style={[getTextStyles(), textStyle]}>{title}</Text>
        {iconPosition === 'right' && iconElement}
      </View>
    );
  };

  // Render with gradient for primary button
  if (variant === 'primary' && !disabled) {
    return (
      <AnimatedTouchableOpacity
        style={[animatedStyle, style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        testID={testID}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
        accessibilityState={{ disabled: disabled || loading }}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[getButtonStyles(), disabled && styles.disabled]}
        >
          {renderContent()}
        </LinearGradient>
      </AnimatedTouchableOpacity>
    );
  }

  // Regular button without gradient
  return (
    <AnimatedTouchableOpacity
      style={[
        animatedStyle,
        getButtonStyles(),
        disabled && styles.disabled,
        style
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      testID={testID}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
    >
      {renderContent()}
    </AnimatedTouchableOpacity>
  );
});

Button.displayName = 'Button';

const styles = StyleSheet.create({
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginHorizontal: Spacing.xs,
  },
  iconRight: {
    marginLeft: Spacing.sm,
    marginRight: 0,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: Spacing.sm,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default Button;