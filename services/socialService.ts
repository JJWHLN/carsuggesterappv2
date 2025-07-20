import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { enhancedAuthService } from './enhancedAuthService';
import { Car } from '@/types/database';

export interface CarReview {
  id: string;
  user_id: string;
  car_id: string;
  rating: number; // 1-5 stars
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  recommended: boolean;
  verified_purchase: boolean;
  ownership_duration: string; // e.g., "6 months", "2 years"
  mileage_when_reviewed: number;
  photos: string[];
  helpful_votes: number;
  created_at: string;
  updated_at: string;
  user_profile?: UserProfile;
  car_details?: Car;
  replies?: ReviewReply[];
}

export interface ReviewReply {
  id: string;
  review_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_profile?: UserProfile;
  is_dealer_response?: boolean;
}

export interface UserProfile {
  id: string;
  display_name: string;
  avatar_url?: string;
  verified_buyer: boolean;
  total_reviews: number;
  average_rating_given: number;
  member_since: string;
  location?: string;
  preferred_brands: string[];
  cars_owned: CarOwnership[];
  social_stats: SocialStats;
}

export interface CarOwnership {
  car_id: string;
  make: string;
  model: string;
  year: number;
  owned_from: string;
  owned_to?: string;
  verified: boolean;
}

export interface SocialStats {
  reviews_written: number;
  helpful_votes_received: number;
  following_count: number;
  followers_count: number;
  cars_compared: number;
  marketplace_interactions: number;
}

export interface CarComparison {
  id: string;
  user_id: string;
  title: string;
  description: string;
  cars: string[]; // Array of car IDs
  criteria: ComparisonCriteria[];
  visibility: 'public' | 'private' | 'friends';
  likes_count: number;
  shares_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
}

export interface ComparisonCriteria {
  category: string; // e.g., 'Performance', 'Fuel Economy', 'Comfort'
  weight: number; // 1-10 importance
  scores: { [carId: string]: number }; // 1-10 scores for each car
  notes?: string;
}

export interface SocialActivity {
  id: string;
  user_id: string;
  type: 'review' | 'comparison' | 'follow' | 'like' | 'comment' | 'car_interest' | 'price_watch';
  target_id: string; // ID of the target (review, comparison, user, car, etc.)
  target_type: string;
  metadata: any;
  created_at: string;
  user_profile?: UserProfile;
}

export interface CarDiscussion {
  id: string;
  car_id: string;
  user_id: string;
  title: string;
  content: string;
  category: 'general' | 'maintenance' | 'modifications' | 'buying_advice' | 'selling_tips';
  tags: string[];
  upvotes: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  user_profile?: UserProfile;
  latest_comments?: DiscussionComment[];
}

export interface DiscussionComment {
  id: string;
  discussion_id: string;
  user_id: string;
  content: string;
  upvotes: number;
  created_at: string;
  user_profile?: UserProfile;
  replies?: DiscussionComment[];
}

