import React, { memo, useState, useCallback, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Pressable,
  Text,
  ScrollView,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Search, X, Clock, TrendingUp } from '@/utils/ultra-optimized-icons';
import {
  Colors,
  Spacing,
  BorderRadius,
  Typography,
  Shadows,
} from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';

interface ModernSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  placeholder?: string;
  suggestions?: string[];
  recentSearches?: string[];
  popularSearches?: string[];
  showSuggestions?: boolean;
  autoFocus?: boolean;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const ModernSearchBar = memo<ModernSearchBarProps>(
  ({
    value,
    onChangeText,
    onSubmit,
    onFocus,
    onBlur,
    placeholder = 'Search cars, brands, models...',
    suggestions = [],
    recentSearches = [],
    popularSearches = [],
    showSuggestions = true,
    autoFocus = false,
    testID,
  }) => {
    const { colors } = useThemeColors();
    const inputRef = useRef<TextInput>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    // Animation values
    const borderScale = useSharedValue(1);
    const shadowOpacity = useSharedValue(0);
    const dropdownHeight = useSharedValue(0);
    const dropdownOpacity = useSharedValue(0);

    // Animated styles
    const containerAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: borderScale.value }],
    }));

    const shadowAnimatedStyle = useAnimatedStyle(() => ({
      opacity: shadowOpacity.value,
    }));

    const dropdownAnimatedStyle = useAnimatedStyle(() => ({
      height: dropdownHeight.value,
      opacity: dropdownOpacity.value,
    }));

    // Focus animations
    const handleFocus = useCallback(() => {
      setIsFocused(true);
      setShowDropdown(true);

      borderScale.value = withSpring(1.02, { damping: 20, stiffness: 300 });
      shadowOpacity.value = withTiming(1, { duration: 200 });
      dropdownHeight.value = withSpring(250, { damping: 25, stiffness: 200 });
      dropdownOpacity.value = withTiming(1, { duration: 300 });

      onFocus?.();
    }, [onFocus]);

    const handleBlur = useCallback(() => {
      setIsFocused(false);

      // Delay hiding dropdown to allow for suggestion selection
      setTimeout(() => {
        setShowDropdown(false);
        borderScale.value = withSpring(1, { damping: 20, stiffness: 300 });
        shadowOpacity.value = withTiming(0, { duration: 200 });
        dropdownHeight.value = withTiming(0, { duration: 200 });
        dropdownOpacity.value = withTiming(0, { duration: 150 });
      }, 150);

      onBlur?.();
    }, [onBlur]);

    const handleSubmit = useCallback(() => {
      if (value.trim()) {
        onSubmit?.(value.trim());
        Keyboard.dismiss();
      }
    }, [value, onSubmit]);

    const handleSuggestionPress = useCallback(
      (suggestion: string) => {
        onChangeText(suggestion);
        onSubmit?.(suggestion);
        Keyboard.dismiss();
      },
      [onChangeText, onSubmit],
    );

    const handleClear = useCallback(() => {
      onChangeText('');
      inputRef.current?.focus();
    }, [onChangeText]);

    const allSuggestions = [
      ...suggestions.slice(0, 3),
      ...recentSearches.slice(0, 3),
      ...popularSearches.slice(0, 4),
    ].filter((item, index, array) => array.indexOf(item) === index);

    return (
      <View style={styles.container}>
        {/* Search Input Container */}
        <Animated.View style={[containerAnimatedStyle]}>
          <View
            style={[
              styles.inputContainer,
              {
                backgroundColor: colors.white,
                borderColor: isFocused ? colors.primary : colors.border,
              },
            ]}
          >
            {/* Search Icon */}
            <View style={styles.searchIconContainer}>
              <Search size={20} color={colors.textMuted} />
            </View>

            {/* Text Input */}
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.text }]}
              value={value}
              onChangeText={onChangeText}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onSubmitEditing={handleSubmit}
              placeholder={placeholder}
              placeholderTextColor={colors.textMuted}
              autoFocus={autoFocus}
              returnKeyType="search"
              testID={testID}
              accessibilityLabel="Search input"
              accessibilityHint="Enter car brand, model, or keywords to search"
            />

            {/* Clear Button */}
            {value.length > 0 && (
              <AnimatedPressable
                style={styles.clearButton}
                onPress={handleClear}
                accessibilityLabel="Clear search"
              >
                <X size={18} color={colors.textMuted} />
              </AnimatedPressable>
            )}
          </View>

          {/* Focus Shadow */}
          <Animated.View
            style={[
              styles.shadowOverlay,
              shadowAnimatedStyle,
              { shadowColor: colors.primary },
            ]}
          />
        </Animated.View>

        {/* Suggestions Dropdown */}
        {showSuggestions && showDropdown && allSuggestions.length > 0 && (
          <Animated.View
            style={[
              styles.dropdown,
              dropdownAnimatedStyle,
              { backgroundColor: colors.white, borderColor: colors.border },
            ]}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <View style={styles.suggestionSection}>
                  <View style={styles.sectionHeader}>
                    <Clock size={14} color={colors.textMuted} />
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Recent
                    </Text>
                  </View>
                  {recentSearches.slice(0, 3).map((search, index) => (
                    <Pressable
                      key={`recent-${index}`}
                      style={styles.suggestionItem}
                      onPress={() => handleSuggestionPress(search)}
                    >
                      <Text
                        style={[styles.suggestionText, { color: colors.text }]}
                      >
                        {search}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Popular Searches */}
              {popularSearches.length > 0 && (
                <View style={styles.suggestionSection}>
                  <View style={styles.sectionHeader}>
                    <TrendingUp size={14} color={colors.textMuted} />
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Popular
                    </Text>
                  </View>
                  {popularSearches.slice(0, 4).map((search, index) => (
                    <Pressable
                      key={`popular-${index}`}
                      style={styles.suggestionItem}
                      onPress={() => handleSuggestionPress(search)}
                    >
                      <Text
                        style={[styles.suggestionText, { color: colors.text }]}
                      >
                        {search}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}

              {/* Dynamic Suggestions */}
              {suggestions.length > 0 && (
                <View style={styles.suggestionSection}>
                  <View style={styles.sectionHeader}>
                    <Search size={14} color={colors.textMuted} />
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Suggestions
                    </Text>
                  </View>
                  {suggestions.slice(0, 3).map((suggestion, index) => (
                    <Pressable
                      key={`suggestion-${index}`}
                      style={styles.suggestionItem}
                      onPress={() => handleSuggestionPress(suggestion)}
                    >
                      <Text
                        style={[styles.suggestionText, { color: colors.text }]}
                      >
                        {suggestion}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </ScrollView>
          </Animated.View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    ...Shadows.sm,
  },
  searchIconContainer: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.base,
    height: '100%',
  },
  clearButton: {
    padding: 4,
    marginLeft: Spacing.sm,
  },
  shadowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.lg,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  suggestionSection: {
    paddingVertical: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.sm,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  suggestionItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  suggestionText: {
    ...Typography.base,
  },
});

ModernSearchBar.displayName = 'ModernSearchBar';
