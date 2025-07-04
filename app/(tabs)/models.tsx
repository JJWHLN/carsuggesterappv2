import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added useMemo
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Car, Filter, SlidersHorizontal } from 'lucide-react-native'; // Search, Filter might not be needed directly if using SearchBar component
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModelCard } from '@/components/ModelCard';
import { CarCard } from '@/components/ui/CarCard'; // Import the new CarCard
import { SearchBar } from '@/components/ui/SearchBar'; // Import the new SearchBar
import { Spacing, Typography, BorderRadius } from '@/constants/Colors'; // Removed currentColors
import { useThemeColors } from '@/hooks/useTheme'; // Import useThemeColors
import { fetchCarModels } from '@/services/api';
import { useApi } from '@/hooks/useApi';
import { sanitizeSearchQuery } from '@/utils/dataTransformers'; // Will still use for cleaning input
import { useDebounce } from '@/hooks/useDebounce'; // Import useDebounce
import { useOptimizedFlatList } from '@/hooks/useOptimizedFlatList'; // Import useOptimizedFlatList
import { CarModel } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth

const ITEM_ESTIMATED_HEIGHT = 320; // Estimated height for CarCard + wrapper margin

export default function ModelsScreen() {
  const { colors } = useThemeColors(); // Use themed colors
  const { user } = useAuth(); // Get authentication state
  const styles = useMemo(() => getThemedStyles(colors), [colors]); // Memoize styles

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  // const [filteredModels, setFilteredModels] = useState<CarModel[]>([]); // No longer needed

  const debouncedSearchQuery = useDebounce(searchQuery, 500); // Debounce search query
  const optimizedListProps = useOptimizedFlatList({
    estimatedItemSize: ITEM_ESTIMATED_HEIGHT, // Provide estimated item size
    numColumns: 2, // Important for getItemLayout if numColumns is > 1
    // itemHeight could be used if all items have exactly the same height
  });

  const { data: models, loading, error, refetch } = useApi(
    // Pass debouncedSearchQuery and selectedCategory to fetchCarModels
    () => fetchCarModels({
      searchQuery: sanitizeSearchQuery(debouncedSearchQuery), // Sanitize before sending to API
      category: selectedCategory && selectedCategory !== 'All' ? selectedCategory : undefined,
      // Consider adding a limit here if not already handled, e.g. limit: 50
    }),
    [debouncedSearchQuery, selectedCategory] // Dependencies for useApi
  );

  const categories = ['All', 'Luxury', 'Family', 'Sports', 'Electric', 'SUV', 'Sedan'];

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
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === item && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(item === 'All' ? null : item)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === item && styles.categoryTextActive
            ]}>
              {item}
            </Text>
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
  },
  categoriesContent: {
  },
  categoryButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xl,
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    ...Typography.bodySmall,
    fontWeight: Typography.caption.fontWeight,
    color: colors.text,
  },
  categoryTextActive: {
    color: colors.white,
  },
  listContent: {
    paddingHorizontal: Spacing.lg - (Spacing.md / 2),
    paddingVertical: Spacing.lg,
  },
  modelCardWrapper: {
    width: '50%',
    paddingHorizontal: Spacing.md / 2,
    marginBottom: Spacing.md,
  },
  columnWrapper: {
  },
});