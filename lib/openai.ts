import OpenAI from 'openai';
import { logger } from '@/utils/logger';

// OpenAI Configuration
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  logger.warn('⚠️ OpenAI API key not found. AI search features will be limited.');
}

export const openai = new OpenAI({
  apiKey: OPENAI_API_KEY || 'dummy-key',
  dangerouslyAllowBrowser: true, // Note: In production, use a backend proxy
});

export interface CarSearchIntent {
  intent: 'buy' | 'research' | 'compare' | 'browse';
  budget_min?: number;
  budget_max?: number;
  brand?: string;
  model?: string;
  year_min?: number;
  year_max?: number;
  body_type?: string;
  fuel_type?: string;
  transmission?: string;
  features?: string[];
  location?: string;
  urgency?: 'low' | 'medium' | 'high';
  confidence: number;
}

export interface SearchFilters {
  make?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  location?: string;
  features?: string[];
}

export class OpenAIService {
  private static instance: OpenAIService;
  private rateLimitCount = 0;
  private rateLimitReset = Date.now();

  static getInstance(): OpenAIService {
    if (!OpenAIService.instance) {
      OpenAIService.instance = new OpenAIService();
    }
    return OpenAIService.instance;
  }

  private checkRateLimit(): boolean {
    const now = Date.now();
    
    // Reset counter every minute
    if (now - this.rateLimitReset > 60000) {
      this.rateLimitCount = 0;
      this.rateLimitReset = now;
    }

    // Limit to 20 requests per minute to stay within OpenAI limits
    if (this.rateLimitCount >= 20) {
      logger.warn('OpenAI rate limit reached. Please wait before making more requests.');
      return false;
    }

    this.rateLimitCount++;
    return true;
  }

