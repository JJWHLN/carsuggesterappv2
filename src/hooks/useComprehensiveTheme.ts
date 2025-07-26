import { useMemo } from 'react';
import { StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { useThemeColors } from './useTheme';
import { useConsolidatedTheme } from './useConsolidatedTheme';
import {
  Colors,
  Spacing,
  Typography,
  BorderRadius,
  Shadows,
} from '@/constants/Colors';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Comprehensive theme hook that consolidates:
 * - useThemeColors
 * - useConsolidatedTheme
 * - useThemedStyles
 * - Common style patterns
 *
 * This eliminates the need for multiple theme-related hooks and
 * provides a single source of truth for styling.
 */
export function useComprehensiveTheme() {
  const { colors } = useThemeColors();
  const consolidatedTheme = useConsolidatedTheme();

  // Memoized common styles that are used across multiple components
  const commonStyles = useMemo(
    () =>
      StyleSheet.create({
        // Container styles
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        safeContainer: {
          flex: 1,
          backgroundColor: colors.background,
        },
        centeredContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        },
        scrollContainer: {
          flex: 1,
          backgroundColor: colors.background,
        },

        // Loading states
        loadingContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
          padding: Spacing.lg,
        },
        loadingText: {
          ...Typography.body,
          color: colors.textSecondary,
          marginTop: Spacing.md,
          textAlign: 'center',
        },

        // Header styles
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: Spacing.md,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTitle: {
          ...Typography.h2,
          color: colors.text,
        },
        backButton: {
          padding: Spacing.sm,
          borderRadius: BorderRadius.md,
          backgroundColor: colors.surface,
        },
        headerActionsContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: Spacing.sm,
        },

        // Card styles
        card: {
          backgroundColor: colors.cardBackground,
          borderRadius: BorderRadius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          padding: Spacing.md,
          ...Shadows.sm,
        },
        cardTitle: {
          ...Typography.subtitle,
          color: colors.text,
          marginBottom: Spacing.sm,
        },
        cardContent: {
          ...Typography.body,
          color: colors.text,
        },

        // Button styles
        primaryButton: {
          backgroundColor: colors.primary,
          borderRadius: BorderRadius.md,
          paddingVertical: Spacing.sm,
          paddingHorizontal: Spacing.md,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
          ...Shadows.sm,
        },
        primaryButtonText: {
          ...Typography.buttonText,
          color: colors.white,
        },
        secondaryButton: {
          backgroundColor: colors.surface,
          borderRadius: BorderRadius.md,
          borderWidth: 1,
          borderColor: colors.border,
          paddingVertical: Spacing.sm,
          paddingHorizontal: Spacing.md,
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 48,
        },
        secondaryButtonText: {
          ...Typography.buttonText,
          color: colors.text,
        },

        // Text styles
        title: {
          ...Typography.h1,
          color: colors.text,
        },
        subtitle: {
          ...Typography.h2,
          color: colors.text,
        },
        heading: {
          ...Typography.subtitle,
          color: colors.text,
        },
        body: {
          ...Typography.body,
          color: colors.text,
        },
        bodySecondary: {
          ...Typography.body,
          color: colors.textSecondary,
        },
        caption: {
          ...Typography.caption,
          color: colors.textSecondary,
        },
        label: {
          ...Typography.caption,
          color: colors.text,
          fontWeight: '600',
        },

        // Layout helpers
        row: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        column: {
          flexDirection: 'column',
        },
        spaceBetween: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        },
        center: {
          alignItems: 'center',
          justifyContent: 'center',
        },

        // Spacing utilities
        marginBottomSm: { marginBottom: Spacing.sm },
        marginBottomMd: { marginBottom: Spacing.md },
        marginBottomLg: { marginBottom: Spacing.lg },
        marginTopSm: { marginTop: Spacing.sm },
        marginTopMd: { marginTop: Spacing.md },
        marginTopLg: { marginTop: Spacing.lg },
        paddingSm: { padding: Spacing.sm },
        paddingMd: { padding: Spacing.md },
        paddingLg: { padding: Spacing.lg },
        paddingHorizontalSm: { paddingHorizontal: Spacing.sm },
        paddingHorizontalMd: { paddingHorizontal: Spacing.md },
        paddingHorizontalLg: { paddingHorizontal: Spacing.lg },
        paddingVerticalSm: { paddingVertical: Spacing.sm },
        paddingVerticalMd: { paddingVertical: Spacing.md },
        paddingVerticalLg: { paddingVertical: Spacing.lg },

        // Input styles
        input: {
          backgroundColor: colors.surface,
          borderRadius: BorderRadius.md,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          ...Typography.body,
          color: colors.text,
          minHeight: 48,
        },
        inputFocused: {
          borderColor: colors.primary,
        },

        // List styles
        listItem: {
          backgroundColor: colors.surface,
          borderRadius: BorderRadius.md,
          padding: Spacing.md,
          marginBottom: Spacing.sm,
          borderWidth: 1,
          borderColor: colors.border,
        },
        listItemPressed: {
          backgroundColor: colors.surface,
          opacity: 0.8,
        },

        // Image styles
        image: {
          backgroundColor: colors.surface,
          borderRadius: BorderRadius.md,
        },
        avatar: {
          backgroundColor: colors.surface,
          borderRadius: BorderRadius.full,
        },

        // Separator styles
        separator: {
          height: 1,
          backgroundColor: colors.border,
        },
        divider: {
          height: 1,
          backgroundColor: colors.border,
          marginVertical: Spacing.md,
        },
      }),
    [colors],
  );

  // Function to create themed styles with automatic memoization
  const createThemedStyles = useMemo(() => {
    return function <T extends NamedStyles<T>>(
      styleFactory: (colors: typeof Colors.light) => T,
    ): T {
      return StyleSheet.create(styleFactory(colors));
    };
  }, [colors]);

  // Function to merge styles with theme-aware defaults
  const mergeWithThemeDefaults = useMemo(() => {
    return function <T extends NamedStyles<T>>(
      baseStyles: T,
      overrideStyles: Partial<T> = {},
    ): T {
      const merged = { ...baseStyles };

      Object.keys(overrideStyles).forEach((key) => {
        const keyTyped = key as keyof T;
        if (overrideStyles[keyTyped]) {
          merged[keyTyped] = StyleSheet.flatten([
            baseStyles[keyTyped],
            overrideStyles[keyTyped],
          ]) as T[keyof T];
        }
      });

      return merged;
    };
  }, []);

  return {
    // Color theme
    colors,

    // Consolidated theme (includes animations, spacing, etc.)
    theme: consolidatedTheme,

    // Pre-built common styles
    commonStyles,

    // Utility functions
    createThemedStyles,
    mergeWithThemeDefaults,

    // Design tokens
    spacing: Spacing,
    typography: Typography,
    borderRadius: BorderRadius,
    shadows: Shadows,

    // Convenience getters
    isDark: consolidatedTheme.isDark,
    isLight: !consolidatedTheme.isDark,
  };
}

