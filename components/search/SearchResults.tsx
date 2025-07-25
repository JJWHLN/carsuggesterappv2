import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';

import { useDesignSystem } from '@/hooks/useDesignSystem';
import { UnifiedCarCard as CarCard } from '@/components/ui/unified';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Car as CarType } from '@/types/database';
import { Grid, List } from '@/utils/ultra-optimized-icons';

interface SearchResultsProps {
  cars: CarType[];
  loading: boolean;
  refreshing: boolean;
  viewMode: 'grid' | 'list';
  sortBy: 'price-asc' | 'price-desc' | 'year-desc' | 'mileage-asc' | 'rating-desc';
  onRefresh: () => void;
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onSortChange: (sort: string) => void;
  onCarPress: (car: CarType) => void;
}

export function SearchResults({
  cars,
  loading,
  refreshing,
  viewMode,
  sortBy,
  onRefresh,
  onViewModeChange,
  onSortChange,
  onCarPress,
}: SearchResultsProps) {
  const { colors, spacing, typography, borderRadius } = useDesignSystem();

  const sortOptions = [
    { value: 'price-asc', label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'year-desc', label: 'Newest First' },
    { value: 'mileage-asc', label: 'Lowest Mileage' },
    { value: 'rating-desc', label: 'Highest Rated' },
  ];

  const getSortedCars = () => {
    const sortedCars = [...cars];
    
    switch (sortBy) {
      case 'price-asc':
        return sortedCars.sort((a, b) => (a.price || 0) - (b.price || 0));
      case 'price-desc':
        return sortedCars.sort((a, b) => (b.price || 0) - (a.price || 0));
      case 'year-desc':
        return sortedCars.sort((a, b) => (b.year || 0) - (a.year || 0));
      case 'mileage-asc':
        return sortedCars.sort((a, b) => (a.mileage || 0) - (b.mileage || 0));
      case 'rating-desc':
        // Since rating doesn't exist in Car type, sort by year as fallback
        return sortedCars.sort((a, b) => (b.year || 0) - (a.year || 0));
      default:
        return sortedCars;
    }
  };

  const sortedCars = getSortedCars();

  if (loading && cars.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      {/* Results Header */}
      <View style={[styles.resultsHeader, { borderBottomColor: colors.border }]}>
        <View style={styles.resultsInfo}>
          <Text style={[styles.resultsCount, { color: colors.text }]}>
            {cars.length} cars found
          </Text>
        </View>
        
        <View style={styles.viewControls}>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              {
                backgroundColor: viewMode === 'grid' ? colors.primary : 'transparent',
                borderColor: colors.border,
              }
            ]}
            onPress={() => onViewModeChange('grid')}
          >
            <Grid 
              size={18} 
              color={viewMode === 'grid' ? colors.background : colors.text} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              {
                backgroundColor: viewMode === 'list' ? colors.primary : 'transparent',
                borderColor: colors.border,
              }
            ]}
            onPress={() => onViewModeChange('list')}
          >
            <List 
              size={18} 
              color={viewMode === 'list' ? colors.background : colors.text} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={[styles.sortLabel, { color: colors.textSecondary }]}>
          Sort by:
        </Text>
        {sortOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.sortOption,
              {
                backgroundColor: sortBy === option.value ? colors.primary : 'transparent',
                borderColor: colors.border,
              }
            ]}
            onPress={() => onSortChange(option.value)}
          >
            <Text
              style={[
                styles.sortOptionText,
                {
                  color: sortBy === option.value ? colors.background : colors.text,
                }
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results List */}
      {sortedCars.length === 0 ? (
        <EmptyState
          title="No cars found"
          subtitle="Try adjusting your search filters"
          icon="car"
        />
      ) : (
        <FlatList
          data={sortedCars}
          renderItem={({ item }) => (
            <View
              style={[
                styles.carCard,
                viewMode === 'list' && styles.listModeCard
              ]}
            >
              <CarCard
                car={item}
                onPress={() => onCarPress(item)}
              />
            </View>
          )}
          keyExtractor={(item) => item.id}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode} // Force re-render when view mode changes
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  resultsInfo: {
    flex: 1,
  },
  resultsCount: {
    fontSize: 16,
    fontWeight: '600',
  },
  viewControls: {
    flexDirection: 'row',
    gap: 8,
  },
  viewModeButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  sortOptionText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  carCard: {
    marginBottom: 16,
  },
  listModeCard: {
    width: '100%',
  },
});
