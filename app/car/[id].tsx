import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  Platform,
  ImageBackground,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';

import { LinearGradient } from 'expo-linear-gradient';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { ModernButton } from '@/components/ui/ModernButton';
import { Card } from '@/components/ui/Card';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { RealVideoPlayer } from '@/services/RealVideoService';
import { realNotificationService } from '@/services/RealNotificationServiceSimplified';
import { Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { BookmarkService } from '@/services/featureServices';
import {
  formatPrice,
  formatMileage,
  formatCondition,
  formatFuelType,
  transformDatabaseVehicleListingToCar
} from '@/utils/dataTransformers';
import { fetchVehicleListingById, SupabaseError } from '@/services/supabaseService';
import { useApi } from '@/hooks/useApi';
import { Car as CarType, DatabaseVehicleListing } from '@/types/database';
import { ArrowLeft, Heart, MapPin, Calendar, Fuel, Settings, Star, Mail, Users, Gauge, MessageCircle, Share, Camera, Phone, ExternalLink } from '@/utils/ultra-optimized-icons';
import { ContactDealerModal } from '@/components/ui/ContactDealerModal';
import { PriceAlertModal } from '@/components/ui/PriceAlertModal';
import { leadService } from '@/services/LeadGenerationService';

const { width, height } = Dimensions.get('window');

export default function CarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showPriceAlertModal, setShowPriceAlertModal] = useState(false);
  const [dealerInfo, setDealerInfo] = useState<any>(null);
  const navigation = useNavigation();
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const styles = useMemo(() => getStyles(colors), [colors]);

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

  const handleSave = useCallback(async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to save cars to your favorites.');
      return;
    }

    if (!id || saveLoading) return;

    try {
      setSaveLoading(true);
      
      if (isSaved) {
        // Remove from bookmarks
        await BookmarkService.removeBookmark(user.id, { vehicleListingId: id });
        setIsSaved(false);
        Alert.alert('Removed', 'Car removed from your saved cars.');
      } else {
        // Add to bookmarks
        await BookmarkService.addBookmark(user.id, { vehicleListingId: id });
        setIsSaved(true);
        
        // Send real notification for successful save
        if (car) {
          try {
            await realNotificationService.createCarAlert(
              car.id,
              `${car.year} ${car.make} ${car.model}`,
              'Car saved to your favorites! We\'ll notify you of price changes.',
              'normal'
            );
          } catch (notificationError) {
            console.warn('Failed to send notification:', notificationError);
          }
        }
        
        Alert.alert('Saved', 'Car added to your saved cars.');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      Alert.alert('Error', 'Failed to update your saved cars. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  }, [user, id, isSaved, saveLoading]);

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
            <Share color={colors.primary} size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.headerActionButton}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? "Unsave this car" : "Save this car"}
            accessibilityState={{ selected: isSaved }}
          >
            <Heart
              color={isSaved ? colors.error : colors.primary}
              fill={isSaved ? colors.error : 'transparent'}
              size={24}
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, car, isSaved, handleSave, handleShare, colors]);

  const handleContact = useCallback(async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to contact the dealer about this car.');
      return;
    }

    // Fetch dealer info if not already loaded
    if (!dealerInfo && id) {
      try {
        const info = await leadService.getCarContactInfo(id);
        setDealerInfo(info);
      } catch (error) {
        console.warn('Failed to load dealer info:', error);
      }
    }

    setShowContactModal(true);
  }, [user, id, dealerInfo]);

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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Enhanced Image Gallery */}
        <View style={styles.imageGalleryContainer}>
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            style={styles.imageGallery}
          >
            {car.images && car.images.length > 0 ? car.images.map((image: string, index: number) => (
              <View key={index} style={styles.imageContainer}>
                <OptimizedImage
                  source={{ uri: image }}
                  style={styles.carImage}
                  resizeMode="cover"
                  fallbackSource={require('@/assets/images/icon.png')}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.4)']}
                  style={styles.imageOverlay}
                />
              </View>
            )) : (
              <View style={styles.imageContainer}>
                <OptimizedImage
                  source={{ uri: 'https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=800' }}
                  style={styles.carImage}
                  resizeMode="cover"
                  fallbackSource={require('@/assets/images/icon.png')}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.4)']}
                  style={styles.imageOverlay}
                />
              </View>
            )}
          </ScrollView>
          
          {/* Image Counter */}
          {car.images && car.images.length > 1 && (
            <View style={styles.imageCounter}>
              <Camera color={colors.white} size={16} />
              <Text style={styles.imageCounterText}>{car.images.length}</Text>
            </View>
          )}
        </View>

        {/* Video Player Section - Real Video Integration */}
        {car.images && car.images.length > 0 && (
          <View style={styles.videoSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Car Video Review
            </Text>
            <RealVideoPlayer
              source={{
                uri: `https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4`,
                thumbnail: car.images[0],
                quality: '720p'
              }}
              style={styles.videoPlayer}
              shouldPlay={false}
              showControls={true}
              autoHideControls={true}
              onLoad={() => console.log('Video loaded for car:', car.id)}
              onError={(error) => console.error('Video error:', error)}
            />
          </View>
        )}

        {/* Enhanced Car Details */}
        <View style={styles.content}>
          {/* Title and Price Section */}
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <Text style={styles.carTitle}>
                {car.year} {car.make} {car.model}
              </Text>
              {car.condition && (
                <View style={[styles.conditionBadge, { 
                  backgroundColor: car.condition === 'new' ? colors.success : colors.warning 
                }]}>
                  <Text style={styles.conditionText}>
                    {formatCondition(car.condition)}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.carPrice}>{formatPrice(car.price)}</Text>
            
            {/* Quick Stats Row */}
            <View style={styles.quickStatsRow}>
              <View style={styles.quickStat}>
                <Gauge color={colors.textSecondary} size={16} />
                <Text style={styles.quickStatText}>{formatMileage(car.mileage)} mi</Text>
              </View>
              {car.fuel_type && (
                <View style={styles.quickStat}>
                  <Fuel color={colors.textSecondary} size={16} />
                  <Text style={styles.quickStatText}>{formatFuelType(car.fuel_type)}</Text>
                </View>
              )}
              <View style={styles.quickStat}>
                <MapPin color={colors.textSecondary} size={16} />
                <Text style={styles.quickStatText}>{car.location}</Text>
              </View>
            </View>
          </View>

          {/* Key Details */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Settings color={colors.textSecondary} size={20} />
              <Text style={styles.detailLabel}>Mileage</Text>
              <Text style={styles.detailValue}>{formatMileage(car.mileage)} mi</Text>
            </View>
            {car.fuel_type && (
              <View style={styles.detailItem}>
                <Fuel color={colors.textSecondary} size={20} />
                <Text style={styles.detailLabel}>Fuel Type</Text>
                <Text style={styles.detailValue}>{formatFuelType(car.fuel_type)}</Text>
              </View>
            )}
            {car.condition && (
              <View style={styles.detailItem}>
                <Calendar color={colors.textSecondary} size={20} />
                <Text style={styles.detailLabel}>Condition</Text>
                <Text style={styles.detailValue}>{formatCondition(car.condition)}</Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <MapPin color={colors.textSecondary} size={20} />
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
                      <Star color={colors.white} size={12} fill={colors.white} />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>
                {/* Mocked phone and email for now, as they are not in the CarType.dealer */}
                <View style={styles.dealerActions}>
                  <TouchableOpacity style={styles.dealerAction}>
                    <Phone color={colors.primary} size={20} />
                    <Text style={styles.dealerActionText}>+1 (555) XXX-XXXX</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.dealerAction}>
                    <Mail color={colors.primary} size={20} />
                    <Text style={styles.dealerActionText}>dealer@example.com</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Enhanced Bottom Action */}
      <View style={styles.bottomAction}>
        <View style={styles.bottomButtons}>
          <Button
            title="Contact Dealer"
            onPress={handleContact}
            style={styles.primaryButton}
            icon={<Phone color={colors.white} size={20} />}
          />
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => setShowPriceAlertModal(true)}
          >
            <Calendar color={colors.primary} size={20} />
            <Text style={styles.secondaryButtonText}>Price Alert</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.additionalActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {
              // Handle schedule visit
              console.log('Schedule visit for car:', id);
            }}
          >
            <MessageCircle color={colors.textSecondary} size={20} />
            <Text style={styles.actionButtonText}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MapPin color={colors.textSecondary} size={20} />
            <Text style={styles.actionButtonText}>Directions</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <ExternalLink color={colors.textSecondary} size={20} />
            <Text style={styles.actionButtonText}>Website</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Contact Dealer Modal */}
      {car && (
        <ContactDealerModal
          visible={showContactModal}
          onClose={() => setShowContactModal(false)}
          car={{
            id: car.id,
            make: car.make,
            model: car.model,
            year: car.year,
            price: car.price,
            image: car.images?.[0],
          }}
          dealerInfo={dealerInfo}
        />
      )}

      {/* Price Alert Modal */}
      {car && (
        <PriceAlertModal
          visible={showPriceAlertModal}
          onClose={() => setShowPriceAlertModal(false)}
          car={{
            id: car.id,
            make: car.make,
            model: car.model,
            year: car.year,
            price: car.price,
            image: car.images?.[0],
          }}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors: typeof import('@/constants/Colors').Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  imageGalleryContainer: {
    position: 'relative',
  },
  imageGallery: {
    height: 320,
  },
  imageContainer: {
    width,
    height: 320,
    position: 'relative',
  },
  carImage: {
    width,
    height: 320,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  imageCounter: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  imageCounterText: {
    ...Typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  videoSection: {
    padding: Spacing.lg,
    backgroundColor: colors.cardBackground,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  videoPlayer: {
    marginTop: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  content: {
    padding: Spacing.lg,
  },
  titleSection: {
    marginBottom: Spacing.xl,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  carTitle: {
    ...Typography.heading,
    color: colors.text,
    flex: 1,
    marginRight: Spacing.md,
  },
  conditionBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  conditionText: {
    ...Typography.caption,
    color: colors.white,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  carPrice: {
    ...Typography.title,
    color: colors.primary,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  quickStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  quickStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  quickStatText: {
    ...Typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
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
    backgroundColor: colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  detailLabel: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  detailValue: {
    ...Typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: colors.text,
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  featureTag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  featureText: {
    ...Typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
  dealerCard: {
    backgroundColor: colors.surface,
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
    ...Typography.subtitle,
    color: colors.text,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  verifiedText: {
    ...Typography.caption,
    color: colors.white,
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
    color: colors.primary,
    marginLeft: Spacing.sm,
    fontWeight: '500',
  },
  bottomAction: {
    padding: Spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...ColorsShadows.lg,
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  primaryButton: {
    flex: 2,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: Spacing.sm,
  },
  secondaryButtonText: {
    ...Typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  additionalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  actionButtonText: {
    ...Typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
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
    color: colors.textSecondary,
  },
});