import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  Zap as ElectricIcon,
  Gem as LuxuryIcon,
  ShieldCheck as FamilySUVIcon,
  Rocket as SportsCarIcon,
  Briefcase as BrandIcon,
  TrendingUp,
  Car,
  Star,
  ChevronRight,
  Search,
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
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';
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
  } = useApi(() => fetchCarModels({ limit: 8 }), []);

  const {
    data: popularBrands,
    loading: popularBrandsLoading,
    error: popularBrandsError,
    refetch: refetchPopularBrands
  } = useApi(() => fetchPopularBrands(6), []);

  const quickCategories = [
    { name: 'Electric', icon: ElectricIcon, onPress: () => router.push({ pathname: '/models', params: { category: 'Electric' }}) },
    { name: 'Luxury', icon: LuxuryIcon, onPress: () => router.push({ pathname: '/models', params: { category: 'Luxury' }}) },
    { name: 'Family SUV', icon: FamilySUVIcon, onPress: () => router.push({ pathname: '/models', params: { category: 'SUV' }}) },
    { name: 'Sports Car', icon: SportsCarIcon, onPress: () => router.push({ pathname: '/models', params: { category: 'Sports' }}) },
  ];

  const stats = [
    { title: '10K+', subtitle: 'Cars Available', icon: <Car color={colors.primary} size={24} /> },
    { title: '500+', subtitle: 'Verified Dealers', icon: <Star color={colors.accentGreen} size={24} /> },
    { title: '50+', subtitle: 'Car Brands', icon: <TrendingUp color={colors.success} size={24} /> },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Modern Hero Section */}
        <LinearGradient
          colors={[colors.primary, colors.primaryHover]}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroContent}>
            <Text style={[styles.heroTitle, { color: colors.white }]}>
              Find Your Dream Car
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.white }]}>
              Discover thousands of cars with AI-powered recommendations
            </Text>
            
            <View style={styles.heroSearchContainer}>
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search for cars, brands, models..."
                onSubmit={() => router.push({ pathname: '/search', params: { query: searchQuery }})}
                containerStyle={styles.heroSearchBar}
              />
            </View>

            <View style={styles.heroButtons}>
              <Button
                title={user ? "Find My Car" : "Get AI Recommendations"}
                onPress={() => handleAuthRequired(
                  () => router.push('/recommendations'),
                  () => router.push('/auth/sign-in')
                )}
                variant="secondary"
                style={styles.findMyCarButton}
                icon={<Car color={colors.primary} size={20} />}
              />
              <Button
                title="Browse All"
                onPress={() => router.push('/search')}
                variant="outline"
                style={styles.browseButton}
                icon={<Search color={colors.white} size={20} />}
              />
            </View>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                value={stat.title}
                label={stat.subtitle}
                icon={stat.icon}
                style={StyleSheet.flatten([styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }])}
              />
            ))}
          </View>
        </View>

        {/* Quick Categories */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Browse by Category</Text>
          <View style={styles.categoriesGrid}>
            {quickCategories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.categoryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={category.onPress}
                activeOpacity={0.8}
              >
                <View style={[styles.categoryIcon, { backgroundColor: colors.primaryLight }]}>
                  <category.icon color={colors.primary} size={28} />
                </View>
                <Text style={[styles.categoryText, { color: colors.text }]}>{category.name}</Text>
                <ChevronRight color={colors.textSecondary} size={16} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Cars Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Cars</Text>
            <TouchableOpacity onPress={() => router.push('/models')}>
              <Text style={[styles.sectionAction, { color: colors.primary }]}>View All</Text>
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
            <View style={styles.carsGrid}>
              {featuredCars.slice(0, 4).map(car => (
                <CarCard
                  key={car.id}
                  image={car.image_url || ''}
                  name={`${car.brands?.name} ${car.name}`}
                  year={car.year}
                  priceRange="Price on request"
                  tags={car.category || []}
                  rating={4.5}
                  location="Multiple locations"
                  onPress={() => router.push(`/model/${car.id}`)}
                  style={styles.carCard}
                />
              ))}
            </View>
          )}
        </View>

        {/* Popular Brands Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Brands</Text>
            <TouchableOpacity onPress={() => router.push('/models')}>
              <Text style={[styles.sectionAction, { color: colors.primary }]}>View All</Text>
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
                  {brand.logo_url ? (
                    <OptimizedImage
                      source={{uri: brand.logo_url}}
                      style={styles.brandLogo}
                      resizeMode="contain"
                      fallbackSource={require('@/assets/images/icon.png')}
                    />
                  ) : (
                    <View style={[styles.brandLogoPlaceholder, { backgroundColor: colors.primaryLight }]}>
                      <BrandIcon color={colors.primary} size={32} />
                    </View>
                  )}
                  <Text style={[styles.brandName, { color: colors.text }]} numberOfLines={1}>
                    {brand.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl * 2,
    alignItems: 'center',
    minHeight: height * 0.4,
    justifyContent: 'center',
  },
  heroContent: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  heroTitle: {
    ...Typography.heroTitle,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontWeight: '800',
  },
  heroSubtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    opacity: 0.9,
    lineHeight: 24,
  },
  heroSearchContainer: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  heroSearchBar: {
    backgroundColor: colors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.large,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    marginTop: Spacing.md,
  },
  findMyCarButton: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  browseButton: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  statsSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h3,
    fontWeight: '700',
  },
  sectionAction: {
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
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadows.small,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  categoryText: {
    ...Typography.body,
    fontWeight: '600',
    flex: 1,
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  carsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  carCard: {
    width: (width - Spacing.lg * 3) / 2,
  },
  brandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  brandCard: {
    width: (width - Spacing.lg * 4) / 3,
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...Shadows.small,
  },
  brandLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: Spacing.xs,
  },
  brandLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  brandName: {
    ...Typography.caption,
    textAlign: 'center',
    fontWeight: '600',
  },
});