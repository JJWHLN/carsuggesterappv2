import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  SlideInRight,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { 
  Sparkles, TrendingUp, Award, Star, Heart, Eye,
  Car, DollarSign, Gauge, Fuel, Users, Crown,
  ArrowRight, RefreshCw, Zap, Award as Target
} from '@/utils/ultra-optimized-icons';
import { UltraPremiumCarCard } from '@/components/UltraPremiumCarCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { useThemeColors } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { BorderRadius, Spacing, Typography, Shadows } from '@/constants/Colors';
import { Car as CarType } from '@/types/database';

const { width } = Dimensions.get('window');

interface UserPreferences {
  budgetRange: [number, number];
  preferredMakes: string[];
  bodyTypes: string[];
  fuelTypes: string[];
  features: string[];
  maxMileage: number;
  minYear: number;
  location: {
    city: string;
    state: string;
    coordinates: [number, number];
  };
  drivingHabits: {
    dailyMiles: number;
    primaryUse: 'commuting' | 'family' | 'recreation' | 'business';
    terrainType: 'city' | 'highway' | 'mixed' | 'offroad';
  };
  lifestyle: {
    hasFamily: boolean;
    petOwner: boolean;
    environmentallyConscious: boolean;
    technologyEnthusiast: boolean;
    luxuryOriented: boolean;
  };
}

interface RecommendationScore {
  overall: number;
  priceMatch: number;
  featureMatch: number;
  lifestyleMatch: number;
  locationMatch: number;
  trendingScore: number;
  popularityScore: number;
}

interface CarRecommendation {
  car: CarType;
  score: RecommendationScore;
  reasons: string[];
  confidence: number;
  category: 'perfect_match' | 'great_value' | 'trending' | 'alternative';
  savings?: number;
  dealInfo?: {
    isHotDeal: boolean;
    timeLeft: string;
    originalPrice?: number;
  };
}

interface AIRecommendationEngineProps {
  userPreferences?: UserPreferences;
  onCarPress: (car: CarType) => void;
  onRefreshRecommendations: () => void;
  maxRecommendations?: number;
}

// Simulated AI engine - In production, this would connect to ML services
class AIRecommendationEngine {
  private static instance: AIRecommendationEngine;
  
  static getInstance(): AIRecommendationEngine {
    if (!AIRecommendationEngine.instance) {
      AIRecommendationEngine.instance = new AIRecommendationEngine();
    }
    return AIRecommendationEngine.instance;
  }

  async generateRecommendations(
    preferences: UserPreferences,
    availableCars: CarType[],
    userHistory?: any[]
  ): Promise<CarRecommendation[]> {
    // Simulate ML processing time
    await new Promise(resolve => setTimeout(resolve, 1500));

    const recommendations: CarRecommendation[] = [];

    for (const car of availableCars) {
      const score = this.calculateRecommendationScore(car, preferences, userHistory);
      const reasons = this.generateReasons(car, preferences, score);
      const confidence = this.calculateConfidence(score, car);
      const category = this.categorizeRecommendation(score, car);
      
      if (score.overall > 0.3) { // Minimum threshold
        recommendations.push({
          car,
          score,
          reasons,
          confidence,
          category,
          savings: this.calculateSavings(car),
          dealInfo: this.getDealInfo(car),
        });
      }
    }

    // Sort by overall score and confidence
    return recommendations
      .sort((a, b) => (b.score.overall * b.confidence) - (a.score.overall * a.confidence))
      .slice(0, 12); // Top 12 recommendations
  }

  private calculateRecommendationScore(
    car: CarType,
    preferences: UserPreferences,
    userHistory?: any[]
  ): RecommendationScore {
    const priceMatch = this.scorePriceMatch(car.price, preferences.budgetRange);
    const featureMatch = this.scoreFeatureMatch(car, preferences);
    const lifestyleMatch = this.scoreLifestyleMatch(car, preferences);
    const locationMatch = this.scoreLocationMatch(car, preferences);
    const trendingScore = this.scoreTrendingFactor(car);
    const popularityScore = this.scorePopularity(car);

    const overall = (
      priceMatch * 0.25 +
      featureMatch * 0.20 +
      lifestyleMatch * 0.20 +
      locationMatch * 0.15 +
      trendingScore * 0.10 +
      popularityScore * 0.10
    );

    return {
      overall,
      priceMatch,
      featureMatch,
      lifestyleMatch,
      locationMatch,
      trendingScore,
      popularityScore,
    };
  }

