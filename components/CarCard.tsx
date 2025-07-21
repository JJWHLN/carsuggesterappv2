import React, { memo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MapPin, Heart, Star, Settings, Calendar, Fuel, Gauge } from '@/utils/ultra-optimized-icons';
import { OptimizedImage } from './ui/OptimizedImage';
import { createSemanticProps, createListItemProps, useAccessibility } from '@/hooks/useAccessibility';
import { Colors, Spacing, BorderRadius, Typography, Shadows } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useCanPerformAction } from './ui/RoleProtection';
import { BookmarkService } from '@/services/featureServices';
import { Car } from '@/types/database';
import { formatPrice, formatMileage, formatDate, formatCondition, formatFuelType } from '@/utils/dataTransformers';
import { useMemoryOptimization } from '@/hooks/useMemoryOptimization';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - (Spacing.lg * 2); // Full width with margins

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  const { announceForAccessibility } = useAccessibility();
  const { addCleanupFunction } = useMemoryOptimization();
  const [isBookmarked, setIsBookmarked] = useState(isSaved);
  const [loading, setLoading] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Animation values
  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);
  const imageOpacity = useSharedValue(0);

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const heartAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300 });
  }, []);

  const handlePress = useCallback(() => {
    announceForAccessibility(
      `Selected ${car.year} ${car.make} ${car.model} for ${formatPrice(car.price)}`
    );
    onPress();
  }, [car, onPress]);

  const handleBookmark = useCallback(async () => {
    if (!user || !canBookmark) {
      announceForAccessibility('Please sign in to bookmark cars');
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      
      // Animate heart
      heartScale.value = withSpring(1.3, { damping: 10, stiffness: 300 }, () => {
        heartScale.value = withSpring(1, { damping: 15, stiffness: 300 });
      });
      
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
      console.error('Error toggling bookmark:', error);
      announceForAccessibility('Failed to update bookmark');
    } finally {
      setLoading(false);
    }
  }, [user, canBookmark, isBookmarked, carModelId, vehicleListingId, onSave, loading]);

  const onImageLoad = useCallback(() => {
    setImageLoaded(true);
    imageOpacity.value = withTiming(1, { duration: 300 });
  }, []);

  // Calculate condition color
  const getConditionColor = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case 'new': return colors.success;
      case 'excellent': return colors.primary;
      case 'good': return colors.info;
      case 'fair': return colors.warning;
      default: return colors.textMuted;
    }
  };

  // Format car age
  const getCarAge = () => {
    const currentYear = new Date().getFullYear();
    const age = currentYear - car.year;
    return age === 0 ? 'New' : `${age}y`;
  };

  const accessibilityLabel = `${car.year} ${car.make} ${car.model}, ${formatPrice(car.price)}, ${formatMileage(car.mileage)} miles, located in ${car.location}`;
  const accessibilityHint = `Double tap to view detailed information and photos for this ${car.year} ${car.make} ${car.model}`;
  
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
    : { uri: 'https://via.placeholder.com/400x250/e8f7ed/48cc6c?text=Car+Image' };

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
      style={[styles.container, cardAnimatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      testID={testID}
      {...cardAccessibilityProps}
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
      {/* Modern Card Container */}
      <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
        
        {/* Image Container */}
        <View style={styles.imageContainer}>
          <OptimizedImage
            source={imageSource}
            style={styles.image}
            onLoad={onImageLoad}
            accessibilityLabel={`Photo of ${car.year} ${car.make} ${car.model}`}
            fallbackSource={require('@/assets/images/icon.png')}
            quality="medium"
            lazy={true}
            priority="normal"
            cacheKey={`car_${car.id || car.year}_${car.make}_${car.model}`}
          />
          
          {/* Condition Badge */}
          {car.condition && (
            <View style={[styles.conditionBadge, { backgroundColor: getConditionColor(car.condition) }]}>
              <Text style={styles.conditionBadgeText}>{formatCondition(car.condition)}</Text>
            </View>
          )}

          {/* Save Button */}
          {showSaveButton && canBookmark && (
            <AnimatedPressable
              style={[styles.saveButton, heartAnimatedStyle, loading && styles.saveButtonDisabled]}
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
              <View style={[styles.saveButtonInner, { backgroundColor: colors.white }]}>
                <Heart 
                  size={16} 
                  color={isBookmarked ? colors.error : colors.textMuted}
                  fill={isBookmarked ? colors.error : 'transparent'}
                />
              </View>
            </AnimatedPressable>
          )}

          {/* Verified Badge */}
          {car.dealer?.verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: colors.success }]}>
              <Star color={colors.white} size={12} fill={colors.white} />
              <Text style={[styles.verifiedText, { color: colors.white }]}>Verified</Text>
            </View>
          )}

          {/* Image Loading Gradient */}
          {!imageLoaded && (
            <LinearGradient
              colors={['rgba(232, 247, 237, 0.8)', 'rgba(232, 247, 237, 0.4)']}
              style={styles.imageOverlay}
            />
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          
          {/* Header - Title and Price */}
          <View style={styles.header}>
            <Text 
              style={[styles.title, { color: colors.text }]} 
              numberOfLines={1}
              accessibilityRole="header"
            >
              {car.year} {car.make} {car.model}
            </Text>
            <Text 
              style={[styles.price, { color: colors.text }]}
              accessibilityLabel={`Price: ${formatPrice(car.price)}`}
            >
              {formatPrice(car.price)}
            </Text>
          </View>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
            {car.description || `${car.make} ${car.model}`}
          </Text>

          {/* Specs Row */}
          <View style={styles.specsRow}>
            <View style={styles.specItem}>
              <Gauge size={12} color={colors.textMuted} />
              <Text style={[styles.specText, { color: colors.textMuted }]}>
                {formatMileage(car.mileage)}
              </Text>
            </View>
            
            <View style={styles.specItem}>
              <Calendar size={12} color={colors.textMuted} />
              <Text style={[styles.specText, { color: colors.textMuted }]}>
                {getCarAge()}
              </Text>
            </View>
            
            {car.fuel_type && (
              <View style={styles.specItem}>
                <Fuel size={12} color={colors.textMuted} />
                <Text style={[styles.specText, { color: colors.textMuted }]}>
                  {formatFuelType(car.fuel_type)}
                </Text>
              </View>
            )}
          </View>

          {/* Features */}
          {car.features && car.features.length > 0 && (
            <View style={styles.features}>
              {car.features.slice(0, 3).map((feature, index) => (
                <View key={index} style={[styles.featureTag, { backgroundColor: colors.neutral100 }]}>
                  <Text style={[styles.featureText, { color: colors.textSecondary }]}>{feature}</Text>
                </View>
              ))}
              {car.features.length > 3 && (
                <Text style={[styles.moreFeatures, { color: colors.primary }]}>+{car.features.length - 3} more</Text>
              )}
            </View>
          )}
          
          {/* Footer - Location and Date */}
          <View style={styles.footer}>
            <View style={styles.location}>
              <MapPin color={colors.textMuted} size={12} />
              <Text style={[styles.locationText, { color: colors.textMuted }]} numberOfLines={1}>
                {car.location}
              </Text>
            </View>
            
            {/* Rating if available */}
            {car.rating && (
              <View style={styles.ratingContainer}>
                <Star size={12} color={colors.warning} fill={colors.warning} />
                <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                  {car.rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          {/* Dealer Info */}
          {car.dealer && (
            <View style={[styles.dealerInfo, { borderTopColor: colors.border }]}>
              <Text style={[styles.dealerName, { color: colors.text }]}>{car.dealer.name}</Text>
              {car.dealer.verified && (
                <Text style={[styles.dealerVerified, { color: colors.success }]}>✓ Verified Dealer</Text>
              )}
            </View>
          )}
        </View>
      </View>
    </AnimatedPressable>
  );
});

CarCard.displayName = 'CarCard';

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    ...Shadows.card,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: Colors.light.primaryLight,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  conditionBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  conditionBadgeText: {
    ...Typography.xs,
    color: Colors.light.white,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  saveButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  saveButtonInner: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  verifiedText: {
    ...Typography.xs,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    ...Typography.subtitle,
    flex: 1,
    marginRight: Spacing.sm,
  },
  price: {
    ...Typography.lg,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.sm,
    marginBottom: Spacing.sm,
  },
  specsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  specText: {
    ...Typography.xs,
    marginLeft: 4,
    flex: 1,
  },
  features: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  featureTag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  featureText: {
    ...Typography.xs,
    fontWeight: '500',
  },
  moreFeatures: {
    ...Typography.xs,
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
  locationText: {
    ...Typography.xs,
    marginLeft: 4,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...Typography.xs,
    marginLeft: 2,
    fontWeight: '500',
  },
  dealerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
  },
  dealerName: {
    ...Typography.sm,
    fontWeight: '600',
  },
  dealerVerified: {
    ...Typography.xs,
    fontWeight: '600',
  },
});

export { CarCard };