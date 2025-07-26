import React, { memo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { AlertTriangle, RefreshCw } from '@/utils/ultra-optimized-icons';
import { tw, currentColors, Spacing } from '../../styles/designSystem';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryText?: string;
  showIcon?: boolean;
}

const ErrorState = memo<ErrorStateProps>(
  ({
    title = 'Something went wrong',
    message,
    onRetry,
    retryText = 'Try Again',
    showIcon = true,
  }) => {
    return (
      <View
        style={[
          tw.flex,
          tw['justify-center'],
          tw['items-center'],
          tw['p-xl'],
          { minHeight: 300 },
        ]}
      >
        {showIcon && (
          <View style={{ marginBottom: Spacing.lg }}>
            <AlertTriangle color={currentColors.error} size={48} />
          </View>
        )}

        <Text
          style={[
            tw['text-xl'],
            tw['font-bold'],
            tw['text-center'],
            { color: currentColors.text, marginBottom: Spacing.md },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            tw['text-base'],
            tw['text-center'],
            {
              color: currentColors.textSecondary,
              lineHeight: 24,
              marginBottom: Spacing.xl,
              maxWidth: 280,
            },
          ]}
        >
          {message}
        </Text>

        {onRetry && (
          <TouchableOpacity
            style={[
              tw['flex-row'],
              tw['items-center'],
              {
                backgroundColor: currentColors.primary,
                paddingHorizontal: Spacing.lg,
                paddingVertical: Spacing.md,
                borderRadius: 8,
                gap: Spacing.sm,
              },
            ]}
            onPress={onRetry}
          >
            <RefreshCw color={currentColors.white} size={16} />
            <Text
              style={[
                tw['text-base'],
                tw['font-medium'],
                { color: currentColors.white },
              ]}
            >
              {retryText}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  },
);

ErrorState.displayName = 'ErrorState';

export { ErrorState };
