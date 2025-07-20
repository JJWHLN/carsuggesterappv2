import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ListRenderItem,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { CarCard } from '@/components/CarCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useDebounce } from '@/hooks/useDebounce';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { useOptimizedFlatList } from '@/hooks/useOptimizedFlatList';
import { createAccessibilityProps } from '@/hooks/useAccessibility';
import { parseSearchQuery } from '@/lib/openai';
import { fetchVehicleListings, searchVehiclesWithFilters, SupabaseError } from '@/services/supabaseService';
import { transformDatabaseVehicleListingToCar, sanitizeSearchQuery } from '@/utils/dataTransformers';
import { Car } from '@/types/database';
import { Spacing, Typography, BorderRadius } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';

import { router } from 'expo-router';
// Temporarily disabled for testing
// import { usePerformanceTracking, useSearchTracking } from '@/hooks/useAnalytics';
import { trackScreenView } from '@/services/analyticsService';
import { Search, Sparkles, Filter } from '@/utils/ultra-optimized-icons';

const ITEM_HEIGHT = 380;

const SearchScreen = memo(() => {
  const { colors } = useThemeColors();
  const styles = useMemo(() => getThemedStyles(colors), [colors]);

  // Analytics hooks - temporarily disabled for testing
  // const performanceTracker = usePerformanceTracking('SearchScreen');
  // const searchTracker = useSearchTracking();

  const [searchQuery, setSearchQuery] = useState('');
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [aiSearchError, setAiSearchError] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<Car[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'price_low' | 'price_high' | 'year_new' | 'year_old'>('relevance');
  const [filters, setFilters] = useState({
    bodyType: '',
    yearMin: '',
    yearMax: '',
    fuelType: '',
    priceMin: '',
    priceMax: '',
  });
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const optimizedProps = useOptimizedFlatList({ 
    itemHeight: ITEM_HEIGHT,
    estimatedItemSize: ITEM_HEIGHT 
  });

  const fetchData = useCallback(async (page: number, limit: number) => {
    const sanitizedQuery = sanitizeSearchQuery(debouncedSearchQuery);
    const dbCars = await fetchVehicleListings(page, limit, sanitizedQuery || undefined);
    return Array.isArray(dbCars) ? dbCars.map(transformDatabaseVehicleListingToCar) : [];
  }, [debouncedSearchQuery]);

  const {
    data: cars,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    retry,
  } = useInfiniteScroll({
    fetchData,
    pageSize: 10,
    enabled: !searchPerformed,
  });

  const handleAISearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    const startTime = Date.now();
    setAiSearchLoading(true);
    setAiSearchError(null);
    
    try {
      const sanitizedQuery = sanitizeSearchQuery(searchQuery);
      const searchParams = await parseSearchQuery(sanitizedQuery);
      
      const dbCars = await searchVehiclesWithFilters(searchParams);
      const transformedCars = Array.isArray(dbCars) ? dbCars.map(transformDatabaseVehicleListingToCar) : [];
      
      setAiResults(transformedCars);
      setSearchPerformed(true);
      
      // Track successful AI search - temporarily disabled
      // searchTracker.trackSearch(searchQuery, transformedCars.length, 'ai');
      // searchTracker.trackSearchPerformance(searchQuery, duration, 'ai');
      
      // performanceTracker.trackUserInteraction('ai_search_success', {
      //   query: searchQuery,
      //   results_count: transformedCars.length,
      //   duration,
      // });
      
    } catch (error) {
      logger.error('AI Search error:', error);
      const errorMessage = error instanceof SupabaseError 
        ? `Search failed: ${error.message}`
        : 'AI search is currently unavailable. Please try the regular search.';
      setAiSearchError(errorMessage);
      
      // Track search error - temporarily disabled
      // searchTracker.trackSearchError(searchQuery, error instanceof Error ? error : new Error(errorMessage), 'ai');
      
    } finally {
      setAiSearchLoading(false);
    }
  }, [searchQuery]);  // Removed analytics hooks

  useEffect(() => {
    // Track screen view when component mounts
    trackScreenView('ai_search', {
      has_initial_query: searchQuery.length > 0,
    });
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchPerformed(false);
    setAiSearchError(null);
    setAiResults([]);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (searchPerformed) {
        await handleAISearch();
      } else {
        await refresh();
      }
    } finally {
      setRefreshing(false);
    }
  }, [searchPerformed, handleAISearch, refresh]);

  const handleCarPress = useCallback((carId: string | number) => {
    router.push(`/car/${carId}`);
  }, []);

  const displayCars = searchPerformed ? aiResults : cars;

  const renderCar: ListRenderItem<Car> = useCallback(({ item }) => (
    <CarCard
      car={item}
      onPress={() => handleCarPress(item.id)}
    />
  ), [handleCarPress]);

  const renderFooter = useCallback(() => {
    if (searchPerformed || !hasMore || !loading) return null;
    
    return (
      <View style={styles.footerLoader}>
        <LoadingSpinner size={24} />
        <Text style={[styles.loadingText, { marginLeft: Spacing.sm }]}>Loading more cars...</Text>
      </View>
    );
  }, [searchPerformed, hasMore, loading]);

  const renderExampleChip = useCallback((example: string, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.exampleChip}
      onPress={() => setSearchQuery(example)}
      {...createAccessibilityProps(
        `Search example: ${example}`,
        'Double tap to use this search example'
      )}
    >
      <Text style={styles.exampleText}>{example}</Text>
    </TouchableOpacity>
  ), []);

  const renderHeader = useCallback(() => (
    <View style={styles.headerContent}>
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Describe your ideal car..."
        onClear={handleClearSearch}
        onSubmit={handleAISearch}
        loading={aiSearchLoading}
        containerStyle={styles.searchBarInHeader}
      />
      
      {aiSearchError && (
        <View style={styles.aiErrorContainer}>
          <Text style={styles.aiErrorText}>{aiSearchError}</Text>
        </View>
      )}
      
      <View style={styles.buttonContainer}>
        <Button
          title={aiSearchLoading ? 'Searching...' : 'Search with AI'}
          onPress={handleAISearch}
          disabled={aiSearchLoading || !searchQuery.trim()}
          loading={aiSearchLoading}
          style={{...styles.searchButton, flex: 1}}
          icon={<Sparkles color={colors.white} size={16} />}
        />
        <TouchableOpacity 
          style={[styles.filterButton, { marginLeft: Spacing.sm }]}
          onPress={() => setShowFilters(true)}
          {...createAccessibilityProps(
            'Advanced filters',
            'Open advanced search filters'
          )}
        >
          <Filter color={colors.primary} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchExamples}>
        <Text style={styles.examplesTitle}>Try these examples:</Text>
        <View style={styles.examplesContainer}>
          {[
            'BMW under $30,000',
            'Electric cars in Los Angeles',
            'Toyota Camry 2020 with leather seats',
            'SUV with low mileage'
          ].map(renderExampleChip)}
        </View>
      </View>
      
      <Text style={styles.resultsHeader}>
        {searchPerformed 
          ? `AI Search Results (${aiResults.length})` 
          : searchQuery 
            ? 'Search Results' 
            : 'Recent Listings'
        }
      </Text>
    </View>
  ), [
    searchQuery, 
    handleClearSearch, 
    handleAISearch, 
    aiSearchLoading,
    aiSearchError,
    searchPerformed,
    aiResults.length,
    renderExampleChip,
    colors,
    styles
  ]);

  const renderEmpty = useCallback(() => (
    <EmptyState
      title={searchQuery ? 'No cars found' : 'AI Car Search'}
      subtitle={
        searchQuery
          ? 'Try adjusting your search criteria or use AI search for better results'
          : 'Search for cars using natural language. Try "Red Toyota under $25,000" or "BMW in Los Angeles with leather seats"'
      }
        icon={<Search color={colors.textSecondary} size={48} />}
    />
    ), [searchQuery, colors.textSecondary]);

  // Filter and sort options
  const bodyTypes = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Truck', 'Van'];
  const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'];
  const sortOptions = [
    { key: 'relevance', label: 'Relevance' },
    { key: 'price_low', label: 'Price: Low to High' },
    { key: 'price_high', label: 'Price: High to Low' },
    { key: 'year_new', label: 'Year: Newest First' },
    { key: 'year_old', label: 'Year: Oldest First' },
  ];

  const applyFilters = useCallback(() => {
    // Apply filters to current results
    setShowFilters(false);
    // Trigger new search with filters
    if (searchPerformed) {
      handleAISearch();
    } else {
      refresh();
    }
  }, [searchPerformed, handleAISearch, refresh]);

  const clearFilters = useCallback(() => {
    setFilters({
      bodyType: '',
      yearMin: '',
      yearMax: '',
      fuelType: '',
      priceMin: '',
      priceMax: '',
    });
    setSortBy('relevance');
  }, []);

  const renderFilterModal = useCallback(() => {
    if (!showFilters) return null;

    return (
      <View style={styles.filterOverlay}>
        <View style={styles.filterModal}>
          <View style={styles.filterHeader}>
            <Text style={[styles.filterTitle, { color: colors.text }]}>Filters & Sort</Text>
            <TouchableOpacity 
              onPress={() => setShowFilters(false)}
              style={styles.closeButton}
            >
              <Text style={[styles.closeButtonText, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent}>
            {/* Sort Options */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Sort By</Text>
              <View style={styles.optionGroup}>
                {sortOptions.map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.optionButton,
                      { 
                        backgroundColor: sortBy === option.key ? colors.primaryLight : colors.surface,
                        borderColor: sortBy === option.key ? colors.primary : colors.border 
                      }
                    ]}
                    onPress={() => setSortBy(option.key as any)}
                  >
                    <Text style={[
                      styles.optionText,
                      { color: sortBy === option.key ? colors.primary : colors.text }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Body Type Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Body Type</Text>
              <View style={styles.optionGroup}>
                {bodyTypes.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionButton,
                      { 
                        backgroundColor: filters.bodyType === type ? colors.primaryLight : colors.surface,
                        borderColor: filters.bodyType === type ? colors.primary : colors.border 
                      }
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, bodyType: prev.bodyType === type ? '' : type }))}
                  >
                    <Text style={[
                      styles.optionText,
                      { color: filters.bodyType === type ? colors.primary : colors.text }
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Fuel Type Filter */}
            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Fuel Type</Text>
              <View style={styles.optionGroup}>
                {fuelTypes.map((fuel) => (
                  <TouchableOpacity
                    key={fuel}
                    style={[
                      styles.optionButton,
                      { 
                        backgroundColor: filters.fuelType === fuel ? colors.primaryLight : colors.surface,
                        borderColor: filters.fuelType === fuel ? colors.primary : colors.border 
                      }
                    ]}
                    onPress={() => setFilters(prev => ({ ...prev, fuelType: prev.fuelType === fuel ? '' : fuel }))}
                  >
                    <Text style={[
                      styles.optionText,
                      { color: filters.fuelType === fuel ? colors.primary : colors.text }
                    ]}>
                      {fuel}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.filterActions}>
              <Button
                title="Clear All"
                onPress={clearFilters}
                variant="outline"
                style={styles.filterActionButton}
              />
              <Button
                title="Apply Filters"
                onPress={applyFilters}
                style={styles.filterActionButton}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }, [showFilters, colors, sortBy, filters, sortOptions, bodyTypes, fuelTypes, applyFilters, clearFilters]);

  if (loading && displayCars.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={32} />
          <Text style={styles.loadingText}>Loading cars...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && displayCars.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          message={error}
          onRetry={retry}
        />
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container}>
        <FlatList<Car>
          data={displayCars}
          renderItem={renderCar}
          ListHeaderComponent={renderHeader}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={displayCars.length === 0 ? styles.emptyContent : styles.content}
          showsVerticalScrollIndicator={false}
          onEndReached={searchPerformed ? undefined : loadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <PullToRefresh onRefresh={handleRefresh} isRefreshing={refreshing} />
          }
          {...optimizedProps}
        />
        {renderFilterModal()}
      </SafeAreaView>
    </ErrorBoundary>
  );
});

SearchScreen.displayName = 'SearchScreen';

const getThemedStyles = (colors: typeof import('@/constants/Colors').Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  emptyContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    ...Typography.bodyText,
    color: colors.textSecondary,
    marginTop: Spacing.md,
  },
  headerContent: {
    paddingTop: Spacing.md,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
     backgroundColor: colors.background,
  },
  searchBarInHeader: {
    paddingHorizontal: 0,
    paddingVertical: Spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  searchButton: {
    marginHorizontal: 0,
  },
  filterButton: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.sm + Spacing.xs / 2,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  aiErrorContainer: {
    backgroundColor: colors.error,
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  aiErrorText: {
    ...Typography.bodySmall,
    color: colors.white,
    textAlign: 'center',
  },
  searchExamples: {
    marginTop: Spacing.lg,
  },
  examplesTitle: {
    ...Typography.bodyText,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  examplesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  exampleChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  exampleText: {
    ...Typography.bodySmall,
    fontWeight: Typography.caption.fontWeight,
    color: colors.text,
  },
  resultsHeader: {
    ...Typography.sectionTitle,
    color: colors.text,
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
  },
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  filterModal: {
    width: '90%',
    backgroundColor: colors.background,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    elevation: 4,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  filterTitle: {
    ...Typography.h3,
    fontSize: 18,
    margin: 0,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  closeButtonText: {
    ...Typography.bodyText,
    fontWeight: '600',
  },
  filterContent: {
    maxHeight: '70%',
  },
  filterSection: {
    marginBottom: Spacing.lg,
  },
  filterSectionTitle: {
    ...Typography.bodyText,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  optionGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    flex: 1,
  },
  optionText: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  filterActionButton: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
});

export default SearchScreen;