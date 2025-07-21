/**
 * Simple but Effective Car Recommendation Engine
 * Provides practical recommendations based on user preferences and behavior
 */

import { Car } from '@/types/database';
import CarDataService from './CarDataService';

export interface UserPreferences {
  budget?: { min: number; max: number };
  preferredMakes?: string[];
  preferredBodyTypes?: string[];
  preferredFuelTypes?: string[];
  maxMileage?: number;
  preferredYearRange?: { min: number; max: number };
  location?: string;
}

export interface UserBehavior {
  viewedCars: string[]; // Car IDs user has viewed
  savedCars: string[]; // Car IDs user has saved
  searchHistory: string[]; // Recent search terms
  makeInteractions: Record<string, number>; // Make -> interaction count
  priceRangeViews: Array<{ min: number; max: number; count: number }>;
}

export interface RecommendationScore {
  carId: string;
  score: number;
  reasons: string[];
  category: 'budget_match' | 'brand_preference' | 'similar_to_viewed' | 'popular_choice' | 'great_value';
}

export interface RecommendationResult {
  cars: Car[];
  scores: RecommendationScore[];
  explanation: string;
}

/**
 * Simple Recommendation Engine
 * Focuses on practical, explainable recommendations
 */
export class SimpleRecommendationEngine {
  private static instance: SimpleRecommendationEngine;
  private carDataService: CarDataService;

  constructor() {
    this.carDataService = CarDataService.getInstance();
  }

  public static getInstance(): SimpleRecommendationEngine {
    if (!SimpleRecommendationEngine.instance) {
      SimpleRecommendationEngine.instance = new SimpleRecommendationEngine();
    }
    return SimpleRecommendationEngine.instance;
  }

  /**
   * Get personalized recommendations for a user
   */
  async getRecommendations(
    userId: string,
    preferences: UserPreferences,
    behavior: UserBehavior,
    limit: number = 10
  ): Promise<RecommendationResult> {
    try {
      // Get base set of cars to recommend from
      const baseCars = await this.getBaseCandidates(preferences, limit * 3);
      
      // Score each car
      const scores = await this.scoreCars(baseCars, preferences, behavior);
      
      // Sort by score and take top results
      const topScores = scores
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      
      // Get full car details for top recommendations
      const recommendedCars = baseCars.filter(car => 
        topScores.some(score => score.carId === car.id)
      );

      return {
        cars: recommendedCars,
        scores: topScores,
        explanation: this.generateExplanation(topScores, preferences)
      };

    } catch (error) {
      // Fallback to recent cars if recommendation fails
      const fallbackCars = await this.carDataService.getRecentCars(limit);
      return {
        cars: fallbackCars,
        scores: [],
        explanation: "Showing recent car listings. Set your preferences for personalized recommendations."
      };
    }
  }

  /**
   * Get recommendations for first-time users (no behavior data)
   */
  async getNewUserRecommendations(limit: number = 10): Promise<Car[]> {
    try {
      // Mix of featured and popular cars
      const [featuredCars, popularMakes] = await Promise.all([
        this.carDataService.getFeaturedCars(limit / 2),
        this.carDataService.getPopularMakes()
      ]);

      // Get cars from popular makes
      const popularCars = await Promise.all(
        popularMakes.slice(0, 3).map(({ make }) =>
          this.carDataService.getCarsByMake(make, 2)
        )
      );

      const allCars = [
        ...featuredCars,
        ...popularCars.flat()
      ];

      // Remove duplicates and limit
      const uniqueCars = allCars.filter((car, index, self) =>
        index === self.findIndex(c => c.id === car.id)
      );

      return uniqueCars.slice(0, limit);

    } catch (error) {
      // Fallback to recent cars
      return this.carDataService.getRecentCars(limit);
    }
  }

  /**
   * Get budget-based recommendations
   */
  async getBudgetRecommendations(
    budget: { min: number; max: number },
    limit: number = 10
  ): Promise<Car[]> {
    const searchResult = await this.carDataService.searchCars({
      filters: { priceRange: budget },
      sortBy: 'price',
      sortOrder: 'asc',
      limit
    });

    return searchResult.cars;
  }

  /**
   * Get similar cars to one the user viewed
   */
  async getSimilarCarsRecommendations(carId: string, limit: number = 5): Promise<Car[]> {
    return this.carDataService.getSimilarCars(carId, limit);
  }

