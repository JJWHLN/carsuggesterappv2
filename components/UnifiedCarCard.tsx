/**
 * UnifiedCarCard - Production-Ready Car Card Component
 * 
 * Consolidates multiple CarCard implementations into one optimized component.
 * This is Phase 1 Week 4 - Performance Optimization and Component Consolidation.
 * 
 * FIXES:
 * - Component duplication (CarCard.tsx + ui/CarCard.tsx)
 * - Inconsistent styling and features
 * - Performance issues with multiple implementations
 * - Memory optimization with proper cleanup
 */

import React, { memo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useThemeColors } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useMemoryOptimization } from '@/hooks/useMemoryOptimization';
import { OptimizedImage } from './ui/OptimizedImage';
import { AnimatedPressable } from './ui/AnimatedPressable';
import { Spacing, Typography, BorderRadius } from '@/constants/Colors';
import { formatPrice, formatMileage, formatDate } from '@/utils/formatters';
import { NavigationService } from '@/services/NavigationService';
import { realNotificationService } from '@/services/RealNotificationServiceSimplified';

// Simple icon components as fallbacks
const Heart = ({ size = 24, color = '#000', filled = false }: { size?: number; color?: string; filled?: boolean }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: size * 0.8, color }}>{filled ? '❤️' : '🤍'}</Text>
  </View>
);

const MapPin = ({ size = 24, color = '#000' }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: size * 0.8, color }}>📍</Text>
  </View>
);

const Star = ({ size = 24, color = '#000' }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: size * 0.8, color }}>⭐</Text>
  </View>
);

const Clock = ({ size = 24, color = '#000' }: { size?: number; color?: string }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <Text style={{ fontSize: size * 0.8, color }}>🕐</Text>
  </View>
);

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.lg * 3) / 2;
const CARD_HEIGHT = 320;
const IMAGE_HEIGHT = 180;

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  location?: string;
  images?: string[];
  image_url?: string;
  isSaved?: boolean;
  dealer?: {
    name: string;
    verified?: boolean;
  };
  rating?: number;
  features?: string[];
  condition?: string;
  fuel_type?: string;
  created_at?: string;
}

interface UnifiedCarCardProps {
  car: Car;
  onPress?: () => void;
  onSaveToggle?: (carId: string) => void;
  showSaveButton?: boolean;
  variant?: 'grid' | 'list';
  style?: any;
  testID?: string;
  position?: { setIndex: number; setSize: number };
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const UnifiedCarCard = memo<UnifiedCarCardProps>(({ 
  car, 
  onPress, 
  onSaveToggle, 
  showSaveButton = true, 
  variant = 'grid',
  style,
  testID,
  position
}) => {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const { addCleanupFunction } = useMemoryOptimization();
  const styles = getThemedStyles(colors, variant);
  
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(car.isSaved || false);
  const [loading, setLoading] = useState(false);
  
  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);
  const imageOpacity = useSharedValue(0);

  // Animations
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  // Memory cleanup
  useEffect(() => {
    addCleanupFunction(() => {
      // Cleanup any pending animations or timers
      scale.value = 1;
      heartScale.value = 1;
      imageOpacity.value = 0;
    });
  }, [addCleanupFunction]);

  // Animation handlers
  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15 });
  }, []);

  // Navigation handler
  const handlePress = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    if (onPress) {
      onPress();
    } else {
      // Default navigation to car detail
      NavigationService.navigateToCar(car.id);
    }
  }, [onPress, car.id]);

  // Save/bookmark handler
  const handleSaveToggle = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    heartScale.value = withSpring(1.2, { damping: 10 }, () => {
      heartScale.value = withSpring(1, { damping: 10 });
    });

    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      const newBookmarkState = !isBookmarked;
      setIsBookmarked(newBookmarkState);

      // Call parent handler
      if (onSaveToggle) {
        onSaveToggle(car.id);
      }

      // Send notification for successful save
      if (newBookmarkState) {
        await realNotificationService.createCarAlert(
          car.id,
          `${car.make} ${car.model}`,
          'Car saved to your favorites!',
          'normal'
        );
      }

    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      setIsBookmarked(!isBookmarked); // Revert on error
    } finally {
      setLoading(false);
    }
  }, [loading, isBookmarked, onSaveToggle, car]);

  // Image load handler
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    imageOpacity.value = withTiming(1, { duration: 300 });
  }, []);

  // Get primary image
  const primaryImage = car.images?.[0] || car.image_url || 'https://via.placeholder.com/300x200?text=No+Image';

  // Format car details
  const carName = `${car.year} ${car.make} ${car.model}`;
  const formattedPrice = formatPrice(car.price);
  const formattedMileage = car.mileage ? formatMileage(car.mileage) : null;
  const displayLocation = car.location || car.dealer?.name || 'Unknown Location';

  return (
    <AnimatedTouchableOpacity
      style={[styles.container, cardStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={0.9}
      testID={testID}
      accessibilityLabel={`${carName} for ${formattedPrice}`}
      accessibilityRole="button"
      accessibilityState={{ selected: isBookmarked }}
    >
      {/* Card Content */}
      <View style={styles.card}>
        {/* Image Section */}
        <View style={styles.imageContainer}>
          <OptimizedImage
            source={{ uri: primaryImage }}
            style={styles.carImage}
            onLoad={handleImageLoad}
            placeholder="car"
            quality="medium"
          />
          
          {/* Image Loading Overlay */}
          {!imageLoaded && (
            <View style={styles.imageLoadingOverlay}>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading...
              </Text>
            </View>
          )}

          {/* Save Button */}
          {showSaveButton && user && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveToggle}
              disabled={loading}
              accessibilityLabel={isBookmarked ? 'Remove from favorites' : 'Add to favorites'}
              accessibilityRole="button"
            >
              <Animated.View style={heartStyle}>
                <Heart 
                  size={20} 
                  color={isBookmarked ? colors.error : colors.white}
                  filled={isBookmarked}
                />
              </Animated.View>
            </TouchableOpacity>
          )}

          {/* Dealer Badge */}
          {car.dealer?.verified && (
            <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.verifiedText, { color: colors.white }]}>
                ✓ Verified
              </Text>
            </View>
          )}
        </View>

        {/* Content Section */}
        <View style={styles.content}>
          {/* Car Name */}
          <Text 
            style={[styles.carName, { color: colors.text }]}
            numberOfLines={2}
          >
            {carName}
          </Text>

          {/* Price */}
          <Text style={[styles.price, { color: colors.primary }]}>
            {formattedPrice}
          </Text>

          {/* Details Row */}
          <View style={styles.detailsRow}>
            {/* Mileage */}
            {formattedMileage && (
              <View style={styles.detailItem}>
                <Clock size={14} color={colors.textSecondary} />
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  {formattedMileage}
                </Text>
              </View>
            )}

            {/* Location */}
            <View style={styles.detailItem}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text 
                style={[styles.detailText, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {displayLocation}
              </Text>
            </View>
          </View>

          {/* Rating */}
          {car.rating && (
            <View style={styles.ratingRow}>
              <Star size={16} color={colors.warning || '#FFB800'} />
              <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                {car.rating.toFixed(1)}
              </Text>
            </View>
          )}

          {/* Condition */}
          {car.condition && (
            <View style={[styles.conditionBadge, { backgroundColor: colors.secondaryGreen || colors.primaryLight }]}>
              <Text style={[styles.conditionText, { color: colors.primary }]}>
                {car.condition}
              </Text>
            </View>
          )}
        </View>
      </View>
    </AnimatedTouchableOpacity>
  );
});

