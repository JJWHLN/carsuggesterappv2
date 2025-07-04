import React from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LoadingSpinner } from './LoadingSpinner';
import { AnimatedPressable } from './AnimatedPressable';
import { currentColors, Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
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
  accessibilityHint,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const getButtonStyles = () => {
    const baseStyle: ViewStyle = {
      ...styles.base,
      ...(styles[size] || styles.medium),
      ...(styles[variant] || styles.primary),
    };
    if (variant === 'primary') {
      return [baseStyle, ColorsShadows.button, isDisabled && styles.disabled, style];
    }
    return [baseStyle, isDisabled && styles.disabled, style];
  };

  const getTextStyle = () => {
    return [
      styles.textBase,
      styles[`${variant}Text`],
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
      pressedScaleValue={0.95}
      animationDuration={150}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <LoadingSpinner 
          size={20}
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
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + Spacing.xs,
    minHeight: 44,
  },
  primary: {
    backgroundColor: currentColors.primary,
    borderColor: currentColors.primary,
  },
  secondary: {
    backgroundColor: currentColors.transparent,
    borderColor: currentColors.primary,
    borderWidth: 2,
  },
  outline: {
    backgroundColor: currentColors.transparent,
    borderColor: currentColors.primary,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: currentColors.transparent,
    borderColor: currentColors.transparent,
    borderWidth: 0,
  },
  small: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    minHeight: 44,
    borderRadius: BorderRadius.sm,
  },
  medium: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + Spacing.xs,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: 52,
    borderRadius: BorderRadius.lg,
  },
  disabled: {
    backgroundColor: currentColors.surfaceDark,
    borderColor: currentColors.border,
    opacity: 0.6,
  },
  textBase: {
    ...Typography.buttonText,
    textAlign: 'center',
  },
  primaryText: {
    color: currentColors.white,
  },
  secondaryText: {
    color: currentColors.primary,
  },
  outlineText: {
    color: currentColors.primary,
  },
  ghostText: {
    color: currentColors.primary,
  },
  disabledText: {
    color: currentColors.textMuted,
  },
});