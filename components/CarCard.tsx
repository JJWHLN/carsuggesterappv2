import React, { memo, useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin, Heart, Star, Settings } from '@/utils/ultra-optimized-icons';
import { Clock, Fuel } from '@/utils/ultra-optimized-icons';
import { OptimizedImage } from './ui/OptimizedImage';
import { AnimatedPressable } from './ui/AnimatedPressable';
import { Card } from './ui/Card'; // Card is now memoized and themed
import { createSemanticProps, createListItemProps, useAccessibility } from '@/hooks/useAccessibility';
import { Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors'; // Removed currentColors
import { useThemeColors } from '@/hooks/useTheme'; // Import useThemeColors
import { useAuth } from '@/contexts/AuthContext';
import { useCanPerformAction } from './ui/RoleProtection';
import { BookmarkService } from '@/services/featureServices';
import { Car } from '@/types/database';
import { formatPrice, formatMileage, formatDate, formatCondition, formatFuelType } from '@/utils/dataTransformers';
import { useMemoryOptimization } from '@/hooks/useMemoryOptimization';

interface CarCardProps {
  car: Car;
  onPress: () => void;
  showSaveButton?: boolean;
  onSave?: () => void;
  isSaved?: boolean;
  carModelId?: number;
  vehicleListingId?: string;
  position?: { setIndex: number; setSize: number };
  testID?: string;
}

const CarCard = memo<CarCardProps>(({ 
  car, 
  onPress, 
  showSaveButton = true, 
  onSave, 
  isSaved = false,
  carModelId,
  vehicleListingId,
  position,
  testID
}) => {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const canBookmark = useCanPerformAction('bookmarkCars');
  const styles = getThemedCarCardStyles(colors);
  const { announceForAccessibility } = useAccessibility();
  const { addCleanupFunction } = useMemoryOptimization();
  const [isBookmarked, setIsBookmarked] = useState(isSaved);
  const [loading, setLoading] = useState(false);

  const handlePress = () => {
    announceForAccessibility(
      `Selected ${car.year} ${car.make} ${car.model} for ${formatPrice(car.price)}`
    );
    onPress();
  };

  const handleBookmark = useCallback(async () => {
    if (!user || !canBookmark) {
      announceForAccessibility('Please sign in to bookmark cars');
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      
      const target = carModelId ? { carModelId } : { vehicleListingId };
      
      if (isBookmarked) {
        await BookmarkService.removeBookmark(user.id, target);
        setIsBookmarked(false);
        announceForAccessibility('Removed from saved cars');
      } else {
        await BookmarkService.addBookmark(user.id, target);
        setIsBookmarked(true);
        announceForAccessibility('Added to saved cars');
      }
      
      onSave?.();
    } catch (error) {
      logger.error('Error toggling bookmark:', error);
      announceForAccessibility('Failed to update bookmark');
    } finally {
      setLoading(false);
    }
  }, [user, canBookmark, isBookmarked, carModelId, vehicleListingId, onSave, loading]);

  const accessibilityLabel = `${car.year} ${car.make} ${car.model}, ${formatPrice(car.price)}, ${formatMileage(car.mileage)} miles, located in ${car.location}`;
  const accessibilityHint = `Double tap to view detailed information and photos for this ${car.year} ${car.make} ${car.model}`;
  
  // Build descriptive value for screen readers
  const accessibilityValue = [
    `Price: ${formatPrice(car.price)}`,
    `Mileage: ${formatMileage(car.mileage)} miles`,
    car.condition && `Condition: ${formatCondition(car.condition)}`,
    car.fuel_type && `Fuel type: ${formatFuelType(car.fuel_type)}`,
    car.dealer?.verified && 'Verified dealer',
    car.features && car.features.length > 0 && `${car.features.length} features available`,
  ].filter(Boolean).join(', ');

  const imageSource = car.images?.[0] 
    ? { uri: car.images[0] }
    : { uri: 'https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=800' };

  // Create appropriate accessibility props based on whether position is provided
  const cardAccessibilityProps = position 
    ? createListItemProps(accessibilityLabel, position, {
        hint: accessibilityHint,
      })
    : createSemanticProps(accessibilityLabel, 'button', {
        hint: accessibilityHint,
        value: accessibilityValue,
      });

  return (
    <AnimatedPressable 
      onPress={handlePress}
      testID={testID}
      {...cardAccessibilityProps}
      // Additional accessibility enhancements
      accessibilityActions={[
        { name: 'activate', label: 'View car details' },
        ...(showSaveButton && canBookmark ? [
          { 
            name: 'magicTap', 
            label: isBookmarked ? 'Remove from saved' : 'Save car' 
          }
        ] : [])
      ]}
      onAccessibilityAction={(event) => {
        switch (event.nativeEvent.actionName) {
          case 'activate':
            handlePress();
            break;
          case 'magicTap':
            if (showSaveButton && canBookmark) {
              handleBookmark();
            }
            break;
        }
      }}
    >
      <Card style={styles.card}>
        <View style={styles.imageContainer}>
          <OptimizedImage
            source={imageSource}
            style={styles.image}
            accessibilityLabel={`Photo of ${car.year} ${car.make} ${car.model}`}
            fallbackSource={require('@/assets/images/icon.png')} // Use local fallback
            quality="medium" // Optimize for balance between quality and performance
            lazy={true} // Enable lazy loading for better performance
            priority="normal" // Normal loading priority for list items
            cacheKey={`car_${car.id || car.year}_${car.make}_${car.model}`} // Unique cache key
          />
          
          {showSaveButton && canBookmark && (
            <AnimatedPressable 
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleBookmark}
              disabled={loading}
              testID={testID ? `${testID}-bookmark` : undefined}
              {...createSemanticProps(
                isBookmarked ? 'Remove from saved cars' : 'Save this car',
                'button',
                {
                  hint: isBookmarked 
                    ? 'Double tap to remove this car from your saved list' 
                    : 'Double tap to add this car to your saved list',
                  disabled: loading,
                  busy: loading,
                }
              )}
            >
              <Heart 
                color={isBookmarked ? colors.error : colors.white} // Use themed error, themed white
                size={20}
                fill={isBookmarked ? colors.error : 'transparent'} // Use themed error
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
              <Text 
                style={[styles.title, { color: colors.text }]} 
                numberOfLines={1}
                accessibilityRole="header"
              >
                {car.year} {car.make} {car.model}
              </Text>
              {car.condition && (
                <View 
                  style={[styles.conditionBadge, { backgroundColor: colors.primaryLight }]}
                  accessibilityLabel={`Condition: ${formatCondition(car.condition)}`}
                  accessibilityRole="text"
                >
                  <Text style={[styles.conditionText, { color: colors.primary }]}>{formatCondition(car.condition)}</Text>
                </View>
              )}
            </View>
            <Text 
              style={[styles.price, { color: colors.primary }]}
              accessibilityLabel={`Price: ${formatPrice(car.price)}`}
              accessibilityRole="text"
            >
              {formatPrice(car.price)}
            </Text>
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
    ...ColorsShadows.medium, // Shadows might need theme adjustment if they use hardcoded colors
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
  saveButtonDisabled: {
    opacity: 0.6,
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