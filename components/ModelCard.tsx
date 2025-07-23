import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

import { OptimizedImage } from './ui/OptimizedImage';
import { Spacing, Typography, BorderRadius, Shadows, Colors } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import { CarModel } from '@/types/database';
import { ChevronRight } from '@/utils/ultra-optimized-icons';

interface ModelCardProps {
  model: CarModel;
  onPress: () => void;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const ModelCardComponent: React.FC<ModelCardProps> = ({ model, onPress }) => {
  const { colors } = useThemeColors();
  const styles = getThemedModelCardStyles(colors);
  
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });
  
  const handlePressIn = () => {
    scale.value = withSpring(0.98, {
      damping: 15,
      stiffness: 200,
    });
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 200,
    });
  };

  return (
    <AnimatedTouchableOpacity 
      onPress={onPress} 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9} 
      style={[styles.container, animatedStyle]}
      accessibilityRole="button" 
      accessibilityLabel={`View details for ${model.brands?.name} ${model.name}`}
    >
      <View style={styles.card}>
        <OptimizedImage
          source={{ uri: model.image_url || '' }}
          style={styles.image}
          resizeMode="cover"
          fallbackSource={require('@/assets/images/icon.png')}
          accessibilityLabel={`${model.brands?.name} ${model.name} image`}
        />
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.info}>
              <Text style={styles.brandName}>{model.brands?.name || 'Unknown Brand'}</Text>
              <Text style={styles.modelName}>{model.name}</Text>
              {model.year && <Text style={styles.modelYear}>{model.year}</Text>}
            </View>
            <View style={styles.chevronContainer}>
              <ChevronRight color={colors.neutral400} size={20} />
            </View>
          </View>
          
          {model.description && (
            <Text style={styles.description} numberOfLines={2}>
              {model.description}
            </Text>
          )}
          
          {model.category && model.category.length > 0 && (
            <View style={styles.categories}>
              {model.category.slice(0, 3).map((category, index) => (
                <View key={index} style={styles.categoryTag}>
                  <Text style={styles.categoryText}>{category}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </AnimatedTouchableOpacity>
  );
};

const getThemedModelCardStyles = (colors: typeof import('@/constants/Colors').Colors.light) => StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.card,
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: colors.neutral200,
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
  brandName: {
    ...Typography.caption,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modelName: {
    ...Typography.title,
    color: colors.text,
    marginBottom: Spacing.xs,
    fontWeight: '700',
  },
  modelYear: {
    ...Typography.caption,
    color: colors.neutral400,
    fontWeight: '500',
  },
  chevronContainer: {
    padding: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  description: {
    ...Typography.body,
    color: colors.neutral500,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  categoryTag: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  categoryText: {
    ...Typography.caption,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 11,
  },
});

export const ModelCard = memo(ModelCardComponent);
ModelCard.displayName = 'ModelCard';