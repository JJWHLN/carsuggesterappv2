import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Card } from '@/components/ui/Card';

// Consolidated theme imports
import { useColors, useIsDarkMode } from '@/hooks/useConsolidatedTheme';
import { useThemedStyles, useCommonThemedStyles } from '@/hooks/useThemedStyles';
import { Spacing, Typography, BorderRadius } from '@/constants/Colors';
import { ArrowLeft, Plus, X, TrendingUp, CheckCircle, Star, DollarSign, MapPin, Heart } from '@/utils/ultra-optimized-icons';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.85;
const CARD_HEIGHT = 300;

interface ComparisonData {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  price: number;
  image_url?: string;
  mileage?: number;
  fuel_type?: string;
  transmission?: string;
  engine?: string;
  safety_rating?: number;
  reliability_score?: number;
  fuel_economy_city?: number;
  fuel_economy_highway?: number;
  features?: string[];
  pros?: string[];
  cons?: string[];
  dealer_name?: string;
  location?: string;
}

interface ComparisonCategory {
  title: string;
  items: Array<{
    label: string;
    key: keyof ComparisonData;
    type: 'text' | 'number' | 'rating' | 'price' | 'boolean' | 'array';
    formatter?: (value: any) => string;
    comparator?: (a: any, b: any) => 'better' | 'worse' | 'equal';
  }>;
}

