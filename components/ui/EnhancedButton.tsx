import React, { memo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  PlatformOptimizations, 
  ResponsiveSpacing, 
  getPlatformShadow,
  getTouchableProps 
} from '@/constants/PlatformOptimizations';
import { LoadingSpinner } from './LoadingSpinner';

interface EnhancedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  hapticFeedback?: boolean;
  testID?: string;
  style?: any;
}

export const EnhancedButton = memo<EnhancedButtonProps>(({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  hapticFeedback = true,
  testID,
  style,
}) => {
  const handlePress = useCallback(() => {
    if (disabled || loading) return;
    
    // Platform-specific haptic feedback
    if (hapticFeedback) {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }
    
    onPress();
  }, [disabled, loading, hapticFeedback, onPress]);

  const buttonStyles = [
    styles.base,
    styles[size],
    styles[variant],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
  ];

  const content = (
    <>
      {loading ? (
        <LoadingSpinner 
          size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
          color={variant === 'primary' ? '#FFFFFF' : '#22C55E'}
        />
      ) : (
        <>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={textStyles}>{title}</Text>
        </>
      )}
    </>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        style={buttonStyles}
        onPress={handlePress}
        disabled={disabled || loading}
        testID={testID}
        {...getTouchableProps()}
      >
        <LinearGradient
          colors={disabled ? ['#9CA3AF', '#9CA3AF'] : ['#22C55E', '#16A34A']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={handlePress}
      disabled={disabled || loading}
      testID={testID}
      {...getTouchableProps()}
    >
      {content}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  base: {
    borderRadius: PlatformOptimizations.common.borderRadius,
    overflow: 'hidden',
    ...getPlatformShadow(2),
  },
  
  // Sizes
  small: {
    paddingHorizontal: ResponsiveSpacing.md,
    paddingVertical: ResponsiveSpacing.sm,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: ResponsiveSpacing.lg,
    paddingVertical: ResponsiveSpacing.md,
    minHeight: 44,
  },
  large: {
    paddingHorizontal: ResponsiveSpacing.xl,
    paddingVertical: ResponsiveSpacing.lg,
    minHeight: 52,
  },
  
  // Variants
  primary: {
    backgroundColor: 'transparent',
  },
  secondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#22C55E',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  
  // States
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  
  // Gradient
  gradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: ResponsiveSpacing.lg,
    paddingVertical: ResponsiveSpacing.md,
  },
  
  // Content
  iconContainer: {
    marginRight: ResponsiveSpacing.sm,
  },
  
  // Text styles
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: '#22C55E',
  },
  outlineText: {
    color: '#22C55E',
  },
  ghostText: {
    color: '#22C55E',
  },
  disabledText: {
    color: '#9CA3AF',
  },
});

EnhancedButton.displayName = 'EnhancedButton';
