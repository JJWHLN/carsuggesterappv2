import React from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LoadingSpinner } from './LoadingSpinner';
import { AnimatedPressable } from './AnimatedPressable'; // Import AnimatedPressable
import { currentColors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors'; // Import Shadows

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'; // Added ghost variant
  size?: 'small' | 'medium' | 'large'; // Sizes can be adjusted if new design specifies different ones
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string; // Added accessibilityHint prop
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  accessibilityLabel,
  accessibilityHint, // Destructure accessibilityHint
}: ButtonProps) {
  const isDisabled = disabled || loading;

  // Base style includes common properties like flex direction, alignment, etc.
  // Variant styles handle background, border, and specific text colors.
  // Size styles handle padding and minHeight.
  // Shadow is applied based on variant.

  const getButtonStyles = () => {
    const baseStyle: ViewStyle = {
      ...styles.base,
      ...(styles[size] || styles.medium), // Default to medium size
      ...(styles[variant] || styles.primary), // Default to primary variant
    };
    if (variant === 'primary') {
      return [baseStyle, Shadows.button, isDisabled && styles.disabled, style];
    }
    return [baseStyle, isDisabled && styles.disabled, style];
  };

  const getTextStyle = () => {
    return [
      styles.textBase,
      styles[`${variant}Text`],
      // Size specific text styles can be added if needed, e.g. styles[`${size}Text`]
      isDisabled && styles.disabledText,
      textStyle,
    ];
  };

  const loadingSpinnerColor =
    variant === 'primary' ? currentColors.white : currentColors.primary;

  return (
    <AnimatedPressable
      style={getButtonStyles()}
      onPress={onPress}
      disabled={isDisabled}
      pressedScaleValue={0.95} // Design spec: Scale to 0.95
      animationDuration={150}  // Design spec: 150ms ease-out
      // Accessibility props for AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title} // Use provided label or default to title
      accessibilityHint={accessibilityHint} // Pass accessibilityHint
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <LoadingSpinner 
          size={20} // Standardized spinner size for buttons for now
          color={loadingSpinnerColor}
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md, // New: 12px from design system
    borderWidth: 2, // Secondary button has 2px border
    gap: Spacing.sm,
    // Default padding, will be overridden by size specific styles
    paddingHorizontal: Spacing.md, // Default padding 16px horizontal
    paddingVertical: Spacing.sm + Spacing.xs, // Default padding 12px vertical
    minHeight: 44, // Mobile optimized min height
  },
  primary: {
    backgroundColor: currentColors.primary,
    borderColor: currentColors.primary, // Border color same as bg for primary
    // Shadow is applied conditionally in getButtonStyles
  },
  secondary: { // Outline style from design system
    backgroundColor: currentColors.transparent,
    borderColor: currentColors.primary,
    borderWidth: 2,
  },
  outline: { // Keeping 'outline' similar to 'secondary' as per common patterns, can be removed if secondary is enough
    backgroundColor: currentColors.transparent,
    borderColor: currentColors.primary,
    borderWidth: 1, // Typically 1px for outline
  },
  ghost: {
    backgroundColor: currentColors.transparent,
    borderColor: currentColors.transparent, // No border for ghost
    borderWidth: 0,
  },
  // Size styles (padding and minHeight can be fine-tuned based on visual requirements)
  small: {
    paddingHorizontal: Spacing.md, // 16px
    paddingVertical: Spacing.xs,   // 4px to achieve ~36-40px height with text
    minHeight: 44, // Ensure minimum touch target height
    borderRadius: BorderRadius.sm, // Slightly smaller radius for small buttons
  },
  medium: { // This is the default applied in base, values here for clarity or if base defaults change
    paddingHorizontal: Spacing.md, // 16px
    paddingVertical: Spacing.sm + Spacing.xs, // 12px
    minHeight: 44,
  },
  large: {
    paddingHorizontal: Spacing.lg, // 24px
    paddingVertical: Spacing.md,   // 16px
    minHeight: 52,
    borderRadius: BorderRadius.lg, // Slightly larger radius for large buttons
  },
  disabled: {
    backgroundColor: currentColors.surfaceDark, // Using a neutral disabled color
    borderColor: currentColors.border,
    opacity: 0.6,
  },
  // Text styles
  textBase: {
    ...Typography.buttonText, // Uses 16px, SemiBold (600) from new Typography
    textAlign: 'center',
  },
  primaryText: {
    color: currentColors.white,
  },
  secondaryText: { // For outline button
    color: currentColors.primary,
  },
  outlineText: { // Similar to secondary
    color: currentColors.primary,
  },
  ghostText: {
    color: currentColors.primary,
  },
  disabledText: {
    color: currentColors.textMuted, // Muted text for disabled state
  },
  // Size specific text styles could be added here if needed, e.g.:
  // smallText: { fontSize: Typography.bodySmall.fontSize },
  // largeText: { fontSize: Typography.bodyLarge.fontSize },
});