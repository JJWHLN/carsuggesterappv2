import React, { useState, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  RecommendationScreen,
  CarRecommendation,
} from '@/components/ui/RecommendationScreen';
import { Button } from '@/components/ui/Button';
import { useThemeColors } from '@/hooks/useTheme';
import { fetchCarModels } from '@/services/api';
import { Spacing, Typography } from '@/constants/Colors';
import { useUnifiedDataFetching } from '@/hooks/useUnifiedDataFetching';

interface FilterOption {
  id: string;
  label: string;
  value: any;
  count?: number;
}

export default function Recommendations() {
  const { colors } = useThemeColors();
  const [selectedFilters, setSelectedFilters] = useState<{
    [key: string]: any;
  }>({});

  // Fetch car data for recommendations
  const {
    data: cars,
    loading,
    error,
    refetch,
  } = useUnifiedDataFetching(fetchCarModels);

  // Transform API data to match RecommendationScreen expected format
  const recommendedCars: CarRecommendation[] = useMemo(() => {
    if (!cars) return [];

    return cars.map((car: any) => ({
      id: car.id,
      name: `${car.make} ${car.model}`,
      year: car.year,
      image:
        car.image_url ||
        `https://images.unsplash.com/photo-1494905998402-395d579af36f?w=800&h=600&fit=crop`,
      priceRange: `$${(car.starting_price || 25000, { initialLoad: true, enabled: true }).toLocaleString()}`,
      tags: [
        car.body_type || 'Sedan',
        car.fuel_type || 'Gasoline',
        car.transmission || 'Automatic',
      ].filter(Boolean),
      rating: car.rating || 4.2,
      location: 'Available nationwide',
      matchScore: Math.floor(Math.random() * 30) + 70, // Random match score for demo
      highlightReason: 'Matches your budget and style preferences',
    }));
  }, [cars]);

  const filters: FilterOption[] = [
    { id: 'bodyType', label: 'Body Type', value: 'all' },
    { id: 'fuelType', label: 'Fuel Type', value: 'all' },
    { id: 'priceRange', label: 'Price Range', value: 'all' },
    { id: 'transmission', label: 'Transmission', value: 'all' },
  ];

  const handleCarPress = (car: CarRecommendation) => {
    router.push(`/car/${car.id}`);
  };

  const handleFilterChange = (filterId: string, value: any) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterId]: value,
    }));
  };

  const handleFavoriteToggle = (carId: string) => {
    // TODO: Implement favorite functionality
    logger.debug('Toggle favorite for car:', carId);
  };

  // Show error state if there's an error
  if (error && !loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            {error}
          </Text>
          <Button title="Retry" onPress={refetch} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <RecommendationScreen
        cars={recommendedCars}
        loading={loading}
        title="Your Recommendations"
        subtitle="Based on your preferences"
        onCarPress={handleCarPress}
        onFilterChange={handleFilterChange}
        onFavoriteToggle={handleFavoriteToggle}
        filters={filters}
        favoriteCarIds={[]}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  errorText: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
});
