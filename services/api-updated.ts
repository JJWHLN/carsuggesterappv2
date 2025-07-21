import { supabase } from '@/lib/supabase';
import { 
  CarModel, 
  Brand, 
  VehicleListing, 
  Review as DatabaseReview, 
  Dealer, 
  FeaturedCar, 
  RecommendedCar, 
  UserProfile, 
  Bookmark,
  SearchFilters,
  CarSearchResult,
  CarRecommendation
} from '@/types/database-updated';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export class ApiError extends Error {
  public userFriendlyMessage: string;

  constructor(message: string, public code?: string, userFriendlyMessage?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;

    if (userFriendlyMessage) {
      this.userFriendlyMessage = userFriendlyMessage;
    } else if (code) {
      switch (code) {
        case 'PGRST116':
          this.userFriendlyMessage = "The requested data could not be found. Please try again later.";
          break;
        case '23505':
          this.userFriendlyMessage = "This item already exists or conflicts with existing data.";
          break;
        case '22P02':
          this.userFriendlyMessage = "There was a problem with the data format. Please check your input.";
          break;
        default:
          this.userFriendlyMessage = "An unexpected error occurred. Please try again.";
      }
    } else {
      this.userFriendlyMessage = "An unexpected server error occurred. Please try again later.";
    }

    console.error(`ApiError: Code: ${this.code}, Message: ${this.message}`);
  }
}

export interface FetchCarModelsOptions {
  limit?: number;
  searchQuery?: string;
  category?: string;
  brandName?: string;
  filters?: SearchFilters;
}

// ===== CAR MODELS & BRANDS =====

/**
 * Fetch car models from your actual Supabase schema
 */
export const fetchCarModels = async (options: FetchCarModelsOptions = {}): Promise<CarModel[]> => {
  try {
    const { limit = 20, searchQuery, category, brandName, filters } = options;

    let query = supabase
      .from('car_models')
      .select(`
        *,
        brands (
          id,
          name,
          logo_url
        )
      `)
      .eq('is_active', true);

    // Apply search filters
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,model.ilike.%${searchQuery}%`);
    }

    if (brandName) {
      query = query.eq('brands.name', brandName);
    }

    if (category) {
      query = query.contains('category', [category]);
    }

    // Apply detailed filters
    if (filters) {
      if (filters.yearMin) {
        query = query.gte('year', filters.yearMin);
      }
      if (filters.yearMax) {
        query = query.lte('year', filters.yearMax);
      }
      if (filters.priceMin) {
        query = query.gte('price_from', filters.priceMin);
      }
      if (filters.priceMax) {
        query = query.lte('price_to', filters.priceMax);
      }
      if (filters.fuelType) {
        query = query.eq('fuel_type', filters.fuelType);
      }
      if (filters.transmission) {
        query = query.eq('transmission', filters.transmission);
      }
    }

    query = query.order('name').limit(limit);

    const { data, error } = await query;

    if (error) {
      throw new ApiError(error.message, error.code);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching car models:', error);
    throw new ApiError('Failed to fetch car models', 'CAR_MODELS_FETCH_ERROR');
  }
};

/**
 * Fetch all car brands
 */
export const fetchBrands = async (): Promise<Brand[]> => {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw new ApiError(error.message, error.code);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching brands:', error);
    throw new ApiError('Failed to fetch brands', 'BRANDS_FETCH_ERROR');
  }
};

/**
 * Fetch featured cars from your schema
 */
export const fetchFeaturedCars = async (limit: number = 10): Promise<CarModel[]> => {
  try {
    const { data, error } = await supabase
      .from('featured_cars')
      .select(`
        *,
        car_models (
          *,
          brands (
            id,
            name,
            logo_url
          )
        )
      `)
      .order('priority')
      .limit(limit);

    if (error) {
      throw new ApiError(error.message, error.code);
    }

    return data?.map(item => item.car_models).filter(Boolean) || [];
  } catch (error) {
    console.error('Error fetching featured cars:', error);
    throw new ApiError('Failed to fetch featured cars', 'FEATURED_CARS_ERROR');
  }
};

/**
 * Fetch recommended cars
 */
export const fetchRecommendedCars = async (limit: number = 10): Promise<CarModel[]> => {
  try {
    const { data, error } = await supabase
      .from('recommended_cars')
      .select(`
        *,
        car_models (
          *,
          brands (
            id,
            name,
            logo_url
          )
        )
      `)
      .order('priority')
      .limit(limit);

    if (error) {
      throw new ApiError(error.message, error.code);
    }

    return data?.map(item => item.car_models).filter(Boolean) || [];
  } catch (error) {
    console.error('Error fetching recommended cars:', error);
    throw new ApiError('Failed to fetch recommended cars', 'RECOMMENDED_CARS_ERROR');
  }
};

/**
 * Fetch single car model by ID
 */
export const fetchCarById = async (id: string): Promise<CarModel | null> => {
  try {
    const { data, error } = await supabase
      .from('car_models')
      .select(`
        *,
        brands (
          id,
          name,
          logo_url,
          description
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new ApiError(error.message, error.code);
    }

    return data;
  } catch (error) {
    console.error('Error fetching car by ID:', error);
    return null;
  }
};

