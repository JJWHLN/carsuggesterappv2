import React, { memo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  ImageBackground,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { OptimizedImage } from './ui/OptimizedImage';
import { AnimatedPressable } from './ui/AnimatedPressable';
import { useThemeColors } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Car } from '@/types/database';
import { formatPrice, formatMileage } from '@/utils/dataTransformers';
import * as Haptics from 'expo-haptics';
import {
  MapPin,
  Heart,
  Star,
  Eye,
  Zap,
  Clock,
  TrendingUp,
  Award,
} from '@/utils/ultra-optimized-icons';

const { width, height } = Dimensions.get('window');
const cardWidth = width - 32; // 16px margin on each side
const cardHeight = cardWidth * 0.75; // 4:3 aspect ratio for premium feel

interface PremiumCarCardProps {
  car: Car;
  onPress: () => void;
  onSave?: () => void;
  onShare?: () => void;
  isSaved?: boolean;
  style?: any;
  variant?: 'featured' | 'standard' | 'compact';
}

const PremiumCarCard = memo<PremiumCarCardProps>(
  ({
    car,
    onPress,
    onSave,
    onShare,
    isSaved = false,
    style,
    variant = 'standard',
  }) => {
    const { colors } = useThemeColors();
    const { user } = useAuth();
    const [isLiked, setIsLiked] = useState(isSaved);
    const [viewCount] = useState(Math.floor(Math.random() * 5000) + 100);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const likeAnim = useRef(new Animated.Value(1)).current;

    const styles = getThemedStyles(colors, variant);

    // Simulated data for premium features
    const premiumFeatures = {
      isElectric:
        car.make?.toLowerCase().includes('tesla') || Math.random() > 0.7,
      isCertified: Math.random() > 0.6,
      isDealer: Math.random() > 0.5,
      isPremium: car.price > 50000,
      views24h: Math.floor(Math.random() * 200) + 50,
      saveCount: Math.floor(Math.random() * 50) + 5,
    };

    const handlePress = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Scale animation
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.98,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();

      onPress();
    }, [onPress, scaleAnim]);

    const handleLike = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Heart animation
      Animated.sequence([
        Animated.timing(likeAnim, {
          toValue: 1.3,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(likeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      setIsLiked(!isLiked);
      onSave?.();
    }, [isLiked, onSave, likeAnim]);

    const handleShare = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onShare?.();
    }, [onShare]);

    // Premium badge component
    const PremiumBadge = ({ type, text }: { type: string; text: string }) => {
      const badgeStyle =
        type === 'Electric'
          ? styles.badgeElectric
          : type === 'Certified'
            ? styles.badgeCertified
            : type === 'Premium'
              ? styles.badgePremium
              : styles.badge;

      const textStyle =
        type === 'Electric'
          ? styles.badgeElectricText
          : type === 'Certified'
            ? styles.badgeCertifiedText
            : type === 'Premium'
              ? styles.badgePremiumText
              : styles.badgeText;

      return (
        <View style={[styles.badge, badgeStyle]}>
          <Text style={[styles.badgeText, textStyle]}>{text}</Text>
        </View>
      );
    };

    // Status indicator component
    const StatusIndicator = ({
      icon,
      count,
      color,
    }: {
      icon: React.ReactNode;
      count: number;
      color: string;
    }) => (
      <View style={styles.statusIndicator}>
        {icon}
        <Text style={[styles.statusText, { color }]}>
          {count > 999 ? `${(count / 1000).toFixed(1)}k` : count}
        </Text>
      </View>
    );

    return (
      <Animated.View
        style={[styles.container, style, { transform: [{ scale: scaleAnim }] }]}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handlePress}
          style={styles.touchable}
        >
          {/* Main Image with Gradient Overlay */}
          <View style={styles.imageContainer}>
            <OptimizedImage
              source={{
                uri:
                  (car as any).image_url ||
                  'https://via.placeholder.com/400x300',
              }}
              style={styles.image}
              resizeMode="cover"
            />

            {/* Gradient Overlay for Text Readability */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
              style={styles.gradientOverlay}
              pointerEvents="none"
            />

            {/* Top Row - Badges and Actions */}
            <View style={styles.topRow}>
              <View style={styles.badgeContainer}>
                {premiumFeatures.isElectric && (
                  <PremiumBadge type="Electric" text="⚡ Electric" />
                )}
                {premiumFeatures.isCertified && (
                  <PremiumBadge type="Certified" text="✓ Certified" />
                )}
                {premiumFeatures.isPremium && (
                  <PremiumBadge type="Premium" text="👑 Premium" />
                )}
              </View>

              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleShare}
                >
                  <BlurView intensity={80} style={styles.blurButton}>
                    <Share color={colors.white} size={16} />
                  </BlurView>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleLike}
                >
                  <Animated.View style={{ transform: [{ scale: likeAnim }] }}>
                    <BlurView
                      intensity={80}
                      style={[styles.blurButton, isLiked && styles.likedButton]}
                    >
                      <Heart
                        color={isLiked ? '#EF4444' : colors.white}
                        size={16}
                        fill={isLiked ? '#EF4444' : 'transparent'}
                      />
                    </BlurView>
                  </Animated.View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom Row - Car Details */}
            <View style={styles.bottomRow}>
              {/* Price - Hero Element */}
              <View style={styles.priceContainer}>
                <Text style={styles.price}>{formatPrice(car.price)}</Text>
                {(car as any).original_price &&
                  (car as any).original_price > car.price && (
                    <Text style={styles.originalPrice}>
                      {formatPrice((car as any).original_price)}
                    </Text>
                  )}
              </View>

              {/* Car Title */}
              <Text style={styles.carTitle} numberOfLines={1}>
                {car.year} {car.make} {car.model}
              </Text>

              {/* Key Details Row */}
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <MapPin color={colors.white} size={12} />
                  <Text style={styles.detailText}>
                    {car.location || 'Location'} • {formatMileage(car.mileage)}
                  </Text>
                </View>

                {premiumFeatures.isDealer && (
                  <View style={styles.dealerBadge}>
                    <Shield color="#10B981" size={12} />
                    <Text style={styles.dealerText}>Dealer</Text>
                  </View>
                )}
              </View>

              {/* Engagement Indicators */}
              <View style={styles.engagementRow}>
                <StatusIndicator
                  icon={<Eye color={colors.white} size={12} />}
                  count={premiumFeatures.views24h}
                  color={colors.white}
                />

                <StatusIndicator
                  icon={<Heart color={colors.white} size={12} />}
                  count={premiumFeatures.saveCount}
                  color={colors.white}
                />

                <View style={styles.trendingIndicator}>
                  <TrendingUp color="#10B981" size={12} />
                  <Text style={styles.trendingText}>Trending</Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  },
);

