import React, { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { OptimizedImage } from './ui/OptimizedImage';
import { useThemeColors } from '@/hooks/useTheme';
import { Car } from '@/types/database';
import { formatPrice, formatMileage } from '@/utils/dataTransformers';
import {
  MapPin,
  Heart,
  Star,
  Eye,
  Clock,
  Fuel,
  Settings,
  Award,
  TrendingUp,
  Sparkles,
  Crown,
  Shield,
} from '@/utils/ultra-optimized-icons';
import { BorderRadius, Spacing, Typography, Shadows } from '@/constants/Colors';

const { width } = Dimensions.get('window');
const cardWidth = (width - Spacing.lg * 3) / 2; // Two cards per row with spacing

interface UltraPremiumCarCardProps {
  car: Car;
  onPress: () => void;
  onSave?: () => void;
  onShare?: () => void;
  isSaved?: boolean;
  isFeatured?: boolean;
  isPremiumListing?: boolean;
  style?: any;
  variant?: 'compact' | 'standard' | 'featured';
}

export const UltraPremiumCarCard = memo<UltraPremiumCarCardProps>(
  ({
    car,
    onPress,
    onSave,
    onShare,
    isSaved = false,
    isFeatured = false,
    isPremiumListing = false,
    style,
    variant = 'standard',
  }) => {
    const { colors } = useThemeColors();
    const [isLiked, setIsLiked] = useState(isSaved);
    const [viewCount] = useState(Math.floor(Math.random() * 2000) + 100);

    // Animation values
    const scale = useSharedValue(1);
    const elevation = useSharedValue(0);
    const heartScale = useSharedValue(1);

    const styles = getThemedStyles(colors, variant);

    const handlePress = useCallback(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scale.value = withSpring(0.98, { stiffness: 400 }, () => {
        scale.value = withSpring(1);
      });
      runOnJS(onPress)();
    }, [onPress]);

    const handleLike = useCallback(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      heartScale.value = withSpring(1.3, { stiffness: 300 }, () => {
        heartScale.value = withSpring(1);
      });
      setIsLiked((prev) => !prev);
      onSave?.();
    }, [onSave]);

    const handlePressIn = () => {
      scale.value = withTiming(0.95, { duration: 150 });
      elevation.value = withTiming(12, { duration: 150 });
    };

    const handlePressOut = () => {
      scale.value = withSpring(1, { stiffness: 300 });
      elevation.value = withTiming(4, { duration: 200 });
    };

    // Animated styles
    const animatedCardStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
      elevation: elevation.value,
      shadowOpacity: interpolate(elevation.value, [0, 12], [0.1, 0.3]),
    }));

    const animatedHeartStyle = useAnimatedStyle(() => ({
      transform: [{ scale: heartScale.value }],
    }));

    // Calculate rating and views (mock data for demo)
    const rating = Math.random() * 2 + 3; // 3-5 star range
    const reviews = Math.floor(Math.random() * 100 + 10);

    return (
      <Animated.View style={[styles.container, style, animatedCardStyle]}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.touchable}
        >
          {/* Premium badges */}
          <View style={styles.badgeContainer}>
            {isFeatured && (
              <View style={[styles.badge, styles.featuredBadge]}>
                <Crown size={12} color={colors.white} />
                <Text style={styles.badgeText}>Featured</Text>
              </View>
            )}
            {isPremiumListing && (
              <View style={[styles.badge, styles.premiumBadge]}>
                <Shield size={12} color={colors.white} />
                <Text style={styles.badgeText}>Premium</Text>
              </View>
            )}
            {car.year >= new Date().getFullYear() - 1 && (
              <View style={[styles.badge, styles.newBadge]}>
                <Sparkles size={12} color={colors.white} />
                <Text style={styles.badgeText}>New</Text>
              </View>
            )}
          </View>

          {/* Image with gradient overlay */}
          <View style={styles.imageContainer}>
            <OptimizedImage
              source={{
                uri:
                  car.images?.[0] ||
                  'https://via.placeholder.com/400x240/f0f0f0/ccc?text=Car',
              }}
              style={styles.image}
              placeholder="https://via.placeholder.com/400x240/f0f0f0/ccc?text=Car"
            />

            {/* Gradient overlay for better text readability */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.4)']}
              style={styles.imageOverlay}
            />

            {/* Action buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.white }]}
                onPress={handleLike}
              >
                <Animated.View style={animatedHeartStyle}>
                  <Heart
                    size={18}
                    color={isLiked ? '#FF4757' : colors.textSecondary}
                    fill={isLiked ? '#FF4757' : 'none'}
                  />
                </Animated.View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.white }]}
                onPress={onShare}
              >
                <Eye size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Views counter */}
            <View style={styles.viewsContainer}>
              <BlurView intensity={60} style={styles.viewsBlur}>
                <Eye size={12} color={colors.white} />
                <Text style={styles.viewsText}>
                  {viewCount.toLocaleString()}
                </Text>
              </BlurView>
            </View>
          </View>

          {/* Card content */}
          <View style={styles.content}>
            {/* Title and year */}
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>
                {car.year} {car.make} {car.model}
              </Text>
              {(car.fuel_type === 'Electric' || car.fuel_type === 'Hybrid') && (
                <View style={styles.electricBadge}>
                  <Text style={styles.electricText}>EV</Text>
                </View>
              )}
            </View>

            {/* Subtitle */}
            <Text style={styles.subtitle} numberOfLines={1}>
              {car.condition || 'Premium Vehicle'}
            </Text>

            {/* Key specs */}
            <View style={styles.specsRow}>
              <View style={styles.spec}>
                <MapPin size={14} color={colors.textSecondary} />
                <Text style={styles.specText}>
                  {car.mileage ? formatMileage(car.mileage) : 'N/A'}
                </Text>
              </View>
              <View style={styles.spec}>
                <Fuel size={14} color={colors.textSecondary} />
                <Text style={styles.specText}>{car.fuel_type || 'Gas'}</Text>
              </View>
              <View style={styles.spec}>
                <Settings size={14} color={colors.textSecondary} />
                <Text style={styles.specText}>
                  {car.transmission || 'Auto'}
                </Text>
              </View>
            </View>

            {/* Rating and reviews */}
            <View style={styles.ratingRow}>
              <View style={styles.rating}>
                <Star size={14} color="#FFD700" fill="#FFD700" />
                <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                <Text style={styles.reviewCount}>({reviews})</Text>
              </View>
              <View style={styles.trending}>
                <TrendingUp size={14} color={colors.primary} />
                <Text style={styles.trendingText}>Hot</Text>
              </View>
            </View>

            {/* Price */}
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatPrice(car.price)}</Text>
              {/* Mock original price for demo */}
              {Math.random() > 0.7 && (
                <Text style={styles.originalPrice}>
                  {formatPrice(car.price * 1.1)}
                </Text>
              )}
            </View>

            {/* Location and time */}
            <View style={styles.metaRow}>
              <View style={styles.location}>
                <MapPin size={12} color={colors.textSecondary} />
                <Text style={styles.locationText}>
                  {car.location || 'Local Area'}
                </Text>
              </View>
              <View style={styles.time}>
                <Clock size={12} color={colors.textSecondary} />
                <Text style={styles.timeText}>2d ago</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

