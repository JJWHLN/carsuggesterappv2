import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions,
  Platform,
  Alert,
  AppState,
  AppStateStatus,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { MapPin, Star, Calendar, DollarSign, Car } from '@/utils/ultra-optimized-icons';
import { SlidersHorizontal, Zap, TrendingUp, Fuel, Gauge, Building2 } from '@/utils/ultra-optimized-icons';
import { SearchDataService } from '@/services/SearchDataService';
import { AISearchQuery, AISearchEngine, SmartNotificationService, AdvancedThemeManager, usePerformanceMonitor } from '@/services/TempAIServices';

import { CarCard } from '@/components/CarCard';
import AdvancedSearchFilters, { AdvancedSearchFiltersData } from '@/components/AdvancedSearchFilters';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { UnifiedSearchFilter, useSearchFilters } from '@/components/ui/UnifiedSearchFilter';
import { ModernSearchBar } from '@/components/ui/ModernSearchBar';
import { AnimatedBadge, QuickFilters } from '@/components/ui/AnimatedBadge';
import { SearchHistoryManager, useSearchHistory } from '@/components/ui/SearchHistoryManager';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { useThemeColors } from '@/hooks/useTheme';
import { useDebounce } from '@/hooks/useDebounce';
import { useApi } from '@/hooks/useApi';
import { NavigationService } from '@/services/NavigationService';
import { logger } from '@/utils/logger';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'brand' | 'model' | 'category' | 'recent' | 'popular' | 'natural_language';
  icon?: string;
  subtitle?: string;
  popularity?: number;
}

interface SearchFilter {
  id: string;
  label: string;
  value: string;
  active: boolean;
}

import { Car as CarType } from '@/types/database';

const { width, height } = Dimensions.get('window');

