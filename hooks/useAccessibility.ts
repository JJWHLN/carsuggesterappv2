import { useCallback, useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

interface AccessibilitySettings {
  isScreenReaderEnabled: boolean;
  isReduceMotionEnabled: boolean;
  isReduceTransparencyEnabled: boolean;
  isBoldTextEnabled: boolean;
  isGrayscaleEnabled: boolean;
  isInvertColorsEnabled: boolean;
}

export function useAccessibility() {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    isScreenReaderEnabled: false,
    isReduceMotionEnabled: false,
    isReduceTransparencyEnabled: false,
    isBoldTextEnabled: false,
    isGrayscaleEnabled: false,
    isInvertColorsEnabled: false,
  });

  const announceForAccessibility = useCallback((message: string) => {
    if (Platform.OS !== 'web') {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, []);

  const checkScreenReaderEnabled = useCallback(async (): Promise<boolean> => {
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

  const getAccessibilitySettings = useCallback(async () => {
    if (Platform.OS === 'web') return;

    try {
      const [
        screenReader,
        reduceMotion,
        reduceTransparency,
        boldText,
        grayscale,
        invertColors
      ] = await Promise.all([
        AccessibilityInfo.isScreenReaderEnabled(),
        AccessibilityInfo.isReduceMotionEnabled?.() ?? Promise.resolve(false),
        AccessibilityInfo.isReduceTransparencyEnabled?.() ?? Promise.resolve(false),
        AccessibilityInfo.isBoldTextEnabled?.() ?? Promise.resolve(false),
        AccessibilityInfo.isGrayscaleEnabled?.() ?? Promise.resolve(false),
        AccessibilityInfo.isInvertColorsEnabled?.() ?? Promise.resolve(false),
      ]);

      setSettings({
        isScreenReaderEnabled: screenReader,
        isReduceMotionEnabled: reduceMotion,
        isReduceTransparencyEnabled: reduceTransparency,
        isBoldTextEnabled: boldText,
        isGrayscaleEnabled: grayscale,
        isInvertColorsEnabled: invertColors,
      });
    } catch (error) {
      logger.warn('Error getting accessibility settings:', error);
    }
  }, []);

  useEffect(() => {
    getAccessibilitySettings();

    // Set up listeners for accessibility changes
    const listeners = [
      AccessibilityInfo.addEventListener('screenReaderChanged', (enabled) => {
        setSettings(prev => ({ ...prev, isScreenReaderEnabled: enabled }));
      }),
      AccessibilityInfo.addEventListener?.('reduceMotionChanged', (enabled) => {
        setSettings(prev => ({ ...prev, isReduceMotionEnabled: enabled }));
      }),
      AccessibilityInfo.addEventListener?.('boldTextChanged', (enabled) => {
        setSettings(prev => ({ ...prev, isBoldTextEnabled: enabled }));
      }),
    ].filter(Boolean);

    return () => {
      listeners.forEach(listener => listener?.remove?.());
    };
  }, [getAccessibilitySettings]);

  return {
    ...settings,
    announceForAccessibility,
    checkScreenReaderEnabled,
    setAccessibilityFocus,
    getAccessibilitySettings,
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

export function createSemanticProps(
  label: string,
  role: 'button' | 'link' | 'text' | 'header' | 'image' | 'none' | 'search' | 'summary',
  options?: {
    hint?: string;
    value?: string;
    disabled?: boolean;
    selected?: boolean;
    expanded?: boolean;
    checked?: boolean;
    busy?: boolean;
  }
) {
  const { hint, value, disabled, selected, expanded, checked, busy } = options || {};

  return {
    accessible: true,
    accessibilityLabel: label,
    accessibilityHint: hint,
    accessibilityRole: role,
    accessibilityValue: value ? { text: value } : undefined,
    accessibilityState: {
      disabled: disabled || false,
      selected: selected || false,
      expanded: expanded || false,
      checked: checked || false,
      busy: busy || false,
    },
  };
}

export function createListItemProps(
  label: string,
  position: { setIndex: number; setSize: number },
  options?: {
    hint?: string;
    selected?: boolean;
    disabled?: boolean;
  }
) {
  return {
    ...createSemanticProps(label, 'button', options),
    accessibilityElementsHidden: false,
    importantForAccessibility: 'yes' as const,
    accessibilityLiveRegion: 'polite' as const,
    accessibilityValue: {
      text: `${position.setIndex} of ${position.setSize}`,
    },
  };
}