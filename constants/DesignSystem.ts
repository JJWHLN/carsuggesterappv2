import { Platform, Dimensions, PixelRatio } from 'react-native';
import * as Device from 'expo-device';

/**
 * Consolidated Design System - Eliminates redundancies across AppOptimizations,
 * PlatformOptimizations, Colors, and CommonStyles
 */

// Single source of truth for device dimensions
const DEVICE_DIMENSIONS = Dimensions.get('window');
const SCREEN_WIDTH = DEVICE_DIMENSIONS.width;
const SCREEN_HEIGHT = DEVICE_DIMENSIONS.height;
const PIXEL_RATIO = PixelRatio.get();

// Platform constants - single source
const IS_IOS = Platform.OS === 'ios';
const IS_ANDROID = Platform.OS === 'android';
const IS_WEB = Platform.OS === 'web';

// Device type detection
const DEVICE_TYPE = Device.deviceType;
const IS_TABLET = DEVICE_TYPE === Device.DeviceType.TABLET;
const IS_PHONE = DEVICE_TYPE === Device.DeviceType.PHONE;
const IS_SMALL_SCREEN = SCREEN_WIDTH < 375;
const IS_LARGE_SCREEN = SCREEN_WIDTH > 414;

/**
 * Unified Color System
 * Consolidates Colors.ts and PlatformOptimizations color definitions
 */
export const UnifiedColors = {
  light: {
    // Primary Green Theme
    primary: '#22C55E',
    primaryHover: '#16A34A',
    primaryLight: '#A7F3D0',
    primaryVariant: '#15803D',
    
    // Surface colors
    background: '#F8F9FA',
    surface: '#FFFFFF',
    surfaceVariant: '#E9ECEF',
    
    // Text colors
    onSurface: '#111827',
    onSurfaceVariant: '#6B7280',
    onSurfaceMuted: '#9CA3AF',
    
    // System colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    
    // Semantic
    border: '#E5E7EB',
    divider: '#E5E7EB',
    shadow: '#000000',
    
    // Aliases for backward compatibility
    text: '#111827',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    cardBackground: '#FFFFFF',
    card: '#FFFFFF', // Missing property causing TypeScript errors
    accent: '#F59E0B', // Missing property causing TypeScript errors
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },
  dark: {
    // Primary Green Theme (dark mode optimized)
    primary: '#4ADE80',
    primaryHover: '#22C55E',
    primaryLight: '#166534',
    primaryVariant: '#4ADE80',
    
    // Surface colors
    background: '#18181B',
    surface: '#27272A',
    surfaceVariant: '#3F3F46',
    
    // Text colors
    onSurface: '#F3F4F6',
    onSurfaceVariant: '#9CA3AF',
    onSurfaceMuted: '#6B7280',
    
    // System colors
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    
    // Semantic
    border: '#3F3F46',
    divider: '#3F3F46',
    shadow: '#000000',
    
    // Aliases for backward compatibility
    text: '#F3F4F6',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    cardBackground: '#27272A',
    card: '#27272A', // Missing property causing TypeScript errors
    accent: '#FBBF24', // Missing property causing TypeScript errors
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',
  },
} as const;

/**
 * Unified Spacing System
 * Consolidates all spacing definitions with responsive calculations
 */
export const UnifiedSpacing = {
  // Base spacing (8px grid system)
  base: 8,
  
  // Static spacing values
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
  
  // Responsive spacing (adapts to screen size)
  responsive: {
    xs: IS_SMALL_SCREEN ? 4 : 6,
    sm: IS_SMALL_SCREEN ? 6 : 8,
    md: IS_SMALL_SCREEN ? 12 : 16,
    lg: IS_SMALL_SCREEN ? 16 : 20,
    xl: IS_SMALL_SCREEN ? 20 : 24,
    xxl: IS_SMALL_SCREEN ? 24 : 32,
  },
  
  // Contextual spacing
  touch: {
    minimum: 44, // Minimum touch target
    comfortable: 48, // Comfortable touch target
    padding: IS_SMALL_SCREEN ? 8 : 12,
  },
  
  // Layout spacing
  screen: {
    horizontal: IS_TABLET ? 32 : 20,
    vertical: IS_TABLET ? 24 : 16,
    section: IS_TABLET ? 40 : 32,
  },
} as const;

/**
 * Unified Typography System
 * Consolidates Typography and PlatformTypography with responsive scaling
 */
const getScaledFontSize = (baseSize: number): number => {
  const scale = SCREEN_WIDTH / 375; // iPhone 6/7/8 as base
  return Math.round(baseSize * Math.max(scale, 0.85));
};

