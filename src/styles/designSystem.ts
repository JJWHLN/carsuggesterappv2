/**
 * 🎨 Unified Design System
 * Consolidated styling using Tailwind-like utility classes for React Native
 */

import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

// Re-export existing design tokens for compatibility
export * from '../../constants/Colors';

// Utility Classes - Tailwind-inspired for React Native
export const tw = {
  // Layout & Positioning
  flex: { flex: 1 } as ViewStyle,
  'flex-row': { flexDirection: 'row' } as ViewStyle,
  'flex-col': { flexDirection: 'column' } as ViewStyle,
  'items-center': { alignItems: 'center' } as ViewStyle,
  'items-start': { alignItems: 'flex-start' } as ViewStyle,
  'items-end': { alignItems: 'flex-end' } as ViewStyle,
  'justify-center': { justifyContent: 'center' } as ViewStyle,
  'justify-start': { justifyContent: 'flex-start' } as ViewStyle,
  'justify-end': { justifyContent: 'flex-end' } as ViewStyle,
  'justify-between': { justifyContent: 'space-between' } as ViewStyle,
  'justify-around': { justifyContent: 'space-around' } as ViewStyle,
  'justify-evenly': { justifyContent: 'space-evenly' } as ViewStyle,

  // Positioning
  absolute: { position: 'absolute' } as ViewStyle,
  relative: { position: 'relative' } as ViewStyle,
  'top-0': { top: 0 } as ViewStyle,
  'bottom-0': { bottom: 0 } as ViewStyle,
  'left-0': { left: 0 } as ViewStyle,
  'right-0': { right: 0 } as ViewStyle,
  'inset-0': { top: 0, bottom: 0, left: 0, right: 0 } as ViewStyle,

  // Spacing - Padding
  'p-0': { padding: 0 } as ViewStyle,
  'p-xs': { padding: 4 } as ViewStyle,
  'p-sm': { padding: 8 } as ViewStyle,
  'p-md': { padding: 16 } as ViewStyle,
  'p-lg': { padding: 24 } as ViewStyle,
  'p-xl': { padding: 32 } as ViewStyle,
  'p-xxl': { padding: 48 } as ViewStyle,

  'px-xs': { paddingHorizontal: 4 } as ViewStyle,
  'px-sm': { paddingHorizontal: 8 } as ViewStyle,
  'px-md': { paddingHorizontal: 16 } as ViewStyle,
  'px-lg': { paddingHorizontal: 24 } as ViewStyle,
  'px-xl': { paddingHorizontal: 32 } as ViewStyle,

  'py-xs': { paddingVertical: 4 } as ViewStyle,
  'py-sm': { paddingVertical: 8 } as ViewStyle,
  'py-md': { paddingVertical: 16 } as ViewStyle,
  'py-lg': { paddingVertical: 24 } as ViewStyle,
  'py-xl': { paddingVertical: 32 } as ViewStyle,

  // Spacing - Margin
  'm-0': { margin: 0 } as ViewStyle,
  'm-xs': { margin: 4 } as ViewStyle,
  'm-sm': { margin: 8 } as ViewStyle,
  'm-md': { margin: 16 } as ViewStyle,
  'm-lg': { margin: 24 } as ViewStyle,
  'm-xl': { margin: 32 } as ViewStyle,

  'mx-xs': { marginHorizontal: 4 } as ViewStyle,
  'mx-sm': { marginHorizontal: 8 } as ViewStyle,
  'mx-md': { marginHorizontal: 16 } as ViewStyle,
  'mx-lg': { marginHorizontal: 24 } as ViewStyle,
  'mx-xl': { marginHorizontal: 32 } as ViewStyle,
  'mx-auto': { marginHorizontal: 'auto' } as ViewStyle,

  'my-xs': { marginVertical: 4 } as ViewStyle,
  'my-sm': { marginVertical: 8 } as ViewStyle,
  'my-md': { marginVertical: 16 } as ViewStyle,
  'my-lg': { marginVertical: 24 } as ViewStyle,
  'my-xl': { marginVertical: 32 } as ViewStyle,

  // Width & Height
  'w-full': { width: '100%' } as ViewStyle,
  'w-1/2': { width: '50%' } as ViewStyle,
  'w-1/3': { width: '33.333333%' } as ViewStyle,
  'w-2/3': { width: '66.666667%' } as ViewStyle,
  'w-1/4': { width: '25%' } as ViewStyle,
  'w-3/4': { width: '75%' } as ViewStyle,
  'w-auto': { width: 'auto' } as ViewStyle,

  'h-full': { height: '100%' } as ViewStyle,
  'h-auto': { height: 'auto' } as ViewStyle,
  'h-screen': { height: '100%' } as ViewStyle,

  // Min/Max dimensions
  'min-h-0': { minHeight: 0 } as ViewStyle,
  'min-h-screen': { minHeight: '100%' } as ViewStyle,
  'min-h-200': { minHeight: 200 } as ViewStyle,

  // Colors - Background
  'bg-white': { backgroundColor: '#ffffff' } as ViewStyle,
  'bg-black': { backgroundColor: '#000000' } as ViewStyle,
  'bg-transparent': { backgroundColor: 'transparent' } as ViewStyle,
  'bg-primary': { backgroundColor: '#48cc6c' } as ViewStyle,
  'bg-primary-light': { backgroundColor: '#e8f7ed' } as ViewStyle,
  'bg-neutral-50': { backgroundColor: '#fbfcfb' } as ViewStyle,
  'bg-neutral-100': { backgroundColor: '#f7f9f7' } as ViewStyle,
  'bg-neutral-200': { backgroundColor: '#e8f0ea' } as ViewStyle,
  'bg-surface': { backgroundColor: '#ffffff' } as ViewStyle,
  'bg-card': { backgroundColor: '#ffffff' } as ViewStyle,
  'bg-error': { backgroundColor: '#ef4444' } as ViewStyle,
  'bg-success': { backgroundColor: '#48cc6c' } as ViewStyle,
  'bg-warning': { backgroundColor: '#ff8c00' } as ViewStyle,
  'bg-info': { backgroundColor: '#0099ff' } as ViewStyle,

  // Colors - Text
  'text-white': { color: '#ffffff' } as TextStyle,
  'text-black': { color: '#000000' } as TextStyle,
  'text-primary': { color: '#48cc6c' } as TextStyle,
  'text-neutral-700': { color: '#3a463a' } as TextStyle,
  'text-neutral-600': { color: '#5a6a5a' } as TextStyle,
  'text-neutral-400': { color: '#9eae9e' } as TextStyle,
  'text-error': { color: '#ef4444' } as TextStyle,
  'text-success': { color: '#48cc6c' } as TextStyle,
  'text-warning': { color: '#ff8c00' } as TextStyle,
  'text-info': { color: '#0099ff' } as TextStyle,

  // Typography
  'text-xs': { fontSize: 12, lineHeight: 16 } as TextStyle,
  'text-sm': { fontSize: 14, lineHeight: 20 } as TextStyle,
  'text-base': { fontSize: 16, lineHeight: 24 } as TextStyle,
  'text-lg': { fontSize: 18, lineHeight: 28 } as TextStyle,
  'text-xl': { fontSize: 20, lineHeight: 28 } as TextStyle,
  'text-xxl': { fontSize: 24, lineHeight: 32 } as TextStyle,
  'text-xxxl': { fontSize: 30, lineHeight: 36 } as TextStyle,
  'text-hero': { fontSize: 32, lineHeight: 40 } as TextStyle,

  // Font Weight
  'font-light': { fontWeight: '300' } as TextStyle,
  'font-normal': { fontWeight: '400' } as TextStyle,
  'font-medium': { fontWeight: '500' } as TextStyle,
  'font-semibold': { fontWeight: '600' } as TextStyle,
  'font-bold': { fontWeight: '700' } as TextStyle,
  'font-extrabold': { fontWeight: '800' } as TextStyle,

  // Text Alignment
  'text-left': { textAlign: 'left' } as TextStyle,
  'text-center': { textAlign: 'center' } as TextStyle,
  'text-right': { textAlign: 'right' } as TextStyle,

  // Border Radius
  'rounded-none': { borderRadius: 0 } as ViewStyle,
  'rounded-sm': { borderRadius: 4 } as ViewStyle,
  'rounded-md': { borderRadius: 8 } as ViewStyle,
  'rounded-lg': { borderRadius: 12 } as ViewStyle,
  'rounded-xl': { borderRadius: 16 } as ViewStyle,
  'rounded-xxl': { borderRadius: 24 } as ViewStyle,
  'rounded-full': { borderRadius: 9999 } as ViewStyle,

  // Borders
  border: { borderWidth: 1 } as ViewStyle,
  'border-0': { borderWidth: 0 } as ViewStyle,
  'border-2': { borderWidth: 2 } as ViewStyle,
  'border-t': { borderTopWidth: 1 } as ViewStyle,
  'border-b': { borderBottomWidth: 1 } as ViewStyle,
  'border-l': { borderLeftWidth: 1 } as ViewStyle,
  'border-r': { borderRightWidth: 1 } as ViewStyle,

  // Border Colors
  'border-primary': { borderColor: '#48cc6c' } as ViewStyle,
  'border-neutral-200': { borderColor: '#e8f0ea' } as ViewStyle,
  'border-neutral-300': { borderColor: '#d1ddd4' } as ViewStyle,
  'border-error': { borderColor: '#ef4444' } as ViewStyle,
  'border-transparent': { borderColor: 'transparent' } as ViewStyle,

  // Opacity
  'opacity-0': { opacity: 0 } as ViewStyle,
  'opacity-25': { opacity: 0.25 } as ViewStyle,
  'opacity-50': { opacity: 0.5 } as ViewStyle,
  'opacity-75': { opacity: 0.75 } as ViewStyle,
  'opacity-100': { opacity: 1 } as ViewStyle,

  // Overflow
  'overflow-hidden': { overflow: 'hidden' } as ViewStyle,
  'overflow-visible': { overflow: 'visible' } as ViewStyle,

  // Common Component Patterns
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#48cc6c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle,

  'button-primary': {
    backgroundColor: '#48cc6c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#48cc6c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle,

  'button-secondary': {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#48cc6c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,

  input: {
    borderWidth: 1,
    borderColor: '#e8f0ea',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 24,
    backgroundColor: '#ffffff',
  } as ViewStyle & TextStyle,

  'loading-center': {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  } as ViewStyle,

  'error-center': {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
    backgroundColor: '#fbfcfb',
  } as ViewStyle,
};

// Utility function to combine styles (like className)
export const cn = (
  ...styles: Array<ViewStyle | TextStyle | undefined | false>
) => {
  return StyleSheet.flatten(styles.filter(Boolean));
};

// Create stylesheet for complex combinations
export const createStyles = (styles: Record<string, ViewStyle | TextStyle>) => {
  return StyleSheet.create(styles);
};

// Theme-aware utilities
export const createThemedStyles = (
  lightStyles: Record<string, ViewStyle | TextStyle>,
  darkStyles: Record<string, ViewStyle | TextStyle>,
) => {
  // This would integrate with your theme context
  // For now, returning light styles as default
  return createStyles(lightStyles);
};

// Responsive utilities (for different screen sizes)
export const responsive = {
  sm: (styles: ViewStyle | TextStyle) => styles, // Could add breakpoint logic
  md: (styles: ViewStyle | TextStyle) => styles,
  lg: (styles: ViewStyle | TextStyle) => styles,
};

// Animation presets
export const animations = {
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  slideUp: {
    from: { transform: [{ translateY: 50 }] },
    to: { transform: [{ translateY: 0 }] },
  },
  scale: {
    from: { transform: [{ scale: 0.8 }] },
    to: { transform: [{ scale: 1 }] },
  },
};

export default tw;
