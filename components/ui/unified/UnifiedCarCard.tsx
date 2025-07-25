import React, { memo, useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
  Pressable,
  ViewStyle,
  ImageStyle,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useThemeColors } from '../../hooks/useTheme';
import { Spacing, Typography, BorderRadius } from '../../constants/Colors';
import { getPlatformShadow } from '../../constants/PlatformOptimizations';
import { Heart, MapPin, Calendar, Gauge, Star, Settings, Fuel } from '@/utils/ultra-optimized-icons';
import { OptimizedImage } from './OptimizedImage';
import { useMemoryOptimization } from '@/hooks/useMemoryOptimization';
import { usePerformanceMonitor } from '../../src/utils/performance';
import { formatPrice, formatMileage, formatDate, formatCondition, formatFuelType } from '@/utils/dataTransformers';

const { width } = Dimensions.get('window');
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Base car interface that covers all variations
interface BaseCar {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  images: string[];
}

// Extended car interface for more detailed cards
interface ExtendedCar extends BaseCar {
  mileage?: number;
  location?: string;
  isSaved?: boolean;
  dealer?: {
    name: string;
    verified?: boolean;
  };
  rating?: number;
  features?: string[];
  priceRange?: string;
  bodyStyle?: string;
  fuelEfficiency?: number;
  safetyRating?: number;
  condition?: string;
  fuelType?: string;
  transmission?: string;
}

type CardVariant = 'compact' | 'standard' | 'premium' | 'ultra-premium' | 'optimized';

interface UnifiedCarCardProps {
  car: BaseCar | ExtendedCar;
  onPress: () => void;
  
  // Variant configuration
  variant?: CardVariant;
  
  // Layout options
  width?: number;
  height?: number;
  
  // Feature toggles
  showSaveButton?: boolean;
  showDealer?: boolean;
  showRating?: boolean;
  showFeatures?: boolean;
  showLocation?: boolean;
  showCondition?: boolean;
  showMileage?: boolean;
  
  // Interaction handlers
  onSave?: () => void;
  onShare?: () => void;
  onCompare?: () => void;
  
  // State
  isSaved?: boolean;
  isComparing?: boolean;
  
  // Performance
  priority?: boolean;
  index?: number;
  
  // Styling
  style?: ViewStyle;
  testID?: string;
  
  // Accessibility
  position?: { setIndex: number; setSize: number };
}

