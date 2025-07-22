import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { EnhancedSearchExperience } from '@/components/ui/EnhancedSearchExperience';
import { CarCard } from '@/components/CarCard';
import { Car } from '@/types/database';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Mock car data for demo
const mockCars: Car[] = [
  {
    id: '1',
    make: 'BMW',
    model: '3 Series',
    year: 2022,
    price: 35000,
    mileage: 15000,
    location: 'Dublin',
    images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400'],
    created_at: '2023-01-01T00:00:00Z',
    fuel_type: 'Petrol',
    transmission: 'Automatic',
  },
  {
    id: '2',
    make: 'Tesla',
    model: 'Model 3',
    year: 2023,
    price: 48000,
    mileage: 5000,
    location: 'Cork',
    images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400'],
    created_at: '2023-02-01T00:00:00Z',
    fuel_type: 'Electric',
    transmission: 'Automatic',
  },
  {
    id: '3',
    make: 'Mercedes-Benz',
    model: 'C-Class',
    year: 2021,
    price: 42000,
    mileage: 22000,
    location: 'Galway',
    images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400'],
    created_at: '2023-03-01T00:00:00Z',
    fuel_type: 'Hybrid',
    transmission: 'Automatic',
  },
  {
    id: '4',
    make: 'Audi',
    model: 'A4',
    year: 2022,
    price: 38000,
    mileage: 18000,
    location: 'Limerick',
    images: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400'],
    created_at: '2023-04-01T00:00:00Z',
    fuel_type: 'Diesel',
    transmission: 'Manual',
  },
];

export default function EnhancedSearchDemoScreen() {
  const [results, setResults] = useState<Car[]>(mockCars);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<any>({});

  const handleSearch = async (query: string, filters: any) => {
    setLoading(true);
    setSearchQuery(query);
    setActiveFilters(filters);

    // Simulate API call delay
    setTimeout(() => {
      // Filter mock cars based on query and filters
      let filteredCars = mockCars;

      // Text search
      if (query) {
        const queryLower = query.toLowerCase();
        filteredCars = filteredCars.filter(car => 
          car.make.toLowerCase().includes(queryLower) ||
          car.model.toLowerCase().includes(queryLower) ||
          `${car.make} ${car.model}`.toLowerCase().includes(queryLower)
        );
      }

      // Price filter
      if (filters.priceRange) {
        const [min, max] = filters.priceRange.split('-').map(Number);
        if (max) {
          filteredCars = filteredCars.filter(car => car.price >= min && car.price <= max);
        } else {
          filteredCars = filteredCars.filter(car => car.price >= min);
        }
      }

      // Fuel type filter
      if (filters.fuelType?.length) {
        filteredCars = filteredCars.filter(car => 
          filters.fuelType.includes(car.fuel_type?.toLowerCase())
        );
      }

      // Transmission filter
      if (filters.transmission) {
        filteredCars = filteredCars.filter(car => 
          car.transmission?.toLowerCase() === filters.transmission.toLowerCase()
        );
      }

      // Brand filter
      if (filters.brand?.length) {
        filteredCars = filteredCars.filter(car => 
          filters.brand.includes(car.make.toLowerCase())
        );
      }

      setResults(filteredCars);
      setLoading(false);

      // Show result feedback
      if (filteredCars.length === 0) {
        Alert.alert('No Results', 'No cars found matching your criteria. Try adjusting your filters.');
      }
    }, 800);
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setResults(mockCars);
  };

  const getActiveFilterSummary = () => {
    const parts = [];
    if (activeFilters.priceRange) {
      parts.push(`Price: ${activeFilters.priceRange}`);
    }
    if (activeFilters.fuelType?.length) {
      parts.push(`Fuel: ${activeFilters.fuelType.join(', ')}`);
    }
    if (activeFilters.transmission) {
      parts.push(`Transmission: ${activeFilters.transmission}`);
    }
    if (activeFilters.brand?.length) {
      parts.push(`Brand: ${activeFilters.brand.join(', ')}`);
    }
    if (activeFilters.bodyType?.length) {
      parts.push(`Body: ${activeFilters.bodyType.join(', ')}`);
    }
    return parts.join(' • ');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Enhanced Search Experience</Text>
          <Text style={styles.subtitle}>
            Try our new animated filters, search history, and smart suggestions
          </Text>
        </View>

        {/* Enhanced Search Component */}
        <EnhancedSearchExperience
          onSearch={handleSearch}
          onClearFilters={handleClearFilters}
          style={styles.searchComponent}
        />

        {/* Search Results Summary */}
        {(searchQuery || Object.keys(activeFilters).length > 0) && (
          <View style={styles.resultsSummary}>
            <Text style={styles.resultsCount}>
              {loading ? 'Searching...' : `${results.length} cars found`}
            </Text>
            {searchQuery && (
              <Text style={styles.searchInfo}>
                Search: "{searchQuery}"
              </Text>
            )}
            {getActiveFilterSummary() && (
              <Text style={styles.filterInfo}>
                Filters: {getActiveFilterSummary()}
              </Text>
            )}
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <LoadingSpinner size="large" />
            <Text style={styles.loadingText}>Searching cars...</Text>
          </View>
        )}

        {/* Results Grid */}
        {!loading && (
          <View style={styles.resultsGrid}>
            {results.map((car, index) => (
              <View key={car.id} style={styles.carCardContainer}>
                <CarCard
                  car={car}
                  onPress={() => Alert.alert('Car Selected', `You selected ${car.make} ${car.model}`)}
                />
              </View>
            ))}
          </View>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && (searchQuery || Object.keys(activeFilters).length > 0) && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No cars found</Text>
            <Text style={styles.emptySubtitle}>
              Try adjusting your search criteria or filters to find more cars
            </Text>
          </View>
        )}

        {/* Feature Highlights */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>✨ New Features</Text>
          <View style={styles.featuresList}>
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🏷️</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureName}>Animated Filter Badges</Text>
                <Text style={styles.featureDescription}>
                  Interactive filter chips with smooth animations and visual feedback
                </Text>
              </View>
            </View>
            
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>📚</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureName}>Smart Search History</Text>
                <Text style={styles.featureDescription}>
                  Save searches, view recent queries, and discover popular searches
                </Text>
              </View>
            </View>
            
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>⚡</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureName}>Quick Filters</Text>
                <Text style={styles.featureDescription}>
                  Fast access to common search filters with instant feedback
                </Text>
              </View>
            </View>
            
            <View style={styles.feature}>
              <Text style={styles.featureIcon}>🎯</Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureName}>Advanced Filtering</Text>
                <Text style={styles.featureDescription}>
                  Comprehensive filter categories with multi-selection support
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: {
    ...Typography.heading,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  searchComponent: {
    marginBottom: Spacing.md,
  },
  resultsSummary: {
    backgroundColor: Colors.light.surfaceSecondary,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  resultsCount: {
    ...Typography.subtitle,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  searchInfo: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginBottom: 2,
  },
  filterInfo: {
    ...Typography.caption,
    color: Colors.light.primary,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
  },
  resultsGrid: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  carCardContainer: {
    marginBottom: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.subtitle,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
  featuresSection: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.surfaceSecondary,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  featuresTitle: {
    ...Typography.subtitle,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  featuresList: {
    gap: Spacing.md,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  featureIcon: {
    fontSize: 24,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureName: {
    ...Typography.body,
    color: Colors.light.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
});
