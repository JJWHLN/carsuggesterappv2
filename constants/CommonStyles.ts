import { StyleSheet, Dimensions } from 'react-native';
import DesignSystem from './DesignSystem';

const { width } = Dimensions.get('window');

// Common style functions to reduce duplication across components
// Now uses unified DesignSystem for consistency
export const createCommonStyles = (colors: typeof DesignSystem.Colors.light) => StyleSheet.create({
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
    gap: DesignSystem.Spacing.md,
    backgroundColor: colors.background,
  },
  
  // Content Styles
  scrollContent: {
    paddingBottom: DesignSystem.Spacing.xxl,
  },
  section: {
    paddingHorizontal: DesignSystem.Spacing.lg,
    marginBottom: DesignSystem.Spacing.xl,
  },
  
  // Header Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: DesignSystem.Spacing.lg,
  },
  sectionTitle: {
    ...DesignSystem.Typography.h2,
    color: colors.text,
    fontWeight: '700',
    marginBottom: DesignSystem.Spacing.xs,
  },
  sectionSubtitle: {
    ...DesignSystem.Typography.body,
    color: colors.textSecondary,
  },
  
  // Button Styles
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: DesignSystem.Spacing.md,
    paddingVertical: DesignSystem.Spacing.sm,
    borderRadius: DesignSystem.BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: DesignSystem.Spacing.xs,
  },
  filterButtonText: {
    ...DesignSystem.Typography.bodySmall,
    color: colors.text,
    fontWeight: '500',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: DesignSystem.BorderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  viewButton: {
    paddingHorizontal: DesignSystem.Spacing.md,
    paddingVertical: DesignSystem.Spacing.sm,
  },
  viewButtonActive: {
    backgroundColor: colors.primary,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.Spacing.xs,
  },
  viewAllText: {
    ...DesignSystem.Typography.body,
    color: colors.primary,
    fontWeight: '600',
  },
  
  // Card Styles
  baseCard: {
    backgroundColor: colors.surface,
    borderRadius: DesignSystem.BorderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...DesignSystem.Shadows.card,
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
    paddingHorizontal: DesignSystem.Spacing.sm,
    paddingVertical: DesignSystem.Spacing.xs,
    borderRadius: DesignSystem.BorderRadius.sm,
  },
  primaryBadge: {
    backgroundColor: colors.primary,
  },
  successBadge: {
    backgroundColor: colors.success,
  },
  badgeText: {
    ...DesignSystem.Typography.caption,
    color: colors.white,
    fontWeight: '600',
    fontSize: 10,
  },
  
  // Category/Tag Styles
  categoryChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: DesignSystem.Spacing.md,
    paddingVertical: DesignSystem.Spacing.sm,
    borderRadius: DesignSystem.BorderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: DesignSystem.Spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    ...DesignSystem.Typography.bodySmall,
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
    gap: DesignSystem.Spacing.md,
  },
  gridItem: {
    width: (width - DesignSystem.Spacing.lg * 2 - DesignSystem.Spacing.md) / 2,
    marginBottom: DesignSystem.Spacing.lg,
  },
  listItem: {
    paddingHorizontal: DesignSystem.Spacing.lg,
    marginBottom: DesignSystem.Spacing.lg,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: DesignSystem.Spacing.lg,
  },
  
  // Stats Layouts
  statsSection: {
    paddingHorizontal: DesignSystem.Spacing.lg,
    paddingVertical: DesignSystem.Spacing.xl,
    backgroundColor: colors.background,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: DesignSystem.Spacing.md,
  },
  
  // Text Styles
  loadingText: {
    ...DesignSystem.Typography.body,
    color: colors.textSecondary,
  },
  
  // Controls Layout
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: DesignSystem.Spacing.lg,
    paddingVertical: DesignSystem.Spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  leftControls: {
    flexDirection: 'row',
    gap: DesignSystem.Spacing.sm,
  },
  
  // Results Header
  resultsHeader: {
    paddingHorizontal: DesignSystem.Spacing.lg,
    paddingVertical: DesignSystem.Spacing.md,
    backgroundColor: colors.background,
  },
  resultsCount: {
    ...DesignSystem.Typography.h3,
    color: colors.text,
    fontWeight: '700',
  },
  resultsSubtext: {
    ...DesignSystem.Typography.bodySmall,
    color: colors.textSecondary,
  },
  
  // Hero Section
  heroGradient: {
    paddingTop: DesignSystem.Spacing.xl * 2,
    paddingBottom: DesignSystem.Spacing.xl * 1.5,
    paddingHorizontal: DesignSystem.Spacing.lg,
    justifyContent: 'center',
  },
  heroContent: {
    alignItems: 'center',
    width: '100%',
  },
  heroTitle: {
    ...DesignSystem.Typography.heroTitle,
    color: colors.white,
    textAlign: 'center',
    marginBottom: DesignSystem.Spacing.md,
    fontWeight: '800',
  },
  heroSubtitle: {
    ...DesignSystem.Typography.bodyLarge,
    color: colors.white,
    textAlign: 'center',
    marginBottom: DesignSystem.Spacing.xl,
    opacity: 0.95,
    lineHeight: 26,
  },
  
  // Detail Styles
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.Spacing.xs,
  },
  detailText: {
    ...DesignSystem.Typography.bodySmall,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  
  // Location/Meta Styles
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.Spacing.xs,
  },
  locationText: {
    ...DesignSystem.Typography.caption,
    color: colors.textSecondary,
  },
  
  // Rating Styles
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignSystem.Spacing.xs,
  },
  ratingText: {
    ...DesignSystem.Typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
});

// Utility functions for common styling patterns
export const getCardDimensions = (viewMode: 'grid' | 'list') => ({
  width: viewMode === 'grid' ? (width - DesignSystem.Spacing.lg * 2 - DesignSystem.Spacing.md) / 2 : width,
  height: viewMode === 'list' ? 160 : undefined,
});

export const getImageDimensions = (viewMode: 'grid' | 'list') => ({
  width: viewMode === 'list' ? 140 : '100%',
  height: viewMode === 'grid' ? 160 : '100%',
});

// Common animation configurations
export const COMMON_ANIMATIONS = {
  springConfig: DesignSystem.Animations.spring.gentle,
  fadeConfig: {
    duration: DesignSystem.Animations.duration.short,
  },
};

// Common layout constants
export const LAYOUT_CONSTANTS = {
  CARD_MIN_HEIGHT: 200,
  HERO_HEIGHT_RATIO: 0.5,
  TAB_BAR_HEIGHT: DesignSystem.Platform.ui.tabBarHeight,
  HEADER_HEIGHT: 60,
};

// Re-export DesignSystem components for backward compatibility
export const { Colors, Spacing, Typography, BorderRadius, Shadows } = DesignSystem;
