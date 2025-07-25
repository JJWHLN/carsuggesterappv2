import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { CarFilters } from './useCarStore';

export interface UserPreferences {
  // Basic Preferences
  budget: {
    min: number;
    max: number;
  };
  preferredBodyStyles: string[];
  preferredBrands: string[];
  requiredFeatures: string[];
  minFuelEfficiency: number;
  minSafetyRating: number;
  
  // Advanced Preferences
  transmission: 'manual' | 'automatic' | 'both';
  drivetrain: 'fwd' | 'rwd' | 'awd' | '4wd' | 'any';
  fuelType: 'gasoline' | 'hybrid' | 'electric' | 'diesel' | 'any';
  
  // Location Preferences
  searchRadius: number; // in miles
  preferredDealers: string[];
  
  // Notification Preferences
  notifications: {
    priceDrops: boolean;
    newListings: boolean;
    savedSearches: boolean;
    recommendations: boolean;
    dealerMessages: boolean;
  };
  
  // Privacy Preferences
  privacy: {
    shareData: boolean;
    trackingEnabled: boolean;
    publicProfile: boolean;
  };
  
  // App Preferences
  theme: 'light' | 'dark' | 'auto';
  language: string;
  currency: string;
  distanceUnit: 'miles' | 'km';
  comparisonView: 'grid' | 'table';
  defaultSearchView: 'list' | 'grid' | 'map';
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  location?: {
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  
  // User Type
  userType: 'buyer' | 'dealer' | 'admin';
  isDealer: boolean;
  dealerInfo?: {
    dealershipName: string;
    licenseNumber: string;
    businessAddress: string;
    website?: string;
    specialties: string[];
  };
  
  // Account Status
  isVerified: boolean;
  isPremium: boolean;
  subscriptionType?: 'basic' | 'premium' | 'dealer';
  subscriptionExpiry?: string;
  
  // Onboarding
  onboardingCompleted: boolean;
  onboardingStep: number;
  
  // Activity
  joinedAt: string;
  lastLoginAt?: string;
  loginCount: number;
}

export interface UserActivity {
  carViews: Array<{
    carId: string;
    viewedAt: string;
    duration: number;
    source: string;
  }>;
  searches: Array<{
    query: string;
    filters: CarFilters;
    searchedAt: string;
    resultCount: number;
  }>;
  comparisons: Array<{
    carIds: string[];
    comparedAt: string;
  }>;
  bookmarks: Array<{
    carId: string;
    bookmarkedAt: string;
  }>;
  reviews: Array<{
    carId: string;
    rating: number;
    reviewedAt: string;
  }>;
}

interface UserStore {
  // User Data
  profile: UserProfile | null;
  preferences: UserPreferences;
  activity: UserActivity;
  
  // Authentication State
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Profile Actions
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  
  // Preferences Actions
  setPreferences: (preferences: Partial<UserPreferences>) => void;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void;
  resetPreferences: () => void;
  
