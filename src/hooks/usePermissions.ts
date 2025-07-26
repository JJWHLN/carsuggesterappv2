import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SecurityService, UserRole } from '@/services/securityService';

/**
 * Hook to get user permissions based on current auth state
 */
export function usePermissions() {
  const { user, role } = useAuth();

  const permissions = useMemo(() => {
    return SecurityService.getPermissions(role as UserRole | null);
  }, [role]);

  const canPerformAction = useMemo(
    () => ({
      accessAI: permissions.canAccessAI,
      bookmarkCars: permissions.canBookmarkCars,
      postCars: permissions.canPostCars,
      writeReviews: permissions.canWriteReviews,
      moderateContent: permissions.canModeratContent,
    }),
    [permissions],
  );

  return {
    user,
    role: role as UserRole | null,
    permissions,
    canPerformAction,
    isAuthenticated: !!user,
    isAdmin: role === 'admin',
    isDealer: role === 'dealer',
    isUser: role === 'user',
  };
}

/**
 * Hook to get a specific permission check function
 */
export function useCanPerformAction(
  action: keyof ReturnType<typeof SecurityService.getPermissions>,
) {
  const { canPerformAction } = usePermissions();
  return canPerformAction[action as keyof typeof canPerformAction] || false;
}
