// New Design System Constants

export const Colors = {
  light: {
    // Primary Green Theme (Based on #22C55E)
    primary: '#22C55E',        // Vibrant Green
    primaryHover: '#16A34A',   // Darker Green (previous primary)
    primaryLight: '#A7F3D0',   // Lighter Green
    secondaryGreen: '#F0FDF4', // Very Light Green (backgrounds/accents)
    accentGreen: '#15803D',    // Darker for emphasis (previous primaryHover)

    // Neutral Palette
    background: '#F8F9FA',     // Soft off-white/light gray
    cardBackground: '#FFFFFF', // White for cards (contrast)
    text: '#111827',           // Dark Gray (Tailwind gray-900) for high contrast
    textSecondary: '#6B7280',  // Medium Gray (Tailwind gray-500)
    textMuted: '#9CA3AF',      // Lighter Gray (Tailwind gray-400)
    border: '#E5E7EB',         // Light Gray Border (Tailwind gray-200)

    // Standard Semantic Colors
    success: '#10B981',        // Kept distinct success green for now, can align with primary if needed
    error: '#EF4444',          // Default error
    warning: '#F59E0B',        // Default warning

    // Utility
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',

    // Aliases
    surface: '#FFFFFF',         // Alias for cardBackground
    surfaceDark: '#E9ECEF',    // Slightly darker surface
  },
  dark: {
    // Primary Green Theme (Based on #22C55E, adapted for dark mode)
    primary: '#4ADE80',        // Brighter Green (e.g., Tailwind green-400)
    primaryHover: '#22C55E',   // Less bright (original light primary)
    primaryLight: '#166534',   // Darker green for subtle dark backgrounds (e.g., green-800)
    secondaryGreen: '#064E3B', // Very dark green (e.g., green-950)
    accentGreen: '#4ADE80',    // Same as primary

    // Neutral Palette
    background: '#18181B',     // Soft Dark (e.g., Zinc-900)
    cardBackground: '#27272A', // Darker Gray (e.g., Zinc-800)
    text: '#F3F4F6',           // Off-White (Tailwind gray-100)
    textSecondary: '#9CA3AF',  // Medium Gray (Tailwind gray-400)
    textMuted: '#6B7280',      // Darker Gray (Tailwind gray-500)
    border: '#3F3F46',         // Dark mode border (e.g., Zinc-700)

    // Standard Semantic Colors (Adjusted for dark mode contrast if needed)
    success: '#34D399',        // Brighter success green for dark mode
    error: '#F87171',          // Lighter error red
    warning: '#FBBF24',        // Warning often stays similar

    // Utility
    white: '#FFFFFF',
    black: '#000000',
    transparent: 'transparent',

    // Aliases
    surface: '#27272A',         // Alias for cardBackground
    surfaceDark: '#3F3F46',     // A distinct darker surface (e.g. Zinc-700, current border color)
  },
};

// Default to light theme. This will be overridden by ThemeProvider from useTheme hook if implemented.
export const currentColors = Colors.light;

export const Spacing = {
  xs: 4,    // Extra Small
  sm: 8,    // Small
  md: 16,   // Medium (Base unit for many paddings/margins)
  lg: 24,   // Large
  xl: 32,   // Extra Large
  xxl: 48,  // Extra Extra Large
  xxxl: 64, // Largest
} as const;

export const BorderRadius = {
  xs: 4,    // Small elements, tags
  sm: 8,    // Standard elements
  md: 12,   // Buttons, input fields (as per new design: 12px for buttons)
  lg: 16,   // Cards (as per new design: 16px for cards)
  xl: 24,   // Larger elements, modals (pill shape for search bar)
  full: 9999,// For circular elements
} as const;

// Font weights map to design system
// Note: Actual font family 'Inter' needs to be loaded via expo-font for these to apply correctly.
// System fallbacks (SF, Roboto) will use their own available weights.
type FontWeight = '300' | '400' | '500' | '600' | '700' | '800';