export default function ImprovedCompareScreen() {
  const colors = useColors();
  const isDark = useIsDarkMode();
  const commonStyles = useCommonThemedStyles();
  
  // Consolidated themed styles using the new pattern
  const styles = useThemedStyles((colors) => ({
    // Header styles
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      ...Platform.select({
        ios: {
          shadowColor: colors.text,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    
    backButton: {
      padding: Spacing.sm,
      borderRadius: BorderRadius.full,
      backgroundColor: colors.background,
    },
    
    headerTitleContainer: {
      alignItems: 'center',
      flex: 1,
      marginHorizontal: Spacing.md,
    },
    
    headerTitle: {
      ...Typography.h2,
      color: colors.text,
      fontWeight: '700',
    },
    
    headerSubtitle: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    
    // Comparison cards
    cardsContainer: {
      flexDirection: 'row',
      paddingHorizontal: Spacing.md,
      gap: Spacing.md,
    },
    
    comparisonCard: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      borderRadius: BorderRadius.xl,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    
    cardImage: {
      width: '100%',
      height: 160,
      backgroundColor: colors.surfaceDark,
    },
    
    cardContent: {
      padding: Spacing.md,
      flex: 1,
    },
    
    carTitle: {
      ...Typography.subtitle,
      color: colors.text,
      fontWeight: '700',
      marginBottom: Spacing.xs,
    },
    
    carPrice: {
      ...Typography.h2,
      color: colors.primary,
      fontWeight: '800',
      marginBottom: Spacing.sm,
    },
    
    carDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    
    detailItem: {
      alignItems: 'center',
    },
    
    detailLabel: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginTop: Spacing.xs,
    },
    
    detailValue: {
      ...Typography.caption,
      color: colors.text,
      fontWeight: '600',
    },
    
    // Action buttons
    actionButtons: {
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.md,
    },
    
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      gap: Spacing.xs,
    },
    
    actionButtonText: {
      ...Typography.caption,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    
    // Comparison sections
    comparisonSection: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.xl,
    },
    
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: Spacing.md,
      paddingBottom: Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    
    sectionTitle: {
      ...Typography.subtitle,
      color: colors.text,
      fontWeight: '700',
      marginLeft: Spacing.sm,
    },
    
    comparisonGrid: {
      gap: Spacing.sm,
    },
    
    comparisonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.xs,
    },
    
    comparisonLabel: {
      flex: 1,
      ...Typography.caption,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    
    comparisonValues: {
      flex: 2,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    
    comparisonValue: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    
    betterValue: {
      color: colors.success,
      fontWeight: '700',
    },
    
    worseValue: {
      color: colors.error,
      fontWeight: '700',
    },
    
    // Add car section
    addCarSection: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.xl,
      marginHorizontal: Spacing.lg,
    },
    
    addCarCard: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: BorderRadius.xl,
      borderWidth: 2,
      borderColor: colors.primary,
      borderStyle: 'dashed',
      backgroundColor: colors.primaryLight,
    },
    
    addCarText: {
      ...Typography.subtitle,
      color: colors.primary,
      fontWeight: '600',
      marginTop: Spacing.md,
      textAlign: 'center',
    },
    
    addCarSubtext: {
      ...Typography.body,
      color: colors.primary,
      textAlign: 'center',
      marginTop: Spacing.sm,
      opacity: 0.8,
    },
  }));

  // Component state and logic would go here...
  const [cars, setCars] = useState<ComparisonData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Render methods would use the consolidated styles...
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityLabel="Go back"
      >
        <ArrowLeft color={colors.text} size={24} />
      </TouchableOpacity>
      
      <View style={styles.headerTitleContainer}>
        <Text style={styles.headerTitle}>Compare Cars</Text>
        <Text style={styles.headerSubtitle}>
          {cars.length > 0 ? `${cars.length} cars selected` : 'Select cars to compare'}
        </Text>
      </View>
      
      <TouchableOpacity
        onPress={() => {/* Share functionality */}}
        accessibilityLabel="Share comparison"
      >
        <Share2 color={colors.textSecondary} size={24} />
      </TouchableOpacity>
    </View>
  );

  const renderComparisonCard = (car: ComparisonData, index: number) => (
    <Card key={car.id} style={styles.comparisonCard}>
      <OptimizedImage
        source={{ uri: car.image_url || '' }}
        style={styles.cardImage}
        placeholder={true}
      />
      
      <View style={styles.cardContent}>
        <Text style={styles.carTitle}>
          {car.year} {car.make} {car.model}
        </Text>
        <Text style={styles.carPrice}>
          ${car.price.toLocaleString()}
        </Text>
        
        <View style={styles.carDetails}>
          <View style={styles.detailItem}>
            <Text style={styles.detailValue}>{car.mileage?.toLocaleString() || 'N/A'}</Text>
            <Text style={styles.detailLabel}>Miles</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailValue}>{car.fuel_type || 'N/A'}</Text>
            <Text style={styles.detailLabel}>Fuel</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailValue}>{car.transmission || 'N/A'}</Text>
            <Text style={styles.detailLabel}>Trans</Text>
          </View>
        </View>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton}>
            <Heart color={colors.textSecondary} size={16} />
            <Text style={styles.actionButtonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => {/* Remove car */}}
          >
            <X color={colors.textSecondary} size={16} />
            <Text style={styles.actionButtonText}>Remove</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <ErrorBoundary>
        <LoadingState message="Loading comparison data..." />
      </ErrorBoundary>
    );
  }

  if (error) {
    return (
      <ErrorBoundary>
        <ErrorState
          title="Comparison Error"
          message={error}
          onRetry={() => {/* Retry logic */}}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={commonStyles.safeContainer}>
        {renderHeader()}
        
        <ScrollView
          style={commonStyles.container}
          contentContainerStyle={{ paddingBottom: Spacing.xxl }}
          showsVerticalScrollIndicator={false}
        >
          {cars.length > 0 ? (
            <>
              <ScrollView
                horizontal
                style={{ marginVertical: Spacing.lg }}
                contentContainerStyle={styles.cardsContainer}
                showsHorizontalScrollIndicator={false}
              >
                {cars.map(renderComparisonCard)}
              </ScrollView>
              
              {/* Comparison sections would be rendered here */}
            </>
          ) : (
            <View style={styles.addCarSection}>
              <TouchableOpacity 
                style={styles.addCarCard}
                onPress={() => {/* Add car logic */}}
              >
                <Plus color={colors.primary} size={48} />
                <Text style={styles.addCarText}>Add Cars to Compare</Text>
                <Text style={styles.addCarSubtext}>
                  Search and select cars to see detailed comparisons
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

// Export the improved component
export { ImprovedCompareScreen };
