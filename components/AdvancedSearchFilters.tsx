import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  TextInput,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { ModernButton } from '@/components/ui/ModernButton';
import { Card } from '@/components/ui/Card';
import { useThemeColors } from '@/hooks/useTheme';
import { formatPrice } from '@/utils/dataTransformers';
import {
  X,
  Filter,
  DollarSign,
  Calendar,
  Gauge,
  Fuel,
  Settings,
  MapPin,
} from '@/utils/ultra-optimized-icons';

const { width, height } = Dimensions.get('window');

export interface AdvancedSearchFiltersData {
  priceRange: { min: number; max: number };
  yearRange: { min: number; max: number };
  mileageRange: { min: number; max: number };
  makes: string[];
  bodyTypes: string[];
  fuelTypes: string[];
  transmissions: string[];
  conditions: string[];
  location: string;
}

interface AdvancedSearchFiltersProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: AdvancedSearchFiltersData) => void;
  initialFilters?: Partial<AdvancedSearchFiltersData>;
}

const POPULAR_MAKES = [
  'Toyota',
  'Honda',
  'Ford',
  'Chevrolet',
  'Nissan',
  'BMW',
  'Mercedes-Benz',
  'Audi',
  'Volkswagen',
  'Hyundai',
  'Kia',
  'Mazda',
  'Subaru',
  'Lexus',
];

const BODY_TYPES = [
  'Sedan',
  'SUV',
  'Hatchback',
  'Coupe',
  'Convertible',
  'Wagon',
  'Pickup Truck',
  'Van',
  'Crossover',
];

const FUEL_TYPES = [
  'Gasoline',
  'Hybrid',
  'Electric',
  'Diesel',
  'Plug-in Hybrid',
];

const TRANSMISSIONS = ['Automatic', 'Manual', 'CVT'];

const CONDITIONS = ['New', 'Used', 'Certified Pre-Owned'];

