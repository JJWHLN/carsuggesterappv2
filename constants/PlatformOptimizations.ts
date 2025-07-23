import DesignSystem from './DesignSystem';

/**
 * Platform-specific constants for optimal UX
 * DEPRECATED: Use DesignSystem instead for new code
 * This file is maintained for backward compatibility
 */

// Re-export DesignSystem platform optimizations for compatibility
export const PlatformOptimizations = {
  // iOS specific optimizations (legacy)
  ios: {
    statusBarHeight: DesignSystem.Platform.ui.statusBarHeight,
    safeAreaTop: DesignSystem.Platform.ui.statusBarHeight,
    tabBarHeight: DesignSystem.Platform.ui.tabBarHeight,
    buttonRadius: DesignSystem.BorderRadius.button,
    shadowProps: DesignSystem.Shadows.medium,
    hapticFeedback: DesignSystem.Platform.ui.hapticFeedback,
    animations: {
      duration: DesignSystem.Animations.duration.short,
      easing: DesignSystem.Animations.easing.standard,
    },
  },
  
  // Android specific optimizations (legacy)
  android: {
    statusBarHeight: DesignSystem.Platform.ui.statusBarHeight,
    safeAreaTop: DesignSystem.Platform.ui.statusBarHeight,
    tabBarHeight: DesignSystem.Platform.ui.tabBarHeight,
    buttonRadius: DesignSystem.BorderRadius.button,
    shadowProps: DesignSystem.Shadows.medium,
    hapticFeedback: DesignSystem.Platform.ui.hapticFeedback,
    animations: {
      duration: DesignSystem.Animations.duration.short,
      easing: DesignSystem.Animations.easing.standard,
    },
  },
  
  // Common optimizations (legacy)
  common: {
    touchableOpacity: DesignSystem.Platform.ui.touchableOpacity,
    animationDuration: DesignSystem.Animations.duration.short,
    borderRadius: DesignSystem.BorderRadius.button,
    minimumTouchTarget: DesignSystem.Accessibility.minimumTouchTarget,
    maxContentWidth: DesignSystem.Platform.content.maxWidth,
    responsiveBreakpoints: DesignSystem.Platform.breakpoints,
  },
};

// Responsive spacing based on screen size (legacy)
export const ResponsiveSpacing = DesignSystem.Spacing.responsive;

// Platform-optimized typography (legacy)
export const PlatformTypography = {
  ios: {
    fontFamily: DesignSystem.Typography.fontFamily,
    title: DesignSystem.Typography.h1,
    subtitle: DesignSystem.Typography.subtitle,
    body: DesignSystem.Typography.body,
    caption: DesignSystem.Typography.caption,
  },
  android: {
    fontFamily: DesignSystem.Typography.fontFamily,
    title: DesignSystem.Typography.h1,
    subtitle: DesignSystem.Typography.subtitle,
    body: DesignSystem.Typography.body,
    caption: DesignSystem.Typography.caption,
  },
};

// Platform-specific colors with dark mode support (legacy)
export const PlatformColors = {
  ios: DesignSystem.Colors.light,
  android: DesignSystem.Colors.light,
};

// Get platform-specific values (legacy)
export const getPlatformValue = <T>(iosValue: T, androidValue: T): T => {
  return DesignSystem.Utils.platformSelect(iosValue, androidValue);
};

// Optimized shadow for platform (legacy)
export const getPlatformShadow = (elevation: number = 2) => {
  switch (elevation) {
    case 1:
      return DesignSystem.Shadows.subtle;
    case 2:
      return DesignSystem.Shadows.sm;
    case 4:
      return DesignSystem.Shadows.medium;
    case 8:
      return DesignSystem.Shadows.large;
    default:
      return DesignSystem.Shadows.medium;
  }
};

// Responsive font size (legacy)
export const getResponsiveFontSize = (baseSize: number) => {
  return DesignSystem.Utils.responsiveSize(baseSize);
};

// Optimized touch targets (legacy)
export const getTouchableProps = () => ({
  activeOpacity: DesignSystem.Platform.ui.touchableOpacity,
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
  delayPressIn: 0,
  delayPressOut: 0,
});

// Migration notice
logger.warn(
  'PlatformOptimizations is deprecated. Please use DesignSystem instead for new code.'
);
