import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { useThemeColors } from '@/hooks/useTheme';
import { QuickVerificationBadge } from '@/components/ExpertVerification';
import { router } from 'expo-router';
import {
  Star,
  Users,
  TrendingUp,
  ChevronRight,
  Award,
  CheckCircle,
} from '@/utils/ultra-optimized-icons';

interface AuthorityWidgetProps {
  variant?: 'compact' | 'featured' | 'inline';
  showMetrics?: boolean;
  onPress?: () => void;
}

export const AuthorityWidget: React.FC<AuthorityWidgetProps> = ({
  variant = 'compact',
  showMetrics = true,
  onPress,
}) => {
  const { colors } = useThemeColors();
  const styles = getStyles(colors);

  const metrics = {
    trustScore: 98,
    expertCount: 23,
    reviewsCount: 1247,
    userSatisfaction: 96,
  };

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/authority-building');
    }
  };

  const renderCompact = () => (
    <TouchableOpacity style={styles.compactContainer} onPress={handlePress}>
      <View style={styles.compactHeader}>
        <Shield color={colors.success} size={16} fill={colors.success} />
        <Text style={styles.compactTitle}>Trusted Experts</Text>
        <QuickVerificationBadge
          verificationLevel="master"
          size="small"
          showText={false}
        />
      </View>
      <Text style={styles.compactDescription}>
        {metrics.expertCount} verified automotive professionals
      </Text>
      <View style={styles.compactFooter}>
        <Star color={colors.warning} size={12} fill={colors.warning} />
        <Text style={styles.compactMetric}>
          {metrics.trustScore}% trust score
        </Text>
        <ChevronRight color={colors.textSecondary} size={14} />
      </View>
    </TouchableOpacity>
  );

  const renderFeatured = () => (
    <TouchableOpacity style={styles.featuredContainer} onPress={handlePress}>
      <View style={styles.featuredHeader}>
        <View style={styles.featuredTitleRow}>
          <Shield color={colors.primary} size={24} />
          <Text style={styles.featuredTitle}>CarSuggester Authority</Text>
        </View>
        <QuickVerificationBadge verificationLevel="master" />
      </View>

      <Text style={styles.featuredDescription}>
        Trusted automotive expertise from verified industry professionals
      </Text>

      {showMetrics && (
        <View style={styles.featuredMetrics}>
          <View style={styles.featuredMetric}>
            <Users color={colors.primary} size={16} />
            <Text style={styles.featuredMetricValue}>
              {metrics.expertCount}
            </Text>
            <Text style={styles.featuredMetricLabel}>Experts</Text>
          </View>

          <View style={styles.featuredMetric}>
            <TrendingUp color={colors.success} size={16} />
            <Text style={styles.featuredMetricValue}>
              {metrics.trustScore}%
            </Text>
            <Text style={styles.featuredMetricLabel}>Trust</Text>
          </View>

          <View style={styles.featuredMetric}>
            <Award color={colors.warning} size={16} />
            <Text style={styles.featuredMetricValue}>
              {metrics.reviewsCount.toLocaleString()}
            </Text>
            <Text style={styles.featuredMetricLabel}>Reviews</Text>
          </View>
        </View>
      )}

      <View style={styles.featuredFooter}>
        <Text style={styles.featuredFooterText}>Learn about our expertise</Text>
        <ChevronRight color={colors.primary} size={16} />
      </View>
    </TouchableOpacity>
  );

  const renderInline = () => (
    <View style={styles.inlineContainer}>
      <View style={styles.inlineContent}>
        <CheckCircle color={colors.success} size={16} fill={colors.success} />
        <Text style={styles.inlineText}>
          Expert verified by CarSuggester's trusted automotive professionals
        </Text>
      </View>
      <TouchableOpacity style={styles.inlineButton} onPress={handlePress}>
        <Text style={styles.inlineButtonText}>Learn More</Text>
      </TouchableOpacity>
    </View>
  );

  switch (variant) {
    case 'featured':
      return renderFeatured();
    case 'inline':
      return renderInline();
    default:
      return renderCompact();
  }
};

