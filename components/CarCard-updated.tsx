import React, { memo, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ViewStyle,
} from 'react-native';
import {
  MapPin,
  Heart,
  Star,
  Clock,
  Fuel,
} from '@/utils/ultra-optimized-icons';
import { OptimizedImage } from './ui/OptimizedImage';
import { AnimatedPressable } from './ui/AnimatedPressable';
import { Card } from './ui/Card';
import { useThemeColors } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';

import SimpleBookmarksService from '@/services/core/SimpleBookmarksService';
import UserPreferencesService from '@/services/core/UserPreferencesService';
import { Car } from '@/types/database';
import {
  formatPrice,
  formatMileage,
  formatDate,
  formatCondition,
  formatFuelType,
} from '@/utils/dataTransformers';

interface CarCardProps {
  car: Car;
  onPress: () => void;
  showSaveButton?: boolean;
  variant?: 'grid' | 'list';
  style?: ViewStyle;
  testID?: string;
}

const CarCard = memo<CarCardProps>(
  ({
    car,
    onPress,
    showSaveButton = true,
    variant = 'grid',
    style,
    testID,
  }) => {
    const { colors } = useThemeColors();
    const { user } = useAuth();
    const styles = getStyles(colors, variant);

    // Services
    const bookmarksService = SimpleBookmarksService.getInstance();
    const preferencesService = UserPreferencesService.getInstance();

    // State
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [bookmarkLoading, setBookmarkLoading] = useState(false);

    // Check bookmark status on mount
    useEffect(() => {
      checkBookmarkStatus();
    }, [car.id, user?.id]);

    const checkBookmarkStatus = async () => {
      try {
        const bookmarked = await bookmarksService.isBookmarked(
          car.id,
          user?.id,
        );
        setIsBookmarked(bookmarked);
      } catch (error) {
        console.error('Error checking bookmark status:', error);
      }
    };

    const handlePress = useCallback(() => {
      // Track user interaction
      preferencesService.trackBehaviorEvent({
        type: 'view',
        carId: car.id,
        make: car.make,
        priceRange: { min: car.price * 0.9, max: car.price * 1.1 },
        timestamp: Date.now(),
      });

      onPress();
    }, [car, onPress]);

    const handleBookmarkToggle = useCallback(async () => {
      if (bookmarkLoading) return;

      try {
        setBookmarkLoading(true);

        if (isBookmarked) {
          // Remove bookmark
          const success = await bookmarksService.removeBookmark(
            car.id,
            user?.id,
          );
          if (success) {
            setIsBookmarked(false);

            // Track behavior
            preferencesService.trackBehaviorEvent({
              type: 'unsave',
              carId: car.id,
              make: car.make,
              timestamp: Date.now(),
            });

            // Show feedback
            Alert.alert('Removed', 'Car removed from your saved cars.');
          }
        } else {
          // Add bookmark
          const success = await bookmarksService.addBookmark(car.id, user?.id);
          if (success) {
            setIsBookmarked(true);

            // Track behavior
            preferencesService.trackBehaviorEvent({
              type: 'save',
              carId: car.id,
              make: car.make,
              timestamp: Date.now(),
            });

            // Show feedback
            Alert.alert('Saved', 'Car added to your saved cars.');
          }
        }
      } catch (error) {
        console.error('Error toggling bookmark:', error);
        Alert.alert('Error', 'Failed to update bookmark. Please try again.');
      } finally {
        setBookmarkLoading(false);
      }
    }, [car, user?.id, isBookmarked, bookmarkLoading]);

    const getImageSource = () => {
      if (car.images && car.images.length > 0) {
        return { uri: car.images[0] };
      }
      // Default car image based on make
      return {
        uri: 'https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=800',
      };
    };

    const renderGridView = () => (
      <Card style={StyleSheet.flatten([styles.card, style])}>
        <View style={styles.imageContainer}>
          <OptimizedImage
            source={getImageSource()}
            style={styles.image}
            accessibilityLabel={`Photo of ${car.year} ${car.make} ${car.model}`}
            fallbackSource={require('@/assets/images/icon.png')}
          />

          {/* Save Button Overlay */}
          {showSaveButton && (
            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: isBookmarked
                    ? colors.primary
                    : 'rgba(0,0,0,0.6)',
                },
              ]}
              onPress={handleBookmarkToggle}
              disabled={bookmarkLoading}
              accessibilityLabel={
                isBookmarked ? 'Remove from saved cars' : 'Save car'
              }
            >
              <Heart
                size={16}
                color={isBookmarked ? 'white' : 'white'}
                fill={isBookmarked}
              />
            </TouchableOpacity>
          )}

          {/* Dealer Badge */}
          {car.dealer?.verified && (
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

        <View style={styles.content}>
          {/* Price */}
          <Text style={[styles.price, { color: colors.primary }]}>
            {formatPrice(car.price)}
          </Text>

          {/* Car Title */}
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
          >
            {car.year} {car.make} {car.model}
          </Text>

          {/* Details Row */}
          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <Fuel size={12} color={colors.textSecondary} />
              <Text
                style={[styles.detailText, { color: colors.textSecondary }]}
              >
                {formatMileage(car.mileage)}
              </Text>
            </View>

            <View style={styles.detailItem}>
              <MapPin size={12} color={colors.textSecondary} />
              <Text
                style={[styles.detailText, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {car.location}
              </Text>
            </View>
          </View>

          {/* Features or Condition */}
          {car.condition && (
            <Text style={[styles.condition, { color: colors.textSecondary }]}>
              {formatCondition(car.condition)}
            </Text>
          )}

          {/* Dealer Info */}
          {car.dealer && (
            <Text
              style={[styles.dealer, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {car.dealer.name}
            </Text>
          )}
        </View>
      </Card>
    );

    const renderListView = () => (
      <Card style={StyleSheet.flatten([styles.listCard, style])}>
        <View style={styles.listImageContainer}>
          <OptimizedImage
            source={getImageSource()}
            style={styles.listImage}
            accessibilityLabel={`Photo of ${car.year} ${car.make} ${car.model}`}
            fallbackSource={require('@/assets/images/icon.png')}
          />
        </View>

        <View style={styles.listContent}>
          <View style={styles.listHeader}>
            <Text
              style={[styles.listTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {car.year} {car.make} {car.model}
            </Text>
            <Text style={[styles.listPrice, { color: colors.primary }]}>
              {formatPrice(car.price)}
            </Text>
          </View>

          <View style={styles.listDetails}>
            <Text
              style={[styles.listDetailText, { color: colors.textSecondary }]}
            >
              {formatMileage(car.mileage)} • {car.location}
            </Text>
            {car.condition && (
              <Text
                style={[styles.listDetailText, { color: colors.textSecondary }]}
              >
                {formatCondition(car.condition)}
              </Text>
            )}
          </View>

          {car.dealer && (
            <View style={styles.listDealerRow}>
              <Text
                style={[styles.listDealer, { color: colors.textSecondary }]}
              >
                {car.dealer.name}
              </Text>
              {car.dealer.verified && (
                <View style={styles.listVerifiedBadge}>
                  <Star size={10} color={colors.primary} />
                  <Text
                    style={[styles.listVerifiedText, { color: colors.primary }]}
                  >
                    Verified
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Save Button */}
        {showSaveButton && (
          <TouchableOpacity
            style={[styles.listSaveButton, { borderColor: colors.border }]}
            onPress={handleBookmarkToggle}
            disabled={bookmarkLoading}
            accessibilityLabel={
              isBookmarked ? 'Remove from saved cars' : 'Save car'
            }
          >
            <Heart
              size={18}
              color={isBookmarked ? colors.primary : colors.textSecondary}
              fill={isBookmarked}
            />
          </TouchableOpacity>
        )}
      </Card>
    );

    return (
      <AnimatedPressable
        onPress={handlePress}
        testID={testID}
        accessibilityLabel={`${car.year} ${car.make} ${car.model}, ${formatPrice(car.price)}`}
        accessibilityHint="Double tap to view car details"
      >
        {variant === 'list' ? renderListView() : renderGridView()}
      </AnimatedPressable>
    );
  },
);

const getStyles = (colors: any, variant: 'grid' | 'list') =>
  StyleSheet.create({
    // Grid view styles
    card: {
      overflow: 'hidden',
      marginBottom: 16,
    },
    imageContainer: {
      position: 'relative',
      height: 180,
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    saveButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
    },
    verifiedBadge: {
      position: 'absolute',
      top: 12,
      left: 12,
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
    content: {
      padding: 16,
    },
    price: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 4,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    detailsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    detailItem: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    detailText: {
      fontSize: 12,
      marginLeft: 4,
    },
    condition: {
      fontSize: 12,
      marginBottom: 4,
    },
    dealer: {
      fontSize: 12,
      fontStyle: 'italic',
    },

    // List view styles
    listCard: {
      flexDirection: 'row',
      padding: 12,
      marginBottom: 12,
      alignItems: 'center',
    },
    listImageContainer: {
      width: 100,
      height: 80,
      borderRadius: 8,
      overflow: 'hidden',
      marginRight: 12,
    },
    listImage: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    listContent: {
      flex: 1,
    },
    listHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    listTitle: {
      fontSize: 16,
      fontWeight: '600',
      flex: 1,
      marginRight: 8,
    },
    listPrice: {
      fontSize: 16,
      fontWeight: '700',
    },
    listDetails: {
      marginBottom: 4,
    },
    listDetailText: {
      fontSize: 12,
      marginBottom: 2,
    },
    listDealerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    listDealer: {
      fontSize: 12,
      fontStyle: 'italic',
      flex: 1,
    },
    listVerifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    listVerifiedText: {
      fontSize: 10,
      fontWeight: '600',
      marginLeft: 2,
    },
    listSaveButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 12,
    },
  });

CarCard.displayName = 'CarCard';

export { CarCard };
