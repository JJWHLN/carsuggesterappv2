import React, { memo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

import { useThemeColors } from '@/hooks/useTheme';
import { Theme } from '@/theme/Theme';
import { Zap, Crown, Car, Users, Truck, Wind, Leaf, TrendingUp, MapPin } from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');
const CATEGORY_WIDTH = (width - Theme.spacing.xl * 2 - Theme.spacing.md) / 2;

interface Category {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string[];
  popular?: boolean;
  count?: number;
  trending?: boolean;
}

interface PremiumCategoriesProps {
  onCategoryPress: (categoryId: string) => void;
  testID?: string;
}

export const PremiumCategories = memo<PremiumCategoriesProps>(({
  onCategoryPress,
  testID = 'premium-categories',
}) => {
  const { colors } = useThemeColors();

  const categories: Category[] = [
    {
      id: 'electric',
      title: 'Electric Cars',
      subtitle: 'Zero emissions, future-ready',
      icon: <Zap color="#FFFFFF" size={24} />,
      gradient: ['#3B82F6', '#1D4ED8'],
      popular: true,
      count: 156,
      trending: true,
    },
    {
      id: 'luxury',
      title: 'Luxury Vehicles',
      subtitle: 'Premium comfort & style',
      icon: <Crown color="#FFFFFF" size={24} />,
      gradient: ['#7C3AED', '#5B21B6'],
      popular: true,
      count: 89,
    },
    {
      id: 'family',
      title: 'Family SUVs',
      subtitle: 'Safe, spacious & reliable',
      icon: <Shield color="#FFFFFF" size={24} />,
      gradient: ['#059669', '#047857'],
      popular: true,
      count: 234,
    },
    {
      id: 'sports',
      title: 'Sports Cars',
      subtitle: 'Pure performance & thrill',
      icon: <Rocket color="#FFFFFF" size={24} />,
      gradient: ['#DC2626', '#B91C1C'],
      count: 67,
    },
    {
      id: 'compact',
      title: 'City Cars',
      subtitle: 'Urban mobility made easy',
      icon: <Car color="#FFFFFF" size={24} />,
      gradient: ['#F59E0B', '#D97706'],
      count: 178,
    },
    {
      id: 'commercial',
      title: 'Commercial',
      subtitle: 'Vans, trucks & work vehicles',
      icon: <Truck color="#FFFFFF" size={24} />,
      gradient: ['#6B7280', '#4B5563'],
      count: 45,
    },
    {
      id: 'hybrid',
      title: 'Hybrid Cars',
      subtitle: 'Best of both worlds',
      icon: <Leaf color="#FFFFFF" size={24} />,
      gradient: ['#10B981', '#059669'],
      count: 123,
      trending: true,
    },
    {
      id: 'convertible',
      title: 'Convertibles',
      subtitle: 'Open-air driving experience',
      icon: <Wind color="#FFFFFF" size={24} />,
      gradient: ['#EC4899', '#DB2777'],
      count: 34,
    },
  ];

  const CategoryCard = ({ category, index }: { category: Category; index: number }) => {
    const scaleAnim = useSharedValue(1);
    const opacityAnim = useSharedValue(0);

    // Staggered entrance animation
    React.useEffect(() => {
      const delay = index * 100;
      setTimeout(() => {
        opacityAnim.value = withTiming(1, { duration: 300 });
      }, delay);
    }, [index]);

    const handlePress = useCallback(() => {
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      scaleAnim.value = withSpring(0.95, { duration: 150 }, () => {
        scaleAnim.value = withSpring(1, { duration: 150 });
      });
      
      onCategoryPress(category.id);
    }, [category.id, scaleAnim]);

    const cardStyle = useAnimatedStyle(() => ({
      opacity: opacityAnim.value,
      transform: [{ scale: scaleAnim.value }],
    }));

    return (
      <Animated.View style={[styles.categoryCard, cardStyle]}>
        <TouchableOpacity
          style={styles.categoryTouchable}
          onPress={handlePress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={category.gradient as [string, string]}
            style={styles.categoryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Badges */}
            <View style={styles.badgeContainer}>
              {category.popular && (
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Popular</Text>
                </View>
              )}
              {category.trending && (
                <View style={styles.trendingBadge}>
                  <TrendingUp color="#FFFFFF" size={10} />
                </View>
              )}
            </View>

            {/* Icon */}
            <View style={styles.iconContainer}>
              {category.icon}
            </View>

            {/* Content */}
            <View style={styles.categoryContent}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
              
              {category.count && (
                <View style={styles.countContainer}>
                  <Text style={styles.countText}>
                    {category.count} available
                  </Text>
                </View>
              )}
            </View>

            {/* Decorative Elements */}
            <View style={styles.decorativeCircle} />
            <View style={styles.decorativeCircle2} />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const styles = getThemedStyles(colors);

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Browse by Category</Text>
        <Text style={styles.sectionSubtitle}>
          Find your perfect vehicle type
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        decelerationRate="fast"
        snapToInterval={CATEGORY_WIDTH + Theme.spacing.md}
        snapToAlignment="start"
      >
        {categories.map((category, index) => (
          <CategoryCard key={category.id} category={category} index={index} />
        ))}
      </ScrollView>

      {/* See All Button */}
      <TouchableOpacity
        style={[styles.seeAllButton, { borderColor: colors.border }]}
        onPress={() => onCategoryPress('all')}
      >
        <Text style={[styles.seeAllText, { color: colors.textSecondary }]}>
          See All Categories
        </Text>
      </TouchableOpacity>
    </View>
  );
});

PremiumCategories.displayName = 'PremiumCategories';

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: Theme.spacing.xl,
  },
  header: {
    paddingHorizontal: Theme.spacing.lg,
    marginBottom: Theme.spacing.lg,
  },
  sectionTitle: {
    ...Theme.typography.sectionTitle,
    color: colors.text,
    fontWeight: '700',
    marginBottom: Theme.spacing.xs,
  },
  sectionSubtitle: {
    ...Theme.typography.bodyText,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  scrollContainer: {
    paddingLeft: Theme.spacing.lg,
    paddingRight: Theme.spacing.md,
  },
  categoryCard: {
    width: CATEGORY_WIDTH,
    height: 160,
    marginRight: Theme.spacing.md,
  },
  categoryTouchable: {
    flex: 1,
    borderRadius: Theme.borderRadius.xl,
    overflow: 'hidden',
  },
  categoryGradient: {
    flex: 1,
    padding: Theme.spacing.lg,
    position: 'relative',
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: Theme.spacing.xs,
    marginBottom: Theme.spacing.sm,
  },
  popularBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
  },
  popularBadgeText: {
    ...Theme.typography.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  trendingBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    ...Theme.typography.cardTitle,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: Theme.spacing.xs,
  },
  categorySubtitle: {
    ...Theme.typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    marginBottom: Theme.spacing.sm,
  },
  countContainer: {
    marginTop: 'auto',
  },
  countText: {
    ...Theme.typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  decorativeCircle: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -10,
    left: -10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  seeAllButton: {
    marginTop: Theme.spacing.md,
    marginHorizontal: Theme.spacing.lg,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  seeAllText: {
    ...Theme.typography.bodyText,
    fontWeight: '600',
  },
});

export default PremiumCategories;
