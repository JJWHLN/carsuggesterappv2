import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList, 
  Modal, 
  Pressable,
  ActivityIndicator,
  ScrollView,
  ViewStyle,
  TextStyle,
  TextInputProps
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS
} from 'react-native-reanimated';
import { Search, X, Sparkles, Filter, Star, Clock, TrendingUp } from '@/utils/ultra-optimized-icons';
import { AnimatedPressable } from './AnimatedPressable';
import { createSemanticProps, useAccessibility } from '@/hooks/useAccessibility';
import { useDebounce } from '@/hooks/useDebounce';
import { usePerformanceMonitor } from '../../src/utils/performance';
import { currentColors, BorderRadius, Spacing, Typography, Shadows as ColorsShadows } from '@/constants/Colors';

// Types
interface SearchSuggestion {
  id: string;
  text: string;
  type: 'brand' | 'model' | 'category' | 'recent' | 'popular';
  icon?: string;
  subtitle?: string;
  popularity?: number;
}

interface SearchFilter {
  id: string;
  label: string;
  value: string;
  active: boolean;
}

type SearchMode = 'basic' | 'advanced' | 'debounced' | 'premium';

interface UnifiedSearchProps extends Omit<TextInputProps, 'style'> {
  // Basic props
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onSubmit?: () => void;
  onSearch?: (query: string) => void | Promise<void>;
  
  // Mode configuration
  mode?: SearchMode;
  
  // Debounced search props
  debounceMs?: number;
  minCharacters?: number;
  
  // Advanced features
  showAIIcon?: boolean;
  showFilterButton?: boolean;
  showQuickFilters?: boolean;
  loading?: boolean;
  suggestions?: SearchSuggestion[];
  filters?: SearchFilter[];
  onSuggestionPress?: (suggestion: SearchSuggestion) => void;
  onFilterPress?: (filter: SearchFilter) => void;
  onFiltersChange?: (filters: SearchFilter[]) => void;
  
  // Styling
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  
  // Accessibility
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  
  // Error handling
  error?: string;
  maxLength?: number;
  clearButtonMode?: 'never' | 'while-editing' | 'unless-editing' | 'always';
  
  // Performance
  autoFocus?: boolean;
  showSuggestions?: boolean;
  onSuggestionPressAlt?: (suggestion: string) => void;
}

