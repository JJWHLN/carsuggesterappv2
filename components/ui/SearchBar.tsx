import React, { memo, useRef, useState, useMemo, useCallback } from 'react';
import { View, TextInput, StyleSheet, TextInputProps, ViewStyle, ScrollView, Text, FlatList, TouchableOpacity, Modal, Pressable } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS
} from 'react-native-reanimated';
import { Search, X, Sparkles, Filter, Star } from '@/utils/ultra-optimized-icons';
import { TrendingUp, Clock } from '@/utils/ultra-optimized-icons';
import { AnimatedPressable } from './AnimatedPressable';
import { createSemanticProps, useAccessibility } from '@/hooks/useAccessibility';
import { useDebounce } from '@/hooks/useDebounce';
import { currentColors, BorderRadius, Spacing, Typography, Shadows as ColorsShadows } from '@/constants/Colors';

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

interface SearchBarProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onSubmit?: () => void;
  showAIIcon?: boolean;
  loading?: boolean;
  containerStyle?: any;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  // Premium features
  suggestions?: SearchSuggestion[];
  filters?: SearchFilter[];
  onSuggestionPress?: (suggestion: SearchSuggestion) => void;
  onFilterChange?: (filters: SearchFilter[]) => void;
  showFilters?: boolean;
  showSuggestions?: boolean;
  recentSearches?: string[];
  popularSearches?: string[];
  debounceMs?: number;
  maxSuggestions?: number;
}

