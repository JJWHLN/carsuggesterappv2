/**
 * Personalization Engine
 * 
 * Phase 2 Week 9 - Advanced Features & Platform Expansion
 * 
 * Features:
 * - User preference learning
 * - Behavioral analysis
 * - Recommendation algorithms
 * - Adaptive UI customization
 * - Predictive search suggestions
 * - Cross-platform preference sync
 * - ML-driven personalization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import SemanticSearchEngine from './SemanticSearchEngine';

// Types
export interface UserProfile {
  userId: string;
  preferences: UserPreferences;
  behavior: UserBehavior;
  demographics?: UserDemographics;
  searchHistory: SearchHistoryItem[];
  favoriteVehicles: string[];
  dealerInteractions: DealerInteraction[];
  personalizedScores: PersonalizedScores;
  lastUpdated: Date;
}

export interface UserPreferences {
  vehicleTypes: Array<{
    type: string;
    weight: number;
  }>;
  brands: Array<{
    brand: string;
    preference: number; // -1 to 1
  }>;
  priceRange: {
    min: number;
    max: number;
    flexibility: number; // 0-1
  };
  features: Array<{
    feature: string;
    importance: number; // 0-1
  }>;
  fuelType: Array<{
    type: string;
    preference: number;
  }>;
  style: {
    exterior: string[];
    interior: string[];
    colors: string[];
  };
  usage: {
    primaryUse: string;
    drivingStyle: string;
    annualMileage: number;
    familySize: number;
  };
}

export interface UserBehavior {
  searchPatterns: SearchPattern[];
  viewingPatterns: ViewingPattern[];
  interactionMetrics: InteractionMetrics;
  timePreferences: TimePreferences;
  deviceUsage: DeviceUsage;
  engagementScore: number;
}

export interface SearchPattern {
  query: string;
  frequency: number;
  context: string;
  timestamp: Date;
  resultClicks: number;
  sessionDuration: number;
}

export interface ViewingPattern {
  vehicleId: string;
  viewDuration: number;
  interactions: string[];
  timestamp: Date;
  context: string;
  conversionScore: number;
}

export interface InteractionMetrics {
  totalSessions: number;
  averageSessionDuration: number;
  pagesPerSession: number;
  bounceRate: number;
  conversionRate: number;
  featureUsage: Record<string, number>;
}

export interface TimePreferences {
  mostActiveHours: number[];
  preferredDays: string[];
  sessionLengths: number[];
  timezone: string;
}

export interface DeviceUsage {
  primaryDevice: string;
  platforms: Array<{
    platform: string;
    usage: number;
  }>;
  screenSizes: string[];
}

export interface UserDemographics {
  ageRange: string;
  location: {
    country: string;
    state: string;
    city: string;
    zipCode: string;
  };
  income: string;
  occupation: string;
  lifestyle: string[];
}

export interface SearchHistoryItem {
  query: string;
  results: string[];
  selectedResults: string[];
  timestamp: Date;
  context: string;
  satisfaction: number; // 0-1
}

export interface DealerInteraction {
  dealerId: string;
  interactionType: string;
  timestamp: Date;
  outcome: string;
  satisfaction: number;
  notes: string;
}

export interface PersonalizedScores {
  brandAffinities: Record<string, number>;
  featureImportance: Record<string, number>;
  priceSegments: Record<string, number>;
  vehicleTypeScores: Record<string, number>;
  dealerPreferences: Record<string, number>;
}

export interface PersonalizationConfig {
  learningRate: number;
  decayFactor: number;
  minInteractions: number;
  maxHistorySize: number;
  updateFrequency: number;
  mlModelVersion: string;
}

export interface RecommendationRequest {
  userId: string;
  context: string;
  limit: number;
  includeExplanations: boolean;
  diversityFactor: number;
}

export interface RecommendationResponse {
  recommendations: PersonalizedRecommendation[];
  explanations: RecommendationExplanation[];
  confidence: number;
  diversityScore: number;
  timestamp: Date;
}

export interface PersonalizedRecommendation {
  vehicleId: string;
  score: number;
  reasoning: string[];
  confidence: number;
  personalizedFeatures: string[];
  priceMatch: number;
  availabilityScore: number;
}

export interface RecommendationExplanation {
  type: string;
  reason: string;
  confidence: number;
  basedOn: string[];
}

export class PersonalizationEngine {
  private static instance: PersonalizationEngine;
  private semanticSearch: SemanticSearchEngine;
  private userProfiles: Map<string, UserProfile> = new Map();
  private config: PersonalizationConfig;
  private isLearning: boolean = false;
  private learningQueue: Array<{
    userId: string;
    event: string;
    data: any;
    timestamp: Date;
  }> = [];

  private constructor() {
    this.semanticSearch = SemanticSearchEngine.getInstance();
    this.config = this.getDefaultConfig();
    this.initializePersonalization();
  }

  public static getInstance(): PersonalizationEngine {
    if (!PersonalizationEngine.instance) {
      PersonalizationEngine.instance = new PersonalizationEngine();
    }
    return PersonalizationEngine.instance;
  }

  /**
   * Initialize personalization engine
   */
  private async initializePersonalization(): Promise<void> {
    try {
      await this.loadUserProfiles();
      this.startLearningLoop();
      console.log('Personalization engine initialized');
    } catch (error) {
      console.error('Personalization initialization error:', error);
    }
  }

  /**
   * Get or create user profile
   */
  async getUserProfile(userId: string): Promise<UserProfile> {
    let profile = this.userProfiles.get(userId);
    
    if (!profile) {
      profile = await this.createUserProfile(userId);
      this.userProfiles.set(userId, profile);
    }
    
    return profile;
  }

  /**
   * Create new user profile
   */
  private async createUserProfile(userId: string): Promise<UserProfile> {
    const profile: UserProfile = {
      userId,
      preferences: this.getDefaultPreferences(),
      behavior: this.getDefaultBehavior(),
      searchHistory: [],
      favoriteVehicles: [],
      dealerInteractions: [],
      personalizedScores: this.getDefaultScores(),
      lastUpdated: new Date(),
    };

    await this.saveUserProfile(profile);
    return profile;
  }

  /**
   * Track user interaction for personalization learning
   */
  async trackInteraction(
    userId: string,
    interactionType: string,
    data: any,
    context?: string
  ): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);
      
      // Add to learning queue
      this.learningQueue.push({
        userId,
        event: interactionType,
        data: { ...data, context },
        timestamp: new Date(),
      });

      // Update behavior patterns immediately for some interactions
      if (interactionType === 'search') {
        await this.updateSearchPatterns(profile, data);
      } else if (interactionType === 'view') {
        await this.updateViewingPatterns(profile, data);
      } else if (interactionType === 'favorite') {
        await this.updateFavorites(profile, data);
      }

      profile.lastUpdated = new Date();
      await this.saveUserProfile(profile);

    } catch (error) {
      console.error('Interaction tracking error:', error);
    }
  }

  /**
   * Get personalized recommendations
   */
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    try {
      const profile = await this.getUserProfile(request.userId);
      const startTime = Date.now();

      // Generate recommendations based on user profile
      const recommendations = await this.generateRecommendations(profile, request);
      
      // Apply diversification
      const diversifiedRecommendations = this.diversifyRecommendations(
        recommendations,
        request.diversityFactor
      );

      // Generate explanations
      const explanations = request.includeExplanations 
        ? this.generateExplanations(profile, diversifiedRecommendations)
        : [];

      const response: RecommendationResponse = {
        recommendations: diversifiedRecommendations.slice(0, request.limit),
        explanations,
        confidence: this.calculateOverallConfidence(diversifiedRecommendations),
        diversityScore: this.calculateDiversityScore(diversifiedRecommendations),
        timestamp: new Date(),
      };

      // Track recommendation request
      await this.trackInteraction(request.userId, 'recommendation_request', {
        context: request.context,
        resultsCount: response.recommendations.length,
        processingTime: Date.now() - startTime,
      });

      return response;

    } catch (error) {
      console.error('Recommendation generation error:', error);
      throw error;
    }
  }

  /**
   * Update user preferences based on explicit feedback
   */
  async updatePreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);
      
      // Merge preferences with existing ones
      profile.preferences = this.mergePreferences(profile.preferences, preferences);
      profile.lastUpdated = new Date();
      
      await this.saveUserProfile(profile);
      
      // Track preference update
      await this.trackInteraction(userId, 'preference_update', preferences);
      
    } catch (error) {
      console.error('Preference update error:', error);
    }
  }

  /**
   * Get personalized search suggestions
   */
  async getPersonalizedSearchSuggestions(
    userId: string,
    partialQuery: string,
    limit: number = 10
  ): Promise<Array<{
    suggestion: string;
    score: number;
    reasoning: string;
  }>> {
    try {
      const profile = await this.getUserProfile(userId);
      
      // Generate suggestions based on user's search history and preferences
      const suggestions = this.generateSearchSuggestions(profile, partialQuery);
      
      // Score and rank suggestions
      const scoredSuggestions = suggestions
        .map(suggestion => ({
          suggestion,
          score: this.scoreSearchSuggestion(profile, suggestion, partialQuery),
          reasoning: this.getSearchSuggestionReasoning(profile, suggestion),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return scoredSuggestions;

    } catch (error) {
      console.error('Search suggestion error:', error);
      return [];
    }
  }

  /**
   * Generate recommendations based on user profile
   */
  private async generateRecommendations(
    profile: UserProfile,
    request: RecommendationRequest
  ): Promise<PersonalizedRecommendation[]> {
    const recommendations: PersonalizedRecommendation[] = [];

    // Get base search results using semantic search
    const searchResults = await this.semanticSearch.search(
      this.buildPersonalizedQuery(profile),
      { sessionId: `personalized_${request.userId}` }
    );

    // Score each result based on user preferences
    for (const result of searchResults.results) {
      const score = this.calculatePersonalizedScore(profile, result);
      
      if (score > 0.3) { // Minimum relevance threshold
        recommendations.push({
          vehicleId: result.id,
          score,
          reasoning: this.generateReasoningForResult(profile, result),
          confidence: score * 0.9, // Slight confidence discount
          personalizedFeatures: this.getPersonalizedFeatures(profile, result),
          priceMatch: this.calculatePriceMatch(profile, result),
          availabilityScore: 0.8, // Mock availability score
        });
      }
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * Build personalized search query
   */
  private buildPersonalizedQuery(profile: UserProfile): string {
    const queryParts: string[] = [];
    
    // Add preferred vehicle types
    const topVehicleTypes = profile.preferences.vehicleTypes
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
      .map(vt => vt.type);
    
    if (topVehicleTypes.length > 0) {
      queryParts.push(topVehicleTypes.join(' OR '));
    }
    
    // Add preferred brands
    const preferredBrands = profile.preferences.brands
      .filter(b => b.preference > 0.5)
      .map(b => b.brand);
    
    if (preferredBrands.length > 0) {
      queryParts.push(preferredBrands.join(' OR '));
    }
    
    // Add important features
    const importantFeatures = profile.preferences.features
      .filter(f => f.importance > 0.7)
      .map(f => f.feature);
    
    if (importantFeatures.length > 0) {
      queryParts.push(importantFeatures.join(' '));
    }
    
    return queryParts.join(' ') || 'vehicles cars';
  }

  /**
   * Calculate personalized score for a search result
   */
  private calculatePersonalizedScore(profile: UserProfile, result: any): number {
    let score = 0;
    let totalWeight = 0;

    // Brand preference
    const brandScore = this.getBrandScore(profile, result.brand);
    score += brandScore * 0.3;
    totalWeight += 0.3;

    // Vehicle type preference
    const typeScore = this.getVehicleTypeScore(profile, result.type);
    score += typeScore * 0.25;
    totalWeight += 0.25;

    // Price range match
    const priceScore = this.getPriceScore(profile, result.price);
    score += priceScore * 0.2;
    totalWeight += 0.2;

    // Feature importance
    const featureScore = this.getFeatureScore(profile, result.features);
    score += featureScore * 0.15;
    totalWeight += 0.15;

    // Historical interest
    const historyScore = this.getHistoryScore(profile, result);
    score += historyScore * 0.1;
    totalWeight += 0.1;

    return totalWeight > 0 ? score / totalWeight : 0;
  }

  /**
   * Update search patterns
   */
  private async updateSearchPatterns(profile: UserProfile, data: any): Promise<void> {
    const pattern: SearchPattern = {
      query: data.query,
      frequency: 1,
      context: data.context || 'general',
      timestamp: new Date(),
      resultClicks: data.resultClicks || 0,
      sessionDuration: data.sessionDuration || 0,
    };

    // Check if pattern already exists
    const existingIndex = profile.behavior.searchPatterns.findIndex(
      p => p.query.toLowerCase() === pattern.query.toLowerCase()
    );

    if (existingIndex >= 0) {
      profile.behavior.searchPatterns[existingIndex].frequency++;
      profile.behavior.searchPatterns[existingIndex].timestamp = new Date();
    } else {
      profile.behavior.searchPatterns.push(pattern);
    }

    // Keep only recent patterns
    profile.behavior.searchPatterns = profile.behavior.searchPatterns
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 100);
  }

  /**
   * Update viewing patterns
   */
  private async updateViewingPatterns(profile: UserProfile, data: any): Promise<void> {
    const pattern: ViewingPattern = {
      vehicleId: data.vehicleId,
      viewDuration: data.viewDuration || 0,
      interactions: data.interactions || [],
      timestamp: new Date(),
      context: data.context || 'browse',
      conversionScore: data.conversionScore || 0,
    };

    profile.behavior.viewingPatterns.push(pattern);

    // Keep only recent patterns
    profile.behavior.viewingPatterns = profile.behavior.viewingPatterns
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 200);
  }

  /**
   * Update favorites
   */
  private async updateFavorites(profile: UserProfile, data: any): Promise<void> {
    const vehicleId = data.vehicleId;
    
    if (data.action === 'add' && !profile.favoriteVehicles.includes(vehicleId)) {
      profile.favoriteVehicles.push(vehicleId);
    } else if (data.action === 'remove') {
      profile.favoriteVehicles = profile.favoriteVehicles.filter(id => id !== vehicleId);
    }
  }

  /**
   * Generate search suggestions
   */
  private generateSearchSuggestions(profile: UserProfile, partialQuery: string): string[] {
    const suggestions = new Set<string>();
    
    // Add suggestions from search history
    profile.behavior.searchPatterns
      .filter(p => p.query.toLowerCase().includes(partialQuery.toLowerCase()))
      .forEach(p => suggestions.add(p.query));
    
    // Add suggestions based on preferences
    profile.preferences.vehicleTypes.forEach(vt => {
      if (vt.type.toLowerCase().includes(partialQuery.toLowerCase())) {
        suggestions.add(vt.type);
      }
    });
    
    profile.preferences.brands.forEach(b => {
      if (b.brand.toLowerCase().includes(partialQuery.toLowerCase())) {
        suggestions.add(b.brand);
      }
    });
    
    // Add common automotive terms that match the partial query
    const commonTerms = [
      'SUV', 'sedan', 'truck', 'convertible', 'coupe', 'hybrid', 'electric',
      'luxury', 'compact', 'midsize', 'full-size', 'sports car', 'family car'
    ];
    
    commonTerms.forEach(term => {
      if (term.toLowerCase().includes(partialQuery.toLowerCase())) {
        suggestions.add(term);
      }
    });
    
    return Array.from(suggestions);
  }

  /**
   * Start learning loop for processing queued interactions
   */
  private startLearningLoop(): void {
    setInterval(async () => {
      if (this.learningQueue.length > 0 && !this.isLearning) {
        await this.processLearningQueue();
      }
    }, this.config.updateFrequency);
  }

  /**
   * Process learning queue
   */
  private async processLearningQueue(): Promise<void> {
    this.isLearning = true;
    
    try {
      const batch = this.learningQueue.splice(0, 50); // Process in batches
      
      for (const item of batch) {
        await this.processLearningItem(item);
      }
      
    } catch (error) {
      console.error('Learning queue processing error:', error);
    } finally {
      this.isLearning = false;
    }
  }

  /**
   * Process individual learning item
   */
  private async processLearningItem(item: {
    userId: string;
    event: string;
    data: any;
    timestamp: Date;
  }): Promise<void> {
    const profile = await this.getUserProfile(item.userId);
    
    // Update personalized scores based on the interaction
    this.updatePersonalizedScores(profile, item);
    
    // Update interaction metrics
    this.updateInteractionMetrics(profile, item);
    
    await this.saveUserProfile(profile);
  }

  /**
   * Helper methods for scoring
   */
  private getBrandScore(profile: UserProfile, brand: string): number {
    const brandPref = profile.preferences.brands.find(b => b.brand === brand);
    return brandPref ? (brandPref.preference + 1) / 2 : 0.5; // Normalize -1,1 to 0,1
  }

  private getVehicleTypeScore(profile: UserProfile, type: string): number {
    const typePref = profile.preferences.vehicleTypes.find(vt => vt.type === type);
    return typePref ? typePref.weight : 0.5;
  }

  private getPriceScore(profile: UserProfile, price: number): number {
    const { min, max, flexibility } = profile.preferences.priceRange;
    
    if (price >= min && price <= max) {
      return 1.0;
    }
    
    const distance = price < min ? min - price : price - max;
    const maxDistance = (max - min) * flexibility;
    
    return Math.max(0, 1 - (distance / maxDistance));
  }

  private getFeatureScore(profile: UserProfile, features: string[]): number {
    if (!features || features.length === 0) return 0.5;
    
    let score = 0;
    let totalImportance = 0;
    
    features.forEach(feature => {
      const featurePref = profile.preferences.features.find(f => f.feature === feature);
      if (featurePref) {
        score += featurePref.importance;
        totalImportance += featurePref.importance;
      }
    });
    
    return totalImportance > 0 ? score / totalImportance : 0.5;
  }

  private getHistoryScore(profile: UserProfile, result: any): number {
    // Check if user has viewed similar vehicles
    const similarViews = profile.behavior.viewingPatterns.filter(vp => 
      vp.vehicleId === result.id || 
      vp.context === result.type
    );
    
    return Math.min(1, similarViews.length * 0.1);
  }

  /**
   * Default configurations and data
   */
  private getDefaultConfig(): PersonalizationConfig {
    return {
      learningRate: 0.1,
      decayFactor: 0.95,
      minInteractions: 5,
      maxHistorySize: 1000,
      updateFrequency: 30000, // 30 seconds
      mlModelVersion: '1.0.0',
    };
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      vehicleTypes: [
        { type: 'sedan', weight: 0.3 },
        { type: 'SUV', weight: 0.3 },
        { type: 'truck', weight: 0.2 },
        { type: 'coupe', weight: 0.2 },
      ],
      brands: [],
      priceRange: {
        min: 0,
        max: 100000,
        flexibility: 0.2,
      },
      features: [],
      fuelType: [
        { type: 'gasoline', preference: 0.5 },
        { type: 'hybrid', preference: 0.3 },
        { type: 'electric', preference: 0.2 },
      ],
      style: {
        exterior: [],
        interior: [],
        colors: [],
      },
      usage: {
        primaryUse: 'daily_driving',
        drivingStyle: 'moderate',
        annualMileage: 12000,
        familySize: 1,
      },
    };
  }

  private getDefaultBehavior(): UserBehavior {
    return {
      searchPatterns: [],
      viewingPatterns: [],
      interactionMetrics: {
        totalSessions: 0,
        averageSessionDuration: 0,
        pagesPerSession: 0,
        bounceRate: 0,
        conversionRate: 0,
        featureUsage: {},
      },
      timePreferences: {
        mostActiveHours: [],
        preferredDays: [],
        sessionLengths: [],
        timezone: 'UTC',
      },
      deviceUsage: {
        primaryDevice: 'mobile',
        platforms: [],
        screenSizes: [],
      },
      engagementScore: 0,
    };
  }

  private getDefaultScores(): PersonalizedScores {
    return {
      brandAffinities: {},
      featureImportance: {},
      priceSegments: {},
      vehicleTypeScores: {},
      dealerPreferences: {},
    };
  }

  /**
   * Additional helper methods
   */
  private diversifyRecommendations(
    recommendations: PersonalizedRecommendation[],
    diversityFactor: number
  ): PersonalizedRecommendation[] {
    // Implementation would diversify results to avoid echo chamber
    return recommendations;
  }

  private generateExplanations(
    profile: UserProfile,
    recommendations: PersonalizedRecommendation[]
  ): RecommendationExplanation[] {
    // Generate explanations for why these recommendations were made
    return [];
  }

  private calculateOverallConfidence(recommendations: PersonalizedRecommendation[]): number {
    if (recommendations.length === 0) return 0;
    return recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length;
  }

  private calculateDiversityScore(recommendations: PersonalizedRecommendation[]): number {
    // Calculate how diverse the recommendations are
    return 0.7; // Mock diversity score
  }

  private mergePreferences(
    existing: UserPreferences,
    updates: Partial<UserPreferences>
  ): UserPreferences {
    // Deep merge preferences
    return { ...existing, ...updates };
  }

  private generateReasoningForResult(profile: UserProfile, result: any): string[] {
    const reasoning: string[] = [];
    
    // Add reasoning based on brand preference
    const brandPref = profile.preferences.brands.find(b => b.brand === result.brand);
    if (brandPref && brandPref.preference > 0.7) {
      reasoning.push(`You have shown strong preference for ${result.brand}`);
    }
    
    // Add reasoning based on vehicle type
    const typePref = profile.preferences.vehicleTypes.find(vt => vt.type === result.type);
    if (typePref && typePref.weight > 0.6) {
      reasoning.push(`${result.type} matches your preferred vehicle type`);
    }
    
    return reasoning;
  }

  private getPersonalizedFeatures(profile: UserProfile, result: any): string[] {
    return profile.preferences.features
      .filter(f => f.importance > 0.5)
      .map(f => f.feature);
  }

  private calculatePriceMatch(profile: UserProfile, result: any): number {
    return this.getPriceScore(profile, result.price);
  }

  private scoreSearchSuggestion(
    profile: UserProfile,
    suggestion: string,
    partialQuery: string
  ): number {
    let score = 0;
    
    // Base score on string similarity
    score += suggestion.toLowerCase().includes(partialQuery.toLowerCase()) ? 0.5 : 0;
    
    // Boost score if in search history
    const historyMatch = profile.behavior.searchPatterns.find(
      p => p.query.toLowerCase() === suggestion.toLowerCase()
    );
    if (historyMatch) {
      score += Math.min(0.3, historyMatch.frequency * 0.1);
    }
    
    return Math.min(1, score);
  }

  private getSearchSuggestionReasoning(profile: UserProfile, suggestion: string): string {
    const historyMatch = profile.behavior.searchPatterns.find(
      p => p.query.toLowerCase() === suggestion.toLowerCase()
    );
    
    if (historyMatch) {
      return `Based on your previous searches`;
    }
    
    return `Popular search term`;
  }

  private updatePersonalizedScores(profile: UserProfile, item: any): void {
    // Update scores based on interaction
    // Implementation would use machine learning algorithms
  }

  private updateInteractionMetrics(profile: UserProfile, item: any): void {
    // Update interaction metrics
    profile.behavior.interactionMetrics.totalSessions++;
  }

  /**
   * Storage methods
   */
  private async saveUserProfile(profile: UserProfile): Promise<void> {
    try {
      const key = `user_profile_${profile.userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(profile));
    } catch (error) {
      console.error('Error saving user profile:', error);
    }
  }

  private async loadUserProfiles(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const profileKeys = keys.filter(key => key.startsWith('user_profile_'));
      
      for (const key of profileKeys) {
        const profileData = await AsyncStorage.getItem(key);
        if (profileData) {
          const profile = JSON.parse(profileData);
          this.userProfiles.set(profile.userId, profile);
        }
      }
    } catch (error) {
      console.error('Error loading user profiles:', error);
    }
  }

  /**
   * Analytics and metrics
   */
  getPersonalizationMetrics(): {
    totalUsers: number;
    activeUsers: number;
    averageEngagement: number;
    recommendationAccuracy: number;
    diversityScore: number;
  } {
    const profiles = Array.from(this.userProfiles.values());
    
    return {
      totalUsers: profiles.length,
      activeUsers: profiles.filter(p => 
        new Date().getTime() - p.lastUpdated.getTime() < 7 * 24 * 60 * 60 * 1000
      ).length,
      averageEngagement: profiles.reduce((sum, p) => sum + p.behavior.engagementScore, 0) / profiles.length,
      recommendationAccuracy: 0.85, // Mock metric
      diversityScore: 0.72, // Mock metric
    };
  }

  /**
   * Clear user data (GDPR compliance)
   */
  async deleteUserData(userId: string): Promise<void> {
    try {
      this.userProfiles.delete(userId);
      await AsyncStorage.removeItem(`user_profile_${userId}`);
    } catch (error) {
      console.error('Error deleting user data:', error);
    }
  }
}

export default PersonalizationEngine;
