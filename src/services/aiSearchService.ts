import { supabase } from '@/lib/supabase';
import { openaiService, CarSearchIntent, SearchFilters } from '@/lib/openai';
import { logger } from '@/utils/logger';
import { DatabaseVehicleListing } from '@/types/database';

export interface AISearchResult {
  query: string;
  intent: CarSearchIntent | null;
  filters: SearchFilters;
  results: DatabaseVehicleListing[];
  resultCount: number;
  explanation: string;
  suggestions: string[];
  processingTimeMs: number;
  confidence: number;
}

export interface AISearchMetrics {
  searchId: string;
  query: string;
  resultCount: number;
  clickedResults: number;
  processingTime: number;
  openaiTokens: number;
  userSatisfaction?: number;
}

export class AISearchService {
  private static instance: AISearchService;

  static getInstance(): AISearchService {
    if (!AISearchService.instance) {
      AISearchService.instance = new AISearchService();
    }
    return AISearchService.instance;
  }

  async search(
    query: string,
    userId?: string,
    sessionId?: string,
    page: number = 0,
    limit: number = 20,
  ): Promise<AISearchResult> {
    const startTime = Date.now();
    logger.debug(`Starting AI search for query: "${query}"`);

    try {
      // Step 1: Parse the natural language query with OpenAI
      const intent = await openaiService.parseCarSearchQuery(query);
      logger.debug('Parsed intent:', intent);

      // Step 2: Convert intent to database filters
      const filters = intent
        ? openaiService.convertIntentToFilters(intent)
        : {};
      logger.debug('Generated filters:', filters);

      // Step 3: Build and execute Supabase query
      const { results, totalCount } = await this.executeSupabaseSearch(
        filters,
        page,
        limit,
      );
      logger.debug(
        `Found ${totalCount} total results, returning ${results.length}`,
      );

      // Step 4: Generate explanation and suggestions
      const explanation = await openaiService.explainSearchResults(
        query,
        totalCount,
        intent || undefined,
      );
      const suggestions = await openaiService.generateSearchSuggestions(query);

      const processingTime = Date.now() - startTime;

      // Step 5: Log search analytics
      await this.logSearchAnalytics({
        query,
        intent,
        filters,
        resultCount: totalCount,
        processingTime,
        userId,
        sessionId,
      });

      return {
        query,
        intent,
        filters,
        results,
        resultCount: totalCount,
        explanation,
        suggestions,
        processingTimeMs: processingTime,
        confidence: intent?.confidence || 0.5,
      };
    } catch (error) {
      logger.error('AI search error:', error);

      // Fallback to basic search
      const fallbackResults = await this.basicSearch(query, page, limit);
      const processingTime = Date.now() - startTime;

      return {
        query,
        intent: null,
        filters: {},
        results: fallbackResults.results,
        resultCount: fallbackResults.totalCount,
        explanation: `Found ${fallbackResults.totalCount} results for "${query}". AI features temporarily unavailable.`,
        suggestions: [
          'Try a more specific search',
          'Browse by category',
          'Filter by price range',
        ],
        processingTimeMs: processingTime,
        confidence: 0.3,
      };
    }
  }

