import { Appearance, ColorSchemeName } from 'react-native';


export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  cardBackground: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
  // Extended colors for advanced theming
  primaryLight: string;
  primaryDark: string;
  surfaceVariant: string;
  onSurface: string;
  onBackground: string;
  outline: string;
  shadow: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  type: 'light' | 'dark';
  colors: ThemeColors;
  isCustom?: boolean;
  author?: string;
  description?: string;
}

export interface CustomThemeSettings {
  enableDynamicColors: boolean;
  followSystemTheme: boolean;
  adaptToWallpaper: boolean;
  highContrast: boolean;
  colorBlindFriendly: boolean;
  reducedMotion: boolean;
}

class AdvancedThemeManager {
  private static instance: AdvancedThemeManager;
  private currentTheme: ThemeConfig;
  private customThemes: ThemeConfig[] = [];
  private themeSettings: CustomThemeSettings = {
    enableDynamicColors: true,
    followSystemTheme: true,
    adaptToWallpaper: false,
    highContrast: false,
    colorBlindFriendly: false,
    reducedMotion: false,
  };
  private themeChangeListeners: ((theme: ThemeConfig) => void)[] = [];

  static getInstance(): AdvancedThemeManager {
    if (!AdvancedThemeManager.instance) {
      AdvancedThemeManager.instance = new AdvancedThemeManager();
    }
    return AdvancedThemeManager.instance;
  }

  constructor() {
    this.currentTheme = this.getDefaultTheme();
    this.initializeSystemListener();
  }

  private initializeSystemListener(): void {
    Appearance.addChangeListener(({ colorScheme }) => {
      if (this.themeSettings.followSystemTheme) {
        this.setSystemTheme(colorScheme);
      }
    });
  }

  // Default Theme Definitions
  private getDefaultTheme(): ThemeConfig {
    const systemColorScheme = Appearance.getColorScheme();
    return systemColorScheme === 'dark' ? this.getDarkTheme() : this.getLightTheme();
  }

  private getLightTheme(): ThemeConfig {
    return {
      id: 'default_light',
      name: 'Light',
      type: 'light',
      colors: {
        primary: '#2563EB',
        secondary: '#64748B',
        accent: '#F59E0B',
        background: '#FFFFFF',
        surface: '#F8FAFC',
        cardBackground: '#FFFFFF',
        text: '#1E293B',
        textSecondary: '#64748B',
        border: '#E2E8F0',
        error: '#EF4444',
        warning: '#F59E0B',
        success: '#10B981',
        info: '#3B82F6',
        primaryLight: '#DBEAFE',
        primaryDark: '#1D4ED8',
        surfaceVariant: '#F1F5F9',
        onSurface: '#334155',
        onBackground: '#0F172A',
        outline: '#CBD5E1',
        shadow: 'rgba(0, 0, 0, 0.1)',
      },
    };
  }

  private getDarkTheme(): ThemeConfig {
    return {
      id: 'default_dark',
      name: 'Dark',
      type: 'dark',
      colors: {
        primary: '#3B82F6',
        secondary: '#94A3B8',
        accent: '#FBBF24',
        background: '#0F172A',
        surface: '#1E293B',
        cardBackground: '#334155',
        text: '#F1F5F9',
        textSecondary: '#94A3B8',
        border: '#475569',
        error: '#F87171',
        warning: '#FBBF24',
        success: '#34D399',
        info: '#60A5FA',
        primaryLight: '#1E40AF',
        primaryDark: '#1E3A8A',
        surfaceVariant: '#475569',
        onSurface: '#E2E8F0',
        onBackground: '#F8FAFC',
        outline: '#64748B',
        shadow: 'rgba(0, 0, 0, 0.3)',
      },
    };
  }

