import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { CarCard } from '@/components/CarCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useThemeColors } from '@/hooks/useTheme';
import { withUnifiedTabScreen } from '@/components/ui/UnifiedTabScreen';
import { UnifiedList } from '@/components/ui/UnifiedList';
import { UnifiedSearchFilter, useSearchFilters } from '@/components/ui/UnifiedSearchFilter';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { fetchVehicleListings } from '@/services/supabaseService';
import { transformDatabaseVehicleListingToCar } from '@/utils/dataTransformers';
import { Car as CarType } from '@/types/database';
import { useDebounce } from '@/hooks/useDebounce';
import { NavigationService } from '@/services/NavigationService';
import { Search, Filter, MapPin, DollarSign, Car, TrendingUp, Users, Star, Building2, Award, Clock, ChevronRight, Mail, List, Shield } from '@/utils/ultra-optimized-icons';

// Lazy loaded components for performance optimization
// Note: Commented out for compatibility - can be re-enabled when module resolution is fixed
// const LazyFeaturedSection = lazy(() => import('@/components/marketplace/FeaturedSection'));
// const LazyDealerSection = lazy(() => import('@/components/marketplace/DealerSection'));
// const LazyStatsSection = lazy(() => import('@/components/marketplace/StatsSection'));

const { width } = Dimensions.get('window');