const getThemedStyles = (colors: any, variant: string) => {
  const baseCardWidth =
    variant === 'featured' ? width - Spacing.lg * 2 : cardWidth;
  const baseHeight = variant === 'featured' ? 400 : 340;

  return StyleSheet.create({
    container: {
      width: baseCardWidth,
      backgroundColor: colors.white,
      borderRadius: BorderRadius.xl,
      overflow: 'hidden',
      ...Shadows.large,
      marginBottom: Spacing.md,
    },
    touchable: {
      width: '100%',
      height: baseHeight,
    },
    badgeContainer: {
      position: 'absolute',
      top: Spacing.sm,
      left: Spacing.sm,
      zIndex: 10,
      flexDirection: 'row',
      gap: Spacing.xs,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs / 2,
      borderRadius: BorderRadius.sm,
      gap: 4,
    },
    featuredBadge: {
      backgroundColor: '#FFD700',
    },
    premiumBadge: {
      backgroundColor: '#8B5CF6',
    },
    newBadge: {
      backgroundColor: '#10B981',
    },
    badgeText: {
      ...Typography.caption,
      color: colors.white,
      fontWeight: '600',
      fontSize: 10,
    },
    imageContainer: {
      height: '60%',
      position: 'relative',
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imageOverlay: {
      ...StyleSheet.absoluteFillObject,
    },
    actionButtons: {
      position: 'absolute',
      top: Spacing.sm,
      right: Spacing.sm,
      gap: Spacing.xs,
    },
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadows.sm,
    },
    viewsContainer: {
      position: 'absolute',
      bottom: Spacing.sm,
      right: Spacing.sm,
    },
    viewsBlur: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
      gap: 4,
    },
    viewsText: {
      ...Typography.caption,
      color: colors.white,
      fontWeight: '500',
      fontSize: 10,
    },
    content: {
      flex: 1,
      padding: Spacing.md,
      justifyContent: 'space-between',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.xs,
    },
    title: {
      ...Typography.cardTitle,
      color: colors.text,
      fontWeight: '700',
      flex: 1,
    },
    electricBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: Spacing.xs,
      paddingVertical: 2,
      borderRadius: BorderRadius.xs,
    },
    electricText: {
      ...Typography.caption,
      color: colors.white,
      fontWeight: '600',
      fontSize: 10,
    },
    subtitle: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    specsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    spec: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flex: 1,
    },
    specText: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontSize: 10,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    rating: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    ratingText: {
      ...Typography.caption,
      color: colors.text,
      fontWeight: '600',
    },
    reviewCount: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontSize: 10,
    },
    trending: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    trendingText: {
      ...Typography.caption,
      color: colors.primary,
      fontWeight: '600',
      fontSize: 10,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    price: {
      ...Typography.cardTitle,
      color: colors.primary,
      fontWeight: '800',
    },
    originalPrice: {
      ...Typography.caption,
      color: colors.textSecondary,
      textDecorationLine: 'line-through',
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    location: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flex: 1,
    },
    locationText: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontSize: 10,
    },
    time: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    timeText: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontSize: 10,
    },
  });
};
