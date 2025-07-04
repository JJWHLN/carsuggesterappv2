import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { currentColors } from '@/constants/Colors';

interface LoadingSpinnerProps {
  size?: number | 'small' | 'large';
  color?: string;
}

export function LoadingSpinner({ 
  size = 'large', 
  color = currentColors.primary,
}: LoadingSpinnerProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});