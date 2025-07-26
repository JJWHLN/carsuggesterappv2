import React, {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// Performance-optimized imports
import { VirtualizedList } from '../components/ui/VirtualizedList';
import {
  OptimizedCarCard,
  useCarCardInteractions,
} from '../components/ui/OptimizedCarCard';
import {
  DebouncedSearch,
  useOptimizedSearch,
} from '../components/ui/DebouncedSearch';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ErrorState } from '../components/ui/ErrorState';
import { EmptyState } from '../components/ui/EmptyState';
import {
  usePerformanceMonitor,
  useRenderTracking,
} from '../src/utils/performance';
import { Car } from '../src/features/recommendations/types';

// Optimized search API
const searchCarsAPI = async (query: string): Promise<Car[]> => {
  // Simulate API call with realistic delay
  await new Promise((resolve) =>
    setTimeout(resolve, Math.random() * 500 + 200),
  );

  if (!query.trim()) return [];

  // Mock search results based on query
  const mockCars: Car[] = Array.from(
    { length: Math.floor(Math.random() * 20) + 5 },
    (_, index) => ({
      id: `search-${query}-${index}`,
      make: ['Toyota', 'Honda', 'BMW', 'Mercedes', 'Audi', 'Ford'][
        Math.floor(Math.random() * 6)
      ],
      model: ['Camry', 'Civic', 'X5', 'C-Class', 'A4', 'F-150'][
        Math.floor(Math.random() * 6)
      ],
      year: 2020 + Math.floor(Math.random() * 4),
      price: 20000 + Math.floor(Math.random() * 50000),
      bodyStyle: ['Sedan', 'SUV', 'Hatchback', 'Truck'][
        Math.floor(Math.random() * 4)
      ],
      fuelEfficiency: 20 + Math.floor(Math.random() * 20),
      brand: ['Toyota', 'Honda', 'BMW', 'Mercedes', 'Audi', 'Ford'][
        Math.floor(Math.random() * 6)
      ],
      features: ['Navigation', 'Bluetooth', 'Backup Camera', 'Sunroof'],
      safetyRating: 3 + Math.floor(Math.random() * 3),
    }),
  );

  return mockCars.filter(
    (car) =>
      car.make.toLowerCase().includes(query.toLowerCase()) ||
      car.model.toLowerCase().includes(query.toLowerCase()) ||
      car.bodyStyle.toLowerCase().includes(query.toLowerCase()),
  );
};

const { width: screenWidth } = Dimensions.get('window');