export const UnifiedSearchComponent: React.FC<UnifiedSearchProps> = React.memo(({
  // Basic props
  value,
  onChangeText,
  placeholder = "Search cars, brands, models...",
  onClear,
  onSubmit,
  onSearch,
  
  // Mode configuration
  mode = 'basic',
  
  // Debounced search props
  debounceMs = 300,
  minCharacters = 2,
  
  // Advanced features
  showAIIcon = false,
  showFilterButton = true,
  showQuickFilters = true,
  loading = false,
  suggestions = [],
  filters = [],
  onSuggestionPress,
  onFilterPress,
  onFiltersChange,
  
  // Styling
  containerStyle,
  inputStyle,
  
  // Accessibility
  accessibilityLabel = "Search input",
  accessibilityHint = "Type to search for cars",
  testID = "unified-search",
  
  // Error handling
  error,
  maxLength = 100,
  clearButtonMode = 'while-editing',
  
  // Performance
  autoFocus = false,
  showSuggestions = false,
  onSuggestionPressAlt,
  
  ...textInputProps
}) => {
  // State
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [searchCount, setSearchCount] = useState(0);
  const [localFilters, setLocalFilters] = useState(filters);
  
  // Refs
  const inputRef = useRef<TextInput>(null);
  const searchStartTime = useRef<number>();
  
  // Hooks
  const { trackMetric } = usePerformanceMonitor();
  const debouncedValue = useDebounce(value, debounceMs);
  
  // Animations
  const focusScale = useSharedValue(0);
  const suggestionOpacity = useSharedValue(0);
  
  // Performance tracking for debounced search
  useEffect(() => {
    if (mode === 'debounced' && debouncedValue && debouncedValue.length >= minCharacters) {
      const startTime = Date.now();
      searchStartTime.current = startTime;
      
      const performSearch = async () => {
        try {
          if (onSearch) {
            await onSearch(debouncedValue);
            const duration = Date.now() - startTime;
            trackMetric('search_performance', duration, {
              good: 300,
              needsImprovement: 800
            }, { 
              query_length: debouncedValue.length,
              search_count: searchCount 
            });
            setSearchCount(prev => prev + 1);
          }
        } catch (error) {
          console.error('Search error:', error);
          trackMetric('search_error', 1, undefined, { 
            error: error instanceof Error ? error.message : 'Unknown error', 
            query: debouncedValue 
          });
        }
      };
      
      performSearch();
    }
  }, [debouncedValue, mode, minCharacters, onSearch, trackMetric, searchCount]);

  // Animated styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 + focusScale.value * 0.02) }],
  }));

  const suggestionModalStyle = useAnimatedStyle(() => ({
    opacity: suggestionOpacity.value,
  }));

  // Handlers
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    focusScale.value = withSpring(1);
    if (suggestions.length > 0 || showSuggestions) {
      suggestionOpacity.value = withTiming(1);
      setShowSuggestionModal(true);
    }
  }, [focusScale, suggestionOpacity, suggestions.length, showSuggestions]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    focusScale.value = withSpring(0);
    // Delay hiding suggestions to allow for selection
    setTimeout(() => {
      suggestionOpacity.value = withTiming(0);
      runOnJS(setShowSuggestionModal)(false);
    }, 150);
  }, [focusScale, suggestionOpacity]);

  const handleClear = useCallback(() => {
    onChangeText('');
    setSearchCount(0);
    if (onClear) onClear();
    trackMetric('search_cleared', value.length, undefined, { previous_length: value.length });
  }, [onChangeText, onClear, value.length, trackMetric]);

  const handleSubmit = useCallback(() => {
    if (onSubmit) onSubmit();
    if (onSearch && mode !== 'debounced') onSearch(value);
    inputRef.current?.blur();
    trackMetric('search_submitted', value.length, undefined, { query_length: value.length });
  }, [onSubmit, onSearch, mode, value, trackMetric]);

  const handleSuggestionSelect = useCallback((suggestion: SearchSuggestion | string) => {
    if (typeof suggestion === 'string') {
      onChangeText(suggestion);
      if (onSuggestionPressAlt) onSuggestionPressAlt(suggestion);
    } else {
      onChangeText(suggestion.text);
      if (onSuggestionPress) onSuggestionPress(suggestion);
    }
    setShowSuggestionModal(false);
    trackMetric('suggestion_selected', 1, undefined, { 
      type: typeof suggestion === 'string' ? 'simple' : suggestion.type 
    });
  }, [onChangeText, onSuggestionPress, onSuggestionPressAlt, trackMetric]);

  const handleFilterToggle = useCallback((filter: SearchFilter) => {
    const updatedFilters = localFilters.map(f => 
      f.id === filter.id ? { ...f, active: !f.active } : f
    );
    setLocalFilters(updatedFilters);
    if (onFiltersChange) onFiltersChange(updatedFilters);
    if (onFilterPress) onFilterPress({ ...filter, active: !filter.active });
    trackMetric('filter_toggled', 1, undefined, { 
      filter_id: filter.id, 
      active: !filter.active 
    });
  }, [localFilters, onFiltersChange, onFilterPress, trackMetric]);

  // Memoized components
  const SearchIcon = useMemo(() => (
    showAIIcon ? (
      <Sparkles size={20} color={currentColors.textSecondary} />
    ) : (
      <Search size={20} color={currentColors.textSecondary} />
    )
  ), [showAIIcon]);

  const ClearButton = useMemo(() => {
    const shouldShow = (
      value.length > 0 && 
      (clearButtonMode === 'always' || 
       (clearButtonMode === 'while-editing' && isFocused) ||
       (clearButtonMode === 'unless-editing' && !isFocused))
    );

    if (!shouldShow) return null;

    return (
      <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
        <X size={16} color={currentColors.textSecondary} />
      </TouchableOpacity>
    );
  }, [value.length, clearButtonMode, isFocused, handleClear]);

  const FilterSection = useMemo(() => {
    if (!showQuickFilters || localFilters.length === 0) return null;

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterContainer}
      >
        {localFilters.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterChip,
              filter.active && styles.filterChipActive
            ]}
            onPress={() => handleFilterToggle(filter)}
          >
            <Text style={[
              styles.filterText,
              filter.active && styles.filterTextActive
            ]}>
              {filter.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  }, [showQuickFilters, localFilters, handleFilterToggle]);

  const SuggestionModal = useMemo(() => {
    if (!showSuggestionModal || (!suggestions.length && !showSuggestions)) return null;

    return (
      <Modal
        visible={showSuggestionModal}
        transparent
        animationType="none"
        onRequestClose={() => setShowSuggestionModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowSuggestionModal(false)}
        >
          <Animated.View style={[styles.suggestionContainer, suggestionModalStyle]}>
            <FlatList
              data={suggestions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionSelect(item)}
                >
                  <View style={styles.suggestionContent}>
                    {item.type === 'recent' && <Clock size={16} color={currentColors.textSecondary} />}
                    {item.type === 'popular' && <TrendingUp size={16} color={currentColors.primary} />}
                    {item.type === 'brand' && <Star size={16} color={currentColors.primary} />}
                    <Text style={styles.suggestionText}>{item.text}</Text>
                  </View>
                  {item.subtitle && (
                    <Text style={styles.suggestionSubtitle}>{item.subtitle}</Text>
                  )}
                </TouchableOpacity>
              )}
              style={styles.suggestionList}
              showsVerticalScrollIndicator={false}
            />
          </Animated.View>
        </Pressable>
      </Modal>
    );
  }, [showSuggestionModal, suggestions, showSuggestions, suggestionModalStyle, handleSuggestionSelect]);

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.View style={[styles.searchContainer, containerAnimatedStyle]}>
        <View style={styles.inputContainer}>
          {SearchIcon}
          <TextInput
            ref={inputRef}
            style={[styles.input, inputStyle]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={currentColors.textSecondary}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={handleSubmit}
            returnKeyType="search"
            autoFocus={autoFocus}
            maxLength={maxLength}
            accessibilityLabel={accessibilityLabel}
            accessibilityHint={accessibilityHint}
            testID={testID}
            {...textInputProps}
          />
          {loading && (
            <ActivityIndicator 
              size="small" 
              color={currentColors.primary} 
              style={styles.loadingIndicator}
            />
          )}
          {ClearButton}
          {showFilterButton && (
            <TouchableOpacity style={styles.filterButton}>
              <Filter size={20} color={currentColors.primary} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      
      {FilterSection}
      {SuggestionModal}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  searchContainer: {
    backgroundColor: currentColors.surfaceSecondary,
    borderRadius: BorderRadius.lg,
    ...ColorsShadows.sm,
    borderWidth: 1,
    borderColor: currentColors.border,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  input: {
    flex: 1,
    marginLeft: Spacing.sm,
    fontSize: Typography.body.fontSize,
    color: currentColors.text,
  },
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  filterButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  loadingIndicator: {
    marginLeft: Spacing.sm,
  },
  errorText: {
    color: currentColors.error,
    fontSize: Typography.caption.fontSize,
    marginTop: Spacing.xs,
    marginLeft: Spacing.md,
  },
  filterScrollView: {
    marginTop: Spacing.sm,
  },
  filterContainer: {
    paddingHorizontal: Spacing.md,
  },
  filterChip: {
    backgroundColor: currentColors.surfaceSecondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: currentColors.border,
  },
  filterChipActive: {
    backgroundColor: currentColors.primary,
    borderColor: currentColors.primary,
  },
  filterText: {
    fontSize: Typography.caption.fontSize,
    color: currentColors.textSecondary,
  },
  filterTextActive: {
    color: currentColors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    paddingTop: 100,
  },
  suggestionContainer: {
    backgroundColor: currentColors.surface,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...ColorsShadows.lg,
    maxHeight: 300,
  },
  suggestionList: {
    padding: Spacing.sm,
  },
  suggestionItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: currentColors.border,
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionText: {
    fontSize: Typography.body.fontSize,
    color: currentColors.text,
    marginLeft: Spacing.sm,
  },
  suggestionSubtitle: {
    fontSize: Typography.caption.fontSize,
    color: currentColors.textSecondary,
    marginTop: Spacing.xs,
    marginLeft: 24,
  },
});

// Export hook for optimized search functionality
export const useOptimizedSearch = (
  onSearch: (query: string) => void | Promise<void>,
  debounceMs: number = 300
) => {
  const [query, setQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const { trackMetric } = usePerformanceMonitor();
  
  const debouncedQuery = useDebounce(query, debounceMs);
  
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2) {
      const startTime = Date.now();
      const performSearch = async () => {
        try {
          await onSearch(debouncedQuery);
          const duration = Date.now() - startTime;
          trackMetric('optimized_search', duration, {
            good: 300,
            needsImprovement: 800
          }, { query_length: debouncedQuery.length });
          
          // Update search history
          setSearchHistory(prev => {
            const updated = [debouncedQuery, ...prev.filter(item => item !== debouncedQuery)];
            return updated.slice(0, 10); // Keep last 10 searches
          });
        } catch (error) {
          trackMetric('search_error', 1, undefined, { 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      };
      performSearch();
    }
  }, [debouncedQuery, onSearch, trackMetric]);
  
  return {
    query,
    setQuery,
    searchHistory,
    clearHistory: () => setSearchHistory([]),
  };
};

UnifiedSearchComponent.displayName = 'UnifiedSearchComponent';

export { UnifiedSearchComponent as SearchComponent };
export default UnifiedSearchComponent;
