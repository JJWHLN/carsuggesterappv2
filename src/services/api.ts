import { supabase } from '@/lib/supabase';
import {
  CarModel,
  Brand,
  VehicleListing,
  Review,
  Dealer,
  FeaturedCar,
  RecommendedCar,
  UserProfile,
  Bookmark,
} from '@/types/database-updated';

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export class ApiError extends Error {
  public userFriendlyMessage: string;

  constructor(
    message: string,
    public code?: string,
    userFriendlyMessage?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;

    if (userFriendlyMessage) {
      this.userFriendlyMessage = userFriendlyMessage;
    } else if (code) {
      switch (code) {
        case 'PGRST116': // PostgREST error for schema switching related, often means resource not found or access issue
          this.userFriendlyMessage =
            'The requested data could not be found. Please try again later.';
          break;
        case '23505': // PostgreSQL unique violation
          this.userFriendlyMessage =
            'This item already exists or conflicts with existing data.';
          break;
        case '22P02': // PostgreSQL invalid text representation
          this.userFriendlyMessage =
            'There was a problem with the data format. Please check your input.';
          break;
        // Add more Supabase/PostgREST specific error codes here
        default:
          this.userFriendlyMessage =
            'An unexpected error occurred. Please try again.';
      }
    } else {
      this.userFriendlyMessage =
        'An unexpected server error occurred. Please try again later.';
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
export async function fetchCarModels(
  options: FetchCarModelsOptions = {},
): Promise<CarModel[]> {
  const { limit = 50, searchQuery, category, brandName } = options;

  try {
    let query = supabase
      .from('car_models')
      .select(
        `
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
      `,
      )
      .eq('is_active', true);

    if (searchQuery) {
      // Using or condition for searching in name, description, or brand name
      // Note: Supabase textSearch (fts) would be more performant for larger datasets and complex queries
      // but requires tsvector columns. For now, ilike is a simpler approach.
      const searchTerm = `%${searchQuery.trim().toLowerCase()}%`;
      query = query.or(
        `name.ilike.${searchTerm},description.ilike.${searchTerm},brands.name.ilike.${searchTerm}`,
      );
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

    if (error)
      throw new ApiError(
        error.message,
        error.code,
        'Could not retrieve car models at this time.',
      );

    // Transform the data to match our CarModel interface
    const transformedData =
      data?.map((item) => ({
        ...item,
        brands: item.brands?.[0] || undefined, // Take first brand from array
      })) || [];

    return transformedData;
  } catch (error) {
    // logger.error('Error fetching car models:', error); // Logging is now handled within ApiError constructor
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error',
      undefined,
      'Failed to fetch car models due to an unexpected issue.',
    );
  }
}

export async function fetchBrandById(id: string): Promise<Brand | null> {
  if (!id || isNaN(parseInt(id))) {
    // Ensure id is a valid number string
    console.error('Invalid brand ID provided to fetchBrandById:', id);
    throw new ApiError(
      'Invalid brand ID.',
      'VALIDATION_ERROR',
      'A valid brand identifier is required.',
    );
  }
  try {
    const { data, error } = await supabase
      .from('brands')
      .select(
        `
        id,
        name,
        logo_url,
        description,
        category
      `,
      )
      .eq('id', parseInt(id))
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Resource not found
        return null; // Brand not found or not active
      }
      throw new ApiError(
        error.message,
        error.code,
        `Could not retrieve details for the brand.`,
      );
    }
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error',
      undefined,
      'Failed to fetch brand details due to an unexpected issue.',
    );
  }
}

export async function fetchCarModelById(id: string): Promise<CarModel | null> {
  if (!id || isNaN(parseInt(id))) {
    // Ensure id is a valid number string
    console.error('Invalid car model ID provided to fetchCarModelById:', id);
    // Return null or throw error based on how you want to handle this in useApi
    // For useApi, throwing an error that it can catch is better.
    throw new ApiError(
      'Invalid car model ID.',
      'VALIDATION_ERROR',
      'A valid car model identifier is required.',
    );
  }
  try {
    const { data, error } = await supabase
      .from('car_models')
      .select(
        `
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
      `,
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Resource not found
        return null; // Model not found or not active
      }
      throw new ApiError(
        error.message,
        error.code,
        `Could not retrieve details for the car model.`,
      );
    }
    // if (!data) throw new ApiError('Car model not found', 'PGRST116', 'The requested car model could not be found.');

    // Transform the data to match our CarModel interface
    if (data) {
      return {
        ...data,
        brands: data.brands?.[0] || undefined, // Take first brand from array
      };
    }

    return data; // null if not found
  } catch (error) {
    // logger.error('Error fetching car model:', error); // Logging is now handled within ApiError constructor
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error',
      undefined,
      'Failed to fetch car model details due to an unexpected issue.',
    );
  }
}

