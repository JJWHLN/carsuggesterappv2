import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ABTestExperiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: string;
  endDate?: string;
  trafficAllocation: number; // Percentage of users to include (0-100)
  variants: ABTestVariant[];
  targetAudience?: {
    userSegments?: string[];
    minSessions?: number;
    maxSessions?: number;
    platforms?: ('ios' | 'android')[];
    versions?: string[];
  };
  successMetrics: {
    primary: string;
    secondary?: string[];
  };
  metadata?: { [key: string]: any };
}

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  allocation: number; // Percentage of experiment traffic (0-100)
  config: { [key: string]: any };
  isControl: boolean;
}

export interface ABTestAssignment {
  userId: string;
  experimentId: string;
  variantId: string;
  assignedAt: string;
  exposureCount: number;
  lastExposureAt: string;
  converted: boolean;
  convertedAt?: string;
  metadata?: { [key: string]: any };
}

export interface ABTestEvent {
  id: string;
  userId: string;
  experimentId: string;
  variantId: string;
  eventType: 'exposure' | 'conversion' | 'custom';
  eventName: string;
  timestamp: string;
  value?: number;
  metadata?: { [key: string]: any };
}

export interface ABTestResults {
  experimentId: string;
  status: 'running' | 'completed' | 'inconclusive';
  participants: number;
  startDate: string;
  endDate?: string;
  variants: {
    variantId: string;
    name: string;
    isControl: boolean;
    participants: number;
    exposures: number;
    conversions: number;
    conversionRate: number;
    confidence: number;
    isWinner?: boolean;
    uplift?: number;
    metrics: {
      [metricName: string]: {
        value: number;
        confidence: number;
        significance: boolean;
      };
    };
  }[];
  recommendation: 'continue' | 'stop' | 'declare_winner' | 'inconclusive';
  winnerVariantId?: string;
  statisticalSignificance: boolean;
  confidenceLevel: number;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  targetAudience?: {
    userSegments?: string[];
    platforms?: ('ios' | 'android')[];
    versions?: string[];
  };
  value?: any; // For feature flags with values
  createdAt: string;
  updatedAt: string;
}

export class ABTestService {
  private static instance: ABTestService;
  private experiments: ABTestExperiment[] = [];
  private assignments: ABTestAssignment[] = [];
  private events: ABTestEvent[] = [];
  private featureFlags: FeatureFlag[] = [];
  private userId: string = '';
  private isInitialized: boolean = false;

  static getInstance(): ABTestService {
    if (!ABTestService.instance) {
      ABTestService.instance = new ABTestService();
    }
    return ABTestService.instance;
  }

