/**
 * Form validation utilities for React Native forms
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormField {
  name: string;
  value: any;
  rules: ValidationRule;
}

/**
 * Validate a single field
 */
export function validateField(
  fieldName: string,
  value: any,
  rules: ValidationRule,
): string | null {
  // Required validation
  if (
    rules.required &&
    (value === null || value === undefined || value === '')
  ) {
    return `${fieldName} is required`;
  }

  // Skip other validations if field is empty and not required
  if (
    !rules.required &&
    (value === null || value === undefined || value === '')
  ) {
    return null;
  }

  // String validations
  if (typeof value === 'string') {
    if (rules.minLength && value.length < rules.minLength) {
      return `${fieldName} must be at least ${rules.minLength} characters`;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return `${fieldName} must be no more than ${rules.maxLength} characters`;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return `${fieldName} format is invalid`;
    }
  }

  // Number validations
  if (
    typeof value === 'number' ||
    (typeof value === 'string' && !isNaN(Number(value)))
  ) {
    const numValue = typeof value === 'number' ? value : Number(value);

    if (rules.min !== undefined && numValue < rules.min) {
      return `${fieldName} must be at least ${rules.min}`;
    }

    if (rules.max !== undefined && numValue > rules.max) {
      return `${fieldName} must be no more than ${rules.max}`;
    }
  }

  // Custom validation
  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) {
      return customError;
    }
  }

  return null;
}

/**
 * Validate multiple fields
 */
export function validateForm(fields: FormField[]): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of fields) {
    const error = validateField(field.name, field.value, field.rules);
    if (error) {
      errors.push({
        field: field.name,
        message: error,
      });
    }
  }

  return errors;
}

/**
 * Common validation rules
 */
export const ValidationRules = {
  required: { required: true },

  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },

  phone: {
    pattern: /^[\+]?[1-9][\d]{0,15}$/,
  },

  year: {
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 2,
  },

  price: {
    required: true,
    min: 0,
    max: 10000000,
  },

  mileage: {
    min: 0,
    max: 1000000,
  },

  make: {
    required: true,
    minLength: 2,
    maxLength: 50,
  },

  model: {
    required: true,
    minLength: 1,
    maxLength: 50,
  },

  location: {
    required: true,
    minLength: 3,
    maxLength: 100,
  },

  description: {
    maxLength: 2000,
  },

  zipCode: {
    pattern: /^\d{5}(-\d{4})?$/,
  },

  vin: {
    pattern: /^[A-HJ-NPR-Z0-9]{17}$/,
    custom: (value: string) => {
      if (!value) return null;
      if (value.length !== 17) {
        return 'VIN must be exactly 17 characters';
      }
      // Add VIN checksum validation if needed
      return null;
    },
  },
};

/**
 * Vehicle-specific validation rules
 */
export const VehicleValidationRules = {
  make: ValidationRules.make,
  model: ValidationRules.model,
  year: ValidationRules.year,
  price: ValidationRules.price,
  mileage: ValidationRules.mileage,
  location: ValidationRules.location,
  description: ValidationRules.description,
  vin: ValidationRules.vin,

  condition: {
    required: true,
    custom: (value: string) => {
      const validConditions = [
        'new',
        'like new',
        'excellent',
        'good',
        'fair',
        'poor',
      ];
      if (!validConditions.includes(value?.toLowerCase())) {
        return 'Please select a valid condition';
      }
      return null;
    },
  },

  fuelType: {
    custom: (value: string) => {
      if (!value) return null;
      const validTypes = [
        'gasoline',
        'diesel',
        'hybrid',
        'electric',
        'plug-in hybrid',
      ];
      if (!validTypes.includes(value?.toLowerCase())) {
        return 'Please select a valid fuel type';
      }
      return null;
    },
  },

  transmission: {
    custom: (value: string) => {
      if (!value) return null;
      const validTypes = ['automatic', 'manual', 'cvt'];
      if (!validTypes.includes(value?.toLowerCase())) {
        return 'Please select a valid transmission type';
      }
      return null;
    },
  },
};

/**
 * Helper function to format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';

  if (errors.length === 1) {
    return errors[0].message;
  }

  return errors.map((error) => `• ${error.message}`).join('\n');
}

/**
 * Helper function to get first error for a specific field
 */
export function getFieldError(
  errors: ValidationError[],
  fieldName: string,
): string | null {
  const fieldError = errors.find((error) => error.field === fieldName);
  return fieldError ? fieldError.message : null;
}

/**
 * Helper function to check if form has any errors
 */
export function hasValidationErrors(errors: ValidationError[]): boolean {
  return errors.length > 0;
}

/**
 * Sanitize input values
 */
export const sanitizeInput = {
  text: (value: string): string => {
    return value?.trim() || '';
  },

  number: (value: string | number): number | null => {
    if (typeof value === 'number') return value;
    const num = parseFloat(value?.toString() || '');
    return isNaN(num) ? null : num;
  },

  integer: (value: string | number): number | null => {
    if (typeof value === 'number') return Math.floor(value);
    const num = parseInt(value?.toString() || '', 10);
    return isNaN(num) ? null : num;
  },

  currency: (value: string | number): number | null => {
    const cleanValue =
      typeof value === 'string'
        ? value.replace(/[$,]/g, '')
        : value?.toString() || '';
    const num = parseFloat(cleanValue);
    return isNaN(num) ? null : Math.round(num * 100) / 100;
  },

  phone: (value: string): string => {
    return value?.replace(/[^\d+]/g, '') || '';
  },

  zipCode: (value: string): string => {
    return value?.replace(/[^\d-]/g, '') || '';
  },

  vin: (value: string): string => {
    return value?.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '') || '';
  },
};
