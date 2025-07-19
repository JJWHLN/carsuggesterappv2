import React from 'react';
import { 
  TextInput, 
  Text, 
  View, 
  StyleSheet, 
  TextInputProps,
  KeyboardTypeOptions,
  useColorScheme,
} from 'react-native';
import DesignSystem from '@/constants/DesignSystem';

export interface UnifiedFormInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  required?: boolean;
  hint?: string;
  containerStyle?: any;
  inputStyle?: any;
  labelStyle?: any;
  errorStyle?: any;
  hintStyle?: any;
  variant?: 'default' | 'outlined' | 'filled';
  size?: 'small' | 'medium' | 'large';
  type?: 'text' | 'email' | 'password' | 'phone' | 'number';
}

/**
 * Unified form input component that eliminates input styling redundancies
 * Provides consistent theming, validation display, and accessibility
 */
export const UnifiedFormInput: React.FC<UnifiedFormInputProps> = ({
  label,
  error,
  required = false,
  hint,
  containerStyle,
  inputStyle,
  labelStyle,
  errorStyle,
  hintStyle,
  variant = 'default',
  size = 'medium',
  type = 'text',
  ...textInputProps
}) => {
  const colorScheme = useColorScheme();
  const theme = { colors: colorScheme === 'dark' ? DesignSystem.Colors.dark : DesignSystem.Colors.light };

  // Determine keyboard type based on input type
  const getKeyboardType = (): KeyboardTypeOptions => {
    switch (type) {
      case 'email':
        return 'email-address';
      case 'phone':
        return 'phone-pad';
      case 'number':
        return 'numeric';
      default:
        return 'default';
    }
  };

  // Get size-specific styles
  const getSizeStyles = () => {
    const sizes = {
      small: {
        fontSize: 14,
        paddingHorizontal: 12,
        paddingVertical: 8,
        minHeight: 36,
      },
      medium: {
        fontSize: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 44,
      },
      large: {
        fontSize: 18,
        paddingHorizontal: 20,
        paddingVertical: 16,
        minHeight: 52,
      },
    };
    return sizes[size];
  };

  // Get variant-specific styles
  const getVariantStyles = () => {
    const variants = {
      default: {
        borderWidth: 1,
        borderColor: error ? theme.colors.error : theme.colors.border,
        backgroundColor: 'transparent',
        borderRadius: 8,
      },
      outlined: {
        borderWidth: 2,
        borderColor: error ? theme.colors.error : theme.colors.border,
        backgroundColor: 'transparent',
        borderRadius: 12,
      },
      filled: {
        borderWidth: 0,
        backgroundColor: error 
          ? `${theme.colors.error}15` 
          : theme.colors.surfaceVariant,
        borderRadius: 12,
      },
    };
    return variants[variant];
  };

  const sizeStyles = getSizeStyles();
  const variantStyles = getVariantStyles();

  const baseInputStyles = {
    ...sizeStyles,
    ...variantStyles,
    color: theme.colors.onSurface,
    fontFamily: 'System',
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[
          styles.label,
          { 
            color: theme.colors.onSurface,
            fontSize: 12,
            fontWeight: '600',
          },
          labelStyle,
        ]}>
          {label}
          {required && <Text style={{ color: theme.colors.error }}> *</Text>}
        </Text>
      )}
      
      <TextInput
        style={[
          baseInputStyles,
          inputStyle,
        ]}
        keyboardType={getKeyboardType()}
        secureTextEntry={type === 'password'}
        autoCapitalize={type === 'email' ? 'none' : 'sentences'}
        autoComplete={getAutoComplete()}
        textContentType={getTextContentType()}
        placeholderTextColor={theme.colors.onSurfaceVariant}
        {...textInputProps}
      />
      
      {error && (
        <Text style={[
          styles.errorText,
          { 
            color: theme.colors.error,
            fontSize: 12,
          },
          errorStyle,
        ]}>
          {error}
        </Text>
      )}
      
      {hint && !error && (
        <Text style={[
          styles.hintText,
          { 
            color: theme.colors.onSurfaceVariant,
            fontSize: 12,
          },
          hintStyle,
        ]}>
          {hint}
        </Text>
      )}
    </View>
  );

  function getAutoComplete(): TextInputProps['autoComplete'] {
    switch (type) {
      case 'email':
        return 'email';
      case 'password':
        return 'password';
      case 'phone':
        return 'tel';
      default:
        return 'off';
    }
  }

  function getTextContentType(): TextInputProps['textContentType'] {
    switch (type) {
      case 'email':
        return 'emailAddress';
      case 'password':
        return 'password';
      case 'phone':
        return 'telephoneNumber';
      default:
        return 'none';
    }
  }
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 4,
    fontWeight: '500',
  },
  hintText: {
    marginTop: 4,
    fontStyle: 'italic',
  },
});