export async function fetchPopularBrands(limit: number = 6): Promise<Brand[]> {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select(
        `
        id,
        name,
        logo_url
      `,
      )
      .eq('is_active', true)
      // Add ordering if there's a popularity metric, e.g., .order('popularity_score', { ascending: false })
      .order('name', { ascending: true }) // Placeholder ordering
      .limit(limit);

    if (error) {
      throw new ApiError(
        error.message,
        error.code,
        'Could not retrieve popular brands at this time.',
      );
    }
    return data || [];
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error',
      undefined,
      'Failed to fetch popular brands due to an unexpected issue.',
    );
  }
}

// REAL SUPABASE IMPLEMENTATION: Replace mock functions with actual database queries
export const fetchCarById = async (id: string): Promise<Car | null> => {
  if (!id) {
    console.error('Invalid car ID provided to fetchCarById:', id);
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('vehicle_listings')
      .select(
        `
        *,
        dealers!inner (
          business_name,
          verified,
          rating
        )
      `,
      )
      .eq('id', id)
      .eq('status', 'active')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Car not found
      }
      throw new ApiError(
        error.message,
        error.code,
        'Could not retrieve car details.',
      );
    }

    if (!data) return null;

    // Transform database listing to Car type
    return {
      id: data.id,
      make: data.make,
      model: data.model,
      year: data.year,
      price: data.price,
      mileage: data.mileage || 0,
      location: data.location_city || data.location_state || 'Unknown',
      images: data.images || [],
      created_at: data.created_at,
      title: data.title,
      description: data.description,
      features: data.features || [],
      condition: data.condition,
      fuel_type: data.fuel_type,
      transmission: data.transmission,
      exterior_color: data.exterior_color,
      interior_color: data.interior_color,
      dealer: data.dealers
        ? {
            name: data.dealers.business_name,
            verified: data.dealers.verified || false,
          }
        : undefined,
    };
  } catch (error) {
    console.error('Error fetching car by ID:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error',
      undefined,
      'Failed to fetch car details.',
    );
  }
};

export const fetchCarComparison = async (
  carIds: string[],
): Promise<ComparisonData[]> => {
  if (!carIds || carIds.length === 0) {
    return [];
  }

  try {
    // Fetch cars and their reviews/ratings
    const { data: cars, error: carsError } = await supabase
      .from('vehicle_listings')
      .select(
        `
        *,
        dealers!inner (
          business_name,
          verified,
          rating
        )
      `,
      )
      .in('id', carIds)
      .eq('status', 'active');

    if (carsError) {
      throw new ApiError(
        carsError.message,
        carsError.code,
        'Could not retrieve cars for comparison.',
      );
    }

    if (!cars || cars.length === 0) {
      return [];
    }

    // Generate comparison data with calculated scores
    const comparisons: ComparisonData[] = cars.map((car) => {
      // Calculate scores based on car attributes
      const age = new Date().getFullYear() - car.year;
      const mileageScore = car.mileage
        ? Math.max(1, 5 - car.mileage / 50000)
        : 4;
      const dealerScore = car.dealers?.verified ? 5 : 3;
      const priceScore = car.price < 30000 ? 5 : car.price < 50000 ? 4 : 3;
      const conditionScore =
        car.condition === 'Excellent'
          ? 5
          : car.condition === 'Very Good'
            ? 4
            : 3;

      const overallScore =
        (mileageScore + dealerScore + priceScore + conditionScore) / 4;

      return {
        car: { id: car.id },
        scores: {
          overall: Math.round(overallScore * 10) / 10,
          value: priceScore,
          reliability: mileageScore,
          features: car.features?.length
            ? Math.min(5, car.features.length / 2)
            : 3,
          efficiency:
            car.fuel_type === 'Electric'
              ? 5
              : car.fuel_type === 'Hybrid'
                ? 4
                : 3,
        },
        strengths: [
          ...(car.condition === 'Excellent' ? ['Excellent condition'] : []),
          ...(car.mileage && car.mileage < 50000 ? ['Low mileage'] : []),
          ...(car.dealers?.verified ? ['Verified dealer'] : []),
          ...(car.features?.length ? ['Well-equipped'] : []),
        ],
        weaknesses: [
          ...(age > 5 ? ['Older model'] : []),
          ...(car.mileage && car.mileage > 100000 ? ['High mileage'] : []),
          ...(car.price > 50000 ? ['Premium pricing'] : []),
        ],
        recommendation: `This ${car.make} ${car.model} offers ${priceScore >= 4 ? 'excellent' : 'good'} value with ${conditionScore >= 4 ? 'premium' : 'reliable'} condition. ${dealerScore >= 4 ? 'Verified dealer ensures quality.' : 'Consider dealer verification.'}`,
      };
    });

    return comparisons;
  } catch (error) {
    console.error('Error fetching car comparison:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error',
      undefined,
      'Failed to fetch car comparison data.',
    );
  }
};

