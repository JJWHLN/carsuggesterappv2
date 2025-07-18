import React, { useCallback, useMemo, useRef, useState } from 'react';
import { 
  FlatList, 
  ListRenderItem, 
  RefreshControl, 
  View, 
  Text,
  StyleSheet,
  ViewStyle,
  ListRenderItemInfo,
  Animated,
  InteractionManager,
} from 'react-native';
import { useThemeColors } from '../../hooks/useTheme';
import { useUnifiedDataFetching } from '../../hooks/useUnifiedDataFetching';
import { LoadingState } from './LoadingState';
import { Button } from './Button';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { commonStyleUtils } from './UnifiedTabScreen';

export interface UnifiedListProps<T> {
  // Data fetching
  fetchData: (page: number, limit: number, searchTerm?: string) => Promise<T[]>;
  
  // Rendering
  renderItem: (item: T, index: number) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
  renderFooter?: () => React.ReactNode;
  renderSectionHeader?: (section: any) => React.ReactNode;
  
  // Configuration
  searchQuery?: string;
  pageSize?: number;
  enablePagination?: boolean;
  enableSearch?: boolean;
  enableRefresh?: boolean;
  
  // Layout
  numColumns?: number;
  horizontal?: boolean;
  columnWrapperStyle?: ViewStyle;
  
  // Styling
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
  
  // Empty/Loading states
  emptyTitle?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  errorTitle?: string;
  errorMessage?: string;
  
  // Item extraction
  keyExtractor?: (item: T, index: number) => string;
  
  // Callbacks
  onItemPress?: (item: T, index: number) => void;
  onRefresh?: () => void;
  onEndReached?: () => void;
  
  // Performance
  getItemLayout?: (data: T[] | null | undefined, index: number) => {length: number, offset: number, index: number};
  estimatedItemSize?: number;
  enableVirtualization?: boolean;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  initialNumToRender?: number;
  windowSize?: number;
  removeClippedSubviews?: boolean;
  
  // Additional props
  dependencies?: any[];
  
  // Advanced Performance Features
  enableMemoryOptimization?: boolean;
  enableAnimatedScrolling?: boolean;
  enableInfiniteScroll?: boolean;
  scrollEventThrottle?: number;
}

/**
 * Unified list component that eliminates FlatList redundancies across tab screens
 * Handles data fetching, pagination, refresh, loading states, and error handling
 */
