import { useMemo } from 'react';
import { useColorScheme } from 'react-native';
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  Shadows,
} from '../constants/Colors';

/**
 * 🎨 UNIFIED DESIGN SYSTEM HOOK
 *
 * This is the single source of truth for all design tokens and theme values.
 * Replaces all the fragmented theme hooks:
 * - useThemeColors
 * - useDesignTokens
 * - useConsolidatedTheme
 * - useComprehensiveTheme
 * - useThemedStyles (for basic usage)
 *
 * Usage:
 * const { colors, spacing, typography, borderRadius, shadows } = useDesignSystem();
 *
 * @example
 * // Instead of multiple imports:
 * import { useThemeColors } from '@/hooks/useTheme';
 * import { Spacing, Typography } from '@/constants/Colors';
 *
 * // Use single import:
 * import { useDesignSystem } from '@/hooks/useDesignSystem';
 */
export function useDesignSystem() {
  const colorScheme = useColorScheme();

  return useMemo(() => {
    const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;

    return {
      // Theme-aware colors
      colors,

      // Static design tokens
      spacing: Spacing,
      typography: Typography,
      borderRadius: BorderRadius,
      shadows: Shadows,

      // Computed values
      isDark: colorScheme === 'dark',
      colorScheme,

      // Common style patterns (pre-built)
      layout: {
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        safeArea: {
          flex: 1,
          backgroundColor: colors.background,
        },
        centeredContainer: {
          flex: 1,
          justifyContent: 'center' as const,
          alignItems: 'center' as const,
          paddingHorizontal: Spacing.lg,
        },
        section: {
          marginVertical: Spacing.md,
          paddingHorizontal: Spacing.lg,
        },
        row: {
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
        },
        spaceBetween: {
          flexDirection: 'row' as const,
          justifyContent: 'space-between' as const,
          alignItems: 'center' as const,
        },
      },

      // Card patterns
      cards: {
        primary: {
          backgroundColor: colors.cardBackground,
          borderRadius: BorderRadius.lg,
          padding: Spacing.lg,
          marginBottom: Spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          ...Shadows.sm,
        },
        secondary: {
          backgroundColor: colors.surface,
          borderRadius: BorderRadius.md,
          padding: Spacing.md,
          marginBottom: Spacing.sm,
          borderWidth: 1,
          borderColor: colors.border,
        },
        elevated: {
          backgroundColor: colors.cardBackground,
          borderRadius: BorderRadius.lg,
          padding: Spacing.lg,
          marginBottom: Spacing.md,
          ...Shadows.medium,
        },
      },

      // Button patterns
      buttons: {
        primary: {
          backgroundColor: colors.primary,
          borderRadius: BorderRadius.lg,
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          ...Shadows.sm,
        },
        secondary: {
          backgroundColor: 'transparent',
          borderRadius: BorderRadius.lg,
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          borderWidth: 1,
          borderColor: colors.primary,
        },
        outline: {
          backgroundColor: 'transparent',
          borderRadius: BorderRadius.lg,
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          borderWidth: 1,
          borderColor: colors.border,
        },
      },

      // Input patterns
      inputs: {
        primary: {
          backgroundColor: colors.cardBackground,
          borderRadius: BorderRadius.lg,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          fontSize: 16,
          color: colors.text,
        },
        search: {
          backgroundColor: colors.surface,
          borderRadius: BorderRadius.full,
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          borderWidth: 1,
          borderColor: colors.border,
          fontSize: 16,
          color: colors.text,
        },
      },

      // Text patterns
      text: {
        heading: {
          fontSize: Typography.h1.fontSize,
          fontWeight: Typography.h1.fontWeight,
          color: colors.text,
          marginBottom: Spacing.sm,
        },
        subheading: {
          fontSize: Typography.h2.fontSize,
          fontWeight: Typography.h2.fontWeight,
          color: colors.text,
          marginBottom: Spacing.xs,
        },
        body: {
          fontSize: Typography.body.fontSize,
          fontWeight: Typography.body.fontWeight,
          color: colors.text,
          lineHeight: Typography.body.lineHeight,
        },
        caption: {
          fontSize: Typography.caption.fontSize,
          fontWeight: Typography.caption.fontWeight,
          color: colors.textSecondary,
        },
        link: {
          fontSize: Typography.body.fontSize,
          fontWeight: Typography.body.fontWeight,
          color: colors.primary,
        },
      },
    };
  }, [colorScheme]);
}

/**
 * Simplified hook for just colors (most common use case)
 * Backward compatibility with existing useThemeColors usage
 */
export function useColors() {
  const { colors } = useDesignSystem();
  return colors;
}

/**
 * Hook for theme state only
 */
export function useThemeState() {
  const { colors, isDark, colorScheme } = useDesignSystem();
  return { colors, isDark, colorScheme };
}

export default useDesignSystem;
