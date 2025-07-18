import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp } from '@/utils/icons';
import { currentColors, Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors';

interface ComingSoonProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
  title,
  message,
  icon,
}) => {
  return (
    <View style={styles.comingSoonCard}>
      {icon || <TrendingUp color={currentColors.primary} size={32} />}
      <Text style={styles.comingSoonTitle}>{title}</Text>
      <Text style={styles.comingSoonText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  comingSoonCard: {
    margin: Spacing.lg,
    padding: Spacing.xl,
    backgroundColor: currentColors.primaryLight,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    ...ColorsShadows.medium,
  },
  comingSoonTitle: {
    ...Typography.h2,
    color: currentColors.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  comingSoonText: {
    ...Typography.body,
    color: currentColors.primary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
