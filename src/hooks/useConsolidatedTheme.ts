import { useContext } from 'react';
import {
  ThemeContext,
  useTheme as useNewTheme,
  useThemeColors as useNewThemeColors,
} from '@/theme/ThemeContext';
import { useThemeColors as useLegacyThemeColors } from '@/hooks/useTheme';

/**
 * Consolidated theme hook that provides a unified interface
 * This hook bridges the gap between the old and new theme systems
 * and provides a single source of truth for theme-related functionality
 */
export function useConsolidatedTheme() {
  // Try to use the new theme system first
  const context = useContext(ThemeContext);

  if (context) {
    // New theme system is available
    return {
      colors: context.colors,
      theme: context.theme,
      mode: context.mode,
      setMode: context.setMode,
      toggleTheme: context.toggleTheme,
      isDark: context.theme === 'dark',
      // Legacy compatibility
      colorScheme: context.theme,
      setTheme: context.setMode,
    };
  }

  // Fallback to legacy theme system
  const legacyTheme = useLegacyThemeColors();
  return {
    colors: legacyTheme.colors,
    theme: legacyTheme.colorScheme,
    mode: legacyTheme.theme,
    setMode: legacyTheme.setTheme,
    toggleTheme: () => {
      const newTheme = legacyTheme.colorScheme === 'light' ? 'dark' : 'light';
      legacyTheme.setTheme(newTheme);
    },
    isDark: legacyTheme.isDark,
    // Legacy compatibility
    colorScheme: legacyTheme.colorScheme,
    setTheme: legacyTheme.setTheme,
  };
}

/**
 * Simplified hook that just returns colors - most common use case
 * This reduces boilerplate in components that only need colors
 */
export function useColors() {
  const { colors } = useConsolidatedTheme();
  return colors;
}

/**
 * Hook for checking dark mode state
 */
export function useIsDarkMode() {
  const { isDark } = useConsolidatedTheme();
  return isDark;
}

/**
 * Legacy compatibility hooks - these maintain the old API
 * while using the consolidated system under the hood
 */
export function useThemeColors() {
  const { colors, ...rest } = useConsolidatedTheme();
  return { colors, ...rest };
}

export function useTheme() {
  return useConsolidatedTheme();
}

// Export the new theme hooks for components that want to use the latest API
export {
  useTheme as useNewTheme,
  useThemeColors as useNewThemeColors,
} from '@/theme/ThemeContext';
