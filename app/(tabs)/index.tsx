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
  MapPin,
  Heart,
  Star,
  TrendingUp,
  Car,
  Filter,
  ChevronRight,
  Play,
  Award,
  Users,
  Building2,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
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

  // Mock featured reviews data
  const featuredReviews = [
    {
      id: 1,
      title: "2024 BMW X5 Review: Luxury Redefined",
      image: "https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=800",
      rating: 4.8,
      author: "CarSuggester Expert",
      readTime: "8 min read",
      hasVideo: true,
    },
    {
      id: 2,
      title: "Tesla Model 3 vs Model Y: Which to Choose?",
      image: "https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=800",
      rating: 4.6,
      author: "Electric Car Specialist",
      readTime: "12 min read",
      hasVideo: false,
    },
    {
      id: 3,
      title: "Toyota Camry Hybrid: The Perfect Family Car",
      image: "https://images.pexels.com/photos/1149137/pexels-photo-1149137.jpeg?auto=compress&cs=tinysrgb&w=800",
      rating: 4.7,
      author: "Family Car Expert",
      readTime: "6 min read",
      hasVideo: true,
    },
  ];

  const quickStats = [
    { icon: <Car color={colors.primary} size={24} />, value: "15,000+", label: "Cars Listed" },
    { icon: <Users color={colors.success} size={24} />, value: "2,500+", label: "Happy Customers" },
    { icon: <Building2 color={colors.accentGreen} size={24} />, value: "500+", label: "Verified Dealers" },
  ];

  const FeaturedCarCard = ({ car }: { car: any }) => (
    <TouchableOpacity 
      style={styles.featuredCarCard}
      onPress={() => router.push(`/model/${car.id}`)}
      activeOpacity={0.9}
    >
      <View style={styles.carImageContainer}>
        <OptimizedImage
          source={{ uri: car.image_url || 'https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=400' }}
          style={styles.carImage}
          resizeMode="cover"
        />
        <TouchableOpacity style={styles.favoriteButton}>
          <Heart color={colors.white} size={18} />
        </TouchableOpacity>
        <View style={styles.carBadge}>
          <Text style={styles.carBadgeText}>Featured</Text>
        </View>
      </View>
      
      <View style={styles.carCardContent}>
        <Text style={styles.carPrice}>From $35,000</Text>
        <Text style={styles.carTitle}>{car.brands?.name} {car.name}</Text>
        <Text style={styles.carYear}>{car.year} Model</Text>
        
        <View style={styles.carFeatures}>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>Automatic</Text>
          </View>
          <View style={styles.featureItem}>
            <Text style={styles.featureText}>Hybrid</Text>
          </View>
        </View>
        
        <View style={styles.carLocation}>
          <MapPin color={colors.textSecondary} size={14} />
          <Text style={styles.locationText}>Multiple Locations</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const ReviewCard = ({ review }: { review: any }) => (
    <TouchableOpacity 
      style={styles.reviewCard}
      onPress={() => router.push(`/review/${review.id}`)}
      activeOpacity={0.9}
    >
      <ImageBackground
        source={{ uri: review.image }}
        style={styles.reviewImageBackground}
        imageStyle={styles.reviewImage}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.reviewGradient}
        >
          {review.hasVideo && (
            <View style={styles.playButton}>
              <Play color={colors.white} size={20} fill={colors.white} />
            </View>
          )}
          
          <View style={styles.reviewContent}>
            <View style={styles.reviewRating}>
              <Star color={colors.warning} size={16} fill={colors.warning} />
              <Text style={styles.ratingText}>{review.rating}</Text>
            </View>
            
            <Text style={styles.reviewTitle}>{review.title}</Text>
            
            <View style={styles.reviewMeta}>
              <Text style={styles.reviewAuthor}>{review.author}</Text>
              <Text style={styles.reviewReadTime}>{review.readTime}</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Hero Search Section */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={[colors.primary, colors.primaryHover]}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroContent}>
              <Text style={styles.heroTitle}>Find Your Perfect Car</Text>
              <Text style={styles.heroSubtitle}>
                Browse thousands of verified listings from trusted dealers
              </Text>
              
              <View style={styles.searchContainer}>
                <SearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search by make, model, or location..."
                  onSubmit={() => router.push({ pathname: '/search', params: { query: searchQuery }})}
                  containerStyle={styles.heroSearchBar}
                />
                
                <TouchableOpacity style={styles.filterButton}>
                  <Filter color={colors.primary} size={20} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.quickFilters}>
                {['Under $20k', 'Electric', 'SUV', 'Luxury'].map((filter, index) => (
                  <TouchableOpacity key={index} style={styles.quickFilterChip}>
                    <Text style={styles.quickFilterText}>{filter}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsContainer}>
            {quickStats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={styles.statIcon}>{stat.icon}</View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Featured Reviews */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Reviews</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight color={colors.primary} size={16} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.reviewsScroll}
          >
            {featuredReviews.map(review => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </ScrollView>
        </View>

        {/* Featured Cars */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Cars</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/models')}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight color={colors.primary} size={16} />
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
              {featuredCars.slice(0, 6).map(car => (
                <FeaturedCarCard key={car.id} car={car} />
              ))}
            </View>
          )}
        </View>

        {/* Popular Brands */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Shop by Brand</Text>
            <TouchableOpacity style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>View All</Text>
              <ChevronRight color={colors.primary} size={16} />
            </TouchableOpacity>
          </View>
          
          {popularBrandsLoading && !popularBrands && (
            <View style={styles.loadingContainer}>
              <LoadingSpinner color={colors.primary} />
            </View>
          )}
          
          {popularBrands && popularBrands.length > 0 && (
            <View style={styles.brandsGrid}>
              {popularBrands.map(brand => (
                <TouchableOpacity
                  key={brand.id}
                  style={styles.brandCard}
                  onPress={() => router.push(`/brand/${brand.id}`)}
                  activeOpacity={0.8}
                >
                  <OptimizedImage
                    source={{ uri: brand.logo_url || '' }}
                    style={styles.brandLogo}
                    resizeMode="contain"
                    fallbackSource={require('@/assets/images/icon.png')}
                  />
                  <Text style={styles.brandName}>{brand.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <View style={styles.ctaCard}>
            <Award color={colors.primary} size={32} />
            <Text style={styles.ctaTitle}>Ready to Sell Your Car?</Text>
            <Text style={styles.ctaSubtitle}>
              List your car for free and reach thousands of potential buyers
            </Text>
            <Button
              title="List Your Car"
              onPress={() => router.push('/add-car')}
              style={styles.ctaButton}
            />
          </View>
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
  
  // Hero Section
  heroSection: {
    marginBottom: Spacing.xl,
  },
  heroGradient: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl * 1.5,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    ...Typography.heroTitle,
    color: colors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    fontWeight: '800',
  },
  heroSubtitle: {
    ...Typography.bodyLarge,
    color: colors.white,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    opacity: 0.9,
  },
  searchContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  heroSearchBar: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: BorderRadius.xl,
    ...ColorsShadows.large,
  },
  filterButton: {
    backgroundColor: colors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...ColorsShadows.large,
  },
  quickFilters: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  quickFilterChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  quickFilterText: {
    ...Typography.bodySmall,
    color: colors.white,
    fontWeight: '500',
  },

  // Stats Section
  statsSection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...ColorsShadows.card,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    marginBottom: Spacing.sm,
  },
  statValue: {
    ...Typography.h2,
    color: colors.text,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Section Styles
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h2,
    color: colors.text,
    fontWeight: '700',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  viewAllText: {
    ...Typography.body,
    color: colors.primary,
    fontWeight: '600',
  },

  // Review Cards
  reviewsScroll: {
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.md,
  },
  reviewCard: {
    width: width * 0.75,
    height: 200,
    marginRight: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...ColorsShadows.large,
  },
  reviewImageBackground: {
    flex: 1,
  },
  reviewImage: {
    borderRadius: BorderRadius.xl,
  },
  reviewGradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  playButton: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: BorderRadius.full,
    padding: Spacing.md,
  },
  reviewContent: {
    gap: Spacing.sm,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ratingText: {
    ...Typography.bodySmall,
    color: colors.white,
    fontWeight: '600',
  },
  reviewTitle: {
    ...Typography.h3,
    color: colors.white,
    fontWeight: '700',
  },
  reviewMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewAuthor: {
    ...Typography.bodySmall,
    color: colors.white,
    opacity: 0.9,
  },
  reviewReadTime: {
    ...Typography.bodySmall,
    color: colors.white,
    opacity: 0.9,
  },

  // Car Cards
  carsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  featuredCarCard: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...ColorsShadows.card,
  },
  carImageContainer: {
    position: 'relative',
    height: 140,
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: BorderRadius.full,
    padding: Spacing.sm,
  },
  carBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  carBadgeText: {
    ...Typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 10,
  },
  carCardContent: {
    padding: Spacing.md,
  },
  carPrice: {
    ...Typography.h3,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  carTitle: {
    ...Typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  carYear: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  carFeatures: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  featureItem: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  featureText: {
    ...Typography.caption,
    color: colors.primary,
    fontSize: 10,
    fontWeight: '500',
  },
  carLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  locationText: {
    ...Typography.caption,
    color: colors.textSecondary,
  },

  // Brands Grid
  brandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  brandCard: {
    width: (width - Spacing.lg * 2 - Spacing.md * 2) / 3,
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    ...ColorsShadows.small,
  },
  brandLogo: {
    width: 40,
    height: 40,
    marginBottom: Spacing.sm,
  },
  brandName: {
    ...Typography.caption,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },

  // CTA Section
  ctaSection: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
  },
  ctaCard: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...ColorsShadows.large,
  },
  ctaTitle: {
    ...Typography.h2,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  ctaSubtitle: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  ctaButton: {
    minWidth: 200,
  },

  // Loading
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
});