  private scorePriceMatch(price: number, budgetRange: [number, number]): number {
    const [min, max] = budgetRange;
    if (price < min) return Math.max(0, 1 - (min - price) / min);
    if (price > max) return Math.max(0, 1 - (price - max) / max);
    
    // Sweet spot is 80-90% of budget
    const sweetSpotStart = max * 0.8;
    const sweetSpotEnd = max * 0.9;
    
    if (price >= sweetSpotStart && price <= sweetSpotEnd) return 1.0;
    
    // Linear interpolation for other ranges
    if (price < sweetSpotStart) {
      return 0.7 + (price - min) / (sweetSpotStart - min) * 0.3;
    } else {
      return 1.0 - (price - sweetSpotEnd) / (max - sweetSpotEnd) * 0.2;
    }
  }

  private scoreFeatureMatch(car: CarType, preferences: UserPreferences): number {
    let score = 0;
    let totalFactors = 0;

    // Make preference
    if (preferences.preferredMakes.includes(car.make.toLowerCase())) {
      score += 0.3;
    }
    totalFactors += 0.3;

    // Fuel type preference
    if (preferences.fuelTypes.includes(car.fuel_type || 'gasoline')) {
      score += 0.2;
    }
    totalFactors += 0.2;

    // Mileage preference
    if (car.mileage <= preferences.maxMileage) {
      score += 0.2;
    }
    totalFactors += 0.2;

    // Year preference
    if (car.year >= preferences.minYear) {
      score += 0.15;
    }
    totalFactors += 0.15;

    // Features match (simulated)
    const hasDesiredFeatures = Math.random() > 0.4; // 60% chance
    if (hasDesiredFeatures) {
      score += 0.15;
    }
    totalFactors += 0.15;

    return totalFactors > 0 ? score / totalFactors : 0;
  }

  private scoreLifestyleMatch(car: CarType, preferences: UserPreferences): number {
    let score = 0;

    // Family considerations
    if (preferences.lifestyle.hasFamily) {
      const familyFriendly = ['suv', 'minivan', 'wagon'].includes(car.condition?.toLowerCase() || '');
      score += familyFriendly ? 0.3 : 0.1;
    } else {
      const sporty = ['coupe', 'convertible', 'sports'].includes(car.condition?.toLowerCase() || '');
      score += sporty ? 0.3 : 0.2;
    }

    // Environmental consciousness
    if (preferences.lifestyle.environmentallyConscious) {
      const ecoFriendly = ['electric', 'hybrid', 'plugin-hybrid'].includes(car.fuel_type || '');
      score += ecoFriendly ? 0.4 : 0.1;
    }

    // Luxury orientation
    if (preferences.lifestyle.luxuryOriented) {
      const luxuryBrands = ['bmw', 'mercedes', 'audi', 'lexus', 'tesla', 'porsche'];
      const isLuxury = luxuryBrands.includes(car.make.toLowerCase());
      score += isLuxury ? 0.3 : 0.1;
    }

    return Math.min(score, 1.0);
  }

  private scoreLocationMatch(car: CarType, preferences: UserPreferences): number {
    // Simulate distance calculation
    const distance = Math.random() * 200; // 0-200 miles
    const maxDistance = 100; // User's preferred max distance
    
    if (distance <= maxDistance) {
      return 1.0 - (distance / maxDistance) * 0.5; // Max 0.5 penalty for distance
    }
    
    return Math.max(0.2, 1.0 - (distance / 300)); // Minimum 0.2 for very far cars
  }

