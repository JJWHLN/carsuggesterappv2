/**
 * Design Token Hook - Eliminates redundant imports
 *
 * This hook consolidates all design token imports into a single source
 * to eliminate the pattern of importing individual tokens from Colors.ts
 */

import { useMemo } from 'react';
import { useThemeColors } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';

/**
 * Hook that provides all design tokens in one place
 * Eliminates the need for multiple imports from Colors.ts
 */
export function useDesignTokens() {
  const { colors } = useThemeColors();

  return useMemo(
    () => ({
      // Dynamic theme colors
      colors,

      // Static design tokens
      spacing: Spacing,
      typography: Typography,
      borderRadius: BorderRadius,
      shadows: Shadows,
    }),
    [colors],
  );
}

/**
 * Simplified hook for just colors - most common use case
 * Replaces: import { useThemeColors } from '@/hooks/useTheme'
 */
export function useColors() {
  const { colors } = useThemeColors();
  return colors;
}

/**
 * Hook for just static design tokens (no theme)
 * Replaces multiple imports: Spacing, Typography, BorderRadius, etc.
 */
export function useStaticDesignTokens() {
  return useMemo(
    () => ({
      spacing: Spacing,
      typography: Typography,
      borderRadius: BorderRadius,
      shadows: Shadows,
    }),
    [],
  );
}

/**
 * Simplified hooks for common use cases
 */

// Just spacing (reduces import boilerplate)
export function useDesignSpacing() {
  const { spacing } = useDesignTokens();
  return spacing;
}

// Just typography
export function useDesignTypography() {
  const { typography } = useDesignTokens();
  return typography;
}

// Theme state only
export function useThemeState() {
  const { colors, ...rest } = useThemeColors();
  return { colors, ...rest };
}

// Legacy compatibility exports
export const useTheme = useDesignTokens;
export const useThemeColorsCompat = useColors;

// Export default
export default useDesignTokens;