/**
 * Hook that provides themed styles with automatic memoization
 * This replaces the repetitive `getThemedStyles` pattern
 */
export function useThemedStyles<T extends NamedStyles<T>>(
  styleFactory: (colors: typeof Colors.light) => T,
): T {
  const { colors } = useThemeColors();

  return useMemo(() => {
    return StyleSheet.create(styleFactory(colors));
  }, [colors, styleFactory]);
}

/**
 * Hook that provides common themed styles for quick access
 * This eliminates the need to recreate common patterns
 */
export function useCommonStyles() {
  const { commonStyles } = useComprehensiveTheme();
  return commonStyles;
}

/**
 * Hook that provides design tokens for consistent styling
 * This replaces direct imports from constants
 */
export function useDesignTokens() {
  const { colors, spacing, typography, borderRadius, shadows } =
    useComprehensiveTheme();

  return {
    colors,
    spacing,
    typography,
    borderRadius,
    shadows,
  };
}

/**
 * Hook that provides theme-aware colors with semantic naming
 * This consolidates all color-related theme access
 */
export function useColors() {
  const { colors } = useThemeColors();
  return colors;
}

/**
 * Hook that provides responsive design utilities
 * This helps with consistent responsive behavior
 */
export function useResponsiveDesign() {
  const { theme } = useComprehensiveTheme();

  return {
    isTablet: false, // Will be determined from device info
    isPhone: true,
    isSmallScreen: false,
    isLargeScreen: false,
    spacing: Spacing,
    breakpoints: {},
  };
}

export default useComprehensiveTheme;
