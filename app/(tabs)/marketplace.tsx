import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
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
  Phone,
  Mail,
  ExternalLink,
  Grid2x2,
  List,
} from 'lucide-react-native';
import { StatCard } from '@/components/ui/StatCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { Card } from '@/components/ui/Card';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Button } from '@/components/ui/Button';
import { Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');

export default function MarketplaceScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => getThemedStyles(colors), [colors]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock marketplace data
  const featuredListings = [
    {
      id: 1,
      title: "2023 BMW X5 xDrive40i",
      price: 65900,
      originalPrice: 72000,
      mileage: 12500,
      location: "Los Angeles, CA",
      images: ["https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=400"],
      dealer: "Premium BMW",
      verified: true,
      rating: 4.8,
      features: ["Leather", "Navigation", "AWD"],
      condition: "Excellent",
      fuelType: "Gasoline",
      transmission: "Automatic",
      isFeatured: true,
    },
    {
      id: 2,
      title: "2024 Tesla Model 3 Long Range",
      price: 47240,
      mileage: 2100,
      location: "San Francisco, CA",
      images: ["https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=400"],
      dealer: "Tesla Direct",
      verified: true,
      rating: 4.9,
      features: ["Autopilot", "Premium Interior", "Supercharging"],
      condition: "Like New",
      fuelType: "Electric",
      transmission: "Single Speed",
      isFeatured: true,
    },
    {
      id: 3,
      title: "2022 Toyota Camry Hybrid LE",
      price: 28500,
      mileage: 18000,
      location: "Austin, TX",
      images: ["https://images.pexels.com/photos/1149137/pexels-photo-1149137.jpeg?auto=compress&cs=tinysrgb&w=400"],
      dealer: "City Toyota",
      verified: true,
      rating: 4.7,
      features: ["Hybrid", "Safety Sense", "Bluetooth"],
      condition: "Excellent",
      fuelType: "Hybrid",
      transmission: "CVT",
      isFeatured: false,
    },
    {
      id: 4,
      title: "2023 Mercedes-Benz C-Class C300",
      price: 52900,
      mileage: 8500,
      location: "Miami, FL",
      images: ["https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=400"],
      dealer: "Luxury Motors",
      verified: true,
      rating: 4.6,
      features: ["Premium Package", "AMG Line", "Panoramic Roof"],
      condition: "Excellent",
      fuelType: "Gasoline",
      transmission: "Automatic",
      isFeatured: true,
    },
  ];

  const categories = [
    { id: 'all', name: 'All Cars', count: 1247 },
    { id: 'luxury', name: 'Luxury', count: 156 },
    { id: 'electric', name: 'Electric', count: 89 },
    { id: 'suv', name: 'SUV', count: 234 },
    { id: 'sedan', name: 'Sedan', count: 345 },
    { id: 'truck', name: 'Truck', count: 123 },
  ];

  const marketplaceStats = [
    { icon: <Car color={colors.primary} size={24} />, value: "1,247", label: "Cars Available" },
    { icon: <Users color={colors.success} size={24} />, value: "89", label: "Verified Dealers" },
    { icon: <Shield color={colors.accentGreen} size={24} />, value: "100%", label: "Verified Listings" },
  ];

  const CarListingCard = useCallback(({ listing, isListView = false }: { listing: any, isListView?: boolean }) => (
    <TouchableOpacity 
      style={[styles.listingCard, isListView && styles.listingCardList]}
      activeOpacity={0.9}
    >
      <View style={[styles.listingImageContainer, isListView && styles.listingImageContainerList]}>
        <OptimizedImage 
          source={{ uri: listing.images[0] }} 
          style={styles.listingImage} 
        />
        
        {listing.isFeatured && (
          <View style={styles.featuredBadge}>
            <Star color={colors.white} size={12} fill={colors.white} />
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
        
        {listing.originalPrice && (
          <View style={styles.savingsBadge}>
            <Text style={styles.savingsText}>
              Save ${(listing.originalPrice - listing.price).toLocaleString()}
            </Text>
          </View>
        )}
      </View>
      
      <View style={[styles.listingContent, isListView && styles.listingContentList]}>
        <View style={styles.listingHeader}>
          <Text style={styles.listingPrice}>${listing.price.toLocaleString()}</Text>
          {listing.originalPrice && (
            <Text style={styles.originalPrice}>${listing.originalPrice.toLocaleString()}</Text>
          )}
        </View>
        
        <Text style={styles.listingTitle} numberOfLines={2}>{listing.title}</Text>
        
        <View style={styles.listingSpecs}>
          <View style={styles.specBadge}>
            <Text style={styles.specText}>{listing.mileage.toLocaleString()} mi</Text>
          </View>
          <View style={styles.specBadge}>
            <Text style={styles.specText}>{listing.fuelType}</Text>
          </View>
          <View style={styles.specBadge}>
            <Text style={styles.specText}>{listing.condition}</Text>
          </View>
        </View>
        
        <View style={styles.dealerInfo}>
          <View style={styles.dealerLeft}>
            <Text style={styles.dealerName}>{listing.dealer}</Text>
            {listing.verified && (
              <View style={styles.verifiedBadge}>
                <Shield color={colors.success} size={10} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
          <View style={styles.ratingContainer}>
            <Star color={colors.warning} size={12} fill={colors.warning} />
            <Text style={styles.ratingText}>{listing.rating}</Text>
          </View>
        </View>
        
        <View style={styles.listingLocation}>
          <MapPin color={colors.textSecondary} size={14} />
          <Text style={styles.locationText}>{listing.location}</Text>
        </View>
        
        {isListView && (
          <View style={styles.listingActions}>
            <Button
              title="Contact Dealer"
              onPress={() => {}}
              variant="outline"
              style={styles.contactButton}
            />
            <TouchableOpacity style={styles.phoneButton}>
              <Phone color={colors.primary} size={16} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  ), [colors, styles]);

  const renderListing = ({ item }: { item: any }) => (
    <View style={viewMode === 'grid' ? styles.gridItem : styles.listItem}>
      <CarListingCard listing={item} isListView={viewMode === 'list'} />
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroTitle}>Car Marketplace</Text>
        <Text style={styles.heroSubtitle}>
          Find your perfect car from verified dealers nationwide
        </Text>
        
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by make, model, or location..."
          onClear={() => setSearchQuery('')}
          containerStyle={styles.heroSearchBar}
        />
      </View>

      {/* Stats */}
      <View style={styles.statsSection}>
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

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.leftControls}>
          <TouchableOpacity style={styles.filterButton}>
            <Filter color={colors.primary} size={18} />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.sortButton}>
            <Text style={styles.sortButtonText}>Price: Low to High</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
            onPress={() => setViewMode('grid')}
          >
            <Grid2x2 color={viewMode === 'grid' ? colors.white : colors.textSecondary} size={16} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <List color={viewMode === 'list' ? colors.white : colors.textSecondary} size={16} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.id && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === item.id && styles.categoryTextActive
              ]}>
                {item.name} ({item.count})
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoriesContent}
        />
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {featuredListings.length} cars found
        </Text>
        <Text style={styles.resultsLocation}>in your area</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={featuredListings}
        renderItem={renderListing}
        keyExtractor={(item) => item.id.toString()}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={viewMode === 'grid' ? styles.columnWrapper : undefined}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const getThemedStyles = (colors: typeof import('@/constants/Colors').Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Header
  headerContainer: {
    backgroundColor: colors.background,
    paddingBottom: Spacing.md,
  },
  heroSection: {
    backgroundColor: colors.surface,
    padding: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  heroTitle: {
    ...Typography.h1,
    color: colors.text,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    ...Typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  heroSearchBar: {
    marginHorizontal: 0,
  },
  
  // Stats
  statsSection: {
    padding: Spacing.lg,
    backgroundColor: colors.background,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  
  // Controls
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftControls: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: Spacing.xs,
  },
  filterButtonText: {
    ...Typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  sortButton: {
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortButtonText: {
    ...Typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  viewButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  viewButtonActive: {
    backgroundColor: colors.primary,
  },
  
  // Categories
  categoriesContainer: {
    paddingVertical: Spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.lg,
  },
  categoryChip: {
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: Spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    ...Typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  
  // Results
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: colors.background,
    gap: Spacing.xs,
  },
  resultsCount: {
    ...Typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  resultsLocation: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  
  // List
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  gridItem: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    marginBottom: Spacing.lg,
  },
  listItem: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  
  // Listing Cards
  listingCard: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...ColorsShadows.card,
  },
  listingCardList: {
    flexDirection: 'row',
    height: 160,
  },
  listingImageContainer: {
    position: 'relative',
    height: 140,
  },
  listingImageContainerList: {
    width: 140,
    height: '100%',
  },
  listingImage: {
    width: '100%',
    height: '100%',
  },
  featuredBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  featuredText: {
    ...Typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 10,
  },
  savingsBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: colors.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  savingsText: {
    ...Typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 10,
  },
  listingContent: {
    padding: Spacing.md,
  },
  listingContentList: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  listingPrice: {
    ...Typography.h3,
    color: colors.primary,
    fontWeight: '700',
  },
  originalPrice: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  listingTitle: {
    ...Typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  listingSpecs: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },
  specBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  specText: {
    ...Typography.caption,
    color: colors.primary,
    fontSize: 10,
    fontWeight: '500',
  },
  dealerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dealerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dealerName: {
    ...Typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 1,
    borderRadius: BorderRadius.xs,
    gap: 2,
  },
  verifiedText: {
    ...Typography.caption,
    color: colors.white,
    fontSize: 9,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    ...Typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  listingLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  locationText: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  listingActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  contactButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
  },
  phoneButton: {
    backgroundColor: colors.primaryLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
});