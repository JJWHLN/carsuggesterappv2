import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';

import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Button } from '@/components/ui/Button';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import {
  ArrowRight,
  MapPin,
  Fuel,
  Clock,
  Star,
  Heart,
} from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  location: string;
  images: string[];
  features?: string[];
  dealer?: {
    name: string;
    verified: boolean;
  };
}

interface FeaturedCarsProps {
  cars: Car[];
  loading: boolean;
  onViewAll: () => void;
  onCarPress: (carId: string) => void;
}

export const FeaturedCars: React.FC<FeaturedCarsProps> = ({
  cars,
  loading,
  onViewAll,
  onCarPress,
}) => {
  const { colors } = useThemeColors();

  const formatPrice = (price: number): string => {
    if (price === 0) return 'Price on Request';
    return `$${price.toLocaleString()}`;
  };

  const formatMileage = (mileage: number): string => {
    if (mileage === 0) return 'New';
    return `${mileage.toLocaleString()} mi`;
  };

  const CarCard: React.FC<{ car: Car }> = ({ car }) => (
    <TouchableOpacity
      style={[
        styles.carCard,
        { backgroundColor: colors.white, borderColor: colors.border },
      ]}
      onPress={() => onCarPress(car.id)}
      activeOpacity={0.9}
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        <OptimizedImage
          source={{
            uri:
              car.images[0] ||
              'https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=400',
          }}
          style={styles.carImage}
          resizeMode="cover"
        />

        {/* Overlay Elements */}
        <View style={styles.imageOverlay}>
          {/* Heart Icon */}
          <TouchableOpacity style={styles.heartButton}>
            <Heart color="#FFFFFF" size={18} />
          </TouchableOpacity>

          {/* Price Badge */}
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{formatPrice(car.price)}</Text>
          </View>
        </View>

        {/* Dealer Badge */}
        {car.dealer?.verified && (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ Verified</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.cardContent}>
        {/* Title */}
        <Text
          style={[styles.carTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {car.year} {car.make} {car.model}
        </Text>

        {/* Details Row */}
        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Fuel color={colors.textSecondary} size={14} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {formatMileage(car.mileage)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <MapPin color={colors.textSecondary} size={14} />
            <Text
              style={[styles.detailText, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {car.location}
            </Text>
          </View>
        </View>

        {/* Features */}
        {car.features && car.features.length > 0 && (
          <View style={styles.featuresRow}>
            {car.features.slice(0, 2).map((feature, index) => (
              <View
                key={index}
                style={[
                  styles.featureChip,
                  { backgroundColor: colors.primaryLight },
                ]}
              >
                <Text style={[styles.featureText, { color: colors.primary }]}>
                  {feature}
                </Text>
              </View>
            ))}
            {car.features.length > 2 && (
              <Text
                style={[styles.moreFeatures, { color: colors.textSecondary }]}
              >
                +{car.features.length - 2} more
              </Text>
            )}
          </View>
        )}

        {/* Dealer Info */}
        {car.dealer && (
          <View style={styles.dealerInfo}>
            <Text style={[styles.dealerName, { color: colors.textSecondary }]}>
              Listed by {car.dealer.name}
            </Text>
            {car.dealer.verified && (
              <View style={styles.dealerBadge}>
                <Star color="#F59E0B" size={12} fill="#F59E0B" />
                <Text style={styles.ratingText}>4.8</Text>
              </View>
            )}
          </View>
        )}

        {/* Action Button */}
        <Button
          title="View Details"
          onPress={() => onCarPress(car.id)}
          variant="primary"
          style={styles.viewButton}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Featured Cars
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Hand-picked recommendations just for you
          </Text>
        </View>
        <TouchableOpacity
          onPress={onViewAll}
          style={styles.viewAllButton}
          activeOpacity={0.8}
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>
            View All
          </Text>
          <ArrowRight color={colors.primary} size={16} />
        </TouchableOpacity>
      </View>

      {/* Cars Horizontal Scroll */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading featured cars...
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carsScroll}
          decelerationRate="fast"
          snapToInterval={width * 0.75 + Spacing.md}
          snapToAlignment="start"
        >
          {cars.map((car, index) => (
            <View
              key={car.id}
              style={[styles.carCardWrapper, index === 0 && styles.firstCard]}
            >
              <CarCard car={car} />
            </View>
          ))}

          {/* View All Card */}
          <TouchableOpacity
            style={[
              styles.viewAllCard,
              {
                backgroundColor: colors.primaryLight,
                borderColor: colors.primary,
              },
            ]}
            onPress={onViewAll}
            activeOpacity={0.8}
          >
            <View style={styles.viewAllContent}>
              <Text
                style={[styles.viewAllCardTitle, { color: colors.primary }]}
              >
                View All Cars
              </Text>
              <Text style={[styles.viewAllCardText, { color: colors.primary }]}>
                Explore our complete collection of {cars.length * 10}+ vehicles
              </Text>
              <View
                style={[
                  styles.viewAllCardIcon,
                  { backgroundColor: colors.primary },
                ]}
              >
                <ArrowRight color="#FFFFFF" size={24} />
              </View>
            </View>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.sectionTitle,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyText,
    lineHeight: 22,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  viewAllText: {
    ...Typography.bodyText,
    fontWeight: '600',
  },
  carsScroll: {
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.md,
  },
  carCardWrapper: {
    marginRight: Spacing.md,
  },
  firstCard: {
    // No additional margin for first card
  },
  carCard: {
    width: width * 0.75,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.card,
  },
  imageContainer: {
    position: 'relative',
    height: 180,
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  heartButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: Spacing.sm,
  },
  priceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(34, 197, 94, 0.95)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  priceText: {
    ...Typography.bodyText,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    backgroundColor: 'rgba(59, 130, 246, 0.95)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  verifiedText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardContent: {
    padding: Spacing.lg,
  },
  carTitle: {
    ...Typography.cardTitle,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  detailText: {
    ...Typography.caption,
    flex: 1,
  },
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  featureChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  featureText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  moreFeatures: {
    ...Typography.caption,
  },
  dealerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dealerName: {
    ...Typography.caption,
    flex: 1,
  },
  dealerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ratingText: {
    ...Typography.caption,
    fontWeight: '600',
    color: '#F59E0B',
  },
  viewButton: {
    paddingVertical: Spacing.sm,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.bodyText,
  },
  viewAllCard: {
    width: width * 0.6,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    minHeight: 320,
  },
  viewAllContent: {
    alignItems: 'center',
  },
  viewAllCardTitle: {
    ...Typography.cardTitle,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  viewAllCardText: {
    ...Typography.caption,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  viewAllCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
