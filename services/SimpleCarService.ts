import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  starting_msrp: number;
  body_type: string;
  fuel_type: string;
  transmission: string;
  engine_size?: string;
  safety_rating?: number;
  fuel_economy_city?: number;
  fuel_economy_highway?: number;
  key_features?: string[];
  available_colors?: string[];
  is_popular: boolean;
  review_score?: number;
  review_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CarReview {
  id: string;
  car_make: string;
  car_model: string;
  car_year: number;
  reviewer_name: string;
  reviewer_title?: string;
  rating: number;
  title: string;
  content: string;
  pros?: string[];
  cons?: string[];
  final_verdict: string;
  images?: string[];
  video_url?: string;
  publish_date: string;
  is_featured: boolean;
  view_count: number;
  like_count: number;
  tags?: string[];
}

/**
 * CarService - Simplified service using your actual Supabase schema
 * Works with car_listings_master and car_reviews tables
 */
export class CarService {
  /**
   * Get all cars from your car_listings_master table
   */
  static async getAllCars(): Promise<Car[]> {
    try {
      logger.info('🚗 Fetching all cars from car_listings_master');
      
      const { data, error } = await supabase
        .from('car_listings_master')
        .select('*')
        .eq('status', 'active')
        .order('is_popular', { ascending: false })
        .order('review_count', { ascending: false });

      if (error) {
        logger.error('Failed to fetch cars:', error);
        return [];
      }

      logger.info(`✅ Successfully fetched ${data?.length || 0} cars`);
      return data || [];
    } catch (error) {
      logger.error('CarService.getAllCars error:', error);
      return [];
    }
  }

  /**
   * Get car by ID
   */
  static async getCarById(id: string): Promise<Car | null> {
    try {
      logger.info(`🔍 Fetching car with ID: ${id}`);
      
      const { data, error } = await supabase
        .from('car_listings_master')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        logger.error('Failed to fetch car by ID:', error);
        return null;
      }

      logger.info(`✅ Successfully fetched car: ${data?.make} ${data?.model}`);
      return data;
    } catch (error) {
      logger.error('CarService.getCarById error:', error);
      return null;
    }
  }

  /**
   * Search cars by make or model
   */
  static async searchCars(query: string): Promise<Car[]> {
    try {
      logger.info(`🔍 Searching cars with query: "${query}"`);
      
      const { data, error } = await supabase
        .from('car_listings_master')
        .select('*')
        .or(`make.ilike.%${query}%,model.ilike.%${query}%`)
        .eq('status', 'active')
        .order('is_popular', { ascending: false })
        .order('review_count', { ascending: false });

      if (error) {
        logger.error('Failed to search cars:', error);
        return [];
      }

      logger.info(`✅ Found ${data?.length || 0} cars matching "${query}"`);
      return data || [];
    } catch (error) {
      logger.error('CarService.searchCars error:', error);
      return [];
    }
  }

  /**
   * Get popular cars (based on your schema's is_popular flag)
   */
  static async getPopularCars(limit: number = 6): Promise<Car[]> {
    try {
      logger.info(`🔥 Fetching ${limit} popular cars`);
      
      const { data, error } = await supabase
        .from('car_listings_master')
        .select('*')
        .eq('status', 'active')
        .eq('is_popular', true)
        .order('review_count', { ascending: false })
        .order('review_score', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Failed to fetch popular cars:', error);
        return [];
      }

      logger.info(`✅ Successfully fetched ${data?.length || 0} popular cars`);
      return data || [];
    } catch (error) {
      logger.error('CarService.getPopularCars error:', error);
      return [];
    }
  }

  /**
   * Get reviews for a specific car
   */
  static async getCarReviews(make: string, model: string, year?: number): Promise<CarReview[]> {
    try {
      logger.info(`📝 Fetching reviews for ${make} ${model} ${year || 'all years'}`);
      
      let query = supabase
        .from('car_reviews')
        .select('*')
        .eq('car_make', make)
        .eq('car_model', model)
        .eq('is_published', true)
        .order('publish_date', { ascending: false });

      if (year) {
        query = query.eq('car_year', year);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to fetch car reviews:', error);
        return [];
      }

      logger.info(`✅ Found ${data?.length || 0} reviews for ${make} ${model}`);
      return data || [];
    } catch (error) {
      logger.error('CarService.getCarReviews error:', error);
      return [];
    }
  }

  /**
   * Get featured reviews (for homepage)
   */
  static async getFeaturedReviews(limit: number = 3): Promise<CarReview[]> {
    try {
      logger.info(`⭐ Fetching ${limit} featured reviews`);
      
      const { data, error } = await supabase
        .from('car_reviews')
        .select('*')
        .eq('is_published', true)
        .eq('is_featured', true)
        .order('publish_date', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Failed to fetch featured reviews:', error);
        return [];
      }

      logger.info(`✅ Successfully fetched ${data?.length || 0} featured reviews`);
      return data || [];
    } catch (error) {
      logger.error('CarService.getFeaturedReviews error:', error);
      return [];
    }
  }

  /**
   * Filter cars by criteria
   */
  static async filterCars(filters: {
    make?: string;
    bodyType?: string;
    fuelType?: string;
    minPrice?: number;
    maxPrice?: number;
    transmission?: string;
  }): Promise<Car[]> {
    try {
      logger.info('🔧 Filtering cars with criteria:', filters);
      
      let query = supabase
        .from('car_listings_master')
        .select('*')
        .eq('status', 'active');

      // Apply filters based on your schema
      if (filters.make) {
        query = query.eq('make', filters.make);
      }
      if (filters.bodyType) {
        query = query.eq('body_type', filters.bodyType);
      }
      if (filters.fuelType) {
        query = query.eq('fuel_type', filters.fuelType);
      }
      if (filters.transmission) {
        query = query.eq('transmission', filters.transmission);
      }
      if (filters.minPrice) {
        query = query.gte('starting_msrp', filters.minPrice);
      }
      if (filters.maxPrice) {
        query = query.lte('starting_msrp', filters.maxPrice);
      }

      query = query.order('is_popular', { ascending: false })
                   .order('review_count', { ascending: false });

      const { data, error } = await query;

      if (error) {
        logger.error('Failed to filter cars:', error);
        return [];
      }

      logger.info(`✅ Found ${data?.length || 0} cars matching filters`);
      return data || [];
    } catch (error) {
      logger.error('CarService.filterCars error:', error);
      return [];
    }
  }

  /**
   * Test database connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      logger.info('🔌 Testing database connection...');
      
      const { data, error } = await supabase
        .from('car_listings_master')
        .select('id, make, model')
        .limit(1);

      if (error) {
        logger.error('❌ Database connection failed:', error);
        return false;
      }

      logger.info('✅ Database connection successful!');
      logger.info('📊 Sample data:', data?.[0] || 'No data found');
      return true;
    } catch (error) {
      logger.error('❌ Database connection test failed:', error);
      return false;
    }
  }
}
