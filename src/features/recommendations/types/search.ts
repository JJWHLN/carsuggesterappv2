// Extended types for search and filtering
import { Car, UserPreferences, UserBehavior, Recommendation } from './index';

export interface SearchFilters {
  priceRange: [number, number];
  yearRange: [number, number];
  makes: string[];
  bodyTypes: string[];
  fuelTypes: string[];
  transmission: string[];
  features: string[];
  mileageRange: [number, number];
  colors: string[];
  minSafetyRating: number;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: Partial<SearchFilters>;
  createdAt: number;
}

export interface SearchSuggestion {
  id: string;
  text: string;
  type: 'make' | 'model' | 'feature' | 'location';
  icon?: string;
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
  icon?: string;
}

export interface FilterCategory {
  id: string;
  label: string;
  type: 'range' | 'multiselect' | 'radio' | 'checkbox' | 'color';
  options?: FilterOption[];
  min?: number;
  max?: number;
}

export interface SearchState {
  query: string;
  filters: SearchFilters;
  suggestions: SearchSuggestion[];
  showSuggestions: boolean;
  isLoading: boolean;
  results: Car[];
  appliedFiltersCount: number;
}

export interface UseSearchResult {
  searchState: SearchState;
  updateQuery: (query: string) => void;
  updateFilters: (filters: Partial<SearchFilters>) => void;
  clearFilters: () => void;
  savePreset: (name: string) => void;
  loadPreset: (preset: FilterPreset) => void;
  removePreset: (id: string) => void;
  presets: FilterPreset[];
}

// Fuzzy matching configuration
export interface FuzzyMatchOptions {
  threshold: number;
  keys: string[];
  includeScore: boolean;
}
