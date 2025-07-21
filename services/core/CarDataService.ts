/**
 * Core Car Data Service - Single Source of Truth
 * Consolidates all car-related data operations
 */

import { supabase } from '@/lib/supabase';
import { Car, CarModel, DatabaseVehicleListing } from '@/types/database';
import { transformDatabaseVehicleListingToCar } from '@/utils/dataTransformers';
import { ApiError } from '@/services/api';

export interface CarSearchFilters {
  make?: string;
  model?: string;
  yearRange?: { min: number; max: number };
  priceRange?: { min: number; max: number };
  mileageRange?: { min: number; max: number };
  location?: string;
  condition?: string[];
  fuelType?: string[];
  transmission?: string[];
}

export interface CarSearchOptions {
  filters: CarSearchFilters;
  searchTerm?: string;
  sortBy?: 'price' | 'year' | 'mileage' | 'created_at' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface CarSearchResult {
  cars: Car[];
  total: number;
  hasMore: boolean;
}

/**
 * Core Car Data Service
 * Handles all car-related data operations with consistent error handling
 */
export class CarDataService {
  private static instance: CarDataService;
  
  public static getInstance(): CarDataService {
    if (!CarDataService.instance) {
      CarDataService.instance = new CarDataService();
    }
    return CarDataService.instance;
  }

