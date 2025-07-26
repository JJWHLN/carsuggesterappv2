/**
 * 🔍 Optimized Search Bar Component
 * Performance-first search with debouncing and memoization
 */

import React, { memo, useRef, useCallback, useMemo, useState } from 'react';
import {
  TextInput,
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Animated,
} from 'react-native';
import { useDesignSystem } from '../../hooks/useDesignSystem';
import { useDebounce } from '../../hooks/useDebounce';
import { usePerformanceMonitor } from '../../utils/performance';

interface OptimizedSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
  debounceMs?: number;
  showFilters?: boolean;
  onFiltersPress?: () => void;
  autoFocus?: boolean;
}

export const OptimizedSearchBar = memo<OptimizedSearchBarProps>(
  ({
    onSearch,
    placeholder = 'Search cars...',
    initialValue = '',
    debounceMs = 300,
    showFilters = true,
    onFiltersPress,
    autoFocus = false,
  }) => {
    const { colors, spacing, typography } = useDesignSystem();
    const { trackMetric } = usePerformanceMonitor();
    const inputRef = useRef<TextInput>(null);
    const [inputValue, setInputValue] = useState(initialValue);
    const [isFocused, setIsFocused] = useState(false);
    const animatedValue = useRef(new Animated.Value(0)).current;

    // Debounced search to prevent excessive API calls
    const debouncedOnSearch = useDebounce(onSearch, debounceMs);

    // Handle text change with performance tracking
    const handleTextChange = useCallback(
      (text: string) => {
        setInputValue(text);
        debouncedOnSearch(text);
        trackMetric('search-query-length', text.length);
      },
      [debouncedOnSearch, trackMetric],
    );

    // Clear search with animation
    const handleClear = useCallback(() => {
      setInputValue('');
      onSearch('');
      inputRef.current?.focus();
      trackMetric('search-cleared', 1);
    }, [onSearch, trackMetric]);

    // Focus handlers with animation
    const handleFocus = useCallback(() => {
      setIsFocused(true);
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      trackMetric('search-focused', 1);
    }, [animatedValue, trackMetric]);

    const handleBlur = useCallback(() => {
      setIsFocused(false);
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }, [animatedValue]);

    // Submit search on return key
    const handleSubmit = useCallback(() => {
      onSearch(inputValue);
      inputRef.current?.blur();
      trackMetric('search-submitted', 1);
    }, [inputValue, onSearch, trackMetric]);

    // Memoized styles for performance
    const containerStyle = useMemo(() => {
      const focusedBorderColor = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.border, colors.primary],
      });

      return [
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: focusedBorderColor,
          borderRadius: spacing.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
      ];
    }, [colors, spacing, animatedValue]);

    const inputStyle = useMemo(
      () => ({
        flex: 1,
        color: colors.text,
        fontSize: typography.body.fontSize,
        fontFamily: typography.body.fontFamily,
        padding: 0, // Remove default padding
      }),
      [colors.text, typography.body],
    );

    const placeholderColor = useMemo(
      () => colors.textSecondary,
      [colors.textSecondary],
    );

    // Show clear button only when there's text
    const showClearButton = inputValue.length > 0;

    return (
      <Animated.View style={containerStyle}>
        <View style={styles.inputContainer}>
          {/* Search Icon */}
          <View style={styles.searchIcon}>
            <Text style={[styles.iconText, { color: colors.textSecondary }]}>
              🔍
            </Text>
          </View>

          {/* Text Input */}
          <TextInput
            ref={inputRef}
            value={inputValue}
            onChangeText={handleTextChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={handleSubmit}
            placeholder={placeholder}
            placeholderTextColor={placeholderColor}
            style={inputStyle}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus={autoFocus}
            selectTextOnFocus={true}
            underlineColorAndroid="transparent"
          />

          {/* Clear Button */}
          {showClearButton && (
            <TouchableOpacity
              onPress={handleClear}
              style={styles.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.iconText, { color: colors.textSecondary }]}>
                ✕
              </Text>
            </TouchableOpacity>
          )}

          {/* Filters Button */}
          {showFilters && (
            <TouchableOpacity
              onPress={onFiltersPress}
              style={[styles.filtersButton, { borderLeftColor: colors.border }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.iconText, { color: colors.textSecondary }]}>
                ⚙️
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Focus Indicator */}
        {isFocused && (
          <Animated.View
            style={[
              styles.focusIndicator,
              {
                backgroundColor: colors.primary,
                opacity: animatedValue,
              },
            ]}
          />
        )}
      </Animated.View>
    );
  },
);

OptimizedSearchBar.displayName = 'OptimizedSearchBar';

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    position: 'relative',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  filtersButton: {
    marginLeft: 8,
    paddingLeft: 12,
    borderLeftWidth: 1,
    padding: 4,
  },
  iconText: {
    fontSize: 16,
  },
  focusIndicator: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 2,
  },
});
