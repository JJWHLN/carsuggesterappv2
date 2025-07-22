import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { CarComparison } from '@/components/ui/CarComparison';
import { CarCard } from '@/components/CarCard';
import { AnimatedBadge } from '@/components/ui/AnimatedBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import ComparisonManagerService from '@/services/ComparisonManagerService';
import { Car } from '@/types/database';

// Mock car data for demo
const mockCars: Car[] = [
  {
    id: '1',
    make: 'BMW',
    model: '3 Series',
    year: 2022,
    price: 35000,
    mileage: 15000,
    location: 'Dublin',
    images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400'],
    created_at: '2023-01-01T00:00:00Z',
    fuel_type: 'Petrol',
    transmission: 'Automatic',
  },
  {
    id: '2',
    make: 'Tesla',
    model: 'Model 3',
    year: 2023,
    price: 48000,
    mileage: 5000,
    location: 'Cork',
    images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400'],
    created_at: '2023-02-01T00:00:00Z',
    fuel_type: 'Electric',
    transmission: 'Automatic',
  },
  {
    id: '3',
    make: 'Mercedes-Benz',
    model: 'C-Class',
    year: 2021,
    price: 42000,
    mileage: 22000,
    location: 'Galway',
    images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400'],
    created_at: '2023-03-01T00:00:00Z',
    fuel_type: 'Hybrid',
    transmission: 'Automatic',
  },
  {
    id: '4',
    make: 'Audi',
    model: 'A4',
    year: 2022,
    price: 38000,
    mileage: 18000,
    location: 'Limerick',
    images: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400'],
    created_at: '2023-04-01T00:00:00Z',
    fuel_type: 'Diesel',
    transmission: 'Manual',
  },
  {
    id: '5',
    make: 'Toyota',
    model: 'Camry Hybrid',
    year: 2023,
    price: 32000,
    mileage: 8000,
    location: 'Waterford',
    images: ['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400'],
    created_at: '2023-05-01T00:00:00Z',
    fuel_type: 'Hybrid',
    transmission: 'Automatic',
  },
  {
    id: '6',
    make: 'Volkswagen',
    model: 'Golf',
    year: 2022,
    price: 28000,
    mileage: 12000,
    location: 'Kilkenny',
    images: ['https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=400'],
    created_at: '2023-06-01T00:00:00Z',
    fuel_type: 'Petrol',
    transmission: 'Manual',
  },
];

