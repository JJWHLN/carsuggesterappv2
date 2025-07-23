import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import { Car, Users, Award, TrendingUp, Star } from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');

interface StatItem {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface StatsGridProps {
  style?: any;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ style }) => {
  const { colors } = useThemeColors();

  const stats: StatItem[] = [
    {
      title: '15,000+',
      subtitle: 'Verified Listings',
      icon: <Car color="#22C55E" size={28} />,
      color: '#22C55E',
      bgColor: '#ECFDF5',
    },
    {
      title: '500+',
      subtitle: 'Trusted Dealers',
      icon: <Users color="#3B82F6" size={28} />,
      color: '#3B82F6',
      bgColor: '#EFF6FF',
    },
    {
      title: '2,500+',
      subtitle: 'Verified Reviews',
      icon: <Star color="#F59E0B" size={28} />,
      color: '#F59E0B',
      bgColor: '#FFFBEB',
    },
    {
      title: '99.5%',
      subtitle: 'Customer Satisfaction',
      icon: <Award color="#8B5CF6" size={28} />,
      color: '#8B5CF6',
      bgColor: '#F3E8FF',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, style]}>
      {/* Section Header */}
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <Shield color="#22C55E" size={16} />
          <Text style={[styles.badgeText, { color: colors.primary }]}>
            Trusted Platform
          </Text>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          Why Choose CarSuggester?
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Join thousands of satisfied customers who found their perfect car with us
        </Text>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={[styles.statCard, { backgroundColor: colors.white }]}>
            {/* Icon Container */}
            <View style={[styles.iconContainer, { backgroundColor: stat.bgColor }]}>
              {stat.icon}
            </View>
            
            {/* Content */}
            <View style={styles.statContent}>
              <Text style={[styles.statValue, { color: stat.color }]}>
                {stat.title}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {stat.subtitle}
              </Text>
            </View>

            {/* Trend Indicator */}
            <View style={styles.trendContainer}>
              <TrendingUp color={stat.color} size={16} />
            </View>
          </View>
        ))}
      </View>

      {/* Bottom Trust Bar */}
      <View style={[styles.trustBar, { backgroundColor: colors.white }]}>
        <View style={styles.trustItem}>
          <View style={[styles.trustDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.trustText, { color: colors.textSecondary }]}>
            SSL Secured
          </Text>
        </View>
        <View style={styles.trustItem}>
          <View style={[styles.trustDot, { backgroundColor: '#3B82F6' }]} />
          <Text style={[styles.trustText, { color: colors.textSecondary }]}>
            Verified Dealers
          </Text>
        </View>
        <View style={styles.trustItem}>
          <View style={[styles.trustDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={[styles.trustText, { color: colors.textSecondary }]}>
            Best Price Guarantee
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.card,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  title: {
    ...Typography.sectionTitle,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodyText,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: width * 0.8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    width: (width - Spacing.lg * 3) / 2,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    position: 'relative',
    ...Shadows.sm,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  statContent: {
    alignItems: 'center',
  },
  statValue: {
    ...Typography.h2,
    fontWeight: '800',
    marginBottom: Spacing.xs,
    fontSize: 24,
  },
  statLabel: {
    ...Typography.caption,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 16,
  },
  trendContainer: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    opacity: 0.6,
  },
  trustBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    marginTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  trustDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trustText: {
    ...Typography.caption,
    fontWeight: '500',
  },
});
