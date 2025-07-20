import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

import { useDesignTokens } from '@/hooks/useDesignTokens';
import { useThemeColors } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { CarCard } from '@/components/CarCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { UnifiedSearchFilter } from '@/components/ui/UnifiedSearchFilter';
import { useAuth } from '@/contexts/AuthContext';
import { Car } from '@/types/database';
import { Sparkles, Star, TrendingUp, Zap, Heart, ArrowRight } from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');

interface AIPreference {
  id: string;
  category: 'budget' | 'usage' | 'style' | 'features' | 'performance';
  label: string;
  value: any;
  weight: number;
  confidence: number;
}

interface AIRecommendation {
  id: string;
  car: Car;
  score: number;
  reasons: string[];
  matchPercentage: number;
  category: 'perfect' | 'great' | 'good' | 'consider';
  priceScore: number;
  featureScore: number;
  reliabilityScore: number;
  userPreferenceScore: number;
}

interface AIRecommendationEngineProps {
  userPreferences?: AIPreference[];
  searchFilters?: any;
  onRecommendationSelect?: (recommendation: AIRecommendation) => void;
  maxRecommendations?: number;
  showExplanations?: boolean;
}

export const AIRecommendationEngine: React.FC<AIRecommendationEngineProps> = ({
  userPreferences = [],
  searchFilters = {},
  onRecommendationSelect,
  maxRecommendations = 10,
  showExplanations = true,
}) => {
  const { colors } = useThemeColors();
  const { layout, cards, buttons, spacing } = useDesignTokens();
  const { user } = useAuth();
  
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({});
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const recommendationsOpacity = useSharedValue(0);
  const sparkleRotation = useSharedValue(0);
  
  // Mock AI preferences based on user data
  const mockUserPreferences: AIPreference[] = [
    {
      id: 'budget',
      category: 'budget',
      label: 'Budget Range',
      value: '25000-50000',
      weight: 0.3,
      confidence: 0.85,
    },
    {
      id: 'usage',
      category: 'usage',
      label: 'Primary Usage',
      value: 'family',
      weight: 0.25,
      confidence: 0.9,
    },
    {
      id: 'style',
      category: 'style',
      label: 'Style Preference',
      value: 'suv',
      weight: 0.2,
      confidence: 0.75,
    },
    {
      id: 'features',
      category: 'features',
      label: 'Important Features',
      value: ['safety', 'fuel_efficiency', 'technology'],
      weight: 0.15,
      confidence: 0.8,
    },
    {
      id: 'performance',
      category: 'performance',
      label: 'Performance Priority',
      value: 'balanced',
      weight: 0.1,
      confidence: 0.7,
    },
  ];

  // Mock car database for recommendations
  const mockCars: Car[] = [
    {
      id: '1',
      make: 'Toyota',
      model: 'RAV4 Hybrid',
      year: 2024,
      price: 32000,
      mileage: 50000,
      location: 'Dublin',
      images: ['https://example.com/rav4.jpg'],
      created_at: '2024-01-15T00:00:00Z',
      fuel_type: 'Hybrid',
      transmission: 'Automatic',
    },
    {
      id: '2',
      make: 'Honda',
      model: 'CR-V',
      year: 2023,
      price: 28000,
      mileage: 45000,
      location: 'Cork',
      images: ['https://example.com/crv.jpg'],
      created_at: '2024-01-10T00:00:00Z',
      fuel_type: 'Petrol',
      transmission: 'Automatic',
    },
    {
      id: '3',
      make: 'Mazda',
      model: 'CX-5',
      year: 2024,
      price: 35000,
      mileage: 40000,
      location: 'Galway',
      images: ['https://example.com/cx5.jpg'],
      created_at: '2024-01-20T00:00:00Z',
      fuel_type: 'Petrol',
      transmission: 'Automatic',
    },
    {
      id: '4',
      make: 'BMW',
      model: 'X3',
      year: 2023,
      price: 45000,
      mileage: 35000,
      location: 'Dublin',
      images: ['https://example.com/x3.jpg'],
      created_at: '2024-01-25T00:00:00Z',
      fuel_type: 'Petrol',
      transmission: 'Automatic',
    },
    {
      id: '5',
      make: 'Audi',
      model: 'Q5',
      year: 2024,
      price: 48000,
      mileage: 42000,
      location: 'Cork',
      images: ['https://example.com/q5.jpg'],
      created_at: '2024-01-30T00:00:00Z',
      fuel_type: 'Petrol',
      transmission: 'Automatic',
    },
  ];

  // AI scoring algorithm
  const calculateAIScore = useCallback((car: Car, preferences: AIPreference[]): AIRecommendation => {
    let totalScore = 0;
    let reasons: string[] = [];
    let priceScore = 0;
    let featureScore = 0;
    let reliabilityScore = 0;
    let userPreferenceScore = 0;

    preferences.forEach(preference => {
      let score = 0;
      
      switch (preference.category) {
        case 'budget':
          const [minPrice, maxPrice] = preference.value.split('-').map(Number);
          if (car.price >= minPrice && car.price <= maxPrice) {
            score = 100;
            reasons.push(`Perfect price match (€${car.price.toLocaleString()})`);
          } else if (car.price < minPrice) {
            score = 80;
            reasons.push(`Great value under budget (€${car.price.toLocaleString()})`);
          } else {
            score = Math.max(0, 60 - ((car.price - maxPrice) / 1000));
            if (score > 40) reasons.push(`Slightly over budget but worth it`);
          }
          priceScore = score;
          break;
          
        case 'usage':
          if (preference.value === 'family') {
            const familyFriendly = ['RAV4', 'CR-V', 'CX-5', 'X3', 'Q5'];
            if (familyFriendly.some(model => car.model.includes(model))) {
              score = 90;
              reasons.push(`Excellent family vehicle`);
            } else {
              score = 60;
            }
          }
          userPreferenceScore += score * 0.4;
          break;
          
        case 'style':
          if (preference.value === 'suv') {
            const suvModels = ['RAV4', 'CR-V', 'CX-5', 'X3', 'Q5'];
            if (suvModels.some(model => car.model.includes(model))) {
              score = 95;
              reasons.push(`Perfect SUV match`);
            } else {
              score = 30;
            }
          }
          userPreferenceScore += score * 0.3;
          break;
          
        case 'features':
          const features = preference.value as string[];
          let featureCount = 0;
          
          if (features.includes('safety')) {
            featureCount++;
            reasons.push(`Advanced safety features`);
          }
          if (features.includes('fuel_efficiency') && car.fuel_type === 'Hybrid') {
            featureCount += 2;
            reasons.push(`Excellent fuel efficiency (${car.fuel_type})`);
          }
          if (features.includes('technology')) {
            featureCount++;
            reasons.push(`Latest technology features`);
          }
          
          score = (featureCount / features.length) * 100;
          featureScore = score;
          break;
          
        case 'performance':
          const luxuryBrands = ['BMW', 'Audi', 'Mercedes-Benz'];
          if (luxuryBrands.includes(car.make)) {
            score = 85;
            reasons.push(`Premium performance (${car.make})`);
          } else {
            score = 70;
            reasons.push(`Reliable performance`);
          }
          break;
      }
      
      totalScore += score * preference.weight * preference.confidence;
    });

    // Reliability score based on brand reputation
    const reliableBrands = ['Toyota', 'Honda', 'Mazda'];
    if (reliableBrands.includes(car.make)) {
      reliabilityScore = 90;
      reasons.push(`Highly reliable brand`);
    } else {
      reliabilityScore = 75;
    }

    // Mileage consideration
    if (car.mileage > 50000) {
      totalScore *= 0.95;
      reasons.push(`Higher mileage considered`);
    } else if (car.mileage < 30000) {
      totalScore *= 1.05;
      reasons.push(`Low mileage advantage`);
    }

    const matchPercentage = Math.min(Math.round(totalScore), 100);
    let category: 'perfect' | 'great' | 'good' | 'consider' = 'consider';
    
    if (matchPercentage >= 90) category = 'perfect';
    else if (matchPercentage >= 80) category = 'great';
    else if (matchPercentage >= 70) category = 'good';

    return {
      id: car.id,
      car,
      score: totalScore,
      reasons: reasons.slice(0, 4), // Limit to top 4 reasons
      matchPercentage,
      category,
      priceScore,
      featureScore,
      reliabilityScore,
      userPreferenceScore,
    };
  }, []);

  // Generate AI recommendations
  const generateRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const preferences = userPreferences.length > 0 ? userPreferences : mockUserPreferences;
      const scoredCars = mockCars.map(car => calculateAIScore(car, preferences));
      
      // Sort by score and take top recommendations
      const sortedRecommendations = scoredCars
        .sort((a, b) => b.score - a.score)
        .slice(0, maxRecommendations);
      
      setRecommendations(sortedRecommendations);
      
      // Animate in
      headerOpacity.value = withTiming(1, { duration: 500 });
      recommendationsOpacity.value = withTiming(1, { duration: 800 });
      
    } catch (err) {
      setError('Failed to generate recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userPreferences, mockUserPreferences, calculateAIScore, maxRecommendations]);

  // Refresh recommendations
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    sparkleRotation.value = withSpring(sparkleRotation.value + 360, {
      duration: 1000,
    });
    await generateRecommendations();
    setRefreshing(false);
  }, [generateRecommendations]);

  // Toggle details for a recommendation
  const toggleDetails = useCallback((id: string) => {
    setShowDetails(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Handle recommendation selection
  const handleRecommendationPress = useCallback((recommendation: AIRecommendation) => {
    onRecommendationSelect?.(recommendation);
  }, [onRecommendationSelect]);

  // Load recommendations on mount
  useEffect(() => {
    generateRecommendations();
  }, []);

  // Animated styles
  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const recommendationsStyle = useAnimatedStyle(() => ({
    opacity: recommendationsOpacity.value,
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotation.value}deg` }],
  }));

  // Render category badge
  const renderCategoryBadge = (category: string) => {
    const config = {
      perfect: { color: colors.success, label: 'Perfect Match', icon: '🎯' },
      great: { color: colors.primary, label: 'Great Choice', icon: '⭐' },
      good: { color: colors.warning, label: 'Good Option', icon: '👍' },
      consider: { color: colors.textSecondary, label: 'Consider', icon: '💭' },
    };
    
    const { color, label, icon } = config[category as keyof typeof config];
    
    return (
      <View style={[styles.categoryBadge, { backgroundColor: color }]}>
        <Text style={styles.categoryIcon}>{icon}</Text>
        <Text style={styles.categoryLabel}>{label}</Text>
      </View>
    );
  };

  // Render recommendation item
  const renderRecommendation = (recommendation: AIRecommendation) => {
    const isExpanded = showDetails[recommendation.id];
    
    return (
      <Card key={recommendation.id} style={styles.recommendationCard}>
        <View style={styles.recommendationHeader}>
          <View style={styles.recommendationInfo}>
            <View style={styles.recommendationTitle}>
              <Text style={[styles.carTitle, { color: colors.text }]}>
                {recommendation.car.make} {recommendation.car.model}
              </Text>
              {renderCategoryBadge(recommendation.category)}
            </View>
            <Text style={[styles.carPrice, { color: colors.primary }]}>
              €{recommendation.car.price.toLocaleString()}
            </Text>
          </View>
          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreText, { color: colors.text }]}>
              {recommendation.matchPercentage}%
            </Text>
            <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
              Match
            </Text>
          </View>
        </View>
        
        <View style={styles.reasonsContainer}>
          <Text style={[styles.reasonsTitle, { color: colors.text }]}>
            Why this car fits you:
          </Text>
          {recommendation.reasons.slice(0, 2).map((reason, index) => (
            <Text key={index} style={[styles.reasonText, { color: colors.textSecondary }]}>
              • {reason}
            </Text>
          ))}
          {recommendation.reasons.length > 2 && (
            <TouchableOpacity onPress={() => toggleDetails(recommendation.id)}>
              <Text style={[styles.showMoreText, { color: colors.primary }]}>
                {isExpanded ? 'Show less' : `${recommendation.reasons.length - 2} more reasons`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {isExpanded && (
          <View style={styles.expandedDetails}>
            {recommendation.reasons.slice(2).map((reason, index) => (
              <Text key={index} style={[styles.reasonText, { color: colors.textSecondary }]}>
                • {reason}
              </Text>
            ))}
            
            <View style={styles.scoresContainer}>
              <View style={styles.scoreBreakdown}>
                <Text style={[styles.scoreBreakdownLabel, { color: colors.text }]}>
                  Price: {Math.round(recommendation.priceScore)}%
                </Text>
                <Text style={[styles.scoreBreakdownLabel, { color: colors.text }]}>
                  Features: {Math.round(recommendation.featureScore)}%
                </Text>
                <Text style={[styles.scoreBreakdownLabel, { color: colors.text }]}>
                  Reliability: {Math.round(recommendation.reliabilityScore)}%
                </Text>
              </View>
            </View>
          </View>
        )}
        
        <View style={styles.actionButtons}>
          <Button
            title="View Details"
            onPress={() => handleRecommendationPress(recommendation)}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title="Contact Dealer"
            onPress={() => handleRecommendationPress(recommendation)}
            style={styles.actionButton}
          />
        </View>
      </Card>
    );
  };

  if (loading && recommendations.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={sparkleStyle}>
          <Sparkles color={colors.primary} size={48} />
        </Animated.View>
        <Text style={[styles.loadingText, { color: colors.text }]}>
          AI is analyzing your preferences...
        </Text>
        <Text style={[styles.loadingSubtext, { color: colors.textSecondary }]}>
          Finding your perfect car match
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="Unable to Generate Recommendations"
        subtitle={error}
        icon={<Sparkles color={colors.textSecondary} size={48} />}
        action={
          <Button title="Try Again" onPress={generateRecommendations} />
        }
      />
    );
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, headerStyle]}>
        <LinearGradient
          colors={[colors.primary, colors.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Animated.View style={sparkleStyle}>
              <Sparkles color={colors.white} size={24} />
            </Animated.View>
            <Text style={styles.headerTitle}>AI Recommendations</Text>
            <Text style={styles.headerSubtitle}>
              Powered by machine learning
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleRefresh}
            style={styles.refreshButton}
            disabled={refreshing}
          >
            <RefreshCw color={colors.white} size={20} />
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
      
      <Animated.View style={[styles.content, recommendationsStyle]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {recommendations.map(renderRecommendation)}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    marginBottom: 20,
  },
  headerGradient: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginLeft: 12,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 8,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  recommendationCard: {
    marginBottom: 16,
    padding: 16,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recommendationInfo: {
    flex: 1,
  },
  recommendationTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  carTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  carPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 8,
    minWidth: 60,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  reasonsContainer: {
    marginBottom: 16,
  },
  reasonsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 2,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  expandedDetails: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  scoresContainer: {
    marginTop: 12,
  },
  scoreBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scoreBreakdownLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default AIRecommendationEngine;