const getThemedStyles = (colors: any, variant: string) => {
  const baseCardHeight =
    variant === 'compact' ? 200 : variant === 'featured' ? 320 : 280;

  return StyleSheet.create({
    container: {
      marginHorizontal: 16,
      marginVertical: 12,
      borderRadius: 20,
      backgroundColor: colors.white,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
        },
        android: {
          elevation: 12,
        },
      }),
      overflow: 'hidden',
    },

    touchable: {
      width: '100%',
      height: baseCardHeight,
    },

    imageContainer: {
      flex: 1,
      position: 'relative',
    },

    image: {
      width: '100%',
      height: '100%',
    },

    gradientOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '60%',
    },

    topRow: {
      position: 'absolute',
      top: 16,
      left: 16,
      right: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },

    badgeContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      flex: 1,
    },

    badge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: 'rgba(255,255,255,0.9)',
    },

    badgeElectric: {
      backgroundColor: 'rgba(16, 185, 129, 0.9)',
    },

    badgeCertified: {
      backgroundColor: 'rgba(59, 130, 246, 0.9)',
    },

    badgePremium: {
      backgroundColor: 'rgba(245, 158, 11, 0.9)',
    },

    badgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#1F2937',
    },

    badgeElectricText: {
      color: '#FFFFFF',
    },

    badgeCertifiedText: {
      color: '#FFFFFF',
    },

    badgePremiumText: {
      color: '#FFFFFF',
    },

    actionRow: {
      flexDirection: 'row',
      gap: 8,
    },

    actionButton: {
      width: 36,
      height: 36,
    },

    blurButton: {
      width: '100%',
      height: '100%',
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },

    likedButton: {
      backgroundColor: 'rgba(239, 68, 68, 0.2)',
    },

    bottomRow: {
      position: 'absolute',
      bottom: 16,
      left: 16,
      right: 16,
    },

    priceContainer: {
      flexDirection: 'row',
      alignItems: 'baseline',
      marginBottom: 4,
    },

    price: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.white,
      marginRight: 8,
    },

    originalPrice: {
      fontSize: 16,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.7)',
      textDecorationLine: 'line-through',
    },

    carTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.white,
      marginBottom: 8,
    },

    detailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },

    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flex: 1,
    },

    detailText: {
      fontSize: 12,
      fontWeight: '500',
      color: 'rgba(255,255,255,0.9)',
    },

    dealerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      borderRadius: 8,
    },

    dealerText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#10B981',
    },

    engagementRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },

    statusIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    statusText: {
      fontSize: 11,
      fontWeight: '500',
    },

    trendingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      borderRadius: 8,
    },

    trendingText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#10B981',
    },
  });
};

export { PremiumCarCard };