  async parseCarSearchQuery(query: string): Promise<CarSearchIntent | null> {
    if (!OPENAI_API_KEY) {
      logger.warn('OpenAI API key missing. Using fallback parsing.');
      return this.fallbackParseQuery(query);
    }

    if (!this.checkRateLimit()) {
      return this.fallbackParseQuery(query);
    }

    try {
      const startTime = Date.now();

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a car search assistant. Parse user queries about cars and extract structured information.

Extract these fields from car search queries:
- intent: "buy" | "research" | "compare" | "browse"
- budget_min: minimum budget in USD (if mentioned)
- budget_max: maximum budget in USD (if mentioned)
- brand: car brand/manufacturer
- model: specific car model
- year_min: minimum year
- year_max: maximum year
- body_type: "sedan" | "suv" | "truck" | "coupe" | "hatchback" | "convertible" | "wagon"
- fuel_type: "gasoline" | "hybrid" | "electric" | "diesel"
- transmission: "manual" | "automatic" | "cvt"
- features: array of desired features
- location: location preference
- urgency: "low" | "medium" | "high"
- confidence: how confident you are (0-1)

Respond ONLY with valid JSON. No explanations.

Examples:
"I want a reliable SUV under $30k" → {"intent":"buy","budget_max":30000,"body_type":"suv","confidence":0.9}
"Show me BMW sedans from 2020-2023" → {"intent":"browse","brand":"BMW","body_type":"sedan","year_min":2020,"year_max":2023,"confidence":0.95}
"Best electric cars" → {"intent":"research","fuel_type":"electric","confidence":0.8}`
          },
          {
            role: "user",
            content: query
          }
        ],
        max_tokens: 200,
        temperature: 0.1,
      });

      const processingTime = Date.now() - startTime;
      logger.debug(`OpenAI query processed in ${processingTime}ms`);

      const response = completion.choices[0]?.message?.content?.trim();
      if (!response) {
        throw new Error('Empty response from OpenAI');
      }

      const parsed = JSON.parse(response) as CarSearchIntent;
      
      // Validate the response
      if (!parsed.intent || !parsed.confidence) {
        throw new Error('Invalid response structure');
      }

      logger.debug('OpenAI parsed query:', { query, parsed });
      return parsed;

    } catch (error) {
      logger.error('OpenAI parsing error:', error);
      return this.fallbackParseQuery(query);
    }
  }

  private fallbackParseQuery(query: string): CarSearchIntent {
    const lowerQuery = query.toLowerCase();
    let intent: 'buy' | 'research' | 'compare' | 'browse' = 'browse';
    let confidence = 0.5;

    // Determine intent from keywords
    if (lowerQuery.includes('buy') || lowerQuery.includes('purchase') || lowerQuery.includes('need')) {
      intent = 'buy';
      confidence = 0.7;
    } else if (lowerQuery.includes('compare') || lowerQuery.includes('vs')) {
      intent = 'compare';
      confidence = 0.8;
    } else if (lowerQuery.includes('review') || lowerQuery.includes('best') || lowerQuery.includes('reliable')) {
      intent = 'research';
      confidence = 0.7;
    }

    // Extract budget
    const budgetMatch = lowerQuery.match(/(\$|under|below|less than)\s*(\d+)[k,]?/);
    const budget_max = budgetMatch ? parseInt(budgetMatch[2]) * (budgetMatch[2].length <= 2 ? 1000 : 1) : undefined;

    // Extract brand
    const brands = ['toyota', 'honda', 'ford', 'chevrolet', 'bmw', 'mercedes', 'audi', 'nissan', 'hyundai', 'kia', 'mazda', 'subaru', 'volkswagen', 'tesla'];
    const brand = brands.find(b => lowerQuery.includes(b));

    // Extract body type
    const bodyTypes = ['suv', 'sedan', 'truck', 'coupe', 'hatchback', 'convertible', 'wagon'];
    const body_type = bodyTypes.find(b => lowerQuery.includes(b));

    // Extract fuel type
    let fuel_type: string | undefined;
    if (lowerQuery.includes('electric') || lowerQuery.includes('ev')) fuel_type = 'electric';
    else if (lowerQuery.includes('hybrid')) fuel_type = 'hybrid';
    else if (lowerQuery.includes('diesel')) fuel_type = 'diesel';

    return {
      intent,
      budget_max,
      brand: brand ? brand.charAt(0).toUpperCase() + brand.slice(1) : undefined,
      body_type,
      fuel_type,
      confidence
    };
  }

  convertIntentToFilters(intent: CarSearchIntent): SearchFilters {
    const filters: SearchFilters = {};

    if (intent.budget_min) filters.priceMin = intent.budget_min;
    if (intent.budget_max) filters.priceMax = intent.budget_max;
    if (intent.brand) filters.make = intent.brand;
    if (intent.model) filters.model = intent.model;
    if (intent.year_min) filters.yearMin = intent.year_min;
    if (intent.year_max) filters.yearMax = intent.year_max;
    if (intent.body_type) filters.bodyType = intent.body_type;
    if (intent.fuel_type) filters.fuelType = intent.fuel_type;
    if (intent.transmission) filters.transmission = intent.transmission;
    if (intent.location) filters.location = intent.location;
    if (intent.features) filters.features = intent.features;

    return filters;
  }

  async generateSearchSuggestions(query: string): Promise<string[]> {
    if (!OPENAI_API_KEY || !this.checkRateLimit()) {
      return this.fallbackSuggestions(query);
    }

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Generate 5 relevant car search suggestions based on the user's partial query. Respond with JSON array of strings only."
          },
          {
            role: "user",
            content: `Suggest car searches for: "${query}"`
          }
        ],
        max_tokens: 100,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content?.trim();
      if (response) {
        const suggestions = JSON.parse(response);
        if (Array.isArray(suggestions)) {
          return suggestions.slice(0, 5);
        }
      }
    } catch (error) {
      logger.error('Error generating suggestions:', error);
    }

    return this.fallbackSuggestions(query);
  }

  private fallbackSuggestions(query: string): string[] {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('suv')) {
      return ['Best SUVs under $30k', 'Reliable family SUVs', 'Fuel efficient SUVs', 'Luxury SUVs', 'Compact SUVs'];
    }
    
    if (lowerQuery.includes('sedan')) {
      return ['Affordable sedans', 'Luxury sedans', 'Fuel efficient sedans', 'Sports sedans', 'Family sedans'];
    }
    
    if (lowerQuery.includes('electric')) {
      return ['Tesla Model 3', 'Affordable electric cars', 'Long range EVs', 'Electric SUVs', 'Best EVs 2024'];
    }

    return [
      'Popular cars under $25k',
      'Most reliable cars',
      'Best fuel economy',
      'Luxury cars',
      'Family vehicles'
    ];
  }

  async explainSearchResults(query: string, resultCount: number, intent?: CarSearchIntent): Promise<string> {
    if (resultCount === 0) {
      return `No cars found matching "${query}". Try adjusting your search criteria.`;
    }

    if (!intent) {
      return `Found ${resultCount} cars matching "${query}".`;
    }

    let explanation = `Found ${resultCount} cars`;
    
    if (intent.budget_max) {
      explanation += ` under $${intent.budget_max.toLocaleString()}`;
    }
    
    if (intent.brand) {
      explanation += ` from ${intent.brand}`;
    }
    
    if (intent.body_type) {
      explanation += ` in the ${intent.body_type} category`;
    }

    if (intent.confidence < 0.7) {
      explanation += '. You might find more results with a more specific search.';
    } else {
      explanation += ' based on your search criteria.';
    }

    return explanation;
  }
}

export const openaiService = OpenAIService.getInstance();