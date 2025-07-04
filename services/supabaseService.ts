import { supabase, testSupabaseConnection } from '@/lib/supabase';
import { DatabaseReview, DatabaseVehicleListing } from '@/types/database';

export class SupabaseError extends Error {
  constructor(message: string, public code?: string, public details?: string) {
    super(message);
    this.name = 'SupabaseError';
  }
}

// Cache for frequently accessed data
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

function getCacheKey(operation: string, params: any[]): string {
  return `${operation}-${JSON.stringify(params)}`;
}

function getFromCache<T>(key: string): T | null {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}

function setCache<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
  cache.set(key, { data, timestamp: Date.now(), ttl });
}

function handleSupabaseError(error: any): never {
  console.error('🔥 Supabase error details:', error);
  
  // Check if this is a network/fetch error
  if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
    console.error('❌ Network Error - Possible causes:');
    console.error('1. Incorrect Supabase URL or API key');
    console.error('2. CORS configuration issues in Supabase dashboard');
    console.error('3. Network connectivity problems');
    console.error('4. Supabase service temporarily unavailable');
    
    throw new SupabaseError(
      'Unable to connect to Supabase. Please check your configuration and try again.',
      'NETWORK_ERROR',
      'Failed to fetch data from Supabase'
    );
  }
  
  if (error?.message) {
    throw new SupabaseError(
      error.message,
      error.code,
      error.details
    );
  }
  
  throw new SupabaseError('An unexpected error occurred while fetching data');
}

// Input validation and sanitization
function validatePaginationParams(page: number, limit: number): void {
  if (!Number.isInteger(page) || page < 0) {
    throw new SupabaseError('Invalid page parameter', 'VALIDATION_ERROR');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new SupabaseError('Invalid limit parameter (must be 1-100)', 'VALIDATION_ERROR');
  }
}

function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/['"]/g, '') // Remove quotes that could break SQL
    .replace(/[;\-]/g, '') // Remove SQL injection patterns (semicolon and hyphen)
    .replace(/\s+/g, ' ') // Normalize whitespace
    .substring(0, 100); // Limit length
}

// Vehicle Listings with improved error handling and caching
export async function fetchVehicleListings(
  page: number = 0,
  limit: number = 10,
  searchQuery?: string
) {
  try {
    validatePaginationParams(page, limit);
    
    const cacheKey = getCacheKey('vehicleListings', [page, limit, searchQuery]);
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    console.log('🔍 Fetching vehicle listings from Supabase...', { page, limit, searchQuery });

    // Test connection first
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      throw new SupabaseError(
        'Cannot connect to Supabase. Please check your configuration.',
        'CONNECTION_ERROR'
      );
    }

    let query = supabase
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
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (searchQuery?.trim()) {
      const sanitizedQuery = sanitizeInput(searchQuery);
      if (sanitizedQuery) {
        query = query.or(
          `make.ilike.%${sanitizedQuery}%,model.ilike.%${sanitizedQuery}%,title.ilike.%${sanitizedQuery}%,location_city.ilike.%${sanitizedQuery}%,location_state.ilike.%${sanitizedQuery}%`
        );
      }
    }

    console.log('📡 Executing Supabase query for vehicle listings...');
    const { data, error } = await query;

    if (error) {
      console.error('❌ Supabase query error:', error);
      handleSupabaseError(error);
    }

    console.log('✅ Successfully fetched vehicle listings:', data?.length || 0);
    const result = data || [];
    setCache(cacheKey, result, 2 * 60 * 1000); // Cache for 2 minutes
    return result;
  } catch (error) {
    console.error('🔥 Error in fetchVehicleListings:', error);
    if (error instanceof SupabaseError) {
      throw error;
    }
    handleSupabaseError(error);
  }
}

