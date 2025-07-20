/**
 * Analytics Dashboard Component
 * 
 * Phase 2 Week 7 - Advanced Analytics & AI Intelligence
 * Demo component showcasing the analytics integration
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AnalyticsIntegrationService from '../services/analytics/AnalyticsIntegrationService';
import SmartSearchService from '../services/analytics/SmartSearchService';
import AIRecommendationEngine from '../services/analytics/AIRecommendationEngine';
import BusinessIntelligenceService from '../services/analytics/BusinessIntelligenceService';
import ABTestingFramework from '../services/analytics/ABTestingFramework';

interface DashboardData {
  insights: any[];
  performanceMetrics: any;
  searchAnalytics: any;
  healthStatus: any;
  activeTests: any[];
}

const AnalyticsDashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d'>('7d');

  // Initialize analytics services
  useEffect(() => {
    initializeAnalytics();
  }, []);

  const initializeAnalytics = async () => {
    try {
      setIsLoading(true);

      // Initialize the analytics integration service
      const analyticsService = AnalyticsIntegrationService.getInstance({
        enableRealTimeTracking: true,
        enableAIRecommendations: true,
        enableSmartSearch: true,
        enableBusinessIntelligence: true,
        enableABTesting: true,
        dataRetentionDays: 90,
        privacyMode: 'balanced',
        autoOptimization: true
      });

      await analyticsService.initialize();

      // Load dashboard data
      await loadDashboardData(analyticsService);

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      Alert.alert('Error', 'Failed to initialize analytics dashboard');
      setIsLoading(false);
    }
  };

  const loadDashboardData = async (analyticsService: AnalyticsIntegrationService) => {
    try {
      const [insights, performanceMetrics, healthStatus] = await Promise.all([
        analyticsService.getInsights(selectedTimeframe),
        analyticsService.getPerformanceMetrics(),
        analyticsService.getHealthStatus()
      ]);

      // Get search analytics
      const searchService = SmartSearchService.getInstance();
      const searchAnalytics = await searchService.getSearchAnalytics(selectedTimeframe === '24h' ? 'day' : selectedTimeframe === '7d' ? 'week' : 'month');

      // Get active A/B tests
      const abTesting = ABTestingFramework.getInstance();
      const activeTests = abTesting.getActiveTests();

      setDashboardData({
        insights,
        performanceMetrics,
        searchAnalytics,
        healthStatus,
        activeTests
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  };

  const handleTimeframeChange = (timeframe: '24h' | '7d' | '30d') => {
    setSelectedTimeframe(timeframe);
    if (dashboardData) {
      const analyticsService = AnalyticsIntegrationService.getInstance();
      loadDashboardData(analyticsService);
    }
  };

  const handleRunSmartSearch = async () => {
    try {
      const searchService = SmartSearchService.getInstance();
      const results = await searchService.search({
        query: 'reliable family SUV under $30000',
        filters: {
          priceRange: { min: 0, max: 30000 },
          bodyType: ['SUV']
        },
        context: {
          timeOfDay: 'afternoon',
          sessionIntent: 'research',
          previousSearches: [],
          currentPage: 'dashboard'
        },
        intent: {
          type: 'category',
          confidence: 0.8,
          entities: [],
          sentiment: 'neutral'
        }
      });

      Alert.alert(
        'Smart Search Results',
        `Found ${results.results.length} cars in ${results.searchTime}ms`
      );
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to perform smart search');
    }
  };

  const handleGenerateRecommendations = async () => {
    try {
      const recommendationEngine = AIRecommendationEngine.getInstance();
      const recommendations = await recommendationEngine.getRecommendations('demo-user-123', 5);

      Alert.alert(
        'AI Recommendations',
        `Generated ${recommendations.length} personalized recommendations`
      );
    } catch (error) {
      console.error('Recommendation error:', error);
      Alert.alert('Error', 'Failed to generate recommendations');
    }
  };

  const handleCreateABTest = async () => {
    try {
      const abTesting = ABTestingFramework.getInstance();
      const testId = await abTesting.createTest({
        name: 'Search Result Layout Test',
        description: 'Testing different search result layouts for better conversion',
        hypothesis: 'Grid layout will increase click-through rate by 15%',
        targetMetric: 'conversion',
        variants: [
          {
            name: 'Control - List Layout',
            description: 'Current list-based search results',
            trafficPercentage: 50,
            isControl: true,
            changes: []
          },
          {
            name: 'Grid Layout',
            description: 'New grid-based search results',
            trafficPercentage: 50,
            isControl: false,
            changes: [
              {
                component: 'SearchResults',
                property: 'layout',
                originalValue: 'list',
                testValue: 'grid',
                changeType: 'replace'
              }
            ]
          }
        ],
        trafficAllocation: 50,
        successCriteria: {
          primaryMetric: 'click_through_rate',
          minimumDetectableEffect: 15,
          confidenceLevel: 95,
          statisticalPower: 80,
          minimumSampleSize: 1000,
          testDuration: 14
        }
      });

      Alert.alert('A/B Test Created', `Test ID: ${testId}`);
    } catch (error) {
      console.error('A/B test creation error:', error);
      Alert.alert('Error', 'Failed to create A/B test');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Initializing Advanced Analytics...</Text>
        <Text style={styles.loadingSubtext}>Loading AI-powered insights and data intelligence</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics Intelligence Dashboard</Text>
        <Text style={styles.subtitle}>Phase 2 Week 7 - Advanced Analytics & AI</Text>
      </View>

      {/* Timeframe Selector */}
      <View style={styles.timeframeContainer}>
        {(['24h', '7d', '30d'] as const).map((timeframe) => (
          <TouchableOpacity
            key={timeframe}
            style={[
              styles.timeframeButton,
              selectedTimeframe === timeframe && styles.timeframeButtonActive
            ]}
            onPress={() => handleTimeframeChange(timeframe)}
          >
            <Text style={[
              styles.timeframeText,
              selectedTimeframe === timeframe && styles.timeframeTextActive
            ]}>
              {timeframe}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Health Status */}
      {dashboardData?.healthStatus && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Health</Text>
          <View style={styles.healthCard}>
            <Text style={[
              styles.healthStatus,
              { color: getHealthColor(dashboardData.healthStatus.overall) }
            ]}>
              {dashboardData.healthStatus.overall.toUpperCase()}
            </Text>
            <Text style={styles.healthDetails}>
              {dashboardData.healthStatus.services.length} services monitored
            </Text>
          </View>
        </View>
      )}

      {/* Performance Metrics */}
      {dashboardData?.performanceMetrics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {dashboardData.performanceMetrics.analytics.eventsProcessed}
              </Text>
              <Text style={styles.metricLabel}>Events Processed</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {dashboardData.performanceMetrics.search.avgResponseTime}ms
              </Text>
              <Text style={styles.metricLabel}>Avg Search Time</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {dashboardData.performanceMetrics.recommendations.accuracyScore.toFixed(1)}%
              </Text>
              <Text style={styles.metricLabel}>AI Accuracy</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>
                {dashboardData.performanceMetrics.abTesting.activeTests}
              </Text>
              <Text style={styles.metricLabel}>Active Tests</Text>
            </View>
          </View>
        </View>
      )}

      {/* Search Analytics */}
      {dashboardData?.searchAnalytics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Intelligence</Text>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsText}>
              Total Searches: {dashboardData.searchAnalytics.queryCount}
            </Text>
            <Text style={styles.analyticsText}>
              Click-Through Rate: {dashboardData.searchAnalytics.avgClickThroughRate.toFixed(1)}%
            </Text>
            <Text style={styles.analyticsText}>
              Success Rate: {dashboardData.searchAnalytics.searchSuccessRate.toFixed(1)}%
            </Text>
          </View>
        </View>
      )}

      {/* AI Insights */}
      {dashboardData?.insights && dashboardData.insights.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI-Generated Insights</Text>
          {dashboardData.insights.slice(0, 3).map((insight, index) => (
            <View key={index} style={styles.insightCard}>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightDescription}>{insight.description}</Text>
              <View style={styles.insightMeta}>
                <Text style={[styles.insightPriority, { color: getPriorityColor(insight.priority) }]}>
                  {insight.priority.toUpperCase()}
                </Text>
                <Text style={styles.insightConfidence}>
                  {(insight.confidence * 100).toFixed(0)}% confidence
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Active A/B Tests */}
      {dashboardData?.activeTests && dashboardData.activeTests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active A/B Tests</Text>
          {dashboardData.activeTests.map((test, index) => (
            <View key={index} style={styles.testCard}>
              <Text style={styles.testName}>{test.name}</Text>
              <Text style={styles.testDescription}>{test.description}</Text>
              <Text style={styles.testMetric}>Target: {test.targetMetric}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Demo Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Demo Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleRunSmartSearch}>
            <Text style={styles.actionButtonText}>Smart Search Demo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleGenerateRecommendations}>
            <Text style={styles.actionButtonText}>AI Recommendations</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={handleCreateABTest}>
            <Text style={styles.actionButtonText}>Create A/B Test</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Implementation Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Week 7 Implementation Summary</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryText}>✅ Advanced Analytics Engine with real-time tracking</Text>
          <Text style={styles.summaryText}>✅ Smart Search with NLP and AI-powered suggestions</Text>
          <Text style={styles.summaryText}>✅ AI Recommendation Engine with ML algorithms</Text>
          <Text style={styles.summaryText}>✅ Business Intelligence Dashboard with insights</Text>
          <Text style={styles.summaryText}>✅ A/B Testing Framework with statistical analysis</Text>
          <Text style={styles.summaryText}>✅ Analytics Integration Service for orchestration</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const getHealthColor = (status: string): string => {
  switch (status) {
    case 'healthy': return '#28a745';
    case 'warning': return '#ffc107';
    case 'critical': return '#dc3545';
    default: return '#6c757d';
  }
};

const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high': return '#dc3545';
    case 'medium': return '#ffc107';
    case 'low': return '#28a745';
    default: return '#6c757d';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  timeframeContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  timeframeButtonActive: {
    backgroundColor: '#007bff',
  },
  timeframeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeframeTextActive: {
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  healthCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  healthStatus: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  healthDetails: {
    fontSize: 14,
    color: '#666',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    flex: 1,
    minWidth: '48%',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  analyticsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  analyticsText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  insightCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  insightDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  insightMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  insightPriority: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  insightConfidence: {
    fontSize: 12,
    color: '#666',
  },
  testCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  testName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  testDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  testMetric: {
    fontSize: 12,
    color: '#007bff',
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
});

export default AnalyticsDashboard;
