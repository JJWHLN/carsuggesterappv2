import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { currentColors, Spacing, Typography } from '@/constants/Colors';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const EmptyState = memo<EmptyStateProps>(({ 
  title, 
  subtitle, 
  icon, 
  action,
}) => {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      {action && <View style={styles.actionContainer}>{action}</View>}
    </View>
  );
});

EmptyState.displayName = 'EmptyState';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    minHeight: 300,
  },
  iconContainer: {
    marginBottom: Spacing.lg,
    opacity: 0.6,
  },
  title: {
    ...Typography.h2,
    color: currentColors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.body,
    color: currentColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.lg,
    maxWidth: 280,
  },
  actionContainer: {
    marginTop: Spacing.md,
  },
});

export { EmptyState };