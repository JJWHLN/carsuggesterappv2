import React, { useState, memo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
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
import { Heart, MapPin, Calendar, Gauge, Star } from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.lg * 3) / 2; // For grid layout
const CARD_HEIGHT = 320;
const IMAGE_HEIGHT = 180;

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  location?: string;
  images: string[];
  isSaved?: boolean;
  dealer?: {
    name: string;
    verified?: boolean;
  };
  rating?: number;
  features?: string[];
  priceRange?: string;
}

interface CarCardProps {
  car: Car;
  onPress: () => void;
  onSaveToggle?: (carId: string) => void;
  showSaveButton?: boolean;
  variant?: 'grid' | 'list';
  style?: any;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedFastImage = Animated.createAnimatedComponent(FastImage);

export const CarCard = memo<CarCardProps>(({ 
  car, 
  onPress, 
  onSaveToggle, 
  showSaveButton = true, 
  variant = 'grid',
  style 
}) => {
  const { colors } = useThemeColors();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const scale = useSharedValue(1);
  const heartScale = useSharedValue(1);
  const imageOpacity = useSharedValue(0);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const imageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.95, { damping: 15 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15 });
  }, []);

  const handlePress = useCallback(() => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  }, [onPress]);

  const handleSaveToggle = useCallback(() => {
    if (!onSaveToggle) return;
    
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    heartScale.value = withSpring(1.3, { damping: 10 }, () => {
      heartScale.value = withSpring(1, { damping: 15 });
    });
    
    runOnJS(onSaveToggle)(car.id);
  }, [onSaveToggle, car.id]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    imageOpacity.value = withTiming(1, { duration: 300 });
  }, []);

  const formatPrice = useCallback((price: number) => {
    if (price === 0) return car.priceRange || 'Price on request';
    return `$${price.toLocaleString()}`;
  }, [car.priceRange]);

  const cardWidth = variant === 'list' ? '100%' : CARD_WIDTH;
  const cardHeight = variant === 'list' ? 140 : CARD_HEIGHT;
  const imageWidth = variant === 'list' ? 120 : '100%';
  const imageHeight = variant === 'list' ? 120 : IMAGE_HEIGHT;

  return (
    <AnimatedTouchableOpacity
      style={[
        styles.container,
        cardStyle,
        {
          width: cardWidth,
          height: cardHeight,
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          flexDirection: variant === 'list' ? 'row' : 'column',
        },
        getPlatformShadow(3),
        style,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={0.95}
    >
      {/* Image Container */}
      <View style={[
        styles.imageContainer,
        {
          width: imageWidth,
          height: imageHeight,
          borderRadius: variant === 'list' ? BorderRadius.md : BorderRadius.lg,
        }
      ]}>
        {!imageLoaded && (
          <View style={[styles.imagePlaceholder, { backgroundColor: colors.border }]}>
            <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
              Loading...
            </Text>
          </View>
        )}
        
        <AnimatedFastImage
          source={{
            uri: car.images[currentImageIndex] || car.images[0] || 'https://via.placeholder.com/300x200',
            priority: FastImage.priority.normal,
          }}
          style={[
            styles.image,
            imageStyle,
            {
              width: imageWidth,
              height: imageHeight,
              borderRadius: variant === 'list' ? BorderRadius.md : BorderRadius.lg,
            }
          ]}
          resizeMode={FastImage.resizeMode.cover}
          onLoad={handleImageLoad}
        />

        {/* Image Overlay Gradient */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)']}
          style={styles.imageOverlay}
        />

        {/* Save Button */}
        {showSaveButton && (
          <Animated.View style={[styles.saveButton, heartStyle]}>
            <TouchableOpacity
              style={[styles.saveButtonInner, { backgroundColor: 'rgba(255,255,255,0.9)' }]}
              onPress={handleSaveToggle}
              activeOpacity={0.8}
            >
              <Heart
                color={car.isSaved ? '#EF4444' : colors.textMuted}
                size={16}
                fill={car.isSaved ? '#EF4444' : 'transparent'}
              />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Dealer Badge */}
        {car.dealer?.verified && (
          <View style={[styles.dealerBadge, { backgroundColor: colors.primary }]}>
            <Verified color={colors.white} size={12} />
            <Text style={[styles.dealerBadgeText, { color: colors.white }]}>
              Verified
            </Text>
          </View>
        )}

        {/* Image Dots Indicator */}
        {car.images.length > 1 && (
          <View style={styles.imageIndicator}>
            {car.images.slice(0, 3).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === currentImageIndex ? colors.white : 'rgba(255,255,255,0.5)',
                  }
                ]}
              />
            ))}
            {car.images.length > 3 && (
              <Text style={[styles.moreImages, { color: colors.white }]}>
                +{car.images.length - 3}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Content */}
      <View style={[
        styles.content,
        {
          flex: variant === 'list' ? 1 : 0,
          paddingHorizontal: variant === 'list' ? Spacing.md : Spacing.sm,
        }
      ]}>
        {/* Title */}
        <Text 
          style={[styles.title, { color: colors.text }]} 
          numberOfLines={1}
        >
          {car.year} {car.make} {car.model}
        </Text>

        {/* Price */}
        <Text style={[styles.price, { color: colors.primary }]}>
          {formatPrice(car.price)}
        </Text>

        {/* Details Row */}
        <View style={styles.detailsRow}>
          {car.mileage && car.mileage > 0 && (
            <View style={styles.detail}>
              <Gauge color={colors.textMuted} size={12} />
              <Text style={[styles.detailText, { color: colors.textMuted }]}>
                {car.mileage.toLocaleString()}mi
              </Text>
            </View>
          )}

          {car.location && (
            <View style={styles.detail}>
              <MapPin color={colors.textMuted} size={12} />
              <Text style={[styles.detailText, { color: colors.textMuted }]} numberOfLines={1}>
                {car.location}
              </Text>
            </View>
          )}
        </View>

        {/* Rating */}
        {car.rating && (
          <View style={styles.ratingContainer}>
            <Star color="#F59E0B" size={12} fill="#F59E0B" />
            <Text style={[styles.ratingText, { color: colors.textMuted }]}>
              {car.rating.toFixed(1)}
            </Text>
          </View>
        )}

        {/* Dealer */}
        {car.dealer && variant !== 'list' && (
          <Text style={[styles.dealer, { color: colors.textSecondary }]} numberOfLines={1}>
            {car.dealer.name}
          </Text>
        )}
      </View>
    </AnimatedTouchableOpacity>
  );
});

CarCard.displayName = 'CarCard';

const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    position: 'absolute',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  placeholderText: {
    ...Typography.caption,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  saveButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    zIndex: 2,
  },
  saveButtonInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dealerBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  dealerBadgeText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
  },
  imageIndicator: {
    position: 'absolute',
    bottom: Spacing.sm,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreImages: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    padding: Spacing.sm,
    gap: 4,
  },
  title: {
    ...Typography.caption,
    fontWeight: '600',
    lineHeight: 16,
  },
  price: {
    ...Typography.h4,
    fontWeight: '700',
    marginVertical: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 2,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  detailText: {
    ...Typography.caption,
    fontSize: 11,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  ratingText: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: '600',
  },
  dealer: {
    ...Typography.caption,
    fontSize: 10,
    marginTop: 2,
  },
});