import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SearchBar } from '@/components/ui/SearchBar';
import { CarCard } from '@/components/CarCard';
import { withUnifiedTabScreen } from '@/components/ui/UnifiedTabScreen';
import { UnifiedList } from '@/components/ui/UnifiedList';
import { fetchVehicleListings } from '@/services/supabaseService';
import { transformDatabaseVehicleListingToCar } from '@/utils/dataTransformers';
import { Car as CarType } from '@/types/database';
import { useDebounce } from '@/hooks/useDebounce';
import { useThemeColors } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');

function MarketplaceScreen() {
  const { colors } = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const categories = [
    { id: 'all', name: 'All Cars' },
    { id: 'luxury', name: 'Luxury' },
    { id: 'electric', name: 'Electric' },
    { id: 'suv', name: 'SUV' },
    { id: 'sedan', name: 'Sedan' },
    { id: 'truck', name: 'Truck' },
  ];

  const handleCarPress = useCallback((carId: string) => {
    console.log('Navigate to car details:', carId);
    // TODO: Navigate to car detail screen
    // router.push(`/car/${carId}`);
  }, []);

  const renderCarItem = useCallback((item: CarType, index: number) => (
    <View style={viewMode === 'grid' ? styles.gridItem : styles.listItem}>
      <CarCard
        car={item}
        onPress={() => handleCarPress(item.id)}
      />
    </View>
  ), [viewMode, handleCarPress]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={[styles.heroTitle, { color: colors.text }]}>Car Marketplace</Text>
        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
          Find your perfect car from verified dealers nationwide
        </Text>
        
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search cars, brands, models..."
          onClear={() => setSearchQuery('')}
        />
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                { backgroundColor: colors.cardBackground },
                selectedCategory === category.id && { backgroundColor: colors.primary },
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.categoryName,
                  { color: colors.text },
                  selectedCategory === category.id && { color: colors.background },
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* View Toggle */}
      <View style={styles.viewToggleContainer}>
        <TouchableOpacity
          style={[
            styles.viewToggle,
            { backgroundColor: colors.cardBackground },
            viewMode === 'grid' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setViewMode('grid')}
        >
          <Text style={[
            styles.viewToggleText,
            { color: colors.text },
            viewMode === 'grid' && { color: colors.background },
          ]}>
            Grid
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewToggle,
            { backgroundColor: colors.cardBackground },
            viewMode === 'list' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[
            styles.viewToggleText,
            { color: colors.text },
            viewMode === 'list' && { color: colors.background },
          ]}>
            List
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <UnifiedList<CarType>
      fetchData={async (page: number, limit: number, searchTerm?: string) => {
        const result = await fetchVehicleListings(page, limit, searchTerm);
        if (result && Array.isArray(result)) {
          return result.map(transformDatabaseVehicleListingToCar);
        }
        return [];
      }}
      renderItem={renderCarItem}
      renderHeader={renderHeader}
      keyExtractor={(item) => item.id}
      numColumns={viewMode === 'grid' ? 2 : 1}
      searchQuery={debouncedSearchQuery}
      emptyTitle="No cars found"
      emptyMessage="Try adjusting your search or filters"
      loadingMessage="Finding the perfect cars for you..."
      errorTitle="Unable to load cars"
      style={styles.list}
      contentContainerStyle={styles.listContent}
      columnWrapperStyle={viewMode === 'grid' ? styles.columnWrapper : undefined}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
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
  
  // Header styles
  headerContainer: {
    paddingBottom: 16,
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  
  // Categories
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // View toggle
  viewToggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  viewToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

// Use the UnifiedTabScreen HOC
export default withUnifiedTabScreen(MarketplaceScreen);
