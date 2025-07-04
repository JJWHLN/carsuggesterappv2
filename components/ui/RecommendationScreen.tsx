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
import { Filter, SlidersHorizontal, Grid2x2 as Grid, List, Star } from 'lucide-react-native';
import { CarCard } from './CarCard';
import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';
import { useThemeColors } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors';

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
        <CarCard
          image={item.image}
          name={item.name}
          year={item.year}
          priceRange={item.priceRange}
          tags={item.tags}
          rating={item.rating}
          location={item.location}
          onPress={() => onCarPress(item)}
          onFavorite={onFavoriteToggle ? () => onFavoriteToggle(item.id) : undefined}
          isFavorite={isFavorite}
          style={viewMode === 'list' ? styles.listCarCard : undefined}
        />
        
        {/* Match Score Badge for Recommendations */}
        {item.matchScore && (
          <View style={[styles.matchBadge, { backgroundColor: colors.success }]}>
            <Star color={colors.white} size={12} fill={colors.white} />
            <Text style={[styles.matchText, { color: colors.white }]}>
              {Math.round(item.matchScore)}% match
            </Text>
          </View>
        )}
        
        {/* Highlight Reason */}
        {item.highlightReason && (
          <Text style={[styles.highlightReason, { color: colors.primary }]} numberOfLines={1}>
            {item.highlightReason}
          </Text>
        )}
      </View>
    );
  }, [viewMode, favoriteCarIds, onCarPress, onFavoriteToggle, colors]);

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        )}
        <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
          {cars.length} {cars.length === 1 ? 'car' : 'cars'} found
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Filter Button */}
        {filters.length > 0 && (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowFilters(!showFilters)}
            accessibilityRole="button"
            accessibilityLabel="Toggle filters"
          >
            <Filter color={colors.primary} size={20} />
            <Text style={[styles.controlButtonText, { color: colors.text }]}>Filter</Text>
          </TouchableOpacity>
        )}

        {/* View Mode Toggle */}
        <View style={[styles.viewModeContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'grid' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setViewMode('grid')}
            accessibilityRole="button"
            accessibilityLabel="Grid view"
          >
            <Grid
              color={viewMode === 'grid' ? colors.white : colors.textSecondary}
              size={18}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'list' && { backgroundColor: colors.primary }
            ]}
            onPress={() => setViewMode('list')}
            accessibilityRole="button"
            accessibilityLabel="List view"
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
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={filters}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.filterChip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
                onPress={() => onFilterChange?.(item.id, item.value)}
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
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    
    return (
      <View style={styles.footer}>
        {loading ? (
          <LoadingSpinner color={colors.primary} />
        ) : (
          onLoadMore && (
            <Button
              title="Load More"
              onPress={onLoadMore}
              variant="outline"
              style={styles.loadMoreButton}
            />
          )
        )}
      </View>
    );
  };

  const renderEmpty = () => (
    <EmptyState
      title="No Cars Found"
      subtitle="Try adjusting your filters or search criteria"
      icon={<Star color={colors.textSecondary} size={48} />}
    />
  );

  if (loading && cars.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }, style]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={32} color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Finding your perfect cars...
          </Text>
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
  },
  loadingText: {
    ...Typography.body,
  },
  header: {
    marginBottom: Spacing.xl,
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
  },
  resultCount: {
    ...Typography.caption,
    textAlign: 'center',
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
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  controlButtonText: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  viewModeContainer: {
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  viewModeButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  filtersContainer: {
    marginTop: Spacing.md,
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
  },
  filterChipText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  row: {
    justifyContent: 'space-between',
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
  },
  matchText: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '600',
  },
  highlightReason: {
    ...Typography.caption,
    fontWeight: '500',
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  loadMoreButton: {
    paddingHorizontal: Spacing.xl,
  },
});
