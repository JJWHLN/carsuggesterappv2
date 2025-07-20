import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  TextInput,
} from 'react-native';
import { useThemeColors } from '@/hooks/useTheme';
import { 
  Filter, 
  X, 
  ChevronRight, 
  Star, 
  DollarSign, 
  Calendar,
  Fuel,
  Gauge,
  MapPin,
  TrendingUp,
  Clock,
  Sparkles,
  Shield,
  Award,
  Leaf
} from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');

interface FilterOption {
  id: string;
  label: string;
  value: any;
  count?: number;
  popular?: boolean;
  suggested?: boolean;
}

interface FilterCategory {
  id: string;
  title: string;
  type: 'range' | 'select' | 'multiselect' | 'boolean' | 'slider';
  icon: React.ReactNode;
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  predictive?: boolean;
}

interface SmartFilterSystemProps {
  onFiltersChange: (filters: Record<string, any>) => void;
  onFilterPresetSelect: (preset: string) => void;
  enablePredictive?: boolean;
  enablePresets?: boolean;
  showFilterHistory?: boolean;
}

export const SmartFilterSystem: React.FC<SmartFilterSystemProps> = ({
  onFiltersChange,
  onFilterPresetSelect,
  enablePredictive = true,
  enablePresets = true,
  showFilterHistory = true,
}) => {
  const { colors } = useThemeColors();
  const styles = getThemedStyles(colors);

  // State
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<FilterOption[]>([]);
  const [filterHistory, setFilterHistory] = useState<string[]>([]);
  const [showPresets, setShowPresets] = useState(false);

  // Animation values
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const suggestionAnimation = useRef(new Animated.Value(0)).current;

  // Filter categories
  const filterCategories: FilterCategory[] = [
    {
      id: 'price',
      title: 'Price Range',
      type: 'range',
      icon: <DollarSign size={20} color={colors.primary} />,
      min: 0,
      max: 100000,
      step: 1000,
      unit: '€',
      predictive: true,
    },
    {
      id: 'year',
      title: 'Year',
      type: 'range',
      icon: <Calendar size={20} color={colors.primary} />,
      min: 2015,
      max: 2024,
      step: 1,
      predictive: true,
    },
    {
      id: 'mileage',
      title: 'Mileage',
      type: 'range',
      icon: <Gauge size={20} color={colors.primary} />,
      min: 0,
      max: 200000,
      step: 5000,
      unit: 'km',
      predictive: true,
    },
    {
      id: 'brand',
      title: 'Brand',
      type: 'multiselect',
      icon: <Star size={20} color={colors.primary} />,
      options: [
        { id: 'bmw', label: 'BMW', value: 'bmw', count: 156, popular: true },
        { id: 'mercedes', label: 'Mercedes-Benz', value: 'mercedes', count: 142, popular: true },
        { id: 'audi', label: 'Audi', value: 'audi', count: 128, popular: true },
        { id: 'toyota', label: 'Toyota', value: 'toyota', count: 186 },
        { id: 'honda', label: 'Honda', value: 'honda', count: 94 },
        { id: 'volkswagen', label: 'Volkswagen', value: 'volkswagen', count: 112 },
      ],
      predictive: true,
    },
    {
      id: 'fuel',
      title: 'Fuel Type',
      type: 'multiselect',
      icon: <Fuel size={20} color={colors.primary} />,
      options: [
        { id: 'petrol', label: 'Petrol', value: 'petrol', count: 245 },
        { id: 'diesel', label: 'Diesel', value: 'diesel', count: 189 },
        { id: 'electric', label: 'Electric', value: 'electric', count: 67, suggested: true },
        { id: 'hybrid', label: 'Hybrid', value: 'hybrid', count: 89, suggested: true },
      ],
      predictive: true,
    },
    {
      id: 'location',
      title: 'Location',
      type: 'select',
      icon: <MapPin size={20} color={colors.primary} />,
      options: [
        { id: 'dublin', label: 'Dublin', value: 'dublin', count: 156 },
        { id: 'cork', label: 'Cork', value: 'cork', count: 89 },
        { id: 'galway', label: 'Galway', value: 'galway', count: 67 },
        { id: 'limerick', label: 'Limerick', value: 'limerick', count: 45 },
      ],
    },
  ];

  // Filter presets
  const filterPresets = [
    {
      id: 'first-car',
      title: 'First Car',
      description: 'Affordable, reliable cars',
      icon: <Star size={16} color={colors.primary} />,
      filters: {
        price: { min: 0, max: 15000 },
        year: { min: 2018, max: 2024 },
        fuel: ['petrol'],
      }
    },
    {
      id: 'family',
      title: 'Family Car',
      description: 'Spacious and safe',
      icon: <Shield size={16} color={colors.primary} />,
      filters: {
        price: { min: 20000, max: 45000 },
        fuel: ['petrol', 'hybrid'],
      }
    },
    {
      id: 'luxury',
      title: 'Luxury',
      description: 'Premium vehicles',
      icon: <Award size={16} color={colors.primary} />,
      filters: {
        price: { min: 40000, max: 100000 },
        brand: ['bmw', 'mercedes', 'audi'],
      }
    },
    {
      id: 'eco-friendly',
      title: 'Eco-Friendly',
      description: 'Electric and hybrid',
      icon: <Leaf size={16} color={colors.success} />,
      filters: {
        fuel: ['electric', 'hybrid'],
      }
    },
  ];

  // Generate predictive suggestions
  const generateSuggestions = useCallback(async (): Promise<FilterOption[]> => {
    if (!enablePredictive) return [];

    const suggestions: FilterOption[] = [];

    // Based on current filters, suggest related options
    if (activeFilters.brand?.includes('bmw')) {
      suggestions.push({
        id: 'luxury-price',
        label: 'Premium price range (€40k-€80k)',
        value: { price: { min: 40000, max: 80000 } },
        suggested: true,
      });
    }

    if (activeFilters.fuel?.includes('electric')) {
      suggestions.push({
        id: 'recent-year',
        label: 'Recent models (2022-2024)',
        value: { year: { min: 2022, max: 2024 } },
        suggested: true,
      });
    }

    if (activeFilters.price?.min && activeFilters.price.min < 20000) {
      suggestions.push({
        id: 'reliable-brands',
        label: 'Reliable brands (Toyota, Honda)',
        value: { brand: ['toyota', 'honda'] },
        suggested: true,
      });
    }

    // Popular combinations
    if (Object.keys(activeFilters).length === 0) {
      suggestions.push(
        {
          id: 'popular-budget',
          label: 'Most searched: Under €25k',
          value: { price: { min: 0, max: 25000 } },
          popular: true,
        },
        {
          id: 'popular-eco',
          label: 'Trending: Electric & Hybrid',
          value: { fuel: ['electric', 'hybrid'] },
          popular: true,
        }
      );
    }

    return suggestions;
  }, [activeFilters, enablePredictive]);

  // Update suggestions when filters change
  useEffect(() => {
    const updateSuggestions = async () => {
      const newSuggestions = await generateSuggestions();
      setSuggestions(newSuggestions);
    };
    updateSuggestions();
  }, [activeFilters, generateSuggestions]);

  // Animation effects
  useEffect(() => {
    Animated.timing(suggestionAnimation, {
      toValue: suggestions.length > 0 ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [suggestions.length, suggestionAnimation]);

  // Handlers
  const handleFilterChange = useCallback((categoryId: string, value: any) => {
    const updatedFilters = { ...activeFilters, [categoryId]: value };
    setActiveFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  }, [activeFilters, onFiltersChange]);

  const handleFilterRemove = useCallback((categoryId: string) => {
    const { [categoryId]: removed, ...remainingFilters } = activeFilters;
    setActiveFilters(remainingFilters);
    onFiltersChange(remainingFilters);
  }, [activeFilters, onFiltersChange]);

  const handleSuggestionApply = useCallback((suggestion: FilterOption) => {
    const updatedFilters = { ...activeFilters, ...suggestion.value };
    setActiveFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  }, [activeFilters, onFiltersChange]);

  const handlePresetSelect = useCallback((preset: any) => {
    setActiveFilters(preset.filters);
    onFiltersChange(preset.filters);
    onFilterPresetSelect(preset.id);
    setShowPresets(false);
  }, [onFiltersChange, onFilterPresetSelect]);

  const clearAllFilters = useCallback(() => {
    setActiveFilters({});
    onFiltersChange({});
  }, [onFiltersChange]);

  const renderActiveFilters = () => {
    const activeFilterKeys = Object.keys(activeFilters);
    if (activeFilterKeys.length === 0) return null;

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.activeFiltersContainer}
        contentContainerStyle={styles.activeFiltersContent}
      >
        {activeFilterKeys.map(key => {
          const category = filterCategories.find(c => c.id === key);
          if (!category) return null;

          const value = activeFilters[key];
          let displayText = '';

          if (category.type === 'range' && value.min !== undefined && value.max !== undefined) {
            displayText = `${value.min}${category.unit || ''} - ${value.max}${category.unit || ''}`;
          } else if (Array.isArray(value)) {
            displayText = value.join(', ');
          } else {
            displayText = String(value);
          }

          return (
            <View key={key} style={styles.activeFilterChip}>
              {category.icon}
              <Text style={styles.activeFilterText}>
                {category.title}: {displayText}
              </Text>
              <TouchableOpacity
                onPress={() => handleFilterRemove(key)}
                style={styles.removeFilterButton}
                activeOpacity={0.7}
              >
                <X size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          );
        })}
        
        <TouchableOpacity
          style={styles.clearAllButton}
          onPress={clearAllFilters}
          activeOpacity={0.7}
        >
          <Text style={styles.clearAllText}>Clear All</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  const renderSuggestions = () => {
    if (suggestions.length === 0) return null;

    return (
      <Animated.View 
        style={[
          styles.suggestionsContainer,
          { opacity: suggestionAnimation }
        ]}
      >
        <View style={styles.suggestionsHeader}>
          <Sparkles size={16} color={colors.primary} />
          <Text style={styles.suggestionsTitle}>Smart Suggestions</Text>
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsContent}
        >
          {suggestions.map(suggestion => (
            <TouchableOpacity
              key={suggestion.id}
              style={[
                styles.suggestionChip,
                suggestion.popular && styles.popularSuggestion,
                suggestion.suggested && styles.smartSuggestion,
              ]}
              onPress={() => handleSuggestionApply(suggestion)}
              activeOpacity={0.7}
            >
              {suggestion.popular && (
                <TrendingUp size={12} color={colors.primary} />
              )}
              {suggestion.suggested && (
                <Sparkles size={12} color={colors.success} />
              )}
              <Text style={[
                styles.suggestionText,
                suggestion.popular && styles.popularSuggestionText,
                suggestion.suggested && styles.smartSuggestionText,
              ]}>
                {suggestion.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>
    );
  };

  const renderFilterPresets = () => {
    if (!enablePresets || !showPresets) return null;

    return (
      <View style={styles.presetsContainer}>
        <Text style={styles.presetsTitle}>Quick Filters</Text>
        <View style={styles.presetsGrid}>
          {filterPresets.map(preset => (
            <TouchableOpacity
              key={preset.id}
              style={styles.presetCard}
              onPress={() => handlePresetSelect(preset)}
              activeOpacity={0.7}
            >
              <View style={styles.presetIcon}>
                {preset.icon}
              </View>
              <Text style={styles.presetTitle}>{preset.title}</Text>
              <Text style={styles.presetDescription}>{preset.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Filter size={20} color={colors.primary} />
          <Text style={styles.headerTitle}>Smart Filters</Text>
        </View>
        
        {enablePresets && (
          <TouchableOpacity
            style={styles.presetsButton}
            onPress={() => setShowPresets(!showPresets)}
            activeOpacity={0.7}
          >
            <Text style={styles.presetsButtonText}>Quick Filters</Text>
            <ChevronRight size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Active Filters */}
      {renderActiveFilters()}

      {/* Suggestions */}
      {renderSuggestions()}

      {/* Filter Presets */}
      {renderFilterPresets()}

      {/* Filter Categories */}
      <ScrollView style={styles.categoriesContainer}>
        {filterCategories.map(category => (
          <FilterCategoryComponent
            key={category.id}
            category={category}
            value={activeFilters[category.id]}
            onValueChange={(value) => handleFilterChange(category.id, value)}
            colors={colors}
            styles={styles}
          />
        ))}
      </ScrollView>
    </View>
  );
};

// Filter Category Component
const FilterCategoryComponent: React.FC<{
  category: FilterCategory;
  value: any;
  onValueChange: (value: any) => void;
  colors: any;
  styles: any;
}> = ({ category, value, onValueChange, colors, styles }) => {
  const [expanded, setExpanded] = useState(false);

  const renderRangeFilter = () => {
    const minValue = value?.min || category.min || 0;
    const maxValue = value?.max || category.max || 100;

    return (
      <View style={styles.rangeContainer}>
        <View style={styles.rangeInputs}>
          <TextInput
            style={styles.rangeInput}
            value={String(minValue)}
            onChangeText={(text) => {
              const numValue = parseInt(text) || category.min || 0;
              onValueChange({ min: numValue, max: maxValue });
            }}
            placeholder={`Min ${category.unit || ''}`}
            keyboardType="numeric"
          />
          <Text style={styles.rangeSeparator}>-</Text>
          <TextInput
            style={styles.rangeInput}
            value={String(maxValue)}
            onChangeText={(text) => {
              const numValue = parseInt(text) || category.max || 100;
              onValueChange({ min: minValue, max: numValue });
            }}
            placeholder={`Max ${category.unit || ''}`}
            keyboardType="numeric"
          />
        </View>
      </View>
    );
  };

  const renderMultiSelectFilter = () => {
    const selectedValues = value || [];
    
    return (
      <View style={styles.optionsContainer}>
        {category.options?.map(option => {
          const isSelected = selectedValues.includes(option.value);
          
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionChip,
                isSelected && styles.selectedOption,
                option.popular && styles.popularOption,
              ]}
              onPress={() => {
                const newValues = isSelected
                  ? selectedValues.filter((v: any) => v !== option.value)
                  : [...selectedValues, option.value];
                onValueChange(newValues);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.optionText,
                isSelected && styles.selectedOptionText,
              ]}>
                {option.label}
              </Text>
              {option.count && (
                <Text style={styles.optionCount}>({option.count})</Text>
              )}
              {option.popular && (
                <View style={styles.popularBadge}>
                  <TrendingUp size={10} color={colors.primary} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.categoryContainer}>
      <TouchableOpacity
        style={styles.categoryHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        {category.icon}
        <Text style={styles.categoryTitle}>{category.title}</Text>
        {category.predictive && (
          <View style={styles.predictiveBadge}>
            <Sparkles size={12} color={colors.primary} />
          </View>
        )}
        <Animated.View
          style={{
            transform: [{ rotate: expanded ? '90deg' : '0deg' }]
          }}
        >
          <ChevronRight size={16} color={colors.textSecondary} />
        </Animated.View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.categoryContent}>
          {category.type === 'range' && renderRangeFilter()}
          {category.type === 'multiselect' && renderMultiSelectFilter()}
        </View>
      )}
    </View>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  presetsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  presetsButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  activeFiltersContainer: {
    maxHeight: 50,
  },
  activeFiltersContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  activeFilterText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  removeFilterButton: {
    padding: 2,
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.error,
    borderRadius: 16,
  },
  clearAllText: {
    fontSize: 12,
    color: colors.background,
    fontWeight: '500',
  },
  suggestionsContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 6,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  suggestionsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 4,
  },
  popularSuggestion: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  smartSuggestion: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.success,
  },
  suggestionText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  popularSuggestionText: {
    color: colors.primary,
  },
  smartSuggestionText: {
    color: colors.success,
  },
  presetsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  presetsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  presetCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    width: (width - 48) / 2,
    alignItems: 'center',
  },
  presetIcon: {
    marginBottom: 6,
  },
  presetTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  presetDescription: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  categoriesContainer: {
    flex: 1,
  },
  categoryContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    flex: 1,
  },
  predictiveBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
    padding: 2,
  },
  categoryContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  rangeContainer: {
    gap: 12,
  },
  rangeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rangeInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rangeSeparator: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
    position: 'relative',
  },
  selectedOption: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  popularOption: {
    borderColor: colors.primary,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    color: colors.text,
  },
  selectedOptionText: {
    color: colors.background,
    fontWeight: '500',
  },
  optionCount: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  popularBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.primaryLight,
    borderRadius: 6,
    padding: 1,
  },
});

export default SmartFilterSystem;
