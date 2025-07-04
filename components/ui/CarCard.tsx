import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Heart, Star, MapPin } from 'lucide-react-native';
import { OptimizedImage } from './OptimizedImage';
import { useThemeColors } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';

interface CarCardProps {
  image: string;
  name: string;
  year?: number;
  priceRange: string;
  tags?: string[];
  rating?: number;
  location?: string;
  onPress: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  style?: any;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.lg * 3) / 2; // For 2-column grid

export const CarCard = memo<CarCardProps>(({
  image,
  name,
  year,
  priceRange,
  tags = [],
  rating,
  location,
  onPress,
  onFavorite,
  isFavorite = false,
  style,
}) => {
  const { colors } = useThemeColors();

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }, style]}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityRole="button"
      accessibilityLabel={`Car listing: ${year ? `${year} ` : ''}${name}, ${priceRange}`}
    >
      {/* Image with favorite overlay */}
      <View style={styles.imageContainer}>
        <OptimizedImage
          source={{ uri: image }}
          style={styles.image}
          resizeMode="cover"
          fallbackSource={require('@/assets/images/icon.png')}
          accessibilityLabel={`${name} image`}
        />
        
        {/* Favorite button */}
        {onFavorite && (
          <TouchableOpacity
            style={[styles.favoriteButton, { backgroundColor: colors.white }]}
            onPress={onFavorite}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <Heart
              color={isFavorite ? colors.error : colors.textSecondary}
              fill={isFavorite ? colors.error : 'transparent'}
              size={16}
            />
          </TouchableOpacity>
        )}

        {/* Rating badge */}
        {rating && (
          <View style={[styles.ratingBadge, { backgroundColor: colors.primary }]}>
            <Star color={colors.white} size={12} fill={colors.white} />
            <Text style={[styles.ratingText, { color: colors.white }]}>{rating.toFixed(1)}</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {year ? `${year} ${name}` : name}
        </Text>

        {/* Price */}
        <Text style={[styles.price, { color: colors.primary }]} numberOfLines={1}>
          {priceRange}
        </Text>

        {/* Location */}
        {location && (
          <View style={styles.locationContainer}>
            <MapPin color={colors.textSecondary} size={12} />
            <Text style={[styles.location, { color: colors.textSecondary }]} numberOfLines={1}>
              {location}
            </Text>
          </View>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={[styles.tag, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.tagText, { color: colors.primary }]} numberOfLines={1}>
                  {tag}
                </Text>
              </View>
            ))}
            {tags.length > 2 && (
              <Text style={[styles.moreText, { color: colors.textSecondary }]}>
                +{tags.length - 2}
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

CarCard.displayName = 'CarCard';

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...Shadows.card,
  },
  imageContainer: {
    position: 'relative',
    height: 120,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },
  ratingBadge: {
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
  ratingText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
  },
  content: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  title: {
    ...Typography.body,
    fontWeight: '600',
    lineHeight: 18,
  },
  price: {
    ...Typography.body,
    fontWeight: '700',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    ...Typography.caption,
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  tag: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  tagText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '500',
  },
  moreText: {
    ...Typography.caption,
    fontSize: 10,
  },
});
