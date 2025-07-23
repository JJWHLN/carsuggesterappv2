import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  ScrollView, 
  RefreshControl,
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useCanPerformAction } from '@/components/ui/RoleProtection';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CarCard } from '@/components/CarCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { SkeletonLoader } from '@/components/ui/SkeletonLoader';
import { UnifiedSearchFilter, useSearchFilters } from '@/components/ui/UnifiedSearchFilter';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { NavigationService } from '@/services/NavigationService';
import { useDebounce } from '@/hooks/useDebounce';
import { useApi } from '@/hooks/useApi';
import { logger } from '@/utils/logger';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';
import { AISearchQuery, AISearchEngine, SmartNotificationService, AdvancedThemeManager, usePerformanceMonitor } from '@/services/TempAIServices';
import { Car as CarType } from '@/types/database';
import { SlidersHorizontal, Car, Sparkles, Search, Zap } from '@/utils/ultra-optimized-icons';

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

const { width, height } = Dimensions.get('window');

export default function AISearchTab() {
  const { colors } = useThemeColors();
  const { layout, cards, buttons, spacing } = useDesignTokens();
  const { user } = useAuth();
  const canAccessAI = useCanPerformAction('accessAI');
  
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
  const [naturalLanguageSearch, setNaturalLanguageSearch] = useState(true); // Default to true for AI tab
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
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

  // Animation values
  const resultsOpacity = useSharedValue(0);
  const filterBarHeight = useSharedValue(0);

  // If user can't access AI, show auth prompt
  if (!canAccessAI) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.authPrompt}>
          <View style={styles.iconContainer}>
            <Sparkles size={64} color={colors.textSecondary} />
          </View>
          <Text style={[styles.authTitle, { color: colors.text }]}>
            AI-Powered Car Search
          </Text>
          <Text style={[styles.authDescription, { color: colors.textSecondary }]}>
            Get personalized car recommendations using advanced AI technology. 
            Sign in to access this premium feature.
          </Text>
          <Button
            title="Sign In to Access AI"
            onPress={() => NavigationService.navigateToAuth('sign-in')}
            style={styles.authButton}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    );
  }
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
    // TODO: Load from AsyncStorage
    setRecentSearchHistory(['BMW 3 Series', 'Electric SUV', 'Mercedes C-Class']);
    setSavedSearches(['Luxury cars under €50k', 'Electric vehicles']);
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
            if (!hasNaturalLanguagePatterns || !naturalLanguageSearch || (aiSearchQuery && aiSearchQuery.confidence <= 0.7)) {
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
          console.error('Search error:', error);
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
  const handleSearch = useCallback((query: string) => {
    setSearchTerm(query);
    if (query.trim()) {
      // Add to recent searches
      setRecentSearchHistory(prev => {
        const newHistory = [query, ...prev.filter(item => item !== query)].slice(0, 5);
        // TODO: Save to AsyncStorage
        return newHistory;
      });
    }
  }, [setSearchTerm]);

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
    
    // AI search is always enabled in AI tab
    if (suggestion.type === 'natural_language') {
      setNaturalLanguageSearch(true);
    }
    
    // Add to recent searches
    setRecentSearchHistory(prev => {
      const newHistory = [suggestion.text, ...prev.filter(item => item !== suggestion.text)].slice(0, 5);
      return newHistory;
    });
  }, [setSearchTerm]);

  const handleSaveSearch = useCallback((searchQuery: string) => {
    setSavedSearches(prev => {
      if (prev.includes(searchQuery)) return prev;
      return [...prev, searchQuery].slice(0, 10);
    });
    // TODO: Save to AsyncStorage
  }, []);

  const handleClearSearchHistory = useCallback(() => {
    setRecentSearchHistory([]);
    // TODO: Clear from AsyncStorage
  }, []);

  const handleFilterChange = useCallback((newFilters: any) => {
    updateFilters(newFilters);
  }, [updateFilters]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleSortChange = useCallback((newSortBy: typeof sortBy) => {
    setSortBy(newSortBy);
    // TODO: Save sort preference to AsyncStorage for persistence
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
      {/* Unified Search & Filter Section */}
      <View style={styles.searchSection}>
        <UnifiedSearchFilter
          searchPlaceholder="Ask me anything... 'Show me reliable cars under €25k'"
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          enableSearch={true}
          
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
          
          variant="expanded"
          showClearAll={true}
          onClearAll={clearFilters}
        />
        
        {/* AI Search Status */}
        <View style={[styles.aiStatusContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.aiStatusContent}>
            <View style={styles.aiStatusIcon}>
              <Sparkles size={20} color={colors.primary} />
            </View>
            <View style={styles.aiStatusInfo}>
              <Text style={[styles.aiStatusTitle, { color: colors.text }]}>AI Search Active</Text>
              <Text style={[styles.aiStatusSubtitle, { color: colors.textSecondary }]}>
                Natural language processing enabled
              </Text>
            </View>
            <View style={[styles.aiStatusBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.aiStatusBadgeText, { color: colors.background }]}>ON</Text>
            </View>
          </View>
          
          {/* AI Insights Display */}
          {showAIInsights && aiSearchQuery && (
            <View style={[styles.aiInsightsContainer, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
              <View style={styles.aiInsightsHeader}>
                <Text style={[styles.aiInsightsTitle, { color: colors.primary }]}>
                  🎯 AI Analysis
                </Text>
                <Text style={[styles.aiInsightsConfidence, { color: colors.textSecondary }]}>
                  {Math.round(aiSearchQuery.confidence * 100)}% confidence
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
      </View>

      {/* Results Section */}
      {searchTerm ? (
        <Animated.View style={[styles.resultsSection, resultsStyle]}>
          {/* Enhanced Results Header */}
          <View style={styles.resultsHeader}>
            <View style={styles.resultsInfo}>
              <Text style={[styles.resultsTitle, { color: colors.text }]}>
                {loading ? 'AI Searching...' : `${cars.length} Results`}
              </Text>
              {searchTerm && (
                <Text style={[styles.searchQuery, { color: colors.textSecondary }]}>
                  for "{searchTerm}"
                </Text>
              )}
            </View>
            
            {/* Sort Controls */}
            <View style={styles.controls}>
              <TouchableOpacity
                style={[styles.sortButton, { backgroundColor: colors.white, borderColor: colors.border }]}
                onPress={() => {/* TODO: Implement sort modal */}}
                activeOpacity={0.7}
              >
                <SlidersHorizontal color={colors.textSecondary} size={16} />
                <Text style={[styles.sortText, { color: colors.textSecondary }]}>Sort</Text>
              </TouchableOpacity>
            </View>
          </View>

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
                subtitle="Try a different search query or use our AI suggestions"
                icon={<Car color={colors.textSecondary} size={48} />}
              />
              
              {/* AI Search Examples */}
              <View style={styles.aiExamplesContainer}>
                <Text style={[styles.aiExamplesTitle, { color: colors.text }]}>
                  🤖 Try these AI-powered searches:
                </Text>
                <View style={styles.aiExamplesList}>
                  {[
                    'Show me reliable cars under €25k',
                    'Best electric cars for families',
                    'Luxury SUVs with low mileage',
                    'Fuel efficient cars for city driving'
                  ].map((example, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.aiExampleChip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                      onPress={() => setSearchTerm(example)}
                    >
                      <Text style={[styles.aiExampleText, { color: colors.primary }]}>{example}</Text>
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
                  onPress={() => {/* TODO: Navigate to car details */}}
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
      ) : (
        /* AI Getting Started Section */
        <ScrollView 
          style={styles.gettingStartedSection}
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
          <View style={styles.gettingStartedContent}>
            <Text style={[styles.gettingStartedTitle, { color: colors.text }]}>
              How to use AI Search
            </Text>
            <Text style={[styles.gettingStartedDescription, { color: colors.textSecondary }]}>
              Simply describe what you're looking for in natural language, and our AI will understand and find the perfect cars for you.
            </Text>

            {/* AI Examples */}
            <View style={styles.aiExamplesSection}>
              <Text style={[styles.aiExamplesTitle, { color: colors.text }]}>
                Try these examples:
              </Text>
              
              {[
                {
                  query: 'Show me reliable cars under €25k',
                  description: 'Budget-friendly reliable vehicles',
                  icon: '💰'
                },
                {
                  query: 'Best electric cars for families',
                  description: 'Family-friendly electric vehicles',
                  icon: '⚡'
                },
                {
                  query: 'Luxury SUVs with low mileage',
                  description: 'Premium SUVs in great condition',
                  icon: '✨'
                },
                {
                  query: 'Fuel efficient cars for city driving',
                  description: 'Perfect for urban commuting',
                  icon: '🏙️'
                }
              ].map((example, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.aiExampleCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                  onPress={() => setSearchTerm(example.query)}
                >
                  <View style={styles.aiExampleIcon}>
                    <Text style={styles.aiExampleEmoji}>{example.icon}</Text>
                  </View>
                  <View style={styles.aiExampleContent}>
                    <Text style={[styles.aiExampleQuery, { color: colors.text }]}>
                      "{example.query}"
                    </Text>
                    <Text style={[styles.aiExampleDescription, { color: colors.textSecondary }]}>
                      {example.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Auth prompt styles
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  authTitle: {
    ...Typography.pageTitle,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  authDescription: {
    ...Typography.bodyText,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  },
  authButton: {
    marginHorizontal: Spacing.md,
    minWidth: 200,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerIcon: {
    marginRight: Spacing.md,
  },
  headerText: {
    flex: 1,
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
  // Search section styles
  searchSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  aiStatusContainer: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  aiStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiStatusIcon: {
    marginRight: Spacing.sm,
  },
  aiStatusInfo: {
    flex: 1,
  },
  aiStatusTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  aiStatusSubtitle: {
    ...Typography.caption,
    lineHeight: 18,
  },
  aiStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
    ...Shadows.sm,
  },
  aiStatusBadgeText: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 10,
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
    ...Typography.bodyText,
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
  // Results section styles
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
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    minHeight: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  sortText: {
    ...Typography.caption,
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
  // Skeleton loading styles
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
  resultsList: {
    paddingBottom: Spacing.xl,
  },
  // Empty state styles
  emptyStateContainer: {
    flex: 1,
    paddingVertical: Spacing.xl,
  },
  aiExamplesContainer: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  aiExamplesTitle: {
    ...Typography.cardTitle,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  aiExamplesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  aiExampleChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    minHeight: 44,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  aiExampleText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  // Getting started section styles
  gettingStartedSection: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  gettingStartedContent: {
    paddingVertical: Spacing.lg,
  },
  gettingStartedTitle: {
    ...Typography.sectionTitle,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  gettingStartedDescription: {
    ...Typography.bodyText,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  aiExamplesSection: {
    marginTop: Spacing.md,
  },
  aiExampleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  aiExampleIcon: {
    marginRight: Spacing.md,
  },
  aiExampleEmoji: {
    fontSize: 24,
  },
  aiExampleContent: {
    flex: 1,
  },
  aiExampleQuery: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  aiExampleDescription: {
    ...Typography.caption,
    lineHeight: 18,
  },
});
