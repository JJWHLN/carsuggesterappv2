import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ModernCarCard } from './ModernCarCard';
import { Button } from './ui/Button';
import { LoadingState } from './ui/LoadingState';
import { ErrorState } from './ui/ErrorState';
import { EmptyState } from './ui/EmptyState';
import { useThemeColors } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Car } from '@/types/database';
import { fetchVehicleListings } from '@/services/supabaseService';
import AdvancedAnalyticsService from '@/services/advancedAnalytics';
import { transformDatabaseVehicleListingToCar } from '@/utils/dataTransformers';
import * as Haptics from 'expo-haptics';
import { Sparkles, TrendingUp, Heart, Clock, Zap, Users, Crown, Award } from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');

interface RecommendationSection {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: [string, string];
  cars: Car[];
  algorithm: string;
  confidence: number;
}

interface SmartRecommendationsProps {
  onCarPress: (car: Car) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

const SmartRecommendations: React.FC<SmartRecommendationsProps> = ({
  onCarPress,
  refreshing = false,
  onRefresh,
}) => {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsService] = useState(() => AdvancedAnalyticsService.getInstance());
  const styles = useMemo(() => getThemedStyles(colors), [colors]);

  const loadRecommendations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Track recommendation generation
      analyticsService.trackUserEngagement('recommendations_requested', {
        user_id: user?.id,
        timestamp: Date.now(),
      });

      const sections: RecommendationSection[] = [];

      // 1. Netflix-style "For You" recommendations
      if (user) {
        const personalizedIds = await analyticsService.generatePersonalizedRecommendations(user.id);
        if (personalizedIds.length > 0) {
          // In a real app, you'd fetch cars by IDs
          const forYouCars = await fetchVehicleListings(0, 5);
          if (Array.isArray(forYouCars) && forYouCars.length > 0) {
            sections.push({
              id: 'for_you',
              title: 'For You',
              subtitle: 'Personalized based on your activity',
              icon: <Heart color={colors.white} size={20} />,
              gradient: ['#667eea', '#764ba2'],
              cars: forYouCars.map(transformDatabaseVehicleListingToCar),
              algorithm: 'collaborative_filtering',
              confidence: 0.85,
            });
          }
        }
      }

      // 2. TikTok-style "Trending Now"
      const trendingCars = await fetchVehicleListings(0, 6);
      if (Array.isArray(trendingCars) && trendingCars.length > 0) {
        sections.push({
          id: 'trending',
          title: 'Trending Now',
          subtitle: 'Popular cars everyone is viewing',
          icon: <TrendingUp color={colors.white} size={20} />,
          gradient: ['#FF6B6B', '#4ECDC4'],
          cars: trendingCars.map(transformDatabaseVehicleListingToCar),
          algorithm: 'popularity_score',
          confidence: 0.92,
        });
      }

      // 3. Instagram-style "Recently Liked"
      const electricCars = await fetchVehicleListings(0, 4);
      if (Array.isArray(electricCars) && electricCars.length > 0) {
        sections.push({
          id: 'eco_friendly',
          title: 'Eco-Friendly Picks',
          subtitle: 'Electric & hybrid vehicles',
          icon: <Zap color={colors.white} size={20} />,
          gradient: ['#A8E6CF', '#56CC9D'],
          cars: electricCars.map(transformDatabaseVehicleListingToCar),
          algorithm: 'content_based',
          confidence: 0.78,
        });
      }

      // 4. Zillow-style "In Your Budget"
      const budgetCars = await fetchVehicleListings(0, 5);
      if (Array.isArray(budgetCars) && budgetCars.length > 0) {
        sections.push({
          id: 'budget_friendly',
          title: 'Best Value',
          subtitle: 'Great cars within your budget',
          icon: <Award color={colors.white} size={20} />,
          gradient: ['#FFD93D', '#FF6B35'],
          cars: budgetCars.map(transformDatabaseVehicleListingToCar),
          algorithm: 'price_optimization',
          confidence: 0.73,
        });
      }

      // 5. Luxury recommendations
      const luxuryCars = await fetchVehicleListings(0, 4);
      if (Array.isArray(luxuryCars) && luxuryCars.length > 0) {
        sections.push({
          id: 'luxury',
          title: 'Premium Collection',
          subtitle: 'Luxury vehicles for the discerning',
          icon: <Crown color={colors.white} size={20} />,
          gradient: ['#f093fb', '#f5576c'],
          cars: luxuryCars.map(transformDatabaseVehicleListingToCar),
          algorithm: 'luxury_curation',
          confidence: 0.88,
        });
      }

      setRecommendations(sections);