  private constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await this.loadStoredData();
      await this.createDefaultExperiments();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Failed to initialize ABTestService:', error);
    }
  }

  private async loadStoredData(): Promise<void> {
    try {
      const [experimentsData, assignmentsData, eventsData, flagsData, userIdData] = await Promise.all([
        AsyncStorage.getItem('ab_experiments'),
        AsyncStorage.getItem('ab_assignments'),
        AsyncStorage.getItem('ab_events'),
        AsyncStorage.getItem('feature_flags'),
        AsyncStorage.getItem('ab_user_id'),
      ]);

      if (experimentsData) {
        this.experiments = JSON.parse(experimentsData);
      }
      if (assignmentsData) {
        this.assignments = JSON.parse(assignmentsData);
      }
      if (eventsData) {
        this.events = JSON.parse(eventsData);
      }
      if (flagsData) {
        this.featureFlags = JSON.parse(flagsData);
      }
      if (userIdData) {
        this.userId = JSON.parse(userIdData);
      } else {
        this.userId = this.generateUserId();
        await AsyncStorage.setItem('ab_user_id', JSON.stringify(this.userId));
      }
    } catch (error) {
      console.warn('Failed to load AB testing data:', error);
      this.userId = this.generateUserId();
    }
  }

  private async saveData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem('ab_experiments', JSON.stringify(this.experiments)),
        AsyncStorage.setItem('ab_assignments', JSON.stringify(this.assignments)),
        AsyncStorage.setItem('ab_events', JSON.stringify(this.events)),
        AsyncStorage.setItem('feature_flags', JSON.stringify(this.featureFlags)),
      ]);
    } catch (error) {
      console.warn('Failed to save AB testing data:', error);
    }
  }

  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async createDefaultExperiments(): Promise<void> {
    if (this.experiments.length === 0) {
      const defaultExperiments: ABTestExperiment[] = [
        {
          id: 'search_ui_test',
          name: 'Search Interface Optimization',
          description: 'Testing different search UI layouts for better user engagement',
          status: 'active',
          startDate: new Date().toISOString(),
          trafficAllocation: 50,
          variants: [
            {
              id: 'control',
              name: 'Current Search',
              description: 'Current search interface',
              allocation: 50,
              config: { searchLayout: 'current' },
              isControl: true,
            },
            {
              id: 'enhanced',
              name: 'Enhanced Search',
              description: 'Enhanced search with advanced filters',
              allocation: 50,
              config: { searchLayout: 'enhanced', showQuickFilters: true },
              isControl: false,
            },
          ],
          successMetrics: {
            primary: 'search_success_rate',
            secondary: ['time_to_result', 'filter_usage'],
          },
        },
        {
          id: 'recommendation_algorithm_test',
          name: 'Recommendation Algorithm Comparison',
          description: 'Testing collaborative filtering vs content-based recommendations',
          status: 'active',
          startDate: new Date().toISOString(),
          trafficAllocation: 30,
          variants: [
            {
              id: 'collaborative',
              name: 'Collaborative Filtering',
              description: 'User-based collaborative filtering',
              allocation: 50,
              config: { 
                algorithm: 'collaborative',
                similarity_threshold: 0.7,
                min_recommendations: 5
              },
              isControl: true,
            },
            {
              id: 'content_based',
              name: 'Content-Based',
              description: 'Content-based filtering with car features',
              allocation: 50,
              config: { 
                algorithm: 'content_based',
                feature_weights: { price: 0.3, brand: 0.2, year: 0.2, mileage: 0.3 }
              },
              isControl: false,
            },
          ],
          successMetrics: {
            primary: 'recommendation_click_rate',
            secondary: ['bookmark_conversion', 'time_on_page'],
          },
        },
        {
          id: 'car_card_design_test',
          name: 'Car Card Design Optimization',
          description: 'Testing different car card layouts for better engagement',
          status: 'active',
          startDate: new Date().toISOString(),
          trafficAllocation: 25,
          variants: [
            {
              id: 'minimal',
              name: 'Minimal Design',
              description: 'Clean, minimal car card design',
              allocation: 33,
              config: { 
                cardStyle: 'minimal',
                showBadges: false,
                imageSize: 'medium'
              },
              isControl: true,
            },
            {
              id: 'detailed',
              name: 'Detailed Design',
              description: 'Detailed car card with more information',
              allocation: 33,
              config: { 
                cardStyle: 'detailed',
                showBadges: true,
                imageSize: 'large',
                showFeatures: true
              },
              isControl: false,
            },
            {
              id: 'premium',
              name: 'Premium Design',
              description: 'Premium car card with gradient effects',
              allocation: 34,
              config: { 
                cardStyle: 'premium',
                showBadges: true,
                imageSize: 'large',
                showFeatures: true,
                useGradients: true
              },
              isControl: false,
            },
          ],
          successMetrics: {
            primary: 'card_click_rate',
            secondary: ['time_on_listing', 'bookmark_rate'],
          },
        },
      ];

      this.experiments = defaultExperiments;
      await this.saveData();
    }
  }

  // Feature Flag Management
  async createFeatureFlag(flag: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeatureFlag> {
    const newFlag: FeatureFlag = {
      id: `flag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...flag,
    };

    this.featureFlags.push(newFlag);
    await this.saveData();
    return newFlag;
  }

  async updateFeatureFlag(flagId: string, updates: Partial<FeatureFlag>): Promise<FeatureFlag | null> {
    const flagIndex = this.featureFlags.findIndex(f => f.id === flagId);
    if (flagIndex === -1) return null;

    this.featureFlags[flagIndex] = {
      ...this.featureFlags[flagIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await this.saveData();
    return this.featureFlags[flagIndex];
  }

  isFeatureEnabled(flagName: string): boolean {
    const flag = this.featureFlags.find(f => f.name === flagName);
    if (!flag || !flag.enabled) return false;

    // Check rollout percentage
    if (flag.rolloutPercentage < 100) {
      const hash = this.hashUserId(this.userId + flag.id);
      const userPercentile = hash % 100;
      if (userPercentile >= flag.rolloutPercentage) return false;
    }

    // Check target audience (simplified)
    if (flag.targetAudience?.platforms) {
      // In a real app, you'd check the actual platform
      const currentPlatform = 'ios'; // Would be determined at runtime
      if (!flag.targetAudience.platforms.includes(currentPlatform as any)) return false;
    }

    return true;
  }

  getFeatureFlagValue(flagName: string, defaultValue: any = null): any {
    const flag = this.featureFlags.find(f => f.name === flagName);
    if (!flag || !this.isFeatureEnabled(flagName)) return defaultValue;
    return flag.value !== undefined ? flag.value : true;
  }

  // Experiment Management
  async createExperiment(experiment: Omit<ABTestExperiment, 'id'>): Promise<ABTestExperiment> {
    const newExperiment: ABTestExperiment = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...experiment,
    };

    this.experiments.push(newExperiment);
    await this.saveData();
    return newExperiment;
  }

  async updateExperiment(experimentId: string, updates: Partial<ABTestExperiment>): Promise<ABTestExperiment | null> {
    const experimentIndex = this.experiments.findIndex(e => e.id === experimentId);
    if (experimentIndex === -1) return null;

    this.experiments[experimentIndex] = {
      ...this.experiments[experimentIndex],
      ...updates,
    };

    await this.saveData();
    return this.experiments[experimentIndex];
  }

  // User Assignment and Exposure
  async getVariant(experimentId: string): Promise<string | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const experiment = this.experiments.find(e => e.id === experimentId);
    if (!experiment || experiment.status !== 'active') return null;

    // Check if user is already assigned
    let assignment = this.assignments.find(a => 
      a.userId === this.userId && a.experimentId === experimentId
    );

    if (!assignment) {
      // Check if user should be included in experiment
      if (!this.shouldIncludeUser(experiment)) return null;

      // Assign user to variant
      const variantId = this.assignVariant(experiment);
      if (!variantId) return null;

      assignment = {
        userId: this.userId,
        experimentId,
        variantId,
        assignedAt: new Date().toISOString(),
        exposureCount: 0,
        lastExposureAt: '',
        converted: false,
      };

      this.assignments.push(assignment);
    }

    // Track exposure
    await this.trackExposure(experimentId, assignment.variantId);

    return assignment.variantId;
  }

  async getVariantConfig(experimentId: string): Promise<{ [key: string]: any } | null> {
    const variantId = await this.getVariant(experimentId);
    if (!variantId) return null;

    const experiment = this.experiments.find(e => e.id === experimentId);
    const variant = experiment?.variants.find(v => v.id === variantId);
    
    return variant?.config || null;
  }

  private shouldIncludeUser(experiment: ABTestExperiment): boolean {
    // Check traffic allocation
    const hash = this.hashUserId(this.userId + experiment.id);
    const userPercentile = hash % 100;
    if (userPercentile >= experiment.trafficAllocation) return false;

    // Check target audience (simplified)
    if (experiment.targetAudience?.platforms) {
      const currentPlatform = 'ios'; // Would be determined at runtime
      if (!experiment.targetAudience.platforms.includes(currentPlatform as any)) return false;
    }

    return true;
  }

  private assignVariant(experiment: ABTestExperiment): string | null {
    const hash = this.hashUserId(this.userId + experiment.id + 'variant');
    const random = (hash % 10000) / 100; // 0-99.99

    let cumulativeAllocation = 0;
    for (const variant of experiment.variants) {
      cumulativeAllocation += variant.allocation;
      if (random < cumulativeAllocation) {
        return variant.id;
      }
    }

    return null;
  }

  private hashUserId(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Event Tracking
  async trackExposure(experimentId: string, variantId: string): Promise<void> {
    // Update assignment
    const assignment = this.assignments.find(a => 
      a.userId === this.userId && a.experimentId === experimentId
    );
    
    if (assignment) {
      assignment.exposureCount++;
      assignment.lastExposureAt = new Date().toISOString();
    }

    // Create event
    const event: ABTestEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      experimentId,
      variantId,
      eventType: 'exposure',
      eventName: 'variant_exposure',
      timestamp: new Date().toISOString(),
    };

    this.events.push(event);
    await this.saveData();
  }

  async trackConversion(experimentId: string, eventName: string = 'conversion', value?: number): Promise<void> {
    const assignment = this.assignments.find(a => 
      a.userId === this.userId && a.experimentId === experimentId
    );
    
    if (!assignment) return;

    // Update assignment
    if (!assignment.converted) {
      assignment.converted = true;
      assignment.convertedAt = new Date().toISOString();
    }

    // Create event
    const event: ABTestEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      experimentId,
      variantId: assignment.variantId,
      eventType: 'conversion',
      eventName,
      timestamp: new Date().toISOString(),
      value,
    };

    this.events.push(event);
    await this.saveData();
  }

  async trackCustomEvent(
    experimentId: string, 
    eventName: string, 
    value?: number, 
    metadata?: { [key: string]: any }
  ): Promise<void> {
    const assignment = this.assignments.find(a => 
      a.userId === this.userId && a.experimentId === experimentId
    );
    
    if (!assignment) return;

    const event: ABTestEvent = {
      id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      experimentId,
      variantId: assignment.variantId,
      eventType: 'custom',
      eventName,
      timestamp: new Date().toISOString(),
      value,
      metadata,
    };

    this.events.push(event);
    await this.saveData();
  }

  // Analytics and Results
  async getExperimentResults(experimentId: string): Promise<ABTestResults | null> {
    const experiment = this.experiments.find(e => e.id === experimentId);
    if (!experiment) return null;

    const experimentAssignments = this.assignments.filter(a => a.experimentId === experimentId);
    const experimentEvents = this.events.filter(e => e.experimentId === experimentId);

    const variantResults = experiment.variants.map(variant => {
      const variantAssignments = experimentAssignments.filter(a => a.variantId === variant.id);
      const variantExposures = experimentEvents.filter(e => 
        e.variantId === variant.id && e.eventType === 'exposure'
      );
      const variantConversions = experimentEvents.filter(e => 
        e.variantId === variant.id && e.eventType === 'conversion'
      );

      const participants = variantAssignments.length;
      const exposures = variantExposures.length;
      const conversions = variantConversions.length;
      const conversionRate = exposures > 0 ? (conversions / exposures) * 100 : 0;

      return {
        variantId: variant.id,
        name: variant.name,
        isControl: variant.isControl,
        participants,
        exposures,
        conversions,
        conversionRate,
        confidence: this.calculateConfidence(conversions, exposures),
        isWinner: false,
        uplift: 0,
        metrics: {}, // Would implement specific metric calculations
      };
    });

    // Find control variant
    const controlVariant = variantResults.find(v => v.isControl);
    const testVariants = variantResults.filter(v => !v.isControl);

    // Calculate statistical significance and winner
    let winnerVariantId: string | undefined;
    let statisticalSignificance = false;

    if (controlVariant && testVariants.length > 0) {
      const bestTestVariant = testVariants.reduce((best, current) => 
        current.conversionRate > best.conversionRate ? current : best
      );

      // Simple significance test (would use proper statistical test in production)
      const significance = this.calculateSignificance(
        controlVariant.conversions, 
        controlVariant.exposures,
        bestTestVariant.conversions, 
        bestTestVariant.exposures
      );

      statisticalSignificance = significance > 0.95;
      
      if (statisticalSignificance && bestTestVariant.conversionRate > controlVariant.conversionRate) {
        winnerVariantId = bestTestVariant.variantId;
      }

      // Calculate uplift for test variants
      testVariants.forEach(variant => {
        if (controlVariant.conversionRate > 0) {
          variant.uplift = ((variant.conversionRate - controlVariant.conversionRate) / controlVariant.conversionRate) * 100;
        }
      });
    }

    // Set winner flag
    variantResults.forEach(variant => {
      variant.isWinner = variant.variantId === winnerVariantId;
    });

    return {
      experimentId,
      status: experiment.status === 'completed' ? 'completed' : 'running',
      participants: experimentAssignments.length,
      startDate: experiment.startDate,
      endDate: experiment.endDate,
      variants: variantResults,
      recommendation: this.getRecommendation(variantResults, statisticalSignificance),
      winnerVariantId,
      statisticalSignificance,
      confidenceLevel: 95,
    };
  }

  private calculateConfidence(conversions: number, exposures: number): number {
    if (exposures === 0) return 0;
    
    const p = conversions / exposures;
    const z = 1.96; // 95% confidence
    const marginOfError = z * Math.sqrt((p * (1 - p)) / exposures);
    
    return Math.max(0, Math.min(100, (1 - 2 * marginOfError) * 100));
  }

  private calculateSignificance(
    controlConversions: number,
    controlExposures: number,
    testConversions: number,
    testExposures: number
  ): number {
    // Simplified z-test for proportions
    if (controlExposures === 0 || testExposures === 0) return 0;

    const p1 = controlConversions / controlExposures;
    const p2 = testConversions / testExposures;
    const pPooled = (controlConversions + testConversions) / (controlExposures + testExposures);
    
    const se = Math.sqrt(pPooled * (1 - pPooled) * (1/controlExposures + 1/testExposures));
    
    if (se === 0) return 0;
    
    const z = Math.abs(p2 - p1) / se;
    
    // Convert z-score to confidence level using approximation
    // For z > 1.96 (95% confidence), return high confidence
    if (z >= 1.96) return 0.95;
    if (z >= 1.64) return 0.90;
    if (z >= 1.28) return 0.80;
    
    return Math.min(0.999, z / 3); // Simple linear approximation for lower z-scores
  }

  private getRecommendation(
    variants: ABTestResults['variants'],
    isSignificant: boolean
  ): ABTestResults['recommendation'] {
    if (variants.length === 0) return 'inconclusive';
    
    const totalParticipants = variants.reduce((sum, v) => sum + v.participants, 0);
    
    if (totalParticipants < 100) return 'continue';
    if (!isSignificant) return 'continue';
    
    const hasWinner = variants.some(v => v.isWinner);
    return hasWinner ? 'declare_winner' : 'inconclusive';
  }

  // Data Management
  async getAllExperiments(): Promise<ABTestExperiment[]> {
    return [...this.experiments];
  }

  async getActiveExperiments(): Promise<ABTestExperiment[]> {
    return this.experiments.filter(e => e.status === 'active');
  }

  async getAllFeatureFlags(): Promise<FeatureFlag[]> {
    return [...this.featureFlags];
  }

  async exportData(): Promise<{
    experiments: ABTestExperiment[];
    assignments: ABTestAssignment[];
    events: ABTestEvent[];
    featureFlags: FeatureFlag[];
  }> {
    return {
      experiments: [...this.experiments],
      assignments: [...this.assignments],
      events: [...this.events],
      featureFlags: [...this.featureFlags],
    };
  }

  async clearAllData(): Promise<void> {
    this.experiments = [];
    this.assignments = [];
    this.events = [];
    this.featureFlags = [];
    
    await AsyncStorage.multiRemove([
      'ab_experiments',
      'ab_assignments', 
      'ab_events',
      'feature_flags',
    ]);
  }
}

export default ABTestService;
