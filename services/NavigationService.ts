/**
 * NavigationService - Unified Navigation System
 * 
 * Replaces broken TODO navigation throughout the app with real expo-router implementation.
 * This is Phase 1 Week 1 of the recovery plan - fixing critical navigation infrastructure.
 * 
 * FIXES: 
 * - Broken navigation in CarCard.tsx
 * - Missing dealer navigation
 * - Incomplete car comparison routing
 * - Auth flow navigation gaps
 * - Search result navigation issues
 */

import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NavigationOptions {
  replace?: boolean;
  params?: Record<string, any>;
  hapticFeedback?: boolean;
  trackNavigation?: boolean;
}

export class NavigationService {
  private static readonly NAVIGATION_HISTORY_KEY = '@navigation_history';
  private static readonly MAX_HISTORY_SIZE = 50;

  // Haptic feedback for navigation (if enabled)
  private static triggerHaptic() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      // Haptics not available, continue silently
    }
  }

  // Navigation tracking for analytics
  private static async logNavigation(destination: string, id?: string, options?: NavigationOptions) {
    try {
      if (options?.trackNavigation === false) return;

      const navigationEvent = {
        destination,
        id,
        timestamp: new Date().toISOString(),
        params: options?.params,
      };

      // Store navigation history for debugging and analytics
      const history = await this.getNavigationHistory();
      history.push(navigationEvent);
      
      // Keep only recent navigation events
      if (history.length > this.MAX_HISTORY_SIZE) {
        history.shift();
      }
      
      await AsyncStorage.setItem(this.NAVIGATION_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('NavigationService: Error logging navigation:', error);
    }
  }

  private static async getNavigationHistory(): Promise<any[]> {
    try {
      const historyString = await AsyncStorage.getItem(this.NAVIGATION_HISTORY_KEY);
      return historyString ? JSON.parse(historyString) : [];
    } catch (error) {
      return [];
    }
  }

  // Car navigation with real implementation
  static navigateToCar(carId: string, options?: NavigationOptions) {
    try {
      if (!carId || carId.trim() === '') {
        console.error('NavigationService: Invalid car ID provided');
        return;
      }

      this.triggerHaptic();
      console.log(`NavigationService: Navigating to car ${carId}`);
      
      if (options?.replace) {
        router.replace({
          pathname: '/car/[id]',
          params: { id: carId, ...(options.params || {}) }
        });
      } else {
        router.push({
          pathname: '/car/[id]',
          params: { id: carId, ...(options?.params || {}) }
        });
      }
      
      this.logNavigation('car', carId, options);
    } catch (error) {
      console.error('NavigationService: Error navigating to car:', error);
    }
  }

  // Dealer navigation with real implementation
  static navigateToDealer(dealerId: string, options?: NavigationOptions) {
    try {
      if (!dealerId || dealerId.trim() === '') {
        console.error('NavigationService: Invalid dealer ID provided');
        return;
      }

      this.triggerHaptic();
      console.log(`NavigationService: Navigating to dealer ${dealerId}`);
      
      router.push({
        pathname: '/dealer/[id]',
        params: { id: dealerId }
      });
      
      this.logNavigation('dealer', dealerId, options);
    } catch (error) {
      console.error('NavigationService: Error navigating to dealer:', error);
    }
  }

  static navigateToDealerInventory(dealerId: string, options?: NavigationOptions) {
    try {
      if (!dealerId || dealerId.trim() === '') {
        console.error('NavigationService: Invalid dealer ID provided');
        return;
      }

      this.triggerHaptic();
      console.log(`NavigationService: Navigating to dealer ${dealerId} inventory`);
      
      router.push({
        pathname: '/dealer/[id]/inventory',
        params: { id: dealerId }
      });
      
      this.logNavigation('dealer-inventory', dealerId, options);
    } catch (error) {
      console.error('NavigationService: Error navigating to dealer inventory:', error);
    }
  }

  static navigateToDealerReviews(dealerId: string, options?: NavigationOptions) {
    try {
      if (!dealerId || dealerId.trim() === '') {
        console.error('NavigationService: Invalid dealer ID provided');
        return;
      }

      this.triggerHaptic();
      console.log(`NavigationService: Navigating to dealer ${dealerId} reviews`);
      
      router.push({
        pathname: '/dealer/[id]/reviews',
        params: { id: dealerId }
      });
      
      this.logNavigation('dealer-reviews', dealerId, options);
    } catch (error) {
      console.error('NavigationService: Error navigating to dealer reviews:', error);
    }
  }

  // Car comparison navigation with real implementation
  static navigateToComparison(comparisonId?: string, carIds?: string[], options?: NavigationOptions) {
    try {
      this.triggerHaptic();

      if (comparisonId) {
        console.log(`NavigationService: Navigating to comparison ${comparisonId}`);
        router.push({
          pathname: '/compare/[id]',
          params: { id: comparisonId }
        });
        this.logNavigation('comparison', comparisonId, options);
      } else if (carIds && carIds.length > 0) {
        const carIdsString = carIds.join(',');
        console.log(`NavigationService: Creating comparison with cars: ${carIdsString}`);
        router.push({
          pathname: '/compare/[id]',
          params: { carIds: carIdsString }
        });
        this.logNavigation('comparison-create', carIdsString, options);
      } else {
        console.error('NavigationService: No comparison ID or car IDs provided');
      }
    } catch (error) {
      console.error('NavigationService: Error navigating to comparison:', error);
    }
  }

  // Search navigation with real implementation
  static navigateToSearch(query?: string, filters?: Record<string, any>, options?: NavigationOptions) {
    try {
      this.triggerHaptic();
      console.log(`NavigationService: Navigating to search${query ? ` with query: ${query}` : ''}`);
      
      const params: Record<string, any> = {};
      if (query) params.query = query;
      if (filters) params.filters = JSON.stringify(filters);
      if (options?.params) Object.assign(params, options.params);

      router.push({
        pathname: '/search',
        params
      });
      
      this.logNavigation('search', query, options);
    } catch (error) {
      console.error('NavigationService: Error navigating to search:', error);
    }
  }

  // Brand navigation with real implementation
  static navigateToBrand(brandId: string, options?: NavigationOptions) {
    try {
      if (!brandId || brandId.trim() === '') {
        console.error('NavigationService: Invalid brand ID provided');
        return;
      }

      this.triggerHaptic();
      console.log(`NavigationService: Navigating to brand ${brandId}`);
      
      router.push({
        pathname: '/brand/[id]',
        params: { id: brandId }
      });
      
      this.logNavigation('brand', brandId, options);
    } catch (error) {
      console.error('NavigationService: Error navigating to brand:', error);
    }
  }

  // Model navigation with real implementation
  static navigateToModel(modelId: string, options?: NavigationOptions) {
    try {
      if (!modelId || modelId.trim() === '') {
        console.error('NavigationService: Invalid model ID provided');
        return;
      }

      this.triggerHaptic();
      console.log(`NavigationService: Navigating to model ${modelId}`);
      
      router.push({
        pathname: '/model/[id]',
        params: { id: modelId }
      });
      
      this.logNavigation('model', modelId, options);
    } catch (error) {
      console.error('NavigationService: Error navigating to model:', error);
    }
  }

  // Review navigation with real implementation
  static navigateToReview(reviewId: string, options?: NavigationOptions) {
    try {
      if (!reviewId || reviewId.trim() === '') {
        console.error('NavigationService: Invalid review ID provided');
        return;
      }

      this.triggerHaptic();
      console.log(`NavigationService: Navigating to review ${reviewId}`);
      
      router.push({
        pathname: '/review/[id]',
        params: { id: reviewId }
      });
      
      this.logNavigation('review', reviewId, options);
    } catch (error) {
      console.error('NavigationService: Error navigating to review:', error);
    }
  }

  // Auth navigation with real implementation
  static navigateToAuth(screen: 'sign-in' | 'sign-up' | 'forgot-password', options?: NavigationOptions) {
    try {
      this.triggerHaptic();
      console.log(`NavigationService: Navigating to auth screen: ${screen}`);
      
      router.push({
        pathname: `/auth/${screen}`,
        params: options?.params
      });
      
      this.logNavigation('auth', screen, options);
    } catch (error) {
      console.error('NavigationService: Error navigating to auth:', error);
    }
  }

  // Tab navigation with real implementation
  static navigateToTab(tab: 'index' | 'search' | 'marketplace' | 'models' | 'reviews' | 'profile', options?: NavigationOptions) {
    try {
      this.triggerHaptic();
      console.log(`NavigationService: Navigating to tab: ${tab}`);
      
      if (options?.replace) {
        router.replace(`/(tabs)/${tab}`);
      } else {
        router.push(`/(tabs)/${tab}`);
      }
      
      this.logNavigation('tab', tab, options);
    } catch (error) {
      console.error('NavigationService: Error navigating to tab:', error);
    }
  }

  // Back navigation with real implementation
  static goBack(options?: NavigationOptions) {
    try {
      this.triggerHaptic();
      console.log('NavigationService: Going back');
      
      if (router.canGoBack()) {
        router.back();
      } else {
        // Fallback to home if no back history
        this.navigateToTab('index', { replace: true });
      }
      
      this.logNavigation('back', undefined, options);
    } catch (error) {
      console.error('NavigationService: Error going back:', error);
    }
  }

  // Utility methods
  static canGoBack(): boolean {
    try {
      return router.canGoBack();
    } catch (error) {
      console.error('NavigationService: Error checking if can go back:', error);
      return false;
    }
  }

  static async getNavigationHistoryForDebug(): Promise<any[]> {
    return this.getNavigationHistory();
  }

  static async clearNavigationHistory(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.NAVIGATION_HISTORY_KEY);
    } catch (error) {
      console.error('NavigationService: Error clearing navigation history:', error);
    }
  }
}

export default NavigationService;
