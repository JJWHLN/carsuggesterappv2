/**
 * Content Management Service
 * Handles the content-first strategy: Reviews → Traffic → Dealers → Listings
 * This service connects to your existing Supabase tables
 */

import { supabase } from '@/lib/supabase';

export interface CarReview {
  id: string;
  car_make: string;
  car_model: string;
  car_year: number;
  reviewer_name: string;
  reviewer_title?: string; // e.g., "Automotive Journalist", "Car Enthusiast"
  rating: number; // 1-5 stars
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  final_verdict: string;
  images?: string[];
  video_url?: string;
  publish_date: string;
  is_featured: boolean;
  is_published: boolean;
  view_count: number;
  like_count: number;
  tags: string[]; // e.g., ["luxury", "fuel-efficient", "family-car"]
  created_at: string;
  updated_at: string;
}

export interface CarListingForReview {
  id: string;
  make: string;
  model: string;
  year: number;
  price_range_min?: number;
  price_range_max?: number;
  body_type: string;
  fuel_type: string;
  transmission: string;
  engine_size?: string;
  safety_rating?: number;
  fuel_economy_city?: number;
  fuel_economy_highway?: number;
  key_features: string[];
  available_colors: string[];
  starting_msrp?: number;
  review_score?: number; // Average from reviews
  review_count: number;
  is_popular: boolean;
  status: 'active' | 'discontinued' | 'upcoming';
  created_at: string;
  updated_at: string;
}

export interface ReviewAnalytics {
  totalReviews: number;
  totalViews: number;
  totalLikes: number;
  averageRating: number;
  popularCars: string[];
  topPerformingReviews: CarReview[];
  recentActivity: any[];
}

export class ContentManagementService {
  private static instance: ContentManagementService;

  static getInstance(): ContentManagementService {
    if (!ContentManagementService.instance) {
      ContentManagementService.instance = new ContentManagementService();
    }
    return ContentManagementService.instance;
  }

  // ===== REVIEW MANAGEMENT =====

