import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  Platform,
  Animated,
  Easing,
} from 'react-native';

import { useDesignTokens } from '@/hooks/useDesignTokens';
import { Eye, EyeOff, Search, X } from '@/utils/ultra-optimized-icons';

// Base Form Input Component
interface BaseFormInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  required?: boolean;
  variant?: 'primary' | 'search' | 'outlined';
}

export const BaseFormInput: React.FC<BaseFormInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  required = false,
  variant = 'primary',
  ...props
}) => {
  const { colors, spacing, typography, borderRadius, inputs } =
    useDesignTokens();
  const [isFocused, setIsFocused] = useState(false);

  const getInputStyle = () => {
    const baseStyle = variant === 'search' ? inputs.search : inputs.primary;
    return {
      ...baseStyle,
      borderColor: error
        ? colors.error
        : isFocused
          ? colors.primary
          : colors.border,
      borderWidth: variant === 'outlined' ? 1 : 0,
      ...(variant === 'outlined' && { backgroundColor: 'transparent' }),
    };
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
        </Text>
      )}

      <View style={[getInputStyle(), styles.inputContainer]}>
        {leftIcon && (
          <View style={[styles.iconContainer, styles.leftIcon]}>
            {leftIcon}
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            { color: colors.text },
            leftIcon ? styles.inputWithLeftIcon : null,
            rightIcon ? styles.inputWithRightIcon : null,
            inputStyle,
          ].filter(Boolean)}
          placeholderTextColor={colors.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {rightIcon && (
          <View style={[styles.iconContainer, styles.rightIcon]}>
            {rightIcon}
          </View>
        )}
      </View>

      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            { color: error ? colors.error : colors.textSecondary },
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

// Password Input Component
interface PasswordInputProps
  extends Omit<BaseFormInputProps, 'rightIcon' | 'secureTextEntry'> {
  showPasswordToggle?: boolean;
}

export const PasswordInput: React.FC<PasswordInputProps> = ({
  showPasswordToggle = true,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const { colors } = useDesignTokens();

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <BaseFormInput
      {...props}
      secureTextEntry={!isPasswordVisible}
      rightIcon={
        showPasswordToggle ? (
          <TouchableOpacity onPress={togglePasswordVisibility}>
            {isPasswordVisible ? (
              <EyeOff color={colors.textSecondary} size={20} />
            ) : (
              <Eye color={colors.textSecondary} size={20} />
            )}
          </TouchableOpacity>
        ) : undefined
      }
    />
  );
};

// Search Input Component
interface SearchInputProps
  extends Omit<BaseFormInputProps, 'leftIcon' | 'variant'> {
  onClear?: () => void;
  showClearButton?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onClear,
  showClearButton = true,
  value,
  ...props
}) => {
  const { colors } = useDesignTokens();

  return (
    <BaseFormInput
      {...props}
      value={value}
      variant="search"
      leftIcon={<Search color={colors.textSecondary} size={20} />}
      rightIcon={
        showClearButton && value ? (
          <TouchableOpacity onPress={onClear}>
            <X color={colors.textSecondary} size={18} />
          </TouchableOpacity>
        ) : undefined
      }
    />
  );
};

// Floating Label Input Component
interface FloatingLabelInputProps extends Omit<BaseFormInputProps, 'label'> {
  label: string;
  animationDuration?: number;
}

export const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  label,
  animationDuration = 200,
  value,
  ...props
}) => {
  const { colors, typography } = useDesignTokens();
  const [isFocused, setIsFocused] = useState(false);
  const labelAnimation = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(labelAnimation, {
      toValue: isFocused || value ? 1 : 0,
      duration: animationDuration,
      easing: Easing.ease,
      useNativeDriver: false,
    }).start();
  }, [isFocused, value, animationDuration]);

  const labelStyle = {
    position: 'absolute' as const,
    left: 16,
    top: labelAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [16, -8],
    }),
    fontSize: labelAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [16, 12],
    }),
    color: labelAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.textSecondary, colors.primary],
    }),
    backgroundColor: colors.background,
    paddingHorizontal: 4,
    zIndex: 1,
  };

  return (
    <View style={styles.floatingContainer}>
      <Animated.Text style={labelStyle}>{label}</Animated.Text>
      <BaseFormInput
        {...props}
        value={value}
        variant="outlined"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        containerStyle={styles.floatingInputContainer}
      />
    </View>
  );
};

// Form Field Group Component
interface FormFieldGroupProps {
  children: React.ReactNode;
  title?: string;
  style?: ViewStyle;
}

export const FormFieldGroup: React.FC<FormFieldGroupProps> = ({
  children,
  title,
  style,
}) => {
  const { colors, spacing, typography } = useDesignTokens();

  return (
    <View style={[styles.fieldGroup, style]}>
      {title && (
        <Text style={[styles.groupTitle, { color: colors.text }]}>{title}</Text>
      )}
      {children}
    </View>
  );
};

// Form Validation Hook
export const useFormValidation = <T extends Record<string, any>>(
  initialValues: T,
  validationRules: Partial<Record<keyof T, (value: any) => string | null>>,
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouchedFields] = useState<
    Partial<Record<keyof T, boolean>>
  >({});

  const setValue = (field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const setTouched = (field: keyof T) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  const validate = (field?: keyof T) => {
    if (field) {
      const rule = validationRules[field];
      if (rule) {
        const error = rule(values[field]);
        setErrors((prev) => ({ ...prev, [field]: error || undefined }));
        return !error;
      }
      return true;
    }

    // Validate all fields
    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.keys(validationRules).forEach((key) => {
      const rule = validationRules[key as keyof T];
      if (rule) {
        const error = rule(values[key as keyof T]);
        if (error) {
          newErrors[key as keyof T] = error;
          isValid = false;
        }
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouchedFields({});
  };

  return {
    values,
    errors,
    touched,
    setValue,
    setTouched,
    validate,
    reset,
    isValid: Object.keys(errors).length === 0,
  };
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    paddingHorizontal: 16,
  } as TextStyle,
  inputWithLeftIcon: {
    paddingLeft: 48,
  } as TextStyle,
  inputWithRightIcon: {
    paddingRight: 48,
  } as TextStyle,
  iconContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    zIndex: 1,
  },
  leftIcon: {
    left: 4,
  },
  rightIcon: {
    right: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  floatingContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  floatingInputContainer: {
    marginBottom: 0,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
});

// Common validation rules
export const validationRules = {
  required: (value: any) => (!value ? 'This field is required' : null),
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return value && !emailRegex.test(value)
      ? 'Please enter a valid email'
      : null;
  },
  minLength: (min: number) => (value: string) =>
    value && value.length < min ? `Must be at least ${min} characters` : null,
  maxLength: (max: number) => (value: string) =>
    value && value.length > max
      ? `Must be no more than ${max} characters`
      : null,
  password: (value: string) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      return 'Password must contain uppercase, lowercase, and number';
    }
    return null;
  },
};
