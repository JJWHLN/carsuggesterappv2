import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Search,
  SlidersHorizontal,
  Star,
  MapPin,
  DollarSign,
} from '@/utils/ultra-optimized-icons';

import { UnifiedCarCard as CarCard } from '@/components/ui/unified';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useThemeColors } from '@/hooks/useTheme';
import { useDebounce } from '@/hooks/useDebounce';

import CarDataService, {
  CarSearchOptions,
  CarSearchFilters,
} from '@/services/core/CarDataService';
import SimpleRecommendationEngine from '@/services/core/SimpleRecommendationEngine';
import UserPreferencesService from '@/services/core/UserPreferencesService';
import { Car } from '@/types/database';

const { width } = Dimensions.get('window');

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'make' | 'recent' | 'suggestion';
}

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();

  // Services
  const carDataService = CarDataService.getInstance();
  const recommendationEngine = SimpleRecommendationEngine.getInstance();
  const preferencesService = UserPreferencesService.getInstance();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [cars, setCars] = useState<Car[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [popularMakes, setPopularMakes] = useState<
    Array<{ make: string; count: number }>
  >([]);

  // Filters
  const [filters, setFilters] = useState<CarSearchFilters>({});
  const [sortBy, setSortBy] = useState<
    'price' | 'year' | 'mileage' | 'created_at'
  >('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Perform search when debounced term changes
  useEffect(() => {
    if (debouncedSearchTerm) {
      handleSearch();
    } else {
      loadRecommendations();
    }
  }, [debouncedSearchTerm, filters, sortBy, sortOrder]);

  // Load search suggestions when focused
  useEffect(() => {
    if (searchFocused) {
      loadSearchSuggestions();
    }
  }, [searchFocused]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [makes, recommendations] = await Promise.all([
        carDataService.getPopularMakes(),
        recommendationEngine.getNewUserRecommendations(10),
      ]);

      setPopularMakes(makes);
      setCars(recommendations);
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      const recommendations =
        await recommendationEngine.getNewUserRecommendations(20);
      setCars(recommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);

      // Track search behavior
      if (debouncedSearchTerm) {
        preferencesService.trackBehaviorEvent({
          type: 'search',
          searchTerm: debouncedSearchTerm,
          timestamp: Date.now(),
        });
      }

      const searchOptions: CarSearchOptions = {
        filters: {
          ...filters,
          ...(debouncedSearchTerm &&
            extractFiltersFromSearchTerm(debouncedSearchTerm)),
        },
        searchTerm: debouncedSearchTerm,
        sortBy,
        sortOrder,
        limit: 50,
      };

      const result = await carDataService.searchCars(searchOptions);
      setCars(result.cars);
    } catch (error) {
      console.error('Error searching cars:', error);
      Alert.alert('Search Error', 'Failed to search cars. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadSearchSuggestions = async () => {
    try {
      const [recentSuggestions, makesList] = await Promise.all([
        preferencesService.getSearchSuggestions(),
        carDataService.getPopularMakes(),
      ]);

      const suggestions: SearchSuggestion[] = [
        ...recentSuggestions.map((text, index) => ({
          id: `recent-${index}`,
          text,
          type: 'recent' as const,
        })),
        ...makesList.slice(0, 5).map((make, index) => ({
          id: `make-${index}`,
          text: make.make,
          type: 'make' as const,
        })),
        {
          id: 'suggestion-1',
          text: 'Cars under $20,000',
          type: 'suggestion',
        },
        {
          id: 'suggestion-2',
          text: 'Low mileage cars',
          type: 'suggestion',
        },
        {
          id: 'suggestion-3',
          text: 'Recent listings',
          type: 'suggestion',
        },
      ];

      setSuggestions(suggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const extractFiltersFromSearchTerm = (
    term: string,
  ): Partial<CarSearchFilters> => {
    const extractedFilters: Partial<CarSearchFilters> = {};
    const lowerTerm = term.toLowerCase();

    // Extract price filters
    const priceMatches = lowerTerm.match(/under\s*\$?(\d+(?:,?\d+)*)/);
    if (priceMatches) {
      const price = parseInt(priceMatches[1].replace(/,/g, ''));
      extractedFilters.priceRange = { min: 0, max: price };
    }

    // Extract make from popular makes
    const makeMatch = popularMakes.find((make) =>
      lowerTerm.includes(make.make.toLowerCase()),
    );
    if (makeMatch) {
      extractedFilters.make = makeMatch.make;
    }

    return extractedFilters;
  };

  const handleSuggestionPress = (suggestion: SearchSuggestion) => {
    setSearchTerm(suggestion.text);
    setSearchFocused(false);
  };

  const handleCarPress = (car: Car) => {
    // Track viewing behavior
    preferencesService.trackBehaviorEvent({
      type: 'view',
      carId: car.id,
      make: car.make,
      priceRange: { min: car.price * 0.9, max: car.price * 1.1 },
      timestamp: Date.now(),
    });

    router.push(`/car/${car.id}`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    if (debouncedSearchTerm) {
      await handleSearch();
    } else {
      await loadRecommendations();
    }
    setRefreshing(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilters({});
    setSearchFocused(false);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const renderSuggestion = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={[styles.suggestionItem, { backgroundColor: colors.surface }]}
      onPress={() => handleSuggestionPress(item)}
    >
      <Search size={16} color={colors.textSecondary} />
      <Text style={[styles.suggestionText, { color: colors.text }]}>
        {item.text}
      </Text>
      <Text style={[styles.suggestionType, { color: colors.textSecondary }]}>
        {item.type}
      </Text>
    </TouchableOpacity>
  );

  const renderCar = ({ item }: { item: Car }) => (
    <CarCard
      car={item}
      onPress={() => handleCarPress(item)}
      showSaveButton={true}
    />
  );

  const renderFilterButton = () => (
    <TouchableOpacity
      style={[styles.filterButton, { backgroundColor: colors.primary }]}
      onPress={toggleFilters}
    >
      <SlidersHorizontal size={20} color={colors.background} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>
          Find Your Perfect Car
        </Text>

        {/* Search Bar */}
        <View
          style={[
            styles.searchContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by make, model, or keywords..."
            placeholderTextColor={colors.textSecondary}
            value={searchTerm}
            onChangeText={setSearchTerm}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Text style={[styles.clearButton, { color: colors.primary }]}>
                Clear
              </Text>
            </TouchableOpacity>
          )}
          {renderFilterButton()}
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {cars.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Cars Found
            </Text>
          </View>
          {popularMakes.length > 0 && (
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>
                {popularMakes.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                Makes Available
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Content */}
      {searchFocused && suggestions.length > 0 ? (
        // Search Suggestions
        <FlatList
          data={suggestions}
          renderItem={renderSuggestion}
          keyExtractor={(item) => item.id}
          style={styles.suggestionsList}
        />
      ) : (
        // Car Results
        <FlatList
          data={cars}
          renderItem={renderCar}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.carsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            loading ? (
              <LoadingSpinner />
            ) : (
              <EmptyState
                title="No cars found"
                subtitle="Try adjusting your search criteria or browse our recommendations"
              />
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  clearButton: {
    fontWeight: '600',
    marginRight: 8,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  suggestionsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  suggestionText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  suggestionType: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  carsList: {
    paddingHorizontal: 8,
    paddingTop: 16,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
});
