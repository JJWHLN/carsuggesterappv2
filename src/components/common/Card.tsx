import React, { memo } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import {
  BorderRadius,
  Shadows as ColorsShadows,
  Spacing,
} from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import { AnimatedPressable } from './AnimatedPressable';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof Spacing | number;
  onPress?: () => void;
  isFeatureCard?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'summary';
}

export const Card = memo(function Card({
  children,
  style,
  padding = Spacing.md,
  onPress,
  isFeatureCard = false,
  accessibilityLabel,
  accessibilityRole = 'summary',
}: CardProps): JSX.Element {
  const { colors } = useThemeColors();
  const styles = getThemedStyles(colors);

  const cardStyle = [
    styles.baseCard,
    isFeatureCard ? styles.featureCard : styles.standardCard,
    { padding: typeof padding === 'string' ? Spacing[padding] : padding },
    style,
  ];

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        style={cardStyle}
        pressedScaleValue={0.98}
        animationDuration={200}
        accessibilityRole={
          accessibilityRole === 'summary' ? 'button' : accessibilityRole
        }
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View
      style={cardStyle}
      accessible={accessibilityRole !== 'summary'}
      accessibilityRole={
        accessibilityRole === 'summary' ? undefined : accessibilityRole
      }
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
});

const getThemedStyles = (
  colors: typeof import('@/constants/Colors').Colors.light,
) =>
  StyleSheet.create({
    baseCard: {
      borderRadius: BorderRadius.lg,
    },
    standardCard: {
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
      ...ColorsShadows.card,
    },
    featureCard: {
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
      ...ColorsShadows.card,
    },
  });