// ===== VEHICLE LISTINGS (MARKETPLACE) =====

/**
 * Fetch vehicle listings from dealers
 */
export const fetchVehicleListings = async (options: {
  limit?: number;
  offset?: number;
  filters?: SearchFilters;
  location?: string;
} = {}): Promise<VehicleListing[]> => {
  try {
    const { limit = 20, offset = 0, filters, location } = options;

    let query = supabase
      .from('vehicle_listings')
      .select(`
        *,
        dealers (
          business_name,
          verified,
          rating,
          city,
          state
        )
      `)
      .eq('status', 'active');

    // Apply filters
    if (filters) {
      if (filters.make) {
        query = query.eq('make', filters.make);
      }
      if (filters.model) {
        query = query.eq('model', filters.model);
      }
      if (filters.yearMin) {
        query = query.gte('year', filters.yearMin);
      }
      if (filters.yearMax) {
        query = query.lte('year', filters.yearMax);
      }
      if (filters.priceMin) {
        query = query.gte('price', filters.priceMin);
      }
      if (filters.priceMax) {
        query = query.lte('price', filters.priceMax);
      }
      if (filters.mileageMax) {
        query = query.lte('mileage', filters.mileageMax);
      }
      if (filters.fuelType) {
        query = query.eq('fuel_type', filters.fuelType);
      }
      if (filters.transmission) {
        query = query.eq('transmission', filters.transmission);
      }
      if (filters.condition) {
        query = query.eq('condition', filters.condition);
      }
    }

    if (location) {
      query = query.or(`location_city.ilike.%${location}%,location_state.ilike.%${location}%`);
    }

    query = query
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      throw new ApiError(error.message, error.code);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching vehicle listings:', error);
    throw new ApiError('Failed to fetch vehicle listings', 'VEHICLE_LISTINGS_ERROR');
  }
};

// ===== REVIEWS =====

/**
 * Fetch reviews for a car model
 */
