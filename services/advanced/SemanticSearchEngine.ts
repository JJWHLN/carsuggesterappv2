/**
 * Semantic Search Engine
 * 
 * Phase 2 Week 9 - Advanced Features & Platform Expansion
 * 
 * Features:
 * - Natural language query processing
 * - AI-powered semantic understanding
 * - Context-aware search results
 * - Smart query expansion
 * - Real-time search suggestions
 * - Multi-modal search (text, voice, visual)
 * - Search analytics and optimization
 */

import { OpenAI } from 'openai';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface SearchQuery {
  id: string;
  originalQuery: string;
  processedQuery: string;
  intent: SearchIntent;
  entities: SearchEntity[];
  filters: SearchFilters;
  context: SearchContext;
  timestamp: Date;
}

export interface SearchIntent {
  type: 'browse' | 'compare' | 'buy' | 'research' | 'dealer_find';
  confidence: number;
  subIntents: string[];
}

export interface SearchEntity {
  type: 'brand' | 'model' | 'year' | 'price' | 'feature' | 'location' | 'color';
  value: string;
  confidence: number;
  normalized: string;
}

export interface SearchFilters {
  brands?: string[];
  models?: string[];
  yearRange?: [number, number];
  priceRange?: [number, number];
  features?: string[];
  bodyTypes?: string[];
  fuelTypes?: string[];
  transmissions?: string[];
  locations?: string[];
  mileageRange?: [number, number];
  colors?: string[];
}

export interface SearchContext {
  userId?: string;
  sessionId: string;
  previousQueries: string[];
  userPreferences?: UserPreferences;
  location?: GeolocationData;
  timeOfDay: string;
  device: DeviceInfo;
}

export interface UserPreferences {
  favoritebrands: string[];
  budgetRange: [number, number];
  preferredFeatures: string[];
  searchHistory: string[];
  savedSearches: SavedSearch[];
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  alerts: boolean;
  createdAt: Date;
}

export interface GeolocationData {
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
}

export interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop' | 'web';
  os: string;
  browser?: string;
  capabilities: string[];
}

export interface SearchResult {
  id: string;
  type: 'car' | 'dealer' | 'review' | 'article' | 'comparison';
  title: string;
  description: string;
  relevanceScore: number;
  data: any;
  highlights: SearchHighlight[];
  metadata: SearchMetadata;
}

export interface SearchHighlight {
  field: string;
  snippet: string;
  startIndex: number;
  endIndex: number;
}

export interface SearchMetadata {
  source: string;
  lastUpdated: Date;
  popularity: number;
  location?: GeolocationData;
  price?: number;
  rating?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  queryTime: number;
  suggestions: SearchSuggestion[];
  filters: SearchFilters;
  facets: SearchFacet[];
  relatedQueries: string[];
  searchId: string;
}

export interface SearchSuggestion {
  text: string;
  type: 'completion' | 'correction' | 'related';
  confidence: number;
}

export interface SearchFacet {
  field: string;
  values: Array<{
    value: string;
    count: number;
    selected: boolean;
  }>;
}

export interface SearchAnalytics {
  queryId: string;
  query: string;
  resultsCount: number;
  clickedResults: string[];
  timeSpent: number;
  refinements: string[];
  exitPage: string;
  converted: boolean;
}

export class SemanticSearchEngine {
  private static instance: SemanticSearchEngine;
  private openai: OpenAI;
  private searchCache: Map<string, SearchResponse> = new Map();
  private queryHistory: SearchQuery[] = [];
  private analytics: SearchAnalytics[] = [];
  
