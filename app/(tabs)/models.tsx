import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Car, Search, TrendingUp, Star, Calendar, ChevronRight } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { StatCard } from '@/components/ui/StatCard';
import { UnifiedSearchFilter, useSearchFilters } from '@/components/ui/UnifiedSearchFilter';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { useThemeColors } from '@/hooks/useTheme';
import { useApi } from '@/hooks/useApi';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchCarModels, fetchPopularBrands, FetchCarModelsOptions } from '@/services/api';
import { CarModel, Brand } from '@/types/database';
import { trackScreenView, trackCarInteraction } from '@/services/analyticsService';

const { width } = Dimensions.get('window');

export default function ModelsScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const { layout, cards, buttons } = useDesignTokens();
  const styles = useMemo(() => getThemedStyles(colors), [colors]);
  
  // Use unified search/filter hook
  const {
    filters,
    searchTerm,
    debouncedSearchTerm,
    updateFilters,
    clearFilters: clearSearchFilters,
    setSearchTerm,
    hasActiveFilters,
  } = useSearchFilters({
    searchTerm: '',
    categories: { category: 'All', brand: null },
    sortBy: 'popularity',
    sortOrder: 'desc',
    viewMode: 'grid',
  });
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Fetch car models with filters
  const modelsOptions: FetchCarModelsOptions = useMemo(() => ({
    limit: 50,
    searchQuery: debouncedSearchTerm || undefined,
    category: selectedCategory !== 'All' ? selectedCategory : undefined,
    brandName: selectedBrand || undefined,
  }), [debouncedSearchTerm, selectedCategory, selectedBrand]);
  
  const {
    data: models,
    loading: modelsLoading,
    error: modelsError,
    refetch: refetchModels,
  } = useApi(() => fetchCarModels(modelsOptions), [modelsOptions]);
  
  // Fetch popular brands
  const {
    data: brands,
    loading: brandsLoading,
    error: brandsError,
    refetch: refetchBrands,
  } = useApi(() => fetchPopularBrands(8), []);
  
  const categories = [
    'All',
    'Sedan',
    'SUV',
    'Hatchback',
    'Coupe',
    'Convertible',
    'Wagon',
    'Truck',
    'Electric',
    'Hybrid',
  ];
  
  const modelStats = [
    { icon: <Car color={colors.primary} size={24} />, value: models?.length.toString() || '0', label: 'Car Models' },
    { icon: <TrendingUp color={colors.success} size={24} />, value: brands?.length.toString() || '0', label: 'Active Brands' },
    { icon: <Star color={colors.warning} size={24} />, value: '4.6', label: 'Average Rating' },
  ];
  
  useEffect(() => {
    trackScreenView('models', {
      category: selectedCategory,
      brand: selectedBrand,
      search_query: debouncedSearchTerm,
    });
  }, [selectedCategory, selectedBrand, debouncedSearchTerm]);
  
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([refetchModels(), refetchBrands()]).finally(() => {
      setRefreshing(false);
    });
  }, [refetchModels, refetchBrands]);
  
  const handleModelPress = useCallback((model: CarModel) => {
    trackCarInteraction('view', `${model.name} - ${model.brands?.name || 'Unknown'}`);
    router.push(`/model/${model.id}`);
  }, [router]);
  
  const handleBrandPress = useCallback((brand: Brand) => {
    trackCarInteraction('view', `Brand: ${brand.name}`);
    setSelectedBrand(selectedBrand === brand.name ? null : brand.name);
  }, [selectedBrand]);
  
  const handleCategoryPress = useCallback((category: string) => {
    setSelectedCategory(category);
  }, []);
  
  const clearFilters = useCallback(() => {
    setSelectedCategory('All');
    setSelectedBrand(null);
    setSearchTerm('');
  }, [setSearchTerm]);
  
  const renderModelCard = useCallback(({ item }: { item: CarModel }) => (
    <TouchableOpacity
      style={styles.modelCard}
      onPress={() => handleModelPress(item)}
      activeOpacity={0.7}
    >
      <Card style={styles.card}>
        <OptimizedImage
          source={{ uri: item.image_url || 'https://via.placeholder.com/300x200' }}
          style={styles.modelImage}
        />
        <View style={styles.modelInfo}>
          <View style={styles.modelHeader}>
            <Text style={styles.modelName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.year && (
              <View style={styles.yearBadge}>
                <Calendar size={12} color={colors.textSecondary} />
                <Text style={styles.yearText}>{item.year}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.brandRow}>
            <OptimizedImage
              source={{ uri: item.brands?.logo_url || 'https://via.placeholder.com/24x24' }}
              style={styles.brandLogo}
            />
            <Text style={styles.brandName}>
              {item.brands?.name || 'Unknown Brand'}
            </Text>
          </View>
          
          {item.category && item.category.length > 0 && (
            <Text style={styles.categoryText}>
              {item.category.join(', ')}
            </Text>
          )}
          
          {item.description && (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          
          <View style={styles.cardFooter}>
            <View style={styles.stats}>
              <Star size={16} color={colors.warning} />
              <Text style={styles.statText}>4.{Math.floor(Math.random() * 5)}</Text>
            </View>
            <ChevronRight size={16} color={colors.textSecondary} />
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  ), [colors, styles, handleModelPress]);
  
  const renderBrandChip = useCallback(({ item }: { item: Brand }) => (
    <TouchableOpacity
      style={[
        styles.brandChip,
        selectedBrand === item.name && styles.selectedBrandChip
      ]}
      onPress={() => handleBrandPress(item)}
      activeOpacity={0.7}
    >
      <OptimizedImage
        source={{ uri: item.logo_url || 'https://via.placeholder.com/24x24' }}
        style={styles.brandChipLogo}
      />
      <Text style={[
        styles.brandChipText,
        selectedBrand === item.name && styles.selectedBrandChipText
      ]}>
        {item.name}
      </Text>
    </TouchableOpacity>
  ), [selectedBrand, styles, handleBrandPress]);
  
  const renderCategoryChip = useCallback((category: string) => (
    <TouchableOpacity
      key={category}
      style={[
        styles.categoryChip,
        selectedCategory === category && styles.selectedCategoryChip
      ]}
      onPress={() => handleCategoryPress(category)}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.categoryChipText,
        selectedCategory === category && styles.selectedCategoryChipText
      ]}>
        {category}
      </Text>
    </TouchableOpacity>
  ), [selectedCategory, styles, handleCategoryPress]);
  
  const renderContent = () => {
    if (modelsLoading && !models) {
      return <LoadingSpinner />;
    }
    
    if (modelsError) {
      return (
        <ErrorState
          title="Failed to Load Models"
          message={modelsError}
          onRetry={refetchModels}
        />
      );
    }
    
    if (!models || models.length === 0) {
      return (
        <EmptyState
          title="No Models Found"
          subtitle={searchTerm ? 'Try adjusting your search terms' : 'No car models available'}
        />
      );
    }
    
    return (
      <FlatList
        data={models}
        renderItem={renderModelCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Car Models</Text>
        <Text style={styles.subtitle}>
          Explore {models?.length || 0} car models from top brands
        </Text>
      </View>
      
      {/* Stats */}
      <View style={styles.statsContainer}>
        {modelStats.map((stat, index) => (
          <StatCard
            key={index}
            icon={stat.icon}
            value={stat.value}
            label={stat.label}
            style={styles.statCard}
          />
        ))}
      </View>
      
      {/* Search & Filters */}
      <View style={styles.searchContainer}>
        <UnifiedSearchFilter
          searchPlaceholder="Search car models..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          enableSearch={true}
          
          resultsCount={models?.length || 0}
          resultsLabel="models"
          showResultsCount={true}
          
          variant="compact"
          showClearAll={hasActiveFilters}
          onClearAll={clearSearchFilters}
        />
      </View>
      
      {/* Brand Filters */}
      {brands && brands.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Brands</Text>
          <FlatList
            data={brands}
            renderItem={renderBrandChip}
            keyExtractor={(item) => item.id.toString()}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.brandsContainer}
          />
        </View>
      )}
      
      {/* Category Filters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoriesContainer}>
          {categories.map(renderCategoryChip)}
        </View>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  brandsContainer: {
    paddingHorizontal: 4,
    gap: 12,
  },
  brandChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  selectedBrandChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  brandChipLogo: {
    width: 20,
    height: 20,
  },
  brandChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  selectedBrandChipText: {
    color: colors.white,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectedCategoryChip: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  selectedCategoryChipText: {
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modelCard: {
    width: (width - 48) / 2,
    marginBottom: 16,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  modelImage: {
    width: '100%',
    height: 120,
  },
  modelInfo: {
    padding: 12,
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  yearBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  yearText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  brandLogo: {
    width: 16,
    height: 16,
  },
  brandName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  categoryText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  description: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
});
