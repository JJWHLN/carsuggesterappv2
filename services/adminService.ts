import { supabase } from '@/lib/supabase';
import { SecurityService, UserRole } from './securityService';

/**
 * Admin service for managing users, roles, and content moderation
 */
export class AdminService {
  /**
   * Get all users (admin only)
   */
  static async getAllUsers(adminUserId: string) {
    await SecurityService.requireRole(adminUserId, ['admin']);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          role,
          onboarding_completed,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  /**
   * Update user role (admin only)
   */
  static async updateUserRole(
    adminUserId: string,
    targetUserId: string,
    newRole: UserRole
  ) {
    await SecurityService.updateUserRole(adminUserId, targetUserId, newRole);
  }

  /**
   * Get all reviews for moderation (admin only)
   */
  static async getAllReviews(adminUserId: string) {
    await SecurityService.requireRole(adminUserId, ['admin']);

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
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all reviews:', error);
      throw error;
    }
  }

  /**
   * Delete any review (admin only)
   */
  static async deleteReview(adminUserId: string, reviewId: string) {
    await SecurityService.requireRole(adminUserId, ['admin']);

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

  /**
   * Get all vehicle listings for moderation (admin only)
   */
  static async getAllListings(adminUserId: string) {
    await SecurityService.requireRole(adminUserId, ['admin']);

    try {
      const { data, error } = await supabase
        .from('vehicle_listings')
        .select(`
          *,
          dealers (
            business_name,
            verified,
            rating
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all listings:', error);
      throw error;
    }
  }

  /**
   * Update listing status (admin only)
   */
  static async updateListingStatus(
    adminUserId: string,
    listingId: string,
    status: 'active' | 'inactive' | 'suspended'
  ) {
    await SecurityService.requireRole(adminUserId, ['admin']);

    try {
      const { data, error } = await supabase
        .from('vehicle_listings')
        .update({ status })
        .eq('id', listingId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating listing status:', error);
      throw error;
    }
  }

  /**
   * Get platform statistics (admin only)
   */
  static async getPlatformStats(adminUserId: string) {
    await SecurityService.requireRole(adminUserId, ['admin']);

    try {
      // Get user counts by role
      const { data: userStats, error: userError } = await supabase
        .from('profiles')
        .select('role')
        .not('role', 'is', null);

      if (userError) throw userError;

      const roleCounts = userStats.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Get review count
      const { count: reviewCount, error: reviewError } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });

      if (reviewError) throw reviewError;

      // Get active listings count
      const { count: listingCount, error: listingError } = await supabase
        .from('vehicle_listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (listingError) throw listingError;

      // Get bookmark count
      const { count: bookmarkCount, error: bookmarkError } = await supabase
        .from('bookmarks')
        .select('*', { count: 'exact', head: true });

      if (bookmarkError) throw bookmarkError;

      return {
        users: {
          total: userStats.length,
          byRole: roleCounts,
        },
        content: {
          reviews: reviewCount || 0,
          activeListings: listingCount || 0,
          bookmarks: bookmarkCount || 0,
        },
      };
    } catch (error) {
      console.error('Error fetching platform stats:', error);
      throw error;
    }
  }

  /**
   * Get recent activity (admin only)
   */
  static async getRecentActivity(adminUserId: string, limit: number = 20) {
    await SecurityService.requireRole(adminUserId, ['admin']);

    try {
      // Get recent reviews
      const { data: recentReviews, error: reviewError } = await supabase
        .from('reviews')
        .select('id, title, created_at, author')
        .order('created_at', { ascending: false })
        .limit(limit / 2);

      if (reviewError) throw reviewError;

      // Get recent listings
      const { data: recentListings, error: listingError } = await supabase
        .from('vehicle_listings')
        .select('id, title, created_at, status')
        .order('created_at', { ascending: false })
        .limit(limit / 2);

      if (listingError) throw listingError;

      // Combine and sort by date
      const activities = [
        ...(recentReviews || []).map(review => ({
          type: 'review' as const,
          id: review.id,
          title: review.title,
          author: review.author,
          created_at: review.created_at,
        })),
        ...(recentListings || []).map(listing => ({
          type: 'listing' as const,
          id: listing.id,
          title: listing.title,
          status: listing.status,
          created_at: listing.created_at,
        })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
       .slice(0, limit);

      return activities;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  }

  /**
   * Create a new dealer account (admin only)
   */
  static async createDealerAccount(
    adminUserId: string,
    dealerData: {
      email: string;
      businessName: string;
      contactName: string;
      phone?: string;
      city?: string;
      state?: string;
    }
  ) {
    await SecurityService.requireRole(adminUserId, ['admin']);

    try {
      // First create auth user (this would typically be done through Supabase Auth Admin API)
      // For now, we'll assume the user signs up themselves and then gets upgraded to dealer
      
      // Create dealer profile
      const { data: dealerProfile, error: dealerError } = await supabase
        .from('dealers')
        .insert({
          business_name: dealerData.businessName,
          contact_name: dealerData.contactName,
          email: dealerData.email,
          phone: dealerData.phone,
          city: dealerData.city,
          state: dealerData.state,
          verified: true, // Admin-created dealers are automatically verified
        })
        .select()
        .single();

      if (dealerError) throw dealerError;

      return dealerProfile;
    } catch (error) {
      console.error('Error creating dealer account:', error);
      throw error;
    }
  }

  /**
   * Verify a dealer (admin only)
   */
  static async verifyDealer(
    adminUserId: string,
    dealerId: string,
    verified: boolean
  ) {
    await SecurityService.requireRole(adminUserId, ['admin']);

    try {
      const { data, error } = await supabase
        .from('dealers')
        .update({ verified })
        .eq('id', dealerId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error verifying dealer:', error);
      throw error;
    }
  }
}
