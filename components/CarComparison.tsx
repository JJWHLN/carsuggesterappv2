import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@/components/ui/Button';
import { ModernButton } from '@/components/ui/ModernButton';
import { Card } from '@/components/ui/Card';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Spacing, Typography, BorderRadius } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import { Car as CarType } from '@/types/database';
import {
  formatPrice,
  formatMileage,
  formatCondition,
  formatFuelType,
} from '@/utils/dataTransformers';
import {
  X,
  Star,
  Gauge,
  Fuel,
  Settings,
  Calendar,
  MapPin,
  DollarSign,
  CheckCircle,
  TrendingUp,
  Award,
  Shield,
  Zap,
  Share,
} from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');

interface CarComparisonProps {
  visible: boolean;
  onClose: () => void;
  cars: CarType[];
  onRemoveCar: (carId: string) => void;
  onAddCar: () => void;
}

interface ComparisonItem {
  key: string;
  label: string;
  getValue: (car: CarType) => string | number;
  type: 'text' | 'price' | 'number' | 'rating';
  icon?: React.ReactNode;
  highlightBest?: boolean;
}

export default function CarComparison({
  visible,
  onClose,
  cars,
  onRemoveCar,
  onAddCar,
}: CarComparisonProps) {
  const { colors } = useThemeColors();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    performance: true,
    features: false,
    financial: true,
  });

  const styles = useMemo(() => getStyles(colors), [colors]);

  const comparisonItems: ComparisonItem[] = [
    // Overview
    {
      key: 'year',
      label: 'Year',
      getValue: (car) => car.year,
      type: 'number',
      icon: <Calendar color={colors.primary} size={16} />,
      highlightBest: true,
    },
    {
      key: 'make_model',
      label: 'Make & Model',
      getValue: (car) => `${car.make} ${car.model}`,
      type: 'text',
    },
    {
      key: 'condition',
      label: 'Condition',
      getValue: (car) => formatCondition(car.condition || 'used'),
      type: 'text',
    },
    {
      key: 'location',
      label: 'Location',
      getValue: (car) => car.location || 'Not specified',
      type: 'text',
      icon: <MapPin color={colors.primary} size={16} />,
    },
    
    // Financial
    {
      key: 'price',
      label: 'Price',
      getValue: (car) => car.price,
      type: 'price',
      icon: <DollarSign color={colors.primary} size={16} />,
      highlightBest: true,
    },
    
    // Performance
    {
      key: 'mileage',
      label: 'Mileage',
      getValue: (car) => car.mileage,
      type: 'number',
      icon: <Gauge color={colors.primary} size={16} />,
      highlightBest: true,
    },
    {
      key: 'fuel_type',
      label: 'Fuel Type',
      getValue: (car) => formatFuelType(car.fuel_type || 'gasoline'),
      type: 'text',
      icon: <Fuel color={colors.primary} size={16} />,
    },
    {
      key: 'transmission',
      label: 'Transmission',
      getValue: (car) => car.transmission || 'Automatic',
      type: 'text',
      icon: <Settings color={colors.primary} size={16} />,
    },
  ];

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const getBestValueIndex = (item: ComparisonItem): number => {
    if (!item.highlightBest || cars.length === 0) return -1;

    if (item.type === 'price') {
      // For price, lowest is best
      const prices = cars.map(car => item.getValue(car) as number);
      const minPrice = Math.min(...prices);
      return prices.findIndex(price => price === minPrice);
    }

    if (item.type === 'number') {
      if (item.key === 'year') {
        // For year, newer is better
        const years = cars.map(car => item.getValue(car) as number);
        const maxYear = Math.max(...years);
        return years.findIndex(year => year === maxYear);
      }
      
      if (item.key === 'mileage') {
        // For mileage, lower is better
        const mileages = cars.map(car => item.getValue(car) as number);
        const minMileage = Math.min(...mileages);
        return mileages.findIndex(mileage => mileage === minMileage);
      }
    }

    return -1;
  };

  const formatValue = (item: ComparisonItem, car: CarType): string => {
    const value = item.getValue(car);
    
    switch (item.type) {
      case 'price':
        return formatPrice(value as number);
      case 'number':
        if (item.key === 'mileage') {
          return formatMileage(value as number);
        }
        return value.toString();
      default:
        return value.toString();
    }
  };

  const renderCarHeader = (car: CarType, index: number) => (
    <View key={car.id} style={styles.carHeader}>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => onRemoveCar(car.id)}
      >
        <X color={colors.error} size={20} />
      </TouchableOpacity>

      <OptimizedImage
        source={{ uri: car.images?.[0] || 'https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=400' }}
        style={styles.carImage}
        resizeMode="cover"
        fallbackSource={require('@/assets/images/icon.png')}
      />

      <View style={styles.carInfo}>
        <Text style={[styles.carTitle, { color: colors.text }]} numberOfLines={1}>
          {car.year} {car.make}
        </Text>
        <Text style={[styles.carSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
          {car.model}
        </Text>
        <Text style={[styles.carPrice, { color: colors.primary }]}>
          {formatPrice(car.price)}
        </Text>
      </View>
    </View>
  );

  const renderAddCarButton = () => (
    <TouchableOpacity style={styles.addCarButton} onPress={onAddCar}>
      <View style={[styles.addCarContent, { borderColor: colors.border }]}>
        <View style={[styles.addCarIcon, { backgroundColor: colors.primary }]}>
          <Text style={styles.addCarIconText}>+</Text>
        </View>
        <Text style={[styles.addCarText, { color: colors.textSecondary }]}>
          Add Car
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderComparisonRow = (item: ComparisonItem) => {
    const bestIndex = getBestValueIndex(item);

    return (
      <View key={item.key} style={styles.comparisonRow}>
        <View style={[styles.rowLabel, { borderRightColor: colors.border }]}>
          <View style={styles.rowLabelContent}>
            {item.icon}
            <Text style={[styles.rowLabelText, { color: colors.text }]}>
              {item.label}
            </Text>
          </View>
        </View>

        {cars.map((car, index) => (
          <View
            key={car.id}
            style={[
              styles.rowValue,
              {
                backgroundColor: bestIndex === index ? colors.primaryLight : 'transparent',
                borderRightColor: colors.border,
              }
            ]}
          >
            <Text style={[
              styles.rowValueText,
              {
                color: bestIndex === index ? colors.success : colors.text,
                fontWeight: bestIndex === index ? '700' : '500',
              }
            ]}>
              {formatValue(item, car)}
            </Text>
            {bestIndex === index && (
              <Award color={colors.success} size={14} />
            )}
          </View>
        ))}

        {/* Add empty cell for "Add Car" column */}
        {cars.length < 3 && (
          <View style={[styles.rowValue, { borderRightColor: colors.border }]} />
        )}
      </View>
    );
  };

  const renderSection = (title: string, key: string, items: ComparisonItem[]) => {
    const isExpanded = expandedSections[key];

    return (
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(key)}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {title}
          </Text>
          <Text style={[styles.sectionToggle, { color: colors.primary }]}>
            {isExpanded ? '−' : '+'}
          </Text>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            {items.map(renderComparisonRow)}
          </View>
        )}
      </View>
    );
  };

  const renderWinner = () => {
    if (cars.length < 2) return null;

    // Calculate scores for each car
    const scores = cars.map((car, carIndex) => {
      let score = 0;
      let totalComparisons = 0;

      comparisonItems.forEach(item => {
        if (!item.highlightBest) return;

        const bestIndex = getBestValueIndex(item);
        if (bestIndex === carIndex) {
          score += 1;
        }
        totalComparisons += 1;
      });

      return {
        car,
        score,
        percentage: totalComparisons > 0 ? (score / totalComparisons) * 100 : 0,
      };
    });

    const winner = scores.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    return (
      <Card style={styles.winnerCard}>
        <View style={styles.winnerHeader}>
          <Award color={colors.primary} size={24} />
          <Text style={[styles.winnerTitle, { color: colors.text }]}>
            Best Overall Value
          </Text>
        </View>

        <View style={styles.winnerContent}>
          <Text style={[styles.winnerCarName, { color: colors.primary }]}>
            {winner.car.year} {winner.car.make} {winner.car.model}
          </Text>
          <Text style={[styles.winnerScore, { color: colors.textSecondary }]}>
            Wins {winner.score} out of {comparisonItems.filter(item => item.highlightBest).length} categories
          </Text>
          <Text style={[styles.winnerPrice, { color: colors.text }]}>
            {formatPrice(winner.car.price)}
          </Text>
        </View>
      </Card>
    );
  };

  if (cars.length === 0) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Car Comparison
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
              No Cars to Compare
            </Text>
            <Text style={[styles.emptyStateMessage, { color: colors.textSecondary }]}>
              Add cars from your favorites or search results to start comparing.
            </Text>
            <Button
              title="Add Cars"
              onPress={onAddCar}
              variant="primary"
              style={styles.emptyStateButton}
            />
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Compare Cars ({cars.length})
          </Text>
          <TouchableOpacity onPress={onClose}>
            <X color={colors.text} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Car Headers */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.headerRow}>
              <View style={styles.labelColumn}>
                <Text style={[styles.columnLabel, { color: colors.textSecondary }]}>
                  Comparison
                </Text>
              </View>

              {cars.map(renderCarHeader)}

              {cars.length < 3 && renderAddCarButton()}
            </View>
          </ScrollView>

          {/* Winner Card */}
          {renderWinner()}

          {/* Comparison Sections */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.comparisonTable}>
              {renderSection('Overview', 'overview', comparisonItems.slice(0, 4))}
              {renderSection('Financial', 'financial', comparisonItems.slice(4, 5))}
              {renderSection('Performance', 'performance', comparisonItems.slice(5, 8))}
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title="Share Comparison"
              onPress={() => {
                // TODO: Implement share functionality
                Alert.alert('Feature Coming Soon', 'Share comparison functionality will be available soon.');
              }}
              variant="secondary"
              style={styles.actionButton}
            />
            
            <Button
              title="Save Comparison"
              onPress={() => {
                // TODO: Implement save functionality
                Alert.alert('Feature Coming Soon', 'Save comparison functionality will be available soon.');
              }}
              variant="primary"
              style={styles.actionButton}
            />
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  labelColumn: {
    width: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  columnLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  carHeader: {
    width: 160,
    marginRight: Spacing.md,
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 2,
  },
  carImage: {
    width: '100%',
    height: 100,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  carInfo: {
    alignItems: 'center',
  },
  carTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  carSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  carPrice: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  addCarButton: {
    width: 160,
  },
  addCarContent: {
    height: 140,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  addCarIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCarIconText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  addCarText: {
    fontSize: 14,
    fontWeight: '600',
  },
  winnerCard: {
    margin: Spacing.lg,
    padding: Spacing.lg,
  },
  winnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  winnerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  winnerContent: {
    alignItems: 'center',
    gap: 4,
  },
  winnerCarName: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  winnerScore: {
    fontSize: 14,
    textAlign: 'center',
  },
  winnerPrice: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 4,
  },
  comparisonTable: {
    paddingHorizontal: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionToggle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionContent: {
    gap: 1,
  },
  comparisonRow: {
    flexDirection: 'row',
    minHeight: 44,
  },
  rowLabel: {
    width: 120,
    padding: Spacing.sm,
    borderRightWidth: 1,
    justifyContent: 'center',
  },
  rowLabelContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  rowLabelText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  rowValue: {
    width: 160,
    padding: Spacing.sm,
    borderRightWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  rowValueText: {
    fontSize: 14,
    textAlign: 'center',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  actionButton: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyStateButton: {
    minWidth: 200,
  },
  bottomSpacing: {
    height: 40,
  },
});
