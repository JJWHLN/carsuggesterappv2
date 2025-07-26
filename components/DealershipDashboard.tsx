import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useTheme';
import { DealershipMetrics } from '@/types/database';
import {
  TrendingUp,
  Users,
  Award,
  Star,
  CheckCircle,
  MapPin,
} from '@/utils/ultra-optimized-icons';

interface DealershipDashboardProps {
  metrics: DealershipMetrics;
  dealerName: string;
  location: string;
  verified: boolean;
  onViewAllReviews?: () => void;
  onViewDetails?: () => void;
}

export const DealershipDashboard: React.FC<DealershipDashboardProps> = ({
  metrics,
  dealerName,
  location,
  verified,
  onViewAllReviews,
  onViewDetails,
}) => {
  const { colors } = useThemeColors();
  const styles = getStyles(colors);

  const getScoreColor = (score: number) => {
    if (score >= 4.5) return colors.success;
    if (score >= 4.0) return colors.primary;
    if (score >= 3.5) return colors.warning;
    return colors.error;
  };

  const getScoreGrade = (score: number) => {
    if (score >= 4.5) return 'Excellent';
    if (score >= 4.0) return 'Very Good';
    if (score >= 3.5) return 'Good';
    if (score >= 3.0) return 'Fair';
    return 'Needs Improvement';
  };

  const categoryMetrics = [
    {
      label: 'Customer Service',
      value: metrics.average_customer_service,
      icon: Users,
    },
    {
      label: 'Sales Process',
      value: metrics.average_sales_process,
      icon: TrendingUp,
    },
    {
      label: 'Facility Quality',
      value: metrics.average_facility,
      icon: Award,
    },
    {
      label: 'Pricing Transparency',
      value: metrics.average_pricing_transparency,
      icon: Shield,
    },
    {
      label: 'Follow-up Service',
      value: metrics.average_follow_up,
      icon: Phone,
    },
  ];

  const renderOverallScore = () => {
    const scoreColor = getScoreColor(metrics.overall_score);
    const grade = getScoreGrade(metrics.overall_score);

    return (
      <View style={styles.overallScoreContainer}>
        <LinearGradient
          colors={[scoreColor, `${scoreColor}80`]}
          style={styles.scoreCircle}
        >
          <Star color={colors.white} size={24} fill={colors.white} />
          <Text style={styles.scoreValue}>
            {metrics.overall_score.toFixed(1)}
          </Text>
          <Text style={styles.scoreMax}>/5.0</Text>
        </LinearGradient>

        <View style={styles.scoreDetails}>
          <Text style={styles.scoreGrade}>{grade}</Text>
          <Text style={styles.reviewCount}>
            Based on {metrics.review_count} expert reviews
          </Text>
          <Text style={styles.recommendationRate}>
            {metrics.recommendation_percentage}% would recommend
          </Text>
        </View>
      </View>
    );
  };

  const renderCategoryBreakdown = () => (
    <View style={styles.categoryContainer}>
      <Text style={styles.sectionTitle}>Performance Breakdown</Text>
      {categoryMetrics.map((category, index) => (
        <View key={index} style={styles.categoryRow}>
          <View style={styles.categoryLabel}>
            <category.icon color={colors.textSecondary} size={16} />
            <Text style={styles.categoryText}>{category.label}</Text>
          </View>

          <View style={styles.categoryRating}>
            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${(category.value / 5) * 100}%`,
                      backgroundColor: getScoreColor(category.value),
                    },
                  ]}
                />
              </View>
            </View>
            <Text
              style={[
                styles.categoryValue,
                { color: getScoreColor(category.value) },
              ]}
            >
              {category.value.toFixed(1)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.dealerInfo}>
          <View style={styles.dealerNameRow}>
            <Text style={styles.dealerName}>{dealerName}</Text>
            {verified && (
              <CheckCircle
                color={colors.success}
                size={20}
                fill={colors.success}
              />
            )}
          </View>
          <View style={styles.locationRow}>
            <MapPin color={colors.textSecondary} size={14} />
            <Text style={styles.locationText}>{location}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overall Score */}
        <View style={styles.section}>{renderOverallScore()}</View>

        {/* Category Breakdown */}
        <View style={styles.section}>{renderCategoryBreakdown()}</View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <BarChart3 color={colors.primary} size={20} />
              <Text style={styles.statValue}>{metrics.review_count}</Text>
              <Text style={styles.statLabel}>Expert Reviews</Text>
            </View>

            <View style={styles.statCard}>
              <TrendingUp color={colors.success} size={20} />
              <Text style={styles.statValue}>
                {metrics.recommendation_percentage}%
              </Text>
              <Text style={styles.statLabel}>Recommend Rate</Text>
            </View>

            <View style={styles.statCard}>
              <Award color={colors.warning} size={20} />
              <Text style={styles.statValue}>
                {getScoreGrade(metrics.overall_score)}
              </Text>
              <Text style={styles.statLabel}>Overall Grade</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {onViewAllReviews && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onViewAllReviews}
            >
              <Text style={styles.primaryButtonText}>View All Reviews</Text>
            </TouchableOpacity>
          )}

          {onViewDetails && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={onViewDetails}
            >
              <Text style={styles.secondaryButtonText}>Detailed Analysis</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // Header
    header: {
      backgroundColor: colors.surface,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dealerInfo: {
      gap: 8,
    },
    dealerNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    dealerName: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    locationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    locationText: {
      fontSize: 14,
      color: colors.textSecondary,
    },

    // Content
    content: {
      flex: 1,
    },
    section: {
      backgroundColor: colors.surface,
      margin: 16,
      borderRadius: 12,
      padding: 20,
      elevation: 2,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },

    // Overall Score
    overallScoreContainer: {
      alignItems: 'center',
      gap: 16,
    },
    scoreCircle: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    scoreValue: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.white,
    },
    scoreMax: {
      fontSize: 12,
      color: colors.white,
      opacity: 0.8,
    },
    scoreDetails: {
      alignItems: 'center',
      gap: 4,
    },
    scoreGrade: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    reviewCount: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    recommendationRate: {
      fontSize: 14,
      color: colors.success,
      fontWeight: '500',
    },

    // Category Breakdown
    categoryContainer: {
      gap: 12,
    },
    categoryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16,
    },
    categoryLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    categoryText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    categoryRating: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    progressContainer: {
      flex: 1,
    },
    progressTrack: {
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    categoryValue: {
      fontSize: 14,
      fontWeight: '600',
      minWidth: 32,
      textAlign: 'right',
    },

    // Quick Stats
    statsGrid: {
      flexDirection: 'row',
      gap: 12,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.primaryLight,
      borderRadius: 8,
      padding: 16,
      alignItems: 'center',
      gap: 8,
    },
    statValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },

    // Action Buttons
    actionContainer: {
      padding: 16,
      gap: 12,
    },
    primaryButton: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: colors.white,
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryButton: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.primary,
      paddingVertical: 16,
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '600',
    },
  });