const OptimizedSearchScreen: React.FC = () => {
  // Performance tracking
  useRenderTracking('SearchScreen');
  const { trackMetric, trackNavigation } = usePerformanceMonitor();

  // Search state management
  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
    search,
    clearResults,
  } = useOptimizedSearch<Car>();

  // Car interactions
  const { toggleFavorite, isFavorited } = useCarCardInteractions();

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltersVisible, setIsFiltersVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<{
    bodyStyle?: string;
    priceRange?: [number, number];
    year?: [number, number];
  }>({});

  // Refs for performance tracking
  const screenMountTime = useRef<number>();
  const searchStartTime = useRef<number>();

  // Track screen mount performance
  useEffect(() => {
    screenMountTime.current = Date.now();

    return () => {
      if (screenMountTime.current) {
        const mountDuration = Date.now() - screenMountTime.current;
        trackMetric(
          'screen-session-duration',
          mountDuration,
          { good: 30000, needsImprovement: 60000 },
          { screen: 'search', resultsFound: searchResults.length },
        );
      }
    };
  }, [trackMetric, searchResults.length]);

  // Memoized search suggestions
  const searchSuggestions = useMemo(
    () => [
      'Toyota Camry',
      'Honda Civic',
      'BMW X5',
      'Mercedes C-Class',
      'Audi A4',
      'Ford F-150',
      'Tesla Model 3',
      'Volkswagen Golf',
      'Mazda CX-5',
      'Subaru Outback',
    ],
    [],
  );

  // Memoized filter options
  const filterOptions = useMemo(
    () => ({
      bodyStyles: [
        'Sedan',
        'SUV',
        'Hatchback',
        'Truck',
        'Coupe',
        'Convertible',
      ],
      priceRanges: [
        { label: 'Under $20k', value: [0, 20000] as [number, number] },
        { label: '$20k - $40k', value: [20000, 40000] as [number, number] },
        { label: '$40k - $60k', value: [40000, 60000] as [number, number] },
        { label: 'Over $60k', value: [60000, Infinity] as [number, number] },
      ],
      yearRanges: [
        { label: '2020-2024', value: [2020, 2024] as [number, number] },
        { label: '2015-2019', value: [2015, 2019] as [number, number] },
        { label: '2010-2014', value: [2010, 2014] as [number, number] },
      ],
    }),
    [],
  );

  // Optimized search handler
  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        clearResults();
        return;
      }

      searchStartTime.current = Date.now();
      setSearchQuery(query);

      try {
        await search(query, searchCarsAPI);

        if (searchStartTime.current) {
          const searchDuration = Date.now() - searchStartTime.current;
          trackMetric(
            'search-completion-time',
            searchDuration,
            { good: 1000, needsImprovement: 2000 },
            { query, hasFilters: Object.keys(selectedFilters).length > 0 },
          );
        }
      } catch (error) {
        console.error('Search failed:', error);
      }
    },
    [search, clearResults, trackMetric, selectedFilters],
  );

  // Optimized car card press handler
  const handleCarPress = useCallback(
    (car: Car) => {
      const navigationStart = Date.now();

      trackNavigation('car-detail', Date.now() - navigationStart);

      // Navigate to car detail
      router.push({
        pathname: '/car/[id]',
        params: { id: car.id },
      });
    },
    [trackNavigation],
  );

  // Optimized favorite handler
  const handleFavoritePress = useCallback(
    (carId: string) => {
      toggleFavorite(carId);

      trackMetric(
        'favorite-interaction',
        1,
        { good: 1, needsImprovement: 0.8 },
        { action: isFavorited(carId) ? 'remove' : 'add' },
      );
    },
    [toggleFavorite, trackMetric, isFavorited],
  );

  // Optimized render item
  const renderCarItem = useCallback(
    ({ item, index }: { item: Car; index: number }) => (
      <OptimizedCarCard
        car={item}
        onPress={handleCarPress}
        onFavorite={handleFavoritePress}
        isFavorited={isFavorited(item.id)}
        style={styles.carCard}
        index={index}
        priority={index < 3} // Prioritize first 3 items
      />
    ),
    [handleCarPress, handleFavoritePress, isFavorited, styles.carCard],
  );

  // Memoized filter controls
  const filterControls = useMemo(
    () => (
      <View style={styles.filtersContainer}>
        <Text style={styles.filtersTitle}>Filters</Text>

        {/* Body Style Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Body Style</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filterOptions.bodyStyles.map((bodyStyle) => (
              <TouchableOpacity
                key={bodyStyle}
                style={[
                  styles.filterChip,
                  selectedFilters.bodyStyle === bodyStyle &&
                    styles.filterChipSelected,
                ]}
                onPress={() =>
                  setSelectedFilters((prev) => ({
                    ...prev,
                    bodyStyle:
                      prev.bodyStyle === bodyStyle ? undefined : bodyStyle,
                  }))
                }
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilters.bodyStyle === bodyStyle &&
                      styles.filterChipTextSelected,
                  ]}
                >
                  {bodyStyle}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Price Range Filter */}
        <View style={styles.filterSection}>
          <Text style={styles.filterLabel}>Price Range</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {filterOptions.priceRanges.map((range) => (
              <TouchableOpacity
                key={range.label}
                style={[
                  styles.filterChip,
                  selectedFilters.priceRange === range.value &&
                    styles.filterChipSelected,
                ]}
                onPress={() =>
                  setSelectedFilters((prev) => ({
                    ...prev,
                    priceRange:
                      prev.priceRange === range.value ? undefined : range.value,
                  }))
                }
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedFilters.priceRange === range.value &&
                      styles.filterChipTextSelected,
                  ]}
                >
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    ),
    [filterOptions, selectedFilters],
  );

  // Memoized filtered results
  const filteredResults = useMemo(() => {
    if (!searchResults.length) return [];

    return searchResults.filter((car) => {
      // Apply body style filter
      if (
        selectedFilters.bodyStyle &&
        car.bodyStyle !== selectedFilters.bodyStyle
      ) {
        return false;
      }

      // Apply price range filter
      if (selectedFilters.priceRange) {
        const [min, max] = selectedFilters.priceRange;
        if (car.price < min || car.price > max) {
          return false;
        }
      }

      // Apply year range filter
      if (selectedFilters.year) {
        const [minYear, maxYear] = selectedFilters.year;
        if (car.year < minYear || car.year > maxYear) {
          return false;
        }
      }

      return true;
    });
  }, [searchResults, selectedFilters]);

  // Performance stats for debugging
  const performanceStats = useMemo(
    () => ({
      totalResults: searchResults.length,
      filteredResults: filteredResults.length,
      activeFilters: Object.keys(selectedFilters).length,
      searchQuery: searchQuery.length,
    }),
    [
      searchResults.length,
      filteredResults.length,
      selectedFilters,
      searchQuery.length,
    ],
  );

  if (__DEV__) {
    console.log('Search Performance Stats:', performanceStats);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Find Your Perfect Car</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setIsFiltersVisible(!isFiltersVisible)}
        >
          <Text style={styles.filterButtonText}>
            Filters{' '}
            {Object.keys(selectedFilters).length > 0 &&
              `(${Object.keys(selectedFilters).length})`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <DebouncedSearch
          onSearch={handleSearch}
          placeholder="Search by make, model, or type..."
          debounceMs={300}
          minCharacters={2}
          showSuggestions={true}
          suggestions={searchSuggestions}
          loading={searchLoading}
          style={styles.searchBar}
        />
      </View>

      {/* Filters */}
      {isFiltersVisible && filterControls}

      {/* Results */}
      <View style={styles.resultsContainer}>
        {searchError && (
          <ErrorState
            title="Search Failed"
            message={searchError}
            onRetry={() => handleSearch(searchQuery)}
          />
        )}

        {!searchError &&
          !searchLoading &&
          searchQuery &&
          filteredResults.length === 0 && (
            <EmptyState
              title="No cars found"
              message={`No results for "${searchQuery}". Try adjusting your filters or search terms.`}
            />
          )}

        {!searchError && !searchLoading && !searchQuery && (
          <EmptyState
            title="Start your search"
            message="Enter a car make, model, or type to find your perfect vehicle."
          />
        )}

        {filteredResults.length > 0 && (
          <>
            <Text style={styles.resultsCount}>
              {filteredResults.length} car
              {filteredResults.length !== 1 ? 's' : ''} found
            </Text>

            <VirtualizedList
              data={filteredResults}
              renderItem={renderCarItem}
              keyExtractor={(item) => item.id}
              itemHeight={400}
              windowSize={5}
              initialNumToRender={3}
              maxToRenderPerBatch={2}
              removeClippedSubviews={true}
              onEndReachedThreshold={0.5}
              debug={__DEV__}
            />
          </>
        )}

        {searchLoading && (
          <View style={styles.loadingContainer}>
            <LoadingSpinner size="large" />
            <Text style={styles.loadingText}>Searching for cars...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBar: {
    marginBottom: 0,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f3f4f6',
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  filterChipSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterChipText: {
    fontSize: 14,
    color: '#374151',
  },
  filterChipTextSelected: {
    color: '#fff',
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginVertical: 12,
  },
  carCard: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
});

export default React.memo(OptimizedSearchScreen);
