import React from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  ViewStyle,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingContainer } from '@/components/ui/SharedComponents';
import { useThemeColors } from '@/hooks/useTheme';
import { useMemo } from 'react';

interface BaseScreenLayoutProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

interface ListScreenLayoutProps<T> {
  data: T[];
  renderItem: ({
    item,
    index,
  }: {
    item: T;
    index: number;
  }) => React.ReactElement;
  loading: boolean;
  error: string | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  ListHeaderComponent?: React.ReactElement;
  ListFooterComponent?: React.ReactElement;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: React.ReactElement;
  emptyAction?: React.ReactElement;
  errorTitle?: string;
  loadingText?: string;
  onRetry?: () => void;
  numColumns?: number;
  keyExtractor?: (item: T, index: number) => string;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

interface ScrollScreenLayoutProps {
  children: React.ReactNode;
  loading: boolean;
  error: string | null;
  refreshing?: boolean;
  onRefresh?: () => void;
  emptyTitle?: string;
  emptySubtitle?: string;
  emptyIcon?: React.ReactElement;
  emptyAction?: React.ReactElement;
  errorTitle?: string;
  loadingText?: string;
  onRetry?: () => void;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  showEmptyWhenNoChildren?: boolean;
}

// Base layout component
export const BaseScreenLayout: React.FC<BaseScreenLayoutProps> = ({
  children,
  style,
}) => {
  const { colors } = useThemeColors();
  const commonStyles = useMemo(
    () =>
      StyleSheet.create({
        safeContainer: {
          flex: 1,
          backgroundColor: colors.background,
        },
      }),
    [colors],
  );

  return (
    <SafeAreaView style={[commonStyles.safeContainer, style]}>
      {children}
    </SafeAreaView>
  );
};

// List-based screen layout
export function ListScreenLayout<T>({
  data,
  renderItem,
  loading,
  error,
  refreshing = false,
  onRefresh,
  onEndReached,
  onEndReachedThreshold = 0.5,
  ListHeaderComponent,
  ListFooterComponent,
  emptyTitle = 'No items found',
  emptySubtitle,
  emptyIcon,
  emptyAction,
  errorTitle = 'Something went wrong',
  loadingText = 'Loading...',
  onRetry,
  numColumns = 1,
  keyExtractor,
  style,
  contentContainerStyle,
}: ListScreenLayoutProps<T>) {
  const { colors } = useThemeColors();
  const commonStyles = useMemo(
    () =>
      StyleSheet.create({
        safeContainer: {
          flex: 1,
          backgroundColor: colors.background,
        },
        centeredContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        },
      }),
    [colors],
  );

  // Loading state
  if (loading && data.length === 0) {
    return (
      <BaseScreenLayout style={style}>
        <LoadingContainer text={loadingText}>
          <LoadingSpinner size={32} color={colors.primary} />
        </LoadingContainer>
      </BaseScreenLayout>
    );
  }

  // Error state
  if (error && data.length === 0) {
    return (
      <BaseScreenLayout style={style}>
        <ErrorState title={errorTitle} message={error} onRetry={onRetry} />
      </BaseScreenLayout>
    );
  }

  // Empty state
  if (!loading && data.length === 0) {
    return (
      <BaseScreenLayout style={style}>
        {ListHeaderComponent}
        <View style={commonStyles.centeredContainer}>
          <EmptyState
            title={emptyTitle}
            subtitle={emptySubtitle || ''}
            icon={emptyIcon}
            action={emptyAction}
          />
        </View>
      </BaseScreenLayout>
    );
  }

  // List with data
  return (
    <BaseScreenLayout style={style}>
      <FlatList
        data={data}
        renderItem={renderItem}
        keyExtractor={keyExtractor || ((item, index) => index.toString())}
        numColumns={numColumns}
        key={numColumns}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        onEndReached={onEndReached}
        onEndReachedThreshold={onEndReachedThreshold}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined
        }
        contentContainerStyle={contentContainerStyle}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={10}
      />
    </BaseScreenLayout>
  );
}

// Scroll-based screen layout
export const ScrollScreenLayout: React.FC<ScrollScreenLayoutProps> = ({
  children,
  loading,
  error,
  refreshing = false,
  onRefresh,
  emptyTitle = 'No content available',
  emptySubtitle,
  emptyIcon,
  emptyAction,
  errorTitle = 'Something went wrong',
  loadingText = 'Loading...',
  onRetry,
  style,
  contentContainerStyle,
  showEmptyWhenNoChildren = false,
}) => {
  const { colors } = useThemeColors();
  const commonStyles = useMemo(
    () =>
      StyleSheet.create({
        safeContainer: {
          flex: 1,
          backgroundColor: colors.background,
        },
        centeredContainer: {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        },
      }),
    [colors],
  );

  // Loading state
  if (loading) {
    return (
      <BaseScreenLayout style={style}>
        <LoadingContainer text={loadingText}>
          <LoadingSpinner size={32} color={colors.primary} />
        </LoadingContainer>
      </BaseScreenLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <BaseScreenLayout style={style}>
        <ErrorState title={errorTitle} message={error} onRetry={onRetry} />
      </BaseScreenLayout>
    );
  }

  // Empty state
  if (showEmptyWhenNoChildren && !children) {
    return (
      <BaseScreenLayout style={style}>
        <View style={commonStyles.centeredContainer}>
          <EmptyState
            title={emptyTitle}
            subtitle={emptySubtitle || ''}
            icon={emptyIcon}
            action={emptyAction}
          />
        </View>
      </BaseScreenLayout>
    );
  }

  // Scroll with content
  return (
    <BaseScreenLayout style={style}>
      <ScrollView
        contentContainerStyle={contentContainerStyle}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </BaseScreenLayout>
  );
};