  // Authentication Actions
  setAuthenticated: (authenticated: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  
  // Onboarding Actions
  setOnboardingStep: (step: number) => void;
  completeOnboarding: (preferences: UserPreferences) => Promise<void>;
  skipOnboarding: () => void;
  
  // Activity Tracking
  trackCarView: (carId: string, duration: number, source: string) => void;
  trackSearch: (query: string, filters: CarFilters, resultCount: number) => void;
  trackComparison: (carIds: string[]) => void;
  trackBookmark: (carId: string) => void;
  trackReview: (carId: string, rating: number) => void;
  
  // Data Management
  exportUserData: () => Promise<string>;
  deleteAccount: () => Promise<void>;
  
  // Premium Features
  upgradeToPremium: () => Promise<void>;
  checkSubscriptionStatus: () => Promise<void>;
  
  // Dealer Features
  applyForDealerAccount: (dealerInfo: UserProfile['dealerInfo']) => Promise<void>;
  
  // Notifications
  getNotificationSettings: () => UserPreferences['notifications'];
  updateNotificationSettings: (settings: Partial<UserPreferences['notifications']>) => void;
  
  // Analytics
  getUserStats: () => {
    totalViews: number;
    totalSearches: number;
    totalComparisons: number;
    totalBookmarks: number;
    averageSessionTime: number;
  };
  
  // Error Handling
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

const defaultPreferences: UserPreferences = {
  budget: { min: 0, max: 100000 },
  preferredBodyStyles: [],
  preferredBrands: [],
  requiredFeatures: [],
  minFuelEfficiency: 0,
  minSafetyRating: 0,
  transmission: 'both',
  drivetrain: 'any',
  fuelType: 'any',
  searchRadius: 50,
  preferredDealers: [],
  notifications: {
    priceDrops: true,
    newListings: true,
    savedSearches: true,
    recommendations: true,
    dealerMessages: true
  },
  privacy: {
    shareData: true,
    trackingEnabled: true,
    publicProfile: false
  },
  theme: 'auto',
  language: 'en',
  currency: 'USD',
  distanceUnit: 'miles',
  comparisonView: 'grid',
  defaultSearchView: 'list'
};

const defaultActivity: UserActivity = {
  carViews: [],
  searches: [],
  comparisons: [],
  bookmarks: [],
  reviews: []
};

const useUserStore = create<UserStore>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // Initial State
      profile: null,
      preferences: defaultPreferences,
      activity: defaultActivity,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Profile Actions
      setProfile: (profile) => set({ profile, isAuthenticated: !!profile }),
      
      updateProfile: async (updates) => {
        const state = get();
        if (!state.profile) throw new Error('No profile to update');
        
        set({ isLoading: true, error: null });
        
        try {
          // TODO: Replace with actual API call
          const response = await fetch('/api/user/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          });
          
          if (!response.ok) throw new Error('Failed to update profile');
          
          const updatedProfile = await response.json();
          set({ profile: updatedProfile, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Update failed',
            isLoading: false 
          });
          throw error;
        }
      },
      
      uploadAvatar: async (file) => {
        set({ isLoading: true, error: null });
        
        try {
          const formData = new FormData();
          formData.append('avatar', file);
          
          // TODO: Replace with actual API call
          const response = await fetch('/api/user/avatar', {
            method: 'POST',
            body: formData
          });
          
          if (!response.ok) throw new Error('Failed to upload avatar');
          
          const { avatarUrl } = await response.json();
          get().updateProfile({ avatar: avatarUrl });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Upload failed',
            isLoading: false 
          });
          throw error;
        }
      },

      // Preferences Actions
      setPreferences: (preferences) => set((state) => ({
        preferences: { ...state.preferences, ...preferences }
      })),
      
      updatePreference: (key, value) => set((state) => ({
        preferences: { ...state.preferences, [key]: value }
      })),
      
      resetPreferences: () => set({ preferences: defaultPreferences }),

      // Authentication Actions
      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
      
      login: async (email, password) => {
        set({ isLoading: true, error: null });
        
        try {
          // TODO: Replace with actual authentication logic
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          
          if (!response.ok) throw new Error('Login failed');
          
          const { user, token } = await response.json();
          
          // Store token in localStorage or secure storage
          localStorage.setItem('authToken', token);
          
          set({ 
            profile: user,
            isAuthenticated: true,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Login failed',
            isLoading: false 
          });
          throw error;
        }
      },
      
