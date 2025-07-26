import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import PerformanceDashboard from '@/components/PerformanceDashboard';
import { useThemeColors } from '@/hooks/useTheme';

export default function PerformanceScreen() {
  const { colors } = useThemeColors();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <PerformanceDashboard />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