// Enhanced Car Reviews function with comprehensive data fetching
export async function fetchCarReviews(
  page: number = 0,
  limit: number = 10,
  searchQuery?: string,
  sortBy: 'newest' | 'rating' | 'cs_score' = 'newest'
) {
  try {
    validatePaginationParams(page, limit);
    
    const cacheKey = getCacheKey('carReviews', [page, limit, searchQuery, sortBy]);
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    console.log('🔍 Fetching car reviews from Supabase...', { page, limit, searchQuery, sortBy });

    // Test connection first
    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      throw new SupabaseError(
        'Cannot connect to Supabase. Please check your configuration.',
        'CONNECTION_ERROR'
      );
    }

    let orderColumn = 'id';
    let ascending = false;
    
    switch (sortBy) {
      case 'rating':
      case 'cs_score':
        orderColumn = 'cs_score';
        ascending = false;
        break;
      default:
        orderColumn = 'id';
        ascending = false;
    }

    let query = supabase
      .from('reviews')
      .select(`
        *,
        car_models!inner (
          id,
          name,
          year,
          image_url,
          brands!inner (
            id,
            name,
            logo_url
          )
        )
      `)
      .not('cs_score', 'is', null) // Only include reviews with scores
      .order(orderColumn, { ascending })
      .range(page * limit, (page + 1) * limit - 1);

    if (searchQuery?.trim()) {
      const sanitizedQuery = sanitizeInput(searchQuery);
      if (sanitizedQuery) {
        query = query.or(
          `summary.ilike.%${sanitizedQuery}%,performance.ilike.%${sanitizedQuery}%,verdict.ilike.%${sanitizedQuery}%,car_models.name.ilike.%${sanitizedQuery}%,car_models.brands.name.ilike.%${sanitizedQuery}%`
        );
      }
    }

    console.log('📡 Executing Supabase query for reviews...');
    const { data, error } = await query;

    if (error) {
      console.error('❌ Supabase query error:', error);
      handleSupabaseError(error);
    }

    console.log('✅ Successfully fetched reviews:', data?.length || 0);
    const result = data || [];
    setCache(cacheKey, result, 5 * 60 * 1000); // Cache for 5 minutes
    return result;
  } catch (error) {
    console.error('🔥 Error in fetchCarReviews:', error);
    if (error instanceof SupabaseError) {
      throw error;
    }
    handleSupabaseError(error);
  }
}

// Featured Cars with better caching
export async function fetchFeaturedCars() {
  try {
    const cacheKey = getCacheKey('featuredCars', []);
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    console.log('🔍 Fetching featured cars from Supabase...');

    const { data, error } = await supabase
      .from('featured_cars')
      .select(`
        *,
        car_models!inner (
          *,
          brands!inner (
            name,
            logo_url
          )
        )
      `)
      .order('priority', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Featured cars query error:', error);
      handleSupabaseError(error);
    }

    console.log('✅ Successfully fetched featured cars:', data?.length || 0);
    const result = data || [];
    setCache(cacheKey, result, 10 * 60 * 1000); // Cache for 10 minutes
    return result;
  } catch (error) {
    console.error('🔥 Error in fetchFeaturedCars:', error);
    if (error instanceof SupabaseError) {
      throw error;
    }
    handleSupabaseError(error);
  }
}

// Recommended Cars with caching
export async function fetchRecommendedCars() {
  try {
    const cacheKey = getCacheKey('recommendedCars', []);
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    console.log('🔍 Fetching recommended cars from Supabase...');

    const { data, error } = await supabase
      .from('recommended_cars')
      .select(`
        *,
        car_models!inner (
          *,
          brands!inner (
            name,
            logo_url
          )
        )
      `)
      .order('priority', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ Recommended cars query error:', error);
      handleSupabaseError(error);
    }

    console.log('✅ Successfully fetched recommended cars:', data?.length || 0);
    const result = data || [];
    setCache(cacheKey, result, 10 * 60 * 1000); // Cache for 10 minutes
    return result;
  } catch (error) {
    console.error('🔥 Error in fetchRecommendedCars:', error);
    if (error instanceof SupabaseError) {
      throw error;
    }
    handleSupabaseError(error);
  }
}

