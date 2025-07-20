import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { 
  Search, Filter, SlidersHorizontal, X, Check, 
  Car, DollarSign, Gauge, MapPin, Calendar,
  Fuel, Settings, Award, TrendingUp, Sparkles,
  ChevronRight, ChevronLeft, Grid, List
} from '@/utils/ultra-optimized-icons';
import { SearchBar } from '@/components/ui/SearchBar';
import { Button } from '@/components/ui/Button';
import { useThemeColors } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography, Shadows } from '@/constants/Colors';

const { width, height } = Dimensions.get('window');

interface FilterOption {
  id: string;
  label: string;
  value: any;
  icon?: React.ComponentType<{ size: number; color: string }>;
  count?: number;
  premium?: boolean;
}

interface FilterCategory {
  id: string;
  title: string;
  icon: React.ComponentType<{ size: number; color: string }>;
  type: 'single' | 'multiple' | 'range' | 'toggle';
  options?: FilterOption[];
  min?: number;
  max?: number;
  unit?: string;
  premium?: boolean;
}

interface AdvancedSearchFilters {
  searchTerm: string;
  make: string[];
  model: string[];
  yearRange: [number, number];
  priceRange: [number, number];
  mileageRange: [number, number];
  fuelType: string[];
  transmission: string[];
  bodyType: string[];
  condition: string[];
  features: string[];
  location: string;
  radius: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list';
  showFeatured: boolean;
  showDeals: boolean;
  showCertified: boolean;
  excludeSold: boolean;
}

interface AdvancedSearchSystemProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: AdvancedSearchFilters) => void;
  onResetFilters: () => void;
  initialFilters?: Partial<AdvancedSearchFilters>;
  resultsCount?: number;
}

const FILTER_CATEGORIES: FilterCategory[] = [
  {
    id: 'make',
    title: 'Make & Model',
    icon: Car,
    type: 'multiple',
    options: [
      { id: 'toyota', label: 'Toyota', value: 'toyota', count: 1247 },
      { id: 'honda', label: 'Honda', value: 'honda', count: 987 },
      { id: 'ford', label: 'Ford', value: 'ford', count: 834 },
      { id: 'chevrolet', label: 'Chevrolet', value: 'chevrolet', count: 723 },
      { id: 'nissan', label: 'Nissan', value: 'nissan', count: 656 },
      { id: 'bmw', label: 'BMW', value: 'bmw', count: 445, premium: true },
      { id: 'mercedes', label: 'Mercedes-Benz', value: 'mercedes', count: 387, premium: true },
      { id: 'audi', label: 'Audi', value: 'audi', count: 321, premium: true },
      { id: 'lexus', label: 'Lexus', value: 'lexus', count: 289, premium: true },
      { id: 'tesla', label: 'Tesla', value: 'tesla', count: 234, premium: true },
    ],
  },
  {
    id: 'price',
    title: 'Price Range',
    icon: DollarSign,
    type: 'range',
    min: 0,
    max: 200000,
    unit: '$',
  },
  {
    id: 'year',
    title: 'Year Range',
    icon: Calendar,
    type: 'range',
    min: 1990,
    max: 2025,
  },
  {
    id: 'mileage',
    title: 'Mileage',
    icon: Gauge,
    type: 'range',
    min: 0,
    max: 300000,
    unit: 'mi',
  },
  {
    id: 'fuelType',
    title: 'Fuel Type',
    icon: Fuel,
    type: 'multiple',
    options: [
      { id: 'gasoline', label: 'Gasoline', value: 'gasoline', count: 8934 },
      { id: 'hybrid', label: 'Hybrid', value: 'hybrid', count: 1247, icon: Sparkles },
      { id: 'electric', label: 'Electric', value: 'electric', count: 789, icon: Sparkles, premium: true },
      { id: 'diesel', label: 'Diesel', value: 'diesel', count: 456 },
      { id: 'plugin-hybrid', label: 'Plug-in Hybrid', value: 'plugin-hybrid', count: 234, premium: true },
    ],
  },
  {
    id: 'transmission',
    title: 'Transmission',
    icon: Settings,
    type: 'multiple',
    options: [
      { id: 'automatic', label: 'Automatic', value: 'automatic', count: 7823 },
      { id: 'manual', label: 'Manual', value: 'manual', count: 1456 },
      { id: 'cvt', label: 'CVT', value: 'cvt', count: 2134 },
    ],
  },
  {
    id: 'bodyType',
    title: 'Body Type',
    icon: Car,
    type: 'multiple',
    options: [
      { id: 'sedan', label: 'Sedan', value: 'sedan', count: 3456 },
      { id: 'suv', label: 'SUV', value: 'suv', count: 4234 },
      { id: 'hatchback', label: 'Hatchback', value: 'hatchback', count: 1567 },
      { id: 'coupe', label: 'Coupe', value: 'coupe', count: 987 },
      { id: 'convertible', label: 'Convertible', value: 'convertible', count: 234, premium: true },
      { id: 'truck', label: 'Truck', value: 'truck', count: 1876 },
      { id: 'wagon', label: 'Wagon', value: 'wagon', count: 345 },
    ],
  },
  {
    id: 'condition',
    title: 'Condition',
    icon: Award,
    type: 'multiple',
    options: [
      { id: 'new', label: 'New', value: 'new', count: 2345, icon: Sparkles },
      { id: 'used', label: 'Used', value: 'used', count: 8765 },
      { id: 'certified', label: 'Certified Pre-Owned', value: 'certified', count: 1234, premium: true },
    ],
  },
];

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Best Match', icon: TrendingUp },
  { id: 'price_low', label: 'Price: Low to High', icon: DollarSign },
  { id: 'price_high', label: 'Price: High to Low', icon: DollarSign },
  { id: 'year_new', label: 'Year: Newest First', icon: Calendar },
  { id: 'year_old', label: 'Year: Oldest First', icon: Calendar },
  { id: 'mileage_low', label: 'Mileage: Low to High', icon: Gauge },
  { id: 'distance', label: 'Distance', icon: MapPin },
];

