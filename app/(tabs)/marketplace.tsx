import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
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
  Star
} from 'lucide-react-native';
import { ComingSoon } from '@/components/ui/ComingSoon';
import { StatCard } from '@/components/ui/StatCard';
import { SearchBar } from '@/components/ui/SearchBar'; // Import SearchBar
import { Card } from '@/components/ui/Card'; // Import Card
import { OptimizedImage } from '@/components/ui/OptimizedImage'; // Import OptimizedImage
import { currentColors, Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors';

export default function MarketplaceScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  // const [loading, setLoading] = useState(false); // Not currently used for data fetching

  // Mock data for marketplace features - Keep for now
  const featuredDealers = [
    {
      id: 1,
      name: "Premium Auto Group",
      location: "Los Angeles, CA",
      rating: 4.8,
      verified: true,
      specialties: ["Luxury", "Sports Cars"],
      image: "https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=400"
    },
    {
      id: 2,
      name: "City Motors",
      location: "San Francisco, CA",
      rating: 4.6,
      verified: true,
      specialties: ["Family Cars", "Electric"],
      image: "https://images.pexels.com/photos/1149137/pexels-photo-1149137.jpeg?auto=compress&cs=tinysrgb&w=400"
    }
  ];

  const popularSearches = [
    "Toyota Camry under $25,000",
    "BMW 3 Series in California",
    "Electric vehicles near me",
    "SUVs with low mileage",
    "Certified pre-owned luxury cars"
  ];

  const marketplaceStats = [
    { icon: <Car color={currentColors.primary} size={24} />, value: "10,000+", label: "Cars Available" },
    { icon: <Users color={currentColors.success} size={24} />, value: "500+", label: "Verified Dealers" },
    { icon: <Shield color={currentColors.accentGreen} size={24} />, value: "100%", label: "Verified Listings" },
  ];

  const SearchSuggestionCard = ({ suggestion }: { suggestion: string }) => (
    <TouchableOpacity style={styles.suggestionCard}>
      <Search color={currentColors.textSecondary} size={16} />
      <Text style={styles.suggestionText}>{suggestion}</Text>
    </TouchableOpacity>
  );

  // Updated DealerCard to use the new Card component and styles
  const DealerCard = ({ dealer }: { dealer: any }) => (
    <Card style={styles.dealerCard} onPress={() => console.log("Dealer pressed:", dealer.id)}>
      <OptimizedImage source={{ uri: dealer.image }} style={styles.dealerImage} />
      <View style={styles.dealerContent}>
        <View style={styles.dealerHeader}>
          <Text style={styles.dealerName}>{dealer.name}</Text>
          {dealer.verified && (
            <View style={styles.verifiedBadge}>
              <Shield color={currentColors.white} size={12} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
        <View style={styles.dealerLocation}>
          <MapPin color={currentColors.textSecondary} size={14} />
          <Text style={styles.dealerLocationText}>{dealer.location}</Text>
        </View>
        <View style={styles.dealerRating}>
          <Star color={currentColors.accentGreen} size={14} fill={currentColors.accentGreen} />
          <Text style={styles.dealerRatingText}>{dealer.rating}</Text>
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
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Marketplace</Text>
          <Text style={styles.subtitle}>Find cars from verified dealers</Text>
        </View>

        {/* Search Section */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search cars, dealers, locations..."
          onClear={() => setSearchQuery('')}
          containerStyle={styles.searchBarContainer}
        />
        {/* Filter button can be added here or as part of SearchBar if enhanced */}
        {/* <TouchableOpacity style={styles.filterButton}>
          <Filter color={currentColors.primary} size={20} />
        </TouchableOpacity> */}


        {/* Coming Soon Notice */}
        <ComingSoon
          title="Marketplace Coming Soon!"
          message="We're building an amazing marketplace experience with verified dealers and comprehensive car listings. Stay tuned for the launch!"
          icon={<TrendingUp color={currentColors.primary} size={32} />}
        />

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
                // iconBackgroundColor is not needed here as the icons already have colors
                // The new StatCard is also slightly larger by default due to Shadows.medium
                // and h2 for value, which is fine.
              />
            ))}
          </View>
        </View>

        {/* Featured Dealers Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Dealers (Preview)</Text>
          <Text style={styles.sectionSubtitle}>
            These are examples of the verified dealers that will be available
          </Text>
          {featuredDealers.map((dealer) => (
            <DealerCard key={dealer.id} dealer={dealer} />
          ))}
        </View>

        {/* Popular Searches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Searches</Text>
          <Text style={styles.sectionSubtitle}>
            Examples of what users will be able to search for
          </Text>
          {popularSearches.map((suggestion, index) => (
            <SearchSuggestionCard key={index} suggestion={suggestion} />
          ))}
        </View>

        {/* Features Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Features</Text>
          
          <View style={styles.featureCard}>
            <Shield color={currentColors.success} size={24} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Verified Dealers Only</Text>
              <Text style={styles.featureDescription}>
                All dealers go through a rigorous verification process
              </Text>
            </View>
          </View>
          
          <View style={styles.featureCard}>
            <DollarSign color={currentColors.primary} size={24} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Transparent Pricing</Text>
              <Text style={styles.featureDescription}>
                No hidden fees, clear pricing information for every listing
              </Text>
            </View>
          </View>
          
          <View style={styles.featureCard}>
            <Car color={currentColors.accentGreen} size={24} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Detailed Vehicle History</Text>
              <Text style={styles.featureDescription}>
                Complete vehicle history reports and inspection details
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: currentColors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: Spacing.xxl, // Ensure space at the bottom
  },
  header: { // This is a custom header for this specific screen, not the nav header
    padding: Spacing.lg,
    backgroundColor: currentColors.white, // White background for header area
    borderBottomWidth: 1,
    borderBottomColor: currentColors.border,
    alignItems: 'center', // Center title and subtitle
  },
  title: {
    ...Typography.pageTitle, // Use new Page Title style
    color: currentColors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyLarge, // Use new Body Large style
    color: currentColors.textSecondary,
  },
  searchBarContainer: { // Container for the SearchBar component
    paddingHorizontal: Spacing.lg, // Match screen padding
    paddingVertical: Spacing.md,
    backgroundColor: currentColors.white, // Match header background
    // borderBottomWidth: 1, // Optional: if a separator is desired below search
    // borderBottomColor: currentColors.border,
  },
  // Old searchSection, searchBar, searchInput, filterButton styles removed

  statsSection: { // Section containing StatCards
    paddingHorizontal: Spacing.lg, // Match screen padding
    paddingVertical: Spacing.xl, // More vertical space for this section
    backgroundColor: currentColors.background, // Ensure it matches screen bg
  },
  sectionTitle: { // Common style for all section titles
    ...Typography.sectionTitle,
    color: currentColors.text,
    marginBottom: Spacing.lg, // Increased margin for section titles
  },
  sectionSubtitle: { // Common style for section subtitles
    ...Typography.bodyText,
    color: currentColors.textSecondary,
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md, // 16px gap between stat cards
  },
  section: { // General section styling
    paddingHorizontal: Spacing.lg, // 20px horizontal padding
    paddingVertical: Spacing.xl,   // 32px vertical spacing between sections
    // Removed Spacing.lg from here to apply it directly to paddingHorizontal/Vertical
  },
  dealerCard: { // Styles for the Card component when used as a DealerCard
    // The Card component itself handles background, border, radius, shadow.
    // We just add margin here.
    marginBottom: Spacing.md,
    // padding: 0, // Let Card handle its default padding or override if needed
  },
  dealerImage: {
    width: '100%',
    height: 150, // Slightly larger image
    borderTopLeftRadius: BorderRadius.lg, // Match card's radius
    borderTopRightRadius: BorderRadius.lg,
    backgroundColor: currentColors.surfaceDark,
  },
  dealerContent: {
    padding: Spacing.md, // Consistent padding within the card
  },
  dealerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dealerName: {
    ...Typography.cardTitle, // Use Card Title style
    color: currentColors.text,
    flex: 1,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: currentColors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  verifiedText: {
    ...Typography.caption,
    color: currentColors.white,
    fontWeight: '600',
  },
  dealerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs, // Reduced margin
    gap: Spacing.xs,
  },
  dealerLocationText: {
    ...Typography.bodySmall,
    color: currentColors.textSecondary,
  },
  dealerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm, // Reduced margin
    gap: Spacing.xs,
  },
  dealerRatingText: {
    ...Typography.bodySmall,
    color: currentColors.text,
    fontWeight: '600',
  },
  dealerSpecialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  specialtyTag: {
    backgroundColor: currentColors.primaryLight, // Use primaryLight from new palette
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm, // Small radius for tags
  },
  specialtyText: {
    ...Typography.caption,
    color: currentColors.primary, // Text color matches primary for emphasis
    fontWeight: '500',
  },
  suggestionCard: { // Style for "Popular Searches" items
    // This can also use the Card component for consistency
    backgroundColor: currentColors.cardBackground,
    padding: Spacing.md,
    borderRadius: BorderRadius.md, // Standard medium radius
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    ...ColorsShadows.card, // Use new card shadow
  },
  suggestionText: {
    ...Typography.bodyText, // Use standard body text
    color: currentColors.text,
    flex: 1,
    marginLeft: Spacing.sm, // Add spacing between icon and text
  },
  featureCard: { // For "Upcoming Features" items, use the Card component
    // Card component handles most styling. Add margin here.
    flexDirection: 'row', // Icon and text side-by-side
    alignItems: 'flex-start',
    backgroundColor: currentColors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...ColorsShadows.small,
  },
  featureCardContent: { // Renamed from featureContent for clarity
    flexDirection: 'row', // Icon and text side-by-side
    alignItems: 'flex-start',
    padding: Spacing.md, // Padding inside the card (Card default is Spacing.md)
  },
  featureIconContainer: { // Container for the icon
    marginRight: Spacing.md,
    paddingTop: Spacing.xs, // Align icon better with text
  },
  featureTextContainer: { // Container for title and description
    flex: 1,
  },
  featureTitle: {
    ...Typography.cardTitle, // Use Card Title
    color: currentColors.text,
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    ...Typography.bodySmall,
    color: currentColors.textSecondary,
    lineHeight: Typography.bodySmall.lineHeight, // Use from Typography
  },
  featureContent: { // Add the missing style
    flex: 1,
    marginLeft: Spacing.md,
  },
});