export const UnifiedTypography = {
  // Display text
  heroTitle: {
    fontSize: IS_SMALL_SCREEN ? 28 : 34,
    fontWeight: '800' as const,
    lineHeight: IS_SMALL_SCREEN ? 32 : 38,
    letterSpacing: -0.5,
  },
  
  // Headings
  h1: {
    fontSize: IS_SMALL_SCREEN ? 26 : 30,
    fontWeight: '700' as const,
    lineHeight: IS_SMALL_SCREEN ? 32 : 36,
  },
  h2: {
    fontSize: IS_SMALL_SCREEN ? 20 : 24,
    fontWeight: '600' as const,
    lineHeight: IS_SMALL_SCREEN ? 24 : 28,
  },
  h3: {
    fontSize: IS_SMALL_SCREEN ? 17 : 19,
    fontWeight: '600' as const,
    lineHeight: IS_SMALL_SCREEN ? 22 : 24,
  },
  
  // Body text
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 27,
  },
  body: {
    fontSize: IS_SMALL_SCREEN ? 14 : 16,
    fontWeight: '400' as const,
    lineHeight: IS_SMALL_SCREEN ? 20 : 24,
  },
  bodySmall: {
    fontSize: IS_SMALL_SCREEN ? 12 : 14,
    fontWeight: '400' as const,
    lineHeight: IS_SMALL_SCREEN ? 16 : 20,
  },
  
  // Functional text
  button: {
    fontSize: IS_SMALL_SCREEN ? 14 : 16,
    fontWeight: '600' as const,
    lineHeight: IS_SMALL_SCREEN ? 18 : 20,
  },
  caption: {
    fontSize: IS_SMALL_SCREEN ? 11 : 12,
    fontWeight: '500' as const,
    lineHeight: IS_SMALL_SCREEN ? 14 : 16,
  },
  
  // Platform-specific font families
  fontFamily: IS_IOS ? 'System' : 'Roboto',
} as const;

/**
 * Unified Border Radius System
 * Consolidates border radius definitions with platform optimizations
 */
export const UnifiedBorderRadius = {
  xs: 4,
  sm: IS_IOS ? 8 : 6,
  md: IS_IOS ? 12 : 8,
  lg: IS_IOS ? 16 : 12,
  xl: IS_IOS ? 24 : 16,
  full: 9999,
  
  // Contextual radius
  button: IS_IOS ? 12 : 8,
  card: IS_IOS ? 16 : 12,
  modal: IS_IOS ? 24 : 16,
} as const;

/**
 * Unified Shadow System
 * Consolidates all shadow definitions with platform-specific optimizations
 */
export const UnifiedShadows = {
  none: {},
  
  subtle: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
    default: {},
  }),
  
  small: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    android: { elevation: 2 },
    default: {},
  }),
  
  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    default: {},
  }),
  
  large: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 16,
    },
    android: { elevation: 8 },
    default: {},
  }),
  
  // Specialized shadows
  button: Platform.select({
    ios: {
      shadowColor: 'rgba(34, 197, 94, 0.15)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
    },
    android: { elevation: 4 },
    default: {},
  }),
  
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
    },
    android: { elevation: 2 },
    default: {},
  }),
} as const;

/**
 * Unified Animation System
 * Consolidates animation timing and curves
 */
export const UnifiedAnimations = {
  // Duration constants
  duration: {
    instant: 0,
    micro: 150,
    short: IS_IOS ? 250 : 200,
    medium: 350,
    long: 500,
    extended: 750,
  },
  
  // Easing curves
  easing: {
    standard: IS_IOS ? 'easeInOut' : 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    decelerated: IS_IOS ? 'easeOut' : 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    accelerated: IS_IOS ? 'easeIn' : 'cubic-bezier(0.4, 0.0, 1, 1)',
  },
  
  // Spring configurations
  spring: {
    gentle: { damping: 15, mass: 1, stiffness: 150 },
    bouncy: { damping: 12, mass: 1, stiffness: 200 },
    snappy: { damping: 20, mass: 1, stiffness: 300 },
  },
} as const;

/**
 * Platform-Specific Optimizations
 * Consolidates platform detection and optimizations
 */
