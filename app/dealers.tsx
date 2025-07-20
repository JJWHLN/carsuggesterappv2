import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchBar } from '@/components/ui/SearchBar';
import { Card } from '@/components/ui/Card';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import { useDebounce } from '@/hooks/useDebounce';
import { sanitizeSearchQuery } from '@/utils/dataTransformers';
import { MapPin, Star, Users, Car, Clock, Mail, Building2, Award, Filter, Search } from '@/utils/ultra-optimized-icons';

interface Dealer {
  id: number;
  name: string;
  location: string;
  address: string;
  rating: number;
  verified: boolean;
  specialties: string[];
  image: string;
  inventory: number;
  yearsInBusiness: number;
  phone: string;
  email: string;
  description: string;
  certifications: string[];
}

export default function DealersScreen() {
  const { colors } = useThemeColors();
  const styles = useMemo(() => getThemedStyles(colors), [colors]);

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Mock data for dealers
  const dealers: Dealer[] = [
    {
      id: 1,
      name: "Premium Auto Group",
      location: "Los Angeles, CA",
      address: "1234 Sunset Blvd, Los Angeles, CA 90028",
      rating: 4.8,
      verified: true,
      specialties: ["Luxury", "Sports Cars", "Electric"],
      image: "https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=400",
      inventory: 45,
      yearsInBusiness: 15,
      phone: "(555) 123-4567",
      email: "contact@premiumauto.com",
      description: "Specializing in luxury and sports vehicles with over 15 years of experience.",
      certifications: ["ASE Certified", "BBB A+ Rating", "Certified Pre-Owned"]
    },
    {
      id: 2,
      name: "City Motors",
      location: "San Francisco, CA",
      address: "5678 Market St, San Francisco, CA 94102",
      rating: 4.6,
      verified: true,
      specialties: ["Family Cars", "Electric", "Hybrid"],
      image: "https://images.pexels.com/photos/1149137/pexels-photo-1149137.jpeg?auto=compress&cs=tinysrgb&w=400",
      inventory: 32,
      yearsInBusiness: 8,
      phone: "(555) 987-6543",
      email: "info@citymotors.com",
      description: "Your trusted partner for reliable family vehicles and eco-friendly options.",
      certifications: ["Green Business Certified", "ASE Certified"]
    },
    {
      id: 3,
      name: "Electric Future Motors",
      location: "Austin, TX",
      address: "9012 South Lamar, Austin, TX 78704",
      rating: 4.9,
      verified: true,
      specialties: ["Electric", "Hybrid", "Eco-Friendly", "Tesla"],
      image: "https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=400",
      inventory: 28,
      yearsInBusiness: 5,
      phone: "(555) 456-7890",
      email: "hello@electricfuture.com",
      description: "Leading the charge in electric vehicle sales and service.",
      certifications: ["Tesla Certified", "EV Specialist"]
    }
  ];

  const dealerStats = [
    { icon: <Building2 color={colors.primary} size={24} />, value: "250+", label: "Verified Dealers" },
    { icon: <Car color={colors.success} size={24} />, value: "15,000+", label: "Cars Available" },
    { icon: <Award color={colors.accentGreen} size={24} />, value: "4.7", label: "Avg Rating" },
  ];

  const handleDealerPress = useCallback((dealerId: number) => {
    logger.debug('Navigate to dealer:', dealerId);
    // TODO: Create dealer detail route
    // router.push(`/dealer/${dealerId}`);
  }, []);

  const DealerCard = useCallback(({ dealer }: { dealer: Dealer }) => (
    <Card style={styles.dealerCard} onPress={() => handleDealerPress(dealer.id)}>
      <OptimizedImage source={{ uri: dealer.image }} style={styles.dealerImage} />
      <View style={styles.dealerContent}>
        <View style={styles.dealerHeader}>
          <View style={styles.dealerTitleContainer}>
            <Text style={styles.dealerName}>{dealer.name}</Text>
            {dealer.verified && (
              <View style={styles.verifiedBadge}>
                <Shield color={colors.white} size={12} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
          <View style={styles.ratingContainer}>
            <Star color={colors.warning} size={16} fill={colors.warning} />
            <Text style={styles.ratingText}>{dealer.rating}</Text>
          </View>
        </View>

        <Text style={styles.dealerDescription} numberOfLines={2}>
          {dealer.description}
        </Text>

        <View style={styles.dealerDetails}>
          <View style={styles.dealerDetailRow}>
            <MapPin color={colors.textSecondary} size={14} />
            <Text style={styles.dealerLocationText}>{dealer.location}</Text>
          </View>
          
          <View style={styles.dealerDetailRow}>
            <Car color={colors.textSecondary} size={14} />
            <Text style={styles.dealerDetailText}>{dealer.inventory} cars available</Text>
          </View>
          
          <View style={styles.dealerDetailRow}>
            <Clock color={colors.textSecondary} size={14} />
            <Text style={styles.dealerDetailText}>{dealer.yearsInBusiness} years in business</Text>
          </View>
        </View>

        <View style={styles.dealerSpecialties}>
          {dealer.specialties.slice(0, 3).map((specialty, index) => (
            <View key={index} style={styles.specialtyTag}>
              <Text style={styles.specialtyText}>{specialty}</Text>
            </View>
          ))}
          {dealer.specialties.length > 3 && (
            <Text style={styles.moreSpecialties}>+{dealer.specialties.length - 3}</Text>
          )}
        </View>

        <View style={styles.dealerActions}>
          <Button
            title="View Inventory"
            onPress={() => handleDealerPress(dealer.id)}
            variant="outline"
            style={styles.actionButton}
          />
          <TouchableOpacity style={styles.contactButton}>
            <Phone color={colors.primary} size={16} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  ), [colors, styles, handleDealerPress]);

  const renderDealer: ListRenderItem<Dealer> = useCallback(({ item }) => (
    <DealerCard dealer={item} />
  ), [DealerCard]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={32} />
          <Text style={styles.loadingText}>Loading dealers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Car Dealers</Text>
        <Text style={styles.subtitle}>
          {dealers.length} verified dealers near you
        </Text>
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search dealers, locations..."
        onClear={() => setSearchQuery('')}
        containerStyle={styles.searchBarContainer}
      />

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Dealer Network</Text>
        <View style={styles.statsGrid}>
          {dealerStats.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
            />
          ))}
        </View>
      </View>

      <FlatList
        data={dealers}
        renderItem={renderDealer}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title="No dealers found"
            subtitle="Try adjusting your search criteria"
            icon={<Building2 color={colors.textSecondary} size={48} />}
          />
        }
      />
    </SafeAreaView>
  );
}

const getThemedStyles = (colors: typeof import('@/constants/Colors').Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    ...Typography.h1,
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  searchBarContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: colors.background,
  },
  statsSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    ...Typography.h2,
    color: colors.text,
    marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xxl,
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
  dealerTitleContainer: {
    flex: 1,
    marginRight: Spacing.md,
  },
  dealerName: {
    ...Typography.h3,
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    ...Typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ratingText: {
    ...Typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  dealerDescription: {
    ...Typography.body,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
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
  dealerDetailText: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
  },
  dealerSpecialties: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
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
  moreSpecialties: {
    ...Typography.caption,
    color: colors.textSecondary,
    alignSelf: 'center',
  },
  dealerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  contactButton: {
    backgroundColor: colors.primaryLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
