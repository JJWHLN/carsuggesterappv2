import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { SmartBookmarksManager } from '@/components/ui/SmartBookmarksManager';
import { CarCard } from '@/components/CarCard';
import { AnimatedBadge } from '@/components/ui/AnimatedBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import SmartBookmarksService from '@/services/SmartBookmarksService';
import { Car } from '@/types/database';

// Mock car data for demo
const mockCars: Car[] = [
  {
    id: '1',
    make: 'BMW',
    model: '3 Series',
    year: 2022,
    price: 35000,
    mileage: 15000,
    location: 'Dublin',
    images: ['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400'],
    created_at: '2023-01-01T00:00:00Z',
    fuel_type: 'Petrol',
    transmission: 'Automatic',
  },
  {
    id: '2',
    make: 'Tesla',
    model: 'Model 3',
    year: 2023,
    price: 48000,
    mileage: 5000,
    location: 'Cork',
    images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400'],
    created_at: '2023-02-01T00:00:00Z',
    fuel_type: 'Electric',
    transmission: 'Automatic',
  },
  {
    id: '3',
    make: 'Mercedes-Benz',
    model: 'C-Class',
    year: 2021,
    price: 42000,
    mileage: 22000,
    location: 'Galway',
    images: ['https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400'],
    created_at: '2023-03-01T00:00:00Z',
    fuel_type: 'Hybrid',
    transmission: 'Automatic',
  },
  {
    id: '4',
    make: 'Audi',
    model: 'A4',
    year: 2022,
    price: 38000,
    mileage: 18000,
    location: 'Limerick',
    images: ['https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400'],
    created_at: '2023-04-01T00:00:00Z',
    fuel_type: 'Diesel',
    transmission: 'Manual',
  },
];

