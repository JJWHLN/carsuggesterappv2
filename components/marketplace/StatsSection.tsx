import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useTheme';
import {
  Car,
  Users,
  TrendingUp,
  DollarSign,
} from '@/utils/ultra-optimized-icons';

interface StatsSectionProps {
  stats?: {
    totalListings: number;
    activeDealers: number;
    avgPrice: number;
    thisMonthSales: number;
  };
}

const StatsSection: React.FC<StatsSectionProps> = ({ stats }) => {
  const { colors } = useThemeColors();
  const styles = getThemedStyles(colors);

  const defaultStats = {
    totalListings: 12847,
    activeDealers: 156,
    avgPrice: 28500,
    thisMonthSales: 1456,
  };

  const currentStats = stats || defaultStats;

  const statItems = [
    {
      icon: <Car size={20} color={colors.primary} />,
      label: 'Total Listings',
      value: currentStats.totalListings.toLocaleString(),
      color: colors.primary,
    },
    {
      icon: <Users size={20} color={colors.primary} />,
      label: 'Active Dealers',
      value: currentStats.activeDealers.toString(),
      color: colors.primary,
    },
    {
      icon: <DollarSign size={20} color={colors.success} />,
      label: 'Avg. Price',
      value: `€${(currentStats.avgPrice / 1000).toFixed(0)}k`,
      color: colors.success,
    },
    {
      icon: <TrendingUp size={20} color={colors.error} />,
      label: 'Monthly Sales',
      value: currentStats.thisMonthSales.toLocaleString(),
      color: colors.error,
    },
  ];

  return (
    <View style={styles.statsSection}>
      <Text style={styles.statsTitle}>Marketplace Overview</Text>
      <View style={styles.statsGrid}>
        {statItems.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <View
              style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}
            >
              {stat.icon}
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const getThemedStyles = (colors: any) =>
  StyleSheet.create({
    statsSection: {
      marginVertical: 16,
      paddingHorizontal: 16,
    },
    statsTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
    },
    statCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center',
      flex: 1,
      minWidth: '22%',
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 1,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    statIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 14,
    },
  });

export default StatsSection;
