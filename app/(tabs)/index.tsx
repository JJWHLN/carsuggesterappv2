import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  Search,
  SlidersHorizontal,
  Zap as ElectricIcon,
  Crown as LuxuryIcon,
  Shield as FamilySUVIcon,
  Rocket as SportsCarIcon,
  Building2 as BrandIcon,
  TrendingUp,
  Car,
  Star,
  ChevronRight,
  Sparkles,
  MapPin,
  Users,
  Award,
  ArrowRight,
  Filter,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { Card } from '@/components/ui/Card';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { CarCard } from '@/components/ui/CarCard';
import { Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import { useApi } from '@/hooks/useApi';
import { fetchCarModels, fetchPopularBrands } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const handleAuthRequired = (action: () => void, fallbackAction?: () => void) => {
    if (user) {
      action();
    } else if (fallbackAction) {
      fallbackAction();
    } else {
      router.push('/auth/sign-in');
    }
  };

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

  const quickCategories = [
    { 
      name: 'Electric', 
      icon: ElectricIcon, 
      color: '#10B981',
      bgColor: '#ECFDF5',
      description: 'Zero emissions',
      onPress: () => router.push({ pathname: '/models', params: { category: 'Electric' }})
    },
    { 
      name: 'Luxury', 
      icon: LuxuryIcon, 
      color: '#8B5CF6',
      bgColor: '#F3E8FF',
      description: 'Premium comfort',
      onPress: () => router.push({ pathname: '/models', params: { category: 'Luxury' }})
    },
    { 
      name: 'Family SUV', 
      icon: FamilySUVIcon, 
      color: '#3B82F6',
      bgColor: '#EFF6FF',
      description: 'Safe & spacious',
      onPress: () => router.push({ pathname: '/models', params: { category: 'SUV' }})
    },
    { 
      name: 'Sports Car', 
      icon: SportsCarIcon, 
      color: '#EF4444',
      bgColor: '#FEF2F2',
      description: 'Pure performance',
      onPress: () => router.push({ pathname: '/models', params: { category: 'Sports' }})
    },
  ];

  const stats = [
    { 
      title: '15K+', 
      subtitle: 'Cars Available', 
      icon: <Car color={colors.primary} size={28} />,
      bgColor: colors.primaryLight
    },
    { 
      title: '2.5K+', 
      subtitle: 'Verified Dealers', 
      icon: <Users color={colors.accentGreen} size={28} />,
      bgColor: '#ECFDF5'
    },
    { 
      title: '50+', 
      subtitle: 'Car Brands', 
      icon: <Award color={colors.success} size={28} />,
      bgColor: '#F0FDF4'
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Enhanced Hero Section */}
        <View style={styles.heroSection}>
          <ImageBackground
            source={{ uri: 'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=1200' }}
            style={styles.heroBackground}
            imageStyle={styles.heroBackgroundImage}
          >
            <LinearGradient
              colors={['rgba(34, 197, 94, 0.9)', 'rgba(22, 163, 74, 0.95)']}
              style={styles.heroOverlay}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroContent}>
                {/* Hero Badge */}
                <View style={styles.heroBadge}>
                  <Sparkles color={colors.primary} size={16} />
                  <Text style={[styles.heroBadgeText, { color: colors.primary }]}>
                    AI-Powered Car Discovery
                  </Text>
                </View>

                <Text style={[styles.heroTitle, { color: colors.white }]}>
                  Find Your Perfect Car
                </Text>
                <Text style={[styles.heroSubtitle, { color: colors.white }]}>
                  AI-powered recommendations, expert reviews, and thousands of verified listings all in one place
                </Text>
                
                <View style={styles.heroSearchContainer}>
                  <View style={styles.searchBarWrapper}>
                    <View style={styles.searchInputContainer}>
                      <Search color={colors.textSecondary} size={20} />
                      <Text style={styles.searchPlaceholder}>
                        Try 'BMW under $30k' or 'Family SUV'
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.searchButton}
                      onPress={() => router.push({ pathname: '/search', params: { query: searchQuery }})}
                    >
                      <Search color={colors.white} size={20} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.heroButtons}>
                  <Button
                    title={user ? "Get AI Recommendations" : "Start Your Journey"}
                    onPress={() => handleAuthRequired(
                      () => router.push('/recommendations'),
                      () => router.push('/auth/sign-in')
                    )}
                    variant="secondary"
                    style={styles.primaryHeroButton}
                    icon={<Sparkles color={colors.primary} size={20} />}
                  />
                  <Button
                    title="Browse All Cars"
                    onPress={() => router.push('/models')}
                    variant="outline"
                    style={styles.secondaryHeroButton}
                    icon={<ArrowRight color={colors.white} size={20} />}
                  />
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Enhanced Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Trusted by Car Enthusiasts
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Join thousands of satisfied customers
            </Text>
          </View>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCardWrapper}>
                <View style={[styles.statIconContainer, { backgroundColor: stat.bgColor }]}>
                  {stat.icon}
                </View>
                <Text style={[styles.statValue, { color: colors.text }]}>{stat.title}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.subtitle}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Enhanced Categories Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Browse by Category</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Find exactly what you're looking for
            </Text>
          </View>
          <View style={styles.categoriesGrid}>
            {quickCategories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.categoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={category.onPress}
                activeOpacity={0.8}
              >
                <View style={[styles.categoryIconContainer, { backgroundColor: category.bgColor }]}>
                  <category.icon color={category.color} size={32} />
                </View>
                <View style={styles.categoryContent}>
                  <Text style={[styles.categoryTitle, { color: colors.text }]}>{category.name}</Text>
                  <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
                    {category.description}
                  </Text>
                </View>
                <ChevronRight color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Enhanced Featured Cars Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Cars</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Hand-picked recommendations
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push('/models')}
              style={styles.viewAllButton}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
              <ArrowRight color={colors.primary} size={16} />
            </TouchableOpacity>
          </View>
          
          {featuredCarsLoading && !featuredCars && (
            <View style={styles.loadingContainer}>
              <LoadingSpinner color={colors.primary} />
            </View>
          )}
          
          {featuredCarsError && (
            <ErrorState 
              title="Could Not Load Cars" 
              message={featuredCarsError} 
              onRetry={refetchFeaturedCars} 
            />
          )}
          
          {featuredCars && featuredCars.length > 0 && (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredCarsScroll}
            >
              {featuredCars.map(car => (
                <View key={car.id} style={styles.featuredCarCard}>
                  <CarCard
                    image={car.image_url || 'https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=400'}
                    name={`${car.brands?.name} ${car.name}`}
                    year={car.year}
                    priceRange="Price on request"
                    tags={car.category || []}
                    rating={4.5}
                    location="Multiple locations"
                    onPress={() => router.push(`/model/${car.id}`)}
                    style={styles.horizontalCarCard}
                  />
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Enhanced Popular Brands Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Brands</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                Explore top automotive brands
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => router.push('/models')}
              style={styles.viewAllButton}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
              <ArrowRight color={colors.primary} size={16} />
            </TouchableOpacity>
          </View>
          
          {popularBrandsLoading && !popularBrands && (
            <View style={styles.loadingContainer}>
              <LoadingSpinner color={colors.primary} />
            </View>
          )}
          
          {popularBrandsError && (
            <ErrorState 
              title="Could Not Load Brands" 
              message={popularBrandsError} 
              onRetry={refetchPopularBrands} 
            />
          )}
          
          {popularBrands && popularBrands.length > 0 && (
            <View style={styles.brandsGrid}>
              {popularBrands.map(brand => (
                <TouchableOpacity
                  key={brand.id}
                  style={[styles.brandCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => router.push(`/brand/${brand.id}`)}
                  activeOpacity={0.8}
                >
                  <View style={styles.brandLogoContainer}>
                    {brand.logo_url ? (
                      <OptimizedImage
                        source={{uri: brand.logo_url}}
                        style={styles.brandLogo}
                        resizeMode="contain"
                        fallbackSource={require('@/assets/images/icon.png')}
                      />
                    ) : (
                      <View style={[styles.brandLogoPlaceholder, { backgroundColor: colors.primaryLight }]}>
                        <BrandIcon color={colors.primary} size={24} />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.brandName, { color: colors.text }]} numberOfLines={1}>
                    {brand.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Call to Action Section */}
        <View style={styles.ctaSection}>
          <LinearGradient
            colors={[colors.primary, colors.primaryHover]}
            style={styles.ctaGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.ctaContent}>
              <Text style={[styles.ctaTitle, { color: colors.white }]}>
                Ready to Find Your Dream Car?
              </Text>
              <Text style={[styles.ctaSubtitle, { color: colors.white }]}>
                Get personalized recommendations powered by AI
              </Text>
              <Button
                title={user ? "Get My Recommendations" : "Get Started"}
                onPress={() => handleAuthRequired(
                  () => router.push('/recommendations'),
                  () => router.push('/auth/sign-in')
                )}
                variant="secondary"
                style={styles.ctaButton}
                icon={<Sparkles color={colors.primary} size={20} />}
              />
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: typeof import('@/constants/Colors').Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: Spacing.xxl,
  },
  heroSection: {
    height: height * 0.65,
    marginBottom: Spacing.xl,
  },
  heroBackground: {
    flex: 1,
    justifyContent: 'center',
  },
  heroBackgroundImage: {
    opacity: 0.3,
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  heroContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.lg,
    gap: Spacing.xs,
    ...ColorsShadows.medium,
  },
  heroBadgeText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  heroTitle: {
    ...Typography.heroTitle,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontWeight: '800',
    fontSize: 36,
  },
  heroSubtitle: {
    ...Typography.bodyLarge,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    opacity: 0.95,
    lineHeight: 26,
  },
  heroSearchContainer: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xs,
    alignItems: 'center',
    ...ColorsShadows.large,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  searchPlaceholder: {
    ...Typography.body,
    color: colors.textSecondary,
    marginLeft: Spacing.sm,
  },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    marginTop: Spacing.md,
  },
  primaryHeroButton: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  secondaryHeroButton: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  statsSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    backgroundColor: colors.surface,
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    ...ColorsShadows.card,
  },
  statsHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statCardWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  statValue: {
    ...Typography.h2,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h2,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    ...Typography.body,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  viewAllText: {
    ...Typography.body,
    fontWeight: '600',
  },
  categoriesGrid: {
    gap: Spacing.md,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    ...ColorsShadows.small,
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    ...Typography.h3,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  categoryDescription: {
    ...Typography.bodySmall,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  featuredCarsScroll: {
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.md,
  },
  featuredCarCard: {
    marginRight: Spacing.md,
  },
  horizontalCarCard: {
    width: width * 0.7,
  },
  brandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  brandCard: {
    width: (width - Spacing.lg * 3) / 4,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...ColorsShadows.small,
  },
  brandLogoContainer: {
    marginBottom: Spacing.sm,
  },
  brandLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  brandLogoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    ...Typography.caption,
    textAlign: 'center',
    fontWeight: '600',
  },
  ctaSection: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...ColorsShadows.large,
  },
  ctaGradient: {
    padding: Spacing.xl,
  },
  ctaContent: {
    alignItems: 'center',
  },
  ctaTitle: {
    ...Typography.h2,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  ctaSubtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    opacity: 0.9,
  },
  ctaButton: {
    paddingHorizontal: Spacing.xl,
  },
});