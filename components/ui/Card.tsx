import React, { memo } from 'react'; // Import memo
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BorderRadius, Shadows, Spacing } from '@/constants/Colors'; // Removed currentColors
import { useThemeColors } from '@/hooks/useTheme'; // Import useThemeColors
import { AnimatedPressable } from './AnimatedPressable';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: keyof typeof Spacing | number; // Allow specific spacing key or number
  onPress?: () => void; // Add onPress for interactive cards
  isFeatureCard?: boolean; // To differentiate feature card styling if needed
  accessibilityLabel?: string; // New accessibilityLabel prop
  accessibilityRole?: 'button' | 'link' | 'summary'; // More specific roles for cards
}

export const Card = memo(function Card({
  children,
  style,
  padding = Spacing.md, // Default padding from new design (16px)
  onPress,
  isFeatureCard = false,
  accessibilityLabel,
  accessibilityRole = 'summary', // Default role for non-interactive cards
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
        pressedScaleValue={0.98} // Design spec: Scale to 0.98
        animationDuration={200}  // Design spec: 200ms ease-out
        // Accessibility props for pressable Card
        accessibilityRole={accessibilityRole === 'summary' ? 'button' : accessibilityRole} // Default to 'button' if pressable and role is 'summary'
        accessibilityLabel={accessibilityLabel} // Should be provided by parent
        // accessibilityHint can be added if needed
      >
        {children}
      </AnimatedPressable>
    );
  }

  // For non-pressable cards, the View itself doesn't need many accessibility props,
  // as its children will be individually accessible.
  // However, if it represents a grouping, accessibilityRole="summary" or "group" might be useful.
  return (
    <View
      style={cardStyle}
      accessible={accessibilityRole !== 'summary'} // Make it accessible if it's not just a summary container
      accessibilityRole={accessibilityRole === 'summary' ? undefined : accessibilityRole} // Don't set role if it's just a container for other elements
      accessibilityLabel={accessibilityLabel} // Useful if the card as a whole needs a label
    >
      {children}
    </View>
  );
});

const getThemedStyles = (colors: typeof import('@/constants/Colors').Colors.light) => StyleSheet.create({
  baseCard: {
    borderRadius: BorderRadius.lg,
  },
  standardCard: {
    backgroundColor: colors.cardBackground, // Use themed cardBackground
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadows.card,
  },
  featureCard: {
    backgroundColor: colors.cardBackground, // Use themed cardBackground
    borderWidth: 1,
    borderColor: colors.border,
    ...Shadows.card,
  },
});