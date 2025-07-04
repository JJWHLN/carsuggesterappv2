import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Star, 
  Award, 
  TrendingUp, 
  FileText,
  Calendar,
  User
} from 'lucide-react-native';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { StatCard } from '@/components/ui/StatCard'; // Import shared StatCard
import { currentColors, Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';
import { fetchCarReviews } from '@/services/supabaseService';
import { transformDatabaseReviewToReview } from '@/utils/dataTransformers';
import { Review } from '@/types/database';

export default function ReviewsScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

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

  const ReviewCard = ({ review }: { review: Review }) => (
    <TouchableOpacity style={styles.reviewCard}>
      <Image
        source={{ uri: review.images?.[0] || 'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=400' }}
        style={styles.reviewImage}
      />
      <View style={styles.reviewContent}>
        <View style={styles.reviewHeader}>
          <Text style={styles.reviewTitle} numberOfLines={2}>
            {review.title}
          </Text>
          <View style={styles.reviewRating}>
            <Star color={currentColors.accentGreen} size={16} fill={currentColors.accentGreen} />
            <Text style={styles.reviewScore}>{review.rating}/5</Text>
          </View>
        </View>
        
        <Text style={styles.reviewSummary} numberOfLines={3}>
          {review.content}
        </Text>
        
        <View style={styles.reviewFooter}>
          <View style={styles.reviewAuthor}>
            <User color={currentColors.textSecondary} size={14} />
            <Text style={styles.reviewAuthorText}>{review.author}</Text>
          </View>
          <View style={styles.reviewDate}>
            <Calendar color={currentColors.textSecondary} size={14} />
            <Text style={styles.reviewDateText}>Recent</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Local StatCard removed, using shared component

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={32} />
          <Text style={styles.loadingText}>Loading reviews...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <ErrorState
          title="Failed to Load Reviews"
          message={error}
          onRetry={loadReviews}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Expert Reviews</Text>
          <Text style={styles.subtitle}>Professional automotive insights and ratings</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Review Overview</Text>
          <View style={styles.statsGrid}>
            <StatCard
              icon={<FileText color={currentColors.primary} size={24} />}
              value={String(reviews.length || 25)}
              label="Total Reviews"
            />
            <StatCard
              icon={<Star color={currentColors.accentGreen} size={24} />}
              value="4.2"
              label="Avg Rating"
            />
            <StatCard
              icon={<Award color={currentColors.success} size={24} />}
              value="15"
              label="Top Rated"
            />
          </View>
        </View>

        {/* Featured Review */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Review</Text>
          <View style={styles.featuredReview}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=800' }}
              style={styles.featuredImage}
            />
            <View style={styles.featuredOverlay}>
              <Text style={styles.featuredTitle}>2024 Toyota Camry</Text>
              <Text style={styles.featuredSubtitle}>Comprehensive Expert Review</Text>
              <View style={styles.featuredRating}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={20}
                    color={i < 4 ? currentColors.accentGreen : currentColors.white}
                    fill={i < 4 ? currentColors.accentGreen : 'transparent'}
                  />
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Reviews List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Reviews</Text>
          {reviews.length > 0 ? (
            reviews.slice(0, 5).map((review, index) => (
              <ReviewCard key={index} review={review} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <FileText color={currentColors.textSecondary} size={48} />
              <Text style={styles.emptyTitle}>No Reviews Available</Text>
              <Text style={styles.emptySubtitle}>
                Expert reviews will appear here once they're published
              </Text>
            </View>
          )}
        </View>

        {/* Review Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Review Categories</Text>
          
          <TouchableOpacity style={styles.categoryCard}>
            <TrendingUp color={currentColors.primary} size={24} />
            <View style={styles.categoryContent}>
              <Text style={styles.categoryTitle}>Performance Reviews</Text>
              <Text style={styles.categoryDescription}>
                Engine performance, handling, and driving dynamics
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.categoryCard}>
            <Star color={currentColors.accentGreen} size={24} />
            <View style={styles.categoryContent}>
              <Text style={styles.categoryTitle}>Luxury & Comfort</Text>
              <Text style={styles.categoryDescription}>
                Interior quality, features, and comfort assessments
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.categoryCard}>
            <Award color={currentColors.success} size={24} />
            <View style={styles.categoryContent}>
              <Text style={styles.categoryTitle}>Value & Reliability</Text>
              <Text style={styles.categoryDescription}>
                Cost of ownership, reliability ratings, and value analysis
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: currentColors.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
    color: currentColors.textSecondary,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: currentColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: currentColors.border,
  },
  title: {
    ...Typography.h1,
    color: currentColors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: currentColors.textSecondary,
  },
  statsSection: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h2,
    color: currentColors.text,
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  // statCard, statIcon, statValue, statLabel styles removed as they are in the shared StatCard component
  section: {
    padding: Spacing.lg,
  },
  featuredReview: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.large,
  },
  featuredImage: {
    width: '100%',
    height: 200,
  },
  featuredOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  featuredTitle: {
    ...Typography.h2,
    color: currentColors.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  featuredSubtitle: {
    ...Typography.body,
    color: currentColors.white,
    textAlign: 'center',
    marginBottom: Spacing.md,
    opacity: 0.9,
  },
  featuredRating: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  reviewCard: {
    backgroundColor: currentColors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  reviewImage: {
    width: '100%',
    height: 120,
    backgroundColor: currentColors.surfaceDark,
  },
  reviewContent: {
    padding: Spacing.lg,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  reviewTitle: {
    ...Typography.body,
    color: currentColors.text,
    fontWeight: '600',
    flex: 1,
    marginRight: Spacing.sm,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  reviewScore: {
    ...Typography.bodySmall,
    color: currentColors.text,
    fontWeight: '600',
  },
  reviewSummary: {
    ...Typography.bodySmall,
    color: currentColors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  reviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  reviewAuthorText: {
    ...Typography.caption,
    color: currentColors.textSecondary,
  },
  reviewDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  reviewDateText: {
    ...Typography.caption,
    color: currentColors.textSecondary,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: currentColors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  categoryContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  categoryTitle: {
    ...Typography.body,
    color: currentColors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  categoryDescription: {
    ...Typography.bodySmall,
    color: currentColors.textSecondary,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    color: currentColors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    color: currentColors.textSecondary,
    textAlign: 'center',
  },
});