export const fetchReviewsForCar = async (modelId: number): Promise<DatabaseReview[]> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        car_models (
          name,
          model,
          year,
          brands (
            name
          )
        )
      `)
      .eq('model_id', modelId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(error.message, error.code);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw new ApiError('Failed to fetch reviews', 'REVIEWS_FETCH_ERROR');
  }
};

// ===== SEARCH FUNCTIONALITY =====

/**
 * Advanced search across car models and vehicle listings
 */
export const searchCars = async (
  query: string,
  filters: SearchFilters = {},
  options: {
    page?: number;
    limit?: number;
    includeListings?: boolean;
  } = {}
): Promise<CarSearchResult> => {
  try {
    const { page = 1, limit = 20, includeListings = false } = options;
    const offset = (page - 1) * limit;

    // Search in car models
    let modelsQuery = supabase
      .from('car_models')
      .select(`
        *,
        brands (
          id,
          name,
          logo_url
        )
      `, { count: 'exact' })
      .eq('is_active', true);

    if (query) {
      modelsQuery = modelsQuery.or(`name.ilike.%${query}%,model.ilike.%${query}%`);
    }

    // Apply filters to models search
    if (filters.yearMin) modelsQuery = modelsQuery.gte('year', filters.yearMin);
    if (filters.yearMax) modelsQuery = modelsQuery.lte('year', filters.yearMax);
    if (filters.priceMin) modelsQuery = modelsQuery.gte('price_from', filters.priceMin);
    if (filters.priceMax) modelsQuery = modelsQuery.lte('price_to', filters.priceMax);
    if (filters.fuelType) modelsQuery = modelsQuery.eq('fuel_type', filters.fuelType);
    if (filters.transmission) modelsQuery = modelsQuery.eq('transmission', filters.transmission);

    modelsQuery = modelsQuery
      .order('name')
      .range(offset, offset + limit - 1);

    const { data: models, error: modelsError, count } = await modelsQuery;

    if (modelsError) {
      throw new ApiError(modelsError.message, modelsError.code);
    }

    return {
      cars: models || [],
      total: count || 0,
      page,
      limit,
      filters
    };
  } catch (error) {
    console.error('Error searching cars:', error);
    throw new ApiError('Failed to search cars', 'SEARCH_ERROR');
  }
};

// ===== USER BOOKMARKS =====

/**
 * Get user's bookmarked cars
 */
export const fetchUserBookmarks = async (userId: string): Promise<Bookmark[]> => {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(error.message, error.code);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    throw new ApiError('Failed to fetch bookmarks', 'BOOKMARKS_ERROR');
  }
};

/**
 * Add bookmark
 */
export const addBookmark = async (
  userId: string,
  targetType: string,
  targetId: string
): Promise<Bookmark> => {
  try {
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: userId,
        target_type: targetType,
        target_id: targetId
      })
      .select()
      .single();

    if (error) {
      throw new ApiError(error.message, error.code);
    }

    return data;
  } catch (error) {
    console.error('Error adding bookmark:', error);
    throw new ApiError('Failed to add bookmark', 'BOOKMARK_ADD_ERROR');
  }
};

/**
 * Remove bookmark
 */
export const removeBookmark = async (
  userId: string,
  targetType: string,
  targetId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('target_type', targetType)
      .eq('target_id', targetId);

    if (error) {
      throw new ApiError(error.message, error.code);
    }
  } catch (error) {
    console.error('Error removing bookmark:', error);
    throw new ApiError('Failed to remove bookmark', 'BOOKMARK_REMOVE_ERROR');
  }
};

// ===== SIMILAR CARS =====

/**
 * Find similar cars based on the current car's attributes
 */
export const fetchSimilarCars = async (carId: string): Promise<CarModel[]> => {
  try {
    // Get the current car details
    const currentCar = await fetchCarById(carId);
    if (!currentCar) {
      return [];
    }

    // Find similar cars based on brand, price range, and category
    let query = supabase
      .from('car_models')
      .select(`
        *,
        brands (
          id,
          name,
          logo_url
        )
      `)
      .eq('is_active', true)
      .neq('id', carId); // Exclude the current car

    // Similar by brand first
    if (currentCar.brand_id) {
      query = query.eq('brand_id', currentCar.brand_id);
    }

    // Similar price range (within 20% of the current car's price)
    if (currentCar.price_from) {
      const priceMin = currentCar.price_from * 0.8;
      const priceMax = currentCar.price_from * 1.2;
      query = query.gte('price_from', priceMin).lte('price_from', priceMax);
    }

    const { data, error } = await query
      .order('name')
      .limit(6);

    if (error) {
      throw new ApiError(error.message, error.code);
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching similar cars:', error);
    return [];
  }
};

// ===== DATABASE HEALTH =====

/**
 * Check database connectivity and health
 */
export async function checkDatabaseHealth(): Promise<{ isHealthy: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('car_models')
      .select('count')
      .limit(1);

    if (error) {
      return { isHealthy: false, error: error.message };
    }

    return { isHealthy: true };
  } catch (error) {
    return { 
      isHealthy: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// ===== CONTENT FOR HOMEPAGE =====

/**
 * Get all data needed for the homepage
 */
export const fetchHomepageContent = async (): Promise<{
  featuredCars: CarModel[];
  recommendedCars: CarModel[];
  popularBrands: Brand[];
  recentListings: VehicleListing[];
}> => {
  try {
    const [featuredCars, recommendedCars, popularBrands, recentListings] = await Promise.all([
      fetchFeaturedCars(6),
      fetchRecommendedCars(8),
      fetchBrands(),
      fetchVehicleListings({ limit: 10 })
    ]);

    return {
      featuredCars,
      recommendedCars,
      popularBrands: popularBrands.slice(0, 8), // Top 8 brands
      recentListings
    };
  } catch (error) {
    console.error('Error fetching homepage content:', error);
    throw new ApiError('Failed to fetch homepage content', 'HOMEPAGE_CONTENT_ERROR');
  }
};

export default {
  fetchCarModels,
  fetchBrands,
  fetchFeaturedCars,
  fetchRecommendedCars,
  fetchCarById,
  fetchVehicleListings,
  fetchReviewsForCar,
  searchCars,
  fetchUserBookmarks,
  addBookmark,
  removeBookmark,
  fetchSimilarCars,
  fetchHomepageContent,
  checkDatabaseHealth
};
