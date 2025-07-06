import { 
  validateField, 
  validateForm, 
  VehicleValidationRules, 
  formatValidationErrors,
  sanitizeInput
} from '@/utils/validation';

describe('Validation Utilities', () => {
  describe('validateField', () => {
    it('should validate required fields', () => {
      const error = validateField('make', '', VehicleValidationRules.make);
      expect(error).toContain('required');
    });

    it('should validate minimum length', () => {
      const error = validateField('make', 'X', VehicleValidationRules.make);
      expect(error).toContain('at least 2 characters');
    });

    it('should validate maximum length', () => {
      const longMake = 'X'.repeat(51);
      const error = validateField('make', longMake, VehicleValidationRules.make);
      expect(error).toContain('no more than 50 characters');
    });

    it('should validate year range', () => {
      const error = validateField('year', 1800, VehicleValidationRules.year);
      expect(error).toContain('must be at least 1900');
    });

    it('should validate price minimum', () => {
      const error = validateField('price', -1000, VehicleValidationRules.price);
      expect(error).toContain('must be at least 0');
    });

    it('should pass valid data', () => {
      const error = validateField('make', 'Toyota', VehicleValidationRules.make);
      expect(error).toBeNull();
    });

    it('should validate custom conditions', () => {
      const error = validateField('condition', 'invalid', VehicleValidationRules.condition);
      expect(error).toContain('valid condition');
    });
  });

  describe('validateForm', () => {
    it('should validate multiple fields', () => {
      const fields = [
        {
          name: 'make',
          value: '',
          rules: VehicleValidationRules.make
        },
        {
          name: 'year',
          value: 1800,
          rules: VehicleValidationRules.year
        }
      ];

      const errors = validateForm(fields);
      expect(errors).toHaveLength(2);
      expect(errors[0].field).toBe('make');
      expect(errors[1].field).toBe('year');
    });

    it('should return empty array for valid data', () => {
      const fields = [
        {
          name: 'make',
          value: 'Toyota',
          rules: VehicleValidationRules.make
        },
        {
          name: 'year',
          value: 2020,
          rules: VehicleValidationRules.year
        }
      ];

      const errors = validateForm(fields);
      expect(errors).toHaveLength(0);
    });
  });

  describe('formatValidationErrors', () => {
    it('should format single error', () => {
      const errors = [{ field: 'make', message: 'Make is required' }];
      const formatted = formatValidationErrors(errors);
      expect(formatted).toBe('Make is required');
    });

    it('should format multiple errors', () => {
      const errors = [
        { field: 'make', message: 'Make is required' },
        { field: 'year', message: 'Year must be valid' }
      ];
      const formatted = formatValidationErrors(errors);
      expect(formatted).toContain('• Make is required');
      expect(formatted).toContain('• Year must be valid');
    });

    it('should handle empty errors', () => {
      const formatted = formatValidationErrors([]);
      expect(formatted).toBe('');
    });
  });

  describe('sanitizeInput', () => {
    it('should sanitize text input', () => {
      const result = sanitizeInput.text('  Toyota  ');
      expect(result).toBe('Toyota');
    });

    it('should sanitize number input', () => {
      const result = sanitizeInput.number('25000');
      expect(result).toBe(25000);
    });

    it('should handle invalid number input', () => {
      const result = sanitizeInput.number('not-a-number');
      expect(result).toBeNull();
    });

    it('should sanitize currency input', () => {
      const result = sanitizeInput.currency('$25,000');
      expect(result).toBe(25000);
    });

    it('should sanitize phone input', () => {
      const result = sanitizeInput.phone('(555) 123-4567');
      expect(result).toBe('5551234567');
    });

    it('should sanitize VIN input', () => {
      const result = sanitizeInput.vin('1hgcm82633a123456');
      expect(result).toBe('1HGCM82633A123456');
    });
  });
});
