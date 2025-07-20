import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useThemeColors } from '@/hooks/useTheme';
import { CarUserPreferences } from '@/services/enhancedAuthService';
import { Car, MapPin, DollarSign, Fuel, Settings, CheckCircle, ArrowRight, Zap, Truck } from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  component: React.ReactNode;
}

function CarMarketplaceOnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<Partial<CarUserPreferences>>({
    preferredBrands: [],
    budgetRange: { min: 5000, max: 50000 },
    fuelTypes: [],
    bodyTypes: [],
    transmissionTypes: [],
    location: '',
    searchRadius: 25,
    notificationSettings: {
      priceDrops: true,
      newListings: true,
      savedSearchMatches: true,
      dealerMessages: true,
    },
  });
  const [userLocation, setUserLocation] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { completeOnboarding, user } = useAuth();
  const router = useRouter();
  const { colors } = useThemeColors();

  // Car marketplace specific data
  const carBrands = [
    { id: 'bmw', name: 'BMW', popular: true },
    { id: 'mercedes-benz', name: 'Mercedes-Benz', popular: true },
    { id: 'audi', name: 'Audi', popular: true },
    { id: 'toyota', name: 'Toyota', popular: true },
    { id: 'honda', name: 'Honda', popular: true },
    { id: 'volkswagen', name: 'Volkswagen', popular: true },
    { id: 'ford', name: 'Ford', popular: false },
    { id: 'chevrolet', name: 'Chevrolet', popular: false },
    { id: 'nissan', name: 'Nissan', popular: false },
    { id: 'hyundai', name: 'Hyundai', popular: false },
    { id: 'kia', name: 'Kia', popular: false },
    { id: 'tesla', name: 'Tesla', popular: true },
    { id: 'porsche', name: 'Porsche', popular: false },
    { id: 'lexus', name: 'Lexus', popular: false },
    { id: 'infiniti', name: 'Infiniti', popular: false },
  ];

  const fuelTypes = [
    { id: 'petrol', name: 'Petrol', icon: '⛽', popular: true },
    { id: 'diesel', name: 'Diesel', icon: '🛢️', popular: true },
    { id: 'electric', name: 'Electric', icon: '⚡', popular: true },
    { id: 'hybrid', name: 'Hybrid', icon: '🔋', popular: true },
    { id: 'plug-in-hybrid', name: 'Plug-in Hybrid', icon: '🔌', popular: false },
  ];

  const bodyTypes = [
    { id: 'sedan', name: 'Sedan', icon: '🚗', popular: true },
    { id: 'suv', name: 'SUV', icon: '🚙', popular: true },
    { id: 'hatchback', name: 'Hatchback', icon: '🚘', popular: true },
    { id: 'coupe', name: 'Coupe', icon: '🏎️', popular: false },
    { id: 'convertible', name: 'Convertible', icon: '🏖️', popular: false },
    { id: 'wagon', name: 'Wagon', icon: '🚐', popular: false },
    { id: 'pickup', name: 'Pickup', icon: '🚚', popular: false },
    { id: 'van', name: 'Van', icon: '🚛', popular: false },
  ];

  const transmissionTypes = [
    { id: 'automatic', name: 'Automatic', popular: true },
    { id: 'manual', name: 'Manual', popular: true },
    { id: 'cvt', name: 'CVT', popular: false },
  ];

  const updatePreferences = (key: keyof CarUserPreferences, value: any) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleArrayPreference = (key: keyof CarUserPreferences, itemId: string) => {
    const currentArray = (preferences[key] as string[]) || [];
    const updatedArray = currentArray.includes(itemId)
      ? currentArray.filter(id => id !== itemId)
      : [...currentArray, itemId];
    
    updatePreferences(key, updatedArray);
  };

  const nextStep = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Scroll to top of next step
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      await handleCompleteOnboarding();
    }
  };

  const prevStep = async () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!user) {
      Alert.alert('Error', 'User not found. Please try signing in again.');
      return;
    }

    setLoading(true);
    try {
      const onboardingData = {
        preferences,
        location: userLocation,
      };

      const success = await completeOnboarding(onboardingData);
      
      if (success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Welcome to Our Car Marketplace! 🚗',
          'Your account is now set up. Start exploring personalized car recommendations!',
          [
            {
              text: 'Get Started',
              onPress: () => router.replace('/(tabs)'),
            },
          ]
        );
      } else {
        throw new Error('Failed to complete onboarding');
      }
    } catch (error: any) {
      Alert.alert(
        'Setup Error',
        error.message || 'Failed to complete setup. Please try again.'
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  // Brand Selection Component
  const BrandSelection = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Select your favorite car brands to get personalized recommendations
      </Text>
      
      <Text style={[styles.subsectionTitle, { color: colors.text }]}>Popular Brands</Text>
      <View style={styles.optionsGrid}>
        {carBrands.filter(brand => brand.popular).map(brand => (
          <TouchableOpacity
            key={brand.id}
            style={[
              styles.optionChip,
              {
                backgroundColor: preferences.preferredBrands?.includes(brand.name) 
                  ? colors.primaryLight 
                  : colors.cardBackground,
                borderColor: preferences.preferredBrands?.includes(brand.name) 
                  ? colors.primary 
                  : colors.border,
              }
            ]}
            onPress={() => toggleArrayPreference('preferredBrands', brand.name)}
          >
            <Text style={[
              styles.optionText,
              { 
                color: preferences.preferredBrands?.includes(brand.name) 
                  ? colors.primary 
                  : colors.text 
              }
            ]}>
              {brand.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={[styles.subsectionTitle, { color: colors.text }]}>Other Brands</Text>
      <View style={styles.optionsGrid}>
        {carBrands.filter(brand => !brand.popular).map(brand => (
          <TouchableOpacity
            key={brand.id}
            style={[
              styles.optionChip,
              {
                backgroundColor: preferences.preferredBrands?.includes(brand.name) 
                  ? colors.primaryLight 
                  : colors.cardBackground,
                borderColor: preferences.preferredBrands?.includes(brand.name) 
                  ? colors.primary 
                  : colors.border,
              }
            ]}
            onPress={() => toggleArrayPreference('preferredBrands', brand.name)}
          >
            <Text style={[
              styles.optionText,
              { 
                color: preferences.preferredBrands?.includes(brand.name) 
                  ? colors.primary 
                  : colors.text 
              }
            ]}>
              {brand.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Budget Range Component
  const BudgetSelection = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Set your budget range to see cars within your price range
      </Text>
      
      <View style={styles.budgetContainer}>
        <View style={styles.budgetInputContainer}>
          <Text style={[styles.budgetLabel, { color: colors.text }]}>Minimum Budget</Text>
          <View style={styles.budgetInputWrapper}>
            <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>€</Text>
            <TextInput
              style={[styles.budgetInput, { color: colors.text }]}
              value={preferences.budgetRange?.min.toString()}
              onChangeText={(text) => {
                const value = parseInt(text) || 0;
                updatePreferences('budgetRange', { 
                  ...preferences.budgetRange!, 
                  min: value 
                });
              }}
              keyboardType="numeric"
              placeholder="5000"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>

        <View style={styles.budgetInputContainer}>
          <Text style={[styles.budgetLabel, { color: colors.text }]}>Maximum Budget</Text>
          <View style={styles.budgetInputWrapper}>
            <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>€</Text>
            <TextInput
              style={[styles.budgetInput, { color: colors.text }]}
              value={preferences.budgetRange?.max.toString()}
              onChangeText={(text) => {
                const value = parseInt(text) || 0;
                updatePreferences('budgetRange', { 
                  ...preferences.budgetRange!, 
                  max: value 
                });
              }}
              keyboardType="numeric"
              placeholder="50000"
              placeholderTextColor={colors.textSecondary}
            />
          </View>
        </View>
      </View>

      {/* Quick Budget Presets */}
      <Text style={[styles.subsectionTitle, { color: colors.text }]}>Quick Presets</Text>
      <View style={styles.optionsGrid}>
        {[
          { min: 5000, max: 15000, label: 'Under €15k' },
          { min: 15000, max: 30000, label: '€15k - €30k' },
          { min: 30000, max: 50000, label: '€30k - €50k' },
          { min: 50000, max: 100000, label: '€50k - €100k' },
          { min: 100000, max: 500000, label: 'Over €100k' },
        ].map(preset => (
          <TouchableOpacity
            key={`${preset.min}-${preset.max}`}
            style={[
              styles.optionChip,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
              }
            ]}
            onPress={() => updatePreferences('budgetRange', preset)}
          >
            <Text style={[styles.optionText, { color: colors.text }]}>
              {preset.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Fuel Type Selection Component
  const FuelTypeSelection = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Choose your preferred fuel types
      </Text>
      
      <View style={styles.optionsGrid}>
        {fuelTypes.map(fuel => (
          <TouchableOpacity
            key={fuel.id}
            style={[
              styles.optionChip,
              styles.fuelTypeChip,
              {
                backgroundColor: preferences.fuelTypes?.includes(fuel.id) 
                  ? colors.primaryLight 
                  : colors.cardBackground,
                borderColor: preferences.fuelTypes?.includes(fuel.id) 
                  ? colors.primary 
                  : colors.border,
              }
            ]}
            onPress={() => toggleArrayPreference('fuelTypes', fuel.id)}
          >
            <Text style={styles.fuelIcon}>{fuel.icon}</Text>
            <Text style={[
              styles.optionText,
              { 
                color: preferences.fuelTypes?.includes(fuel.id) 
                  ? colors.primary 
                  : colors.text 
              }
            ]}>
              {fuel.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Body Type Selection Component
  const BodyTypeSelection = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Select the car body types you're interested in
      </Text>
      
      <View style={styles.optionsGrid}>
        {bodyTypes.map(body => (
          <TouchableOpacity
            key={body.id}
            style={[
              styles.optionChip,
              styles.bodyTypeChip,
              {
                backgroundColor: preferences.bodyTypes?.includes(body.id) 
                  ? colors.primaryLight 
                  : colors.cardBackground,
                borderColor: preferences.bodyTypes?.includes(body.id) 
                  ? colors.primary 
                  : colors.border,
              }
            ]}
            onPress={() => toggleArrayPreference('bodyTypes', body.id)}
          >
            <Text style={styles.bodyIcon}>{body.icon}</Text>
            <Text style={[
              styles.optionText,
              { 
                color: preferences.bodyTypes?.includes(body.id) 
                  ? colors.primary 
                  : colors.text 
              }
            ]}>
              {body.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Location and Notifications Component
  const LocationAndNotifications = () => (
    <View style={styles.stepContent}>
      <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
        Set your location and notification preferences
      </Text>
      
      <View style={styles.locationContainer}>
        <Text style={[styles.subsectionTitle, { color: colors.text }]}>Your Location</Text>
        <View style={styles.locationInputContainer}>
          <MapPin color={colors.textSecondary} size={20} />
          <TextInput
            style={[styles.locationInput, { color: colors.text }]}
            placeholder="Enter your city or area"
            placeholderTextColor={colors.textSecondary}
            value={userLocation}
            onChangeText={setUserLocation}
            autoCapitalize="words"
          />
        </View>
      </View>

      <View style={styles.notificationsContainer}>
        <Text style={[styles.subsectionTitle, { color: colors.text }]}>Notification Preferences</Text>
        
        {Object.entries({
          priceDrops: { label: 'Price Drop Alerts', icon: '💰', description: 'Get notified when saved cars drop in price' },
          newListings: { label: 'New Listings', icon: '🆕', description: 'See new cars that match your criteria' },
          savedSearchMatches: { label: 'Saved Search Updates', icon: '🔍', description: 'Updates for your saved searches' },
          dealerMessages: { label: 'Dealer Messages', icon: '💬', description: 'Messages from car dealers' },
        }).map(([key, notification]) => (
          <TouchableOpacity
            key={key}
            style={styles.notificationItem}
            onPress={() => {
              const currentSettings = preferences.notificationSettings!;
              updatePreferences('notificationSettings', {
                ...currentSettings,
                [key]: !currentSettings[key as keyof typeof currentSettings],
              });
            }}
          >
            <Text style={styles.notificationIcon}>{notification.icon}</Text>
            <View style={styles.notificationContent}>
              <Text style={[styles.notificationLabel, { color: colors.text }]}>
                {notification.label}
              </Text>
              <Text style={[styles.notificationDescription, { color: colors.textSecondary }]}>
                {notification.description}
              </Text>
            </View>
            <View style={[
              styles.notificationToggle,
              {
                backgroundColor: preferences.notificationSettings?.[key as keyof typeof preferences.notificationSettings]
                  ? colors.primary
                  : colors.border,
              }
            ]}>
              {preferences.notificationSettings?.[key as keyof typeof preferences.notificationSettings] && (
                <CheckCircle color={colors.background} size={16} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const steps: OnboardingStep[] = [
    {
      id: 'brands',
      title: 'Favorite Brands',
      subtitle: 'Choose your preferred car brands',
      icon: <Car color={colors.primary} size={24} />,
      component: <BrandSelection />,
    },
    {
      id: 'budget',
      title: 'Budget Range',
      subtitle: 'Set your price preferences',
      icon: <DollarSign color={colors.primary} size={24} />,
      component: <BudgetSelection />,
    },
    {
      id: 'fuel',
      title: 'Fuel Types',
      subtitle: 'Select preferred fuel options',
      icon: <Fuel color={colors.primary} size={24} />,
      component: <FuelTypeSelection />,
    },
    {
      id: 'body',
      title: 'Car Types',
      subtitle: 'Choose body styles you like',
      icon: <Truck color={colors.primary} size={24} />,
      component: <BodyTypeSelection />,
    },
    {
      id: 'location',
      title: 'Location & Alerts',
      subtitle: 'Set location and notifications',
      icon: <Bell color={colors.primary} size={24} />,
      component: <LocationAndNotifications />,
    },
  ];

  const currentStepData = steps[currentStep];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Progress Header */}
      <View style={styles.header}>
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View 
              style={[
                styles.progressFill,
                { 
                  backgroundColor: colors.primary,
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: colors.textSecondary }]}>
            {currentStep + 1} of {steps.length}
          </Text>
        </View>
      </View>

      {/* Step Content */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.stepHeader}>
          <View style={styles.stepIconContainer}>
            {currentStepData.icon}
          </View>
          <Text style={[styles.stepTitle, { color: colors.text }]}>
            {currentStepData.title}
          </Text>
          <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
            {currentStepData.subtitle}
          </Text>
        </View>

        {currentStepData.component}
      </ScrollView>

      {/* Navigation Footer */}
      <View style={styles.footer}>
        {currentStep > 0 && (
          <Button
            title="Back"
            onPress={prevStep}
            variant="ghost"
            style={styles.backButton}
          />
        )}
        
        <Button
          title={currentStep === steps.length - 1 ? 'Complete Setup' : 'Continue'}
          onPress={nextStep}
          loading={loading}
          style={styles.nextButton}
          icon={currentStep === steps.length - 1 ? <CheckCircle color={colors.background} size={20} /> : <ArrowRight color={colors.background} size={20} />}
        />
      </View>
    </SafeAreaView>
  );
}

export default function WrappedCarMarketplaceOnboardingScreen() {
  return (
    <ErrorBoundary>
      <CarMarketplaceOnboardingScreen />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 60,
  },
  content: {
    flex: 1,
  },
  stepHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  stepIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  stepContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  subsectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    marginTop: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    minWidth: 80,
    alignItems: 'center',
  },
  fuelTypeChip: {
    flexDirection: 'column',
    paddingVertical: 16,
    minWidth: 100,
  },
  bodyTypeChip: {
    flexDirection: 'column',
    paddingVertical: 16,
    minWidth: 100,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  fuelIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  bodyIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  budgetContainer: {
    marginBottom: 24,
  },
  budgetInputContainer: {
    marginBottom: 16,
  },
  budgetLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  budgetInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  budgetInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  locationContainer: {
    marginBottom: 24,
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  notificationsContainer: {
    marginBottom: 24,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  notificationIcon: {
    fontSize: 20,
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  notificationToggle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    gap: 12,
  },
  backButton: {
    flex: 1,
    maxWidth: 100,
  },
  nextButton: {
    flex: 2,
    minHeight: 48,
  },
});
