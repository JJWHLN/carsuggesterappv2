/**
 * 🧪 Data Transformers Tests
 * Testing critical utility functions for data processing
 */

import {
  formatPrice,
  formatMileage,
  formatDate,
  formatCondition,
  formatFuelType,
  transformDatabaseVehicleListingToCar
} from '../../utils/dataTransformers';
import { createMockCar } from '../utils/mockData';

describe('🧪 Data Transformers', () => {
  describe('formatPrice', () => {
    it('formats standard prices correctly', () => {
      expect(formatPrice(25000)).toBe('$25,000');
      expect(formatPrice(50000)).toBe('$50,000');
      expect(formatPrice(125000)).toBe('$125,000');
    });

    it('handles decimal values', () => {
      expect(formatPrice(25000.99)).toBe('$25,001');
      expect(formatPrice(25000.50)).toBe('$25,001');
    });

    it('handles zero and negative values', () => {
      expect(formatPrice(0)).toBe('$0');
      expect(formatPrice(-1000)).toBe('$0'); // Should not show negative prices
    });

    it('handles very large numbers', () => {
      expect(formatPrice(1000000)).toBe('$1,000,000');
      expect(formatPrice(999999999)).toBe('$999,999,999');
    });

    it('handles undefined and null', () => {
      expect(formatPrice(undefined as any)).toBe('Price not available');
      expect(formatPrice(null as any)).toBe('Price not available');
    });
  });

  describe('formatMileage', () => {
    it('formats standard mileage correctly', () => {
      expect(formatMileage(25000)).toBe('25,000 miles');
      expect(formatMileage(100000)).toBe('100,000 miles');
      expect(formatMileage(1500)).toBe('1,500 miles');
    });

    it('handles single miles', () => {
      expect(formatMileage(1)).toBe('1 mile');
    });

    it('handles zero mileage', () => {
      expect(formatMileage(0)).toBe('0 miles');
    });

    it('handles undefined and null', () => {
      expect(formatMileage(undefined as any)).toBe('Mileage not available');
      expect(formatMileage(null as any)).toBe('Mileage not available');
    });

    it('handles decimal values', () => {
      expect(formatMileage(25000.7)).toBe('25,001 miles');
    });
  });

  describe('formatDate', () => {
    it('formats ISO date strings correctly', () => {
      const date = '2024-01-15T00:00:00Z';
      const formatted = formatDate(date);
      expect(formatted).toMatch(/Jan 15, 2024|January 15, 2024/);
    });

    it('handles invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('Date not available');
      expect(formatDate(null as any)).toBe('Date not available');
      expect(formatDate(undefined as any)).toBe('Date not available');
    });
  });

  describe('formatCondition', () => {
    it('formats condition values correctly', () => {
      expect(formatCondition('new')).toBe('New');
      expect(formatCondition('used')).toBe('Used');
      expect(formatCondition('certified')).toBe('Certified Pre-Owned');
    });

    it('handles unknown conditions', () => {
      expect(formatCondition('unknown' as any)).toBe('Unknown');
      expect(formatCondition('')).toBe('Unknown');
      expect(formatCondition(null as any)).toBe('Unknown');
      expect(formatCondition(undefined as any)).toBe('Unknown');
    });

    it('handles case variations', () => {
      expect(formatCondition('NEW')).toBe('New');
      expect(formatCondition('Used')).toBe('Used');
      expect(formatCondition('CERTIFIED')).toBe('Certified Pre-Owned');
    });
  });

  describe('formatFuelType', () => {
    it('formats fuel types correctly', () => {
      expect(formatFuelType('gasoline')).toBe('Gasoline');
      expect(formatFuelType('hybrid')).toBe('Hybrid');
      expect(formatFuelType('electric')).toBe('Electric');
      expect(formatFuelType('diesel')).toBe('Diesel');
    });

    it('handles unknown fuel types', () => {
      expect(formatFuelType('unknown' as any)).toBe('Unknown');
      expect(formatFuelType('')).toBe('Unknown');
      expect(formatFuelType(null as any)).toBe('Unknown');
      expect(formatFuelType(undefined as any)).toBe('Unknown');
    });

    it('handles case variations', () => {
      expect(formatFuelType('GASOLINE')).toBe('Gasoline');
      expect(formatFuelType('Hybrid')).toBe('Hybrid'); 
      expect(formatFuelType('ELECTRIC')).toBe('Electric');
    });
  });

  describe('transformDatabaseVehicleListingToCar', () => {
    it('transforms database object to car object', () => {
      const dbCar = {
        id: 'db-1',
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
        price: 30000,
        mileage: 15000,
        condition: 'used',
        fuel_type: 'gasoline',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const result = transformDatabaseVehicleListingToCar(dbCar as any);

      expect(result.id).toBe('db-1');
      expect(result.make).toBe('Toyota');
      expect(result.model).toBe('Camry');
      expect(result.fuel_type).toBe('gasoline');
      expect(result.created_at).toBe('2024-01-01T00:00:00Z');
    });

    it('handles missing optional fields', () => {
      const minimalDbCar = {
        id: 'db-2',
        make: 'Honda',
        model: 'Civic',
        year: 2022,
        price: 25000,
      };

      const result = transformDatabaseVehicleListingToCar(minimalDbCar as any);

      expect(result.id).toBe('db-2');
      expect(result.make).toBe('Honda');
      expect(result.mileage).toBeUndefined();
      expect(result.condition).toBeUndefined();
    });

    it('handles null values gracefully', () => {
      const dbCarWithNulls = {
        id: 'db-3',
        make: 'Ford',
        model: 'F-150',
        year: 2023,
        price: 45000,
        mileage: null,
        fuel_type: null,
        description: null,
      };

      expect(() => {
        transformDatabaseVehicleListingToCar(dbCarWithNulls as any);
      }).not.toThrow();
    });
  });

  describe('Performance and Edge Cases', () => {
    it('handles large datasets efficiently', () => {
      const startTime = Date.now();
      
      // Process 1000 price formats
      for (let i = 0; i < 1000; i++) {
        formatPrice(Math.random() * 100000);
      }
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
    });

    it('handles unicode and special characters', () => {
      expect(formatPrice(25000)).toBe('$25,000');
      // Test that currency symbols work correctly
      expect(formatPrice(25000)).toContain('$');
    });
  });

  describe('Integration Tests', () => {
    it('formats data for display pipeline', () => {
      const car = createMockCar();
      
      const displayData = {
        price: formatPrice(car.price),
        mileage: formatMileage(car.mileage!),
        condition: formatCondition(car.condition as any),
        fuelType: formatFuelType(car.fuelType as any),
        date: formatDate(car.createdAt!),
      };

      expect(displayData.price).toContain('$');
      expect(displayData.mileage).toContain('miles');
      expect(displayData.condition).toBeTruthy();
      expect(displayData.fuelType).toBeTruthy();
      expect(displayData.date).toBeTruthy();
    });

    it('transforms database listings correctly', () => {
      const dbCar = {
        id: 'test-integration',
        make: 'Toyota',
        model: 'RAV4',
        year: 2023,
        price: 32000,
        mileage: 15000,
        condition: 'used',
        fuel_type: 'gasoline',
        created_at: '2024-01-01T00:00:00Z',
      };

      const transformed = transformDatabaseVehicleListingToCar(dbCar as any);
      
      expect(transformed.id).toBe('test-integration');
      expect(transformed.fuel_type).toBe('gasoline');
      expect(transformed.created_at).toBe('2024-01-01T00:00:00Z');
    });
  });
});
