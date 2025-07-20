import React, { useState, useEffect, createContext, useContext, useMemo, useCallback } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { Colors } from '@/constants/Colors';

type Theme = 'light' | 'dark' | 'auto';
type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  colors: typeof Colors.light;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function useColorScheme(): ColorScheme {
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    const scheme = Appearance.getColorScheme();
    return scheme === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme: newScheme }) => {
      setColorScheme(newScheme === 'dark' ? 'dark' : 'light');
    });

    return () => subscription?.remove();
  }, []);

  return colorScheme;
}

export function useThemeColors() {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<Theme>('auto');
  
  const colorScheme: ColorScheme = theme === 'auto' ? systemColorScheme : theme as ColorScheme;
  
  // Memoize setTheme to prevent unnecessary re-renders
  const stableSetTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
  }, []);
  
  // Memoize derived values to prevent unnecessary re-renders
  const themeValues = useMemo(() => {
    const colors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';
    
    return {
      theme,
      colorScheme,
      colors,
      setTheme: stableSetTheme,
      isDark,
    };
  }, [theme, colorScheme, stableSetTheme]);

  return themeValues;
}

export function ThemeProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const themeValue = useThemeColors();
  
  return React.createElement(
    ThemeContext.Provider,
    { value: themeValue },
    children
  );
}