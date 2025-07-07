import React from 'react';
import { Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { LoadingSpinner } from './LoadingSpinner';
import { AnimatedPressable } from './AnimatedPressable';
import { currentColors, Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors';
import { createSemanticProps, useAccessibility } from '@/hooks/useAccessibility';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'outlineWhite' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityValue?: string;
  destructive?: boolean;
  testID?: string;
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
  accessibilityValue,
  destructive = false,
  testID,
}: ButtonProps) {
  const accessibilityHook = useAccessibility();
  const isDisabled = disabled || loading;

  const handlePress = () => {
    if (isDisabled) return;
    
    // Announce action for screen readers
    if (accessibilityHook.isScreenReaderEnabled) {
      const action = loading ? 'Loading' : 'Activated';
      accessibilityHook.announceForAccessibility(`${accessibilityLabel || title} ${action}`);
    }
    
    onPress();
  };

  const getButtonStyles = () => {
    const baseStyle: ViewStyle = {
      ...styles.base,
      ...(styles[size] || styles.medium),
      ...(styles[variant] || styles.primary),
    };

    // Apply destructive styling
    if (destructive) {
      baseStyle.backgroundColor = variant === 'primary' ? currentColors.error : baseStyle.backgroundColor;
      baseStyle.borderColor = currentColors.error;
    }

    if (variant === 'primary') {
      return [baseStyle, ColorsShadows.button, isDisabled && styles.disabled, style];
    }
    return [baseStyle, isDisabled && styles.disabled, style];
  };

  const getTextStyle = () => {
    const textStyles = [
      styles.textBase,
      styles[`${variant}Text`],
      isDisabled && styles.disabledText,
      textStyle,
    ];

    // Apply bold text if accessibility setting is enabled
    if (accessibilityHook.isBoldTextEnabled) {
      textStyles.push(styles.boldText);
    }

    // Apply destructive text color
    if (destructive && variant !== 'primary') {
      textStyles.push(styles.destructiveText);
    }

    return textStyles;
  };

  const loadingSpinnerColor =
    variant === 'primary' ? currentColors.white : currentColors.primary;

  // Create comprehensive accessibility props
  const accessibilityProps = createSemanticProps(
    accessibilityLabel || title,
    'button',
    {
      hint: accessibilityHint || (loading ? 'Loading, please wait' : undefined),
      value: accessibilityValue,
      disabled: isDisabled,
      busy: loading,
    }
  );

  return (
    <AnimatedPressable
      style={getButtonStyles()}
      onPress={handlePress}
      disabled={isDisabled}
      pressedScaleValue={0.95}
      animationDuration={150}
      testID={testID}
      {...accessibilityProps}
      // Additional accessibility properties
      accessibilityActions={[
        { name: 'activate', label: title }
      ]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'activate') {
          handlePress();
        }
      }}
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
  outlineWhite: {
    backgroundColor: currentColors.transparent,
    borderColor: currentColors.white,
    borderWidth: 2,
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
  outlineWhiteText: {
    color: currentColors.white,
  },
  ghostText: {
    color: currentColors.primary,
  },
  disabledText: {
    color: currentColors.textMuted,
  },
  boldText: {
    fontWeight: '700',
  },
  destructiveText: {
    color: currentColors.error,
  },
});