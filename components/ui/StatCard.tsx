import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { currentColors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';

interface StatCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  iconBackgroundColor?: string;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  value,
  label,
  iconBackgroundColor,
  style,
}) => {
  return (
    <View style={[styles.statCard, style]}>
      {iconBackgroundColor ? (
        <View style={[styles.iconWrapper, { backgroundColor: iconBackgroundColor }]}>
          {icon}
        </View>
      ) : (
        <View style={styles.iconWrapperSimple}>
          {icon}
        </View>
      )}
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  statCard: {
    flex: 1,
    backgroundColor: currentColors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.medium, // Default shadow, can be overridden by style prop
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconWrapperSimple: { // For icons that don't need a colored background circle
    marginBottom: Spacing.sm,
  },
  statValue: {
    ...Typography.h2, // Made this h2 consistent with HomeScreen's original StatCard
    color: currentColors.text,
    fontWeight: '700',
    marginBottom: Spacing.xs, // Added for consistency
  },
  statLabel: {
    ...Typography.caption,
    color: currentColors.textSecondary,
    textAlign: 'center',
  },
});