  private async getBaseCandidates(preferences: UserPreferences, limit: number): Promise<Car[]> {
    const searchResult = await this.carDataService.searchCars({
      filters: {
        priceRange: preferences.budget,
        make: preferences.preferredMakes?.[0], // Use first preferred make
        yearRange: preferences.preferredYearRange,
        mileageRange: preferences.maxMileage ? { min: 0, max: preferences.maxMileage } : undefined,
        fuelType: preferences.preferredFuelTypes,
        location: preferences.location
      },
      limit,
      sortBy: 'created_at',
      sortOrder: 'desc'
    });

    return searchResult.cars;
  }

  private async scoreCars(
    cars: Car[],
    preferences: UserPreferences,
    behavior: UserBehavior
  ): Promise<RecommendationScore[]> {
    return cars.map(car => {
      let score = 0;
      const reasons: string[] = [];
      let category: RecommendationScore['category'] = 'popular_choice';

      // Budget match scoring (high weight)
      if (preferences.budget) {
        const { min, max } = preferences.budget;
        if (car.price >= min && car.price <= max) {
          score += 30;
          reasons.push('Fits your budget');
          category = 'budget_match';
        } else if (car.price < max * 1.1) { // Within 10% of budget
          score += 15;
          reasons.push('Close to your budget');
        }
      }

      // Brand preference scoring
      if (preferences.preferredMakes?.includes(car.make)) {
        score += 25;
        reasons.push(`You prefer ${car.make}`);
        if (category === 'popular_choice') category = 'brand_preference';
      }

      // Behavior-based scoring
      if (behavior.makeInteractions[car.make]) {
        const interactions = behavior.makeInteractions[car.make];
        score += Math.min(interactions * 5, 20); // Cap at 20 points
        reasons.push(`You've shown interest in ${car.make}`);
        if (category === 'popular_choice') category = 'similar_to_viewed';
      }

      // Year preference
      if (preferences.preferredYearRange) {
        const { min, max } = preferences.preferredYearRange;
        if (car.year >= min && car.year <= max) {
          score += 15;
          reasons.push('Matches your preferred year range');
        }
      }

      // Mileage preference
      if (preferences.maxMileage && car.mileage <= preferences.maxMileage) {
        score += 10;
        reasons.push('Low mileage');
      }

      // Fuel type preference
      if (preferences.preferredFuelTypes?.includes(car.fuel_type || '')) {
        score += 10;
        reasons.push('Preferred fuel type');
      }

      // Dealer verification bonus
      if (car.dealer?.verified) {
        score += 5;
        reasons.push('Verified dealer');
      }

      // Value scoring (price vs year/mileage)
      const ageScore = Math.max(0, 10 - (new Date().getFullYear() - car.year));
      const mileageScore = car.mileage > 0 ? Math.max(0, 10 - (car.mileage / 20000)) : 5;
      const valueScore = (ageScore + mileageScore) / 2;
      
      if (valueScore > 7) {
        score += 10;
        reasons.push('Great value');
        if (category === 'popular_choice') category = 'great_value';
      }

      // Location bonus
      if (preferences.location && car.location.toLowerCase().includes(preferences.location.toLowerCase())) {
        score += 8;
        reasons.push('Near your location');
      }

      return {
        carId: car.id,
        score: Math.round(score),
        reasons: reasons.slice(0, 3), // Limit to top 3 reasons
        category
      };
    });
  }

  private generateExplanation(scores: RecommendationScore[], preferences: UserPreferences): string {
    if (scores.length === 0) {
      return "No specific recommendations available. Try adjusting your search criteria.";
    }

    const topScore = scores[0];
    const avgScore = scores.reduce((sum, score) => sum + score.score, 0) / scores.length;

    let explanation = "Based on your preferences, ";

    if (preferences.budget) {
      explanation += `we found cars in your $${preferences.budget.min.toLocaleString()}-$${preferences.budget.max.toLocaleString()} budget range`;
    } else {
      explanation += "we found cars that match your interests";
    }

    if (preferences.preferredMakes && preferences.preferredMakes.length > 0) {
      explanation += ` with focus on ${preferences.preferredMakes.join(', ')}`;
    }

    explanation += `. Top match scores ${topScore.score}% relevance.`;

    return explanation;
  }
}

export default SimpleRecommendationEngine;
