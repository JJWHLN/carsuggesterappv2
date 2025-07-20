import React, { useState, useMemo, useEffect, memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { CarCard } from '@/components/CarCard';
import { ModernCarCard } from '@/components/ModernCarCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { SmartRecommendations } from '@/components/SmartRecommendations';
import { RealTimeAnalyticsDashboard } from '@/components/RealTimeAnalyticsDashboard';
import { UnifiedSearchFilter, useSearchFilters } from '@/components/ui/UnifiedSearchFilter';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { useThemeColors } from '@/hooks/useTheme';
import { useApi } from '@/hooks/useApi';
import { fetchCarModels, fetchPopularBrands } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
import { Search, Sparkles, ArrowRight, Car, Users, Award, Zap, Crown, TrendingUp, Eye, Heart, Star } from '@/utils/ultra-optimized-icons';

const { width, height } = Dimensions.get('window');

interface HomeTab {
  id: string;
  title: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
  description: string;
}

function AdvancedHomeScreen() {
  const { colors } = useThemeColors();
  const { layout, cards, buttons } = useDesignTokens();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('recommendations');
  const analytics = useAdvancedAnalytics();
  
  // Use unified search/filter hook
  const {
    filters,
    searchTerm,
    debouncedSearchTerm,
    updateFilters,
    clearFilters,
    setSearchTerm,
    hasActiveFilters,
  } = useSearchFilters({
    searchTerm: '',
    categories: {},
    sortBy: 'popularity',
    sortOrder: 'desc',
    viewMode: 'grid',
  });

  const {
    data: featuredCars,
    loading: featuredCarsLoading,
    error: featuredCarsError,
    refetch: refetchFeaturedCars
  } = useApi(() => fetchCarModels({ limit: 6 }), []);

  const {
    data: popularBrands,
    loading: popularBrandsLoading,
    error: popularBrandsError,
    refetch: refetchPopularBrands
  } = useApi(() => fetchPopularBrands(8), []);

  // Advanced home tabs
  const homeTabs: HomeTab[] = useMemo(() => [
    {
      id: 'recommendations',
      title: 'For You',
      icon: <Sparkles color={colors.primary} size={20} />,
      component: SmartRecommendations,
      description: 'AI-powered car recommendations',
    },
    {
      id: 'trending',
      title: 'Trending',
      icon: <TrendingUp color={colors.primary} size={20} />,
      component: ModernCarCard, // Placeholder for trending cars
      description: 'Popular cars right now',
    },
    {
      id: 'analytics',
      title: 'Insights',
      icon: <Eye color={colors.primary} size={20} />,
      component: RealTimeAnalyticsDashboard,
      description: 'Real-time market insights',
    },
  ], [colors]);

  const styles = useMemo(() => getThemedStyles(colors), [colors]);

  useEffect(() => {
    // Track home screen view
    analytics.track('advanced_home_viewed', {
      user_id: user?.id,
      active_tab: activeTab,
      timestamp: Date.now(),
    });
  }, [activeTab, user, analytics]);

  const handleSearchPress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    analytics.track('search_initiated', {
      source: 'home_search_bar',
      search_term: searchTerm,
    });
    
    router.push('/search');
  }, [searchTerm, analytics]);

  const handleGetRecommendations = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    analytics.track('recommendations_requested', {
      source: 'home_cta',
      user_id: user?.id,
    });
    
    if (user) {
      setActiveTab('recommendations');
    } else {
      router.push('/auth/sign-in');
    }
  }, [user, analytics]);

  const handleTabPress = useCallback(async (tabId: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    analytics.track('home_tab_changed', {
      from_tab: activeTab,
      to_tab: tabId,
      user_id: user?.id,
    });
    
    setActiveTab(tabId);
  }, [activeTab, user, analytics]);

  const handleCarPress = useCallback((car: any) => {
    analytics.track('car_selected', {
      car_id: car.id,
      source: 'advanced_home',
      tab: activeTab,
    });
    
    router.push(`/car/${car.id}`);
  }, [activeTab, analytics]);

  const handleMetricPress = useCallback((metric: string) => {
    analytics.track('analytics_metric_selected', {
      metric,
      source: 'home_analytics_tab',
    });
    
    Alert.alert('Analytics', `${metric} details coming soon!`);
  }, [analytics]);

  const renderTabContent = useCallback(() => {
    const activeTabData = homeTabs.find(tab => tab.id === activeTab);
    if (!activeTabData) return null;

    const TabComponent = activeTabData.component;

    switch (activeTab) {
      case 'recommendations':
        return (
          <SmartRecommendations
            onCarPress={handleCarPress}
            refreshing={false}
            onRefresh={() => {
              analytics.track('recommendations_refreshed', {
                user_id: user?.id,
              });
            }}
          />
        );
      
      case 'analytics':
        return (
          <RealTimeAnalyticsDashboard
            onMetricPress={handleMetricPress}
          />
        );
      
      case 'trending':
        return (
          <View style={styles.trendingContent}>
            <Text style={[styles.comingSoonTitle, { color: colors.text }]}>
              Trending Cars
            </Text>
            <Text style={[styles.comingSoonSubtitle, { color: colors.textSecondary }]}>
              Real-time trending cars feature coming soon!
            </Text>
            <TrendingUp color={colors.textMuted} size={64} />
          </View>
        );
      
      default:
        return null;
    }
  }, [activeTab, homeTabs, colors, styles, handleCarPress, handleMetricPress, user, analytics]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'light-content' : 'dark-content'} />
      
      {/* Enhanced Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[colors.primary, '#16A34A', '#15803D']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            {/* Welcome Message */}
            <View style={styles.welcomeSection}>
              <Text style={styles.welcomeText}>
                {user ? `Welcome back, ${user.email?.split('@')[0]}!` : 'Welcome to CarSuggester'}
              </Text>
              <Text style={styles.headerSubtitle}>
                Discover your perfect car with AI-powered insights
              </Text>
            </View>

            {/* Enhanced Search */}
            <SearchBar
              value={searchTerm}
              onChangeText={setSearchTerm}
              placeholder="Search cars, brands, or ask AI..."
              showAIIcon={true}
              onSubmit={handleSearchPress}
              containerStyle={styles.searchBar}
            />

            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <View style={styles.quickStat}>
                <Car color="white" size={16} />
                <Text style={styles.quickStatText}>10K+ Cars</Text>
              </View>
              <View style={styles.quickStat}>
                <Users color="white" size={16} />
                <Text style={styles.quickStatText}>500+ Dealers</Text>
              </View>
              <View style={styles.quickStat}>
                <Star color="white" size={16} />
                <Text style={styles.quickStatText}>50K+ Reviews</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Advanced Tab Navigation */}
      <View style={styles.tabNavigation}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabContainer}
        >
          {homeTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tabItem,
                activeTab === tab.id && styles.activeTabItem,
                { 
                  backgroundColor: activeTab === tab.id ? colors.primary : colors.cardBackground,
                  borderColor: colors.border 
                }
              ]}
              onPress={() => handleTabPress(tab.id)}
            >
              <View style={styles.tabIcon}>
                {React.cloneElement(tab.icon as React.ReactElement, {
                  color: activeTab === tab.id ? colors.white : colors.text
                })}
              </View>
              <Text
                style={[
                  styles.tabTitle,
                  { color: activeTab === tab.id ? colors.white : colors.text }
                ]}
              >
                {tab.title}
              </Text>
              <Text
                style={[
                  styles.tabDescription,
                  { color: activeTab === tab.id ? colors.white : colors.textSecondary }
                ]}
              >
                {tab.description}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Dynamic Tab Content */}
      <View style={styles.tabContent}>
        <ErrorBoundary>
          {renderTabContent()}
        </ErrorBoundary>
      </View>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={handleGetRecommendations}
      >
        <LinearGradient
          colors={[colors.primary, '#16A34A']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Sparkles color="white" size={24} />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 0,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    gap: 16,
  },
  welcomeSection: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    textAlign: 'center',
    marginTop: 4,
  },
  searchBar: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  quickStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickStatText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  tabNavigation: {
    paddingVertical: 20,
    backgroundColor: colors.background,
  },
  tabContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  tabItem: {
    width: width * 0.75,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  activeTabItem: {
    transform: [{ scale: 1.02 }],
  },
  tabIcon: {
    marginBottom: 12,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  tabDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  tabContent: {
    flex: 1,
  },
  trendingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default memo(AdvancedHomeScreen);
