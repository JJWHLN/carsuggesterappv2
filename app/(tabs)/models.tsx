import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  Car, 
  Filter, 
  SlidersHorizontal, 
  Search,
  MapPin,
  Heart,
  Star,
  Fuel,
  Settings,
  Calendar,
  Grid2x2,
  List,
} from 'lucide-react-native';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchBar } from '@/components/ui/SearchBar';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { 
  CategoryChip, 
  SectionHeader, 
  Badge, 
  HeroSection, 
  ViewToggle, 
  FilterButton, 
  ResultsHeader, 
  LoadingContainer 
} from '@/components/ui/SharedComponents';
import { Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors';
import { createCommonStyles } from '@/constants/CommonStyles';
import { useThemeColors } from '@/hooks/useTheme';
import { fetchCarModels } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { sanitizeSearchQuery } from '@/utils/dataTransformers';
import { useDebounce } from '@/hooks/useDebounce';
import { useOptimizedFlatList } from '@/hooks/useOptimizedFlatList';
import { CarModel } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');
const ITEM_ESTIMATED_HEIGHT = 280;

export default function ModelsScreen() {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const styles = useMemo(() => getThemedStyles(colors), [colors]);
  const commonStyles = useMemo(() => createCommonStyles(colors), [colors]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'year'>('name');

  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const optimizedListProps = useOptimizedFlatList({
    estimatedItemSize: ITEM_ESTIMATED_HEIGHT,
    numColumns: viewMode === 'grid' ? 2 : 1,
  });

  const { data: models, loading, error, refetch } = useApi(
    () => fetchCarModels({
      searchQuery: sanitizeSearchQuery(debouncedSearchQuery),
      category: selectedCategory && selectedCategory !== 'All' ? selectedCategory : undefined,
    }),
    [debouncedSearchQuery, selectedCategory]
  );

  const categories = [
    { name: 'All', count: models?.length || 0 },
    { name: 'Electric', count: 45 },
    { name: 'Luxury', count: 32 },
    { name: 'SUV', count: 78 },
    { name: 'Sports', count: 23 },
    { name: 'Sedan', count: 56 },
  ];

  const sortOptions = [
    { key: 'name', label: 'Name A-Z' },
    { key: 'price', label: 'Price: Low to High' },
    { key: 'year', label: 'Year: Newest First' },
  ];

  const handleModelPress = useCallback((modelId: number | string) => {
    router.push(`/model/${modelId}`);
  }, []);

  const handleFavoriteToggle = useCallback((modelId: number) => {
    if (!user) {
      router.push('/auth/sign-in');
      return;
    }
    console.log('Toggle favorite for model:', modelId);
  }, [user, router]);

  const CarListingCard = useCallback(({ item, isListView = false }: { item: CarModel, isListView?: boolean }) => (
    <TouchableOpacity
      style={[styles.carCard, isListView && styles.carCardList]}
      onPress={() => handleModelPress(item.id)}
      activeOpacity={0.9}
    >
      <View style={[styles.carImageContainer, isListView && styles.carImageContainerList]}>
        <OptimizedImage
          source={{ uri: item.image_url || 'https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=400' }}
          style={styles.carImage}
          resizeMode="cover"
        />
        
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => handleFavoriteToggle(item.id)}
        >
          <Heart color={colors.white} size={18} />
        </TouchableOpacity>
        
        <View style={styles.carBadge}>
          <Text style={styles.carBadgeText}>New Listing</Text>
        </View>
      </View>
      
      <View style={[styles.carContent, isListView && styles.carContentList]}>
        <View style={styles.carHeader}>
          <Text style={styles.carPrice}>From $35,000</Text>
          <View style={styles.ratingContainer}>
            <Star color={colors.warning} size={14} fill={colors.warning} />
            <Text style={styles.ratingText}>4.5</Text>
          </View>
        </View>
        
        <Text style={styles.carTitle}>{item.brands?.name} {item.name}</Text>
        <Text style={styles.carYear}>{item.year} Model</Text>
        
        <View style={styles.carSpecs}>
          <View style={styles.specItem}>
            <Fuel color={colors.textSecondary} size={12} />
            <Text style={styles.specText}>Hybrid</Text>
          </View>
          <View style={styles.specItem}>
            <Settings color={colors.textSecondary} size={12} />
            <Text style={styles.specText}>Auto</Text>
          </View>
          <View style={styles.specItem}>
            <Calendar color={colors.textSecondary} size={12} />
            <Text style={styles.specText}>2024</Text>
          </View>
        </View>
        
        <View style={styles.carLocation}>
          <MapPin color={colors.textSecondary} size={14} />
          <Text style={styles.locationText}>Available Nationwide</Text>
        </View>
        
        {isListView && (
          <Text style={styles.carDescription} numberOfLines={2}>
            {item.description || 'Experience luxury and performance in this exceptional vehicle with premium features and cutting-edge technology.'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  ), [handleModelPress, handleFavoriteToggle, colors, styles]);

  const renderModel: ListRenderItem<CarModel> = useCallback(({ item }) => (
    <View style={viewMode === 'grid' ? styles.gridItemWrapper : styles.listItemWrapper}>
      <CarListingCard item={item} isListView={viewMode === 'list'} />
    </View>
  ), [viewMode, CarListingCard, styles]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search by make, model, or features..."
        onClear={() => setSearchQuery('')}
        containerStyle={styles.searchBarContainer}
      />

      {/* Filter Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.leftControls}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal color={colors.primary} size={20} />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.sortButton}>
            <Text style={styles.sortButtonText}>Sort: {sortOptions.find(s => s.key === sortBy)?.label}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
            onPress={() => setViewMode('grid')}
          >
            <Grid2x2 color={viewMode === 'grid' ? colors.white : colors.textSecondary} size={18} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <List color={viewMode === 'list' ? colors.white : colors.textSecondary} size={18} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filters */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.name && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(item.name === 'All' ? null : item.name)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === item.name && styles.categoryTextActive
              ]}>
                {item.name} ({item.count})
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoriesContent}
        />
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {models?.length || 0} cars available
        </Text>
        <Text style={styles.resultsSubtext}>
          {selectedCategory && selectedCategory !== 'All' ? `in ${selectedCategory}` : 'in all categories'}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={32} />
          <Text style={styles.loadingText}>Finding the perfect cars for you...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title="Failed to Load Cars"
          message={error}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={models || []}
        renderItem={renderModel}
        key={viewMode} // Force re-render when view mode changes
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={viewMode === 'grid' ? styles.columnWrapper : undefined}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title="No cars found"
            subtitle={searchQuery ? "Try adjusting your search criteria" : "No car models available"}
            icon={<Car color={colors.textSecondary} size={48} />}
          />
        }
        {...optimizedListProps}
        keyExtractor={(item) => item.id.toString()}
        numColumns={viewMode === 'grid' ? 2 : 1}
      />
    </SafeAreaView>
  );
}

const getThemedStyles = (colors: typeof import('@/constants/Colors').Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  
  // Header
  headerContainer: {
    backgroundColor: colors.background,
  },
  searchBarContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  
  // Controls
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: colors.background,
  },
  leftControls: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
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
    backgroundColor: colors.surface,
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
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  categoriesContent: {
    paddingRight: Spacing.lg,
  },
  categoryChip: {
    backgroundColor: colors.surface,
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
  
  // Results Header
  resultsHeader: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  resultsCount: {
    ...Typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  resultsSubtext: {
    ...Typography.bodySmall,
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
  gridItemWrapper: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    marginBottom: Spacing.lg,
  },
  listItemWrapper: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  
  // Car Cards
  carCard: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...ColorsShadows.card,
  },
  carCardList: {
    flexDirection: 'row',
    height: 140,
  },
  carImageContainer: {
    position: 'relative',
    height: 160,
  },
  carImageContainerList: {
    width: 140,
    height: '100%',
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: BorderRadius.full,
    padding: Spacing.sm,
  },
  carBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  carBadgeText: {
    ...Typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 10,
  },
  carContent: {
    padding: Spacing.md,
  },
  carContentList: {
    flex: 1,
    justifyContent: 'space-between',
  },
  carHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  carPrice: {
    ...Typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ratingText: {
    ...Typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  carTitle: {
    ...Typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  carYear: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  carSpecs: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    gap: 2,
  },
  specText: {
    ...Typography.caption,
    color: colors.primary,
    fontSize: 10,
    fontWeight: '500',
  },
  carLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  locationText: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  carDescription: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});