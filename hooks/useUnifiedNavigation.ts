import { useCallback } from 'react';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

/**
 * Unified navigation handlers that consolidate all navigation patterns
 * across the app. This eliminates the repetitive navigation handlers
 * found in multiple components.
 */

export interface NavigationOptions {
  withHaptics?: boolean;
  hapticType?: 'light' | 'medium' | 'heavy';
  logNavigation?: boolean;
  analyticsEvent?: string;
}

export function useUnifiedNavigation() {
  // Helper function to trigger haptics
  const triggerHaptics = useCallback(async (type: 'light' | 'medium' | 'heavy' = 'light') => {
    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    } catch (error) {
      console.warn('Haptics not available:', error);
    }
  }, []);

  // Generic navigation handler
  const navigateTo = useCallback(async (
    path: string,
    options: NavigationOptions = {}
  ) => {
    const {
      withHaptics = true,
      hapticType = 'light',
      logNavigation = true,
      analyticsEvent
    } = options;

    if (withHaptics) {
      await triggerHaptics(hapticType);
    }

    if (logNavigation) {
      console.log('Navigation:', path);
    }

    if (analyticsEvent) {
      // Track navigation event
      console.log('Analytics Event:', analyticsEvent, { path });
    }

    router.push(path as any);
  }, [triggerHaptics]);

  // Specific navigation handlers
  const navigateToCarDetails = useCallback((carId: string | number, options?: NavigationOptions) => {
    navigateTo(`/car/${carId}`, { analyticsEvent: 'view_car_details', ...options });
  }, [navigateTo]);

  const navigateToModelDetails = useCallback((modelId: string | number, options?: NavigationOptions) => {
    navigateTo(`/model/${modelId}`, { analyticsEvent: 'view_model_details', ...options });
  }, [navigateTo]);

  const navigateToBrandDetails = useCallback((brandId: string | number, options?: NavigationOptions) => {
    navigateTo(`/brand/${brandId}`, { analyticsEvent: 'view_brand_details', ...options });
  }, [navigateTo]);

  const navigateToReviewDetails = useCallback((reviewId: string | number, options?: NavigationOptions) => {
    navigateTo(`/review/${reviewId}`, { analyticsEvent: 'view_review_details', ...options });
  }, [navigateTo]);

  const navigateToSearch = useCallback((options?: NavigationOptions) => {
    navigateTo('/search', { analyticsEvent: 'open_search', ...options });
  }, [navigateTo]);

  const navigateToMarketplace = useCallback((options?: NavigationOptions) => {
    navigateTo('/marketplace', { analyticsEvent: 'open_marketplace', ...options });
  }, [navigateTo]);

  const navigateToProfile = useCallback((options?: NavigationOptions) => {
    navigateTo('/profile', { analyticsEvent: 'open_profile', ...options });
  }, [navigateTo]);

  const navigateToAuth = useCallback((screen: 'sign-in' | 'sign-up' | 'forgot-password' = 'sign-in', options?: NavigationOptions) => {
    navigateTo(`/auth/${screen}`, { analyticsEvent: `open_${screen}`, ...options });
  }, [navigateTo]);

  const navigateToBookmarks = useCallback((options?: NavigationOptions) => {
    navigateTo('/bookmarks', { analyticsEvent: 'open_bookmarks', ...options });
  }, [navigateTo]);

  // Navigation with data
  const navigateToSearchWithQuery = useCallback((query: string, options?: NavigationOptions) => {
    navigateTo(`/search?q=${encodeURIComponent(query)}`, { 
      analyticsEvent: 'search_with_query', 
      ...options 
    });
  }, [navigateTo]);

  const navigateToMarketplaceWithFilters = useCallback((filters: Record<string, any>, options?: NavigationOptions) => {
    const queryString = Object.entries(filters)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    
    navigateTo(`/marketplace?${queryString}`, { 
      analyticsEvent: 'marketplace_with_filters', 
      ...options 
    });
  }, [navigateTo]);

  // Back navigation
  const navigateBack = useCallback(async (options?: NavigationOptions) => {
    const { withHaptics = true, hapticType = 'light' } = options || {};
    
    if (withHaptics) {
      await triggerHaptics(hapticType);
    }
    
    router.back();
  }, [triggerHaptics]);

  // Replace current route
  const replaceWith = useCallback(async (path: string, options?: NavigationOptions) => {
    const { withHaptics = true, hapticType = 'light' } = options || {};
    
    if (withHaptics) {
      await triggerHaptics(hapticType);
    }
    
    router.replace(path as any);
  }, [triggerHaptics]);

  return {
    // Generic navigation
    navigateTo,
    navigateBack,
    replaceWith,
    
    // Specific navigation handlers
    navigateToCarDetails,
    navigateToModelDetails,
    navigateToBrandDetails,
    navigateToReviewDetails,
    navigateToSearch,
    navigateToMarketplace,
    navigateToProfile,
    navigateToAuth,
    navigateToBookmarks,
    
    // Navigation with data
    navigateToSearchWithQuery,
    navigateToMarketplaceWithFilters,
    
    // Utility
    triggerHaptics,
  };
}

