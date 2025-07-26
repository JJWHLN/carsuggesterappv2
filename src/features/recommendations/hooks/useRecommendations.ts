import { useCallback } from 'react';
import { Car, UserPreferences, UserBehavior, Recommendation } from '../types';
import { getRecommendations } from '../RecommendationEngine';

export function useRecommendations(
  cars: Car[],
  userPreferences: UserPreferences,
  userBehavior: UserBehavior,
) {
  return useCallback(() => {
    return getRecommendations(cars, userPreferences, userBehavior);
  }, [cars, userPreferences, userBehavior]);
}