export const PlatformOptimizations = {
  // Platform detection
  platform: {
    ios: IS_IOS,
    android: IS_ANDROID,
    web: IS_WEB,
  },
  
  // Device characteristics
  device: {
    isTablet: IS_TABLET,
    isPhone: IS_PHONE,
    isSmallScreen: IS_SMALL_SCREEN,
    isLargeScreen: IS_LARGE_SCREEN,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    pixelRatio: PIXEL_RATIO,
  },
  
  // Platform-specific UI constants
  ui: {
    statusBarHeight: IS_IOS ? 44 : 24,
    tabBarHeight: IS_IOS ? 83 : 56,
    touchableOpacity: IS_IOS ? 0.7 : 0.85,
    hapticFeedback: true,
  },
  
  // Responsive breakpoints
  breakpoints: {
    small: SCREEN_WIDTH < 360,
    medium: SCREEN_WIDTH >= 360 && SCREEN_WIDTH < 768,
    large: SCREEN_WIDTH >= 768,
  },
  
  // Content constraints
  content: {
    maxWidth: Math.min(SCREEN_WIDTH, IS_TABLET ? 600 : 420),
    optimalLineLength: Math.min(SCREEN_WIDTH * 0.85, 350),
    imageQuality: IS_LARGE_SCREEN ? 'high' : 'medium',
  },
} as const;

/**
 * Performance Optimizations
 * Consolidates performance-related constants
 */
export const PerformanceConfig = {
  // Memory optimization
  memoryOptimized: IS_SMALL_SCREEN,
  maxConcurrentImages: IS_LARGE_SCREEN ? 10 : 6,
  imageCacheSize: IS_LARGE_SCREEN ? 100 : 50, // MB
  
  // Animation optimization
  animationReduced: IS_SMALL_SCREEN,
  enableComplexAnimations: !IS_SMALL_SCREEN,
  enableParallax: !IS_SMALL_SCREEN,
  
  // List optimization
  maxListItems: IS_SMALL_SCREEN ? 20 : 50,
  renderDistance: IS_SMALL_SCREEN ? 3 : 5,
  
  // Network optimization
  retryAttempts: 3,
  timeoutDuration: 10000,
  prefetchRadius: 2,
} as const;

/**
 * Accessibility Standards
 * Consolidates accessibility requirements
 */
export const AccessibilityConfig = {
  minimumFontSize: 14,
  minimumTouchTarget: 44,
  minimumContrast: 4.5, // WCAG AA standard
  scaleFactorSupport: true,
  highContrastSupport: true,
  screenReaderOptimized: true,
  colorBlindFriendly: true,
  semanticMarkup: true,
  focusManagement: true,
} as const;

/**
 * Utility Functions
 * Consolidated helper functions
 */
export const DesignUtils = {
  // Platform-specific values
  platformSelect: <T>(iosValue: T, androidValue: T, webValue?: T): T => {
    if (IS_WEB && webValue !== undefined) return webValue;
    return IS_IOS ? iosValue : androidValue;
  },
  
  // Responsive sizing
  responsiveSize: (baseSize: number, scaleFactor = 1): number => {
    const scale = (SCREEN_WIDTH / 375) * scaleFactor;
    return Math.round(baseSize * Math.max(scale, 0.85));
  },
  
  // Screen-based calculations
  screenPercent: (percentage: number): number => {
    return (SCREEN_WIDTH * percentage) / 100;
  },
  
  // Grid calculations
  gridItemWidth: (columns: number, spacing: number): number => {
    return (SCREEN_WIDTH - spacing * (columns + 1)) / columns;
  },
  
  // Optimal image size
  optimalImageSize: (aspectRatio = 1): { width: number; height: number } => {
    const width = SCREEN_WIDTH * PIXEL_RATIO;
    return {
      width,
      height: width / aspectRatio,
    };
  },
  
  // Touch target optimization
  touchTarget: (size: number): { minWidth: number; minHeight: number } => {
    const minSize = Math.max(size, AccessibilityConfig.minimumTouchTarget);
    return { minWidth: minSize, minHeight: minSize };
  },
} as const;

// Export the current theme (default to light)
export const CurrentTheme = UnifiedColors.light;

// Export individual systems for backward compatibility
export const Colors = UnifiedColors;
export const Spacing = UnifiedSpacing;
export const Typography = UnifiedTypography;
export const BorderRadius = UnifiedBorderRadius;
export const Shadows = UnifiedShadows;
export const Animations = UnifiedAnimations;

// Export everything as default
export default {
  Colors: UnifiedColors,
  Spacing: UnifiedSpacing,
  Typography: UnifiedTypography,
  BorderRadius: UnifiedBorderRadius,
  Shadows: UnifiedShadows,
  Animations: UnifiedAnimations,
  Platform: PlatformOptimizations,
  Performance: PerformanceConfig,
  Accessibility: AccessibilityConfig,
  Utils: DesignUtils,
  CurrentTheme,
};
