/**
 * Temporary AI Search types and classes to fix compilation errors
 * These are simplified versions to get the app running
 */

export interface AISearchQuery {
  query: string;
  suggestions: string[];
  filters: Record<string, any>;
  results: any[];
  confidence?: number;
}

export class AISearchEngine {
  private static instance: AISearchEngine;

  static getInstance(): AISearchEngine {
    if (!AISearchEngine.instance) {
      AISearchEngine.instance = new AISearchEngine();
    }
    return AISearchEngine.instance;
  }

  async search(query: string): Promise<AISearchQuery> {
    return {
      query,
      suggestions: ['Popular searches', 'Recent searches', 'Recommended'],
      filters: {},
      results: [],
      confidence: 0.8
    };
  }

  hasNaturalLanguagePatterns(query: string): boolean {
    return query.includes(' ') || query.includes('under') || query.includes('over');
  }

  parseNaturalLanguage(query: string): any {
    return { query, intent: 'search', filters: {} };
  }

  rankCars(cars: any[], query: any): any[] {
    return cars;
  }

  explainResults(query: AISearchQuery, count: number): string {
    return `Found ${count} results for "${query.query}"`;
  }
}

export class SmartNotificationService {
  private static instance: SmartNotificationService;

  static getInstance(): SmartNotificationService {
    if (!SmartNotificationService.instance) {
      SmartNotificationService.instance = new SmartNotificationService();
    }
    return SmartNotificationService.instance;
  }

  async sendNotification(message: string): Promise<void> {
    // Mock implementation
  }

  async createNotification(data: any): Promise<void> {
    // Mock implementation
  }

  async checkPriceAlerts(results: any[]): Promise<void> {
    // Mock implementation
  }

  async checkSavedSearchAlerts(results: any[]): Promise<void> {
    // Mock implementation
  }
}

export class AdvancedThemeManager {
  private static instance: AdvancedThemeManager;
  private currentTheme = { id: 'default', name: 'Default' };

  static getInstance(): AdvancedThemeManager {
    if (!AdvancedThemeManager.instance) {
      AdvancedThemeManager.instance = new AdvancedThemeManager();
    }
    return AdvancedThemeManager.instance;
  }

  getAllThemes(): any[] {
    return [
      { id: 'default', name: 'Default' },
      { id: 'dark', name: 'Dark' },
      { id: 'light', name: 'Light' }
    ];
  }

  getCurrentTheme(): any {
    return this.currentTheme;
  }

  setTheme(theme: any): void {
    this.currentTheme = theme;
  }
}

export const usePerformanceMonitor = () => ({
  measureOperation: (name: string, operation?: () => void) => {
    if (operation) {
      operation();
    }
    return {
      measureAsync: async (asyncOperation: () => Promise<any>) => {
        return await asyncOperation();
      }
    };
  },
  generateReport: () => ({
    averageRenderTime: 16.7,
    totalMetrics: 100,
    appStartTime: 1000
  })
});
