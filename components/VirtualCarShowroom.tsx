/**
 * Virtual Car Showroom - Phase 3
 * Immersive car viewing experience with AR/VR capabilities (placeholder)
 * The most advanced car visualization on the market
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  useSharedValue,
  interpolate,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Car } from '@/types/database';
import { useThemeColors } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';
import AdvancedAnalyticsService from '@/services/advancedAnalyticsService';

const { width, height } = Dimensions.get('window');

interface VirtualCarShowroomProps {
  car: Car;
  onBack: () => void;
  onConfigureFinancing?: (config: CarConfiguration) => void;
}

interface CarConfiguration {
  exteriorColor: string;
  interiorColor: string;
  wheels: string;
  packages: string[];
  totalPrice: number;
}

interface ViewingAngle {
  id: string;
  name: string;
  description: string;
  icon: string;
  premium?: boolean;
}

interface Environment {
  id: string;
  name: string;
  description: string;
  lighting: string;
  background: string;
  premium?: boolean;
}

interface CarFeature {
  id: string;
  name: string;
  description: string;
  type: 'exterior' | 'interior' | 'performance' | 'safety';
  position: [number, number, number];
  highlighted: boolean;
}

const VirtualCarShowroom: React.FC<VirtualCarShowroomProps> = ({
  car,
  onBack,
  onConfigureFinancing,
}) => {
  const colors = useThemeColors();
  const styles = getStyles(colors);
  const analytics = AdvancedAnalyticsService.getInstance();

  // State management
  const [viewMode, setViewMode] = useState<'3d' | 'ar' | 'vr'>('3d');
  const [currentAngle, setCurrentAngle] = useState<string>('front');
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('studio');
  const [highlightedFeature, setHighlightedFeature] = useState<string | null>(null);
  const [showFeatures, setShowFeatures] = useState(true);
  const [configuration, setConfiguration] = useState<CarConfiguration>({
    exteriorColor: 'Pearl White',
    interiorColor: 'Black',
    wheels: 'Standard',
    packages: [],
    totalPrice: car.price || 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showroomStats, setShowroomStats] = useState({
    totalViews: 0,
    averageTime: 0,
    featureInteractions: 0,
    configurationChanges: 0,
  });

  // Animation values
  const rotationY = useSharedValue(0);
  const scale = useSharedValue(1);
  const featureOpacity = useSharedValue(1);

  // Viewing angles
  const viewingAngles: ViewingAngle[] = [
    { id: 'front', name: 'Front View', description: 'Classic front perspective', icon: '🚗' },
    { id: 'rear', name: 'Rear View', description: 'Taillight and exhaust view', icon: '🔄' },
    { id: 'side', name: 'Side Profile', description: 'Complete side silhouette', icon: '📏' },
    { id: 'interior', name: 'Interior', description: 'Cabin and dashboard', icon: '🪑' },
    { id: '360', name: '360° View', description: 'Complete rotation', icon: '🔄', premium: true },
    { id: 'engine', name: 'Engine Bay', description: 'Under the hood', icon: '⚙️', premium: true },
    { id: 'undercarriage', name: 'Undercarriage', description: 'Chassis view', icon: '🔧', premium: true },
  ];

  // Environment presets
  const environments: Environment[] = [
    { id: 'studio', name: 'Studio', description: 'Clean white studio', lighting: 'bright', background: '#ffffff' },
    { id: 'showroom', name: 'Showroom', description: 'Luxury dealership', lighting: 'warm', background: '#f8f9fa' },
    { id: 'garage', name: 'Garage', description: 'Home garage setting', lighting: 'cool', background: '#e9ecef' },
    { id: 'street', name: 'Street', description: 'Urban environment', lighting: 'natural', background: '#6c757d', premium: true },
    { id: 'racetrack', name: 'Racetrack', description: 'Performance setting', lighting: 'dramatic', background: '#495057', premium: true },
    { id: 'sunset', name: 'Sunset Drive', description: 'Golden hour magic', lighting: 'golden', background: '#fd7e14', premium: true },
  ];

  // Car features for highlighting
  const carFeatures: CarFeature[] = [
    { id: 'headlights', name: 'LED Headlights', description: 'Adaptive LED lighting system', type: 'exterior', position: [2, 0.5, 0.8], highlighted: false },
    { id: 'grille', name: 'Front Grille', description: 'Signature design element', type: 'exterior', position: [2.2, 0, 0], highlighted: false },
    { id: 'wheels', name: 'Alloy Wheels', description: 'Performance wheel design', type: 'exterior', position: [1.5, -0.5, 1.2], highlighted: false },
    { id: 'mirrors', name: 'Side Mirrors', description: 'Heated power mirrors', type: 'exterior', position: [1, 0.8, 1.5], highlighted: false },
    { id: 'dashboard', name: 'Dashboard', description: 'Digital instrument cluster', type: 'interior', position: [0, 0.5, 0], highlighted: false },
    { id: 'seats', name: 'Seats', description: 'Premium leather seating', type: 'interior', position: [0, 0, 0.5], highlighted: false },
    { id: 'infotainment', name: 'Infotainment', description: 'Touchscreen display', type: 'interior', position: [0.5, 0.3, 0], highlighted: false },
    { id: 'engine', name: 'Engine', description: 'Turbocharged powerplant', type: 'performance', position: [1.8, 0.3, 0], highlighted: false },
  ];

  useEffect(() => {
    initializeShowroom();
  }, []);

  const initializeShowroom = async () => {
    setIsLoading(true);
    
    try {
      // Track showroom entry
      await analytics.trackEvent('view', {
        carId: car.id,
        carBrand: car.make,
        carModel: car.model,
        viewMode: '3d',
      });

      // Load showroom statistics
      const stats = await loadShowroomStats();
      setShowroomStats(stats);

      // Initialize 3D scene (placeholder)
      await initializeVirtual3DScene();
      
    } catch (error) {
      logger.error('Failed to initialize showroom:', error);
      Alert.alert('Error', 'Failed to load virtual showroom');
    } finally {
      setIsLoading(false);
    }
  };

  const loadShowroomStats = async () => {
    // Simulate loading showroom statistics
    return {
      totalViews: Math.floor(Math.random() * 1000) + 500,
      averageTime: Math.floor(Math.random() * 300) + 180,
      featureInteractions: Math.floor(Math.random() * 50) + 25,
      configurationChanges: Math.floor(Math.random() * 20) + 10,
    };
  };

  const initializeVirtual3DScene = async () => {
    // Placeholder for 3D scene initialization
    // In a real implementation, this would load 3D models, textures, etc.
    logger.debug('Initializing virtual 3D scene for', car.make, car.model);
  };

  const handleViewModeChange = (mode: '3d' | 'ar' | 'vr') => {
    setViewMode(mode);
    analytics.trackEvent('view', {
      carId: car.id,
      fromMode: viewMode,
      toMode: mode,
    });

    if (mode === 'ar' || mode === 'vr') {
      Alert.alert(
        'Premium Feature',
        `${mode.toUpperCase()} mode is coming soon! Experience cars in augmented and virtual reality.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleAngleChange = (angleId: string) => {
    const angle = viewingAngles.find(a => a.id === angleId);
    if (angle?.premium) {
      Alert.alert(
        'Premium Feature',
        'Premium viewing angles coming soon! Get access to engine bay, undercarriage, and 360° views.',
        [{ text: 'OK' }]
      );
      return;
    }

    setCurrentAngle(angleId);
    
    // Animate rotation
    const rotations = {
      front: 0,
      rear: Math.PI,
      side: Math.PI / 2,
      interior: 0,
    };
    
    rotationY.value = withSpring(rotations[angleId as keyof typeof rotations] || 0);
    
    analytics.trackEvent('view', {
      carId: car.id,
      angle: angleId,
    });
  };

  const handleEnvironmentChange = (envId: string) => {
    const env = environments.find(e => e.id === envId);
    if (env?.premium) {
      Alert.alert(
        'Premium Feature',
        'Premium environments coming soon! Place your car in realistic settings like streets, racetracks, and golden hour scenes.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedEnvironment(envId);
    analytics.trackEvent('view', {
      carId: car.id,
      environment: envId,
    });
  };

  const handleFeatureHighlight = (featureId: string) => {
    setHighlightedFeature(highlightedFeature === featureId ? null : featureId);
    
    // Animate feature highlighting
    featureOpacity.value = withTiming(highlightedFeature === featureId ? 0.5 : 1, {
      duration: 300,
    });

    analytics.trackEvent('view', {
      carId: car.id,
      featureId,
      highlighted: highlightedFeature !== featureId,
    });
  };

  const handleConfigurationChange = (key: keyof CarConfiguration, value: any) => {
    setConfiguration(prev => {
      const newConfig = { ...prev, [key]: value };
      
      // Recalculate price based on configuration
      newConfig.totalPrice = calculateConfigurationPrice(newConfig);
      
      analytics.trackEvent('view', {
        carId: car.id,
        configurationKey: key,
        value: value,
        newTotalPrice: newConfig.totalPrice,
      });

      return newConfig;
    });
  };

  const calculateConfigurationPrice = (config: CarConfiguration): number => {
    let basePrice = car.price || 0;
    
    // Add premiums for upgrades
    const premiums = {
      exteriorColor: config.exteriorColor === 'Pearl White' ? 0 : 1500,
      interiorColor: config.interiorColor === 'Black' ? 0 : 2000,
      wheels: config.wheels === 'Standard' ? 0 : 3000,
      packages: config.packages.length * 2500,
    };

    return basePrice + Object.values(premiums).reduce((sum, premium) => sum + premium, 0);
  };

  const handleARView = () => {
    Alert.alert(
      'AR Experience Coming Soon!',
      'Place this car in your driveway, garage, or any space using augmented reality. See how it looks in your environment before you buy.',
      [{ text: 'Notify Me', onPress: () => {} }, { text: 'OK' }]
    );
  };

  const handleVRExperience = () => {
    Alert.alert(
      'VR Experience Coming Soon!',
      'Take a virtual test drive and explore every detail in immersive virtual reality. Feel like you\'re sitting inside the car.',
      [{ text: 'Notify Me', onPress: () => {} }, { text: 'OK' }]
    );
  };

  // Animated styles
  const carAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${rotationY.value}rad` },
      { scale: scale.value },
    ],
  }));

  const featureAnimatedStyle = useAnimatedStyle(() => ({
    opacity: featureOpacity.value,
  }));

  const renderViewingControls = () => (
    <View style={styles.controlsContainer}>
      <Text style={styles.controlsTitle}>Viewing Angle</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.anglesList}>
        {viewingAngles.map((angle) => (
          <TouchableOpacity
            key={angle.id}
            style={[
              styles.angleButton,
              currentAngle === angle.id && styles.angleButtonActive,
              angle.premium && styles.premiumButton,
            ]}
            onPress={() => handleAngleChange(angle.id)}
          >
            <Text style={styles.angleIcon}>{angle.icon}</Text>
            <Text style={[
              styles.angleText,
              currentAngle === angle.id && styles.angleTextActive,
              angle.premium && styles.premiumText,
            ]}>
              {angle.name}
            </Text>
            {angle.premium && <Text style={styles.premiumBadge}>PRO</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderEnvironmentControls = () => (
    <View style={styles.controlsContainer}>
      <Text style={styles.controlsTitle}>Environment</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.environmentsList}>
        {environments.map((env) => (
          <TouchableOpacity
            key={env.id}
            style={[
              styles.environmentButton,
              selectedEnvironment === env.id && styles.environmentButtonActive,
              env.premium && styles.premiumButton,
            ]}
            onPress={() => handleEnvironmentChange(env.id)}
          >
            <View style={[styles.environmentPreview, { backgroundColor: env.background }]} />
            <Text style={[
              styles.environmentText,
              selectedEnvironment === env.id && styles.environmentTextActive,
              env.premium && styles.premiumText,
            ]}>
              {env.name}
            </Text>
            {env.premium && <Text style={styles.premiumBadge}>PRO</Text>}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderFeatureHighlights = () => (
    <View style={styles.featuresContainer}>
      <View style={styles.featuresHeader}>
        <Text style={styles.featuresTitle}>Car Features</Text>
        <TouchableOpacity
          onPress={() => setShowFeatures(!showFeatures)}
          style={styles.toggleButton}
        >
          <Text style={styles.toggleText}>{showFeatures ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>
      
      {showFeatures && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuresList}>
          {carFeatures.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={[
                styles.featureButton,
                highlightedFeature === feature.id && styles.featureButtonActive,
              ]}
              onPress={() => handleFeatureHighlight(feature.id)}
            >
              <Text style={styles.featureType}>{feature.type.toUpperCase()}</Text>
              <Text style={[
                styles.featureName,
                highlightedFeature === feature.id && styles.featureNameActive,
              ]}>
                {feature.name}
              </Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderConfigurationPanel = () => (
    <View style={styles.configContainer}>
      <Text style={styles.configTitle}>Customize Your {car.make} {car.model}</Text>
      
      <View style={styles.configSection}>
        <Text style={styles.configSectionTitle}>Exterior Color</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['Pearl White', 'Midnight Black', 'Steel Gray', 'Racing Red', 'Ocean Blue'].map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                configuration.exteriorColor === color && styles.colorOptionActive,
              ]}
              onPress={() => handleConfigurationChange('exteriorColor', color)}
            >
              <View style={[styles.colorSwatch, { backgroundColor: getColorHex(color) }]} />
              <Text style={styles.colorName}>{color}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.configSection}>
        <Text style={styles.configSectionTitle}>Interior</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['Black', 'Tan', 'Gray', 'Red'].map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.interiorOption,
                configuration.interiorColor === color && styles.interiorOptionActive,
              ]}
              onPress={() => handleConfigurationChange('interiorColor', color)}
            >
              <Text style={styles.interiorName}>{color} Interior</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.priceContainer}>
        <Text style={styles.priceLabel}>Total Price</Text>
        <Text style={styles.priceValue}>${configuration.totalPrice.toLocaleString()}</Text>
      </View>

      {onConfigureFinancing && (
        <TouchableOpacity
          style={styles.financingButton}
          onPress={() => onConfigureFinancing(configuration)}
        >
          <Text style={styles.financingButtonText}>Configure Financing</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderVirtualDisplay = () => {
    const currentEnv = environments.find(e => e.id === selectedEnvironment);
    
    return (
      <View style={[styles.virtualDisplay, { backgroundColor: currentEnv?.background || '#ffffff' }]}>
        <Animated.View style={[styles.carContainer, carAnimatedStyle]}>
          {/* 3D Car Placeholder */}
          <View style={styles.carPlaceholder}>
            <Text style={styles.carPlaceholderText}>🚗</Text>
            <Text style={styles.carModelText}>{car.make} {car.model}</Text>
            <Text style={styles.carViewModeText}>{currentAngle.toUpperCase()} VIEW</Text>
          </View>
          
          {/* Feature Hotspots */}
          {showFeatures && (
            <Animated.View style={[styles.featureHotspots, featureAnimatedStyle]}>
              {carFeatures.map((feature) => (
                <TouchableOpacity
                  key={feature.id}
                  style={[
                    styles.featureHotspot,
                    highlightedFeature === feature.id && styles.featureHotspotActive,
                  ]}
                  onPress={() => handleFeatureHighlight(feature.id)}
                >
                  <View style={styles.featureDot} />
                  {highlightedFeature === feature.id && (
                    <View style={styles.featureTooltip}>
                      <Text style={styles.featureTooltipText}>{feature.name}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
        </Animated.View>
      </View>
    );
  };

  const getColorHex = (colorName: string): string => {
    const colors: { [key: string]: string } = {
      'Pearl White': '#f8f9fa',
      'Midnight Black': '#212529',
      'Steel Gray': '#6c757d',
      'Racing Red': '#dc3545',
      'Ocean Blue': '#0d6efd',
    };
    return colors[colorName] || '#f8f9fa';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Virtual Showroom...</Text>
          <Text style={styles.loadingSubtext}>Preparing 3D experience</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Virtual Showroom</Text>
          <Text style={styles.headerSubtitle}>{car.make} {car.model}</Text>
        </View>

        <View style={styles.viewModeSelector}>
          {(['3d', 'ar', 'vr'] as const).map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.viewModeButton,
                viewMode === mode && styles.viewModeButtonActive,
              ]}
              onPress={() => handleViewModeChange(mode)}
            >
              <Text style={[
                styles.viewModeText,
                viewMode === mode && styles.viewModeTextActive,
              ]}>
                {mode.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Virtual Display */}
      {renderVirtualDisplay()}

      {/* Controls */}
      <ScrollView style={styles.controlsScrollView}>
        {renderViewingControls()}
        {renderEnvironmentControls()}
        {renderFeatureHighlights()}
        {renderConfigurationPanel()}
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton} onPress={handleARView}>
          <Text style={styles.actionButtonText}>📱 AR View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleVRExperience}>
          <Text style={styles.actionButtonText}>🥽 VR Experience</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    ...Typography.pageTitle,
    color: colors.text,
    marginBottom: Spacing.md,
  },
  loadingSubtext: {
    ...Typography.bodyText,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: Spacing.sm,
  },
  backButtonText: {
    ...Typography.bodyText,
    color: colors.primary,
    fontWeight: '600',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...Typography.sectionTitle,
    color: colors.text,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...Typography.bodyText,
    color: colors.textSecondary,
  },
  viewModeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.md,
    padding: 2,
  },
  viewModeButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  viewModeButtonActive: {
    backgroundColor: colors.primary,
  },
  viewModeText: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: 10,
  },
  viewModeTextActive: {
    color: colors.background,
  },
  virtualDisplay: {
    height: height * 0.4,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  carContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  carPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  carPlaceholderText: {
    fontSize: 120,
    marginBottom: Spacing.md,
  },
  carModelText: {
    ...Typography.pageTitle,
    fontWeight: '700',
    color: '#333',
    marginBottom: Spacing.xs,
  },
  carViewModeText: {
    ...Typography.bodyText,
    color: '#666',
    fontWeight: '600',
  },
  featureHotspots: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  featureHotspot: {
    position: 'absolute',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    top: '50%',
    left: '50%',
    marginTop: -15,
    marginLeft: -15,
  },
  featureHotspotActive: {
    transform: [{ scale: 1.2 }],
  },
  featureDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
    borderWidth: 2,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  featureTooltip: {
    position: 'absolute',
    top: -40,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    minWidth: 100,
    alignItems: 'center',
  },
  featureTooltipText: {
    ...Typography.bodySmall,
    color: '#ffffff',
    fontWeight: '600',
  },
  controlsScrollView: {
    flex: 1,
  },
  controlsContainer: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  controlsTitle: {
    ...Typography.sectionTitle,
    color: colors.text,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  anglesList: {
    flexDirection: 'row',
  },
  angleButton: {
    alignItems: 'center',
    padding: Spacing.md,
    marginRight: Spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.md,
    minWidth: 80,
    position: 'relative',
  },
  angleButtonActive: {
    backgroundColor: colors.primary,
  },
  premiumButton: {
    borderWidth: 1,
    borderColor: '#ffd700',
  },
  angleIcon: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  angleText: {
    ...Typography.bodySmall,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  angleTextActive: {
    color: colors.background,
  },
  premiumText: {
    color: '#ffd700',
  },
  premiumBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ffd700',
    color: '#000',
    fontSize: 8,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
  },
  environmentsList: {
    flexDirection: 'row',
  },
  environmentButton: {
    alignItems: 'center',
    padding: Spacing.md,
    marginRight: Spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.md,
    minWidth: 80,
    position: 'relative',
  },
  environmentButtonActive: {
    backgroundColor: colors.primary,
  },
  environmentPreview: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: Spacing.xs,
    borderWidth: 2,
    borderColor: colors.border,
  },
  environmentText: {
    ...Typography.bodySmall,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  environmentTextActive: {
    color: colors.background,
  },
  featuresContainer: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  featuresHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  featuresTitle: {
    ...Typography.sectionTitle,
    color: colors.text,
    fontWeight: '600',
  },
  toggleButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.sm,
  },
  toggleText: {
    ...Typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
  featuresList: {
    flexDirection: 'row',
  },
  featureButton: {
    padding: Spacing.md,
    marginRight: Spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.md,
    minWidth: 120,
    maxWidth: 160,
  },
  featureButtonActive: {
    backgroundColor: colors.primary,
  },
  featureType: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  featureName: {
    ...Typography.bodyText,
    color: colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  featureNameActive: {
    color: colors.background,
  },
  featureDescription: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  configContainer: {
    padding: Spacing.md,
  },
  configTitle: {
    ...Typography.sectionTitle,
    color: colors.text,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  configSection: {
    marginBottom: Spacing.lg,
  },
  configSectionTitle: {
    ...Typography.sectionTitle,
    color: colors.text,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  colorOption: {
    alignItems: 'center',
    marginRight: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.md,
    minWidth: 80,
  },
  colorOptionActive: {
    backgroundColor: colors.primary,
  },
  colorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: Spacing.xs,
    borderWidth: 2,
    borderColor: colors.border,
  },
  colorName: {
    ...Typography.bodySmall,
    color: colors.text,
    textAlign: 'center',
  },
  interiorOption: {
    padding: Spacing.md,
    marginRight: Spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.md,
    minWidth: 100,
  },
  interiorOptionActive: {
    backgroundColor: colors.primary,
  },
  interiorName: {
    ...Typography.bodyText,
    color: colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
  },
  priceLabel: {
    ...Typography.sectionTitle,
    color: colors.text,
    fontWeight: '600',
  },
  priceValue: {
    ...Typography.pageTitle,
    color: colors.primary,
    fontWeight: '700',
  },
  financingButton: {
    backgroundColor: colors.primary,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  financingButtonText: {
    ...Typography.bodyLarge,
    color: colors.background,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  actionButtonText: {
    ...Typography.bodyText,
    color: colors.text,
    fontWeight: '600',
  },
});

export default VirtualCarShowroom;
