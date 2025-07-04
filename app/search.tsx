import React, { useState, useEffect, useCallback, memo, useMemo } from 'react'; // Added useMemo
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ListRenderItem,
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
import { Spacing, Typography, BorderRadius } from '@/constants/Colors'; // Removed currentColors
import { useThemeColors } from '@/hooks/useTheme'; // Import useThemeColors
import { Search, Sparkles, Filter, SlidersHorizontal } from 'lucide-react-native';
import { router } from 'expo-router';

const ITEM_HEIGHT = 380;

const SearchScreen = memo(() => {
  const { colors } = useThemeColors(); // Use themed colors
  const styles = useMemo(() => getThemedStyles(colors), [colors]); // Memoize styles

  const [searchQuery, setSearchQuery] = useState('');
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [aiSearchError, setAiSearchError] = useState<string | null>(null);
  const [aiResults, setAiResults] = useState<Car[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const optimizedProps = useOptimizedFlatList({ 
    itemHeight: ITEM_HEIGHT,
    estimatedItemSize: ITEM_HEIGHT 
  });

  // Create a stable fetchData function that only changes when debouncedSearchQuery changes
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
    enabled: !searchPerformed, // Only enable when not in AI search mode
  });

  // Handle search query changes for regular search
  useEffect(() => {
    if (!searchPerformed && debouncedSearchQuery !== searchQuery) {
      // Only refresh when search query actually changes and we're not in AI mode
      refresh();
    }
  }, [debouncedSearchQuery, searchPerformed, refresh, searchQuery]);

  const handleAISearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setAiSearchLoading(true);
    setAiSearchError(null);
    
    try {
      const sanitizedQuery = sanitizeSearchQuery(searchQuery);
      const searchParams = await parseSearchQuery(sanitizedQuery);
      
      const dbCars = await searchVehiclesWithFilters(searchParams);
      const transformedCars = Array.isArray(dbCars) ? dbCars.map(transformDatabaseVehicleListingToCar) : [];
      
      setAiResults(transformedCars);
      setSearchPerformed(true);
      
    } catch (error) {
      console.error('AI Search error:', error);
      const errorMessage = error instanceof SupabaseError 
        ? `Search failed: ${error.message}`
        : 'AI search is currently unavailable. Please try the regular search.';
      setAiSearchError(errorMessage);
    } finally {
      setAiSearchLoading(false);
    }
  }, [searchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchPerformed(false);
    setAiSearchError(null);
    setAiResults([]);
    // The useInfiniteScroll hook will automatically reload when searchPerformed changes to false
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

  const handleCarPress = useCallback((carId: string | number) => { // Accept carId
    router.push(`/car/${carId}`);
  }, []); // router is stable

  const displayCars = searchPerformed ? aiResults : cars;

  const renderCar: ListRenderItem<Car> = useCallback(({ item }) => (
    <CarCard
      car={item}
      onPress={() => handleCarPress(item.id)} // Pass item.id
    />
  ), [handleCarPress]); // handleCarPress is stable

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
    // The main screen padding will be handled by listContentContainerStyle or individual section paddings
    <View style={styles.headerContent}>
      {/* Title and Subtitle are part of the native header now via app/_layout.tsx */}
      {/* <View style={styles.titleContainer}>
        <Sparkles color={currentColors.primary} size={28} />
        <Text style={styles.title}>AI Car Search</Text>
      </View>
      <Text style={styles.subtitle}>
        Find your perfect car using natural language
      </Text> */}
      
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Describe your ideal car..." // Updated placeholder
        onClear={handleClearSearch}
        onSubmit={handleAISearch}
        // showAIIcon={true} // SearchBar design updated, AI icon not default
        loading={aiSearchLoading}
        containerStyle={styles.searchBarInHeader} // Specific style for searchbar in this header
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
          {...createAccessibilityProps(
            'Advanced filters',
            'Open advanced search filters'
          )}
        >
          <SlidersHorizontal color={colors.primary} size={20} />
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
    searchQuery,
    handleClearSearch,
    handleAISearch,
    aiSearchLoading,
    aiSearchError,
    searchPerformed,
    aiResults.length,
    renderExampleChip,
    colors, // Added colors to dependency array
    styles // styles depend on colors, so if styles object is used directly in header, it should be a dep
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
    ), [searchQuery, colors.textSecondary]); // Added colors.textSecondary to dependencies

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
          onEndReachedThreshold={0.5} // Increased threshold
          refreshControl={
            <PullToRefresh onRefresh={handleRefresh} isRefreshing={refreshing} />
          }
          {...optimizedProps}
        />
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
    // gap: Spacing.md, // Removed unsupported property
    backgroundColor: colors.background,
  },
  loadingText: {
    ...Typography.bodyText,
    color: colors.textSecondary,
    marginTop: Spacing.md, // Add margin instead of gap
  },
  headerContent: {
    paddingTop: Spacing.md,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
     backgroundColor: colors.background, // Match screen background for header area
  },
  searchBarInHeader: {
    paddingHorizontal: 0,
    paddingVertical: Spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap: Spacing.sm, // Removed unsupported property
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
    // gap: Spacing.sm, // Removed unsupported property
  },
  exampleChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: Spacing.sm, // Add spacing between chips
    marginBottom: Spacing.sm, // Add spacing between rows
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
    // paddingHorizontal: Spacing.lg, // Already handled by headerContent or listContent
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    // gap: Spacing.sm, // Removed unsupported property
  },
});

export default SearchScreen;