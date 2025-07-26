import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { Car } from '@/src/features/recommendations/types';

export interface CarData extends Car {
  images?: string[];
  dealer?: {
    id: string;
    name: string;
    location: string;
    phone: string;
    rating: number;
  };
  priceHistory?: Array<{
    date: string;
    price: number;
  }>;
  isBookmarked?: boolean;
  viewCount?: number;
  lastViewed?: string;
}

export interface CarFilters {
  make?: string[];
  model?: string[];
  year?: {
    min: number;
    max: number;
  };
  price?: {
    min: number;
    max: number;
  };
  bodyStyle?: string[];
  fuelEfficiency?: {
    min: number;
  };
  safetyRating?: {
    min: number;
  };
  features?: string[];
  location?: {
    radius: number;
    center: [number, number]; // [lat, lng]
  };
  condition?: 'new' | 'used' | 'certified';
  transmission?: string[];
  drivetrain?: string[];
  exteriorColor?: string[];
  interiorColor?: string[];
}

export interface ComparisonCar extends CarData {
  comparisonData?: {
    pros: string[];
    cons: string[];
    score: number;
  };
}

interface CarStore {
  // Car Data
  cars: CarData[];
  featuredCars: CarData[];
  recommendedCars: CarData[];
  recentlyViewed: CarData[];
  bookmarkedCars: CarData[];

  // Comparison
  comparisonCars: ComparisonCar[];
  maxComparisons: number;

  // Loading States
  isLoading: boolean;
  isLoadingFeatured: boolean;
  isLoadingRecommended: boolean;

  // Error States
  error: string | null;

  // Actions
  setCars: (cars: CarData[]) => void;
  addCar: (car: CarData) => void;
  updateCar: (id: string, updates: Partial<CarData>) => void;
  removeCar: (id: string) => void;
  getCarById: (id: string) => CarData | undefined;

  // Featured Cars
  setFeaturedCars: (cars: CarData[]) => void;
  loadFeaturedCars: () => Promise<void>;

  // Recommended Cars
  setRecommendedCars: (cars: CarData[]) => void;
  loadRecommendedCars: (userId?: string) => Promise<void>;

  // Recently Viewed
  addToRecentlyViewed: (car: CarData) => void;
  clearRecentlyViewed: () => void;

  // Bookmarks
  toggleBookmark: (carId: string) => void;
  addBookmark: (car: CarData) => void;
  removeBookmark: (carId: string) => void;
  loadBookmarks: () => Promise<void>;

  // Comparison
  addToComparison: (car: CarData) => boolean;
  removeFromComparison: (carId: string) => void;
  clearComparison: () => void;
  reorderComparison: (fromIndex: number, toIndex: number) => void;

  // Search & Filter
  searchCars: (query: string, filters?: CarFilters) => Promise<CarData[]>;
  filterCars: (filters: CarFilters) => CarData[];

  // Loading & Error Management
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Analytics
  trackCarView: (carId: string, duration?: number) => void;
  getPopularCars: () => CarData[];

  // Cache Management
  refreshData: () => Promise<void>;
  clearCache: () => void;
}

