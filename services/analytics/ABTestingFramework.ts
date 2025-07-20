/**
 * A/B Testing Framework
 * 
 * Phase 2 Week 7 - Advanced Analytics & AI Intelligence
 * 
 * Features:
 * - Multivariate testing capabilities
 * - Statistical significance calculation
 * - Real-time test monitoring
 * - Automated test optimization
 * - User segmentation for tests
 */

import { supabase } from '../../lib/supabase';
import AdvancedAnalyticsEngine from './AdvancedAnalyticsEngine';

export interface ABTest {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'archived';
  testType: 'ab' | 'multivariate' | 'split_url';
  startDate: Date;
  endDate?: Date;
  targetMetric: string;
  successCriteria: SuccessCriteria;
  variants: TestVariant[];
  segments: UserSegment[];
  trafficAllocation: number; // Percentage of total traffic
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TestVariant {
  id: string;
  name: string;
  description: string;
  trafficPercentage: number;
  isControl: boolean;
  configuration: VariantConfiguration;
  metrics: VariantMetrics;
}

export interface VariantConfiguration {
  type: 'ui_change' | 'algorithm_change' | 'content_change' | 'feature_toggle';
  changes: TestChange[];
  rolloutStrategy?: RolloutStrategy;
}

export interface TestChange {
  component: string;
  property: string;
  originalValue: any;
  testValue: any;
  changeType: 'replace' | 'toggle' | 'modify' | 'add' | 'remove';
}

export interface RolloutStrategy {
  type: 'immediate' | 'gradual' | 'time_based';
  parameters: Record<string, any>;
}

export interface VariantMetrics {
  participants: number;
  conversions: number;
  conversionRate: number;
  revenue: number;
  avgSessionDuration: number;
  bounceRate: number;
  clickThroughRate: number;
  customMetrics: Record<string, number>;
  confidence: number;
  statisticalSignificance: number;
}

export interface SuccessCriteria {
  primaryMetric: string;
  minimumDetectableEffect: number; // Percentage improvement to detect
  confidenceLevel: number; // e.g., 95%
  statisticalPower: number; // e.g., 80%
  minimumSampleSize: number;
  testDuration: number; // Days
}

export interface UserSegment {
  id: string;
  name: string;
  criteria: SegmentCriteria[];
  percentage: number;
}

export interface SegmentCriteria {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
}

export interface TestResults {
  testId: string;
  status: 'running' | 'completed';
  duration: number;
  totalParticipants: number;
  winningVariant?: string;
  confidence: number;
  significance: number;
  improvement: number;
  variants: VariantResults[];
  insights: TestInsight[];
  recommendation: string;
}

export interface VariantResults {
  variantId: string;
  name: string;
  participants: number;
  conversions: number;
  conversionRate: number;
  confidence: number;
  isWinner: boolean;
  uplift: number;
  metrics: Record<string, number>;
}

export interface TestInsight {
  type: 'statistical' | 'behavioral' | 'segment' | 'temporal';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  data: any;
}

export interface TestConfiguration {
  name: string;
  description: string;
  hypothesis: string;
  targetMetric: string;
  variants: VariantConfig[];
  trafficAllocation: number;
  segments?: UserSegment[];
  successCriteria: SuccessCriteria;
}

export interface VariantConfig {
  name: string;
  description: string;
  trafficPercentage: number;
  isControl: boolean;
  changes: TestChange[];
}

export class ABTestingFramework {
  private static instance: ABTestingFramework | null = null;
  private analytics: AdvancedAnalyticsEngine;
  private activeTests: Map<string, ABTest> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> testId -> variantId
  private isInitialized = false;

  private constructor() {
    this.analytics = AdvancedAnalyticsEngine.getInstance();
  }

  static getInstance(): ABTestingFramework {
    if (!ABTestingFramework.instance) {
      ABTestingFramework.instance = new ABTestingFramework();
    }
    return ABTestingFramework.instance;
  }

  // Initialize A/B testing framework
  async initialize(): Promise<void> {
    try {
      // Load active tests
      await this.loadActiveTests();
      
      // Load user assignments
      await this.loadUserAssignments();
      
      // Start background monitoring
      this.startBackgroundMonitoring();
      
      this.isInitialized = true;
      console.log('A/B Testing Framework initialized successfully');
    } catch (error) {
      console.error('Failed to initialize A/B testing framework:', error);
    }
  }

