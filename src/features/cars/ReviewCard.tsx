import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { OptimizedImage } from './ui/OptimizedImage';
import {
  Spacing,
  Typography,
  BorderRadius,
  Shadows,
  Colors,
} from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import { Review } from '@/types/database';
import { formatFullDate } from '@/utils/dataTransformers';
import { Star, Calendar, User } from '@/utils/ultra-optimized-icons';

interface ReviewCardProps {
  review: Review;
  onPress: () => void;
}

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

const ReviewCardComponent: React.FC<ReviewCardProps> = ({
  review,
  onPress,
}) => {
  const { colors } = useThemeColors();
  const styles = getThemedReviewCardStyles(colors);

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

  const handlePress = () => {
    AccessibilityInfo.announceForAccessibility(
      `Selected review: ${review.summary || 'Review'}, scored ${review.cs_score} out of 10`,
    );
    onPress();
  };

  const renderStars = (rating: number) => {
    // Convert 10-point scale to 5-point scale for stars
    const starRating = Math.round((rating / 10) * 5);
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={16}
        color={index < starRating ? colors.primary : colors.neutral300}
        fill={index < starRating ? colors.primary : 'transparent'}
      />
    ));
  };

  const truncateContent = (content: string, maxLength: number = 120) => {
    if (!content || typeof content !== 'string') return 'No content available';
    return content.length > maxLength
      ? content.substring(0, maxLength) + '...'
      : content;
  };

  const accessibilityLabel = `Review: ${review.summary || 'Car Review'}, ${review.cs_score} out of 10 score, for ${review.car_models?.brands?.name} ${review.car_models?.name}`;

  return (
    <AnimatedTouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.9}
      style={[styles.container, animatedStyle]}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to read full review"
    >
      <View style={styles.card}>
        {review.car_models?.image_url && (
          <OptimizedImage
            source={{ uri: review.car_models.image_url }}
            style={styles.image}
            resizeMode="cover"
            fallbackSource={require('@/assets/images/icon.png')}
            accessibilityLabel={`Review image for ${review.car_models?.brands?.name} ${review.car_models?.name}`}
          />
        )}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              {review.summary || 'Car Review'}
            </Text>
            <View
              style={styles.rating}
              accessible={true}
              accessibilityLabel={`Score: ${review.cs_score} out of 10`}
            >
              {renderStars(review.cs_score || 0)}
              <Text style={styles.scoreText}>{review.cs_score}/10</Text>
            </View>
          </View>

          <Text style={styles.carInfo} numberOfLines={1}>
            {review.car_models?.year} {review.car_models?.brands?.name}{' '}
            {review.car_models?.name}
          </Text>

          <Text style={styles.contentText} numberOfLines={4}>
            {truncateContent(
              review.verdict || review.summary || 'No review content available',
            )}
          </Text>

          <View style={styles.footer}>
            <View style={styles.authorContainer}>
              <User color={colors.neutral400} size={14} />
              <Text style={styles.author} numberOfLines={1}>
                CarSuggester Review
              </Text>
            </View>
            <View style={styles.date}>
              <Calendar color={colors.neutral400} size={14} />
              <Text style={styles.dateText}>
                {formatFullDate(review.created_at)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </AnimatedTouchableOpacity>
  );
};

const getThemedReviewCardStyles = (
  colors: typeof import('@/constants/Colors').Colors.light,
) =>
  StyleSheet.create({
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
      height: 160,
      backgroundColor: colors.neutral200,
    },
    content: {
      padding: Spacing.lg,
    },
    header: {
      marginBottom: Spacing.sm,
    },
    title: {
      ...Typography.title,
      color: colors.text,
      marginBottom: Spacing.sm,
      fontWeight: '600',
      lineHeight: 24,
    },
    rating: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    scoreText: {
      ...Typography.caption,
      color: colors.primary,
      fontWeight: '700',
      marginLeft: Spacing.xs,
    },
    carInfo: {
      ...Typography.caption,
      color: colors.primary,
      fontWeight: '600',
      marginBottom: Spacing.sm,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    contentText: {
      ...Typography.body,
      color: colors.neutral600,
      lineHeight: 22,
      marginBottom: Spacing.lg,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    authorContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: Spacing.sm,
    },
    author: {
      ...Typography.caption,
      color: colors.neutral500,
      fontWeight: '500',
      marginLeft: Spacing.xs,
    },
    date: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    dateText: {
      ...Typography.caption,
      color: colors.neutral400,
      marginLeft: Spacing.xs,
    },
  });

export const ReviewCard = memo(ReviewCardComponent);
ReviewCard.displayName = 'ReviewCard';