export default function CarComparisonDemoScreen() {
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonCars, setComparisonCars] = useState<Car[]>([]);
  const [availableCars, setAvailableCars] = useState<Car[]>(mockCars);
  const [loading, setLoading] = useState(false);
  const [comparisonManager] = useState(() => ComparisonManagerService.getInstance());
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadComparisonState();
    loadAnalytics();
  }, []);

  const loadComparisonState = async () => {
    const cars = comparisonManager.getComparisonCars();
    setComparisonCars(cars);
  };

  const loadAnalytics = async () => {
    const data = comparisonManager.getComparisonAnalytics();
    setAnalytics(data);
  };

  const handleAddToComparison = async (car: Car) => {
    const success = await comparisonManager.addCarToComparison(car);
    if (success) {
      setComparisonCars(comparisonManager.getComparisonCars());
      Alert.alert('Added!', `${car.make} ${car.model} added to comparison`);
    } else {
      if (comparisonManager.isInComparison(car.id)) {
        Alert.alert('Already Added', 'This car is already in your comparison');
      } else {
        Alert.alert('Comparison Full', 'You can compare up to 3 cars at once');
      }
    }
  };

  const handleRemoveFromComparison = async (carId: string) => {
    await comparisonManager.removeCarFromComparison(carId);
    setComparisonCars(comparisonManager.getComparisonCars());
    loadAnalytics();
  };

  const handleShowComparison = () => {
    if (comparisonCars.length < 2) {
      Alert.alert('Need More Cars', 'Add at least 2 cars to compare');
      return;
    }
    setShowComparison(true);
  };

  const handleCloseComparison = async () => {
    await comparisonManager.markComparisonResult('selected');
    setShowComparison(false);
    loadAnalytics();
  };

  const handleAddCarToComparison = () => {
    setShowComparison(false);
    // In a real app, this would navigate to a car selection screen
    Alert.alert('Add Car', 'Navigate to car selection screen');
  };

  const handleQuickCompare = async (car1: Car, car2: Car) => {
    setLoading(true);
    try {
      const result = await comparisonManager.quickCompare(car1, car2);
      
      let message = '';
      if (result.winner) {
        message += `Winner: ${result.winner.make} ${result.winner.model}\n\n`;
      } else {
        message += 'It\'s a tie! Both cars have similar advantages.\n\n';
      }
      
      if (result.advantages.car1.length > 0) {
        message += `${car1.make} ${car1.model} advantages:\n${result.advantages.car1.join('\n')}\n\n`;
      }
      
      if (result.advantages.car2.length > 0) {
        message += `${car2.make} ${car2.model} advantages:\n${result.advantages.car2.join('\n')}\n\n`;
      }
      
      if (result.neutral.length > 0) {
        message += `Similar features:\n${result.neutral.join('\n')}`;
      }
      
      Alert.alert('Quick Comparison Result', message);
      loadAnalytics();
    } catch (error) {
      Alert.alert('Error', 'Failed to perform comparison');
    } finally {
      setLoading(false);
    }
  };

  const handleClearComparison = async () => {
    Alert.alert(
      'Clear Comparison',
      'Remove all cars from comparison?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await comparisonManager.clearComparison();
            setComparisonCars([]);
            loadAnalytics();
          },
        },
      ]
    );
  };

  const getSuggestedCars = () => {
    if (comparisonCars.length === 0) return [];
    return comparisonManager.getSuggestedCarsForComparison(comparisonCars, availableCars);
  };

  const suggestedCars = getSuggestedCars();

  if (showComparison) {
    return (
      <CarComparison
        cars={comparisonCars}
        onRemoveCar={handleRemoveFromComparison}
        onAddCar={handleAddCarToComparison}
        onClose={handleCloseComparison}
        onCarPress={(car) => Alert.alert('Car Details', `View ${car.make} ${car.model} details`)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Car Comparison System</Text>
          <Text style={styles.subtitle}>
            Add cars to compare features, prices, and specifications side-by-side
          </Text>
        </View>

        {/* Comparison Status */}
        <View style={styles.statusContainer}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>
              Current Comparison ({comparisonCars.length}/3)
            </Text>
            {comparisonCars.length > 0 && (
              <TouchableOpacity onPress={handleClearComparison}>
                <Text style={styles.clearButton}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {comparisonCars.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.comparisonCarsList}
            >
              {comparisonCars.map((car) => (
                <View key={car.id} style={styles.comparisonCarItem}>
                  <Text style={styles.comparisonCarName} numberOfLines={1}>
                    {car.make} {car.model}
                  </Text>
                  <Text style={styles.comparisonCarPrice}>
                    €{car.price.toLocaleString()}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveFromComparison(car.id)}
                    style={styles.removeButton}
                  >
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyComparison}>
              <Text style={styles.emptyComparisonText}>
                No cars selected for comparison
              </Text>
              <Text style={styles.emptyComparisonSubtext}>
                Tap "Add to Compare" on any car below
              </Text>
            </View>
          )}

          {comparisonCars.length >= 2 && (
            <TouchableOpacity
              style={styles.compareButton}
              onPress={handleShowComparison}
            >
              <Text style={styles.compareButtonText}>
                Compare Cars ({comparisonCars.length})
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Suggested Cars (if comparison started) */}
        {suggestedCars.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>💡 Suggested for Comparison</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsList}
            >
              {suggestedCars.map((car) => (
                <View key={car.id} style={styles.suggestionItem}>
                  <CarCard
                    car={car}
                    onPress={() => handleAddToComparison(car)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Analytics */}
        {analytics && analytics.totalComparisons > 0 && (
          <View style={styles.analyticsContainer}>
            <Text style={styles.analyticsTitle}>📊 Your Comparison Stats</Text>
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>{analytics.totalComparisons}</Text>
                <Text style={styles.analyticsLabel}>Total Comparisons</Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>{analytics.averageCarsPerComparison}</Text>
                <Text style={styles.analyticsLabel}>Avg Cars/Comparison</Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={styles.analyticsValue}>{analytics.conversionRate}%</Text>
                <Text style={styles.analyticsLabel}>Conversion Rate</Text>
              </View>
            </View>
          </View>
        )}

        {/* Available Cars */}
        <View style={styles.carsContainer}>
          <Text style={styles.carsTitle}>Available Cars</Text>
          <View style={styles.carsGrid}>
            {availableCars.map((car) => (
              <View key={car.id} style={styles.carItem}>
                <CarCard
                  car={car}
                  onPress={() => Alert.alert('Car Details', `View ${car.make} ${car.model} details`)}
                />
                
                <View style={styles.carActions}>
                  <TouchableOpacity
                    style={[
                      styles.addToCompareButton,
                      comparisonManager.isInComparison(car.id) && styles.addToCompareButtonDisabled,
                    ]}
                    onPress={() => handleAddToComparison(car)}
                    disabled={comparisonManager.isInComparison(car.id)}
                  >
                    <Text style={[
                      styles.addToCompareButtonText,
                      comparisonManager.isInComparison(car.id) && styles.addToCompareButtonTextDisabled,
                    ]}>
                      {comparisonManager.isInComparison(car.id) ? 'Added' : 'Add to Compare'}
                    </Text>
                  </TouchableOpacity>

                  {/* Quick Compare Button */}
                  {comparisonCars.length === 1 && !comparisonManager.isInComparison(car.id) && (
                    <TouchableOpacity
                      style={styles.quickCompareButton}
                      onPress={() => handleQuickCompare(comparisonCars[0], car)}
                      disabled={loading}
                    >
                      <Text style={styles.quickCompareButtonText}>
                        Quick Compare
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Feature Highlights */}
        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>✨ Comparison Features</Text>
          <View style={styles.featuresList}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>📋</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureName}>Side-by-Side Comparison</Text>
                <Text style={styles.featureDescription}>
                  Compare up to 3 cars with detailed specifications
                </Text>
              </View>
            </View>
            
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🏆</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureName}>Smart Winner Detection</Text>
                <Text style={styles.featureDescription}>
                  Automatically highlights the best value in each category
                </Text>
              </View>
            </View>
            
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>⚡</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureName}>Quick Compare</Text>
                <Text style={styles.featureDescription}>
                  Get instant comparison results between two cars
                </Text>
              </View>
            </View>
            
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🎯</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureName}>Smart Suggestions</Text>
                <Text style={styles.featureDescription}>
                  Get car recommendations based on your comparison history
                </Text>
              </View>
            </View>
          </View>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <LoadingSpinner size="large" />
            <Text style={styles.loadingText}>Comparing cars...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Typography.heading,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  statusContainer: {
    backgroundColor: Colors.light.surfaceSecondary,
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusTitle: {
    ...Typography.subtitle,
    color: Colors.light.text,
  },
  clearButton: {
    ...Typography.caption,
    color: Colors.light.error,
    fontWeight: '600',
  },
  comparisonCarsList: {
    gap: Spacing.sm,
  },
  comparisonCarItem: {
    backgroundColor: Colors.light.surface,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 120,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  comparisonCarName: {
    ...Typography.caption,
    color: Colors.light.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  comparisonCarPrice: {
    ...Typography.caption,
    color: Colors.light.primary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  removeButton: {
    alignSelf: 'flex-start',
  },
  removeButtonText: {
    ...Typography.xs,
    color: Colors.light.error,
    fontWeight: '500',
  },
  emptyComparison: {
    alignItems: 'center',
    padding: Spacing.lg,
  },
  emptyComparisonText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  emptyComparisonSubtext: {
    ...Typography.caption,
    color: Colors.light.textMuted,
  },
  compareButton: {
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  compareButtonText: {
    ...Typography.body,
    color: Colors.light.textInverse,
    fontWeight: '600',
  },
  suggestionsContainer: {
    margin: Spacing.md,
    marginTop: 0,
  },
  suggestionsTitle: {
    ...Typography.subtitle,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  suggestionsList: {
    gap: Spacing.sm,
  },
  suggestionItem: {
    width: 280,
  },
  analyticsContainer: {
    backgroundColor: Colors.light.surface,
    margin: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  analyticsTitle: {
    ...Typography.subtitle,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  analyticsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analyticsItem: {
    alignItems: 'center',
    flex: 1,
  },
  analyticsValue: {
    ...Typography.title,
    color: Colors.light.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  analyticsLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  carsContainer: {
    padding: Spacing.md,
  },
  carsTitle: {
    ...Typography.subtitle,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  carsGrid: {
    gap: Spacing.md,
  },
  carItem: {
    marginBottom: Spacing.sm,
  },
  carActions: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  addToCompareButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  addToCompareButtonDisabled: {
    backgroundColor: Colors.light.neutral300,
  },
  addToCompareButtonText: {
    ...Typography.caption,
    color: Colors.light.textInverse,
    fontWeight: '600',
  },
  addToCompareButtonTextDisabled: {
    color: Colors.light.textMuted,
  },
  quickCompareButton: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  quickCompareButtonText: {
    ...Typography.caption,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  featuresContainer: {
    backgroundColor: Colors.light.surfaceSecondary,
    margin: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  featuresTitle: {
    ...Typography.subtitle,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  featuresList: {
    gap: Spacing.md,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  featureIcon: {
    fontSize: 24,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureName: {
    ...Typography.body,
    color: Colors.light.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.light.background + 'E0',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
  },
});
