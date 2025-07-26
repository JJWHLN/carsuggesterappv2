/**
 * AI-Powered Smart Search Component
 *
 * Provides natural language search with intelligent suggestions
 * and real-time filtering capabilities.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  StyleSheet,
  Dimensions,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { useDebounce } from '@/hooks/useDebounce';
import {
  smartSearchService,
  SearchSuggestion,
  SearchQuery,
} from '@/services/SmartSearchService';
import {
  aiRecommendationEngine,
  CarRecommendation,
} from '@/services/AIRecommendationEngine';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const { width: screenWidth } = Dimensions.get('window');

interface SmartSearchBarProps {
  onSearchResults?: (results: any[]) => void;
  onRecommendationsChange?: (recommendations: CarRecommendation[]) => void;
  userId?: string;
  placeholder?: string;
  showRecommendations?: boolean;
  maxSuggestions?: number;
  style?: object;
}

interface SearchState {
  query: string;
  isActive: boolean;
  suggestions: SearchSuggestion[];
  recommendations: CarRecommendation[];
  isLoading: boolean;
  showSuggestions: boolean;
  recentSearches: string[];
}

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  onSearchResults,
  onRecommendationsChange,
  userId,
  placeholder = "Try 'reliable SUV under 30k' or 'Honda Civic 2020'",
  showRecommendations = true,
  maxSuggestions = 6,
  style,
}) => {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);

  const [state, setState] = useState<SearchState>({
    query: '',
    isActive: false,
    suggestions: [],
    recommendations: [],
    isLoading: false,
    showSuggestions: false,
    recentSearches: [],
  });

  // Animated values
  const searchBarScale = useSharedValue(1);
  const suggestionsOpacity = useSharedValue(0);
  const suggestionsHeight = useSharedValue(0);

  // Debounced search query
  const debouncedQuery = useDebounce(state.query, 300);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
    if (showRecommendations && userId) {
      loadInitialRecommendations();
    }
  }, [userId, showRecommendations]);

  // Handle debounced search
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      handleSearch(debouncedQuery);
    } else if (debouncedQuery.trim().length === 0) {
      setState((prev) => ({
        ...prev,
        suggestions: [],
        showSuggestions: false,
      }));
      hideSuggestions();
    }
  }, [debouncedQuery]);

  const loadRecentSearches = useCallback(async () => {
    try {
      // In a real app, this would load from AsyncStorage or API
      const recentSearches = [
        'Honda Civic',
        'Toyota Camry 2020',
        'SUV under 25k',
        'Fuel efficient cars',
      ];
      setState((prev) => ({ ...prev, recentSearches }));
    } catch (error) {
      console.warn('Failed to load recent searches:', error);
    }
  }, []);

  const loadInitialRecommendations = useCallback(async () => {
    if (!userId) return;

    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      const recommendations =
        await aiRecommendationEngine.getPersonalizedRecommendations(
          userId,
          4, // Limit for search bar display
        );

      setState((prev) => ({
        ...prev,
        recommendations,
        isLoading: false,
      }));

      onRecommendationsChange?.(recommendations);
    } catch (error) {
      console.warn('Failed to load recommendations:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [userId, onRecommendationsChange]);

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) return;

      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        // Get search suggestions
        const suggestions = await smartSearchService.getSearchSuggestions(
          query,
          maxSuggestions,
        );

        setState((prev) => ({
          ...prev,
          suggestions,
          showSuggestions: true,
          isLoading: false,
        }));

        showSuggestions();
      } catch (error) {
        console.warn('Search failed:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [maxSuggestions],
  );

  const executeSearch = useCallback(
    async (searchQuery: string, additionalFilters?: any) => {
      if (!searchQuery.trim()) return;

      try {
        setState((prev) => ({
          ...prev,
          isLoading: true,
          showSuggestions: false,
        }));

        hideSuggestions();
        Keyboard.dismiss();

        // Create search query object
        const query: SearchQuery = {
          text: searchQuery,
          filters: additionalFilters || {},
        };

        // Execute the search
        const result = await smartSearchService.search(query);

        // Save to recent searches
        saveRecentSearch(searchQuery);

        // Update state and notify parent
        setState((prev) => ({
          ...prev,
          query: searchQuery,
          isLoading: false,
          isActive: false,
        }));

        onSearchResults?.(result.cars || []);

        // Get updated recommendations based on search
        if (userId && showRecommendations) {
          const recommendations =
            await aiRecommendationEngine.getPersonalizedRecommendations(
              userId,
              4,
            );
          setState((prev) => ({ ...prev, recommendations }));
          onRecommendationsChange?.(recommendations);
        }
      } catch (error) {
        console.warn('Search execution failed:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [userId, showRecommendations, onSearchResults, onRecommendationsChange],
  );

  const saveRecentSearch = useCallback((query: string) => {
    setState((prev) => ({
      ...prev,
      recentSearches: [
        query,
        ...prev.recentSearches.filter((s) => s !== query).slice(0, 4),
      ],
    }));
  }, []);

  const handleInputFocus = useCallback(() => {
    setState((prev) => ({ ...prev, isActive: true }));
    searchBarScale.value = withSpring(1.02);

    if (state.query.trim().length >= 2) {
      showSuggestions();
    }
  }, [state.query]);

  const handleInputBlur = useCallback(() => {
    setState((prev) => ({ ...prev, isActive: false }));
    searchBarScale.value = withSpring(1);

    // Delay hiding suggestions to allow for suggestion taps
    setTimeout(() => {
      hideSuggestions();
    }, 150);
  }, []);

  const showSuggestions = useCallback(() => {
    setState((prev) => ({ ...prev, showSuggestions: true }));
    suggestionsOpacity.value = withTiming(1, { duration: 200 });
    suggestionsHeight.value = withSpring(
      Math.min(300, maxSuggestions * 60 + 20),
    );
  }, [maxSuggestions]);

  const hideSuggestions = useCallback(() => {
    suggestionsOpacity.value = withTiming(0, { duration: 150 });
    suggestionsHeight.value = withTiming(0, { duration: 150 }, (finished) => {
      if (finished) {
        runOnJS(() => {
          setState((prev) => ({ ...prev, showSuggestions: false }));
        })();
      }
    });
  }, []);

  const handleSuggestionPress = useCallback(
    (suggestion: SearchSuggestion) => {
      executeSearch(suggestion.value);
    },
    [executeSearch],
  );

  const handleClearSearch = useCallback(() => {
    setState((prev) => ({
      ...prev,
      query: '',
      suggestions: [],
      showSuggestions: false,
    }));
    hideSuggestions();
    inputRef.current?.focus();
  }, []);

  // Animated styles
  const searchBarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchBarScale.value }],
  }));

  const suggestionsAnimatedStyle = useAnimatedStyle(() => ({
    opacity: suggestionsOpacity.value,
    height: suggestionsHeight.value,
    transform: [
      {
        translateY: interpolate(suggestionsOpacity.value, [0, 1], [-10, 0]),
      },
    ],
  }));

  const renderSuggestion = useCallback(
    ({ item }: { item: SearchSuggestion }) => (
      <AnimatedPressable
        style={styles.suggestionItem}
        onPress={() => handleSuggestionPress(item)}
      >
        <View style={styles.suggestionContent}>
          <Ionicons
            name={getSuggestionIcon(item.type)}
            size={18}
            color={colors.textSecondary}
            style={styles.suggestionIcon}
          />
          <View style={styles.suggestionTextContainer}>
            <Text style={[styles.suggestionText, { color: colors.text }]}>
              {item.value}
            </Text>
            <Text
              style={[
                styles.suggestionDescription,
                { color: colors.textSecondary },
              ]}
            >
              {item.type} suggestion
            </Text>
          </View>
          {item.count && (
            <Text
              style={[styles.suggestionCount, { color: colors.textSecondary }]}
            >
              {item.count.toLocaleString()}
            </Text>
          )}
        </View>
      </AnimatedPressable>
    ),
    [colors, handleSuggestionPress],
  );

  const renderRecentSearch = useCallback(
    ({ item }: { item: string }) => (
      <AnimatedPressable
        style={styles.suggestionItem}
        onPress={() => executeSearch(item)}
      >
        <View style={styles.suggestionContent}>
          <Ionicons
            name="time-outline"
            size={18}
            color={colors.textSecondary}
            style={styles.suggestionIcon}
          />
          <Text style={[styles.suggestionText, { color: colors.text }]}>
            {item}
          </Text>
        </View>
      </AnimatedPressable>
    ),
    [colors, executeSearch],
  );

  const getSuggestionIcon = (
    type: SearchSuggestion['type'],
  ): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'make':
        return 'car-outline';
      case 'model':
        return 'car-sport-outline';
      case 'feature':
        return 'star-outline';
      case 'price':
        return 'cash-outline';
      case 'location':
        return 'location-outline';
      default:
        return 'search-outline';
    }
  };

  return (
    <View style={[styles.container, style]}>
      {/* Search Bar */}
      <Animated.View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.surface,
            borderColor: state.isActive ? colors.primary : colors.border,
          },
          searchBarAnimatedStyle,
        ]}
      >
        <Ionicons
          name="search"
          size={20}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />

        <TextInput
          ref={inputRef}
          style={[
            styles.searchInput,
            {
              color: colors.text,
              fontSize: 16,
            },
          ]}
          value={state.query}
          onChangeText={(text) =>
            setState((prev) => ({ ...prev, query: text }))
          }
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onSubmitEditing={() => executeSearch(state.query)}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />

        {/* Loading or Clear Button */}
        {state.isLoading ? (
          <LoadingSpinner size="small" />
        ) : state.query.length > 0 ? (
          <TouchableOpacity
            onPress={handleClearSearch}
            style={styles.actionButton}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </Animated.View>

      {/* Suggestions Dropdown */}
      {state.showSuggestions && (
        <Animated.View
          style={[
            styles.suggestionsContainer,
            { backgroundColor: colors.surface },
            suggestionsAnimatedStyle,
          ]}
        >
          {state.suggestions.length > 0 ? (
            <FlatList
              data={state.suggestions}
              renderItem={renderSuggestion}
              keyExtractor={(item, index) =>
                `suggestion-${item.value}-${index}`
              }
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          ) : (
            <FlatList
              data={state.recentSearches}
              renderItem={renderRecentSearch}
              keyExtractor={(item, index) => `recent-${index}`}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListHeaderComponent={
                state.recentSearches.length > 0 ? (
                  <Text
                    style={[
                      styles.sectionHeader,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Recent Searches
                  </Text>
                ) : null
              }
            />
          )}
        </Animated.View>
      )}

      {/* Quick Recommendations */}
      {showRecommendations &&
        state.recommendations.length > 0 &&
        !state.showSuggestions && (
          <View
            style={[
              styles.recommendationsContainer,
              { backgroundColor: colors.surface },
            ]}
          >
            <Text style={[styles.sectionHeader, { color: colors.text }]}>
              Recommended for You
            </Text>
            <FlatList
              data={state.recommendations.slice(0, 2)}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <RecommendationCard
                  recommendation={item}
                  onPress={() => {
                    // Navigate to car details or execute search
                    executeSearch(
                      `${item.car.make} ${item.car.model} ${item.car.year}`,
                    );
                  }}
                />
              )}
              keyExtractor={(item, index) => `rec-${item.car.id}-${index}`}
              contentContainerStyle={styles.recommendationsContent}
            />
          </View>
        )}
    </View>
  );
};

