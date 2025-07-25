// Main store exports and initialization
export { default as useCarStore } from './useCarStore';
export { default as useSearchStore } from './useSearchStore';
export { default as useUserStore } from './useUserStore';
export { default as useUIStore } from './useUIStore';

// Re-export types for convenience
export type { CarData, CarFilters, ComparisonCar } from './useCarStore';
export type { SearchState } from './useSearchStore';
export type { UserPreferences, UserProfile, UserActivity } from './useUserStore';
export type { Modal, Toast, LoadingState, UIPreferences } from './useUIStore';

// Store selectors for common use cases
import useCarStore from './useCarStore';
import useSearchStore from './useSearchStore';
import useUserStore from './useUserStore';
import useUIStore from './useUIStore';

// Car Store Selectors
export const useCarData = () => useCarStore((state) => ({
  cars: comparison.comparisonCars,
  featuredCars: state.featuredCars,
  recommendedCars: state.recommendedCars,
  isLoading: state.isLoading,
  error: state.error
}));

export const useBookmarks = () => useCarStore((state) => ({
  bookmarkedCars: state.bookmarkedCars,
  toggleBookmark: state.toggleBookmark,
  addBookmark: state.addBookmark,
  removeBookmark: state.removeBookmark
}));

export const useComparison = () => useCarStore((state) => ({
  comparisonCars: state.comparisonCars,
  maxComparisons: state.maxComparisons,
  addToComparison: state.addToComparison,
  removeFromComparison: state.removeFromComparison,
  clearComparison: state.clearComparison,
  reorderComparison: state.reorderComparison
}));

// Search Store Selectors
export const useSearch = () => useSearchStore((state) => ({
  query: state.query,
  filters: state.filters,
  results: state.results,
  isSearching: state.isSearching,
  executeSearch: state.executeSearch,
  setQuery: state.setQuery,
  setFilters: state.setFilters
}));

export const useSearchFilters = () => useSearchStore((state) => ({
  filters: state.filters,
  showFilters: state.showFilters,
  quickFilters: state.quickFilters,
  setFilters: state.setFilters,
  updateFilter: state.updateFilter,
  clearFilters: state.clearFilters,
  toggleFilters: state.toggleFilters,
  toggleQuickFilter: state.toggleQuickFilter
}));

export const useSearchHistory = () => useSearchStore((state) => ({
  searchHistory: state.searchHistory,
  savedSearches: state.savedSearches,
  recentSearches: state.recentSearches,
  addToHistory: state.addToHistory,
  saveSearch: state.saveSearch,
  clearHistory: state.clearHistory
}));

// User Store Selectors
export const useUserProfile = () => useUserStore((state) => ({
  profile: state.profile,
  isAuthenticated: state.isAuthenticated,
  isLoading: state.isLoading,
  updateProfile: state.updateProfile,
  error: state.error
}));

export const useUserPrefs = () => useUserStore((state) => ({
  preferences: state.preferences,
  setPreferences: state.setPreferences,
  updatePreference: state.updatePreference,
  resetPreferences: state.resetPreferences
}));

export const useUserActivity = () => useUserStore((state) => ({
  activity: state.activity,
  trackCarView: state.trackCarView,
  trackSearch: state.trackSearch,
  trackComparison: state.trackComparison,
  trackBookmark: state.trackBookmark,
  getUserStats: state.getUserStats
}));

export const useAuth = () => useUserStore((state) => ({
  isAuthenticated: state.isAuthenticated,
  profile: state.profile,
  login: state.login,
  logout: state.logout,
  isLoading: state.isLoading,
  error: state.error
}));

// UI Store Selectors
export const useModals = () => useUIStore((state) => ({
  modals: state.modals,
  activeModal: state.activeModal,
  showModal: state.showModal,
  hideModal: state.hideModal,
  hideAllModals: state.hideAllModals,
  showConfirm: state.showConfirm,
  showAlert: state.showAlert
}));

export const useToasts = () => useUIStore((state) => ({
  toasts: state.toasts,
  showToast: state.showToast,
  hideToast: state.hideToast,
  showSuccess: state.showSuccess,
  showError: state.showError,
  showWarning: state.showWarning,
  showInfo: state.showInfo
}));

export const useLoading = () => useUIStore((state) => ({
  loadingStates: state.loadingStates,
  globalLoading: state.globalLoading,
  showLoading: state.showLoading,
  hideLoading: state.hideLoading,
  setGlobalLoading: state.setGlobalLoading
}));

