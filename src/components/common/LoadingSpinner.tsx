import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { tw, currentColors } from '../../styles/designSystem';

interface LoadingSpinnerProps {
  size?: number | 'small' | 'large';
  color?: string;
}

export function LoadingSpinner({
  size = 'large',
  color = currentColors.primary,
}: LoadingSpinnerProps) {
  return (
    <View style={[tw['justify-center'], tw['items-center']]}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}
