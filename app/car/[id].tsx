import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  Platform, // Import Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useNavigation } from 'expo-router'; // Import useNavigation
import { 
  ArrowLeft, 
  Heart, 
  Share, 
  MapPin, 
  Calendar, 
  Fuel, 
  Settings,
  Star,
  Phone,
  Mail
} from 'lucide-react-native';
// import { AnimatedPressable } from '@/components/ui/AnimatedPressable'; // Not directly used, Button handles press animations
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { currentColors, Spacing, Typography, BorderRadius } from '@/constants/Colors';
import {
  formatPrice,
  formatMileage,
  formatCondition,
  formatFuelType,
  transformDatabaseVehicleListingToCar // Import the transformer
} from '@/utils/dataTransformers';
import { fetchVehicleListingById, SupabaseError } from '@/services/supabaseService'; // Import fetch function
import { useApi } from '@/hooks/useApi'; // Using useApi for consistency, though supabaseService has its own error handling
import { Car as CarType, DatabaseVehicleListing } from '@/types/database'; // Import Car type

const { width } = Dimensions.get('window');

export default function CarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isSaved, setIsSaved] = useState(false);
  const navigation = useNavigation(); // Get navigation object

  // Fetch car data using useApi and the new service function
  const {
    data: rawCarData,
    loading,
    error,
    refetch
  } = useApi<DatabaseVehicleListing | null>(
    async () => {
      if (!id) return null;
      try {
        return await fetchVehicleListingById(id);
      } catch (e) {
        if (e instanceof SupabaseError) {
          // Re-throw to let useApi handle it, or customize message here
          throw new Error(e.message); // useApi expects Error instance
        }
        throw e; // Re-throw other errors
      }
    },
    [id] // Dependencies for useApi
  );

  // Transform data once fetched
  const car: CarType | null = rawCarData ? transformDatabaseVehicleListingToCar(rawCarData) : null;

  // const handleBack = () => { // No longer needed
  //   router.back();
  // };

  const handleSave = useCallback(() => {
    setIsSaved(!isSaved);
    // Add actual save logic here
    console.log('Save toggled for car:', id, !isSaved);
  }, [isSaved, id]);

  const handleShare = useCallback(() => {
    // Implement share functionality using React Native's Share API
    console.log('Share car:', id);
    // Example: Share.share({ message: `Check out this car: ${car?.year} ${car?.make} ${car?.model}` });
  }, [id]);

  useEffect(() => {
    // Set header options dynamically
    navigation.setOptions({
      // title: car ? `${car.year} ${car.make} ${car.model}` : 'Car Details', // Or keep static title from _layout.tsx
      headerRight: () => (
        <View style={styles.headerActionsContainer}>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.headerActionButton}
            accessibilityRole="button"
            accessibilityLabel="Share this car"
          >
            <Share color={currentColors.primary} size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.headerActionButton}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? "Unsave this car" : "Save this car"}
            accessibilityState={{ selected: isSaved }}
          >
            <Heart
              color={isSaved ? currentColors.error : currentColors.primary}
              fill={isSaved ? currentColors.error : 'transparent'}
              size={24}
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, car, isSaved, handleSave, handleShare]);


  const handleContact = () => {
    // Implement contact dealer functionality
    console.log('Contact dealer for car:', id);
  };

  if (loading) {
    // The native header from _layout will be shown during loading.
    // We could hide it or show a placeholder title if needed via navigation.setOptions in a separate useEffect.
    return (
      <SafeAreaView style={styles.container}>
        {/* Optional: Minimal custom header for loading state if native header is too abrupt */}
        {/* <View style={styles.loadingHeaderPlaceholder} /> */}
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={32} />
          <Text style={styles.loadingText}>Loading car details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !car) {
    // Native header will be shown. ErrorState component handles the body.
    return (
      <SafeAreaView style={styles.container}>
        {/* <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft color={currentColors.text} size={24} />
          </TouchableOpacity>
        </View> */}
        <ErrorState
          title="Error Loading Car"
          message={error || 'Car details could not be loaded or the car was not found.'}
          onRetry={refetch} // Use refetch from useApi
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom header View removed, native header is used */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Image Gallery */}
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          style={styles.imageGallery}
        >
          {car.images && car.images.length > 0 ? car.images.map((image: string, index: number) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={styles.carImage}
              resizeMode="cover"
            />
          )) : (
            <Image // Fallback if no images
              source={{ uri: 'https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=800' }}
              style={styles.carImage}
              resizeMode="cover"
            />
          )}
        </ScrollView>

        {/* Car Details */}
        <View style={styles.content}>
          <View style={styles.titleSection}>
            <Text style={styles.carTitle}>
              {car.year} {car.make} {car.model}
            </Text>
            <Text style={styles.carPrice}>{formatPrice(car.price)}</Text>
          </View>

          {/* Key Details */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Settings color={currentColors.textSecondary} size={20} />
              <Text style={styles.detailLabel}>Mileage</Text>
              <Text style={styles.detailValue}>{formatMileage(car.mileage)} mi</Text>
            </View>
            {car.fuel_type && (
              <View style={styles.detailItem}>
                <Fuel color={currentColors.textSecondary} size={20} />
                <Text style={styles.detailLabel}>Fuel Type</Text>
                <Text style={styles.detailValue}>{formatFuelType(car.fuel_type)}</Text>
              </View>
            )}
            {car.condition && (
              <View style={styles.detailItem}>
                <Calendar color={currentColors.textSecondary} size={20} />
                <Text style={styles.detailLabel}>Condition</Text>
                <Text style={styles.detailValue}>{formatCondition(car.condition)}</Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <MapPin color={currentColors.textSecondary} size={20} />
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{car.location}</Text>
            </View>
          </View>

          {/* Description */}
          {car.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.description}>{car.description}</Text>
            </View>
          )}

          {/* Features */}
          {car.features && car.features.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Features</Text>
              <View style={styles.featuresGrid}>
                {car.features.map((feature: string, index: number) => (
                  <View key={index} style={styles.featureTag}>
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Dealer Info */}
          {car.dealer && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Dealer Information</Text>
              <View style={styles.dealerCard}>
                <View style={styles.dealerHeader}>
                  <Text style={styles.dealerName}>{car.dealer.name}</Text>
                  {car.dealer.verified && (
                    <View style={styles.verifiedBadge}>
                      <Star color={currentColors.white} size={12} fill={currentColors.white} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>
                {/* Mocked phone and email for now, as they are not in the CarType.dealer */}
                <View style={styles.dealerActions}>
                  <TouchableOpacity style={styles.dealerAction}>
                    <Phone color={currentColors.primary} size={20} />
                    <Text style={styles.dealerActionText}>+1 (555) XXX-XXXX</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dealerAction}>
                    <Mail color={currentColors.primary} size={20} />
                    <Text style={styles.dealerActionText}>dealer@example.com</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <Button
          title="Contact Dealer"
          onPress={handleContact}
          style={styles.contactButton}
          icon={<Phone color={currentColors.white} size={20} />}
        />
      </View>
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
  // Old custom header styles (header, backButton, headerActions, actionButton) removed.
  // New styles for headerRight items:
  headerActionsContainer: {
    flexDirection: 'row',
    marginRight: Platform.OS === 'ios' ? 0 : Spacing.md,
  },
  headerActionButton: {
    paddingHorizontal: Spacing.sm,
  },
  imageGallery: {
    height: 300,
  },
  carImage: {
    width,
    height: 300,
  },
  content: {
    padding: Spacing.lg,
  },
  titleSection: {
    marginBottom: Spacing.lg,
  },
  carTitle: {
    ...Typography.h1,
    color: currentColors.text,
    marginBottom: Spacing.sm,
  },
  carPrice: {
    ...Typography.h2,
    color: currentColors.primary,
    fontWeight: '700',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  detailItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: currentColors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  detailLabel: {
    ...Typography.caption,
    color: currentColors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  detailValue: {
    ...Typography.bodySmall,
    color: currentColors.text,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    color: currentColors.text,
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    color: currentColors.textSecondary,
    lineHeight: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  featureTag: {
    backgroundColor: currentColors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  featureText: {
    ...Typography.bodySmall,
    color: currentColors.primary,
    fontWeight: '500',
  },
  dealerCard: {
    backgroundColor: currentColors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  dealerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  dealerName: {
    ...Typography.h3,
    color: currentColors.text,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: currentColors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  verifiedText: {
    ...Typography.caption,
    color: currentColors.white,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  dealerActions: {
    gap: Spacing.md,
  },
  dealerAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dealerActionText: {
    ...Typography.body,
    color: currentColors.primary,
    marginLeft: Spacing.sm,
    fontWeight: '500',
  },
  bottomAction: {
    padding: Spacing.lg,
    backgroundColor: currentColors.surface,
    borderTopWidth: 1,
    borderTopColor: currentColors.border,
  },
  contactButton: {
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: currentColors.textSecondary,
  },
});