import React, { memo } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { useThemeColors } from '@/hooks/useTheme';
import { Spacing, Typography } from '@/constants/Colors';

interface UnifiedScreenStateProps {
  // State flags
  loading?: boolean;
  error?: string | null;
  isEmpty?: boolean;

  // Data
  data?: any[] | any;

  // Loading customization
  loadingText?: string;
  loadingSize?: number | 'small' | 'large';

  // Error customization
  errorTitle?: string;
  onRetry?: () => void;

  // Empty state customization
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: React.ReactElement;
  emptyAction?: React.ReactElement;

  // Content
  children?: React.ReactNode;

  // Styling
  style?: ViewStyle;
  loadingStyle?: ViewStyle;
  errorStyle?: ViewStyle;
  emptyStyle?: ViewStyle;

  // Behavior
  showEmptyWhenNoData?: boolean;
  showLoadingOverlay?: boolean;
}

/**
 * Unified component that handles all screen states:
 * - Loading states
 * - Error states
 * - Empty states
 * - Content rendering
 *
 * This eliminates the need for separate LoadingState, ErrorState patterns
 * across multiple screens.
 */
export const UnifiedScreenState = memo<UnifiedScreenStateProps>(
  ({
    loading = false,
    error = null,
    isEmpty = false,
    data,
    loadingText = 'Loading...',
    loadingSize = 'large',
    errorTitle = 'Something went wrong',
    onRetry,
    emptyTitle = 'No items found',
    emptySubtitle,
    emptyIcon,
    emptyAction,
    children,
    style,
    loadingStyle,
    errorStyle,
    emptyStyle,
    showEmptyWhenNoData = true,
    showLoadingOverlay = false,
  }) => {
    const { colors } = useThemeColors();

    // Determine if data is empty
    const isDataEmpty =
      showEmptyWhenNoData &&
      (isEmpty ||
        (Array.isArray(data) && data.length === 0) ||
        (!Array.isArray(data) && !data));

    // Loading state (primary loading or loading overlay)
    if (loading && !showLoadingOverlay) {
      return (
        <View
          style={[
            styles.container,
            { backgroundColor: colors.background },
            style,
            loadingStyle,
          ]}
        >
          <LoadingSpinner size={loadingSize} color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {loadingText}
          </Text>
        </View>
      );
    }

    // Error state
    if (error && !loading) {
      return (
        <View
          style={[
            styles.container,
            { backgroundColor: colors.background },
            style,
            errorStyle,
          ]}
        >
          <ErrorState title={errorTitle} message={error} onRetry={onRetry} />
        </View>
      );
    }

    // Empty state
    if (isDataEmpty && !loading && !error) {
      return (
        <View
          style={[
            styles.container,
            { backgroundColor: colors.background },
            style,
            emptyStyle,
          ]}
        >
          <EmptyState
            title={emptyTitle}
            subtitle={emptySubtitle || ''}
            icon={emptyIcon}
            action={emptyAction}
          />
        </View>
      );
    }

    // Content with optional loading overlay
    return (
      <View style={[styles.contentContainer, style]}>
        {children}
        {loading && showLoadingOverlay && (
          <View
            style={[
              styles.loadingOverlay,
              { backgroundColor: colors.background },
            ]}
          >
            <LoadingSpinner size={loadingSize} color={colors.primary} />
            <Text style={[styles.overlayText, { color: colors.textSecondary }]}>
              {loadingText}
            </Text>
          </View>
        )}
      </View>
    );
  },
);

UnifiedScreenState.displayName = 'UnifiedScreenState';

// Convenience components for specific use cases
export const LoadingScreenState = memo<
  Pick<UnifiedScreenStateProps, 'loadingText' | 'loadingSize' | 'style'>
>(({ loadingText, loadingSize, style }) => (
  <UnifiedScreenState
    loading={true}
    loadingText={loadingText}
    loadingSize={loadingSize}
    style={style}
  />
));

export const ErrorScreenState = memo<
  Pick<UnifiedScreenStateProps, 'error' | 'errorTitle' | 'onRetry' | 'style'>
>(({ error, errorTitle, onRetry, style }) => (
  <UnifiedScreenState
    error={error}
    errorTitle={errorTitle}
    onRetry={onRetry}
    style={style}
  />
));

export const EmptyScreenState = memo<
  Pick<
    UnifiedScreenStateProps,
    'emptyTitle' | 'emptySubtitle' | 'emptyIcon' | 'emptyAction' | 'style'
  >
>(({ emptyTitle, emptySubtitle, emptyIcon, emptyAction, style }) => (
  <UnifiedScreenState
    isEmpty={true}
    emptyTitle={emptyTitle}
    emptySubtitle={emptySubtitle}
    emptyIcon={emptyIcon}
    emptyAction={emptyAction}
    style={style}
  />
));

// Hook for managing screen state logic
export function useScreenState<T>(
  data: T | T[] | null,
  loading: boolean,
  error: string | null,
  options: {
    showEmptyWhenNoData?: boolean;
    loadingText?: string;
    errorTitle?: string;
    emptyTitle?: string;
    emptySubtitle?: string;
  } = {},
) {
  const {
    showEmptyWhenNoData = true,
    loadingText = 'Loading...',
    errorTitle = 'Something went wrong',
    emptyTitle = 'No items found',
    emptySubtitle,
  } = options;

  const isEmpty =
    showEmptyWhenNoData &&
    ((Array.isArray(data) && data.length === 0) ||
      (!Array.isArray(data) && !data));

  const renderScreenState = (
    children: React.ReactNode,
    props: Partial<UnifiedScreenStateProps> = {},
  ) => (
    <UnifiedScreenState
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      data={data}
      loadingText={loadingText}
      errorTitle={errorTitle}
      emptyTitle={emptyTitle}
      emptySubtitle={emptySubtitle}
      {...props}
    >
      {children}
    </UnifiedScreenState>
  );

  return {
    loading,
    error,
    isEmpty,
    hasData: !loading && !error && !isEmpty,
    renderScreenState,
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  contentContainer: {
    flex: 1,
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  overlayText: {
    ...Typography.body,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
});

export default UnifiedScreenState;
