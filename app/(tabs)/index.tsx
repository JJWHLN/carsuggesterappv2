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
import { Search, Sparkles, ArrowRight, Car, Users, Award } from '@/utils/icons';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { CarCard } from '@/components/CarCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { UnifiedSearchFilter, useSearchFilters } from '@/components/ui/UnifiedSearchFilter';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { useThemeColors } from '@/hooks/useTheme';
import { useApi } from '@/hooks/useApi';
import { fetchCarModels, fetchPopularBrands } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const { width, height } = Dimensions.get('window');

function HomeScreen() {
  const { colors } = useThemeColors();
  const { layout, cards, buttons } = useDesignTokens();
  const { user } = useAuth();
  
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

  const handleSearchPress = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/search');
  }, []);

  const handleGetRecommendations = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (user) {
      router.push('/search');
    } else {
      router.push('/auth/sign-in');
    }
  }, [user]);

  const handleBrowseAllCars = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/marketplace');
  }, []);

  const handleCategoryPress = useCallback(async (category: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/marketplace');
  }, []);

  if (featuredCarsLoading && !featuredCars) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingState />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={[colors.primary, '#16A34A', '#15803D']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroContent}>
              {/* Trust Badge */}
              <View style={styles.trustBadge}>
                <Sparkles color={colors.primary} size={14} />
                <Text style={[styles.trustBadgeText, { color: colors.primary }]}>Expert Car Recommendations</Text>
              </View>

              {/* Main Headlines */}
              <Text style={styles.heroTitle}>Find Your Perfect Car</Text>
              <Text style={styles.heroSubtitle}>
                Search thousands of verified listings from trusted dealers.{'\n'}
                Get AI-powered recommendations tailored just for you.
              </Text>

              {/* Enhanced Search Bar */}
              <View style={{ marginBottom: 24 }}>
                <UnifiedSearchFilter
                  searchPlaceholder="Try 'BMW under $30k' or 'Family SUV'"
                  searchValue={searchTerm}
                  onSearchChange={(value) => {
                    setSearchTerm(value);
                    if (value.length > 0) {
                      // Navigate to search page with query
                      router.push(`/search?q=${encodeURIComponent(value)}`);
                    }
                  }}
                  enableSearch={true}
                  
                  enableFilters={false}
                  enableSort={false}
                  enableViewToggle={false}
                  enableQuickFilters={false}
                  
                  showResultsCount={false}
                  variant="compact"
                  showClearAll={searchTerm.length > 0}
                  onClearAll={clearFilters}
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Button
                  title="Get AI Recommendations"
                  onPress={handleGetRecommendations}
                  variant="secondary"
                  style={styles.primaryButton}
                  icon={<Sparkles color={colors.background} size={18} />}
                />
                <Button
                  title="Browse All Cars"
                  onPress={handleBrowseAllCars}
                  variant="outline"
                  style={styles.secondaryButton}
                  icon={<ArrowRight color={colors.background} size={18} />}
                />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Stats Section */}
        <View style={[styles.statsSection, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Platform Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.background }]}>
                <Car color={colors.primary} size={28} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>Live</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Car Listings</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.background }]}>
                <Users color="#3B82F6" size={28} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>Active</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Dealer Network</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: colors.background }]}>
                <Award color="#F59E0B" size={28} />
              </View>
              <Text style={[styles.statNumber, { color: colors.text }]}>Real</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>User Reviews</Text>
            </View>
          </View>
        </View>

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Browse by Category</Text>
          <View style={styles.categoriesGrid}>
            <TouchableOpacity 
              style={[styles.categoryCard, { backgroundColor: colors.cardBackground }]} 
              onPress={() => handleCategoryPress('electric')}
            >
              <View>
                <Text style={[styles.categoryTitle, { color: colors.text }]}>🔋 Electric</Text>
                <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>Zero emissions</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.categoryCard, { backgroundColor: colors.cardBackground }]} 
              onPress={() => handleCategoryPress('luxury')}
            >
              <View>
                <Text style={[styles.categoryTitle, { color: colors.text }]}>👑 Luxury</Text>
                <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>Premium comfort</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.categoryCard, { backgroundColor: colors.cardBackground }]} 
              onPress={() => handleCategoryPress('family')}
            >
              <View>
                <Text style={[styles.categoryTitle, { color: colors.text }]}>🛡️ Family SUV</Text>
                <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>Safe & spacious</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.categoryCard, { backgroundColor: colors.cardBackground }]} 
              onPress={() => handleCategoryPress('sports')}
            >
              <View>
                <Text style={[styles.categoryTitle, { color: colors.text }]}>🚀 Sports Car</Text>
                <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>Pure performance</Text>
              </View>
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
              retryText="Try Again"
            />
          </View>
        ) : (
          <View style={styles.featuredSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Cars</Text>
              <TouchableOpacity onPress={handleBrowseAllCars}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {featuredCarsLoading ? (
              <LoadingState />
            ) : featuredCars && featuredCars.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {featuredCars.map((car) => (
                  <CarCard
                    key={car.id}
                    car={car as any} // Type conversion - CarModel to Car
                    onPress={() => router.push(`/car/${car.id}`)}
                  />
                ))}
              </ScrollView>
            ) : (
              <EmptyState
                title="No Featured Cars"
                subtitle="Check back later for featured listings"
                icon={<Car color={colors.textSecondary} size={48} />}
              />
            )}
          </View>
        )}

        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <LinearGradient
            colors={[colors.primary, '#16A34A']}
            style={styles.ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.ctaTitle}>Ready to Find Your Dream Car?</Text>
            <Text style={styles.ctaSubtitle}>Get personalized recommendations powered by AI</Text>
            <Button
              title="Get My Recommendations"
              onPress={handleGetRecommendations}
              variant="secondary"
              style={styles.ctaButton}
              icon={<Sparkles color={colors.primary} size={20} />}
            />
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function WrappedHomeScreen() {
  return (
    <ErrorBoundary>
      <HomeScreen />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
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
    marginBottom: 24,
    width: '100%',
    maxWidth: 400,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
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
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 14,
  },

  // Featured Section
  featuredSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  carCard: {
    marginBottom: 16,
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
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
});
