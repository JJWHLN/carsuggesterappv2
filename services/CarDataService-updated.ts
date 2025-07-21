/**
 * CarDataService - Updated for your actual Supabase schema
 * Universal hub for all car-related operations with your production database
 */

import { supabase } from '@/lib/supabase';
import {
  CarModel,
  Brand,
  VehicleListing,
  Review as DatabaseReview,
  FeaturedCar,
  RecommendedCar,
  SearchFilters,
  CarSearchResult,
  Bookmark
} from '@/types/database-updated';

import * as api from './api-updated';

export class CarDataService {
  private static instance: CarDataService;

  static getInstance(): CarDataService {
    if (!CarDataService.instance) {
      CarDataService.instance = new CarDataService();
    }
    return CarDataService.instance;
  }

  // ===== CAR MODELS & BRANDS =====

  /**
   * Get all car models with optional filtering
   */
  async getCarModels(options: {
    limit?: number;
    searchQuery?: string;
    brandName?: string;
    filters?: SearchFilters;
  } = {}): Promise<CarModel[]> {
    try {
      return await api.fetchCarModels(options);
    } catch (error) {
      console.error('CarDataService: Error fetching car models:', error);
      return [];
    }
  }

  /**
   * Get all available car brands
   */
  async getBrands(): Promise<Brand[]> {
    try {
      return await api.fetchBrands();
    } catch (error) {
      console.error('CarDataService: Error fetching brands:', error);
      return [];
    }
  }

  /**
   * Get single car model by ID
   */
  async getCarById(id: string): Promise<CarModel | null> {
    try {
      return await api.fetchCarById(id);
    } catch (error) {
      console.error('CarDataService: Error fetching car by ID:', error);
      return null;
    }
  }

  /**
   * Get featured cars for homepage
   */
  async getFeaturedCars(limit: number = 6): Promise<CarModel[]> {
    try {
      return await api.fetchFeaturedCars(limit);
    } catch (error) {
      console.error('CarDataService: Error fetching featured cars:', error);
      return [];
    }
  }

  /**
   * Get AI-recommended cars
   */
  async getRecommendedCars(limit: number = 8): Promise<CarModel[]> {
    try {
      return await api.fetchRecommendedCars(limit);
    } catch (error) {
      console.error('CarDataService: Error fetching recommended cars:', error);
      return [];
    }
  }

  /**
   * Find similar cars to a given car
   */
  async getSimilarCars(carId: string): Promise<CarModel[]> {
    try {
      return await api.fetchSimilarCars(carId);
    } catch (error) {
      console.error('CarDataService: Error fetching similar cars:', error);
      return [];
    }
  }

  // ===== VEHICLE LISTINGS (MARKETPLACE) =====

  /**
   * Get vehicle listings from dealers
   */
  async getVehicleListings(options: {
    limit?: number;
    offset?: number;
    filters?: SearchFilters;
    location?: string;
  } = {}): Promise<VehicleListing[]> {
    try {
      return await api.fetchVehicleListings(options);
    } catch (error) {
      console.error('CarDataService: Error fetching vehicle listings:', error);
      return [];
    }
  }

  // ===== SEARCH FUNCTIONALITY =====

