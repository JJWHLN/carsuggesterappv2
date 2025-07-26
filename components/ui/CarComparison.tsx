import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
} from '@/constants/Colors';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { AnimatedBadge } from '@/components/ui/AnimatedBadge';
import { Car } from '@/types/database';
import {
  X,
  ArrowLeft,
  Share,
  Star,
  Fuel,
  Gauge,
  Calendar,
  MapPin,
  DollarSign,
  Zap,
  Users,
  Shield,
} from '@/utils/ultra-optimized-icons';

interface CarComparisonProps {
  cars: Car[];
  onRemoveCar: (carId: string) => void;
  onAddCar: () => void;
  onClose: () => void;
  onCarPress: (car: Car) => void;
}

interface ComparisonFeature {
  id: string;
  label: string;
  getValue: (car: Car) => string | number;
  format?: (value: any) => string;
  icon?: React.ReactNode;
  type: 'text' | 'number' | 'currency' | 'rating' | 'badge';
  category: 'basic' | 'performance' | 'economy' | 'features';
}

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = Math.min(width - 40, 320);
const MAX_CARS = 3;

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

export const CarComparison: React.FC<CarComparisonProps> = ({
  cars,
  onRemoveCar,
  onAddCar,
  onClose,
  onCarPress,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('basic');
  const [compactMode, setCompactMode] = useState(false);

  const slideInValue = useSharedValue(0);
  const fadeInValue = useSharedValue(0);

  React.useEffect(() => {
    slideInValue.value = withSpring(1, { damping: 15, stiffness: 100 });
    fadeInValue.value = withTiming(1, { duration: 300 });
  }, []);

  // Comparison features configuration
  const comparisonFeatures: ComparisonFeature[] = [
    // Basic Information
    {
      id: 'price',
      label: 'Price',
      getValue: (car) => car.price,
      format: (value) => `€${value.toLocaleString()}`,
      icon: <DollarSign size={16} color={Colors.light.primary} />,
      type: 'currency',
      category: 'basic',
    },
    {
      id: 'year',
      label: 'Year',
      getValue: (car) => car.year,
      icon: <Calendar size={16} color={Colors.light.textSecondary} />,
      type: 'number',
      category: 'basic',
    },
    {
      id: 'mileage',
      label: 'Mileage',
      getValue: (car) => car.mileage || 0,
      format: (value) => `${value.toLocaleString()} km`,
      icon: <Gauge size={16} color={Colors.light.textSecondary} />,
      type: 'text',
      category: 'basic',
    },
    {
      id: 'location',
      label: 'Location',
      getValue: (car) => car.location || 'Unknown',
      icon: <MapPin size={16} color={Colors.light.textSecondary} />,
      type: 'text',
      category: 'basic',
    },
    // Performance
    {
      id: 'fuel_type',
      label: 'Fuel Type',
      getValue: (car) => car.fuel_type || 'Unknown',
      icon: <Fuel size={16} color={Colors.light.primary} />,
      type: 'badge',
      category: 'performance',
    },
    {
      id: 'transmission',
      label: 'Transmission',
      getValue: (car) => car.transmission || 'Unknown',
      icon: <Gauge size={16} color={Colors.light.textSecondary} />,
      type: 'badge',
      category: 'performance',
    },
    {
      id: 'engine_size',
      label: 'Engine Size',
      getValue: (car) => (car as any).engine_size || 'N/A',
      format: (value) => (value !== 'N/A' ? `${value}L` : 'N/A'),
      type: 'text',
      category: 'performance',
    },
    {
      id: 'power',
      label: 'Power',
      getValue: (car) => (car as any).power || 'N/A',
      format: (value) => (value !== 'N/A' ? `${value} HP` : 'N/A'),
      icon: <Zap size={16} color={Colors.light.warning} />,
      type: 'text',
      category: 'performance',
    },
    // Economy
    {
      id: 'fuel_economy',
      label: 'Fuel Economy',
      getValue: (car) => (car as any).fuel_economy || 'N/A',
      format: (value) => (value !== 'N/A' ? `${value}L/100km` : 'N/A'),
      icon: <Fuel size={16} color={Colors.light.success} />,
      type: 'text',
      category: 'economy',
    },
    {
      id: 'co2_emissions',
      label: 'CO₂ Emissions',
      getValue: (car) => (car as any).co2_emissions || 'N/A',
      format: (value) => (value !== 'N/A' ? `${value}g/km` : 'N/A'),
      type: 'text',
      category: 'economy',
    },
    // Features
    {
      id: 'safety_rating',
      label: 'Safety Rating',
      getValue: (car) => (car as any).safety_rating || 0,
      icon: <Shield size={16} color={Colors.light.primary} />,
      type: 'rating',
      category: 'features',
    },
    {
      id: 'seats',
      label: 'Seats',
      getValue: (car) => (car as any).seats || 5,
      icon: <Users size={16} color={Colors.light.textSecondary} />,
      type: 'number',
      category: 'features',
    },
  ];

  const categories = [
    { id: 'basic', label: 'Basic Info', icon: '📋' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'economy', label: 'Economy', icon: '🌱' },
    { id: 'features', label: 'Features', icon: '⭐' },
  ];

  const filteredFeatures = useMemo(() => {
    return comparisonFeatures.filter(
      (feature) => feature.category === selectedCategory,
    );
  }, [selectedCategory]);

  const handleShare = useCallback(() => {
    const carNames = cars.map((car) => `${car.make} ${car.model}`).join(' vs ');
    Alert.alert('Share Comparison', `Share "${carNames}" comparison?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Share', onPress: () => console.log('Sharing comparison...') },
    ]);
  }, [cars]);

  const handleRemove = useCallback(
    (carId: string) => {
      Alert.alert('Remove Car', 'Remove this car from comparison?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => onRemoveCar(carId),
        },
      ]);
    },
    [onRemoveCar],
  );

  const renderValue = (feature: ComparisonFeature, car: Car) => {
    const value = feature.getValue(car);

    switch (feature.type) {
      case 'currency':
        return (
          <Text style={[styles.valueText, styles.priceText]}>
            {feature.format ? feature.format(value) : value}
          </Text>
        );
      case 'rating':
        return (
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={14}
                color={
                  star <= (value as number)
                    ? Colors.light.warning
                    : Colors.light.neutral300
                }
                fill={star <= (value as number) ? Colors.light.warning : 'none'}
              />
            ))}
          </View>
        );
      case 'badge':
        return (
          <AnimatedBadge
            variant="outline"
            size="small"
            style={styles.badgeValue}
          >
            {value}
          </AnimatedBadge>
        );
      default:
        return (
          <Text style={styles.valueText}>
            {feature.format ? feature.format(value) : value}
          </Text>
        );
    }
  };

  const getBestValue = (feature: ComparisonFeature): string | null => {
    if (cars.length < 2) return null;

    const values = cars.map((car) => feature.getValue(car));

    if (feature.type === 'currency' || feature.id === 'mileage') {
      // Lower is better for price and mileage
      const minValue = Math.min(...(values as number[]));
      const carIndex = values.findIndex((v) => v === minValue);
      return cars[carIndex]?.id || null;
    } else if (
      feature.type === 'rating' ||
      feature.id === 'power' ||
      feature.id === 'year'
    ) {
      // Higher is better for ratings, power, year
      const maxValue = Math.max(...(values as number[]));
      const carIndex = values.findIndex((v) => v === maxValue);
      return cars[carIndex]?.id || null;
    }

    return null;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(slideInValue.value, [0, 1], [50, 0]) },
    ],
    opacity: fadeInValue.value,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, animatedStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <ArrowLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Compare Cars</Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Share size={24} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>

        {/* Category Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContainer}
          style={styles.categoryContainer}
        >
          {categories.map((category) => (
            <AnimatedBadge
              key={category.id}
              active={selectedCategory === category.id}
              variant="outline"
              onPress={() => setSelectedCategory(category.id)}
              style={styles.categoryBadge}
            >
              {category.icon} {category.label}
            </AnimatedBadge>
          ))}
        </ScrollView>

        {/* Comparison Grid */}
        <ScrollView
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Car Headers */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carHeadersContainer}
          >
            {cars.map((car, index) => (
              <TouchableOpacity
                key={car.id}
                style={styles.carHeader}
                onPress={() => onCarPress(car)}
                activeOpacity={0.8}
              >
                <TouchableOpacity
                  onPress={() => handleRemove(car.id)}
                  style={styles.removeButton}
                >
                  <X size={16} color={Colors.light.textInverse} />
                </TouchableOpacity>

                <OptimizedImage
                  source={{
                    uri:
                      car.images?.[0] || 'https://via.placeholder.com/200x120',
                  }}
                  style={styles.carImage}
                  placeholder="🚗"
                />

                <View style={styles.carInfo}>
                  <Text style={styles.carTitle} numberOfLines={1}>
                    {car.make} {car.model}
                  </Text>
                  <Text style={styles.carSubtitle}>
                    {car.year} • {car.location}
                  </Text>
                  <Text style={styles.carPrice}>
                    €{car.price.toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Add Car Button */}
            {cars.length < MAX_CARS && (
              <TouchableOpacity style={styles.addCarButton} onPress={onAddCar}>
                <View style={styles.addCarIcon}>
                  <Text style={styles.addCarText}>+</Text>
                </View>
                <Text style={styles.addCarLabel}>Add Car</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Comparison Features */}
          <View style={styles.featuresContainer}>
            {filteredFeatures.map((feature) => {
              const bestCarId = getBestValue(feature);

              return (
                <View key={feature.id} style={styles.featureRow}>
                  <View style={styles.featureLabel}>
                    {feature.icon}
                    <Text style={styles.featureLabelText}>{feature.label}</Text>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.featureValuesContainer}
                  >
                    {cars.map((car) => (
                      <View
                        key={car.id}
                        style={[
                          styles.featureValue,
                          bestCarId === car.id && styles.bestValue,
                        ]}
                      >
                        {renderValue(feature, car)}
                        {bestCarId === car.id && (
                          <View style={styles.bestBadge}>
                            <Text style={styles.bestBadgeText}>Best</Text>
                          </View>
                        )}
                      </View>
                    ))}

                    {/* Spacer for add car button */}
                    {cars.length < MAX_CARS && (
                      <View style={styles.featureValueSpacer} />
                    )}
                  </ScrollView>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  title: {
    ...Typography.heading,
    color: Colors.light.text,
  },
  shareButton: {
    padding: Spacing.xs,
  },
  categoryContainer: {
    backgroundColor: Colors.light.surfaceSecondary,
  },
  categoryScrollContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  categoryBadge: {
    marginRight: Spacing.xs,
  },
  scrollContainer: {
    flex: 1,
  },
  carHeadersContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  carHeader: {
    width: CARD_WIDTH,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.md,
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.light.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  carImage: {
    width: '100%',
    height: 120,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  carInfo: {
    gap: 4,
  },
  carTitle: {
    ...Typography.subtitle,
    color: Colors.light.text,
    fontWeight: '600',
  },
  carSubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  carPrice: {
    ...Typography.title,
    color: Colors.light.primary,
    fontWeight: '700',
    marginTop: 4,
  },
  addCarButton: {
    width: CARD_WIDTH,
    height: 200,
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addCarIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCarText: {
    fontSize: 32,
    color: Colors.light.textInverse,
    fontWeight: '300',
  },
  addCarLabel: {
    ...Typography.body,
    color: Colors.light.textSecondary,
  },
  featuresContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  featureRow: {
    marginBottom: Spacing.md,
  },
  featureLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  featureLabelText: {
    ...Typography.body,
    color: Colors.light.text,
    fontWeight: '500',
  },
  featureValuesContainer: {
    gap: Spacing.sm,
  },
  featureValue: {
    width: CARD_WIDTH,
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    position: 'relative',
    minHeight: 50,
    justifyContent: 'center',
  },
  bestValue: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primary + '10',
  },
  valueText: {
    ...Typography.body,
    color: Colors.light.text,
    textAlign: 'center',
  },
  priceText: {
    ...Typography.title,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 2,
  },
  badgeValue: {
    alignSelf: 'center',
  },
  bestBadge: {
    position: 'absolute',
    top: -8,
    right: Spacing.sm,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  bestBadgeText: {
    ...Typography.xs,
    color: Colors.light.textInverse,
    fontWeight: '600',
  },
  featureValueSpacer: {
    width: CARD_WIDTH,
  },
});