  /**
   * Create a new car review
   */
  async createReview(reviewData: Omit<CarReview, 'id' | 'view_count' | 'like_count' | 'created_at' | 'updated_at'>): Promise<CarReview> {
    try {
      const { data, error } = await supabase
        .from('car_reviews')
        .insert({
          ...reviewData,
          view_count: 0,
          like_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Update car listing with new review
      await this.updateCarListingWithReview(reviewData.car_make, reviewData.car_model, reviewData.car_year);

      return data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw new Error(`Failed to create review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all published reviews with filtering and sorting
   */
  async getPublishedReviews(options: {
    limit?: number;
    offset?: number;
    make?: string;
    featured?: boolean;
    sortBy?: 'latest' | 'popular' | 'rating';
  } = {}): Promise<CarReview[]> {
    try {
      const { limit = 20, offset = 0, make, featured, sortBy = 'latest' } = options;

      let query = supabase
        .from('car_reviews')
        .select('*')
        .eq('is_published', true);

      if (make) {
        query = query.eq('car_make', make);
      }

      if (featured) {
        query = query.eq('is_featured', true);
      }

      // Apply sorting
      switch (sortBy) {
        case 'popular':
          query = query.order('view_count', { ascending: false });
          break;
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        default:
          query = query.order('publish_date', { ascending: false });
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw new Error(`Failed to fetch reviews: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a single review by ID and increment view count
   */
  async getReviewById(id: string): Promise<CarReview | null> {
    try {
      // Fetch review
      const { data: review, error } = await supabase
        .from('car_reviews')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (error || !review) return null;

      // Increment view count
      await supabase
        .from('car_reviews')
        .update({ view_count: review.view_count + 1 })
        .eq('id', id);

      return { ...review, view_count: review.view_count + 1 };
    } catch (error) {
      console.error('Error fetching review:', error);
      return null;
    }
  }

  /**
   * Search reviews by content
   */
  async searchReviews(searchTerm: string, limit: number = 10): Promise<CarReview[]> {
    try {
      const { data, error } = await supabase
        .from('car_reviews')
        .select('*')
        .eq('is_published', true)
        .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,car_make.ilike.%${searchTerm}%,car_model.ilike.%${searchTerm}%`)
        .order('view_count', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching reviews:', error);
      return [];
    }
  }

  // ===== CAR LISTING MANAGEMENT =====

  /**
   * Create or update car listing (for reviewed cars)
   */
  async createOrUpdateCarListing(carData: Omit<CarListingForReview, 'id' | 'created_at' | 'updated_at'>): Promise<CarListingForReview> {
    try {
      // Check if car already exists
      const { data: existing } = await supabase
        .from('car_listings_master')
        .select('*')
        .eq('make', carData.make)
        .eq('model', carData.model)
        .eq('year', carData.year)
        .single();

      if (existing) {
        // Update existing car
        const { data, error } = await supabase
          .from('car_listings_master')
          .update({
            ...carData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new car listing
        const { data, error } = await supabase
          .from('car_listings_master')
          .insert({
            ...carData,
            review_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error managing car listing:', error);
      throw new Error(`Failed to manage car listing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get car listings with reviews
   */
  async getCarListings(options: {
    limit?: number;
    offset?: number;
    make?: string;
    bodyType?: string;
    priceRange?: { min: number; max: number };
    hasReviews?: boolean;
    sortBy?: 'popular' | 'price' | 'rating' | 'latest';
  } = {}): Promise<CarListingForReview[]> {
    try {
      const { limit = 20, offset = 0, make, bodyType, priceRange, hasReviews, sortBy = 'popular' } = options;

      let query = supabase
        .from('car_listings_master')
        .select('*')
        .eq('status', 'active');

      if (make) {
        query = query.eq('make', make);
      }

      if (bodyType) {
        query = query.eq('body_type', bodyType);
      }

      if (priceRange) {
        query = query.gte('starting_msrp', priceRange.min).lte('starting_msrp', priceRange.max);
      }

      if (hasReviews) {
        query = query.gt('review_count', 0);
      }

      // Apply sorting
      switch (sortBy) {
        case 'price':
          query = query.order('starting_msrp', { ascending: true });
          break;
        case 'rating':
          query = query.order('review_score', { ascending: false });
          break;
        case 'latest':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('is_popular', { ascending: false }).order('review_count', { ascending: false });
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching car listings:', error);
      return [];
    }
  }

  /**
   * Get car details with associated reviews
   */
  async getCarWithReviews(make: string, model: string, year?: number): Promise<{
    car: CarListingForReview | null;
    reviews: CarReview[];
  }> {
    try {
      // Get car listing
      let carQuery = supabase
        .from('car_listings_master')
        .select('*')
        .eq('make', make)
        .eq('model', model);

      if (year) {
        carQuery = carQuery.eq('year', year);
      }

      const { data: car } = await carQuery.single();

      // Get reviews for this car
      let reviewQuery = supabase
        .from('car_reviews')
        .select('*')
        .eq('car_make', make)
        .eq('car_model', model)
        .eq('is_published', true)
        .order('publish_date', { ascending: false });

      if (year) {
        reviewQuery = reviewQuery.eq('car_year', year);
      }

      const { data: reviews } = await reviewQuery;

      return {
        car: car || null,
        reviews: reviews || []
      };
    } catch (error) {
      console.error('Error fetching car with reviews:', error);
      return { car: null, reviews: [] };
    }
  }

  // ===== ANALYTICS & INSIGHTS =====

  /**
   * Get content analytics for dashboard
   */
  async getContentAnalytics(): Promise<ReviewAnalytics> {
    try {
      // Get total review stats
      const { data: reviewStats } = await supabase
        .from('car_reviews')
        .select('rating, view_count, like_count')
        .eq('is_published', true);

      // Get popular cars (most reviewed) - using RPC for grouped queries
      const { data: popularCarsData } = await supabase
        .rpc('get_popular_cars', { review_limit: 5 });

      // Fallback: get popular cars by counting reviews manually
      const { data: allReviews } = await supabase
        .from('car_reviews')
        .select('car_make, car_model')
        .eq('is_published', true);

      // Count reviews per car manually
      const carCounts: { [key: string]: number } = {};
      allReviews?.forEach(review => {
        const carKey = `${review.car_make} ${review.car_model}`;
        carCounts[carKey] = (carCounts[carKey] || 0) + 1;
      });

      const popularCars = Object.entries(carCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([carName]) => carName);

      // Get top performing reviews
      const { data: topReviews } = await supabase
        .from('car_reviews')
        .select('*')
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(5);

      const totalReviews = reviewStats?.length || 0;
      const totalViews = reviewStats?.reduce((sum, r) => sum + r.view_count, 0) || 0;
      const totalLikes = reviewStats?.reduce((sum, r) => sum + r.like_count, 0) || 0;
      const averageRating = reviewStats?.length 
        ? reviewStats.reduce((sum, r) => sum + r.rating, 0) / reviewStats.length 
        : 0;

      return {
        totalReviews,
        totalViews,
        totalLikes,
        averageRating: Math.round(averageRating * 10) / 10,
        popularCars: popularCars || [],
        topPerformingReviews: topReviews || [],
        recentActivity: [] // Can be expanded later
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return {
        totalReviews: 0,
        totalViews: 0,
        totalLikes: 0,
        averageRating: 0,
        popularCars: [],
        topPerformingReviews: [],
        recentActivity: []
      };
    }
  }

  // ===== HELPER METHODS =====

  /**
   * Update car listing review stats when a new review is added
   */
  private async updateCarListingWithReview(make: string, model: string, year: number): Promise<void> {
    try {
      // Get current car listing
      const { data: car } = await supabase
        .from('car_listings_master')
        .select('*')
        .eq('make', make)
        .eq('model', model)
        .eq('year', year)
        .single();

      if (!car) return;

      // Calculate new review stats
      const { data: reviews } = await supabase
        .from('car_reviews')
        .select('rating')
        .eq('car_make', make)
        .eq('car_model', model)
        .eq('car_year', year)
        .eq('is_published', true);

      if (reviews && reviews.length > 0) {
        const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

        await supabase
          .from('car_listings_master')
          .update({
            review_count: reviews.length,
            review_score: Math.round(averageRating * 10) / 10,
            updated_at: new Date().toISOString()
          })
          .eq('id', car.id);
      }
    } catch (error) {
      console.error('Error updating car listing with review:', error);
    }
  }

  /**
   * Like a review
   */
  async likeReview(reviewId: string): Promise<boolean> {
    try {
      const { data: review } = await supabase
        .from('car_reviews')
        .select('like_count')
        .eq('id', reviewId)
        .single();

      if (!review) return false;

      await supabase
        .from('car_reviews')
        .update({ like_count: review.like_count + 1 })
        .eq('id', reviewId);

      return true;
    } catch (error) {
      console.error('Error liking review:', error);
      return false;
    }
  }

  /**
   * Get featured reviews for homepage
   */
  async getFeaturedReviews(limit: number = 3): Promise<CarReview[]> {
    try {
      const { data, error } = await supabase
        .from('car_reviews')
        .select('*')
        .eq('is_published', true)
        .eq('is_featured', true)
        .order('publish_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching featured reviews:', error);
      return [];
    }
  }

  /**
   * Get recent reviews for activity feed
   */
  async getRecentReviews(limit: number = 10): Promise<CarReview[]> {
    try {
      const { data, error } = await supabase
        .from('car_reviews')
        .select('*')
        .eq('is_published', true)
        .order('publish_date', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent reviews:', error);
      return [];
    }
  }
}

export default ContentManagementService;
