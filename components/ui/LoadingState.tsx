import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { currentColors, Spacing, Typography } from '@/constants/Colors'; // Changed Colors to currentColors

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
}

export function LoadingState({ message = 'Loading...', size = 'large' }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={currentColors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  message: {
    ...Typography.bodyText, // Use new Typography
    color: currentColors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});