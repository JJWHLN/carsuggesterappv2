import React, { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { OptimizedImage } from './ui/OptimizedImage';
import { useThemeColors } from '@/hooks/useTheme';
import * as Haptics from 'expo-haptics';
import {
  Star,
  Heart,
  MessageCircle,
  CheckCircle,
  Award,
  TrendingUp,
  Clock,
} from '@/utils/ultra-optimized-icons';

interface Review {
  id: string;
  user: {
    name: string;
    avatar?: string;
    verified?: boolean;
    reviewCount?: number;
  };
  rating: number;
  title: string;
  content: string;
  date: string;
  helpful: number;
  images?: string[];
  carDetails?: {
    make: string;
    model: string;
    year: number;
  };
  tags?: string[];
}

interface PremiumReviewCardProps {
  review: Review;
  onPress?: () => void;
  onLike?: () => void;
  onShare?: () => void;
  onHelpful?: () => void;
  isLiked?: boolean;
  isHelpful?: boolean;
  variant?: 'full' | 'compact' | 'featured';
  style?: any;
}

const PremiumReviewCard = memo<PremiumReviewCardProps>(
  ({
    review,
    onPress,
    onLike,
    onShare,
    onHelpful,
    isLiked = false,
    isHelpful = false,
    variant = 'full',
    style,
  }) => {
    const { colors } = useThemeColors();
    const [liked, setLiked] = useState(isLiked);
    const [helpful, setHelpful] = useState(isHelpful);
    const styles = getThemedStyles(colors, variant);

    const handlePress = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress?.();
    }, [onPress]);

    const handleLike = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setLiked(!liked);
      onLike?.();
    }, [liked, onLike]);

    const handleHelpful = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setHelpful(!helpful);
      onHelpful?.();
    }, [helpful, onHelpful]);

    const handleShare = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onShare?.();
    }, [onShare]);

    const renderStars = (rating: number) => {
      return Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          size={14}
          color={index < rating ? '#FBBF24' : '#E5E7EB'}
          fill={index < rating ? '#FBBF24' : 'transparent'}
        />
      ));
    };

    const getTimeAgo = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60 * 60),
      );

      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      const diffInWeeks = Math.floor(diffInDays / 7);
      if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
      return date.toLocaleDateString();
    };

    return (
      <TouchableOpacity
        style={[styles.container, style]}
        onPress={handlePress}
        activeOpacity={0.95}
      >
        {/* Header Section */}
        <View style={styles.header}>
          {/* User Info */}
          <View style={styles.userSection}>
            <View style={styles.avatarContainer}>
              <OptimizedImage
                source={{
                  uri:
                    review.user.avatar ||
                    `https://ui-avatars.com/api/?name=${review.user.name}&background=random`,
                }}
                style={styles.avatar}
                resizeMode="cover"
              />
              {review.user.verified && (
                <View style={styles.verifiedBadge}>
                  <CheckCircle color="#1D4ED8" size={12} fill="#1D4ED8" />
                </View>
              )}
            </View>

            <View style={styles.userInfo}>
              <Text style={[styles.userName, { color: colors.text }]}>
                {review.user.name}
              </Text>
              <View style={styles.userMeta}>
                <Text
                  style={[styles.userMetaText, { color: colors.textSecondary }]}
                >
                  {review.user.reviewCount} reviews
                </Text>
                <Text
                  style={[styles.userMetaText, { color: colors.textSecondary }]}
                >
                  • {getTimeAgo(review.date)}
                </Text>
              </View>
            </View>
          </View>

          {/* Rating & Actions */}
          <View style={styles.headerActions}>
            <View style={styles.ratingContainer}>
              <View style={styles.starsRow}>{renderStars(review.rating)}</View>
              <Text style={[styles.ratingNumber, { color: colors.text }]}>
                {review.rating.toFixed(1)}
              </Text>
            </View>

            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Share color={colors.textSecondary} size={16} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Car Details (if available) */}
        {review.carDetails && (
          <View style={styles.carDetails}>
            <Text style={[styles.carTitle, { color: colors.text }]}>
              {review.carDetails.year} {review.carDetails.make}{' '}
              {review.carDetails.model}
            </Text>
          </View>
        )}

        {/* Review Content */}
        <View style={styles.content}>
          {review.title && (
            <Text style={[styles.reviewTitle, { color: colors.text }]}>
              {review.title}
            </Text>
          )}

          <Text
            style={[styles.reviewContent, { color: colors.textSecondary }]}
            numberOfLines={variant === 'compact' ? 3 : undefined}
          >
            {review.content}
          </Text>
        </View>

        {/* Review Images */}
        {review.images && review.images.length > 0 && (
          <View style={styles.imagesContainer}>
            {review.images.slice(0, 3).map((image, index) => (
              <View key={index} style={styles.imageItem}>
                <OptimizedImage
                  source={{ uri: image }}
                  style={styles.reviewImage}
                  resizeMode="cover"
                />
                {index === 2 && review.images!.length > 3 && (
                  <View style={styles.moreImagesOverlay}>
                    <Text style={styles.moreImagesText}>
                      +{review.images!.length - 3}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Tags */}
        {review.tags && review.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {review.tags.slice(0, 3).map((tag, index) => (
              <View
                key={index}
                style={[styles.tag, { backgroundColor: colors.background }]}
              >
                <Text style={[styles.tagText, { color: colors.primary }]}>
                  #{tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Footer Actions */}
        <View style={styles.footer}>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                helpful && styles.actionButtonActive,
              ]}
              onPress={handleHelpful}
            >
              <ThumbsUp
                color={helpful ? '#1D4ED8' : colors.textSecondary}
                size={16}
                fill={helpful ? '#1D4ED8' : 'transparent'}
              />
              <Text
                style={[
                  styles.actionText,
                  { color: helpful ? '#1D4ED8' : colors.textSecondary },
                ]}
              >
                Helpful ({review.helpful + (helpful ? 1 : 0)})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, liked && styles.actionButtonActive]}
              onPress={handleLike}
            >
              <Heart
                color={liked ? '#EF4444' : colors.textSecondary}
                size={16}
                fill={liked ? '#EF4444' : 'transparent'}
              />
              <Text
                style={[
                  styles.actionText,
                  { color: liked ? '#EF4444' : colors.textSecondary },
                ]}
              >
                Like
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <MessageCircle color={colors.textSecondary} size={16} />
              <Text
                style={[styles.actionText, { color: colors.textSecondary }]}
              >
                Reply
              </Text>
            </TouchableOpacity>
          </View>

          {/* Trending Indicator */}
          {review.helpful > 50 && (
            <View style={styles.trendingBadge}>
              <TrendingUp color="#10B981" size={12} />
              <Text style={styles.trendingText}>Trending Review</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  },
);

const getThemedStyles = (colors: any, variant: string) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.white,
      borderRadius: 16,
      padding: 16,
      marginVertical: 8,
      marginHorizontal: 16,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        android: {
          elevation: 6,
        },
      }),
    },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },

    userSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },

    avatarContainer: {
      position: 'relative',
      marginRight: 12,
    },

    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
    },

    verifiedBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: colors.white,
      borderRadius: 10,
      padding: 2,
    },

    userInfo: {
      flex: 1,
    },

    userName: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
    },

    userMeta: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    userMetaText: {
      fontSize: 12,
      fontWeight: '500',
    },

    headerActions: {
      alignItems: 'flex-end',
    },

    ratingContainer: {
      alignItems: 'flex-end',
      marginBottom: 8,
    },

    starsRow: {
      flexDirection: 'row',
      gap: 2,
      marginBottom: 4,
    },

    ratingNumber: {
      fontSize: 14,
      fontWeight: '600',
    },

    shareButton: {
      padding: 4,
    },

    carDetails: {
      marginBottom: 12,
    },

    carTitle: {
      fontSize: 14,
      fontWeight: '600',
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.background,
      borderRadius: 8,
      alignSelf: 'flex-start',
    },

    content: {
      marginBottom: 12,
    },

    reviewTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
      lineHeight: 22,
    },

    reviewContent: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
    },

    imagesContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },

    imageItem: {
      position: 'relative',
    },

    reviewImage: {
      width: 80,
      height: 60,
      borderRadius: 8,
    },

    moreImagesOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },

    moreImagesText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },

    tagsContainer: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 12,
    },

    tag: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },

    tagText: {
      fontSize: 12,
      fontWeight: '500',
    },

    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    actionButtons: {
      flexDirection: 'row',
      gap: 16,
      flex: 1,
    },

    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 4,
    },

    actionButtonActive: {
      // Active state handled by color changes
    },

    actionText: {
      fontSize: 12,
      fontWeight: '500',
    },

    trendingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderRadius: 12,
    },

    trendingText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#10B981',
    },
  });

export { PremiumReviewCard };