  private scoreTrendingFactor(car: CarType): number {
    // Simulate trending score based on model popularity, recent searches, etc.
    const trendingModels = ['tesla model 3', 'toyota rav4', 'honda cr-v', 'ford f-150'];
    const carModel = `${car.make} ${car.model}`.toLowerCase();
    
    const isTrending = trendingModels.some(model => carModel.includes(model));
    return isTrending ? 0.8 + Math.random() * 0.2 : Math.random() * 0.6;
  }

  private scorePopularity(car: CarType): number {
    // Simulate popularity based on views, saves, inquiries
    const viewCount = Math.random() * 5000;
    const saveCount = Math.random() * 500;
    const inquiryCount = Math.random() * 50;
    
    const popularityScore = (
      Math.min(viewCount / 5000, 1) * 0.5 +
      Math.min(saveCount / 500, 1) * 0.3 +
      Math.min(inquiryCount / 50, 1) * 0.2
    );
    
    return popularityScore;
  }

  private generateReasons(car: CarType, preferences: UserPreferences, score: RecommendationScore): string[] {
    const reasons: string[] = [];

    if (score.priceMatch > 0.8) {
      reasons.push('Perfect price match for your budget');
    } else if (score.priceMatch > 0.6) {
      reasons.push('Great value within your price range');
    }

    if (score.featureMatch > 0.7) {
      reasons.push('Matches your preferred features');
    }

    if (score.lifestyleMatch > 0.7) {
      reasons.push('Ideal for your lifestyle needs');
    }

    if (score.trendingScore > 0.7) {
      reasons.push('Currently trending and popular');
    }

    if (score.locationMatch > 0.8) {
      reasons.push('Located near you');
    }

    if (car.fuel_type === 'electric' && preferences.lifestyle.environmentallyConscious) {
      reasons.push('Eco-friendly electric vehicle');
    }

    if (car.year >= 2022) {
      reasons.push('Latest model with newest features');
    }

    if (car.mileage < 20000) {
      reasons.push('Low mileage vehicle');
    }

    return reasons.slice(0, 3); // Top 3 reasons
  }

  private calculateConfidence(score: RecommendationScore, car: CarType): number {
    // Higher confidence for cars with more complete data and higher overall scores
    let confidence = score.overall;
    
    // Boost confidence for complete car data
    if (car.images && car.images.length > 3) confidence += 0.1;
    if (car.description) confidence += 0.05;
    if (car.features && car.features.length > 0) confidence += 0.05;
    
    return Math.min(confidence, 0.99); // Max 99% confidence
  }

  private categorizeRecommendation(score: RecommendationScore, car: CarType): CarRecommendation['category'] {
    if (score.overall > 0.8) return 'perfect_match';
    if (score.priceMatch > 0.8 && score.overall > 0.6) return 'great_value';
    if (score.trendingScore > 0.7) return 'trending';
    return 'alternative';
  }

  private calculateSavings(car: CarType): number {
    // Simulate market value analysis
    const marketValue = car.price * (1 + (Math.random() - 0.5) * 0.2); // ±10% variance
    return Math.max(0, marketValue - car.price);
  }

  private getDealInfo(car: CarType): CarRecommendation['dealInfo'] {
    const isHotDeal = Math.random() > 0.7; // 30% chance of being a hot deal
    
    if (isHotDeal) {
      return {
        isHotDeal: true,
        timeLeft: `${Math.floor(Math.random() * 5) + 1} days`,
        originalPrice: car.price * (1.05 + Math.random() * 0.1), // 5-15% higher
      };
    }
    
    return {
      isHotDeal: false,
      timeLeft: '',
    };
  }
}

