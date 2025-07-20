import { supabase } from '@/lib/supabase';
import { DealershipReview, DealershipMetrics } from '@/types/database';

export class DealershipReviewService {
  // Fetch dealership reviews with optional filtering
  static async getDealershipReviews(options?: {
    dealerId?: string;
    limit?: number;
    offset?: number;
    reviewType?: 'expert_visit' | 'mystery_shopper' | 'customer_experience';
    publishedOnly?: boolean;
    featured?: boolean;
  }): Promise<{ data: DealershipReview[]; count: number; error?: string }> {
    try {
      let query = supabase
        .from('dealership_reviews')
        .select(`
          *,
          dealers (
            business_name,
            verified,
            city,
            state
          )
        `, { count: 'exact' });

      // Apply filters
      if (options?.dealerId) {
        query = query.eq('dealer_id', options.dealerId);
      }

      if (options?.reviewType) {
        query = query.eq('review_type', options.reviewType);
      }

      if (options?.publishedOnly !== false) {
        query = query.eq('published', true);
      }

      if (options?.featured) {
        query = query.eq('featured', true);
      }

      // Order by creation date (newest first)
      query = query.order('created_at', { ascending: false });

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options?.limit || 10)) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { 
        data: data as DealershipReview[], 
        count: count || 0 
      };
    } catch (error) {
      logger.error('Error fetching dealership reviews:', error);
      return { 
        data: [], 
        count: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get a single dealership review by ID
  static async getDealershipReview(id: string): Promise<{ data: DealershipReview | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('dealership_reviews')
        .select(`
          *,
          dealers (
            business_name,
            verified,
            city,
            state
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { data: data as DealershipReview };
    } catch (error) {
      logger.error('Error fetching dealership review:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get dealership metrics and performance data
  static async getDealershipMetrics(dealerId: string): Promise<{ data: DealershipMetrics | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('dealership_metrics')
        .select('*')
        .eq('dealer_id', dealerId)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return { data: data as DealershipMetrics };
    } catch (error) {
      logger.error('Error fetching dealership metrics:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Calculate and update dealership metrics based on reviews
  static async updateDealershipMetrics(dealerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Get all published reviews for this dealer
      const { data: reviews, error: reviewsError } = await supabase
        .from('dealership_reviews')
        .select('*')
        .eq('dealer_id', dealerId)
        .eq('published', true);

      if (reviewsError) {
        throw new Error(reviewsError.message);
      }

      if (!reviews || reviews.length === 0) {
        return { success: true }; // No reviews to calculate metrics from
      }

      // Calculate averages
      const totalReviews = reviews.length;
      const overallSum = reviews.reduce((sum, review) => sum + review.overall_rating, 0);
      const customerServiceSum = reviews.reduce((sum, review) => sum + review.customer_service_rating, 0);
      const salesProcessSum = reviews.reduce((sum, review) => sum + review.sales_process_rating, 0);
      const facilitySum = reviews.reduce((sum, review) => sum + review.facility_rating, 0);
      const pricingSum = reviews.reduce((sum, review) => sum + review.pricing_transparency_rating, 0);
      const followUpSum = reviews.reduce((sum, review) => sum + review.follow_up_rating, 0);

      // Calculate recommendation percentage (assuming 4+ stars is a recommendation)
      const recommendations = reviews.filter(review => review.overall_rating >= 4).length;
      const recommendationPercentage = Math.round((recommendations / totalReviews) * 100);

      const metrics: Partial<DealershipMetrics> = {
        dealer_id: dealerId,
        overall_score: overallSum / totalReviews,
        review_count: totalReviews,
        average_customer_service: customerServiceSum / totalReviews,
        average_sales_process: salesProcessSum / totalReviews,
        average_facility: facilitySum / totalReviews,
        average_pricing_transparency: pricingSum / totalReviews,
        average_follow_up: followUpSum / totalReviews,
        recommendation_percentage: recommendationPercentage,
        last_updated: new Date().toISOString(),
      };

      // Upsert the metrics
      const { error: metricsError } = await supabase
        .from('dealership_metrics')
        .upsert(metrics, { onConflict: 'dealer_id' });

      if (metricsError) {
        throw new Error(metricsError.message);
      }

      return { success: true };
    } catch (error) {
      logger.error('Error updating dealership metrics:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get featured dealership reviews
  static async getFeaturedDealershipReviews(limit: number = 5): Promise<{ data: DealershipReview[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('dealership_reviews')
        .select(`
          *,
          dealers (
            business_name,
            verified,
            city,
            state
          )
        `)
        .eq('published', true)
        .eq('featured', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      return { data: data as DealershipReview[] };
    } catch (error) {
      logger.error('Error fetching featured dealership reviews:', error);
      return { 
        data: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Search dealership reviews
  static async searchDealershipReviews(
    searchTerm: string,
    options?: {
      limit?: number;
      offset?: number;
      reviewType?: string;
      dealerId?: string;
    }
  ): Promise<{ data: DealershipReview[]; count: number; error?: string }> {
    try {
      let query = supabase
        .from('dealership_reviews')
        .select(`
          *,
          dealers (
            business_name,
            verified,
            city,
            state
          )
        `, { count: 'exact' })
        .eq('published', true);

      // Text search in title, content, and expert_summary
      if (searchTerm.trim()) {
        query = query.or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,expert_summary.ilike.%${searchTerm}%`);
      }

      // Apply additional filters
      if (options?.reviewType) {
        query = query.eq('review_type', options.reviewType);
      }

      if (options?.dealerId) {
        query = query.eq('dealer_id', options.dealerId);
      }

      // Order by relevance (could be enhanced with full-text search)
      query = query.order('created_at', { ascending: false });

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options?.limit || 10)) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { 
        data: data as DealershipReview[], 
        count: count || 0 
      };
    } catch (error) {
      logger.error('Error searching dealership reviews:', error);
      return { 
        data: [], 
        count: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Get dealership reviews by location
  static async getDealershipReviewsByLocation(
    city?: string,
    state?: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{ data: DealershipReview[]; count: number; error?: string }> {
    try {
      let query = supabase
        .from('dealership_reviews')
        .select(`
          *,
          dealers!inner (
            business_name,
            verified,
            city,
            state
          )
        `, { count: 'exact' })
        .eq('published', true);

      // Filter by location
      if (city) {
        query = query.eq('dealers.city', city);
      }

      if (state) {
        query = query.eq('dealers.state', state);
      }

      // Order by creation date
      query = query.order('created_at', { ascending: false });

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options?.limit || 10)) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return { 
        data: data as DealershipReview[], 
        count: count || 0 
      };
    } catch (error) {
      logger.error('Error fetching dealership reviews by location:', error);
      return { 
        data: [], 
        count: 0, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Admin functions for managing reviews (when you write them)
  
  // Create a new dealership review (admin only)
  static async createDealershipReview(review: Omit<DealershipReview, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: DealershipReview | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('dealership_reviews')
        .insert([{
          ...review,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select(`
          *,
          dealers (
            business_name,
            verified,
            city,
            state
          )
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Update dealership metrics after creating review
      if (data) {
        await this.updateDealershipMetrics(review.dealer_id);
      }

      return { data: data as DealershipReview };
    } catch (error) {
      logger.error('Error creating dealership review:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Update a dealership review (admin only)
  static async updateDealershipReview(id: string, updates: Partial<DealershipReview>): Promise<{ data: DealershipReview | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('dealership_reviews')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select(`
          *,
          dealers (
            business_name,
            verified,
            city,
            state
          )
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Update dealership metrics after updating review
      if (data) {
        await this.updateDealershipMetrics(data.dealer_id);
      }

      return { data: data as DealershipReview };
    } catch (error) {
      logger.error('Error updating dealership review:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}
