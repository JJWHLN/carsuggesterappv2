import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { currentColors, Spacing, Typography, BorderRadius } from '@/constants/Colors';
import { formatFullDate, transformDatabaseReviewToReview } from '@/utils/dataTransformers';
import { useApi } from '@/hooks/useApi';
import { fetchReviewById, SupabaseError } from '@/services/supabaseService';
import { Review as ReviewType, DatabaseReview } from '@/types/database'; // Import Review type
import { getImageUrl } from '@/utils/formatters';
import { ArrowLeft, Star, Calendar, User, Award, TrendingUp, Gauge } from '@/utils/ultra-optimized-icons';

export default function ReviewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: rawReviewData,
    loading,
    error,
    refetch
  } = useApi<DatabaseReview | null>(
    async () => {
      if (!id) return null;
      try {
        return await fetchReviewById(id);
      } catch (e) {
        if (e instanceof SupabaseError) throw new Error(e.message); // useApi expects Error
        throw e;
      }
    },
    [id]
  );

  // Transform data once fetched
  const review: ReviewType | null = rawReviewData ? transformDatabaseReviewToReview(rawReviewData) : null;

  const handleBack = () => {
    router.back();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={20}
        color={index < rating ? currentColors.accentGreen : currentColors.border}
        fill={index < rating ? currentColors.accentGreen : 'transparent'}
      />
    ));
  };

  const getSectionIcon = (sectionType: string) => {
    switch (sectionType) {
      case 'performance': return <TrendingUp color={currentColors.primary} size={20} />;
      case 'exterior': return <Palette color={currentColors.primary} size={20} />;
      case 'interior': return <Package color={currentColors.primary} size={20} />;
      case 'tech': return <Smartphone color={currentColors.primary} size={20} />;
      case 'practicality': return <Gauge color={currentColors.primary} size={20} />;
      default: return <Award color={currentColors.primary} size={20} />;
    }
  };

  const getSectionTitle = (sectionType: string) => {
    switch (sectionType) {
      case 'performance': return 'Performance & Driving';
      case 'exterior': return 'Exterior Design';
      case 'interior': return 'Interior & Comfort';
      case 'tech': return 'Technology & Features';
      case 'practicality': return 'Practicality & Efficiency';
      case 'verdict': return 'Final Verdict';
      default: return sectionType.charAt(0).toUpperCase() + sectionType.slice(1);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft color={currentColors.text} size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={32} />
          <Text style={styles.loadingText}>Loading review...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !review) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft color={currentColors.text} size={24} />
          </TouchableOpacity>
        </View>
        <ErrorState
          title="Error Loading Review"
          message={error || 'Review details could not be loaded or the review was not found.'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  // The main sections content is now in review.content, and specific sections in review.sections
  const summaryText = review.content.split('\n\n')[0] || review.content;
  const mainContentText = review.content; // Or structure based on review.sections if preferred for display

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom header View removed, native header is used */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        {review.images && review.images.length > 0 && review.images[0] && (
          <Image
            source={{ uri: getImageUrl(review.images[0]) }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.content}>
          {/* Header Info */}
          <View style={styles.reviewHeader}>
            <Text style={styles.carInfo}>
              {review.car_year} {review.car_make} {review.car_model}
            </Text>
            <Text style={styles.reviewTitle}>{review.title}</Text>
            
            <View style={styles.reviewMeta}>
              <View style={styles.rating}>
                {renderStars(review.rating)}
                <Text style={styles.ratingText}>{review.rating}/5</Text>
              </View>
              
              {review.cs_score && (
                <View style={styles.csScore}>
                  <Award color={currentColors.accentGreen} size={16} />
                  <Text style={styles.csScoreText}>CS Score: {review.cs_score}/100</Text>
                </View>
              )}
            </View>

            <View style={styles.authorInfo}>
              <User color={currentColors.textSecondary} size={16} />
              <Text style={[styles.authorText, { marginLeft: Spacing.sm }]}>By {review.author}</Text>
              <Calendar color={currentColors.textSecondary} size={16} style={{ marginLeft: Spacing.sm }} />
              <Text style={[styles.dateText, { marginLeft: Spacing.sm }]}>{formatFullDate(review.created_at)}</Text>
            </View>
          </View>

          {/* Tags */}
          {review.tags && review.tags.length > 0 && (
            <View style={styles.tagsSection}>
              {review.tags.map((tag: string, index: number) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Summary Section (using transformed summary or first part of content) */}
          <View style={styles.summarySection}>
            <Text style={styles.summaryTitle}>Summary</Text>
            <Text style={styles.summaryContent}>{summaryText}</Text>
          </View>

          {/* Detailed Review Sections from review.sections */}
          {review.sections && Object.entries(review.sections).map(([sectionType, content]) => {
            // Skip summary as it's handled above, or if content is empty
            if (!content || sectionType.toLowerCase() === 'summary') return null;
            
            return (
              <View key={sectionType} style={styles.section}>
                <View style={styles.sectionHeader}>
                  {getSectionIcon(sectionType)}
                  <Text style={styles.sectionTitle}>{getSectionTitle(sectionType)}</Text>
                </View>
                <Text style={styles.sectionContent}>{content as string}</Text>
              </View>
            );
          })}

          {/* Fallback for main content if sections are not detailed */}
          {!review.sections && (
             <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Award color={currentColors.primary} size={20} />
                  <Text style={styles.sectionTitle}>Full Review</Text>
                </View>
                <Text style={styles.sectionContent}>{mainContentText}</Text>
              </View>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: currentColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: currentColors.border,
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  heroImage: {
    width: '100%',
    height: 250,
    backgroundColor: currentColors.surfaceDark,
  },
  content: {
    padding: Spacing.lg,
  },
  reviewHeader: {
    marginBottom: Spacing.xl,
  },
  carInfo: {
    ...Typography.caption,
    color: currentColors.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  reviewTitle: {
    ...Typography.h2,
    color: currentColors.text,
    marginBottom: Spacing.lg,
    lineHeight: 32,
  },
  reviewMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    ...Typography.caption,
    color: currentColors.textSecondary,
    marginLeft: Spacing.sm,
    fontWeight: '600',
  },
  csScore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  csScoreText: {
    ...Typography.caption,
    color: currentColors.primary,
    marginLeft: Spacing.xs,
    fontWeight: '600',
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    // gap: Spacing.sm, // Removed unsupported property
  },
  authorText: {
    ...Typography.caption,
    color: currentColors.textSecondary,
  },
  dateText: {
    ...Typography.caption,
    color: currentColors.textSecondary,
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap: Spacing.sm, // Removed unsupported property
    marginBottom: Spacing.xl,
  },
  tag: {
    backgroundColor: currentColors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm, // Add spacing between tags
    marginBottom: Spacing.sm, // Add spacing between rows
  },
  tagText: {
    ...Typography.caption,
    color: currentColors.primary,
    fontWeight: '500',
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: currentColors.text,
    marginLeft: Spacing.sm,
  },
  sectionContent: {
    ...Typography.body,
    color: currentColors.textSecondary,
    lineHeight: 26,
  },
  summarySection: {
    backgroundColor: currentColors.primaryLight,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.lg,
  },
  summaryTitle: {
    ...Typography.subtitle,
    color: currentColors.primary,
    marginBottom: Spacing.md,
  },
  summaryContent: {
    ...Typography.body,
    color: currentColors.primary,
    lineHeight: 26,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // gap: Spacing.md, // Removed unsupported property
  },
  loadingText: {
    ...Typography.body,
    color: currentColors.textSecondary,
    marginTop: Spacing.md, // Add margin instead of gap
  },
});