import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { CarFilters } from './useCarStore';

export interface SearchState {
  // Current Search
  query: string;
  filters: CarFilters;
  sortBy: 'relevance' | 'price_low' | 'price_high' | 'year_new' | 'year_old' | 'rating' | 'distance';
  sortOrder: 'asc' | 'desc';
  
  // Search Results
  results: string[]; // Array of car IDs
  totalResults: number;
  currentPage: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  
  // Search History
  searchHistory: Array<{
    id: string;
    query: string;
    filters: CarFilters;
    timestamp: string;
    resultCount: number;
  }>;
  
  // Saved Searches
  savedSearches: Array<{
    id: string;
    name: string;
    query: string;
    filters: CarFilters;
    alertsEnabled: boolean;
    createdAt: string;
    lastChecked?: string;
    newResultsCount?: number;
  }>;
  
  // Filter Presets
  filterPresets: Array<{
    id: string;
    name: string;
    filters: CarFilters;
    isDefault: boolean;
    createdAt: string;
  }>;
  
  // Search UI State
  isSearching: boolean;
  showFilters: boolean;
  showAdvancedFilters: boolean;
  activeFilterCategory: string;
  
  // Quick Filters
  quickFilters: Array<{
    id: string;
    label: string;
    filters: Partial<CarFilters>;
    isActive: boolean;
  }>;
  
  // Search Suggestions
  suggestions: Array<{
    type: 'make' | 'model' | 'query' | 'location';
    value: string;
    count?: number;
  }>;
  showSuggestions: boolean;
  
  // Recent Searches
  recentSearches: string[];
  maxRecentSearches: number;
  
  // Popular Searches
  popularSearches: Array<{
    query: string;
    count: number;
  }>;
}

interface SearchStore extends SearchState {
  // Search Actions
  setQuery: (query: string) => void;
  executeSearch: (query?: string, filters?: CarFilters) => Promise<void>;
  clearSearch: () => void;
  
  // Filter Actions
  setFilters: (filters: Partial<CarFilters>) => void;
  updateFilter: (key: keyof CarFilters, value: any) => void;
  clearFilters: () => void;
  resetToDefaults: () => void;
  
  // Sorting Actions
  setSortBy: (sortBy: SearchState['sortBy'], order?: 'asc' | 'desc') => void;
  
  // Pagination Actions
  setPage: (page: number) => void;
  loadNextPage: () => Promise<void>;
  setItemsPerPage: (count: number) => void;
  
  // Search History Actions
  addToHistory: (query: string, filters: CarFilters, resultCount: number) => void;
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
  
  // Saved Searches Actions
  saveSearch: (name: string, query: string, filters: CarFilters, alertsEnabled?: boolean) => void;
  removeSavedSearch: (id: string) => void;
  updateSavedSearch: (id: string, updates: Partial<SearchState['savedSearches'][0]>) => void;
  checkSavedSearches: () => Promise<void>;
  
  // Filter Presets Actions
  saveFilterPreset: (name: string, filters: CarFilters, isDefault?: boolean) => void;
  loadFilterPreset: (id: string) => void;
  removeFilterPreset: (id: string) => void;
  setDefaultPreset: (id: string) => void;
  
  // UI State Actions
  setSearching: (isSearching: boolean) => void;
  toggleFilters: () => void;
  setShowFilters: (show: boolean) => void;
  toggleAdvancedFilters: () => void;
  setActiveFilterCategory: (category: string) => void;
  
  // Quick Filters Actions
  addQuickFilter: (id: string, label: string, filters: Partial<CarFilters>) => void;
  toggleQuickFilter: (id: string) => void;
  clearQuickFilters: () => void;
  
  // Suggestions Actions
  setSuggestions: (suggestions: SearchState['suggestions']) => void;
  setShowSuggestions: (show: boolean) => void;
  loadSuggestions: (query: string) => Promise<void>;
  
