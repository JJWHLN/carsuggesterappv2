import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useDebounce } from '../../hooks/useDebounce';
import { usePerformanceMonitor } from '../../src/utils/performance';

interface DebouncedSearchProps {
  onSearch: (query: string) => void | Promise<void>;
  placeholder?: string;
  debounceMs?: number;
  minCharacters?: number;
  autoFocus?: boolean;
  showSuggestions?: boolean;
  suggestions?: string[];
  onSuggestionPress?: (suggestion: string) => void;
  loading?: boolean;
  style?: any;
  inputStyle?: any;
  error?: string;
  maxLength?: number;
  clearButtonMode?: 'never' | 'while-editing' | 'unless-editing' | 'always';
}

export const DebouncedSearch: React.FC<DebouncedSearchProps> = React.memo(({
  onSearch,
  placeholder = "Search...",
  debounceMs = 300,
  minCharacters = 2,
  autoFocus = false,
  showSuggestions = false,
  suggestions = [],
  onSuggestionPress,
  loading = false,
  style,
  inputStyle,
  error,
  maxLength = 100,
  clearButtonMode = 'while-editing'
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [searchCount, setSearchCount] = useState(0);
  
  const { trackMetric } = usePerformanceMonitor();
  const inputRef = useRef<TextInput>(null);
  const searchStartTime = useRef<number>();

  // Debounce the search query
  const debouncedQuery = useDebounce(query, debounceMs);

  // Track search performance
  const trackSearchPerformance = useCallback((searchTime: number, queryLength: number) => {
    trackMetric(
      'search-performance',
      searchTime,
      { good: 100, needsImprovement: 300 },
      { 
        queryLength,
        searchCount: searchCount + 1,
        debounceMs 
      }
    );
  }, [trackMetric, searchCount, debounceMs]);

  // Handle search execution
  useEffect(() => {
    if (debouncedQuery.length >= minCharacters) {
      const executeSearch = async () => {
        searchStartTime.current = Date.now();
        setSearchCount(prev => prev + 1);
        
        try {
          await onSearch(debouncedQuery);
          
          if (searchStartTime.current) {
            const searchTime = Date.now() - searchStartTime.current;
            trackSearchPerformance(searchTime, debouncedQuery.length);
          }
        } catch (error) {
          console.error('Search error:', error);
          trackMetric(
            'search-error',
            1,
            { good: 0, needsImprovement: 0.05 },
            { query: debouncedQuery, error: error instanceof Error ? error.message : 'Unknown' }
          );
        }
      };

      executeSearch();
    } else if (debouncedQuery.length === 0) {
      // Clear search results when query is empty
      onSearch('');
    }
  }, [debouncedQuery, minCharacters, onSearch, trackSearchPerformance, trackMetric]);

  // Memoized filtered suggestions
  const filteredSuggestions = useMemo(() => {
    if (!showSuggestions || !query || query.length < minCharacters) {
      return [];
    }
    
    return suggestions
      .filter(suggestion => 
        suggestion.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5); // Limit to 5 suggestions for performance
  }, [suggestions, query, showSuggestions, minCharacters]);

  // Handlers
  const handleChangeText = useCallback((text: string) => {
    setQuery(text);
  }, []);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Delay blur to allow suggestion selection
    setTimeout(() => setIsFocused(false), 150);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  const handleSuggestionPress = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setIsFocused(false);
    onSuggestionPress?.(suggestion);
  }, [onSuggestionPress]);

  const showClearButton = useMemo(() => {
    switch (clearButtonMode) {
      case 'always':
        return query.length > 0;
      case 'while-editing':
        return isFocused && query.length > 0;
      case 'unless-editing':
        return !isFocused && query.length > 0;
      case 'never':
      default:
        return false;
    }
  }, [clearButtonMode, isFocused, query]);

  const showSuggestionList = showSuggestions && isFocused && filteredSuggestions.length > 0;

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.inputContainer, isFocused && styles.inputFocused, error && styles.inputError]}>
        <TextInput
          ref={inputRef}
          style={[styles.input, inputStyle]}
          value={query}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          autoFocus={autoFocus}
          maxLength={maxLength}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="never" // We handle this manually
        />
        
        {loading && (
          <ActivityIndicator
            size="small"
            color="#6b7280"
            style={styles.loadingIndicator}
          />
        )}
        
        {showClearButton && !loading && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {showSuggestionList && (
        <View style={styles.suggestionsContainer}>
          {filteredSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={`suggestion-${index}`}
              style={styles.suggestionItem}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
});

DebouncedSearch.displayName = 'DebouncedSearch';

// Hook for managing search state
export function useOptimizedSearch<T>() {
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  
  const { trackMetric } = usePerformanceMonitor();
  const searchCache = useRef(new Map<string, T[]>());

  const search = useCallback(async (searchQuery: string, searchFn: (query: string) => Promise<T[]>) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    // Check cache first
    const cached = searchCache.current.get(searchQuery);
    if (cached) {
      setResults(cached);
      trackMetric(
        'search-cache-hit',
        1,
        { good: 1, needsImprovement: 0.8 },
        { query: searchQuery }
      );
      return;
    }

    setLoading(true);
    setError(null);
    setQuery(searchQuery);

    const startTime = Date.now();

    try {
      const searchResults = await searchFn(searchQuery);
      
      // Cache results
      searchCache.current.set(searchQuery, searchResults);
      
      // Limit cache size
      if (searchCache.current.size > 50) {
        const firstKey = searchCache.current.keys().next().value;
        if (firstKey) {
          searchCache.current.delete(firstKey);
        }
      }

      setResults(searchResults);
      
      const searchTime = Date.now() - startTime;
      trackMetric(
        'search-api-call',
        searchTime,
        { good: 500, needsImprovement: 1000 },
        { 
          query: searchQuery,
          resultCount: searchResults.length,
          cached: false
        }
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      trackMetric(
        'search-api-error',
        1,
        { good: 0, needsImprovement: 0.05 },
        { query: searchQuery, error: errorMessage }
      );
    } finally {
      setLoading(false);
    }
  }, [trackMetric]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
    setQuery('');
  }, []);

  const clearCache = useCallback(() => {
    searchCache.current.clear();
  }, []);

  return {
    results,
    loading,
    error,
    query,
    search,
    clearResults,
    clearCache
  };
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
  },
  inputFocused: {
    borderColor: '#3b82f6',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    color: '#1f2937',
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#6b7280',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderTopWidth: 0,
    maxHeight: 200,
    zIndex: 1000,
  },
  suggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  suggestionText: {
    fontSize: 16,
    color: '#374151',
  },
});

export default DebouncedSearch;
