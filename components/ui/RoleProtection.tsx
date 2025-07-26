import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/services/securityService';

interface RoleGateProps {
  children: React.ReactNode;
  requiredRoles: UserRole[];
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

/**
 * Component that conditionally renders children based on user role
 */
export function RoleGate({
  children,
  requiredRoles,
  fallback,
  requireAuth = false,
}: RoleGateProps) {
  const { user, role } = useAuth();

  // If authentication is required but user is not signed in
  if (requireAuth && !user) {
    return (
      fallback || (
        <View style={styles.container}>
          <Text style={styles.message}>
            Please sign in to access this feature
          </Text>
        </View>
      )
    );
  }

  // If user is signed in but doesn't have required role
  if (user && role && !requiredRoles.includes(role as UserRole)) {
    return (
      fallback || (
        <View style={styles.container}>
          <Text style={styles.message}>
            Access denied. Insufficient permissions.
          </Text>
        </View>
      )
    );
  }

  // If no authentication is required and no role check needed, show content
  if (!requireAuth && !user) {
    return <>{children}</>;
  }

  // User has required permissions
  return <>{children}</>;
}

/**
 * Higher-order component for protecting routes/components
 */
export function withRoleProtection<T extends {}>(
  Component: React.ComponentType<T>,
  requiredRoles: UserRole[],
  fallback?: React.ReactNode,
) {
  return function ProtectedComponent(props: T) {
    return (
      <RoleGate
        requiredRoles={requiredRoles}
        requireAuth={true}
        fallback={fallback}
      >
        <Component {...props} />
      </RoleGate>
    );
  };
}

/**
 * Hook to check if user has specific role permission
 */
export function useRoleCheck(requiredRoles: UserRole[]) {
  const { user, role } = useAuth();

  if (!user) return false;
  if (!role) return false;

  return requiredRoles.includes(role as UserRole);
}

/**
 * Hook to check if user can perform a specific action
 */
export function useCanPerformAction(
  action:
    | 'accessAI'
    | 'bookmarkCars'
    | 'postCars'
    | 'writeReviews'
    | 'moderateContent',
) {
  const { role } = useAuth();

  if (!role) {
    // Public permissions
    return false;
  }

  switch (role) {
    case 'admin':
      return true; // Admin can do everything

    case 'dealer':
      return ['accessAI', 'bookmarkCars', 'postCars'].includes(action);

    case 'user':
    default:
      return ['accessAI', 'bookmarkCars'].includes(action);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
});