  private async executeSupabaseSearch(
    filters: SearchFilters,
    page: number = 0,
    limit: number = 20,
  ): Promise<{ results: DatabaseVehicleListing[]; totalCount: number }> {
    let query = supabase
      .from('vehicle_listings')
      .select(
        `
        *,
        dealers!inner (
          business_name,
          verified,
          rating,
          city,
          state
        )
      `,
      )
      .eq('status', 'active');

    // Apply filters based on parsed intent
    if (filters.make) {
      query = query.ilike('make', `%${filters.make}%`);
    }

    if (filters.model) {
      query = query.ilike('model', `%${filters.model}%`);
    }

    if (filters.priceMin) {
      query = query.gte('price', filters.priceMin);
    }

    if (filters.priceMax) {
      query = query.lte('price', filters.priceMax);
    }

    if (filters.yearMin) {
      query = query.gte('year', filters.yearMin);
    }

    if (filters.yearMax) {
      query = query.lte('year', filters.yearMax);
    }

    if (filters.mileageMax) {
      query = query.lte('mileage', filters.mileageMax);
    }

    if (filters.fuelType) {
      query = query.eq('fuel_type', filters.fuelType);
    }

    if (filters.transmission) {
      query = query.eq('transmission', filters.transmission);
    }

    if (filters.location) {
      query = query.or(
        `location_city.ilike.%${filters.location}%,location_state.ilike.%${filters.location}%`,
      );
    }

    if (filters.features && filters.features.length > 0) {
      // Search in features array (PostgreSQL array contains)
      const featureQueries = filters.features
        .map((feature) => `features.cs.{${feature}}`)
        .join(',');
      query = query.or(featureQueries);
    }

    // Get total count first
    const { count } = await supabase
      .from('vehicle_listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    const totalCount = count || 0;

    // Get paginated results
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(page * limit, (page + 1) * limit - 1);

    if (error) {
      logger.error('Supabase search error:', error);
      throw error;
    }

    return {
      results: data || [],
      totalCount,
    };
  }

  private async basicSearch(
    query: string,
    page: number = 0,
    limit: number = 20,
  ): Promise<{ results: DatabaseVehicleListing[]; totalCount: number }> {
    try {
      // Simple text search across make, model, and title
      const searchQuery = supabase
        .from('vehicle_listings')
        .select(
          `
          *,
          dealers!inner (
            business_name,
            verified,
            rating,
            city,
            state
          )
        `,
        )
        .eq('status', 'active')
        .or(
          `make.ilike.%${query}%,model.ilike.%${query}%,title.ilike.%${query}%`,
        );

      // Get total count
      const { count } = await supabase
        .from('vehicle_listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .or(
          `make.ilike.%${query}%,model.ilike.%${query}%,title.ilike.%${query}%`,
        );
      const totalCount = count || 0;

      // Get paginated results
      const { data, error } = await searchQuery
        .order('created_at', { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      if (error) {
        throw error;
      }

      return {
        results: data || [],
        totalCount,
      };
    } catch (error) {
      logger.error('Basic search error:', error);
      return { results: [], totalCount: 0 };
    }
  }

  private async logSearchAnalytics(data: {
    query: string;
    intent: CarSearchIntent | null;
    filters: SearchFilters;
    resultCount: number;
    processingTime: number;
    userId?: string;
    sessionId?: string;
  }): Promise<void> {
    try {
      // Log to ai_search_queries table
      await supabase.from('ai_search_queries').insert({
        user_id: data.userId || null,
        session_id: data.sessionId || null,
        original_query: data.query,
        parsed_intent: data.intent
          ? {
              intent: data.intent.intent,
              budget_min: data.intent.budget_min,
              budget_max: data.intent.budget_max,
              brand: data.intent.brand,
              model: data.intent.model,
              year_min: data.intent.year_min,
              year_max: data.intent.year_max,
              body_type: data.intent.body_type,
              fuel_type: data.intent.fuel_type,
              confidence: data.intent.confidence,
            }
          : {},
        search_filters: data.filters,
        results_count: data.resultCount,
        processing_time_ms: data.processingTime,
        openai_tokens_used: 100, // Approximate token usage
        openai_cost_cents: 1, // Approximate cost
      });

      // Log general user analytics
      if (data.userId) {
        await supabase.from('user_analytics').insert({
          user_id: data.userId,
          session_id: data.sessionId,
          event_type: 'search',
          event_data: {
            query: data.query,
            result_count: data.resultCount,
            processing_time_ms: data.processingTime,
            ai_powered: data.intent !== null,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to log search analytics:', error);
      // Don't throw here - analytics failure shouldn't break search
    }
  }

  async trackSearchClick(
    originalQuery: string,
    clickedItemId: string,
    userId?: string,
    sessionId?: string,
  ): Promise<void> {
    try {
      // Get current clicked_results count and increment it
      const { data: existingQuery } = await supabase
        .from('ai_search_queries')
        .select('clicked_results')
        .match({
          original_query: originalQuery,
          user_id: userId,
        })
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (existingQuery) {
        await supabase
          .from('ai_search_queries')
          .update({
            clicked_results: (existingQuery.clicked_results || 0) + 1,
          })
          .match({
            original_query: originalQuery,
            user_id: userId,
          })
          .order('created_at', { ascending: false })
          .limit(1);
      }

      // Log the click event
      if (userId) {
        await supabase.from('user_analytics').insert({
          user_id: userId,
          session_id: sessionId,
          event_type: 'click',
          event_data: {
            original_query: originalQuery,
            clicked_item_id: clickedItemId,
            click_position: 1, // Could track position in results
          },
        });
      }
    } catch (error) {
      logger.error('Failed to track search click:', error);
    }
  }

  async saveSearch(
    userId: string,
    searchName: string,
    query: string,
    filters: SearchFilters,
    alertFrequency: 'instant' | 'daily' | 'weekly' = 'daily',
  ): Promise<void> {
    try {
      await supabase.from('saved_search_alerts').insert({
        user_id: userId,
        search_name: searchName,
        search_criteria: {
          query,
          filters,
        },
        alert_frequency: alertFrequency,
        is_active: true,
      });

      logger.debug(`Saved search "${searchName}" for user ${userId}`);
    } catch (error) {
      logger.error('Failed to save search:', error);
      throw error;
    }
  }

  async getSavedSearches(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('saved_search_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Failed to get saved searches:', error);
      return [];
    }
  }

  async getSearchHistory(
    userId: string,
    limit: number = 10,
  ): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('ai_search_queries')
        .select('original_query')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data?.map((item) => item.original_query) || [];
    } catch (error) {
      logger.error('Failed to get search history:', error);
      return [];
    }
  }

  async getPopularSearches(limit: number = 5): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('ai_search_queries')
        .select('original_query')
        .gte(
          'created_at',
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        )
        .order('created_at', { ascending: false })
        .limit(limit * 3); // Get more to deduplicate

      if (error) throw error;

      // Get unique queries and return top ones
      const uniqueQueries = [
        ...new Set(data?.map((item) => item.original_query) || []),
      ];
      return uniqueQueries.slice(0, limit);
    } catch (error) {
      logger.error('Failed to get popular searches:', error);
      return [
        'Best SUVs under $30k',
        'Reliable family cars',
        'Electric vehicles',
        'Luxury sedans',
        'Fuel efficient cars',
      ];
    }
  }
}

export const aiSearchService = AISearchService.getInstance();