  // Preset Themes
  getPresetThemes(): ThemeConfig[] {
    return [
      this.getLightTheme(),
      this.getDarkTheme(),
      // Ocean Theme
      {
        id: 'ocean',
        name: 'Ocean',
        type: 'light',
        colors: {
          primary: '#0891B2',
          secondary: '#0E7490',
          accent: '#F59E0B',
          background: '#F0F9FF',
          surface: '#E0F7FA',
          cardBackground: '#FFFFFF',
          text: '#0C4A6E',
          textSecondary: '#0E7490',
          border: '#B3E5FC',
          error: '#DC2626',
          warning: '#D97706',
          success: '#059669',
          info: '#0284C7',
          primaryLight: '#E0F7FA',
          primaryDark: '#0E7490',
          surfaceVariant: '#B3E5FC',
          onSurface: '#164E63',
          onBackground: '#0C4A6E',
          outline: '#67E8F9',
          shadow: 'rgba(8, 145, 178, 0.15)',
        },
      },
      // Forest Theme
      {
        id: 'forest',
        name: 'Forest',
        type: 'light',
        colors: {
          primary: '#059669',
          secondary: '#047857',
          accent: '#F59E0B',
          background: '#F0FDF4',
          surface: '#DCFCE7',
          cardBackground: '#FFFFFF',
          text: '#14532D',
          textSecondary: '#166534',
          border: '#BBF7D0',
          error: '#DC2626',
          warning: '#D97706',
          success: '#16A34A',
          info: '#0284C7',
          primaryLight: '#D1FAE5',
          primaryDark: '#064E3B',
          surfaceVariant: '#A7F3D0',
          onSurface: '#15803D',
          onBackground: '#14532D',
          outline: '#86EFAC',
          shadow: 'rgba(5, 150, 105, 0.15)',
        },
      },
      // Sunset Theme
      {
        id: 'sunset',
        name: 'Sunset',
        type: 'dark',
        colors: {
          primary: '#F97316',
          secondary: '#EA580C',
          accent: '#FBBF24',
          background: '#1C1917',
          surface: '#292524',
          cardBackground: '#44403C',
          text: '#FEF7F0',
          textSecondary: '#D6D3D1',
          border: '#57534E',
          error: '#F87171',
          warning: '#FBBF24',
          success: '#4ADE80',
          info: '#60A5FA',
          primaryLight: '#EA580C',
          primaryDark: '#C2410C',
          surfaceVariant: '#57534E',
          onSurface: '#F5F5F4',
          onBackground: '#FAFAF9',
          outline: '#78716C',
          shadow: 'rgba(249, 115, 22, 0.2)',
        },
      },
      // High Contrast Theme
      {
        id: 'high_contrast',
        name: 'High Contrast',
        type: 'light',
        colors: {
          primary: '#000000',
          secondary: '#333333',
          accent: '#FF6600',
          background: '#FFFFFF',
          surface: '#F5F5F5',
          cardBackground: '#FFFFFF',
          text: '#000000',
          textSecondary: '#333333',
          border: '#000000',
          error: '#CC0000',
          warning: '#FF6600',
          success: '#006600',
          info: '#0000CC',
          primaryLight: '#CCCCCC',
          primaryDark: '#000000',
          surfaceVariant: '#EEEEEE',
          onSurface: '#000000',
          onBackground: '#000000',
          outline: '#666666',
          shadow: 'rgba(0, 0, 0, 0.3)',
        },
      },
    ];
  }

  // Theme Management
  getCurrentTheme(): ThemeConfig {
    return this.currentTheme;
  }

  setTheme(theme: ThemeConfig): void {
    this.currentTheme = this.applyThemeSettings(theme);
    this.notifyThemeChange();
  }

  setThemeById(themeId: string): void {
    const theme = this.findThemeById(themeId);
    if (theme) {
      this.setTheme(theme);
    }
  }

  private setSystemTheme(colorScheme: ColorSchemeName): void {
    const theme = colorScheme === 'dark' ? this.getDarkTheme() : this.getLightTheme();
    this.setTheme(theme);
  }

  private findThemeById(themeId: string): ThemeConfig | null {
    const allThemes = [...this.getPresetThemes(), ...this.customThemes];
    return allThemes.find(theme => theme.id === themeId) || null;
  }

  // Custom Theme Creation
  createCustomTheme(
    name: string,
    baseTheme: ThemeConfig,
    colorOverrides: Partial<ThemeColors>,
    description?: string
  ): ThemeConfig {
    const customTheme: ThemeConfig = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      type: baseTheme.type,
      colors: { ...baseTheme.colors, ...colorOverrides },
      isCustom: true,
      author: 'User',
      description,
    };

