import React, { memo, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ListRenderItem,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

// Import removed - using inline card component instead of CarCard
import { OptimizedImage } from './OptimizedImage';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';
import { useThemeColors } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors';
import { Filter, SlidersHorizontal, List, Star, Heart } from '@/utils/ultra-optimized-icons';

export interface CarRecommendation {
  id: string;
  image: string;
  name: string;
  year?: number;
  priceRange: string;
  tags: string[];
  rating: number;
  location: string;
  matchScore?: number;
  highlightReason?: string;
}

interface FilterOption {
  id: string;
  label: string;
  value: any;
  count?: number;
}

interface RecommendationScreenProps {
  cars: CarRecommendation[];
  loading?: boolean;
  title?: string;
  subtitle?: string;
  onCarPress: (car: CarRecommendation) => void;
  onFavoriteToggle?: (carId: string) => void;
  favoriteCarIds?: string[];
  filters?: FilterOption[];
  onFilterChange?: (filterId: string, value: any) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  style?: any;
}

const { width } = Dimensions.get('window');

export const RecommendationScreen = memo<RecommendationScreenProps>(({
  cars,
  loading = false,
  title = "Recommended Cars",
  subtitle,
  onCarPress,
  onFavoriteToggle,
  favoriteCarIds = [],
  filters = [],
  onFilterChange,
  onLoadMore,
  hasMore = false,
  style,
}) => {
  const { colors } = useThemeColors();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const renderCar: ListRenderItem<CarRecommendation> = useCallback(({ item, index }) => {
    const isFavorite = favoriteCarIds.includes(item.id);
    
    return (
      <View style={viewMode === 'grid' ? styles.gridItem : styles.listItem}>
        <View style={[styles.carCardContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.simpleCard} onPress={() => onCarPress(item)}>
            <OptimizedImage source={{ uri: item.image }} style={styles.cardImage} />
            <View style={styles.cardContent}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{item.name}</Text>
              {item.year && <Text style={[styles.cardYear, { color: colors.textMuted }]}>{item.year}</Text>}
              <Text style={[styles.cardPrice, { color: colors.primary }]}>{item.priceRange}</Text>
              {item.rating && (
                <View style={styles.ratingContainer}>
                  <Star color="#FFD700" size={16} fill="#FFD700" />
                  <Text style={[styles.ratingText, { color: colors.textMuted }]}>{item.rating}</Text>
                </View>
              )}
              {item.location && <Text style={[styles.locationText, { color: colors.textMuted }]}>{item.location}</Text>}
              {item.tags && (
                <View style={styles.tagsContainer}>
                  {item.tags.map((tag: string, idx: number) => (
                    <Text key={idx} style={[styles.tag, { backgroundColor: colors.primaryLight, color: colors.textMuted }]}>
                      {tag}
                    </Text>
                  ))}
                </View>
              )}
            </View>
            {onFavoriteToggle && (
              <TouchableOpacity style={styles.favoriteButton} onPress={() => onFavoriteToggle(item.id)}>
                <Heart color={isFavorite ? "#FF4444" : colors.textMuted} size={20} fill={isFavorite ? "#FF4444" : "none"} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>
          
          {/* Enhanced Match Score Badge */}
          {item.matchScore && (
            <View style={[styles.matchBadge, { backgroundColor: colors.success }]}>
              <Star color={colors.white} size={12} fill={colors.white} />
              <Text style={[styles.matchText, { color: colors.white }]}>
                {Math.round(item.matchScore)}% match
              </Text>
            </View>
          )}
          
          {/* Highlight Reason with improved styling */}
          {item.highlightReason && (
            <View style={[styles.highlightReasonContainer, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.highlightReason, { color: colors.primary }]} numberOfLines={1}>
                ✨ {item.highlightReason}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }, [viewMode, favoriteCarIds, onCarPress, onFavoriteToggle, colors]);

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Modern Hero Section */}
      <LinearGradient
        colors={[colors.primary, colors.primaryHover || colors.primary]}
        style={styles.heroSection}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.heroContent}>
          <View style={styles.titleSection}>
            <Text style={[styles.title, { color: colors.white }]}>{title}</Text>
            {subtitle && (
              <Text style={[styles.subtitle, { color: colors.white }]}>{subtitle}</Text>
            )}
          </View>
          
          {/* Stats Badge */}
          <View style={[styles.statsBadge, { backgroundColor: colors.white }]}>
            <Star color={colors.primary} size={16} fill={colors.primary} />
            <Text style={[styles.statsText, { color: colors.primary }]}>
              {cars.length} {cars.length === 1 ? 'perfect match' : 'perfect matches'} found
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Controls Section */}
      <View style={styles.controlsWrapper}>
        <View style={styles.controls}>
          {/* Filter Button */}
          {filters.length > 0 && (
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => setShowFilters(!showFilters)}
              accessibilityRole="button"
              accessibilityLabel="Toggle filters"
              activeOpacity={0.7}
            >
              <Filter color={colors.primary} size={20} />
              <Text style={[styles.controlButtonText, { color: colors.text }]}>Filters</Text>
              {showFilters && (
                <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
              )}
            </TouchableOpacity>
          )}

          {/* View Mode Toggle */}
          <View style={[styles.viewModeContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'grid' && [styles.viewModeButtonActive, { backgroundColor: colors.primary }]
              ]}
              onPress={() => setViewMode('grid')}
              accessibilityRole="button"
              accessibilityLabel="Grid view"
              activeOpacity={0.7}
            >
              <Grid
                color={viewMode === 'grid' ? colors.white : colors.textSecondary}
                size={18}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewModeButton,
                viewMode === 'list' && [styles.viewModeButtonActive, { backgroundColor: colors.primary }]
              ]}
              onPress={() => setViewMode('list')}
              accessibilityRole="button"
              accessibilityLabel="List view"
              activeOpacity={0.7}
            >
              <List
                color={viewMode === 'list' ? colors.white : colors.textSecondary}
                size={18}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Filters */}
        {showFilters && filters.length > 0 && (
          <View style={styles.filtersContainer}>
            <Text style={[styles.filtersTitle, { color: colors.text }]}>Quick Filters</Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={filters}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.filterChip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                  onPress={() => onFilterChange?.(item.id, item.value)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, { color: colors.primary }]}>
                    {item.label}
                    {item.count && ` (${item.count})`}
                  </Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.filtersContent}
            />
          </View>
        )}
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    
    return (
      <View style={styles.footer}>
        {loading ? (
          <View style={[styles.footerLoadingContainer, { backgroundColor: colors.surface }]}>
            <LoadingSpinner color={colors.primary} />
            <Text style={[styles.footerLoadingText, { color: colors.text }]}>
              Loading more amazing cars...
            </Text>
          </View>
        ) : (
          onLoadMore && (
            <Button
              title="Discover More Cars"
              onPress={onLoadMore}
              variant="outline"
              style={StyleSheet.flatten([styles.loadMoreButton, { borderColor: colors.primary }])}
              icon={<Star color={colors.primary} size={20} />}
            />
          )
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyStateContainer}>
      <LinearGradient
        colors={[colors.primaryLight, colors.surface]}
        style={styles.emptyStateGradient}
      >
        <Star color={colors.primary} size={64} />
        <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
          No Perfect Matches Yet
        </Text>
        <Text style={[styles.emptyStateSubtitle, { color: colors.textSecondary }]}>
          Try adjusting your filters to discover more amazing cars that match your preferences
        </Text>
      </LinearGradient>
    </View>
  );

  if (loading && cars.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }, style]}>
        <View style={styles.loadingContainer}>
          <LinearGradient
            colors={[colors.primary, colors.primaryHover || colors.primary]}
            style={styles.loadingGradient}
          >
            <LoadingSpinner size={32} color={colors.white} />
            <Text style={[styles.loadingText, { color: colors.white }]}>
              ✨ Finding your perfect cars...
            </Text>
            <Text style={[styles.loadingSubtext, { color: colors.white }]}>
              Our AI is analyzing thousands of options
            </Text>
          </LinearGradient>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }, style]}>
      <FlatList
        data={cars}
        renderItem={renderCar}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode} // Force re-render when view mode changes
        columnWrapperStyle={viewMode === 'grid' ? styles.row : undefined}
        contentContainerStyle={cars.length === 0 ? styles.emptyContent : styles.content}
        showsVerticalScrollIndicator={false}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
});

