/**
 * AI-Powered Search Screen
 * 
 * Complete search experience with intelligent suggestions,
 * advanced filters, and personalized recommendations.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { smartSearchService, SearchResult } from '@/services/SmartSearchService';
import { aiRecommendationEngine, CarRecommendation } from '@/services/AIRecommendationEngine';
import { businessAnalyticsService } from '@/services/BusinessAnalyticsService';

import SmartSearchBar from '@/components/SmartSearchBar';
import SmartFilters, { FilterState } from '@/components/SmartFilters';
import { CarCard } from '@/components/CarCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';

const { width: screenWidth } = Dimensions.get('window');

interface SearchState {
  query: string;
  results: any[];
  recommendations: CarRecommendation[];
  isLoading: boolean;
  isSearching: boolean;
  hasSearched: boolean;
  error: string | null;
  filters: Partial<FilterState>;
  totalCount: number;
  searchTime: number;
  popularSearches: string[];
}

const INITIAL_STATE: SearchState = {
  query: '',
  results: [],
  recommendations: [],
  isLoading: true,
  isSearching: false,
  hasSearched: false,
  error: null,
  filters: {},
  totalCount: 0,
  searchTime: 0,
  popularSearches: [],
};

export default function AISearchScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  
  const [state, setState] = useState<SearchState>(INITIAL_STATE);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(1);
  const resultsScale = useSharedValue(1);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [user?.id]);

  const loadInitialData = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const [recommendations, popularSearches] = await Promise.all([
        user?.id ? 
          aiRecommendationEngine.getPersonalizedRecommendations(user.id, 8) : 
          Promise.resolve([]),
        // Get popular searches - simplified for now
        Promise.resolve(['Honda Civic', 'Toyota Camry', 'SUV under 25k', 'BMW 2020', 'Electric cars']),
      ]);

      setState(prev => ({
        ...prev,
        recommendations,
        popularSearches,
        isLoading: false,
      }));

      // Track screen view
      if (user?.id) {
        await businessAnalyticsService.trackUserInteraction(
          user.id,
          'screen_view',
          'search',
          undefined,
          { screen: 'ai_search' }
        );
      }
    } catch (error) {
      console.warn('Failed to load initial data:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load search data. Please try again.',
      }));
    }
  }, [user?.id]);

  const handleSearch = useCallback(async (results: any[]) => {
    setState(prev => ({
      ...prev,
      results,
      hasSearched: true,
      isSearching: false,
      totalCount: results.length,
    }));

    // Animate results appearance
    resultsScale.value = withSpring(1, { damping: 15, stiffness: 100 });
  }, []);

  const handleRecommendationsChange = useCallback((recommendations: CarRecommendation[]) => {
    setState(prev => ({ ...prev, recommendations }));
  }, []);

  const handleApplyFilters = useCallback(async (filters: FilterState) => {
    try {
      setState(prev => ({ 
        ...prev, 
        filters, 
        isSearching: true,
        error: null,
      }));

      if (state.query.trim()) {
        const searchQuery = {
          text: state.query,
          filters: {
            makes: filters.makes,
            models: filters.models,
            yearRange: filters.yearRange,
            priceRange: filters.priceRange,
            mileageRange: filters.mileageRange,
            bodyType: filters.bodyTypes,
            fuelType: filters.fuelTypes,
            condition: filters.condition,
            location: filters.location,
            radius: filters.radius,
          },
        };

        const result = await smartSearchService.search(searchQuery);
        
        setState(prev => ({
          ...prev,
          results: result.cars || [],
          totalCount: result.totalCount,
          searchTime: result.searchTime,
          isSearching: false,
          hasSearched: true,
        }));

        // Track filter usage
        if (user?.id) {
          await businessAnalyticsService.trackUserInteraction(
            user.id,
            'filters_applied',
            'search',
            undefined,
            { filterCount: Object.keys(filters).length }
          );
        }
      } else {
        setState(prev => ({ ...prev, isSearching: false }));
      }
    } catch (error) {
      console.warn('Filter search failed:', error);
      setState(prev => ({
        ...prev,
        isSearching: false,
        error: 'Search failed. Please try again.',
      }));
    }
  }, [state.query, user?.id]);

  const handleResetFilters = useCallback(() => {
    setState(prev => ({ ...prev, filters: {} }));
  }, []);

  const handleCarPress = useCallback(async (car: any) => {
    try {
      // Track car view
      if (user?.id) {
        await businessAnalyticsService.trackUserInteraction(
          user.id,
          'car_view',
          'car',
          car.id,
          { source: 'search' }
        );
      }

      router.push(`/car/${car.id}`);
    } catch (error) {
      console.warn('Failed to track car view:', error);
      router.push(`/car/${car.id}`);
    }
  }, [user?.id, router]);

  const handlePopularSearchPress = useCallback((searchTerm: string) => {
    setState(prev => ({ ...prev, query: searchTerm }));
    // Trigger search with the popular term
    // This would be handled by the SmartSearchBar component
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  }, [loadInitialData]);

  const handleRetry = useCallback(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Filter active count
  const activeFiltersCount = useMemo(() => {
    if (!state.filters) return 0;
    
    let count = 0;
    if (state.filters.makes?.length) count++;
    if (state.filters.models?.length) count++;
    if (state.filters.bodyTypes?.length) count++;
    if (state.filters.fuelTypes?.length) count++;
    if (state.filters.condition?.length) count++;
    if (state.filters.priceRange) count++;
    if (state.filters.yearRange) count++;
    if (state.filters.mileageRange) count++;
    
    return count;
  }, [state.filters]);

  // Animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const resultsAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: resultsScale.value }],
  }));

  if (state.isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingState message="Loading intelligent search..." />
      </SafeAreaView>
    );
  }

  if (state.error && !state.hasSearched) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorState
          title="Search Unavailable"
          message={state.error}
          onRetry={handleRetry}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            AI Search
          </Text>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <SmartSearchBar
            onSearchResults={handleSearch}
            onRecommendationsChange={handleRecommendationsChange}
            userId={user?.id}
            showRecommendations={!state.hasSearched}
            style={styles.searchBar}
          />
        </View>

        {/* Filter Button */}
        <View style={styles.filterContainer}>
          <AnimatedPressable
            style={[
              styles.filterButton,
              {
                backgroundColor: activeFiltersCount > 0 ? colors.primary : colors.surface,
                borderColor: activeFiltersCount > 0 ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setShowFilters(true)}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={activeFiltersCount > 0 ? 'white' : colors.text}
            />
            <Text
              style={[
                styles.filterButtonText,
                {
                  color: activeFiltersCount > 0 ? 'white' : colors.text,
                },
              ]}
            >
              Filters
            </Text>
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </AnimatedPressable>
        </View>
      </Animated.View>

      {/* Main Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {!state.hasSearched ? (
          /* Pre-Search Content */
          <View style={styles.preSearchContent}>
            {/* Personalized Recommendations */}
            {state.recommendations.length > 0 && (
              <Animated.View entering={FadeIn} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  <Ionicons name="sparkles" size={20} color={colors.primary} /> Recommended for You
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.recommendationsContainer}>
                    {state.recommendations.map((recommendation, index) => (
                      <View key={`rec-${recommendation.car.id}-${index}`} style={styles.recommendationCard}>
                        <CarCard
                          car={recommendation.car}
                          onPress={() => handleCarPress(recommendation.car)}
                        />
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </Animated.View>
            )}

            {/* Popular Searches */}
            {state.popularSearches.length > 0 && (
              <Animated.View entering={FadeIn.delay(200)} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  <Ionicons name="trending-up" size={20} color={colors.primary} /> Popular Searches
                </Text>
                <View style={styles.popularSearchesContainer}>
                  {state.popularSearches.map((searchTerm, index) => (
                    <AnimatedPressable
                      key={index}
                      style={[
                        styles.popularSearchChip,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                      ]}
                      onPress={() => handlePopularSearchPress(searchTerm)}
                    >
                      <Ionicons name="search" size={16} color={colors.textSecondary} />
                      <Text style={[styles.popularSearchText, { color: colors.text }]}>
                        {searchTerm}
                      </Text>
                    </AnimatedPressable>
                  ))}
                </View>
              </Animated.View>
            )}

            {/* Search Tips */}
            <Animated.View entering={FadeIn.delay(400)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                <Ionicons name="bulb-outline" size={20} color={colors.primary} /> Search Tips
              </Text>
              <View style={[styles.tipsContainer, { backgroundColor: colors.surface }]}>
                <View style={styles.tip}>
                  <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
                  <Text style={[styles.tipText, { color: colors.text }]}>
                    Try natural language: "reliable SUV under 30k"
                  </Text>
                </View>
                <View style={styles.tip}>
                  <Ionicons name="options-outline" size={16} color={colors.primary} />
                  <Text style={[styles.tipText, { color: colors.text }]}>
                    Use filters to narrow down results
                  </Text>
                </View>
                <View style={styles.tip}>
                  <Ionicons name="star-outline" size={16} color={colors.primary} />
                  <Text style={[styles.tipText, { color: colors.text }]}>
                    Save favorite cars to get better recommendations
                  </Text>
                </View>
              </View>
            </Animated.View>
          </View>
        ) : (
          /* Search Results */
          <Animated.View style={[styles.resultsContent, resultsAnimatedStyle]}>
            {/* Results Header */}
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsTitle, { color: colors.text }]}>
                {state.totalCount > 0 
                  ? `${state.totalCount.toLocaleString()} results`
                  : 'No results found'
                }
              </Text>
              {state.searchTime > 0 && (
                <Text style={[styles.searchTime, { color: colors.textSecondary }]}>
                  in {state.searchTime}ms
                </Text>
              )}
            </View>

            {/* Search Results */}
            {state.isSearching ? (
              <LoadingState message="Searching with AI..." />
            ) : state.results.length > 0 ? (
              <View style={styles.resultsGrid}>
                {state.results.map((car, index) => (
                  <Animated.View
                    key={car.id}
                    entering={FadeIn.delay(index * 100)}
                    style={styles.resultCard}
                  >
                    <CarCard
                      car={car}
                      onPress={() => handleCarPress(car)}
                    />
                  </Animated.View>
                ))}
              </View>
            ) : (
              <EmptyState
                title="No cars found"
                subtitle="Try adjusting your search terms or filters"
              />
            )}

            {/* Load More Button */}
            {state.results.length > 0 && state.results.length < state.totalCount && (
              <View style={styles.loadMoreContainer}>
                <Button
                  title="Load More Results"
                  variant="outline"
                  onPress={() => {
                    // Implement pagination
                    Alert.alert('Coming Soon', 'Pagination will be implemented in the next update.');
                  }}
                />
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>

      {/* Smart Filters Modal */}
      <SmartFilters
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        initialFilters={state.filters}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
        userId={user?.id}
        currentQuery={state.query}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },

  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },

  profileButton: {
    padding: 4,
  },

  searchContainer: {
    marginBottom: 12,
  },

  searchBar: {
    marginBottom: 0,
  },

  filterContainer: {
    alignItems: 'flex-start',
  },

  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },

  filterButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },

  filterBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 8,
  },

  filterBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },

  content: {
    flex: 1,
  },

  preSearchContent: {
    paddingHorizontal: 20,
  },

  section: {
    marginBottom: 32,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  recommendationsContainer: {
    flexDirection: 'row',
    paddingRight: 20,
  },

  recommendationCard: {
    marginRight: 16,
  },

  carCard: {
    width: screenWidth * 0.7,
  },

  popularSearchesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },

  popularSearchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    margin: 4,
  },

  popularSearchText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },

  tipsContainer: {
    padding: 16,
    borderRadius: 12,
  },

  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  tipText: {
    marginLeft: 12,
    fontSize: 14,
    flex: 1,
  },

  resultsContent: {
    paddingHorizontal: 20,
  },

  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },

  searchTime: {
    fontSize: 12,
    fontStyle: 'italic',
  },

  resultsGrid: {
    marginHorizontal: -8,
  },

  resultCard: {
    marginHorizontal: 8,
    marginBottom: 16,
  },

  loadMoreContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
});
