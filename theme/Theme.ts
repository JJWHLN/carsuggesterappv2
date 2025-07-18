import { Platform, StatusBar } from 'react-native';

// Color Palette - Carsuggester Brand Colors
export const Colors = {
  light: {
    // Primary Colors
    primary: '#50B565',      // Fresh green for CTAs, highlights, trust indicators
    primaryLight: '#E8F5EA', // Light green for backgrounds and states
    primaryDark: '#3A8B4A',  // Darker green for pressed states
    
    // Secondary Colors
    secondary: '#F5F6F7',    // Light grey for backgrounds, cards, dividers
    secondaryDark: '#E5E7EB', // Slightly darker grey for borders
    
    // Base Colors
    background: '#FFFFFF',   // Main background
    surface: '#FFFFFF',      // Cards, containers
    overlay: 'rgba(0, 0, 0, 0.5)', // Modal overlays
    
    // Text Colors
    text: '#111827',         // Primary text (Tailwind gray-900)
    textSecondary: '#6B7280', // Secondary text (Tailwind gray-500)
    textMuted: '#9CA3AF',    // Muted text (Tailwind gray-400)
    textInverse: '#FFFFFF',  // Text on dark backgrounds
    
    // Semantic Colors
    success: '#10B981',      // Green for success states
    error: '#EF4444',        // Red for errors
    warning: '#F59E0B',      // Amber for warnings
    info: '#3B82F6',         // Blue for information
    
    // UI Colors
    border: '#E5E7EB',       // Borders and dividers
    borderLight: '#F3F4F6',  // Light borders
    shadow: 'rgba(0, 0, 0, 0.1)', // Shadows
    
    // Rating Colors
    rating: '#F59E0B',       // Star ratings
    ratingBg: '#FEF3C7',     // Rating background
    
    // Status Colors
    online: '#10B981',       // Online/available
    offline: '#6B7280',      // Offline/unavailable
  },
  
  dark: {
    // Primary Colors
    primary: '#50B565',      // Keep brand green consistent
    primaryLight: '#1F2937',  // Dark background with green tint
    primaryDark: '#6EE787',   // Lighter green for dark mode
    
    // Secondary Colors
    secondary: '#1F2937',    // Dark grey for backgrounds
    secondaryDark: '#111827', // Darker grey for borders
    
    // Base Colors
    background: '#000000',   // Dark background
    surface: '#111827',      // Dark cards, containers
    overlay: 'rgba(0, 0, 0, 0.8)', // Dark modal overlays
    
    // Text Colors
    text: '#F9FAFB',         // Light text on dark
    textSecondary: '#D1D5DB', // Secondary light text
    textMuted: '#9CA3AF',    // Muted text
    textInverse: '#111827',  // Dark text on light backgrounds
    
    // Semantic Colors
    success: '#34D399',      // Lighter green for dark mode
    error: '#F87171',        // Lighter red for dark mode
    warning: '#FBBF24',      // Lighter amber for dark mode
    info: '#60A5FA',         // Lighter blue for dark mode
    
    // UI Colors
    border: '#374151',       // Dark borders
    borderLight: '#4B5563',  // Lighter dark borders
    shadow: 'rgba(0, 0, 0, 0.5)', // Darker shadows
    
    // Rating Colors
    rating: '#FBBF24',       // Lighter amber for dark mode
    ratingBg: '#374151',     // Dark rating background
    
    // Status Colors
    online: '#34D399',       // Online/available
    offline: '#9CA3AF',      // Offline/unavailable
  },
};

// Typography Scale
export const Typography = {
  // Headings
  heroTitle: {
    fontSize: 34,
    fontWeight: '800' as const,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  
  pageTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600' as const,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  
  cardTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  
  // Body Text
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 26,
  },
  
  bodyText: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  
  // UI Text
  caption: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  
  // Price Text
  priceText: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  
  // Metadata
  metadata: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
};

// Spacing Scale
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
  giant: 64,
};

// Border Radius Scale
export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 999,
};

// Shadow Styles
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  
  small: {
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  medium: {
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  
  large: {
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  
  card: {
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
};

// Component Sizes
export const ComponentSizes = {
  // Button Heights
  buttonHeight: {
    small: 36,
    medium: 44,
    large: 52,
  },
  
  // Input Heights
  inputHeight: {
    small: 36,
    medium: 44,
    large: 52,
  },
  
  // Icon Sizes
  iconSize: {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // Avatar Sizes
  avatarSize: {
    small: 32,
    medium: 40,
    large: 56,
    xlarge: 80,
  },
  
  // Card Image Sizes
  cardImageSize: {
    small: 80,
    medium: 120,
    large: 160,
    xlarge: 200,
  },
};

// Animation Durations
export const AnimationDurations = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 1000,
};

// Screen Dimensions
export const ScreenDimensions = {
  statusBarHeight: Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0,
  tabBarHeight: Platform.OS === 'ios' ? 83 : 60,
  headerHeight: Platform.OS === 'ios' ? 44 : 56,
};

// Gradients
export const Gradients = {
  primary: ['#50B565', '#3A8B4A'],
  primaryLight: ['#E8F5EA', '#F5F6F7'],
  success: ['#10B981', '#059669'],
  error: ['#EF4444', '#DC2626'],
  warning: ['#F59E0B', '#D97706'],
  info: ['#3B82F6', '#2563EB'],
  
  // Dark mode gradients
  primaryDark: ['#6EE787', '#50B565'],
  surfaceDark: ['#1F2937', '#111827'],
};

// Z-Index Scale
export const ZIndex = {
  background: -1,
  base: 0,
  elevated: 10,
  overlay: 100,
  modal: 1000,
  toast: 2000,
  tooltip: 3000,
};

// Breakpoints (for responsive design)
export const Breakpoints = {
  small: 0,
  medium: 768,
  large: 1024,
  xlarge: 1280,
};

// Export combined theme
export const Theme = {
  colors: Colors,
  typography: Typography,
  spacing: Spacing,
  borderRadius: BorderRadius,
  shadows: Shadows,
  componentSizes: ComponentSizes,
  animationDurations: AnimationDurations,
  screenDimensions: ScreenDimensions,
  gradients: Gradients,
  zIndex: ZIndex,
  breakpoints: Breakpoints,
};

export default Theme;
