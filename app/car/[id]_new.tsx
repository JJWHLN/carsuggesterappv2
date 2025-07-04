import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Platform,
  ImageBackground,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { 
  ArrowLeft, 
  Heart, 
  Share as ShareIcon, 
  MapPin, 
  Calendar, 
  Fuel, 
  Settings,
  Star,
  Phone,
  Mail,
  Navigation,
  Shield,
  Users,
  Gauge,
  Camera,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  CheckCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
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

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.5;

export default function CarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useThemeColors();
  const styles = useMemo(() => getStyles(colors), [colors]);
  
  const [isSaved, setIsSaved] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Fetch car data
  const {
    data: car,
    loading,
    error,
    refetch
  } = useApi<CarType | null>(() => 
    fetchVehicleListingById(id as string).then(data => 
      data ? transformDatabaseVehicleListingToCar(data) : null
    ), 
    [id]
  );

  const handleSave = useCallback(() => {
    setIsSaved(!isSaved);
    // Add save logic here
  }, [isSaved]);

  const handleShare = useCallback(async () => {
    if (!car) return;
    
    try {
      await Share.share({
        message: `Check out this ${car.title} - $${car.price.toLocaleString()}`,
        url: `https://carsuggester.com/car/${car.id}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [car]);

  const handleContactSeller = useCallback(() => {
    Alert.alert(
      'Contact Seller',
      'Choose how you would like to contact the seller:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => Linking.openURL('tel:+1234567890') 
        },
        { 
          text: 'Email', 
          onPress: () => Linking.openURL('mailto:seller@example.com') 
        },
      ]
    );
  }, []);

  const carImages = car?.images || [
    'https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=800',
  ];

  const specs = [
    { icon: Calendar, label: 'Year', value: car?.year?.toString() || 'N/A' },
    { icon: Gauge, label: 'Mileage', value: formatMileage(car?.mileage) },
    { icon: Settings, label: 'Transmission', value: car?.transmission || 'Automatic' },
    { icon: Fuel, label: 'Fuel Type', value: formatFuelType(car?.fuel_type) },
    { icon: Users, label: 'Seats', value: '5 seats' },
    { icon: Shield, label: 'Condition', value: formatCondition(car?.condition) },
  ];

  const features = [
    'Leather Seats', 'Navigation System', 'Backup Camera', 'Bluetooth',
    'Heated Seats', 'Sunroof', 'Premium Sound', 'Keyless Entry'
  ];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={32} color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading car details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !car) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorState 
          title="Car Not Found"
          message={error || 'This car listing could not be found'} 
          onRetry={refetch} 
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image Section */}
        <View style={styles.heroSection}>
          <ImageBackground
            source={{ uri: carImages[activeImageIndex] }}
            style={styles.heroImage}
            imageStyle={styles.heroImageStyle}
          >
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
              style={styles.heroOverlay}
            >
              {/* Header Actions */}
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: colors.white }]}
                  onPress={() => router.back()}
                >
                  <ArrowLeft color={colors.text} size={24} />
                </TouchableOpacity>
                <View style={styles.headerRightActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: colors.white }]}
                    onPress={handleShare}
                  >
                    <ShareIcon color={colors.text} size={24} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: colors.white }]}
                    onPress={handleSave}
                  >
                    <Heart 
                      color={isSaved ? colors.error : colors.text} 
                      size={24}
                      fill={isSaved ? colors.error : 'transparent'}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Image Indicators */}
              <View style={styles.imageIndicators}>
                {carImages.map((_, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.indicator,
                      { 
                        backgroundColor: index === activeImageIndex 
                          ? colors.white 
                          : 'rgba(255,255,255,0.4)' 
                      }
                    ]}
                    onPress={() => setActiveImageIndex(index)}
                  />
                ))}
              </View>

              {/* Car Title & Price Overlay */}
              <View style={styles.heroContent}>
                <Text style={[styles.carTitle, { color: colors.white }]}>
                  {car.title || `${car.make} ${car.model}`}
                </Text>
                <Text style={[styles.carPrice, { color: colors.white }]}>
                  ${car.price.toLocaleString()}
                </Text>
                <View style={styles.carLocationRating}>
                  <View style={styles.locationContainer}>
                    <MapPin color={colors.white} size={16} />
                    <Text style={[styles.locationText, { color: colors.white }]}>
                      {car.location || 'Multiple Locations'}
                    </Text>
                  </View>
                  <View style={styles.ratingContainer}>
                    <Star color={colors.warning} size={16} fill={colors.warning} />
                    <Text style={[styles.ratingText, { color: colors.white }]}>
                      4.5/5
                    </Text>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button
            title="Contact Seller"
            onPress={handleContactSeller}
            variant="primary"
            style={styles.primaryAction}
            icon={<Phone color={colors.white} size={20} />}
          />
          <Button
            title="Schedule Test Drive"
            onPress={() => Alert.alert('Test Drive', 'Test drive scheduling coming soon!')}
            variant="outline"
            style={styles.secondaryAction}
            icon={<Calendar color={colors.primary} size={20} />}
          />
        </View>

        {/* Key Specifications */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Specifications</Text>
          <View style={styles.specsGrid}>
            {specs.map((spec, index) => {
              const IconComponent = spec.icon;
              return (
                <View key={index} style={styles.specItem}>
                  <View style={[styles.specIcon, { backgroundColor: colors.primaryLight }]}>
                    <IconComponent color={colors.primary} size={20} />
                  </View>
                  <Text style={[styles.specLabel, { color: colors.textSecondary }]}>{spec.label}</Text>
                  <Text style={[styles.specValue, { color: colors.text }]}>{spec.value}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        {/* Features */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Key Features</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <CheckCircle color={colors.success} size={16} />
                <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Description */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Description</Text>
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>
            {car.description || 
            `This ${car.title || `${car.make} ${car.model}`} is in excellent condition and has been well-maintained. Perfect for both city driving and long road trips. The vehicle comes with a comprehensive service history and all necessary documentation. Don't miss out on this fantastic opportunity to own a reliable and stylish vehicle.`}
          </Text>
        </Card>

        {/* Seller Information */}
        <Card style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Seller Information</Text>
          <View style={styles.sellerInfo}>
            <View style={styles.sellerAvatar}>
              <Users color={colors.textSecondary} size={24} />
            </View>
            <View style={styles.sellerDetails}>
              <Text style={[styles.sellerName, { color: colors.text }]}>Premium Auto Dealer</Text>
              <Text style={[styles.sellerType, { color: colors.textSecondary }]}>Verified Dealer</Text>
              <View style={styles.sellerRating}>
                <Star color={colors.warning} size={14} fill={colors.warning} />
                <Text style={[styles.sellerRatingText, { color: colors.textSecondary }]}>4.8 (124 reviews)</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.sellerContact}>
              <MessageCircle color={colors.primary} size={20} />
            </TouchableOpacity>
          </View>
        </Card>

        {/* Location */}
        <Card style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Location</Text>
            <TouchableOpacity style={styles.viewMapButton}>
              <Text style={[styles.viewMapText, { color: colors.primary }]}>View Map</Text>
              <ExternalLink color={colors.primary} size={16} />
            </TouchableOpacity>
          </View>
          <View style={styles.locationInfo}>
            <MapPin color={colors.textSecondary} size={20} />
            <Text style={[styles.locationAddress, { color: colors.text }]}>
              {car.location || 'Downtown Auto Center, 123 Main Street, City, State 12345'}
            </Text>
          </View>
        </Card>

        {/* Contact Actions */}
        <View style={styles.contactActions}>
          <Button
            title="Call Dealer"
            onPress={() => Linking.openURL('tel:+1234567890')}
            variant="outline"
            style={styles.contactAction}
            icon={<Phone color={colors.primary} size={20} />}
          />
          <Button
            title="Send Message"
            onPress={handleContactSeller}
            variant="primary"
            style={styles.contactAction}
            icon={<MessageCircle color={colors.white} size={20} />}
          />
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: typeof import('@/constants/Colors').Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    height: HERO_HEIGHT,
  },
  heroImage: {
    flex: 1,
  },
  heroImageStyle: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 0 : Spacing.lg,
  },
  headerRightActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    ...ColorsShadows.small,
  },
  imageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroContent: {
    alignItems: 'flex-start',
  },
  carTitle: {
    ...Typography.pageTitle,
    marginBottom: Spacing.xs,
  },
  carPrice: {
    ...Typography.h2,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  carLocationRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  locationText: {
    ...Typography.bodySmall,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ratingText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  primaryAction: {
    flex: 2,
  },
  secondaryAction: {
    flex: 1,
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  specItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  specIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  specLabel: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  specValue: {
    ...Typography.bodySmall,
    fontWeight: '600',
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  featureText: {
    ...Typography.bodySmall,
    flex: 1,
  },
  descriptionText: {
    ...Typography.body,
    lineHeight: 24,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  sellerType: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  sellerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sellerRatingText: {
    ...Typography.caption,
  },
  sellerContact: {
    padding: Spacing.sm,
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  viewMapText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  locationAddress: {
    ...Typography.body,
    flex: 1,
    lineHeight: 22,
  },
  contactActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  contactAction: {
    flex: 1,
  },
  bottomSpacing: {
    height: Spacing.xl,
  },
});