class SocialService {
  private static instance: SocialService;
  private cache = new Map<string, any>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): SocialService {
    if (!SocialService.instance) {
      SocialService.instance = new SocialService();
    }
    return SocialService.instance;
  }

  private getCacheKey(method: string, ...args: any[]): string {
    return `${method}_${JSON.stringify(args)}`;
  }

  private isValidCache(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  private getCache(key: string): any {
    if (this.isValidCache(key)) {
      return this.cache.get(key);
    }
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
    return null;
  }

  // Review Management
  async createReview(reviewData: Partial<CarReview>): Promise<CarReview> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const review = {
        ...reviewData,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        helpful_votes: 0,
      };

      const { data, error } = await supabase
        .from('car_reviews')
        .insert(review)
        .select(`
          *,
          user_profile:user_profiles(*),
          car_details:cars(*)
        `)
        .single();

      if (error) throw error;

      // Update user's review count
      await this.updateUserSocialStats(user.id, { reviews_written: 1 });

      // Create social activity
      await this.createSocialActivity({
        type: 'review',
        target_id: data.id,
        target_type: 'car_review',
        metadata: { car_id: reviewData.car_id, rating: reviewData.rating },
      });

      return data;
    } catch (error) {
      logger.error('Error creating review:', error);
      throw error;
    }
  }

  async getCarReviews(carId: string, options: {
    page?: number;
    limit?: number;
    sortBy?: 'newest' | 'oldest' | 'highest_rated' | 'lowest_rated' | 'most_helpful';
    filter?: 'all' | 'verified_only' | 'recommended_only';
  } = {}): Promise<{ reviews: CarReview[]; total: number; averageRating: number }> {
    const cacheKey = this.getCacheKey('getCarReviews', carId, options);
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { page = 1, limit = 10, sortBy = 'newest', filter = 'all' } = options;
      
      let query = supabase
        .from('car_reviews')
        .select(`
          *,
          user_profile:user_profiles(*),
          replies:review_replies(
            *,
            user_profile:user_profiles(*)
          )
        `, { count: 'exact' })
        .eq('car_id', carId);

      // Apply filters
      if (filter === 'verified_only') {
        query = query.eq('verified_purchase', true);
      } else if (filter === 'recommended_only') {
        query = query.eq('recommended', true);
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'highest_rated':
          query = query.order('rating', { ascending: false });
          break;
        case 'lowest_rated':
          query = query.order('rating', { ascending: true });
          break;
        case 'most_helpful':
          query = query.order('helpful_votes', { ascending: false });
          break;
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data: reviews, error, count } = await query;
      if (error) throw error;

      // Calculate average rating
      const { data: ratingData } = await supabase
        .from('car_reviews')
        .select('rating')
        .eq('car_id', carId);

      const averageRating = ratingData?.length 
        ? ratingData.reduce((sum, r) => sum + r.rating, 0) / ratingData.length 
        : 0;

      const result = {
        reviews: reviews || [],
        total: count || 0,
        averageRating: Math.round(averageRating * 10) / 10,
      };

      this.setCache(cacheKey, result);
      return result;
    } catch (error) {
      logger.error('Error getting car reviews:', error);
      throw error;
    }
  }

  async markReviewHelpful(reviewId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Check if user already marked as helpful
      const { data: existingVote } = await supabase
        .from('review_helpful_votes')
        .select('id')
        .eq('review_id', reviewId)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        throw new Error('You have already marked this review as helpful');
      }

      // Add helpful vote
      await supabase
        .from('review_helpful_votes')
        .insert({ review_id: reviewId, user_id: user.id });

      // Update review helpful count
      await supabase.rpc('increment_review_helpful_votes', { review_id: reviewId });

      // Clear cache
      this.cache.clear();
    } catch (error) {
      logger.error('Error marking review helpful:', error);
      throw error;
    }
  }

  // Car Comparison Features
  async createCarComparison(comparisonData: Partial<CarComparison>): Promise<CarComparison> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const comparison = {
        ...comparisonData,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        likes_count: 0,
        shares_count: 0,
        comments_count: 0,
      };

      const { data, error } = await supabase
        .from('car_comparisons')
        .insert(comparison)
        .select()
        .single();

      if (error) throw error;

      // Create social activity
      await this.createSocialActivity({
        type: 'comparison',
        target_id: data.id,
        target_type: 'car_comparison',
        metadata: { cars: comparisonData.cars, title: comparisonData.title },
      });

      return data;
    } catch (error) {
      logger.error('Error creating car comparison:', error);
      throw error;
    }
  }

  async getPopularComparisons(options: {
    page?: number;
    limit?: number;
    timeframe?: 'day' | 'week' | 'month' | 'all';
  } = {}): Promise<CarComparison[]> {
    const cacheKey = this.getCacheKey('getPopularComparisons', options);
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { page = 1, limit = 10, timeframe = 'week' } = options;

      let query = supabase
        .from('car_comparisons')
        .select(`
          *,
          user_profile:user_profiles(*),
          car_details:cars!inner(*)
        `)
        .eq('visibility', 'public')
        .order('likes_count', { ascending: false });

      // Apply timeframe filter
      if (timeframe !== 'all') {
        const timeMap = {
          day: 1,
          week: 7,
          month: 30,
        };
        const daysAgo = timeMap[timeframe];
        const cutoffDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
        query = query.gte('created_at', cutoffDate);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error } = await query;
      if (error) throw error;

      this.setCache(cacheKey, data || []);
      return data || [];
    } catch (error) {
      logger.error('Error getting popular comparisons:', error);
      throw error;
    }
  }

  // Social Following System
  async followUser(targetUserId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      if (user.id === targetUserId) {
        throw new Error('You cannot follow yourself');
      }

      // Check if already following
      const { data: existingFollow } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .single();

      if (existingFollow) {
        throw new Error('You are already following this user');
      }

      // Create follow relationship
      await supabase
        .from('user_follows')
        .insert({
          follower_id: user.id,
          following_id: targetUserId,
          created_at: new Date().toISOString(),
        });

      // Update social stats
      await this.updateUserSocialStats(user.id, { following_count: 1 });
      await this.updateUserSocialStats(targetUserId, { followers_count: 1 });

      // Create social activity
      await this.createSocialActivity({
        type: 'follow',
        target_id: targetUserId,
        target_type: 'user',
        metadata: {},
      });

      // Clear cache
      this.cache.clear();
    } catch (error) {
      logger.error('Error following user:', error);
      throw error;
    }
  }

  async unfollowUser(targetUserId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);

      if (error) throw error;

      // Update social stats
      await this.updateUserSocialStats(user.id, { following_count: -1 });
      await this.updateUserSocialStats(targetUserId, { followers_count: -1 });

      // Clear cache
      this.cache.clear();
    } catch (error) {
      logger.error('Error unfollowing user:', error);
      throw error;
    }
  }

  async getUserFollowers(userId: string, page = 1, limit = 20): Promise<UserProfile[]> {
    const cacheKey = this.getCacheKey('getUserFollowers', userId, page, limit);
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          follower:user_profiles!follower_id(*)
        `)
        .eq('following_id', userId)
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      const followers = (data?.map(item => item.follower).filter(Boolean) as any[]) || [];
      this.setCache(cacheKey, followers);
      return followers;
    } catch (error) {
      logger.error('Error getting user followers:', error);
      throw error;
    }
  }

  async getUserFollowing(userId: string, page = 1, limit = 20): Promise<UserProfile[]> {
    const cacheKey = this.getCacheKey('getUserFollowing', userId, page, limit);
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          following:user_profiles!following_id(*)
        `)
        .eq('follower_id', userId)
        .range((page - 1) * limit, page * limit - 1);

      if (error) throw error;

      const following = (data?.map(item => item.following).filter(Boolean) as any[]) || [];
      this.setCache(cacheKey, following);
      return following;
    } catch (error) {
      logger.error('Error getting user following:', error);
      throw error;
    }
  }

  // Car Discussions & Forums
  async createDiscussion(discussionData: Partial<CarDiscussion>): Promise<CarDiscussion> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const discussion = {
        ...discussionData,
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        upvotes: 0,
        comments_count: 0,
      };

      const { data, error } = await supabase
        .from('car_discussions')
        .insert(discussion)
        .select(`
          *,
          user_profile:user_profiles(*)
        `)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      logger.error('Error creating discussion:', error);
      throw error;
    }
  }

  async getCarDiscussions(carId: string, options: {
    page?: number;
    limit?: number;
    category?: string;
    sortBy?: 'newest' | 'popular' | 'most_comments';
  } = {}): Promise<CarDiscussion[]> {
    const cacheKey = this.getCacheKey('getCarDiscussions', carId, options);
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { page = 1, limit = 10, category, sortBy = 'newest' } = options;

      let query = supabase
        .from('car_discussions')
        .select(`
          *,
          user_profile:user_profiles(*),
          latest_comments:discussion_comments(
            *,
            user_profile:user_profiles(*)
          )
        `)
        .eq('car_id', carId);

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'popular':
          query = query.order('upvotes', { ascending: false });
          break;
        case 'most_comments':
          query = query.order('comments_count', { ascending: false });
          break;
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error } = await query;
      if (error) throw error;

      this.setCache(cacheKey, data || []);
      return data || [];
    } catch (error) {
      logger.error('Error getting car discussions:', error);
      throw error;
    }
  }

  // Social Activity Feed
  async getSocialActivityFeed(options: {
    page?: number;
    limit?: number;
    types?: string[];
    following_only?: boolean;
  } = {}): Promise<SocialActivity[]> {
    const cacheKey = this.getCacheKey('getSocialActivityFeed', options);
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { page = 1, limit = 20, types, following_only = false } = options;

      let query = supabase
        .from('social_activities')
        .select(`
          *,
          user_profile:user_profiles(*)
        `)
        .order('created_at', { ascending: false });

      // Filter by activity types
      if (types && types.length > 0) {
        query = query.in('type', types);
      }

      // Filter to only following users
      if (following_only && user) {
        const { data: following } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);

        const followingIds = following?.map(f => f.following_id) || [];
        if (followingIds.length > 0) {
          query = query.in('user_id', followingIds);
        } else {
          // No following users, return empty array
          return [];
        }
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error } = await query;
      if (error) throw error;

      this.setCache(cacheKey, data || []);
      return data || [];
    } catch (error) {
      logger.error('Error getting social activity feed:', error);
      throw error;
    }
  }

  // User Profile Management
  async updateUserProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      // Clear profile cache
      this.cache.clear();
      return data;
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const cacheKey = this.getCacheKey('getUserProfile', userId);
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      logger.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Helper Methods
  private async createSocialActivity(activityData: Partial<SocialActivity>): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('social_activities')
        .insert({
          ...activityData,
          user_id: user.id,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      logger.error('Error creating social activity:', error);
      // Don't throw, as this is a background operation
    }
  }

  private async updateUserSocialStats(userId: string, statsUpdate: Partial<SocialStats>): Promise<void> {
    try {
      // Use SQL function to atomically update stats
      await supabase.rpc('update_user_social_stats', {
        user_id: userId,
        stats_update: statsUpdate,
      });
    } catch (error) {
      logger.error('Error updating user social stats:', error);
      // Don't throw, as this is a background operation
    }
  }

  // Cache Management
  clearCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  // Real-time Subscriptions
  subscribeToCarReviews(carId: string, callback: (review: CarReview) => void) {
    return supabase
      .channel(`car_reviews:${carId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'car_reviews',
        filter: `car_id=eq.${carId}`,
      }, (payload) => callback(payload.new as CarReview))
      .subscribe();
  }

  subscribeToSocialActivity(callback: (activity: SocialActivity) => void) {
    return supabase
      .channel('social_activities')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'social_activities',
      }, (payload) => callback(payload.new as SocialActivity))
      .subscribe();
  }
}

export const socialService = SocialService.getInstance();
export default socialService;
