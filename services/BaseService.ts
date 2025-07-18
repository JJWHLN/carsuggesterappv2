import { supabase } from '@/lib/supabase';
import { SecurityService, UserRole } from './securityService';

/**
 * Base service class with common error handling and utilities
 */
export abstract class BaseService {
  /**
   * Standard error handler for all services
   */
  protected static handleError(error: any, operation: string, context?: any): never {
    console.error(`Error in ${operation}:`, error);
    
    // Log additional context if provided
    if (context) {
      console.error('Context:', context);
    }
    
    // Standardize error messages for common cases
    if (error?.message?.includes('JWT')) {
      throw new Error('Authentication required. Please sign in and try again.');
    }
    
    if (error?.message?.includes('RLS')) {
      throw new Error('Access denied. You do not have permission to perform this action.');
    }
    
    if (error?.message?.includes('duplicate')) {
      throw new Error('This item already exists.');
    }
    
    if (error?.code === 'PGRST116') {
      throw new Error('The requested item was not found.');
    }
    
    // Default to original error
    throw error;
  }

  /**
   * Execute a Supabase query with consistent error handling
   */
  protected static async executeQuery<T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    operation: string,
    context?: any
  ): Promise<T | null> {
    try {
      const { data, error } = await queryFn();
      
      if (error) {
        this.handleError(error, operation, context);
      }
      
      return data;
    } catch (error) {
      this.handleError(error, operation, context);
    }
  }

  /**
   * Execute a Supabase query that returns an array
   */
  protected static async executeQueryArray<T>(
    queryFn: () => Promise<{ data: T[] | null; error: any }>,
    operation: string,
    context?: any
  ): Promise<T[]> {
    try {
      const { data, error } = await queryFn();
      
      if (error) {
        this.handleError(error, operation, context);
      }
      
      return data || [];
    } catch (error) {
      this.handleError(error, operation, context);
    }
  }

  /**
   * Execute operation with admin role check
   */
  protected static async executeAdminOperation<T>(
    adminUserId: string,
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    await SecurityService.requireRole(adminUserId, ['admin']);
    
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, `Admin ${operationName}`, { adminUserId });
    }
  }

  /**
   * Execute operation with role check
   */
  protected static async executeRoleOperation<T>(
    userId: string,
    requiredRoles: UserRole[],
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    await SecurityService.requireRole(userId, requiredRoles);
    
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, operationName, { userId, requiredRoles });
    }
  }

  /**
   * Execute operation with permission check
   */
  protected static async executePermissionOperation<T>(
    userId: string,
    permission: keyof SecurityService['getPermissions'] extends (role: any) => infer R ? keyof R : never,
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const canPerform = await SecurityService.canPerformAction(userId, permission as any);
    if (!canPerform) {
      throw new Error(`You don't have permission to ${operationName.toLowerCase()}`);
    }
    
    try {
      return await operation();
    } catch (error) {
      this.handleError(error, operationName, { userId, permission });
    }
  }

  /**
   * Build select query with relations
   */
  protected static buildSelectQuery(
    table: string,
    fields: string[],
    relations: Record<string, string[]> = {}
  ): string {
    const relationFields = Object.entries(relations)
      .map(([table, fields]) => `${table} (${fields.join(', ')})`)
      .join(', ');

    return [
      ...fields,
      relationFields && relationFields.length > 0 ? relationFields : ''
    ].filter(Boolean).join(', ');
  }

  /**
   * Apply pagination to query
   */
  protected static applyPagination<T>(
    query: any,
    page: number = 0,
    limit: number = 10
  ) {
    const offset = page * limit;
    return query.range(offset, offset + limit - 1);
  }

  /**
   * Apply sorting to query
   */
  protected static applySorting(
    query: any,
    sortBy: string = 'created_at',
    ascending: boolean = false
  ) {
    return query.order(sortBy, { ascending });
  }

  /**
   * Apply filters to query
   */
  protected static applyFilters(
    query: any,
    filters: Record<string, any>
  ) {
    let filteredQuery = query;

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          filteredQuery = filteredQuery.in(key, value);
        } else if (typeof value === 'string' && value.includes('*')) {
          filteredQuery = filteredQuery.ilike(key, value.replace('*', '%'));
        } else {
          filteredQuery = filteredQuery.eq(key, value);
        }
      }
    });

    return filteredQuery;
  }
}

export default BaseService;