export function UnifiedList<T = any>({
  fetchData,
  renderItem,
  renderHeader,
  renderFooter,
  renderSectionHeader,
  searchQuery = '',
  pageSize = 10,
  enablePagination = true,
  enableSearch = true,
  enableRefresh = true,
  numColumns = 1,
  horizontal = false,
  columnWrapperStyle,
  contentContainerStyle,
  style,
  emptyTitle = 'No Items Found',
  emptyMessage = 'There are no items to display.',
  loadingMessage = 'Loading...',
  errorTitle = 'Error',
  errorMessage = 'Failed to load data.',
  keyExtractor,
  onItemPress,
  onRefresh,
  onEndReached,
  getItemLayout,
  estimatedItemSize = 100,
  enableVirtualization = true,
  maxToRenderPerBatch = 10,
  updateCellsBatchingPeriod = 50,
  initialNumToRender = 10,
  windowSize = 10,
  removeClippedSubviews = true,
  dependencies = [],
  enableMemoryOptimization = true,
  enableAnimatedScrolling = false,
  enableInfiniteScroll = true,
  scrollEventThrottle = 16,
}: UnifiedListProps<T>) {
  const { colors } = useThemeColors();
  const flatListRef = useRef<FlatList<T>>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Unified data fetching with all the common patterns
  const {
    data: items,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    refreshing,
    search,
  } = useUnifiedDataFetching(
    fetchData,
    [searchQuery, ...dependencies],
    {
      enablePagination,
      enableSearch,
      pageSize,
      initialLoad: true,
    }
  );

  // Handle item rendering with press handling
  const handleRenderItem: ListRenderItem<T> = useCallback(({ item, index }: ListRenderItemInfo<T>) => {
    const itemContent = renderItem(item, index);
    
    if (onItemPress) {
      return (
        <View style={styles.pressableItem}>
          {itemContent}
        </View>
      );
    }
    
    return itemContent as React.ReactElement;
  }, [renderItem, onItemPress]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    onRefresh?.();
    refresh();
  }, [onRefresh, refresh]);

  // Handle load more with performance optimization
  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading && enablePagination && enableInfiniteScroll) {
      // Defer loading to avoid blocking the UI during scrolling
      if (enableMemoryOptimization && isScrolling) {
        InteractionManager.runAfterInteractions(() => {
          onEndReached?.();
          loadMore();
        });
      } else {
        onEndReached?.();
        loadMore();
      }
    }
  }, [hasMore, loading, enablePagination, enableInfiniteScroll, onEndReached, loadMore, enableMemoryOptimization, isScrolling]);

  // Optimized scroll handlers
  const handleScrollBegin = useCallback(() => {
    setIsScrolling(true);
  }, []);

  const handleScrollEnd = useCallback(() => {
    setIsScrolling(false);
  }, []);

  const handleScroll = useCallback((event: any) => {
    if (enableAnimatedScrolling) {
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true }
      )(event);
    }
  }, [enableAnimatedScrolling, scrollY]);

  // Performance optimized getItemLayout
  const optimizedGetItemLayout = useCallback((data: ArrayLike<T> | null | undefined, index: number) => {
    if (getItemLayout) {
      const result = getItemLayout(data as T[] | null | undefined, index);
      if (result) return result;
    }
    
    // Always return a valid layout if virtualization is enabled
    if (estimatedItemSize && enableVirtualization) {
      return {
        length: estimatedItemSize,
        offset: estimatedItemSize * index,
        index,
      };
    }
    
    // Fallback layout
    return {
      length: estimatedItemSize || 100,
      offset: (estimatedItemSize || 100) * index,
      index,
    };
  }, [getItemLayout, estimatedItemSize, enableVirtualization]);

  // Default key extractor
  const defaultKeyExtractor = useCallback((item: T, index: number) => {
    if (keyExtractor) {
      return keyExtractor(item, index);
    }
    
    // Try to extract id from item
    if (typeof item === 'object' && item !== null && 'id' in item) {
      return String((item as any).id);
    }
    
    return String(index);
  }, [keyExtractor]);

  // List header with search integration
  const listHeader = useMemo(() => {
    if (!renderHeader) return null;
    
    return (
      <View>
        {renderHeader()}
      </View>
    );
  }, [renderHeader]);

  // List footer with load more indicator
  const listFooter = useMemo(() => {
    const hasFooter = renderFooter || (enablePagination && hasMore);
    
    if (!hasFooter) return null;
    
    return (
      <View style={styles.footer}>
        {renderFooter && renderFooter()}
        {enablePagination && hasMore && !loading && (
          <View style={styles.loadMoreContainer}>
            <Text style={[styles.loadMoreText, { color: colors.textSecondary }]}>
              Pull to load more...
            </Text>
          </View>
        )}
      </View>
    );
  }, [renderFooter, enablePagination, hasMore, loading, colors.textSecondary]);

  // Handle loading state
  if (loading && (!items || (Array.isArray(items) && items.length === 0))) {
    return (
      <LoadingState 
        message={loadingMessage}
      />
    );
  }

  // Handle error state
  if (error) {
    return (
      <ErrorState
        title={errorTitle}
        message={error}
        onRetry={refresh}
      />
    );
  }

  // Handle empty state
  if (!items || (Array.isArray(items) && items.length === 0)) {
    return (
      <EmptyState
        title={emptyTitle}
        subtitle={emptyMessage}
        action={enableRefresh ? <Button title="Refresh" onPress={handleRefresh} /> : undefined}
      />
    );
  }

  // Ensure items is an array
  const itemsArray = Array.isArray(items) ? items : [items];

  // Main list render
  return (
    <FlatList<T>
      ref={flatListRef}
      data={itemsArray}
      renderItem={handleRenderItem}
      keyExtractor={defaultKeyExtractor}
      numColumns={numColumns}
      horizontal={horizontal}
      columnWrapperStyle={numColumns > 1 ? columnWrapperStyle : undefined}
      
      // Headers and footers
      ListHeaderComponent={listHeader}
      ListFooterComponent={listFooter}
      
      // Refresh control
      refreshControl={
        enableRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      
      // Pagination
      onEndReached={enablePagination ? handleLoadMore : undefined}
      onEndReachedThreshold={0.5}
      
      // Advanced Performance optimizations
      removeClippedSubviews={removeClippedSubviews && enableVirtualization}
      maxToRenderPerBatch={maxToRenderPerBatch}
      updateCellsBatchingPeriod={updateCellsBatchingPeriod}
      initialNumToRender={initialNumToRender}
      windowSize={windowSize}
      getItemLayout={enableVirtualization ? optimizedGetItemLayout : undefined}
      
      // Scroll handling
      onScrollBeginDrag={handleScrollBegin}
      onScrollEndDrag={handleScrollEnd}
      onMomentumScrollBegin={handleScrollBegin}
      onMomentumScrollEnd={handleScrollEnd}
      onScroll={enableAnimatedScrolling ? handleScroll : undefined}
      scrollEventThrottle={scrollEventThrottle}
      
      // Styling
      style={[styles.list, style]}
      contentContainerStyle={[
        styles.contentContainer,
        contentContainerStyle,
      ]}
      
      // Indicators
      showsVerticalScrollIndicator={!horizontal}
      showsHorizontalScrollIndicator={horizontal}
      
      // Behavior
      keyboardShouldPersistTaps="handled"
      bounces={true}
      alwaysBounceVertical={false}
      alwaysBounceHorizontal={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  pressableItem: {
    // Add press handling styles if needed
  },
  footer: {
    paddingVertical: 16,
  },
  loadMoreContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  loadMoreText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

// Specialized list configurations for common use cases
export const listConfigurations = {
  // Grid configuration (2 columns)
  grid: {
    numColumns: 2,
    columnWrapperStyle: {
      justifyContent: 'space-between',
      paddingHorizontal: 16,
    },
  },
  
  // Horizontal scroll configuration
  horizontal: {
    horizontal: true,
    numColumns: 1,
    contentContainerStyle: {
      paddingHorizontal: 16,
    },
  },
  
  // Card list configuration
  cardList: {
    numColumns: 1,
    contentContainerStyle: {
      paddingHorizontal: 16,
    },
  },
  
  // Compact list configuration
  compact: {
    numColumns: 1,
    contentContainerStyle: {
      paddingHorizontal: 8,
    },
  },
};

// Helper function to create optimized render items
export function createOptimizedRenderItem<T>(
  Component: React.ComponentType<{ item: T; index: number; onPress?: (item: T) => void }>,
  onPress?: (item: T) => void
) {
  return React.memo(({ item, index }: { item: T; index: number }) => (
    <Component 
      item={item} 
      index={index} 
      onPress={onPress}
    />
  ));
}