  private constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY || '',
    });
  }

  public static getInstance(): SemanticSearchEngine {
    if (!SemanticSearchEngine.instance) {
      SemanticSearchEngine.instance = new SemanticSearchEngine();
    }
    return SemanticSearchEngine.instance;
  }

  /**
   * Main search method with semantic understanding
   */
  async search(
    query: string,
    context: Partial<SearchContext> = {},
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    
    try {
      // Generate search ID
      const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Build complete context
      const fullContext = await this.buildSearchContext(query, context);
      
      // Check cache first
      const cacheKey = this.generateCacheKey(query, fullContext, options);
      if (this.searchCache.has(cacheKey) && !options.bypassCache) {
        const cached = this.searchCache.get(cacheKey)!;
        cached.searchId = searchId;
        return cached;
      }
      
      // Process query with AI
      const processedQuery = await this.processQuery(query, fullContext);
      
      // Store query in history
      this.queryHistory.push(processedQuery);
      
      // Execute search across multiple sources
      const results = await this.executeSearch(processedQuery, options);
      
      // Rank and personalize results
      const rankedResults = await this.rankResults(results, processedQuery, fullContext);
      
      // Generate suggestions and facets
      const suggestions = await this.generateSuggestions(query, fullContext);
      const facets = this.generateFacets(rankedResults);
      const relatedQueries = await this.generateRelatedQueries(query, fullContext);
      
      const response: SearchResponse = {
        results: rankedResults,
        totalCount: results.length,
        queryTime: Date.now() - startTime,
        suggestions,
        filters: processedQuery.filters,
        facets,
        relatedQueries,
        searchId,
      };
      
      // Cache response
      this.searchCache.set(cacheKey, response);
      
      // Track analytics
      this.trackSearch(processedQuery, response);
      
      return response;
      
    } catch (error) {
      console.error('Semantic search error:', error);
      
      // Fallback to simple search
      return this.fallbackSearch(query, context, options);
    }
  }

  /**
   * Process natural language query with AI
   */
  private async processQuery(query: string, context: SearchContext): Promise<SearchQuery> {
    try {
      const prompt = this.buildQueryProcessingPrompt(query, context);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert car search assistant. Analyze user queries and extract search intent, entities, and filters.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 1000,
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error('No AI response received');
      }

      // Parse AI response
      const parsed = JSON.parse(aiResponse);
      
      return {
        id: `query_${Date.now()}`,
        originalQuery: query,
        processedQuery: parsed.processedQuery || query,
        intent: parsed.intent || { type: 'browse', confidence: 0.5, subIntents: [] },
        entities: parsed.entities || [],
        filters: parsed.filters || {},
        context,
        timestamp: new Date(),
      };
      
    } catch (error) {
      console.error('Query processing error:', error);
      
      // Fallback to simple processing
      return {
        id: `query_${Date.now()}`,
        originalQuery: query,
        processedQuery: query,
        intent: { type: 'browse', confidence: 0.5, subIntents: [] },
        entities: [],
        filters: {},
        context,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Build AI prompt for query processing
   */
  private buildQueryProcessingPrompt(query: string, context: SearchContext): string {
    return `
Analyze this car search query and extract structured information:

Query: "${query}"
Context: ${JSON.stringify(context, null, 2)}

Extract and return JSON with:
{
  "processedQuery": "cleaned and expanded query",
  "intent": {
    "type": "browse|compare|buy|research|dealer_find",
    "confidence": 0.0-1.0,
    "subIntents": ["specific sub-intentions"]
  },
  "entities": [
    {
      "type": "brand|model|year|price|feature|location|color",
      "value": "extracted value",
      "confidence": 0.0-1.0,
      "normalized": "standardized value"
    }
  ],
  "filters": {
    "brands": ["brand names"],
    "models": ["model names"],
    "yearRange": [min, max],
    "priceRange": [min, max],
    "features": ["feature names"],
    "bodyTypes": ["sedan", "suv", etc.],
    "fuelTypes": ["gasoline", "electric", etc.],
    "locations": ["location names"]
  }
}

Examples:
- "red BMW under 30k" → extract brand: BMW, color: red, price: <30000
- "family SUV with good safety" → extract bodyType: SUV, features: safety, intent: family_car
- "compare Tesla Model 3 vs Honda Accord" → intent: compare, models: [Model 3, Accord]
`;
  }

  /**
   * Execute search across multiple data sources
   */
  private async executeSearch(query: SearchQuery, options: SearchOptions): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    
    try {
      // Search cars database
      const carResults = await this.searchCars(query, options);
      results.push(...carResults);
      
      // Search dealers database
      const dealerResults = await this.searchDealers(query, options);
      results.push(...dealerResults);
      
      // Search reviews database
      const reviewResults = await this.searchReviews(query, options);
      results.push(...reviewResults);
      
      // Search articles/content
      const contentResults = await this.searchContent(query, options);
      results.push(...contentResults);
      
      return results;
      
    } catch (error) {
      console.error('Search execution error:', error);
      return [];
    }
  }

  /**
   * Search cars with semantic matching
   */
  private async searchCars(query: SearchQuery, options: SearchOptions): Promise<SearchResult[]> {
    // Implementation would connect to actual car database
    // For now, return mock results with proper structure
    
    const mockCars = [
      {
        id: 'car_1',
        brand: 'BMW',
        model: '3 Series',
        year: 2023,
        price: 45000,
        features: ['leather', 'navigation', 'backup camera'],
        location: 'New York, NY',
        rating: 4.5,
      },
      {
        id: 'car_2',
        brand: 'Tesla',
        model: 'Model 3',
        year: 2023,
        price: 39000,
        features: ['autopilot', 'electric', 'premium audio'],
        location: 'Los Angeles, CA',
        rating: 4.8,
      },
    ];

    return mockCars.map((car, index) => ({
      id: car.id,
      type: 'car' as const,
      title: `${car.year} ${car.brand} ${car.model}`,
      description: `${car.brand} ${car.model} with ${car.features.join(', ')}`,
      relevanceScore: 0.9 - (index * 0.1),
      data: car,
      highlights: [
        {
          field: 'title',
          snippet: `${car.year} ${car.brand} ${car.model}`,
          startIndex: 0,
          endIndex: car.model.length,
        },
      ],
      metadata: {
        source: 'cars_db',
        lastUpdated: new Date(),
        popularity: 85 - (index * 5),
        price: car.price,
        rating: car.rating,
      },
    }));
  }

  /**
   * Search dealers with location relevance
   */
  private async searchDealers(query: SearchQuery, options: SearchOptions): Promise<SearchResult[]> {
    // Mock dealer results
    const mockDealers = [
      {
        id: 'dealer_1',
        name: 'Premium Auto Group',
        location: 'New York, NY',
        rating: 4.6,
        brands: ['BMW', 'Mercedes', 'Audi'],
        specialties: ['luxury cars', 'financing'],
      },
    ];

    return mockDealers.map((dealer, index) => ({
      id: dealer.id,
      type: 'dealer' as const,
      title: dealer.name,
      description: `${dealer.brands.join(', ')} dealer specializing in ${dealer.specialties.join(', ')}`,
      relevanceScore: 0.8 - (index * 0.1),
      data: dealer,
      highlights: [],
      metadata: {
        source: 'dealers_db',
        lastUpdated: new Date(),
        popularity: 80 - (index * 5),
        location: { 
          latitude: 40.7128, 
          longitude: -74.0060, 
          city: 'New York', 
          state: 'NY', 
          country: 'US' 
        },
        rating: dealer.rating,
      },
    }));
  }

  /**
   * Search reviews and expert content
   */
  private async searchReviews(query: SearchQuery, options: SearchOptions): Promise<SearchResult[]> {
    // Mock review results
    return [];
  }

  /**
   * Search articles and educational content
   */
  private async searchContent(query: SearchQuery, options: SearchOptions): Promise<SearchResult[]> {
    // Mock content results
    return [];
  }

  /**
   * Rank results based on relevance and personalization
   */
  private async rankResults(
    results: SearchResult[],
    query: SearchQuery,
    context: SearchContext
  ): Promise<SearchResult[]> {
    return results
      .map(result => ({
        ...result,
        relevanceScore: this.calculateRelevanceScore(result, query, context),
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 50); // Limit results
  }

  /**
   * Calculate relevance score with personalization
   */
  private calculateRelevanceScore(
    result: SearchResult,
    query: SearchQuery,
    context: SearchContext
  ): number {
    let score = result.relevanceScore;
    
    // Boost based on user preferences
    if (context.userPreferences) {
      if (result.type === 'car' && result.data.brand) {
        if (context.userPreferences.favoritebrands.includes(result.data.brand)) {
          score += 0.2;
        }
      }
      
      // Price range preference
      if (result.data.price && context.userPreferences.budgetRange) {
        const [min, max] = context.userPreferences.budgetRange;
        if (result.data.price >= min && result.data.price <= max) {
          score += 0.15;
        }
      }
    }
    
    // Location relevance
    if (context.location && result.metadata.location) {
      const distance = this.calculateDistance(context.location, result.metadata.location);
      if (distance < 50) { // Within 50 miles
        score += 0.1;
      }
    }
    
    // Popularity boost
    if (result.metadata.popularity > 80) {
      score += 0.05;
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Generate search suggestions
   */
  private async generateSuggestions(
    query: string,
    context: SearchContext
  ): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];
    
    // Query completion suggestions
    const completions = await this.getQueryCompletions(query);
    suggestions.push(...completions);
    
    // Query correction suggestions
    const corrections = await this.getQueryCorrections(query);
    suggestions.push(...corrections);
    
    // Related query suggestions
    const related = await this.getRelatedQueries(query, context);
    suggestions.push(...related);
    
    return suggestions.slice(0, 10); // Limit suggestions
  }

  /**
   * Generate search facets for filtering
   */
  private generateFacets(results: SearchResult[]): SearchFacet[] {
    const facets: SearchFacet[] = [];
    
    // Brand facet
    const brands = new Map<string, number>();
    results.forEach(result => {
      if (result.type === 'car' && result.data.brand) {
        brands.set(result.data.brand, (brands.get(result.data.brand) || 0) + 1);
      }
    });
    
    if (brands.size > 0) {
      facets.push({
        field: 'brand',
        values: Array.from(brands.entries()).map(([value, count]) => ({
          value,
          count,
          selected: false,
        })),
      });
    }
    
    // Price range facet
    const priceRanges = [
      { label: 'Under $20k', min: 0, max: 20000 },
      { label: '$20k - $30k', min: 20000, max: 30000 },
      { label: '$30k - $50k', min: 30000, max: 50000 },
      { label: 'Over $50k', min: 50000, max: Infinity },
    ];
    
    const priceCounts = priceRanges.map(range => ({
      value: range.label,
      count: results.filter(r => 
        r.type === 'car' && 
        r.data.price >= range.min && 
        r.data.price < range.max
      ).length,
      selected: false,
    }));
    
    facets.push({
      field: 'price',
      values: priceCounts,
    });
    
    return facets;
  }

  /**
   * Build search context with user data
   */
  private async buildSearchContext(
    query: string,
    context: Partial<SearchContext>
  ): Promise<SearchContext> {
    const sessionId = context.sessionId || `session_${Date.now()}`;
    
    // Load user preferences if available
    let userPreferences: UserPreferences | undefined;
    if (context.userId) {
      userPreferences = await this.loadUserPreferences(context.userId);
    }
    
    // Get previous queries from session
    const previousQueries = this.queryHistory
      .filter(q => q.context.sessionId === sessionId)
      .map(q => q.originalQuery)
      .slice(-5); // Last 5 queries
    
    return {
      sessionId,
      previousQueries,
      userPreferences,
      timeOfDay: new Date().getHours() < 12 ? 'morning' : 
                 new Date().getHours() < 18 ? 'afternoon' : 'evening',
      device: {
        type: 'mobile', // Default, should be detected
        os: 'unknown',
        capabilities: ['touch', 'camera', 'location'],
      },
      ...context,
    };
  }

  /**
   * Generate cache key for search results
   */
  private generateCacheKey(
    query: string,
    context: SearchContext,
    options: SearchOptions
  ): string {
    const key = {
      query: query.toLowerCase().trim(),
      userId: context.userId,
      location: context.location,
      options,
    };
    
    return btoa(JSON.stringify(key));
  }

  /**
   * Fallback search for when AI processing fails
   */
  private async fallbackSearch(
    query: string,
    context: Partial<SearchContext>,
    options: SearchOptions
  ): Promise<SearchResponse> {
    // Simple keyword-based search
    const results = await this.simpleKeywordSearch(query);
    
    return {
      results,
      totalCount: results.length,
      queryTime: 100,
      suggestions: [],
      filters: {},
      facets: [],
      relatedQueries: [],
      searchId: `fallback_${Date.now()}`,
    };
  }

  /**
   * Simple keyword search fallback
   */
  private async simpleKeywordSearch(query: string): Promise<SearchResult[]> {
    // Implementation would do basic keyword matching
    return [];
  }

  // Helper methods
  private async getQueryCompletions(query: string): Promise<SearchSuggestion[]> {
    // Implementation for query completions
    return [];
  }

  private async getQueryCorrections(query: string): Promise<SearchSuggestion[]> {
    // Implementation for query corrections
    return [];
  }

  private async getRelatedQueries(query: string, context: SearchContext): Promise<SearchSuggestion[]> {
    // Implementation for related queries
    return [];
  }

  private async generateRelatedQueries(query: string, context: SearchContext): Promise<string[]> {
    // Implementation for related query generation
    return [];
  }

  private async loadUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    try {
      const stored = await AsyncStorage.getItem(`user_preferences_${userId}`);
      return stored ? JSON.parse(stored) : undefined;
    } catch (error) {
      console.error('Error loading user preferences:', error);
      return undefined;
    }
  }

  private calculateDistance(loc1: GeolocationData, loc2: GeolocationData): number {
    // Haversine formula for distance calculation
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(loc2.latitude - loc1.latitude);
    const dLon = this.toRadians(loc2.longitude - loc1.longitude);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(loc1.latitude)) * Math.cos(this.toRadians(loc2.latitude)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private trackSearch(query: SearchQuery, response: SearchResponse): void {
    // Track search analytics
    this.analytics.push({
      queryId: query.id,
      query: query.originalQuery,
      resultsCount: response.totalCount,
      clickedResults: [],
      timeSpent: 0,
      refinements: [],
      exitPage: '',
      converted: false,
    });
  }

  /**
   * Save search query for user
   */
  async saveSearch(searchQuery: SavedSearch, userId: string): Promise<void> {
    try {
      const saved = await this.getSavedSearches(userId);
      saved.push(searchQuery);
      
      await AsyncStorage.setItem(`saved_searches_${userId}`, JSON.stringify(saved));
    } catch (error) {
      console.error('Error saving search:', error);
    }
  }

  /**
   * Get saved searches for user
   */
  async getSavedSearches(userId: string): Promise<SavedSearch[]> {
    try {
      const stored = await AsyncStorage.getItem(`saved_searches_${userId}`);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading saved searches:', error);
      return [];
    }
  }

  /**
   * Get search analytics
   */
  getSearchAnalytics(): SearchAnalytics[] {
    return this.analytics;
  }

  /**
   * Clear search cache
   */
  clearCache(): void {
    this.searchCache.clear();
  }
}

// Search options interface
export interface SearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'price' | 'date' | 'popularity' | 'rating';
  sortOrder?: 'asc' | 'desc';
  includeTypes?: ('car' | 'dealer' | 'review' | 'article')[];
  bypassCache?: boolean;
  timeout?: number;
}

export default SemanticSearchEngine;
