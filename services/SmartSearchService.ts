/**
 * Smart Search Service - AI-Powered Car Discovery
 * 
 * Provides intelligent search with natural language processing,
 * smart filters, and AI-powered recommendations.
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';
import { businessAnalyticsService } from './BusinessAnalyticsService';

export interface SearchQuery {
  text?: string;
  filters?: {
    make?: string[];
    model?: string[];
    yearRange?: { min: number; max: number };
    priceRange?: { min: number; max: number };
    mileageRange?: { min: number; max: number };
    condition?: ('new' | 'used' | 'certified')[];
    fuelType?: string[];
    bodyType?: string[];
    location?: string;
    radius?: number;
  };
  sort?: {
    field: 'price' | 'year' | 'mileage' | 'relevance' | 'date_added';
    direction: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  cars: any[];
  totalCount: number;
  suggestions: SearchSuggestion[];
  appliedFilters: AppliedFilter[];
  searchTime: number;
  popularSearches: string[];
}

export interface SearchSuggestion {
  type: 'make' | 'model' | 'feature' | 'price' | 'location';
  value: string;
  count: number;
  confidence: number;
}

export interface AppliedFilter {
  type: string;
  label: string;
  value: any;
  removable: boolean;
}

export interface NaturalLanguageIntent {
  make?: string;
  model?: string;
  features?: string[];
  priceRange?: { min?: number; max?: number };
  yearRange?: { min?: number; max?: number };
  conditions?: string[];
  colors?: string[];
  fuelTypes?: string[];
  bodyTypes?: string[];
  confidence: number;
}

class SmartSearchService {
  private static instance: SmartSearchService;
  private searchCache = new Map<string, { result: SearchResult; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static getInstance(): SmartSearchService {
    if (!SmartSearchService.instance) {
      SmartSearchService.instance = new SmartSearchService();
    }
    return SmartSearchService.instance;
  }

  /**
   * Main search method with AI enhancement
   */
  async search(
    query: SearchQuery,
    userId?: string,
    useAI: boolean = true
  ): Promise<SearchResult> {
    const startTime = Date.now();
    
    try {
      // Track search event
      if (userId) {
        await businessAnalyticsService.trackUserInteraction(
          userId,
          'search_performed',
          'search',
          undefined,
          { query: query.text, filters: query.filters }
        );
      }

      // Check cache for identical queries
      const cacheKey = this.generateCacheKey(query);
      const cached = this.searchCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        logger.debug('Returning cached search results');
        return cached.result;
      }

      // Parse natural language if AI is enabled
      let enhancedQuery = query;
      if (useAI && query.text) {
        const intent = await this.parseNaturalLanguage(query.text);
        enhancedQuery = this.mergeQueryWithIntent(query, intent);
      }

      // Execute search
      const { cars, totalCount } = await this.executeSearch(enhancedQuery);

      // Generate suggestions
      const suggestions = await this.generateSearchSuggestions(enhancedQuery, cars);

      // Get popular searches
      const popularSearches = await this.getPopularSearches();

      // Build applied filters
      const appliedFilters = this.buildAppliedFilters(enhancedQuery);

      const searchResult: SearchResult = {
        cars,
        totalCount,
        suggestions,
        appliedFilters,
        searchTime: Date.now() - startTime,
        popularSearches,
      };

      // Cache result
      this.searchCache.set(cacheKey, {
        result: searchResult,
        timestamp: Date.now(),
      });

      logger.info('Search completed', {
        query: query.text,
        resultsCount: cars.length,
        searchTime: searchResult.searchTime,
      });

      return searchResult;
    } catch (error) {
      logger.error('Search failed', error);
      return this.getFallbackSearchResult(query);
    }
  }

  /**
   * Natural language processing for search queries
   */
  async parseNaturalLanguage(text: string): Promise<NaturalLanguageIntent> {
    try {
      const intent: NaturalLanguageIntent = { confidence: 0 };
      const normalizedText = text.toLowerCase().trim();

      // Extract car makes/models using pattern matching
      const carBrands = this.extractCarBrands(normalizedText);
      if (carBrands.make) {
        intent.make = carBrands.make;
        intent.confidence += 0.3;
      }
      if (carBrands.model) {
        intent.model = carBrands.model;
        intent.confidence += 0.2;
      }

      // Extract price information
      const priceInfo = this.extractPriceRange(normalizedText);
      if (priceInfo) {
        intent.priceRange = priceInfo;
        intent.confidence += 0.2;
      }

      // Extract year information
      const yearInfo = this.extractYearRange(normalizedText);
      if (yearInfo) {
        intent.yearRange = yearInfo;
        intent.confidence += 0.15;
      }

      // Extract features and attributes
      intent.features = this.extractFeatures(normalizedText);
      if (intent.features.length > 0) {
        intent.confidence += 0.1;
      }

      // Extract colors
      intent.colors = this.extractColors(normalizedText);
      if (intent.colors.length > 0) {
        intent.confidence += 0.05;
      }

      logger.debug('Natural language parsing result', { text, intent });
      return intent;
    } catch (error) {
      logger.warn('Natural language parsing failed', error);
      return { confidence: 0 };
    }
  }

  /**
   * Get smart search suggestions based on partial input
   */
  async getSearchSuggestions(
    partialQuery: string,
    limit: number = 10
  ): Promise<SearchSuggestion[]> {
    try {
      if (!partialQuery || partialQuery.length < 2) {
        return await this.getPopularSearchSuggestions(limit);
      }

      const suggestions: SearchSuggestion[] = [];
      const query = partialQuery.toLowerCase();

      // Get make suggestions
      const makeMatches = await this.getMakeSuggestions(query, 3);
      suggestions.push(...makeMatches);

      // Get model suggestions
      const modelMatches = await this.getModelSuggestions(query, 3);
      suggestions.push(...modelMatches);

      // Get feature suggestions
      const featureMatches = await this.getFeatureSuggestions(query, 2);
      suggestions.push(...featureMatches);

      // Get location suggestions
      const locationMatches = await this.getLocationSuggestions(query, 2);
      suggestions.push(...locationMatches);

      // Sort by confidence and relevance
      return suggestions
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, limit);
    } catch (error) {
      logger.warn('Failed to get search suggestions', error);
      return [];
    }
  }

  /**
   * Get trending searches and popular filters
   */
  async getTrendingSearches(timeframe: 'hour' | 'day' | 'week' = 'day'): Promise<{
    searches: string[];
    filters: { type: string; value: string; count: number }[];
  }> {
    try {
      // In a real implementation, this would analyze search analytics
      return {
        searches: [
          'Honda Civic under $25k',
          'Toyota Camry 2020-2023',
          'SUV with low mileage',
          'Electric vehicles',
          'Hybrid cars near me',
        ],
        filters: [
          { type: 'make', value: 'Honda', count: 145 },
          { type: 'make', value: 'Toyota', count: 132 },
          { type: 'price', value: 'Under $30k', count: 98 },
          { type: 'year', value: '2020+', count: 87 },
          { type: 'fuel', value: 'Hybrid', count: 65 },
        ],
      };
    } catch (error) {
      logger.warn('Failed to get trending searches', error);
      return { searches: [], filters: [] };
    }
  }

  /**
   * Private helper methods
   */
  private async executeSearch(query: SearchQuery): Promise<{ cars: any[]; totalCount: number }> {
    try {
      let supabaseQuery = supabase
        .from('vehicle_listings')
        .select('*', { count: 'exact' });

      // Apply text search if provided
      if (query.text) {
        supabaseQuery = supabaseQuery.or(
          `make.ilike.%${query.text}%,model.ilike.%${query.text}%,description.ilike.%${query.text}%`
        );
      }

      // Apply filters
      if (query.filters) {
        const { filters } = query;

        if (filters.make?.length) {
          supabaseQuery = supabaseQuery.in('make', filters.make);
        }

        if (filters.model?.length) {
          supabaseQuery = supabaseQuery.in('model', filters.model);
        }

        if (filters.priceRange) {
          if (filters.priceRange.min) {
            supabaseQuery = supabaseQuery.gte('price', filters.priceRange.min);
          }
          if (filters.priceRange.max) {
            supabaseQuery = supabaseQuery.lte('price', filters.priceRange.max);
          }
        }

        if (filters.yearRange) {
          if (filters.yearRange.min) {
            supabaseQuery = supabaseQuery.gte('year', filters.yearRange.min);
          }
          if (filters.yearRange.max) {
            supabaseQuery = supabaseQuery.lte('year', filters.yearRange.max);
          }
        }

        if (filters.mileageRange) {
          if (filters.mileageRange.min) {
            supabaseQuery = supabaseQuery.gte('mileage', filters.mileageRange.min);
          }
          if (filters.mileageRange.max) {
            supabaseQuery = supabaseQuery.lte('mileage', filters.mileageRange.max);
          }
        }

        if (filters.condition?.length) {
          supabaseQuery = supabaseQuery.in('condition', filters.condition);
        }

        if (filters.fuelType?.length) {
          supabaseQuery = supabaseQuery.in('fuel_type', filters.fuelType);
        }
      }

      // Apply sorting
      if (query.sort) {
        const { field, direction } = query.sort;
        supabaseQuery = supabaseQuery.order(field, { ascending: direction === 'asc' });
      } else {
        // Default sorting by relevance (date added desc)
        supabaseQuery = supabaseQuery.order('created_at', { ascending: false });
      }

      // Apply pagination
      const limit = query.limit || 20;
      const offset = query.offset || 0;
      supabaseQuery = supabaseQuery.range(offset, offset + limit - 1);

      const { data: cars, error, count } = await supabaseQuery;

      if (error) {
        logger.error('Search query failed', error);
        return { cars: [], totalCount: 0 };
      }

      return {
        cars: cars || [],
        totalCount: count || 0,
      };
    } catch (error) {
      logger.error('Search execution failed', error);
      return { cars: [], totalCount: 0 };
    }
  }

  private extractCarBrands(text: string): { make?: string; model?: string } {
    const result: { make?: string; model?: string } = {};

    // Common car brands with their models
    const carDatabase = {
      honda: ['civic', 'accord', 'crv', 'pilot', 'fit', 'insight'],
      toyota: ['camry', 'corolla', 'prius', 'rav4', 'highlander', 'sienna'],
      nissan: ['altima', 'sentra', 'maxima', 'rogue', 'pathfinder', 'leaf'],
      ford: ['f150', 'mustang', 'explorer', 'escape', 'focus', 'fusion'],
      chevrolet: ['silverado', 'equinox', 'malibu', 'traverse', 'tahoe'],
      bmw: ['3series', '5series', 'x3', 'x5', 'i3', 'i8'],
      mercedes: ['cclass', 'eclass', 'sclass', 'glc', 'gle'],
      audi: ['a3', 'a4', 'a6', 'q5', 'q7', 'q8'],
    };

    // Extract make
    for (const [make, models] of Object.entries(carDatabase)) {
      if (text.includes(make)) {
        result.make = make.charAt(0).toUpperCase() + make.slice(1);
        
        // Extract model if make is found
        for (const model of models) {
          if (text.includes(model)) {
            result.model = model.charAt(0).toUpperCase() + model.slice(1);
            break;
          }
        }
        break;
      }
    }

    return result;
  }

  private extractPriceRange(text: string): { min?: number; max?: number } | null {
    const result: { min?: number; max?: number } = {};

    // Pattern: "under $X", "below $X"
    const underMatch = text.match(/(?:under|below|less than)\s*\$?(\d+)k?/i);
    if (underMatch) {
      const amount = parseInt(underMatch[1]);
      result.max = underMatch[0].includes('k') ? amount * 1000 : amount;
    }

    // Pattern: "over $X", "above $X"
    const overMatch = text.match(/(?:over|above|more than)\s*\$?(\d+)k?/i);
    if (overMatch) {
      const amount = parseInt(overMatch[1]);
      result.min = overMatch[0].includes('k') ? amount * 1000 : amount;
    }

    // Pattern: "$X to $Y", "$X-$Y"
    const rangeMatch = text.match(/\$?(\d+)k?\s*(?:to|-)\s*\$?(\d+)k?/i);
    if (rangeMatch) {
      result.min = parseInt(rangeMatch[1]);
      result.max = parseInt(rangeMatch[2]);
      
      if (rangeMatch[0].includes('k')) {
        result.min *= 1000;
        result.max *= 1000;
      }
    }

    return Object.keys(result).length > 0 ? result : null;
  }

  private extractYearRange(text: string): { min?: number; max?: number } | null {
    const result: { min?: number; max?: number } = {};
    const currentYear = new Date().getFullYear();

    // Pattern: "2020 or newer", "2020+"
    const newerMatch = text.match(/(\d{4})(?:\s*(?:or\s*)?(?:newer|later|\+))/i);
    if (newerMatch) {
      result.min = parseInt(newerMatch[1]);
    }

    // Pattern: "before 2020", "older than 2020"
    const olderMatch = text.match(/(?:before|older than)\s*(\d{4})/i);
    if (olderMatch) {
      result.max = parseInt(olderMatch[1]) - 1;
    }

    // Pattern: "2018-2021", "2018 to 2021"
    const rangeMatch = text.match(/(\d{4})\s*(?:to|-)\s*(\d{4})/i);
    if (rangeMatch) {
      result.min = parseInt(rangeMatch[1]);
      result.max = parseInt(rangeMatch[2]);
    }

    return Object.keys(result).length > 0 ? result : null;
  }

  private extractFeatures(text: string): string[] {
    const features: string[] = [];
    const featureKeywords = [
      'sunroof', 'leather', 'navigation', 'backup camera', 'heated seats',
      'bluetooth', 'cruise control', 'automatic', 'manual', 'awd', '4wd',
      'hybrid', 'electric', 'turbo', 'sports', 'luxury'
    ];

    for (const feature of featureKeywords) {
      if (text.includes(feature)) {
        features.push(feature);
      }
    }

    return features;
  }

  private extractColors(text: string): string[] {
    const colors: string[] = [];
    const colorKeywords = [
      'red', 'blue', 'black', 'white', 'silver', 'gray', 'grey',
      'green', 'yellow', 'orange', 'brown', 'gold', 'beige'
    ];

    for (const color of colorKeywords) {
      if (text.includes(color)) {
        colors.push(color);
      }
    }

    return colors;
  }

  private mergeQueryWithIntent(query: SearchQuery, intent: NaturalLanguageIntent): SearchQuery {
    const enhancedQuery = { ...query };

    if (!enhancedQuery.filters) {
      enhancedQuery.filters = {};
    }

    if (intent.make && !enhancedQuery.filters.make) {
      enhancedQuery.filters.make = [intent.make];
    }

    if (intent.model && !enhancedQuery.filters.model) {
      enhancedQuery.filters.model = [intent.model];
    }

    if (intent.priceRange && !enhancedQuery.filters.priceRange) {
      enhancedQuery.filters.priceRange = {
        min: intent.priceRange.min || 0,
        max: intent.priceRange.max || Number.MAX_SAFE_INTEGER,
      };
    }

    if (intent.yearRange && !enhancedQuery.filters.yearRange) {
      enhancedQuery.filters.yearRange = {
        min: intent.yearRange.min || 1900,
        max: intent.yearRange.max || new Date().getFullYear(),
      };
    }

    return enhancedQuery;
  }

  private async generateSearchSuggestions(
    query: SearchQuery,
    results: any[]
  ): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];

    // Generate suggestions based on results
    if (results.length > 0) {
      // Suggest popular makes from results
      const makeCount = results.reduce((acc, car) => {
        acc[car.make] = (acc[car.make] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      Object.entries(makeCount)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 3)
        .forEach(([make, count]) => {
          suggestions.push({
            type: 'make',
            value: make,
            count: count as number,
            confidence: 0.8,
          });
        });
    }

    return suggestions;
  }

  private async getMakeSuggestions(query: string, limit: number): Promise<SearchSuggestion[]> {
    // In a real implementation, this would query the database
    const makes = ['Honda', 'Toyota', 'Nissan', 'Ford', 'Chevrolet', 'BMW', 'Mercedes', 'Audi'];
    
    return makes
      .filter(make => make.toLowerCase().includes(query))
      .slice(0, limit)
      .map(make => ({
        type: 'make' as const,
        value: make,
        count: Math.floor(Math.random() * 100) + 10,
        confidence: 0.9,
      }));
  }

  private async getModelSuggestions(query: string, limit: number): Promise<SearchSuggestion[]> {
    const models = ['Civic', 'Accord', 'Camry', 'Corolla', 'Altima', 'Sentra'];
    
    return models
      .filter(model => model.toLowerCase().includes(query))
      .slice(0, limit)
      .map(model => ({
        type: 'model' as const,
        value: model,
        count: Math.floor(Math.random() * 50) + 5,
        confidence: 0.8,
      }));
  }

  private async getFeatureSuggestions(query: string, limit: number): Promise<SearchSuggestion[]> {
    const features = ['sunroof', 'leather seats', 'navigation', 'backup camera', 'heated seats'];
    
    return features
      .filter(feature => feature.includes(query))
      .slice(0, limit)
      .map(feature => ({
        type: 'feature' as const,
        value: feature,
        count: Math.floor(Math.random() * 30) + 5,
        confidence: 0.7,
      }));
  }

  private async getLocationSuggestions(query: string, limit: number): Promise<SearchSuggestion[]> {
    const locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
    
    return locations
      .filter(location => location.toLowerCase().includes(query))
      .slice(0, limit)
      .map(location => ({
        type: 'location' as const,
        value: location,
        count: Math.floor(Math.random() * 20) + 5,
        confidence: 0.6,
      }));
  }

  private async getPopularSearchSuggestions(limit: number): Promise<SearchSuggestion[]> {
    return [
      { type: 'make' as const, value: 'Honda', count: 150, confidence: 0.9 },
      { type: 'make' as const, value: 'Toyota', count: 140, confidence: 0.9 },
      { type: 'feature' as const, value: 'low mileage', count: 85, confidence: 0.8 },
      { type: 'feature' as const, value: 'under $25k', count: 75, confidence: 0.8 },
      { type: 'feature' as const, value: 'hybrid', count: 65, confidence: 0.7 },
    ].slice(0, limit);
  }

  private async getPopularSearches(): Promise<string[]> {
    return [
      'Honda Civic',
      'Toyota Camry',
      'SUV under $30k',
      'Hybrid cars',
      'Low mileage sedan',
    ];
  }

  private buildAppliedFilters(query: SearchQuery): AppliedFilter[] {
    const filters: AppliedFilter[] = [];

    if (query.filters?.make?.length) {
      filters.push({
        type: 'make',
        label: `Make: ${query.filters.make.join(', ')}`,
        value: query.filters.make,
        removable: true,
      });
    }

    if (query.filters?.priceRange) {
      const { min, max } = query.filters.priceRange;
      let label = 'Price: ';
      if (min && max) {
        label += `$${min.toLocaleString()} - $${max.toLocaleString()}`;
      } else if (min) {
        label += `Over $${min.toLocaleString()}`;
      } else if (max) {
        label += `Under $${max.toLocaleString()}`;
      }
      
      filters.push({
        type: 'price',
        label,
        value: query.filters.priceRange,
        removable: true,
      });
    }

    return filters;
  }

  private generateCacheKey(query: SearchQuery): string {
    return JSON.stringify({
      text: query.text,
      filters: query.filters,
      sort: query.sort,
      limit: query.limit,
      offset: query.offset,
    });
  }

  private getFallbackSearchResult(query: SearchQuery): SearchResult {
    return {
      cars: [],
      totalCount: 0,
      suggestions: [],
      appliedFilters: this.buildAppliedFilters(query),
      searchTime: 0,
      popularSearches: [],
    };
  }
}

export const smartSearchService = SmartSearchService.getInstance();
