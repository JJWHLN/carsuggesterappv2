import { Platform } from 'react-native';

// New Design System Constants

export const Colors = {
  light: {
    // Primary Green Theme (Based on #22C55E)
    primary: '#22C55E',        // Vibrant Green
    primaryHover: '#16A34A',   // Darker Green
    primaryLight: '#A7F3D0',   // Lighter Green
    secondaryGreen: '#F0FDF4', // Very Light Green
    accentGreen: '#15803D',    // Darker for emphasis

    // Neutral Palette
    background: '#F8F9FA',     // Soft off-white/light gray
    cardBackground: '#FFFFFF', // White for cards
    text: '#111827',           // Dark Gray for high contrast
    textSecondary: '#6B7280',  // Medium Gray
    textMuted: '#9CA3AF',      // Lighter Gray
    border: '#E5E7EB',         // Light Gray Border

    // Standard Semantic Colors
    success: '#10B981',        // Success green
    error: '#EF4444',          // Error red
    warning: '#F59E0B',        // Warning amber

    // Utility
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',

    // Aliases
    surface: '#FFFFFF',         // Alias for cardBackground
    surfaceDark: '#E9ECEF',    // Slightly darker surface
  },
  dark: {
    // Primary Green Theme (adapted for dark mode)
    primary: '#4ADE80',        // Brighter Green
    primaryHover: '#22C55E',   // Less bright
    primaryLight: '#166534',   // Darker green for subtle backgrounds
    secondaryGreen: '#064E3B', // Very dark green
    accentGreen: '#4ADE80',    // Same as primary

    // Neutral Palette
    background: '#18181B',     // Soft Dark
    cardBackground: '#27272A', // Darker Gray
    text: '#F3F4F6',           // Off-White
    textSecondary: '#9CA3AF',  // Medium Gray
    textMuted: '#6B7280',      // Darker Gray
    border: '#3F3F46',         // Dark mode border

    // Standard Semantic Colors
    success: '#34D399',        // Brighter success green
    error: '#F87171',          // Lighter error red
    warning: '#FBBF24',        // Warning

    // Utility
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',

    // Aliases
    surface: '#27272A',         // Alias for cardBackground
    surfaceDark: '#3F3F46',     // Darker surface
  },
};

// Default to light theme
export const currentColors = Colors.light;

export const Spacing = {
  xs: 4,    // Extra Small
  sm: 8,    // Small
  md: 16,   // Medium
  lg: 24,   // Large
  xl: 32,   // Extra Large
  xxl: 48,  // Extra Extra Large
  xxxl: 64, // Largest
} as const;

export const BorderRadius = {
  xs: 4,    // Small elements, tags
  sm: 8,    // Standard elements
  md: 12,   // Buttons, input fields
  lg: 16,   // Cards
  xl: 24,   // Larger elements, modals
  full: 9999,// For circular elements
} as const;

type FontWeight = '300' | '400' | '500' | '600' | '700' | '800';

export const Typography = {
  heroTitle: {
    fontSize: 34,
    fontWeight: '700' as FontWeight,
    lineHeight: 34 * 0.9,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '700' as FontWeight,
    lineHeight: 30 * 1.1,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600' as FontWeight,
    lineHeight: 24 * 1.2,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '600' as FontWeight,
    lineHeight: 19 * 1.3,
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400' as FontWeight,
    lineHeight: 18 * 1.5,
  },
  bodyText: {
    fontSize: 16,
    fontWeight: '400' as FontWeight,
    lineHeight: 16 * 1.5,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as FontWeight,
    lineHeight: 14 * 1.4,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500' as FontWeight,
    lineHeight: 12 * 1.3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600' as FontWeight,
    lineHeight: 16 * 1.5,
  },
  // Aliases for compatibility
  h1: { fontSize: 30, fontWeight: '700' as FontWeight, lineHeight: 30 * 1.1 },
  h2: { fontSize: 24, fontWeight: '600' as FontWeight, lineHeight: 24 * 1.2 },
  h3: { fontSize: 19, fontWeight: '600' as FontWeight, lineHeight: 19 * 1.3 },
  h4: { fontSize: 18, fontWeight: '600' as FontWeight, lineHeight: 18 * 1.4 },
  body: { fontSize: 16, fontWeight: '400' as FontWeight, lineHeight: 16 * 1.5 },
  button: { fontSize: 16, fontWeight: '600' as FontWeight, lineHeight: 16 * 1.5 },
} as const;

export const Shadows = {
  none: {},
  button: {
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(34, 197, 94, 0.15)',
      },
      default: {
        shadowColor: 'rgba(34, 197, 94, 0.15)',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
      },
    }),
    elevation: 4,
  },
  card: {
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
    }),
    elevation: 2,
  },
  small: {
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
    }),
    elevation: 1,
  },
  medium: {
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
    elevation: 2,
  },
  large: {
    ...Platform.select({
      web: {
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
    }),
    elevation: 4,
  },
   xl: {
    ...Platform.select({
      web: {
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
      },
      default: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
    }),
    elevation: 8,
  },
} as const;