export const AIRecommendationEngine_Component: React.FC<AIRecommendationEngineProps> = ({
  userPreferences,
  onCarPress,
  onRefreshRecommendations,
  maxRecommendations = 8,
}) => {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const styles = getThemedStyles(colors);

  const [recommendations, setRecommendations] = useState<CarRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aiEngine = useMemo(() => AIRecommendationEngine.getInstance(), []);

  // Mock car data for demonstration
  const mockCars: CarType[] = useMemo(() => [
    {
      id: '1',
      make: 'Toyota',
      model: 'RAV4',
      year: 2023,
      price: 32000,
      mileage: 15000,
      location: 'Seattle, WA',
      images: ['https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80'],
      created_at: '2024-01-01',
      fuel_type: 'gasoline',
      transmission: 'automatic',
    },
    {
      id: '2',
      make: 'Tesla',
      model: 'Model 3',
      year: 2024,
      price: 45000,
      mileage: 5000,
      location: 'San Francisco, CA',
      images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80'],
      created_at: '2024-01-02',
      fuel_type: 'electric',
      transmission: 'automatic',
    },
    {
      id: '3',
      make: 'Honda',
      model: 'CR-V',
      year: 2022,
      price: 28000,
      mileage: 25000,
      location: 'Portland, OR',
      images: ['https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=800&q=80'],
      created_at: '2024-01-03',
      fuel_type: 'gasoline',
      transmission: 'automatic',
    },
    // Add more mock cars...
  ], []);

  const defaultPreferences: UserPreferences = useMemo(() => ({
    budgetRange: [25000, 50000],
    preferredMakes: ['toyota', 'honda', 'tesla'],
    bodyTypes: ['suv', 'sedan'],
    fuelTypes: ['gasoline', 'electric', 'hybrid'],
    features: ['bluetooth', 'backup_camera', 'navigation'],
    maxMileage: 30000,
    minYear: 2020,
    location: {
      city: 'Seattle',
      state: 'WA',
      coordinates: [47.6062, -122.3321],
    },
    drivingHabits: {
      dailyMiles: 25,
      primaryUse: 'commuting',
      terrainType: 'mixed',
    },
    lifestyle: {
      hasFamily: false,
      petOwner: false,
      environmentallyConscious: true,
      technologyEnthusiast: true,
      luxuryOriented: false,
    },
  }), []);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const prefs = userPreferences || defaultPreferences;
      const recs = await aiEngine.generateRecommendations(prefs, mockCars);
      
      setRecommendations(recs.slice(0, maxRecommendations));
    } catch (err) {
      setError('Failed to generate recommendations. Please try again.');
      console.error('Recommendation error:', err);
    } finally {
      setLoading(false);
    }
  }, [userPreferences, defaultPreferences, aiEngine, mockCars, maxRecommendations]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleRefresh = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRefreshRecommendations();
    loadRecommendations();
  }, [onRefreshRecommendations, loadRecommendations]);

  const renderRecommendationCard = (recommendation: CarRecommendation, index: number) => {
    const categoryConfig = {
      perfect_match: { icon: Target, color: '#10B981', label: 'Perfect Match' },
      great_value: { icon: DollarSign, color: '#3B82F6', label: 'Great Value' },
      trending: { icon: TrendingUp, color: '#F59E0B', label: 'Trending' },
      alternative: { icon: Star, color: '#8B5CF6', label: 'Alternative' },
    };

    const config = categoryConfig[recommendation.category];
    const Icon = config.icon;

    return (
      <Animated.View
        key={recommendation.car.id}
        entering={FadeIn.delay(index * 100).springify()}
        style={styles.recommendationContainer}
      >
        {/* Category Badge */}
        <View style={[styles.categoryBadge, { backgroundColor: config.color }]}>
          <Icon size={12} color={colors.white} />
          <Text style={styles.categoryText}>{config.label}</Text>
        </View>

        {/* Confidence Indicator */}
        <View style={styles.confidenceContainer}>
          <Text style={[styles.confidenceText, { color: colors.textSecondary }]}>
            {Math.round(recommendation.confidence * 100)}% match
          </Text>
          <View style={[styles.confidenceBar, { backgroundColor: colors.border }]}>
            <View 
              style={[
                styles.confidenceFill,
                { 
                  backgroundColor: config.color,
                  width: `${recommendation.confidence * 100}%`
                }
              ]} 
            />
          </View>
        </View>

        {/* Car Card */}
        <UltraPremiumCarCard
          car={recommendation.car}
          onPress={() => onCarPress(recommendation.car)}
          isFeatured={recommendation.category === 'perfect_match'}
          isPremiumListing={recommendation.score.overall > 0.8}
          variant="standard"
        />

        {/* Recommendation Reasons */}
        <View style={styles.reasonsContainer}>
          <Text style={[styles.reasonsTitle, { color: colors.text }]}>
            Why we recommend this car:
          </Text>
          {recommendation.reasons.map((reason, idx) => (
            <View key={idx} style={styles.reasonItem}>
              <Sparkles size={12} color={config.color} />
              <Text style={[styles.reasonText, { color: colors.textSecondary }]}>
                {reason}
              </Text>
            </View>
          ))}
        </View>

        {/* Deal Info */}
        {recommendation.dealInfo?.isHotDeal && (
          <View style={[styles.dealContainer, { backgroundColor: '#EF4444' }]}>
            <Zap size={16} color={colors.white} />
            <Text style={styles.dealText}>
              Hot Deal - {recommendation.dealInfo.timeLeft} left!
            </Text>
            {recommendation.savings && recommendation.savings > 0 && (
              <Text style={styles.savingsText}>
                Save ${recommendation.savings.toLocaleString()}
              </Text>
            )}
          </View>
        )}
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          AI is analyzing your preferences...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
        <Button title="Try Again" onPress={loadRecommendations} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sparkles size={24} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            AI Recommendations
          </Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <RefreshCw size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Subtitle */}
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Personalized picks based on your preferences and behavior
      </Text>

      {/* Recommendations */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {recommendations.map(renderRecommendationCard)}
      </ScrollView>
    </View>
  );
};

