import { supabase } from '@/lib/supabase';
import { CarModel, Brand } from '@/types/database'; // Added Brand

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
        case 'PGRST116': // PostgREST error for schema switching related, often means resource not found or access issue
          this.userFriendlyMessage = "The requested data could not be found. Please try again later.";
          break;
        case '23505': // PostgreSQL unique violation
          this.userFriendlyMessage = "This item already exists or conflicts with existing data.";
          break;
        case '22P02': // PostgreSQL invalid text representation
          this.userFriendlyMessage = "There was a problem with the data format. Please check your input.";
          break;
        // Add more Supabase/PostgREST specific error codes here
        default:
          this.userFriendlyMessage = "An unexpected error occurred. Please try again.";
      }
    } else {
      this.userFriendlyMessage = "An unexpected server error occurred. Please try again later.";
    }

    // It's good practice to log the original error for debugging
    console.error(`ApiError: Code: ${this.code}, Message: ${this.message}`);
  }
}

export interface FetchCarModelsOptions {
  limit?: number;
  searchQuery?: string;
  category?: string;
  brandName?: string; // Added for potential brand filtering
}

// Car Models API
export async function fetchCarModels(options: FetchCarModelsOptions = {}): Promise<CarModel[]> {
  const { limit = 50, searchQuery, category, brandName } = options;

  try {
    let query = supabase
      .from('car_models')
      .select(`
        id,
        name,
        year,
        image_url,
        description,
        category,
        brand_id,
        brands!inner (
          id,
          name,
          logo_url
        )
      `)
      .eq('is_active', true);

    if (searchQuery) {
      // Using or condition for searching in name, description, or brand name
      // Note: Supabase textSearch (fts) would be more performant for larger datasets and complex queries
      // but requires tsvector columns. For now, ilike is a simpler approach.
      const searchTerm = `%${searchQuery.trim().toLowerCase()}%`;
      query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm},brands.name.ilike.${searchTerm}`);
    }

    if (category && category !== 'All') {
      // Assumes category is an array in Supabase and we're checking if it contains the selected category
      // Adjust if your schema is different (e.g., category is a string column)
      query = query.contains('category', [category]);
    }

    if (brandName) {
      query = query.ilike('brands.name', `%${brandName.trim().toLowerCase()}%`);
    }

    query = query.order('name').limit(limit);

    const { data, error } = await query;

    if (error) throw new ApiError(error.message, error.code, 'Could not retrieve car models at this time.');
    
    // Transform the data to match our CarModel interface
    const transformedData = data?.map(item => ({
      ...item,
      brands: item.brands?.[0] || undefined // Take first brand from array
    })) || [];
    
    return transformedData;
  } catch (error) {
    // console.error('Error fetching car models:', error); // Logging is now handled within ApiError constructor
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Unknown error', undefined, 'Failed to fetch car models due to an unexpected issue.');
  }
}

export async function fetchBrandById(id: string): Promise<Brand | null> {
  if (!id || isNaN(parseInt(id))) { // Ensure id is a valid number string
    console.error('Invalid brand ID provided to fetchBrandById:', id);
    throw new ApiError('Invalid brand ID.', 'VALIDATION_ERROR', 'A valid brand identifier is required.');
  }
  try {
    const { data, error } = await supabase
      .from('brands')
      .select(`
        id,
        name,
        logo_url,
        description,
        category
      `)
      .eq('id', parseInt(id))
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Resource not found
        return null; // Brand not found or not active
      }
      throw new ApiError(error.message, error.code, `Could not retrieve details for the brand.`);
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Unknown error', undefined, 'Failed to fetch brand details due to an unexpected issue.');
  }
}

export async function fetchCarModelById(id: string): Promise<CarModel | null> {
  if (!id || isNaN(parseInt(id))) { // Ensure id is a valid number string
    console.error('Invalid car model ID provided to fetchCarModelById:', id);
    // Return null or throw error based on how you want to handle this in useApi
    // For useApi, throwing an error that it can catch is better.
    throw new ApiError('Invalid car model ID.', 'VALIDATION_ERROR', 'A valid car model identifier is required.');
  }
  try {
    const { data, error } = await supabase
      .from('car_models')
      .select(`
        id,
        name,
        year,
        image_url,
        description,
        category,
        brand_id,
        brands!inner (
          id,
          name,
          logo_url
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Resource not found
        return null; // Model not found or not active
      }
      throw new ApiError(error.message, error.code, `Could not retrieve details for the car model.`);
    }
    // if (!data) throw new ApiError('Car model not found', 'PGRST116', 'The requested car model could not be found.');
    
    // Transform the data to match our CarModel interface
    if (data) {
      return {
        ...data,
        brands: data.brands?.[0] || undefined // Take first brand from array
      };
    }
    
    return data; // null if not found
  } catch (error) {
    // console.error('Error fetching car model:', error); // Logging is now handled within ApiError constructor
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Unknown error', undefined, 'Failed to fetch car model details due to an unexpected issue.');
  }
}

export async function fetchPopularBrands(limit: number = 6): Promise<Brand[]> {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select(`
        id,
        name,
        logo_url
      `)
      .eq('is_active', true)
      // Add ordering if there's a popularity metric, e.g., .order('popularity_score', { ascending: false })
      .order('name', { ascending: true }) // Placeholder ordering
      .limit(limit);

    if (error) {
      throw new ApiError(error.message, error.code, 'Could not retrieve popular brands at this time.');
    }
    return data || [];
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Unknown error', undefined, 'Failed to fetch popular brands due to an unexpected issue.');
  }
}

// Database health check
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