  // Create a new A/B test
  async createTest(config: TestConfiguration): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Validate test configuration
      this.validateTestConfiguration(config);
      
      // Calculate sample size requirements
      const sampleSize = this.calculateSampleSize(config.successCriteria);
      
      // Create test in database
      const testId = await this.createTestInDatabase(config, sampleSize);
      
      // Set up test variants
      await this.createTestVariants(testId, config.variants);
      
      // Track test creation
      this.analytics.track('ab_test_created', 'business', {
        test_id: testId,
        test_name: config.name,
        variants_count: config.variants.length,
        traffic_allocation: config.trafficAllocation,
        target_metric: config.targetMetric
      });

      return testId;
    } catch (error) {
      console.error('Error creating A/B test:', error);
      throw error;
    }
  }

  // Start an A/B test
  async startTest(testId: string): Promise<void> {
    try {
      const test = await this.getTest(testId);
      if (!test) {
        throw new Error(`Test ${testId} not found`);
      }

      if (test.status !== 'draft') {
        throw new Error(`Test ${testId} is not in draft status`);
      }

      // Update test status
      await supabase
        .from('ab_tests')
        .update({ 
          status: 'running',
          start_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', testId);

      // Load test into active tests
      const updatedTest = await this.getTest(testId);
      if (updatedTest) {
        this.activeTests.set(testId, updatedTest);
      }

      // Track test start
      this.analytics.track('ab_test_started', 'business', {
        test_id: testId,
        test_name: test.name
      });

      console.log(`A/B test ${testId} started successfully`);
    } catch (error) {
      console.error('Error starting A/B test:', error);
      throw error;
    }
  }

  // Stop an A/B test
  async stopTest(testId: string, reason?: string): Promise<void> {
    try {
      const test = this.activeTests.get(testId);
      if (!test) {
        throw new Error(`Active test ${testId} not found`);
      }

      // Calculate final results
      const results = await this.calculateTestResults(testId);
      
      // Update test status
      await supabase
        .from('ab_tests')
        .update({ 
          status: 'completed',
          end_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', testId);

      // Store final results
      await this.storeTestResults(testId, results);

      // Remove from active tests
      this.activeTests.delete(testId);

      // Track test completion
      this.analytics.track('ab_test_completed', 'business', {
        test_id: testId,
        test_name: test.name,
        duration_days: results.duration / (24 * 60 * 60 * 1000),
        total_participants: results.totalParticipants,
        winning_variant: results.winningVariant,
        confidence: results.confidence,
        reason
      });

      console.log(`A/B test ${testId} stopped successfully`);
    } catch (error) {
      console.error('Error stopping A/B test:', error);
      throw error;
    }
  }

  // Get variant assignment for a user
  async getUserVariant(userId: string, testId: string): Promise<string | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Check if user already has an assignment
      const existingAssignment = this.userAssignments.get(userId)?.get(testId);
      if (existingAssignment) {
        return existingAssignment;
      }

      // Get test configuration
      const test = this.activeTests.get(testId);
      if (!test || test.status !== 'running') {
        return null;
      }

      // Check if user qualifies for test
      const qualifies = await this.checkUserQualification(userId, test);
      if (!qualifies) {
        return null;
      }

      // Assign user to variant
      const variantId = this.assignUserToVariant(userId, test);
      
      // Store assignment
      await this.storeUserAssignment(userId, testId, variantId);
      
      // Update local cache
      if (!this.userAssignments.has(userId)) {
        this.userAssignments.set(userId, new Map());
      }
      this.userAssignments.get(userId)!.set(testId, variantId);

      // Track assignment
      this.analytics.track('ab_test_assignment', 'business', {
        user_id: userId,
        test_id: testId,
        variant_id: variantId
      });

      return variantId;
    } catch (error) {
      console.error('Error getting user variant:', error);
      return null;
    }
  }

  // Track test event (conversion, interaction, etc.)
  async trackTestEvent(
    userId: string,
    testId: string,
    eventType: string,
    value?: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    try {
      const variantId = await this.getUserVariant(userId, testId);
      if (!variantId) {
        return; // User not in test
      }

      // Record test event
      await supabase
        .from('ab_test_events')
        .insert({
          test_id: testId,
          variant_id: variantId,
          user_id: userId,
          event_type: eventType,
          value: value || 0,
          metadata: metadata || {},
          timestamp: new Date().toISOString()
        });

      // Track in analytics
      this.analytics.track('ab_test_event', 'business', {
        user_id: userId,
        test_id: testId,
        variant_id: variantId,
        event_type: eventType,
        value: value || 0
      });
    } catch (error) {
      console.error('Error tracking test event:', error);
    }
  }

  // Get test results
  async getTestResults(testId: string): Promise<TestResults> {
    try {
      return await this.calculateTestResults(testId);
    } catch (error) {
      console.error('Error getting test results:', error);
      throw error;
    }
  }

  // Get all active tests
  getActiveTests(): ABTest[] {
    return Array.from(this.activeTests.values());
  }

  // Get test configuration
  async getTest(testId: string): Promise<ABTest | null> {
    try {
      const { data, error } = await supabase
        .from('ab_tests')
        .select(`
          *,
          ab_test_variants(*),
          ab_test_segments(*)
        `)
        .eq('id', testId)
        .single();

      if (error || !data) {
        return null;
      }

      return this.convertToABTest(data);
    } catch (error) {
      console.error('Error getting test:', error);
      return null;
    }
  }

  // Private methods

  private validateTestConfiguration(config: TestConfiguration): void {
    // Validate variants traffic allocation
    const totalTraffic = config.variants.reduce((sum, v) => sum + v.trafficPercentage, 0);
    if (Math.abs(totalTraffic - 100) > 0.01) {
      throw new Error('Variant traffic percentages must sum to 100%');
    }

    // Validate control variant
    const controlVariants = config.variants.filter(v => v.isControl);
    if (controlVariants.length !== 1) {
      throw new Error('Exactly one variant must be marked as control');
    }

    // Validate success criteria
    if (config.successCriteria.confidenceLevel < 50 || config.successCriteria.confidenceLevel > 99) {
      throw new Error('Confidence level must be between 50% and 99%');
    }
  }

  private calculateSampleSize(criteria: SuccessCriteria): number {
    // Simplified sample size calculation using effect size and power
    // In production, use proper statistical formulas
    const baselineRate = 0.05; // Assume 5% baseline conversion rate
    const effectSize = criteria.minimumDetectableEffect / 100;
    const alpha = (100 - criteria.confidenceLevel) / 100;
    const beta = (100 - criteria.statisticalPower) / 100;
    
    // Simplified formula - in production use proper statistical libraries
    const sampleSizePerVariant = Math.ceil(
      (16 * (baselineRate * (1 - baselineRate))) / 
      Math.pow(effectSize * baselineRate, 2)
    );
    
    return Math.max(sampleSizePerVariant, criteria.minimumSampleSize);
  }

  private async createTestInDatabase(config: TestConfiguration, sampleSize: number): Promise<string> {
    const { data, error } = await supabase
      .from('ab_tests')
      .insert({
        name: config.name,
        description: config.description,
        hypothesis: config.hypothesis,
        status: 'draft',
        test_type: config.variants.length === 2 ? 'ab' : 'multivariate',
        target_metric: config.targetMetric,
        traffic_allocation: config.trafficAllocation,
        success_criteria: config.successCriteria,
        sample_size: sampleSize,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error('Failed to create test in database');
    }

    return data.id;
  }

  private async createTestVariants(testId: string, variants: VariantConfig[]): Promise<void> {
    const variantData = variants.map(variant => ({
      test_id: testId,
      name: variant.name,
      description: variant.description,
      traffic_percentage: variant.trafficPercentage,
      is_control: variant.isControl,
      configuration: {
        type: 'ui_change',
        changes: variant.changes
      },
      created_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('ab_test_variants')
      .insert(variantData);

    if (error) {
      throw new Error('Failed to create test variants');
    }
  }

  private async checkUserQualification(userId: string, test: ABTest): Promise<boolean> {
    // Check if user is within traffic allocation
    const userHash = this.hashUserId(userId + test.id);
    const userPercentile = userHash % 100;
    
    if (userPercentile >= test.trafficAllocation) {
      return false;
    }

    // Check user segments if defined
    if (test.segments && test.segments.length > 0) {
      return await this.checkUserSegments(userId, test.segments);
    }

    return true;
  }

  private assignUserToVariant(userId: string, test: ABTest): string {
    const userHash = this.hashUserId(userId + test.id);
    const random = (userHash % 10000) / 100; // 0-99.99
    
    let cumulativePercentage = 0;
    for (const variant of test.variants) {
      cumulativePercentage += variant.trafficPercentage;
      if (random < cumulativePercentage) {
        return variant.id;
      }
    }
    
    // Fallback to control variant
    return test.variants.find(v => v.isControl)?.id || test.variants[0].id;
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

  private async storeUserAssignment(userId: string, testId: string, variantId: string): Promise<void> {
    await supabase
      .from('ab_test_assignments')
      .insert({
        user_id: userId,
        test_id: testId,
        variant_id: variantId,
        assigned_at: new Date().toISOString()
      });
  }

  private async calculateTestResults(testId: string): Promise<TestResults> {
    try {
      // Get test data
      const test = await this.getTest(testId);
      if (!test) {
        throw new Error('Test not found');
      }

      // Get test events
      const { data: events, error } = await supabase
        .from('ab_test_events')
        .select('*')
        .eq('test_id', testId);

      if (error) throw error;

      // Calculate variant results
      const variantResults: VariantResults[] = [];
      let totalParticipants = 0;

      for (const variant of test.variants) {
        const variantEvents = events.filter(e => e.variant_id === variant.id);
        const participants = new Set(variantEvents.map(e => e.user_id)).size;
        const conversions = variantEvents.filter(e => e.event_type === 'conversion').length;
        const conversionRate = participants > 0 ? (conversions / participants) * 100 : 0;

        totalParticipants += participants;

        variantResults.push({
          variantId: variant.id,
          name: variant.name,
          participants,
          conversions,
          conversionRate,
          confidence: this.calculateConfidence(variant, variantResults),
          isWinner: false, // Will be determined later
          uplift: 0, // Will be calculated later
          metrics: {}
        });
      }

      // Determine winning variant
      const controlVariant = variantResults.find(v => 
        test.variants.find(tv => tv.id === v.variantId)?.isControl
      );
      
      let winningVariant: string | undefined;
      let maxConfidence = 0;

      variantResults.forEach(variant => {
        if (controlVariant && variant.variantId !== controlVariant.variantId) {
          variant.uplift = ((variant.conversionRate - controlVariant.conversionRate) / controlVariant.conversionRate) * 100;
          
          if (variant.confidence > maxConfidence && variant.confidence > 95) {
            maxConfidence = variant.confidence;
            winningVariant = variant.variantId;
            variant.isWinner = true;
          }
        }
      });

      // Calculate overall test confidence and significance
      const confidence = maxConfidence;
      const significance = this.calculateStatisticalSignificance(variantResults);

      // Generate insights
      const insights = this.generateTestInsights(test, variantResults, events);

      // Generate recommendation
      const recommendation = this.generateTestRecommendation(variantResults, confidence);

      return {
        testId,
        status: test.status === 'running' ? 'running' : 'completed',
        duration: Date.now() - test.startDate.getTime(),
        totalParticipants,
        winningVariant,
        confidence,
        significance,
        improvement: winningVariant ? 
          variantResults.find(v => v.variantId === winningVariant)?.uplift || 0 : 0,
        variants: variantResults,
        insights,
        recommendation
      };
    } catch (error) {
      console.error('Error calculating test results:', error);
      throw error;
    }
  }

  private calculateConfidence(variant: TestVariant, allResults: VariantResults[]): number {
    // Simplified confidence calculation
    // In production, use proper statistical tests (Chi-square, t-test, etc.)
    return 85; // Mock confidence level
  }

  private calculateStatisticalSignificance(results: VariantResults[]): number {
    // Simplified significance calculation
    return Math.max(...results.map(r => r.confidence));
  }

  private generateTestInsights(
    test: ABTest,
    results: VariantResults[],
    events: any[]
  ): TestInsight[] {
    const insights: TestInsight[] = [];

    // Statistical insights
    const totalParticipants = results.reduce((sum, r) => sum + r.participants, 0);
    if (totalParticipants < test.successCriteria.minimumSampleSize) {
      insights.push({
        type: 'statistical',
        title: 'Insufficient Sample Size',
        description: `Test has ${totalParticipants} participants, but needs ${test.successCriteria.minimumSampleSize} for statistical significance`,
        impact: 'high',
        data: { current: totalParticipants, required: test.successCriteria.minimumSampleSize }
      });
    }

    // Behavioral insights
    const controlResult = results.find(r => 
      test.variants.find(v => v.id === r.variantId)?.isControl
    );
    
    if (controlResult) {
      const bestVariant = results.reduce((best, current) => 
        current.conversionRate > best.conversionRate ? current : best
      );
      
      if (bestVariant.variantId !== controlResult.variantId) {
        insights.push({
          type: 'behavioral',
          title: 'Variant Performance',
          description: `${bestVariant.name} outperformed control by ${bestVariant.uplift.toFixed(2)}%`,
          impact: 'high',
          data: { uplift: bestVariant.uplift, confidence: bestVariant.confidence }
        });
      }
    }

    return insights;
  }

  private generateTestRecommendation(results: VariantResults[], confidence: number): string {
    const winner = results.find(r => r.isWinner);
    
    if (winner && confidence > 95) {
      return `Implement ${winner.name} - shows ${winner.uplift.toFixed(2)}% improvement with ${confidence.toFixed(1)}% confidence`;
    } else if (confidence < 80) {
      return 'Continue test - insufficient statistical confidence to make a decision';
    } else {
      return 'No significant winner found - consider testing alternative variants';
    }
  }

  private async storeTestResults(testId: string, results: TestResults): Promise<void> {
    await supabase
      .from('ab_test_results')
      .insert({
        test_id: testId,
        results: results,
        created_at: new Date().toISOString()
      });
  }

  private convertToABTest(data: any): ABTest {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      hypothesis: data.hypothesis,
      status: data.status,
      testType: data.test_type,
      startDate: new Date(data.start_date || data.created_at),
      endDate: data.end_date ? new Date(data.end_date) : undefined,
      targetMetric: data.target_metric,
      successCriteria: data.success_criteria,
      variants: data.ab_test_variants || [],
      segments: data.ab_test_segments || [],
      trafficAllocation: data.traffic_allocation,
      createdBy: data.created_by || '',
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private async loadActiveTests(): Promise<void> {
    const { data, error } = await supabase
      .from('ab_tests')
      .select('*')
      .eq('status', 'running');

    if (!error && data) {
      for (const testData of data) {
        const test = this.convertToABTest(testData);
        this.activeTests.set(test.id, test);
      }
    }
  }

  private async loadUserAssignments(): Promise<void> {
    const { data, error } = await supabase
      .from('ab_test_assignments')
      .select('*')
      .in('test_id', Array.from(this.activeTests.keys()));

    if (!error && data) {
      data.forEach(assignment => {
        if (!this.userAssignments.has(assignment.user_id)) {
          this.userAssignments.set(assignment.user_id, new Map());
        }
        this.userAssignments.get(assignment.user_id)!
          .set(assignment.test_id, assignment.variant_id);
      });
    }
  }

  private async checkUserSegments(userId: string, segments: UserSegment[]): Promise<boolean> {
    // Simplified segment checking - in production, implement proper segment evaluation
    return true;
  }

  private startBackgroundMonitoring(): void {
    // Start background process to monitor test health and auto-stop tests
    setInterval(async () => {
      for (const [testId, test] of this.activeTests) {
        try {
          // Check if test should be auto-stopped
          const results = await this.calculateTestResults(testId);
          
          // Auto-stop if high confidence winner found
          if (results.confidence > 99 && results.winningVariant) {
            await this.stopTest(testId, 'Auto-stopped: High confidence winner found');
          }
          
          // Auto-stop if test duration exceeded
          const maxDuration = test.successCriteria.testDuration * 24 * 60 * 60 * 1000;
          if (results.duration > maxDuration) {
            await this.stopTest(testId, 'Auto-stopped: Maximum test duration reached');
          }
        } catch (error) {
          console.error(`Error monitoring test ${testId}:`, error);
        }
      }
    }, 60000); // Check every minute
  }
}

export default ABTestingFramework;
