import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from './Theme';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: 'light' | 'dark';
  mode: ThemeMode;
  colors: typeof Colors.light;
  setMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  initialMode = 'system' 
}) => {
  const systemColorScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  
  // Determine active theme
  const activeTheme = mode === 'system' ? systemColorScheme || 'light' : mode;
  
  // Get colors for active theme
  const colors = Colors[activeTheme as keyof typeof Colors];
  
  // Toggle between light and dark (skips system)
  const toggleTheme = () => {
    if (mode === 'system') {
      setMode(systemColorScheme === 'dark' ? 'light' : 'dark');
    } else {
      setMode(mode === 'light' ? 'dark' : 'light');
    }
  };
  
  const contextValue: ThemeContextType = {
    theme: activeTheme,
    mode,
    colors,
    setMode,
    toggleTheme,
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Legacy hook for backward compatibility
export const useThemeColors = () => {
  const { colors } = useTheme();
  return { colors };
};

// Helper hooks for specific use cases
export const useIsDarkMode = (): boolean => {
  const { theme } = useTheme();
  return theme === 'dark';
};

export const useThemeMode = (): [ThemeMode, (mode: ThemeMode) => void] => {
  const { mode, setMode } = useTheme();
  return [mode, setMode];
};
