import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search, 
  Filter, 
  MapPin, 
  DollarSign, 
  Car,
  TrendingUp,
  Users,
  Shield,
  Star,
  Building2,
  Award,
  Clock,
  ChevronRight,
} from 'lucide-react-native';
import { ComingSoon } from '@/components/ui/ComingSoon';
import { StatCard } from '@/components/ui/StatCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { Card } from '@/components/ui/Card';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Button } from '@/components/ui/Button';
import { Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';

export default function MarketplaceScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => getThemedStyles(colors), [colors]);
  
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data for marketplace features
  const featuredDealers = [
    {
      id: 1,
      name: "Premium Auto Group",
      location: "Los Angeles, CA",
      rating: 4.8,
      verified: true,
      specialties: ["Luxury", "Sports Cars"],
      image: "https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=400",
      inventory: 45,
      yearsInBusiness: 15,
    },
    {
      id: 2,
      name: "City Motors",
      location: "San Francisco, CA",
      rating: 4.6,
      verified: true,
      specialties: ["Family Cars", "Electric"],
      image: "https://images.pexels.com/photos/1149137/pexels-photo-1149137.jpeg?auto=compress&cs=tinysrgb&w=400",
      inventory: 32,
      yearsInBusiness: 8,
    },
    {
      id: 3,
      name: "Electric Future Motors",
      location: "Austin, TX",
      rating: 4.9,
      verified: true,
      specialties: ["Electric", "Hybrid", "Eco-Friendly"],
      image: "https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=400",
      inventory: 28,
      yearsInBusiness: 5,
    }
  ];

  const popularSearches = [
    "Toyota Camry under $25,000",
    "BMW 3 Series in California", 
    "Electric vehicles near me",
    "SUVs with low mileage",
    "Certified pre-owned luxury cars",
    "Honda Civic 2020-2023",
  ];

  const marketplaceStats = [
    { icon: <Car color={colors.primary} size={24} />, value: "10,000+", label: "Cars Available" },
    { icon: <Users color={colors.success} size={24} />, value: "500+", label: "Verified Dealers" },
    { icon: <Shield color={colors.accentGreen} size={24} />, value: "100%", label: "Verified Listings" },
  ];

  const SearchSuggestionCard = useCallback(({ suggestion }: { suggestion: string }) => (
    <TouchableOpacity style={styles.suggestionCard}>
      <Search color={colors.textSecondary} size={16} />
      <Text style={styles.suggestionText}>{suggestion}</Text>
      <ChevronRight color={colors.textSecondary} size={16} />
    </TouchableOpacity>
  ), [colors, styles]);

  const DealerCard = useCallback(({ dealer }: { dealer: any }) => (
    <Card style={styles.dealerCard} onPress={() => console.log("Dealer pressed:", dealer.id)}>
      <OptimizedImage source={{ uri: dealer.image }} style={styles.dealerImage} />
      <View style={styles.dealerContent}>
        <View style={styles.dealerHeader}>
          <Text style={styles.dealerName}>{dealer.name}</Text>
          {dealer.verified && (
            <View style={styles.verifiedBadge}>
              <Shield color={colors.white} size={12} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
        
        <View style={styles.dealerDetails}>
          <View style={styles.dealerDetailRow}>
            <MapPin color={colors.textSecondary} size={14} />
            <Text style={styles.dealerLocationText}>{dealer.location}</Text>
          </View>
          
          <View style={styles.dealerDetailRow}>
            <Star color={colors.warning} size={14} fill={colors.warning} />
            <Text style={styles.dealerRatingText}>{dealer.rating}</Text>
          </View>
          
          <View style={styles.dealerDetailRow}>
            <Building2 color={colors.textSecondary} size={14} />
            <Text style={styles.dealerDetailText}>{dealer.inventory} cars</Text>
          </View>
          
          <View style={styles.dealerDetailRow}>
            <Clock color={colors.textSecondary} size={14} />
            <Text style={styles.dealerDetailText}>{dealer.yearsInBusiness} years</Text>
          </View>
        </View>
        
        <View style={styles.dealerSpecialties}>
          {dealer.specialties.map((specialty: string, index: number) => (
            <View key={index} style={styles.specialtyTag}>
              <Text style={styles.specialtyText}>{specialty}</Text>
            </View>
          ))}
        </View>
      </View>
    </Card>
  ), [colors, styles]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Hero Header */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Car Marketplace</Text>
          <Text style={styles.heroSubtitle}>
            Connect with verified dealers and find your perfect car
          </Text>
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search cars, dealers, locations..."
            onClear={() => setSearchQuery('')}
            containerStyle={styles.searchBarContainer}
          />
        </View>

        {/* Coming Soon Notice */}
        <View style={styles.comingSoonSection}>
          <ComingSoon
            title="Marketplace Coming Soon!"
            message="We're building an amazing marketplace experience with verified dealers and comprehensive car listings. Stay tuned for the launch!"
            icon={<TrendingUp color={colors.primary} size={32} />}
          />
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Marketplace Overview</Text>
          <View style={styles.statsGrid}>
            {marketplaceStats.map((stat, index) => (
              <StatCard
                key={index}
                icon={stat.icon}
                value={stat.value}
                label={stat.label}
              />
            ))}
          </View>
        </View>

        {/* Featured Dealers Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Dealers</Text>
            <Text style={styles.sectionSubtitle}>
              Premium verified dealers you can trust
            </Text>
          </View>
          
          <FlatList
            data={featuredDealers}
            renderItem={({ item }) => <DealerCard dealer={item} />}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Popular Searches */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Searches</Text>
            <Text style={styles.sectionSubtitle}>
              Quick search suggestions from our community
            </Text>
          </View>
          
          <FlatList
            data={popularSearches}
            renderItem={({ item }) => <SearchSuggestionCard suggestion={item} />}
            keyExtractor={(item, index) => index.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Features Preview */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>What's Coming</Text>
            <Text style={styles.sectionSubtitle}>
              Features that will make car buying effortless
            </Text>
          </View>
          
          <View style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <Shield color={colors.success} size={24} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Verified Dealers Only</Text>
              <Text style={styles.featureDescription}>
                All dealers go through a rigorous verification process to ensure quality and trustworthiness
              </Text>
            </View>
          </View>
          
          <View style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <DollarSign color={colors.primary} size={24} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Transparent Pricing</Text>
              <Text style={styles.featureDescription}>
                No hidden fees, clear pricing information for every listing with upfront costs
              </Text>
            </View>
          </View>
          
          <View style={styles.featureCard}>
            <View style={styles.featureIconContainer}>
              <Award color={colors.accentGreen} size={24} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Quality Guarantee</Text>
              <Text style={styles.featureDescription}>
                Complete vehicle history reports and professional inspection details for peace of mind
              </Text>
            </View>
          </View>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaTitle}>Ready to find your perfect car?</Text>
          <Text style={styles.ctaSubtitle}>
            Join thousands of happy customers who found their dream car through our platform
          </Text>
          <Button
            title="Notify Me When Ready"
            onPress={() => console.log('Notify me pressed')}
            variant="primary"
            style={styles.ctaButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getThemedStyles = (colors: typeof import('@/constants/Colors').Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: Spacing.xxl,
  },
  hero: {
    padding: Spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  heroTitle: {
    ...Typography.h1,
    color: colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  heroSubtitle: {
    ...Typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  searchSection: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBarContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  comingSoonSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  statsSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    backgroundColor: colors.background,
  },
  sectionHeader: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h2,
    color: colors.text,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  dealerCard: {
    marginBottom: Spacing.lg,
  },
  dealerImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    backgroundColor: colors.surfaceDark,
  },
  dealerContent: {
    padding: Spacing.lg,
  },
  dealerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  dealerName: {
    ...Typography.h3,
    color: colors.text,
    flex: 1,
    marginRight: Spacing.md,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  verifiedText: {
    ...Typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  dealerDetails: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  dealerDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dealerLocationText: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
  },
  dealerRatingText: {
    ...Typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  dealerDetailText: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
  },
  dealerSpecialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  specialtyTag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  specialtyText: {
    ...Typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
  suggestionCard: {
    backgroundColor: colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...ColorsShadows.small,
  },
  suggestionText: {
    ...Typography.body,
    color: colors.text,
    flex: 1,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...ColorsShadows.small,
  },
  featureIconContainer: {
    marginRight: Spacing.md,
    paddingTop: Spacing.xs,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.h3,
    color: colors.text,
    marginBottom: Spacing.sm,
  },
  featureDescription: {
    ...Typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  ctaSection: {
    padding: Spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  ctaTitle: {
    ...Typography.h2,
    color: colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  ctaSubtitle: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  ctaButton: {
    minWidth: 200,
  },
});