const getThemedStyles = (colors: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    headerTitle: {
      ...Typography.sectionTitle,
      fontWeight: '700',
    },
    refreshButton: {
      padding: Spacing.sm,
    },
    subtitle: {
      ...Typography.caption,
      paddingHorizontal: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.xl,
    },
    recommendationContainer: {
      marginBottom: Spacing.xl,
      position: 'relative',
    },
    categoryBadge: {
      position: 'absolute',
      top: -8,
      left: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Spacing.sm,
      paddingVertical: Spacing.xs,
      borderRadius: BorderRadius.full,
      gap: 4,
      zIndex: 10,
      ...Shadows.sm,
    },
    categoryText: {
      ...Typography.caption,
      color: colors.white,
      fontWeight: '600',
      fontSize: 10,
    },
    confidenceContainer: {
      position: 'absolute',
      top: -8,
      right: Spacing.md,
      alignItems: 'flex-end',
      zIndex: 10,
    },
    confidenceText: {
      ...Typography.caption,
      fontWeight: '600',
      fontSize: 10,
      marginBottom: 2,
    },
    confidenceBar: {
      width: 60,
      height: 4,
      borderRadius: 2,
      overflow: 'hidden',
    },
    confidenceFill: {
      height: '100%',
      borderRadius: 2,
    },
    reasonsContainer: {
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      marginTop: Spacing.sm,
      ...Shadows.sm,
    },
    reasonsTitle: {
      ...Typography.caption,
      fontWeight: '600',
      marginBottom: Spacing.sm,
    },
    reasonItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.xs,
    },
    reasonText: {
      ...Typography.caption,
      flex: 1,
    },
    dealContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      marginTop: Spacing.sm,
      gap: Spacing.sm,
    },
    dealText: {
      ...Typography.caption,
      color: colors.white,
      fontWeight: '600',
      flex: 1,
    },
    savingsText: {
      ...Typography.caption,
      color: colors.white,
      fontWeight: '700',
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.xl,
    },
    loadingText: {
      ...Typography.bodyText,
      textAlign: 'center',
      marginTop: Spacing.lg,
    },
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.xl,
    },
    errorText: {
      ...Typography.bodyText,
      textAlign: 'center',
      marginBottom: Spacing.lg,
    },
  });
};