export default function SearchScreen() {
  const { colors } = useThemeColors();
  const { layout, cards, buttons, spacing } = useDesignTokens();
  
  // Use unified search/filter hook
  const {
    filters,
    searchTerm,
    debouncedSearchTerm,
    updateFilters,
    clearFilters,
    setSearchTerm,
    hasActiveFilters,
  } = useSearchFilters({
    searchTerm: '',
    categories: {},
    sortBy: 'price-asc',
    sortOrder: 'asc',
    viewMode: 'grid',
  });

  const [cars, setCars] = useState<CarType[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearchHistory, setRecentSearchHistory] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [sortBy, setSortBy] = useState<'price-asc' | 'price-desc' | 'year-desc' | 'mileage-asc' | 'rating-desc'>('price-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [aiSearchQuery, setAiSearchQuery] = useState<AISearchQuery | null>(null);
  const [showAIInsights, setShowAIInsights] = useState(false);
  const [naturalLanguageSearch, setNaturalLanguageSearch] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [performanceMode, setPerformanceMode] = useState<'auto' | 'performance' | 'quality'>('auto');
  
  // AI Search Engine instance
  const aiSearchEngine = AISearchEngine.getInstance();
  const notificationService = SmartNotificationService.getInstance();
  const themeManager = AdvancedThemeManager.getInstance();
  const { measureOperation, generateReport } = usePerformanceMonitor();
  const [recentSearches] = useState<string[]>([
    'BMW 3 Series',
    'Mercedes C-Class',
    'Audi A4',
    'Toyota Camry',
    'Honda Civic'
  ]);
  const [popularSearches] = useState<string[]>([
    'Electric cars',
    'SUV under €30k',
    'Luxury sedans',
    'Hybrid vehicles',
    'Compact cars'
  ]);

  // Memory optimization hooks
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const imageCache = useRef(new Map<string, string>());
  
  // App state change handler for memory optimization
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - refresh data if needed
        measureOperation('app-resume');
        if (debouncedSearchTerm && cars.length > 0) {
          handleSearch(debouncedSearchTerm);
        }
      } else if (nextAppState === 'background') {
        // App went to background - clear memory-intensive data
        measureOperation('app-background-cleanup');
        // Clear image cache to free memory
        imageCache.current.clear();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [debouncedSearchTerm, cars.length, measureOperation]);

  // Memory-optimized image cache manager
  const getCachedImage = useCallback((url: string) => {
    if (imageCache.current.has(url)) {
      return imageCache.current.get(url);
    }
    // Limit cache size to prevent memory issues
    if (imageCache.current.size > 50) {
      const firstKey = imageCache.current.keys().next().value;
      if (firstKey) {
        imageCache.current.delete(firstKey);
      }
    }
    imageCache.current.set(url, url);
    return url;
  }, []);

  // const { data: apiData, loading: apiLoading, error: apiError, refetch } = useApi(() => 
  //   fetch(`/search?q=${debouncedSearchTerm}`).then(res => res.json())
  // );

  // Animation values
  const resultsOpacity = useSharedValue(0);
  const filterBarHeight = useSharedValue(0);

  // Define filter categories for unified search
  const filterCategories = [
    {
      id: 'priceRange',
      label: 'Price Range',
      type: 'single' as const,
      options: [
        { id: 'price-low', label: 'Under €20k', value: '0-20000' },
        { id: 'price-mid', label: '€20k-€50k', value: '20000-50000' },
        { id: 'price-high', label: 'Over €50k', value: '50000+' },
      ],
    },
    {
      id: 'fuelType',
      label: 'Fuel Type',
      type: 'multiple' as const,
      options: [
        { id: 'fuel-petrol', label: 'Petrol', value: 'petrol' },
        { id: 'fuel-diesel', label: 'Diesel', value: 'diesel' },
        { id: 'fuel-electric', label: 'Electric', value: 'electric' },
        { id: 'fuel-hybrid', label: 'Hybrid', value: 'hybrid' },
      ],
    },
    {
      id: 'transmission',
      label: 'Transmission',
      type: 'single' as const,
      options: [
        { id: 'transmission-automatic', label: 'Automatic', value: 'automatic' },
        { id: 'transmission-manual', label: 'Manual', value: 'manual' },
      ],
    },
  ];

  // Quick filters for common searches
  const quickFilters = [
    { id: 'fuelType', label: 'Electric', value: 'electric' },
    { id: 'category', label: 'Luxury', value: 'luxury' },
    { id: 'category', label: 'SUV', value: 'suv' },
    { id: 'category', label: 'Sedan', value: 'sedan' },
    { id: 'priceRange', label: 'Under €30k', value: '0-30000' },
  ];

  // Sort options
  const sortOptions = [
    { id: 'price-asc', label: 'Price: Low to High', value: 'price-asc' },
    { id: 'price-desc', label: 'Price: High to Low', value: 'price-desc' },
    { id: 'year-desc', label: 'Year: Newest First', value: 'year-desc' },
    { id: 'mileage-asc', label: 'Mileage: Low to High', value: 'mileage-asc' },
  ];

  // Mock car data for demo
  const mockCars: CarType[] = [
    {
      id: '1',
      make: 'BMW',
      model: '3 Series',
      year: 2022,
      price: 35000,
      mileage: 15000,
      location: 'Dublin',
      images: ['https://example.com/bmw.jpg'],
      created_at: '2023-01-01T00:00:00Z',
      fuel_type: 'Petrol',
      transmission: 'Automatic',
    },
    {
      id: '2',
      make: 'Mercedes-Benz',
      model: 'C-Class',
      year: 2021,
      price: 42000,
      mileage: 22000,
      location: 'Cork',
      images: ['https://example.com/mercedes.jpg'],
      created_at: '2023-01-01T00:00:00Z',
      fuel_type: 'Diesel',
      transmission: 'Automatic',
    },
    {
      id: '3',
      make: 'Tesla',
      model: 'Model 3',
      year: 2023,
      price: 48000,
      mileage: 5000,
      location: 'Galway',
      images: ['https://example.com/tesla.jpg'],
      created_at: '2023-01-01T00:00:00Z',
      fuel_type: 'Electric',
      transmission: 'Automatic',
    },
  ];

  // Generate intelligent suggestions based on search query and user history
  const generateSuggestions = useCallback((query: string): SearchSuggestion[] => {
    if (!query.trim()) {
      // Show recent and popular searches when no query
      const suggestions: SearchSuggestion[] = [];
      
      // Add recent searches
      recentSearchHistory.slice(0, 3).forEach((search, index) => {
        suggestions.push({
          id: `recent-${index}`,
          text: search,
          type: 'recent',
          subtitle: 'Recent search',
          popularity: 100 - index * 10,
        });
      });
      
      // Add popular searches
      popularSearches.slice(0, 3).forEach((search, index) => {
        suggestions.push({
          id: `popular-${index}`,
          text: search,
          type: 'popular',
          subtitle: 'Popular search',
          popularity: 90 - index * 5,
        });
      });
      
      return suggestions;
    }

    const suggestions: SearchSuggestion[] = [];
    const queryLower = query.toLowerCase();
    
    // Smart brand matching with fuzzy search
    const brands = ['BMW', 'Mercedes-Benz', 'Audi', 'Toyota', 'Honda', 'Volkswagen', 'Ford', 'Chevrolet', 'Tesla', 'Porsche', 'Lexus', 'Infiniti'];
    brands.forEach((brand, index) => {
      const brandLower = brand.toLowerCase();
      if (brandLower.includes(queryLower) || brandLower.startsWith(queryLower)) {
        const relevanceScore = brandLower.startsWith(queryLower) ? 100 : 80;
        suggestions.push({
          id: `brand-${index}`,
          text: brand,
          type: 'brand',
          subtitle: `${Math.floor(Math.random() * 500 + 100)} cars available`,
          popularity: relevanceScore + Math.floor(Math.random() * 20),
        });
      }
    });

    // Enhanced model matching with brand context
    const modelsWithBrands = [
      { model: '3 Series', brand: 'BMW' },
      { model: 'C-Class', brand: 'Mercedes-Benz' },
      { model: 'A4', brand: 'Audi' },
      { model: 'Camry', brand: 'Toyota' },
      { model: 'Civic', brand: 'Honda' },
      { model: 'Model 3', brand: 'Tesla' },
      { model: 'Golf', brand: 'Volkswagen' },
      { model: 'Mustang', brand: 'Ford' },
    ];
    
    modelsWithBrands.forEach((item, index) => {
      const modelLower = item.model.toLowerCase();
      if (modelLower.includes(queryLower) || item.brand.toLowerCase().includes(queryLower)) {
        const relevanceScore = modelLower.startsWith(queryLower) ? 95 : 75;
        suggestions.push({
          id: `model-${index}`,
          text: `${item.brand} ${item.model}`,
          type: 'model',
          subtitle: `${item.brand} model`,
          popularity: relevanceScore + Math.floor(Math.random() * 15),
        });
      }
    });

    // Enhanced category suggestions with descriptions
    const categoriesWithInfo = [
      { name: 'Electric', description: 'Zero emission vehicles', icon: '⚡' },
      { name: 'SUV', description: 'Sport utility vehicles', icon: '🚙' },
      { name: 'Sedan', description: 'Traditional 4-door cars', icon: '🚗' },
      { name: 'Luxury', description: 'Premium vehicles', icon: '✨' },
      { name: 'Hybrid', description: 'Fuel-efficient hybrids', icon: '🌱' },
      { name: 'Sports', description: 'High-performance cars', icon: '🏎️' },
    ];
    
    categoriesWithInfo.forEach((category, index) => {
      const categoryLower = category.name.toLowerCase();
      if (categoryLower.includes(queryLower) || queryLower.includes(categoryLower)) {
        suggestions.push({
          id: `category-${index}`,
          text: category.name,
          type: 'category',
          subtitle: category.description,
          icon: category.icon,
          popularity: 70 + Math.floor(Math.random() * 20),
        });
      }
    });

    // Add search completion suggestions
    if (queryLower.length >= 2) {
      const completions = [
        `${query} under €30k`,
        `${query} automatic`,
        `${query} low mileage`,
        `${query} near me`,
      ];
      
      completions.forEach((completion, index) => {
        suggestions.push({
          id: `completion-${index}`,
          text: completion,
          type: 'category',
          subtitle: 'Search suggestion',
          popularity: 60 - index * 5,
        });
      });
    }

    // Add natural language search examples
    if (queryLower.length >= 3) {
      const naturalLanguageExamples = [
        'Show me reliable cars under €25k',
        'Best electric cars for families',
        'Luxury SUVs with low mileage',
        'Fuel efficient cars for city driving',
        'Sports cars similar to BMW M3',
        'Family cars with automatic transmission'
      ];
      
      naturalLanguageExamples
        .filter(example => example.toLowerCase().includes(queryLower))
        .slice(0, 3)
        .forEach((example, index) => {
          suggestions.push({
            id: `natural-${index}`,
            text: example,
            type: 'natural_language',
            icon: '🤖',
            subtitle: 'AI-powered search',
            popularity: 50 - index * 5,
          });
        });
    }

    return suggestions
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 8);
  }, [recentSearchHistory, popularSearches]);

  // Update suggestions with smart timing
  React.useEffect(() => {
    if (searchFocused) {
      const newSuggestions = generateSuggestions(searchTerm);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [searchTerm, searchFocused, generateSuggestions]);

  // Load recent searches from storage
  React.useEffect(() => {
    const loadStoredSearchData = async () => {
      try {
        const [recentSearches, savedSearches, preferences] = await Promise.all([
          SearchDataService.getRecentSearches(),
          SearchDataService.getSavedSearches(),
          SearchDataService.getSearchPreferences(),
        ]);
        
        // Convert recent searches to string array format
        const recentQueries = recentSearches.map(search => search.query);
        setRecentSearchHistory(recentQueries);
        
        // Convert saved searches to string array format  
        const savedQueries = savedSearches.map(search => search.name);
        setSavedSearches(savedQueries);
        
        // Apply stored preferences
        if (preferences) {
          setSortBy('price-asc' as any);
          setFilters((prev: any) => ({ ...prev, ...preferences.filters }));
        }
      } catch (error) {
        console.error('Error loading search data:', error);
        // Fallback to default data if loading fails
        setRecentSearchHistory(['BMW 3 Series', 'Electric SUV', 'Mercedes C-Class']);
        setSavedSearches(['Luxury cars under €50k', 'Electric vehicles']);
      }
    };
    
    loadStoredSearchData();
  }, []);

  // Enhanced mock search results with smart caching and AI integration
  React.useEffect(() => {
    if (debouncedSearchTerm) {
      const searchOperation = measureOperation('search_operation');
      setLoading(true);
      
      // Check if we should use AI search (natural language patterns detected)
      const hasNaturalLanguagePatterns = aiSearchEngine.hasNaturalLanguagePatterns(debouncedSearchTerm);
      
      // Simulate intelligent search with personalized results
      setTimeout(async () => {
        try {
          const searchResults = await searchOperation.measureAsync(async () => {
            let baseResults = [...mockCars];
            
            if (hasNaturalLanguagePatterns && naturalLanguageSearch) {
              // Use AI-powered search
              const aiQuery = aiSearchEngine.parseNaturalLanguage(debouncedSearchTerm);
              setAiSearchQuery(aiQuery);
              
              if (aiQuery.confidence > 0.7) {
                const aiResults = aiSearchEngine.rankCars(mockCars, aiQuery);
                baseResults = aiResults.slice(0, 50); // Top 50 AI results
                setShowAIInsights(true);
                
                // Create notification for successful AI search
                if (notificationsEnabled) {
                  await notificationService.createNotification(
                    'search_result',
                    '🤖 AI Search Complete',
                    `Found ${aiResults.length} cars matching your natural language query`,
                    { query: debouncedSearchTerm, confidence: aiQuery.confidence }
                  );
                }
              } else {
                // Fall back to traditional search with AI suggestions
                baseResults = baseResults.filter(car => 
                  car.make.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                  car.model.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                  (car.fuel_type && car.fuel_type.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
                );
                setShowAIInsights(false);
              }
            } else {
              // Traditional search with enhanced personalization
              baseResults = baseResults.filter(car => 
                car.make.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                car.model.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                (car.fuel_type && car.fuel_type.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
              );
              setShowAIInsights(false);
            }
            
            // Add personalized scoring (enhanced for non-AI results)
            const personalizedResults = baseResults.map(car => ({
              ...car,
              relevanceScore: calculateRelevanceScore(car, debouncedSearchTerm, recentSearchHistory),
            }));
            
            // Sort by relevance if not already AI-sorted
            if (!hasNaturalLanguagePatterns || !naturalLanguageSearch || (aiSearchQuery && (aiSearchQuery.confidence || 0) <= 0.7)) {
              personalizedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
            }
            
            return personalizedResults;
          });

          setCars(searchResults);
          
          // Check for price alerts and saved search alerts
          if (notificationsEnabled) {
            await notificationService.checkPriceAlerts(searchResults);
            await notificationService.checkSavedSearchAlerts(searchResults);
          }
          
          setLoading(false);
          resultsOpacity.value = withTiming(1, { duration: 300 });
        } catch (error) {
          logger.error('Search error:', error);
          setCars([]);
          setLoading(false);
        }
      }, performanceMode === 'performance' ? 400 : 800); // Adjust timing based on performance mode
    } else {
      setCars([]);
      setAiSearchQuery(null);
      setShowAIInsights(false);
      resultsOpacity.value = withTiming(0, { duration: 300 });
    }
  }, [debouncedSearchTerm, recentSearchHistory, naturalLanguageSearch, performanceMode, notificationsEnabled]);

  // Smart relevance scoring algorithm
  const calculateRelevanceScore = (car: CarType, searchTerm: string, history: string[]): number => {
    let score = 0;
    const searchLower = searchTerm.toLowerCase();
    
    // Direct matches get highest score
    if (car.make.toLowerCase().includes(searchLower)) score += 100;
    if (car.model.toLowerCase().includes(searchLower)) score += 90;
    if (car.fuel_type && car.fuel_type.toLowerCase().includes(searchLower)) score += 80;
    
    // Boost score based on user's search history
    history.forEach(historyItem => {
      if (historyItem.toLowerCase().includes(car.make.toLowerCase())) score += 30;
      if (historyItem.toLowerCase().includes(car.model.toLowerCase())) score += 25;
    });
    
    // Boost newer cars
    const currentYear = new Date().getFullYear();
    const ageBonus = Math.max(0, 20 - (currentYear - car.year));
    score += ageBonus;
    
    // Boost electric cars (trending)
    if (car.fuel_type === 'Electric') score += 15;
    
    return score;
  };

  // Enhanced event handlers with search history
  const handleSearch = useCallback(async (query: string) => {
    setSearchTerm(query);
    if (query.trim()) {
      // Add to recent searches
      setRecentSearchHistory(prev => {
        const newHistory = [query, ...prev.filter(item => item !== query)].slice(0, 5);
        // Save to AsyncStorage
        SearchDataService.addRecentSearch(query, filters).catch(error => 
          console.error('Failed to save recent search:', error)
        );
        return newHistory;
      });
    }
  }, [setSearchTerm, filters]);

  const handleSearchFocus = useCallback(() => {
    setSearchFocused(true);
    setShowSuggestions(true);
  }, []);

  const handleSearchBlur = useCallback(() => {
    // Delay hiding suggestions to allow for tap events
    setTimeout(() => {
      setSearchFocused(false);
      setShowSuggestions(false);
    }, 200);
  }, []);

  const handleClear = useCallback(() => {
    setSearchTerm('');
    setCars([]);
    setSuggestions([]);
    setShowSuggestions(false);
  }, [setSearchTerm]);

  const handleSuggestionPress = useCallback((suggestion: SearchSuggestion) => {
    setSearchTerm(suggestion.text);
    setShowSuggestions(false);
    setSearchFocused(false);
    
    // Enable AI search for natural language suggestions
    if (suggestion.type === 'natural_language') {
      setNaturalLanguageSearch(true);
    }
    
    // Add to recent searches
    setRecentSearchHistory(prev => {
      const newHistory = [suggestion.text, ...prev.filter(item => item !== suggestion.text)].slice(0, 5);
      return newHistory;
    });
  }, [setSearchTerm]);

  const handleSaveSearch = useCallback(async (searchQuery: string) => {
    setSavedSearches(prev => {
      if (prev.includes(searchQuery)) return prev;
      return [...prev, searchQuery].slice(0, 10);
    });
    
    try {
      // Save to AsyncStorage
      const searchName = searchQuery.length > 30 ? `${searchQuery.substring(0, 27)}...` : searchQuery;
      await SearchDataService.saveSearch(searchName, searchQuery, filters);
    } catch (error) {
      console.error('Failed to save search:', error);
    }
  }, [filters]);

  const handleClearSearchHistory = useCallback(async () => {
    setRecentSearchHistory([]);
    
    try {
      // Clear from AsyncStorage
      await SearchDataService.clearRecentSearches();
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  }, []);

  const handleFilterChange = useCallback((newFilters: any) => {
    updateFilters(newFilters);
  }, [updateFilters]);

  const handleQuickFilterPress = useCallback((filterId: string) => {
    setSearchTerm(quickFilters.find(f => f.id === filterId)?.label || '');
  }, [setSearchTerm]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleSortChange = useCallback(async (newSortBy: typeof sortBy) => {
    setSortBy(newSortBy);
    
    try {
      // Save sort preference to AsyncStorage for persistence
      await SearchDataService.saveSortPreference(newSortBy);
    } catch (error) {
      console.error('Failed to save sort preference:', error);
    }
  }, []);

  // Smart sorted cars with personalized preferences
  const sortedCars = useMemo(() => {
    return [...cars].sort((a, b) => {
      // Apply user's preferred sorting
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'year-desc':
          return b.year - a.year;
        case 'mileage-asc':
          return a.mileage - b.mileage;
        case 'rating-desc':
          // Use relevance score as rating for now
          return (b as any).relevanceScore - (a as any).relevanceScore || 0;
        default:
          // Default to relevance-based sorting
          return (b as any).relevanceScore - (a as any).relevanceScore || 0;
      }
    });
  }, [cars, sortBy]);

  // Animation styles
  const resultsStyle = useAnimatedStyle(() => ({
    opacity: resultsOpacity.value,
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Find Your Perfect Car</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Search from thousands of verified listings
        </Text>
      </View>

      {/* Modern Search & Filter Section */}
      <View style={styles.searchSection}>
        {/* Modern Search Bar */}
        <ModernSearchBar
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmit={(query) => setSearchTerm(query)}
          placeholder="Search cars, brands, models..."
          suggestions={[
            'Toyota Camry',
            'Honda Civic', 
            'BMW X5',
            'Mercedes C-Class',
          ]}
          recentSearches={[]}
          popularSearches={[
            'SUV under 30k',
            'Electric cars',
            'Luxury sedans',
            'Fuel efficient',
          ]}
        />
        
        {/* Filter Controls */}
        <UnifiedSearchFilter
          searchPlaceholder=""
          searchValue=""
          onSearchChange={() => {}}
          enableSearch={false}
          
          filterCategories={filterCategories}
          activeFilters={filters}
          onFiltersChange={updateFilters}
          enableFilters={true}
          
          sortOptions={sortOptions}
          enableSort={true}
          
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          enableViewToggle={true}
          
          quickFilters={quickFilters}
          enableQuickFilters={true}
          
          resultsCount={cars.length}
          resultsLabel="cars"
          showResultsCount={searchTerm.length > 0}
          
          variant="compact"
          showClearAll={true}
          onClearAll={clearFilters}
        />
        
        {/* Advanced Filters Button */}
        <TouchableOpacity
          style={[styles.advancedFiltersButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
          onPress={() => setShowAdvancedFilters(true)}
        >
          <SlidersHorizontal size={20} color={colors.primary} />
          <Text style={[styles.advancedFiltersText, { color: colors.text }]}>
            Advanced Filters
          </Text>
        </TouchableOpacity>
        
        {/* AI Search Toggle */}
        <View style={[styles.aiToggleContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.aiToggleContent}>
            <View style={styles.aiToggleInfo}>
              <Text style={[styles.aiToggleTitle, { color: colors.text }]}>🤖 AI-Powered Search</Text>
              <Text style={[styles.aiToggleSubtitle, { color: colors.textSecondary }]}>
                Natural language search with smart suggestions
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.aiToggleSwitch,
                { backgroundColor: naturalLanguageSearch ? colors.primary : colors.border }
              ]}
              onPress={() => setNaturalLanguageSearch(!naturalLanguageSearch)}
              accessibilityRole="switch"
              accessibilityState={{ checked: naturalLanguageSearch }}
              accessibilityLabel="Toggle AI-powered search"
            >
              <View
                style={[
                  styles.aiToggleThumb,
                  { 
                    backgroundColor: colors.background,
                    transform: [{ translateX: naturalLanguageSearch ? 22 : 2 }]
                  }
                ]}
              />
            </TouchableOpacity>
          </View>
          
          {/* AI Insights Display */}
          {showAIInsights && aiSearchQuery && (
            <View style={[styles.aiInsightsContainer, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
              <View style={styles.aiInsightsHeader}>
                <Text style={[styles.aiInsightsTitle, { color: colors.primary }]}>
                  🎯 AI Search Analysis
                </Text>
                <Text style={[styles.aiInsightsConfidence, { color: colors.textSecondary }]}>
                  {Math.round((aiSearchQuery.confidence || 0) * 100)}% confidence
                </Text>
              </View>
              
              <Text style={[styles.aiInsightsText, { color: colors.text }]}>
                {aiSearchEngine.explainResults(aiSearchQuery, cars.length)}
              </Text>
              
              {aiSearchQuery.suggestions && aiSearchQuery.suggestions.length > 0 && (
                <View style={styles.aiSuggestions}>
                  <Text style={[styles.aiSuggestionsTitle, { color: colors.textSecondary }]}>
                    💡 Try these suggestions:
                  </Text>
                  {aiSearchQuery.suggestions.slice(0, 3).map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.aiSuggestionChip, { backgroundColor: colors.background, borderColor: colors.border }]}
                      onPress={() => setSearchTerm(suggestion)}
                    >
                      <Text style={[styles.aiSuggestionText, { color: colors.text }]}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
        
        {/* Phase 4: Advanced Settings Panel */}
        {showAdvancedSettings && (
          <View style={[styles.advancedSettingsPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.advancedSettingsHeader}>
              <Text style={[styles.advancedSettingsTitle, { color: colors.text }]}>
                ⚙️ Advanced Settings
              </Text>
              <TouchableOpacity
                onPress={() => setShowAdvancedSettings(false)}
                style={styles.closeButton}
              >
                <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Performance Mode */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Performance Mode</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Optimize for speed or quality
                </Text>
              </View>
              <View style={styles.performanceModeButtons}>
                {(['auto', 'performance', 'quality'] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.performanceModeButton,
                      {
                        backgroundColor: performanceMode === mode ? colors.primary : colors.background,
                        borderColor: colors.border,
                      }
                    ]}
                    onPress={() => setPerformanceMode(mode)}
                  >
                    <Text style={[
                      styles.performanceModeText,
                      { color: performanceMode === mode ? colors.background : colors.text }
                    ]}>
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Smart Notifications */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Smart Notifications</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Get alerts for price drops and new listings
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.toggleSwitch,
                  { backgroundColor: notificationsEnabled ? colors.primary : colors.border }
                ]}
                onPress={() => setNotificationsEnabled(!notificationsEnabled)}
              >
                <View
                  style={[
                    styles.toggleThumb,
                    { 
                      backgroundColor: colors.background,
                      transform: [{ translateX: notificationsEnabled ? 22 : 2 }]
                    }
                  ]}
                />
              </TouchableOpacity>
            </View>

            {/* Theme Selection */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Theme</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Choose your preferred theme
                </Text>
              </View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.themeSelector}
              >
                {themeManager.getAllThemes().slice(0, 5).map((theme) => (
                  <TouchableOpacity
                    key={theme.id}
                    style={[
                      styles.themeOption,
                      {
                        backgroundColor: theme.colors.primary,
                        borderColor: themeManager.getCurrentTheme().id === theme.id ? colors.text : 'transparent',
                      }
                    ]}
                    onPress={() => themeManager.setTheme(theme)}
                  >
                    <Text style={[styles.themeOptionText, { color: theme.colors.background }]}>
                      {theme.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Performance Stats */}
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingLabel, { color: colors.text }]}>Performance</Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  View app performance metrics
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.performanceStatsButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => {
                  const report = generateReport();
                  console.log('Performance Report:', report);
                  // Show performance report in alert for now
                  Alert.alert(
                    'Performance Report',
                    `Render Time: ${report.averageRenderTime}ms\nTotal Metrics: ${report.totalMetrics}\nStart Time: ${report.appStartTime}ms`,
                    [{ text: 'OK' }]
                  );
                }}
              >
                <Text style={[styles.performanceStatsText, { color: colors.text }]}>
                  📊 View Stats
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Advanced Settings Toggle */}
        <TouchableOpacity
          style={[styles.advancedSettingsToggle, { backgroundColor: colors.background, borderColor: colors.border }]}
          onPress={() => setShowAdvancedSettings(!showAdvancedSettings)}
        >
          <Text style={[styles.advancedSettingsToggleText, { color: colors.textSecondary }]}>
            {showAdvancedSettings ? '🔧 Hide Advanced Settings' : '🔧 Show Advanced Settings'}
          </Text>
        </TouchableOpacity>
        
        {/* Advanced Search Suggestions Overlay */}
        {showSuggestions && suggestions.length > 0 && (
          <View style={[styles.suggestionsOverlay, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <ScrollView 
              style={styles.suggestionsScrollView}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Recent Searches Section */}
              {recentSearchHistory.length > 0 && searchTerm.length === 0 && (
                <View style={styles.suggestionSection}>
                  <View style={styles.suggestionSectionHeader}>
                    <Text style={[styles.suggestionSectionTitle, { color: colors.textSecondary }]}>
                      Recent Searches
                    </Text>
                    <TouchableOpacity onPress={handleClearSearchHistory}>
                      <Text style={[styles.clearHistoryText, { color: colors.primary }]}>Clear</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
              
              {/* Suggestions List */}
              {suggestions.map((suggestion) => (
                <TouchableOpacity
                  key={suggestion.id}
                  style={styles.suggestionItem}
                  onPress={() => handleSuggestionPress(suggestion)}
                  accessibilityRole="button"
                  accessibilityLabel={`Search for ${suggestion.text}`}
                >
                  <View style={styles.suggestionContent}>
                    <View style={styles.suggestionIcon}>
                      {suggestion.type === 'recent' && <Text style={styles.suggestionEmoji}>🕒</Text>}
                      {suggestion.type === 'popular' && <Text style={styles.suggestionEmoji}>🔥</Text>}
                      {suggestion.type === 'brand' && <Text style={styles.suggestionEmoji}>🏢</Text>}
                      {suggestion.type === 'model' && <Text style={styles.suggestionEmoji}>🚗</Text>}
                      {suggestion.type === 'category' && suggestion.icon && <Text style={styles.suggestionEmoji}>{suggestion.icon}</Text>}
                      {suggestion.type === 'category' && !suggestion.icon && <Text style={styles.suggestionEmoji}>📂</Text>}
                    </View>
                    <View style={styles.suggestionTextContainer}>
                      <Text style={[styles.suggestionMainText, { color: colors.text }]}>
                        {suggestion.text}
                      </Text>
                      {suggestion.subtitle && (
                        <Text style={[styles.suggestionSubText, { color: colors.textSecondary }]}>
                          {suggestion.subtitle}
                        </Text>
                      )}
                    </View>
                  </View>
                  
                  {/* Save Search Button for non-recent searches */}
                  {suggestion.type !== 'recent' && (
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleSaveSearch(suggestion.text);
                      }}
                      style={styles.saveSearchButton}
                      accessibilityRole="button"
                      accessibilityLabel="Save this search"
                    >
                      <Text style={styles.saveSearchIcon}>⭐</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
              
              {/* Saved Searches Section */}
              {savedSearches.length > 0 && searchTerm.length === 0 && (
                <View style={styles.suggestionSection}>
                  <Text style={[styles.suggestionSectionTitle, { color: colors.textSecondary }]}>
                    Saved Searches
                  </Text>
                  {savedSearches.map((savedSearch, index) => (
                    <TouchableOpacity
                      key={`saved-${index}`}
                      style={styles.savedSearchItem}
                      onPress={() => handleSuggestionPress({ id: `saved-${index}`, text: savedSearch, type: 'recent' })}
                    >
                      <Text style={styles.suggestionEmoji}>⭐</Text>
                      <Text style={[styles.suggestionMainText, { color: colors.text }]}>{savedSearch}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Results Section */}
      {searchTerm && (
        <Animated.View style={[styles.resultsSection, resultsStyle]}>
          {/* Enhanced Results Header with Active Filters */}
          <View style={styles.resultsHeader}>
            <View style={styles.resultsInfo}>
              <Text style={[styles.resultsTitle, { color: colors.text }]}>
                {loading ? 'Searching...' : `${cars.length} Results`}
              </Text>
              {searchTerm && (
                <Text style={[styles.searchQuery, { color: colors.textSecondary }]}>
                  for "{searchTerm}"
                </Text>
              )}
            </View>
            
            {/* Sort & Filter Controls */}
            <View style={styles.controls}>
              <TouchableOpacity
                style={[styles.sortButton, { backgroundColor: colors.white, borderColor: colors.border }]}
                onPress={() => {
                  // Show sort modal with options
                  Alert.alert(
                    'Sort Cars',
                    'Choose sorting option:',
                    [
                      { text: 'Price: Low to High', onPress: () => console.log('Sort by price asc') },
                      { text: 'Price: High to Low', onPress: () => console.log('Sort by price desc') },
                      { text: 'Year: Newest First', onPress: () => console.log('Sort by year desc') },
                      { text: 'Mileage: Lowest First', onPress: () => console.log('Sort by mileage asc') },
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Sort search results"
                accessibilityHint="Opens sorting options"
              >
                <SlidersHorizontal color={colors.textSecondary} size={16} />
                <Text style={[styles.sortText, { color: colors.textSecondary }]}>Sort</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <View style={styles.activeFiltersContainer}>
              <Text style={[styles.activeFiltersLabel, { color: colors.textSecondary }]}>
                Active filters:
              </Text>
              <View style={styles.activeFiltersList}>
                {Object.entries(filters.categories || {}).map(([category, value]) => (
                  <View key={category} style={[styles.activeFilterChip, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.activeFilterText, { color: colors.primary }]}>
                      {value}
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        const newCategories = { ...filters.categories };
                        delete newCategories[category];
                        updateFilters({ ...filters, categories: newCategories });
                      }}
                      style={styles.removeFilterButton}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${value} filter`}
                      accessibilityHint="Removes this filter from search"
                    >
                      <Text style={[styles.removeFilterX, { color: colors.primary }]}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  onPress={clearFilters}
                  style={styles.clearAllButton}
                >
                  <Text style={[styles.clearAllText, { color: colors.primary }]}>Clear all</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Results List */}
          {loading ? (
            <View style={styles.skeletonContainer}>
              {Array.from({ length: 6 }, (_, i) => (
                <View key={i} style={[
                  styles.skeletonCard,
                  { backgroundColor: colors.cardBackground },
                  viewMode === 'grid' ? styles.skeletonGrid : styles.skeletonList
                ]}>
                  <SkeletonLoader 
                    width="100%" 
                    height={viewMode === 'grid' ? 120 : 100}
                    borderRadius={BorderRadius.md}
                    style={styles.skeletonImage}
                  />
                  <View style={styles.skeletonContent}>
                    <SkeletonLoader width="80%" height={16} style={styles.skeletonTitle} />
                    <View style={styles.skeletonDetailsRow}>
                      <SkeletonLoader width={60} height={12} />
                      <SkeletonLoader width={40} height={12} />
                    </View>
                    <SkeletonLoader width="50%" height={18} style={styles.skeletonPrice} />
                    <SkeletonLoader width="70%" height={12} />
                  </View>
                </View>
              ))}
            </View>
          ) : sortedCars.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <EmptyState
                title="No cars found"
                subtitle="Try adjusting your search criteria or browse our suggestions below"
                icon={<Car color={colors.textSecondary} size={48} />}
              />
              
              {/* Search Suggestions */}
              <View style={styles.suggestionsContainer}>
                <Text style={[styles.suggestionsTitle, { color: colors.text }]}>
                  Try searching for:
                </Text>
                <View style={styles.suggestionsList}>
                  {popularSearches.slice(0, 4).map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.suggestionChip, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                      onPress={() => setSearchTerm(suggestion)}
                    >
                      <Text style={[styles.suggestionText, { color: colors.text }]}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* AI-Powered Search Examples */}
              <View style={styles.suggestionsContainer}>
                <Text style={[styles.suggestionsTitle, { color: colors.text }]}>
                  🤖 Try AI-powered search:
                </Text>
                <View style={styles.suggestionsList}>
                  {[
                    'Best family cars under €30k',
                    'Reliable electric cars for city driving',
                    'Sports cars similar to BMW M3',
                    'Fuel efficient cars with low mileage'
                  ].map((suggestion, index) => (
                    <TouchableOpacity
                      key={`ai-${index}`}
                      style={[styles.suggestionChip, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
                      onPress={() => {
                        setSearchTerm(suggestion);
                        setNaturalLanguageSearch(true);
                      }}
                    >
                      <Text style={[styles.suggestionText, { color: colors.primary }]}>{suggestion}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Popular Categories */}
              <View style={styles.categoriesContainer}>
                <Text style={[styles.categoriesTitle, { color: colors.text }]}>
                  Popular Categories:
                </Text>
                <View style={styles.categoriesList}>
                  {quickFilters.slice(0, 3).map((filter, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.categoryChip, { backgroundColor: colors.primaryLight }]}
                      onPress={() => handleQuickFilterPress(filter.id)}
                    >
                      <Text style={[styles.categoryText, { color: colors.primary }]}>{filter.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ) : (
            <FlatList
              data={sortedCars}
              renderItem={({ item }) => (
                <CarCard
                  car={item}
                  onPress={() => NavigationService.navigateToCar(item.id)}
                />
              )}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              numColumns={viewMode === 'grid' ? 2 : 1}
              key={viewMode}
              columnWrapperStyle={viewMode === 'grid' ? { justifyContent: 'space-between' } : undefined}
              contentContainerStyle={styles.resultsList}
              
              // Performance optimizations
              initialNumToRender={15}
              maxToRenderPerBatch={10}
              windowSize={10}
              removeClippedSubviews={true}
              
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
            />
          )}
        </Animated.View>
      )}

      {/* Smart Featured Section (when no search) */}
      {!searchTerm && (
        <ScrollView 
          style={styles.featuredSection}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          <View style={styles.featuredHeader}>
            <Text style={[styles.featuredTitle, { color: colors.text }]}>
              {recentSearchHistory.length > 0 ? 'Recommended for You' : 'Featured Cars'}
            </Text>
            <Text style={[styles.featuredSubtitle, { color: colors.textSecondary }]}>
              {recentSearchHistory.length > 0 
                ? 'Based on your recent searches and preferences'
                : 'Handpicked recommendations for you'
              }
            </Text>
          </View>

          {/* Smart Recommendations */}
          {recentSearchHistory.length > 0 && (
            <View style={styles.recommendationsSection}>
              <Text style={[styles.recommendationTitle, { color: colors.text }]}>
                Because you searched for "{recentSearchHistory[0]}"
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.recommendationsList}
              >
                {mockCars.slice(0, 2).map((car) => (
                  <View key={`rec-${car.id}`} style={styles.recommendationCard}>
                    <CarCard
                      car={car}
                      onPress={() => NavigationService.navigateToCar(car.id)}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Regular Featured Cars */}
          {mockCars.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              onPress={() => NavigationService.navigateToCar(car.id)}
            />
          ))}
        </ScrollView>
      )}

      {/* Advanced Search Filters Modal */}
      <AdvancedSearchFilters
        visible={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApplyFilters={(appliedFilters: AdvancedSearchFiltersData) => {
          // Apply the filters to the search
          // For now, we'll just trigger a search with the search term
          // The actual filtering logic should be implemented in the API service
          console.log('Applied advanced filters:', appliedFilters);
          
          // Trigger a new search with the current search term to refresh results
          if (searchTerm) {
            handleSearch(searchTerm);
          }
          
          setShowAdvancedFilters(false);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  title: {
    ...Typography.pageTitle,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyText,
    lineHeight: 22,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  advancedFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 8,
  },
  advancedFiltersText: {
    fontSize: 16,
    fontWeight: '600',
  },
  quickFiltersSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.sectionTitle,
    fontWeight: '600',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  quickFiltersContainer: {
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.md,
  },
  quickFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
    ...Shadows.sm,
  },
  quickFilterEmoji: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  quickFilterText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  resultsSection: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  resultsInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  resultsTitle: {
    ...Typography.sectionTitle,
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  searchQuery: {
    ...Typography.caption,
    fontStyle: 'italic',
  },
  activeFiltersContainer: {
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.1)',
  },
  activeFiltersLabel: {
    ...Typography.caption,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  activeFiltersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  activeFilterText: {
    ...Typography.caption,
    fontWeight: '500',
    marginRight: Spacing.xs / 2,
  },
  removeFilterButton: {
    width: 20, // Increased from 16 for better touch target
    height: 20, // Increased from 16 for better touch target
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  removeFilterX: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 12,
  },
  clearAllButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  clearAllText: {
    ...Typography.caption,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  emptyStateContainer: {
    flex: 1,
    paddingVertical: Spacing.xl,
  },
  suggestionsContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  suggestionsTitle: {
    ...Typography.cardTitle,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  suggestionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2, // Increased for better touch target
    minHeight: 44, // Accessibility touch target
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  suggestionText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  categoriesContainer: {
    marginTop: Spacing.lg,
  },
  categoriesTitle: {
    ...Typography.cardTitle,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  categoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  categoryText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  skeletonContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: Spacing.xl,
  },
  skeletonCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.card,
  },
  skeletonGrid: {
    width: (width - Spacing.lg * 3) / 2,
  },
  skeletonList: {
    width: '100%',
    flexDirection: 'row',
  },
  skeletonImage: {
    marginBottom: Spacing.sm,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonTitle: {
    marginBottom: Spacing.sm,
  },
  skeletonDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  skeletonPrice: {
    marginBottom: Spacing.xs,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2, // Increased for 44px minimum touch target
    minHeight: 44, // Accessibility touch target
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  sortText: {
    ...Typography.caption,
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    ...Typography.bodyText,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  resultsList: {
    paddingBottom: Spacing.xl,
  },
  carCard: {
    marginBottom: Spacing.lg,
  },
  featuredSection: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  featuredHeader: {
    marginBottom: Spacing.lg,
  },
  featuredTitle: {
    ...Typography.sectionTitle,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  featuredSubtitle: {
    ...Typography.bodyText,
    lineHeight: 22,
  },
  // Advanced Search Suggestions Styles
  suggestionsOverlay: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 300,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.xs,
    zIndex: 1000,
    ...Shadows.large,
  },
  suggestionsScrollView: {
    maxHeight: 300,
  },
  suggestionSection: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  suggestionSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  suggestionSectionTitle: {
    ...Typography.caption,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearHistoryText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 48,
  },
  suggestionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  suggestionEmoji: {
    fontSize: 18,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  suggestionMainText: {
    ...Typography.bodyText,
    fontWeight: '500',
  },
  suggestionSubText: {
    ...Typography.caption,
    marginTop: 2,
  },
  saveSearchButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  saveSearchIcon: {
    fontSize: 16,
  },
  savedSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  // Smart Recommendations Styles
  recommendationsSection: {
    marginBottom: Spacing.xl,
  },
  recommendationTitle: {
    ...Typography.cardTitle,
    fontWeight: '600',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  recommendationsList: {
    paddingLeft: Spacing.lg,
  },
  recommendationCard: {
    width: width * 0.7,
    marginRight: Spacing.md,
  },
  // AI Search Styles
  aiToggleContainer: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  aiToggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiToggleInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  aiToggleTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  aiToggleSubtitle: {
    ...Typography.caption,
    lineHeight: 18,
  },
  aiToggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  aiToggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    ...Shadows.sm,
  },
  aiInsightsContainer: {
    marginTop: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  aiInsightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  aiInsightsTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  aiInsightsConfidence: {
    ...Typography.caption,
    fontWeight: '500',
  },
  aiInsightsText: {
    ...Typography.body,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  aiSuggestions: {
    marginTop: Spacing.sm,
  },
  aiSuggestionsTitle: {
    ...Typography.caption,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  aiSuggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  aiSuggestionText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  // Phase 4: Advanced Settings Styles
  advancedSettingsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
    ...Shadows.sm,
  },
  advancedSettingsToggleText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  advancedSettingsPanel: {
    marginTop: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    ...Shadows.medium,
  },
  advancedSettingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  advancedSettingsTitle: {
    ...Typography.cardTitle,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  settingRow: {
    marginBottom: Spacing.lg,
  },
  settingInfo: {
    marginBottom: Spacing.sm,
  },
  settingLabel: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  settingDescription: {
    ...Typography.caption,
    lineHeight: 18,
  },
  performanceModeButtons: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  performanceModeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  performanceModeText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    ...Shadows.sm,
  },
  themeSelector: {
    marginTop: Spacing.xs,
  },
  themeOption: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    marginRight: Spacing.xs,
    minWidth: 60,
    alignItems: 'center',
  },
  themeOptionText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  performanceStatsButton: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    ...Shadows.sm,
  },
  performanceStatsText: {
    ...Typography.caption,
    fontWeight: '500',
  },
});
