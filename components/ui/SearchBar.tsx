import React, { memo, useRef, useState } from 'react';
import { View, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Search, X, Sparkles } from 'lucide-react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { createSemanticProps, useAccessibility } from '@/hooks/useAccessibility';
import { currentColors, BorderRadius, Spacing, Typography, Shadows as ColorsShadows } from '@/constants/Colors';

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
}

const SearchBar = memo<SearchBarProps>(({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  onSubmit,
  showAIIcon = false,
  loading = false,
  containerStyle,
  accessibilityLabel = 'Search',
  accessibilityHint = 'Enter search terms and press search to find results',
  testID,
  ...textInputProps
}) => {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const { announceForAccessibility } = useAccessibility();

  const handleClear = () => {
    onChangeText('');
    onClear?.();
    announceForAccessibility('Search field cleared');
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    inputRef.current?.blur();
    onSubmit?.();
    if (value.trim()) {
      announceForAccessibility(`Searching for ${value}`);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    announceForAccessibility('Search field focused');
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleChangeText = (text: string) => {
    onChangeText(text);
    
    // Announce results count or suggestions if needed
    // This could be enhanced with live search results
    if (text.length === 0) {
      announceForAccessibility('Search field cleared');
    }
  };

  return (
    <View style={[styles.outerContainer, containerStyle]}>
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

        {showAIIcon && (
          <View style={styles.aiIconContainer}>
            <Sparkles 
              color={currentColors.primary} 
              size={18}
            />
          </View>
        )}
      </View>
    </View>
  );
});

SearchBar.displayName = 'SearchBar';

const styles = StyleSheet.create({
  outerContainer: {
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
});

export { SearchBar };