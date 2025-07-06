import { supabase } from '@/lib/supabase';

export type UserRole = 'user' | 'dealer' | 'admin';

export interface SecurityCheck {
  canAccessAI: boolean;
  canBookmarkCars: boolean;
  canPostCars: boolean;
  canWriteReviews: boolean;
  canModeratContent: boolean;
}

/**
 * Security service for role-based access control
 */
export class SecurityService {
  
  /**
   * Get user's current role
   */
  static async getUserRole(userId: string): Promise<UserRole> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error || !data) {
        console.warn('Could not fetch user role, defaulting to user');
        return 'user';
      }
      
      return data.role as UserRole || 'user';
    } catch (error) {
      console.error('Error fetching user role:', error);
      return 'user';
    }
  }
  
  /**
   * Check if user has specific permissions based on role
   */
  static getPermissions(role: UserRole | null): SecurityCheck {
    if (!role) {
      // Public (not signed in)
      return {
        canAccessAI: false,
        canBookmarkCars: false,
        canPostCars: false,
        canWriteReviews: false,
        canModeratContent: false,
      };
    }
    
    switch (role) {
      case 'admin':
        return {
          canAccessAI: true,
          canBookmarkCars: true,
          canPostCars: true,
          canWriteReviews: true,
          canModeratContent: true,
        };
        
      case 'dealer':
        return {
          canAccessAI: true,
          canBookmarkCars: true,
          canPostCars: true,
          canWriteReviews: false,
          canModeratContent: false,
        };
        
      case 'user':
      default:
        return {
          canAccessAI: true,
          canBookmarkCars: true,
          canPostCars: false,
          canWriteReviews: false,
          canModeratContent: false,
        };
    }
  }
  
  /**
   * Check if user can perform a specific action
   */
  static async canPerformAction(
    userId: string | null, 
    action: keyof SecurityCheck
  ): Promise<boolean> {
    if (!userId) {
      const permissions = this.getPermissions(null);
      return permissions[action];
    }
    
    const role = await this.getUserRole(userId);
    const permissions = this.getPermissions(role);
    return permissions[action];
  }
  
  /**
   * Require authentication for protected actions
   */
  static requireAuth(userId: string | null): void {
    if (!userId) {
      throw new Error('Authentication required. Please sign in to continue.');
    }
  }
  
  /**
   * Require specific role for protected actions
   */
  static async requireRole(
    userId: string | null, 
    requiredRoles: UserRole[]
  ): Promise<void> {
    this.requireAuth(userId);
    
    const userRole = await this.getUserRole(userId!);
    
    if (!requiredRoles.includes(userRole)) {
      throw new Error(
        `Access denied. Required role: ${requiredRoles.join(' or ')}, current role: ${userRole}`
      );
    }
  }
  
  /**
   * Create a new user profile with default role
   */
  static async createUserProfile(
    userId: string, 
    email: string, 
    role: UserRole = 'user'
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email,
          role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      if (error) {
        console.error('Error creating user profile:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to create user profile:', error);
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
  ): Promise<void> {
    await this.requireRole(adminUserId, ['admin']);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetUserId);
      
      if (error) {
        console.error('Error updating user role:', error);
        throw error;
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
      throw error;
    }
  }
}

/**
 * React hook for checking permissions
 */
export function usePermissions(role: UserRole | null) {
  return SecurityService.getPermissions(role);
}
