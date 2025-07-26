/**
 * Admin Dashboard for Content Management
 * This is your control center for implementing the content-first strategy
 * Reviews → Traffic → Dealers → Subscriptions ($99-$499/month)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import ContentManagementService, {
  CarReview,
  CarListingForReview,
  ReviewAnalytics,
} from '@/services/ContentManagementService';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { Colors } from '@/constants/Colors';

interface AdminDashboardProps {}

const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const [analytics, setAnalytics] = useState<ReviewAnalytics | null>(null);
  const [recentReviews, setRecentReviews] = useState<CarReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'create-review' | 'manage-cars' | 'analytics'
  >('dashboard');

  // Content creation state
  const [newReview, setNewReview] = useState<{
    car_make: string;
    car_model: string;
    car_year: number;
    reviewer_name: string;
    reviewer_title: string;
    rating: number;
    title: string;
    content: string;
    pros: string;
    cons: string;
    final_verdict: string;
    is_featured: boolean;
    is_published: boolean;
    tags: string;
  }>({
    car_make: '',
    car_model: '',
    car_year: new Date().getFullYear(),
    reviewer_name: '',
    reviewer_title: 'Car Enthusiast',
    rating: 5,
    title: '',
    content: '',
    pros: '',
    cons: '',
    final_verdict: '',
    is_featured: false,
    is_published: true,
    tags: '',
  });

  const contentService = ContentManagementService.getInstance();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [analyticsData, reviews] = await Promise.all([
        contentService.getContentAnalytics(),
        contentService.getRecentReviews(10),
      ]);

      setAnalytics(analyticsData);
      setRecentReviews(reviews);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateReview = async () => {
    if (
      !newReview.car_make ||
      !newReview.car_model ||
      !newReview.title ||
      !newReview.content
    ) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);

      const reviewData = {
        ...newReview,
        pros: newReview.pros
          .split(',')
          .map((p) => p.trim())
          .filter((p) => p),
        cons: newReview.cons
          .split(',')
          .map((c) => c.trim())
          .filter((c) => c),
        tags: newReview.tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t),
        publish_date: new Date().toISOString(),
      };

      await contentService.createReview(reviewData);

      Alert.alert('Success', 'Review created successfully!');

      // Reset form
      setNewReview({
        car_make: '',
        car_model: '',
        car_year: new Date().getFullYear(),
        reviewer_name: '',
        reviewer_title: 'Car Enthusiast',
        rating: 5,
        title: '',
        content: '',
        pros: '',
        cons: '',
        final_verdict: '',
        is_featured: false,
        is_published: true,
        tags: '',
      });

      // Refresh dashboard
      await loadDashboardData();
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Error creating review:', error);
      Alert.alert('Error', 'Failed to create review');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDashboard = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Content Management Dashboard</Text>
      <Text style={styles.subtitle}>
        Drive traffic with reviews → Convert dealers → Scale to $99-499/month
        subscriptions
      </Text>

      {analytics && (
        <View style={styles.analyticsGrid}>
          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{analytics.totalReviews}</Text>
            <Text style={styles.statLabel}>Total Reviews</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>
              {analytics.totalViews.toLocaleString()}
            </Text>
            <Text style={styles.statLabel}>Total Views</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>{analytics.totalLikes}</Text>
            <Text style={styles.statLabel}>Total Likes</Text>
          </Card>

          <Card style={styles.statCard}>
            <Text style={styles.statNumber}>
              {analytics.averageRating.toFixed(1)}★
            </Text>
            <Text style={styles.statLabel}>Avg Rating</Text>
          </Card>
        </View>
      )}

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Popular Cars</Text>
        {analytics?.popularCars.length ? (
          analytics.popularCars.map((car, index) => (
            <Text key={index} style={styles.popularCarItem}>
              {index + 1}. {car}
            </Text>
          ))
        ) : (
          <Text style={styles.emptyState}>
            No popular cars yet. Create more reviews!
          </Text>
        )}
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Recent Reviews</Text>
        {recentReviews.length ? (
          recentReviews.slice(0, 5).map((review) => (
            <View key={review.id} style={styles.reviewItem}>
              <Text style={styles.reviewTitle}>{review.title}</Text>
              <Text style={styles.reviewCar}>
                {review.car_make} {review.car_model} {review.car_year}
              </Text>
              <Text style={styles.reviewStats}>
                {review.rating}★ • {review.view_count} views •{' '}
                {review.like_count} likes
              </Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyState}>
            No reviews yet. Create your first review!
          </Text>
        )}
      </Card>

      <View style={styles.actionButtons}>
        <Button
          title="Create New Review"
          onPress={() => setActiveTab('create-review')}
          style={styles.primaryButton}
        />
        <Button
          title="View Analytics"
          onPress={() => setActiveTab('analytics')}
          style={styles.secondaryButton}
        />
      </View>
    </ScrollView>
  );

  const renderCreateReview = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create New Review</Text>
      <Text style={styles.subtitle}>
        Build content that drives traffic and dealer interest
      </Text>

      <Card style={styles.formCard}>
        <Text style={styles.formSection}>Car Information</Text>

        <View style={styles.inputRow}>
          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>Make *</Text>
            <TextInput
              style={styles.input}
              value={newReview.car_make}
              onChangeText={(text) =>
                setNewReview({ ...newReview, car_make: text })
              }
              placeholder="e.g., Toyota"
            />
          </View>

          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>Model *</Text>
            <TextInput
              style={styles.input}
              value={newReview.car_model}
              onChangeText={(text) =>
                setNewReview({ ...newReview, car_model: text })
              }
              placeholder="e.g., Camry"
            />
          </View>
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>Year</Text>
            <TextInput
              style={styles.input}
              value={newReview.car_year.toString()}
              onChangeText={(text) =>
                setNewReview({
                  ...newReview,
                  car_year: parseInt(text) || new Date().getFullYear(),
                })
              }
              keyboardType="numeric"
              placeholder="2024"
            />
          </View>

          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>Rating (1-5)</Text>
            <TextInput
              style={styles.input}
              value={newReview.rating.toString()}
              onChangeText={(text) =>
                setNewReview({
                  ...newReview,
                  rating: Math.min(5, Math.max(1, parseInt(text) || 5)),
                })
              }
              keyboardType="numeric"
              placeholder="5"
            />
          </View>
        </View>

        <Text style={styles.formSection}>Review Content</Text>

        <Text style={styles.inputLabel}>Review Title *</Text>
        <TextInput
          style={styles.input}
          value={newReview.title}
          onChangeText={(text) => setNewReview({ ...newReview, title: text })}
          placeholder="e.g., 2024 Toyota Camry: A Reliable Family Sedan That Delivers"
        />

        <Text style={styles.inputLabel}>Review Content *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={newReview.content}
          onChangeText={(text) => setNewReview({ ...newReview, content: text })}
          placeholder="Write your detailed review here..."
          multiline
          numberOfLines={6}
        />

        <Text style={styles.inputLabel}>Pros (comma-separated)</Text>
        <TextInput
          style={styles.input}
          value={newReview.pros}
          onChangeText={(text) => setNewReview({ ...newReview, pros: text })}
          placeholder="Reliable, Good fuel economy, Spacious interior"
        />

        <Text style={styles.inputLabel}>Cons (comma-separated)</Text>
        <TextInput
          style={styles.input}
          value={newReview.cons}
          onChangeText={(text) => setNewReview({ ...newReview, cons: text })}
          placeholder="Road noise, Basic infotainment, CVT transmission"
        />

        <Text style={styles.inputLabel}>Final Verdict *</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={newReview.final_verdict}
          onChangeText={(text) =>
            setNewReview({ ...newReview, final_verdict: text })
          }
          placeholder="Summarize your overall opinion and recommendation..."
          multiline
          numberOfLines={3}
        />

        <Text style={styles.formSection}>Review Settings</Text>

        <View style={styles.inputRow}>
          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>Reviewer Name</Text>
            <TextInput
              style={styles.input}
              value={newReview.reviewer_name}
              onChangeText={(text) =>
                setNewReview({ ...newReview, reviewer_name: text })
              }
              placeholder="Your name"
            />
          </View>

          <View style={styles.inputHalf}>
            <Text style={styles.inputLabel}>Reviewer Title</Text>
            <TextInput
              style={styles.input}
              value={newReview.reviewer_title}
              onChangeText={(text) =>
                setNewReview({ ...newReview, reviewer_title: text })
              }
              placeholder="Car Enthusiast"
            />
          </View>
        </View>

        <Text style={styles.inputLabel}>Tags (comma-separated)</Text>
        <TextInput
          style={styles.input}
          value={newReview.tags}
          onChangeText={(text) => setNewReview({ ...newReview, tags: text })}
          placeholder="sedan, family-car, reliable, fuel-efficient"
        />

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Featured Review</Text>
          <Switch
            value={newReview.is_featured}
            onValueChange={(value) =>
              setNewReview({ ...newReview, is_featured: value })
            }
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Publish Immediately</Text>
          <Switch
            value={newReview.is_published}
            onValueChange={(value) =>
              setNewReview({ ...newReview, is_published: value })
            }
          />
        </View>

        <Button
          title="Create Review"
          onPress={handleCreateReview}
          style={styles.createButton}
          disabled={isLoading}
        />

        <Button
          title="Back to Dashboard"
          onPress={() => setActiveTab('dashboard')}
          style={styles.secondaryButton}
        />
      </Card>
    </ScrollView>
  );

  const renderAnalytics = () => (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Content Analytics</Text>
      <Text style={styles.subtitle}>
        Track your content performance and traffic growth
      </Text>

      {analytics && (
        <>
          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            <Text style={styles.analyticsText}>
              • {analytics.totalReviews} reviews published
            </Text>
            <Text style={styles.analyticsText}>
              • {analytics.totalViews.toLocaleString()} total page views
            </Text>
            <Text style={styles.analyticsText}>
              • {analytics.totalLikes} likes received
            </Text>
            <Text style={styles.analyticsText}>
              • {analytics.averageRating.toFixed(1)}/5 average rating
            </Text>
          </Card>

          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Top Performing Reviews</Text>
            {analytics.topPerformingReviews.length ? (
              analytics.topPerformingReviews.map((review, index) => (
                <View key={review.id} style={styles.topReviewItem}>
                  <Text style={styles.topReviewRank}>#{index + 1}</Text>
                  <View style={styles.topReviewContent}>
                    <Text style={styles.topReviewTitle}>{review.title}</Text>
                    <Text style={styles.topReviewStats}>
                      {review.view_count} views • {review.like_count} likes •{' '}
                      {review.rating}★
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptyState}>No reviews to analyze yet</Text>
            )}
          </Card>

          <Card style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Business Impact Indicators</Text>
            <Text style={styles.analyticsText}>
              📈 Content Strategy Progress:
            </Text>
            <Text style={styles.analyticsText}>
              • Phase 1: Create Reviews (
              {analytics.totalReviews > 0 ? '✅' : '⏳'}{' '}
              {analytics.totalReviews}/10 target)
            </Text>
            <Text style={styles.analyticsText}>
              • Phase 2: Drive Traffic (
              {analytics.totalViews > 100 ? '✅' : '⏳'} {analytics.totalViews}
              /1000 target)
            </Text>
            <Text style={styles.analyticsText}>
              • Phase 3: Dealer Interest (
              {analytics.totalViews > 1000 ? '🎯' : '⏳'} Ready for outreach)
            </Text>
            <Text style={styles.analyticsText}>
              • Phase 4: Subscriptions (⏳ Pending dealer conversions)
            </Text>
          </Card>
        </>
      )}

      <Button
        title="Back to Dashboard"
        onPress={() => setActiveTab('dashboard')}
        style={styles.secondaryButton}
      />
    </ScrollView>
  );

  if (isLoading && !analytics) {
    return <LoadingState message="Loading dashboard..." />;
  }

  switch (activeTab) {
    case 'create-review':
      return renderCreateReview();
    case 'analytics':
      return renderAnalytics();
    default:
      return renderDashboard();
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginBottom: 24,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  sectionCard: {
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  popularCarItem: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 6,
  },
  reviewItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  reviewTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  reviewCar: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  reviewStats: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  emptyState: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  actionButtons: {
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    backgroundColor: Colors.light.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.light.secondaryGreen,
  },
  formCard: {
    padding: 20,
  },
  formSection: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 20,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  createButton: {
    backgroundColor: Colors.light.primary,
    marginTop: 20,
    marginBottom: 12,
  },
  analyticsText: {
    fontSize: 14,
    color: Colors.light.text,
    marginBottom: 6,
  },
  topReviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  topReviewRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.primary,
    width: 30,
  },
  topReviewContent: {
    flex: 1,
    marginLeft: 12,
  },
  topReviewTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  topReviewStats: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});

export default AdminDashboard;
