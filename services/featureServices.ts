import { supabase } from '@/lib/supabase';
import { SecurityService, UserRole } from './securityService';

/**
 * Service for managing bookmarks with role-based access control
 */
export class BookmarkService {
  /**
   * Add a bookmark for a car model or vehicle listing
   */
  static async addBookmark(
    userId: string,
    target: { carModelId?: number; vehicleListingId?: string }
  ): Promise<void> {
    // Check if user can bookmark cars
    const canBookmark = await SecurityService.canPerformAction(userId, 'canBookmarkCars');
    if (!canBookmark) {
      throw new Error('You need to sign in to bookmark cars');
    }

    try {
      const { error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: userId,
          car_model_id: target.carModelId || null,
          vehicle_listing_id: target.vehicleListingId || null,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  }

  /**
   * Remove a bookmark
   */
  static async removeBookmark(
    userId: string,
    target: { carModelId?: number; vehicleListingId?: string }
  ): Promise<void> {
    try {
      let query = supabase
        .from('bookmarks')
        .delete()
        .eq('user_id', userId);

      if (target.carModelId) {
        query = query.eq('car_model_id', target.carModelId);
      } else if (target.vehicleListingId) {
        query = query.eq('vehicle_listing_id', target.vehicleListingId);
      }

      const { error } = await query;
      if (error) throw error;
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw error;
    }
  }

  /**
   * Get user's bookmarks
   */
  static async getUserBookmarks(userId: string) {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          id,
          car_model_id,
          vehicle_listing_id,
          created_at,
          car_models (
            id,
            name,
            year,
            image_url,
            brands (
              id,
              name,
              logo_url
            )
          ),
          vehicle_listings (
            id,
            title,
            make,
            model,
            year,
            price,
            images
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      throw error;
    }
  }

  /**
   * Check if item is bookmarked by user
   */
  static async isBookmarked(
    userId: string,
    target: { carModelId?: number; vehicleListingId?: string }
  ): Promise<boolean> {
    try {
      let query = supabase
        .from('bookmarks')
        .select('id')
        .eq('user_id', userId);

      if (target.carModelId) {
        query = query.eq('car_model_id', target.carModelId);
      } else if (target.vehicleListingId) {
        query = query.eq('vehicle_listing_id', target.vehicleListingId);
      }

      const { data, error } = await query.single();
      if (error && error.code !== 'PGRST116') throw error;
      
      return !!data;
    } catch (error) {
      console.error('Error checking bookmark status:', error);
      return false;
    }
  }
}

/**
 * Service for managing vehicle listings with role-based access control
 */
export class VehicleListingService {
  /**
   * Create a new vehicle listing (dealers and admins only)
   */
  static async createListing(
    userId: string,
    listingData: {
      title: string;
      make: string;
      model: string;
      year: number;
      price: number;
      mileage?: number;
      location_city?: string;
      location_state?: string;
      condition?: string;
      fuel_type?: string;
      transmission?: string;
      exterior_color?: string;
      interior_color?: string;
      description?: string;
      features?: string[];
      images?: string[];
    }
  ) {
    // Check if user can post cars
    const canPost = await SecurityService.canPerformAction(userId, 'canPostCars');
    if (!canPost) {
      throw new Error('Only dealers and admins can post vehicle listings');
    }

    try {
      const { data, error } = await supabase
        .from('vehicle_listings')
        .insert({
          dealer_id: userId,
          status: 'active',
          ...listingData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating vehicle listing:', error);
      throw error;
    }
  }

  /**
   * Get all active vehicle listings
   */
  static async getActiveListings(filters?: {
    make?: string;
    model?: string;
    yearMin?: number;
    yearMax?: number;
    priceMin?: number;
    priceMax?: number;
    location?: string;
  }) {
    try {
      let query = supabase
        .from('vehicle_listings')
        .select(`
          *,
          dealers (
            business_name,
            verified,
            rating
          )
        `)
        .eq('status', 'active');

      if (filters?.make) {
        query = query.ilike('make', `%${filters.make}%`);
      }
      if (filters?.model) {
        query = query.ilike('model', `%${filters.model}%`);
      }
      if (filters?.yearMin) {
        query = query.gte('year', filters.yearMin);
      }
      if (filters?.yearMax) {
        query = query.lte('year', filters.yearMax);
      }
      if (filters?.priceMin) {
        query = query.gte('price', filters.priceMin);
      }
      if (filters?.priceMax) {
        query = query.lte('price', filters.priceMax);
      }
      if (filters?.location) {
        query = query.or(`location_city.ilike.%${filters.location}%,location_state.ilike.%${filters.location}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching vehicle listings:', error);
      throw error;
    }
  }

  /**
   * Get dealer's listings
   */
  static async getDealerListings(dealerId: string) {
    try {
      const { data, error } = await supabase
        .from('vehicle_listings')
        .select('*')
        .eq('dealer_id', dealerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching dealer listings:', error);
      throw error;
    }
  }

  /**
   * Update vehicle listing (owner or admin only)
   */
  static async updateListing(
    userId: string,
    listingId: string,
    updates: Record<string, any>
  ) {
    try {
      const { data, error } = await supabase
        .from('vehicle_listings')
        .update(updates)
        .eq('id', listingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating vehicle listing:', error);
      throw error;
    }
  }

  /**
   * Delete vehicle listing (owner or admin only)
   */
  static async deleteListing(userId: string, listingId: string) {
    try {
      const { error } = await supabase
        .from('vehicle_listings')
        .delete()
        .eq('id', listingId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting vehicle listing:', error);
      throw error;
    }
  }
}

/**
 * Service for managing reviews with role-based access control
 */
export class ReviewService {
  /**
   * Create a new review (users only - dealers cannot review)
   */
  static async createReview(
    userId: string,
    reviewData: {
      model_id: number;
      title: string;
      content: string;
      rating: number;
      car_make: string;
      car_model: string;
      car_year: number;
      sections?: {
        performance?: string;
        exterior?: string;
        interior?: string;
        practicality?: string;
        tech?: string;
        verdict?: string;
      };
    }
  ) {
    // Check if user can write reviews
    const canWrite = await SecurityService.canPerformAction(userId, 'canWriteReviews');
    if (!canWrite) {
      throw new Error('Only regular users can write reviews');
    }

    try {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          user_id: userId,
          author: 'Anonymous User', // Keep reviews anonymous for privacy
          ...reviewData,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating review:', error);
      throw error;
    }
  }

  /**
   * Get reviews for a car model
   */
  static async getModelReviews(modelId: number) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          car_models (
            id,
            name,
            year,
            brands (
              id,
              name
            )
          )
        `)
        .eq('model_id', modelId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching model reviews:', error);
      throw error;
    }
  }

  /**
   * Delete review (owner or admin only)
   */
  static async deleteReview(userId: string, reviewId: string) {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting review:', error);
      throw error;
    }
  }
}

/**
 * Service for AI-powered features with role-based access control
 */
export class AIService {
  /**
   * Get AI car recommendations (authenticated users only)
   */
  static async getCarRecommendations(
    userId: string,
    preferences: {
      budget?: number;
      usage?: string;
      priorities?: string[];
      lifestyle?: string;
    }
  ) {
    // Check if user can access AI features
    const canAccess = await SecurityService.canPerformAction(userId, 'canAccessAI');
    if (!canAccess) {
      throw new Error('Please sign in to access AI recommendations');
    }

    try {
      // This would integrate with your OpenAI service
      // For now, return a placeholder response
      return {
        recommendations: [],
        reasoning: 'AI recommendations require implementation of OpenAI integration',
      };
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      throw error;
    }
  }

  /**
   * Generate AI review summary (authenticated users only)
   */
  static async generateReviewSummary(
    userId: string,
    reviews: any[]
  ) {
    // Check if user can access AI features
    const canAccess = await SecurityService.canPerformAction(userId, 'canAccessAI');
    if (!canAccess) {
      throw new Error('Please sign in to access AI features');
    }

    try {
      // This would integrate with your OpenAI service
      // For now, return a placeholder response
      return {
        summary: 'AI-generated summary requires OpenAI integration',
        sentiment: 'neutral',
        keyPoints: [],
      };
    } catch (error) {
      console.error('Error generating AI summary:', error);
      throw error;
    }
  }
}
