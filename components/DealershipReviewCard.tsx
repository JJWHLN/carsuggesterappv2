import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useTheme';
import { DealershipReview } from '@/types/database';
import {
  MapPin,
  Star,
  CheckCircle,
  Clock,
  User,
  Award,
  TrendingUp,
  Users,
  Calendar,
  Eye,
} from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');

interface DealershipReviewCardProps {
  review: DealershipReview & {
    views?: number;
    likes?: number;
    dealership_score?: number;
  };
  isListView?: boolean;
  onPress?: () => void;
  isHeadline?: boolean;
  showDealerInfo?: boolean;
}

export const DealershipReviewCard = memo<DealershipReviewCardProps>(
  ({
    review,
    isListView = false,
    onPress,
    isHeadline = false,
    showDealerInfo = true,
  }) => {
    const { colors } = useThemeColors();
    const styles = getStyles(colors);

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    };

    const getScoreColor = (score: number) => {
      if (score >= 4.5) return colors.success;
      if (score >= 4.0) return colors.primary;
      if (score >= 3.5) return colors.warning;
      return colors.error;
    };

    const getReviewTypeDisplay = (type: string) => {
      switch (type) {
        case 'expert_visit':
          return 'Expert Visit Review';
        case 'mystery_shopper':
          return 'Mystery Shopper Review';
        case 'customer_experience':
          return 'Customer Experience Review';
        default:
          return 'Dealership Review';
      }
    };

    const renderRatingBreakdown = () => {
      const ratings = [
        {
          label: 'Customer Service',
          value: review.customer_service_rating,
          icon: Users,
        },
        {
          label: 'Sales Process',
          value: review.sales_process_rating,
          icon: TrendingUp,
        },
        { label: 'Facility', value: review.facility_rating, icon: Award },
        {
          label: 'Pricing',
          value: review.pricing_transparency_rating,
          icon: Shield,
        },
        { label: 'Follow-up', value: review.follow_up_rating, icon: Phone },
      ];

      return (
        <View style={styles.ratingBreakdown}>
          {ratings.map((rating, index) => (
            <View key={index} style={styles.ratingRow}>
              <View style={styles.ratingLabel}>
                <rating.icon color={colors.textSecondary} size={14} />
                <Text style={styles.ratingLabelText}>{rating.label}</Text>
              </View>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    color={
                      star <= rating.value ? colors.warning : colors.border
                    }
                    size={12}
                    fill={star <= rating.value ? colors.warning : 'transparent'}
                  />
                ))}
                <Text style={styles.ratingValue}>
                  {rating.value.toFixed(1)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      );
    };

    const renderExpertBadge = () => (
      <View style={styles.expertBadge}>
        <CheckCircle color={colors.success} size={12} fill={colors.success} />
        <Text style={styles.expertBadgeText}>Expert Review</Text>
      </View>
    );

    const renderDealershipScore = () => {
      if (!review.dealership_score) return null;

      return (
        <View style={styles.dealershipScore}>
          <Award color={getScoreColor(review.dealership_score)} size={16} />
          <Text
            style={[
              styles.scoreText,
              { color: getScoreColor(review.dealership_score) },
            ]}
          >
            {review.dealership_score.toFixed(1)}
          </Text>
          <Text style={styles.scoreLabel}>Dealer Score</Text>
        </View>
      );
    };

    if (isHeadline) {
      return (
        <TouchableOpacity
          style={styles.headlineCard}
          activeOpacity={0.9}
          onPress={onPress}
        >
          <LinearGradient
            colors={[colors.primary, colors.primaryHover]}
            style={styles.headlineGradient}
          >
            <View style={styles.headlineContent}>
              <View style={styles.headlineTop}>
                {renderExpertBadge()}
                <View style={styles.reviewTypeBadge}>
                  <Text style={styles.reviewTypeText}>
                    {getReviewTypeDisplay(review.review_type)}
                  </Text>
                </View>
              </View>

              <View style={styles.headlineMain}>
                {showDealerInfo && review.dealers && (
                  <View style={styles.dealerInfo}>
                    <Text style={styles.dealerName}>
                      {review.dealers.business_name}
                    </Text>
                    <View style={styles.dealerLocation}>
                      <MapPin color={colors.white} size={14} />
                      <Text style={styles.locationText}>
                        {review.dealers.city}, {review.dealers.state}
                      </Text>
                    </View>
                  </View>
                )}

                <Text style={styles.headlineTitle} numberOfLines={2}>
                  {review.title}
                </Text>

                <Text style={styles.headlineExcerpt} numberOfLines={2}>
                  {review.expert_summary}
                </Text>
              </View>

              <View style={styles.headlineBottom}>
                <View style={styles.overallRating}>
                  <Star
                    color={colors.warning}
                    size={20}
                    fill={colors.warning}
                  />
                  <Text style={styles.overallRatingText}>
                    {review.overall_rating.toFixed(1)}
                  </Text>
                </View>

                {renderDealershipScore()}
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[styles.reviewCard, isListView && styles.reviewCardList]}
        activeOpacity={0.9}
        onPress={onPress}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            {renderExpertBadge()}
            <View style={styles.reviewTypeContainer}>
              <Text style={styles.reviewTypeSmall}>
                {getReviewTypeDisplay(review.review_type)}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.overallRatingSmall}>
              <Star color={colors.warning} size={16} fill={colors.warning} />
              <Text style={styles.overallRatingSmallText}>
                {review.overall_rating.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

        {showDealerInfo && review.dealers && (
          <View style={styles.dealerInfoCard}>
            <View style={styles.dealerHeader}>
              <Text style={styles.dealerNameCard}>
                {review.dealers.business_name}
              </Text>
              {review.dealers.verified && (
                <CheckCircle
                  color={colors.success}
                  size={14}
                  fill={colors.success}
                />
              )}
            </View>
            <View style={styles.dealerLocationCard}>
              <MapPin color={colors.textSecondary} size={12} />
              <Text style={styles.locationTextCard}>
                {review.dealers.city}, {review.dealers.state}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.reviewContent}>
          <Text style={styles.reviewTitle} numberOfLines={isListView ? 3 : 2}>
            {review.title}
          </Text>

          {isListView && (
            <Text style={styles.reviewExcerpt} numberOfLines={2}>
              {review.expert_summary}
            </Text>
          )}

          {!isListView && renderRatingBreakdown()}
        </View>

        <View style={styles.reviewMeta}>
          <View style={styles.authorInfo}>
            <User color={colors.textSecondary} size={14} />
            <View style={styles.authorDetails}>
              <Text style={styles.authorName}>{review.author}</Text>
              <Text style={styles.authorCredentials}>
                {review.author_credentials}
              </Text>
            </View>
          </View>

          <View style={styles.metaRight}>
            <View style={styles.visitDate}>
              <Calendar color={colors.textSecondary} size={12} />
              <Text style={styles.visitDateText}>
                {formatDate(review.visit_date)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.reviewStats}>
          <View style={styles.statItem}>
            <Eye color={colors.textSecondary} size={14} />
            <Text style={styles.statText}>{review.views || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <ThumbsUp color={colors.textSecondary} size={14} />
            <Text style={styles.statText}>{review.likes || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Clock color={colors.textSecondary} size={14} />
            <Text style={styles.statText}>{formatDate(review.created_at)}</Text>
          </View>
          {renderDealershipScore()}
        </View>
      </TouchableOpacity>
    );
  },
);

const getStyles = (colors: any) =>
  StyleSheet.create({
    // Headline Card
    headlineCard: {
      width: width - 32,
      height: 280,
      borderRadius: 16,
      overflow: 'hidden',
      marginVertical: 8,
      elevation: 8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    headlineGradient: {
      flex: 1,
      padding: 20,
    },
    headlineContent: {
      flex: 1,
      justifyContent: 'space-between',
    },
    headlineTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    headlineMain: {
      flex: 1,
      justifyContent: 'center',
      gap: 8,
    },
    headlineBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },

    // Regular Card
    reviewCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 16,
      elevation: 4,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    reviewCardList: {
      marginBottom: 12,
    },

    // Card Header
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    headerRight: {
      alignItems: 'flex-end',
    },

    // Expert Badge
    expertBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.white,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    expertBadgeText: {
      color: colors.success,
      fontSize: 10,
      fontWeight: '600',
    },

    // Review Type Badge
    reviewTypeBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
    },
    reviewTypeText: {
      color: colors.white,
      fontSize: 10,
      fontWeight: '600',
    },
    reviewTypeContainer: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    reviewTypeSmall: {
      color: colors.primary,
      fontSize: 9,
      fontWeight: '600',
    },

    // Dealer Info
    dealerInfo: {
      alignItems: 'center',
      marginBottom: 8,
    },
    dealerName: {
      color: colors.white,
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
    },
    dealerLocation: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    locationText: {
      color: colors.white,
      fontSize: 12,
      opacity: 0.9,
    },

    dealerInfoCard: {
      padding: 12,
      backgroundColor: colors.primaryLight,
    },
    dealerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dealerNameCard: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    dealerLocationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
    },
    locationTextCard: {
      fontSize: 12,
      color: colors.textSecondary,
    },

    // Content
    reviewContent: {
      padding: 16,
    },
    reviewTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      lineHeight: 22,
      marginBottom: 8,
    },
    reviewExcerpt: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    headlineTitle: {
      color: colors.white,
      fontSize: 20,
      fontWeight: 'bold',
      lineHeight: 26,
      textAlign: 'center',
    },
    headlineExcerpt: {
      color: colors.white,
      fontSize: 14,
      opacity: 0.9,
      lineHeight: 20,
      textAlign: 'center',
    },

    // Ratings
    overallRating: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    overallRatingText: {
      color: colors.white,
      fontSize: 18,
      fontWeight: 'bold',
    },
    overallRatingSmall: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    overallRatingSmallText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },

    ratingBreakdown: {
      gap: 8,
      marginTop: 8,
    },
    ratingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    ratingLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    ratingLabelText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    ratingStars: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    ratingValue: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 4,
    },

    // Dealership Score
    dealershipScore: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    scoreText: {
      fontSize: 14,
      fontWeight: 'bold',
    },
    scoreLabel: {
      fontSize: 10,
      color: colors.white,
      opacity: 0.8,
    },

    // Meta Information
    reviewMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 12,
    },
    authorInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },
    authorDetails: {
      flex: 1,
    },
    authorName: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    authorCredentials: {
      fontSize: 10,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    metaRight: {
      alignItems: 'flex-end',
    },
    visitDate: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    visitDateText: {
      fontSize: 12,
      color: colors.textSecondary,
    },

    // Stats
    reviewStats: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingBottom: 16,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    statText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });

DealershipReviewCard.displayName = 'DealershipReviewCard';
