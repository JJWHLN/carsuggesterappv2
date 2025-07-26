/**
 * 📜 Virtual Scrolling Component
 * High-performance list rendering for large datasets
 */

import React, {
  memo,
  useMemo,
  useCallback,
  useRef,
  useState,
  useEffect,
} from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import { usePerformanceMonitor } from '../../utils/performance';

interface VirtualScrollProps<T> {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  containerHeight?: number;
  overscan?: number;
  onEndReached?: () => void;
  onEndReachedThreshold?: number;
}

const { height: screenHeight } = Dimensions.get('window');

export const VirtualScroll = memo<VirtualScrollProps<any>>(
  ({
    data,
    renderItem,
    itemHeight,
    containerHeight = screenHeight * 0.8,
    overscan = 5,
    onEndReached,
    onEndReachedThreshold = 0.8,
  }) => {
    const { trackMetric } = usePerformanceMonitor();
    const scrollViewRef = useRef<ScrollView>(null);
    const [scrollOffset, setScrollOffset] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimer = useRef<NodeJS.Timeout>();

    // Calculate visible range with overscan
    const visibleRange = useMemo(() => {
      const startIndex = Math.floor(scrollOffset / itemHeight);
      const endIndex = Math.min(
        data.length - 1,
        Math.floor((scrollOffset + containerHeight) / itemHeight),
      );

      return {
        start: Math.max(0, startIndex - overscan),
        end: Math.min(data.length - 1, endIndex + overscan),
      };
    }, [scrollOffset, itemHeight, containerHeight, data.length, overscan]);

    // Get visible items with performance tracking
    const visibleItems = useMemo(() => {
      const items = [];
      for (let i = visibleRange.start; i <= visibleRange.end; i++) {
        if (data[i]) {
          items.push({
            index: i,
            item: data[i],
            offset: i * itemHeight,
          });
        }
      }

      trackMetric('virtual-scroll-visible-items', items.length);
      return items;
    }, [visibleRange, data, itemHeight, trackMetric]);

    // Handle scroll with performance optimization
    const handleScroll = useCallback(
      (event: any) => {
        const newOffset = event.nativeEvent.contentOffset.y;
        setScrollOffset(newOffset);

        if (!isScrolling) {
          setIsScrolling(true);
        }

        // Clear existing timer
        if (scrollTimer.current) {
          clearTimeout(scrollTimer.current);
        }

        // Set scroll end timer
        scrollTimer.current = setTimeout(() => {
          setIsScrolling(false);
          trackMetric('virtual-scroll-ended', newOffset);
        }, 150);

        // Handle end reached
        if (onEndReached && onEndReachedThreshold) {
          const totalHeight = data.length * itemHeight;
          const scrollProgress = (newOffset + containerHeight) / totalHeight;

          if (scrollProgress >= onEndReachedThreshold) {
            onEndReached();
          }
        }
      },
      [
        isScrolling,
        onEndReached,
        onEndReachedThreshold,
        data.length,
        itemHeight,
        containerHeight,
        trackMetric,
      ],
    );

    // Memoized spacer components for performance
    const topSpacer = useMemo(() => {
      const height = visibleRange.start * itemHeight;
      return height > 0 ? <View style={{ height }} /> : null;
    }, [visibleRange.start, itemHeight]);

    const bottomSpacer = useMemo(() => {
      const remainingItems = data.length - visibleRange.end - 1;
      const height = Math.max(0, remainingItems * itemHeight);
      return height > 0 ? <View style={{ height }} /> : null;
    }, [data.length, visibleRange.end, itemHeight]);

    // Container style with proper height
    const containerStyle = useMemo(
      () => [styles.container, { height: containerHeight }],
      [containerHeight],
    );

    // Content container style
    const contentContainerStyle = useMemo(
      () => ({
        minHeight: data.length * itemHeight,
      }),
      [data.length, itemHeight],
    );

    return (
      <ScrollView
        ref={scrollViewRef}
        style={containerStyle}
        contentContainerStyle={contentContainerStyle}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        removeClippedSubviews={true}
        showsVerticalScrollIndicator={true}
      >
        {topSpacer}

        {visibleItems.map(({ item, index, offset }) => (
          <View
            key={`virtual-item-${index}`}
            style={[
              styles.itemContainer,
              {
                height: itemHeight,
                transform: [
                  { translateY: offset - visibleRange.start * itemHeight },
                ],
              },
            ]}
          >
            {renderItem(item, index)}
          </View>
        ))}

        {bottomSpacer}
      </ScrollView>
    );
  },
);

VirtualScroll.displayName = 'VirtualScroll';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});
