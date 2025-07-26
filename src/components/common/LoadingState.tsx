import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import {
  tw,
  currentColors,
  Spacing,
  Typography,
} from '../../styles/designSystem';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
}

export function LoadingState({
  message = 'Loading...',
  size = 'large',
}: LoadingStateProps) {
  return (
    <View
      style={[tw.flex, tw['justify-center'], tw['items-center'], tw['p-lg']]}
    >
      <ActivityIndicator size={size} color={currentColors.primary} />
      <Text
        style={[
          tw['text-base'],
          tw['text-neutral-600'],
          tw['text-center'],
          { marginTop: Spacing.md },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}
