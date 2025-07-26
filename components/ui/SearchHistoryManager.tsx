import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/Colors';
import { AnimatedBadge } from './AnimatedBadge';
import {
  Clock,
  Search,
  Bookmark,
  X,
  TrendingUp,
} from '@/utils/ultra-optimized-icons';

interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: Date;
  filters?: any;
  resultCount?: number;
}

interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: any;
  alertsEnabled: boolean;
  createdAt: Date;
  lastRun?: Date;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'saved' | 'trending';
  subtitle?: string;
  icon?: React.ReactNode;
}

interface SearchHistoryManagerProps {
  visible: boolean;
  onSearch: (query: string, filters?: any) => void;
  onSaveSearch: (search: SavedSearch) => void;
  onClose: () => void;
  currentQuery?: string;
  currentFilters?: any;
  style?: ViewStyle;
}

const STORAGE_KEYS = {
  SEARCH_HISTORY: '@search_history',
  SAVED_SEARCHES: '@saved_searches',
  POPULAR_SEARCHES: '@popular_searches',
};

export const SearchHistoryManager: React.FC<SearchHistoryManagerProps> = ({
  visible,
  onSearch,
  onSaveSearch,
  onClose,
  currentQuery = '',
  currentFilters = {},
  style,
}) => {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'recent' | 'saved' | 'popular'>(
    'recent',
  );

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (visible) {
      loadData();
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withSpring(0);
    } else {
      opacity.value = withTiming(0, { duration: 150 });
      translateY.value = withTiming(20, { duration: 150 });
    }
  }, [visible]);

  const loadData = async () => {
    try {
      const [historyData, savedData, popularData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.SAVED_SEARCHES),
        AsyncStorage.getItem(STORAGE_KEYS.POPULAR_SEARCHES),
      ]);

      if (historyData) {
        const history = JSON.parse(historyData).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        }));
        setSearchHistory(history.slice(0, 10)); // Keep last 10 searches
      }

      if (savedData) {
        const saved = JSON.parse(savedData).map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          lastRun: item.lastRun ? new Date(item.lastRun) : undefined,
        }));
        setSavedSearches(saved);
      }

      if (popularData) {
        setPopularSearches(JSON.parse(popularData));
      }
    } catch (error) {
      console.error('Error loading search data:', error);
    }
  };

  const saveToHistory = async (
    query: string,
    filters?: any,
    resultCount?: number,
  ) => {
    if (!query.trim()) return;

    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query: query.trim(),
      timestamp: new Date(),
      filters,
      resultCount,
    };

    const updatedHistory = [
      newItem,
      ...searchHistory.filter((item) => item.query !== query.trim()),
    ].slice(0, 10);

    setSearchHistory(updatedHistory);

    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SEARCH_HISTORY,
        JSON.stringify(updatedHistory),
      );
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const createSavedSearch = async () => {
    if (!currentQuery.trim()) {
      Alert.alert('Error', 'Please enter a search query first');
      return;
    }

    Alert.prompt(
      'Save Search',
      'Give your search a name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (name) => {
            if (!name?.trim()) return;

            const newSavedSearch: SavedSearch = {
              id: Date.now().toString(),
              name: name.trim(),
              query: currentQuery,
              filters: currentFilters,
              alertsEnabled: true,
              createdAt: new Date(),
            };

            const updatedSaved = [...savedSearches, newSavedSearch];
            setSavedSearches(updatedSaved);

            try {
              await AsyncStorage.setItem(
                STORAGE_KEYS.SAVED_SEARCHES,
                JSON.stringify(updatedSaved),
              );
              onSaveSearch(newSavedSearch);
              Alert.alert('Success', 'Search saved successfully!');
            } catch (error) {
              console.error('Error saving search:', error);
              Alert.alert('Error', 'Failed to save search');
            }
          },
        },
      ],
      'plain-text',
      currentQuery,
    );
  };

  const deleteSavedSearch = async (id: string) => {
    const updatedSaved = savedSearches.filter((search) => search.id !== id);
    setSavedSearches(updatedSaved);

    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SAVED_SEARCHES,
        JSON.stringify(updatedSaved),
      );
    } catch (error) {
      console.error('Error deleting saved search:', error);
    }
  };

  const clearHistory = async () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all search history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setSearchHistory([]);
            try {
              await AsyncStorage.removeItem(STORAGE_KEYS.SEARCH_HISTORY);
            } catch (error) {
              console.error('Error clearing history:', error);
            }
          },
        },
      ],
    );
  };

  const handleSearchSelect = (query: string, filters?: any) => {
    saveToHistory(query, filters);
    onSearch(query, filters);
    onClose();
  };

  const renderRecentSearches = () => (
    <FlatList
      data={searchHistory}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <TouchableOpacity
          style={styles.searchItem}
          onPress={() => handleSearchSelect(item.query, item.filters)}
        >
          <Clock size={16} color={Colors.light.textMuted} />
          <View style={styles.searchContent}>
            <Text style={styles.searchQuery}>{item.query}</Text>
            <Text style={styles.searchTime}>
              {item.timestamp.toLocaleDateString()}
              {item.resultCount && ` • ${item.resultCount} results`}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              const updated = searchHistory.filter((h) => h.id !== item.id);
              setSearchHistory(updated);
            }}
            style={styles.removeButton}
          >
            <X size={14} color={Colors.light.textMuted} />
          </TouchableOpacity>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Search size={24} color={Colors.light.textMuted} />
          <Text style={styles.emptyText}>No recent searches</Text>
        </View>
      }
      ListHeaderComponent={
        searchHistory.length > 0 ? (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Searches</Text>
            <TouchableOpacity onPress={clearHistory}>
              <Text style={styles.clearButton}>Clear All</Text>
            </TouchableOpacity>
          </View>
        ) : null
      }
    />
  );

  const renderSavedSearches = () => (
    <FlatList
      data={savedSearches}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <TouchableOpacity
          style={styles.searchItem}
          onPress={() => handleSearchSelect(item.query, item.filters)}
        >
          <Bookmark size={16} color={Colors.light.primary} />
          <View style={styles.searchContent}>
            <Text style={styles.searchQuery}>{item.name}</Text>
            <Text style={styles.searchTime}>
              {item.query}
              {item.alertsEnabled && ' • Alerts ON'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => deleteSavedSearch(item.id)}
            style={styles.removeButton}
          >
            <X size={14} color={Colors.light.textMuted} />
          </TouchableOpacity>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Bookmark size={24} color={Colors.light.textMuted} />
          <Text style={styles.emptyText}>No saved searches</Text>
          <Text style={styles.emptySubtext}>
            Save searches to get alerts for new matches
          </Text>
        </View>
      }
      ListHeaderComponent={
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Saved Searches</Text>
          {currentQuery && (
            <TouchableOpacity onPress={createSavedSearch}>
              <Text style={styles.saveButton}>Save Current</Text>
            </TouchableOpacity>
          )}
        </View>
      }
    />
  );

  const renderPopularSearches = () => (
    <FlatList
      data={popularSearches}
      keyExtractor={(item, index) => index.toString()}
      renderItem={({ item, index }) => (
        <TouchableOpacity
          style={styles.searchItem}
          onPress={() => handleSearchSelect(item)}
        >
          <TrendingUp size={16} color={Colors.light.info} />
          <View style={styles.searchContent}>
            <Text style={styles.searchQuery}>{item}</Text>
            <Text style={styles.searchTime}>Popular search</Text>
          </View>
        </TouchableOpacity>
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <TrendingUp size={24} color={Colors.light.textMuted} />
          <Text style={styles.emptyText}>No trending searches yet</Text>
        </View>
      }
      ListHeaderComponent={
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Popular Searches</Text>
        </View>
      }
    />
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      <View style={styles.tabContainer}>
        {(['recent', 'saved', 'popular'] as const).map((tab) => (
          <AnimatedBadge
            key={tab}
            active={activeTab === tab}
            variant="outline"
            onPress={() => setActiveTab(tab)}
            style={styles.tab}
          >
            {tab === 'recent' && 'Recent'}
            {tab === 'saved' && 'Saved'}
            {tab === 'popular' && 'Popular'}
          </AnimatedBadge>
        ))}
      </View>

      <View style={styles.content}>
        {activeTab === 'recent' && renderRecentSearches()}
        {activeTab === 'saved' && renderSavedSearches()}
        {activeTab === 'popular' && renderPopularSearches()}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
    elevation: 4,
    shadowColor: Colors.light.neutral900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    maxHeight: 400,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: Spacing.sm,
    gap: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  tab: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Colors.light.text,
  },
  clearButton: {
    ...Typography.caption,
    color: Colors.light.error,
    fontWeight: '600',
  },
  saveButton: {
    ...Typography.caption,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchContent: {
    flex: 1,
  },
  searchQuery: {
    ...Typography.body,
    color: Colors.light.text,
    fontWeight: '500',
  },
  searchTime: {
    ...Typography.caption,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  removeButton: {
    padding: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.light.textMuted,
    fontWeight: '500',
  },
  emptySubtext: {
    ...Typography.caption,
    color: Colors.light.textMuted,
    textAlign: 'center',
  },
});

// Hook for managing search history
export const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

  const addToHistory = async (
    query: string,
    filters?: any,
    resultCount?: number,
  ) => {
    if (!query.trim()) return;

    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      query: query.trim(),
      timestamp: new Date(),
      filters,
      resultCount,
    };

    const updatedHistory = [
      newItem,
      ...searchHistory.filter((item) => item.query !== query.trim()),
    ].slice(0, 10);

    setSearchHistory(updatedHistory);

    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SEARCH_HISTORY,
        JSON.stringify(updatedHistory),
      );
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const getSuggestions = (): SearchSuggestion[] => {
    const suggestions: SearchSuggestion[] = [];

    // Add recent searches
    searchHistory.slice(0, 5).forEach((item) => {
      suggestions.push({
        id: `recent-${item.id}`,
        text: item.query,
        type: 'recent',
        subtitle: `${item.timestamp.toLocaleDateString()}`,
        icon: <Clock size={16} color={Colors.light.textMuted} />,
      });
    });

    // Add saved searches
    savedSearches.slice(0, 3).forEach((item) => {
      suggestions.push({
        id: `saved-${item.id}`,
        text: item.name,
        type: 'saved',
        subtitle: item.query,
        icon: <Bookmark size={16} color={Colors.light.primary} />,
      });
    });

    return suggestions;
  };

  return {
    searchHistory,
    savedSearches,
    addToHistory,
    getSuggestions,
  };
};