export const fetchSimilarCars = async (carId: string): Promise<Car[]> => {
  if (!carId) {
    return [];
  }

  try {
    // First, get the reference car
    const referenceCar = await fetchCarById(carId);
    if (!referenceCar) {
      return [];
    }

    // Find similar cars based on make, model, year, and price range
    const { data, error } = await supabase
      .from('vehicle_listings')
      .select(
        `
        *,
        dealers!inner (
          business_name,
          verified,
          rating
        )
      `,
      )
      .eq('status', 'active')
      .neq('id', carId) // Exclude the reference car
      .or(`make.eq.${referenceCar.make},model.eq.${referenceCar.model}`)
      .gte('price', referenceCar.price * 0.8) // Price range: -20% to +20%
      .lte('price', referenceCar.price * 1.2)
      .gte('year', referenceCar.year - 2) // Year range: ±2 years
      .lte('year', referenceCar.year + 2)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      throw new ApiError(
        error.message,
        error.code,
        'Could not retrieve similar cars.',
      );
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform to Car type
    return data.map((car) => ({
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      price: car.price,
      mileage: car.mileage || 0,
      location: car.location_city || car.location_state || 'Unknown',
      images: car.images || [],
      created_at: car.created_at,
      title: car.title,
      description: car.description,
      features: car.features || [],
      condition: car.condition,
      fuel_type: car.fuel_type,
      transmission: car.transmission,
      exterior_color: car.exterior_color,
      interior_color: car.interior_color,
      dealer: car.dealers
        ? {
            name: car.dealers.business_name,
            verified: car.dealers.verified || false,
          }
        : undefined,
    }));
  } catch (error) {
    console.error('Error fetching similar cars:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error',
      undefined,
      'Failed to fetch similar cars.',
    );
  }
};

export const fetchCarReviews = async (carId: string): Promise<Review[]> => {
  if (!carId) {
    return [];
  }

  try {
    // First, get the car details to find the model
    const car = await fetchCarById(carId);
    if (!car) {
      return [];
    }

    // Find reviews for this car's make and model
    const { data, error } = await supabase
      .from('reviews')
      .select(
        `
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
      `,
      )
      .ilike('car_models.name', `%${car.model}%`)
      .eq('car_models.brands.name', car.make)
      .not('cs_score', 'is', null)
      .order('id', { ascending: false })
      .limit(10);

    if (error) {
      throw new ApiError(
        error.message,
        error.code,
        'Could not retrieve car reviews.',
      );
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform to Review type
    return data.map((review) => ({
      id: review.id.toString(),
      userId: 'anonymous',
      userName: 'CarSuggester Expert',
      rating: review.cs_score || 4,
      title: review.summary || 'Expert Review',
      comment:
        review.verdict ||
        review.performance ||
        'Professional review available.',
      date: new Date(review.id).toISOString().split('T')[0], // Use ID as date approximation
      verified: true,
      helpful: Math.floor(Math.random() * 20) + 5, // Random helpful count
      photos: review.car_models?.image_url ? [review.car_models.image_url] : [],
    }));
  } catch (error) {
    console.error('Error fetching car reviews:', error);
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof Error ? error.message : 'Unknown error',
      undefined,
      'Failed to fetch car reviews.',
    );
  }
};

// ===== CONTENT MANAGEMENT API METHODS =====
// These methods integrate your content-first strategy with the existing API

/**
 * Get car reviews with content management integration
 */
export async function getCarReviews(
  options: {
    carId?: string;
    limit?: number;
    sortBy?: 'latest' | 'popular' | 'rating';
  } = {},
): Promise<CarReview[]> {
  try {
    const contentService = ContentManagementService.getInstance();

    if (options.carId) {
      // Get reviews for specific car
      const review = await contentService.getReviewById(options.carId);
      return review ? [review] : [];
    } else {
      // Get published reviews with sorting
      return await contentService.getPublishedReviews({
        limit: options.limit || 20,
        sortBy: options.sortBy || 'latest',
      });
    }
  } catch (error) {
    console.error('Error fetching car reviews:', error);
    throw new ApiError('Failed to fetch reviews', 'REVIEW_FETCH_ERROR');
  }
}