interface RecommendationCardProps {
  recommendation: CarRecommendation;
  onPress: () => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onPress,
}) => {
  const { colors } = useTheme();
  const { car, score, category } = recommendation;

  const getCategoryColor = () => {
    switch (category) {
      case 'perfect_match':
        return colors.success;
      case 'good_fit':
        return colors.primary;
      case 'consider':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <AnimatedPressable
      style={[
        styles.recommendationCard,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
      onPress={onPress}
    >
      <View style={styles.recommendationHeader}>
        <Text style={[styles.carTitle, { color: colors.text }]}>
          {car.make} {car.model}
        </Text>
        <View
          style={[
            styles.scoreIndicator,
            { backgroundColor: getCategoryColor() },
          ]}
        >
          <Text style={styles.scoreText}>{Math.round(score * 100)}%</Text>
        </View>
      </View>

      <Text style={[styles.carDetails, { color: colors.textSecondary }]}>
        {car.year} • ${car.price?.toLocaleString()}
      </Text>

      {recommendation.reasons.length > 0 && (
        <Text
          style={[styles.recommendationReason, { color: colors.textSecondary }]}
        >
          {recommendation.reasons[0].explanation}
        </Text>
      )}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  searchIcon: {
    marginRight: 12,
  },

  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },

  actionButton: {
    padding: 4,
    marginLeft: 8,
  },

  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 8,
    borderRadius: 12,
    elevation: Platform.OS === 'android' ? 4 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    overflow: 'hidden',
    zIndex: 1001,
  },

  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  suggestionIcon: {
    marginRight: 12,
  },

  suggestionTextContainer: {
    flex: 1,
  },

  suggestionText: {
    fontSize: 16,
    fontWeight: '500',
  },

  suggestionDescription: {
    fontSize: 14,
    marginTop: 2,
  },

  suggestionCount: {
    fontSize: 12,
    fontWeight: '500',
  },

  sectionHeader: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },

  recommendationsContainer: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },

  recommendationsContent: {
    paddingHorizontal: 0,
  },

  recommendationCard: {
    width: screenWidth * 0.7,
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
    borderWidth: 1,
  },

  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },

  carTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },

  scoreIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },

  scoreText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  carDetails: {
    fontSize: 14,
    marginBottom: 4,
  },

  recommendationReason: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default SmartSearchBar;
