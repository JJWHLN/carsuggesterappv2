import React, { useCallback } from 'react';
import { RefreshControl } from 'react-native';
import { useThemeColors } from '@/hooks/useTheme';
import { NavigationService } from '@/services/NavigationService';

/**
 * Common UI utilities and patterns used across screens
 */

// Pull to refresh configuration
export function usePullToRefresh(onRefresh: () => void, refreshing: boolean) {
  const { colors } = useThemeColors();
  
  const refreshControl = React.createElement(RefreshControl, {
    refreshing,
    onRefresh,
    tintColor: colors.primary,
    colors: [colors.primary],
    progressBackgroundColor: colors.background,
  });

  return { refreshControl };
}

// Common navigation patterns
export function useNavigationHandlers() {
  const handleCarPress = useCallback((carId: string) => {
    console.log('Navigate to car details:', carId);
    NavigationService.navigateToCar(carId);
  }, []);

  const handleModelPress = useCallback((modelId: string) => {
    console.log('Navigate to model details:', modelId);
    NavigationService.navigateToModel(modelId);
  }, []);

  const handleBrandPress = useCallback((brandId: string) => {
    console.log('Navigate to brand details:', brandId);
    NavigationService.navigateToBrand(brandId);
  }, []);

  const handleReviewPress = useCallback((reviewId: string) => {
    console.log('Navigate to review details:', reviewId);
    NavigationService.navigateToReview(reviewId);
  }, []);

  return {
    handleCarPress,
    handleModelPress,
    handleBrandPress,
    handleReviewPress,
  };
}

// Common loading and error states
export interface LoadingStateProps {
  loading: boolean;
  error: string | null;
  data: any[];
  loadingText?: string;
  errorTitle?: string;
  emptyTitle?: string;
  emptySubtitle?: string;
  onRetry?: () => void;
}

export function useScreenState() {
  const renderLoadingState = useCallback((text = "Loading...") => ({
    isLoading: true,
    loadingText: text,
  }), []);

  const renderErrorState = useCallback((error: string, title = "Something went wrong", onRetry?: () => void) => ({
    isError: true,
    errorTitle: title,
    errorMessage: error,
    onRetry,
  }), []);

  const renderEmptyState = useCallback((title: string, subtitle?: string) => ({
    isEmpty: true,
    emptyTitle: title,
    emptySubtitle: subtitle,
  }), []);

  return {
    renderLoadingState,
    renderErrorState,
    renderEmptyState,
  };
}

// Pagination utilities
export function usePagination<T>(
  fetchFunction: (page: number, limit: number, ...args: any[]) => Promise<T[]>,
  limit = 10
) {
  const loadMore = useCallback(async (
    currentData: T[],
    currentPage: number,
    hasMore: boolean,
    setLoading: (loading: boolean) => void,
    setData: (data: T[]) => void,
    setPage: (page: number) => void,
    setHasMore: (hasMore: boolean) => void,
    ...args: any[]
  ) => {
    if (!hasMore) return;
    
    setLoading(true);
    try {
      const newData = await fetchFunction(currentPage, limit, ...args);
      setData([...currentData, ...newData]);
      setPage(currentPage + 1);
      setHasMore(newData.length === limit);
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, limit]);

  return { loadMore };
}

// Common FlatList configurations
export function useOptimizedFlatListProps(estimatedItemHeight = 200) {
  return {
    removeClippedSubviews: true,
    maxToRenderPerBatch: 10,
    updateCellsBatchingPeriod: 50,
    initialNumToRender: 10,
    windowSize: 10,
    getItemLayout: useCallback((data: any, index: number) => ({
      length: estimatedItemHeight,
      offset: estimatedItemHeight * index,
      index,
    }), [estimatedItemHeight]),
  };
}