export const AdvancedSearchSystem = memo<AdvancedSearchSystemProps>(({
  visible,
  onClose,
  onApplyFilters,
  onResetFilters,
  initialFilters,
  resultsCount = 0,
}) => {
  const { colors } = useThemeColors();
  const styles = getThemedStyles(colors);

  // Animation values
  const modalScale = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  // Filter state
  const [filters, setFilters] = useState<AdvancedSearchFilters>({
    searchTerm: '',
    make: [],
    model: [],
    yearRange: [2015, 2025],
    priceRange: [0, 100000],
    mileageRange: [0, 100000],
    fuelType: [],
    transmission: [],
    bodyType: [],
    condition: [],
    features: [],
    location: '',
    radius: 50,
    sortBy: 'relevance',
    sortOrder: 'desc',
    viewMode: 'grid',
    showFeatured: false,
    showDeals: false,
    showCertified: false,
    excludeSold: true,
    ...initialFilters,
  });

  const [activeCategory, setActiveCategory] = useState<string>('make');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Animation effects
  React.useEffect(() => {
    if (visible) {
      modalScale.value = withSpring(1, { stiffness: 300 });
      backdropOpacity.value = withTiming(1, { duration: 200 });
    } else {
      modalScale.value = withTiming(0, { duration: 200 });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ scale: modalScale.value }],
  }));

  // Filter management
  const updateFilter = useCallback((key: keyof AdvancedSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const toggleMultipleFilter = useCallback((category: string, value: string) => {
    setFilters(prev => {
      const currentValues = prev[category as keyof AdvancedSearchFilters] as string[];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      return { ...prev, [category]: newValues };
    });
  }, []);

  const handleApply = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApplyFilters(filters);
    onClose();
  }, [filters, onApplyFilters, onClose]);

  const handleReset = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilters({
      searchTerm: '',
      make: [],
      model: [],
      yearRange: [2015, 2025],
      priceRange: [0, 100000],
      mileageRange: [0, 100000],
      fuelType: [],
      transmission: [],
      bodyType: [],
      condition: [],
      features: [],
      location: '',
      radius: 50,
      sortBy: 'relevance',
      sortOrder: 'desc',
      viewMode: 'grid',
      showFeatured: false,
      showDeals: false,
      showCertified: false,
      excludeSold: true,
    });
    onResetFilters();
  }, [onResetFilters]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.make.length > 0) count++;
    if (filters.fuelType.length > 0) count++;
    if (filters.transmission.length > 0) count++;
    if (filters.bodyType.length > 0) count++;
    if (filters.condition.length > 0) count++;
    if (filters.showFeatured) count++;
    if (filters.showDeals) count++;
    if (filters.showCertified) count++;
    return count;
  }, [filters]);

  const renderFilterCategory = (category: FilterCategory) => {
    const Icon = category.icon;
    const isActive = activeCategory === category.id;

    return (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.categoryButton,
          isActive && styles.categoryButtonActive,
          { backgroundColor: isActive ? colors.primary : colors.cardBackground }
        ]}
        onPress={() => setActiveCategory(category.id)}
      >
        <Icon 
          size={20} 
          color={isActive ? colors.white : colors.textSecondary} 
        />
        <Text style={[
          styles.categoryButtonText,
          { color: isActive ? colors.white : colors.text }
        ]}>
          {category.title}
        </Text>
        {category.premium && (
          <View style={styles.premiumBadge}>
            <Sparkles size={12} color={colors.white} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderFilterOptions = () => {
    const category = FILTER_CATEGORIES.find(c => c.id === activeCategory);
    if (!category) return null;

    if (category.type === 'multiple' && category.options) {
      return (
        <ScrollView style={styles.optionsContainer}>
          {category.options.map((option) => {
            const isSelected = (filters[category.id as keyof AdvancedSearchFilters] as string[])
              ?.includes(option.value);
            const OptionIcon = option.icon;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  isSelected && styles.optionButtonSelected,
                  { 
                    backgroundColor: isSelected ? colors.primary + '20' : colors.cardBackground,
                    borderColor: isSelected ? colors.primary : colors.border 
                  }
                ]}
                onPress={() => toggleMultipleFilter(category.id, option.value)}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionLeft}>
                    {OptionIcon && <OptionIcon size={18} color={colors.textSecondary} />}
                    <Text style={[styles.optionLabel, { color: colors.text }]}>
                      {option.label}
                    </Text>
                    {option.premium && (
                      <View style={styles.optionPremiumBadge}>
                        <Sparkles size={10} color={colors.primary} />
                      </View>
                    )}
                  </View>
                  <View style={styles.optionRight}>
                    {option.count && (
                      <Text style={[styles.optionCount, { color: colors.textSecondary }]}>
                        {option.count.toLocaleString()}
                      </Text>
                    )}
                    {isSelected && (
                      <View style={[styles.checkIcon, { backgroundColor: colors.primary }]}>
                        <Check size={12} color={colors.white} />
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      );
    }

    // Range filters would be implemented here
    return (
      <View style={styles.rangeContainer}>
        <Text style={[styles.rangeLabel, { color: colors.text }]}>
          Range filters coming soon...
        </Text>
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <TouchableOpacity 
          style={styles.backdropTouchable}
          onPress={onClose}
          activeOpacity={1}
        />
        
        <Animated.View style={[styles.modal, modalStyle]}>
          <BlurView intensity={100} style={styles.blurBackground}>
            <LinearGradient
              colors={[colors.white + 'F0', colors.white + 'F8']}
              style={styles.gradientBackground}
            />
          </BlurView>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Filter size={24} color={colors.text} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Advanced Search
              </Text>
              {activeFiltersCount > 0 && (
                <View style={[styles.filtersBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.filtersBadgeText}>
                    {activeFiltersCount}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchSection}>
            <SearchBar
              value={filters.searchTerm}
              onChangeText={(text) => updateFilter('searchTerm', text)}
              placeholder="Search by make, model, features..."
              showAIIcon={true}
              containerStyle={styles.searchBar}
            />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Categories */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
              contentContainerStyle={styles.categoriesContent}
            >
              {FILTER_CATEGORIES.map(renderFilterCategory)}
            </ScrollView>

            {/* Filter Options */}
            <View style={styles.filtersContent}>
              {renderFilterOptions()}
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.resultsIndicator}>
              <Text style={[styles.resultsText, { color: colors.textSecondary }]}>
                {resultsCount.toLocaleString()} cars found
              </Text>
            </View>
            
            <View style={styles.footerButtons}>
              <Button
                title="Reset"
                variant="outline"
                onPress={handleReset}
                style={styles.resetButton}
              />
              <Button
                title="Apply Filters"
                onPress={handleApply}
                style={styles.applyButton}
                icon={<Check size={18} color={colors.white} />}
              />
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
});

const getThemedStyles = (colors: any) => {
  return StyleSheet.create({
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    backdropTouchable: {
      flex: 1,
    },
    modal: {
      height: height * 0.85,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      overflow: 'hidden',
      ...Shadows.xl,
    },
    blurBackground: {
      ...StyleSheet.absoluteFillObject,
    },
    gradientBackground: {
      ...StyleSheet.absoluteFillObject,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    headerTitle: {
      ...Typography.sectionTitle,
      fontWeight: '700',
    },
    filtersBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filtersBadgeText: {
      ...Typography.caption,
      color: colors.white,
      fontWeight: '600',
      fontSize: 10,
    },
    closeButton: {
      padding: Spacing.sm,
    },
    searchSection: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    searchBar: {
      marginBottom: 0,
    },
    content: {
      flex: 1,
    },
    categoriesContainer: {
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.md,
    },
    categoriesContent: {
      gap: Spacing.sm,
    },
    categoryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: BorderRadius.full,
      gap: Spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
      position: 'relative',
    },
    categoryButtonActive: {
      borderColor: colors.primary,
    },
    categoryButtonText: {
      ...Typography.bodySmall,
      fontWeight: '600',
    },
    premiumBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filtersContent: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
    },
    optionsContainer: {
      flex: 1,
    },
    optionButton: {
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      marginBottom: Spacing.sm,
      overflow: 'hidden',
    },
    optionButtonSelected: {
      borderWidth: 2,
    },
    optionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.md,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flex: 1,
    },
    optionLabel: {
      ...Typography.bodyText,
      fontWeight: '500',
    },
    optionPremiumBadge: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.primary + '20',
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    optionCount: {
      ...Typography.caption,
      fontWeight: '500',
    },
    checkIcon: {
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rangeContainer: {
      padding: Spacing.lg,
      alignItems: 'center',
    },
    rangeLabel: {
      ...Typography.bodyText,
      fontStyle: 'italic',
    },
    footer: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    resultsIndicator: {
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    resultsText: {
      ...Typography.bodySmall,
      fontWeight: '500',
    },
    footerButtons: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    resetButton: {
      flex: 1,
    },
    applyButton: {
      flex: 2,
    },
  });
};
