import { Car } from '../recommendations/types';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  preferences: UserPreferences;
  isVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface UserPreferences {
  budget: {
    min: number;
    max: number;
  };
  bodyStyles: string[];
  fuelTypes: string[];
  makes: string[];
  yearRange: {
    min: number;
    max: number;
  };
  mileageRange: {
    min: number;
    max: number;
  };
  features: string[];
  location: {
    city: string;
    state: string;
    radius: number; // miles
  };
  notifications: {
    email: boolean;
    push: boolean;
    priceDrops: boolean;
    newListings: boolean;
    savedSearchAlerts: boolean;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tokens: {
    accessToken: string | null;
    refreshToken: string | null;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  preferences?: Partial<UserPreferences>;
}

export interface SocialLoginProvider {
  id: 'google' | 'facebook' | 'apple';
  name: string;
  icon: string;
  color: string;
}

export interface SavedSearchAlert {
  newListings: boolean;
  priceDrops: boolean;
  weeklySummary: boolean;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: any;
  userId: string;
  alertsEnabled: boolean;
  alerts: SavedSearchAlert;
  frequency: 'daily' | 'weekly' | 'immediate';
  resultCount: number;
  lastNotified?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteCar {
  id: string;
  car: Car;
  userId: string;
  notes?: string;
  addedAt: string;
  priceWhenAdded: number;
  currentPrice: number;
  priceChange: number;
}

export interface RecentlyViewed {
  id: string;
  car: Car;
  userId: string;
  viewedAt: string;
  duration: number; // seconds
}

export interface ComparisonHistory {
  id: string;
  carIds: string[];
  userId: string;
  createdAt: string;
  name?: string;
}

export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  socialLogin: (provider: SocialLoginProvider['id'], token: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  addToFavorites: (car: Car) => Promise<void>;
  removeFromFavorites: (carId: string) => Promise<void>;
  saveSearch: (search: Omit<SavedSearch, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteSearch: (searchId: string) => Promise<void>;
  addToRecentlyViewed: (car: Car, duration: number) => Promise<void>;
  saveComparison: (carIds: string[], name?: string) => Promise<void>;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  isComplete: boolean;
}

export interface OnboardingData {
  currentStep: number;
  steps: OnboardingStep[];
  data: Partial<UserPreferences>;
}

// Validation schemas will use these types
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

export interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

export interface PreferencesFormData {
  budget: {
    min: number;
    max: number;
  };
  bodyStyles: string[];
  fuelTypes: string[];
  makes: string[];
  yearRange: {
    min: number;
    max: number;
  };
  location: {
    city: string;
    state: string;
    radius: number;
  };
  notifications: {
    email: boolean;
    push: boolean;
    priceDrops: boolean;
    newListings: boolean;
    savedSearchAlerts: boolean;
  };
}
