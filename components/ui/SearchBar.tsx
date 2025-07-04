import React, { memo, useRef } from 'react';
import { View, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { Search, X, Sparkles } from 'lucide-react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { createAccessibilityProps } from '@/hooks/useAccessibility';
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
  ...textInputProps
}) => {
  const inputRef = useRef<TextInput>(null);

  const handleClear = () => {
    onChangeText('');
    onClear?.();
  };

  const handleSubmit = () => {
    inputRef.current?.blur();
    onSubmit?.();
  };

  return (
    <View style={[styles.outerContainer, containerStyle]}>
      <View style={styles.searchContainer}>
        <View style={styles.iconContainer}>
          <Search color={currentColors.textSecondary} size={20} />
        </View>
        
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={currentColors.textMuted}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          multiline={false}
          numberOfLines={1}
          editable={!loading}
          {...createAccessibilityProps(
            `Search input field`,
            `Enter search terms and press search to find results`
          )}
          {...textInputProps}
        />
        
        {value.length > 0 && onClear && (
          <AnimatedPressable 
            onPress={handleClear} 
            style={styles.clearButtonContainer}
            {...createAccessibilityProps(
              'Clear search',
              'Double tap to clear the search field'
            )}
          >
            <X color={currentColors.textSecondary} size={16} />
          </AnimatedPressable>
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
});

export { SearchBar };