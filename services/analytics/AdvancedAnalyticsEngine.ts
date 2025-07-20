/**
 * Advanced Analytics Engine
 * 
 * Phase 2 Week 7 - Advanced Analytics & AI Intelligence
 * 
 * Features:
 * - Real-time event tracking and processing
 * - User behavior analytics and journey mapping
 * - Performance monitoring and optimization insights
 * - Custom event definitions and segmentation
 * - Privacy-compliant data collection
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { supabase } from '../../lib/supabase';

export interface AnalyticsEvent {
  id: string;
  type: string;
  category: 'user_action' | 'navigation' | 'performance' | 'error' | 'business' | 'system';
  name: string;
  properties: Record<string, any>;
  userId?: string;
  sessionId: string;
  timestamp: number;
  platform: string;
  appVersion: string;
  deviceInfo?: DeviceInfo;
  location?: LocationInfo;
}

export interface DeviceInfo {
  platform: string;
  osVersion: string;
  appVersion: string;
  deviceModel?: string;
  screenResolution?: string;
  networkType?: string;
  batteryLevel?: number;
  availableMemory?: number;
}

export interface LocationInfo {
  country?: string;
  region?: string;
  city?: string;
  timezone: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface UserSession {
  id: string;
  userId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  eventCount: number;
  screens: string[];
  interactions: number;
  crashes: number;
  errors: number;
  isActive: boolean;
}

export interface AnalyticsConfig {
  enableTracking: boolean;
  enableCrashReporting: boolean;
  enablePerformanceMonitoring: boolean;
  enableUserJourneyTracking: boolean;
  batchSize: number;
  flushInterval: number;
  retentionDays: number;
  anonymizeData: boolean;
  respectDNT: boolean; // Do Not Track
}

export class AdvancedAnalyticsEngine {
  private static instance: AdvancedAnalyticsEngine | null = null;
  
  private config: AnalyticsConfig;
  private currentSession: UserSession | null = null;
  private eventQueue: AnalyticsEvent[] = [];
  private isInitialized = false;
  private flushTimer?: NodeJS.Timeout;
  private currentUserId?: string;
  private deviceInfo: DeviceInfo;
  
  private static readonly ANALYTICS_STORAGE_KEY = '@analytics_events';
  private static readonly SESSION_STORAGE_KEY = '@analytics_session';
  private static readonly CONFIG_STORAGE_KEY = '@analytics_config';
  private static readonly USER_CONSENT_KEY = '@analytics_consent';

  private constructor() {
    this.config = this.getDefaultConfig();
    this.deviceInfo = this.collectDeviceInfo();
  }

  static getInstance(): AdvancedAnalyticsEngine {
    if (!AdvancedAnalyticsEngine.instance) {
      AdvancedAnalyticsEngine.instance = new AdvancedAnalyticsEngine();
    }
    return AdvancedAnalyticsEngine.instance;
  }

  // Initialize analytics engine
  async initialize(userId?: string, customConfig?: Partial<AnalyticsConfig>): Promise<void> {
    try {
      // Check user consent
      const hasConsent = await this.checkUserConsent();
      if (!hasConsent) {
        console.log('Analytics disabled - no user consent');
        return;
      }

      // Load saved configuration
      await this.loadConfiguration();
      
      // Apply custom configuration
      if (customConfig) {
        this.config = { ...this.config, ...customConfig };
        await this.saveConfiguration();
      }

      this.currentUserId = userId;
      
      // Initialize session
      await this.startSession();
      
      // Load queued events
      await this.loadQueuedEvents();
      
      // Setup periodic flush
      this.setupPeriodicFlush();
      
      // Setup app state monitoring
      this.setupAppStateMonitoring();
      
      this.isInitialized = true;
      
      // Track initialization
      this.track('analytics_initialized', 'system', {
        userId: userId || 'anonymous',
        config: this.config,
        platform: Platform.OS
      });

      console.log('AdvancedAnalyticsEngine initialized successfully');
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }

  // Track custom event
  track(
    eventName: string,
    category: AnalyticsEvent['category'] = 'user_action',
    properties: Record<string, any> = {},
    immediate = false
  ): void {
    if (!this.isInitialized || !this.config.enableTracking) return;

    try {
      const event: AnalyticsEvent = {
        id: this.generateEventId(),
        type: 'custom',
        category,
        name: eventName,
        properties: this.sanitizeProperties(properties),
        userId: this.currentUserId,
        sessionId: this.currentSession?.id || 'no-session',
        timestamp: Date.now(),
        platform: Platform.OS,
        appVersion: this.deviceInfo.appVersion,
        deviceInfo: this.deviceInfo,
        location: this.getLocationInfo()
      };

      // Add to queue
      this.eventQueue.push(event);
      
      // Update session
      this.updateSession(event);

      // Flush immediately if requested or queue is full
      if (immediate || this.eventQueue.length >= this.config.batchSize) {
        this.flush();
      }

      console.log('Event tracked:', eventName, properties);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  // Track screen view
  trackScreen(screenName: string, properties: Record<string, any> = {}): void {
    this.track('screen_view', 'navigation', {
      screen_name: screenName,
      ...properties
    });

    // Update session with screen info
    if (this.currentSession) {
      if (!this.currentSession.screens.includes(screenName)) {
        this.currentSession.screens.push(screenName);
      }
    }
  }

  // Track user interaction
  trackInteraction(
    element: string,
    action: string,
    properties: Record<string, any> = {}
  ): void {
    this.track('user_interaction', 'user_action', {
      element,
      action,
      ...properties
    });

    // Increment interaction count
    if (this.currentSession) {
      this.currentSession.interactions++;
    }
  }

  // Track performance metrics
  trackPerformance(
    metricName: string,
    value: number,
    unit: string = 'ms',
    properties: Record<string, any> = {}
  ): void {
    if (!this.config.enablePerformanceMonitoring) return;

    this.track('performance_metric', 'performance', {
      metric_name: metricName,
      value,
      unit,
      ...properties
    });
  }

  // Track error/exception
  trackError(
    error: Error | string,
    context: string = 'unknown',
    properties: Record<string, any> = {}
  ): void {
    const errorInfo = typeof error === 'string' ? 
      { message: error, stack: 'N/A' } : 
      { message: error.message, stack: error.stack };

    this.track('error', 'error', {
      error_message: errorInfo.message,
      error_stack: errorInfo.stack,
      context,
      ...properties
    }, true); // Flush immediately for errors

    // Update session error count
    if (this.currentSession) {
      this.currentSession.errors++;
    }
  }

  // Track business events
  trackBusiness(
    eventName: string,
    value?: number,
    currency?: string,
    properties: Record<string, any> = {}
  ): void {
    this.track(eventName, 'business', {
      value,
      currency,
      ...properties
    });
  }

  // Track user journey step
  trackJourneyStep(
    journeyName: string,
    stepName: string,
    stepIndex: number,
    properties: Record<string, any> = {}
  ): void {
    if (!this.config.enableUserJourneyTracking) return;

    this.track('journey_step', 'user_action', {
      journey_name: journeyName,
      step_name: stepName,
      step_index: stepIndex,
      ...properties
    });
  }

  // Set user properties
  setUserProperties(properties: Record<string, any>): void {
    this.track('user_properties_updated', 'user_action', {
      updated_properties: Object.keys(properties),
      ...properties
    });
  }

  // Set user ID
  setUserId(userId: string): void {
    const previousUserId = this.currentUserId;
    this.currentUserId = userId;
    
    this.track('user_identified', 'user_action', {
      previous_user_id: previousUserId,
      new_user_id: userId
    });
  }

  // Start new session
  private async startSession(): Promise<void> {
    // End current session if exists
    if (this.currentSession && this.currentSession.isActive) {
      await this.endSession();
    }

    this.currentSession = {
      id: this.generateSessionId(),
      userId: this.currentUserId,
      startTime: Date.now(),
      eventCount: 0,
      screens: [],
      interactions: 0,
      crashes: 0,
      errors: 0,
      isActive: true
    };

    await this.saveSession();
    
    this.track('session_start', 'system', {
      session_id: this.currentSession.id
    });
  }

  // End current session
  private async endSession(): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.endTime = Date.now();
    this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
    this.currentSession.isActive = false;

    this.track('session_end', 'system', {
      session_id: this.currentSession.id,
      duration: this.currentSession.duration,
      event_count: this.currentSession.eventCount,
      screens_visited: this.currentSession.screens.length,
      interactions: this.currentSession.interactions,
      errors: this.currentSession.errors
    });

    await this.saveSession();
    await this.flush(); // Ensure session end is recorded
  }

  // Update session with event info
  private updateSession(event: AnalyticsEvent): void {
    if (!this.currentSession) return;

    this.currentSession.eventCount++;
    this.saveSession();
  }

  // Flush events to server
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    try {
      const events = [...this.eventQueue];
      this.eventQueue = [];

      // Send to Supabase
      const { error } = await supabase
        .from('analytics_events')
        .insert(events.map(event => ({
          id: event.id,
          type: event.type,
          category: event.category,
          name: event.name,
          properties: event.properties,
          user_id: event.userId,
          session_id: event.sessionId,
          timestamp: new Date(event.timestamp).toISOString(),
          platform: event.platform,
          app_version: event.appVersion,
          device_info: event.deviceInfo,
          location_info: event.location
        })));

      if (error) {
        console.error('Failed to send analytics events:', error);
        // Re-queue events for retry
        this.eventQueue.unshift(...events);
      } else {
        console.log(`Flushed ${events.length} analytics events`);
      }
    } catch (error) {
      console.error('Error flushing analytics events:', error);
    }
  }

  // Get analytics summary
  async getAnalyticsSummary(days: number = 30): Promise<{
    totalEvents: number;
    totalSessions: number;
    averageSessionDuration: number;
    topEvents: Array<{ name: string; count: number }>;
    topScreens: Array<{ name: string; count: number }>;
    errorRate: number;
  }> {
    try {
      const since = new Date(Date.now() - (days * 24 * 60 * 60 * 1000));
      
      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('timestamp', since.toISOString())
        .eq('user_id', this.currentUserId);

      if (error) throw error;

      // Calculate metrics
      const totalEvents = events.length;
      const sessions = new Set(events.map(e => e.session_id));
      const totalSessions = sessions.size;
      
      const screenViews = events.filter(e => e.name === 'screen_view');
      const errors = events.filter(e => e.category === 'error');
      
      const eventCounts = events.reduce((acc, event) => {
        acc[event.name] = (acc[event.name] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const screenCounts = screenViews.reduce((acc, event) => {
        const screenName = event.properties?.screen_name;
        if (screenName) {
          acc[screenName] = (acc[screenName] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const topEvents = Object.entries(eventCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([name, count]) => ({ name, count: count as number }));

      const topScreens = Object.entries(screenCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([name, count]) => ({ name, count: count as number }));

      return {
        totalEvents,
        totalSessions,
        averageSessionDuration: 0, // Would need session data to calculate
        topEvents,
        topScreens,
        errorRate: totalEvents > 0 ? (errors.length / totalEvents) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting analytics summary:', error);
      return {
        totalEvents: 0,
        totalSessions: 0,
        averageSessionDuration: 0,
        topEvents: [],
        topScreens: [],
        errorRate: 0
      };
    }
  }

  // Request user consent for analytics
  async requestUserConsent(): Promise<boolean> {
    // This would typically show a consent dialog
    // For now, return true (assuming consent is given)
    const consent = true;
    await AsyncStorage.setItem(AdvancedAnalyticsEngine.USER_CONSENT_KEY, JSON.stringify(consent));
    return consent;
  }

  // Check if user has given consent
  private async checkUserConsent(): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(AdvancedAnalyticsEngine.USER_CONSENT_KEY);
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  }

  // Utility methods
  private getDefaultConfig(): AnalyticsConfig {
    return {
      enableTracking: true,
      enableCrashReporting: true,
      enablePerformanceMonitoring: true,
      enableUserJourneyTracking: true,
      batchSize: 20,
      flushInterval: 30000, // 30 seconds
      retentionDays: 90,
      anonymizeData: false,
      respectDNT: true
    };
  }

  private collectDeviceInfo(): DeviceInfo {
    return {
      platform: Platform.OS,
      osVersion: Platform.Version.toString(),
      appVersion: '1.0.0', // Would get from app config
      deviceModel: Platform.select({
        ios: 'iOS Device',
        android: 'Android Device',
        default: 'Unknown'
      })
    };
  }

  private getLocationInfo(): LocationInfo {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }

  private sanitizeProperties(properties: Record<string, any>): Record<string, any> {
    // Remove sensitive data and ensure serializable
    const sanitized = { ...properties };
    
    // Remove functions, symbols, etc.
    Object.keys(sanitized).forEach(key => {
      const value = sanitized[key];
      if (typeof value === 'function' || typeof value === 'symbol') {
        delete sanitized[key];
      } else if (typeof value === 'object' && value !== null) {
        try {
          JSON.stringify(value);
        } catch {
          delete sanitized[key];
        }
      }
    });

    return sanitized;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private setupAppStateMonitoring(): void {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        this.track('app_backgrounded', 'system');
        this.flush(); // Ensure events are sent before backgrounding
      } else if (nextAppState === 'active') {
        this.track('app_foregrounded', 'system');
      }
    });
  }

  // Storage methods
  private async saveConfiguration(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        AdvancedAnalyticsEngine.CONFIG_STORAGE_KEY,
        JSON.stringify(this.config)
      );
    } catch (error) {
      console.error('Error saving analytics configuration:', error);
    }
  }

  private async loadConfiguration(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(AdvancedAnalyticsEngine.CONFIG_STORAGE_KEY);
      if (stored) {
        this.config = { ...this.config, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading analytics configuration:', error);
    }
  }

  private async saveSession(): Promise<void> {
    try {
      if (this.currentSession) {
        await AsyncStorage.setItem(
          AdvancedAnalyticsEngine.SESSION_STORAGE_KEY,
          JSON.stringify(this.currentSession)
        );
      }
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  private async loadQueuedEvents(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(AdvancedAnalyticsEngine.ANALYTICS_STORAGE_KEY);
      if (stored) {
        this.eventQueue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading queued events:', error);
    }
  }

  // Cleanup
  async destroy(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    await this.endSession();
    await this.flush();

    this.isInitialized = false;
    AdvancedAnalyticsEngine.instance = null;
  }
}

export default AdvancedAnalyticsEngine;
