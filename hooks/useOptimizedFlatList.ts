import { useMemo, useCallback } from 'react';
import { Dimensions } from 'react-native';

const { height: screenHeight } = Dimensions.get('window');

interface UseOptimizedFlatListProps {
  itemHeight?: number;
  estimatedItemSize?: number;
  numColumns?: number;
}

export function useOptimizedFlatList({
  itemHeight,
  estimatedItemSize = 200,
  numColumns = 1,
}: UseOptimizedFlatListProps = {}) {
  
  const getItemLayout = useMemo(() => {
    if (!itemHeight) return undefined;
    
    return (data: any, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    });
  }, [itemHeight]);

  const keyExtractor = useCallback((item: any, index: number) => {
    return item?.id?.toString() || `item-${index}`;
  }, []);

  const optimizedProps = useMemo(() => {
    const itemsPerScreen = Math.ceil(screenHeight / estimatedItemSize);
    
    return {
      removeClippedSubviews: true,
      maxToRenderPerBatch: itemsPerScreen * 2,
      initialNumToRender: itemsPerScreen,
      windowSize: 10,
      updateCellsBatchingPeriod: 50,
      
      getItemLayout,
      keyExtractor,
      numColumns,
      
      legacyImplementation: false,
    };
  }, [getItemLayout, keyExtractor, numColumns, estimatedItemSize]);

  return optimizedProps;
}