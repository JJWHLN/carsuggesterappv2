import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Text,
  Keyboard,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Search, X, Clock, TrendingUp, Filter } from 'lucide-react-native';
import { useThemeColors } from '../../hooks/useTheme';
import { Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { getPlatformShadow } from '../../constants/PlatformOptimizations';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'trending' | 'suggestion';
  count?: number;
}

interface EnhancedSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch: (query: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onFilterPress?: () => void;
  placeholder?: string;
  suggestions?: SearchSuggestion[];
  recentSearches?: string[];
  showSuggestions?: boolean;
  autoFocus?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  value,
  onChangeText,
  onSearch,
  onFocus,
  onBlur,
  onFilterPress,
  placeholder = "Search cars, models, or brands...",
  suggestions = [],
  recentSearches = [],
  showSuggestions = true,
  autoFocus = false,
}) => {
  const { colors } = useThemeColors();
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const focusAnimation = useSharedValue(0);
  const suggestionAnimation = useSharedValue(0);
  const cancelButtonAnimation = useSharedValue(0);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    borderWidth: 2,
    borderColor: focusAnimation.value === 1 ? colors.primary : colors.border,
    transform: [
      {
        scale: withSpring(focusAnimation.value === 1 ? 1.02 : 1),
      },
    ],
  }));

  const animatedSuggestionsStyle = useAnimatedStyle(() => ({
    opacity: suggestionAnimation.value,
    transform: [
      {
        translateY: interpolate(
          suggestionAnimation.value,
          [0, 1],
          [-10, 0]
        ),
      },
    ],
  }));

  const animatedCancelStyle = useAnimatedStyle(() => ({
    opacity: cancelButtonAnimation.value,
    transform: [
      {
        scale: cancelButtonAnimation.value,
      },
    ],
  }));

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setShowDropdown(true);
    
    focusAnimation.value = withSpring(1, { damping: 15 });
    suggestionAnimation.value = withTiming(1, { duration: 200 });
    cancelButtonAnimation.value = withSpring(1, { damping: 15 });
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    
    focusAnimation.value = withSpring(0, { damping: 15 });
    cancelButtonAnimation.value = withSpring(0, { damping: 15 });
    
    // Delay hiding suggestions to allow for selection
    setTimeout(() => {
      setShowDropdown(false);
      suggestionAnimation.value = withTiming(0, { duration: 150 });
    }, 150);
    
    onBlur?.();
  }, [onBlur]);

  const handleSearch = useCallback((query?: string) => {
    const searchQuery = query || value;
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      inputRef.current?.blur();
      
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    }
  }, [value, onSearch]);

  const handleSuggestionPress = useCallback((suggestion: SearchSuggestion) => {
    onChangeText(suggestion.text);
    handleSearch(suggestion.text);
  }, [onChangeText, handleSearch]);

  const handleClear = useCallback(() => {
    onChangeText('');
    inputRef.current?.focus();
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [onChangeText]);

  const handleCancel = useCallback(() => {
    onChangeText('');
    inputRef.current?.blur();
    Keyboard.dismiss();
  }, [onChangeText]);

  const renderSuggestion = ({ item }: { item: SearchSuggestion }) => {
    const getIcon = () => {
      switch (item.type) {
        case 'recent':
          return <Clock color={colors.textMuted} size={16} />;
        case 'trending':
          return <TrendingUp color={colors.primary} size={16} />;
        default:
          return <Search color={colors.textMuted} size={16} />;
      }
    };

    return (
      <TouchableOpacity
        style={styles.suggestionItem}
        onPress={() => handleSuggestionPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.suggestionIcon}>
          {getIcon()}
        </View>
        <Text style={[styles.suggestionText, { color: colors.text }]}>
          {item.text}
        </Text>
        {item.count && (
          <Text style={[styles.suggestionCount, { color: colors.textMuted }]}>
            {item.count.toLocaleString()}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const allSuggestions = [
    ...recentSearches.slice(0, 3).map((search, index) => ({
      id: `recent-${index}`,
      text: search,
      type: 'recent' as const,
    })),
    ...suggestions.slice(0, 5),
  ];

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          },
          getPlatformShadow(2),
          animatedContainerStyle,
        ]}
      >
        <View style={styles.searchIcon}>
          <Search color={colors.textMuted} size={20} />
        </View>
        
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            {
              color: colors.text,
              fontSize: 16,
            },
          ]}
          value={value}
          onChangeText={onChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onSubmitEditing={() => handleSearch()}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never"
        />

        {value.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <X color={colors.textMuted} size={18} />
          </TouchableOpacity>
        )}

        {onFilterPress && (
          <TouchableOpacity
            style={styles.filterButton}
            onPress={onFilterPress}
            activeOpacity={0.7}
          >
            <Filter color={colors.primary} size={20} />
          </TouchableOpacity>
        )}

        {isFocused && (
          <AnimatedTouchableOpacity
            style={[styles.cancelButton, animatedCancelStyle]}
            onPress={handleCancel}
            activeOpacity={0.7}
          >
            <Text style={[styles.cancelText, { color: colors.primary }]}>
              Cancel
            </Text>
          </AnimatedTouchableOpacity>
        )}
      </Animated.View>

      {/* Suggestions Dropdown */}
      {showSuggestions && showDropdown && allSuggestions.length > 0 && (
        <Animated.View
          style={[
            styles.suggestionsContainer,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
            getPlatformShadow(4),
            animatedSuggestionsStyle,
          ]}
        >
          <FlatList
            data={allSuggestions}
            renderItem={renderSuggestion}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.xs,
    minHeight: 50,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    paddingVertical: 0,
  },
  clearButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  filterButton: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  cancelButton: {
    marginLeft: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  cancelText: {
    ...Typography.body,
    fontWeight: '600',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: Spacing.xs,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    maxHeight: 300,
    zIndex: 1001,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  suggestionIcon: {
    marginRight: Spacing.sm,
  },
  suggestionText: {
    flex: 1,
    ...Typography.body,
  },
  suggestionCount: {
    ...Typography.caption,
    fontWeight: '500',
  },
});
