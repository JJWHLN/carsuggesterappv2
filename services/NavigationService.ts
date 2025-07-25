/**
 * Simple Navigation Service - Replaces complex navigation utilities
 */
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

export class NavigationService {
  static async navigateToCar(carId: string) {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/car/${carId}`);
    } catch (error) {
      console.error('Navigation error:', error);
      router.push(`/car/${carId}`);
    }
  }

  static async navigateToModel(modelId: string) {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/model/${modelId}`);
    } catch (error) {
      console.error('Navigation error:', error);
      router.push(`/model/${modelId}`);
    }
  }

  static async navigateToBrand(brandId: string) {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/brand/${brandId}`);
    } catch (error) {
      console.error('Navigation error:', error);
      router.push(`/brand/${brandId}`);
    }
  }

  static async navigateToReview(reviewId: string) {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/review/${reviewId}`);
    } catch (error) {
      console.error('Navigation error:', error);
      router.push(`/review/${reviewId}`);
    }
  }

  static async navigateToSearch(query?: string) {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const path = query ? `/(tabs)/search?q=${encodeURIComponent(query)}` : '/(tabs)/search';
      router.push(path as any);
    } catch (error) {
      console.error('Navigation error:', error);
      router.push('/(tabs)/search');
    }
  }

  static goBack() {
    router.back();
  }
}
