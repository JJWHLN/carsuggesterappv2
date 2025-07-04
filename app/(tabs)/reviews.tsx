import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Star, 
  Award, 
  FileText,
  Calendar,
  User,
  Plus,
  ThumbsUp,
  MessageCircle,
  Heart,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Spacing, Typography, BorderRadius } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import { fetchCarReviews } from '@/services/supabaseService';
import { transformDatabaseReviewToReview } from '@/utils/dataTransformers';
import { Review } from '@/types/database';
import { useAuth } from '@/contexts/AuthContext';

export default function ReviewsScreen() {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const styles = useMemo(() => getStyles(colors), [colors]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'write'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'helpful'>('recent');
  
  // Write Review State
  const [newReview, setNewReview] = useState({
    rating: 0,
    title: '',
    content: '',
    carModel: '',
  });

  const tabs = [
    { key: 'all', label: 'All Reviews', icon: FileText },
    { key: 'my', label: 'My Reviews', icon: User },
    { key: 'write', label: 'Write Review', icon: Plus },
  ];

  const sortOptions = [
    { key: 'recent', label: 'Most Recent', icon: Calendar },
    { key: 'rating', label: 'Highest Rated', icon: Star },
    { key: 'helpful', label: 'Most Helpful', icon: ThumbsUp },
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

  const ReviewCard = useCallback(({ review }: { review: Review }) => (
    <Card style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewUserInfo}>
          <View style={styles.reviewAvatar}>
            <User color={colors.textSecondary} size={20} />
          </View>
          <View style={styles.reviewUserDetails}>
            <Text style={[styles.reviewAuthor, { color: colors.text }]}>{review.author}</Text>
            <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>Recent</Text>
          </View>
        </View>
        <View style={styles.reviewRating}>
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i}
              color={i < review.rating ? colors.warning : colors.border} 
              size={16} 
              fill={i < review.rating ? colors.warning : 'transparent'}
            />
          ))}
          <Text style={[styles.reviewScore, { color: colors.text }]}>{review.rating}/5</Text>
        </View>
      </View>
      
      <Text style={[styles.reviewTitle, { color: colors.text }]} numberOfLines={2}>
        {review.title}
      </Text>
      
      <Text style={[styles.reviewContent, { color: colors.textSecondary }]} numberOfLines={4}>
        {review.content}
      </Text>
      
      <View style={styles.reviewActions}>
        <TouchableOpacity style={styles.reviewAction}>
          <ThumbsUp color={colors.textMuted} size={16} />
          <Text style={[styles.reviewActionText, { color: colors.textMuted }]}>Helpful</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reviewAction}>
          <MessageCircle color={colors.textMuted} size={16} />
          <Text style={[styles.reviewActionText, { color: colors.textMuted }]}>Reply</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.reviewAction}>
          <Heart color={colors.textMuted} size={16} />
          <Text style={[styles.reviewActionText, { color: colors.textMuted }]}>Save</Text>
        </TouchableOpacity>
      </View>
    </Card>
  ), [colors, styles]);

  const renderStarRating = useCallback((rating: number, onPress: (star: number) => void) => (
    <View style={styles.starRating}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => onPress(star)}
          style={styles.starButton}
        >
          <Star
            color={star <= rating ? colors.warning : colors.border}
            size={32}
            fill={star <= rating ? colors.warning : 'transparent'}
          />
        </TouchableOpacity>
      ))}
    </View>
  ), [colors]);

  const renderWriteReview = useCallback(() => (
    <ScrollView style={styles.writeReviewContainer} showsVerticalScrollIndicator={false}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Write a Review</Text>
      
      <View style={styles.writeReviewForm}>
        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: colors.text }]}>Car Model</Text>
          <TextInput
            style={[styles.formInput, { borderColor: colors.border, color: colors.text }]}
            placeholder="e.g., Toyota Camry 2023"
            placeholderTextColor={colors.textMuted}
            value={newReview.carModel}
            onChangeText={(text) => setNewReview(prev => ({ ...prev, carModel: text }))}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: colors.text }]}>Rating</Text>
          {renderStarRating(newReview.rating, (rating) => 
            setNewReview(prev => ({ ...prev, rating }))
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: colors.text }]}>Review Title</Text>
          <TextInput
            style={[styles.formInput, { borderColor: colors.border, color: colors.text }]}
            placeholder="Give your review a title"
            placeholderTextColor={colors.textMuted}
            value={newReview.title}
            onChangeText={(text) => setNewReview(prev => ({ ...prev, title: text }))}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={[styles.formLabel, { color: colors.text }]}>Your Review</Text>
          <TextInput
            style={[styles.formTextArea, { borderColor: colors.border, color: colors.text }]}
            placeholder="Share your experience with this car..."
            placeholderTextColor={colors.textMuted}
            value={newReview.content}
            onChangeText={(text) => setNewReview(prev => ({ ...prev, content: text }))}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <Button
          title="Submit Review"
          onPress={() => {
            Alert.alert('Review Submitted', 'Thank you for your review!');
            setNewReview({ rating: 0, title: '', content: '', carModel: '' });
          }}
          disabled={!newReview.rating || !newReview.title || !newReview.content || !newReview.carModel}
          style={styles.submitButton}
        />
      </View>
    </ScrollView>
  ), [colors, newReview, renderStarRating, styles]);

  const renderTabContent = useCallback(() => {
    switch (activeTab) {
      case 'all':
        return (
          <FlatList
            data={reviews}
            renderItem={({ item }) => <ReviewCard review={item} />}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.reviewsList}
          />
        );
      case 'my':
        const myReviews = reviews.filter(review => review.author === user?.email);
        return (
          <FlatList
            data={myReviews}
            renderItem={({ item }) => <ReviewCard review={item} />}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.reviewsList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <FileText color={colors.textMuted} size={48} />
                <Text style={[styles.emptyStateText, { color: colors.textMuted }]}>
                  You haven't written any reviews yet
                </Text>
              </View>
            }
          />
        );
      case 'write':
        return renderWriteReview();
      default:
        return null;
    }
  }, [activeTab, reviews, user, renderWriteReview, ReviewCard, colors, styles]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={32} color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading reviews...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorState 
          title="Failed to Load Reviews"
          message={error} 
          onRetry={loadReviews} 
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Hero Section */}
      <LinearGradient
        colors={[colors.primary, colors.primaryHover]}
        style={styles.heroSection}
      >
        <Text style={[styles.heroTitle, { color: colors.white }]}>Car Reviews</Text>
        <Text style={[styles.heroSubtitle, { color: colors.white }]}>
          Real experiences from real drivers
        </Text>
      </LinearGradient>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        <StatCard
          value={reviews.length.toString()}
          label="Total Reviews"
          icon={<FileText color={colors.primary} size={24} />}
          style={styles.statCard}
        />
        <StatCard
          value="4.6"
          label="Average Rating"
          icon={<Star color={colors.warning} size={24} />}
          style={styles.statCard}
        />
        <StatCard
          value="98%"
          label="Satisfied Users"
          icon={<Award color={colors.success} size={24} />}
          style={styles.statCard}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                { 
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border 
                }
              ]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <IconComponent 
                color={isActive ? colors.white : colors.textSecondary} 
                size={20} 
              />
              <Text style={[
                styles.tabText,
                { color: isActive ? colors.white : colors.textSecondary }
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sort/Filter Bar - Only show for reviews tabs */}
      {(activeTab === 'all' || activeTab === 'my') && (
        <View style={styles.sortBar}>
          <Text style={[styles.sortLabel, { color: colors.text }]}>Sort by:</Text>
          {sortOptions.map((option) => {
            const IconComponent = option.icon;
            const isActive = sortBy === option.key;
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortOption,
                  { 
                    backgroundColor: isActive ? colors.primaryLight : colors.surface,
                    borderColor: isActive ? colors.primary : colors.border 
                  }
                ]}
                onPress={() => setSortBy(option.key as any)}
              >
                <IconComponent 
                  color={isActive ? colors.primary : colors.textSecondary} 
                  size={16} 
                />
                <Text style={[
                  styles.sortOptionText,
                  { color: isActive ? colors.primary : colors.textSecondary }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: typeof import('@/constants/Colors').Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    marginTop: Spacing.md,
  },
  heroSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  heroTitle: {
    ...Typography.pageTitle,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    ...Typography.body,
    textAlign: 'center',
    opacity: 0.9,
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    justifyContent: 'space-around',
  },
  statCard: {
    flex: 1,
    marginHorizontal: Spacing.xs,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    marginHorizontal: Spacing.xs,
    gap: Spacing.xs,
  },
  tabText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  sortLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginRight: Spacing.sm,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  sortOptionText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
  },
  reviewsList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  reviewCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  reviewUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  reviewUserDetails: {
    flex: 1,
  },
  reviewAuthor: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  reviewDate: {
    ...Typography.caption,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  reviewScore: {
    ...Typography.caption,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  reviewTitle: {
    ...Typography.h4,
    marginBottom: Spacing.sm,
  },
  reviewContent: {
    ...Typography.body,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reviewAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  reviewActionText: {
    ...Typography.caption,
  },
  writeReviewContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h2,
    marginBottom: Spacing.lg,
  },
  writeReviewForm: {
    paddingBottom: Spacing.xl,
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  formLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  formInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
  },
  formTextArea: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    ...Typography.body,
    minHeight: 120,
  },
  starRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  starButton: {
    padding: Spacing.xs,
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyStateText: {
    ...Typography.body,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
