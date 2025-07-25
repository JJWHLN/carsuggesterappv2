import React, { memo, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Animated,
  Platform,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';

import { useThemeColors } from '@/hooks/useTheme';
import { PremiumCarCard } from '@/components/PremiumCarCard';
import { PremiumReviewCard } from '@/components/PremiumReviewCard';
import { EliteDesignSystem, ELITE_DESIGN_SYSTEM } from '@/design/EliteDesignSystem';
import * as Haptics from 'expo-haptics';
import { Search, Sparkles, TrendingUp, Users, Award, Car, Crown, Zap, ArrowRight, Star, Heart, MapPin } from '@/utils/ultra-optimized-icons';

const { width, height } = Dimensions.get('window');

interface HomeScreenProps {}

const PremiumHomeScreen = memo<HomeScreenProps>(() => {
  const { colors } = useThemeColors();
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const styles = getThemedStyles(colors);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Simulate API call
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleSearchPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/search');
  }, []);

  const handleCategoryPress = useCallback((category: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/(tabs)/marketplace?category=${category}`);
  }, []);

  // Mock data for demo
  const featuredCars = [
    {
      id: '1',
      make: 'Tesla',
      model: 'Model S',
      year: 2024,
      price: 89990,
      original_price: 94990,
      image_url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=600&fit=crop'],
      location: 'San Francisco, CA',
      mileage: 1200,
      savings: 5000,
      views: 2500,
      saves: 89,
      isPremium: true,
      isElectric: true,
      badges: ['Electric', 'Premium', 'Certified'],
      created_at: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      make: 'Porsche',
      model: '911 Turbo',
      year: 2023,
      price: 174900,
      original_price: 179900,
      image_url: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=800&h=600&fit=crop'],
      location: 'Los Angeles, CA',
      mileage: 5000,
      views: 1800,
      saves: 156,
      isPremium: true,
      badges: ['Premium', 'Performance'],
      created_at: '2024-01-14T10:30:00Z'
    }
  ];

  const recentReviews = [
    {
      id: '1',
      user: {
        name: 'Alex Chen',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        verified: true,
        reviewCount: 23
      },
      rating: 5,
      title: 'Exceptional driving experience',
      content: 'The Tesla Model S exceeded all my expectations. The acceleration is mind-blowing and the autopilot features work flawlessly on highway drives.',
      date: '2024-01-15T10:30:00Z',
      helpful: 67,
      carDetails: {
        make: 'Tesla',
        model: 'Model S',
        year: 2024
      },
      tags: ['performance', 'technology', 'comfort']
    }
  ];

  const quickActions = [
    { icon: Search, label: 'Search Cars', action: () => router.push('/search'), color: ELITE_DESIGN_SYSTEM.colors.marketplace.primary },
    { icon: Crown, label: 'Premium', action: () => router.push('/(tabs)/marketplace?filter=premium'), color: ELITE_DESIGN_SYSTEM.colors.automotive.premiumGold },
    { icon: Zap, label: 'Electric', action: () => router.push('/(tabs)/marketplace?filter=electric'), color: ELITE_DESIGN_SYSTEM.colors.success.primary },
    { icon: Award, label: 'Certified', action: () => router.push('/(tabs)/marketplace?filter=certified'), color: ELITE_DESIGN_SYSTEM.colors.automotive.platinum }
  ];

  const marketStats = [
    { label: 'Active Listings', value: '12.5K', icon: Car, trend: '+8%' },
    { label: 'Happy Buyers', value: '45.2K', icon: Users, trend: '+12%' },
    { label: 'Expert Reviews', value: '8.9K', icon: Star, trend: '+15%' },
    { label: 'Saved Cars', value: '156K', icon: Heart, trend: '+22%' }
  ];

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Animated Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <BlurView intensity={95} style={StyleSheet.absoluteFillObject} />
        <SafeAreaView style={styles.headerContent}>
          <Text style={styles.headerTitle}>CarSuggester</Text>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell color={colors.white} size={20} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </SafeAreaView>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={[ELITE_DESIGN_SYSTEM.colors.marketplace.primary, ELITE_DESIGN_SYSTEM.colors.marketplace.secondary]}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <SafeAreaView style={styles.heroContent}>
            <View style={styles.heroHeader}>
              <Text style={styles.welcomeText}>Welcome back!</Text>
              <TouchableOpacity style={styles.profileButton}>
                <View style={styles.profileAvatar}>
                  <Text style={styles.profileInitials}>JD</Text>
                </View>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.heroTitle}>
              Find Your Perfect{'\n'}
              <Text style={styles.heroHighlight}>Dream Car</Text>
            </Text>
            
            <Text style={styles.heroSubtitle}>
              AI-powered recommendations tailored just for you
            </Text>

            {/* Search Bar */}
            <TouchableOpacity style={styles.searchBar} onPress={handleSearchPress}>
              <Search color={ELITE_DESIGN_SYSTEM.colors.marketplace.neutral} size={20} />
              <Text style={styles.searchPlaceholder}>
                Search by make, model, or keyword...
              </Text>
              <Sparkles color={ELITE_DESIGN_SYSTEM.colors.automotive.premiumGold} size={18} />
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Quick Actions
          </Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickActionCard, { backgroundColor: colors.white }]}
                onPress={action.action}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: `${action.color}15` }]}>
                  <action.icon color={action.color} size={24} />
                </View>
                <Text style={[styles.quickActionLabel, { color: colors.text }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Market Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Market Insights
            </Text>
            <TouchableOpacity style={styles.seeAllButton}>
              <Text style={[styles.seeAllText, { color: ELITE_DESIGN_SYSTEM.colors.marketplace.primary }]}>
                View All
              </Text>
              <ArrowRight color={ELITE_DESIGN_SYSTEM.colors.marketplace.primary} size={16} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.statsGrid}>
            {marketStats.map((stat, index) => (
              <View key={index} style={[styles.statCard, { backgroundColor: colors.white }]}>
                <View style={styles.statHeader}>
                  <stat.icon color={ELITE_DESIGN_SYSTEM.colors.marketplace.primary} size={20} />
                  <Text style={[styles.statTrend, { color: ELITE_DESIGN_SYSTEM.colors.success.primary }]}>
                    {stat.trend}
                  </Text>
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stat.value}
                </Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Featured Cars */}
        <View style={styles.featuredSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Featured Cars
            </Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push('/(tabs)/marketplace')}
            >
              <Text style={[styles.seeAllText, { color: ELITE_DESIGN_SYSTEM.colors.marketplace.primary }]}>
                See All
              </Text>
              <ArrowRight color={ELITE_DESIGN_SYSTEM.colors.marketplace.primary} size={16} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredCarsList}
          >
            {featuredCars.map((car, index) => (
              <View key={car.id} style={index === 0 ? styles.firstCard : undefined}>
                <PremiumCarCard
                  car={car}
                  onPress={() => router.push(`/car/${car.id}`)}
                  variant="featured"
                  style={styles.featuredCarCard}
                />
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Recent Reviews */}
        <View style={styles.reviewsSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Reviews
            </Text>
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={() => router.push('/(tabs)/reviews')}
            >
              <Text style={[styles.seeAllText, { color: ELITE_DESIGN_SYSTEM.colors.marketplace.primary }]}>
                See All
              </Text>
              <ArrowRight color={ELITE_DESIGN_SYSTEM.colors.marketplace.primary} size={16} />
            </TouchableOpacity>
          </View>
          
          {recentReviews.map((review) => (
            <PremiumReviewCard
              key={review.id}
              review={review}
              variant="compact"
              onPress={() => router.push(`/review/${review.id}`)}
            />
          ))}
        </View>

        {/* Bottom Padding for Tab Bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
});

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Light gray background
  },

  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },

  notificationButton: {
    position: 'relative',
    padding: 8,
  },

  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ELITE_DESIGN_SYSTEM.colors.error.primary,
  },

  scrollView: {
    flex: 1,
  },

  heroSection: {
    paddingBottom: 24,
  },

  heroContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },

  welcomeText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },

  profileButton: {
    padding: 2,
  },

  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileInitials: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },

  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.white,
    lineHeight: 38,
    marginBottom: 8,
  },

  heroHighlight: {
    color: ELITE_DESIGN_SYSTEM.colors.automotive.premiumGold,
  },

  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 24,
    fontWeight: '400',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },

  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: ELITE_DESIGN_SYSTEM.colors.marketplace.neutral,
    fontWeight: '400',
  },

  quickActionsSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },

  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  quickActionCard: {
    flex: 1,
    minWidth: (width - 52) / 2,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },

  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 32,
  },

  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  statCard: {
    flex: 1,
    minWidth: (width - 52) / 2,
    padding: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  statTrend: {
    fontSize: 12,
    fontWeight: '600',
  },

  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },

  featuredSection: {
    paddingTop: 32,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },

  featuredCarsList: {
    paddingLeft: 20,
    paddingRight: 8,
  },

  firstCard: {
    marginLeft: 0,
  },

  featuredCarCard: {
    width: width * 0.85,
    marginRight: 12,
  },

  reviewsSection: {
    paddingTop: 32,
  },

  bottomPadding: {
    height: 100,
  },
});

export default PremiumHomeScreen;
