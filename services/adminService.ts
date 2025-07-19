import { supabase } from '@/lib/supabase';
import { SecurityService, UserRole } from './securityService';
import { BaseService } from './BaseService';

/**
 * Admin service for managing users, roles, and content moderation
 */
export class AdminService extends BaseService {
  /**
   * Get all users (admin only)
   */
  static async getAllUsers(adminUserId: string) {
    return this.executeAdminOperation(
      adminUserId,
      () => this.executeQueryArray(
        () => supabase
          .from('profiles')
          .select('id, email, role, onboarding_completed, created_at, updated_at')
          .order('created_at', { ascending: false }),
        'getAllUsers'
      ),
      'getAllUsers'
    );
  }

  /**
   * Update user role (admin only)
   */
  static async updateUserRole(
    adminUserId: string,
    targetUserId: string,
    newRole: UserRole
  ) {
    return SecurityService.updateUserRole(adminUserId, targetUserId, newRole);
  }

  /**
   * Get all reviews for moderation (admin only)
   */
  static async getAllReviews(adminUserId: string) {
    return this.executeAdminOperation(
      adminUserId,
      () => this.executeQueryArray(
        () => supabase
          .from('reviews')
          .select(this.buildSelectQuery(
            'reviews',
            ['*'],
            {
              'car_models': ['id', 'name', 'year', 'brands (id, name)']
            }
          ))
          .order('created_at', { ascending: false }),
        'getAllReviews'
      ),
      'getAllReviews'
    );
  }

  /**
   * Delete any review (admin only)
   */
  static async deleteReview(adminUserId: string, reviewId: string) {
    return this.executeAdminOperation(
      adminUserId,
      () => this.executeQuery(
        () => supabase
          .from('reviews')
          .delete()
          .eq('id', reviewId),
        'deleteReview',
        { reviewId }
      ),
      'deleteReview'
    );
  }

  /**
   * Get all vehicle listings for moderation (admin only)
   */
  static async getAllListings(adminUserId: string) {
    return this.executeAdminOperation(
      adminUserId,
      () => this.executeQueryArray(
        () => supabase
          .from('vehicle_listings')
          .select(this.buildSelectQuery(
            'vehicle_listings',
            ['*'],
            {
              'dealers': ['business_name', 'verified', 'rating']
            }
          ))
          .order('created_at', { ascending: false }),
        'getAllListings'
      ),
      'getAllListings'
    );
  }

  /**
   * Update listing status (admin only)
   */
  static async updateListingStatus(
    adminUserId: string,
    listingId: string,
    status: 'active' | 'inactive' | 'suspended'
  ) {
    return this.executeAdminOperation(
      adminUserId,
      () => this.executeQuery(
        () => supabase
          .from('vehicle_listings')
          .update({ status })
          .eq('id', listingId)
          .select()
          .single(),
        'updateListingStatus',
        { listingId, status }
      ),
      'updateListingStatus'
    );
  }

  /**
   * Get platform statistics (admin only)
   */
  static async getPlatformStats(adminUserId: string) {
    return this.executeAdminOperation(
      adminUserId,
      async () => {
        // Get user counts by role
        const userStats = await this.executeQueryArray(
          () => supabase
            .from('profiles')
            .select('role')
            .not('role', 'is', null),
          'getPlatformStats.userStats'
        );

        const roleCounts = (userStats as Array<{role: string}>).reduce((acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Get review count
        const { count: reviewCount } = await supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true });

        // Get active listings count
        const { count: listingCount } = await supabase
          .from('vehicle_listings')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Get bookmark count
        const { count: bookmarkCount } = await supabase
          .from('bookmarks')
          .select('*', { count: 'exact', head: true });

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
      },
      'getPlatformStats'
    );
  }

  /**
   * Get recent activity (admin only)
   */
  static async getRecentActivity(adminUserId: string, limit: number = 20) {
    return this.executeAdminOperation(
      adminUserId,
      async () => {
        // Get recent reviews
        const recentReviews = await this.executeQueryArray(
          () => supabase
            .from('reviews')
            .select('id, title, created_at, author')
            .order('created_at', { ascending: false })
            .limit(limit / 2),
          'getRecentActivity.reviews'
        );

        // Get recent listings
        const recentListings = await this.executeQueryArray(
          () => supabase
            .from('vehicle_listings')
            .select('id, title, created_at, status')
            .order('created_at', { ascending: false })
            .limit(limit / 2),
          'getRecentActivity.listings'
        );

        // Combine and sort by date
        const activities = [
          ...(recentReviews as Array<any>).map(review => ({
            type: 'review' as const,
            id: review.id,
            title: review.title,
            author: review.author,
            created_at: review.created_at,
          })),
          ...(recentListings as Array<any>).map(listing => ({
            type: 'listing' as const,
            id: listing.id,
            title: listing.title,
            status: listing.status,
            created_at: listing.created_at,
          })),
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
         .slice(0, limit);

        return activities;
      },
      'getRecentActivity'
    );
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
    return this.executeAdminOperation(
      adminUserId,
      () => this.executeQuery(
        () => supabase
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
          .single(),
        'createDealerAccount',
        { dealerData }
      ),
      'createDealerAccount'
    );
  }

  /**
   * Verify a dealer (admin only)
   */
  static async verifyDealer(
    adminUserId: string,
    dealerId: string,
    verified: boolean
  ) {
    return this.executeAdminOperation(
      adminUserId,
      () => this.executeQuery(
        () => supabase
          .from('dealers')
          .update({ verified })
          .eq('id', dealerId)
          .select()
          .single(),
        'verifyDealer',
        { dealerId, verified }
      ),
      'verifyDealer'
    );
  }
}