    this.customThemes.push(customTheme);
    return customTheme;
  }

  deleteCustomTheme(themeId: string): boolean {
    const index = this.customThemes.findIndex(theme => theme.id === themeId);
    if (index !== -1) {
      this.customThemes.splice(index, 1);
      
      // Switch to default theme if current theme was deleted
      if (this.currentTheme.id === themeId) {
        this.setTheme(this.getDefaultTheme());
      }
      
      return true;
    }
    return false;
  }

  getCustomThemes(): ThemeConfig[] {
    return [...this.customThemes];
  }

  getAllThemes(): ThemeConfig[] {
    return [...this.getPresetThemes(), ...this.customThemes];
  }

  // Theme Settings
  updateThemeSettings(settings: Partial<CustomThemeSettings>): void {
    this.themeSettings = { ...this.themeSettings, ...settings };
    
    // Apply settings to current theme
    this.currentTheme = this.applyThemeSettings(this.currentTheme);
    this.notifyThemeChange();
  }

  getThemeSettings(): CustomThemeSettings {
    return { ...this.themeSettings };
  }

  private applyThemeSettings(theme: ThemeConfig): ThemeConfig {
    let modifiedTheme = { ...theme, colors: { ...theme.colors } };

    // Apply high contrast
    if (this.themeSettings.highContrast) {
      modifiedTheme = this.applyHighContrast(modifiedTheme);
    }

    // Apply color blind friendly adjustments
    if (this.themeSettings.colorBlindFriendly) {
      modifiedTheme = this.applyColorBlindFriendly(modifiedTheme);
    }

    return modifiedTheme;
  }

  private applyHighContrast(theme: ThemeConfig): ThemeConfig {
    const { colors } = theme;
    
    return {
      ...theme,
      colors: {
        ...colors,
        border: theme.type === 'light' ? '#000000' : '#FFFFFF',
        outline: theme.type === 'light' ? '#333333' : '#CCCCCC',
        textSecondary: colors.text, // Make secondary text same as primary for better contrast
      },
    };
  }

  private applyColorBlindFriendly(theme: ThemeConfig): ThemeConfig {
    // Adjust colors for better accessibility for color blind users
    return {
      ...theme,
      colors: {
        ...theme.colors,
        error: '#D32F2F', // More distinguishable red
        success: '#388E3C', // More distinguishable green
        warning: '#F57C00', // More distinguishable orange
      },
    };
  }

  // Dynamic Color Generation
  generateDynamicColors(baseColor: string): Partial<ThemeColors> {
    // Simple color generation - in a real app, you'd use a more sophisticated algorithm
    const rgb = this.hexToRgb(baseColor);
    if (!rgb) return {};

    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    
    return {
      primary: baseColor,
      primaryLight: this.hslToHex(hsl.h, Math.max(0, hsl.s - 20), Math.min(100, hsl.l + 30)),
      primaryDark: this.hslToHex(hsl.h, Math.min(100, hsl.s + 10), Math.max(0, hsl.l - 20)),
      accent: this.hslToHex((hsl.h + 60) % 360, hsl.s, hsl.l), // Complementary color
    };
  }

  // Color Utility Functions
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }

  private hslToHex(h: number, s: number, l: number): string {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n: number) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  // Theme Change Listeners
  addThemeChangeListener(listener: (theme: ThemeConfig) => void): () => void {
    this.themeChangeListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.themeChangeListeners.indexOf(listener);
      if (index !== -1) {
        this.themeChangeListeners.splice(index, 1);
      }
    };
  }

  private notifyThemeChange(): void {
    this.themeChangeListeners.forEach(listener => listener(this.currentTheme));
  }

  // Theme Export/Import
  exportTheme(theme: ThemeConfig): string {
    return JSON.stringify(theme, null, 2);
  }

  importTheme(themeJson: string): ThemeConfig | null {
    try {
      const theme = JSON.parse(themeJson) as ThemeConfig;
      
      // Validate theme structure
      if (this.validateThemeStructure(theme)) {
        theme.id = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        theme.isCustom = true;
        this.customThemes.push(theme);
        return theme;
      }
    } catch (error) {
      logger.error('Failed to import theme:', error);
    }
    
    return null;
  }

  private validateThemeStructure(theme: any): theme is ThemeConfig {
    return (
      typeof theme === 'object' &&
      typeof theme.name === 'string' &&
      (theme.type === 'light' || theme.type === 'dark') &&
      typeof theme.colors === 'object' &&
      typeof theme.colors.primary === 'string' &&
      typeof theme.colors.background === 'string' &&
      typeof theme.colors.text === 'string'
    );
  }
}

export default AdvancedThemeManager;