  /**
   * Search cars with comprehensive filtering
   */
  async searchCars(options: CarSearchOptions): Promise<CarSearchResult> {
    try {
      const { filters, searchTerm, sortBy = 'created_at', sortOrder = 'desc', limit = 20, offset = 0 } = options;
      
      let query = supabase
        .from('vehicle_listings')
        .select(`
          *,
          dealers!inner (
            business_name,
            verified,
            rating
          )
        `, { count: 'exact' })
        .eq('status', 'active');

      // Apply filters
      if (filters.make) {
        query = query.ilike('make', `%${filters.make}%`);
      }

      if (filters.model) {
        query = query.ilike('model', `%${filters.model}%`);
      }

      if (filters.yearRange) {
        query = query.gte('year', filters.yearRange.min).lte('year', filters.yearRange.max);
      }

      if (filters.priceRange) {
        query = query.gte('price', filters.priceRange.min).lte('price', filters.priceRange.max);
      }

      if (filters.mileageRange) {
        query = query.gte('mileage', filters.mileageRange.min).lte('mileage', filters.mileageRange.max);
      }

      if (filters.condition && filters.condition.length > 0) {
        query = query.in('condition', filters.condition);
      }

      if (filters.fuelType && filters.fuelType.length > 0) {
        query = query.in('fuel_type', filters.fuelType);
      }

      if (filters.transmission && filters.transmission.length > 0) {
        query = query.in('transmission', filters.transmission);
      }

      // Search term across multiple fields
      if (searchTerm) {
        const searchPattern = `%${searchTerm.toLowerCase()}%`;
        query = query.or(`
          make.ilike.${searchPattern},
          model.ilike.${searchPattern},
          title.ilike.${searchPattern},
          description.ilike.${searchPattern}
        `);
      }

      // Location search
      if (filters.location) {
        const locationPattern = `%${filters.location.toLowerCase()}%`;
        query = query.or(`
          location_city.ilike.${locationPattern},
          location_state.ilike.${locationPattern}
        `);
      }

      // Sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw new ApiError(error.message, error.code, 'Unable to search cars at this time');
      }

      const cars = data?.map(listing => transformDatabaseVehicleListingToCar(listing as DatabaseVehicleListing)) || [];
      
      return {
        cars,
        total: count || 0,
        hasMore: (count || 0) > offset + limit
      };

    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error',
        undefined,
        'Failed to search cars. Please try again.'
      );
    }
  }

  /**
   * Get car by ID with full details
   */
  async getCarById(id: string): Promise<Car | null> {
    try {
      const { data, error } = await supabase
        .from('vehicle_listings')
        .select(`
          *,
          dealers!inner (
            business_name,
            verified,
            rating,
            phone,
            email,
            city,
            state
          )
        `)
        .eq('id', id)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new ApiError(error.message, error.code, 'Unable to load car details');
      }

      return data ? transformDatabaseVehicleListingToCar(data as DatabaseVehicleListing) : null;

    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        error instanceof Error ? error.message : 'Unknown error',
        undefined,
        'Failed to load car details'
      );
    }
  }

  /**
   * Get similar cars based on make, model, price range
   */
  async getSimilarCars(carId: string, limit: number = 5): Promise<Car[]> {
    try {
      // First get the reference car
      const referenceCar = await this.getCarById(carId);
      if (!referenceCar) return [];

      const { data, error } = await supabase
        .from('vehicle_listings')
        .select(`
          *,
          dealers!inner (
            business_name,
            verified,
            rating
          )
        `)
        .eq('status', 'active')
        .neq('id', carId)
        .or(`make.eq.${referenceCar.make},model.eq.${referenceCar.model}`)
        .gte('price', referenceCar.price * 0.8)
        .lte('price', referenceCar.price * 1.2)
        .gte('year', referenceCar.year - 2)
        .lte('year', referenceCar.year + 2)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new ApiError(error.message, error.code, 'Unable to find similar cars');
      }

      return data?.map(listing => transformDatabaseVehicleListingToCar(listing as DatabaseVehicleListing)) || [];

    } catch (error) {
      if (error instanceof ApiError) throw error;
      return []; // Return empty array for similar cars failures
    }
  }

  /**
   * Get featured cars for homepage
   */
  async getFeaturedCars(limit: number = 10): Promise<Car[]> {
    try {
      const { data, error } = await supabase
        .from('vehicle_listings')
        .select(`
          *,
          dealers!inner (
            business_name,
            verified,
            rating
          )
        `)
        .eq('status', 'active')
        .eq('is_featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new ApiError(error.message, error.code, 'Unable to load featured cars');
      }

      return data?.map(listing => transformDatabaseVehicleListingToCar(listing as DatabaseVehicleListing)) || [];

    } catch (error) {
      if (error instanceof ApiError) throw error;
      return []; // Return empty array for non-critical featured cars
    }
  }

  /**
   * Get cars by make/brand
   */
  async getCarsByMake(make: string, limit: number = 20): Promise<Car[]> {
    return this.searchCars({
      filters: { make },
      limit,
      sortBy: 'created_at',
      sortOrder: 'desc'
    }).then(result => result.cars);
  }

  /**
   * Get recent cars
   */
  async getRecentCars(limit: number = 20): Promise<Car[]> {
    return this.searchCars({
      filters: {},
      limit,
      sortBy: 'created_at',
      sortOrder: 'desc'
    }).then(result => result.cars);
  }

  /**
   * Get popular car makes with counts
   */
  async getPopularMakes(): Promise<{ make: string; count: number }[]> {
    try {
      const { data, error } = await supabase
        .from('vehicle_listings')
        .select('make')
        .eq('status', 'active');

      if (error) {
        throw new ApiError(error.message, error.code, 'Unable to load car makes');
      }

      // Count occurrences
      const makeCounts = data?.reduce((acc: Record<string, number>, car) => {
        const make = car.make;
        acc[make] = (acc[make] || 0) + 1;
        return acc;
      }, {}) || {};

      // Sort by count and return top makes
      return Object.entries(makeCounts)
        .map(([make, count]) => ({ make, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    } catch (error) {
      if (error instanceof ApiError) throw error;
      return [];
    }
  }

  /**
   * Get price ranges for filtering
   */
  async getPriceRanges(): Promise<{ min: number; max: number; segments: Array<{ min: number; max: number; label: string }> }> {
    try {
      const { data, error } = await supabase
        .from('vehicle_listings')
        .select('price')
        .eq('status', 'active')
        .not('price', 'is', null);

      if (error) {
        throw new ApiError(error.message, error.code, 'Unable to load price ranges');
      }

      const prices = data?.map(car => car.price).filter(price => price > 0) || [];
      
      if (prices.length === 0) {
        return {
          min: 0,
          max: 100000,
          segments: [
            { min: 0, max: 15000, label: 'Under $15k' },
            { min: 15000, max: 30000, label: '$15k - $30k' },
            { min: 30000, max: 50000, label: '$30k - $50k' },
            { min: 50000, max: 100000, label: '$50k+' }
          ]
        };
      }

      const min = Math.min(...prices);
      const max = Math.max(...prices);

      return {
        min,
        max,
        segments: [
          { min: 0, max: 15000, label: 'Under $15k' },
          { min: 15000, max: 30000, label: '$15k - $30k' },
          { min: 30000, max: 50000, label: '$30k - $50k' },
          { min: 50000, max: 100000, label: '$50k - $100k' },
          { min: 100000, max: max, label: '$100k+' }
        ]
      };

    } catch (error) {
      // Return default ranges on error
      return {
        min: 0,
        max: 100000,
        segments: [
          { min: 0, max: 15000, label: 'Under $15k' },
          { min: 15000, max: 30000, label: '$15k - $30k' },
          { min: 30000, max: 50000, label: '$30k - $50k' },
          { min: 50000, max: 100000, label: '$50k+' }
        ]
      };
    }
  }
}

export default CarDataService;
