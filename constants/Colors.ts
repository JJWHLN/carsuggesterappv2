import { Platform } from 'react-native';

// CarSuggester Brand Design System

export const Colors = {
  light: {
    // Primary Brand Colors
    primary: '#48cc6c',        // Main CarSuggester brand color
    primaryGlow: '#56d478',    // Lighter green for gradients/highlights
    primaryDark: '#3cb85f',    // Darker green for depth/pressed states
    primaryLight: '#e8f7ed',   // Very light green backgrounds
    
    // Neutral Palette (Green-tinted grays)
    neutral50: '#fbfcfb',      // Nearly white (HSL: 142 10% 98%)
    neutral100: '#f7f9f7',     // Light background (HSL: 142 10% 95%)
    neutral200: '#e8f0ea',     // Light borders (HSL: 142 15% 90%)
    neutral300: '#d1ddd4',     // Dividers (HSL: 142 10% 80%)
    neutral400: '#9eae9e',     // Muted text (HSL: 142 5% 60%)
    neutral500: '#7a8a7a',     // Disabled states (HSL: 142 5% 50%)
    neutral600: '#5a6a5a',     // Secondary text (HSL: 142 5% 40%)
    neutral700: '#3a463a',     // Primary text (HSL: 142 5% 30%)
    neutral800: '#2a342a',     // Dark text (HSL: 142 5% 20%)
    neutral900: '#1a221a',     // Darkest text (HSL: 142 5% 10%)

    // Surface & Background
    background: '#ffffff',     // Pure white
    cardBackground: '#ffffff', // White cards
    surface: '#ffffff',        // Elevated surfaces
    surfaceSecondary: '#fbfcfb', // Subtle surface variation
    
    // Text Colors
    text: '#1a221a',          // Primary text (neutral900)
    textSecondary: '#5a6a5a',  // Secondary text (neutral600)
    textMuted: '#9eae9e',      // Muted text (neutral400)
    textInverse: '#ffffff',    // White text for dark backgrounds

    // Semantic Colors
    success: '#48cc6c',        // Same as primary green
    warning: '#ff8c00',        // Bright orange (HSL: 38 100% 50%)
    error: '#ef4444',          // Red (HSL: 0 84% 60%)
    info: '#0099ff',           // Blue (HSL: 200 100% 50%)

    // Border Colors
    border: '#e8f0ea',         // Light green-tinted border
    borderSecondary: '#d1ddd4', // Slightly darker border
    borderFocus: '#48cc6c',    // Primary color for focus states

    // Utility
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
  },
  
  dark: {
    // Primary Brand Colors (Dark Mode)
    primary: '#56d478',        // Brighter green for dark backgrounds
    primaryGlow: '#6be085',    // Even brighter for highlights
    primaryDark: '#48cc6c',    // Original green for pressed states
    primaryLight: '#1a2e1f',   // Dark green background
    
    // Neutral Palette (Dark Mode)
    neutral50: '#0f1114',      // Darkest background
    neutral100: '#1a1d23',     // Dark background variation
    neutral200: '#242832',     // Card backgrounds
    neutral300: '#374151',     // Borders and dividers
    neutral400: '#6b7280',     // Muted text
    neutral500: '#9ca3af',     // Secondary text
    neutral600: '#d1d5db',     // Primary text
    neutral700: '#e5e7eb',     // Light text
    neutral800: '#f3f4f6',     // Very light text
    neutral900: '#ffffff',     // Pure white text

    // Surface & Background (Dark Mode)
    background: '#0f1419',     // Very dark blue-gray (HSL: 222.2 84% 4.9%)
    cardBackground: '#1e2b3a', // Dark blue-gray cards (HSL: 217.2 32.6% 17.5%)
    surface: '#1e2b3a',        // Elevated surfaces
    surfaceSecondary: '#16212e', // Slightly darker surface
    
    // Text Colors (Dark Mode)
    text: '#f9fafb',          // Light gray (HSL: 210 40% 98%)
    textSecondary: '#d1d5db',  // Medium gray
    textMuted: '#9ca3af',      // Muted gray
    textInverse: '#1a221a',    // Dark text for light backgrounds

    // Semantic Colors (Dark Mode)
    success: '#56d478',        // Brighter green
    warning: '#fbbf24',        // Softer orange for dark mode
    error: '#f87171',          // Softer red for dark mode
    info: '#60a5fa',           // Softer blue for dark mode

    // Border Colors (Dark Mode)
    border: '#374151',         // Dark border
    borderSecondary: '#4b5563', // Slightly lighter border
    borderFocus: '#56d478',    // Primary color for focus states

    // Utility
    white: '#ffffff',
    black: '#000000',
    transparent: 'transparent',
  },
};

// Design Tokens for consistent spacing, typography, and effects
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 24,
  full: 9999,
};

export const Typography = {
  // Font Sizes
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  base: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 18, lineHeight: 28 },
  xl: { fontSize: 20, lineHeight: 28 },
  xxl: { fontSize: 24, lineHeight: 32 },
  xxxl: { fontSize: 30, lineHeight: 36 },
  
  // Font Weights
  light: { fontWeight: '300' as const },
  normal: { fontWeight: '400' as const },
  medium: { fontWeight: '500' as const },
  semibold: { fontWeight: '600' as const },
  bold: { fontWeight: '700' as const },
  
  // Semantic Typography
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  subtitle: { fontSize: 18, lineHeight: 28, fontWeight: '500' as const },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const },
  heading: { fontSize: 30, lineHeight: 36, fontWeight: '700' as const },
};

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#48cc6c',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#48cc6c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#48cc6c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#48cc6c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    shadowColor: '#48cc6c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
};

// Brand Gradients
export const Gradients = {
  primary: ['#48cc6c', '#56d478'],
  primarySubtle: ['#e8f7ed', '#f0faf2'],
  hero: ['#48cc6c', '#56d478', '#6be085'],
  dark: ['#1a221a', '#2a342a'],
};

// Animation Configs
export const Animations = {
  fast: 150,
  normal: 250,
  slow: 350,
  
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  
  timing: {
    duration: 250,
    useNativeDriver: true,
  },
};

// Default to light theme
export const currentColors = Colors.light;