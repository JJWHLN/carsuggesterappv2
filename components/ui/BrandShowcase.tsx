import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { ArrowRight, Building2, TrendingUp } from 'lucide-react-native';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');

interface Brand {
  id: string;
  name: string;
  logo_url?: string;
  model_count?: number;
  popular?: boolean;
}

interface BrandShowcaseProps {
  brands: Brand[];
  loading: boolean;
  onViewAll: () => void;
  onBrandPress: (brandId: string) => void;
}

export const BrandShowcase: React.FC<BrandShowcaseProps> = ({
  brands,
  loading,
  onViewAll,
  onBrandPress,
}) => {
  const { colors } = useThemeColors();

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

  const BrandCard: React.FC<{ brand: Brand; featured?: boolean }> = ({ brand, featured = false }) => (
    <TouchableOpacity
      style={[
        featured ? styles.featuredBrandCard : styles.brandCard,
        { backgroundColor: colors.white, borderColor: colors.border }
      ]}
      onPress={() => onBrandPress(brand.id)}
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
        
        {brand.popular && (
          <View style={styles.popularBadge}>
            <TrendingUp color="#F59E0B" size={12} />
          </View>
        )}
      </View>

      {/* Brand Info */}
      <View style={styles.brandInfo}>
        <Text style={[
          featured ? styles.featuredBrandName : styles.brandName,
          { color: colors.text }
        ]} numberOfLines={1}>
          {brand.name}
        </Text>
        
        {brand.model_count && featured && (
          <Text style={[styles.modelCount, { color: colors.textSecondary }]}>
            {brand.model_count} models
          </Text>
        )}
      </View>

      {featured && (
        <View style={styles.featuredIndicator}>
          <ArrowRight color={colors.primary} size={16} />
        </View>
      )}
    </TouchableOpacity>
  );

  // Split brands into featured and regular
  const featuredBrands = brands.slice(0, 3);
  const regularBrands = brands.slice(3);

  return (
    <View style={styles.container}>
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
          onPress={onViewAll}
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
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading brands...
          </Text>
        </View>
      ) : (
        <View>
          {/* Featured Brands */}
          {featuredBrands.length > 0 && (
            <View style={styles.featuredSection}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>
                Most Popular
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.featuredScroll}
              >
                {featuredBrands.map((brand) => (
                  <View key={brand.id} style={styles.featuredBrandWrapper}>
                    <BrandCard brand={brand} featured={true} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Regular Brands Grid */}
          {regularBrands.length > 0 && (
            <View style={styles.regularSection}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>
                All Brands
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.brandsGrid}
              >
                {regularBrands.map((brand) => (
                  <View key={brand.id} style={styles.brandCardWrapper}>
                    <BrandCard brand={brand} />
                  </View>
                ))}
                
                {/* View All Card */}
                <TouchableOpacity
                  style={[styles.viewMoreCard, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  onPress={onViewAll}
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
          )}
        </View>
      )}
    </View>
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
    width: 140,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
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
    ...Shadows.small,
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
    ...Typography.bodySmall,
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
});
