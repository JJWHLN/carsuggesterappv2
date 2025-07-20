import React, { useMemo, useCallback } from 'react';
import {
  FlatList,
  FlatListProps,
  ListRenderItem,
  ViewToken,
  Dimensions,
} from 'react-native';
import { useThemeColors } from '../../hooks/useTheme';
import { useMemoryOptimization } from '../../hooks/useMemoryOptimization';

const { height } = Dimensions.get('window');

interface OptimizedFlatListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[];
  renderItem: ListRenderItem<T>;
  estimatedItemSize?: number;
  enableOptimizations?: boolean;
  onViewableItemsChanged?: (info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => void;
}

export function OptimizedFlatList<T>({
  data,
  renderItem,
  estimatedItemSize = 100,
  enableOptimizations = true,
  onViewableItemsChanged,
  ...props
}: OptimizedFlatListProps<T>) {
  const { colors } = useThemeColors();
  const { addCleanupFunction } = useMemoryOptimization();

  // Optimized getItemLayout for better performance
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: estimatedItemSize,
      offset: estimatedItemSize * index,
      index,
    }),
    [estimatedItemSize]
  );

  // Memoized viewability config
  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 50,
      minimumViewTime: 100,
      waitForInteraction: true,
    }),
    []
  );

  // Optimized keyExtractor
  const keyExtractor = useCallback((item: T, index: number) => {
    if (typeof item === 'object' && item !== null && 'id' in item) {
      return String((item as any).id);
    }
    return String(index);
  }, []);

  // Performance optimizations
  const optimizationProps = enableOptimizations
    ? {
        getItemLayout,
        removeClippedSubviews: true,
        maxToRenderPerBatch: 10,
        updateCellsBatchingPeriod: 50,
        initialNumToRender: Math.ceil(height / estimatedItemSize),
        windowSize: 10,
        legacyImplementation: false,
        disableVirtualization: false,
      }
    : {};

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      showsVerticalScrollIndicator={false}
      bounces={true}
      alwaysBounceVertical={false}
      keyboardShouldPersistTaps="handled"
      {...optimizationProps}
      {...props}
    />
  );
}