export default function AdvancedSearchFiltersModal({
  visible,
  onClose,
  onApplyFilters,
  initialFilters = {},
}: AdvancedSearchFiltersProps) {
  const { colors } = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);

  // Filter state
  const [priceMin, setPriceMin] = useState(initialFilters.priceRange?.min || 0);
  const [priceMax, setPriceMax] = useState(
    initialFilters.priceRange?.max || 100000,
  );
  const [yearMin, setYearMin] = useState(initialFilters.yearRange?.min || 2000);
  const [yearMax, setYearMax] = useState(
    initialFilters.yearRange?.max || new Date().getFullYear(),
  );
  const [mileageMin, setMileageMin] = useState(
    initialFilters.mileageRange?.min || 0,
  );
  const [mileageMax, setMileageMax] = useState(
    initialFilters.mileageRange?.max || 200000,
  );
  const [selectedMakes, setSelectedMakes] = useState<string[]>(
    initialFilters.makes || [],
  );
  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>(
    initialFilters.bodyTypes || [],
  );
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>(
    initialFilters.fuelTypes || [],
  );
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>(
    initialFilters.transmissions || [],
  );
  const [selectedConditions, setSelectedConditions] = useState<string[]>(
    initialFilters.conditions || [],
  );

  const handleToggleSelection = (
    item: string,
    selectedItems: string[],
    setSelectedItems: (items: string[]) => void,
  ) => {
    if (selectedItems.includes(item)) {
      setSelectedItems(selectedItems.filter((i) => i !== item));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const handleClearAll = () => {
    setPriceMin(0);
    setPriceMax(100000);
    setYearMin(2000);
    setYearMax(new Date().getFullYear());
    setMileageMin(0);
    setMileageMax(200000);
    setSelectedMakes([]);
    setSelectedBodyTypes([]);
    setSelectedFuelTypes([]);
    setSelectedTransmissions([]);
    setSelectedConditions([]);
  };

  const handleApplyFilters = () => {
    const filters: AdvancedSearchFiltersData = {
      priceRange: { min: priceMin, max: priceMax },
      yearRange: { min: yearMin, max: yearMax },
      mileageRange: { min: mileageMin, max: mileageMax },
      makes: selectedMakes,
      bodyTypes: selectedBodyTypes,
      fuelTypes: selectedFuelTypes,
      transmissions: selectedTransmissions,
      conditions: selectedConditions,
      location: '', // TODO: Add location picker
    };

    onApplyFilters(filters);
    onClose();
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (priceMin > 0 || priceMax < 100000) count++;
    if (yearMin > 2000 || yearMax < new Date().getFullYear()) count++;
    if (mileageMin > 0 || mileageMax < 200000) count++;
    if (selectedMakes.length > 0) count++;
    if (selectedBodyTypes.length > 0) count++;
    if (selectedFuelTypes.length > 0) count++;
    if (selectedTransmissions.length > 0) count++;
    if (selectedConditions.length > 0) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerLeft}>
            <Filter size={24} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Advanced Filters
            </Text>
            {activeFiltersCount > 0 && (
              <View
                style={[
                  styles.filtersBadge,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.filtersBadgeText}>
                  {activeFiltersCount}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={onClose}>
            <X size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Price Range */}
          <Card style={styles.filterSection}>
            <View style={styles.sectionHeader}>
              <DollarSign size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Price Range
              </Text>
            </View>

            <View style={styles.rangeDisplay}>
              <Text style={[styles.rangeText, { color: colors.primary }]}>
                {formatPrice(priceMin)} - {formatPrice(priceMax)}
              </Text>
            </View>

            <View style={styles.rangeInputContainer}>
              <View style={styles.rangeInput}>
                <Text
                  style={[styles.inputLabel, { color: colors.textSecondary }]}
                >
                  Minimum
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={priceMin.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 0;
                    setPriceMin(Math.max(0, Math.min(value, priceMax - 1000)));
                  }}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.rangeInput}>
                <Text
                  style={[styles.inputLabel, { color: colors.textSecondary }]}
                >
                  Maximum
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={priceMax.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 100000;
                    setPriceMax(Math.max(priceMin + 1000, value));
                  }}
                  placeholder="100000"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </Card>

          {/* Year Range */}
          <Card style={styles.filterSection}>
            <View style={styles.sectionHeader}>
              <Calendar size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Year Range
              </Text>
            </View>

            <View style={styles.rangeDisplay}>
              <Text style={[styles.rangeText, { color: colors.primary }]}>
                {yearMin} - {yearMax}
              </Text>
            </View>

            <View style={styles.rangeInputContainer}>
              <View style={styles.rangeInput}>
                <Text
                  style={[styles.inputLabel, { color: colors.textSecondary }]}
                >
                  From Year
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={yearMin.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 2000;
                    setYearMin(Math.max(1990, Math.min(value, yearMax - 1)));
                  }}
                  placeholder="2000"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.rangeInput}>
                <Text
                  style={[styles.inputLabel, { color: colors.textSecondary }]}
                >
                  To Year
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={yearMax.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || new Date().getFullYear();
                    setYearMax(
                      Math.max(
                        yearMin + 1,
                        Math.min(value, new Date().getFullYear() + 1),
                      ),
                    );
                  }}
                  placeholder={new Date().getFullYear().toString()}
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </Card>

          {/* Mileage Range */}
          <Card style={styles.filterSection}>
            <View style={styles.sectionHeader}>
              <Gauge size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Mileage Range
              </Text>
            </View>

            <View style={styles.rangeDisplay}>
              <Text style={[styles.rangeText, { color: colors.primary }]}>
                {mileageMin.toLocaleString()} - {mileageMax.toLocaleString()}{' '}
                miles
              </Text>
            </View>

            <View style={styles.rangeInputContainer}>
              <View style={styles.rangeInput}>
                <Text
                  style={[styles.inputLabel, { color: colors.textSecondary }]}
                >
                  Min Mileage
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={mileageMin.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 0;
                    setMileageMin(
                      Math.max(0, Math.min(value, mileageMax - 5000)),
                    );
                  }}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.rangeInput}>
                <Text
                  style={[styles.inputLabel, { color: colors.textSecondary }]}
                >
                  Max Mileage
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={mileageMax.toString()}
                  onChangeText={(text) => {
                    const value = parseInt(text) || 200000;
                    setMileageMax(Math.max(mileageMin + 5000, value));
                  }}
                  placeholder="200000"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </Card>

          {/* Car Makes */}
          <Card style={styles.filterSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Car Makes
              </Text>
              {selectedMakes.length > 0 && (
                <Text
                  style={[styles.selectionCount, { color: colors.primary }]}
                >
                  {selectedMakes.length} selected
                </Text>
              )}
            </View>

            <View style={styles.chipContainer}>
              {POPULAR_MAKES.map((make) => (
                <TouchableOpacity
                  key={make}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selectedMakes.includes(make)
                        ? colors.primary
                        : colors.surface,
                      borderColor: selectedMakes.includes(make)
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() =>
                    handleToggleSelection(make, selectedMakes, setSelectedMakes)
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: selectedMakes.includes(make)
                          ? 'white'
                          : colors.text,
                      },
                    ]}
                  >
                    {make}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Body Types */}
          <Card style={styles.filterSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Body Types
              </Text>
              {selectedBodyTypes.length > 0 && (
                <Text
                  style={[styles.selectionCount, { color: colors.primary }]}
                >
                  {selectedBodyTypes.length} selected
                </Text>
              )}
            </View>

            <View style={styles.chipContainer}>
              {BODY_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selectedBodyTypes.includes(type)
                        ? colors.primary
                        : colors.surface,
                      borderColor: selectedBodyTypes.includes(type)
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() =>
                    handleToggleSelection(
                      type,
                      selectedBodyTypes,
                      setSelectedBodyTypes,
                    )
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: selectedBodyTypes.includes(type)
                          ? 'white'
                          : colors.text,
                      },
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Fuel Types */}
          <Card style={styles.filterSection}>
            <View style={styles.sectionHeader}>
              <Fuel size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Fuel Types
              </Text>
              {selectedFuelTypes.length > 0 && (
                <Text
                  style={[styles.selectionCount, { color: colors.primary }]}
                >
                  {selectedFuelTypes.length} selected
                </Text>
              )}
            </View>

            <View style={styles.chipContainer}>
              {FUEL_TYPES.map((fuel) => (
                <TouchableOpacity
                  key={fuel}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selectedFuelTypes.includes(fuel)
                        ? colors.primary
                        : colors.surface,
                      borderColor: selectedFuelTypes.includes(fuel)
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() =>
                    handleToggleSelection(
                      fuel,
                      selectedFuelTypes,
                      setSelectedFuelTypes,
                    )
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: selectedFuelTypes.includes(fuel)
                          ? 'white'
                          : colors.text,
                      },
                    ]}
                  >
                    {fuel}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Transmissions */}
          <Card style={styles.filterSection}>
            <View style={styles.sectionHeader}>
              <Settings size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Transmission
              </Text>
              {selectedTransmissions.length > 0 && (
                <Text
                  style={[styles.selectionCount, { color: colors.primary }]}
                >
                  {selectedTransmissions.length} selected
                </Text>
              )}
            </View>

            <View style={styles.chipContainer}>
              {TRANSMISSIONS.map((transmission) => (
                <TouchableOpacity
                  key={transmission}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selectedTransmissions.includes(
                        transmission,
                      )
                        ? colors.primary
                        : colors.surface,
                      borderColor: selectedTransmissions.includes(transmission)
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() =>
                    handleToggleSelection(
                      transmission,
                      selectedTransmissions,
                      setSelectedTransmissions,
                    )
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: selectedTransmissions.includes(transmission)
                          ? 'white'
                          : colors.text,
                      },
                    ]}
                  >
                    {transmission}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Condition */}
          <Card style={styles.filterSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Condition
              </Text>
              {selectedConditions.length > 0 && (
                <Text
                  style={[styles.selectionCount, { color: colors.primary }]}
                >
                  {selectedConditions.length} selected
                </Text>
              )}
            </View>

            <View style={styles.chipContainer}>
              {CONDITIONS.map((condition) => (
                <TouchableOpacity
                  key={condition}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selectedConditions.includes(condition)
                        ? colors.primary
                        : colors.surface,
                      borderColor: selectedConditions.includes(condition)
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                  onPress={() =>
                    handleToggleSelection(
                      condition,
                      selectedConditions,
                      setSelectedConditions,
                    )
                  }
                >
                  <Text
                    style={[
                      styles.chipText,
                      {
                        color: selectedConditions.includes(condition)
                          ? 'white'
                          : colors.text,
                      },
                    ]}
                  >
                    {condition}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </ScrollView>

        {/* Footer Actions */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            title="Clear All"
            onPress={handleClearAll}
            variant="secondary"
            style={styles.clearButton}
          />
          <Button
            title={`Apply Filters${activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}`}
            onPress={handleApplyFilters}
            variant="primary"
            style={styles.applyButton}
          />
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      marginLeft: 8,
    },
    filtersBadge: {
      marginLeft: 8,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      minWidth: 24,
      alignItems: 'center',
    },
    filtersBadgeText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '700',
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    filterSection: {
      marginBottom: 20,
      padding: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      flex: 1,
      marginLeft: 8,
    },
    selectionCount: {
      fontSize: 14,
      fontWeight: '600',
    },
    rangeDisplay: {
      alignItems: 'center',
      paddingVertical: 12,
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
    },
    rangeText: {
      fontSize: 18,
      fontWeight: '700',
    },
    sliderContainer: {
      marginBottom: 16,
    },
    sliderLabel: {
      fontSize: 14,
      marginBottom: 8,
    },
    slider: {
      height: 40,
    },
    chipContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      marginBottom: 8,
    },
    chipText: {
      fontSize: 14,
      fontWeight: '600',
    },
    footer: {
      flexDirection: 'row',
      padding: 16,
      gap: 12,
      borderTopWidth: 1,
    },
    clearButton: {
      flex: 1,
    },
    applyButton: {
      flex: 2,
    },
    rangeInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    rangeInput: {
      flex: 1,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 8,
    },
    textInput: {
      height: 48,
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 16,
      fontSize: 16,
    },
  });
