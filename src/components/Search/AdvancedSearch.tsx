import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, Text, Animated } from 'react-native';
import { Search, X, Filter, Clock } from 'lucide-react-native';
import { useDebounce } from '../../hooks/useDebounce';
import { SearchSuggestion, UseSearchResult } from '../../features/recommendations/types/search';
import Fuse from 'fuse.js';

interface AdvancedSearchProps {
  searchHook: UseSearchResult;
  placeholder?: string;
  showFilters?: boolean;
  onFilterToggle?: () => void;
  recentSearches?: string[];
  className?: string;
}

// Fuzzy search configuration
const fuseOptions = {
  threshold: 0.3,
  keys: ['make', 'model', 'features'],
  includeScore: true,
};

export const AdvancedSearch: React.FC<AdvancedSearchProps> = React.memo(({
  searchHook,
  placeholder = "Search cars, makes, models...",
  showFilters = true,
  onFilterToggle,
  recentSearches = [],
  className = "",
}) => {
  const [focused, setFocused] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchHook.searchState.query);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Debounced search
  const debouncedQuery = useDebounce(localQuery, 300);
  
  useEffect(() => {
    if (debouncedQuery !== searchHook.searchState.query) {
      searchHook.updateQuery(debouncedQuery);
    }
  }, [debouncedQuery, searchHook]);

  // Animation for suggestions dropdown
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: focused && searchHook.searchState.showSuggestions ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [focused, searchHook.searchState.showSuggestions, fadeAnim]);

  const handleFocus = useCallback(() => {
    setFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Delay blur to allow suggestion selection
    setTimeout(() => setFocused(false), 150);
  }, []);

  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion) => {
    setLocalQuery(suggestion.text);
    searchHook.updateQuery(suggestion.text);
    setFocused(false);
    inputRef.current?.blur();
  }, [searchHook]);

  const handleRecentSearchSelect = useCallback((query: string) => {
    setLocalQuery(query);
    searchHook.updateQuery(query);
    setFocused(false);
    inputRef.current?.blur();
  }, [searchHook]);

  const clearSearch = useCallback(() => {
    setLocalQuery('');
    searchHook.updateQuery('');
    inputRef.current?.focus();
  }, [searchHook]);

  const renderSuggestion = useCallback(({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      className="flex-row items-center p-3 border-b border-gray-100"
      onPress={() => handleSuggestionSelect(item)}
    >
      <Search size={16} className="text-gray-400 mr-3" />
      <Text className="flex-1 text-gray-800">{item.text}</Text>
      <Text className="text-xs text-gray-500 capitalize">{item.type}</Text>
    </TouchableOpacity>
  ), [handleSuggestionSelect]);

  const renderRecentSearch = useCallback(({ item }: { item: string }) => (
    <TouchableOpacity
      className="flex-row items-center p-3 border-b border-gray-100"
      onPress={() => handleRecentSearchSelect(item)}
    >
      <Clock size={16} className="text-gray-400 mr-3" />
      <Text className="flex-1 text-gray-600">{item}</Text>
    </TouchableOpacity>
  ), [handleRecentSearchSelect]);

  const showSuggestions = focused && (
    searchHook.searchState.showSuggestions || 
    (localQuery.length === 0 && recentSearches.length > 0)
  );

  return (
    <View className={`relative ${className}`}>
      {/* Search Input */}
      <View className="flex-row items-center bg-white rounded-lg border border-gray-200 shadow-sm">
        <Search size={20} className="text-gray-400 ml-4" />
        
        <TextInput
          ref={inputRef}
          value={localQuery}
          onChangeText={setLocalQuery}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="flex-1 px-3 py-4 text-gray-800"
          placeholderTextColor="#9CA3AF"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />

        {localQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} className="p-2">
            <X size={18} className="text-gray-400" />
          </TouchableOpacity>
        )}

        {showFilters && (
          <TouchableOpacity
            onPress={onFilterToggle}
            className={`p-3 border-l border-gray-200 ${
              searchHook.searchState.appliedFiltersCount > 0 
                ? 'bg-green-50' 
                : 'bg-white'
            }`}
          >
            <View className="relative">
              <Filter 
                size={20} 
                className={
                  searchHook.searchState.appliedFiltersCount > 0 
                    ? 'text-green-600' 
                    : 'text-gray-400'
                } 
              />
              {searchHook.searchState.appliedFiltersCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-green-500 rounded-full w-4 h-4 items-center justify-center">
                  <Text className="text-white text-xs font-bold">
                    {searchHook.searchState.appliedFiltersCount}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <Animated.View
          style={{ opacity: fadeAnim }}
          className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-lg shadow-lg z-50 max-h-64"
        >
          {localQuery.length === 0 && recentSearches.length > 0 ? (
            // Recent searches
            <View>
              <Text className="p-3 text-sm font-medium text-gray-500 border-b border-gray-100">
                Recent Searches
              </Text>
              <FlatList
                data={recentSearches.slice(0, 5)}
                renderItem={renderRecentSearch}
                keyExtractor={(item, index) => `recent-${index}`}
                scrollEnabled={false}
              />
            </View>
          ) : (
            // Search suggestions
            <FlatList
              data={searchHook.searchState.suggestions}
              renderItem={renderSuggestion}
              keyExtractor={(item) => item.id}
              scrollEnabled={true}
              showsVerticalScrollIndicator={false}
            />
          )}
        </Animated.View>
      )}

      {/* Loading indicator */}
      {searchHook.searchState.isLoading && (
        <View className="absolute right-20 top-1/2 transform -translate-y-1/2">
          <View className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </View>
      )}
    </View>
  );
});

AdvancedSearch.displayName = 'AdvancedSearch';