// Trust indicator for individual reviews/content
interface TrustIndicatorProps {
  verificationLevel: 'verified' | 'expert' | 'master';
  expertName?: string;
  qualityScore?: number;
  onPress?: () => void;
}

export const TrustIndicator: React.FC<TrustIndicatorProps> = ({
  verificationLevel,
  expertName,
  qualityScore,
  onPress,
}) => {
  const { colors } = useThemeColors();
  const styles = getStyles(colors);

  return (
    <TouchableOpacity
      style={styles.trustIndicatorContainer}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.trustIndicatorContent}>
        <QuickVerificationBadge
          verificationLevel={verificationLevel}
          size="small"
        />
        {expertName && (
          <Text style={styles.trustIndicatorExpert}>by {expertName}</Text>
        )}
      </View>

      {qualityScore && (
        <View style={styles.qualityScoreContainer}>
          <Text style={styles.qualityScoreText}>{qualityScore}%</Text>
          <Text style={styles.qualityScoreLabel}>Quality</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Quick access buttons for authority features
interface AuthorityQuickAccessProps {
  onViewExperts?: () => void;
  onViewTrust?: () => void;
  onViewQuality?: () => void;
}

export const AuthorityQuickAccess: React.FC<AuthorityQuickAccessProps> = ({
  onViewExperts,
  onViewTrust,
  onViewQuality,
}) => {
  const { colors } = useThemeColors();
  const styles = getStyles(colors);

  const quickActions = [
    {
      icon: Users,
      label: 'Our Experts',
      onPress: onViewExperts || (() => router.push('/authority-building')),
    },
    {
      icon: Shield,
      label: 'Trust & Safety',
      onPress: onViewTrust || (() => router.push('/authority-building')),
    },
    {
      icon: Award,
      label: 'Quality Standards',
      onPress: onViewQuality || (() => router.push('/authority-building')),
    },
  ];

  return (
    <View style={styles.quickAccessContainer}>
      {quickActions.map((action, index) => (
        <TouchableOpacity
          key={index}
          style={styles.quickAccessButton}
          onPress={action.onPress}
        >
          <action.icon color={colors.primary} size={20} />
          <Text style={styles.quickAccessLabel}>{action.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    // Compact variant
    compactContainer: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    compactHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    compactTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    compactDescription: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    compactFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    compactMetric: {
      fontSize: 11,
      color: colors.textSecondary,
      flex: 1,
    },

    // Featured variant
    featuredContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    featuredHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    featuredTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    featuredTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    featuredDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    featuredMetrics: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: 8,
    },
    featuredMetric: {
      alignItems: 'center',
      gap: 4,
    },
    featuredMetricValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
    },
    featuredMetricLabel: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    featuredFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    featuredFooterText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },

    // Inline variant
    inlineContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryLight,
      borderRadius: 8,
      padding: 12,
      gap: 12,
    },
    inlineContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    inlineText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '500',
      flex: 1,
    },
    inlineButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.primary,
      borderRadius: 6,
    },
    inlineButtonText: {
      fontSize: 12,
      color: colors.white,
      fontWeight: '600',
    },

    // Trust Indicator
    trustIndicatorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    trustIndicatorContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
    },
    trustIndicatorExpert: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    qualityScoreContainer: {
      alignItems: 'center',
      gap: 2,
    },
    qualityScoreText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: colors.success,
    },
    qualityScoreLabel: {
      fontSize: 10,
      color: colors.textSecondary,
    },

    // Quick Access
    quickAccessContainer: {
      flexDirection: 'row',
      gap: 12,
    },
    quickAccessButton: {
      flex: 1,
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    quickAccessLabel: {
      fontSize: 11,
      color: colors.text,
      fontWeight: '500',
      textAlign: 'center',
    },
  });

export default AuthorityWidget;
