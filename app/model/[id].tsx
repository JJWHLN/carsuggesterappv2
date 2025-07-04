import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  // Image, // Replaced with OptimizedImage
  TouchableOpacity,
  Dimensions,
  Platform, // Import Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, useNavigation } from 'expo-router'; // Import useNavigation
import { 
  ArrowLeft, 
  Star, 
  Award,
  TrendingUp,
  Heart, // Keep for bookmarking icon
  Share,
  Car,
  Fuel,
  Settings
} from 'lucide-react-native';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors'; // Removed currentColors
import { useThemeColors } from '@/hooks/useTheme'; // Import useThemeColors
import { OptimizedImage } from '@/components/ui/OptimizedImage'; // Import OptimizedImage
import { fetchCarModelById } from '@/services/api';
import { useApi } from '@/hooks/useApi';
// import { getImageUrl } from '@/utils/formatters'; // No longer needed if OptimizedImage handles fallbacks

const { width } = Dimensions.get('window');

export default function ModelDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useThemeColors(); // Use themed colors
  const styles = useMemo(() => getThemedStyles(colors), [colors]); // Memoize styles

  const [isSaved, setIsSaved] = useState(false);
  const navigation = useNavigation();

  const { data: model, loading, error, refetch } = useApi(
    () => fetchCarModelById(id!),
    [id]
  );

  const handleSave = () => {
    setIsSaved(!isSaved);
    console.log('Save toggled for model:', id, !isSaved);
    // TODO: API call for bookmarking
  };

  const handleShare = () => {
    console.log('Share model:', id);
    // TODO: Implement React Native Share API
  };

  useEffect(() => {
    // Set headerRight actions using themed colors
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActionsContainer}>
          <TouchableOpacity
            onPress={handleShare}
            style={styles.headerActionButtonWithPadding}
            accessibilityRole="button"
            accessibilityLabel="Share this model"
          >
            <Share color={colors.primary} size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.headerActionButtonWithPadding}
            accessibilityRole="button"
            accessibilityLabel={isSaved ? "Unsave this model" : "Save this model"}
            accessibilityState={{ selected: isSaved }}
          >
            <Heart
              color={isSaved ? colors.error : colors.primary}
              fill={isSaved ? colors.error : 'transparent'}
              size={24}
            />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, model, isSaved, handleSave, handleShare, colors, styles.headerActionsContainer, styles.headerActionButtonWithPadding]); // Added colors and specific styles to dependency array


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* No custom header needed here, relying on stack navigator's header */}
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={32} color={colors.primary} />
          <Text style={styles.loadingText}>Loading model details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !model) {
    return (
      <SafeAreaView style={styles.container}>
        {/* No custom header needed here */}
        <ErrorState
          message={error || 'Model not found'}
          onRetry={refetch}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <OptimizedImage
          source={{ uri: model.image_url || '' }} // Pass URI directly
          style={styles.heroImage} // Ensure heroImage style has defined height/width
          resizeMode="cover"
          fallbackSource={require('@/assets/images/icon.png')} // Consistent fallback
          accessibilityLabel={`${model.brands?.name} ${model.name} hero image`}
        />
        <View style={styles.content}>
          <View style={styles.modelInfo}>
            <Text style={styles.brandName}>{model.brands?.name || 'Unknown Brand'}</Text>
            <Text style={styles.modelName}>{model.name}</Text>
            {model.year && <Text style={styles.modelYear}>{model.year} Model Year</Text>}
          </View>

          {model.category && model.category.length > 0 && (
            <View style={styles.categoriesSection}>
              <Text style={styles.sectionTitle}>Categories</Text>
              <View style={styles.categoriesContainer}>
                {model.category.map((category: string, index: number) => (
                  <View key={index} style={styles.categoryTag}>
                    <Award color={colors.primary} size={16} />
                    <Text style={styles.categoryText}>{category}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {model.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About This Model</Text>
              <Text style={styles.description}>{model.description}</Text>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Features (Static)</Text>
            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <Car color={colors.primary} size={24} />
                <Text style={styles.featureLabel}>Design</Text>
                <Text style={styles.featureValue}>Modern</Text>
              </View>
              <View style={styles.featureItem}>
                <Fuel color={colors.success} size={24} />
                <Text style={styles.featureLabel}>Efficiency</Text>
                <Text style={styles.featureValue}>Excellent</Text>
              </View>
              <View style={styles.featureItem}>
                <Settings color={colors.accentGreen} size={24} />
                <Text style={styles.featureLabel}>Technology</Text>
                <Text style={styles.featureValue}>Advanced</Text>
              </View>
              <View style={styles.featureItem}>
                <Star color={colors.error} size={24} />
                <Text style={styles.featureLabel}>Rating</Text>
                <Text style={styles.featureValue}>4.5/5</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionsSection}>
            <Button
              title="Find in Marketplace"
              onPress={() => router.push('/marketplace')}
              icon={<TrendingUp color={colors.white} size={20} />} // Assuming primary button has white text/icon
              style={styles.actionButton}
            />
            <Button
              title="Compare Models"
              onPress={() => router.push('/models')}
              variant="outline"
              icon={<Car color={colors.primary} size={20} />}
              style={styles.actionButton}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Convert styles to a function of colors
const getThemedStyles = (colors: typeof import('@/constants/Colors').Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  headerActionsContainer: {
    flexDirection: 'row',
    marginRight: Platform.OS === 'ios' ? 0 : Spacing.md,
  },
  headerActionButtonWithPadding: {
    padding: Spacing.sm,
  },
  heroImage: {
    width: '100%',
    height: 300,
    backgroundColor: colors.surfaceDark,
  },
  content: {
    padding: Spacing.lg,
  },
  modelInfo: {
    marginBottom: Spacing.xl,
  },
  brandName: {
    ...Typography.body,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  modelName: {
    ...Typography.h1,
    color: colors.text,
    marginBottom: Spacing.sm,
  },
  modelYear: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h3,
    color: colors.text,
    marginBottom: Spacing.md,
  },
  description: {
    ...Typography.body,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  categoriesSection: {
    marginBottom: Spacing.xl,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  categoryText: {
    ...Typography.bodySmall,
    color: colors.primary, // Or a contrast text color for primaryLight
    fontWeight: '500',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  featureItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    ...Shadows.small, // Consider if Shadows need theming
  },
  featureLabel: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  featureValue: {
    ...Typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  actionsSection: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionButton: {}, // Can add common styles for action buttons if needed
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: colors.background, // Themed background for loading
  },
  loadingText: {
    ...Typography.body,
    color: colors.textSecondary,
  },
});