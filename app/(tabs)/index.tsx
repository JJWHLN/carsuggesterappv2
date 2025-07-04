import React, { useState, useMemo } from 'react'; // Added useMemo
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  Zap as ElectricIcon, // for "Electric"
  Gem as LuxuryIcon, // for "Luxury"
  ShieldCheck as FamilySUVIcon, // for "Family SUV"
  Rocket as SportsCarIcon, // for "Sports Car"
  Briefcase as BrandIcon // For "Popular Brands"
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient'; // For Hero gradient
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { SearchBar } from '@/components/ui/SearchBar'; // Import SearchBar
import { Card } from '@/components/ui/Card'; // Import Card for featured cars/brands
import { OptimizedImage } from '@/components/ui/OptimizedImage'; // For images
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors'; // Removed currentColors
import { useThemeColors } from '@/hooks/useTheme'; // Import useThemeColors
// import { checkDatabaseHealth } from '@/services/api'; // No longer used here
import { useApi } from '@/hooks/useApi'; // Changed from useAsyncOperation
import { fetchCarModels, fetchPopularBrands } from '@/services/api'; // Import fetchCarModels and fetchPopularBrands
// Mock data for popular brands - replace with API calls later


export default function HomeScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const { colors } = useThemeColors(); // Use themed colors
  const styles = useMemo(() => getStyles(colors), [colors]); // Memoize styles

  // Fetch Featured Cars
  const {
    data: featuredCars,
    loading: featuredCarsLoading,
    error: featuredCarsError,
    refetch: refetchFeaturedCars
  } = useApi(() => fetchCarModels({ limit: 5 }), []); // Fetch 5 featured cars

  // Fetch Popular Brands
  const {
    data: popularBrands,
    loading: popularBrandsLoading,
    error: popularBrandsError,
    refetch: refetchPopularBrands
  } = useApi(() => fetchPopularBrands(6), []); // Fetch 6 popular brands

  // const loadHomeData = async () => { ... }; // Kept for reference, but not used

  const quickCategories = [
    { name: 'Electric', icon: ElectricIcon, onPress: () => router.push({ pathname: '/models', params: { category: 'Electric' }}) },
    { name: 'Luxury', icon: LuxuryIcon, onPress: () => router.push({ pathname: '/models', params: { category: 'Luxury' }}) },
    { name: 'Family SUV', icon: FamilySUVIcon, onPress: () => router.push({ pathname: '/models', params: { category: 'SUV' }}) },
    { name: 'Sports Car', icon: SportsCarIcon, onPress: () => router.push({ pathname: '/models', params: { category: 'Sports' }}) },
  ];

  // Example: If you still want a loading state for initial app setup (e.g. font loading, not DB health)
  // const { ready, error: frameworkError } = useFrameworkReady(); // Assuming useFrameworkReady hook exists
  // if (!ready) {
  //   return <LoadingSpinner />;
  // }
  // if (frameworkError) {
  //   return <ErrorState title="Initialization Error" message={frameworkError.message} />;
  // }


  // Removed the old loading/error states tied to DB health for now to focus on UI.
  // These can be re-added if `loadHomeData` is used.

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* New Hero Section */}
        <LinearGradient
          colors={[colors.white, colors.secondaryGreen]} // Use themed colors
          style={styles.heroSectionNew}
        >
          <Text style={[styles.heroGreetingText, { color: colors.text }]}>Find Your Perfect Car</Text>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search cars, makes, models..."
            onSubmit={() => router.push({ pathname: '/search', params: { query: searchQuery }})}
            containerStyle={styles.heroSearchBarContainer} // Use a container style for SearchBar
          />
        </LinearGradient>

        {/* Quick Category Buttons */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
          <View style={styles.quickCategoriesGrid}>
            {quickCategories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.categoryButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                onPress={category.onPress}
              >
                <category.icon color={colors.primary} size={28} />
                <Text style={[styles.categoryButtonText, { color: colors.text }]}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Cars Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Featured Cars</Text>
          {featuredCarsLoading && !featuredCars && ( // Show spinner only on initial load
            <View style={styles.horizontalLoadingContainer}>
              <LoadingSpinner color={colors.primary} />
            </View>
          )}
          {featuredCarsError && (
            <ErrorState title="Could Not Load Cars" message={featuredCarsError} onRetry={refetchFeaturedCars} />
          )}
          {featuredCars && featuredCars.length === 0 && !featuredCarsLoading && (
            <Text style={styles.emptySectionText}>No featured cars available right now.</Text>
          )}
          {featuredCars && featuredCars.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
              {featuredCars.map(car => (
                <Card
                  key={car.id}
                  style={styles.featuredCarCard}
                  onPress={() => router.push(`/model/${car.id}`)}
                  padding={0} // Card handles its own padding, images should fill
                  accessibilityLabel={`View details for ${car.brands?.name} ${car.name}`}
                  accessibilityRole="button"
                >
                  <OptimizedImage
                    source={{uri: car.image_url || ''}}
                    style={{...styles.featuredCarImage, backgroundColor: colors.surfaceDark}}
                    fallbackSource={require('@/assets/images/icon.png')}
                  />
                  <View style={styles.featuredCarTextContainer}>
                    <Text style={[styles.featuredCarTitle, { color: colors.text }]} numberOfLines={1}>{car.brands?.name} {car.name}</Text>
                    {car.year && <Text style={[styles.featuredCarYear, { color: colors.textSecondary }]}>{car.year}</Text>}
                  </View>
                </Card>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Popular Brands Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Brands</Text>
          {popularBrandsLoading && !popularBrands && ( // Show spinner only on initial load
             <View style={styles.horizontalLoadingContainer}>
              <LoadingSpinner color={colors.primary} />
            </View>
          )}
          {popularBrandsError && (
            <ErrorState title="Could Not Load Brands" message={popularBrandsError} onRetry={refetchPopularBrands} />
          )}
          {popularBrands && popularBrands.length === 0 && !popularBrandsLoading && (
             <Text style={styles.emptySectionText}>No popular brands available right now.</Text>
          )}
          {popularBrands && popularBrands.length > 0 && (
            <View style={styles.popularBrandsGrid}>
              {popularBrands.map(brand => (
                <TouchableOpacity
                  key={brand.id}
                  style={styles.brandButton}
                  onPress={() => router.push(`/brand/${brand.id}`)}
                  accessibilityLabel={`View cars from ${brand.name}`}
                  accessibilityRole="button"
                >
                  {brand.logo_url ? (
                    <OptimizedImage
                      source={{uri: brand.logo_url}}
                      style={{...styles.brandLogo, backgroundColor: colors.surfaceDark}}
                      resizeMode="contain"
                      fallbackSource={require('@/assets/images/icon.png')}
                    />
                  ) : (
                    <View style={[styles.brandLogoPlaceholder, { backgroundColor: colors.secondaryGreen }]}>
                      <BrandIcon color={colors.primary} size={32} />
                    </View>
                  )}
                  <Text style={[styles.brandNameText, { color: colors.textSecondary }]}>{brand.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles need to be a function of colors to use themed colors
const getStyles = (colors: typeof import('@/constants/Colors').Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: colors.background, // Applied directly in SafeAreaView
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.bodyText,
    color: colors.textSecondary,
  },
  heroSectionNew: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  heroGreetingText: { // color set inline
    ...Typography.heroTitle,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  heroSearchBarContainer: {
    width: '100%',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  section: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: { // color set inline
    ...Typography.sectionTitle,
    marginBottom: Spacing.md,
  },
  quickCategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryButton: { // backgroundColor, borderColor set inline
    width: '48%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...Shadows.card, // Shadows might need theme adjustment if they use colors directly
  },
  categoryButtonText: { // color set inline
    ...Typography.bodySmall,
    marginTop: Spacing.sm,
    textAlign: 'center',
    fontWeight: '500' as '500',
  },
  horizontalScroll: {
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
    marginTop: Spacing.xs,
  },
  featuredCarCard: {
    width: 180,
    marginRight: Spacing.md,
  },
  featuredCarImage: { // backgroundColor set inline
    width: '100%',
    height: 100,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  featuredCarTextContainer: {
    padding: Spacing.sm,
  },
  featuredCarTitle: { // color set inline
    ...Typography.bodySmall,
    fontWeight: Typography.cardTitle.fontWeight,
    marginBottom: Spacing.xs / 2,
  },
  featuredCarYear: { // color set inline
    ...Typography.caption,
  },
  popularBrandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: Spacing.xs,
  },
  brandButton: {
    width: '30%',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },
  brandLogo: { // backgroundColor set inline
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xs,
  },
  brandLogoPlaceholder: { // backgroundColor set inline
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandNameText: { // color set inline
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  horizontalLoadingContainer: {
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySubtitle: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptySectionText: { // Add missing style
    ...Typography.bodyText,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
});
// Inside HomeScreen component: const styles = getStyles(colors);