UnifiedCarCard.displayName = 'UnifiedCarCard';

const getThemedStyles = (colors: any, variant: 'grid' | 'list') => {
  const isGrid = variant === 'grid';
  
  return StyleSheet.create({
    container: {
      width: isGrid ? CARD_WIDTH : width - (Spacing.lg * 2),
      marginBottom: Spacing.md,
      marginHorizontal: isGrid ? 0 : Spacing.lg,
    },
    card: {
      backgroundColor: colors.cardBackground || colors.white,
      borderRadius: BorderRadius.lg,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      overflow: 'hidden',
    },
    imageContainer: {
      height: isGrid ? IMAGE_HEIGHT : 200,
      position: 'relative',
    },
    carImage: {
      width: '100%',
      height: '100%',
    },
    imageLoadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.border || '#E5E7EB',
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 14,
      fontWeight: '400',
    },
    saveButton: {
      position: 'absolute',
      top: Spacing.sm,
      right: Spacing.sm,
      backgroundColor: 'rgba(0,0,0,0.3)',
      borderRadius: 20,
      padding: Spacing.xs,
      alignItems: 'center',
      justifyContent: 'center',
    },
    verifiedBadge: {
      position: 'absolute',
      top: Spacing.sm,
      left: Spacing.sm,
      paddingHorizontal: Spacing.xs,
      paddingVertical: 4,
      borderRadius: 12,
    },
    verifiedText: {
      fontSize: 10,
      fontWeight: '600',
    },
    content: {
      padding: Spacing.md,
    },
    carName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: Spacing.xs,
      lineHeight: 20,
    },
    price: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: Spacing.sm,
    },
    detailsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
      flexWrap: 'wrap',
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: Spacing.md,
      marginBottom: Spacing.xs,
    },
    detailText: {
      fontSize: 12,
      fontWeight: '400',
      marginLeft: 4,
      flex: 1,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    ratingText: {
      fontSize: 12,
      fontWeight: '500',
      marginLeft: 4,
    },
    conditionBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: 8,
    },
    conditionText: {
      fontSize: 10,
      fontWeight: '500',
    },
  });
};

export default UnifiedCarCard;
