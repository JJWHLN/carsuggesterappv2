import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  Platform,
  Alert,
  Linking,
  Share,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { ModernButton } from '@/components/ui/ModernButton';
import { Card } from '@/components/ui/Card';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { CarCard } from '@/components/CarCard';
import { Spacing, Typography, BorderRadius } from '@/constants/Colors';
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
import {
  ArrowLeft,
  Heart,
  MapPin,
  Calendar,
  Fuel,
  Settings,
  Star,
  Mail,
  Users,
  Gauge,
  MessageCircle,
  Share as ShareIcon,
  Camera,
  Phone,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  TrendingUp,
  DollarSign,
  Info,
  CheckCircle,
  Shield,
  Zap,
  Eye,
} from '@/utils/ultra-optimized-icons';

const { width, height } = Dimensions.get('window');

interface DealerInfo {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  phone: string;
  email: string;
  address: string;
  hours: string;
  verified: boolean;
}

interface PriceHistoryPoint {
  date: string;
  price: number;
}

interface FinanceCalculation {
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
}

export default function EnhancedCarDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { colors } = useThemeColors();
  const { user } = useAuth();
  
  // State management
  const [isSaved, setIsSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showFinanceCalculator, setShowFinanceCalculator] = useState(false);
  const [similarCars, setSimilarCars] = useState<CarType[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([]);
  const [viewCount, setViewCount] = useState(0);
  
  // Finance calculator state
  const [downPayment, setDownPayment] = useState('20');
  const [loanTerm, setLoanTerm] = useState('60');
  const [interestRate, setInterestRate] = useState('4.5');
  const [financeResult, setFinanceResult] = useState<FinanceCalculation | null>(null);

  // Animation values
  const imageScale = useSharedValue(1);
  const favoriteScale = useSharedValue(1);
  const scrollY = useSharedValue(0);

  const styles = useMemo(() => getStyles(colors), [colors]);

  // Fetch car data
  const {
    data: rawCarData,
    loading,
    error,
    refetch
  } = useApi<DatabaseVehicleListing | null>(
    async () => {
      if (!id) return null;
      try {
        const result = await fetchVehicleListingById(id);
        
        // Track view
        if (result) {
          // CarDataService.trackCarView(id, user?.id); // TODO: Implement when service is available
          setViewCount(prev => prev + 1);
        }
        
        return result;
      } catch (e) {
        if (e instanceof SupabaseError) {
          throw new Error(e.message);
        }
        throw e;
      }
    },
    [id]
  );

  const car: CarType | null = rawCarData ? transformDatabaseVehicleListingToCar(rawCarData) : null;

  // Mock dealer info - in real app, fetch from dealer service
  const dealerInfo: DealerInfo = {
    id: '1',
    name: 'Premium Auto Gallery',
    rating: 4.8,
    reviewCount: 247,
    phone: '+1 (555) 123-4567',
    email: 'sales@premiumautogallery.com',
    address: '123 Auto Row, Car City, CC 12345',
    hours: 'Mon-Sat 9AM-8PM, Sun 11AM-6PM',
    verified: true,
  };

  // Load similar cars and price history
  useEffect(() => {
    if (car) {
      loadSimilarCars();
      loadPriceHistory();
    }
  }, [car]);

  const loadSimilarCars = async () => {
    try {
      if (!car) return;
      
      // Mock similar cars for now - TODO: Implement when recommendation service is available
      const mockSimilarCars: CarType[] = [
        {
          id: '1',
          make: car.make,
          model: 'Similar Model',
          year: car.year,
          price: car.price + 1000,
          mileage: car.mileage + 5000,
          condition: car.condition,
          fuel_type: car.fuel_type,
          transmission: car.transmission || 'Automatic',
          location: car.location,
          images: ['https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=400'],
          description: 'Similar car description',
          dealer: car.dealer,
          features: car.features,
          created_at: new Date().toISOString(),
        }
      ];
      
      setSimilarCars(mockSimilarCars);
    } catch (error) {
      console.error('Error loading similar cars:', error);
    }
  };

  const loadPriceHistory = async () => {
    // Mock price history - in real app, fetch from price tracking service
    const mockHistory: PriceHistoryPoint[] = [
      { date: '2024-01-01', price: car?.price ? car.price + 2000 : 25000 },
      { date: '2024-02-01', price: car?.price ? car.price + 1500 : 24500 },
      { date: '2024-03-01', price: car?.price ? car.price + 1000 : 24000 },
      { date: '2024-04-01', price: car?.price ? car.price + 500 : 23500 },
      { date: '2024-05-01', price: car?.price || 23000 },
    ];
    setPriceHistory(mockHistory);
  };

  const handleSave = useCallback(async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to save cars to your favorites.');
      return;
    }

    if (!id || saveLoading) return;

    try {
      setSaveLoading(true);
      favoriteScale.value = withSpring(1.2, {}, () => {
        favoriteScale.value = withSpring(1);
      });
      
      if (isSaved) {
        await BookmarkService.removeBookmark(user.id, { vehicleListingId: id });
        setIsSaved(false);
      } else {
        await BookmarkService.addBookmark(user.id, { vehicleListingId: id });
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      Alert.alert('Error', 'Failed to update your saved cars. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  }, [user, id, isSaved, saveLoading]);

  const handleShare = useCallback(async () => {
    try {
      if (!car) return;
      
      const shareContent = {
        message: `Check out this ${car.year} ${car.make} ${car.model} - ${formatPrice(car.price)}`,
        url: `carsuggester://car/${id}`,
        title: `${car.year} ${car.make} ${car.model}`,
      };

      await Share.share(shareContent);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, [car, id]);

  const handleContactDealer = useCallback((method: 'phone' | 'email') => {
    if (method === 'phone') {
      Linking.openURL(`tel:${dealerInfo.phone}`);
    } else {
      Linking.openURL(`mailto:${dealerInfo.email}?subject=Inquiry about ${car?.year} ${car?.make} ${car?.model}`);
    }
  }, [car]);

  const calculateFinancing = useCallback(() => {
    if (!car) return;

    const principal = car.price - (car.price * (parseFloat(downPayment) / 100));
    const monthlyRate = parseFloat(interestRate) / 100 / 12;
    const numberOfPayments = parseInt(loanTerm);

    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                          (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    const totalCost = monthlyPayment * numberOfPayments + (car.price * (parseFloat(downPayment) / 100));
    const totalInterest = totalCost - car.price;

    setFinanceResult({
      monthlyPayment,
      totalInterest,
      totalCost,
    });
  }, [car, downPayment, loanTerm, interestRate]);

  const handleImagePress = useCallback((index: number) => {
    setCurrentImageIndex(index);
    setShowImageModal(true);
  }, []);

  const renderImageGallery = () => {
    const images = car?.images || ['https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=800'];

    return (
      <View style={styles.imageGalleryContainer}>
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(index);
          }}
          renderItem={({ item, index }) => (
            <TouchableOpacity onPress={() => handleImagePress(index)}>
              <OptimizedImage
                source={{ uri: item }}
                style={styles.carImage}
                resizeMode="cover"
                fallbackSource={require('@/assets/images/icon.png')}
              />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.3)']}
                style={styles.imageOverlay}
              />
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
        
        {/* Image indicators */}
        <View style={styles.imageIndicators}>
          {images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.imageIndicator,
                {
                  backgroundColor: index === currentImageIndex ? colors.primary : colors.border,
                }
              ]}
            />
          ))}
        </View>

        {/* Image count */}
        <View style={styles.imageCounter}>
          <Camera color={colors.white} size={16} />
          <Text style={styles.imageCounterText}>{images.length}</Text>
        </View>

        {/* Action buttons overlay */}
        <View style={styles.imageActions}>
          <Animated.View style={[styles.actionButton, { backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={handleShare}>
              <ShareIcon color={colors.text} size={24} />
            </TouchableOpacity>
          </Animated.View>
          
          <Animated.View style={[styles.actionButton, { backgroundColor: colors.surface }]}>
            <TouchableOpacity onPress={handleSave}>
              <Heart 
                color={isSaved ? colors.primary : colors.text} 
                size={24}
                fill={isSaved ? colors.primary : 'none'}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  };

  const renderCarInfo = () => (
    <Card style={styles.infoCard}>
      <View style={styles.carHeader}>
        <View style={styles.carTitleContainer}>
          <Text style={[styles.carTitle, { color: colors.text }]}>
            {car?.year} {car?.make} {car?.model}
          </Text>
          <Text style={[styles.carSubtitle, { color: colors.textSecondary }]}>
            {formatCondition(car?.condition || 'used')}
          </Text>
        </View>
        
        {/* Remove rating section for now since it's not in the Car type */}
      </View>

      <View style={styles.priceContainer}>
        <Text style={[styles.price, { color: colors.primary }]}>
          {formatPrice(car?.price || 0)}
        </Text>
        
        {priceHistory.length > 0 && (
          <View style={styles.priceChangeContainer}>
            <TrendingUp color={colors.success} size={16} />
            <Text style={[styles.priceChange, { color: colors.success }]}>
              -${(priceHistory[0].price - (car?.price || 0)).toLocaleString()} since listing
            </Text>
          </View>
        )}
      </View>

      {/* Key specs */}
      <View style={styles.specsGrid}>
        <View style={styles.specItem}>
          <Gauge color={colors.primary} size={20} />
          <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Mileage</Text>
          <Text style={[styles.specValue, { color: colors.text }]}>
            {formatMileage(car?.mileage || 0)}
          </Text>
        </View>
        
        <View style={styles.specItem}>
          <Fuel color={colors.primary} size={20} />
          <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Fuel</Text>
          <Text style={[styles.specValue, { color: colors.text }]}>
            {formatFuelType(car?.fuel_type || 'gasoline')}
          </Text>
        </View>
        
        <View style={styles.specItem}>
          <Settings color={colors.primary} size={20} />
          <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Transmission</Text>
          <Text style={[styles.specValue, { color: colors.text }]}>
            {car?.transmission || 'Automatic'}
          </Text>
        </View>
        
        <View style={styles.specItem}>
          <MapPin color={colors.primary} size={20} />
          <Text style={[styles.specLabel, { color: colors.textSecondary }]}>Location</Text>
          <Text style={[styles.specValue, { color: colors.text }]}>
            {car?.location || 'Not specified'}
          </Text>
        </View>
      </View>
    </Card>
  );

  const renderFeatures = () => (
    <Card style={styles.featuresCard}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Features & Options</Text>
      
      <View style={styles.featuresGrid}>
        {car?.features?.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <CheckCircle color={colors.success} size={16} />
            <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
          </View>
        )) || (
          // Default features if none provided
          ['Air Conditioning', 'Power Windows', 'Bluetooth', 'Backup Camera'].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <CheckCircle color={colors.success} size={16} />
              <Text style={[styles.featureText, { color: colors.text }]}>{feature}</Text>
            </View>
          ))
        )}
      </View>
    </Card>
  );

  const renderFinanceCalculator = () => (
    <Card style={styles.financeCard}>
      <View style={styles.financeHeader}>
        <DollarSign color={colors.primary} size={24} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Financing Calculator
        </Text>
        <TouchableOpacity onPress={() => setShowFinanceCalculator(!showFinanceCalculator)}>
          <ChevronRight 
            color={colors.text} 
            size={20}
            style={{
              transform: [{ rotate: showFinanceCalculator ? '90deg' : '0deg' }]
            }}
          />
        </TouchableOpacity>
      </View>

      {showFinanceCalculator && (
        <View style={styles.financeContent}>
          <View style={styles.financeInputs}>
            <View style={styles.financeInput}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Down Payment (%)
              </Text>
              <TextInput
                style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
                value={downPayment}
                onChangeText={setDownPayment}
                keyboardType="numeric"
                placeholder="20"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.financeInput}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Loan Term (months)
              </Text>
              <TextInput
                style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
                value={loanTerm}
                onChangeText={setLoanTerm}
                keyboardType="numeric"
                placeholder="60"
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <View style={styles.financeInput}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                Interest Rate (%)
              </Text>
              <TextInput
                style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
                value={interestRate}
                onChangeText={setInterestRate}
                keyboardType="numeric"
                placeholder="4.5"
                placeholderTextColor={colors.textSecondary}
              />
            </View>
          </View>

          <Button
            title="Calculate Payment"
            onPress={calculateFinancing}
            variant="primary"
            style={styles.calculateButton}
          />

          {financeResult && (
            <View style={styles.financeResults}>
              <View style={styles.financeResultItem}>
                <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                  Monthly Payment
                </Text>
                <Text style={[styles.resultValue, { color: colors.primary }]}>
                  {formatPrice(financeResult.monthlyPayment)}
                </Text>
              </View>

              <View style={styles.financeResultItem}>
                <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                  Total Interest
                </Text>
                <Text style={[styles.resultValue, { color: colors.text }]}>
                  {formatPrice(financeResult.totalInterest)}
                </Text>
              </View>

              <View style={styles.financeResultItem}>
                <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                  Total Cost
                </Text>
                <Text style={[styles.resultValue, { color: colors.text }]}>
                  {formatPrice(financeResult.totalCost)}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}
    </Card>
  );

  const renderDealerInfo = () => (
    <Card style={styles.dealerCard}>
      <View style={styles.dealerHeader}>
        <View style={styles.dealerInfo}>
          <View style={styles.dealerNameContainer}>
            <Text style={[styles.dealerName, { color: colors.text }]}>
              {dealerInfo.name}
            </Text>
            {dealerInfo.verified && (
              <Shield color={colors.success} size={16} />
            )}
          </View>
          
          <View style={styles.dealerRating}>
            <Star color={colors.warning} size={16} fill={colors.warning} />
            <Text style={[styles.dealerRatingText, { color: colors.text }]}>
              {dealerInfo.rating} ({dealerInfo.reviewCount} reviews)
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.dealerAddress, { color: colors.textSecondary }]}>
        {dealerInfo.address}
      </Text>
      
      <Text style={[styles.dealerHours, { color: colors.textSecondary }]}>
        {dealerInfo.hours}
      </Text>

      <View style={styles.dealerActions}>
        <Button
          title="Call Dealer"
          onPress={() => handleContactDealer('phone')}
          variant="primary"
          style={styles.dealerButton}
        />
        
        <Button
          title="Email Inquiry"
          onPress={() => handleContactDealer('email')}
          variant="secondary"
          style={styles.dealerButton}
        />
      </View>
    </Card>
  );

  const renderSimilarCars = () => (
    <View style={styles.similarCarsSection}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Similar Cars You Might Like
      </Text>
      
      <FlatList
        data={similarCars}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.similarCarItem}>
            <CarCard 
              car={item} 
              onPress={() => router.push(`/car/${item.id}`)}
            />
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.similarCarsList}
      />
    </View>
  );

  const renderImageModal = () => (
    <Modal
      visible={showImageModal}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => setShowImageModal(false)}
    >
      <View style={styles.imageModalContainer}>
        <TouchableOpacity
          style={styles.imageModalClose}
          onPress={() => setShowImageModal(false)}
        >
          <X color={colors.white} size={24} />
        </TouchableOpacity>

        <FlatList
          data={car?.images || []}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={currentImageIndex}
          getItemLayout={(data, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          renderItem={({ item }) => (
            <View style={styles.fullScreenImageContainer}>
              <Image
                source={{ uri: item }}
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            </View>
          )}
          keyExtractor={(item, index) => index.toString()}
        />
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSpinner size="large" />
      </SafeAreaView>
    );
  }

  if (error || !car) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title="Car Not Found"
          message="Sorry, we couldn't find the car you're looking for."
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderImageGallery()}
        {renderCarInfo()}
        {renderFeatures()}
        {renderFinanceCalculator()}
        {renderDealerInfo()}
        {renderSimilarCars()}
        
        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      
      {renderImageModal()}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  imageGalleryContainer: {
    height: 300,
    position: 'relative',
  },
  carImage: {
    width: width,
    height: 300,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  imageIndicators: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  imageCounter: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  imageCounterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  imageActions: {
    position: 'absolute',
    top: 20,
    left: 20,
    gap: 12,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  infoCard: {
    margin: Spacing.lg,
    padding: Spacing.lg,
  },
  carHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  carTitleContainer: {
    flex: 1,
  },
  carTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  carSubtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  priceContainer: {
    marginBottom: Spacing.lg,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  priceChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceChange: {
    fontSize: 14,
    fontWeight: '500',
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  specItem: {
    alignItems: 'center',
    minWidth: 80,
    gap: 4,
  },
  specLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  featuresCard: {
    margin: Spacing.lg,
    marginTop: 0,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  featuresGrid: {
    gap: Spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureText: {
    fontSize: 16,
    fontWeight: '500',
  },
  financeCard: {
    margin: Spacing.lg,
    marginTop: 0,
    padding: Spacing.lg,
  },
  financeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  financeContent: {
    marginTop: Spacing.lg,
  },
  financeInputs: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  financeInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    fontSize: 16,
  },
  calculateButton: {
    marginBottom: Spacing.lg,
  },
  financeResults: {
    gap: Spacing.md,
  },
  financeResultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  resultValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  dealerCard: {
    margin: Spacing.lg,
    marginTop: 0,
    padding: Spacing.lg,
  },
  dealerHeader: {
    marginBottom: Spacing.md,
  },
  dealerInfo: {
    gap: Spacing.xs,
  },
  dealerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  dealerName: {
    fontSize: 18,
    fontWeight: '700',
  },
  dealerRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dealerRatingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dealerAddress: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
  dealerHours: {
    fontSize: 14,
    marginBottom: Spacing.lg,
  },
  dealerActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  dealerButton: {
    flex: 1,
  },
  similarCarsSection: {
    margin: Spacing.lg,
    marginTop: 0,
  },
  similarCarsList: {
    paddingRight: Spacing.lg,
  },
  similarCarItem: {
    marginRight: Spacing.md,
    width: 280,
  },
  imageModalContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImageContainer: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: width,
    height: height * 0.8,
  },
  bottomSpacing: {
    height: 40,
  },
});