const SearchBar = memo<SearchBarProps>(({
  value,
  onChangeText,
  placeholder = 'Search cars, brands, models...',
  onClear,
  onSubmit,
  showAIIcon = false,
  loading = false,
  containerStyle,
  accessibilityLabel = 'Search',
  accessibilityHint = 'Enter search terms and press search to find results',
  testID,
  // Premium features
  suggestions = [],
  filters = [],
  onSuggestionPress,
  onFilterChange,
  showFilters = false,
  showSuggestions = true,
  recentSearches = [],
  popularSearches = [],
  debounceMs = 300,
  maxSuggestions = 8,
  ...textInputProps
}) => {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [localFilters, setLocalFilters] = useState<SearchFilter[]>(filters);
  const { announceForAccessibility } = useAccessibility();

  // Debounced search value
  const debouncedValue = useDebounce(value, debounceMs);

  // Animation values
  const suggestionOpacity = useSharedValue(0);
  const suggestionHeight = useSharedValue(0);
  const filterOpacity = useSharedValue(0);

  // Generate suggestions based on search value
  const filteredSuggestions = useMemo(() => {
    if (!showSuggestions || (!isFocused && !debouncedValue.length)) return [];

    let allSuggestions: SearchSuggestion[] = [];

    // Add recent searches if no search term
    if (!debouncedValue.length && recentSearches.length > 0) {
      allSuggestions = allSuggestions.concat(
        recentSearches.slice(0, 3).map((search, index) => ({
          id: `recent-${index}`,
          text: search,
          type: 'recent' as const,
          icon: '🕐',
          subtitle: 'Recent search'
        }))
      );
    }

    // Add popular searches if no search term
    if (!debouncedValue.length && popularSearches.length > 0) {
      allSuggestions = allSuggestions.concat(
        popularSearches.slice(0, 3).map((search, index) => ({
          id: `popular-${index}`,
          text: search,
          type: 'popular' as const,
          icon: '🔥',
          subtitle: 'Popular search'
        }))
      );
    }

    // Filter suggestions based on search term
    if (debouncedValue.length > 0) {
      allSuggestions = suggestions.filter(suggestion =>
        suggestion.text.toLowerCase().includes(debouncedValue.toLowerCase())
      );
    }

    return allSuggestions.slice(0, maxSuggestions);
  }, [debouncedValue, suggestions, recentSearches, popularSearches, maxSuggestions, isFocused, showSuggestions]);

  // Show suggestions animation
  React.useEffect(() => {
    if (isFocused && filteredSuggestions.length > 0) {
      suggestionOpacity.value = withTiming(1, { duration: 200 });
      suggestionHeight.value = withSpring(filteredSuggestions.length * 60, { 
        damping: 15,
        stiffness: 100
      });
    } else {
      suggestionOpacity.value = withTiming(0, { duration: 200 });
      suggestionHeight.value = withSpring(0, { 
        damping: 15,
        stiffness: 100
      });
    }
  }, [isFocused, filteredSuggestions.length]);

  // Active filters count
  const activeFiltersCount = useMemo(() => 
    localFilters.filter(f => f.active).length, 
    [localFilters]
  );

  // Filter animation
  React.useEffect(() => {
    if (activeFiltersCount > 0) {
      filterOpacity.value = withSpring(1);
    } else {
      filterOpacity.value = withSpring(0);
    }
  }, [activeFiltersCount]);

  // Event handlers
  const handleClear = useCallback(() => {
    onChangeText('');
    onClear?.();
    announceForAccessibility('Search field cleared');
    inputRef.current?.focus();
  }, [onChangeText, onClear, announceForAccessibility]);

  const handleSubmit = useCallback(() => {
    inputRef.current?.blur();
    onSubmit?.();
    if (value.trim()) {
      announceForAccessibility(`Searching for ${value}`);
    }
  }, [onSubmit, value, announceForAccessibility]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    announceForAccessibility('Search field focused');
  }, [announceForAccessibility]);

  const handleBlur = useCallback(() => {
    // Delay blur to allow suggestion tap
    setTimeout(() => setIsFocused(false), 150);
  }, []);

  const handleChangeText = useCallback((text: string) => {
    onChangeText(text);
    
    if (text.length === 0) {
      announceForAccessibility('Search field cleared');
    }
  }, [onChangeText, announceForAccessibility]);

  const handleSuggestionPress = useCallback((suggestion: SearchSuggestion) => {
    onChangeText(suggestion.text);
    onSuggestionPress?.(suggestion);
    setIsFocused(false);
    inputRef.current?.blur();
    announceForAccessibility(`Selected ${suggestion.text}`);
  }, [onChangeText, onSuggestionPress, announceForAccessibility]);

  const handleFilterPress = useCallback(() => {
    setShowFilterModal(true);
  }, []);

  const handleFilterChange = useCallback((filterId: string) => {
    const updatedFilters = localFilters.map(filter =>
      filter.id === filterId ? { ...filter, active: !filter.active } : filter
    );
    setLocalFilters(updatedFilters);
    onFilterChange?.(updatedFilters);
  }, [localFilters, onFilterChange]);

  const handleApplyFilters = useCallback(() => {
    setShowFilterModal(false);
    onFilterChange?.(localFilters);
  }, [localFilters, onFilterChange]);

  const handleResetFilters = useCallback(() => {
    const resetFilters = localFilters.map(filter => ({ ...filter, active: false }));
    setLocalFilters(resetFilters);
    onFilterChange?.(resetFilters);
  }, [localFilters, onFilterChange]);

  // Animated styles
  const suggestionContainerStyle = useAnimatedStyle(() => ({
    opacity: suggestionOpacity.value,
    height: Math.min(suggestionHeight.value, 300),
  }));

  const filterBadgeStyle = useAnimatedStyle(() => ({
    opacity: filterOpacity.value,
    transform: [{ scale: filterOpacity.value }],
  }));

  // Render suggestion item
  const renderSuggestion = useCallback(({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSuggestionPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionIcon}>
        {item.type === 'recent' && <Clock color={currentColors.textSecondary} size={16} />}
        {item.type === 'popular' && <TrendingUp color={currentColors.primary} size={16} />}
        {item.type === 'brand' && <Star color={currentColors.warning} size={16} />}
        {item.type === 'model' && <Search color={currentColors.textSecondary} size={16} />}
      </View>
      <View style={styles.suggestionContent}>
        <Text style={styles.suggestionText}>{item.text}</Text>
        {item.subtitle && (
          <Text style={styles.suggestionSubtitle}>{item.subtitle}</Text>
        )}
      </View>
    </TouchableOpacity>
  ), [handleSuggestionPress]);

  return (
    <View style={[styles.outerContainer, containerStyle]}>
      {/* Active Filters Chips */}
      {showFilters && activeFiltersCount > 0 && (
        <Animated.View style={[styles.filtersContainer, filterBadgeStyle]}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScroll}
          >
            {localFilters.filter(f => f.active).map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={styles.filterChip}
                onPress={() => handleFilterChange(filter.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.filterChipText}>{filter.label}</Text>
                <X color={currentColors.primary} size={14} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}

      {/* Main Search Container */}
      <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}>
        <View style={styles.iconContainer}>
          <Search 
            color={isFocused ? currentColors.primary : currentColors.textSecondary} 
            size={20} 
          />
        </View>
        
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={currentColors.textMuted}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          multiline={false}
          numberOfLines={1}
          editable={!loading}
          testID={testID}
          {...createSemanticProps(
            accessibilityLabel,
            'search',
            {
              hint: accessibilityHint,
              value: value,
              busy: loading,
            }
          )}
          accessibilityLiveRegion="polite"
          {...textInputProps}
        />
        
        {/* Clear Button */}
        {value.length > 0 && onClear && (
          <AnimatedPressable 
            onPress={handleClear} 
            style={styles.clearButtonContainer}
            testID={`${testID}-clear`}
            {...createSemanticProps(
              'Clear search',
              'button',
              {
                hint: 'Double tap to clear the search field',
              }
            )}
          >
            <X color={currentColors.textSecondary} size={16} />
          </AnimatedPressable>
        )}

        {/* AI Icon */}
        {showAIIcon && (
          <View style={styles.aiIconContainer}>
            <Sparkles 
              color={currentColors.primary} 
              size={18}
            />
          </View>
        )}

        {/* Filter Button */}
        {showFilters && (
          <TouchableOpacity 
            onPress={handleFilterPress}
            style={styles.filterButton}
            activeOpacity={0.7}
          >
            <Filter color={currentColors.textSecondary} size={18} />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions Dropdown */}
      {isFocused && filteredSuggestions.length > 0 && (
        <Animated.View style={[styles.suggestionsContainer, suggestionContainerStyle]}>
          <FlatList
            data={filteredSuggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            style={styles.suggestionsList}
          />
        </Animated.View>
      )}

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter Results</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <X color={currentColors.textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {localFilters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={styles.filterOption}
                onPress={() => handleFilterChange(filter.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.filterOptionText}>{filter.label}</Text>
                <View style={[
                  styles.filterCheckbox,
                  filter.active && styles.filterCheckboxActive
                ]}>
                  {filter.active && (
                    <View style={styles.filterCheckboxInner} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetFilters}
              activeOpacity={0.7}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyFilters}
              activeOpacity={0.7}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
});

SearchBar.displayName = 'SearchBar';

const styles = StyleSheet.create({
  outerContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: currentColors.white,
    borderRadius: BorderRadius.xl,
    borderWidth: 0,
    paddingHorizontal: Spacing.md,
    ...ColorsShadows.medium,
  },
  searchContainerFocused: {
    borderWidth: 2,
    borderColor: currentColors.primary,
    ...ColorsShadows.large,
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.bodyText,
    color: currentColors.text,
    paddingVertical: Spacing.md,
  },
  clearButtonContainer: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  aiIconContainer: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  filterButton: {
    position: 'relative',
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  filterBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: currentColors.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: currentColors.white,
    fontSize: 10,
    fontWeight: '600',
  },
  // Filters Container
  filtersContainer: {
    marginBottom: Spacing.md,
  },
  filtersScroll: {
    paddingHorizontal: Spacing.xs,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: currentColors.primaryLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: currentColors.primary,
  },
  filterChipText: {
    color: currentColors.primary,
    fontSize: 14,
    fontWeight: '500',
    marginRight: Spacing.xs,
  },
  // Suggestions
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: currentColors.white,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.xs,
    maxHeight: 300,
    ...ColorsShadows.large,
    zIndex: 1001,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: currentColors.border,
  },
  suggestionIcon: {
    marginRight: Spacing.md,
    width: 24,
    alignItems: 'center',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    ...Typography.bodyText,
    color: currentColors.text,
    fontWeight: '500',
  },
  suggestionSubtitle: {
    ...Typography.caption,
    color: currentColors.textSecondary,
    marginTop: 2,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: currentColors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: currentColors.border,
  },
  modalTitle: {
    ...Typography.sectionTitle,
    color: currentColors.text,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: currentColors.border,
  },
  filterOptionText: {
    ...Typography.bodyText,
    color: currentColors.text,
    flex: 1,
  },
  filterCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: currentColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCheckboxActive: {
    borderColor: currentColors.primary,
    backgroundColor: currentColors.primary,
  },
  filterCheckboxInner: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: currentColors.white,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: currentColors.border,
  },
  resetButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: currentColors.border,
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  resetButtonText: {
    ...Typography.bodyText,
    color: currentColors.textSecondary,
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: currentColors.primary,
    alignItems: 'center',
  },
  applyButtonText: {
    ...Typography.bodyText,
    color: currentColors.white,
    fontWeight: '600',
  },
});

export { SearchBar };