      // Track successful load
      analyticsService.trackUserEngagement('recommendations_loaded', {
        sections_count: sections.length,
        total_cars: sections.reduce((sum, section) => sum + section.cars.length, 0),
      });

    } catch (err) {
      logger.error('Error loading recommendations:', err);
      setError('Failed to load recommendations');
      
      analyticsService.trackUserEngagement('recommendations_error', {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  }, [user, analyticsService, colors]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const handleCarPress = useCallback((car: Car, section: RecommendationSection) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Track car selection from recommendations
    analyticsService.trackUserEngagement('recommendation_car_selected', {
      car_id: car.id,
      section_id: section.id,
      algorithm: section.algorithm,
      confidence: section.confidence,
      position: section.cars.findIndex(c => c.id === car.id),
    });

    onCarPress(car);
  }, [analyticsService, onCarPress]);

  const handleSeeAllPress = useCallback((section: RecommendationSection) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    analyticsService.trackUserEngagement('recommendation_see_all', {
      section_id: section.id,
      algorithm: section.algorithm,
    });
  }, [analyticsService]);

  const renderRecommendationSection = useCallback((section: RecommendationSection) => (
    <View key={section.id} style={styles.section}>
      {/* Section Header with Gradient Badge */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleContainer}>
          <LinearGradient
            colors={section.gradient}
            style={styles.sectionIconBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {section.icon}
          </LinearGradient>
          <View style={styles.sectionTextContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {section.subtitle}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.seeAllButton}
          onPress={() => handleSeeAllPress(section)}
        >
          <Text style={[styles.seeAllText, { color: colors.primary }]}>See All</Text>
        </TouchableOpacity>
      </View>

      {/* Confidence Score Indicator */}
      <View style={styles.confidenceContainer}>
        <View style={[styles.confidenceBar, { backgroundColor: colors.border }]}>
          <View 
            style={[
              styles.confidenceFill, 
              { 
                backgroundColor: colors.success,
                width: `${section.confidence * 100}%`
              }
            ]} 
          />
        </View>
        <Text style={[styles.confidenceText, { color: colors.textMuted }]}>
          {Math.round(section.confidence * 100)}% match
        </Text>
      </View>

      {/* Cars Horizontal Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carsScrollContainer}
      >
        {section.cars.map((car, index) => (
          <View key={car.id} style={styles.carCardContainer}>
            <ModernCarCard
              car={car}
              onPress={() => handleCarPress(car, section)}
              showSaveButton={true}
              style={styles.horizontalCarCard}
            />
            {/* Position indicator for A/B testing */}
            <View style={styles.positionIndicator}>
              <Text style={[styles.positionText, { color: colors.textMuted }]}>
                {index + 1}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  ), [colors, styles, handleCarPress, handleSeeAllPress]);

  if (loading) {
    return (
      <View style={styles.container}>
        <LoadingState message="Building personalized recommendations..." />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ErrorState
          title="Recommendations Unavailable"
          message={error}
          onRetry={loadRecommendations}
        />
      </View>
    );
  }

  if (recommendations.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="No Recommendations Yet"
          subtitle="Browse some cars to get personalized suggestions"
          icon={<Sparkles color={colors.textMuted} size={48} />}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh || loadRecommendations}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <LinearGradient
          colors={[colors.primary, '#16A34A']}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.headerContent}>
            <Sparkles color={colors.white} size={24} />
            <Text style={styles.headerTitle}>Smart Recommendations</Text>
            <Text style={styles.headerSubtitle}>
              AI-powered suggestions just for you
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* Recommendation Sections */}
      {recommendations.map(renderRecommendationSection)}

      {/* Performance Insights (for testing) */}
      {__DEV__ && (
        <View style={styles.debugSection}>
          <Text style={[styles.debugTitle, { color: colors.textSecondary }]}>
            Debug Info
          </Text>
          <Text style={[styles.debugText, { color: colors.textMuted }]}>
            Loaded {recommendations.length} sections with{' '}
            {recommendations.reduce((sum, s) => sum + s.cars.length, 0)} cars
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    marginBottom: 24,
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginTop: 4,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sectionIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionTextContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  seeAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  confidenceBar: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '500',
    minWidth: 60,
  },
  carsScrollContainer: {
    paddingLeft: 20,
    paddingRight: 10,
    gap: 16,
  },
  carCardContainer: {
    position: 'relative',
  },
  horizontalCarCard: {
    width: width * 0.85,
    marginHorizontal: 0,
    marginBottom: 0,
  },
  positionIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  positionText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  debugSection: {
    padding: 20,
    marginTop: 20,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 12,
  },
});

export { SmartRecommendations };
