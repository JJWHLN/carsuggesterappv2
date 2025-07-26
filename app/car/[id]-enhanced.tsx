import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { CarCard } from '@/components/CarCard-updated';
import { useThemeColors } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';

import CarDataService from '@/services/core/CarDataService';
import SimpleBookmarksService from '@/services/core/SimpleBookmarksService';
import UserPreferencesService from '@/services/core/UserPreferencesService';
import { Car } from '@/types/database';
import {
  formatPrice,
  formatMileage,
  formatCondition,
  formatFuelType,
} from '@/utils/dataTransformers';
import {
  ArrowLeft,
  Heart,
  MapPin,
  Calendar,
  Fuel,
  Settings,
  Star,
  Mail,
  Phone,
  Share,
  MessageCircle,
  ExternalLink,
} from '@/utils/ultra-optimized-icons';

const { width, height } = Dimensions.get('window');

export default function CarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const styles = useMemo(() => getStyles(colors), [colors]);

  // Services
  const carDataService = CarDataService.getInstance();
  const bookmarksService = SimpleBookmarksService.getInstance();
  const preferencesService = UserPreferencesService.getInstance();

  // State
  const [car, setCar] = useState<Car | null>(null);
  const [similarCars, setSimilarCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (id) {
      loadCarData();
    }
  }, [id]);

  useEffect(() => {
    if (car) {
      // Track viewing behavior
      preferencesService.trackBehaviorEvent({
        type: 'view',
        carId: car.id,
        make: car.make,
        priceRange: { min: car.price * 0.9, max: car.price * 1.1 },
        timestamp: Date.now(),
      });

      // Check bookmark status
      checkBookmarkStatus();

      // Load similar cars
      loadSimilarCars();
    }
  }, [car]);

  const loadCarData = async () => {
    try {
      setLoading(true);
      setError(null);

      const carData = await carDataService.getCarById(id as string);

      if (!carData) {
        setError('Car not found');
        return;
      }

      setCar(carData);
    } catch (err) {
      console.error('Error loading car data:', err);
      setError('Failed to load car details');
    } finally {
      setLoading(false);
    }
  };

  const checkBookmarkStatus = async () => {
    if (!car) return;

    try {
      const bookmarked = await bookmarksService.isBookmarked(car.id, user?.id);
      setIsBookmarked(bookmarked);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const loadSimilarCars = async () => {
    if (!car) return;

    try {
      const similar = await carDataService.getSimilarCars(car.id, 5);
      setSimilarCars(similar);
    } catch (error) {
      console.error('Error loading similar cars:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCarData();
    setRefreshing(false);
  };

  const handleBack = () => {
    router.back();
  };

  const handleBookmarkToggle = async () => {
    if (!car) return;
    if (bookmarkLoading) return;

    try {
      setBookmarkLoading(true);

      if (isBookmarked) {
        const success = await bookmarksService.removeBookmark(car.id, user?.id);
        if (success) {
          setIsBookmarked(false);

          preferencesService.trackBehaviorEvent({
            type: 'unsave',
            carId: car.id,
            make: car.make,
            timestamp: Date.now(),
          });

          Alert.alert('Removed', 'Car removed from your saved cars.');
        }
      } else {
        const success = await bookmarksService.addBookmark(car.id, user?.id);
        if (success) {
          setIsBookmarked(true);

          preferencesService.trackBehaviorEvent({
            type: 'save',
            carId: car.id,
            make: car.make,
            timestamp: Date.now(),
          });

          Alert.alert('Saved', 'Car added to your saved cars.');
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      Alert.alert('Error', 'Failed to update bookmark. Please try again.');
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleContactDealer = async () => {
    if (!car?.dealer) return;

    // Track behavior
    preferencesService.trackBehaviorEvent({
      type: 'contact_dealer',
      carId: car.id,
      make: car.make,
      timestamp: Date.now(),
    });

    Alert.alert(
      'Contact Dealer',
      `Contact ${car.dealer.name} about this ${car.year} ${car.make} ${car.model}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            // In a real app, you'd have dealer phone number
            Alert.alert('Call Dealer', 'Dealer contact feature coming soon!');
          },
        },
        {
          text: 'Email',
          onPress: () => {
            Alert.alert('Email Dealer', 'Dealer email feature coming soon!');
          },
        },
      ],
    );
  };

  const handleShare = async () => {
    if (!car) return;

    preferencesService.trackBehaviorEvent({
      type: 'share',
      carId: car.id,
      make: car.make,
      timestamp: Date.now(),
    });

    Alert.alert('Share Car', 'Share functionality coming soon!');
  };

  const handleSimilarCarPress = (similarCar: Car) => {
    router.push(`/car/${similarCar.id}`);
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading car details...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !car) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ErrorState
          title="Car Not Found"
          message={error || 'This car listing could not be found'}
        />
      </SafeAreaView>
    );
  }

  const images =
    car.images && car.images.length > 0
      ? car.images
      : [
          'https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=800',
        ];

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header with Image */}
        <View style={styles.imageSection}>
          <OptimizedImage
            source={{ uri: images[currentImageIndex] }}
            style={styles.heroImage}
            accessibilityLabel={`Photo of ${car.year} ${car.make} ${car.model}`}
          />

          {/* Header Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={styles.headerOverlay}
          >
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={[
                  styles.headerButton,
                  { backgroundColor: 'rgba(255,255,255,0.9)' },
                ]}
                onPress={handleBack}
              >
                <ArrowLeft size={24} color={colors.text} />
              </TouchableOpacity>

              <View style={styles.headerRightButtons}>
                <TouchableOpacity
                  style={[
                    styles.headerButton,
                    { backgroundColor: 'rgba(255,255,255,0.9)' },
                  ]}
                  onPress={handleShare}
                >
                  <Share size={20} color={colors.text} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.headerButton,
                    {
                      backgroundColor: isBookmarked
                        ? colors.primary
                        : 'rgba(255,255,255,0.9)',
                    },
                  ]}
                  onPress={handleBookmarkToggle}
                  disabled={bookmarkLoading}
                >
                  <Heart
                    size={20}
                    color={isBookmarked ? 'white' : colors.text}
                    fill={isBookmarked}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>

          {/* Image Indicator */}
          {images.length > 1 && (
            <View style={styles.imageIndicator}>
              <Text style={styles.imageIndicatorText}>
                {currentImageIndex + 1} / {images.length}
              </Text>
            </View>
          )}
        </View>

        {/* Car Information */}
        <View style={styles.contentSection}>
          {/* Title and Price */}
          <View style={styles.titleSection}>
            <Text style={[styles.carTitle, { color: colors.text }]}>
              {car.year} {car.make} {car.model}
            </Text>
            <Text style={[styles.carPrice, { color: colors.primary }]}>
              {formatPrice(car.price)}
            </Text>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Fuel size={16} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {formatMileage(car.mileage)}
              </Text>
            </View>

            <View style={styles.statItem}>
              <MapPin size={16} color={colors.textSecondary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                {car.location}
              </Text>
            </View>

            {car.condition && (
              <View style={styles.statItem}>
                <Settings size={16} color={colors.textSecondary} />
                <Text
                  style={[styles.statText, { color: colors.textSecondary }]}
                >
                  {formatCondition(car.condition)}
                </Text>
              </View>
            )}
          </View>

          {/* Description */}
          {car.description && (
            <Card style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Description
              </Text>
              <Text
                style={[styles.description, { color: colors.textSecondary }]}
              >
                {car.description}
              </Text>
            </Card>
          )}

          {/* Vehicle Details */}
          <Card style={styles.sectionCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Vehicle Details
            </Text>
            <View style={styles.detailsGrid}>
              <View style={styles.detailRow}>
                <Text
                  style={[styles.detailLabel, { color: colors.textSecondary }]}
                >
                  Year
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {car.year}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text
                  style={[styles.detailLabel, { color: colors.textSecondary }]}
                >
                  Mileage
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {formatMileage(car.mileage)}
                </Text>
              </View>

              {car.fuel_type && (
                <View style={styles.detailRow}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Fuel Type
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {formatFuelType(car.fuel_type)}
                  </Text>
                </View>
              )}

              {car.transmission && (
                <View style={styles.detailRow}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Transmission
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {car.transmission}
                  </Text>
                </View>
              )}

              {car.exterior_color && (
                <View style={styles.detailRow}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Exterior Color
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {car.exterior_color}
                  </Text>
                </View>
              )}

              {car.interior_color && (
                <View style={styles.detailRow}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Interior Color
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {car.interior_color}
                  </Text>
                </View>
              )}
            </View>
          </Card>

          {/* Features */}
          {car.features && car.features.length > 0 && (
            <Card style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Features
              </Text>
              <View style={styles.featuresContainer}>
                {car.features.map((feature, index) => (
                  <View
                    key={index}
                    style={[
                      styles.featureChip,
                      { backgroundColor: colors.surface },
                    ]}
                  >
                    <Text style={[styles.featureText, { color: colors.text }]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Dealer Information */}
          {car.dealer && (
            <Card style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Dealer Information
              </Text>
              <View style={styles.dealerInfo}>
                <View style={styles.dealerHeader}>
                  <Text style={[styles.dealerName, { color: colors.text }]}>
                    {car.dealer.name}
                  </Text>
                  {car.dealer.verified && (
                    <View
                      style={[
                        styles.verifiedBadge,
                        { backgroundColor: colors.primary },
                      ]}
                    >
                      <Star size={12} color="white" />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>

                <Button
                  title="Contact Dealer"
                  onPress={handleContactDealer}
                  variant="primary"
                  style={styles.contactButton}
                />
              </View>
            </Card>
          )}

          {/* Similar Cars */}
          {similarCars.length > 0 && (
            <Card style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Similar Cars
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.similarCarsContainer}
              >
                {similarCars.map((similarCar) => (
                  <View key={similarCar.id} style={styles.similarCarItem}>
                    <CarCard
                      car={similarCar}
                      onPress={() => handleSimilarCarPress(similarCar)}
                      showSaveButton={true}
                      variant="grid"
                    />
                  </View>
                ))}
              </ScrollView>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
    },
    scrollContent: {
      paddingBottom: 32,
    },
    imageSection: {
      position: 'relative',
      height: height * 0.4,
    },
    heroImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    headerOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 100,
      justifyContent: 'flex-end',
    },
    headerButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    headerButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerRightButtons: {
      flexDirection: 'row',
      gap: 12,
    },
    imageIndicator: {
      position: 'absolute',
      bottom: 16,
      right: 16,
      backgroundColor: 'rgba(0,0,0,0.6)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    imageIndicatorText: {
      color: 'white',
      fontSize: 12,
      fontWeight: '600',
    },
    contentSection: {
      padding: 16,
    },
    titleSection: {
      marginBottom: 16,
    },
    carTitle: {
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 8,
    },
    carPrice: {
      fontSize: 28,
      fontWeight: '800',
    },
    statsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 24,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
    },
    statItem: {
      alignItems: 'center',
    },
    statText: {
      fontSize: 12,
      marginTop: 4,
    },
    sectionCard: {
      marginBottom: 16,
      padding: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 12,
    },
    description: {
      fontSize: 16,
      lineHeight: 24,
    },
    detailsGrid: {
      gap: 12,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    detailLabel: {
      fontSize: 14,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '600',
    },
    featuresContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    featureChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    featureText: {
      fontSize: 12,
      fontWeight: '500',
    },
    dealerInfo: {
      gap: 12,
    },
    dealerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dealerName: {
      fontSize: 16,
      fontWeight: '600',
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    verifiedText: {
      color: 'white',
      fontSize: 10,
      fontWeight: '600',
      marginLeft: 4,
    },
    contactButton: {
      marginTop: 8,
    },
    similarCarsContainer: {
      paddingLeft: 4,
    },
    similarCarItem: {
      width: width * 0.6,
      marginRight: 16,
    },
  });
