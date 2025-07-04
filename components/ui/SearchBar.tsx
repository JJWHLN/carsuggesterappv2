import React, { memo, useRef } from 'react'; // Removed useEffect as it's not used
import { View, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native'; // Added ViewStyle
import { Search, X, Sparkles } from 'lucide-react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { createAccessibilityProps } from '@/hooks/useAccessibility';
import { currentColors, BorderRadius, Spacing, Typography } from '@/constants/Colors'; // Removed Shadows as it's not directly used here per new design

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
    // inputRef.current?.focus(); // Focusing after clear might not always be desired, make it optional or remove
  };

  const handleSubmit = () => {
    inputRef.current?.blur(); // Keep blur on submit
    onSubmit?.();
  };

  // Design system specifies search icon color as gray, clear button icon size 16x16px
  // Placeholder text color is muted text.

  return (
    <View style={[styles.outerContainer, containerStyle]}>
      <View style={styles.searchContainer}>
        <View style={styles.iconContainer}>
          {/* AI Icon not in design spec, using standard search icon */}
          <Search color={currentColors.textSecondary} size={20} />
        </View>
        
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={currentColors.textMuted} // Updated to textMuted
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          multiline={false}
          numberOfLines={1}
          editable={!loading} // Keep editable tied to loading
          {...createAccessibilityProps(
            `Search input field`,
            `Enter search terms and press search to find results`
          )}
          {...textInputProps}
        />
        
        {value.length > 0 && onClear && (
          <AnimatedPressable 
            onPress={handleClear} 
            style={styles.clearButtonContainer} // Use a container for better touch area
            {...createAccessibilityProps(
              'Clear search',
              'Double tap to clear the search field'
            )}
          >
            <X color={currentColors.textSecondary} size={16} /> {/* Size 16px */}
          </AnimatedPressable>
        )}
      </View>
    </View>
  );
});

SearchBar.displayName = 'SearchBar';

const styles = StyleSheet.create({
  outerContainer: { // Renamed from container to avoid conflict if used elsewhere
    // Padding for the search bar component itself, if needed around the search box
    // Per design, the search bar itself seems to be the main element, padding handled by parent.
    // For now, let's assume this container doesn't need its own padding.
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc', // Light gray from design system
    borderRadius: BorderRadius.xl, // Pill shape (24px)
    borderWidth: 1,
    borderColor: currentColors.border, // #e2e8f0
    paddingHorizontal: Spacing.md, // 16px horizontal padding
    // Vertical padding is implicitly handled by input and icon sizes to achieve overall height.
    // Aim for a height that accommodates 12px vertical padding effectively.
    // minHeight: 48, // A common touch target height, can be adjusted
  },
  iconContainer: {
    marginRight: Spacing.sm, // 8px spacing from icon to text input
  },
  input: {
    flex: 1,
    ...Typography.bodyText, // 16px, Regular
    color: currentColors.text,
    paddingVertical: Spacing.sm + Spacing.xs, // 12px vertical padding for input text area
    // This padding contributes to the overall height of the search bar
  },
  clearButtonContainer: {
    padding: Spacing.sm, // Make touch area larger
    marginLeft: Spacing.sm,
  },
});

export { SearchBar };