// Enhanced search with better parameter validation
export async function searchVehiclesWithFilters(searchParams: {
  make?: string;
  model?: string;
  year?: number;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  features?: string[];
  condition?: string;
  fuelType?: string;
}) {
  try {
    // Validate search parameters
    if (searchParams.year && (searchParams.year < 1900 || searchParams.year > new Date().getFullYear() + 1)) {
      throw new SupabaseError('Invalid year parameter', 'VALIDATION_ERROR');
    }
    
    if (searchParams.minPrice && searchParams.minPrice < 0) {
      throw new SupabaseError('Invalid minimum price', 'VALIDATION_ERROR');
    }
    
    if (searchParams.maxPrice && searchParams.maxPrice < 0) {
      throw new SupabaseError('Invalid maximum price', 'VALIDATION_ERROR');
    }
    
    if (searchParams.minPrice && searchParams.maxPrice && searchParams.minPrice > searchParams.maxPrice) {
      throw new SupabaseError('Minimum price cannot be greater than maximum price', 'VALIDATION_ERROR');
    }

    const cacheKey = getCacheKey('searchVehicles', [searchParams]);
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    console.log('🔍 Searching vehicles with filters:', searchParams);

    let query = supabase
      .from('vehicle_listings')
      .select(`
        *,
        dealers!inner (
          business_name,
          verified,
          rating
        )
      `)
      .eq('status', 'active');

    if (searchParams.make) {
      query = query.ilike('make', `%${sanitizeInput(searchParams.make)}%`);
    }
    if (searchParams.model) {
      query = query.ilike('model', `%${sanitizeInput(searchParams.model)}%`);
    }
    if (searchParams.year) {
      query = query.eq('year', searchParams.year);
    }
    if (searchParams.minPrice) {
      query = query.gte('price', searchParams.minPrice);
    }
    if (searchParams.maxPrice) {
      query = query.lte('price', searchParams.maxPrice);
    }
    if (searchParams.location) {
      const sanitizedLocation = sanitizeInput(searchParams.location);
      query = query.or(
        `location_city.ilike.%${sanitizedLocation}%,location_state.ilike.%${sanitizedLocation}%`
      );
    }
    if (searchParams.condition) {
      query = query.eq('condition', searchParams.condition);
    }
    if (searchParams.fuelType) {
      query = query.eq('fuel_type', searchParams.fuelType);
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ Search vehicles query error:', error);
      handleSupabaseError(error);
    }

    console.log('✅ Successfully searched vehicles:', data?.length || 0);
    const result = data || [];
    setCache(cacheKey, result, 1 * 60 * 1000); // Cache for 1 minute (shorter for search results)
    return result;
  } catch (error) {
    console.error('🔥 Error in searchVehiclesWithFilters:', error);
    if (error instanceof SupabaseError) {
      throw error;
    }
    handleSupabaseError(error);
  }
}