/**
 * Hook for common screen actions like share, save, etc.
 * This consolidates actions that appear across multiple screens
 */
export function useCommonScreenActions() {
  const { triggerHaptics } = useUnifiedNavigation();

  const handleSave = useCallback(async (
    itemId: string | number,
    itemType: 'car' | 'model' | 'brand' | 'review',
    currentState: boolean,
    onToggle: (newState: boolean) => void
  ) => {
    await triggerHaptics('light');
    const newState = !currentState;
    onToggle(newState);
    
    console.log(`${newState ? 'Saved' : 'Unsaved'} ${itemType}:`, itemId);
    
    // TODO: Implement actual save logic
  }, [triggerHaptics]);

  const handleShare = useCallback(async (
    title: string,
    url?: string,
    message?: string
  ) => {
    await triggerHaptics('light');
    
    try {
      const { Share } = await import('react-native');
      
      await Share.share({
        title,
        message: message || title,
        url: url || '',
      });
    } catch (error) {
      console.warn('Share failed:', error);
    }
  }, [triggerHaptics]);

  const handleContact = useCallback(async (
    contactType: 'phone' | 'email' | 'message',
    contactInfo: string,
    itemTitle?: string
  ) => {
    await triggerHaptics('medium');
    
    console.log(`Contact via ${contactType}:`, contactInfo, itemTitle);
    
    // TODO: Implement actual contact logic
    // - Phone: open phone app
    // - Email: open email app
    // - Message: open messaging app
  }, [triggerHaptics]);

  const handleExternalLink = useCallback(async (url: string) => {
    await triggerHaptics('light');
    
    try {
      const { default: Linking } = await import('react-native').then(rn => ({ default: rn.Linking }));
      await Linking.openURL(url);
    } catch (error) {
      console.warn('Failed to open external link:', error);
    }
  }, [triggerHaptics]);

  return {
    handleSave,
    handleShare,
    handleContact,
    handleExternalLink,
  };
}

/**
 * Hook for common list actions like refresh, load more, etc.
 * This consolidates list interaction patterns
 */
export function useCommonListActions() {
  const { triggerHaptics } = useUnifiedNavigation();

  const handleRefresh = useCallback(async (refreshFunction: () => void | Promise<void>) => {
    await triggerHaptics('light');
    await refreshFunction();
  }, [triggerHaptics]);

  const handleLoadMore = useCallback(async (loadMoreFunction: () => void | Promise<void>) => {
    await loadMoreFunction();
  }, []);

  const handleItemPress = useCallback(async (
    itemId: string | number,
    itemType: 'car' | 'model' | 'brand' | 'review',
    onPress: (id: string | number) => void
  ) => {
    await triggerHaptics('light');
    onPress(itemId);
  }, [triggerHaptics]);

  const handleSearch = useCallback(async (
    query: string,
    searchFunction: (query: string) => void | Promise<void>
  ) => {
    await searchFunction(query);
  }, []);

  const handleFilter = useCallback(async (
    filters: Record<string, any>,
    filterFunction: (filters: Record<string, any>) => void | Promise<void>
  ) => {
    await triggerHaptics('light');
    await filterFunction(filters);
  }, [triggerHaptics]);

  return {
    handleRefresh,
    handleLoadMore,
    handleItemPress,
    handleSearch,
    handleFilter,
  };
}

export default useUnifiedNavigation;
