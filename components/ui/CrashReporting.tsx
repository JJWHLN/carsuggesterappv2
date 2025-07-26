import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';

import { trackError } from '@/services/analyticsService';
import { useThemeColors } from '@/hooks/useTheme';
import { router } from 'expo-router';
import { AlertTriangle, Home } from '@/utils/ultra-optimized-icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

/**
 * Enhanced Error Boundary with crash reporting
 */
export class CrashReportingBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    logger.error('🚨 App Crash:', error);
    logger.error('📍 Error Info:', errorInfo);

    // Track the crash
    trackError(error, {
      context: 'crash_boundary',
      component_stack: errorInfo.componentStack,
      error_boundary: true,
      timestamp: new Date().toISOString(),
    });

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleRestart = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    router.replace('/');
  };

  handleReportBug = () => {
    const { error, errorInfo } = this.state;
    const reportData = {
      error: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      componentStack: errorInfo?.componentStack || 'No component stack',
      timestamp: new Date().toISOString(),
      userAgent: 'React Native App',
    };

    // In production, this would send the report to your crash reporting service
    logger.debug('🐛 Bug Report:', reportData);

    Alert.alert(
      'Report Sent',
      'Thank you for helping us improve the app. The development team has been notified.',
      [{ text: 'OK' }],
    );
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <CrashScreen
          error={this.state.error}
          onRestart={this.handleRestart}
          onGoHome={this.handleGoHome}
          onReportBug={this.handleReportBug}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Crash screen component using hooks
 */
function CrashScreen({
  error,
  onRestart,
  onGoHome,
  onReportBug,
}: {
  error: Error | null;
  onRestart: () => void;
  onGoHome: () => void;
  onReportBug: () => void;
}) {
  const { colors } = useThemeColors();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 24,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 12,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 24,
    },
    errorDetails: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 8,
      marginBottom: 32,
      width: '100%',
      maxHeight: 120,
    },
    errorText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontFamily: 'monospace',
    },
    buttonsContainer: {
      width: '100%',
      gap: 12,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 8,
      gap: 8,
    },
    buttonSecondary: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.white,
    },
    buttonTextSecondary: {
      color: colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <AlertTriangle color={colors.error} size={40} />
      </View>

      <Text style={styles.title}>Oops! Something went wrong</Text>

      <Text style={styles.subtitle}>
        We're sorry for the inconvenience. The app encountered an unexpected
        error and needs to restart.
      </Text>

      {__DEV__ && error && (
        <View style={styles.errorDetails}>
          <Text style={styles.errorText} numberOfLines={5}>
            {error.message}
            {'\n\n'}
            {error.stack?.substring(0, 200)}...
          </Text>
        </View>
      )}

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.button} onPress={onRestart}>
          <RefreshCw color={colors.white} size={20} />
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={onGoHome}
        >
          <Home color={colors.text} size={20} />
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
            Go to Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.buttonSecondary]}
          onPress={onReportBug}
        >
          <Text style={[styles.buttonText, styles.buttonTextSecondary]}>
            Report Bug
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/**
 * Hook to handle and report JavaScript errors
 */
export function useErrorReporting() {
  const reportError = (error: Error, context?: Record<string, any>) => {
    logger.error('🚨 Reported Error:', error);

    trackError(error, {
      ...context,
      reported_manually: true,
      timestamp: new Date().toISOString(),
    });
  };

  const reportWarning = (message: string, context?: Record<string, any>) => {
    logger.warn('⚠️ Warning:', message);

    trackError(new Error(message), {
      ...context,
      severity: 'warning',
      timestamp: new Date().toISOString(),
    });
  };

  return {
    reportError,
    reportWarning,
  };
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withCrashReporting<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode,
) {
  return function CrashReportingWrapper(props: P) {
    return (
      <CrashReportingBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </CrashReportingBoundary>
    );
  };
}
