import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useThemeColors } from '@/hooks/useTheme';
import { Star, TrendingUp, Award } from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');

interface FeaturedSectionProps {
  onPressFeatured?: () => void;
}

const FeaturedSection: React.FC<FeaturedSectionProps> = ({ onPressFeatured }) => {
  const { colors } = useThemeColors();
  const styles = getThemedStyles(colors);

  return (
    <View style={styles.featuredSection}>
      <View style={styles.sectionHeader}>
        <Star size={20} color={colors.primary} />
        <Text style={styles.sectionTitle}>Featured Deals</Text>
      </View>
      <TouchableOpacity style={styles.featuredCard} onPress={onPressFeatured}>
        <View style={styles.featuredContent}>
          <View style={styles.featuredBadge}>
            <Award size={16} color={colors.background} />
            <Text style={styles.featuredBadgeText}>Premium</Text>
          </View>
          <Text style={styles.featuredTitle}>Certified Pre-Owned Vehicles</Text>
          <Text style={styles.featuredSubtitle}>Up to 30% off market value</Text>
          <View style={styles.featuredStats}>
            <TrendingUp size={16} color={colors.success} />
            <Text style={styles.featuredStatsText}>500+ vehicles available</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  featuredSection: {
    marginVertical: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  featuredCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuredContent: {
    alignItems: 'flex-start',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  featuredBadgeText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  featuredTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  featuredSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  featuredStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredStatsText: {
    fontSize: 12,
    color: colors.success,
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default FeaturedSection;
