import DesignSystem from './DesignSystem';

// Advanced app optimizations for market leadership
// Now consolidated with DesignSystem for consistency
export const AppOptimizations = {
  // Performance thresholds
  performance: {
    targetFPS: 60,
    maxBundleSize: '5MB',
    maxInitialLoad: 2000, // 2 seconds
    maxNavigationDelay: 150, // milliseconds
    optimalImageSize: DesignSystem.Utils.optimalImageSize(),
    asyncComponentDelay: 100,
    ...DesignSystem.Performance,
  },

  // User Experience Standards
  ux: {
    minimumTouchTarget: DesignSystem.Accessibility.minimumTouchTarget,
    preferredTouchTarget: DesignSystem.Spacing.touch.comfortable,
    maxContentWidth: DesignSystem.Platform.content.maxWidth,
    optimalLineLength: DesignSystem.Platform.content.optimalLineLength,
    scrollDecelerationRate: DesignSystem.Utils.platformSelect(0.998, 0.985),
    snapToInterval: true,
    keyboardAvoidingBehavior: DesignSystem.Utils.platformSelect('padding', 'height'),
    hapticPatterns: {
      lightImpact: 'light',
      mediumImpact: 'medium',
      heavyImpact: 'heavy',
      success: 'notificationSuccess',
      warning: 'notificationWarning',
      error: 'notificationError',
    },
  },

  // Visual Excellence
  visual: {
    goldenRatio: 1.618,
    primaryGridUnit: DesignSystem.Spacing.base,
    borderRadiusScale: DesignSystem.BorderRadius,
    shadowDepths: DesignSystem.Shadows,
  },

  // Accessibility Excellence
  accessibility: DesignSystem.Accessibility,

  // Platform-Specific Optimizations
  platform: DesignSystem.Platform,

  // Animation Standards
  animations: DesignSystem.Animations,

  // Content Strategy
  content: {
    maxLineLength: 65, // characters for optimal readability
    optimalImageAspectRatio: 16/9,
    cardAspectRatio: 1.4,
    heroAspectRatio: 2.5,
    thumbnailSize: 80,
    avatarSize: 40,
    iconSize: 24,
    loadingSkeletonAnimation: true,
    progressiveImageLoading: true,
  },

  // Network & Data
  network: {
    retryAttempts: DesignSystem.Performance.retryAttempts,
    timeoutDuration: DesignSystem.Performance.timeoutDuration,
    cacheStrategy: 'stale-while-revalidate',
    prefetchRadius: DesignSystem.Performance.prefetchRadius,
    imageCacheSize: DesignSystem.Performance.imageCacheSize,
    offlineSupport: true,
    backgroundSync: true,
  },

  // Security & Privacy
  security: {
    biometricAuth: true,
    secureStorage: true,
    certificatePinning: true,
    dataEncryption: true,
    privacyFirst: true,
    minimalPermissions: true,
    transparentDataUsage: true,
  },
};

// Device-specific optimizations
export const getDeviceOptimizations = () => {
  const platform = DesignSystem.Platform;
  
  return {
    isTablet: platform.device.isTablet,
    isPhone: platform.device.isPhone,
    isPad: platform.device.isTablet && platform.platform.ios,
    isSmallScreen: platform.device.isSmallScreen,
    isLargeScreen: platform.device.isLargeScreen,
    memoryOptimized: DesignSystem.Performance.memoryOptimized,
    animationReduced: DesignSystem.Performance.animationReduced,
    imageQuality: platform.content.imageQuality,
    maxConcurrentImages: DesignSystem.Performance.maxConcurrentImages,
  };
};

// Get optimal configuration for current device
export const getOptimalConfig = () => {
  const device = getDeviceOptimizations();
  const spacing = DesignSystem.Spacing;
  
  return {
    // UI Configuration
    cardSpacing: device.isTablet ? spacing.xl : spacing.lg,
    gridColumns: device.isTablet ? 3 : 2,
    listItemHeight: device.isTablet ? 120 : 100,
    headerHeight: device.isTablet ? 80 : 64,
    
    // Performance Configuration
    renderDistance: DesignSystem.Performance.renderDistance,
    imageResolution: device.imageQuality,
    animationDuration: device.animationReduced ? 
      DesignSystem.Animations.duration.micro : 
      DesignSystem.Animations.duration.short,
    maxListItems: DesignSystem.Performance.maxListItems,
    
    // Feature Configuration
    enableParallax: DesignSystem.Performance.enableParallax,
    enableComplexAnimations: DesignSystem.Performance.enableComplexAnimations,
    enableHaptics: DesignSystem.Platform.ui.hapticFeedback,
    enableGestures: true,
  };
};

export default AppOptimizations;
