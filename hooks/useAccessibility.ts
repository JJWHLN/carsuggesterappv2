import { useCallback } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

export function useAccessibility() {
  const announceForAccessibility = useCallback((message: string) => {
    if (Platform.OS !== 'web') {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, []);

  const isScreenReaderEnabled = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'web') return false;
    
    try {
      return await AccessibilityInfo.isScreenReaderEnabled();
    } catch {
      return false;
    }
  }, []);

  const setAccessibilityFocus = useCallback((reactTag: number) => {
    if (Platform.OS !== 'web') {
      AccessibilityInfo.setAccessibilityFocus(reactTag);
    }
  }, []);

  return {
    announceForAccessibility,
    isScreenReaderEnabled,
    setAccessibilityFocus,
  };
}

export function createAccessibilityProps(
  label: string,
  hint?: string,
  role?: string,
  state?: { disabled?: boolean; selected?: boolean; expanded?: boolean }
) {
  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: role as any,
    accessibilityState: state,
  };
}