function MarketplaceScreen() {
  const { colors } = useThemeColors();
  const { layout, cards, buttons } = useDesignTokens();
  const styles = useMemo(() => getThemedStyles(colors), [colors]);
  
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
    sortBy: 'price',
    sortOrder: 'asc',
    viewMode: 'grid',
  });
  
  const [cars, setCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Additional state for components not covered by unified hook
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Categories for the old category filter (will be deprecated)
  const categories = [
    { id: 'all', label: 'All Cars', count: cars.length },
    { id: 'sedan', label: 'Sedan', count: 25 },
    { id: 'suv', label: 'SUV', count: 18 },
    { id: 'hatchback', label: 'Hatchback', count: 12 },
    { id: 'coupe', label: 'Coupe', count: 8 },
    { id: 'convertible', label: 'Convertible', count: 5 },
  ];

  // Filter categories for the unified search/filter
  const filterCategories = [
    {
      id: 'category',
      label: 'Category',
      type: 'single' as const,
      options: [
        { id: 'all', label: 'All Cars', value: 'all', count: cars.length },
        { id: 'sedan', label: 'Sedan', value: 'sedan', count: 25 },
        { id: 'suv', label: 'SUV', value: 'suv', count: 18 },
        { id: 'hatchback', label: 'Hatchback', value: 'hatchback', count: 12 },
        { id: 'coupe', label: 'Coupe', value: 'coupe', count: 8 },
        { id: 'convertible', label: 'Convertible', value: 'convertible', count: 5 },
      ],
    },
    {
      id: 'priceRange',
      label: 'Price Range',
      type: 'single' as const,
      options: [
        { id: 'under25k', label: 'Under $25,000', value: '0-25000' },
        { id: '25k-50k', label: '$25,000 - $50,000', value: '25000-50000' },
        { id: '50k-100k', label: '$50,000 - $100,000', value: '50000-100000' },
        { id: 'over100k', label: 'Over $100,000', value: '100000+' },
      ],
    },
  ];

  const quickFilters = [
    { id: 'category', label: 'Electric', value: 'electric' },
    { id: 'category', label: 'Luxury', value: 'luxury' },
    { id: 'category', label: 'Sports', value: 'sports' },
    { id: 'priceRange', label: 'Under $30k', value: '0-30000' },
  ];

  const marketplaceStats = [
    { icon: <Car color={colors.primary} size={24} />, value: cars.length.toString(), label: "Cars Available" },
    { icon: <Users color={colors.success} size={24} />, value: "89", label: "Verified Dealers" },
    { icon: <Shield color={colors.primary} size={24} />, value: "100%", label: "Verified Listings" },
  ];

  // Load initial data
  useEffect(() => {
    loadCars(true);
  }, [debouncedSearchTerm]);

  const loadCars = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setError(null);
        setPage(0);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 0 : page;
      const limit = 10;
      
      const data = await fetchVehicleListings(currentPage, limit, debouncedSearchTerm || undefined);
      
      if (data && Array.isArray(data)) {
        const transformedCars = data.map(transformDatabaseVehicleListingToCar);
        
        if (reset) {
          setCars(transformedCars);
        } else {
          setCars(prevCars => [...prevCars, ...transformedCars]);
        }
        
        setHasMore(transformedCars.length === limit);
        setPage(currentPage + 1);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load cars';
      setError(errorMsg);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadCars(true);
  }, [debouncedSearchTerm]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && cars.length > 0) {
      loadCars(false);
    }
  }, [loadingMore, hasMore, cars.length]);

  const handleCarPress = useCallback((carId: string) => {
    console.log('Navigate to car details:', carId);
    NavigationService.navigateToCar(carId);
  }, []);

  const renderListing = ({ item }: { item: CarType }) => (
    <View style={viewMode === 'grid' ? styles.gridItem : styles.listItem}>
      <CarCard
        car={item}
        onPress={() => handleCarPress(item.id)}
      />
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.footerLoader}>
        <LoadingSpinner size={24} color={colors.primary} />
        <Text style={styles.footerLoaderText}>Loading more cars...</Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={[styles.heroTitle, { color: colors.text }]}>Car Marketplace</Text>
        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
          Find your perfect car from verified dealers nationwide
        </Text>
        
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <UnifiedSearchFilter
            searchPlaceholder="Search by make, model, or location..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            enableSearch={true}
            
            filterCategories={filterCategories}
            activeFilters={filters}
            onFiltersChange={updateFilters}
            enableFilters={true}
            
            quickFilters={quickFilters}
            enableQuickFilters={true}
            
            resultsCount={cars.length}
            resultsLabel="cars available"
            showResultsCount={true}
            
            variant="compact"
            showClearAll={true}
            onClearAll={clearFilters}
          />
        </View>
      </View>

      {/* Lazy Loaded Stats Section */}
      {/* Note: Lazy loading disabled for compatibility */}
      
      {/* Lazy Loaded Featured Section */}
      {/* Note: Lazy loading disabled for compatibility */}
      
      {/* Lazy Loaded Dealer Section */}
      {/* Note: Lazy loading disabled for compatibility */}

      {/* Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          {marketplaceStats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              {stat.icon}
              <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.leftControls}>
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={() => {}}
          >
            <Filter color={colors.primary} size={18} />
            <Text style={[styles.filterButtonText, { color: colors.text }]}>Filters</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
            onPress={() => {}}
          >
            <Text style={[styles.sortButtonText, { color: colors.text }]}>Price: Low to High</Text>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.viewToggle, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'grid' && { backgroundColor: colors.primary }]}
            onPress={() => setViewMode('grid')}
          >
            <Text style={{ color: viewMode === 'grid' ? colors.background : colors.textSecondary }}>Grid</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'list' && { backgroundColor: colors.primary }]}
            onPress={() => setViewMode('list')}
          >
            <List color={viewMode === 'list' ? colors.background : colors.textSecondary} size={16} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.id && { backgroundColor: colors.primary, borderColor: colors.primary }
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === item.id && { color: colors.background }
              ]}>
                {item.label} ({item.count})
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoriesContent}
        />
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, { color: colors.text }]}>{cars.length} cars</Text>
        <Text style={[styles.resultsLocation, { color: colors.textSecondary }]}>from verified dealers</Text>
      </View>
    </View>
  );

  // Loading state
  if (loading && cars.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  // Error state
  if (error && cars.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorState
          title="Unable to Load Marketplace"
          message={error}
          onRetry={() => loadCars(true)}
        />
      </SafeAreaView>
    );
  }

  // Empty state
  if (!loading && cars.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <View style={styles.emptyStateContainer}>
          <EmptyState
            title="No vehicles available"
            subtitle={searchTerm ? "Try adjusting your search criteria or browse all available cars" : "We're working to add more listings to our marketplace"}
            icon={<Car color={colors.textSecondary} size={64} />}
            action={
              searchTerm ? (
                <Button
                  title="Clear Search"
                  onPress={() => setSearchTerm('')}
                  variant="outline"
                />
              ) : (
                <Button
                  title="Refresh Listings"
                  onPress={() => loadCars(true)}
                  variant="primary"
                />
              )
            }
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={cars}
        renderItem={renderListing}
        keyExtractor={(item) => item.id.toString()}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={viewMode === 'grid' ? styles.columnWrapper : undefined}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
}

export default function WrappedMarketplaceScreen() {
  return (
    <ErrorBoundary>
      <MarketplaceScreen />
    </ErrorBoundary>
  );
}

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  loadingText: {
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  footerLoaderText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  
  // Header
  headerContainer: {
    backgroundColor: colors.background,
    paddingBottom: 16,
  },
  heroSection: {
    backgroundColor: colors.cardBackground,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  heroSearchBar: {
    marginHorizontal: 0,
  },
  
  // Stats
  statsSection: {
    padding: 16,
    backgroundColor: colors.background,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  
  // Controls
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftControls: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  
  // Categories
  categoriesContainer: {
    paddingVertical: 12,
    backgroundColor: colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoriesContent: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.text,
  },
  
  // Results
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background,
    gap: 4,
  },
  resultsCount: {
    fontSize: 18,
    fontWeight: '700',
  },
  resultsLocation: {
    fontSize: 14,
  },
  
  // List
  listContent: {
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  gridItem: {
    width: (width - 16 * 2 - 12) / 2,
    marginBottom: 16,
  },
  listItem: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  carCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});