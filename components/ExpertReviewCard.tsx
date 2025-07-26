import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useThemeColors } from '@/hooks/useTheme';
import { Review } from '@/types/database';
import {
  Star,
  Award,
  Calendar,
  User,
  Clock,
  TrendingUp,
  CheckCircle,
  Eye,
} from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');

interface ExpertReviewCardProps {
  review: Review & {
    image?: string;
    hasVideo?: boolean;
    readTime?: string;
    category?: string;
    publishedDate?: string;
    likes?: number;
    views?: number;
    excerpt?: string;
    expertCredentials?: string;
    verificationBadge?: boolean;
  };
  isListView?: boolean;
  onPress?: () => void;
  isHeadline?: boolean;
}

export const ExpertReviewCard = memo<ExpertReviewCardProps>(
  ({ review, isListView = false, onPress, isHeadline = false }) => {
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

    const formatViews = (views: number) => {
      if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
      if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
      return views.toString();
    };

    const renderExpertBadge = () => (
      <View style={styles.expertBadge}>
        <CheckCircle color={colors.success} size={12} fill={colors.success} />
        <Text style={styles.expertBadgeText}>Expert Review</Text>
      </View>
    );

    const renderCSScore = () => {
      if (!review.cs_score) return null;

      return (
        <View style={styles.csScoreContainer}>
          <View style={styles.csScoreBadge}>
            <Award color={colors.primary} size={16} fill={colors.primary} />
            <Text style={styles.csScoreText}>CS Score</Text>
          </View>
          <Text style={styles.csScoreValue}>{review.cs_score}/100</Text>
        </View>
      );
    };

    const renderRatingDisplay = () => (
      <View style={styles.ratingContainer}>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              color={star <= review.rating ? colors.warning : colors.border}
              size={14}
              fill={star <= review.rating ? colors.warning : 'transparent'}
            />
          ))}
        </View>
        <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
        {renderCSScore()}
      </View>
    );

    if (isHeadline) {
      return (
        <TouchableOpacity
          style={styles.headlineCard}
          activeOpacity={0.9}
          onPress={onPress}
        >
          <OptimizedImage
            source={{
              uri:
                review.image ||
                'https://via.placeholder.com/400x300?text=No+Image',
            }}
            style={styles.headlineImage}
            resizeMode="cover"
          />

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.headlineOverlay}
          >
            <View style={styles.headlineContent}>
              <View style={styles.headlineTop}>
                {renderExpertBadge()}
                {review.hasVideo && (
                  <View style={styles.playButton}>
                    <Play color={colors.white} size={20} fill={colors.white} />
                  </View>
                )}
              </View>

              <View style={styles.headlineBottom}>
                <View style={styles.categoryContainer}>
                  <Text style={styles.categoryText}>{review.category}</Text>
                </View>

                <Text style={styles.headlineTitle} numberOfLines={2}>
                  {review.title}
                </Text>

                <Text style={styles.headlineExcerpt} numberOfLines={2}>
                  {review.excerpt}
                </Text>

                <View style={styles.headlineMeta}>
                  <View style={styles.authorContainer}>
                    <Text style={styles.headlineAuthor}>
                      by {review.author}
                    </Text>
                    {review.expertCredentials && (
                      <Text style={styles.expertCredentials}>
                        {review.expertCredentials}
                      </Text>
                    )}
                  </View>

                  {renderRatingDisplay()}
                </View>

                <View style={styles.headlineStats}>
                  <View style={styles.statItem}>
                    <Eye color={colors.textSecondary} size={14} />
                    <Text style={styles.statText}>
                      {formatViews(review.views || 0)}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Clock color={colors.textSecondary} size={14} />
                    <Text style={styles.statText}>{review.readTime}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Calendar color={colors.textSecondary} size={14} />
                    <Text style={styles.statText}>
                      {formatDate(review.publishedDate || review.created_at)}
                    </Text>
                  </View>
                </View>
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
        <View
          style={[
            styles.reviewImageContainer,
            isListView && styles.reviewImageContainerList,
          ]}
        >
          <OptimizedImage
            source={{
              uri:
                review.image ||
                'https://via.placeholder.com/400x300?text=No+Image',
            }}
            style={styles.reviewImage}
            resizeMode="cover"
          />

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.reviewImageOverlay}
          >
            <View style={styles.overlayTop}>
              {renderExpertBadge()}
              {review.hasVideo && (
                <View style={styles.playButton}>
                  <Play color={colors.white} size={16} fill={colors.white} />
                </View>
              )}
            </View>

            <View style={styles.overlayBottom}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{review.category}</Text>
              </View>
              {renderRatingDisplay()}
            </View>
          </LinearGradient>
        </View>

        <View
          style={[styles.reviewContent, isListView && styles.reviewContentList]}
        >
          <Text style={styles.reviewTitle} numberOfLines={isListView ? 3 : 2}>
            {review.title}
          </Text>

          {isListView && review.excerpt && (
            <Text style={styles.reviewExcerpt} numberOfLines={2}>
              {review.excerpt}
            </Text>
          )}

          <View style={styles.reviewMeta}>
            <View style={styles.authorInfo}>
              <User color={colors.textSecondary} size={14} />
              <View style={styles.authorDetails}>
                <Text style={styles.authorName}>{review.author}</Text>
                {review.expertCredentials && (
                  <Text style={styles.authorCredentials}>
                    {review.expertCredentials}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.metaRight}>
              <View style={styles.readTime}>
                <Clock color={colors.textSecondary} size={12} />
                <Text style={styles.readTimeText}>{review.readTime}</Text>
              </View>
            </View>
          </View>

          <View style={styles.reviewStats}>
            <View style={styles.statItem}>
              <Eye color={colors.textSecondary} size={14} />
              <Text style={styles.statText}>
                {formatViews(review.views || 0)}
              </Text>
            </View>
            <View style={styles.statItem}>
              <ThumbsUp color={colors.textSecondary} size={14} />
              <Text style={styles.statText}>{review.likes || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Calendar color={colors.textSecondary} size={14} />
              <Text style={styles.statText}>
                {formatDate(review.publishedDate || review.created_at)}
              </Text>
            </View>
            <TouchableOpacity style={styles.bookmarkButton}>
              <Bookmark color={colors.textSecondary} size={14} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  },
);

