import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from './Button';
import { Colors, Spacing, Typography } from '@/constants/Colors';

const currentColors = Colors.light;

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            We encountered an unexpected error. Please try again.
          </Text>
          {__DEV__ && this.state.error && (
            <Text style={styles.errorDetails}>
              {this.state.error.message}
            </Text>
          )}
          <Button
            title="Try Again"
            onPress={this.handleRetry}
            style={styles.retryButton}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: currentColors.background,
  },
  title: {
    ...Typography.h2,
    color: currentColors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  message: {
    ...Typography.body,
    color: currentColors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  errorDetails: {
    ...Typography.bodySmall,
    color: currentColors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontFamily: 'monospace',
  },
  retryButton: {
    minWidth: 120,
  },
});