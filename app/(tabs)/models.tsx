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
  TrendingUp,
  Award,
  Zap,
  Crown,
  Shield,
  Rocket,
} from 'lucide-react-native';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { CarCard } from '@/components/ui/CarCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import { fetchCarModels } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { sanitizeSearchQuery } from '@/utils/dataTransformers';
import { useDebounce } from '@/hooks/useDebounce';
import { useOptimizedFlatList } from '@/hooks/useOptimizedFlatList';
import { CarModel } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');
const ITEM_ESTIMATED_HEIGHT = 320;

export default function ModelsScreen() {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const styles = useMemo(() => getThemedStyles(colors), [colors]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  const optimizedListProps = useOptimizedFlatList({
    estimatedItemSize: ITEM_ESTIMATED_HEIGHT,
    numColumns: 2,
  });

  const { data: models, loading, error, refetch } = useApi(
    () => fetchCarModels({
      searchQuery: sanitizeSearchQuery(debouncedSearchQuery),
      category: selectedCategory && selectedCategory !== 'All' ? selectedCategory : undefined,
    }),
    [debouncedSearchQuery, selectedCategory]
  );

  const categories = [
    { name: 'All', icon: Car, color: colors.textSecondary },
    { name: 'Electric', icon: Zap, color: '#10B981' },
    { name: 'Luxury', icon: Crown, color: '#8B5CF6' },
    { name: 'SUV', icon: Shield, color: '#3B82F6' },
    { name: 'Sports', icon: Rocket, color: '#EF4444' },
    { name: 'Sedan', icon: Car, color: colors.primary },
  ];

  // useEffect and filterModels are no longer needed as filtering is done server-side
  // useEffect(() => {
  //   if (models) {
  //     filterModels();
  //   }
  // }, [searchQuery, selectedCategory, models]);

  // const filterModels = useCallback(() => {
  //   if (!models) return;
  //   let filtered = models;
  //   if (searchQuery.trim()) {
  //     const query = sanitizeSearchQuery(searchQuery).toLowerCase();
  //     filtered = filtered.filter(model =>
  //       model.name.toLowerCase().includes(query) ||
  //       model.brands?.name.toLowerCase().includes(query) ||
  //       model.description?.toLowerCase().includes(query)
  //     );
  //   }
  //   if (selectedCategory && selectedCategory !== 'All') {
  //     filtered = filtered.filter(model =>
  //       model.category?.some(cat =>
  //         cat.toLowerCase().includes(selectedCategory.toLowerCase())
  //       )
  //     );
  //   }
  //   setFilteredModels(filtered);
  // }, [models, searchQuery, selectedCategory]);

  const handleModelPress = useCallback((modelId: number | string) => { // Accept modelId
    router.push(`/model/${modelId}`);
  }, []); // router is stable, so this callback is stable

  const handleFavoriteToggle = useCallback((modelId: number) => {
    if (!user) {
      // Redirect to sign in if not authenticated
      router.push('/auth/sign-in');
      return;
    }
    
    // TODO: Implement favorite toggle for authenticated users
    console.log('Toggle favorite for model:', modelId);
  }, [user, router]);

  const renderModel: ListRenderItem<CarModel> = useCallback(({ item }) => (
    // Add a wrapper View for styling if using numColumns > 1 for spacing
    <View style={styles.modelCardWrapper}>
      <CarCard
        image={item.image_url || ''}
        name={`${item.brands?.name} ${item.name}`}
        year={item.year}
        priceRange="Price on request"
        tags={item.category || []}
        rating={4.5}
        location="Multiple locations"
        onPress={() => handleModelPress(item.id)}
        onFavorite={user ? () => handleFavoriteToggle(item.id) : undefined}
        isFavorite={false} // TODO: Check if model is favorited by user
      />
    </View>
  ), [handleModelPress, handleFavoriteToggle, user, styles.modelCardWrapper]); // styles.modelCardWrapper will be stable if styles is from useMemo

  const renderCategoryFilter = () => (
    <View style={styles.categoriesFilter}>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={categories}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === item.name && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(item.name === 'All' ? null : item.name)}
          >
            <View style={styles.categoryContent}>
              <item.icon 
                color={selectedCategory === item.name ? colors.white : item.color} 
                size={16} 
              />
              <Text style={[
                styles.categoryText,
                selectedCategory === item.name && styles.categoryTextActive
              ]}>
                {item.name}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.categoriesContent}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={32} />
          <Text style={styles.loadingText}>Loading car models...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title="Failed to Load Models"
          message={error}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Car Models</Text>
        <Text style={styles.subtitle}>
          {/* Update subtitle to use models?.length directly */}
          {models?.length || 0} {(models?.length || 0) === 1 ? 'model' : 'models'} available
        </Text>
      </View>

      {/* Search Bar */}
      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search models, brands..."
        onClear={() => setSearchQuery('')}
        // onSubmit can trigger refetch or be handled by debouncedSearchQuery
        containerStyle={styles.searchBarContainer} // Add specific container style if needed
      />

      {/* Category Filter */}
      {renderCategoryFilter()}

      {/* Models List */}
      <FlatList
        data={models || []}
        renderItem={renderModel}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2} // Set to 2 columns
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper} // For spacing between columns
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title="No models found"
            subtitle={searchQuery ? "Try adjusting your search criteria" : "No car models available"}
            icon={<Car color={colors.textSecondary} size={48} />}
          />
        }
        // Remove optimizedListProps spread to avoid conflicts with keyExtractor and numColumns
        // Use individual optimized props if needed
        getItemLayout={optimizedListProps.getItemLayout}
        removeClippedSubviews={optimizedListProps.removeClippedSubviews}
        maxToRenderPerBatch={optimizedListProps.maxToRenderPerBatch}
        windowSize={optimizedListProps.windowSize}
        initialNumToRender={optimizedListProps.initialNumToRender}
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
    backgroundColor: colors.background, // Ensure loading container uses themed background
  },
  loadingText: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...Typography.h1,
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  searchBarContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: colors.background,
  },
  categoriesFilter: {
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoriesContent: {
    paddingLeft: Spacing.xs,
  },
  categoryButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    ...ColorsShadows.small,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...ColorsShadows.medium,
  },
  categoryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  categoryText: {
    ...Typography.bodySmall,
    fontWeight: '500',
    color: colors.text,
  },
  categoryTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.lg - (Spacing.md / 2),
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modelCardWrapper: {
    width: '50%',
    paddingHorizontal: Spacing.md / 2,
    marginBottom: Spacing.lg,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
});