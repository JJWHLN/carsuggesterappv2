import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';

export interface FormField {
  value: string;
  error?: string;
  required?: boolean;
  validate?: (value: string) => string | undefined;
}

export interface FormConfig {
  [key: string]: Omit<FormField, 'value'> & { initialValue?: string };
}

export interface UseUnifiedFormOptions {
  onSubmit?: (values: Record<string, string>) => Promise<void> | void;
  validateOnChange?: boolean;
  showErrorAlerts?: boolean;
}

/**
 * Unified form hook that eliminates form redundancies across auth screens and other forms
 * Handles validation, state management, loading states, and error display
 */
export const useUnifiedForm = <T extends FormConfig>(
  config: T,
  options: UseUnifiedFormOptions = {}
) => {
  const { onSubmit, validateOnChange = false, showErrorAlerts = true } = options;

  // Initialize form state from config
  const [formState, setFormState] = useState<Record<keyof T, FormField>>(() => {
    const initialState: Record<string, FormField> = {};
    Object.keys(config).forEach(key => {
      initialState[key] = {
        value: config[key].initialValue || '',
        error: undefined,
        required: config[key].required,
        validate: config[key].validate,
      };
    });
    return initialState as Record<keyof T, FormField>;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitAttempted, setHasSubmitAttempted] = useState(false);

  // Validate a single field
  const validateField = useCallback((fieldName: keyof T, value: string): string | undefined => {
    const fieldConfig = config[fieldName];
    
    // Check required validation
    if (fieldConfig.required && !value.trim()) {
      return `${String(fieldName).charAt(0).toUpperCase() + String(fieldName).slice(1)} is required`;
    }

    // Run custom validation
    if (fieldConfig.validate) {
      return fieldConfig.validate(value);
    }

    return undefined;
  }, [config]);

  // Update field value and optionally validate
  const setFieldValue = useCallback((fieldName: keyof T, value: string) => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        value,
        error: (validateOnChange || hasSubmitAttempted) 
          ? validateField(fieldName, value) 
          : undefined,
      },
    }));
  }, [validateField, validateOnChange, hasSubmitAttempted]);

  // Set field error manually
  const setFieldError = useCallback((fieldName: keyof T, error: string | undefined) => {
    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        error,
      },
    }));
  }, []);

  // Validate all fields
  const validateAllFields = useCallback(() => {
    let hasErrors = false;
    const newFormState = { ...formState };

    Object.keys(formState).forEach(fieldName => {
      const key = fieldName as keyof T;
      const error = validateField(key, formState[key].value);
      newFormState[key] = { ...newFormState[key], error };
      if (error) hasErrors = true;
    });

    setFormState(newFormState);
    return !hasErrors;
  }, [formState, validateField]);

  // Get form values
  const values = useMemo(() => {
    const vals: Record<string, string> = {};
    Object.keys(formState).forEach(key => {
      vals[key] = formState[key as keyof T].value;
    });
    return vals;
  }, [formState]);

  // Get form errors
  const errors = useMemo(() => {
    const errs: Record<string, string | undefined> = {};
    Object.keys(formState).forEach(key => {
      errs[key] = formState[key as keyof T].error;
    });
    return errs;
  }, [formState]);

  // Check if form is valid
  const isValid = useMemo(() => {
    return Object.values(formState).every(field => !field.error);
  }, [formState]);

  // Check if form has any values
  const hasValues = useMemo(() => {
    return Object.values(formState).some(field => field.value.trim().length > 0);
  }, [formState]);

  // Reset form
  const reset = useCallback(() => {
    const resetState: Record<string, FormField> = {};
    Object.keys(config).forEach(key => {
      resetState[key] = {
        value: config[key].initialValue || '',
        error: undefined,
        required: config[key].required,
        validate: config[key].validate,
      };
    });
    setFormState(resetState as Record<keyof T, FormField>);
    setHasSubmitAttempted(false);
    setIsSubmitting(false);
  }, [config]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    setHasSubmitAttempted(true);
    
    if (!validateAllFields()) {
      if (showErrorAlerts) {
        const firstError = Object.values(errors).find(error => error);
        if (firstError) {
          Alert.alert('Validation Error', firstError);
        }
      }
      return false;
    }

    if (!onSubmit) return true;

    setIsSubmitting(true);
    try {
      await onSubmit(values);
      return true;
    } catch (error: any) {
      if (showErrorAlerts) {
        Alert.alert('Error', error.message || 'An error occurred while submitting the form');
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [validateAllFields, onSubmit, values, errors, showErrorAlerts]);

  // Common email validation
  const emailValidator = useCallback((email: string): string | undefined => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return undefined;
  }, []);

  // Common password validation
  const passwordValidator = useCallback((password: string): string | undefined => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    return undefined;
  }, []);

  // Password confirmation validator generator
  const createPasswordConfirmValidator = useCallback((passwordFieldName: keyof T) => {
    return (confirmPassword: string): string | undefined => {
      if (confirmPassword !== formState[passwordFieldName]?.value) {
        return 'Passwords do not match';
      }
      return undefined;
    };
  }, [formState]);

  return {
    // State
    formState,
    values,
    errors,
    isValid,
    hasValues,
    isSubmitting,
    hasSubmitAttempted,

    // Actions
    setFieldValue,
    setFieldError,
    validateField,
    validateAllFields,
    handleSubmit,
    reset,

    // Common validators
    emailValidator,
    passwordValidator,
    createPasswordConfirmValidator,

    // Field helpers
    getFieldProps: (fieldName: keyof T) => ({
      value: formState[fieldName].value,
      onChangeText: (value: string) => setFieldValue(fieldName, value),
      error: formState[fieldName].error,
    }),
  };
};

// Pre-configured form configs for common auth scenarios
export const authFormConfigs = {
  signIn: {
    email: {
      required: true,
      validate: (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(email) ? 'Please enter a valid email address' : undefined;
      },
    },
    password: {
      required: true,
      validate: (password: string) => {
        return password.length < 8 ? 'Password must be at least 8 characters long' : undefined;
      },
    },
  },
  signUp: {
    email: {
      required: true,
      validate: (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(email) ? 'Please enter a valid email address' : undefined;
      },
    },
    password: {
      required: true,
      validate: (password: string) => {
        return password.length < 8 ? 'Password must be at least 8 characters long' : undefined;
      },
    },
    confirmPassword: {
      required: true,
    },
  },
  forgotPassword: {
    email: {
      required: true,
      validate: (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(email) ? 'Please enter a valid email address' : undefined;
      },
    },
  },
} as const;
