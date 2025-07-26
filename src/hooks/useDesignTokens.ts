/**
 * Design Token Hook - Eliminates redundant imports and style patterns
 *
 * This hook consolidates all design token imports into a single source
 * and provides pre-built style patterns to eliminate redundancy across components
 */

import { useMemo } from 'react';
import {
  ViewStyle,
  TextStyle,
  Platform,
  Dimensions,
  useColorScheme,
} from 'react-native';
import DesignSystem from '@/constants/DesignSystem';
import { Colors } from '@/constants/Colors';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Enhanced hook that provides all design tokens and pre-built style patterns
 * Eliminates the need for multiple imports from Colors.ts and reduces style redundancy
 *
 * Usage:
 * const { colors, layout, cards, buttons, inputs } = useDesignTokens();
 *
 * Replaces:
 * import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';
 * import { useThemeColors } from '@/hooks/useTheme';
 */
export function useDesignTokens() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

  return useMemo(
    () => ({
      // Dynamic theme colors
      colors,

      // Static design tokens from DesignSystem
      spacing: DesignSystem.Spacing,
      typography: DesignSystem.Typography,
      borderRadius: DesignSystem.BorderRadius,
      shadows: DesignSystem.Shadows,
      animations: DesignSystem.Animations,

      // Platform utilities
      platform: DesignSystem.Platform,
      utils: DesignSystem.Utils,
      performance: DesignSystem.Performance,
      accessibility: DesignSystem.Accessibility,

      // Pre-built layout patterns
      layout: {
        container: {
          flex: 1,
          backgroundColor: colors.background,
        } as ViewStyle,
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        } as ViewStyle,
        centeredContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: DesignSystem.Spacing.lg,
        } as ViewStyle,
        section: {
          marginVertical: DesignSystem.Spacing.md,
          paddingHorizontal: DesignSystem.Spacing.lg,
        } as ViewStyle,
        sectionSpaced: {
          marginVertical: DesignSystem.Spacing.lg,
          paddingHorizontal: DesignSystem.Spacing.lg,
        } as ViewStyle,
        row: {
          flexDirection: 'row',
          alignItems: 'center',
        } as ViewStyle,
        rowSpaced: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        } as ViewStyle,
      },

      // Pre-built card patterns
      cards: {
        primary: {
          backgroundColor: colors.cardBackground,
          borderRadius: DesignSystem.BorderRadius.lg,
          padding: DesignSystem.Spacing.lg,
          marginBottom: DesignSystem.Spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          ...DesignSystem.Shadows.sm,
        } as ViewStyle,
        secondary: {
          backgroundColor: colors.surface,
          borderRadius: DesignSystem.BorderRadius.md,
          padding: DesignSystem.Spacing.md,
          marginBottom: DesignSystem.Spacing.sm,
          borderWidth: 1,
          borderColor: colors.border,
        } as ViewStyle,
        elevated: {
          backgroundColor: colors.cardBackground,
          borderRadius: DesignSystem.BorderRadius.lg,
          padding: DesignSystem.Spacing.lg,
          marginBottom: DesignSystem.Spacing.md,
          ...DesignSystem.Shadows.medium,
        } as ViewStyle,
      },

      // Pre-built button patterns
      buttons: {
        primary: {
          backgroundColor: colors.primary,
          borderRadius: DesignSystem.BorderRadius.lg,
          paddingHorizontal: DesignSystem.Spacing.lg,
          paddingVertical: DesignSystem.Spacing.md,
          alignItems: 'center',
          justifyContent: 'center',
          ...DesignSystem.Shadows.sm,
        } as ViewStyle,
        chip: {
          backgroundColor: colors.surface,
          borderRadius: DesignSystem.BorderRadius.full,
          paddingHorizontal: DesignSystem.Spacing.md,
          paddingVertical: DesignSystem.Spacing.sm,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.border,
        } as ViewStyle,
        chipActive: {
          backgroundColor: colors.primary,
          borderRadius: DesignSystem.BorderRadius.full,
          paddingHorizontal: DesignSystem.Spacing.md,
          paddingVertical: DesignSystem.Spacing.sm,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.primary,
        } as ViewStyle,
      },

      // Pre-built input patterns
      inputs: {
        primary: {
          backgroundColor: colors.cardBackground,
          borderRadius: DesignSystem.BorderRadius.lg,
          paddingHorizontal: DesignSystem.Spacing.md,
          paddingVertical: DesignSystem.Spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          fontSize: 16,
          color: colors.text,
        } as ViewStyle,
        search: {
          backgroundColor: colors.surface,
          borderRadius: DesignSystem.BorderRadius.full,
          paddingHorizontal: DesignSystem.Spacing.lg,
          paddingVertical: DesignSystem.Spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          fontSize: 16,
          color: colors.text,
        } as ViewStyle,
      },

      // Pre-built grid patterns
      grid: {
        twoColumn: {
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: DesignSystem.Spacing.md,
        } as ViewStyle,
        columnWrapper: {
          justifyContent: 'space-between',
          paddingHorizontal: DesignSystem.Spacing.lg,
        } as ViewStyle,
        gridItem: {
          width:
            (screenWidth -
              DesignSystem.Spacing.lg * 2 -
              DesignSystem.Spacing.md) /
            2,
          marginBottom: DesignSystem.Spacing.lg,
        } as ViewStyle,
      },
    }),
    [colors],
  );
}

/**
 * Simplified hook for just colors - most common use case
 * Replaces: import { useThemeColors } from '@/hooks/useTheme'
 */
export function useColors() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return colors;
}

/**
 * Hook for just static design tokens (no theme)
 * Replaces multiple imports: Spacing, Typography, BorderRadius, etc.
 */
export function useStaticDesignTokens() {
  return useMemo(
    () => ({
      spacing: DesignSystem.Spacing,
      typography: DesignSystem.Typography,
      borderRadius: DesignSystem.BorderRadius,
      shadows: DesignSystem.Shadows,
      animations: DesignSystem.Animations,
    }),
    [],
  );
}

// Export default
export default useDesignTokens;
