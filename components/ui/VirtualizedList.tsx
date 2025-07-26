import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import {
  FlatList,
  View,
  Dimensions,
  ListRenderItem,
  ViewToken,
} from 'react-native';
import { FixedSizeList as List, VariableSizeList } from 'react-window';
import { useWindowDimensions } from 'react-native';
import {
  performanceMonitor,
  usePerformanceMonitor,
} from '../../src/utils/performance';

interface VirtualizedListProps<T> {
  data: T[];
  renderItem: ListRenderItem<T>;
  getItemSize?: (index: number) => number;
  itemHeight?: number;
  windowSize?: number;
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  removeClippedSubviews?: boolean;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
  keyExtractor?: (item: T, index: number) => string;
  ListHeaderComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType<any> | React.ReactElement | null;
  ListEmptyComponent?: React.ComponentType<any> | React.ReactElement | null;
  onViewableItemsChanged?: (info: {
    viewableItems: ViewToken[];
    changed: ViewToken[];
  }) => void;
  viewabilityConfig?: {
    minimumViewTime?: number;
    viewAreaCoveragePercentThreshold?: number;
    itemVisiblePercentThreshold?: number;
    waitForInteraction?: boolean;
  };
  horizontal?: boolean;
  numColumns?: number;
  columnWrapperStyle?: any;
  refreshing?: boolean;
  onRefresh?: () => void;
  progressViewOffset?: number;
  debug?: boolean;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export function VirtualizedList<T>({
  data,
  renderItem,
  getItemSize,
  itemHeight = 100,
  windowSize = 10,
  initialNumToRender = 10,
  maxToRenderPerBatch = 5,
  updateCellsBatchingPeriod = 50,
  removeClippedSubviews = true,
  onEndReached,
  onEndReachedThreshold = 0.5,
  keyExtractor,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  onViewableItemsChanged,
  viewabilityConfig,
  horizontal = false,
  numColumns = 1,
  columnWrapperStyle,
  refreshing,
  onRefresh,
  progressViewOffset,
  debug = false,
}: VirtualizedListProps<T>) {
  const { trackMetric } = usePerformanceMonitor();
  const flatListRef = useRef<FlatList>(null);
  const renderStartTime = useRef<number>();
  const lastScrollOffset = useRef(0);
  const isScrolling = useRef(false);

  // Performance optimizations
  const optimizedData = useMemo(() => {
    if (debug) {
      console.log(`VirtualizedList: Processing ${data.length} items`);
    }
    return data;
  }, [data, debug]);

  // Optimized render item with performance tracking
  const optimizedRenderItem = useCallback<ListRenderItem<T>>(
    ({ item, index }) => {
      const itemRenderStart = Date.now();

      const result = renderItem({ item, index, separators: {} as any });

      // Track render performance for sampling (every 10th item)
      if (index % 10 === 0) {
        const renderTime = Date.now() - itemRenderStart;
        trackMetric(
          'list-item-render-time',
          renderTime,
          { good: 5, needsImprovement: 10 },
          { index, itemType: typeof item },
        );
      }

      return result;
    },
    [renderItem, trackMetric],
  );

  // Optimized key extractor
  const optimizedKeyExtractor = useCallback(
    (item: T, index: number) => {
      if (keyExtractor) {
        return keyExtractor(item, index);
      }

      // Default key extraction with performance considerations
      if (typeof item === 'object' && item !== null) {
        const obj = item as any;
        return obj.id || obj.key || obj._id || index.toString();
      }

      return index.toString();
    },
    [keyExtractor],
  );

  // Handle scroll performance tracking
  const handleScroll = useCallback(
    (event: any) => {
      const currentOffset = event.nativeEvent.contentOffset.y;
      const scrollDelta = Math.abs(currentOffset - lastScrollOffset.current);

      if (scrollDelta > 100) {
        // Only track significant scrolls
        const scrollTime = Date.now() - (renderStartTime.current || Date.now());
        trackMetric(
          'scroll-performance',
          scrollTime,
          { good: 16, needsImprovement: 32 },
          {
            scrollDelta,
            direction: currentOffset > lastScrollOffset.current ? 'down' : 'up',
          },
        );
      }

      lastScrollOffset.current = currentOffset;
    },
    [trackMetric],
  );

  // Handle scroll begin/end for performance monitoring
  const handleScrollBeginDrag = useCallback(() => {
    isScrolling.current = true;
    renderStartTime.current = Date.now();
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    isScrolling.current = false;
    if (renderStartTime.current) {
      const totalScrollTime = Date.now() - renderStartTime.current;
      trackMetric(
        'scroll-session-duration',
        totalScrollTime,
        { good: 1000, needsImprovement: 3000 },
        { itemCount: data.length },
      );
    }
  }, [trackMetric, data.length]);

  // Optimized viewability config
  const optimizedViewabilityConfig = useMemo(
    () => ({
      minimumViewTime: 100,
      viewAreaCoveragePercentThreshold: 50,
      waitForInteraction: true,
      ...viewabilityConfig,
    }),
    [viewabilityConfig],
  );

  // Handle viewable items changed with performance tracking
  const handleViewableItemsChanged = useCallback(
    (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
      // Track visibility metrics
      trackMetric(
        'visible-items-count',
        info.viewableItems.length,
        { good: 10, needsImprovement: 20 },
        { changed: info.changed.length },
      );

      onViewableItemsChanged?.(info);
    },
    [onViewableItemsChanged, trackMetric],
  );

  // Performance optimization: getItemLayout for fixed size items
  const getItemLayout = useMemo(() => {
    if (!getItemSize && itemHeight) {
      return (data: any, index: number) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
      });
    }
    return undefined;
  }, [getItemSize, itemHeight]);

  // Track list mount performance
  useEffect(() => {
    const mountTime = Date.now();
    return () => {
      const unmountTime = Date.now() - mountTime;
      trackMetric(
        'list-mount-duration',
        unmountTime,
        { good: 1000, needsImprovement: 3000 },
        { itemCount: data.length },
      );
    };
  }, [trackMetric, data.length]);

  // Performance warning for large datasets
  useEffect(() => {
    if (data.length > 1000 && !getItemLayout && debug) {
      console.warn(
        `VirtualizedList: Large dataset (${data.length} items) without getItemLayout. ` +
          'Consider implementing getItemLayout for better performance.',
      );
    }
  }, [data.length, getItemLayout, debug]);

  const flatListProps = {
    ref: flatListRef,
    data: optimizedData,
    renderItem: optimizedRenderItem,
    keyExtractor: optimizedKeyExtractor,
    getItemLayout,
    onScroll: handleScroll,
    onScrollBeginDrag: handleScrollBeginDrag,
    onScrollEndDrag: handleScrollEndDrag,
    onViewableItemsChanged: handleViewableItemsChanged,
    viewabilityConfig: optimizedViewabilityConfig,

    // Performance optimizations
    windowSize,
    initialNumToRender,
    maxToRenderPerBatch,
    updateCellsBatchingPeriod,
    removeClippedSubviews,
    scrollEventThrottle: 16,

    // Layout props
    horizontal,
    numColumns,
    columnWrapperStyle,

    // Refresh props
    refreshing,
    onRefresh,
    progressViewOffset,

    // End reached
    onEndReached,
    onEndReachedThreshold,

    // Components
    ListHeaderComponent,
    ListFooterComponent,
    ListEmptyComponent,
  };

  return <FlatList {...flatListProps} />;
}

