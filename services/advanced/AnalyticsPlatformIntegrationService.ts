/**
 * Analytics Platform Integration Service
 * 
 * Phase 2 Week 9 - Advanced Features & Platform Expansion
 * Days 3-4: Enterprise Integrations
 * 
 * Features:
 * - Google Analytics 4 integration
 * - Adobe Analytics connectivity
 * - Custom analytics platforms
 * - Real-time event tracking
 * - User behavior analytics
 * - Conversion funnel analysis
 * - Custom dashboard creation
 * - ROI tracking and attribution
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Types
export interface AnalyticsProvider {
  id: string;
  name: string;
  type: 'google_analytics' | 'adobe_analytics' | 'mixpanel' | 'amplitude' | 'segment' | 'custom';
  isActive: boolean;
  config: AnalyticsConfig;
  capabilities: AnalyticsCapabilities;
  lastSync: Date;
  dataRetention: number; // days
  samplingRate: number; // 0-1
}

export interface AnalyticsConfig {
  apiKey?: string;
  trackingId?: string;
  propertyId?: string;
  measurementId?: string;
  reportSuiteId?: string;
  projectId?: string;
  apiSecret?: string;
  customEndpoint?: string;
  dimensions: Record<string, string>;
  metrics: Record<string, string>;
  filters: AnalyticsFilter[];
  goals: AnalyticsGoal[];
  audienceSegments: AudienceSegment[];
}

export interface AnalyticsCapabilities {
  realTimeTracking: boolean;
  customEvents: boolean;
  ecommerce: boolean;
  userProfiles: boolean;
  cohortAnalysis: boolean;
  funnelAnalysis: boolean;
  attribution: boolean;
  customDimensions: boolean;
  dataExport: boolean;
  predictiveAnalytics: boolean;
}

export interface AnalyticsFilter {
  id: string;
  name: string;
  type: 'include' | 'exclude';
  field: string;
  operator: 'equals' | 'contains' | 'starts_with' | 'regex' | 'greater_than' | 'less_than';
  value: string;
  isActive: boolean;
}

export interface AnalyticsGoal {
  id: string;
  name: string;
  type: 'destination' | 'duration' | 'pages_per_session' | 'event' | 'custom';
  value: number;
  currency?: string;
  conditions: AnalyticsCondition[];
  funnelSteps: FunnelStep[];
  isActive: boolean;
}

export interface AnalyticsCondition {
  field: string;
  operator: string;
  value: string;
}

export interface FunnelStep {
  stepNumber: number;
  name: string;
  url?: string;
  event?: string;
  isRequired: boolean;
}

export interface AudienceSegment {
  id: string;
  name: string;
  description: string;
  conditions: AnalyticsCondition[];
  size: number;
  isActive: boolean;
}

export interface AnalyticsEvent {
  eventName: string;
  eventCategory?: string;
  eventLabel?: string;
  eventValue?: number;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  platform: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  userAgent?: string;
  location?: {
    country: string;
    region: string;
    city: string;
  };
  customDimensions: Record<string, string>;
  customMetrics: Record<string, number>;
  ecommerce?: EcommerceData;
}

export interface EcommerceData {
  transactionId?: string;
  affiliation?: string;
  revenue?: number;
  tax?: number;
  shipping?: number;
  currency?: string;
  items: EcommerceItem[];
}

export interface EcommerceItem {
  itemId: string;
  itemName: string;
  category: string;
  brand?: string;
  variant?: string;
  price: number;
  quantity: number;
  currency?: string;
}

export interface AnalyticsReport {
  id: string;
  name: string;
  provider: string;
  type: 'realtime' | 'standard' | 'cohort' | 'funnel' | 'attribution' | 'custom';
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  dimensions: string[];
  metrics: string[];
  filters: AnalyticsFilter[];
  data: AnalyticsReportData;
  generatedAt: Date;
}

export interface AnalyticsReportData {
  headers: string[];
  rows: (string | number)[][];
  totals: number[];
  summary: {
    totalUsers: number;
    totalSessions: number;
    totalPageviews: number;
    bounceRate: number;
    avgSessionDuration: number;
    conversionRate: number;
  };
}

export interface AnalyticsDashboard {
  id: string;
  name: string;
  description: string;
  widgets: AnalyticsWidget[];
  layout: DashboardLayout;
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'funnel' | 'map' | 'realtime';
  title: string;
  provider: string;
  query: AnalyticsQuery;
  visualization: VisualizationConfig;
  refreshInterval: number; // seconds
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface AnalyticsQuery {
  dimensions: string[];
  metrics: string[];
  filters: AnalyticsFilter[];
  dateRange: {
    startDate: Date;
    endDate: Date;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}

export interface VisualizationConfig {
  chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'table' | 'metric';
  colorScheme: string[];
  showLegend: boolean;
  showLabels: boolean;
  animationEnabled: boolean;
  customOptions: Record<string, any>;
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  gridSize: {
    width: number;
    height: number;
  };
  theme: 'light' | 'dark' | 'auto';
  responsive: boolean;
}

export class AnalyticsPlatformIntegrationService {
  private static instance: AnalyticsPlatformIntegrationService;
  private providers: Map<string, AnalyticsProvider> = new Map();
  private eventQueue: AnalyticsEvent[] = [];
  private dashboards: Map<string, AnalyticsDashboard> = new Map();
  private isInitialized: boolean = false;
  private batchSize: number = 20;
  private flushInterval: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeAnalyticsIntegration();
  }

  public static getInstance(): AnalyticsPlatformIntegrationService {
    if (!AnalyticsPlatformIntegrationService.instance) {
      AnalyticsPlatformIntegrationService.instance = new AnalyticsPlatformIntegrationService();
    }
    return AnalyticsPlatformIntegrationService.instance;
  }

  /**
   * Initialize analytics integration
   */
  private async initializeAnalyticsIntegration(): Promise<void> {
    try {
      await this.loadProviders();
      await this.loadDashboards();
      this.setupEventBatching();
      this.isInitialized = true;
      console.log('Analytics integration initialized with', this.providers.size, 'providers');
    } catch (error) {
      console.error('Analytics integration initialization error:', error);
    }
  }

  /**
   * Add analytics provider
   */
  async addProvider(provider: Omit<AnalyticsProvider, 'lastSync'>): Promise<void> {
    try {
      const analyticsProvider: AnalyticsProvider = {
        ...provider,
        lastSync: new Date(),
      };

      // Validate configuration
      const isValid = await this.validateProviderConfig(analyticsProvider);
      if (!isValid) {
        throw new Error(`Invalid configuration for ${provider.name}`);
      }

      this.providers.set(provider.id, analyticsProvider);
      await this.saveProviders();
      
      // Initialize provider-specific tracking
      if (provider.isActive) {
        await this.initializeProvider(analyticsProvider);
      }

    } catch (error) {
      console.error('Add analytics provider error:', error);
      throw error;
    }
  }

  /**
   * Track event across all active providers
   */
  async trackEvent(event: Omit<AnalyticsEvent, 'timestamp' | 'sessionId' | 'platform' | 'deviceType'>): Promise<void> {
    try {
      const analyticsEvent: AnalyticsEvent = {
        ...event,
        timestamp: new Date(),
        sessionId: await this.getCurrentSessionId(),
        platform: Platform.OS,
        deviceType: this.getDeviceType(),
      };

      // Add to queue for batch processing
      this.eventQueue.push(analyticsEvent);

      // Immediate flush for critical events
      if (this.isCriticalEvent(analyticsEvent)) {
        await this.flushEvents();
      }

    } catch (error) {
      console.error('Track event error:', error);
    }
  }

  /**
   * Track page view
   */
  async trackPageView(
    page: string,
    title?: string,
    customDimensions?: Record<string, string>
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'page_view',
      eventCategory: 'navigation',
      eventLabel: page,
      customDimensions: {
        page_title: title || page,
        ...customDimensions,
      },
      customMetrics: {},
    });
  }

  /**
   * Track user action
   */
  async trackUserAction(
    action: string,
    category: string,
    label?: string,
    value?: number,
    customData?: Record<string, any>
  ): Promise<void> {
    await this.trackEvent({
      eventName: action,
      eventCategory: category,
      eventLabel: label,
      eventValue: value,
      customDimensions: customData?.dimensions || {},
      customMetrics: customData?.metrics || {},
    });
  }

  /**
   * Track ecommerce transaction
   */
  async trackTransaction(ecommerceData: EcommerceData): Promise<void> {
    await this.trackEvent({
      eventName: 'purchase',
      eventCategory: 'ecommerce',
      eventValue: ecommerceData.revenue,
      customDimensions: {
        transaction_id: ecommerceData.transactionId || '',
        affiliation: ecommerceData.affiliation || '',
        currency: ecommerceData.currency || 'USD',
      },
      customMetrics: {
        revenue: ecommerceData.revenue || 0,
        tax: ecommerceData.tax || 0,
        shipping: ecommerceData.shipping || 0,
        item_count: ecommerceData.items.length,
      },
      ecommerce: ecommerceData,
    });
  }

  /**
   * Track search
   */
  async trackSearch(
    searchTerm: string,
    category?: string,
    resultsCount?: number,
    filters?: Record<string, string>
  ): Promise<void> {
    await this.trackEvent({
      eventName: 'search',
      eventCategory: 'engagement',
      eventLabel: searchTerm,
      eventValue: resultsCount,
      customDimensions: {
        search_term: searchTerm,
        search_category: category || 'all',
        ...filters,
      },
      customMetrics: {
        results_count: resultsCount || 0,
      },
    });
  }

  /**
   * Generate analytics report
   */
  async generateReport(
    providerId: string,
    query: AnalyticsQuery,
    reportType: 'realtime' | 'standard' | 'cohort' | 'funnel' | 'attribution' | 'custom' = 'standard'
  ): Promise<AnalyticsReport> {
    const provider = this.providers.get(providerId);
    if (!provider || !provider.isActive) {
      throw new Error(`Provider ${providerId} not found or inactive`);
    }

    try {
      let reportData: AnalyticsReportData;
      
      switch (provider.type) {
        case 'google_analytics':
          reportData = await this.generateGoogleAnalyticsReport(provider, query, reportType);
          break;
        case 'adobe_analytics':
          reportData = await this.generateAdobeAnalyticsReport(provider, query, reportType);
          break;
        default:
          reportData = await this.generateCustomReport(provider, query, reportType);
      }

      return {
        id: 'report_' + Date.now(),
        name: `${reportType} Report`,
        provider: providerId,
        type: reportType,
        dateRange: query.dateRange,
        dimensions: query.dimensions,
        metrics: query.metrics,
        filters: query.filters,
        data: reportData,
        generatedAt: new Date(),
      };

    } catch (error) {
      console.error(`Generate report error for ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Create custom dashboard
   */
  async createDashboard(dashboard: Omit<AnalyticsDashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const dashboardId = 'dashboard_' + Date.now();
    
    const newDashboard: AnalyticsDashboard = {
      ...dashboard,
      id: dashboardId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.dashboards.set(dashboardId, newDashboard);
    await this.saveDashboards();
    
    return dashboardId;
  }

  /**
   * Update dashboard
   */
  async updateDashboard(
    dashboardId: string,
    updates: Partial<Omit<AnalyticsDashboard, 'id' | 'createdAt'>>
  ): Promise<void> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const updatedDashboard = {
      ...dashboard,
      ...updates,
      updatedAt: new Date(),
    };

    this.dashboards.set(dashboardId, updatedDashboard);
    await this.saveDashboards();
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(dashboardId: string): Promise<Record<string, any>> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const widgetData: Record<string, any> = {};

    for (const widget of dashboard.widgets) {
      try {
        const report = await this.generateReport(widget.provider, widget.query, 'standard');
        widgetData[widget.id] = {
          ...report.data,
          lastUpdated: new Date(),
        };
      } catch (error) {
        console.error(`Widget ${widget.id} data error:`, error);
        widgetData[widget.id] = {
          error: error instanceof Error ? error.message : 'Unknown error',
          lastUpdated: new Date(),
        };
      }
    }

    return widgetData;
  }

  /**
   * Get real-time analytics
   */
  async getRealTimeAnalytics(providerId: string): Promise<{
    activeUsers: number;
    sessionsToday: number;
    topPages: Array<{ page: string; views: number }>;
    topEvents: Array<{ event: string; count: number }>;
    geographicData: Array<{ country: string; users: number }>;
  }> {
    const provider = this.providers.get(providerId);
    if (!provider || !provider.isActive || !provider.capabilities.realTimeTracking) {
      throw new Error(`Real-time analytics not available for ${providerId}`);
    }

    try {
      switch (provider.type) {
        case 'google_analytics':
          return await this.getGoogleAnalyticsRealTime(provider);
        case 'adobe_analytics':
          return await this.getAdobeAnalyticsRealTime(provider);
        default:
          return await this.getCustomRealTimeAnalytics(provider);
      }
    } catch (error) {
      console.error(`Real-time analytics error for ${providerId}:`, error);
      throw error;
    }
  }

  /**
   * Provider-specific methods
   */
  private async generateGoogleAnalyticsReport(
    provider: AnalyticsProvider,
    query: AnalyticsQuery,
    reportType: string
  ): Promise<AnalyticsReportData> {
    // Implementation would use Google Analytics Reporting API v4
    return {
      headers: ['Date', 'Users', 'Sessions', 'Pageviews'],
      rows: [
        ['2024-01-01', 1500, 2000, 5000],
        ['2024-01-02', 1600, 2100, 5200],
      ],
      totals: [3100, 4100, 10200],
      summary: {
        totalUsers: 3100,
        totalSessions: 4100,
        totalPageviews: 10200,
        bounceRate: 0.35,
        avgSessionDuration: 180,
        conversionRate: 0.03,
      },
    };
  }

  private async generateAdobeAnalyticsReport(
    provider: AnalyticsProvider,
    query: AnalyticsQuery,
    reportType: string
  ): Promise<AnalyticsReportData> {
    // Implementation would use Adobe Analytics API 2.0
    return {
      headers: ['Date', 'Unique Visitors', 'Visits', 'Page Views'],
      rows: [
        ['2024-01-01', 1400, 1900, 4800],
        ['2024-01-02', 1550, 2050, 5100],
      ],
      totals: [2950, 3950, 9900],
      summary: {
        totalUsers: 2950,
        totalSessions: 3950,
        totalPageviews: 9900,
        bounceRate: 0.32,
        avgSessionDuration: 195,
        conversionRate: 0.035,
      },
    };
  }

  private async generateCustomReport(
    provider: AnalyticsProvider,
    query: AnalyticsQuery,
    reportType: string
  ): Promise<AnalyticsReportData> {
    // Custom implementation for other providers
    return {
      headers: ['Metric', 'Value'],
      rows: [
        ['Users', 1000],
        ['Sessions', 1500],
        ['Pageviews', 4000],
      ],
      totals: [1000, 1500, 4000],
      summary: {
        totalUsers: 1000,
        totalSessions: 1500,
        totalPageviews: 4000,
        bounceRate: 0.40,
        avgSessionDuration: 160,
        conversionRate: 0.025,
      },
    };
  }

  private async getGoogleAnalyticsRealTime(provider: AnalyticsProvider): Promise<any> {
    // Implementation would use Google Analytics Real Time Reporting API
    return {
      activeUsers: 125,
      sessionsToday: 2500,
      topPages: [
        { page: '/search', views: 450 },
        { page: '/models', views: 380 },
        { page: '/reviews', views: 320 },
      ],
      topEvents: [
        { event: 'search', count: 280 },
        { event: 'view_model', count: 240 },
        { event: 'view_review', count: 190 },
      ],
      geographicData: [
        { country: 'United States', users: 1200 },
        { country: 'Canada', users: 450 },
        { country: 'United Kingdom', users: 380 },
      ],
    };
  }

  private async getAdobeAnalyticsRealTime(provider: AnalyticsProvider): Promise<any> {
    // Implementation would use Adobe Analytics Real-time API
    return {
      activeUsers: 118,
      sessionsToday: 2400,
      topPages: [
        { page: '/search', views: 440 },
        { page: '/models', views: 370 },
        { page: '/reviews', views: 310 },
      ],
      topEvents: [
        { event: 'search', count: 275 },
        { event: 'view_model', count: 235 },
        { event: 'view_review', count: 185 },
      ],
      geographicData: [
        { country: 'United States', users: 1180 },
        { country: 'Canada', users: 440 },
        { country: 'United Kingdom', users: 370 },
      ],
    };
  }

  private async getCustomRealTimeAnalytics(provider: AnalyticsProvider): Promise<any> {
    // Custom real-time analytics implementation
    return {
      activeUsers: 100,
      sessionsToday: 2000,
      topPages: [
        { page: '/search', views: 400 },
        { page: '/models', views: 350 },
        { page: '/reviews', views: 300 },
      ],
      topEvents: [
        { event: 'search', count: 250 },
        { event: 'view_model', count: 220 },
        { event: 'view_review', count: 180 },
      ],
      geographicData: [
        { country: 'United States', users: 1000 },
        { country: 'Canada', users: 400 },
        { country: 'United Kingdom', users: 350 },
      ],
    };
  }

  /**
   * Event processing and batching
   */
  private setupEventBatching(): void {
    this.flushInterval = setInterval(async () => {
      if (this.eventQueue.length > 0) {
        await this.flushEvents();
      }
    }, 30000); // Flush every 30 seconds
  }

  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToProcess = this.eventQueue.splice(0, this.batchSize);
    
    for (const [providerId, provider] of this.providers) {
      if (!provider.isActive) continue;

      try {
        await this.sendEventsToProvider(provider, eventsToProcess);
      } catch (error) {
        console.error(`Flush events error for ${providerId}:`, error);
        // Re-queue failed events
        this.eventQueue.unshift(...eventsToProcess);
        break;
      }
    }
  }

  private async sendEventsToProvider(provider: AnalyticsProvider, events: AnalyticsEvent[]): Promise<void> {
    switch (provider.type) {
      case 'google_analytics':
        await this.sendToGoogleAnalytics(provider, events);
        break;
      case 'adobe_analytics':
        await this.sendToAdobeAnalytics(provider, events);
        break;
      default:
        await this.sendToCustomProvider(provider, events);
    }
  }

  private async sendToGoogleAnalytics(provider: AnalyticsProvider, events: AnalyticsEvent[]): Promise<void> {
    // Implementation would use Google Analytics Measurement Protocol
    const payload = {
      client_id: await this.getClientId(),
      events: events.map(event => ({
        name: event.eventName,
        params: {
          event_category: event.eventCategory,
          event_label: event.eventLabel,
          value: event.eventValue,
          custom_dimensions: event.customDimensions,
          custom_metrics: event.customMetrics,
        },
      })),
    };

    // Mock API call
    console.log('Sending to Google Analytics:', payload);
  }

  private async sendToAdobeAnalytics(provider: AnalyticsProvider, events: AnalyticsEvent[]): Promise<void> {
    // Implementation would use Adobe Analytics Data Insertion API
    const payload = events.map(event => ({
      reportSuiteID: provider.config.reportSuiteId,
      visitorID: event.userId,
      pageName: event.eventLabel,
      events: event.eventName,
      timestamp: event.timestamp.toISOString(),
    }));

    // Mock API call
    console.log('Sending to Adobe Analytics:', payload);
  }

  private async sendToCustomProvider(provider: AnalyticsProvider, events: AnalyticsEvent[]): Promise<void> {
    // Custom provider implementation
    const payload = {
      events: events,
      provider: provider.id,
      timestamp: new Date().toISOString(),
    };

    // Mock API call
    console.log('Sending to custom provider:', payload);
  }

  /**
   * Utility methods
   */
  private async validateProviderConfig(provider: AnalyticsProvider): Promise<boolean> {
    try {
      switch (provider.type) {
        case 'google_analytics':
          return !!(provider.config.measurementId || provider.config.trackingId);
        case 'adobe_analytics':
          return !!(provider.config.reportSuiteId && provider.config.apiKey);
        default:
          return !!(provider.config.apiKey || provider.config.customEndpoint);
      }
    } catch (error) {
      console.error('Provider validation error:', error);
      return false;
    }
  }

  private async initializeProvider(provider: AnalyticsProvider): Promise<void> {
    // Provider-specific initialization
    console.log(`Initializing analytics provider: ${provider.name}`);
  }

  private async getCurrentSessionId(): Promise<string> {
    try {
      let sessionId = await AsyncStorage.getItem('analytics_session_id');
      if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await AsyncStorage.setItem('analytics_session_id', sessionId);
      }
      return sessionId;
    } catch (error) {
      return 'session_' + Date.now();
    }
  }

  private async getClientId(): Promise<string> {
    try {
      let clientId = await AsyncStorage.getItem('analytics_client_id');
      if (!clientId) {
        clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await AsyncStorage.setItem('analytics_client_id', clientId);
      }
      return clientId;
    } catch (error) {
      return 'client_' + Date.now();
    }
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (Platform.OS === 'web') {
      return 'desktop'; // Would check screen size in real implementation
    }
    
    // Check for tablet on iOS
    if (Platform.OS === 'ios') {
      const iosPlatform = Platform as any;
      return iosPlatform.isPad ? 'tablet' : 'mobile';
    }
    
    // For Android and other platforms, default to mobile
    return 'mobile';
  }

  private isCriticalEvent(event: AnalyticsEvent): boolean {
    const criticalEvents = ['purchase', 'error', 'crash', 'signup', 'login'];
    return criticalEvents.includes(event.eventName);
  }

  /**
   * Storage methods
   */
  private async loadProviders(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('analytics_providers');
      if (stored) {
        const providers = JSON.parse(stored);
        for (const provider of providers) {
          this.providers.set(provider.id, provider);
        }
      }
    } catch (error) {
      console.error('Load analytics providers error:', error);
    }
  }

  private async saveProviders(): Promise<void> {
    try {
      const providers = Array.from(this.providers.values());
      await AsyncStorage.setItem('analytics_providers', JSON.stringify(providers));
    } catch (error) {
      console.error('Save analytics providers error:', error);
    }
  }

  private async loadDashboards(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('analytics_dashboards');
      if (stored) {
        const dashboards = JSON.parse(stored);
        for (const dashboard of dashboards) {
          this.dashboards.set(dashboard.id, dashboard);
        }
      }
    } catch (error) {
      console.error('Load dashboards error:', error);
    }
  }

  private async saveDashboards(): Promise<void> {
    try {
      const dashboards = Array.from(this.dashboards.values());
      await AsyncStorage.setItem('analytics_dashboards', JSON.stringify(dashboards));
    } catch (error) {
      console.error('Save dashboards error:', error);
    }
  }

  /**
   * Public API methods
   */
  getProviders(): AnalyticsProvider[] {
    return Array.from(this.providers.values());
  }

  getProvider(providerId: string): AnalyticsProvider | undefined {
    return this.providers.get(providerId);
  }

  getDashboards(): AnalyticsDashboard[] {
    return Array.from(this.dashboards.values());
  }

  getDashboard(dashboardId: string): AnalyticsDashboard | undefined {
    return this.dashboards.get(dashboardId);
  }

  async removeProvider(providerId: string): Promise<void> {
    this.providers.delete(providerId);
    await this.saveProviders();
  }

  async removeDashboard(dashboardId: string): Promise<void> {
    this.dashboards.delete(dashboardId);
    await this.saveDashboards();
  }

  getQueueStatus(): {
    queueSize: number;
    activeProviders: number;
    lastFlush: Date | null;
  } {
    return {
      queueSize: this.eventQueue.length,
      activeProviders: Array.from(this.providers.values()).filter(p => p.isActive).length,
      lastFlush: null, // Would track actual last flush time
    };
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }
}

export default AnalyticsPlatformIntegrationService;
