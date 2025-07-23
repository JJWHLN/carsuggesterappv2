/**
 * EMERGENCY FIX: Schema-Compatible Service
 * Wraps your existing complex service to work with actual database schema
 */

import { CarService } from './SimpleCarService';
import { logger } from '@/utils/logger';

/**
 * Emergency wrapper that makes your existing marketplace code work
 * Maps car_listings_master to the expected vehicle_listings format
 */
export async function fetchVehicleListings(
  page: number = 0,
  limit: number = 10,
  searchQuery?: string
) {
  try {
    logger.info('🚨 EMERGENCY: Using schema-compatible fetchVehicleListings');
    
    // Use our working CarService instead of broken supabaseService
    let cars;
    
    if (searchQuery && searchQuery.trim()) {
      cars = await CarService.searchCars(searchQuery.trim());
    } else {
      cars = await CarService.getAllCars();
    }

    // Apply pagination
    const startIndex = page * limit;
    const endIndex = startIndex + limit;
    const paginatedCars = cars.slice(startIndex, endIndex);

    // Map to expected format
    const result = {
      data: paginatedCars.map(car => ({
        id: car.id,
        make: car.make,
        model: car.model,
        year: car.year,
        price: car.starting_msrp,
        body_type: car.body_type,
        fuel_type: car.fuel_type,
        transmission: car.transmission,
        mileage: 0, // Not in master table
        condition: 'new', // Default for master listings
        exterior_color: 'Various',
        features: car.key_features || [],
        images: [], // Not in master table yet
        dealer_name: 'CarSuggester',
        location: 'Multiple Locations',
        is_popular: car.is_popular,
        review_score: car.review_score,
        review_count: car.review_count,
        created_at: car.created_at,
        updated_at: car.updated_at,
      })),
      count: cars.length,
      hasMore: endIndex < cars.length,
      page,
      limit
    };

    logger.info(`✅ EMERGENCY: Successfully returned ${result.data.length} cars`);
    return result;

  } catch (error) {
    logger.error('❌ EMERGENCY: fetchVehicleListings failed:', error);
    return {
      data: [],
      count: 0,
      hasMore: false,
      page,
      limit,
      error: 'Failed to fetch vehicle listings'
    };
  }
}

/**
 * Test function to verify database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  return await CarService.testConnection();
}
