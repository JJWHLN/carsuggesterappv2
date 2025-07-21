/**
 * Updated CarCard Component - Utilizing Your Actual Supabase Schema
 * This shows how to leverage the rich data in your production database
 */

import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { CarModel } from '@/types/database-updated'; // Updated import
import { Colors } from '@/constants/Colors';
import { Star, Fuel, Zap, Shield } from '@/utils/ultra-optimized-icons';

interface EnhancedCarCardProps {
  car: CarModel;
  onPress?: () => void;
  showDetailedSpecs?: boolean;
  showPricing?: boolean;
  showSafetyRating?: boolean;
}

export const EnhancedCarCard: React.FC<EnhancedCarCardProps> = ({
  car,
  onPress,
  showDetailedSpecs = true,
  showPricing = true,
  showSafetyRating = true
}) => {
  // Format price range from your schema
  const formatPriceRange = () => {
    if (car.price_from && car.price_to) {
      return `$${car.price_from.toLocaleString()} - $${car.price_to.toLocaleString()}`;
    } else if (car.price_from) {
      return `From $${car.price_from.toLocaleString()}`;
    }
    return 'Price on request';
  };

  // Get fuel economy display
  const getFuelEconomyText = () => {
    if (car.fuel_economy_combined) {
      return `${car.fuel_economy_combined} MPG`;
    }
    return car.fuel_type || 'N/A';
  };

  // Get performance summary
  const getPerformanceSummary = () => {
    const specs = [];
    if (car.power_hp) specs.push(`${car.power_hp} HP`);
    if (car.acceleration_0_60) specs.push(`0-60: ${car.acceleration_0_60}s`);
    return specs.join(' • ');
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      {/* Car Image */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: car.image_url || 'https://via.placeholder.com/300x200?text=Car+Image' }}
          style={styles.carImage}
          resizeMode="cover"
        />
        
        {/* Brand Logo Overlay */}
        {car.brands?.logo_url && (
          <View style={styles.brandLogoContainer}>
            <Image
              source={{ uri: car.brands.logo_url }}
              style={styles.brandLogo}
              resizeMode="contain"
            />
          </View>
        )}
      </View>

      {/* Car Information */}
      <View style={styles.infoContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.carName}>
            {car.brands?.name} {car.model}
          </Text>
          <Text style={styles.carYear}>{car.year}</Text>
        </View>

        {/* Pricing */}
        {showPricing && (
          <Text style={styles.priceText}>{formatPriceRange()}</Text>
        )}

        {/* Key Specifications */}
        {showDetailedSpecs && (
          <View style={styles.specsContainer}>
            {/* Fuel Economy */}
            <View style={styles.specItem}>
              <Fuel size={16} color={Colors.light.textSecondary} />
              <Text style={styles.specText}>{getFuelEconomyText()}</Text>
            </View>

            {/* Performance */}
            {car.power_hp && (
              <View style={styles.specItem}>
                <Zap size={16} color={Colors.light.textSecondary} />
                <Text style={styles.specText}>{getPerformanceSummary()}</Text>
              </View>
            )}

            {/* Safety Rating */}
            {showSafetyRating && car.safety_rating && (
              <View style={styles.specItem}>
                <Shield size={16} color={Colors.light.textSecondary} />
                <View style={styles.ratingContainer}>
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      size={12}
                      color={index < car.safety_rating! ? Colors.light.primary : Colors.light.border}
                    />
                  ))}
                  <Text style={styles.ratingText}>Safety</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Key Features (from your standard_features array) */}
        {car.standard_features && car.standard_features.length > 0 && (
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>Key Features:</Text>
            <Text style={styles.featuresText} numberOfLines={2}>
              {car.standard_features.slice(0, 3).join(' • ')}
            </Text>
          </View>
        )}

        {/* Categories/Tags */}
        {car.category && car.category.length > 0 && (
          <View style={styles.tagsContainer}>
            {car.category.slice(0, 2).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: Colors.light.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  carImage: {
    width: '100%',
    height: '100%',
  },
  brandLogoContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.light.white,
    padding: 8,
    borderRadius: 8,
    shadowColor: Colors.light.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  brandLogo: {
    width: 24,
    height: 24,
  },
  infoContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  carName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.light.text,
    flex: 1,
  },
  carYear: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
    marginBottom: 12,
  },
  specsContainer: {
    marginBottom: 12,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  specText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginLeft: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginLeft: 4,
  },
  featuresContainer: {
    marginBottom: 12,
  },
  featuresTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  featuresText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: Colors.light.secondaryGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: Colors.light.primary,
    fontWeight: '500',
  },
});

export default EnhancedCarCard;