RecommendationScreen.displayName = 'RecommendationScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  emptyContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  loadingGradient: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    gap: Spacing.md,
    ...ColorsShadows.large,
  },
  loadingText: {
    ...Typography.h3,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingSubtext: {
    ...Typography.body,
    textAlign: 'center',
    opacity: 0.9,
  },
  // Enhanced Empty State
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyStateGradient: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl * 2,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    gap: Spacing.lg,
    ...ColorsShadows.large,
    width: '100%',
    maxWidth: 300,
  },
  emptyStateTitle: {
    ...Typography.h2,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  // New Hero Section Styles
  heroSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  heroContent: {
    alignItems: 'center',
  },
  titleSection: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    fontWeight: '700',
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    lineHeight: 24,
    opacity: 0.9,
  },
  statsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
    ...ColorsShadows.small,
  },
  statsText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  // Controls Section Styles
  controlsWrapper: {
    paddingHorizontal: Spacing.lg,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.xs,
    position: 'relative',
    ...ColorsShadows.small,
  },
  controlButtonText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  viewModeContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...ColorsShadows.small,
  },
  viewModeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  viewModeButtonActive: {
    ...ColorsShadows.small,
  },
  filtersContainer: {
    marginTop: Spacing.md,
  },
  filtersTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  filtersContent: {
    paddingRight: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
    ...ColorsShadows.small,
  },
  filterChipText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  row: {
    justifyContent: 'space-between',
  },
  // Enhanced Card Styling
  carCardContainer: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...ColorsShadows.card,
    position: 'relative',
  },
  gridItem: {
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  listItem: {
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  listCarCard: {
    width: '100%',
    flexDirection: 'row',
    height: 120,
  },
  matchBadge: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    gap: 2,
    zIndex: 1,
    ...ColorsShadows.small,
  },
  matchText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
  },
  highlightReasonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomLeftRadius: BorderRadius.lg,
    borderBottomRightRadius: BorderRadius.lg,
  },
  highlightReason: {
    ...Typography.caption,
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 11,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  footerLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.md,
    ...ColorsShadows.small,
  },
  footerLoadingText: {
    ...Typography.body,
    fontWeight: '500',
  },
  loadMoreButton: {
    paddingHorizontal: Spacing.xl,
    ...ColorsShadows.small,
  },
  // Simple Card Styles (missing from previous implementation)
  simpleCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...ColorsShadows.card,
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: Spacing.md,
  },
  cardTitle: {
    ...Typography.h4,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  cardYear: {
    ...Typography.caption,
    marginBottom: Spacing.xs,
  },
  cardPrice: {
    ...Typography.h4,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  ratingText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  locationText: {
    ...Typography.caption,
    marginBottom: Spacing.sm,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '500',
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    padding: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    ...ColorsShadows.small,
  },
});
