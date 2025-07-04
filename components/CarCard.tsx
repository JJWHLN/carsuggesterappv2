import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin, Clock, Heart, Star, Fuel, Settings } from 'lucide-react-native';
import { OptimizedImage } from './ui/OptimizedImage';
import { AnimatedPressable } from './ui/AnimatedPressable';
import { Card } from './ui/Card'; // Card is now memoized and themed
import { createAccessibilityProps, useAccessibility } from '@/hooks/useAccessibility';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors'; // Removed currentColors
import { useThemeColors } from '@/hooks/useTheme'; // Import useThemeColors
import { Car } from '@/types/database';
import { formatPrice, formatMileage, formatDate, formatCondition, formatFuelType } from '@/utils/dataTransformers';

interface CarCardProps {
  car: Car;
  onPress: () => void;
  showSaveButton?: boolean;
  onSave?: () => void;
  isSaved?: boolean;
}

const CarCard = memo<CarCardProps>(({ 
  car, 
  onPress, 
  showSaveButton = true, 
  onSave, 
  isSaved = false 
}) => {
  const { colors } = useThemeColors();
  const styles = getThemedCarCardStyles(colors);
  const { announceForAccessibility } = useAccessibility();

  const handlePress = () => {
    announceForAccessibility(
      `Selected ${car.year} ${car.make} ${car.model} for ${formatPrice(car.price)}`
    );
    onPress();
  };

  const handleSave = () => {
    announceForAccessibility(
      isSaved ? 'Removed from saved cars' : 'Added to saved cars'
    );
    onSave?.();
  };

  const accessibilityLabel = `${car.year} ${car.make} ${car.model}, ${formatPrice(car.price)}, ${formatMileage(car.mileage)} miles, located in ${car.location}`;

  const imageSource = car.images?.[0] 
    ? { uri: car.images[0] }
    : { uri: 'https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=800' };

  return (
    <AnimatedPressable 
      onPress={handlePress}
      {...createAccessibilityProps(
        accessibilityLabel,
        'Double tap to view car details'
      )}
    >
      <Card style={styles.card}>
        <View style={styles.imageContainer}>
          <OptimizedImage
            source={imageSource}
            style={styles.image}
            accessibilityLabel={`Photo of ${car.year} ${car.make} ${car.model}`}
            fallbackSource={require('@/assets/images/icon.png')} // Use local fallback
          />
          
          {showSaveButton && (
            <AnimatedPressable 
              style={styles.saveButton}
              onPress={handleSave}
              {...createAccessibilityProps(
                isSaved ? 'Remove from saved' : 'Save car',
                isSaved ? 'Double tap to remove from saved cars' : 'Double tap to save this car'
              )}
            >
              <Heart 
                color={isSaved ? colors.error : colors.white} // Use themed error, themed white
                size={20}
                fill={isSaved ? colors.error : 'transparent'} // Use themed error
              />
            </AnimatedPressable>
          )}
          
          {car.dealer?.verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: colors.success }]}>
              <Star color={colors.white} size={12} fill={colors.white} />
              <Text style={[styles.verifiedText, { color: colors.white }]}>Verified</Text>
            </View>
          )}
        </View>
        
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                {car.year} {car.make} {car.model}
              </Text>
              {car.condition && (
                <View style={[styles.conditionBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.conditionText, { color: colors.primary }]}>{formatCondition(car.condition)}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.price, { color: colors.primary }]}>{formatPrice(car.price)}</Text>
          </View>
          
          <View style={styles.details}>
            <View style={styles.detailItem}>
              <Settings color={colors.textSecondary} size={14} />
              <Text style={[styles.detailText, { color: colors.textSecondary }]}>{formatMileage(car.mileage)} mi</Text>
            </View>
            {car.fuel_type && (
              <View style={styles.detailItem}>
                <Fuel color={colors.textSecondary} size={14} />
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>{formatFuelType(car.fuel_type)}</Text>
              </View>
            )}
          </View>

          {car.features && car.features.length > 0 && (
            <View style={styles.features}>
              {car.features.slice(0, 3).map((feature, index) => (
                <View key={index} style={[styles.featureTag, { backgroundColor: colors.surfaceDark }]}>
                  <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
                </View>
              ))}
              {car.features.length > 3 && (
                <Text style={[styles.moreFeatures, { color: colors.primary }]}>+{car.features.length - 3} more</Text>
              )}
            </View>
          )}
          
          <View style={styles.footer}>
            <View style={styles.location}>
              <MapPin color={colors.textSecondary} size={14} />
              <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
                {car.location}
              </Text>
            </View>
            <View style={styles.date}>
              <Clock color={colors.textSecondary} size={14} />
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>{formatDate(car.created_at)}</Text>
            </View>
          </View>

          {car.dealer && (
            <View style={[styles.dealerInfo, { borderTopColor: colors.border }]}>
              <Text style={[styles.dealerName, { color: colors.text }]}>{car.dealer.name}</Text>
              {car.dealer.verified && (
                <Text style={[styles.dealerVerified, { color: colors.success }]}>✓ Verified Dealer</Text>
              )}
            </View>
          )}
        </View>
      </Card>
    </AnimatedPressable>
  );
});

CarCard.displayName = 'CarCard';

const getThemedCarCardStyles = (colors: typeof import('@/constants/Colors').Colors.light) => StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    padding: 0,
    overflow: 'hidden',
    ...Shadows.medium, // Shadows might need theme adjustment if they use hardcoded colors
  },
  imageContainer: {
    position: 'relative',
  },
  image: { // backgroundColor applied inline
    width: '100%',
    height: 220,
  },
  saveButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // This could be themed if needed
    borderRadius: BorderRadius.full,
    padding: Spacing.sm,
  },
  verifiedBadge: { // backgroundColor applied inline
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  verifiedText: { // color applied inline
    ...Typography.caption,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  content: {
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  title: { // color applied inline
    ...Typography.h3,
    flex: 1,
    marginRight: Spacing.sm,
  },
  conditionBadge: { // backgroundColor applied inline
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  conditionText: { // color applied inline
    ...Typography.caption,
    fontWeight: '600',
  },
  price: { // color applied inline
    ...Typography.h2,
    fontWeight: '700',
  },
  details: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: { // color applied inline
    ...Typography.bodySmall,
    marginLeft: Spacing.xs,
    fontWeight: '500',
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  featureTag: { // backgroundColor applied inline
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  featureText: { // color applied inline
    ...Typography.caption,
    fontWeight: '500',
  },
  moreFeatures: { // color applied inline
    ...Typography.caption,
    fontWeight: '600',
    alignSelf: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  locationText: { // color applied inline
    ...Typography.caption,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  date: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: { // color applied inline
    ...Typography.caption,
    marginLeft: Spacing.xs,
  },
  dealerInfo: { // borderTopColor applied inline
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  dealerName: { // color applied inline
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  dealerVerified: { // color applied inline
    ...Typography.caption,
    fontWeight: '600',
  },
});

export { CarCard };