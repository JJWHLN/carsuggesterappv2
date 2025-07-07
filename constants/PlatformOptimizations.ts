import { Platform, Dimensions, StatusBar } from 'react-native';

const { width, height } = Dimensions.get('window');
const isIOS = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';

// Platform-specific constants for optimal UX
export const PlatformOptimizations = {
  // iOS specific optimizations
  ios: {
    statusBarHeight: 44,
    safeAreaTop: 44,
    tabBarHeight: 83,
    buttonRadius: 12,
    shadowProps: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    },
    hapticFeedback: true,
    animations: {
      duration: 250,
      easing: 'easeInOut',
    },
  },
  
  // Android specific optimizations
  android: {
    statusBarHeight: StatusBar.currentHeight || 24,
    safeAreaTop: StatusBar.currentHeight || 24,
    tabBarHeight: 56,
    buttonRadius: 8,
    shadowProps: {
      elevation: 4,
    },
    hapticFeedback: true,
    animations: {
      duration: 200,
      easing: 'easeOut',
    },
  },
  
  // Common optimizations
  common: {
    touchableOpacity: isIOS ? 0.7 : 0.85,
    animationDuration: isIOS ? 250 : 200,
    borderRadius: isIOS ? 12 : 8,
    minimumTouchTarget: 44,
    maxContentWidth: Math.min(width, 400),
    responsiveBreakpoints: {
      small: width < 360,
      medium: width >= 360 && width < 768,
      large: width >= 768,
    },
  },
};

// Responsive spacing based on screen size
export const ResponsiveSpacing = {
  xs: width < 360 ? 4 : 6,
  sm: width < 360 ? 6 : 8,
  md: width < 360 ? 12 : 16,
  lg: width < 360 ? 16 : 20,
  xl: width < 360 ? 20 : 24,
  xxl: width < 360 ? 24 : 32,
};

// Platform-optimized typography
export const PlatformTypography = {
  ios: {
    fontFamily: 'System',
    title: {
      fontSize: width < 360 ? 28 : 32,
      fontWeight: '700',
      lineHeight: width < 360 ? 34 : 38,
    },
    subtitle: {
      fontSize: width < 360 ? 14 : 16,
      fontWeight: '400',
      lineHeight: width < 360 ? 20 : 24,
    },
    body: {
      fontSize: width < 360 ? 14 : 16,
      fontWeight: '400',
      lineHeight: width < 360 ? 20 : 24,
    },
    caption: {
      fontSize: width < 360 ? 11 : 12,
      fontWeight: '400',
      lineHeight: width < 360 ? 16 : 18,
    },
  },
  android: {
    fontFamily: 'Roboto',
    title: {
      fontSize: width < 360 ? 26 : 30,
      fontWeight: '500',
      lineHeight: width < 360 ? 32 : 36,
    },
    subtitle: {
      fontSize: width < 360 ? 14 : 16,
      fontWeight: '400',
      lineHeight: width < 360 ? 20 : 24,
    },
    body: {
      fontSize: width < 360 ? 14 : 16,
      fontWeight: '400',
      lineHeight: width < 360 ? 20 : 24,
    },
    caption: {
      fontSize: width < 360 ? 11 : 12,
      fontWeight: '400',
      lineHeight: width < 360 ? 16 : 18,
    },
  },
};

// Platform-specific colors with dark mode support
export const PlatformColors = {
  ios: {
    primary: '#007AFF',
    success: '#34C759',
    warning: '#FF9500',
    error: '#FF3B30',
    background: '#F2F2F7',
    surface: '#FFFFFF',
    text: '#000000',
    textSecondary: '#8E8E93',
    separator: '#C6C6C8',
  },
  android: {
    primary: '#1976D2',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    background: '#FAFAFA',
    surface: '#FFFFFF',
    text: '#212121',
    textSecondary: '#757575',
    separator: '#E0E0E0',
  },
};

// Get platform-specific values
export const getPlatformValue = <T>(iosValue: T, androidValue: T): T => {
  return isIOS ? iosValue : androidValue;
};

// Optimized shadow for platform
export const getPlatformShadow = (elevation: number = 2) => {
  if (isIOS) {
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: elevation },
      shadowOpacity: 0.1,
      shadowRadius: elevation * 2,
    };
  }
  return {
    elevation: elevation * 2,
  };
};

// Responsive font size
export const getResponsiveFontSize = (baseSize: number) => {
  const scale = width / 375; // iPhone 6/7/8 as base
  return Math.round(baseSize * Math.max(scale, 0.85));
};

// Optimized touch targets
export const getTouchableProps = () => ({
  activeOpacity: PlatformOptimizations.common.touchableOpacity,
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
  delayPressIn: 0,
  delayPressOut: 0,
});