const useCarStore = create<CarStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    cars: [],
    featuredCars: [],
    recommendedCars: [],
    recentlyViewed: [],
    bookmarkedCars: [],
    comparisonCars: [],
    maxComparisons: 4,
    isLoading: false,
    isLoadingFeatured: false,
    isLoadingRecommended: false,
    error: null,

    // Basic Car Management
    setCars: (cars) => set({ cars }),

    addCar: (car) =>
      set((state) => ({
        cars: [...state.cars, car],
      })),

    updateCar: (id, updates) =>
      set((state) => ({
        cars: state.cars.map((car) =>
          car.id === id ? { ...car, ...updates } : car,
        ),
        featuredCars: state.featuredCars.map((car) =>
          car.id === id ? { ...car, ...updates } : car,
        ),
        recommendedCars: state.recommendedCars.map((car) =>
          car.id === id ? { ...car, ...updates } : car,
        ),
        recentlyViewed: state.recentlyViewed.map((car) =>
          car.id === id ? { ...car, ...updates } : car,
        ),
        bookmarkedCars: state.bookmarkedCars.map((car) =>
          car.id === id ? { ...car, ...updates } : car,
        ),
      })),

    removeCar: (id) =>
      set((state) => ({
        cars: state.cars.filter((car) => car.id !== id),
      })),

    getCarById: (id) => {
      const state = get();
      return (
        state.cars.find((car) => car.id === id) ||
        state.featuredCars.find((car) => car.id === id) ||
        state.recommendedCars.find((car) => car.id === id)
      );
    },

    // Featured Cars
    setFeaturedCars: (cars) => set({ featuredCars: cars }),

    loadFeaturedCars: async () => {
      set({ isLoadingFeatured: true, error: null });
      try {
        // TODO: Replace with actual API call
        const response = await fetch('/api/cars/featured');
        const cars = await response.json();
        set({ featuredCars: cars, isLoadingFeatured: false });
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to load featured cars',
          isLoadingFeatured: false,
        });
      }
    },

    // Recommended Cars
    setRecommendedCars: (cars) => set({ recommendedCars: cars }),

    loadRecommendedCars: async (userId) => {
      set({ isLoadingRecommended: true, error: null });
      try {
        // TODO: Replace with actual API call
        const url = userId
          ? `/api/cars/recommended?userId=${userId}`
          : '/api/cars/recommended';
        const response = await fetch(url);
        const cars = await response.json();
        set({ recommendedCars: cars, isLoadingRecommended: false });
      } catch (error) {
        set({
          error:
            error instanceof Error
              ? error.message
              : 'Failed to load recommended cars',
          isLoadingRecommended: false,
        });
      }
    },

    // Recently Viewed
    addToRecentlyViewed: (car) =>
      set((state) => {
        const filtered = state.recentlyViewed.filter((c) => c.id !== car.id);
        return {
          recentlyViewed: [
            { ...car, lastViewed: new Date().toISOString() },
            ...filtered,
          ].slice(0, 20),
        };
      }),

    clearRecentlyViewed: () => set({ recentlyViewed: [] }),

    // Bookmarks
    toggleBookmark: (carId) =>
      set((state) => {
        const car = get().getCarById(carId);
        if (!car) return state;

        const isBookmarked = state.bookmarkedCars.some((c) => c.id === carId);

        if (isBookmarked) {
          return {
            bookmarkedCars: state.bookmarkedCars.filter((c) => c.id !== carId),
          };
        } else {
          return {
            bookmarkedCars: [
              ...state.bookmarkedCars,
              { ...car, isBookmarked: true },
            ],
          };
        }
      }),

    addBookmark: (car) =>
      set((state) => ({
        bookmarkedCars: state.bookmarkedCars.some((c) => c.id === car.id)
          ? state.bookmarkedCars
          : [...state.bookmarkedCars, { ...car, isBookmarked: true }],
      })),

    removeBookmark: (carId) =>
      set((state) => ({
        bookmarkedCars: state.bookmarkedCars.filter((c) => c.id !== carId),
      })),

    loadBookmarks: async () => {
      set({ isLoading: true, error: null });
      try {
        // TODO: Replace with actual API call
        const response = await fetch('/api/cars/bookmarks');
        const cars = await response.json();
        set({ bookmarkedCars: cars, isLoading: false });
      } catch (error) {
        set({
          error:
            error instanceof Error ? error.message : 'Failed to load bookmarks',
          isLoading: false,
        });
      }
    },

    // Comparison
    addToComparison: (car) => {
      const state = get();
      if (state.comparisonCars.length >= state.maxComparisons) {
        set({ error: `Cannot compare more than ${state.maxComparisons} cars` });
        return false;
      }

      if (state.comparisonCars.some((c) => c.id === car.id)) {
        set({ error: 'Car already in comparison' });
        return false;
      }

      set((state) => ({
        comparisonCars: [...state.comparisonCars, car],
      }));
      return true;
    },

    removeFromComparison: (carId) =>
      set((state) => ({
        comparisonCars: state.comparisonCars.filter((c) => c.id !== carId),
      })),

    clearComparison: () => set({ comparisonCars: [] }),

    reorderComparison: (fromIndex, toIndex) =>
      set((state) => {
        const newCars = [...state.comparisonCars];
        const [movedCar] = newCars.splice(fromIndex, 1);
        newCars.splice(toIndex, 0, movedCar);
        return { comparisonCars: newCars };
      }),

    // Search & Filter
    searchCars: async (query, filters) => {
      set({ isLoading: true, error: null });
      try {
        // TODO: Replace with actual API call
        const params = new URLSearchParams({ q: query });
        if (filters) {
          params.append('filters', JSON.stringify(filters));
        }

        const response = await fetch(`/api/cars/search?${params}`);
        const cars = await response.json();
        set({ isLoading: false });
        return cars;
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : 'Search failed',
          isLoading: false,
        });
        return [];
      }
    },

    filterCars: (filters) => {
      const state = get();
      return state.cars.filter((car) => {
        if (
          filters.make &&
          filters.make.length > 0 &&
          !filters.make.includes(car.make)
        )
          return false;
        if (filters.year) {
          if (car.year < filters.year.min || car.year > filters.year.max)
            return false;
        }
        if (filters.price) {
          if (car.price < filters.price.min || car.price > filters.price.max)
            return false;
        }
        if (
          filters.bodyStyle &&
          filters.bodyStyle.length > 0 &&
          !filters.bodyStyle.includes(car.bodyStyle)
        )
          return false;
        if (
          filters.fuelEfficiency &&
          car.fuelEfficiency < filters.fuelEfficiency.min
        )
          return false;
        if (filters.safetyRating && car.safetyRating < filters.safetyRating.min)
          return false;
        if (filters.features && filters.features.length > 0) {
          const hasAllFeatures = filters.features.every((feature) =>
            car.features.includes(feature),
          );
          if (!hasAllFeatures) return false;
        }
        return true;
      });
    },

    // Loading & Error Management
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),

    // Analytics
    trackCarView: (carId, duration) => {
      const state = get();
      const car = state.getCarById(carId);
      if (car) {
        state.updateCar(carId, {
          viewCount: (car.viewCount || 0) + 1,
          lastViewed: new Date().toISOString(),
        });
        state.addToRecentlyViewed(car);
      }
    },

    getPopularCars: () => {
      const state = get();
      return [...state.cars]
        .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
        .slice(0, 10);
    },

    // Cache Management
    refreshData: async () => {
      const state = get();
      await Promise.all([
        state.loadFeaturedCars(),
        state.loadRecommendedCars(),
        state.loadBookmarks(),
      ]);
    },

    clearCache: () =>
      set({
        cars: [],
        featuredCars: [],
        recommendedCars: [],
        recentlyViewed: [],
        bookmarkedCars: [],
        comparisonCars: [],
        error: null,
      }),
  })),
);

export default useCarStore;
