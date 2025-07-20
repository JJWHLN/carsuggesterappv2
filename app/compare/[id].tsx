import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ArrowLeft,
  Plus,
  X,
  Zap,
  Fuel,
  Settings,
  Shield,
  Star,
  DollarSign,
} from '@/utils/ultra-optimized-icons';
import { useThemeColors } from '@/hooks/useTheme';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Button } from '@/components/ui/Button';
import { BorderRadius, Spacing, Typography, Shadows } from '@/constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Real car comparison interfaces
interface CarComparison {
  id: string;
  name: string;
  cars: CarComparisonItem[];
  createdAt: string;
  updatedAt: string;
}

interface CarComparisonItem {
  id: string;
  make: string;
  model: string;
  year: number;
  trim: string;
  price: number;
  imageUrl: string;
  specs: CarSpecs;
  ratings: CarRatings;
  pros: string[];
  cons: string[];
}

interface CarSpecs {
  engine: string;
  horsepower: number;
  torque: number;
  fuelEconomy: {
    city: number;
    highway: number;
    combined: number;
  };
  transmission: string;
  drivetrain: string;
  seating: number;
  cargoSpace: number;
  safetyRating: number;
}

interface CarRatings {
  overall: number;
  performance: number;
  comfort: number;
  reliability: number;
  value: number;
  features: number;
}

