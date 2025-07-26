import React, { memo } from 'react';
import { View, Text } from 'react-native';
import { tw, currentColors, Spacing } from '../../styles/designSystem';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const EmptyState = memo<EmptyStateProps>(
  ({ title, subtitle, icon, action }) => {
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
        {icon && (
          <View style={[{ marginBottom: Spacing.lg, opacity: 0.6 }]}>
            {icon}
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
              marginBottom: Spacing.lg,
              maxWidth: 280,
            },
          ]}
        >
          {subtitle}
        </Text>
        {action && <View style={{ marginTop: Spacing.md }}>{action}</View>}
      </View>
    );
  },
);

EmptyState.displayName = 'EmptyState';

export { EmptyState };
