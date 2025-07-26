import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

/**
 * Unified Navigation Service
 * Replaces all broken navigation TODOs with real routing
 */

export interface NavigationOptions {
  haptic?: boolean;
  replace?: boolean;
  params?: Record<string, any>;
}

export class NavigationService {
  /**
   * Car-related navigation
   */
  static async goToCarDetails(carId: string, options: NavigationOptions = {}) {
    if (options.haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const method = options.replace ? 'replace' : 'push';
    router[method](`/car/${carId}`, options.params);
  }

  static async goToCarComparison(
    carIds: string[],
    options: NavigationOptions = {},
  ) {
    if (options.haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const params = { carIds: carIds.join(','), ...options.params };
    const method = options.replace ? 'replace' : 'push';
    router[method]('/car-comparison', params);
  }

  /**
   * Dealer-related navigation
   */
  static async goToDealer(dealerId: string, options: NavigationOptions = {}) {
    if (options.haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const method = options.replace ? 'replace' : 'push';
    router[method](`/dealer/${dealerId}`, options.params);
  }

  static async goToDealerReviews(
    dealerId: string,
    options: NavigationOptions = {},
  ) {
    if (options.haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const params = { dealerId, ...options.params };
    const method = options.replace ? 'replace' : 'push';
    router[method]('/dealer-reviews', params);
  }

  /**
   * Authentication navigation
   */
  static async goToSignIn(options: NavigationOptions = {}) {
    if (options.haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const method = options.replace ? 'replace' : 'push';
    router[method]('/auth/sign-in', options.params);
  }

  static async goToSignUp(options: NavigationOptions = {}) {
    if (options.haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    const method = options.replace ? 'replace' : 'push';
    router[method]('/auth/sign-up', options.params);
  }

  static async goToForgotPassword(options: NavigationOptions = {}) {
    if (options.haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const method = options.replace ? 'replace' : 'push';
    router[method]('/auth/forgot-password', options.params);
  }

  /**
   * User account navigation
   */
  static async goToProfile(options: NavigationOptions = {}) {
    if (options.haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const method = options.replace ? 'replace' : 'push';
    router[method]('/profile', options.params);
  }

  static async goToSavedCars(options: NavigationOptions = {}) {
    if (options.haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const method = options.replace ? 'replace' : 'push';
    router[method]('/saved-cars', options.params);
  }

  static async goToPreferences(options: NavigationOptions = {}) {
    if (options.haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const method = options.replace ? 'replace' : 'push';
    router[method]('/preferences/onboarding', options.params);
  }

  /**
   * Search and discovery navigation
   */
  static async goToSearch(
    searchParams?: Record<string, any>,
    options: NavigationOptions = {},
  ) {
    if (options.haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const params = { ...searchParams, ...options.params };
    const method = options.replace ? 'replace' : 'push';
    router[method]('/(tabs)/search', params);
  }

  static async goToAIRecommendations(options: NavigationOptions = {}) {
    if (options.haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const method = options.replace ? 'replace' : 'push';
    router[method]('/(tabs)/ai', options.params);
  }

  static async goToMarketplace(options: NavigationOptions = {}) {
    if (options.haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const method = options.replace ? 'replace' : 'push';
    router[method]('/(tabs)/marketplace', options.params);
  }

  /**
   * Utility navigation
   */
  static goBack() {
    router.back();
  }

  static async goHome(options: NavigationOptions = {}) {
    if (options.haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const method = options.replace ? 'replace' : 'push';
    router[method]('/(tabs)/', options.params);
  }

  /**
   * External navigation
   */
  static async openExternalUrl(url: string, options: NavigationOptions = {}) {
    if (options.haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Use Linking API for external URLs
    const { Linking } = await import('react-native');
    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      await Linking.openURL(url);
    } else {
      console.error('Cannot open URL:', url);
    }
  }

  /**
   * Modal navigation
   */
  static async openModal(modalPath: string, params?: Record<string, any>) {
    router.push({
      pathname: modalPath,
      params,
    });
  }

  static closeModal() {
    router.back();
  }
}

/**
 * Navigation Hooks for React components
 */
export const useNavigation = () => {
  return {
    goToCarDetails: NavigationService.goToCarDetails,
    goToDealer: NavigationService.goToDealer,
    goToSignIn: NavigationService.goToSignIn,
    goToSearch: NavigationService.goToSearch,
    goBack: NavigationService.goBack,
    goHome: NavigationService.goHome,
  };
};

/**
 * Navigation Guards
 */
export const NavigationGuards = {
  requireAuth: (navigation: () => void) => {
    return async () => {
      // Check if user is authenticated
      const { getCurrentUser } = await import('@/contexts/AuthContext');
      const user = getCurrentUser();

      if (!user) {
        await NavigationService.goToSignIn({ haptic: true });
        return;
      }

      navigation();
    };
  },

  requireOnboarding: (navigation: () => void) => {
    return async () => {
      // Check if user has completed onboarding
      const { hasCompletedOnboarding } = await import('@/services/storage');
      const completed = await hasCompletedOnboarding();

      if (!completed) {
        await NavigationService.goToPreferences({ haptic: true });
        return;
      }

      navigation();
    };
  },
};
