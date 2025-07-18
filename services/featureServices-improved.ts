import { supabase } from '@/lib/supabase';
import { SecurityService, UserRole } from './securityService';
import { BaseService } from './BaseService';

/**
 * Service for managing bookmarks with role-based access control
 */
export class BookmarkService extends BaseService {
  /**
   * Add a bookmark for a car model or vehicle listing
   */
  static async addBookmark(
    userId: string,
    target: { carModelId?: number; vehicleListingId?: string }
  ): Promise<void> {
    return this.executePermissionOperation(
      userId,
      'canBookmarkCars',
      () => this.executeQuery(
        () => supabase
          .from('bookmarks')
          .insert({
            user_id: userId,
            car_model_id: target.carModelId || null,
            vehicle_listing_id: target.vehicleListingId || null,
          }),
        'addBookmark',
        { userId, target }
      ),
      'addBookmark'
    );
  }

  /**
   * Remove a bookmark
   */
  static async removeBookmark(
    userId: string,
    target: { carModelId?: number; vehicleListingId?: string }
  ): Promise<void> {
    return this.executeQuery(
      () => {
        let query = supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', userId);

        if (target.carModelId) {
          query = query.eq('car_model_id', target.carModelId);
        } else if (target.vehicleListingId) {
          query = query.eq('vehicle_listing_id', target.vehicleListingId);
        }

        return query;
      },
      'removeBookmark',
      { userId, target }
    );
  }

  /**
   * Get user's bookmarks
   */
  static async getUserBookmarks(userId: string) {
    return this.executeQueryArray(
      () => supabase
        .from('bookmarks')
        .select(this.buildSelectQuery(
          'bookmarks',
          ['id', 'car_model_id', 'vehicle_listing_id', 'created_at'],
          {
            'car_models': ['id', 'name', 'year', 'image_url', 'brands (id, name, logo_url)'],
            'vehicle_listings': ['id', 'title', 'make', 'model', 'year', 'price', 'images']
          }
        ))
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      'getUserBookmarks',
      { userId }
    );
  }

  /**
   * Check if item is bookmarked by user
   */
  static async isBookmarked(
    userId: string,
    target: { carModelId?: number; vehicleListingId?: string }
  ): Promise<boolean> {
    try {
      const result = await this.executeQuery(
        () => {
          let query = supabase
            .from('bookmarks')
            .select('id')
            .eq('user_id', userId);

          if (target.carModelId) {
            query = query.eq('car_model_id', target.carModelId);
          } else if (target.vehicleListingId) {
            query = query.eq('vehicle_listing_id', target.vehicleListingId);
          }

          return query.single();
        },
        'isBookmarked',
        { userId, target }
      );

      return result !== null;
    } catch (error) {
      // Handle "not found" as false rather than error
      if (error?.code === 'PGRST116') {
        return false;
      }
      throw error;
    }
  }
}

/**
 * Service for managing vehicle listings with role-based access control
 */
export class VehicleListingService extends BaseService {
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
    return this.executePermissionOperation(
      userId,
      'canPostCars',
      () => this.executeQuery(
        () => supabase
          .from('vehicle_listings')
          .insert({
            dealer_id: userId,
            ...listingData,
            status: 'active',
            created_at: new Date().toISOString(),
          })
          .select()
          .single(),
        'createListing',
        { userId, listingData }
      ),
      'createListing'
    );
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
    return this.executeQueryArray(
      () => {
        let query = supabase
          .from('vehicle_listings')
          .select(this.buildSelectQuery(
            'vehicle_listings',
            ['*'],
            {
              'dealers': ['business_name', 'verified', 'rating']
            }
          ))
          .eq('status', 'active');

        if (filters) {
          query = this.applyFilters(query, {
            make: filters.make,
            model: filters.model,
            location_city: filters.location,
          });

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
        }

        return query.order('created_at', { ascending: false });
      },
      'getActiveListings',
      { filters }
    );
  }

  /**
   * Get dealer's listings
   */
  static async getDealerListings(dealerId: string) {
    return this.executeQueryArray(
      () => supabase
        .from('vehicle_listings')
        .select('*')
        .eq('dealer_id', dealerId)
        .order('created_at', { ascending: false }),
      'getDealerListings',
      { dealerId }
    );
  }

  /**
   * Update vehicle listing (owner or admin only)
   */
  static async updateListing(
    userId: string,
    listingId: string,
    updateData: Partial<{
      title: string;
      price: number;
      mileage: number;
      condition: string;
      description: string;
      features: string[];
      status: string;
    }>
  ) {
    return this.executeQuery(
      () => supabase
        .from('vehicle_listings')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', listingId)
        .eq('dealer_id', userId) // Only allow owner to update
        .select()
        .single(),
      'updateListing',
      { userId, listingId, updateData }
    );
  }

  /**
   * Delete vehicle listing (owner or admin only)
   */
  static async deleteListing(userId: string, listingId: string) {
    return this.executeQuery(
      () => supabase
        .from('vehicle_listings')
        .delete()
        .eq('id', listingId)
        .eq('dealer_id', userId), // Only allow owner to delete
      'deleteListing',
      { userId, listingId }
    );
  }
}

