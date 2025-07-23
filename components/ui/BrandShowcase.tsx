import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS
} from 'react-native-reanimated';

import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { BrandSkeletonLoader } from '@/components/ui/SkeletonLoader';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import { ArrowRight, Building2, TrendingUp, Star } from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');
const BRAND_CARD_WIDTH = 140;
const BRAND_CARD_SPACING = 16;
const ANIMATION_DURATION = 300;

interface Brand {
  id: string;
  name: string;
  logo_url?: string;
  model_count?: number;
  popular?: boolean;
  rating?: number;
  new_arrivals?: number;
}

interface BrandShowcaseProps {
  brands: Brand[];
  loading: boolean;
  onViewAll: () => void;
  onBrandPress: (brandId: string) => void;
  testID?: string;
}

export const BrandShowcase: React.FC<BrandShowcaseProps> = ({
  brands,
  loading,
  onViewAll,
  onBrandPress,
  testID = 'brand-showcase'
}) => {
  const { colors } = useThemeColors();
  
  // Animation values
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(20);
  
  // Memoize expensive computations
  const { featuredBrands, regularBrands } = useMemo(() => ({
    featuredBrands: brands.slice(0, 3),
    regularBrands: brands.slice(3),
  }), [brands]);
  
  // Animate on mount
  React.useEffect(() => {
    fadeAnim.value = withTiming(1, { duration: ANIMATION_DURATION });
    slideAnim.value = withSpring(0, { 
      damping: 15,
      stiffness: 100,
    });
  }, []);

  // Optimized press handler
  const handleBrandPress = useCallback((brandId: string) => {
    onBrandPress(brandId);
  }, [onBrandPress]);

  // Optimized view all handler
  const handleViewAll = useCallback(() => {
    onViewAll();
  }, [onViewAll]);

  // Popular brand logos (fallback for well-known brands)
  const brandLogos: Record<string, string> = {
    'BMW': 'https://images.vexels.com/media/users/3/166421/isolated/preview/a4cffed4b7c50ddbbe76a23cf9f10e5d-bmw-car-logo.png',
    'Mercedes-Benz': 'https://images.vexels.com/media/users/3/166405/isolated/preview/c938d26c8a2095bea4de5e8ffbc1e62a-mercedes-benz-car-logo.png',
    'Audi': 'https://images.vexels.com/media/users/3/166406/isolated/preview/5ad0d4d5b1d36b6de7a55c92acee5d7b-audi-car-logo.png',
    'Toyota': 'https://images.vexels.com/media/users/3/166427/isolated/preview/ded2c42f7f2a41b4e0cdafdc0bea491b-toyota-car-logo.png',
    'Honda': 'https://images.vexels.com/media/users/3/166414/isolated/preview/39e84ca66c40eb9ba5b6f542b70f2a71-honda-car-logo.png',
    'Ford': 'https://images.vexels.com/media/users/3/166411/isolated/preview/5936b0eef3ebcfeba9aec4eaa8dd3b49-ford-car-logo.png',
    'Chevrolet': 'https://images.vexels.com/media/users/3/166408/isolated/preview/d8b05a4797c63c1f0f4e3be0ea1afcb3-chevrolet-car-logo.png',
    'Volkswagen': 'https://images.vexels.com/media/users/3/166430/isolated/preview/b1de45ccfb80b89e4d5b23b5bf7b3db1-volkswagen-car-logo.png',
  };

  const BrandCard: React.FC<{ 
    brand: Brand; 
    featured?: boolean; 
    index?: number;
    onPress?: (brandId: string) => void;
  }> = ({ brand, featured = false, index = 0, onPress }) => {
    const scaleAnim = useSharedValue(1);
    const opacityAnim = useSharedValue(0);

    // Staggered entrance animation
    React.useEffect(() => {
      const delay = index * 100;
      setTimeout(() => {
        opacityAnim.value = withTiming(1, { duration: 300 });
      }, delay);
    }, [index]);

    const handlePress = () => {
      scaleAnim.value = withSpring(0.95, { duration: 100 }, () => {
        scaleAnim.value = withSpring(1, { duration: 100 });
      });
      if (onPress) onPress(brand.id);
    };

    const cardStyle = useAnimatedStyle(() => ({
      opacity: opacityAnim.value,
      transform: [{ scale: scaleAnim.value }],
    }));

    return (
      <Animated.View style={cardStyle}>
        <TouchableOpacity
          style={[
            featured ? styles.featuredBrandCard : styles.brandCard,
            { backgroundColor: colors.white, borderColor: colors.border }
          ]}
          onPress={handlePress}
          activeOpacity={0.9}
        >
          {/* Logo Container */}
          <View style={[styles.logoContainer, featured && styles.featuredLogoContainer]}>
            {brand.logo_url || brandLogos[brand.name] ? (
              <OptimizedImage
                source={{ uri: brand.logo_url || brandLogos[brand.name] }}
                style={featured ? styles.featuredBrandLogo : styles.brandLogo}
                resizeMode="contain"
                fallbackSource={require('@/assets/images/icon.png')}
              />
            ) : (
              <View style={[styles.logoPlaceholder, { backgroundColor: colors.primaryLight }]}>
                <Building2 color={colors.primary} size={featured ? 32 : 24} />
              </View>
            )}
            
            {brand.popular ? (
              <View style={styles.popularBadge}>
                <TrendingUp color="#F59E0B" size={12} />
              </View>
            ) : null}

            {/* Rating badge for featured brands */}
            {featured && brand.rating ? (
              <View style={styles.ratingBadge}>
                <Star color="#FFD700" size={10} fill="#FFD700" />
                <Text style={styles.ratingText}>{brand.rating}</Text>
              </View>
            ) : null}
          </View>

          {/* Brand Info */}
          <View style={styles.brandInfo}>
            <Text style={[
              featured ? styles.featuredBrandName : styles.brandName,
              { color: colors.text }
            ]} numberOfLines={1}>
              {brand.name}
            </Text>
            
            {featured && brand.model_count ? (
              <Text style={[styles.modelCount, { color: colors.textSecondary }]}>
                {brand.model_count} models
              </Text>
            ) : null}

            {featured && brand.new_arrivals ? (
              <Text style={[styles.newArrivals, { color: colors.primary }]}>
                +{brand.new_arrivals} new
              </Text>
            ) : null}
          </View>

          {featured ? (
            <View style={styles.featuredIndicator}>
              <ArrowRight color={colors.primary} size={16} />
            </View>
          ) : null}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Container animation style
  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]} testID={testID}>
      {/* Section Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Popular Brands
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Explore top automotive manufacturers
          </Text>
        </View>
        <TouchableOpacity 
          onPress={handleViewAll}
          style={styles.viewAllButton}
          activeOpacity={0.8}
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>
            View All
          </Text>
          <ArrowRight color={colors.primary} size={16} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View>
          {/* Featured Brands Skeleton */}
          <View style={styles.featuredSection}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              Most Popular
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScroll}
            >
              {[...Array(3)].map((_, index) => (
                <BrandSkeletonLoader key={index} featured={true} />
              ))}
            </ScrollView>
          </View>

          {/* Regular Brands Skeleton */}
          <View style={styles.regularSection}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>
              All Brands
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.brandsGrid}
            >
              {[...Array(6)].map((_, index) => (
                <BrandSkeletonLoader key={index} featured={false} />
              ))}
            </ScrollView>
          </View>
        </View>
      ) : brands.length === 0 ? (
        <View style={styles.emptyState}>
          <Building2 color={colors.textSecondary} size={48} />
          <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
            No brands available
          </Text>
          <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
            We're working on adding more car brands for you
          </Text>
        </View>
      ) : (
        <View>
          {/* Featured Brands */}
          {featuredBrands.length > 0 ? (
            <View style={styles.featuredSection}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>
                Most Popular
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredScroll}
                decelerationRate="fast"
                snapToInterval={BRAND_CARD_WIDTH + BRAND_CARD_SPACING}
                snapToAlignment="start"
              >
                {featuredBrands.map((brand, index) => (
                  <BrandCard 
                    key={brand.id} 
                    brand={brand} 
                    featured={true}
                    index={index}
                    onPress={handleBrandPress}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Regular Brands Grid */}
          {regularBrands.length > 0 ? (
            <View style={styles.regularSection}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>
                All Brands
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.brandsGrid}
                decelerationRate="fast"
              >
                {regularBrands.map((brand, index) => (
                  <BrandCard 
                    key={brand.id} 
                    brand={brand} 
                    featured={false}
                    index={index}
                    onPress={handleBrandPress}
                  />
                ))}
                
                {/* View All Card */}
                <TouchableOpacity
                  style={[styles.viewMoreCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  onPress={handleViewAll}
                  activeOpacity={0.8}
                >
                  <View style={styles.viewMoreContent}>
                    <View style={[styles.viewMoreIcon, { backgroundColor: colors.primary }]}>
                      <ArrowRight color="#FFFFFF" size={20} />
                    </View>
                    <Text style={[styles.viewMoreText, { color: colors.primary }]}>
                      View All{'\n'}Brands
                    </Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            </View>
          ) : null}
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.sectionTitle,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyText,
    lineHeight: 22,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  viewAllText: {
    ...Typography.bodyText,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.bodyText,
  },
  featuredSection: {
    marginBottom: Spacing.xl,
  },
  regularSection: {
    // No additional margin
  },
  sectionLabel: {
    ...Typography.cardTitle,
    fontWeight: '600',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  featuredScroll: {
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.md,
  },
  featuredBrandWrapper: {
    marginRight: Spacing.md,
  },
  featuredBrandCard: {
    width: BRAND_CARD_WIDTH,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: BRAND_CARD_SPACING,
    ...Shadows.card,
  },
  brandsGrid: {
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.md,
  },
  brandCardWrapper: {
    marginRight: Spacing.sm,
  },
  brandCard: {
    width: 90,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: Spacing.sm,
    ...Shadows.sm,
  },
  logoContainer: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  featuredLogoContainer: {
    marginBottom: Spacing.md,
  },
  brandLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  featuredBrandLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 4,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  brandInfo: {
    alignItems: 'center',
  },
  brandName: {
    ...Typography.caption,
    fontWeight: '600',
    textAlign: 'center',
  },
  featuredBrandName: {
    ...Typography.caption,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  modelCount: {
    ...Typography.caption,
    textAlign: 'center',
  },
  featuredIndicator: {
    marginTop: Spacing.sm,
  },
  viewMoreCard: {
    width: 90,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 110,
  },
  viewMoreContent: {
    alignItems: 'center',
  },
  viewMoreIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  viewMoreText: {
    ...Typography.caption,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#FFD700',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
    color: '#FFD700',
  },
  newArrivals: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyStateTitle: {
    ...Typography.cardTitle,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    ...Typography.bodyText,
    textAlign: 'center',
    lineHeight: 22,
  },
});
