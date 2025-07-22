import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { AnimatedBadge, QuickFilters } from './AnimatedBadge';
import { SearchHistoryManager } from './SearchHistoryManager';
import { ModernSearchBar } from './ModernSearchBar';
import { Search, SlidersHorizontal, X } from '@/utils/ultra-optimized-icons';

interface EnhancedSearchFilters {
  priceRange?: string;
  fuelType?: string[];
  transmission?: string;
  brand?: string[];
  bodyType?: string[];
  year?: { min: number; max: number };
}

interface EnhancedSearchProps {
  onSearch: (query: string, filters: EnhancedSearchFilters) => void;
  onClearFilters: () => void;
  initialQuery?: string;
  initialFilters?: EnhancedSearchFilters;
  style?: ViewStyle;
}

export const EnhancedSearchExperience: React.FC<EnhancedSearchProps> = ({
  onSearch,
  onClearFilters,
  initialQuery = '',
  initialFilters = {},
  style,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<EnhancedSearchFilters>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const filtersHeight = useSharedValue(0);
  const historyOpacity = useSharedValue(0);

  // Quick filter options
  const quickFilterOptions = [
    { id: 'priceRange', label: 'Under €30k', value: '0-30000', category: 'price' },
    { id: 'fuelType', label: 'Electric', value: 'electric', category: 'fuel' },
    { id: 'fuelType', label: 'Hybrid', value: 'hybrid', category: 'fuel' },
    { id: 'bodyType', label: 'SUV', value: 'suv', category: 'body' },
    { id: 'bodyType', label: 'Sedan', value: 'sedan', category: 'body' },
    { id: 'transmission', label: 'Automatic', value: 'automatic', category: 'transmission' },
  ];

  // Advanced filter categories
  const advancedFilters = [
    {
      id: 'priceRange',
      label: 'Price Range',
      options: [
        { label: 'Under €20k', value: '0-20000' },
        { label: '€20k - €40k', value: '20000-40000' },
        { label: '€40k - €60k', value: '40000-60000' },
        { label: 'Over €60k', value: '60000+' },
      ],
    },
    {
      id: 'fuelType',
      label: 'Fuel Type',
      options: [
        { label: 'Petrol', value: 'petrol' },
        { label: 'Diesel', value: 'diesel' },
        { label: 'Electric', value: 'electric' },
        { label: 'Hybrid', value: 'hybrid' },
        { label: 'Plugin Hybrid', value: 'plugin-hybrid' },
      ],
    },
    {
      id: 'brand',
      label: 'Brand',
      options: [
        { label: 'BMW', value: 'bmw' },
        { label: 'Mercedes-Benz', value: 'mercedes' },
        { label: 'Audi', value: 'audi' },
        { label: 'Toyota', value: 'toyota' },
        { label: 'Tesla', value: 'tesla' },
        { label: 'Volkswagen', value: 'volkswagen' },
      ],
    },
    {
      id: 'bodyType',
      label: 'Body Type',
      options: [
        { label: 'SUV', value: 'suv' },
        { label: 'Sedan', value: 'sedan' },
        { label: 'Hatchback', value: 'hatchback' },
        { label: 'Coupe', value: 'coupe' },
        { label: 'Convertible', value: 'convertible' },
        { label: 'Estate', value: 'estate' },
      ],
    },
  ];

  const getActiveFilterCount = useCallback(() => {
    let count = 0;
    if (filters.priceRange) count++;
    if (filters.fuelType?.length) count += filters.fuelType.length;
    if (filters.transmission) count++;
    if (filters.brand?.length) count += filters.brand.length;
    if (filters.bodyType?.length) count += filters.bodyType.length;
    if (filters.year) count++;
    return count;
  }, [filters]);

  const handleQuickFilterPress = (category: string, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      if (category === 'price') {
        newFilters.priceRange = newFilters.priceRange === value ? undefined : value;
      } else if (category === 'fuel') {
        const currentFuel = newFilters.fuelType || [];
        if (currentFuel.includes(value)) {
          newFilters.fuelType = currentFuel.filter(f => f !== value);
        } else {
          newFilters.fuelType = [...currentFuel, value];
        }
      } else if (category === 'transmission') {
        newFilters.transmission = newFilters.transmission === value ? undefined : value;
      } else if (category === 'body') {
        const currentBody = newFilters.bodyType || [];
        if (currentBody.includes(value)) {
          newFilters.bodyType = currentBody.filter(b => b !== value);
        } else {
          newFilters.bodyType = [...currentBody, value];
        }
      }
      
      return newFilters;
    });
  };

  const handleAdvancedFilterPress = (category: string, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      
      if (category === 'priceRange') {
        newFilters.priceRange = newFilters.priceRange === value ? undefined : value;
      } else if (category === 'fuelType') {
        const currentFuel = newFilters.fuelType || [];
        if (currentFuel.includes(value)) {
          newFilters.fuelType = currentFuel.filter(f => f !== value);
        } else {
          newFilters.fuelType = [...currentFuel, value];
        }
      } else if (category === 'transmission') {
        newFilters.transmission = newFilters.transmission === value ? undefined : value;
      } else if (category === 'brand') {
        const currentBrand = newFilters.brand || [];
        if (currentBrand.includes(value)) {
          newFilters.brand = currentBrand.filter(b => b !== value);
        } else {
          newFilters.brand = [...currentBrand, value];
        }
      } else if (category === 'bodyType') {
        const currentBody = newFilters.bodyType || [];
        if (currentBody.includes(value)) {
          newFilters.bodyType = currentBody.filter(b => b !== value);
        } else {
          newFilters.bodyType = [...currentBody, value];
        }
      }
      
      return newFilters;
    });
  };

  const handleClearAllFilters = () => {
    setFilters({});
    onClearFilters();
  };

  const handleSearch = () => {
    onSearch(searchQuery, filters);
    setShowHistory(false);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
    filtersHeight.value = withSpring(showFilters ? 0 : 1);
  };

  const handleSearchFocus = () => {
    setSearchFocused(true);
    setShowHistory(true);
    historyOpacity.value = withTiming(1);
  };

  const handleSearchBlur = () => {
    setSearchFocused(false);
    // Delay hiding history to allow for interaction
    setTimeout(() => {
      setShowHistory(false);
      historyOpacity.value = withTiming(0);
    }, 200);
  };

  const filtersAnimatedStyle = useAnimatedStyle(() => ({
    maxHeight: filtersHeight.value * 400,
    opacity: filtersHeight.value,
  }));

  const historyAnimatedStyle = useAnimatedStyle(() => ({
    opacity: historyOpacity.value,
  }));

  const getQuickFilterActive = (category: string, value: string) => {
    if (category === 'price') return filters.priceRange === value;
    if (category === 'fuel') return filters.fuelType?.includes(value) || false;
    if (category === 'transmission') return filters.transmission === value;
    if (category === 'body') return filters.bodyType?.includes(value) || false;
    return false;
  };

  const getAdvancedFilterActive = (category: string, value: string) => {
    if (category === 'priceRange') return filters.priceRange === value;
    if (category === 'fuelType') return filters.fuelType?.includes(value) || false;
    if (category === 'transmission') return filters.transmission === value;
    if (category === 'brand') return filters.brand?.includes(value) || false;
    if (category === 'bodyType') return filters.bodyType?.includes(value) || false;
    return false;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <View style={[styles.container, style]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <ModernSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={handleSearch}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          placeholder="Search cars, brands, models..."
        />
        
        {/* Filter Toggle Button */}
        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFilterCount > 0 && styles.filterButtonActive,
          ]}
          onPress={toggleFilters}
        >
          <SlidersHorizontal 
            size={20} 
            color={activeFilterCount > 0 ? Colors.light.textInverse : Colors.light.text} 
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Quick Filters */}
      <QuickFilters
        filters={quickFilterOptions.map(filter => ({
          ...filter,
          active: getQuickFilterActive(filter.category, filter.value),
        }))}
        onFilterPress={handleQuickFilterPress}
        onClearAll={activeFilterCount > 0 ? handleClearAllFilters : undefined}
        style={styles.quickFilters}
      />

      {/* Advanced Filters */}
      <Animated.View style={[styles.advancedFilters, filtersAnimatedStyle]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {advancedFilters.map(category => (
            <View key={category.id} style={styles.filterCategory}>
              <Text style={styles.filterCategoryTitle}>{category.label}</Text>
              <View style={styles.filterOptions}>
                {category.options.map(option => (
                  <AnimatedBadge
                    key={option.value}
                    active={getAdvancedFilterActive(category.id, option.value)}
                    variant="outline"
                    size="medium"
                    onPress={() => handleAdvancedFilterPress(category.id, option.value)}
                    style={styles.filterOption}
                  >
                    {option.label}
                  </AnimatedBadge>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Search History */}
      {showHistory && (
        <Animated.View style={[styles.historyContainer, historyAnimatedStyle]}>
          <SearchHistoryManager
            visible={showHistory}
            onSearch={(query, historyFilters) => {
              setSearchQuery(query);
              if (historyFilters) {
                setFilters(historyFilters);
              }
              onSearch(query, historyFilters || filters);
            }}
            onSaveSearch={(savedSearch) => {
              console.log('Search saved:', savedSearch);
            }}
            onClose={() => setShowHistory(false)}
            currentQuery={searchQuery}
            currentFilters={filters}
          />
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchBar: {
    flex: 1,
  },
  filterButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.light.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    ...Typography.xs,
    color: Colors.light.textInverse,
    fontWeight: '600',
  },
  quickFilters: {
    backgroundColor: Colors.light.surfaceSecondary,
  },
  advancedFilters: {
    backgroundColor: Colors.light.surface,
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
    overflow: 'hidden',
  },
  filterCategory: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  filterCategoryTitle: {
    ...Typography.subtitle,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  filterOption: {
    marginBottom: Spacing.xs,
  },
  historyContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});
