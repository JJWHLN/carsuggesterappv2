import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { DealershipReviewCard } from '@/components/DealershipReviewCard';
import { DealershipDashboard } from '@/components/DealershipDashboard';
import { ExpertHeader } from '@/components/ExpertHeader';
import { useThemeColors } from '@/hooks/useTheme';
import { DealershipReviewService } from '@/services/dealershipReviewService';
import { DealershipReview, DealershipMetrics } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { AnalyticsService } from '@/services/analyticsService';
import { MapPin, Search, Filter, List, TrendingUp, Award, Star } from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');

interface DealershipReviewsScreenProps {
  dealerId?: string; // If provided, show reviews for specific dealer
  route?: {
    params?: {
      dealerId?: string;
      dealerName?: string;
    };
  };
}

export default function DealershipReviewsScreen({ 
  dealerId: propDealerId, 
  route 
}: DealershipReviewsScreenProps) {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const styles = useMemo(() => getStyles(colors), [colors]);

  // Extract dealer info from route params
  const dealerId = propDealerId || route?.params?.dealerId;
  const dealerName = route?.params?.dealerName;

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<DealershipReview[]>([]);
  const [metrics, setMetrics] = useState<DealershipMetrics | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Filter options
  const reviewTypes = [
    { id: 'all', name: 'All Reviews', count: 0 },
    { id: 'expert_visit', name: 'Expert Visits', count: 0 },
    { id: 'mystery_shopper', name: 'Mystery Shopper', count: 0 },
    { id: 'customer_experience', name: 'Customer Experience', count: 0 },
  ];

  // Analytics tracking
  useEffect(() => {
    const analytics = AnalyticsService.getInstance();
    analytics.trackScreenView('dealership_reviews', {
      user_id: user?.id,
      dealer_id: dealerId,
      dealer_name: dealerName,
      view_mode: viewMode,
      selected_type: selectedType,
    });
  }, [user?.id, dealerId, dealerName, viewMode, selectedType]);

  // Load reviews and metrics
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load reviews
      const reviewsResponse = await DealershipReviewService.getDealershipReviews({
        dealerId: dealerId,
        publishedOnly: true,
        limit: 20,
      });

      if (reviewsResponse.error) {
        throw new Error(reviewsResponse.error);
      }

      setReviews(reviewsResponse.data);

      // Load metrics if viewing specific dealer
      if (dealerId) {
        const metricsResponse = await DealershipReviewService.getDealershipMetrics(dealerId);
        if (metricsResponse.data) {
          setMetrics(metricsResponse.data);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dealership reviews');
    } finally {
      setLoading(false);
    }
  }, [dealerId]);

  // Load featured reviews if no specific dealer
  const loadFeaturedReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await DealershipReviewService.getFeaturedDealershipReviews(10);
      
      if (response.error) {
        throw new Error(response.error);
      }

      setReviews(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load featured dealership reviews');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dealerId) {
      loadData();
    } else {
      loadFeaturedReviews();
    }
  }, [dealerId, loadData, loadFeaturedReviews]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await (dealerId ? loadData() : loadFeaturedReviews());
    setRefreshing(false);
  }, [dealerId, loadData, loadFeaturedReviews]);

  // Filter reviews by type
  const filteredReviews = useMemo(() => {
    if (selectedType === 'all') return reviews;
    return reviews.filter(review => review.review_type === selectedType);
  }, [reviews, selectedType]);

  // Render review item
  const renderReview = ({ item, index }: { item: DealershipReview; index: number }) => (
    <View style={viewMode === 'grid' ? styles.gridItem : styles.listItem}>
      <DealershipReviewCard
        review={item}
        isListView={viewMode === 'list'}
        isHeadline={index === 0 && !dealerId} // First item is headline for general view
        showDealerInfo={!dealerId} // Hide dealer info when viewing specific dealer
        onPress={() => {
          // Navigate to review detail
          logger.debug('Navigate to dealership review:', item.id);
        }}
      />
    </View>
  );

  // Render header based on context
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Expert Header */}
      <ExpertHeader
        expertName="CarSuggester Dealership Team"
        credentials="Professional Dealership Evaluators"
        yearsExperience={12}
        reviewsCount={reviews.length}
        averageRating={metrics?.overall_score || 4.2}
        specializations={["Customer Service", "Sales Process", "Facility Quality", "Pricing Transparency"]}
      />

      {/* Dealership Dashboard (if viewing specific dealer) */}
      {dealerId && metrics && dealerName && (
        <DealershipDashboard
          metrics={metrics}
          dealerName={dealerName}
          location="Location" // You would get this from dealer data
          verified={true}
          onViewAllReviews={() => {
            logger.debug('View all reviews for dealer');
          }}
          onViewDetails={() => {
            logger.debug('View detailed analysis');
          }}
        />
      )}

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.screenTitle}>
          {dealerId ? `${dealerName} Reviews` : 'Dealership Reviews'}
        </Text>
        <Text style={styles.screenSubtitle}>
          {dealerId 
            ? `Expert evaluations and customer experience reviews`
            : `Independent reviews of car dealerships across the country`
          }
        </Text>
      </View>

      {/* Stats Section (for general view) */}
      {!dealerId && (
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Award color={colors.primary} size={20} />
              <Text style={styles.statValue}>{reviews.length}</Text>
              <Text style={styles.statLabel}>Dealerships Reviewed</Text>
            </View>
            
            <View style={styles.statCard}>
              <Star color={colors.warning} size={20} />
              <Text style={styles.statValue}>4.2</Text>
              <Text style={styles.statLabel}>Average Rating</Text>
            </View>
            
            <View style={styles.statCard}>
              <TrendingUp color={colors.success} size={20} />
              <Text style={styles.statValue}>89%</Text>
              <Text style={styles.statLabel}>Would Recommend</Text>
            </View>
          </View>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.leftControls}>
          <TouchableOpacity style={styles.filterButton}>
            <Filter color={colors.primary} size={18} />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.searchButton}>
            <Search color={colors.primary} size={18} />
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
            onPress={() => setViewMode('grid')}
          >
            <Grid2x2 color={viewMode === 'grid' ? colors.white : colors.textSecondary} size={16} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <List color={viewMode === 'list' ? colors.white : colors.textSecondary} size={16} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Review Type Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={reviewTypes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedType === item.id && styles.categoryChipActive
              ]}
              onPress={() => setSelectedType(item.id)}
            >
              <Text style={[
                styles.categoryText,
                selectedType === item.id && styles.categoryTextActive
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoriesContent}
        />
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredReviews.length} reviews
        </Text>
        <Text style={styles.resultsSubtext}>Updated regularly</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={32} color={colors.primary} />
          <Text style={styles.loadingText}>Loading dealership reviews...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          message={error}
          onRetry={dealerId ? loadData : loadFeaturedReviews}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredReviews}
        renderItem={renderReview}
        keyExtractor={(item) => item.id}
        numColumns={viewMode === 'grid' ? 1 : 1} // Always 1 column for dealership reviews
        key={viewMode}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No reviews available</Text>
            <Text style={styles.emptySubtext}>
              {dealerId 
                ? 'This dealership hasn\'t been reviewed yet' 
                : 'Check back soon for new dealership reviews'
              }
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },

  // Header
  headerContainer: {
    backgroundColor: colors.background,
  },
  titleSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  screenSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Stats
  statsSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Controls
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  leftControls: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  searchButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  viewButtonActive: {
    backgroundColor: colors.primary,
  },

  // Categories
  categoriesContainer: {
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 12,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: colors.white,
    fontWeight: '600',
  },

  // Results
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.background,
  },
  resultsCount: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
  },
  resultsSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // List
  listContent: {
    paddingBottom: 40,
  },
  gridItem: {
    paddingHorizontal: 16,
  },
  listItem: {
    paddingHorizontal: 16,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