export const useNavigation = () => useUIStore((state) => ({
  navigation: state.navigation,
  setCurrentRoute: state.setCurrentRoute,
  goBack: state.goBack,
  clearNavigationHistory: state.clearNavigationHistory
}));

export const useTheme = () => useUIStore((state) => ({
  uiPreferences: state.uiPreferences,
  setUIPreferences: state.setUIPreferences,
  toggleTheme: state.toggleTheme,
  setTheme: state.setTheme
}));

export const useComponentStates = () => useUIStore((state) => ({
  sidebarOpen: state.sidebarOpen,
  searchBarFocused: state.searchBarFocused,
  filtersVisible: state.filtersVisible,
  comparisonDrawerOpen: state.comparisonDrawerOpen,
  setSidebarOpen: state.setSidebarOpen,
  toggleSidebar: state.toggleSidebar,
  setSearchBarFocused: state.setSearchBarFocused,
  setFiltersVisible: state.setFiltersVisible,
  toggleFilters: state.toggleFilters,
  setComparisonDrawerOpen: state.setComparisonDrawerOpen,
  toggleComparisonDrawer: state.toggleComparisonDrawer
}));

// Combined selectors for common patterns
export const useAppState = () => {
  const carData = useCarData();
  const search = useSearch();
  const user = useUserProfile();
  const ui = useUIStore((state) => ({
    globalLoading: state.globalLoading,
    appState: state.appState
  }));
  
  return {
    ...carData,
    ...search,
    ...user,
    ...ui
  };
};

// Utility hooks for common operations
export const useCarActions = () => {
  const carStore = useCarStore();
  const userStore = useUserStore();
  
  return {
    viewCar: (carId: string, duration: number = 0) => {
      const car = carStore.getCarById(carId);
      if (car) {
        carStore.trackCarView(carId, duration);
        userStore.trackCarView(carId, duration, 'app');
      }
    },
    
    bookmarkCar: (carId: string) => {
      carStore.toggleBookmark(carId);
      userStore.trackBookmark(carId);
    },
    
    compareCars: (carIds: string[]) => {
      userStore.trackComparison(carIds);
    },
    
    searchCars: async (query: string, filters?: any) => {
      const searchStore = useSearchStore.getState();
      const userStore = useUserStore.getState();
      
      const results = await searchStore.executeSearch(query, filters);
      userStore.trackSearch(query, filters || {}, results?.length || 0);
      
      return results;
    }
  };
};

// Store persistence and hydration utilities
export const initializeStores = async () => {
  const userStore = useUserStore.getState();
  const carStore = useCarStore.getState();
  const searchStore = useSearchStore.getState();
  
  try {
    // Check authentication status
    const token = localStorage.getItem('authToken');
    if (token) {
      // TODO: Validate token and load user profile
      userStore.setAuthenticated(true);
    }
    
    // Load initial data
    await Promise.all([
      carStore.loadFeaturedCars(),
      searchStore.loadPopularSearches()
    ]);
    
    // Load user-specific data if authenticated
    if (userStore.isAuthenticated) {
      await Promise.all([
        carStore.loadBookmarks(),
        carStore.loadRecommendedCars(userStore.profile?.id),
        userStore.checkSubscriptionStatus()
      ]);
    }
  } catch (error) {
    console.error('Store initialization failed:', error);
  }
};

// Clean up stores (useful for testing or logout)
export const resetAllStores = () => {
  useCarStore.getState().clearCache();
  useSearchStore.getState().clearHistory();
  useUserStore.setState({
    profile: null,
    preferences: useUserStore.getState().preferences, // Keep preferences
    activity: { carViews: [], searches: [], comparisons: [], bookmarks: [], reviews: [] },
    isAuthenticated: false,
    isLoading: false,
    error: null
  });
  useUIStore.getState().hideAllModals();
  useUIStore.getState().hideAllToasts();
  useUIStore.getState().resetAllForms();
};

// Development utilities
export const getStoreStates = () => ({
  car: useCarStore.getState(),
  search: useSearchStore.getState(),
  user: useUserStore.getState(),
  ui: useUIStore.getState()
});

// Export store instances for direct access (use sparingly)
export {
  useCarStore as carStore,
  useSearchStore as searchStore,
  useUserStore as userStore,
  useUIStore as uiStore
};
