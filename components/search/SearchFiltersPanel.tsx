import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { SlidersHorizontal, X } from 'lucide-react-native';
import { useDesignSystem } from '@/hooks/useDesignSystem';

export interface SearchFilters {
  priceRange: [number, number];
  yearRange: [number, number];
  mileageMax: number;
  fuelType: string[];
  transmission: string[];
  bodyType: string[];
  brand: string[];
  features: string[];
}

interface SearchFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export function SearchFiltersPanel({
  filters,
  onFiltersChange,
  showFilters,
  onToggleFilters,
}: SearchFiltersProps) {
  const { colors, spacing, typography, borderRadius } = useDesignSystem();
  
  const animatedHeight = useSharedValue(showFilters ? 1 : 0);
  
  const animatedStyle = useAnimatedStyle(() => ({
    height: withSpring(animatedHeight.value * 400),
    opacity: withSpring(animatedHeight.value),
  }));

  React.useEffect(() => {
    animatedHeight.value = showFilters ? 1 : 0;
  }, [showFilters, animatedHeight]);

  const fuelTypes = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'LPG'];
  const transmissionTypes = ['Manual', 'Automatic', 'CVT'];
  const bodyTypes = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Wagon'];

  const toggleArrayFilter = (
    array: string[],
    value: string,
    key: keyof SearchFilters
  ) => {
    const newArray = array.includes(value)
      ? array.filter(item => item !== value)
      : [...array, value];
    
    onFiltersChange({
      ...filters,
      [key]: newArray,
    });
  };

  const FilterChip = ({ 
    label, 
    selected, 
    onPress 
  }: { 
    label: string; 
    selected: boolean; 
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        {
          backgroundColor: selected ? colors.primary : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.filterChipText,
          {
            color: selected ? colors.background : colors.text,
          }
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.filterToggle,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: borderRadius.lg,
          }
        ]}
        onPress={onToggleFilters}
        activeOpacity={0.7}
      >
        <SlidersHorizontal size={20} color={colors.text} />
        <Text style={[styles.filterToggleText, { color: colors.text }]}>
          Filters
        </Text>
        {showFilters && <X size={16} color={colors.textSecondary} />}
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.filtersContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: borderRadius.lg,
          },
          animatedStyle,
        ]}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
              Price Range
            </Text>
            <View style={styles.priceRange}>
              <Text style={[styles.rangeText, { color: colors.textSecondary }]}>
                €{filters.priceRange[0].toLocaleString()} - €{filters.priceRange[1].toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
              Fuel Type
            </Text>
            <View style={styles.chipContainer}>
              {fuelTypes.map((fuel) => (
                <FilterChip
                  key={fuel}
                  label={fuel}
                  selected={filters.fuelType.includes(fuel)}
                  onPress={() => toggleArrayFilter(filters.fuelType, fuel, 'fuelType')}
                />
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
              Transmission
            </Text>
            <View style={styles.chipContainer}>
              {transmissionTypes.map((transmission) => (
                <FilterChip
                  key={transmission}
                  label={transmission}
                  selected={filters.transmission.includes(transmission)}
                  onPress={() => toggleArrayFilter(filters.transmission, transmission, 'transmission')}
                />
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
              Body Type
            </Text>
            <View style={styles.chipContainer}>
              {bodyTypes.map((body) => (
                <FilterChip
                  key={body}
                  label={body}
                  selected={filters.bodyType.includes(body)}
                  onPress={() => toggleArrayFilter(filters.bodyType, body, 'bodyType')}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  filterToggleText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  filtersContainer: {
    borderWidth: 1,
    padding: 16,
    overflow: 'hidden',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  priceRange: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
  },
  rangeText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
