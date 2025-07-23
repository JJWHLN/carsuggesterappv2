/**
 * Smart Car Comparison Tool - Phase 3
 * AI-powered multi-car comparison with advanced analytics
 * and decision support for the smartest car marketplace
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Car } from '@/types/database';
import { useThemeColors } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';
import AdvancedAnalyticsService from '@/services/advancedAnalyticsService';
import AICarRecommendationEngine from '@/services/aiCarRecommendationEngine';

interface SmartCarComparisonProps {
  cars: Car[];
  onCarRemove: (carId: string) => void;
  onCarAdd: () => void;
  onScheduleTestDrive: (carId: string) => void;
  onContactDealer: (carId: string) => void;
  userId: string;
}

interface ComparisonMetric {
  id: string;
  name: string;
  category: 'performance' | 'economics' | 'features' | 'safety' | 'environmental';
  weight: number;
  format: 'number' | 'currency' | 'percentage' | 'rating' | 'text';
  higherIsBetter: boolean;
  description: string;
  icon: string;
}

interface ComparisonScore {
  carId: string;
  totalScore: number;
  categoryScores: Record<string, number>;
  pros: string[];
  cons: string[];
  reasoning: string;
  recommendation: 'best_overall' | 'best_value' | 'best_performance' | 'best_efficiency' | null;
}

interface DecisionFactor {
  id: string;
  name: string;
  importance: number;
  userWeight: number;
  description: string;
  category: string;
}

const { width } = Dimensions.get('window');

const SmartCarComparison: React.FC<SmartCarComparisonProps> = ({
  cars,
  onCarRemove,
  onCarAdd,
  onScheduleTestDrive,
  onContactDealer,
  userId,
}) => {
  const { colors } = useThemeColors();
  const analyticsService = AdvancedAnalyticsService.getInstance();
  const recommendationEngine = AICarRecommendationEngine.getInstance();

  const [comparisonMode, setComparisonMode] = useState<'basic' | 'advanced' | 'ai_powered'>('ai_powered');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['performance', 'economics', 'features', 'safety']);
  const [customWeights, setCustomWeights] = useState<Record<string, number>>({});
  const [showAIInsights, setShowAIInsights] = useState(true);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [decisionFactors, setDecisionFactors] = useState<DecisionFactor[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>(['overview']);

  const animatedValue = useSharedValue(0);

  const comparisonMetrics: ComparisonMetric[] = [
    // Performance Metrics
    {
      id: 'horsepower',
      name: 'Horsepower',
      category: 'performance',
      weight: 0.8,
      format: 'number',
      higherIsBetter: true,
      description: 'Engine power output',
      icon: '⚡',
    },
    {
      id: 'acceleration',
      name: '0-100 km/h',
      category: 'performance',
      weight: 0.7,
      format: 'number',
      higherIsBetter: false,
      description: 'Acceleration time in seconds',
      icon: '🏎️',
    },
    {
      id: 'top_speed',
      name: 'Top Speed',
      category: 'performance',
      weight: 0.5,
      format: 'number',
      higherIsBetter: true,
      description: 'Maximum speed in km/h',
      icon: '🚀',
    },
    
    // Economic Metrics
    {
      id: 'price',
      name: 'Price',
      category: 'economics',
      weight: 0.9,
      format: 'currency',
      higherIsBetter: false,
      description: 'Purchase price',
      icon: '💰',
    },
    {
      id: 'fuel_economy',
      name: 'Fuel Economy',
      category: 'economics',
      weight: 0.8,
      format: 'number',
      higherIsBetter: true,
      description: 'Fuel efficiency in L/100km',
      icon: '⛽',
    },
    {
      id: 'insurance_cost',
      name: 'Insurance Cost',
      category: 'economics',
      weight: 0.7,
      format: 'currency',
      higherIsBetter: false,
      description: 'Annual insurance estimate',
      icon: '🛡️',
    },
    {
      id: 'resale_value',
      name: 'Resale Value',
      category: 'economics',
      weight: 0.6,
      format: 'percentage',
      higherIsBetter: true,
      description: 'Expected value retention',
      icon: '📈',
    },
    
    // Feature Metrics
    {
      id: 'tech_score',
      name: 'Technology Score',
      category: 'features',
      weight: 0.7,
      format: 'rating',
      higherIsBetter: true,
      description: 'Technology and connectivity features',
      icon: '📱',
    },
    {
      id: 'comfort_score',
      name: 'Comfort Score',
      category: 'features',
      weight: 0.8,
      format: 'rating',
      higherIsBetter: true,
      description: 'Interior comfort and convenience',
      icon: '🪑',
    },
    {
      id: 'cargo_space',
      name: 'Cargo Space',
      category: 'features',
      weight: 0.6,
      format: 'number',
      higherIsBetter: true,
      description: 'Cargo capacity in liters',
      icon: '📦',
    },
    
    // Safety Metrics
    {
      id: 'safety_rating',
      name: 'Safety Rating',
      category: 'safety',
      weight: 0.9,
      format: 'rating',
      higherIsBetter: true,
      description: 'Overall safety score',
      icon: '🛡️',
    },
    {
      id: 'adas_features',
      name: 'ADAS Features',
      category: 'safety',
      weight: 0.7,
      format: 'number',
      higherIsBetter: true,
      description: 'Number of advanced driver assistance features',
      icon: '🤖',
    },
    
    // Environmental Metrics
    {
      id: 'co2_emissions',
      name: 'CO₂ Emissions',
      category: 'environmental',
      weight: 0.8,
      format: 'number',
      higherIsBetter: false,
      description: 'Carbon emissions in g/km',
      icon: '🌱',
    },
    {
      id: 'environmental_score',
      name: 'Environmental Score',
      category: 'environmental',
      weight: 0.7,
      format: 'rating',
      higherIsBetter: true,
      description: 'Overall environmental impact rating',
      icon: '🌍',
    },
  ];

  useEffect(() => {
    if (cars.length >= 2) {
      generateAdvancedComparison();
    }
  }, [cars, comparisonMode, selectedCategories, customWeights]);

  useEffect(() => {
    animatedValue.value = withSpring(1);
  }, []);

  const generateAdvancedComparison = useCallback(async () => {
    if (cars.length < 2) return;

    setLoading(true);
    try {
      const carIds = cars.map(car => car.id);
      
      if (comparisonMode === 'ai_powered') {
        const aiComparison = await recommendationEngine.generateIntelligentComparison(
          carIds,
          userId,
          {
            focus_areas: selectedCategories,
            decision_timeline: 'weeks',
          }
        );
        setComparisonData(aiComparison);
      } else {
        // Generate basic/advanced comparison
        const basicComparison = generateBasicComparison();
        setComparisonData(basicComparison);
      }

      // Track comparison analytics
      await analyticsService.trackEvent('view', {
        action: 'car_comparison',
        comparison_mode: comparisonMode,
        car_count: cars.length,
        car_ids: carIds,
        categories: selectedCategories,
      });
    } catch (error) {
      logger.error('Failed to generate comparison:', error);
      Alert.alert('Error', 'Failed to generate comparison. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [cars, comparisonMode, selectedCategories, userId]);

  const generateBasicComparison = useCallback(() => {
    const scores: ComparisonScore[] = cars.map(car => {
      const categoryScores: Record<string, number> = {};
      let totalScore = 0;

      selectedCategories.forEach(category => {
        const categoryMetrics = comparisonMetrics.filter(m => m.category === category);
        let categoryScore = 0;

        categoryMetrics.forEach(metric => {
          const value = getCarMetricValue(car, metric.id);
          const normalizedScore = normalizeMetricValue(value, metric, cars);
          const weight = customWeights[metric.id] || metric.weight;
          categoryScore += normalizedScore * weight;
        });

        categoryScore = categoryScore / categoryMetrics.length;
        categoryScores[category] = categoryScore;
        totalScore += categoryScore;
      });

      totalScore = totalScore / selectedCategories.length;

      return {
        carId: car.id,
        totalScore,
        categoryScores,
        pros: generatePros(car, categoryScores),
        cons: generateCons(car, categoryScores),
        reasoning: generateReasoning(car, totalScore, categoryScores),
        recommendation: determineRecommendation(car, totalScore, categoryScores),
      };
    });

    return {
      cars,
      comparison_matrix: generateComparisonMatrix(),
      scores,
      ai_insights: null,
    };
  }, [cars, selectedCategories, customWeights, comparisonMetrics]);

  const getCarMetricValue = useCallback((car: Car, metricId: string): number => {
    // Mock data - in production, this would come from car specifications
    const mockData: Record<string, Record<string, number>> = {
      [car.id]: {
        horsepower: car.make === 'BMW' ? 300 : car.make === 'Tesla' ? 350 : 250,
        acceleration: car.make === 'Tesla' ? 4.2 : car.make === 'BMW' ? 5.8 : 7.2,
        top_speed: car.make === 'Tesla' ? 250 : car.make === 'BMW' ? 280 : 200,
        price: car.price,
        fuel_economy: car.fuel_type === 'Electric' ? 0 : car.make === 'Toyota' ? 5.5 : 8.2,
        insurance_cost: car.price * 0.05,
        resale_value: car.make === 'Tesla' ? 0.75 : car.make === 'BMW' ? 0.65 : 0.55,
        tech_score: car.make === 'Tesla' ? 9.5 : car.make === 'BMW' ? 8.5 : 7.0,
        comfort_score: car.make === 'Mercedes-Benz' ? 9.0 : car.make === 'BMW' ? 8.5 : 7.5,
        cargo_space: car.make === 'Tesla' ? 425 : 400,
        safety_rating: car.make === 'Tesla' ? 5.0 : car.make === 'BMW' ? 4.8 : 4.5,
        adas_features: car.make === 'Tesla' ? 15 : car.make === 'BMW' ? 12 : 8,
        co2_emissions: car.fuel_type === 'Electric' ? 0 : car.fuel_type === 'Hybrid' ? 95 : 155,
        environmental_score: car.fuel_type === 'Electric' ? 9.5 : car.fuel_type === 'Hybrid' ? 7.5 : 5.0,
      },
    };

    return mockData[car.id]?.[metricId] || 0;
  }, []);

  const normalizeMetricValue = useCallback(
    (value: number, metric: ComparisonMetric, allCars: Car[]): number => {
      const allValues = allCars.map(car => getCarMetricValue(car, metric.id));
      const min = Math.min(...allValues);
      const max = Math.max(...allValues);

      if (min === max) return 0.5;

      const normalized = (value - min) / (max - min);
      return metric.higherIsBetter ? normalized : 1 - normalized;
    },
    [getCarMetricValue]
  );

  const generatePros = useCallback((car: Car, categoryScores: Record<string, number>): string[] => {
    const pros: string[] = [];
    
    if (categoryScores.performance > 0.7) pros.push('Excellent performance');
    if (categoryScores.economics > 0.7) pros.push('Great value for money');
    if (categoryScores.features > 0.7) pros.push('Feature-rich');
    if (categoryScores.safety > 0.8) pros.push('Top safety ratings');
    if (categoryScores.environmental > 0.8) pros.push('Environmentally friendly');
    
    if (car.fuel_type === 'Electric') pros.push('Zero emissions');
    if (car.make === 'Tesla') pros.push('Cutting-edge technology');
    if (car.make === 'BMW') pros.push('Premium build quality');
    
    return pros.slice(0, 4);
  }, []);

  const generateCons = useCallback((car: Car, categoryScores: Record<string, number>): string[] => {
    const cons: string[] = [];
    
    if (categoryScores.performance < 0.4) cons.push('Limited performance');
    if (categoryScores.economics < 0.4) cons.push('Higher than average costs');
    if (categoryScores.features < 0.4) cons.push('Basic feature set');
    if (categoryScores.safety < 0.5) cons.push('Average safety features');
    
    if (car.price > 45000) cons.push('Premium pricing');
    if (car.fuel_type === 'Electric') cons.push('Charging infrastructure dependency');
    
    return cons.slice(0, 3);
  }, []);

  const generateReasoning = useCallback(
    (car: Car, totalScore: number, categoryScores: Record<string, number>): string => {
      const strongPoints = Object.entries(categoryScores)
        .filter(([_, score]) => score > 0.7)
        .map(([category, _]) => category);
      
      const weakPoints = Object.entries(categoryScores)
        .filter(([_, score]) => score < 0.4)
        .map(([category, _]) => category);

      let reasoning = `This ${car.make} ${car.model} scores ${(totalScore * 100).toFixed(0)}% overall. `;
      
      if (strongPoints.length > 0) {
        reasoning += `It excels in ${strongPoints.join(', ')}. `;
      }
      
      if (weakPoints.length > 0) {
        reasoning += `Areas for consideration include ${weakPoints.join(', ')}. `;
      }
      
      return reasoning;
    },
    []
  );

  const determineRecommendation = useCallback(
    (car: Car, totalScore: number, categoryScores: Record<string, number>): ComparisonScore['recommendation'] => {
      if (totalScore > 0.8) return 'best_overall';
      if (categoryScores.economics > 0.8) return 'best_value';
      if (categoryScores.performance > 0.8) return 'best_performance';
      if (categoryScores.environmental > 0.8) return 'best_efficiency';
      return null;
    },
    []
  );

  const generateComparisonMatrix = useCallback(() => {
    const matrix: Record<string, Record<string, any>> = {};
    
    cars.forEach(car => {
      matrix[car.id] = {};
      comparisonMetrics.forEach(metric => {
        matrix[car.id][metric.id] = getCarMetricValue(car, metric.id);
      });
    });
    
    return matrix;
  }, [cars, comparisonMetrics, getCarMetricValue]);

  const toggleCategory = useCallback((category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  }, []);

  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  }, []);

  const formatMetricValue = useCallback((value: number, format: ComparisonMetric['format']) => {
    switch (format) {
      case 'currency':
        return `€${value.toLocaleString()}`;
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`;
      case 'rating':
        return `${value.toFixed(1)}/10`;
      default:
        return value.toLocaleString();
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animatedValue.value,
    transform: [{ scale: animatedValue.value }],
  }));

  if (cars.length < 2) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            Add at least 2 cars to compare
          </Text>
          <TouchableOpacity 
            style={[styles.addCarButton, { backgroundColor: colors.primary }]}
            onPress={onCarAdd}
          >
            <Text style={[styles.addCarButtonText, { color: colors.background }]}>
              Add Cars to Compare
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.content, animatedStyle]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Smart Car Comparison
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            AI-powered analysis of {cars.length} vehicles
          </Text>
        </View>

        {/* Comparison Mode Selector */}
        <View style={[styles.modeSelector, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.modeSelectorTitle, { color: colors.text }]}>Analysis Mode</Text>
          <View style={styles.modeButtons}>
            {[
              { id: 'basic', name: 'Basic', icon: '📊' },
              { id: 'advanced', name: 'Advanced', icon: '🔬' },
              { id: 'ai_powered', name: 'AI-Powered', icon: '🤖' },
            ].map(mode => (
              <TouchableOpacity
                key={mode.id}
                style={[
                  styles.modeButton,
                  {
                    backgroundColor: comparisonMode === mode.id ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  }
                ]}
                onPress={() => setComparisonMode(mode.id as any)}
              >
                <Text style={styles.modeButtonIcon}>{mode.icon}</Text>
                <Text style={[
                  styles.modeButtonText,
                  { color: comparisonMode === mode.id ? colors.background : colors.text }
                ]}>
                  {mode.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Category Filters */}
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => toggleSection('categories')}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                📋 Comparison Categories
              </Text>
              <Text style={[styles.sectionToggle, { color: colors.textSecondary }]}>
                {expandedSections.includes('categories') ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>
            
            {expandedSections.includes('categories') && (
              <View style={styles.categoryFilters}>
                {['performance', 'economics', 'features', 'safety', 'environmental'].map(category => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryFilter,
                      {
                        backgroundColor: selectedCategories.includes(category) 
                          ? colors.primary 
                          : colors.surface,
                        borderColor: colors.border,
                      }
                    ]}
                    onPress={() => toggleCategory(category)}
                  >
                    <Text style={[
                      styles.categoryFilterText,
                      { 
                        color: selectedCategories.includes(category) 
                          ? colors.background 
                          : colors.text 
                      }
                    ]}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* AI Insights */}
          {comparisonData?.ai_insights && showAIInsights && (
            <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  🤖 AI Insights
                </Text>
                <Switch
                  value={showAIInsights}
                  onValueChange={setShowAIInsights}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
              
              <View style={styles.aiInsights}>
                <View style={[styles.insightCard, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.insightTitle, { color: colors.primary }]}>
                    🏆 Best Overall
                  </Text>
                  <Text style={[styles.insightText, { color: colors.text }]}>
                    {comparisonData.ai_insights.best_overall.reasoning}
                  </Text>
                </View>
                
                <View style={[styles.insightCard, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.insightTitle, { color: colors.primary }]}>
                    💰 Best Value
                  </Text>
                  <Text style={[styles.insightText, { color: colors.text }]}>
                    {comparisonData.ai_insights.best_value.reasoning}
                  </Text>
                </View>
                
                <View style={[styles.insightCard, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.insightTitle, { color: colors.primary }]}>
                    👤 Best for You
                  </Text>
                  <Text style={[styles.insightText, { color: colors.text }]}>
                    {comparisonData.ai_insights.best_for_user.reasoning}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Comparison Scores Overview */}
          {comparisonData?.scores && (
            <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
              <TouchableOpacity 
                style={styles.sectionHeader}
                onPress={() => toggleSection('overview')}
              >
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  📊 Overall Scores
                </Text>
                <Text style={[styles.sectionToggle, { color: colors.textSecondary }]}>
                  {expandedSections.includes('overview') ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
              
              {expandedSections.includes('overview') && (
                <View style={styles.scoreOverview}>
                  {comparisonData.scores.map((score: ComparisonScore) => {
                    const car = cars.find(c => c.id === score.carId)!;
                    return (
                      <View key={score.carId} style={[styles.scoreCard, { borderColor: colors.border }]}>
                        <View style={styles.scoreHeader}>
                          <Text style={[styles.scoreCarName, { color: colors.text }]}>
                            {car.make} {car.model}
                          </Text>
                          {score.recommendation && (
                            <View style={[styles.recommendationBadge, { backgroundColor: colors.primary }]}>
                              <Text style={[styles.recommendationText, { color: colors.background }]}>
                                {score.recommendation.replace('_', ' ').toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </View>
                        
                        <View style={styles.scoreDetails}>
                          <View style={styles.totalScore}>
                            <Text style={[styles.scoreValue, { color: colors.primary }]}>
                              {(score.totalScore * 100).toFixed(0)}%
                            </Text>
                            <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
                              Overall Score
                            </Text>
                          </View>
                          
                          <View style={styles.categoryScores}>
                            {Object.entries(score.categoryScores).map(([category, categoryScore]) => (
                              <View key={category} style={styles.categoryScore}>
                                <Text style={[styles.categoryName, { color: colors.textSecondary }]}>
                                  {category}
                                </Text>
                                <View style={[styles.scoreBar, { backgroundColor: colors.surface }]}>
                                  <View 
                                    style={[
                                      styles.scoreBarFill,
                                      { 
                                        backgroundColor: colors.primary,
                                        width: `${categoryScore * 100}%` 
                                      }
                                    ]} 
                                  />
                                </View>
                              </View>
                            ))}
                          </View>
                        </View>
                        
                        <View style={styles.prosConsContainer}>
                          <View style={styles.prosColumn}>
                            <Text style={[styles.prosConsTitle, { color: '#10b981' }]}>Pros</Text>
                            {score.pros.map((pro, index) => (
                              <Text key={index} style={[styles.prosConsItem, { color: colors.text }]}>
                                ✓ {pro}
                              </Text>
                            ))}
                          </View>
                          
                          <View style={styles.consColumn}>
                            <Text style={[styles.prosConsTitle, { color: '#ef4444' }]}>Considerations</Text>
                            {score.cons.map((con, index) => (
                              <Text key={index} style={[styles.prosConsItem, { color: colors.text }]}>
                                ⚠ {con}
                              </Text>
                            ))}
                          </View>
                        </View>
                        
                        <Text style={[styles.reasoning, { color: colors.textSecondary }]}>
                          {score.reasoning}
                        </Text>
                        
                        <View style={styles.carActions}>
                          <TouchableOpacity
                            style={[styles.actionButton, { backgroundColor: colors.surface }]}
                            onPress={() => onContactDealer(car.id)}
                          >
                            <Text style={[styles.actionButtonText, { color: colors.text }]}>
                              Contact Dealer
                            </Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity
                            style={[styles.actionButton, styles.primaryAction, { backgroundColor: colors.primary }]}
                            onPress={() => onScheduleTestDrive(car.id)}
                          >
                            <Text style={[styles.actionButtonText, { color: colors.background }]}>
                              Test Drive
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          {/* Detailed Metrics Comparison */}
          <View style={[styles.section, { backgroundColor: colors.cardBackground }]}>
            <TouchableOpacity 
              style={styles.sectionHeader}
              onPress={() => toggleSection('metrics')}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                📈 Detailed Metrics
              </Text>
              <Text style={[styles.sectionToggle, { color: colors.textSecondary }]}>
                {expandedSections.includes('metrics') ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>
            
            {expandedSections.includes('metrics') && (
              <View style={styles.metricsTable}>
                {/* Table Header */}
                <View style={styles.tableHeader}>
                  <View style={styles.metricNameColumn}>
                    <Text style={[styles.tableHeaderText, { color: colors.text }]}>Metric</Text>
                  </View>
                  {cars.map(car => (
                    <View key={car.id} style={styles.carColumn}>
                      <Text style={[styles.tableHeaderText, { color: colors.text }]}>
                        {car.make}
                      </Text>
                      <Text style={[styles.tableHeaderSubtext, { color: colors.textSecondary }]}>
                        {car.model}
                      </Text>
                    </View>
                  ))}
                </View>
                
                {/* Metrics Rows */}
                {comparisonMetrics
                  .filter(metric => selectedCategories.includes(metric.category))
                  .map(metric => (
                    <View key={metric.id} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                      <View style={styles.metricNameColumn}>
                        <Text style={[styles.metricName, { color: colors.text }]}>
                          {metric.icon} {metric.name}
                        </Text>
                        <Text style={[styles.metricDescription, { color: colors.textSecondary }]}>
                          {metric.description}
                        </Text>
                      </View>
                      
                      {cars.map(car => {
                        const value = getCarMetricValue(car, metric.id);
                        const normalizedScore = normalizeMetricValue(value, metric, cars);
                        const isHighest = cars.every(otherCar => 
                          getCarMetricValue(otherCar, metric.id) <= value
                        );
                        
                        return (
                          <View key={car.id} style={styles.carColumn}>
                            <Text style={[
                              styles.metricValue,
                              { 
                                color: isHighest && metric.higherIsBetter ? colors.primary : colors.text,
                                fontWeight: isHighest && metric.higherIsBetter ? '600' : 'normal',
                              }
                            ]}>
                              {formatMetricValue(value, metric.format)}
                            </Text>
                            <View style={[styles.scoreIndicator, { backgroundColor: colors.surface }]}>
                              <View 
                                style={[
                                  styles.scoreIndicatorFill,
                                  { 
                                    backgroundColor: colors.primary,
                                    width: `${normalizedScore * 100}%` 
                                  }
                                ]} 
                              />
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  ))}
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyStateText: {
    ...Typography.pageTitle,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  addCarButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  addCarButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    ...Shadows.sm,
  },
  headerTitle: {
    ...Typography.pageTitle,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.bodyText,
  },
  modeSelector: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Shadows.sm,
  },
  modeSelectorTitle: {
    ...Typography.cardTitle,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  modeButtonIcon: {
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  modeButtonText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    ...Typography.cardTitle,
    fontWeight: '600',
  },
  sectionToggle: {
    ...Typography.bodyLarge,
  },
  categoryFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  categoryFilter: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  categoryFilterText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  aiInsights: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  insightCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  insightTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  insightText: {
    ...Typography.bodyText,
    lineHeight: 20,
  },
  scoreOverview: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  scoreCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  scoreCarName: {
    ...Typography.cardTitle,
    fontWeight: '600',
  },
  recommendationBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  recommendationText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  scoreDetails: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
  },
  totalScore: {
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  scoreValue: {
    ...Typography.pageTitle,
    fontWeight: '700',
  },
  scoreLabel: {
    ...Typography.caption,
    marginTop: Spacing.xs,
  },
  categoryScores: {
    flex: 1,
    gap: Spacing.sm,
  },
  categoryScore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  categoryName: {
    ...Typography.caption,
    width: 80,
    textTransform: 'capitalize',
  },
  scoreBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  prosConsContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    gap: Spacing.lg,
  },
  prosColumn: {
    flex: 1,
  },
  consColumn: {
    flex: 1,
  },
  prosConsTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  prosConsItem: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
    lineHeight: 18,
  },
  reasoning: {
    ...Typography.bodyText,
    lineHeight: 20,
    marginBottom: Spacing.lg,
    fontStyle: 'italic',
  },
  carActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  primaryAction: {
    flex: 1.2,
  },
  actionButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  metricsTable: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    marginBottom: Spacing.sm,
  },
  tableHeaderText: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    textAlign: 'center',
  },
  tableHeaderSubtext: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  metricNameColumn: {
    width: width * 0.3,
    paddingRight: Spacing.md,
  },
  carColumn: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  metricName: {
    ...Typography.bodyLarge,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  metricDescription: {
    ...Typography.caption,
    lineHeight: 14,
  },
  metricValue: {
    ...Typography.bodyLarge,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  scoreIndicator: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  scoreIndicatorFill: {
    height: '100%',
    borderRadius: 2,
  },
});

export default SmartCarComparison;
