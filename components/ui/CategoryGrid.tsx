import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import { Zap, Crown, Truck, Car, ChevronRight, ArrowRight } from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');

interface Category {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  count: string;
  onPress: () => void;
}

interface CategoryGridProps {
  onViewAll: () => void;
  onCategoryPress: (categoryName: string, categoryType: string) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ 
  onViewAll, 
  onCategoryPress 
}) => {
  const { colors } = useThemeColors();

  const categories: Category[] = [
    {
      id: 'electric',
      name: 'Electric Vehicles',
      description: 'Zero emissions, maximum efficiency',
      icon: Zap,
      color: '#10B981',
      bgColor: '#ECFDF5',
      count: '1,200+',
      onPress: () => onCategoryPress('Electric', 'Electric'),
    },
    {
      id: 'luxury',
      name: 'Luxury Cars',
      description: 'Premium comfort and prestige',
      icon: Crown,
      color: '#8B5CF6',
      bgColor: '#F3E8FF',
      count: '850+',
      onPress: () => onCategoryPress('Luxury', 'Luxury'),
    },
    {
      id: 'suv',
      name: 'Family SUVs',
      description: 'Safe, spacious, and reliable',
      icon: Shield,
      color: '#3B82F6',
      bgColor: '#EFF6FF',
      count: '2,100+',
      onPress: () => onCategoryPress('Family SUV', 'SUV'),
    },
    {
      id: 'sports',
      name: 'Sports Cars',
      description: 'Pure performance and style',
      icon: Rocket,
      color: '#EF4444',
      bgColor: '#FEF2F2',
      count: '650+',
      onPress: () => onCategoryPress('Sports Car', 'Sports'),
    },
    {
      id: 'truck',
      name: 'Pickup Trucks',
      description: 'Built for work and adventure',
      icon: Truck,
      color: '#F59E0B',
      bgColor: '#FFFBEB',
      count: '900+',
      onPress: () => onCategoryPress('Pickup Truck', 'Truck'),
    },
    {
      id: 'sedan',
      name: 'Sedans',
      description: 'Classic style meets efficiency',
      icon: Car,
      color: '#6B7280',
      bgColor: '#F9FAFB',
      count: '1,800+',
      onPress: () => onCategoryPress('Sedan', 'Sedan'),
    },
  ];

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>
            Browse by Category
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Find exactly what you're looking for
          </Text>
        </View>
        <TouchableOpacity 
          onPress={onViewAll}
          style={styles.viewAllButton}
          activeOpacity={0.8}
        >
          <Text style={[styles.viewAllText, { color: colors.primary }]}>
            View All
          </Text>
          <ArrowRight color={colors.primary} size={16} />
        </TouchableOpacity>
      </View>

      {/* Categories Grid */}
      <View style={styles.grid}>
        {categories.map((category, index) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryCard,
              { backgroundColor: colors.white, borderColor: colors.border },
              index % 2 === 0 ? styles.leftCard : styles.rightCard
            ]}
            onPress={category.onPress}
            activeOpacity={0.9}
          >
            {/* Header with Icon and Count */}
            <View style={styles.cardHeader}>
              <View style={[styles.iconContainer, { backgroundColor: category.bgColor }]}>
                <category.icon color={category.color} size={24} />
              </View>
              <View style={[styles.countBadge, { backgroundColor: category.bgColor }]}>
                <Text style={[styles.countText, { color: category.color }]}>
                  {category.count}
                </Text>
              </View>
            </View>

            {/* Content */}
            <View style={styles.cardContent}>
              <Text style={[styles.categoryName, { color: colors.text }]}>
                {category.name}
              </Text>
              <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
                {category.description}
              </Text>
            </View>

            {/* Footer with Arrow */}
            <View style={styles.cardFooter}>
              <View style={[styles.actionIndicator, { backgroundColor: category.bgColor }]}>
                <ChevronRight color={category.color} size={16} />
              </View>
            </View>

            {/* Hover Effect Overlay */}
            <View style={[styles.hoverOverlay, { backgroundColor: category.color }]} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.sectionTitle,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyText,
    lineHeight: 22,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  viewAllText: {
    ...Typography.bodyText,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  categoryCard: {
    width: (width - Spacing.lg * 3) / 2,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
    ...Shadows.card,
  },
  leftCard: {
    marginRight: Spacing.xs,
  },
  rightCard: {
    marginLeft: Spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  countText: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 11,
  },
  cardContent: {
    marginBottom: Spacing.md,
  },
  categoryName: {
    ...Typography.cardTitle,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    lineHeight: 22,
  },
  categoryDescription: {
    ...Typography.caption,
    lineHeight: 18,
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  actionIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hoverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    borderRadius: BorderRadius.xl,
  },
});
