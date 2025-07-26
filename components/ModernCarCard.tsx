import React, { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { OptimizedImage } from './ui/OptimizedImage';
import { AnimatedPressable } from './ui/AnimatedPressable';
import {
  createSemanticProps,
  useAccessibility,
} from '@/hooks/useAccessibility';
import { useThemeColors } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Car } from '@/types/database';
import {
  formatPrice,
  formatMileage,
  formatDate,
  formatCondition,
  formatFuelType,
} from '@/utils/dataTransformers';
import { addSavedCar, removeSavedCar } from '@/services/supabaseService';
import * as Haptics from 'expo-haptics';
import {
  MapPin,
  Clock,
  Heart,
  Star,
  Fuel,
  Settings,
  Eye,
  MessageCircle,
} from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');
const cardWidth = width - 40; // 20px margin on each side

interface ModernCarCardProps {
  car: Car;
  onPress: () => void;
  showSaveButton?: boolean;
  isSaved?: boolean;
  onSaveToggle?: (saved: boolean) => void;
  style?: any;
}

const ModernCarCard = memo<ModernCarCardProps>(
  ({
    car,
    onPress,
    showSaveButton = true,
    isSaved = false,
    onSaveToggle,
    style,
  }) => {
    const { colors } = useThemeColors();
    const { user } = useAuth();
    const { announceForAccessibility } = useAccessibility();
    const [isBookmarked, setIsBookmarked] = useState(isSaved);
    const [loading, setLoading] = useState(false);
    const [viewCount] = useState(Math.floor(Math.random() * 1000) + 50); // Simulated view count
    const styles = getThemedStyles(colors);

    const handleSaveToggle = useCallback(async () => {
      if (!user || loading) return;

      try {
        setLoading(true);
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (isBookmarked) {
          await removeSavedCar(user.id, car.id);
          setIsBookmarked(false);
          announceForAccessibility('Removed from saved cars');
        } else {
          await addSavedCar(user.id, car.id);
          setIsBookmarked(true);
          announceForAccessibility('Added to saved cars');
        }

        onSaveToggle?.(isBookmarked);
      } catch (error) {
        logger.error('Error toggling save:', error);
        announceForAccessibility('Failed to update saved status');
      } finally {
        setLoading(false);
      }
    }, [
      user,
      isBookmarked,
      car.id,
      onSaveToggle,
      loading,
      announceForAccessibility,
    ]);

    const handleShare = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // TODO: Implement sharing functionality
    }, []);

    const imageSource = car.images?.[0]
      ? { uri: car.images[0] }
      : require('@/assets/images/car-placeholder.svg');

    return (
      <View style={[styles.container, style]}>
        {/* Instagram-style image with overlay controls */}
        <View style={styles.imageContainer}>
          <OptimizedImage
            source={imageSource}
            style={styles.image}
            resizeMode="cover"
          />

          {/* TikTok-inspired gradient overlay */}
          <LinearGradient
            colors={['transparent', 'transparent', 'rgba(0,0,0,0.7)']}
            style={styles.imageOverlay}
          />

          {/* Instagram-style floating buttons */}
          <View style={styles.imageControls}>
            {/* View count (Instagram-style) */}
            <View style={styles.viewBadge}>
              <Eye color="white" size={12} />
              <Text style={styles.viewText}>{viewCount}</Text>
            </View>

            {/* Save button */}
            {showSaveButton && user && (
              <TouchableOpacity
                style={[
                  styles.floatingButton,
                  isBookmarked && styles.floatingButtonActive,
                ]}
                onPress={handleSaveToggle}
                disabled={loading}
              >
                <Heart
                  color={isBookmarked ? '#FF3B30' : 'white'}
                  size={20}
                  fill={isBookmarked ? '#FF3B30' : 'transparent'}
                />
              </TouchableOpacity>
            )}

            {/* Share button */}
            <TouchableOpacity
              style={styles.floatingButton}
              onPress={handleShare}
            >
              <Share color="white" size={18} />
            </TouchableOpacity>
          </View>

          {/* Verified dealer badge (Instagram-style verified badge) */}
          {car.dealer?.verified && (
            <View style={styles.verifiedBadge}>
              <Star color="white" size={12} fill="white" />
              <Text style={styles.verifiedText}>Verified Dealer</Text>
            </View>
          )}

          {/* Condition badge */}
          {car.condition && (
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>
                {formatCondition(car.condition)}
              </Text>
            </View>
          )}
        </View>

        {/* Content section with Zillow-inspired layout */}
        <TouchableOpacity
          style={styles.content}
          onPress={onPress}
          activeOpacity={0.7}
        >
          {/* Header with price prominence (Zillow-style) */}
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text
                style={[styles.title, { color: colors.text }]}
                numberOfLines={1}
              >
                {car.year} {car.make} {car.model}
              </Text>
              <Text style={[styles.price, { color: colors.primary }]}>
                {formatPrice(car.price)}
              </Text>
            </View>
          </View>

          {/* Key details (Instagram Stories-style icons) */}
          <View style={styles.quickDetails}>
            <View style={styles.quickDetailItem}>
              <View
                style={[
                  styles.detailIcon,
                  { backgroundColor: colors.primary + '20' },
                ]}
              >
                <Settings color={colors.primary} size={14} />
              </View>
              <Text
                style={[styles.detailText, { color: colors.textSecondary }]}
              >
                {formatMileage(car.mileage)} mi
              </Text>
            </View>

            {car.fuel_type && (
              <View style={styles.quickDetailItem}>
                <View
                  style={[
                    styles.detailIcon,
                    { backgroundColor: colors.success + '20' },
                  ]}
                >
                  <Fuel color={colors.success} size={14} />
                </View>
                <Text
                  style={[styles.detailText, { color: colors.textSecondary }]}
                >
                  {formatFuelType(car.fuel_type)}
                </Text>
              </View>
            )}

            <View style={styles.quickDetailItem}>
              <View
                style={[
                  styles.detailIcon,
                  { backgroundColor: colors.warning + '20' },
                ]}
              >
                <MapPin color={colors.warning} size={14} />
              </View>
              <Text
                style={[styles.detailText, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {car.location}
              </Text>
            </View>
          </View>

          {/* Features tags (TikTok-style hashtags) */}
          {car.features && car.features.length > 0 && (
            <View style={styles.features}>
              {car.features.slice(0, 3).map((feature, index) => (
                <View
                  key={index}
                  style={[
                    styles.featureTag,
                    { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Text style={[styles.featureText, { color: colors.primary }]}>
                    #{feature.toLowerCase().replace(/\s+/g, '')}
                  </Text>
                </View>
              ))}
              {car.features.length > 3 && (
                <Text
                  style={[styles.moreFeatures, { color: colors.textSecondary }]}
                >
                  +{car.features.length - 3} more
                </Text>
              )}
            </View>
          )}

          {/* Instagram-style engagement footer */}
          <View style={styles.footer}>
            <View style={styles.engagement}>
              <TouchableOpacity style={styles.engagementItem}>
                <MessageCircle color={colors.textSecondary} size={16} />
                <Text
                  style={[
                    styles.engagementText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Contact Dealer
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timeStamp}>
              <Clock color={colors.textMuted} size={12} />
              <Text style={[styles.timeText, { color: colors.textMuted }]}>
                {formatDate(car.created_at)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  },
);

const getThemedStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      marginHorizontal: 20,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 5,
      overflow: 'hidden',
    },
    imageContainer: {
      position: 'relative',
      height: 240,
    },
    image: {
      width: '100%',
      height: '100%',
    },
    imageOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    imageControls: {
      position: 'absolute',
      top: 12,
      right: 12,
      flexDirection: 'column',
      gap: 8,
    },
    viewBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    viewText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '500',
    },
    floatingButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center',
      justifyContent: 'center',
      backdropFilter: 'blur(10px)',
    },
    floatingButtonActive: {
      backgroundColor: 'rgba(255,255,255,0.9)',
    },
    verifiedBadge: {
      position: 'absolute',
      top: 12,
      left: 12,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#4CAF50',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    verifiedText: {
      color: 'white',
      fontSize: 11,
      fontWeight: '600',
    },
    conditionBadge: {
      position: 'absolute',
      bottom: 12,
      left: 12,
      backgroundColor: 'rgba(255,255,255,0.9)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    conditionText: {
      color: '#333',
      fontSize: 11,
      fontWeight: '600',
    },
    content: {
      padding: 16,
    },
    header: {
      marginBottom: 12,
    },
    titleContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      flex: 1,
      marginRight: 12,
    },
    price: {
      fontSize: 20,
      fontWeight: '800',
    },
    quickDetails: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 12,
    },
    quickDetailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    detailIcon: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    detailText: {
      fontSize: 13,
      fontWeight: '500',
    },
    features: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 12,
    },
    featureTag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    featureText: {
      fontSize: 11,
      fontWeight: '500',
    },
    moreFeatures: {
      fontSize: 11,
      fontWeight: '500',
      paddingVertical: 4,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    engagement: {
      flexDirection: 'row',
      gap: 16,
    },
    engagementItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    engagementText: {
      fontSize: 13,
      fontWeight: '500',
    },
    timeStamp: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    timeText: {
      fontSize: 11,
    },
  });

ModernCarCard.displayName = 'ModernCarCard';

export { ModernCarCard };
