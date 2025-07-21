import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, AccessibilityInfo } from 'react-native';

import { Card } from './ui/Card';
import { Spacing, Typography, BorderRadius } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import { Review } from '@/types/database';
import { formatFullDate } from '@/utils/dataTransformers';
import { Star, Calendar } from '@/utils/ultra-optimized-icons';

interface ReviewCardProps {
  review: Review;
  onPress: () => void;
}

export function ReviewCard({ review, onPress }: ReviewCardProps) {
  const handlePress = () => {
    AccessibilityInfo.announceForAccessibility(
      `Selected review: ${review.title}, rated ${review.rating} out of 5 stars`
    );
    onPress();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={16}
        color={index < rating ? currentColors.accentGreen : currentColors.border}
        fill={index < rating ? currentColors.accentGreen : 'transparent'}
      />
    ));
  };

  const truncateContent = (content: string, maxLength: number = 120) => {
    if (!content || typeof content !== 'string') return 'No content available';
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  const accessibilityLabel = `Review: ${review.title}, ${review.rating} out of 5 stars, for ${review.car_year} ${review.car_make} ${review.car_model}`;

  return (
    <TouchableOpacity 
      onPress={handlePress} 
      activeOpacity={0.9}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Double tap to read full review"
    >
      <Card style={styles.card}>
        {review.images && review.images.length > 0 && review.images[0] && (
          <Image
            source={{ uri: review.images[0] }}
            style={styles.image}
            resizeMode="cover"
            accessible={true}
            accessibilityLabel={`Review image for ${review.car_year} ${review.car_make} ${review.car_model}`}
          />
        )}
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              {review.title}
            </Text>
            <View 
              style={styles.rating}
              accessible={true}
              accessibilityLabel={`Rating: ${review.rating} out of 5 stars`}
            >
              {renderStars(review.rating)}
            </View>
          </View>
          
          <Text style={styles.carInfo} numberOfLines={1}>
            {review.car_year} {review.car_make} {review.car_model}
          </Text>
          
          <Text style={styles.content_text} numberOfLines={4}>
            {truncateContent(review.content)}
          </Text>
          
          {review.tags && review.tags.length > 0 && (
            <View style={styles.tags}>
              {review.tags.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
          
          <View style={styles.footer}>
            <Text style={styles.author} numberOfLines={1}>
              By {review.author}
            </Text>
            <View style={styles.date}>
              <Calendar color={currentColors.textSecondary} size={14} />
              <Text style={styles.dateText}>{formatFullDate(review.created_at)}</Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    backgroundColor: currentColors.surfaceDark,
  },
  content: {
    padding: Spacing.md,
  },
  header: {
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.h3,
    color: currentColors.text,
    marginBottom: Spacing.xs,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carInfo: {
    ...Typography.bodySmall,
    color: currentColors.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  content_text: {
    ...Typography.body,
    color: currentColors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  tag: {
    backgroundColor: currentColors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  tagText: {
    ...Typography.caption,
    color: currentColors.primary,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  author: {
    ...Typography.bodySmall,
    color: currentColors.textSecondary,
    fontWeight: '500',
    flex: 1,
    marginRight: Spacing.sm,
  },
  date: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    ...Typography.caption,
    color: currentColors.textSecondary,
    marginLeft: Spacing.xs,
  },
});