      logout: async () => {
        set({ isLoading: true });
        
        try {
          // TODO: Replace with actual logout logic
          await fetch('/api/auth/logout', { method: 'POST' });
          localStorage.removeItem('authToken');
          
          set({
            profile: null,
            isAuthenticated: false,
            activity: defaultActivity,
            isLoading: false
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      // Onboarding Actions
      setOnboardingStep: (step) => set((state) => ({
        profile: state.profile ? { ...state.profile, onboardingStep: step } : null
      })),
      
      completeOnboarding: async (preferences) => {
        const state = get();
        if (!state.profile) throw new Error('No profile found');
        
        set({ isLoading: true, error: null });
        
        try {
          await get().updateProfile({ 
            onboardingCompleted: true,
            onboardingStep: 100 
          });
          
          get().setPreferences(preferences);
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Onboarding failed',
            isLoading: false 
          });
          throw error;
        }
      },
      
      skipOnboarding: () => set((state) => ({
        profile: state.profile ? {
          ...state.profile,
          onboardingCompleted: true,
          onboardingStep: 100
        } : null
      })),

      // Activity Tracking
      trackCarView: (carId, duration, source) => set((state) => ({
        activity: {
          ...state.activity,
          carViews: [
            {
              carId,
              viewedAt: new Date().toISOString(),
              duration,
              source
            },
            ...state.activity.carViews.slice(0, 99) // Keep last 100
          ]
        }
      })),
      
      trackSearch: (query, filters, resultCount) => set((state) => ({
        activity: {
          ...state.activity,
          searches: [
            {
              query,
              filters,
              searchedAt: new Date().toISOString(),
              resultCount
            },
            ...state.activity.searches.slice(0, 49) // Keep last 50
          ]
        }
      })),
      
      trackComparison: (carIds) => set((state) => ({
        activity: {
          ...state.activity,
          comparisons: [
            {
              carIds,
              comparedAt: new Date().toISOString()
            },
            ...state.activity.comparisons.slice(0, 19) // Keep last 20
          ]
        }
      })),
      
      trackBookmark: (carId) => set((state) => ({
        activity: {
          ...state.activity,
          bookmarks: [
            {
              carId,
              bookmarkedAt: new Date().toISOString()
            },
            ...state.activity.bookmarks.slice(0, 99) // Keep last 100
          ]
        }
      })),
      
      trackReview: (carId, rating) => set((state) => ({
        activity: {
          ...state.activity,
          reviews: [
            {
              carId,
              rating,
              reviewedAt: new Date().toISOString()
            },
            ...state.activity.reviews.slice(0, 49) // Keep last 50
          ]
        }
      })),

      // Data Management
      exportUserData: async () => {
        const state = get();
        const data = {
          profile: state.profile,
          preferences: state.preferences,
          activity: state.activity
        };
        return JSON.stringify(data, null, 2);
      },
      
      deleteAccount: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // TODO: Replace with actual API call
          const response = await fetch('/api/user/delete', {
            method: 'DELETE'
          });
          
          if (!response.ok) throw new Error('Failed to delete account');
          
          // Clear all data
          localStorage.removeItem('authToken');
          set({
            profile: null,
            preferences: defaultPreferences,
            activity: defaultActivity,
            isAuthenticated: false,
            isLoading: false
          });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Delete failed',
            isLoading: false 
          });
          throw error;
        }
      },

      // Premium Features
      upgradeToPremium: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // TODO: Replace with actual payment processing
          const response = await fetch('/api/user/upgrade', {
            method: 'POST'
          });
          
          if (!response.ok) throw new Error('Upgrade failed');
          
          const updatedProfile = await response.json();
          set({ profile: updatedProfile, isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Upgrade failed',
            isLoading: false 
          });
          throw error;
        }
      },
      
      checkSubscriptionStatus: async () => {
        const state = get();
        if (!state.profile) return;
        
        try {
          // TODO: Replace with actual API call
          const response = await fetch('/api/user/subscription');
          const subscriptionData = await response.json();
          
          get().updateProfile({
            isPremium: subscriptionData.isPremium,
            subscriptionType: subscriptionData.type,
            subscriptionExpiry: subscriptionData.expiry
          });
        } catch (error) {
          console.error('Failed to check subscription status:', error);
        }
      },

      // Dealer Features
      applyForDealerAccount: async (dealerInfo) => {
        set({ isLoading: true, error: null });
        
        try {
          // TODO: Replace with actual API call
          const response = await fetch('/api/user/dealer-application', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dealerInfo)
          });
          
          if (!response.ok) throw new Error('Application failed');
          
          set({ isLoading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Application failed',
            isLoading: false 
          });
          throw error;
        }
      },

      // Notifications
      getNotificationSettings: () => get().preferences.notifications,
      
      updateNotificationSettings: (settings) => set((state) => ({
        preferences: {
          ...state.preferences,
          notifications: { ...state.preferences.notifications, ...settings }
        }
      })),

      // Analytics
      getUserStats: () => {
        const state = get();
        const activity = state.activity;
        
        return {
          totalViews: activity.carViews.length,
          totalSearches: activity.searches.length,
          totalComparisons: activity.comparisons.length,
          totalBookmarks: activity.bookmarks.length,
          averageSessionTime: activity.carViews.reduce((acc, view) => acc + view.duration, 0) / activity.carViews.length || 0
        };
      },

      // Error Handling
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setLoading: (loading) => set({ isLoading: loading })
    })),
    {
      name: 'user-store',
      partialize: (state) => ({
        preferences: state.preferences,
        activity: state.activity
      })
    }
  )
);

export default useUserStore;