/**
 * Service for managing reviews with role-based access control
 */
export class ReviewService extends BaseService {
  /**
   * Create a new review (admin only)
   */
  static async createReview(
    userId: string,
    reviewData: {
      model_id: number;
      title: string;
      content: string;
      rating: number;
      author: string;
      car_make: string;
      car_model: string;
      car_year: number;
      images?: string[];
      tags?: string[];
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
    return this.executePermissionOperation(
      userId,
      'canWriteReviews',
      () => this.executeQuery(
        () => supabase
          .from('reviews')
          .insert({
            user_id: userId,
            ...reviewData,
            created_at: new Date().toISOString(),
          })
          .select()
          .single(),
        'createReview',
        { userId, reviewData }
      ),
      'createReview'
    );
  }

  /**
   * Get all reviews with pagination
   */
  static async getReviews(
    page: number = 0,
    limit: number = 10,
    filters?: {
      make?: string;
      model?: string;
      year?: number;
      minRating?: number;
    }
  ) {
    return this.executeQueryArray(
      () => {
        let query = supabase
          .from('reviews')
          .select(this.buildSelectQuery(
            'reviews',
            ['*'],
            {
              'car_models': ['id', 'name', 'year', 'brands (id, name, logo_url)']
            }
          ));

        if (filters) {
          query = this.applyFilters(query, {
            car_make: filters.make,
            car_model: filters.model,
            car_year: filters.year,
          });

          if (filters.minRating) {
            query = query.gte('rating', filters.minRating);
          }
        }

        return this.applySorting(
          this.applyPagination(query, page, limit),
          'created_at',
          false
        );
      },
      'getReviews',
      { page, limit, filters }
    );
  }

  /**
   * Get review by ID
   */
  static async getReviewById(reviewId: string) {
    return this.executeQuery(
      () => supabase
        .from('reviews')
        .select(this.buildSelectQuery(
          'reviews',
          ['*'],
          {
            'car_models': ['id', 'name', 'year', 'brands (id, name, logo_url)']
          }
        ))
        .eq('id', reviewId)
        .single(),
      'getReviewById',
      { reviewId }
    );
  }

  /**
   * Update review (owner or admin only)
   */
  static async updateReview(
    userId: string,
    reviewId: string,
    updateData: Partial<{
      title: string;
      content: string;
      rating: number;
      images: string[];
      tags: string[];
      sections: any;
    }>
  ) {
    return this.executeQuery(
      () => supabase
        .from('reviews')
        .update({
          ...updateData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reviewId)
        .eq('user_id', userId) // Only allow owner to update
        .select()
        .single(),
      'updateReview',
      { userId, reviewId, updateData }
    );
  }

  /**
   * Delete review (owner or admin only)
   */
  static async deleteReview(userId: string, reviewId: string) {
    return this.executeQuery(
      () => supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)
        .eq('user_id', userId), // Only allow owner to delete
      'deleteReview',
      { userId, reviewId }
    );
  }
}

/**
 * Service for AI-powered features with role-based access control
 */
export class AIService extends BaseService {
  /**
   * Generate AI car recommendations (user+ only)
   */
  static async generateRecommendations(
    userId: string,
    preferences: {
      budget?: number;
      carType?: string;
      fuelType?: string;
      features?: string[];
      usage?: string;
    }
  ) {
    return this.executePermissionOperation(
      userId,
      'canAccessAI',
      async () => {
        // This would integrate with OpenAI API
        // For now, return mock recommendations
        return {
          recommendations: [
            {
              car_model: 'Toyota Camry',
              year: 2023,
              score: 0.95,
              reasons: ['Excellent fuel economy', 'Reliable brand', 'Within budget'],
            },
            {
              car_model: 'Honda Accord',
              year: 2023,
              score: 0.92,
              reasons: ['Great features', 'Comfortable interior', 'Good resale value'],
            },
          ],
          generated_at: new Date().toISOString(),
        };
      },
      'generateRecommendations'
    );
  }

  /**
   * AI-powered car comparison
   */
  static async compareVehicles(
    userId: string,
    vehicleIds: string[]
  ) {
    return this.executePermissionOperation(
      userId,
      'canAccessAI',
      async () => {
        // This would integrate with OpenAI API for intelligent comparison
        // For now, return mock comparison
        return {
          comparison: {
            vehicles: vehicleIds,
            analysis: 'AI-powered comparison analysis would go here',
            winner: vehicleIds[0],
            factors: ['Price', 'Fuel Economy', 'Features', 'Reliability'],
          },
          generated_at: new Date().toISOString(),
        };
      },
      'compareVehicles'
    );
  }
}

export default {
  BookmarkService,
  VehicleListingService,
  ReviewService,
  AIService,
};