  /**
   * Advanced search across car models and listings
   */
  async searchCars(
    query: string,
    filters: SearchFilters = {},
    options: {
      page?: number;
      limit?: number;
      includeListings?: boolean;
    } = {}
  ): Promise<CarSearchResult> {
    try {
      return await api.searchCars(query, filters, options);
    } catch (error) {
      console.error('CarDataService: Error searching cars:', error);
      return {
        cars: [],
        total: 0,
        page: options.page || 1,
        limit: options.limit || 20,
        filters
      };
    }
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSearchSuggestions(query: string): Promise<string[]> {
    try {
      if (query.length < 2) return [];

      // Get suggestions from car models and brands
      const [models, brands] = await Promise.all([
        this.getCarModels({ searchQuery: query, limit: 5 }),
        this.getBrands()
      ]);

      const suggestions = new Set<string>();

      // Add car model names
      models.forEach(car => {
        if (car.name.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(car.name);
        }
        if (car.model.toLowerCase().includes(query.toLowerCase())) {
          suggestions.add(`${car.brands?.name} ${car.model}`);
        }
      });

      // Add brand names
      brands
        .filter(brand => brand.name.toLowerCase().includes(query.toLowerCase()))
        .forEach(brand => suggestions.add(brand.name));

      return Array.from(suggestions).slice(0, 8);
    } catch (error) {
      console.error('CarDataService: Error getting search suggestions:', error);
      return [];
    }
  }

  // ===== REVIEWS =====

  /**
   * Get reviews for a specific car model
   */
  async getReviewsForCar(modelId: number): Promise<DatabaseReview[]> {
    try {
      return await api.fetchReviewsForCar(modelId);
    } catch (error) {
      console.error('CarDataService: Error fetching reviews:', error);
      return [];
    }
  }

  // ===== USER BOOKMARKS =====

  /**
   * Get user's bookmarked items
   */
  async getUserBookmarks(userId: string): Promise<Bookmark[]> {
    try {
      return await api.fetchUserBookmarks(userId);
    } catch (error) {
      console.error('CarDataService: Error fetching bookmarks:', error);
      return [];
    }
  }

  /**
   * Add item to user's bookmarks
   */
  async addBookmark(userId: string, targetType: string, targetId: string): Promise<boolean> {
    try {
      await api.addBookmark(userId, targetType, targetId);
      return true;
    } catch (error) {
      console.error('CarDataService: Error adding bookmark:', error);
      return false;
    }
  }

  /**
   * Remove item from user's bookmarks
   */
  async removeBookmark(userId: string, targetType: string, targetId: string): Promise<boolean> {
    try {
      await api.removeBookmark(userId, targetType, targetId);
      return true;
    } catch (error) {
      console.error('CarDataService: Error removing bookmark:', error);
      return false;
    }
  }

  /**
   * Check if item is bookmarked by user
   */
  async isBookmarked(userId: string, targetType: string, targetId: string): Promise<boolean> {
    try {
      const bookmarks = await this.getUserBookmarks(userId);
      return bookmarks.some(
        bookmark => 
          bookmark.target_type === targetType && 
          bookmark.target_id === targetId
      );
    } catch (error) {
      console.error('CarDataService: Error checking bookmark status:', error);
      return false;
    }
  }

  // ===== HOMEPAGE CONTENT =====

  /**
   * Get all content needed for the homepage
   */
  async getHomepageContent(): Promise<{
    featuredCars: CarModel[];
    recommendedCars: CarModel[];
    popularBrands: Brand[];
    recentListings: VehicleListing[];
  }> {
    try {
      return await api.fetchHomepageContent();
    } catch (error) {
      console.error('CarDataService: Error fetching homepage content:', error);
      return {
        featuredCars: [],
        recommendedCars: [],
        popularBrands: [],
        recentListings: []
      };
    }
  }

  // ===== FILTERS & CATEGORIES =====

  /**
   * Get all available filter options dynamically from database
   */
  async getFilterOptions(): Promise<{
    brands: string[];
    fuelTypes: string[];
    transmissions: string[];
    bodyTypes: string[];
    yearRange: { min: number; max: number };
    priceRange: { min: number; max: number };
  }> {
    try {
      const [models, brands] = await Promise.all([
        this.getCarModels({ limit: 1000 }), // Get all for analysis
        this.getBrands()
      ]);

      // Extract unique values
      const fuelTypes = [...new Set(models.map(car => car.fuel_type).filter((type): type is string => Boolean(type)))];
      const transmissions = [...new Set(models.map(car => car.transmission).filter((trans): trans is string => Boolean(trans)))];
      const bodyTypes = [...new Set(models.flatMap(car => car.category || []))];
      
      const years = models.map(car => car.year).filter((year): year is number => Boolean(year));
      const prices = models.map(car => car.price_from).filter((price): price is number => Boolean(price));

      return {
        brands: brands.map(brand => brand.name),
        fuelTypes,
        transmissions,
        bodyTypes,
        yearRange: {
          min: years.length > 0 ? Math.min(...years) : 2020,
          max: years.length > 0 ? Math.max(...years) : 2024
        },
        priceRange: {
          min: prices.length > 0 ? Math.min(...prices) : 15000,
          max: prices.length > 0 ? Math.max(...prices) : 80000
        }
      };
    } catch (error) {
      console.error('CarDataService: Error getting filter options:', error);
      return {
        brands: [],
        fuelTypes: [],
        transmissions: [],
        bodyTypes: [],
        yearRange: { min: 2020, max: 2024 },
        priceRange: { min: 15000, max: 80000 }
      };
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Format price for display
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  /**
   * Get price range display text
   */
  getPriceRangeText(car: CarModel): string {
    if (car.price_from && car.price_to) {
      return `${this.formatPrice(car.price_from)} - ${this.formatPrice(car.price_to)}`;
    } else if (car.price_from) {
      return `From ${this.formatPrice(car.price_from)}`;
    }
    return 'Price on request';
  }

  /**
   * Get car display name
   */
  getCarDisplayName(car: CarModel): string {
    const brandName = car.brands?.name || '';
    return `${brandName} ${car.model} ${car.year}`.trim();
  }

  /**
   * Check service health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const health = await api.checkDatabaseHealth();
      return health.isHealthy;
    } catch (error) {
      console.error('CarDataService: Health check failed:', error);
      return false;
    }
  }
}

export default CarDataService;
