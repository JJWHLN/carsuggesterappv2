import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { LoadingState } from './ui/LoadingState';
import { useThemeColors } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import AdvancedAnalyticsService from '@/services/advancedAnalytics';
import * as Haptics from 'expo-haptics';
import {
  TrendingUp,
  Users,
  Eye,
  Heart,
  Clock,
  Star,
  Zap,
} from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');

interface AnalyticsMetrics {
  totalUsers: number;
  activeUsers: number;
  carViews: number;
  favorites: number;
  searchQueries: number;
  conversionRate: number;
  averageSessionTime: number;
  topBrands: Array<{ name: string; views: number }>;
  userEngagement: Array<{ date: string; engagement: number }>;
  searchTrends: Array<{ query: string; count: number }>;
}

interface RealTimeAnalyticsDashboardProps {
  onMetricPress?: (metric: string) => void;
}

const RealTimeAnalyticsDashboard: React.FC<RealTimeAnalyticsDashboardProps> = ({
  onMetricPress,
}) => {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsService] = useState(() =>
    AdvancedAnalyticsService.getInstance(),
  );
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    '1h' | '24h' | '7d' | '30d'
  >('24h');
  const styles = useMemo(() => getThemedStyles(colors), [colors]);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);

      // In a real app, this would fetch actual analytics data from your backend
      // For now, we'll generate mock data based on the timeframe
      const mockMetrics: AnalyticsMetrics = {
        totalUsers: Math.floor(Math.random() * 10000) + 5000,
        activeUsers: Math.floor(Math.random() * 1000) + 500,
        carViews: Math.floor(Math.random() * 50000) + 25000,
        favorites: Math.floor(Math.random() * 5000) + 2500,
        searchQueries: Math.floor(Math.random() * 15000) + 8000,
        conversionRate: Math.random() * 10 + 5,
        averageSessionTime: Math.random() * 300 + 180, // seconds
        topBrands: [
          { name: 'Toyota', views: Math.floor(Math.random() * 5000) + 2000 },
          { name: 'BMW', views: Math.floor(Math.random() * 4000) + 1500 },
          { name: 'Mercedes', views: Math.floor(Math.random() * 3500) + 1200 },
          { name: 'Audi', views: Math.floor(Math.random() * 3000) + 1000 },
          { name: 'Honda', views: Math.floor(Math.random() * 2500) + 800 },
        ],
        userEngagement: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(
            Date.now() - (6 - i) * 24 * 60 * 60 * 1000,
          ).toLocaleDateString('en-US', { weekday: 'short' }),
          engagement: Math.floor(Math.random() * 100) + 50,
        })),
        searchTrends: [
          {
            query: 'electric cars',
            count: Math.floor(Math.random() * 1000) + 500,
          },
          {
            query: 'luxury sedan',
            count: Math.floor(Math.random() * 800) + 400,
          },
          {
            query: 'compact SUV',
            count: Math.floor(Math.random() * 600) + 300,
          },
          {
            query: 'hybrid vehicles',
            count: Math.floor(Math.random() * 500) + 250,
          },
        ],
      };

      setMetrics(mockMetrics);

      // Track dashboard view
      analyticsService.trackUserEngagement('analytics_dashboard_viewed', {
        user_id: user?.id,
        timeframe: selectedTimeframe,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error('Error loading analytics:', error);
      Alert.alert('Error', 'Failed to load analytics data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTimeframe, analyticsService, user]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAnalytics();
  }, [loadAnalytics]);

  const handleTimeframeChange = useCallback(
    (timeframe: '1h' | '24h' | '7d' | '30d') => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setSelectedTimeframe(timeframe);
    },
    [],
  );

  const handleMetricPress = useCallback(
    (metric: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onMetricPress?.(metric);
    },
    [onMetricPress],
  );

  const formatTime = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  }, []);

  const formatNumber = useCallback((num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  }, []);

  const renderMetricCard = useCallback(
    (
      title: string,
      value: string | number,
      icon: React.ReactNode,
      gradient: [string, string],
      change?: string,
      onPress?: () => void,
    ) => (
      <TouchableOpacity
        style={styles.metricCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={gradient}
          style={styles.metricGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.metricIcon}>{icon}</View>
          <Text style={styles.metricValue}>
            {typeof value === 'number' ? formatNumber(value) : value}
          </Text>
          <Text style={styles.metricTitle}>{title}</Text>
          {change && (
            <Text style={[styles.metricChange, { color: colors.success }]}>
              {change}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    ),
    [styles, colors, formatNumber, handleMetricPress],
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingState message="Loading analytics dashboard..." />
      </View>
    );
  }

  if (!metrics) {
    return (
      <View style={styles.container}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Failed to load analytics data
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[colors.primary, '#7c3aed']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <TrendingUp color={colors.white} size={24} />
            <Text style={styles.headerTitle}>Real-Time Analytics</Text>
            <Text style={styles.headerSubtitle}>
              Live insights from your car marketplace
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* Timeframe Selector */}
      <View style={styles.timeframeContainer}>
        {(['1h', '24h', '7d', '30d'] as const).map((timeframe) => (
          <TouchableOpacity
            key={timeframe}
            style={[
              styles.timeframeButton,
              selectedTimeframe === timeframe && styles.timeframeButtonActive,
              {
                borderColor: colors.border,
                backgroundColor:
                  selectedTimeframe === timeframe
                    ? colors.primary
                    : colors.background,
              },
            ]}
            onPress={() => handleTimeframeChange(timeframe)}
          >
            <Text
              style={[
                styles.timeframeText,
                {
                  color:
                    selectedTimeframe === timeframe
                      ? colors.white
                      : colors.text,
                },
              ]}
            >
              {timeframe}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Key Metrics Grid */}
      <View style={styles.metricsGrid}>
        {renderMetricCard(
          'Total Users',
          metrics.totalUsers,
          <Users color="white" size={20} />,
          ['#3b82f6', '#1d4ed8'],
          '+12.5%',
          () => handleMetricPress('total_users'),
        )}

        {renderMetricCard(
          'Active Users',
          metrics.activeUsers,
          <Zap color="white" size={20} />,
          ['#10b981', '#059669'],
          '+8.2%',
          () => handleMetricPress('active_users'),
        )}

        {renderMetricCard(
          'Car Views',
          metrics.carViews,
          <Eye color="white" size={20} />,
          ['#f59e0b', '#d97706'],
          '+15.3%',
          () => handleMetricPress('car_views'),
        )}

        {renderMetricCard(
          'Favorites',
          metrics.favorites,
          <Heart color="white" size={20} />,
          ['#ef4444', '#dc2626'],
          '+22.1%',
          () => handleMetricPress('favorites'),
        )}

        {renderMetricCard(
          'Searches',
          metrics.searchQueries,
          <Star color="white" size={20} />,
          ['#8b5cf6', '#7c3aed'],
          '+18.7%',
          () => handleMetricPress('searches'),
        )}

        {renderMetricCard(
          'Conversion',
          `${metrics.conversionRate.toFixed(1)}%`,
          <TrendingUp color="white" size={20} />,
          ['#06b6d4', '#0891b2'],
          '+2.1%',
          () => handleMetricPress('conversion'),
        )}

        {renderMetricCard(
          'Avg. Session',
          formatTime(metrics.averageSessionTime),
          <Clock color="white" size={20} />,
          ['#84cc16', '#65a30d'],
          '+45s',
          () => handleMetricPress('session_time'),
        )}

        {renderMetricCard(
          'Engagement',
          `${Math.round(metrics.userEngagement.reduce((sum, d) => sum + d.engagement, 0) / metrics.userEngagement.length)}%`,
          <Zap color="white" size={20} />,
          ['#f97316', '#ea580c'],
          '+5.8%',
          () => handleMetricPress('engagement'),
        )}
      </View>

      {/* User Engagement Trend */}
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            User Engagement (7 days)
          </Text>
          <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
            Daily engagement percentage
          </Text>
        </View>
        <View style={styles.simpleChart}>
          {metrics.userEngagement.map((data, index) => (
            <View key={data.date} style={styles.chartBar}>
              <View
                style={[
                  styles.chartBarFill,
                  {
                    backgroundColor: colors.primary,
                    height: `${(data.engagement / 100) * 100}%`,
                  },
                ]}
              />
              <Text style={[styles.chartLabel, { color: colors.textMuted }]}>
                {data.date}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Top Brands */}
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Top Car Brands
          </Text>
          <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
            Most viewed brands this {selectedTimeframe}
          </Text>
        </View>
        <View style={styles.brandsChart}>
          {metrics.topBrands.map((brand, index) => (
            <View key={brand.name} style={styles.brandItem}>
              <View style={styles.brandRank}>
                <Text style={[styles.brandRankText, { color: colors.white }]}>
                  {index + 1}
                </Text>
              </View>
              <View style={styles.brandContent}>
                <Text style={[styles.brandName, { color: colors.text }]}>
                  {brand.name}
                </Text>
                <View
                  style={[styles.brandBar, { backgroundColor: colors.border }]}
                >
                  <View
                    style={[
                      styles.brandBarFill,
                      {
                        backgroundColor: colors.primary,
                        width: `${(brand.views / Math.max(...metrics.topBrands.map((b) => b.views))) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
              <Text
                style={[styles.brandViews, { color: colors.textSecondary }]}
              >
                {formatNumber(brand.views)}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Search Trends */}
      <Card style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>
            Search Trends
          </Text>
          <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
            Popular search queries
          </Text>
        </View>
        <View style={styles.searchTrends}>
          {metrics.searchTrends.map((trend, index) => (
            <View key={trend.query} style={styles.searchTrendItem}>
              <View style={styles.searchTrendRank}>
                <Text
                  style={[styles.searchTrendRankText, { color: colors.white }]}
                >
                  {index + 1}
                </Text>
              </View>
              <View style={styles.searchTrendContent}>
                <Text style={[styles.searchTrendQuery, { color: colors.text }]}>
                  {trend.query}
                </Text>
                <Text
                  style={[
                    styles.searchTrendCount,
                    { color: colors.textSecondary },
                  ]}
                >
                  {formatNumber(trend.count)} searches
                </Text>
              </View>
              <View
                style={[
                  styles.searchTrendBar,
                  { backgroundColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.searchTrendBarFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${(trend.count / Math.max(...metrics.searchTrends.map((t) => t.count))) * 100}%`,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </Card>

      {/* Export/Share Actions */}
      <View style={styles.actionsContainer}>
        <Button
          title="Export Report"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert(
              'Export',
              'Analytics report export feature coming soon!',
            );
          }}
          style={styles.actionButton}
        />
        <Button
          title="Share Insights"
          variant="outline"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert('Share', 'Analytics sharing feature coming soon!');
          }}
          style={styles.actionButton}
        />
      </View>
    </ScrollView>
  );
};

const getThemedStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      marginBottom: 24,
    },
    headerGradient: {
      paddingHorizontal: 20,
      paddingVertical: 24,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    headerContent: {
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: 'white',
      marginTop: 8,
    },
    headerSubtitle: {
      fontSize: 14,
      color: 'white',
      opacity: 0.9,
      marginTop: 4,
    },
    timeframeContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: 24,
      paddingHorizontal: 20,
      gap: 8,
    },
    timeframeButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    timeframeButtonActive: {
      // Active styles handled by backgroundColor prop
    },
    timeframeText: {
      fontSize: 14,
      fontWeight: '600',
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 20,
      gap: 12,
      marginBottom: 24,
    },
    metricCard: {
      width: (width - 52) / 2, // Account for padding and gap
      borderRadius: 16,
      overflow: 'hidden',
    },
    metricGradient: {
      padding: 16,
      alignItems: 'center',
    },
    metricIcon: {
      marginBottom: 8,
    },
    metricValue: {
      fontSize: 24,
      fontWeight: '800',
      color: 'white',
      textAlign: 'center',
    },
    metricTitle: {
      fontSize: 12,
      color: 'white',
      opacity: 0.9,
      textAlign: 'center',
      marginTop: 4,
    },
    metricChange: {
      fontSize: 11,
      fontWeight: '600',
      textAlign: 'center',
      marginTop: 4,
      color: 'white',
    },
    chartCard: {
      marginHorizontal: 20,
      marginBottom: 20,
      padding: 16,
    },
    chartHeader: {
      marginBottom: 16,
    },
    chartTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    chartSubtitle: {
      fontSize: 14,
      marginTop: 2,
    },
    simpleChart: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      height: 120,
      paddingVertical: 16,
    },
    chartBar: {
      flex: 1,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    chartBarFill: {
      width: '80%',
      borderRadius: 4,
      minHeight: 8,
    },
    chartLabel: {
      fontSize: 10,
      marginTop: 8,
      textAlign: 'center',
    },
    brandsChart: {
      gap: 16,
    },
    brandItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    brandRank: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#3b82f6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    brandRankText: {
      fontSize: 12,
      fontWeight: '700',
    },
    brandContent: {
      flex: 1,
    },
    brandName: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
    },
    brandBar: {
      height: 6,
      borderRadius: 3,
    },
    brandBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    brandViews: {
      fontSize: 12,
      fontWeight: '500',
      minWidth: 40,
      textAlign: 'right',
    },
    searchTrends: {
      gap: 12,
    },
    searchTrendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    searchTrendRank: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: '#3b82f6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchTrendRankText: {
      fontSize: 12,
      fontWeight: '700',
    },
    searchTrendContent: {
      flex: 1,
    },
    searchTrendQuery: {
      fontSize: 14,
      fontWeight: '600',
    },
    searchTrendCount: {
      fontSize: 12,
      marginTop: 2,
    },
    searchTrendBar: {
      width: 60,
      height: 4,
      borderRadius: 2,
    },
    searchTrendBarFill: {
      height: '100%',
      borderRadius: 2,
    },
    actionsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingBottom: 32,
      gap: 12,
    },
    actionButton: {
      flex: 1,
    },
    errorText: {
      textAlign: 'center',
      fontSize: 16,
      fontWeight: '600',
    },
  });

export { RealTimeAnalyticsDashboard };