export async function fetchReviewById(id: string): Promise<DatabaseReview | null> {
  if (!id || isNaN(parseInt(id))) { // Assuming review ID is a number
    throw new SupabaseError('Invalid review ID provided', 'VALIDATION_ERROR');
  }

  try {
    const cacheKey = getCacheKey('reviewById', [id]);
    const cached = getFromCache<DatabaseReview>(cacheKey);
    if (cached) return cached;

    console.log(`🔍 Fetching review by ID: ${id} from Supabase...`);

    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      throw new SupabaseError('Cannot connect to Supabase.', 'CONNECTION_ERROR');
    }

    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        car_models!inner (
          id,
          name,
          year,
          image_url,
          brands!inner (
            id,
            name,
            logo_url
          )
        )
      `)
      .eq('id', parseInt(id))
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Resource not found
        console.warn(`⚠️ Review with ID ${id} not found.`);
        return null;
      }
      console.error(`❌ Supabase query error fetching review ID ${id}:`, error);
      handleSupabaseError(error);
    }

    if (!data) {
      console.warn(`⚠️ No data returned for review ID ${id}, though no explicit error.`);
      return null;
    }

    console.log(`✅ Successfully fetched review ID ${id}`);
    setCache(cacheKey, data, 5 * 60 * 1000); // Cache for 5 minutes
    return data;

  } catch (error) {
    console.error(`🔥 Error in fetchReviewById for ID ${id}:`, error);
    if (error instanceof SupabaseError) {
      throw error;
    }
    handleSupabaseError(error);
  }
}


export async function fetchVehicleListingById(id: string): Promise<DatabaseVehicleListing | null> {
  if (!id || typeof id !== 'string' || id.trim() === '') {
    throw new SupabaseError('Invalid vehicle ID provided', 'VALIDATION_ERROR');
  }

  try {
    const cacheKey = getCacheKey('vehicleListingById', [id]);
    const cached = getFromCache<DatabaseVehicleListing>(cacheKey);
    if (cached) return cached;

    console.log(`🔍 Fetching vehicle listing by ID: ${id} from Supabase...`);

    const isConnected = await testSupabaseConnection();
    if (!isConnected) {
      throw new SupabaseError('Cannot connect to Supabase.', 'CONNECTION_ERROR');
    }

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
      .eq('id', sanitizeInput(id))
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // Resource not found
        console.warn(`⚠️ Vehicle listing with ID ${id} not found or not active.`);
        return null; // Explicitly return null if not found
      }
      console.error(`❌ Supabase query error fetching vehicle ID ${id}:`, error);
      handleSupabaseError(error);
    }

    if (!data) {
      console.warn(`⚠️ No data returned for vehicle listing ID ${id}, though no explicit error.`);
      return null;
    }

    console.log(`✅ Successfully fetched vehicle listing ID ${id}`);
    setCache(cacheKey, data, 5 * 60 * 1000); // Cache for 5 minutes
    return data;

  } catch (error) {
    console.error(`🔥 Error in fetchVehicleListingById for ID ${id}:`, error);
    if (error instanceof SupabaseError) {
      throw error;
    }
    handleSupabaseError(error);
  }
}


// User management functions with proper authentication
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      throw new SupabaseError('Failed to get current user', 'AUTH_ERROR', error.message);
    }
    
    return user;
  } catch (error) {
    if (error instanceof SupabaseError) {
      throw error;
    }
    handleSupabaseError(error);
  }
}

export async function signInWithEmail(email: string, password: string) {
  try {
    if (!email || !password) {
      throw new SupabaseError('Email and password are required', 'VALIDATION_ERROR');
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: sanitizeInput(email),
      password,
    });
    
    if (error) {
      throw new SupabaseError('Sign in failed', 'AUTH_ERROR', error.message);
    }
    
    return data;
  } catch (error) {
    if (error instanceof SupabaseError) {
      throw error;
    }
    handleSupabaseError(error);
  }
}

export async function signUpWithEmail(email: string, password: string) {
  try {
    if (!email || !password) {
      throw new SupabaseError('Email and password are required', 'VALIDATION_ERROR');
    }
    
    if (password.length < 8) {
      throw new SupabaseError('Password must be at least 8 characters long', 'VALIDATION_ERROR');
    }
    
    const { data, error } = await supabase.auth.signUp({
      email: sanitizeInput(email),
      password,
    });
    
    if (error) {
      throw new SupabaseError('Sign up failed', 'AUTH_ERROR', error.message);
    }
    
    return data;
  } catch (error) {
    if (error instanceof SupabaseError) {
      throw error;
    }
    handleSupabaseError(error);
  }
}

export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new SupabaseError('Sign out failed', 'AUTH_ERROR', error.message);
    }
    
    // Clear cache on sign out
    cache.clear();
  } catch (error) {
    if (error instanceof SupabaseError) {
      throw error;
    }
    handleSupabaseError(error);
  }
}

// Bookmarks management
export async function addBookmark(targetType: 'listing' | 'review' | 'model', targetId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new SupabaseError('User must be authenticated', 'AUTH_ERROR');
    }
    
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        target_type: targetType,
        target_id: sanitizeInput(targetId),
      })
      .select()
      .single();
    
    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new SupabaseError('Item already bookmarked', 'DUPLICATE_ERROR');
      }
      handleSupabaseError(error);
    }
    
    return data;
  } catch (error) {
    if (error instanceof SupabaseError) {
      throw error;
    }
    handleSupabaseError(error);
  }
}

export async function removeBookmark(targetType: 'listing' | 'review' | 'model', targetId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new SupabaseError('User must be authenticated', 'AUTH_ERROR');
    }
    
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', user.id)
      .eq('target_type', targetType)
      .eq('target_id', sanitizeInput(targetId));
    
    if (error) {
      handleSupabaseError(error);
    }
  } catch (error) {
    if (error instanceof SupabaseError) {
      throw error;
    }
    handleSupabaseError(error);
  }
}

export async function getUserBookmarks(targetType?: 'listing' | 'review' | 'model') {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new SupabaseError('User must be authenticated', 'AUTH_ERROR');
    }
    
    let query = supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (targetType) {
      query = query.eq('target_type', targetType);
    }
    
    const { data, error } = await query;
    
    if (error) {
      handleSupabaseError(error);
    }
    
    return data || [];
  } catch (error) {
    if (error instanceof SupabaseError) {
      throw error;
    }
    handleSupabaseError(error);
  }
}

// Cache management
export function clearCache(): void {
  cache.clear();
}

export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

// Legacy function names for backward compatibility
export const fetchCars = fetchVehicleListings;
export const fetchReviews = fetchCarReviews;
export const searchCarsWithAI = searchVehiclesWithFilters;