export default function SmartBookmarksDemoScreen() {
  const [showBookmarksManager, setShowBookmarksManager] = useState(false);
  const [bookmarkService] = useState(() => SmartBookmarksService.getInstance());
  const [mockBookmarksCreated, setMockBookmarksCreated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    createMockBookmarks();
  }, []);

  const createMockBookmarks = async () => {
    if (mockBookmarksCreated) return;

    setLoading(true);
    try {
      // Create some sample bookmarks with different configurations
      await bookmarkService.addBookmark(mockCars[0], {
        tags: ['Luxury', 'German'],
        notes: 'Really interested in this one, need to schedule test drive',
        priceAlertEnabled: true,
        priceAlertThreshold: 10,
        priority: 'high',
      });

      await bookmarkService.addBookmark(mockCars[1], {
        tags: ['Electric', 'Modern'],
        notes: 'Great for commuting, check charging stations',
        priceAlertEnabled: true,
        priceAlertThreshold: 5,
        priority: 'medium',
      });

      await bookmarkService.addBookmark(mockCars[2], {
        tags: ['Luxury', 'Hybrid'],
        notes: 'Good balance of luxury and efficiency',
        priceAlertEnabled: false,
        priority: 'low',
      });

      // Simulate some price drops for demonstration
      const updatedTesla = { ...mockCars[1], price: 45000 }; // 3k drop
      await bookmarkService.checkForPriceDrops(updatedTesla);

      setMockBookmarksCreated(true);
    } catch (error) {
      console.error('Failed to create mock bookmarks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBookmark = async (car: Car) => {
    try {
      await bookmarkService.addBookmark(car, {
        tags: ['Demo'],
        notes: 'Added from demo screen',
        priceAlertEnabled: true,
        priority: 'medium',
      });
      
      Alert.alert(
        'Bookmark Added!',
        `${car.make} ${car.model} has been added to your bookmarks with price alerts enabled.`,
        [
          { text: 'OK' },
          { 
            text: 'View Bookmarks', 
            onPress: () => setShowBookmarksManager(true) 
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to add bookmark');
    }
  };

  const handleCarPress = (car: Car) => {
    Alert.alert(
      'Car Details',
      `View details for ${car.make} ${car.model}`,
      [
        { text: 'Cancel' },
        { 
          text: 'Add to Bookmarks', 
          onPress: () => handleAddBookmark(car) 
        },
        { 
          text: 'View Details', 
          onPress: () => Alert.alert('Navigation', `Navigate to car detail screen for ${car.make} ${car.model}`) 
        }
      ]
    );
  };

  if (showBookmarksManager) {
    return (
      <SmartBookmarksManager
        onCarPress={handleCarPress}
        onClose={() => setShowBookmarksManager(false)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Smart Bookmarks & Alerts</Text>
        <Text style={styles.subtitle}>
          Intelligent bookmark management with price alerts and notifications
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingSection}>
          <LoadingSpinner size="large" />
          <Text style={styles.loadingText}>Setting up demo bookmarks...</Text>
        </View>
      )}

      {/* Features Overview */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>✨ Smart Features</Text>
        
        <View style={styles.featuresList}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🔔</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureName}>Price Drop Alerts</Text>
              <Text style={styles.featureDescription}>
                Get notified when bookmarked cars drop in price by your set threshold
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🏷️</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureName}>Smart Tags & Collections</Text>
              <Text style={styles.featureDescription}>
                Organize bookmarks with custom tags and collections for easy filtering
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📊</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureName}>Analytics & Insights</Text>
              <Text style={styles.featureDescription}>
                Track your browsing patterns and bookmark conversion rates
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>⭐</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureName}>Priority Management</Text>
              <Text style={styles.featureDescription}>
                Set priorities and notes to track your most important cars
              </Text>
            </View>
          </View>

          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🤖</Text>
            <View style={styles.featureContent}>
              <Text style={styles.featureName}>Smart Suggestions</Text>
              <Text style={styles.featureDescription}>
                Get recommendations for similar cars based on your bookmarks
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Demo Cars */}
      <View style={styles.carsSection}>
        <Text style={styles.sectionTitle}>🚗 Demo Cars - Try Bookmarking</Text>
        <Text style={styles.sectionSubtitle}>
          Tap any car to see options or add directly to bookmarks
        </Text>
        
        <View style={styles.carsGrid}>
          {mockCars.map((car) => (
            <View key={car.id} style={styles.carItem}>
              <CarCard
                car={car}
                onPress={() => handleCarPress(car)}
              />
              
              <TouchableOpacity
                style={styles.quickBookmarkButton}
                onPress={() => handleAddBookmark(car)}
              >
                <Text style={styles.quickBookmarkText}>📚 Quick Bookmark</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => setShowBookmarksManager(true)}
        >
          <Text style={styles.primaryButtonText}>
            📚 Open Smart Bookmarks Manager
          </Text>
        </TouchableOpacity>

        <View style={styles.secondaryActions}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => Alert.alert('Demo', 'This would create a new collection')}
          >
            <Text style={styles.secondaryButtonText}>Create Collection</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => Alert.alert('Demo', 'This would show notification settings')}
          >
            <Text style={styles.secondaryButtonText}>Alert Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Benefits */}
      <View style={styles.benefitsSection}>
        <Text style={styles.sectionTitle}>🎯 Why Smart Bookmarks?</Text>
        
        <View style={styles.benefitsList}>
          <AnimatedBadge variant="success" size="medium">
            💰 Never miss a price drop
          </AnimatedBadge>
          
          <AnimatedBadge variant="info" size="medium">
            📈 Track your car buying journey
          </AnimatedBadge>
          
          <AnimatedBadge variant="warning" size="medium">
            🎯 Stay organized with collections
          </AnimatedBadge>
          
          <AnimatedBadge variant="primary" size="medium">
            🔮 Get personalized recommendations
          </AnimatedBadge>
        </View>

        <Text style={styles.benefitsText}>
          Smart Bookmarks transforms casual browsing into an intelligent car buying experience. 
          With automatic price tracking, smart organization, and personalized insights, 
          you'll never miss the perfect deal again.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.surface,
    ...Shadows.sm,
  },
  title: {
    ...Typography.heading,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  loadingSection: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginTop: Spacing.md,
  },
  featuresSection: {
    padding: Spacing.lg,
    backgroundColor: Colors.light.surface,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.md,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
    lineHeight: 16,
  },
  featuresList: {
    gap: Spacing.md,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  featureIcon: {
    fontSize: 24,
    marginTop: 2,
  },
  featureContent: {
    flex: 1,
  },
  featureName: {
    ...Typography.body,
    color: Colors.light.text,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  carsSection: {
    padding: Spacing.md,
  },
  carsGrid: {
    gap: Spacing.md,
  },
  carItem: {
    marginBottom: Spacing.sm,
  },
  quickBookmarkButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  quickBookmarkText: {
    ...Typography.caption,
    color: Colors.light.textInverse,
    fontWeight: '600',
  },
  actionsSection: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    ...Shadows.md,
  },
  primaryButtonText: {
    ...Typography.body,
    color: Colors.light.textInverse,
    fontWeight: '600',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    ...Typography.caption,
    color: Colors.light.text,
    fontWeight: '600',
  },
  benefitsSection: {
    backgroundColor: Colors.light.surfaceSecondary,
    padding: Spacing.lg,
    margin: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  benefitsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  benefitsText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
});
