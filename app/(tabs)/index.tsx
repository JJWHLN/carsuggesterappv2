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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Search, Sparkles, ArrowRight, Car, Users, Award } from 'lucide-react-native';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EnhancedButton } from '@/components/ui/EnhancedButton';
import { useCanPerformAction } from '@/components/ui/RoleProtection';
import { useThemeColors } from '@/hooks/useTheme';
import { useApi } from '@/hooks/useApi';
import { fetchCarModels, fetchPopularBrands } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { AnalyticsService } from '@/services/analyticsService';
import { usePerformanceTracking, useEngagementTracking } from '@/hooks/useAnalytics';
import { 
  PlatformOptimizations, 
  ResponsiveSpacing, 
  getPlatformShadow,
  getTouchableProps,
  getResponsiveFontSize 
} from '@/constants/PlatformOptimizations';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const { colors } = useThemeColors();
  const { user, role } = useAuth();
  const canAccessAI = useCanPerformAction('accessAI');

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

  // Analytics hooks
  const performanceTracking = usePerformanceTracking('home');
  const engagementTracking = useEngagementTracking('home');

  // Track screen view
  useEffect(() => {
    const analytics = AnalyticsService.getInstance();
    analytics.trackScreenView('home', { 
      user_id: user?.id,
      role: role,
      featured_cars_count: featuredCars?.length || 0,
      popular_brands_count: popularBrands?.length || 0
    });
  }, [user?.id, role, featuredCars?.length, popularBrands?.length]);

  const handleSearchPress = useCallback(async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/search');
  }, []);

  const handleGetRecommendations = useCallback(async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    if (user) {
      router.push('/search');
    } else {
      router.push('/auth/sign-in');
    }
  }, [user]);

  const handleBrowseAllCars = useCallback(async () => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/marketplace');
  }, []);

  const handleCategoryPress = useCallback(async (category: string) => {
    if (Platform.OS === 'ios') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/marketplace');
  }, []);

  if (featuredCarsLoading && !featuredCars) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner color="#22C55E" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#22C55E', '#16A34A', '#15803D']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroContent}>
              {/* Trust Badge - removed fake claim */}
              <View style={styles.trustBadge}>
                <Sparkles color="#22C55E" size={14} />
                <Text style={styles.trustBadgeText}>Expert Car Recommendations</Text>
              </View>

              {/* Main Headlines */}
              <Text style={styles.heroTitle}>Find Your Perfect Car</Text>
              <Text style={styles.heroSubtitle}>
                Search thousands of verified listings from trusted dealers.{'\n'}
                Get AI-powered recommendations tailored just for you.
              </Text>

              {/* Search Bar */}
              <TouchableOpacity 
                style={styles.searchBar}
                onPress={handleSearchPress}
                activeOpacity={0.9}
              >
                <Search color="#6B7280" size={20} />
                <Text style={styles.searchPlaceholder}>
                  Try "BMW under $30k" or "Family SUV"
                </Text>
                <View style={styles.searchButton}>
                  <Search color="#FFFFFF" size={20} />
                </View>
              </TouchableOpacity>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <EnhancedButton
                  title={canAccessAI ? "Get AI Recommendations" : "Try AI Search Free"}
                  onPress={handleGetRecommendations}
                  variant="outline"
                  style={styles.primaryButton}
                  icon={<Sparkles color="#FFFFFF" size={18} />}
                  hapticFeedback={true}
                  testID="ai-recommendations-button"
                />
                <EnhancedButton
                  title="Browse All Cars"
                  onPress={handleBrowseAllCars}
                  variant="outline"
                  style={styles.secondaryButton}
                  icon={<ArrowRight color="#FFFFFF" size={18} />}
                  hapticFeedback={true}
                  testID="browse-cars-button"
                />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Platform Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Car color="#22C55E" size={28} />
              </View>
              <Text style={styles.statNumber}>Live</Text>
              <Text style={styles.statLabel}>Car Listings</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Users color="#3B82F6" size={28} />
              </View>
              <Text style={styles.statNumber}>Active</Text>
              <Text style={styles.statLabel}>Dealer Network</Text>
            </View>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Award color="#F59E0B" size={28} />
              </View>
              <Text style={styles.statNumber}>Real</Text>
              <Text style={styles.statLabel}>User Reviews</Text>
            </View>
          </View>
        </View>

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <View style={styles.categoriesGrid}>
            <TouchableOpacity style={styles.categoryCard} onPress={() => handleCategoryPress('electric')} {...getTouchableProps()}>
              <Text style={styles.categoryTitle}>🔋 Electric</Text>
              <Text style={styles.categoryDescription}>Zero emissions</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryCard} onPress={() => handleCategoryPress('luxury')} {...getTouchableProps()}>
              <Text style={styles.categoryTitle}>👑 Luxury</Text>
              <Text style={styles.categoryDescription}>Premium comfort</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryCard} onPress={() => handleCategoryPress('family')} {...getTouchableProps()}>
              <Text style={styles.categoryTitle}>🛡️ Family SUV</Text>
              <Text style={styles.categoryDescription}>Safe & spacious</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.categoryCard} onPress={() => handleCategoryPress('sports')} {...getTouchableProps()}>
              <Text style={styles.categoryTitle}>🚀 Sports Car</Text>
              <Text style={styles.categoryDescription}>Pure performance</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured Cars Section */}
        {featuredCarsError ? (
          <View style={styles.section}>
            <ErrorState 
              title="Could Not Load Cars" 
              message={featuredCarsError} 
              onRetry={refetchFeaturedCars} 
            />
          </View>
        ) : (
          <View style={styles.featuredSection}>
            <Text style={styles.sectionTitle}>Featured Cars</Text>
            {featuredCarsLoading ? (
              <View style={styles.loadingContainer}>
                <LoadingSpinner color="#22C55E" />
              </View>
            ) : (
              <Text style={styles.placeholder}>
                {featuredCars?.length || 0} cars available
              </Text>
            )}
          </View>
        )}

        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <LinearGradient
            colors={['#22C55E', '#16A34A']}
            style={styles.ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.ctaTitle}>Ready to Find Your Dream Car?</Text>
            <Text style={styles.ctaSubtitle}>Get personalized recommendations powered by AI</Text>
            <EnhancedButton
              title={canAccessAI ? "Get My Recommendations" : "Sign In for AI"}
              onPress={handleGetRecommendations}
              variant="secondary"
              style={styles.ctaButton}
              icon={<Sparkles color="#22C55E" size={20} />}
              hapticFeedback={true}
              testID="cta-recommendations-button"
            />
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  section: {
    marginVertical: 15,
    paddingHorizontal: 20,
  },
  
  // Hero Section
  heroSection: {
    marginBottom: 20,
  },
  heroGradient: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    minHeight: Math.min(height * 0.5, 400),
    justifyContent: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trustBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22C55E',
  },
  heroTitle: {
    fontSize: Math.min(36, width * 0.09),
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: Math.min(42, width * 0.1),
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.95,
    lineHeight: 24,
    maxWidth: width * 0.9,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchPlaceholder: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
  },
  searchButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    maxWidth: 400,
  },
  primaryButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },

  // Categories Section
  categoriesSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  categoriesGrid: {
    gap: 12,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#6b7280',
  },

  // Featured Section
  featuredSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  placeholder: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    padding: 20,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },

  // CTA Section
  ctaSection: {
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaGradient: {
    padding: 32,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.9,
  },
  ctaButton: {
    paddingHorizontal: 32,
  },
});
