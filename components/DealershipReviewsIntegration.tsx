import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { useThemeColors } from '@/hooks/useTheme';
import {
  Star,
  Award,
  Users,
  ChevronRight,
  TrendingUp,
} from '@/utils/ultra-optimized-icons';

interface DealershipQuickStatsProps {
  dealerId: string;
  dealerName: string;
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
  onViewReviews: () => void;
  compact?: boolean;
}

export const DealershipQuickStats: React.FC<DealershipQuickStatsProps> = ({
  dealerId,
  dealerName,
  rating = 0,
  reviewCount = 0,
  verified = false,
  onViewReviews,
  compact = false,
}) => {
  const { colors } = useThemeColors();
  const styles = getStyles(colors, compact);

  if (reviewCount === 0) {
    return (
      <View style={styles.noReviewsContainer}>
        <Text style={styles.noReviewsText}>No expert reviews yet</Text>
        <TouchableOpacity style={styles.requestButton} onPress={onViewReviews}>
          <Text style={styles.requestButtonText}>Request Review</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          color={i <= rating ? colors.warning : colors.border}
          size={compact ? 12 : 14}
          fill={i <= rating ? colors.warning : 'transparent'}
        />,
      );
    }
    return stars;
  };

  if (compact) {
    return (
      <TouchableOpacity style={styles.compactContainer} onPress={onViewReviews}>
        <View style={styles.compactRating}>
          <View style={styles.compactStars}>{renderStars()}</View>
          <Text style={styles.compactRatingText}>{rating.toFixed(1)}</Text>
        </View>
        <Text style={styles.compactReviewText}>
          {reviewCount} review{reviewCount !== 1 ? 's' : ''}
        </Text>
        <ChevronRight color={colors.textSecondary} size={14} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expert Reviews</Text>
        {verified && (
          <View style={styles.verifiedBadge}>
            <Shield color={colors.success} size={12} fill={colors.success} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
      </View>

      <View style={styles.ratingRow}>
        <View style={styles.starsContainer}>{renderStars()}</View>
        <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
        <Text style={styles.reviewCount}>
          ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
        </Text>
      </View>

      <View style={styles.highlights}>
        <View style={styles.highlightItem}>
          <Users color={colors.primary} size={14} />
          <Text style={styles.highlightText}>Customer Service</Text>
          <Text style={styles.highlightValue}>4.2</Text>
        </View>
        <View style={styles.highlightItem}>
          <TrendingUp color={colors.primary} size={14} />
          <Text style={styles.highlightText}>Sales Process</Text>
          <Text style={styles.highlightValue}>4.1</Text>
        </View>
        <View style={styles.highlightItem}>
          <Award color={colors.primary} size={14} />
          <Text style={styles.highlightText}>Facility</Text>
          <Text style={styles.highlightValue}>4.3</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.viewButton} onPress={onViewReviews}>
        <Text style={styles.viewButtonText}>View Detailed Reviews</Text>
        <ChevronRight color={colors.primary} size={16} />
      </TouchableOpacity>
    </View>
  );
};

// Quick access component for marketplace integration
interface MarketplaceDealershipLinkProps {
  onNavigateToDealershipReviews: () => void;
  featuredCount?: number;
}

export const MarketplaceDealershipLink: React.FC<
  MarketplaceDealershipLinkProps
> = ({ onNavigateToDealershipReviews, featuredCount = 0 }) => {
  const { colors } = useThemeColors();
  const styles = getStyles(colors);

  return (
    <TouchableOpacity
      style={styles.marketplaceLink}
      onPress={onNavigateToDealershipReviews}
    >
      <View style={styles.marketplaceLinkContent}>
        <View style={styles.marketplaceLinkIcon}>
          <Award color={colors.primary} size={24} />
        </View>
        <View style={styles.marketplaceLinkText}>
          <Text style={styles.marketplaceLinkTitle}>Dealership Reviews</Text>
          <Text style={styles.marketplaceLinkSubtitle}>
            {featuredCount > 0
              ? `${featuredCount} expert dealership evaluations available`
              : 'Independent dealership evaluations'}
          </Text>
        </View>
        <ChevronRight color={colors.textSecondary} size={20} />
      </View>
    </TouchableOpacity>
  );
};

const getStyles = (colors: any, compact: boolean = false) =>
  StyleSheet.create({
    // Regular Container
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.success + '20',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      gap: 4,
    },
    verifiedText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.success,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    starsContainer: {
      flexDirection: 'row',
      gap: 2,
    },
    ratingText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    reviewCount: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    highlights: {
      gap: 8,
      marginBottom: 16,
    },
    highlightItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    highlightText: {
      fontSize: 12,
      color: colors.textSecondary,
      flex: 1,
    },
    highlightValue: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    viewButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryLight,
      paddingVertical: 12,
      borderRadius: 8,
      gap: 6,
    },
    viewButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },

    // Compact Container
    compactContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 8,
    },
    compactRating: {
      alignItems: 'center',
      gap: 2,
    },
    compactStars: {
      flexDirection: 'row',
      gap: 1,
    },
    compactRatingText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    compactReviewText: {
      fontSize: 12,
      color: colors.textSecondary,
      flex: 1,
    },

    // No Reviews State
    noReviewsContainer: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      gap: 8,
    },
    noReviewsText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    requestButton: {
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
    },
    requestButtonText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.primary,
    },

    // Marketplace Link
    marketplaceLink: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginHorizontal: 16,
      marginVertical: 8,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    marketplaceLinkContent: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 12,
    },
    marketplaceLinkIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    marketplaceLinkText: {
      flex: 1,
      gap: 4,
    },
    marketplaceLinkTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    marketplaceLinkSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  });