export const UnifiedCarCard: React.FC<UnifiedCarCardProps> = memo(({
  car,
  onPress,
  variant = 'standard',
  width: customWidth,
  height: customHeight,
  showSaveButton = true,
  showDealer = true,
  showRating = true,
  showFeatures = false,
  showLocation = true,
  showCondition = false,
  showMileage = true,
  onSave,
  onShare,
  onCompare,
  isSaved = false,
  isComparing = false,
  priority = false,
  index = 0,
  style,
  testID = 'car-card',
  position,
}) => {
  const { colors } = useThemeColors();
  const { trackMetric } = usePerformanceMonitor();
  
  // State
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isSavedState, setIsSavedState] = useState(isSaved);
  
  // Refs
  const renderStart = useRef<number>();
  
  // Memory optimization
  useMemoryOptimization();
  
  // Animations
  const scale = useSharedValue(1);
  const saveScale = useSharedValue(1);
  const opacity = useSharedValue(priority ? 1 : 0);
  
  // Performance tracking
  useEffect(() => {
    renderStart.current = Date.now();
    
    return () => {
      if (renderStart.current) {
        const renderTime = Date.now() - renderStart.current;
        trackMetric('car_card_render', renderTime, {
          good: 50,
          needsImprovement: 100
        }, { 
          variant, 
          index,
          priority 
        });
      }
    };
  }, [trackMetric, variant, index, priority]);

  // Lazy loading animation
  useEffect(() => {
    if (!priority) {
      const timer = setTimeout(() => {
        opacity.value = withTiming(1, { duration: 300 });
      }, index * 50); // Stagger animations
      
      return () => clearTimeout(timer);
    }
  }, [opacity, priority, index]);

  // Dimension calculations based on variant
  const dimensions = useMemo(() => {
    const baseWidth = customWidth || width - (Spacing.lg * 2);
    let cardWidth = baseWidth;
    let cardHeight = customHeight || 280;
    let imageHeight = 160;

    switch (variant) {
      case 'compact':
        cardWidth = baseWidth / 2 - Spacing.md;
        cardHeight = 220;
        imageHeight = 120;
        break;
      case 'premium':
        cardHeight = 320;
        imageHeight = 180;
        break;
      case 'ultra-premium':
        cardHeight = 360;
        imageHeight = 200;
        break;
      case 'optimized':
        cardWidth = baseWidth;
        cardHeight = 240;
        imageHeight = 140;
        break;
    }

    return { cardWidth, cardHeight, imageHeight };
  }, [variant, customWidth, customHeight, width]);

  // Animated styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const saveButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: saveScale.value }],
  }));

  // Event handlers
  const handlePress = useCallback(() => {
    scale.value = withSpring(0.98, {}, () => {
      scale.value = withSpring(1);
    });
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    trackMetric('car_card_pressed', 1, undefined, { 
      car_id: car.id, 
      variant, 
      position: index 
    });
    
    runOnJS(onPress)();
  }, [scale, onPress, trackMetric, car.id, variant, index]);

  const handleSave = useCallback(() => {
    saveScale.value = withSpring(0.9, {}, () => {
      saveScale.value = withSpring(1);
    });
    
    setIsSavedState(!isSavedState);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    trackMetric('car_saved', 1, undefined, { 
      car_id: car.id, 
      action: !isSavedState ? 'save' : 'unsave' 
    });
    
    if (onSave) onSave();
  }, [saveScale, isSavedState, onSave, trackMetric, car.id]);

  // Memoized components based on variant
  const CardImage = useMemo(() => {
    const imageSource = car.images?.[0] || '';
    
    if (variant === 'optimized') {
      return (
        <OptimizedImage
          source={{ uri: imageSource }}
          style={{ ...styles.image, height: dimensions.imageHeight } as ImageStyle}
          priority={priority ? 'high' : 'normal'}
          lazy={!priority}
          quality="medium"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      );
    }

    return (
      <FastImage
        source={{ 
          uri: imageSource,
          priority: priority ? FastImage.priority.high : FastImage.priority.normal,
        }}
        style={[styles.image, { height: dimensions.imageHeight }]}
        resizeMode={FastImage.resizeMode.cover}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
    );
  }, [car.images, variant, dimensions.imageHeight, priority]);

  const SaveButton = useMemo(() => {
    if (!showSaveButton) return null;

    return (
      <Animated.View style={[styles.saveButton, saveButtonStyle]}>
        <TouchableOpacity
          onPress={handleSave}
          style={[
            styles.saveButtonInner,
            isSavedState && styles.saveButtonActive
          ]}
        >
          <Heart 
            size={16} 
            color={isSavedState ? colors.error : colors.textSecondary}
            filled={isSavedState}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  }, [showSaveButton, saveButtonStyle, handleSave, isSavedState, colors]);

  const CarInfo = useMemo(() => {
    const extendedCar = car as ExtendedCar;

    return (
      <View style={styles.infoContainer}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {car.year} {car.make} {car.model}
        </Text>
        
        <Text style={[styles.price, { color: colors.primary }]}>
          {formatPrice(car.price)}
        </Text>

        {variant !== 'compact' && (
          <View style={styles.detailsRow}>
            {showMileage && extendedCar.mileage && (
              <View style={styles.detailItem}>
                <Gauge size={12} color={colors.textSecondary} />
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  {formatMileage(extendedCar.mileage)}
                </Text>
              </View>
            )}
            
            {showLocation && extendedCar.location && (
              <View style={styles.detailItem}>
                <MapPin size={12} color={colors.textSecondary} />
                <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                  {extendedCar.location}
                </Text>
              </View>
            )}
          </View>
        )}

        {variant === 'premium' || variant === 'ultra-premium' ? (
          <View style={styles.premiumDetails}>
            {showRating && extendedCar.rating && (
              <View style={styles.ratingContainer}>
                <Star size={14} color={colors.warning} />
                <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                  {extendedCar.rating.toFixed(1)}
                </Text>
              </View>
            )}

            {showDealer && extendedCar.dealer && (
              <Text style={[styles.dealerText, { color: colors.textMuted }]}>
                {extendedCar.dealer.name}
                {extendedCar.dealer.verified && ' ✓'}
              </Text>
            )}

            {showFeatures && extendedCar.features && extendedCar.features.length > 0 && (
              <View style={styles.featuresContainer}>
                {extendedCar.features.slice(0, 3).map((feature, idx) => (
                  <View key={idx} style={[styles.featureChip, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.featureText, { color: colors.primary }]}>
                      {feature}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ) : null}
      </View>
    );
  }, [car, variant, colors, showMileage, showLocation, showRating, showDealer, showFeatures]);

  const GradientOverlay = useMemo(() => {
    if (variant !== 'ultra-premium') return null;

    return (
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)']}
        style={styles.gradientOverlay}
        pointerEvents="none"
      />
    );
  }, [variant]);

  return (
    <Animated.View
      style={[
        styles.container,
        { 
          width: dimensions.cardWidth, 
          height: dimensions.cardHeight,
          backgroundColor: colors.cardBackground,
          ...getPlatformShadow(2),
        },
        cardAnimatedStyle,
        style,
      ]}
      testID={testID}
    >
      <AnimatedPressable
        style={styles.pressable}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${car.year} ${car.make} ${car.model}, priced at ${formatPrice(car.price)}`}
        accessibilityHint="Tap to view car details"
      >
        <View style={styles.imageContainer}>
          {CardImage}
          {GradientOverlay}
          {SaveButton}
        </View>
        
        {CarInfo}
      </AnimatedPressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  pressable: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    backgroundColor: '#f0f0f0',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  saveButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  saveButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
  infoContainer: {
    padding: Spacing.md,
    flex: 1,
  },
  title: {
    fontSize: Typography.subtitle.fontSize,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  price: {
    fontSize: Typography.xl.fontSize,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    fontSize: Typography.caption.fontSize,
  },
  premiumDetails: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ratingText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '500',
  },
  dealerText: {
    fontSize: Typography.caption.fontSize,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  featureChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  featureText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: '500',
  },
});

// Export with display name for debugging
UnifiedCarCard.displayName = 'UnifiedCarCard';

export { UnifiedCarCard as CarCard };
export default UnifiedCarCard;
