import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  Sparkles,
  ArrowRight,
  Award,
  TrendingUp,
} from '@/utils/ultra-optimized-icons';
import { Car as CarIcon } from '@/utils/ultra-optimized-icons';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UnifiedCarCard as CarCard } from '@/components/ui/unified';
import { useThemeColors } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';

// TODO: Implement these services when needed
// import CarDataService from '@/services/core/CarDataService';
// import SimpleRecommendationEngine from '@/services/core/SimpleRecommendationEngine';
// import UserPreferencesService from '@/services/core/UserPreferencesService';
import { Car } from '@/types/database';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useThemeColors();
  const { user } = useAuth();

  // Services
  const carDataService = CarDataService.getInstance();
  const recommendationEngine = SimpleRecommendationEngine.getInstance();
  const preferencesService = UserPreferencesService.getInstance();

  // State
  const [featuredCars, setFeaturedCars] = useState<Car[]>([]);
  const [recommendedCars, setRecommendedCars] = useState<Car[]>([]);
  const [recentCars, setRecentCars] = useState<Car[]>([]);
  const [popularMakes, setPopularMakes] = useState<
    Array<{ make: string; count: number }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const [featured, recommendations, recent, makes, suggestions] =
        await Promise.all([
          carDataService.getFeaturedCars(6),
          user
            ? loadPersonalizedRecommendations()
            : recommendationEngine.getNewUserRecommendations(8),
          carDataService.getRecentCars(6),
          carDataService.getPopularMakes(),
          preferencesService.getSearchSuggestions(),
        ]);

      setFeaturedCars(featured);
      setRecommendedCars(recommendations);
      setRecentCars(recent);
      setPopularMakes(makes.slice(0, 6));
      setSearchSuggestions(suggestions);
    } catch (error) {
      console.error('Error loading initial data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPersonalizedRecommendations = async (): Promise<Car[]> => {
    try {
      if (!user) return [];

      const [preferences, behavior] = await Promise.all([
        preferencesService.getPreferences(),
        preferencesService.getBehavior(),
      ]);

      const result = await recommendationEngine.getRecommendations(
        user.id,
        preferences,
        behavior,
        8,
      );

      return result.cars;
    } catch (error) {
      console.error('Error loading personalized recommendations:', error);
      return recommendationEngine.getNewUserRecommendations(8);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInitialData();
    setRefreshing(false);
  };

  const handleSearchPress = () => {
    router.push('/(tabs)/search');
  };

  const handleCarPress = (car: Car) => {
    // Track viewing behavior
    preferencesService.trackBehaviorEvent({
      type: 'view',
      carId: car.id,
      make: car.make,
      priceRange: { min: car.price * 0.9, max: car.price * 1.1 },
      timestamp: Date.now(),
    });

    router.push(`/car/${car.id}`);
  };

  const handleMakePress = (make: string) => {
    router.push({
      pathname: '/(tabs)/search',
      params: { make },
    });
  };

  const handleViewAllPress = (section: string) => {
    router.push({
      pathname: '/(tabs)/search',
      params: { section },
    });
  };

  const renderCarSection = (
    title: string,
    cars: Car[],
    sectionKey: string,
    showViewAll: boolean = true,
  ) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {title}
        </Text>
        {showViewAll && (
          <TouchableOpacity
            onPress={() => handleViewAllPress(sectionKey)}
            style={styles.viewAllButton}
          >
            <Text style={[styles.viewAllText, { color: colors.primary }]}>
              View All
            </Text>
            <ArrowRight size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.horizontalList}
      >
        {cars.map((car) => (
          <View key={car.id} style={styles.carCardContainer}>
            <CarCard
              car={car}
              onPress={() => handleCarPress(car)}
              showSaveButton={true}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderPopularMakes = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Popular Makes
      </Text>
      <View style={styles.makesGrid}>
        {popularMakes.map((makeData) => (
          <TouchableOpacity
            key={makeData.make}
            style={[styles.makeCard, { backgroundColor: colors.surface }]}
            onPress={() => handleMakePress(makeData.make)}
          >
            <CarIcon size={24} color={colors.primary} />
            <Text style={[styles.makeName, { color: colors.text }]}>
              {makeData.make}
            </Text>
            <Text style={[styles.makeCount, { color: colors.textSecondary }]}>
              {makeData.count} cars
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderSearchSuggestions = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Quick Search
      </Text>
      <View style={styles.suggestionsContainer}>
        {searchSuggestions.slice(0, 4).map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.suggestionChip, { backgroundColor: colors.surface }]}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/search',
                params: { query: suggestion },
              })
            }
          >
            <Text style={[styles.suggestionText, { color: colors.text }]}>
              {suggestion}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your perfect cars...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <Text style={styles.welcomeText}>
                {user ? `Welcome back!` : 'Find Your Perfect Car'}
              </Text>
              <Text style={styles.subtitleText}>
                Discover amazing cars tailored just for you
              </Text>

              {/* Search Button */}
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearchPress}
              >
                <Search size={20} color={colors.textSecondary} />
                <Text
                  style={[
                    styles.searchPlaceholder,
                    { color: colors.textSecondary },
                  ]}
                >
                  Search by make, model, or price...
                </Text>
                <Sparkles size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Stats */}
        <View
          style={[styles.statsContainer, { backgroundColor: colors.surface }]}
        >
          <View style={styles.statItem}>
            <TrendingUp size={20} color={colors.primary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {featuredCars.length + recentCars.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Cars Available
            </Text>
          </View>
          <View style={styles.statItem}>
            <Award size={20} color={colors.primary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {popularMakes.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Top Brands
            </Text>
          </View>
          <View style={styles.statItem}>
            <Sparkles size={20} color={colors.primary} />
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {user ? 'Personal' : 'Curated'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Recommendations
            </Text>
          </View>
        </View>

        {/* Search Suggestions */}
        {renderSearchSuggestions()}

        {/* Featured Cars */}
        {featuredCars.length > 0 &&
          renderCarSection('Featured Cars', featuredCars, 'featured')}

        {/* Personalized Recommendations */}
        {recommendedCars.length > 0 &&
          renderCarSection(
            user ? 'Recommended for You' : 'Popular Choices',
            recommendedCars,
            'recommended',
          )}

        {/* Popular Makes */}
        {renderPopularMakes()}

        {/* Recent Listings */}
        {recentCars.length > 0 &&
          renderCarSection('Latest Listings', recentCars, 'recent')}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  headerContent: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 24,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    maxWidth: 320,
  },
  searchPlaceholder: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  horizontalList: {
    paddingLeft: 16,
  },
  carCardContainer: {
    marginRight: 16,
    width: width * 0.7,
  },
  makesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
  },
  makeCard: {
    width: (width - 64) / 3,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  makeName: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  makeCount: {
    fontSize: 12,
    marginTop: 2,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  suggestionText: {
    fontSize: 14,
  },
});