export const Typography = {
  heroTitle: { // 32-36px, Bold (700), Tight line height (0.9)
    fontSize: 34, // Average
    fontWeight: '700' as FontWeight,
    lineHeight: 34 * 0.9, // Approx 30.6
  },
  pageTitle: { // 28-32px, Bold (700), Tight line height
    fontSize: 30, // Average
    fontWeight: '700' as FontWeight,
    lineHeight: 30 * 1.1, // Approx 33
  },
  sectionTitle: { // 24px, SemiBold (600), Normal line height
    fontSize: 24,
    fontWeight: '600' as FontWeight,
    lineHeight: 24 * 1.2, // Approx 29
  },
  cardTitle: { // 18-20px, SemiBold (600)
    fontSize: 19, // Average
    fontWeight: '600' as FontWeight,
    lineHeight: 19 * 1.3, // Approx 25
  },
  bodyLarge: { // 18px, Regular (400)
    fontSize: 18,
    fontWeight: '400' as FontWeight,
    lineHeight: 18 * 1.5, // Approx 27
  },
  bodyText: { // 16px, Regular (400)
    fontSize: 16,
    fontWeight: '400' as FontWeight,
    lineHeight: 16 * 1.5, // Approx 24
  },
  bodySmall: { // 14px, Regular (400)
    fontSize: 14,
    fontWeight: '400' as FontWeight,
    lineHeight: 14 * 1.4, // Approx 20
  },
  caption: { // 12px, Medium (500)
    fontSize: 12,
    fontWeight: '500' as FontWeight,
    lineHeight: 12 * 1.3, // Approx 16
  },
  buttonText: { // 16px, SemiBold (600)
    fontSize: 16,
    fontWeight: '600' as FontWeight,
    lineHeight: 16 * 1.5, // Approx 24 (ensure it fits button height)
  },
  // Adding common aliases from old system for smoother transition, can be deprecated later
  h1: { fontSize: 30, fontWeight: '700' as FontWeight, lineHeight: 30 * 1.1 }, // Mapped to pageTitle
  h2: { fontSize: 24, fontWeight: '600' as FontWeight, lineHeight: 24 * 1.2 }, // Mapped to sectionTitle
  h3: { fontSize: 19, fontWeight: '600' as FontWeight, lineHeight: 19 * 1.3 }, // Mapped to cardTitle
  h4: { fontSize: 18, fontWeight: '600' as FontWeight, lineHeight: 18 * 1.4 }, // Similar to bodyLarge but bolder
  body: { fontSize: 16, fontWeight: '400' as FontWeight, lineHeight: 16 * 1.5 }, // Mapped to bodyText
  // caption is already defined
  button: { fontSize: 16, fontWeight: '600' as FontWeight, lineHeight: 16 * 1.5 }, // Mapped to buttonText
} as const;

// Updated Shadows based on new design
// Note: React Native shadow props behave differently on iOS and Android.
// Elevation is Android-specific. For iOS, shadowOffset, shadowOpacity, shadowRadius are key.
export const Shadows = {
  none: {},
  // Subtle drop shadow for Buttons: 0 2px 8px rgba(34, 197, 94, 0.15)
  button: { // New shadow style for primary buttons
    shadowColor: 'rgba(34, 197, 94, 0.15)', // Based on new primary #22C55E
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, // Opacity is in the color itself
    shadowRadius: 8,
    elevation: 4, // Android elevation
  },
  // Standard Card Shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)
  // This is a common pattern for subtle shadows, often achieved with multiple shadow layers on web.
  // For React Native, we typically use one set of shadow props.
  card: { // New shadow style for cards
    shadowColor: currentColors.black, // Or a very dark gray
    shadowOffset: { width: 0, height: 1 }, // A small offset
    shadowOpacity: 0.1, // Keep opacity moderate
    shadowRadius: 3,   // A bit of blur
    elevation: 2,      // Android elevation
  },
  // Old ones for reference, can be removed or updated if specific variations are needed
  small: { // Can map to a lighter card shadow or remove
    shadowColor: currentColors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: { // Can map to the new 'card' shadow
    shadowColor: currentColors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  large: { // For elements that need more emphasis
    shadowColor: currentColors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
   xl: { // For modals or very distinct elements
    shadowColor: currentColors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;