const getStyles = (colors: any) =>
  StyleSheet.create({
    // Headline Card Styles
    headlineCard: {
      width: width - 32,
      height: 300,
      borderRadius: 16,
      overflow: 'hidden',
      marginVertical: 8,
      elevation: 8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    headlineImage: {
      width: '100%',
      height: '100%',
    },
    headlineOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 20,
      paddingVertical: 16,
      justifyContent: 'space-between',
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
    headlineBottom: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    categoryContainer: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      marginBottom: 12,
    },
    categoryText: {
      color: colors.white,
      fontSize: 12,
      fontWeight: '600',
    },
    headlineTitle: {
      color: colors.white,
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
      lineHeight: 30,
    },
    headlineExcerpt: {
      color: colors.white,
      fontSize: 16,
      opacity: 0.9,
      marginBottom: 16,
      lineHeight: 22,
    },
    headlineMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: 12,
    },
    authorContainer: {
      flex: 1,
    },
    headlineAuthor: {
      color: colors.white,
      fontSize: 14,
      fontWeight: '600',
    },
    expertCredentials: {
      color: colors.white,
      fontSize: 12,
      opacity: 0.8,
      fontStyle: 'italic',
    },
    headlineStats: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },

    // Regular Card Styles
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
      flexDirection: 'row',
      height: 120,
    },
    reviewImageContainer: {
      height: 200,
      position: 'relative',
    },
    reviewImageContainerList: {
      width: 120,
      height: '100%',
    },
    reviewImage: {
      width: '100%',
      height: '100%',
    },
    reviewImageOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: 12,
      paddingVertical: 10,
      justifyContent: 'space-between',
    },
    overlayTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    overlayBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },

    // Expert Badge
    expertBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
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

    // Play Button
    playButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Category Badge
    categoryBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
    },
    categoryBadgeText: {
      color: colors.white,
      fontSize: 10,
      fontWeight: '600',
    },

    // Rating Container
    ratingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    starsContainer: {
      flexDirection: 'row',
      gap: 2,
    },
    ratingText: {
      color: colors.white,
      fontSize: 12,
      fontWeight: '600',
    },

    // CS Score
    csScoreContainer: {
      alignItems: 'center',
      marginLeft: 8,
    },
    csScoreBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      gap: 4,
    },
    csScoreText: {
      color: colors.white,
      fontSize: 8,
      fontWeight: '600',
    },
    csScoreValue: {
      color: colors.white,
      fontSize: 16,
      fontWeight: 'bold',
      marginTop: 2,
    },

    // Content
    reviewContent: {
      padding: 16,
    },
    reviewContentList: {
      flex: 1,
      padding: 12,
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

    // Meta Information
    reviewMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
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
    readTime: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    readTimeText: {
      fontSize: 12,
      color: colors.textSecondary,
    },

    // Stats
    reviewStats: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
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
    bookmarkButton: {
      padding: 4,
    },
  });

ExpertReviewCard.displayName = 'ExpertReviewCard';