// Real comparison service (replacing TODO comments)
class ComparisonService {
  static async getComparison(comparisonId: string): Promise<CarComparison> {
    try {
      const response = await fetch(`/api/comparisons/${comparisonId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comparison');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching comparison:', error);
      throw error;
    }
  }

  static async createComparison(carIds: string[]): Promise<CarComparison> {
    try {
      const response = await fetch('/api/comparisons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ carIds }),
      });
      if (!response.ok) {
        throw new Error('Failed to create comparison');
      }
      return await response.json();
    } catch (error) {
      console.error('Error creating comparison:', error);
      throw error;
    }
  }

  static async addCarToComparison(comparisonId: string, carId: string): Promise<CarComparison> {
    try {
      const response = await fetch(`/api/comparisons/${comparisonId}/cars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ carId }),
      });
      if (!response.ok) {
        throw new Error('Failed to add car to comparison');
      }
      return await response.json();
    } catch (error) {
      console.error('Error adding car to comparison:', error);
      throw error;
    }
  }

  static async removeCarFromComparison(comparisonId: string, carId: string): Promise<CarComparison> {
    try {
      const response = await fetch(`/api/comparisons/${comparisonId}/cars/${carId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to remove car from comparison');
      }
      return await response.json();
    } catch (error) {
      console.error('Error removing car from comparison:', error);
      throw error;
    }
  }
}

export default function CarComparisonScreen() {
  const { id, carIds } = useLocalSearchParams<{ id?: string; carIds?: string }>();
  const router = useRouter();
  const { colors } = useThemeColors();
  const styles = getThemedStyles(colors);

  const [comparison, setComparison] = useState<CarComparison | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('specs');

  useEffect(() => {
    loadComparison();
  }, [id, carIds]);

  const loadComparison = async () => {
    try {
      setLoading(true);
      setError(null);

      if (id) {
        // Load existing comparison
        const comparisonData = await ComparisonService.getComparison(id);
        setComparison(comparisonData);
      } else if (carIds) {
        // Create new comparison from car IDs
        const carIdArray = carIds.split(',');
        const comparisonData = await ComparisonService.createComparison(carIdArray);
        setComparison(comparisonData);
      } else {
        throw new Error('No comparison ID or car IDs provided');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comparison');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleAddCar = () => {
    router.push(`/search?mode=comparison&comparisonId=${comparison?.id}`);
  };

  const handleRemoveCar = async (carId: string) => {
    if (!comparison) return;

    try {
      const updatedComparison = await ComparisonService.removeCarFromComparison(comparison.id, carId);
      setComparison(updatedComparison);
    } catch (err) {
      Alert.alert('Error', 'Failed to remove car from comparison');
    }
  };

  const handleViewCar = (carId: string) => {
    router.push(`/car/${carId}`);
  };

  const renderCarHeader = (car: CarComparisonItem, index: number) => (
    <View key={car.id} style={styles.carColumn}>
      <View style={styles.carHeaderContent}>
        <TouchableOpacity
          onPress={() => handleRemoveCar(car.id)}
          style={styles.removeButton}
        >
          <X size={16} color={colors.error} />
        </TouchableOpacity>
        
        <OptimizedImage
          source={{ uri: car.imageUrl }}
          style={styles.carImage}
        />
        
        <TouchableOpacity onPress={() => handleViewCar(car.id)}>
          <Text style={[styles.carName, { color: colors.text }]}>
            {car.year} {car.make} {car.model}
          </Text>
          <Text style={[styles.carTrim, { color: colors.textSecondary }]}>
            {car.trim}
          </Text>
        </TouchableOpacity>
        
        <Text style={[styles.carPrice, { color: colors.primary }]}>
          ${car.price.toLocaleString()}
        </Text>
      </View>
    </View>
  );

  const renderAddCarColumn = () => (
    <View style={styles.carColumn}>
      <TouchableOpacity onPress={handleAddCar} style={styles.addCarColumn}>
        <Plus size={32} color={colors.textSecondary} />
        <Text style={[styles.addCarText, { color: colors.textSecondary }]}>
          Add Car
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderSpecsComparison = () => {
    if (!comparison) return null;

    const specs = [
      { key: 'engine', label: 'Engine', getValue: (car: CarComparisonItem) => car.specs.engine },
      { key: 'horsepower', label: 'Horsepower', getValue: (car: CarComparisonItem) => `${car.specs.horsepower} hp` },
      { key: 'torque', label: 'Torque', getValue: (car: CarComparisonItem) => `${car.specs.torque} lb-ft` },
      { key: 'fuelEconomy', label: 'Fuel Economy', getValue: (car: CarComparisonItem) => `${car.specs.fuelEconomy.combined} mpg` },
      { key: 'transmission', label: 'Transmission', getValue: (car: CarComparisonItem) => car.specs.transmission },
      { key: 'drivetrain', label: 'Drivetrain', getValue: (car: CarComparisonItem) => car.specs.drivetrain },
      { key: 'seating', label: 'Seating', getValue: (car: CarComparisonItem) => `${car.specs.seating} seats` },
      { key: 'cargoSpace', label: 'Cargo Space', getValue: (car: CarComparisonItem) => `${car.specs.cargoSpace} cu ft` },
      { key: 'safetyRating', label: 'Safety Rating', getValue: (car: CarComparisonItem) => `${car.specs.safetyRating}/5 stars` },
    ];

    return (
      <View style={styles.comparisonTable}>
        {specs.map((spec) => (
          <View key={spec.key} style={styles.comparisonRow}>
            <View style={styles.labelColumn}>
              <Text style={[styles.specLabel, { color: colors.text }]}>
                {spec.label}
              </Text>
            </View>
            {comparison.cars.map((car) => (
              <View key={car.id} style={styles.valueColumn}>
                <Text style={[styles.specValue, { color: colors.textSecondary }]}>
                  {spec.getValue(car)}
                </Text>
              </View>
            ))}
            {comparison.cars.length < 3 && (
              <View style={styles.valueColumn}>
                <Text style={[styles.specValue, { color: colors.border }]}>-</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderRatingsComparison = () => {
    if (!comparison) return null;

    const ratings = [
      { key: 'overall', label: 'Overall Rating' },
      { key: 'performance', label: 'Performance' },
      { key: 'comfort', label: 'Comfort' },
      { key: 'reliability', label: 'Reliability' },
      { key: 'value', label: 'Value' },
      { key: 'features', label: 'Features' },
    ];

    return (
      <View style={styles.comparisonTable}>
        {ratings.map((rating) => (
          <View key={rating.key} style={styles.comparisonRow}>
            <View style={styles.labelColumn}>
              <Text style={[styles.specLabel, { color: colors.text }]}>
                {rating.label}
              </Text>
            </View>
            {comparison.cars.map((car) => (
              <View key={car.id} style={styles.valueColumn}>
                <View style={styles.ratingContainer}>
                  <Star size={14} color="#FFB800" />
                  <Text style={[styles.ratingValue, { color: colors.text }]}>
                    {car.ratings[rating.key as keyof CarRatings].toFixed(1)}
                  </Text>
                </View>
              </View>
            ))}
            {comparison.cars.length < 3 && (
              <View style={styles.valueColumn}>
                <Text style={[styles.specValue, { color: colors.border }]}>-</Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderProsConsComparison = () => {
    if (!comparison) return null;

    return (
      <View style={styles.prosConsContainer}>
        {comparison.cars.map((car) => (
          <View key={car.id} style={styles.prosConsColumn}>
            <Text style={[styles.prosConsTitle, { color: colors.text }]}>
              {car.make} {car.model}
            </Text>
            
            <View style={styles.prosConsSection}>
              <Text style={[styles.prosConsLabel, { color: '#10B981' }]}>Pros</Text>
              {car.pros.map((pro, index) => (
                <Text key={index} style={[styles.prosConsItem, { color: colors.textSecondary }]}>
                  • {pro}
                </Text>
              ))}
            </View>
            
            <View style={styles.prosConsSection}>
              <Text style={[styles.prosConsLabel, { color: '#EF4444' }]}>Cons</Text>
              {car.cons.map((con, index) => (
                <Text key={index} style={[styles.prosConsItem, { color: colors.textSecondary }]}>
                  • {con}
                </Text>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const categories = [
    { id: 'specs', label: 'Specifications', icon: Settings },
    { id: 'ratings', label: 'Ratings', icon: Star },
    { id: 'proscons', label: 'Pros & Cons', icon: Shield },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
        </View>
        <LoadingSpinner size="large" />
      </SafeAreaView>
    );
  }

  if (error || !comparison) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
        </View>
        <ErrorState
          title="Unable to Load Comparison"
          message={error || 'Comparison not found'}
          onRetry={loadComparison}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Car Comparison</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Car Headers */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carHeadersContainer}>
        <View style={styles.carHeadersRow}>
          {comparison.cars.map((car, index) => renderCarHeader(car, index))}
          {comparison.cars.length < 3 && renderAddCarColumn()}
        </View>
      </ScrollView>

      {/* Category Tabs */}
      <View style={styles.categoryTabs}>
        {categories.map((category) => {
          const IconComponent = category.icon;
          const isSelected = selectedCategory === category.id;
          
          return (
            <TouchableOpacity
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              style={[
                styles.categoryTab,
                { borderBottomColor: isSelected ? colors.primary : 'transparent' }
              ]}
            >
              <IconComponent size={20} color={isSelected ? colors.primary : colors.textSecondary} />
              <Text style={[
                styles.categoryTabText,
                { color: isSelected ? colors.primary : colors.textSecondary }
              ]}>
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Comparison Content */}
      <ScrollView style={styles.comparisonContent} showsVerticalScrollIndicator={false}>
        {selectedCategory === 'specs' && renderSpecsComparison()}
        {selectedCategory === 'ratings' && renderRatingsComparison()}
        {selectedCategory === 'proscons' && renderProsConsComparison()}
      </ScrollView>
    </SafeAreaView>
  );
}

const getThemedStyles = (colors: any) => {
  const carColumnWidth = (SCREEN_WIDTH - Spacing.lg * 2) / 3;
  
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    backButton: {
      padding: Spacing.sm,
      marginLeft: -Spacing.sm,
    },
    headerTitle: {
      ...Typography.sectionTitle,
      fontWeight: '600',
    },
    headerRight: {
      width: 40,
    },
    carHeadersContainer: {
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    carHeadersRow: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
    },
    carColumn: {
      width: carColumnWidth,
      marginRight: Spacing.md,
    },
    carHeaderContent: {
      alignItems: 'center',
    },
    removeButton: {
      position: 'absolute',
      top: -8,
      right: -8,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1,
      ...Shadows.small,
    },
    carImage: {
      width: carColumnWidth - 16,
      height: 80,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.sm,
    },
    carName: {
      ...Typography.bodyText,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 2,
    },
    carTrim: {
      ...Typography.caption,
      textAlign: 'center',
      marginBottom: Spacing.sm,
    },
    carPrice: {
      ...Typography.bodyText,
      fontWeight: '700',
      textAlign: 'center',
    },
    addCarColumn: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 150,
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: 'dashed',
      borderRadius: BorderRadius.md,
    },
    addCarText: {
      ...Typography.bodyText,
      marginTop: Spacing.sm,
    },
    categoryTabs: {
      flexDirection: 'row',
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    categoryTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.md,
      borderBottomWidth: 2,
    },
    categoryTabText: {
      ...Typography.bodySmall,
      fontWeight: '600',
      marginLeft: 6,
    },
    comparisonContent: {
      flex: 1,
    },
    comparisonTable: {
      padding: Spacing.lg,
    },
    comparisonRow: {
      flexDirection: 'row',
      paddingVertical: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    labelColumn: {
      width: 120,
      justifyContent: 'center',
    },
    valueColumn: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: Spacing.sm,
    },
    specLabel: {
      ...Typography.bodyText,
      fontWeight: '600',
    },
    specValue: {
      ...Typography.bodyText,
      textAlign: 'center',
    },
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    ratingValue: {
      ...Typography.bodyText,
      fontWeight: '600',
      marginLeft: 4,
    },
    prosConsContainer: {
      flexDirection: 'row',
      padding: Spacing.lg,
      gap: Spacing.lg,
    },
    prosConsColumn: {
      flex: 1,
    },
    prosConsTitle: {
      ...Typography.bodyText,
      fontWeight: '700',
      marginBottom: Spacing.md,
      textAlign: 'center',
    },
    prosConsSection: {
      marginBottom: Spacing.lg,
    },
    prosConsLabel: {
      ...Typography.bodyText,
      fontWeight: '600',
      marginBottom: Spacing.sm,
    },
    prosConsItem: {
      ...Typography.bodySmall,
      marginBottom: 4,
      lineHeight: 18,
    },
  });
};
