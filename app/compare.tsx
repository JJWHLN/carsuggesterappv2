import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button'; // Use standard Button instead
import { StatCard } from '@/components/ui/StatCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useThemeColors } from '@/hooks/useTheme';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { Theme } from '@/theme/Theme';
import { Car } from '@/types/database';
import { formatPrice, formatMileage, formatDate, formatCondition, formatFuelType } from '@/utils/dataTransformers';
import { fetchCarById, fetchCarComparison } from '@/services/api';
import { ArrowLeft, Plus, X, TrendingUp, Minus, CheckCircle, Star, Calendar, Gauge, Fuel, Settings, DollarSign, MapPin, Award, Zap, Users, Clock, Heart } from '@/utils/ultra-optimized-icons';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = 300;

interface ComparisonData {
  car: { id: string };
  scores: {
    overall: number;
    value: number;
    reliability: number;
    features: number;
    efficiency: number;
  };
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}

interface ComparisonCategory {
  key: string;
  label: string;
  icon: React.ReactNode;
  getValue: (car: Car) => string | number;
  getScore?: (car: Car) => number; // For rating comparisons
  compare: (a: Car, b: Car) => 'better' | 'worse' | 'equal';
}

export default function CompareScreen() {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const { cars: carIdsParam } = useLocalSearchParams<{ cars: string }>();
  
  const [carIds, setCarIds] = useState<string[]>(() => {
    if (carIdsParam) {
      return carIdsParam.split(',').filter(Boolean);
    }
    return [];
  });
  
  const [selectedCars, setSelectedCars] = useState<Car[]>([]);
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddCarModal, setShowAddCarModal] = useState(false);
  
  // Fetch cars for comparison
  const {
    data: cars,
    loading: carsLoading,
    error: carsError,
  } = useApi(async () => {
    if (carIds.length === 0) return [];
    
    const carPromises = carIds.map(id => fetchCarById(id));
    const results = await Promise.all(carPromises);
    return results.filter((car): car is Car => car !== null);
  }, [carIds]);

  // Fetch comparison data
  const {
    data: comparisonAnalysis,
    loading: comparisonLoading,
  } = useApi(async () => {
    if (!cars || cars.length < 2) return null;
    
    return await fetchCarComparison(cars.map(car => car.id));
  }, [cars]);

  // Comparison categories
  const comparisonCategories: ComparisonCategory[] = useMemo(() => [
    {
      key: 'price',
      label: 'Price',
      icon: <DollarSign color={colors.primary} size={20} />,
      getValue: (car) => formatPrice(car.price),
      compare: (a, b) => a.price < b.price ? 'better' : a.price > b.price ? 'worse' : 'equal',
    },
    {
      key: 'year',
      label: 'Year',
      icon: <Calendar color={colors.primary} size={20} />,
      getValue: (car) => car.year,
      compare: (a, b) => a.year > b.year ? 'better' : a.year < b.year ? 'worse' : 'equal',
    },
    {
      key: 'mileage',
      label: 'Mileage',
      icon: <Gauge color={colors.primary} size={20} />,
      getValue: (car) => formatMileage(car.mileage),
      compare: (a, b) => a.mileage < b.mileage ? 'better' : a.mileage > b.mileage ? 'worse' : 'equal',
    },
    {
      key: 'fuel_type',
      label: 'Fuel Type',
      icon: <Fuel color={colors.primary} size={20} />,
      getValue: (car) => formatFuelType(car.fuel_type),
      compare: () => 'equal', // Fuel type comparison is subjective
    },
    {
      key: 'transmission',
      label: 'Transmission',
      icon: <Settings color={colors.primary} size={20} />,
      getValue: (car) => car.transmission || 'Manual',
      compare: () => 'equal', // Transmission preference is subjective
    },
    {
      key: 'condition',
      label: 'Condition',
      icon: <Shield color={colors.primary} size={20} />,
      getValue: (car) => formatCondition(car.condition),
      compare: (a, b) => {
        const conditions = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
        const aIndex = conditions.indexOf(a.condition || 'Good');
        const bIndex = conditions.indexOf(b.condition || 'Good');
        return aIndex > bIndex ? 'better' : aIndex < bIndex ? 'worse' : 'equal';
      },
    },
    {
      key: 'features',
      label: 'Features',
      icon: <Star color={colors.primary} size={20} />,
      getValue: (car) => car.features?.length || 0,
      compare: (a, b) => {
        const aFeatures = a.features?.length || 0;
        const bFeatures = b.features?.length || 0;
        return aFeatures > bFeatures ? 'better' : aFeatures < bFeatures ? 'worse' : 'equal';
      },
    },
    {
      key: 'dealer_rating',
      label: 'Dealer Rating',
      icon: <Award color={colors.primary} size={20} />,
      getValue: (car) => car.dealer?.name || 'N/A',
      getScore: (car) => car.dealer?.verified ? 5 : 3,
      compare: (a, b) => {
        const aVerified = a.dealer?.verified || false;
        const bVerified = b.dealer?.verified || false;
        return aVerified && !bVerified ? 'better' : !aVerified && bVerified ? 'worse' : 'equal';
      },
    },
  ], [colors]);

  const handleBack = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, []);

  const handleAddCar = useCallback(() => {
    if (carIds.length >= 3) {
      Alert.alert('Maximum Reached', 'You can compare up to 3 cars at a time.');
      return;
    }
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Navigate to search with compare intent
    router.push('/search?mode=compare');
  }, [carIds.length]);

  const handleRemoveCar = useCallback((carId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    const newCarIds = carIds.filter(id => id !== carId);
    setCarIds(newCarIds);
    
    // Update URL
    router.setParams({ cars: newCarIds.join(',') });
  }, [carIds]);

  const handleViewCar = useCallback((carId: string) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    router.push(`/car/${carId}`);
  }, []);

  const handleContactDealer = useCallback((car: Car) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    Alert.alert(
      'Contact Dealer',
      `Contact ${car.dealer?.name || 'the dealer'} about this ${car.year} ${car.make} ${car.model}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Phone', onPress: () => {} },
        { text: 'Email', onPress: () => {} },
      ]
    );
  }, []);

  const renderComparisonIcon = (comparison: 'better' | 'worse' | 'equal') => {
    switch (comparison) {
      case 'better':
        return <TrendingUp color={colors.success} size={16} />;
      case 'worse':
        return <TrendingDown color={colors.error} size={16} />;
      default:
        return <Minus color={colors.textMuted} size={16} />;
    }
  };

  const styles = getThemedStyles(colors);

  if (carsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading comparison data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (carsError || !cars || cars.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Compare Cars</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <EmptyState
          icon={<BarChart3 color={colors.textMuted} size={64} />}
          title="No Cars to Compare"
          subtitle="Add cars to your comparison to see how they stack up against each other."
          action={
            <Button
              title="Browse Cars"
              onPress={() => router.push('/search')}
              variant="primary"
            />
          }
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
        <Text style={styles.headerTitle}>Compare Cars</Text>
        <TouchableOpacity onPress={handleAddCar} style={styles.addButton}>
          <Plus color={colors.primary} size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Car Overview Cards */}
        <View style={styles.overviewSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {cars.map((car, index) => (
              <View key={car.id} style={styles.carOverviewCard}>
                <Card style={styles.carCard}>
                  {/* Remove Button */}
                  <TouchableOpacity
                    onPress={() => handleRemoveCar(car.id)}
                    style={styles.removeButton}
                  >
                    <X color={colors.textMuted} size={16} />
                  </TouchableOpacity>

                  {/* Car Image */}
                  <OptimizedImage
                    source={{ uri: car.images?.[0] }}
                    style={styles.carImage}
                    resizeMode="cover"
                  />

                  {/* Car Info */}
                  <View style={styles.carInfo}>
                    <Text style={styles.carTitle} numberOfLines={2}>
                      {car.year} {car.make} {car.model}
                    </Text>
                    <Text style={styles.carPrice}>{formatPrice(car.price)}</Text>
                    
                    {/* Key Stats */}
                    <View style={styles.carStats}>
                      <View style={styles.statItem}>
                        <Calendar color={colors.textMuted} size={14} />
                        <Text style={styles.statText}>{car.year}</Text>
                      </View>
                      <View style={styles.statItem}>
                        <Gauge color={colors.textMuted} size={14} />
                        <Text style={styles.statText}>{formatMileage(car.mileage)}</Text>
                      </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        onPress={() => handleViewCar(car.id)}
                        style={styles.viewButton}
                      >
                        <Text style={styles.viewButtonText}>View Details</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleContactDealer(car)}
                        style={styles.contactButton}
                      >
                        <Text style={styles.contactButtonText}>Contact</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              </View>
            ))}
            
            {/* Add Car Button */}
            {cars.length < 3 && (
              <TouchableOpacity onPress={handleAddCar} style={styles.addCarCard}>
                <Card style={styles.addCarButton}>
                  <Plus color={colors.primary} size={32} />
                  <Text style={styles.addCarText}>Add Another Car</Text>
                </Card>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Comparison Table */}
        {cars.length >= 2 && (
          <View style={styles.comparisonSection}>
            <Text style={styles.sectionTitle}>Detailed Comparison</Text>
            
            <Card style={styles.comparisonTable}>
              {comparisonCategories.map((category) => (
                <View key={category.key} style={styles.comparisonRow}>
                  <View style={styles.categoryHeader}>
                    {category.icon}
                    <Text style={styles.categoryLabel}>{category.label}</Text>
                  </View>
                  
                  <View style={styles.comparisonValues}>
                    {cars.map((car, index) => {
                      const value = category.getValue(car);
                      const comparison = index === 0 ? 'equal' : category.compare(car, cars[0]);
                      
                      return (
                        <View key={`${car.id}-${category.key}`} style={styles.comparisonValue}>
                          <View style={styles.valueRow}>
                            <Text style={styles.valueText}>{value}</Text>
                            {index > 0 && renderComparisonIcon(comparison)}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              ))}
            </Card>
          </View>
        )}

        {/* AI Recommendations */}
        {comparisonAnalysis && (
          <View style={styles.recommendationsSection}>
            <Text style={styles.sectionTitle}>AI Recommendations</Text>
            
            {comparisonAnalysis.map((analysis, index) => {
              const car = cars?.find(c => c.id === analysis.car.id);
              if (!car) return null;
              
              return (
                <Card key={analysis.car.id} style={styles.recommendationCard}>
                  <View style={styles.recommendationHeader}>
                    <Text style={styles.recommendationTitle}>
                      {car.year} {car.make} {car.model}
                    </Text>
                    <View style={styles.overallScore}>
                      <Star color={colors.warning} size={16} fill={colors.warning} />
                      <Text style={styles.scoreText}>{analysis.scores.overall}/5</Text>
                    </View>
                  </View>

                <Text style={styles.recommendationText}>{analysis.recommendation}</Text>

                <View style={styles.prosConsSection}>
                  <View style={styles.prosSection}>
                    <Text style={styles.prosConsTitle}>Strengths</Text>
                    {analysis.strengths.map((strength, i) => (
                      <View key={i} style={styles.prosConsItem}>
                        <CheckCircle color={colors.success} size={14} />
                        <Text style={styles.prosConsText}>{strength}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.consSection}>
                    <Text style={styles.prosConsTitle}>Considerations</Text>
                    {analysis.weaknesses.map((weakness, i) => (
                      <View key={i} style={styles.prosConsItem}>
                        <AlertCircle color={colors.warning} size={14} />
                        <Text style={styles.prosConsText}>{weakness}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.scoreBreakdown}>
                  <Text style={styles.scoreBreakdownTitle}>Score Breakdown</Text>
                  <View style={styles.scoreGrid}>
                    <View style={styles.scoreItem}>
                      <Text style={styles.scoreLabel}>Value</Text>
                      <Text style={styles.scoreValue}>{analysis.scores.value}/5</Text>
                    </View>
                    <View style={styles.scoreItem}>
                      <Text style={styles.scoreLabel}>Reliability</Text>
                      <Text style={styles.scoreValue}>{analysis.scores.reliability}/5</Text>
                    </View>
                    <View style={styles.scoreItem}>
                      <Text style={styles.scoreLabel}>Features</Text>
                      <Text style={styles.scoreValue}>{analysis.scores.features}/5</Text>
                    </View>
                    <View style={styles.scoreItem}>
                      <Text style={styles.scoreLabel}>Efficiency</Text>
                      <Text style={styles.scoreValue}>{analysis.scores.efficiency}/5</Text>
                    </View>
                  </View>
                </View>
              </Card>
              );
            })}
          </View>
        )}

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <Button
            title="Save Comparison"
            onPress={() => Alert.alert('Feature Coming Soon', 'Save comparison functionality will be available soon!')}
            variant="secondary"
            style={styles.saveButton}
            icon={<Heart color={colors.primary} size={18} />}
          />
          <Button
            title="Share Comparison"
            onPress={() => Alert.alert('Feature Coming Soon', 'Share comparison functionality will be available soon!')}
            variant="primary"
            style={styles.shareButton}
            icon={<Share2 color="#FFFFFF" size={18} />}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xl,
  },
  loadingText: {
    ...Theme.typography.bodyText,
    marginTop: Theme.spacing.lg,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: Theme.spacing.sm,
  },
  headerTitle: {
    ...Theme.typography.sectionTitle,
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  addButton: {
    padding: Theme.spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  overviewSection: {
    paddingVertical: Theme.spacing.lg,
  },
  carOverviewCard: {
    width: CARD_WIDTH,
    marginLeft: Theme.spacing.lg,
  },
  carCard: {
    height: CARD_HEIGHT,
    padding: Theme.spacing.lg,
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: Theme.spacing.sm,
    right: Theme.spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  carImage: {
    width: '100%',
    height: 120,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
  },
  carInfo: {
    flex: 1,
  },
  carTitle: {
    ...Theme.typography.cardTitle,
    color: colors.text,
    marginBottom: Theme.spacing.xs,
  },
  carPrice: {
    ...Theme.typography.priceText,
    color: colors.primary,
    marginBottom: Theme.spacing.sm,
  },
  carStats: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  statText: {
    ...Theme.Typography.caption,
    color: colors.textMuted,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  viewButton: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  viewButtonText: {
    ...Theme.Typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  contactButton: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  contactButtonText: {
    ...Theme.Typography.caption,
    color: colors.textInverse,
    fontWeight: '600',
  },
  addCarCard: {
    width: CARD_WIDTH,
    marginLeft: Theme.spacing.lg,
  },
  addCarButton: {
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  addCarText: {
    ...Theme.typography.bodyText,
    color: colors.textMuted,
    marginTop: Theme.spacing.sm,
  },
  comparisonSection: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
  },
  sectionTitle: {
    ...Theme.typography.sectionTitle,
    color: colors.text,
    marginBottom: Theme.spacing.lg,
  },
  comparisonTable: {
    padding: 0,
  },
  comparisonRow: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.sm,
  },
  categoryLabel: {
    ...Theme.typography.bodyText,
    color: colors.text,
    fontWeight: '600',
  },
  comparisonValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  comparisonValue: {
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueText: {
    ...Theme.typography.bodyText,
    color: colors.text,
  },
  recommendationsSection: {
    paddingHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.lg,
  },
  recommendationCard: {
    padding: Theme.spacing.xl,
    marginBottom: Theme.spacing.lg,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  recommendationTitle: {
    ...Theme.typography.cardTitle,
    color: colors.text,
    flex: 1,
  },
  overallScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
  },
  scoreText: {
    ...Theme.typography.bodyText,
    color: colors.text,
    fontWeight: '600',
  },
  recommendationText: {
    ...Theme.typography.bodyText,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: Theme.spacing.lg,
  },
  prosConsSection: {
    marginBottom: Theme.spacing.lg,
  },
  prosSection: {
    marginBottom: Theme.spacing.md,
  },
  consSection: {
    marginBottom: Theme.spacing.md,
  },
  prosConsTitle: {
    ...Theme.typography.bodyText,
    color: colors.text,
    fontWeight: '600',
    marginBottom: Theme.spacing.sm,
  },
  prosConsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.xs,
  },
  prosConsText: {
    ...Theme.Typography.caption,
    color: colors.textSecondary,
    flex: 1,
  },
  scoreBreakdown: {
    marginTop: Theme.spacing.md,
  },
  scoreBreakdownTitle: {
    ...Theme.typography.bodyText,
    color: colors.text,
    fontWeight: '600',
    marginBottom: Theme.spacing.sm,
  },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.md,
  },
  scoreItem: {
    width: '48%',
    alignItems: 'center',
  },
  scoreLabel: {
    ...Theme.Typography.caption,
    color: colors.textMuted,
    marginBottom: Theme.spacing.xs,
  },
  scoreValue: {
    ...Theme.typography.bodyText,
    color: colors.primary,
    fontWeight: '700',
  },
  bottomActions: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xl,
  },
  saveButton: {
    flex: 1,
  },
  shareButton: {
    flex: 1,
  },
});
