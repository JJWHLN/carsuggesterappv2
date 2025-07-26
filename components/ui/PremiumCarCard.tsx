import React, { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {
  MapPin,
  Clock,
  Heart,
  Star,
  Fuel,
  Settings,
  Calendar,
  Gauge,
  Shield,
  Zap,
  Eye,
  Share,
  TrendingUp,
  CheckCircle,
  Award,
} from '@/utils/ultra-optimized-icons';

import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useThemeColors } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useCanPerformAction } from '@/components/ui/RoleProtection';
import { Theme } from '@/theme/Theme';
import { Car } from '@/types/database';
import {
  formatPrice,
  formatMileage,
  formatDate,
  formatCondition,
  formatFuelType,
} from '@/utils/dataTransformers';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - Theme.spacing.xl * 2;
const CARD_HEIGHT = 320;

interface PremiumCarCardProps {
  car: Car;
  onPress: () => void;
  onSave?: () => void;
  onShare?: () => void;
  onCompare?: () => void;
  isSaved?: boolean;
  isComparing?: boolean;
  variant?: 'featured' | 'standard' | 'compact';
  showActions?: boolean;
  showBadges?: boolean;
  testID?: string;
}

export const PremiumCarCard = memo<PremiumCarCardProps>(
  ({
    car,
    onPress,
    onSave,
    onShare,
    onCompare,
    isSaved = false,
    isComparing = false,
    variant = 'standard',
    showActions = true,
    showBadges = true,
    testID,
  }) => {
    const { colors } = useThemeColors();
    const { user } = useAuth();
    const canBookmark = useCanPerformAction('bookmarkCars');
    const canCompare = useCanPerformAction('bookmarkCars'); // Using existing permission for now

    const [isBookmarked, setIsBookmarked] = useState(isSaved);
    const [viewCount, setViewCount] = useState(
      Math.floor(Math.random() * 50) + 10,
    );

    const scaleAnim = useSharedValue(1);
    const heartAnim = useSharedValue(1);
    const overlayOpacity = useSharedValue(0);

    const handlePress = useCallback(() => {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      scaleAnim.value = withSpring(0.98, { duration: 150 }, () => {
        scaleAnim.value = withSpring(1, { duration: 150 });
      });

      setViewCount((prev) => prev + 1);
      onPress();
    }, [onPress, scaleAnim]);

    const handleSave = useCallback(() => {
      if (!user || !canBookmark) return;

      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      heartAnim.value = withSpring(1.3, { duration: 150 }, () => {
        heartAnim.value = withSpring(1, { duration: 150 });
      });

      setIsBookmarked(!isBookmarked);
      onSave?.();
    }, [user, canBookmark, isBookmarked, onSave, heartAnim]);

    const handleShare = useCallback(() => {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onShare?.();
    }, [onShare]);

    const handleCompare = useCallback(() => {
      if (!canCompare) return;

      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      onCompare?.();
    }, [canCompare, onCompare]);

    const cardStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scaleAnim.value }],
    }));

    const heartStyle = useAnimatedStyle(() => ({
      transform: [{ scale: heartAnim.value }],
    }));

    const overlayStyle = useAnimatedStyle(() => ({
      opacity: overlayOpacity.value,
    }));

    const getDealerBadge = () => {
      if (car.dealer?.verified) {
        return (
          <View
            style={[styles.dealerBadge, { backgroundColor: colors.success }]}
          >
            <CheckCircle color={colors.background} size={10} />
            <Text
              style={[styles.dealerBadgeText, { color: colors.background }]}
            >
              Verified
            </Text>
          </View>
        );
      }
      return null;
    };

    const getConditionBadge = () => {
      if (!car.condition) return null;

      const conditionColors = {
        Excellent: colors.success,
        'Very Good': colors.primary,
        Good: colors.warning,
        Fair: colors.error,
        Poor: colors.error,
      };

      return (
        <View
          style={[
            styles.conditionBadge,
            {
              backgroundColor:
                (conditionColors as any)[car.condition] || colors.textMuted,
            },
          ]}
        >
          <Text
            style={[styles.conditionBadgeText, { color: colors.background }]}
          >
            {car.condition}
          </Text>
        </View>
      );
    };

    const getPricePerformance = () => {
      // Mock price performance indicator
      const performance = Math.random() > 0.5 ? 'above' : 'below';
      return performance === 'above' ? (
        <View
          style={[styles.priceIndicator, { backgroundColor: colors.success }]}
        >
          <TrendingUp color={colors.background} size={12} />
          <Text
            style={[styles.priceIndicatorText, { color: colors.background }]}
          >
            Great Value
          </Text>
        </View>
      ) : null;
    };

    const styles = getThemedStyles(colors, variant);

    return (
      <Animated.View style={[styles.container, cardStyle]} testID={testID}>
        <TouchableOpacity
          style={styles.card}
          onPress={handlePress}
          activeOpacity={0.95}
        >
          {/* Image Section */}
          <View style={styles.imageSection}>
            <OptimizedImage
              source={{ uri: car.images[0] }}
              style={styles.carImage}
              resizeMode="cover"
              fallbackSource={require('@/assets/images/icon.png')}
            />

            {/* Image Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)']}
              style={styles.imageOverlay}
            />

            {/* Top Badges */}
            {showBadges && (
              <View style={styles.topBadges}>
                {getDealerBadge()}
                {getConditionBadge()}
                {getPricePerformance()}
              </View>
            )}

            {/* Action Buttons */}
            {showActions && (
              <View style={styles.actionButtons}>
                <Animated.View style={heartStyle}>
                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: colors.background },
                    ]}
                    onPress={handleSave}
                    disabled={!user || !canBookmark}
                  >
                    <Heart
                      color={isBookmarked ? colors.error : colors.textMuted}
                      size={18}
                      fill={isBookmarked ? colors.error : 'none'}
                    />
                  </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: colors.background },
                  ]}
                  onPress={handleShare}
                >
                  <Share color={colors.textMuted} size={18} />
                </TouchableOpacity>
              </View>
            )}

            {/* View Count */}
            <View style={styles.viewCount}>
              <Eye color={colors.background} size={12} />
              <Text
                style={[styles.viewCountText, { color: colors.background }]}
              >
                {viewCount}
              </Text>
            </View>
          </View>

          {/* Content Section */}
          <View style={styles.contentSection}>
            {/* Title and Price */}
            <View style={styles.titleRow}>
              <View style={styles.titleContainer}>
                <Text
                  style={[styles.carTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {car.year} {car.make} {car.model}
                </Text>
              </View>
              <View style={styles.priceContainer}>
                <Text style={[styles.carPrice, { color: colors.primary }]}>
                  {formatPrice(car.price)}
                </Text>
                {variant === 'featured' && (
                  <Text
                    style={[styles.priceLabel, { color: colors.textMuted }]}
                  >
                    asking price
                  </Text>
                )}
              </View>
            </View>

            {/* Key Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Calendar color={colors.textMuted} size={14} />
                <Text style={[styles.statText, { color: colors.textMuted }]}>
                  {car.year}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Gauge color={colors.textMuted} size={14} />
                <Text style={[styles.statText, { color: colors.textMuted }]}>
                  {formatMileage(car.mileage)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Fuel color={colors.textMuted} size={14} />
                <Text style={[styles.statText, { color: colors.textMuted }]}>
                  {formatFuelType(car.fuel_type)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Settings color={colors.textMuted} size={14} />
                <Text style={[styles.statText, { color: colors.textMuted }]}>
                  {car.transmission || 'Manual'}
                </Text>
              </View>
            </View>

            {/* Location and Dealer */}
            <View style={styles.locationRow}>
              <View style={styles.locationContainer}>
                <MapPin color={colors.textMuted} size={14} />
                <Text
                  style={[styles.locationText, { color: colors.textMuted }]}
                >
                  {car.location}
                </Text>
              </View>
              {car.dealer && (
                <View style={styles.dealerContainer}>
                  <Award color={colors.textMuted} size={14} />
                  <Text
                    style={[styles.dealerText, { color: colors.textMuted }]}
                  >
                    {car.dealer.name}
                  </Text>
                </View>
              )}
            </View>

            {/* Compare Button */}
            {variant === 'featured' && showActions && (
              <View style={styles.compareSection}>
                <TouchableOpacity
                  style={[
                    styles.compareButton,
                    {
                      backgroundColor: isComparing
                        ? colors.primary
                        : colors.primaryLight,
                      borderColor: colors.primary,
                    },
                  ]}
                  onPress={handleCompare}
                  disabled={!canCompare}
                >
                  <Text
                    style={[
                      styles.compareButtonText,
                      {
                        color: isComparing ? colors.background : colors.primary,
                      },
                    ]}
                  >
                    {isComparing ? 'Added to Compare' : 'Compare'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

PremiumCarCard.displayName = 'PremiumCarCard';

const getThemedStyles = (colors: any, variant: string) =>
  StyleSheet.create({
    container: {
      marginBottom: Theme.spacing.lg,
    },
    card: {
      backgroundColor: colors.background,
      borderRadius: Theme.borderRadius.xl,
      ...Theme.shadows.card,
      overflow: 'hidden',
      height: variant === 'compact' ? 240 : CARD_HEIGHT,
    },
    imageSection: {
      height: variant === 'compact' ? 120 : 180,
      position: 'relative',
    },
    carImage: {
      width: '100%',
      height: '100%',
    },
    imageOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '60%',
    },
    topBadges: {
      position: 'absolute',
      top: Theme.spacing.md,
      left: Theme.spacing.md,
      flexDirection: 'row',
      gap: Theme.spacing.xs,
      flexWrap: 'wrap',
    },
    dealerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Theme.spacing.sm,
      paddingVertical: Theme.spacing.xs,
      borderRadius: Theme.borderRadius.md,
      gap: Theme.spacing.xs,
    },
    dealerBadgeText: {
      ...Theme.typography.caption,
      fontWeight: '600',
    },
    conditionBadge: {
      paddingHorizontal: Theme.spacing.sm,
      paddingVertical: Theme.spacing.xs,
      borderRadius: Theme.borderRadius.md,
    },
    conditionBadgeText: {
      ...Theme.typography.caption,
      fontWeight: '600',
    },
    priceIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Theme.spacing.sm,
      paddingVertical: Theme.spacing.xs,
      borderRadius: Theme.borderRadius.md,
      gap: Theme.spacing.xs,
    },
    priceIndicatorText: {
      ...Theme.typography.caption,
      fontWeight: '600',
    },
    actionButtons: {
      position: 'absolute',
      top: Theme.spacing.md,
      right: Theme.spacing.md,
      gap: Theme.spacing.sm,
    },
    actionButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      ...Theme.Shadows.sm,
    },
    viewCount: {
      position: 'absolute',
      bottom: Theme.spacing.md,
      right: Theme.spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.5)',
      paddingHorizontal: Theme.spacing.sm,
      paddingVertical: Theme.spacing.xs,
      borderRadius: Theme.borderRadius.md,
      gap: Theme.spacing.xs,
    },
    viewCountText: {
      ...Theme.typography.caption,
      fontWeight: '600',
    },
    contentSection: {
      flex: 1,
      padding: Theme.spacing.lg,
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: Theme.spacing.md,
    },
    titleContainer: {
      flex: 1,
      marginRight: Theme.spacing.md,
    },
    carTitle: {
      ...Theme.typography.cardTitle,
      fontWeight: '700',
      marginBottom: Theme.spacing.xs,
    },
    carTrim: {
      ...Theme.Typography.caption,
    },
    priceContainer: {
      alignItems: 'flex-end',
    },
    carPrice: {
      ...Theme.typography.priceText,
      fontWeight: '800',
    },
    priceLabel: {
      ...Theme.typography.caption,
      marginTop: Theme.spacing.xs,
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Theme.spacing.md,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Theme.spacing.xs,
      flex: 1,
    },
    statText: {
      ...Theme.Typography.caption,
      fontWeight: '500',
    },
    locationRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Theme.spacing.md,
    },
    locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Theme.spacing.xs,
      flex: 1,
    },
    locationText: {
      ...Theme.Typography.caption,
    },
    dealerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Theme.spacing.xs,
    },
    dealerText: {
      ...Theme.Typography.caption,
    },
    compareSection: {
      marginTop: 'auto',
    },
    compareButton: {
      paddingVertical: Theme.spacing.sm,
      paddingHorizontal: Theme.spacing.md,
      borderRadius: Theme.borderRadius.md,
      borderWidth: 1,
      alignItems: 'center',
    },
    compareButtonText: {
      ...Theme.Typography.caption,
      fontWeight: '600',
    },
  });

export default PremiumCarCard;
