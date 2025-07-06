import { StyleSheet, Dimensions } from 'react-native';
import { Colors, Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from './Colors';

const { width } = Dimensions.get('window');

// Common style functions to reduce duplication across components
export const createCommonStyles = (colors: typeof Colors.light) => StyleSheet.create({
  // Container Styles
  flexContainer: {
    flex: 1,
  },
  safeContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: colors.background,
  },
  
  // Content Styles
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  
  // Header Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h2,
    color: colors.text,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  
  // Button Styles
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: Spacing.xs,
  },
  filterButtonText: {
    ...Typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  viewButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  viewButtonActive: {
    backgroundColor: colors.primary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  viewAllText: {
    ...Typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  
  // Card Styles
  baseCard: {
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...ColorsShadows.card,
  },
  listCard: {
    flexDirection: 'row',
    height: 160,
  },
  
  // Image Styles
  imageContainer: {
    position: 'relative',
    height: 160,
  },
  imageContainerList: {
    width: 140,
    height: '100%',
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  
  // Badge Styles
  baseBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  primaryBadge: {
    backgroundColor: colors.primary,
  },
  successBadge: {
    backgroundColor: colors.success,
  },
  badgeText: {
    ...Typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 10,
  },
  
  // Category/Tag Styles
  categoryChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: Spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    ...Typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  
  // Grid Layouts
  twoColumnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  gridItem: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    marginBottom: Spacing.lg,
  },
  listItem: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
  },
  
  // Stats Layouts
  statsSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    backgroundColor: colors.background,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  
  // Text Styles
  loadingText: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  
  // Controls Layout
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftControls: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  
  // Results Header
  resultsHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: colors.background,
  },
  resultsCount: {
    ...Typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  resultsSubtext: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
  },
  
  // Hero Section
  heroGradient: {
    paddingTop: Spacing.xl * 2,
    paddingBottom: Spacing.xl * 1.5,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'center',
  },
  heroContent: {
    alignItems: 'center',
    width: '100%',
  },
  heroTitle: {
    ...Typography.heroTitle,
    color: colors.white,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontWeight: '800',
  },
  heroSubtitle: {
    ...Typography.bodyLarge,
    color: colors.white,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    opacity: 0.95,
    lineHeight: 26,
  },
  
  // Detail Styles
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  detailText: {
    ...Typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  
  // Location/Meta Styles
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  locationText: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  
  // Rating Styles
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  ratingText: {
    ...Typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
});

// Utility functions for common styling patterns
export const getCardDimensions = (viewMode: 'grid' | 'list') => ({
  width: viewMode === 'grid' ? (width - Spacing.lg * 2 - Spacing.md) / 2 : width,
  height: viewMode === 'list' ? 160 : undefined,
});

export const getImageDimensions = (viewMode: 'grid' | 'list') => ({
  width: viewMode === 'list' ? 140 : '100%',
  height: viewMode === 'grid' ? 160 : '100%',
});

// Common animation configurations
export const COMMON_ANIMATIONS = {
  springConfig: {
    damping: 15,
    mass: 1,
    stiffness: 150,
  },
  fadeConfig: {
    duration: 200,
  },
};

// Common layout constants
export const LAYOUT_CONSTANTS = {
  CARD_MIN_HEIGHT: 200,
  HERO_HEIGHT_RATIO: 0.5,
  TAB_BAR_HEIGHT: 80,
  HEADER_HEIGHT: 60,
};