  // Recent Searches Actions
  addToRecentSearches: (query: string) => void;
  clearRecentSearches: () => void;
  
  // Popular Searches Actions
  loadPopularSearches: () => Promise<void>;
  
  // Utility Actions
  getActiveFiltersCount: () => number;
  hasActiveFilters: () => boolean;
  exportSearch: () => string;
  importSearch: (searchData: string) => void;
}

const defaultFilters: CarFilters = {
  make: [],
  model: [],
  bodyStyle: [],
  features: [],
  transmission: [],
  drivetrain: [],
  exteriorColor: [],
  interiorColor: []
};

const defaultQuickFilters = [
  {
    id: 'under-20k',
    label: 'Under $20k',
    filters: { price: { min: 0, max: 20000 } },
    isActive: false
  },
  {
    id: 'fuel-efficient',
    label: 'Fuel Efficient',
    filters: { fuelEfficiency: { min: 30 } },
    isActive: false
  },
  {
    id: 'high-safety',
    label: 'High Safety',
    filters: { safetyRating: { min: 4 } },
    isActive: false
  },
  {
    id: 'recent-year',
    label: '2020+',
    filters: { year: { min: 2020, max: new Date().getFullYear() } },
    isActive: false
  }
];

const useSearchStore = create<SearchStore>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // Initial State
      query: '',
      filters: defaultFilters,
      sortBy: 'relevance',
      sortOrder: 'desc',
      results: [],
      totalResults: 0,
      currentPage: 1,
      itemsPerPage: 20,
      hasNextPage: false,
      searchHistory: [],
      savedSearches: [],
      filterPresets: [],
      isSearching: false,
      showFilters: false,
      showAdvancedFilters: false,
      activeFilterCategory: 'make',
      quickFilters: defaultQuickFilters,
      suggestions: [],
      showSuggestions: false,
      recentSearches: [],
      maxRecentSearches: 10,
      popularSearches: [],

      // Search Actions
      setQuery: (query) => set({ query }),
      
      executeSearch: async (query, filters) => {
        const state = get();
        const searchQuery = query || state.query;
        const searchFilters = filters || state.filters;
        
        set({ isSearching: true });
        
        try {
          // TODO: Replace with actual API call
          const params = new URLSearchParams({
            q: searchQuery,
            page: '1',
            limit: state.itemsPerPage.toString(),
            sortBy: state.sortBy,
            sortOrder: state.sortOrder
          });
          
          if (Object.keys(searchFilters).length > 0) {
            params.append('filters', JSON.stringify(searchFilters));
          }
          
          const response = await fetch(`/api/cars/search?${params}`);
          const data = await response.json();
          
          set({
            results: data.cars?.map((car: any) => car.id) || [],
            totalResults: data.total || 0,
            currentPage: 1,
            hasNextPage: data.hasNextPage || false,
            isSearching: false
          });
          
          // Add to history and recent searches
          if (searchQuery.trim()) {
            state.addToHistory(searchQuery, searchFilters, data.total || 0);
            state.addToRecentSearches(searchQuery);
          }
          
        } catch (error) {
          console.error('Search failed:', error);
          set({ isSearching: false });
        }
      },
      
      clearSearch: () => set({
        query: '',
        results: [],
        totalResults: 0,
        currentPage: 1,
        hasNextPage: false
      }),

      // Filter Actions
      setFilters: (filters) => set((state) => ({
        filters: { ...state.filters, ...filters }
      })),
      
      updateFilter: (key, value) => set((state) => ({
        filters: { ...state.filters, [key]: value }
      })),
      
      clearFilters: () => set({ filters: defaultFilters }),
      
      resetToDefaults: () => set({
        query: '',
        filters: defaultFilters,
        sortBy: 'relevance',
        sortOrder: 'desc',
        currentPage: 1,
        showFilters: false,
        showAdvancedFilters: false
      }),

      // Sorting Actions
      setSortBy: (sortBy, order = 'desc') => set({ sortBy, sortOrder: order }),

      // Pagination Actions
      setPage: (page) => set({ currentPage: page }),
      
      loadNextPage: async () => {
        const state = get();
        if (!state.hasNextPage || state.isSearching) return;
        
        set({ isSearching: true });
        
        try {
          const params = new URLSearchParams({
            q: state.query,
            page: (state.currentPage + 1).toString(),
            limit: state.itemsPerPage.toString(),
            sortBy: state.sortBy,
            sortOrder: state.sortOrder
          });
          
          if (Object.keys(state.filters).length > 0) {
            params.append('filters', JSON.stringify(state.filters));
          }
          
          const response = await fetch(`/api/cars/search?${params}`);
          const data = await response.json();
          
          set({
            results: [...state.results, ...(data.cars?.map((car: any) => car.id) || [])],
            currentPage: state.currentPage + 1,
            hasNextPage: data.hasNextPage || false,
            isSearching: false
          });
          
        } catch (error) {
          console.error('Load next page failed:', error);
          set({ isSearching: false });
        }
      },
      
      setItemsPerPage: (count) => set({ itemsPerPage: count }),

      // Search History Actions
      addToHistory: (query, filters, resultCount) => set((state) => {
        const historyItem = {
          id: Date.now().toString(),
          query,
          filters,
          timestamp: new Date().toISOString(),
          resultCount
        };
        
        return {
          searchHistory: [historyItem, ...state.searchHistory.slice(0, 49)] // Keep last 50
        };
      }),
      
      clearHistory: () => set({ searchHistory: [] }),
      
      removeFromHistory: (id) => set((state) => ({
        searchHistory: state.searchHistory.filter(item => item.id !== id)
      })),

      // Saved Searches Actions
      saveSearch: (name, query, filters, alertsEnabled = false) => set((state) => {
        const savedSearch = {
          id: Date.now().toString(),
          name,
          query,
          filters,
          alertsEnabled,
          createdAt: new Date().toISOString()
        };
        
        return {
          savedSearches: [...state.savedSearches, savedSearch]
        };
      }),
      
      removeSavedSearch: (id) => set((state) => ({
        savedSearches: state.savedSearches.filter(search => search.id !== id)
      })),
      
      updateSavedSearch: (id, updates) => set((state) => ({
        savedSearches: state.savedSearches.map(search =>
          search.id === id ? { ...search, ...updates } : search
        )
      })),
      
      checkSavedSearches: async () => {
        const state = get();
        // TODO: Implement saved search checking logic
        for (const savedSearch of state.savedSearches) {
          if (savedSearch.alertsEnabled) {
            // Check for new results
          }
        }
      },

      // Filter Presets Actions
      saveFilterPreset: (name, filters, isDefault = false) => set((state) => {
        const preset = {
          id: Date.now().toString(),
          name,
          filters,
          isDefault,
          createdAt: new Date().toISOString()
        };
        
        let updatedPresets = [...state.filterPresets, preset];
        
        if (isDefault) {
          // Remove default flag from other presets
          updatedPresets = updatedPresets.map(p => 
            p.id === preset.id ? p : { ...p, isDefault: false }
          );
        }
        
        return { filterPresets: updatedPresets };
      }),
      
      loadFilterPreset: (id) => set((state) => {
        const preset = state.filterPresets.find(p => p.id === id);
        if (preset) {
          return { filters: preset.filters };
        }
        return state;
      }),
      
      removeFilterPreset: (id) => set((state) => ({
        filterPresets: state.filterPresets.filter(preset => preset.id !== id)
      })),
      
      setDefaultPreset: (id) => set((state) => ({
        filterPresets: state.filterPresets.map(preset => ({
          ...preset,
          isDefault: preset.id === id
        }))
      })),

      // UI State Actions
      setSearching: (isSearching) => set({ isSearching }),
      toggleFilters: () => set((state) => ({ showFilters: !state.showFilters })),
      setShowFilters: (show) => set({ showFilters: show }),
      toggleAdvancedFilters: () => set((state) => ({ showAdvancedFilters: !state.showAdvancedFilters })),
      setActiveFilterCategory: (category) => set({ activeFilterCategory: category }),

      // Quick Filters Actions
      addQuickFilter: (id, label, filters) => set((state) => ({
        quickFilters: [...state.quickFilters, { id, label, filters, isActive: false }]
      })),
      
      toggleQuickFilter: (id) => set((state) => {
        const updatedQuickFilters = state.quickFilters.map(filter =>
          filter.id === id ? { ...filter, isActive: !filter.isActive } : filter
        );
        
        // Apply active quick filters to main filters
        const activeQuickFilters = updatedQuickFilters.filter(f => f.isActive);
        const combinedFilters = activeQuickFilters.reduce((acc, filter) => ({
          ...acc,
          ...filter.filters
        }), defaultFilters);
        
        return {
          quickFilters: updatedQuickFilters,
          filters: { ...state.filters, ...combinedFilters }
        };
      }),
      
      clearQuickFilters: () => set((state) => ({
        quickFilters: state.quickFilters.map(filter => ({ ...filter, isActive: false }))
      })),

      // Suggestions Actions
      setSuggestions: (suggestions) => set({ suggestions }),
      setShowSuggestions: (show) => set({ showSuggestions: show }),
      
      loadSuggestions: async (query) => {
        if (!query.trim()) {
          set({ suggestions: [], showSuggestions: false });
          return;
        }
        
        try {
          // TODO: Replace with actual API call
          const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
          const suggestions = await response.json();
          set({ suggestions, showSuggestions: true });
        } catch (error) {
          console.error('Failed to load suggestions:', error);
          set({ suggestions: [], showSuggestions: false });
        }
      },

      // Recent Searches Actions
      addToRecentSearches: (query) => set((state) => {
        if (!query.trim()) return state;
        
        const filtered = state.recentSearches.filter(q => q !== query);
        return {
          recentSearches: [query, ...filtered].slice(0, state.maxRecentSearches)
        };
      }),
      
      clearRecentSearches: () => set({ recentSearches: [] }),

      // Popular Searches Actions
      loadPopularSearches: async () => {
        try {
          // TODO: Replace with actual API call
          const response = await fetch('/api/search/popular');
          const popularSearches = await response.json();
          set({ popularSearches });
        } catch (error) {
          console.error('Failed to load popular searches:', error);
        }
      },

      // Utility Actions
      getActiveFiltersCount: () => {
        const state = get();
        let count = 0;
        
        Object.entries(state.filters).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length > 0) count++;
          else if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) count++;
          else if (value && typeof value !== 'object') count++;
        });
        
        return count;
      },
      
      hasActiveFilters: () => {
        return get().getActiveFiltersCount() > 0;
      },
      
      exportSearch: () => {
        const state = get();
        return JSON.stringify({
          query: state.query,
          filters: state.filters,
          sortBy: state.sortBy,
          sortOrder: state.sortOrder
        });
      },
      
      importSearch: (searchData) => {
        try {
          const data = JSON.parse(searchData);
          set({
            query: data.query || '',
            filters: data.filters || defaultFilters,
            sortBy: data.sortBy || 'relevance',
            sortOrder: data.sortOrder || 'desc'
          });
        } catch (error) {
          console.error('Failed to import search:', error);
        }
      }
    })),
    {
      name: 'search-store',
      partialize: (state) => ({
        searchHistory: state.searchHistory,
        savedSearches: state.savedSearches,
        filterPresets: state.filterPresets,
        recentSearches: state.recentSearches,
        quickFilters: state.quickFilters
      })
    }
  )
);

export default useSearchStore;
