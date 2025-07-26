import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Star,
  Clock,
  Car,
  Shield,
  ExternalLink,
} from '@/utils/ultra-optimized-icons';
import { useThemeColors } from '@/hooks/useTheme';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Button } from '@/components/ui/Button';
import { BorderRadius, Spacing, Typography, Shadows } from '@/constants/Colors';

// Real dealer interface (replacing mock data)
interface Dealer {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  website?: string;
  logoUrl?: string;
  rating: number;
  reviewCount: number;
  verified: boolean;
  businessHours: {
    [key: string]: { open: string; close: string; isOpen: boolean };
  };
  inventory: {
    totalCars: number;
    newCars: number;
    usedCars: number;
  };
  certifications: string[];
  description: string;
}

// Real dealer service (replacing TODO comments)
class DealerService {
  static async getDealerById(dealerId: string): Promise<Dealer> {
    try {
      // Replace with real API call
      const response = await fetch(`/api/dealers/${dealerId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch dealer details');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching dealer:', error);
      throw error;
    }
  }

  static async getDealerCars(dealerId: string, limit = 10) {
    try {
      const response = await fetch(
        `/api/dealers/${dealerId}/inventory?limit=${limit}`,
      );
      if (!response.ok) {
        throw new Error('Failed to fetch dealer inventory');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching dealer inventory:', error);
      throw error;
    }
  }
}

export default function DealerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useThemeColors();
  const styles = getThemedStyles(colors);

  const [dealer, setDealer] = useState<Dealer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDealerDetails();
  }, [id]);

  const loadDealerDetails = async () => {
    if (!id) {
      setError('Dealer ID not provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const dealerData = await DealerService.getDealerById(id);
      setDealer(dealerData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load dealer details',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleCallDealer = async () => {
    if (!dealer?.phone) return;

    const phoneUrl = `tel:${dealer.phone.replace(/[^0-9]/g, '')}`;
    const canOpen = await Linking.canOpenURL(phoneUrl);

    if (canOpen) {
      await Linking.openURL(phoneUrl);
    } else {
      Alert.alert('Error', 'Unable to make phone call');
    }
  };

  const handleEmailDealer = async () => {
    if (!dealer?.email) return;

    const emailUrl = `mailto:${dealer.email}`;
    const canOpen = await Linking.canOpenURL(emailUrl);

    if (canOpen) {
      await Linking.openURL(emailUrl);
    } else {
      Alert.alert('Error', 'Unable to open email client');
    }
  };

  const handleVisitWebsite = async () => {
    if (!dealer?.website) return;

    const canOpen = await Linking.canOpenURL(dealer.website);

    if (canOpen) {
      await Linking.openURL(dealer.website);
    } else {
      Alert.alert('Error', 'Unable to open website');
    }
  };

  const handleViewInventory = () => {
    router.push(`/dealer/${id}/inventory`);
  };

  const handleViewReviews = () => {
    router.push(`/dealer/${id}/reviews`);
  };

  const formatRating = (rating: number): string => {
    return rating.toFixed(1);
  };

  const getCurrentDayHours = () => {
    if (!dealer?.businessHours) return null;

    const days = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];
    const currentDay = days[new Date().getDay()];

    return dealer.businessHours[currentDay];
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
        </View>
        <LoadingSpinner size="large" />
      </SafeAreaView>
    );
  }

  if (error || !dealer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
        </View>
        <ErrorState
          title="Unable to Load Dealer"
          message={error || 'Dealer not found'}
          onRetry={loadDealerDetails}
        />
      </SafeAreaView>
    );
  }

  const currentHours = getCurrentDayHours();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Dealer Details
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Dealer Header */}
        <View style={styles.dealerHeader}>
          {dealer.logoUrl && (
            <OptimizedImage
              source={{ uri: dealer.logoUrl }}
              style={styles.dealerLogo}
            />
          )}

          <View style={styles.dealerInfo}>
            <View style={styles.dealerTitleRow}>
              <Text style={[styles.dealerName, { color: colors.text }]}>
                {dealer.name}
              </Text>
              {dealer.verified && <Shield size={20} color={colors.primary} />}
            </View>

            <View style={styles.ratingRow}>
              <Star size={16} color="#FFB800" />
              <Text style={[styles.rating, { color: colors.text }]}>
                {formatRating(dealer.rating)}
              </Text>
              <Text
                style={[styles.reviewCount, { color: colors.textSecondary }]}
              >
                ({dealer.reviewCount} reviews)
              </Text>
            </View>

            {currentHours && (
              <View style={styles.hoursRow}>
                <Clock
                  size={16}
                  color={currentHours.isOpen ? '#10B981' : '#EF4444'}
                />
                <Text
                  style={[
                    styles.hoursText,
                    {
                      color: currentHours.isOpen ? '#10B981' : '#EF4444',
                    },
                  ]}
                >
                  {currentHours.isOpen ? 'Open' : 'Closed'} •{' '}
                  {currentHours.open} - {currentHours.close}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Contact Actions */}
        <View style={styles.contactSection}>
          <Button
            title="Call Dealer"
            onPress={handleCallDealer}
            variant="primary"
            icon={<Phone size={20} color="white" />}
            style={styles.contactButton}
          />

          <Button
            title="Email Dealer"
            onPress={handleEmailDealer}
            variant="outline"
            icon={<Mail size={20} color={colors.primary} />}
            style={styles.contactButton}
          />
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Location
          </Text>
          <View style={styles.locationCard}>
            <MapPin size={20} color={colors.textSecondary} />
            <View style={styles.locationInfo}>
              <Text style={[styles.address, { color: colors.text }]}>
                {dealer.address}
              </Text>
              <Text style={[styles.cityState, { color: colors.textSecondary }]}>
                {dealer.city}, {dealer.state} {dealer.zipCode}
              </Text>
            </View>
          </View>
        </View>

        {/* Inventory Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Inventory
          </Text>
          <View style={styles.inventoryRow}>
            <View style={styles.inventoryItem}>
              <Text style={[styles.inventoryNumber, { color: colors.primary }]}>
                {dealer.inventory.totalCars}
              </Text>
              <Text
                style={[styles.inventoryLabel, { color: colors.textSecondary }]}
              >
                Total Cars
              </Text>
            </View>

            <View style={styles.inventoryItem}>
              <Text style={[styles.inventoryNumber, { color: colors.primary }]}>
                {dealer.inventory.newCars}
              </Text>
              <Text
                style={[styles.inventoryLabel, { color: colors.textSecondary }]}
              >
                New Cars
              </Text>
            </View>

            <View style={styles.inventoryItem}>
              <Text style={[styles.inventoryNumber, { color: colors.primary }]}>
                {dealer.inventory.usedCars}
              </Text>
              <Text
                style={[styles.inventoryLabel, { color: colors.textSecondary }]}
              >
                Used Cars
              </Text>
            </View>
          </View>

          <Button
            title="View Full Inventory"
            onPress={handleViewInventory}
            variant="outline"
            icon={<Car size={20} color={colors.primary} />}
            style={styles.fullWidthButton}
          />
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            About
          </Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {dealer.description}
          </Text>
        </View>

        {/* Certifications */}
        {dealer.certifications.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Certifications
            </Text>
            <View style={styles.certificationsRow}>
              {dealer.certifications.map((cert, index) => (
                <View key={index} style={styles.certificationBadge}>
                  <Text
                    style={[
                      styles.certificationText,
                      { color: colors.primary },
                    ]}
                  >
                    {cert}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <Button
            title="View Reviews"
            onPress={handleViewReviews}
            variant="outline"
            icon={<Star size={20} color={colors.primary} />}
            style={styles.fullWidthButton}
          />

          {dealer.website && (
            <Button
              title="Visit Website"
              onPress={handleVisitWebsite}
              variant="outline"
              icon={<ExternalLink size={20} color={colors.primary} />}
              style={styles.websiteButton}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getThemedStyles = (colors: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: Spacing.sm,
      marginLeft: -Spacing.sm,
    },
    headerTitle: {
      ...Typography.sectionTitle,
      fontWeight: '600',
    },
    headerRight: {
      width: 40,
    },
    content: {
      flex: 1,
    },
    dealerHeader: {
      flexDirection: 'row',
      padding: Spacing.lg,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    dealerLogo: {
      width: 80,
      height: 80,
      borderRadius: BorderRadius.md,
      marginRight: Spacing.md,
    },
    dealerInfo: {
      flex: 1,
    },
    dealerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    dealerName: {
      ...Typography.sectionTitle,
      fontWeight: '700',
      marginRight: Spacing.sm,
      flex: 1,
    },
    ratingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.xs,
    },
    rating: {
      ...Typography.bodyText,
      fontWeight: '600',
      marginLeft: 4,
      marginRight: Spacing.xs,
    },
    reviewCount: {
      ...Typography.caption,
    },
    hoursRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    hoursText: {
      ...Typography.bodySmall,
      fontWeight: '500',
      marginLeft: 4,
    },
    contactSection: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      gap: Spacing.sm,
    },
    contactButton: {
      flex: 1,
    },
    section: {
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionTitle: {
      ...Typography.sectionTitle,
      fontWeight: '600',
      marginBottom: Spacing.md,
    },
    locationCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: Spacing.md,
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.md,
      ...Shadows.small,
    },
    locationInfo: {
      marginLeft: Spacing.sm,
      flex: 1,
    },
    address: {
      ...Typography.bodyText,
      fontWeight: '500',
      marginBottom: 2,
    },
    cityState: {
      ...Typography.bodySmall,
    },
    inventoryRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: Spacing.lg,
    },
    inventoryItem: {
      alignItems: 'center',
    },
    inventoryNumber: {
      ...Typography.sectionTitle,
      fontWeight: '700',
      marginBottom: 4,
    },
    inventoryLabel: {
      ...Typography.caption,
      textAlign: 'center',
    },
    description: {
      ...Typography.bodyText,
      lineHeight: 24,
    },
    certificationsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Spacing.sm,
    },
    certificationBadge: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      backgroundColor: colors.primaryLight,
      borderRadius: BorderRadius.sm,
    },
    certificationText: {
      ...Typography.caption,
      fontWeight: '600',
    },
    fullWidthButton: {
      width: '100%',
    },
    websiteButton: {
      width: '100%',
      marginTop: Spacing.sm,
    },
  });
};