// Hook for managing virtual list performance
export function useVirtualListPerformance() {
  const { trackMetric } = usePerformanceMonitor();

  const trackScrollPerformance = useCallback(
    (scrollDuration: number, itemCount: number, visibleItems: number) => {
      trackMetric(
        'virtual-scroll-performance',
        scrollDuration,
        { good: 16, needsImprovement: 32 },
        { itemCount, visibleItems, fps: 1000 / scrollDuration },
      );
    },
    [trackMetric],
  );

  const trackRenderPerformance = useCallback(
    (renderDuration: number, itemIndex: number) => {
      trackMetric(
        'virtual-render-performance',
        renderDuration,
        { good: 5, needsImprovement: 10 },
        { itemIndex },
      );
    },
    [trackMetric],
  );

  return {
    trackScrollPerformance,
    trackRenderPerformance,
  };
}

// Optimized car list item component
export const OptimizedCarListItem = React.memo<{
  car: any;
  onPress: (car: any) => void;
  style?: any;
}>(({ car, onPress, style }) => {
  const handlePress = useCallback(() => {
    onPress(car);
  }, [car, onPress]);

  return <View style={style}>{/* Car item content */}</View>;
});

OptimizedCarListItem.displayName = 'OptimizedCarListItem';

export default VirtualizedList;
