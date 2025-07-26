import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Search,
  Sparkles,
  Filter,
  Clock,
  Star,
  TrendingUp,
} from '@/utils/ultra-optimized-icons';

import { UnifiedSearchComponent as SearchBar } from '@/components/ui/unified';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { UnifiedCarCard as CarCard } from '@/components/ui/unified';
import { Button } from '@/components/ui/Button';

import { useThemeColors } from '@/hooks/useTheme';
import { useDebounce } from '@/hooks/useDebounce';
import { useAuth } from '@/contexts/AuthContext';
import { aiSearchService, AISearchResult } from '@/services/aiSearchService';
import { openaiService } from '@/lib/openai';
import { logger } from '@/utils/logger';

const { width } = Dimensions.get('window');

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'ai_generated';
  icon?: string;
}

export default function AISearchScreen() {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const styles = useMemo(() => getThemedStyles(colors), [colors]);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<AISearchResult | null>(null);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search query for suggestions
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [user]);

  // Load suggestions when query changes
  useEffect(() => {
    if (debouncedQuery.length > 2) {
      loadSuggestions(debouncedQuery);
    } else {
      setSuggestions([]);
    }
  }, [debouncedQuery]);

  const loadInitialData = async () => {
    try {
      // Load search history if user is logged in
      if (user) {
        const history = await aiSearchService.getSearchHistory(user.id, 5);
        setSearchHistory(history);
      }

      // Load popular searches
      const popular = await aiSearchService.getPopularSearches(5);
      const popularSuggestions: SearchSuggestion[] = popular.map(
        (query, index) => ({
          id: `popular-${index}`,
          text: query,
          type: 'popular' as const,
          icon: 'trending-up',
        }),
      );

      setSuggestions(popularSuggestions);
    } catch (error) {
      logger.error('Failed to load initial data:', error);
    }
  };

  const loadSuggestions = async (query: string) => {
    try {
      const aiSuggestions =
        await openaiService.generateSearchSuggestions(query);

      const suggestions: SearchSuggestion[] = [
        // Recent searches
        ...searchHistory
          .filter((h) => h.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 2)
          .map((text, index) => ({
            id: `recent-${index}`,
            text,
            type: 'recent' as const,
            icon: 'history',
          })),
        // AI generated suggestions
        ...aiSuggestions.slice(0, 3).map((text: string, index: number) => ({
          id: `ai-${index}`,
          text,
          type: 'ai_generated' as const,
          icon: 'sparkles',
        })),
      ];

      setSuggestions(suggestions);
    } catch (error) {
      logger.error('Failed to load suggestions:', error);
    }
  };

  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) return;

      setLoading(true);
      setError(null);
      setShowSuggestions(false);
      Keyboard.dismiss();

      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const result = await aiSearchService.search(
          query,
          user?.id,
          undefined, // sessionId could be added
          0, // page
          20, // limit
        );

        setSearchResult(result);

        // Update search history
        if (user && !searchHistory.includes(query)) {
          const newHistory = [query, ...searchHistory.slice(0, 4)];
          setSearchHistory(newHistory);
        }
      } catch (error) {
        logger.error('Search failed:', error);
        setError('Search failed. Please try again.');

        Alert.alert(
          'Search Error',
          'There was a problem with your search. Please try again.',
          [{ text: 'OK' }],
        );
      } finally {
        setLoading(false);
      }
    },
    [user, searchHistory],
  );

  const handleSuggestionPress = useCallback(
    (suggestion: SearchSuggestion) => {
      setSearchQuery(suggestion.text);
      handleSearch(suggestion.text);
    },
    [handleSearch],
  );

  const handleCarPress = useCallback(
    async (carId: string) => {
      if (searchResult) {
        await aiSearchService.trackSearchClick(
          searchResult.query,
          carId,
          user?.id,
          undefined,
        );
      }

      router.push(`/car/${carId}`);
    },
    [searchResult, user],
  );

  const handleSaveSearch = useCallback(async () => {
    if (!user || !searchResult) {
      Alert.alert('Sign In Required', 'Please sign in to save searches.', [
        { text: 'OK' },
      ]);
      return;
    }

    Alert.prompt(
      'Save Search',
      'Enter a name for this saved search:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (searchName) => {
            if (searchName?.trim()) {
              try {
                await aiSearchService.saveSearch(
                  user.id,
                  searchName.trim(),
                  searchResult.query,
                  searchResult.filters,
                );

                Alert.alert('Success', 'Search saved successfully!');
              } catch (error) {
                Alert.alert(
                  'Error',
                  'Failed to save search. Please try again.',
                );
              }
            }
          },
        },
      ],
      'plain-text',
      searchResult.query,
    );
  }, [user, searchResult]);

  const renderSearchSuggestion = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionContent}>
        <View style={styles.suggestionIcon}>
          {item.type === 'recent' && (
            <Clock size={16} color={colors.textSecondary} />
          )}
          {item.type === 'popular' && (
            <TrendingUp size={16} color={colors.textSecondary} />
          )}
          {item.type === 'ai_generated' && (
            <Sparkles size={16} color={colors.primary} />
          )}
        </View>
        <Text style={styles.suggestionText}>{item.text}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderCarItem = ({ item }: { item: any }) => (
    <CarCard car={item} onPress={() => handleCarPress(item.id)} />
  );

  const renderEmptySearch = () => (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.emptyContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.emptySearchContent}>
        <View style={styles.searchIcon}>
          <Search size={48} color={colors.textSecondary} />
        </View>

        <Text style={styles.emptyTitle}>AI-Powered Car Search</Text>
        <Text style={styles.emptySubtitle}>
          Tell us what you're looking for in natural language
        </Text>

        <View style={styles.exampleQueries}>
          <Text style={styles.exampleTitle}>Try asking:</Text>
          {[
            '• "Reliable SUV under $30k"',
            '• "Best electric cars for families"',
            '• "Fuel efficient sedans from 2020-2023"',
            '• "Luxury cars in Los Angeles"',
          ].map((example, index) => (
            <TouchableOpacity
              key={index}
              style={styles.exampleItem}
              onPress={() => {
                const query = example.replace('• "', '').replace('"', '');
                setSearchQuery(query);
                handleSearch(query);
              }}
            >
              <Text style={styles.exampleText}>{example}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Popular Searches</Text>
            {suggestions.slice(0, 5).map((suggestion) => (
              <TouchableOpacity
                key={suggestion.id}
                style={styles.suggestionChip}
                onPress={() => handleSuggestionPress(suggestion)}
              >
                <Text style={styles.suggestionChipText}>{suggestion.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={() => handleSearch(searchQuery)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder="Search for cars with AI..."
          accessibilityLabel="AI car search"
          accessibilityHint="Enter your car search query"
          testID="ai-search-input"
        />

        {searchResult && (
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveSearch}
            accessibilityLabel="Save search"
          >
            <Star size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={styles.loadingText}>AI is analyzing your search...</Text>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <ErrorState
          title="Search Error"
          message={error}
          onRetry={() => handleSearch(searchQuery)}
        />
      )}

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && !loading && (
        <View style={styles.suggestionsOverlay}>
          <FlatList
            data={suggestions}
            renderItem={renderSearchSuggestion}
            keyExtractor={(item) => item.id}
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      {/* Search Results */}
      {searchResult && !loading && !showSuggestions && (
        <View style={styles.resultsContainer}>
          {/* AI Explanation */}
          <View style={styles.aiExplanation}>
            <View style={styles.aiExplanationHeader}>
              <Sparkles size={16} color={colors.primary} />
              <Text style={styles.aiExplanationTitle}>AI Analysis</Text>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>
                  {Math.round(searchResult.confidence * 100)}%
                </Text>
              </View>
            </View>
            <Text style={styles.aiExplanationText}>
              {searchResult.explanation}
            </Text>
            {searchResult.intent && (
              <Text style={styles.intentText}>
                Intent:{' '}
                {searchResult.intent.intent.charAt(0).toUpperCase() +
                  searchResult.intent.intent.slice(1)}
                {searchResult.intent.budget_max &&
                  ` • Budget: $${searchResult.intent.budget_max.toLocaleString()}`}
                {searchResult.intent.brand &&
                  ` • Brand: ${searchResult.intent.brand}`}
              </Text>
            )}
          </View>

          {/* Results List */}
          <FlatList
            data={searchResult.results}
            renderItem={renderCarItem}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.resultsGrid}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <EmptyState
                title="No Cars Found"
                subtitle="Try adjusting your search criteria or use different keywords."
                action={
                  <Button
                    title="Browse All Cars"
                    onPress={() => router.push('/marketplace')}
                  />
                }
              />
            }
          />
        </View>
      )}

      {/* Empty State */}
      {!searchResult && !loading && !showSuggestions && renderEmptySearch()}
    </SafeAreaView>
  );
}

const getThemedStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    searchHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchBar: {
      flex: 1,
    },
    saveButton: {
      marginLeft: 12,
      padding: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    suggestionsOverlay: {
      position: 'absolute',
      top: 85,
      left: 16,
      right: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: 300,
      zIndex: 1000,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    suggestionsList: {
      maxHeight: 300,
    },
    suggestionItem: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    suggestionContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    suggestionIcon: {
      marginRight: 12,
    },
    suggestionText: {
      fontSize: 16,
      color: colors.text,
    },
    resultsContainer: {
      flex: 1,
    },
    aiExplanation: {
      margin: 16,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary + '20',
    },
    aiExplanationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    aiExplanationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.primary,
      marginLeft: 8,
      flex: 1,
    },
    confidenceBadge: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    confidenceText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    aiExplanationText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 8,
    },
    intentText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    resultsGrid: {
      paddingHorizontal: 16,
      paddingBottom: 20,
    },
    carCard: {
      flex: 1,
      marginHorizontal: 4,
      marginVertical: 8,
    },
    emptyContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
    emptySearchContent: {
      alignItems: 'center',
    },
    searchIcon: {
      marginBottom: 24,
    },
    emptyTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    emptySubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 24,
    },
    exampleQueries: {
      width: '100%',
      marginBottom: 32,
    },
    exampleTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    exampleItem: {
      paddingVertical: 8,
    },
    exampleText: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 24,
    },
    suggestionsContainer: {
      width: '100%',
    },
    suggestionsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    suggestionChip: {
      backgroundColor: colors.primary + '10',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 24,
      marginBottom: 8,
      alignSelf: 'flex-start',
    },
    suggestionChipText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
  });
