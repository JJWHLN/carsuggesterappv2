import { Platform, Dimensions, PixelRatio } from 'react-native';
import * as Device from 'expo-device';

const { width, height } = Dimensions.get('window');
const pixelRatio = PixelRatio.get();

// Advanced app optimizations for market leadership
export const AppOptimizations = {
  // Performance thresholds
  performance: {
    targetFPS: 60,
    maxBundleSize: '5MB',
    maxInitialLoad: 2000, // 2 seconds
    maxNavigationDelay: 150, // milliseconds
    optimalImageSize: width * pixelRatio, // Native resolution
    asyncComponentDelay: 100,
  },

  // User Experience Standards
  ux: {
    minimumTouchTarget: 44,
    preferredTouchTarget: 48,
    maxContentWidth: Math.min(width, 420),
    optimalLineLength: Math.min(width * 0.85, 350),
    scrollDecelerationRate: Platform.OS === 'ios' ? 0.998 : 0.985,
    snapToInterval: true,
    keyboardAvoidingBehavior: Platform.OS === 'ios' ? 'padding' : 'height',
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
    primaryGridUnit: 8,
    borderRadiusScale: {
      small: 6,
      medium: 12,
      large: 20,
      xlarge: 32,
    },
    shadowDepths: {
      subtle: Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
        },
        android: { elevation: 1 },
      }),
      light: Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        },
        android: { elevation: 3 },
      }),
      medium: Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 8,
        },
        android: { elevation: 6 },
      }),
      strong: Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
        },
        android: { elevation: 12 },
      }),
    },
  },

  // Accessibility Excellence
  accessibility: {
    minimumFontSize: 14,
    scaleFactorSupport: true,
    highContrastSupport: true,
    screenReaderOptimized: true,
    colorBlindFriendly: true,
    minimumContrast: 4.5, // WCAG AA standard
    semanticMarkup: true,
    focusManagement: true,
  },

  // Platform-Specific Optimizations
  platform: {
    ios: {
      usesNativeComponents: true,
      respectsSystemSettings: true,
      hapticIntegration: 'full',
      keyboardType: 'smart',
      scrollIndicatorInsets: true,
      statusBarStyle: 'auto',
      largeTitle: true,
      swipeGestures: true,
    },
    android: {
      materialDesign: true,
      rippleEffects: true,
      navigationBar: 'adaptive',
      statusBarTranslucent: false,
      hardwareAcceleration: true,
      edgeToEdge: true,
      systemGestures: true,
    },
  },

  // Animation Standards
  animations: {
    micro: 150,  // Button presses, small interactions
    short: 250,  // Component transitions
    medium: 350, // Screen transitions
    long: 500,   // Complex animations
    extraLong: 750, // Onboarding, special effects
    
    curves: {
      standard: Platform.select({
        ios: 'easeInOut',
        android: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      }),
      decelerated: Platform.select({
        ios: 'easeOut',
        android: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      }),
      accelerated: Platform.select({
        ios: 'easeIn',
        android: 'cubic-bezier(0.4, 0.0, 1, 1)',
      }),
    },
  },

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
    retryAttempts: 3,
    timeoutDuration: 10000,
    cacheStrategy: 'stale-while-revalidate',
    prefetchRadius: 2, // screens
    imageCacheSize: 100, // MB
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
  const deviceType = Device.deviceType;
  const modelName = Device.modelName;
  
  return {
    isTablet: deviceType === Device.DeviceType.TABLET,
    isPhone: deviceType === Device.DeviceType.PHONE,
    isPad: modelName?.includes('iPad'),
    isSmallScreen: width < 375,
    isLargeScreen: width > 414,
    memoryOptimized: width < 375, // Reduce memory usage on smaller devices
    animationReduced: width < 375, // Reduce animations on older/smaller devices
    imageQuality: width > 414 ? 'high' : 'medium',
    maxConcurrentImages: width > 414 ? 10 : 6,
  };
};

// Get optimal configuration for current device
export const getOptimalConfig = () => {
  const device = getDeviceOptimizations();
  
  return {
    // UI Configuration
    cardSpacing: device.isTablet ? 20 : 16,
    gridColumns: device.isTablet ? 3 : 2,
    listItemHeight: device.isTablet ? 120 : 100,
    headerHeight: device.isTablet ? 80 : 64,
    
    // Performance Configuration
    renderDistance: device.memoryOptimized ? 3 : 5,
    imageResolution: device.imageQuality,
    animationDuration: device.animationReduced ? 150 : 250,
    maxListItems: device.memoryOptimized ? 20 : 50,
    
    // Feature Configuration
    enableParallax: !device.memoryOptimized,
    enableComplexAnimations: !device.animationReduced,
    enableHaptics: Platform.OS === 'ios',
    enableGestures: true,
  };
};

export default AppOptimizations;
