import { StyleSheet, ViewStyle, TextStyle, ImageStyle, useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { Colors } from '@/constants/Colors';
import DesignSystem from '@/constants/DesignSystem';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Hook that creates themed styles with automatic memoization
 * This replaces the repetitive `getThemedStyles` pattern across components
 * 
 * @param styleFactory Function that takes colors and returns a StyleSheet
 * @returns Memoized styles that update when theme changes
 */
export function useThemedStyles<T extends NamedStyles<T>>(
  styleFactory: (colors: typeof Colors.light) => T
): T {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  
  return useMemo(() => {
    return StyleSheet.create(styleFactory(colors));
  }, [colors, styleFactory]);
}

/**
 * Create themed styles outside of a component
 * Useful for standalone style objects or when you need styles before rendering
 * 
 * @param colors Color theme object
 * @param styleFactory Function that takes colors and returns styles
 * @returns Styled StyleSheet object
 */
export function createThemedStyles<T extends NamedStyles<T>>(
  colors: typeof Colors.light,
  styleFactory: (colors: typeof Colors.light) => T
): T {
  return StyleSheet.create(styleFactory(colors));
}

/**
 * Pre-built common themed styles that can be reused across components
 * This reduces duplication of common patterns like containers, headers, etc.
 */
export function useCommonThemedStyles() {
  return useThemedStyles((colors) => ({
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
    
    // Loading states
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    loadingText: {
      color: colors.textSecondary,
      marginTop: 16,
    },
    
    // Header styles
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
    },
    
    // Card styles
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 16,
    },
    
    // Button styles
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    
    secondaryButton: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      paddingHorizontal: 24,
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    
    // Text styles
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    subtitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    body: {
      fontSize: 16,
      color: colors.text,
    },
    bodySecondary: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    caption: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    
    // Layout helpers
    row: {
      flexDirection: 'row',
      alignItems: 'center',
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
    
    // Spacing
    marginBottom: {
      marginBottom: 16,
    },
    marginTop: {
      marginTop: 16,
    },
    padding: {
      padding: 16,
    },
    paddingHorizontal: {
      paddingHorizontal: 16,
    },
    paddingVertical: {
      paddingVertical: 16,
    },
  }));
}

/**
 * Utility function to merge themed styles with custom styles
 * Helps maintain theme consistency while allowing customization
 */
export function mergeThemedStyles<T extends NamedStyles<T>>(
  themedStyles: T,
  customStyles: Partial<T> = {}
): T {
  const merged = { ...themedStyles };
  
  Object.keys(customStyles).forEach((key) => {
    const keyTyped = key as keyof T;
    if (customStyles[keyTyped]) {
      merged[keyTyped] = StyleSheet.flatten([
        themedStyles[keyTyped],
        customStyles[keyTyped],
      ]) as T[keyof T];
    }
  });
  
  return merged;
}

export default useThemedStyles;