/**
 * Get car models with review integration for content strategy
 */
export async function getCarModelsWithReviews(
  options: FetchCarModelsOptions = {},
): Promise<CarListingForReview[]> {
  try {
    const contentService = ContentManagementService.getInstance();

    return await contentService.getCarListings({
      limit: options.limit || 20,
      make: options.brandName,
      hasReviews: true, // Focus on cars with reviews for traffic
      sortBy: 'popular',
    });
  } catch (error) {
    console.error('Error fetching car models with reviews:', error);
    throw new ApiError(
      'Failed to fetch car models with reviews',
      'CAR_MODELS_REVIEW_ERROR',
    );
  }
}

/**
 * Search across reviews and cars for content discovery
 */
export async function searchContentAndCars(searchTerm: string): Promise<{
  reviews: CarReview[];
  cars: CarListingForReview[];
}> {
  try {
    const contentService = ContentManagementService.getInstance();

    const [reviews, cars] = await Promise.all([
      contentService.searchReviews(searchTerm, 10),
      contentService.getCarListings({
        // Simulated search by filtering popular cars
        limit: 10,
        sortBy: 'popular',
      }),
    ]);

    // Filter cars by search term in make/model
    const filteredCars = cars.filter(
      (car) =>
        car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.model.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    return {
      reviews,
      cars: filteredCars,
    };
  } catch (error) {
    console.error('Error searching content and cars:', error);
    throw new ApiError('Failed to search content', 'CONTENT_SEARCH_ERROR');
  }
}

/**
 * Get featured content for homepage (supports content-first strategy)
 */
export async function getFeaturedContent(): Promise<{
  featuredReviews: CarReview[];
  popularCars: CarListingForReview[];
  recentReviews: CarReview[];
}> {
  try {
    const contentService = ContentManagementService.getInstance();

    const [featuredReviews, popularCars, recentReviews] = await Promise.all([
      contentService.getFeaturedReviews(3),
      contentService.getCarListings({ limit: 6, sortBy: 'popular' }),
      contentService.getRecentReviews(5),
    ]);

    return {
      featuredReviews,
      popularCars,
      recentReviews,
    };
  } catch (error) {
    console.error('Error fetching featured content:', error);
    throw new ApiError(
      'Failed to fetch featured content',
      'FEATURED_CONTENT_ERROR',
    );
  }
}

/**
 * Get analytics data for business insights
 */
export async function getContentAnalytics(): Promise<{
  totalReviews: number;
  totalViews: number;
  totalLikes: number;
  averageRating: number;
  popularCars: string[];
  trafficGrowth: number; // Percentage growth indicator
}> {
  try {
    const contentService = ContentManagementService.getInstance();
    const analytics = await contentService.getContentAnalytics();

    // Calculate traffic growth (mock calculation for demo)
    const trafficGrowth =
      analytics.totalViews > 0
        ? Math.min(100, Math.round((analytics.totalViews / 100) * 10))
        : 0;

    return {
      ...analytics,
      trafficGrowth,
    };
  } catch (error) {
    console.error('Error fetching content analytics:', error);
    throw new ApiError('Failed to fetch analytics', 'ANALYTICS_ERROR');
  }
}

/**
 * Create a new review (for your content strategy)
 */
export async function createCarReview(reviewData: {
  carMake: string;
  carModel: string;
  carYear: number;
  reviewerName: string;
  rating: number;
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  finalVerdict: string;
  isFeatured?: boolean;
}): Promise<CarReview> {
  try {
    const contentService = ContentManagementService.getInstance();

    return await contentService.createReview({
      car_make: reviewData.carMake,
      car_model: reviewData.carModel,
      car_year: reviewData.carYear,
      reviewer_name: reviewData.reviewerName,
      reviewer_title: 'Car Enthusiast',
      rating: reviewData.rating,
      title: reviewData.title,
      content: reviewData.content,
      pros: reviewData.pros,
      cons: reviewData.cons,
      final_verdict: reviewData.finalVerdict,
      is_featured: reviewData.isFeatured || false,
      is_published: true,
      tags: [],
      publish_date: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating car review:', error);
    throw new ApiError('Failed to create review', 'REVIEW_CREATE_ERROR');
  }
}

// Add types for the new functions
interface ComparisonData {
  car: { id: string };
  scores: {
    overall: number;
    value: number;
    reliability: number;
    features: number;
    efficiency: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  verified: boolean;
  helpful: number;
  photos: string[];
}

// Database health check
export async function checkDatabaseHealth(): Promise<{
  isHealthy: boolean;
  error?: string;
}> {
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
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
