/**
 * EXAMPLE: Component Migration to Consolidated Design System
 * 
 * This example demonstrates how to migrate from scattered imports 
 * to the consolidated design system approach.
 */

// ========================================
// BEFORE: Multiple imports and scattered patterns
// ========================================

// OLD APPROACH (REDUNDANT):
/*
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';

const ExampleComponent = () => {
  const { colors } = useThemeColors();
  
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Example</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    backgroundColor: colors.surface, // ❌ Can't access colors here
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  title: {
    ...Typography.h2,
    marginBottom: Spacing.md,
  },
});
*/

// ========================================
// AFTER: Consolidated approach with single hook
// ========================================

// NEW APPROACH (CONSOLIDATED):
import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useDesignTokens } from '@/hooks/useDesignTokens';

const ExampleComponent = () => {
  const { colors, spacing, typography, borderRadius, shadows } = useDesignTokens();
  
  const styles = StyleSheet.create({
    container: {
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      ...shadows.medium,
    },
    title: {
      ...typography.h2,
      color: colors.text,
      marginBottom: spacing.md,
    },
  });
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Example</Text>
    </View>
  );
};

// ========================================
// ALTERNATIVE: Even more consolidated with CommonStyles
// ========================================

// MAXIMUM CONSOLIDATION:
const ExampleComponentMaxConsolidated = () => {
  const { colors, spacing, typography } = useDesignTokens();
  
  return (
    <View style={[
      { 
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }
    ]}>
      <Text style={[
        typography.h2,
        { color: colors.text, marginBottom: spacing.md }
      ]}>
        Example
      </Text>
    </View>
  );
};

// ========================================
// BENEFITS DEMONSTRATED:
// ========================================

/*
1. REDUCED IMPORTS:
   - Before: 4 imports from Colors.ts + 1 theme hook
   - After: 1 consolidated hook

2. BETTER CONSISTENCY:
   - All design tokens from single source
   - Consistent patterns using CommonStyles
   - No more style duplication

3. BETTER MAINTAINABILITY:
   - Change design tokens in one place
   - Easier to update themes
   - Consistent across entire app

4. IMPROVED PERFORMANCE:
   - Reduced bundle size from fewer imports
   - Better tree-shaking
   - Consolidated style objects

5. BETTER DEVELOPER EXPERIENCE:
   - Single hook to remember
   - Better IntelliSense
   - Consistent patterns
*/

export default ExampleComponent;
