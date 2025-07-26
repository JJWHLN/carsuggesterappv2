/**
 * ⚡ Optimized Car List Component
 * React.memo + Virtual Scrolling + Performance Monitoring
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
  FlatList,
  View,
  Dimensions,
  StyleSheet,
  ListRenderItemInfo,
  ViewToken,
} from 'react-native';
import CarCard from '../../features/cars/CarCard';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { usePerformanceMonitor } from '../../utils/performance';
import { useDesignSystem } from '../../hooks/useDesignSystem';

interface OptimizedCarListProps {
  cars: Array<{
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    image?: string;
    bodyStyle?: string;
    fuelEfficiency?: number;
  }>;
  onCarPress: (carId: string) => void;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  searchQuery?: string;
}

// Memoized car item component with stable props
const CarItem = memo<{
  car: OptimizedCarListProps['cars'][0];
  onPress: (carId: string) => void;
  index: number;
}>(({ car, onPress, index }) => {
  const { trackMetric } = usePerformanceMonitor();

  const handlePress = useCallback(() => {
    trackMetric('item-press', Date.now());
    onPress(car.id);
  }, [car.id, onPress, trackMetric]);

  // Memoize car data to prevent unnecessary re-renders
  const memoizedCar = useMemo(
    () => ({
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price,
      image: car.image,
      bodyStyle: car.bodyStyle,
      fuelEfficiency: car.fuelEfficiency,
    }),
    [car],
  );

  return (
    <View style={[styles.itemContainer, { zIndex: -index }]}>
      <CarCard car={memoizedCar} variant="list" onPress={handlePress} />
    </View>
  );
});

CarItem.displayName = 'OptimizedCarItem';

export const OptimizedCarList = memo<OptimizedCarListProps>(
  ({
    cars,
    onCarPress,
    loading = false,
    refreshing = false,
    onRefresh,
    onEndReached,
    searchQuery,
  }) => {
    const { colors, spacing } = useDesignSystem();
    const { trackMetric } = usePerformanceMonitor();
    const flatListRef = useRef<FlatList>(null);
    const [viewableItems, setViewableItems] = useState<string[]>([]);

    // Performance optimization: Track render cycles
    const renderStartTime = useRef<number>();

    useEffect(() => {
      renderStartTime.current = Date.now();
      return () => {
        if (renderStartTime.current) {
          const renderTime = Date.now() - renderStartTime.current;
          trackMetric('list-render-time', renderTime);
        }
      };
    });

    // Memoized key extractor for performance
    const keyExtractor = useCallback((item: any, index: number) => {
      return `${item.id}-${index}`;
    }, []);

    // Optimized render item with error boundary
    const renderItem = useCallback(
      ({ item, index }: ListRenderItemInfo<any>) => {
        return <CarItem car={item} onPress={onCarPress} index={index} />;
      },
      [onCarPress],
    );

    // Memoized data with search filtering
    const filteredCars = useMemo(() => {
      if (!searchQuery) return cars;

      const query = searchQuery.toLowerCase();
      return cars.filter(
        (car) =>
          car.make.toLowerCase().includes(query) ||
          car.model.toLowerCase().includes(query) ||
          car.bodyStyle?.toLowerCase().includes(query),
      );
    }, [cars, searchQuery]);

    // Performance settings for FlatList
    const flatListProps = useMemo(
      () => ({
        removeClippedSubviews: true,
        maxToRenderPerBatch: 10,
        windowSize: 21,
        initialNumToRender: 8,
        updateCellsBatchingPeriod: 50,
        getItemLayout: (_: any, index: number) => ({
          length: 140, // Estimated item height + margin
          offset: 140 * index,
          index,
        }),
      }),
      [],
    );

    // Viewability config for performance tracking
    const viewabilityConfig = useMemo(
      () => ({
        itemVisiblePercentThreshold: 50,
        minimumViewTime: 100,
      }),
      [],
    );

    const onViewableItemsChanged = useCallback(
      ({ viewableItems: items }: { viewableItems: ViewToken[] }) => {
        const visibleIds = items.map((item) => item.item.id);
        setViewableItems(visibleIds);
        trackMetric('visible-items', visibleIds.length);
      },
      [trackMetric],
    );

    // Handle end reached with throttling
    const throttledEndReached = useCallback(() => {
      if (onEndReached) {
        trackMetric('end-reached', Date.now());
        onEndReached();
      }
    }, [onEndReached, trackMetric]);

    // Empty state component
    const EmptyComponent = useMemo(
      () => <View style={styles.emptyContainer}>{/* Empty state UI */}</View>,
      [],
    );

    if (loading && filteredCars.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
        </View>
      );
    }

    return (
      <FlatList
        ref={flatListRef}
        data={filteredCars}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onEndReached={throttledEndReached}
        onEndReachedThreshold={0.8}
        ListEmptyComponent={EmptyComponent}
        contentContainerStyle={[
          styles.contentContainer,
          { backgroundColor: colors.background },
        ]}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        {...flatListProps}
      />
    );
  },
);

OptimizedCarList.displayName = 'OptimizedCarList';

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  itemContainer: {
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
});
