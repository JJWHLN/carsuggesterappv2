/**
 * AI-Powered Advanced Search Filters
 *
 * Intelligent filtering with smart suggestions and
 * context-aware filter recommendations.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';

const { width: screenWidth } = Dimensions.get('window');

export interface FilterState {
  makes: string[];
  models: string[];
  yearRange: { min: number; max: number };
  priceRange: { min: number; max: number };
  mileageRange: { min: number; max: number };
  bodyTypes: string[];
  fuelTypes: string[];
  condition: ('new' | 'used' | 'certified')[];
  features: string[];
  location: string;
  radius: number;
  sortBy:
    | 'price_asc'
    | 'price_desc'
    | 'year_asc'
    | 'year_desc'
    | 'mileage_asc'
    | 'mileage_desc'
    | 'relevance';
}

interface SmartFiltersProps {
  visible: boolean;
  onClose: () => void;
  initialFilters: Partial<FilterState>;
  onApplyFilters: (filters: FilterState) => void;
  onResetFilters: () => void;
  userId?: string;
  currentQuery?: string;
}

const DEFAULT_FILTERS: FilterState = {
  makes: [],
  models: [],
  yearRange: { min: 2000, max: new Date().getFullYear() },
  priceRange: { min: 0, max: 100000 },
  mileageRange: { min: 0, max: 200000 },
  bodyTypes: [],
  fuelTypes: [],
  condition: [],
  features: [],
  location: '',
  radius: 50,
  sortBy: 'relevance',
};

const POPULAR_MAKES = [
  'Toyota',
  'Honda',
  'Ford',
  'Chevrolet',
  'Nissan',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Lexus',
  'Hyundai',
  'Kia',
  'Mazda',
  'Subaru',
  'Volkswagen',
];

const BODY_TYPES = [
  'Sedan',
  'SUV',
  'Hatchback',
  'Coupe',
  'Convertible',
  'Wagon',
  'Pickup Truck',
  'Minivan',
  'Crossover',
];

const FUEL_TYPES = [
  'Gasoline',
  'Hybrid',
  'Electric',
  'Diesel',
  'Plug-in Hybrid',
];

const POPULAR_FEATURES = [
  'Bluetooth',
  'Backup Camera',
  'Navigation System',
  'Leather Seats',
  'Sunroof',
  'Heated Seats',
  'Remote Start',
  'Apple CarPlay',
  'Android Auto',
  'Lane Departure Warning',
  'Blind Spot Monitor',
  'Adaptive Cruise Control',
  'Premium Audio',
  'Third Row Seating',
];

const CONDITION_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'certified', label: 'Certified Pre-Owned' },
  { value: 'used', label: 'Used' },
] as const;

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'year_desc', label: 'Year: Newest First' },
  { value: 'year_asc', label: 'Year: Oldest First' },
  { value: 'mileage_asc', label: 'Mileage: Low to High' },
  { value: 'mileage_desc', label: 'Mileage: High to Low' },
] as const;

export const SmartFilters: React.FC<SmartFiltersProps> = ({
  visible,
  onClose,
  initialFilters,
  onApplyFilters,
  onResetFilters,
  userId,
  currentQuery,
}) => {
  const { colors } = useTheme();
  const [filters, setFilters] = useState<FilterState>(() => ({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  }));

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [smartSuggestions, setSmartSuggestions] = useState<any[]>([]);

  // Animation values
  const slideAnim = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      slideAnim.value = withSpring(1, { damping: 20, stiffness: 90 });
      overlayOpacity.value = withTiming(1, { duration: 300 });
      loadSmartSuggestions();
    } else {
      slideAnim.value = withSpring(0, { damping: 20, stiffness: 90 });
      overlayOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const loadSmartSuggestions = useCallback(async () => {
    try {
      // In a real app, this would use AI to suggest filters based on:
      // - Current search query
      // - User behavior patterns
      // - Market trends
      // - Similar user preferences

      const suggestions = [
        {
          type: 'make',
          value: 'Toyota',
          reason: 'Popular in your area',
          confidence: 0.8,
        },
        {
          type: 'feature',
          value: 'Backup Camera',
          reason: 'Most searched feature',
          confidence: 0.7,
        },
        {
          type: 'price',
          value: { min: 15000, max: 35000 },
          reason: 'Based on your searches',
          confidence: 0.9,
        },
      ];

      setSmartSuggestions(suggestions);
    } catch (error) {
      console.warn('Failed to load smart suggestions:', error);
    }
  }, [currentQuery, userId]);

  const handleFilterChange = useCallback(
    (key: keyof FilterState, value: any) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const toggleArrayFilter = useCallback(
    (key: keyof FilterState, value: string) => {
      setFilters((prev) => {
        const currentArray = prev[key] as string[];
        const newArray = currentArray.includes(value)
          ? currentArray.filter((item) => item !== value)
          : [...currentArray, value];

        return {
          ...prev,
          [key]: newArray,
        };
      });
    },
    [],
  );

  const handleApplyFilters = useCallback(() => {
    onApplyFilters(filters);
    onClose();
  }, [filters, onApplyFilters, onClose]);

  const handleResetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    onResetFilters();
  }, [onResetFilters]);

  const getActiveFiltersCount = useCallback(() => {
    let count = 0;

    if (filters.makes.length > 0) count++;
    if (filters.models.length > 0) count++;
    if (filters.bodyTypes.length > 0) count++;
    if (filters.fuelTypes.length > 0) count++;
    if (filters.condition.length > 0) count++;
    if (filters.features.length > 0) count++;
    if (
      filters.priceRange.min > DEFAULT_FILTERS.priceRange.min ||
      filters.priceRange.max < DEFAULT_FILTERS.priceRange.max
    )
      count++;
    if (
      filters.yearRange.min > DEFAULT_FILTERS.yearRange.min ||
      filters.yearRange.max < DEFAULT_FILTERS.yearRange.max
    )
      count++;
    if (
      filters.mileageRange.min > DEFAULT_FILTERS.mileageRange.min ||
      filters.mileageRange.max < DEFAULT_FILTERS.mileageRange.max
    )
      count++;
    if (filters.sortBy !== 'relevance') count++;

    return count;
  }, [filters]);

  // Animated styles
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const modalStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(slideAnim.value, [0, 1], [screenWidth, 0]),
      },
    ],
  }));

  const renderFilterSection = (
    title: string,
    icon: keyof typeof Ionicons.glyphMap,
    content: React.ReactNode,
    sectionKey: string,
  ) => (
    <View style={styles.filterSection}>
      <TouchableOpacity
        style={[styles.filterHeader, { borderBottomColor: colors.border }]}
        onPress={() =>
          setActiveSection(activeSection === sectionKey ? null : sectionKey)
        }
      >
        <View style={styles.filterHeaderLeft}>
          <Ionicons name={icon} size={20} color={colors.primary} />
          <Text style={[styles.filterTitle, { color: colors.text }]}>
            {title}
          </Text>
        </View>
        <Ionicons
          name={activeSection === sectionKey ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {activeSection === sectionKey && (
        <Animated.View style={styles.filterContent}>{content}</Animated.View>
      )}
    </View>
  );

  const renderChipSelector = (
    options: string[],
    selected: string[],
    onToggle: (value: string) => void,
    maxItems: number = 20,
  ) => (
    <View style={styles.chipContainer}>
      {options.slice(0, maxItems).map((option) => (
        <AnimatedPressable
          key={option}
          style={[
            styles.chip,
            {
              backgroundColor: selected.includes(option)
                ? colors.primary
                : colors.surface,
              borderColor: selected.includes(option)
                ? colors.primary
                : colors.border,
            },
          ]}
          onPress={() => onToggle(option)}
        >
          <Text
            style={[
              styles.chipText,
              {
                color: selected.includes(option) ? 'white' : colors.text,
              },
            ]}
          >
            {option}
          </Text>
        </AnimatedPressable>
      ))}
    </View>
  );

  const renderRangeSlider = (
    title: string,
    range: { min: number; max: number },
    minValue: number,
    maxValue: number,
    step: number,
    onChangeMin: (value: number) => void,
    onChangeMax: (value: number) => void,
    formatValue?: (value: number) => string,
  ) => (
    <View style={styles.rangeSliderContainer}>
      <Text style={[styles.rangeTitle, { color: colors.text }]}>{title}</Text>
      <View style={styles.rangeLabels}>
        <Text style={[styles.rangeLabel, { color: colors.textSecondary }]}>
          {formatValue ? formatValue(range.min) : range.min.toLocaleString()}
        </Text>
        <Text style={[styles.rangeLabel, { color: colors.textSecondary }]}>
          {formatValue ? formatValue(range.max) : range.max.toLocaleString()}
        </Text>
      </View>

      {/* Simple range inputs instead of sliders */}
      <View style={styles.rangeInputsContainer}>
        <View style={styles.rangeInputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Min
          </Text>
          <TextInput
            style={[
              styles.rangeInput,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={range.min.toString()}
            onChangeText={(text) => {
              const value = parseInt(text) || minValue;
              if (value >= minValue && value <= range.max) {
                onChangeMin(value);
              }
            }}
            keyboardType="numeric"
            placeholder={minValue.toString()}
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.rangeInputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Max
          </Text>
          <TextInput
            style={[
              styles.rangeInput,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={range.max.toString()}
            onChangeText={(text) => {
              const value = parseInt(text) || maxValue;
              if (value <= maxValue && value >= range.min) {
                onChangeMax(value);
              }
            }}
            keyboardType="numeric"
            placeholder={maxValue.toString()}
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>
    </View>
  );

  const renderSmartSuggestions = () => (
    <View style={styles.smartSuggestionsContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        <Ionicons name="bulb-outline" size={18} color={colors.primary} /> Smart
        Suggestions
      </Text>
      {smartSuggestions.map((suggestion, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.suggestionItem,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={() => {
            // Apply suggestion based on type
            if (suggestion.type === 'make') {
              toggleArrayFilter('makes', suggestion.value);
            } else if (suggestion.type === 'feature') {
              toggleArrayFilter('features', suggestion.value);
            } else if (suggestion.type === 'price') {
              handleFilterChange('priceRange', suggestion.value);
            }
          }}
        >
          <View style={styles.suggestionContent}>
            <Text style={[styles.suggestionValue, { color: colors.text }]}>
              {typeof suggestion.value === 'object'
                ? `$${suggestion.value.min.toLocaleString()} - $${suggestion.value.max.toLocaleString()}`
                : suggestion.value}
            </Text>
            <Text
              style={[styles.suggestionReason, { color: colors.textSecondary }]}
            >
              {suggestion.reason}
            </Text>
          </View>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>
              {Math.round(suggestion.confidence * 100)}%
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.overlayBackground, overlayStyle]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.modal,
            { backgroundColor: colors.background },
            modalStyle,
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Filters
              </Text>
              {getActiveFiltersCount() > 0 && (
                <View
                  style={[
                    styles.filtersBadge,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.filtersBadgeText}>
                    {getActiveFiltersCount()}
                  </Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Smart Suggestions */}
            {smartSuggestions.length > 0 && renderSmartSuggestions()}

            {/* Sort By */}
            {renderFilterSection(
              'Sort By',
              'swap-vertical',
              <View>
                {SORT_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.sortOption,
                      {
                        backgroundColor:
                          filters.sortBy === option.value
                            ? colors.primary + '20'
                            : 'transparent',
                      },
                    ]}
                    onPress={() => handleFilterChange('sortBy', option.value)}
                  >
                    <Ionicons
                      name={
                        filters.sortBy === option.value
                          ? 'radio-button-on'
                          : 'radio-button-off'
                      }
                      size={20}
                      color={
                        filters.sortBy === option.value
                          ? colors.primary
                          : colors.textSecondary
                      }
                    />
                    <Text
                      style={[styles.sortOptionText, { color: colors.text }]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>,
              'sort',
            )}

            {/* Make & Model */}
            {renderFilterSection(
              'Make & Model',
              'car-outline',
              <View>
                <Text style={[styles.subSectionTitle, { color: colors.text }]}>
                  Make
                </Text>
                {renderChipSelector(POPULAR_MAKES, filters.makes, (make) =>
                  toggleArrayFilter('makes', make),
                )}
              </View>,
              'make',
            )}

            {/* Price Range */}
            {renderFilterSection(
              'Price Range',
              'cash-outline',
              renderRangeSlider(
                'Price Range',
                filters.priceRange,
                0,
                100000,
                1000,
                (min) =>
                  handleFilterChange('priceRange', {
                    ...filters.priceRange,
                    min,
                  }),
                (max) =>
                  handleFilterChange('priceRange', {
                    ...filters.priceRange,
                    max,
                  }),
                (value) => `$${value.toLocaleString()}`,
              ),
              'price',
            )}

            {/* Year Range */}
            {renderFilterSection(
              'Year Range',
              'calendar-outline',
              renderRangeSlider(
                'Year Range',
                filters.yearRange,
                1990,
                new Date().getFullYear(),
                1,
                (min) =>
                  handleFilterChange('yearRange', {
                    ...filters.yearRange,
                    min,
                  }),
                (max) =>
                  handleFilterChange('yearRange', {
                    ...filters.yearRange,
                    max,
                  }),
              ),
              'year',
            )}

            {/* Mileage Range */}
            {renderFilterSection(
              'Mileage Range',
              'speedometer-outline',
              renderRangeSlider(
                'Mileage Range',
                filters.mileageRange,
                0,
                200000,
                5000,
                (min) =>
                  handleFilterChange('mileageRange', {
                    ...filters.mileageRange,
                    min,
                  }),
                (max) =>
                  handleFilterChange('mileageRange', {
                    ...filters.mileageRange,
                    max,
                  }),
                (value) => `${value.toLocaleString()} mi`,
              ),
              'mileage',
            )}

            {/* Body Type */}
            {renderFilterSection(
              'Body Type',
              'car-sport-outline',
              renderChipSelector(BODY_TYPES, filters.bodyTypes, (type) =>
                toggleArrayFilter('bodyTypes', type),
              ),
              'bodyType',
            )}

            {/* Fuel Type */}
            {renderFilterSection(
              'Fuel Type',
              'leaf-outline',
              renderChipSelector(FUEL_TYPES, filters.fuelTypes, (type) =>
                toggleArrayFilter('fuelTypes', type),
              ),
              'fuelType',
            )}

            {/* Condition */}
            {renderFilterSection(
              'Condition',
              'checkmark-circle-outline',
              <View>
                {CONDITION_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.conditionOption,
                      {
                        backgroundColor: filters.condition.includes(
                          option.value,
                        )
                          ? colors.primary + '20'
                          : 'transparent',
                      },
                    ]}
                    onPress={() => toggleArrayFilter('condition', option.value)}
                  >
                    <Ionicons
                      name={
                        filters.condition.includes(option.value)
                          ? 'checkbox'
                          : 'checkbox-outline'
                      }
                      size={20}
                      color={
                        filters.condition.includes(option.value)
                          ? colors.primary
                          : colors.textSecondary
                      }
                    />
                    <Text
                      style={[styles.conditionText, { color: colors.text }]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>,
              'condition',
            )}

            {/* Features */}
            {renderFilterSection(
              'Features',
              'options-outline',
              renderChipSelector(
                POPULAR_FEATURES,
                filters.features,
                (feature) => toggleArrayFilter('features', feature),
                12,
              ),
              'features',
            )}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button
              title="Reset"
              variant="outline"
              onPress={handleResetFilters}
              style={styles.footerButton}
            />
            <Button
              title={`Apply Filters ${getActiveFiltersCount() > 0 ? `(${getActiveFiltersCount()})` : ''}`}
              onPress={handleApplyFilters}
              style={styles.applyButton}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },

  overlayBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  modal: {
    width: screenWidth * 0.85,
    maxWidth: 400,
    height: '100%',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },

  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginRight: 12,
  },

  filtersBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },

  filtersBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },

  closeButton: {
    padding: 4,
  },

  content: {
    flex: 1,
    padding: 20,
  },

  smartSuggestionsContainer: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },

  suggestionContent: {
    flex: 1,
  },

  suggestionValue: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },

  suggestionReason: {
    fontSize: 12,
  },

  confidenceBadge: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  confidenceText: {
    color: '#007AFF',
    fontSize: 10,
    fontWeight: '600',
  },

  filterSection: {
    marginBottom: 16,
  },

  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },

  filterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  filterTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },

  filterContent: {
    paddingVertical: 16,
  },

  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },

  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    margin: 4,
  },

  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },

  rangeSliderContainer: {
    marginVertical: 8,
  },

  rangeTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },

  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  rangeLabel: {
    fontSize: 14,
    fontWeight: '500',
  },

  sliderContainer: {
    marginVertical: 8,
  },

  slider: {
    width: '100%',
    height: 40,
  },

  rangeInputsContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    gap: 12,
  },

  rangeInputGroup: {
    flex: 1,
  },

  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },

  rangeInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
    textAlign: 'center',
  },

  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },

  sortOptionText: {
    fontSize: 14,
    marginLeft: 12,
  },

  conditionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },

  conditionText: {
    fontSize: 14,
    marginLeft: 12,
  },

  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 12,
  },

  footerButton: {
    flex: 1,
  },

  applyButton: {
    flex: 2,
  },
});

export default SmartFilters;
