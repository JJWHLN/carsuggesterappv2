import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { RealtimeService, RealtimeSubscription } from '@/services/realtimeService';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { UnifiedSearchFilter, useSearchFilters } from '@/components/ui/UnifiedSearchFilter';
import { ExpertReviewCard } from '@/components/ExpertReviewCard';
import { ExpertHeader } from '@/components/ExpertHeader';
import { CSScoreDisplay } from '@/components/CSScoreDisplay';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { 
  CategoryChip, 
  SectionHeader, 
  Badge, 
  HeroSection, 
  ViewToggle, 
  FilterButton, 
  ResultsHeader, 
  LoadingContainer 
} from '@/components/ui/SharedComponents';
import { Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors';
import { createCommonStyles } from '@/constants/CommonStyles';
import { useThemeColors } from '@/hooks/useTheme';
import { fetchCarReviews } from '@/services/supabaseService';
import { transformDatabaseReviewToReview } from '@/utils/dataTransformers';
import { Review } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';
import { AnalyticsService } from '@/services/analyticsService';
import { useEngagementTracking } from '@/hooks/useAnalytics';
import { Star, Award, Calendar, User, Plus, MessageCircle, Heart, Clock, TrendingUp, Filter, List } from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');

export default function ReviewsScreen() {
  const { colors } = useThemeColors();
  const { layout, cards, buttons } = useDesignTokens();
  const { user } = useAuth();
  const styles = useMemo(() => getStyles(colors), [colors]);
  // const commonStyles = useMemo(() => createCommonStyles(colors), [colors]); // Temporarily commented out due to type issues
  
  // Use unified search/filter hook
  const {
    filters,
    searchTerm,
    debouncedSearchTerm,
    updateFilters,
    clearFilters,
    setSearchTerm,
    hasActiveFilters,
  } = useSearchFilters({
    searchTerm: '',
    categories: { category: 'all' },
    sortBy: 'recent',
    sortOrder: 'desc',
    viewMode: 'grid',
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'helpful'>('recent');

  // Analytics
  const engagementTracking = useEngagementTracking('reviews');

  // Track screen view
  useEffect(() => {
    const analytics = AnalyticsService.getInstance();
    analytics.trackScreenView('reviews', { 
      user_id: user?.id,
      reviews_count: reviews.length,
      view_mode: viewMode,
      selected_category: selectedCategory,
      sort_by: sortBy
    });
  }, [user?.id, reviews.length, viewMode, selectedCategory, sortBy]);

  // Mock featured reviews data with expert review enhancements
  const featuredReviews = [
    {
      id: 1,
      title: "2024 BMW X5 M50i: The Ultimate Driving Machine Evolves",
      image: "https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=800",
      rating: 4.8,
      author: "Alex Thompson",
      expertCredentials: "Senior Automotive Journalist, 15+ years",
      readTime: "8 min read",
      hasVideo: true,
      category: "Luxury SUV",
      publishedDate: "2024-01-15",
      likes: 234,
      views: 15420,
      comments: 45,
      carMake: "BMW",
      carModel: "X5 M50i",
      carYear: 2024,
      cs_score: 89,
      verificationBadge: true,
      excerpt: "BMW's flagship SUV delivers exceptional performance and luxury in a package that's surprisingly practical for daily use. Our comprehensive testing reveals impressive engineering.",
      created_at: "2024-01-15",
      content: "Detailed review content...",
    },
    {
      id: 2,
      title: "Tesla Model 3 Performance: Electric Excellence Redefined",
      image: "https://images.pexels.com/photos/2244746/pexels-photo-2244746.jpeg?auto=compress&cs=tinysrgb&w=800",
      rating: 4.6,
      author: "Sarah Chen",
      expertCredentials: "EV Specialist & Technology Reviewer",
      readTime: "12 min read",
      hasVideo: false,
      category: "Electric",
      publishedDate: "2024-01-12",
      likes: 189,
      views: 22150,
      comments: 67,
      carMake: "Tesla",
      carModel: "Model 3",
      carYear: 2024,
      cs_score: 92,
      verificationBadge: true,
      excerpt: "The Model 3 Performance proves that electric cars can be thrilling while maintaining efficiency and cutting-edge technology. Our track testing shows remarkable capabilities.",
      created_at: "2024-01-12",
      content: "Detailed review content...",
    },
    {
      id: 3,
      title: "Toyota Camry Hybrid: Reliability Redefined for 2024",
      image: "https://images.pexels.com/photos/1149137/pexels-photo-1149137.jpeg?auto=compress&cs=tinysrgb&w=800",
      rating: 4.7,
      author: "Mike Rodriguez",
      expertCredentials: "Hybrid Technology Expert",
      readTime: "6 min read",
      hasVideo: true,
      category: "Hybrid",
      publishedDate: "2024-01-10",
      likes: 156,
      views: 8930,
      comments: 23,
      carMake: "Toyota",
      carModel: "Camry",
      carYear: 2024,
      cs_score: 85,
      verificationBadge: true,
      excerpt: "Toyota's latest Camry Hybrid combines outstanding fuel economy with surprising driving dynamics and premium features in our extensive real-world testing.",
      created_at: "2024-01-10",
      content: "Detailed review content...",
    },
    {
      id: 4,
      title: "Porsche 911 Turbo S: Track-Ready Perfection Analyzed",
      image: "https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=800",
      rating: 4.9,
      author: "David Kim",
      expertCredentials: "Performance Car Specialist",
      readTime: "10 min read",
      hasVideo: true,
      category: "Sports Car",
      publishedDate: "2024-01-08",
      likes: 312,
      views: 31200,
      comments: 89,
      carMake: "Porsche",
      carModel: "911 Turbo S",
      carYear: 2024,
      cs_score: 96,
      verificationBadge: true,
      excerpt: "The 911 Turbo S represents the pinnacle of sports car engineering with blistering performance and everyday usability, validated through our comprehensive track testing.",
      created_at: "2024-01-08",
      content: "Detailed review content...",
    },
  ];

  const categories = [
    { id: 'all', name: 'All Reviews', count: 156 },
    { id: 'luxury', name: 'Luxury', count: 34 },
    { id: 'electric', name: 'Electric', count: 28 },
    { id: 'sports', name: 'Sports Cars', count: 19 },
    { id: 'suv', name: 'SUV', count: 45 },
    { id: 'hybrid', name: 'Hybrid', count: 30 },
  ];

  const reviewStats = [
    { icon: <FileText color={colors.primary} size={24} />, value: "156", label: "Expert Reviews" },
    { icon: <Star color={colors.warning} size={24} />, value: "4.7", label: "Average Rating" },
    { icon: <Award color={colors.success} size={24} />, value: "98%", label: "Satisfied Readers" },
  ];

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await fetchCarReviews(0, 10);
      const transformedReviews = Array.isArray(data) 
        ? data.map(transformDatabaseReviewToReview)
        : [];
      setReviews(transformedReviews || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscriptions for reviews
  useEffect(() => {
    const subscriptions: Array<RealtimeSubscription> = [];

    // Subscribe to reviews changes
    const reviewsSubscription = RealtimeService.subscribeToReviews(
      (payload) => {
        logger.debug('🔄 Real-time review update:', payload);
        
        if (payload.eventType === 'INSERT') {
          const newReview = transformDatabaseReviewToReview(payload.new);
          setReviews(prevReviews => [newReview, ...prevReviews]);
        } else if (payload.eventType === 'UPDATE') {
          const updatedReview = transformDatabaseReviewToReview(payload.new);
          setReviews(prevReviews => 
            prevReviews.map(review => review.id === updatedReview.id ? updatedReview : review)
          );
        } else if (payload.eventType === 'DELETE' && payload.old?.id !== undefined) {
          const deletedId = payload.old.id;
          setReviews(prevReviews => 
            prevReviews.filter(review => review.id !== deletedId.toString())
          );
        }
      }
    );

    subscriptions.push(reviewsSubscription);

    // Cleanup subscriptions on unmount
    return () => {
      subscriptions.forEach(subscription => subscription.unsubscribe());
    };
  }, []);

  const renderReview = ({ item }: { item: any }) => (
    <View style={viewMode === 'grid' ? styles.gridItem : styles.listItem}>
      <ExpertReviewCard 
        review={{
          ...item,
          car_make: item.carMake,
          car_model: item.carModel,
          car_year: item.carYear,
        }} 
        isListView={viewMode === 'list'}
        onPress={() => {
          // Navigate to review detail
          logger.debug('Navigate to review:', item.id);
        }}
      />
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Expert Header - Establishes Authority */}
      <ExpertHeader
        expertName="CarSuggester Expert Team"
        credentials="Professional Automotive Reviewers"
        yearsExperience={15}
        reviewsCount={156}
        averageRating={4.8}
        specializations={["Luxury Cars", "Electric Vehicles", "Sports Cars", "SUVs"]}
        onViewProfile={() => {
          logger.debug('View expert profile');
        }}
      />

      {/* Featured Review Spotlight */}
      {featuredReviews.length > 0 && (
        <View style={styles.spotlightSection}>
          <Text style={styles.sectionTitle}>Featured Review</Text>
          <ExpertReviewCard
            review={{
              ...featuredReviews[0],
              car_make: featuredReviews[0].carMake,
              car_model: featuredReviews[0].carModel,
              car_year: featuredReviews[0].carYear,
            }}
            isHeadline={true}
            onPress={() => {
              logger.debug('Navigate to featured review:', featuredReviews[0].id);
            }}
          />
        </View>
      )}

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.leftControls}>
          <TouchableOpacity style={styles.filterButton}>
            <Filter color={colors.primary} size={18} />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.sortButton}>
            <Text style={styles.sortButtonText}>Most Recent</Text>
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

      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.id && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === item.id && styles.categoryTextActive
              ]}>
                {item.name} ({item.count})
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoriesContent}
        />
      </View>

      {/* Results Header */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {featuredReviews.length} expert reviews
        </Text>
        <Text style={styles.resultsSubtext}>Updated weekly</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={32} color={colors.primary} />
          <Text style={styles.loadingText}>Loading expert reviews...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={featuredReviews}
        renderItem={renderReview}
        keyExtractor={(item) => item.id.toString()}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={viewMode === 'grid' ? styles.columnWrapper : undefined}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: typeof import('@/constants/Colors').Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  
  // Header
  headerContainer: {
    backgroundColor: colors.background,
  },
  
  // Spotlight Section
  spotlightSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: colors.background,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  heroSection: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl * 1.5,
    alignItems: 'center',
  },
  heroTitle: {
    ...Typography.heroTitle,
    color: colors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    fontWeight: '800',
    fontSize: Math.min(32, width * 0.08),
  },
  heroSubtitle: {
    ...Typography.body,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.9,
    maxWidth: width * 0.8,
    lineHeight: 24,
  },
  
  // Stats
  statsSection: {
    padding: Spacing.lg,
    backgroundColor: colors.background,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  
  // Controls
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftControls: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: Spacing.xs,
  },
  filterButtonText: {
    ...Typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  sortButton: {
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortButtonText: {
    ...Typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  viewButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  viewButtonActive: {
    backgroundColor: colors.primary,
  },
  
  // Categories
  categoriesContainer: {
    paddingVertical: Spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.lg,
  },
  categoryChip: {
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: Spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    ...Typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  
  // Results
  resultsHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: colors.background,
  },
  resultsCount: {
    ...Typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  resultsSubtext: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
  },
  
  // List
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  gridItem: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    marginBottom: Spacing.lg,
  },
  listItem: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  
  // Review Cards
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...ColorsShadows.card,
  },
  reviewCardList: {
    flexDirection: 'row',
    height: 140,
  },
  reviewImageContainer: {
    position: 'relative',
    height: 160,
  },
  reviewImageContainerList: {
    width: 140,
    height: '100%',
  },
  reviewImage: {
    width: '100%',
    height: '100%',
  },
  reviewImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    padding: Spacing.sm,
  },
  playButton: {
    alignSelf: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: BorderRadius.full,
    padding: Spacing.sm,
  },
  reviewImageContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  categoryBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  categoryBadgeText: {
    ...Typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  ratingText: {
    ...Typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  reviewContent: {
    padding: Spacing.md,
  },
  reviewContentList: {
    flex: 1,
    justifyContent: 'space-between',
  },
  reviewTitle: {
    ...Typography.body,
    color: colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  reviewExcerpt: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  reviewMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  authorName: {
    ...Typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  readTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  readTimeText: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  reviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statText: {
    ...Typography.caption,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});