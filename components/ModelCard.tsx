import React, { memo } from 'react'; // Import memo
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { Card } from './ui/Card'; // Card is now memoized and themed
import { OptimizedImage } from './ui/OptimizedImage';
import { Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors'; // Removed currentColors
import { useThemeColors } from '@/hooks/useTheme'; // Import useThemeColors
import { CarModel } from '@/types/database';
import { ChevronRight } from '@/utils/ultra-optimized-icons';

interface ModelCardProps {
  model: CarModel;
  onPress: () => void;
}

const ModelCardComponent: React.FC<ModelCardProps> = ({ model, onPress }) => {
  const { colors } = useThemeColors();
  const styles = getThemedModelCardStyles(colors);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel={`View details for ${model.brands?.name} ${model.name}`}>
      <Card style={styles.card}>
        <OptimizedImage
          source={{ uri: model.image_url || '' }}
          style={{ ...styles.image, backgroundColor: colors.surfaceDark }}
          resizeMode="cover"
          fallbackSource={require('@/assets/images/icon.png')}
          accessibilityLabel={`${model.brands?.name} ${model.name} image`}
        />
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.info}>
              <Text style={[styles.brandName, { color: colors.primary }]}>{model.brands?.name || 'Unknown Brand'}</Text>
              <Text style={[styles.modelName, { color: colors.text }]}>{model.name}</Text>
              {model.year && <Text style={[styles.modelYear, { color: colors.textSecondary }]}>{model.year}</Text>}
            </View>
            <ChevronRight color={colors.textSecondary} size={20} />
          </View>
          
          {model.description && (
            <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
              {model.description}
            </Text>
          )}
          
          {model.category && model.category.length > 0 && (
            <View style={styles.categories}>
              {model.category.slice(0, 3).map((category, index) => (
                <View key={index} style={[styles.categoryTag, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.categoryText, { color: colors.primary }]}>{category}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const getThemedModelCardStyles = (colors: typeof import('@/constants/Colors').Colors.light) => StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    padding: 0, // Card handles its own padding, ensure this is intended. ModelCard content adds padding.
    overflow: 'hidden',
    // Card component itself will get its theme from useThemeColors now
  },
  image: {
    width: '100%',
    height: 180,
    // backgroundColor applied inline with themed color
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  info: {
    flex: 1,
  },
  brandName: { // color applied inline
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  modelName: { // color applied inline
    ...Typography.h3,
    marginBottom: Spacing.xs,
  },
  modelYear: { // color applied inline
    ...Typography.bodySmall,
  },
  description: { // color applied inline
    ...Typography.bodySmall,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  categoryTag: { // backgroundColor applied inline
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  categoryText: { // color applied inline
    ...Typography.caption,
    fontWeight: '500',
  },
});

export const ModelCard = memo(ModelCardComponent);
ModelCard.displayName = 'ModelCard';