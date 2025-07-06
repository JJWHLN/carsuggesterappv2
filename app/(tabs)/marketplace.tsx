import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, MapPin, DollarSign, Car, TrendingUp, Users, Shield, Star, Building2, Award, Clock, ChevronRight, Phone, Mail, ExternalLink, Grid2x2, List, CircleAlert as AlertCircle } from 'lucide-react-native';
import { StatCard } from '@/components/ui/StatCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { Card } from '@/components/ui/Card';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import { fetchVehicleListings } from '@/services/supabaseService';
import { transformDatabaseVehicleListingToCar } from '@/utils/dataTransformers';
import { Car as CarType } from '@/types/database';
import { useDebounce } from '@/hooks/useDebounce';

const { width } = Dimensions.get('window');

export default function MarketplaceScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => getThemedStyles(colors), [colors]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cars, setCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const categories = [
    { id: 'all', name: 'All Cars', count: cars.length },
    { id: 'luxury', name: 'Luxury', count: 0 },
    { id: 'electric', name: 'Electric', count: 0 },
    { id: 'suv', name: 'SUV', count: 0 },
    { id: 'sedan', name: 'Sedan', count: 0 },
    { id: 'truck', name: 'Truck', count: 0 },
  ];

  const marketplaceStats = [
    { icon: <Car color={colors.primary} size={24} />, value: cars.length.toString(), label: "Cars Available" },
    { icon: <Users color={colors.success} size={24} />, value: "89", label: "Verified Dealers" },
    { icon: <Shield color={colors.accentGreen} size={24} />, value: "100%", label: "Verified Listings" },
  ];

  // Load initial data
  useEffect(() => {
    loadCars(true);
  }, [debouncedSearchQuery]);

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
      
      console.log('🔍 Fetching cars from Supabase...', { page: currentPage, limit, searchQuery: debouncedSearchQuery });
      
      const data = await fetchVehicleListings(currentPage, limit, debouncedSearchQuery || undefined);
      
      if (data && Array.isArray(data)) {
        const transformedCars = data.map(transformDatabaseVehicleListingToCar);
        
        if (reset) {
          setCars(transformedCars);
        } else {
          setCars(prev => [...prev, ...transformedCars]);
        }
        
        setHasMore(data.length === limit);
        setPage(currentPage + 1);
        
        console.log('✅ Successfully loaded cars:', transformedCars.length);
      } else {
        console.warn('⚠️ No data returned from fetchVehicleListings');
        if (reset) {
          setCars([]);
        }
        setHasMore(false);
      }
    } catch (err) {
      console.error('❌ Error loading cars:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load car listings';
      setError(errorMessage);
      
      if (reset) {
        setCars([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadCars(true);
  }, [debouncedSearchQuery]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && cars.length > 0) {
      loadCars(false);
    }
  }, [loadingMore, hasMore, cars.length]);

  const handleCarPress = useCallback((carId: string) => {
    console.log('Navigate to car details:', carId);
    // TODO: Navigate to car detail screen
    // router.push(`/car/${carId}`);
  }, []);

  const CarListingCard = useCallback(({ listing, isListView = false }: { listing: CarType, isListView?: boolean }) => (
    <TouchableOpacity 
      style={[styles.listingCard, isListView && styles.listingCardList]}
      onPress={() => handleCarPress(listing.id)}
      activeOpacity={0.9}
    >
      <View style={[styles.listingImageContainer, isListView && styles.listingImageContainerList]}>
        <OptimizedImage 
          source={{ uri: listing.images[0] || 'https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=400' }} 
          style={styles.listingImage}
          fallbackSource={{ uri: 'https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=400' }}
        />
        
        <View style={styles.featuredBadge}>
          <Star color={colors.white} size={12} fill={colors.white} />
          <Text style={styles.featuredText}>Listed</Text>
        </View>
        
        {listing.dealer?.verified && (
          <View style={styles.verifiedBadge}>
            <Shield color={colors.success} size={10} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>
      
      <View style={[styles.listingContent, isListView && styles.listingContentList]}>
        <View style={styles.listingHeader}>
          <Text style={styles.listingPrice}>${listing.price.toLocaleString()}</Text>
        </View>
        
        <Text style={styles.listingTitle} numberOfLines={2}>
          {listing.year} {listing.make} {listing.model}
        </Text>
        
        <View style={styles.listingSpecs}>
          <View style={styles.specBadge}>
            <Text style={styles.specText}>{listing.mileage.toLocaleString()} mi</Text>
          </View>
          {listing.fuel_type && (
            <View style={styles.specBadge}>
              <Text style={styles.specText}>{listing.fuel_type}</Text>
            </View>
          )}
          {listing.condition && (
            <View style={styles.specBadge}>
              <Text style={styles.specText}>{listing.condition}</Text>
            </View>
          )}
        </View>
        
        {listing.dealer && (
          <View style={styles.dealerInfo}>
            <View style={styles.dealerLeft}>
              <Text style={styles.dealerName}>{listing.dealer.name}</Text>
              {listing.dealer.verified && (
                <View style={styles.dealerVerifiedBadge}>
                  <Shield color={colors.success} size={10} />
                  <Text style={styles.dealerVerifiedText}>Verified</Text>
                </View>
              )}
            </View>
            <View style={styles.ratingContainer}>
              <Star color={colors.warning} size={12} fill={colors.warning} />
              <Text style={styles.ratingText}>4.5</Text>
            </View>
          </View>
        )}
        
        <View style={styles.listingLocation}>
          <MapPin color={colors.textSecondary} size={14} />
          <Text style={styles.locationText}>{listing.location}</Text>
        </View>
        
        {isListView && (
          <View style={styles.listingActions}>
            <Button
              title="Contact Dealer"
              onPress={() => {}}
              variant="outline"
              style={styles.contactButton}
            />
            <TouchableOpacity style={styles.phoneButton}>
              <Phone color={colors.primary} size={16} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  ), [colors, styles, handleCarPress]);

  const renderListing = ({ item }: { item: CarType }) => (
    <View style={viewMode === 'grid' ? styles.gridItem : styles.listItem}>
      <CarListingCard listing={item} isListView={viewMode === 'list'} />
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
        <Text style={styles.heroTitle}>Car Marketplace</Text>
        <Text style={styles.heroSubtitle}>
          Find your perfect car from verified dealers nationwide
        </Text>
        
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by make, model, or location..."
          onClear={() => setSearchQuery('')}
          containerStyle={styles.heroSearchBar}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          {marketplaceStats.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
            />
          ))}
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.leftControls}>
          <TouchableOpacity style={styles.filterButton}>
            <Filter color={colors.primary} size={18} />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.sortButton}>
            <Text style={styles.sortButtonText}>Price: Low to High</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
            onPress={() => setViewMode('grid')}
          >
            <Grid2x2 color={viewMode === 'grid' ? colors.white : colors.textSecondary} size={16} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <List color={viewMode === 'list' ? colors.white : colors.textSecondary} size={16} />
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
                selectedCategory === item.id && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === item.id && styles.categoryTextActive
              ]}>
                {item.name} ({item.count})
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoriesContent}
        />
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {cars.length} cars found
        </Text>
        <Text style={styles.resultsLocation}>from verified dealers</Text>
      </View>
    </View>
  );

  // Loading state
  if (loading && cars.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={32} color={colors.primary} />
          <Text style={styles.loadingText}>Finding the best cars for you...</Text>
          <Text style={styles.loadingSubtext}>Connecting to our marketplace database</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error && cars.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title="Unable to Load Marketplace"
          message={error}
          onRetry={() => loadCars(true)}
          icon={<AlertCircle color={colors.error} size={48} />}
        />
      </SafeAreaView>
    );
  }

  // Empty state
  if (!loading && cars.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.emptyStateContainer}>
          <EmptyState
            title="No vehicles available"
            subtitle={searchQuery ? "Try adjusting your search criteria or browse all available cars" : "We're working to add more listings to our marketplace"}
            icon={<Car color={colors.textSecondary} size={64} />}
            action={
              searchQuery ? (
                <Button
                  title="Clear Search"
                  onPress={() => setSearchQuery('')}
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
    <SafeAreaView style={styles.container}>
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

const getThemedStyles = (colors: typeof import('@/constants/Colors').Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Loading States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.h3,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '600',
  },
  loadingSubtext: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  footerLoaderText: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  
  // Header
  headerContainer: {
    backgroundColor: colors.background,
    paddingBottom: Spacing.md,
  },
  heroSection: {
    backgroundColor: colors.surface,
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroTitle: {
    ...Typography.h1,
    color: colors.text,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  heroSearchBar: {
    marginHorizontal: 0,
  },
  
  // Stats
  statsSection: {
    padding: Spacing.lg,
    backgroundColor: colors.background,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  
  // Controls
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftControls: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: Spacing.xs,
  },
  filterButtonText: {
    ...Typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  sortButton: {
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortButtonText: {
    ...Typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  viewButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  viewButtonActive: {
    backgroundColor: colors.primary,
  },
  
  // Categories
  categoriesContainer: {
    paddingVertical: Spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.lg,
  },
  categoryChip: {
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: Spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    ...Typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  
  // Results
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: colors.background,
    gap: Spacing.xs,
  },
  resultsCount: {
    ...Typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  resultsLocation: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  
  // List
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  gridItem: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    marginBottom: Spacing.lg,
  },
  listItem: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  
  // Listing Cards
  listingCard: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...ColorsShadows.card,
  },
  listingCardList: {
    flexDirection: 'row',
    height: 160,
  },
  listingImageContainer: {
    position: 'relative',
    height: 140,
  },
  listingImageContainerList: {
    width: 140,
    height: '100%',
  },
  listingImage: {
    width: '100%',
    height: '100%',
  },
  featuredBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  featuredText: {
    ...Typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 10,
  },
  verifiedBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  verifiedText: {
    ...Typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 10,
  },
  listingContent: {
    padding: Spacing.md,
  },
  listingContentList: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  listingPrice: {
    ...Typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  listingTitle: {
    ...Typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  listingSpecs: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },
  specBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  specText: {
    ...Typography.caption,
    color: colors.primary,
    fontSize: 10,
    fontWeight: '500',
  },
  dealerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dealerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dealerName: {
    ...Typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  dealerVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
    borderRadius: BorderRadius.xs,
    gap: 2,
  },
  dealerVerifiedText: {
    ...Typography.caption,
    color: colors.white,
    fontSize: 9,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    ...Typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  listingLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  locationText: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  listingActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  contactButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
  },
  phoneButton: {
    backgroundColor: colors.primaryLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
});