import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useThemeColors } from '@/hooks/useTheme';
import { 
  Car, 
  X, 
  Plus, 
  ArrowRight, 
  Star, 
  DollarSign, 
  Fuel, 
  Gauge, 
  Calendar,
  Shield,
  Award
} from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');

interface ComparisonCar {
  id: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  rating: number;
  imageUrl?: string;
  specs: {
    engine: string;
    fuel: string;
    mileage: number;
    transmission: string;
    safety: number;
    warranty: string;
  };
  features: string[];
  pros: string[];
  cons: string[];
}

interface InteractiveCarComparisonProps {
  onAddCar: () => void;
  onRemoveCar: (carId: string) => void;
  onCarSelect: (carId: string) => void;
  maxComparisons?: number;
}

export const InteractiveCarComparison: React.FC<InteractiveCarComparisonProps> = ({
  onAddCar,
  onRemoveCar,
  onCarSelect,
  maxComparisons = 3,
}) => {
  const { colors } = useThemeColors();
  const styles = getThemedStyles(colors);

  // State
  const [comparisonCars, setComparisonCars] = useState<ComparisonCar[]>([]);
  const [draggedCard, setDraggedCard] = useState<string | null>(null);
  const [highlightedProperty, setHighlightedProperty] = useState<string | null>(null);

  // Animation values
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const highlightAnimation = useRef(new Animated.Value(0)).current;

  // Mock data for demonstration
  const mockCars: ComparisonCar[] = [
    {
      id: '1',
      name: 'BMW 3 Series',
      brand: 'BMW',
      model: '3 Series',
      year: 2024,
      price: 45000,
      rating: 4.7,
      specs: {
        engine: '2.0L Turbo',
        fuel: 'Petrol',
        mileage: 15000,
        transmission: 'Automatic',
        safety: 5,
        warranty: '3 years'
      },
      features: ['Leather Seats', 'Navigation', 'Backup Camera', 'Bluetooth'],
      pros: ['Excellent handling', 'Premium interior', 'Strong resale value'],
      cons: ['High maintenance cost', 'Firm ride quality']
    },
    {
      id: '2',
      name: 'Mercedes C-Class',
      brand: 'Mercedes',
      model: 'C-Class',
      year: 2024,
      price: 48000,
      rating: 4.6,
      specs: {
        engine: '2.0L Turbo',
        fuel: 'Petrol',
        mileage: 12000,
        transmission: 'Automatic',
        safety: 5,
        warranty: '4 years'
      },
      features: ['Leather Seats', 'Navigation', 'Panoramic Roof', 'Premium Audio'],
      pros: ['Luxurious interior', 'Smooth ride', 'Advanced tech'],
      cons: ['Expensive options', 'Complex infotainment']
    },
    {
      id: '3',
      name: 'Audi A4',
      brand: 'Audi',
      model: 'A4',
      year: 2024,
      price: 46500,
      rating: 4.5,
      specs: {
        engine: '2.0L Turbo',
        fuel: 'Petrol',
        mileage: 18000,
        transmission: 'Automatic',
        safety: 5,
        warranty: '4 years'
      },
      features: ['Leather Seats', 'Virtual Cockpit', 'Quattro AWD', 'LED Lights'],
      pros: ['Great AWD system', 'High-tech interior', 'Refined driving'],
      cons: ['Premium fuel required', 'Limited rear space']
    }
  ];

  // Initialize with sample cars
  useEffect(() => {
    setComparisonCars(mockCars.slice(0, 2));
  }, []);

  // Animation effects
  useEffect(() => {
    Animated.spring(slideAnimation, {
      toValue: comparisonCars.length > 0 ? 1 : 0,
      useNativeDriver: true,
    }).start();
  }, [comparisonCars.length, slideAnimation]);

  useEffect(() => {
    if (highlightedProperty) {
      Animated.sequence([
        Animated.timing(highlightAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(highlightAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [highlightedProperty, highlightAnimation]);

  // Handlers
  const handleAddCar = useCallback(() => {
    if (comparisonCars.length < maxComparisons) {
      const availableCars = mockCars.filter(
        car => !comparisonCars.find(c => c.id === car.id)
      );
      if (availableCars.length > 0) {
        setComparisonCars(prev => [...prev, availableCars[0]]);
      }
    }
    onAddCar();
  }, [comparisonCars, maxComparisons, onAddCar]);

  const handleRemoveCar = useCallback((carId: string) => {
    setComparisonCars(prev => prev.filter(car => car.id !== carId));
    onRemoveCar(carId);
  }, [onRemoveCar]);

  const handlePropertyHighlight = useCallback((property: string) => {
    setHighlightedProperty(property);
    setTimeout(() => setHighlightedProperty(null), 1000);
  }, []);

  const getBestValue = useCallback((property: string): string | null => {
    if (comparisonCars.length === 0) return null;

    switch (property) {
      case 'price':
        const cheapest = comparisonCars.reduce((prev, current) => 
          prev.price < current.price ? prev : current
        );
        return cheapest.id;
      case 'rating':
        const highest = comparisonCars.reduce((prev, current) => 
          prev.rating > current.rating ? prev : current
        );
        return highest.id;
      case 'mileage':
        const lowest = comparisonCars.reduce((prev, current) => 
          prev.specs.mileage < current.specs.mileage ? prev : current
        );
        return lowest.id;
      default:
        return null;
    }
  }, [comparisonCars]);

  const renderComparisonHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        <Car size={24} color={colors.primary} />
        <Text style={styles.headerTitle}>Car Comparison</Text>
        <Text style={styles.headerSubtitle}>
          {comparisonCars.length} of {maxComparisons} cars selected
        </Text>
      </View>
      
      {comparisonCars.length < maxComparisons && (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddCar}
          activeOpacity={0.7}
        >
          <Plus size={20} color={colors.background} />
          <Text style={styles.addButtonText}>Add Car</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderCarCard = (car: ComparisonCar, index: number) => {
    const isHighlighted = highlightedProperty !== null;
    const isBestPrice = getBestValue('price') === car.id;
    const isBestRating = getBestValue('rating') === car.id;
    const isBestMileage = getBestValue('mileage') === car.id;

    return (
      <Animated.View
        key={car.id}
        style={[
          styles.carCard,
          {
            transform: [
              {
                translateY: slideAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                })
              }
            ],
            opacity: slideAnimation,
          }
        ]}
      >
        {/* Car Header */}
        <View style={styles.carHeader}>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveCar(car.id)}
            activeOpacity={0.7}
          >
            <X size={16} color={colors.error} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.carTitleContainer}
            onPress={() => onCarSelect(car.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.carTitle}>{car.name}</Text>
            <Text style={styles.carSubtitle}>{car.year}</Text>
          </TouchableOpacity>
        </View>

        {/* Price Section */}
        <TouchableOpacity
          style={[
            styles.propertySection,
            isBestPrice && styles.bestValueSection
          ]}
          onPress={() => handlePropertyHighlight('price')}
          activeOpacity={0.7}
        >
          <View style={styles.propertyHeader}>
            <DollarSign size={16} color={isBestPrice ? colors.success : colors.textSecondary} />
            <Text style={[
              styles.propertyLabel,
              isBestPrice && styles.bestValueLabel
            ]}>Price</Text>
            {isBestPrice && (
              <View style={styles.bestBadge}>
                <Award size={12} color={colors.background} />
              </View>
            )}
          </View>
          <Text style={[
            styles.propertyValue,
            isBestPrice && styles.bestValueText
          ]}>
            €{car.price.toLocaleString()}
          </Text>
        </TouchableOpacity>

        {/* Rating Section */}
        <TouchableOpacity
          style={[
            styles.propertySection,
            isBestRating && styles.bestValueSection
          ]}
          onPress={() => handlePropertyHighlight('rating')}
          activeOpacity={0.7}
        >
          <View style={styles.propertyHeader}>
            <Star size={16} color={isBestRating ? colors.success : colors.textSecondary} />
            <Text style={[
              styles.propertyLabel,
              isBestRating && styles.bestValueLabel
            ]}>Rating</Text>
            {isBestRating && (
              <View style={styles.bestBadge}>
                <Award size={12} color={colors.background} />
              </View>
            )}
          </View>
          <Text style={[
            styles.propertyValue,
            isBestRating && styles.bestValueText
          ]}>
            {car.rating}/5.0
          </Text>
        </TouchableOpacity>

        {/* Specs Sections */}
        <View style={styles.specsContainer}>
          <View style={styles.specItem}>
            <Fuel size={14} color={colors.textSecondary} />
            <Text style={styles.specLabel}>Fuel</Text>
            <Text style={styles.specValue}>{car.specs.fuel}</Text>
          </View>

          <View style={styles.specItem}>
            <Gauge size={14} color={colors.textSecondary} />
            <Text style={styles.specLabel}>Engine</Text>
            <Text style={styles.specValue}>{car.specs.engine}</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.specItem,
              isBestMileage && styles.bestValueSection
            ]}
            onPress={() => handlePropertyHighlight('mileage')}
            activeOpacity={0.7}
          >
            <Calendar size={14} color={isBestMileage ? colors.success : colors.textSecondary} />
            <Text style={[
              styles.specLabel,
              isBestMileage && styles.bestValueLabel
            ]}>Mileage</Text>
            <Text style={[
              styles.specValue,
              isBestMileage && styles.bestValueText
            ]}>
              {car.specs.mileage.toLocaleString()} km
            </Text>
            {isBestMileage && (
              <View style={styles.bestBadge}>
                <Award size={12} color={colors.background} />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.specItem}>
            <Shield size={14} color={colors.textSecondary} />
            <Text style={styles.specLabel}>Safety</Text>
            <Text style={styles.specValue}>{car.specs.safety}/5</Text>
          </View>
        </View>

        {/* Pros and Cons */}
        <View style={styles.prosConsContainer}>
          <View style={styles.prosContainer}>
            <Text style={styles.prosConsTitle}>Pros</Text>
            {car.pros.map((pro, proIndex) => (
              <Text key={proIndex} style={styles.proText}>• {pro}</Text>
            ))}
          </View>

          <View style={styles.consContainer}>
            <Text style={styles.prosConsTitle}>Cons</Text>
            {car.cons.map((con, conIndex) => (
              <Text key={conIndex} style={styles.conText}>• {con}</Text>
            ))}
          </View>
        </View>

        {/* View Details Button */}
        <TouchableOpacity
          style={styles.viewDetailsButton}
          onPress={() => onCarSelect(car.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.viewDetailsText}>View Full Details</Text>
          <ArrowRight size={16} color={colors.primary} />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (comparisonCars.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Car size={48} color={colors.textSecondary} />
        <Text style={styles.emptyTitle}>No Cars to Compare</Text>
        <Text style={styles.emptySubtitle}>
          Add cars to start comparing features, prices, and specifications
        </Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleAddCar}
          activeOpacity={0.7}
        >
          <Plus size={20} color={colors.background} />
          <Text style={styles.startButtonText}>Start Comparison</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderComparisonHeader()}
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        style={styles.scrollView}
      >
        {comparisonCars.map((car, index) => renderCarCard(car, index))}
        
        {comparisonCars.length < maxComparisons && (
          <TouchableOpacity
            style={styles.addCardPlaceholder}
            onPress={handleAddCar}
            activeOpacity={0.7}
          >
            <Plus size={32} color={colors.textSecondary} />
            <Text style={styles.addCardText}>Add Another Car</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  addButtonText: {
    color: colors.background,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
    gap: 16,
  },
  carCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    width: width * 0.8,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  carHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  removeButton: {
    padding: 4,
    backgroundColor: colors.errorLight,
    borderRadius: 12,
  },
  carTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  carTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  carSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  propertySection: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surfaceVariant,
    marginBottom: 8,
    position: 'relative',
  },
  bestValueSection: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.success,
  },
  propertyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  propertyLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  bestValueLabel: {
    color: colors.success,
    fontWeight: '600',
  },
  propertyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  bestValueText: {
    color: colors.success,
  },
  bestBadge: {
    backgroundColor: colors.success,
    borderRadius: 10,
    padding: 2,
  },
  specsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 8,
    gap: 8,
    position: 'relative',
  },
  specLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    minWidth: 60,
  },
  specValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  prosConsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  prosContainer: {
    flex: 1,
  },
  consContainer: {
    flex: 1,
  },
  prosConsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  proText: {
    fontSize: 12,
    color: colors.success,
    marginBottom: 2,
  },
  conText: {
    fontSize: 12,
    color: colors.error,
    marginBottom: 2,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  viewDetailsText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  addCardPlaceholder: {
    width: width * 0.6,
    height: 200,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addCardText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  startButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default InteractiveCarComparison;
