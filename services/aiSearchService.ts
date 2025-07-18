import { Car as CarType } from '@/types/database';

export interface AISearchQuery {
  originalQuery: string;
  parsedIntent: {
    brand?: string;
    model?: string;
    category?: string;
    priceRange?: { min?: number; max?: number };
    fuelType?: string;
    yearRange?: { min?: number; max?: number };
    mileageRange?: { max?: number };
    features?: string[];
    location?: string;
    urgency?: 'immediate' | 'soon' | 'browsing';
  };
  confidence: number;
  suggestions?: string[];
}

export class AISearchEngine {
  private static instance: AISearchEngine;
  
  static getInstance(): AISearchEngine {
    if (!AISearchEngine.instance) {
      AISearchEngine.instance = new AISearchEngine();
    }
    return AISearchEngine.instance;
  }

  /**
   * Check if a search query contains natural language patterns
   */
  hasNaturalLanguagePatterns(query: string): boolean {
    const naturalLanguageIndicators = [
      // Price patterns
      /under|below|less than|cheaper than|budget|affordable/i,
      /over|above|more than|expensive|premium|luxury/i,
      /between.*and|from.*to|\d+k?\s*-\s*\d+k?/i,
      
      // Feature requests
      /with|having|that has|equipped with|featuring/i,
      /good|best|top|excellent|reliable|popular/i,
      /fast|quick|powerful|efficient|economical/i,
      
      // Use case patterns
      /for|suitable for|perfect for|ideal for/i,
      /family|commute|road trip|city driving|highway/i,
      /beginner|first car|student|senior/i,
      
      // Comparison patterns
      /like|similar to|compared to|versus|vs/i,
      /better than|worse than|alternative to/i,
      
      // Question patterns
      /what|which|how|where|when|why|should i|can i/i,
      /recommend|suggest|advice|help|looking for/i
    ];

    return naturalLanguageIndicators.some(pattern => pattern.test(query));
  }

  // Natural Language Processing for car search
  parseNaturalLanguage(query: string): AISearchQuery {
    const originalQuery = query.toLowerCase().trim();
    const parsedIntent: AISearchQuery['parsedIntent'] = {};
    let confidence = 0.5;
    const suggestions: string[] = [];

    // Brand detection with fuzzy matching
    const brands = [
      'bmw', 'mercedes', 'mercedes-benz', 'audi', 'toyota', 'honda', 
      'volkswagen', 'vw', 'ford', 'chevrolet', 'tesla', 'porsche', 
      'lexus', 'infiniti', 'nissan', 'mazda', 'hyundai', 'kia'
    ];
    
    for (const brand of brands) {
      if (originalQuery.includes(brand)) {
        parsedIntent.brand = this.normalizeBrand(brand);
        confidence += 0.2;
        break;
      }
    }

    // Model detection
    const models = [
      '3 series', 'c-class', 'a4', 'camry', 'civic', 'model 3', 'model s', 
      'golf', 'mustang', 'corolla', 'accord', 'altima', 'maxima'
    ];
    
    for (const model of models) {
      if (originalQuery.includes(model)) {
        parsedIntent.model = model;
        confidence += 0.15;
        break;
      }
    }

    // Category detection with semantic understanding
    const categoryKeywords = {
      'suv': ['suv', 'crossover', 'large car', 'family car', 'big car', 'spacious'],
      'sedan': ['sedan', '4 door', 'four door', 'saloon', 'traditional car'],
      'hatchback': ['hatchback', 'small car', 'compact', 'city car'],
      'electric': ['electric', 'ev', 'battery', 'zero emission', 'eco friendly', 'green'],
      'hybrid': ['hybrid', 'fuel efficient', 'eco', 'low consumption'],
      'luxury': ['luxury', 'premium', 'high end', 'expensive', 'upscale', 'fancy'],
      'sports': ['sports', 'sporty', 'fast', 'performance', 'racing', 'speed']
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => originalQuery.includes(keyword))) {
        parsedIntent.category = category;
        confidence += 0.15;
        break;
      }
    }

    // Price range detection with natural language
    const pricePatterns = [
      { pattern: /under (\d+)k?/g, type: 'max' },
      { pattern: /below (\d+)k?/g, type: 'max' },
      { pattern: /less than (\d+)k?/g, type: 'max' },
      { pattern: /over (\d+)k?/g, type: 'min' },
      { pattern: /above (\d+)k?/g, type: 'min' },
      { pattern: /more than (\d+)k?/g, type: 'min' },
      { pattern: /(\d+)k?\s*-\s*(\d+)k?/g, type: 'range' },
      { pattern: /between (\d+)k? and (\d+)k?/g, type: 'range' }
    ];

    for (const { pattern, type } of pricePatterns) {
      const match = pattern.exec(originalQuery);
      if (match) {
        if (!parsedIntent.priceRange) parsedIntent.priceRange = {};
        
        if (type === 'max') {
          parsedIntent.priceRange.max = this.parsePrice(match[1]);
        } else if (type === 'min') {
          parsedIntent.priceRange.min = this.parsePrice(match[1]);
        } else if (type === 'range') {
          parsedIntent.priceRange.min = this.parsePrice(match[1]);
          parsedIntent.priceRange.max = this.parsePrice(match[2]);
        }
        confidence += 0.2;
        break;
      }
    }

    // Year detection
    const currentYear = new Date().getFullYear();
    const yearPattern = /(\d{4})|new|recent|latest|old|older/g;
    const yearMatch = originalQuery.match(yearPattern);
    
    if (yearMatch) {
      if (yearMatch.includes('new') || yearMatch.includes('recent') || yearMatch.includes('latest')) {
        parsedIntent.yearRange = { min: currentYear - 2 };
        confidence += 0.1;
      } else if (yearMatch.includes('old') || yearMatch.includes('older')) {
        parsedIntent.yearRange = { max: currentYear - 5 };
        confidence += 0.1;
      } else {
        const years = yearMatch.filter(y => /\d{4}/.test(y)).map(Number);
        if (years.length > 0) {
          parsedIntent.yearRange = { min: Math.min(...years) };
          confidence += 0.15;
        }
      }
    }

    // Mileage detection
    const mileagePatterns = [
      /low mileage/g,
      /high mileage/g,
      /under (\d+)k miles/g,
      /less than (\d+)k miles/g
    ];

    for (const pattern of mileagePatterns) {
      const match = pattern.exec(originalQuery);
      if (match) {
        if (originalQuery.includes('low mileage')) {
          parsedIntent.mileageRange = { max: 50000 };
        } else if (originalQuery.includes('high mileage')) {
          parsedIntent.mileageRange = { max: 150000 };
        } else if (match[1]) {
          parsedIntent.mileageRange = { max: parseInt(match[1]) * 1000 };
        }
        confidence += 0.15;
        break;
      }
    }

    // Fuel type detection
    const fuelTypes = ['petrol', 'diesel', 'electric', 'hybrid', 'gas', 'gasoline'];
    for (const fuel of fuelTypes) {
      if (originalQuery.includes(fuel)) {
        parsedIntent.fuelType = fuel === 'gas' || fuel === 'gasoline' ? 'petrol' : fuel;
        confidence += 0.15;
        break;
      }
    }

    // Location detection
    const locations = ['dublin', 'cork', 'galway', 'limerick', 'waterford', 'near me', 'nearby'];
    for (const location of locations) {
      if (originalQuery.includes(location)) {
        parsedIntent.location = location;
        confidence += 0.1;
        break;
      }
    }

    // Urgency detection
    const urgencyKeywords = {
      'immediate': ['need now', 'urgent', 'asap', 'immediately', 'today'],
      'soon': ['soon', 'this week', 'this month', 'next week'],
      'browsing': ['looking', 'browsing', 'exploring', 'just checking']
    };

    for (const [urgency, keywords] of Object.entries(urgencyKeywords)) {
      if (keywords.some(keyword => originalQuery.includes(keyword))) {
        parsedIntent.urgency = urgency as any;
        confidence += 0.05;
        break;
      }
    }

    // Generate smart suggestions based on parsed intent
    this.generateSmartSuggestions(parsedIntent, suggestions);

    return {
      originalQuery: query,
      parsedIntent,
      confidence: Math.min(confidence, 1.0),
      suggestions
    };
  }

  // AI-powered car ranking based on parsed intent
  rankCars(cars: CarType[], parsedQuery: AISearchQuery): (CarType & { aiScore: number })[] {
    return cars.map(car => ({
      ...car,
      aiScore: this.calculateAIScore(car, parsedQuery)
    })).sort((a, b) => b.aiScore - a.aiScore);
  }

  private calculateAIScore(car: CarType, query: AISearchQuery): number {
    let score = 0;
    const { parsedIntent, confidence } = query;

    // Base confidence multiplier
    score += confidence * 50;

    // Brand matching
    if (parsedIntent.brand) {
      if (car.make.toLowerCase() === parsedIntent.brand.toLowerCase()) {
        score += 100;
      } else if (car.make.toLowerCase().includes(parsedIntent.brand.toLowerCase())) {
        score += 70;
      }
    }

    // Model matching
    if (parsedIntent.model) {
      if (car.model.toLowerCase().includes(parsedIntent.model.toLowerCase())) {
        score += 80;
      }
    }

    // Price range matching
    if (parsedIntent.priceRange) {
      const { min, max } = parsedIntent.priceRange;
      if (min && car.price >= min) score += 30;
      if (max && car.price <= max) score += 30;
      if (min && max && car.price >= min && car.price <= max) score += 40;
    }

    // Fuel type matching
    if (parsedIntent.fuelType && car.fuel_type) {
      if (car.fuel_type.toLowerCase() === parsedIntent.fuelType.toLowerCase()) {
        score += 60;
      }
    }

    // Year range matching
    if (parsedIntent.yearRange) {
      const { min, max } = parsedIntent.yearRange;
      if (min && car.year >= min) score += 20;
      if (max && car.year <= max) score += 20;
    }

    // Mileage matching
    if (parsedIntent.mileageRange?.max) {
      if (car.mileage <= parsedIntent.mileageRange.max) {
        score += 25;
      }
    }

    // Category-based scoring
    if (parsedIntent.category) {
      score += this.getCategoryScore(car, parsedIntent.category);
    }

    // Recency bonus
    const currentYear = new Date().getFullYear();
    score += Math.max(0, 10 - (currentYear - car.year));

    return score;
  }

  private getCategoryScore(car: CarType, category: string): number {
    // This would ideally be based on car specifications/category data
    // For now, using heuristics based on make/model/fuel type
    
    switch (category.toLowerCase()) {
      case 'luxury':
        const luxuryBrands = ['bmw', 'mercedes', 'mercedes-benz', 'audi', 'porsche', 'lexus'];
        return luxuryBrands.some(brand => car.make.toLowerCase().includes(brand)) ? 40 : 0;
      
      case 'electric':
        return car.fuel_type === 'Electric' ? 50 : 0;
      
      case 'hybrid':
        return car.fuel_type === 'Hybrid' ? 50 : 0;
      
      case 'sports':
        const sportsBrands = ['bmw', 'porsche', 'ford'];
        const sportsModels = ['mustang', 'series', 'gtr'];
        const isSports = sportsBrands.some(brand => car.make.toLowerCase().includes(brand)) ||
                        sportsModels.some(model => car.model.toLowerCase().includes(model));
        return isSports ? 35 : 0;
      
      default:
        return 0;
    }
  }

  private normalizeBrand(brand: string): string {
    const brandMap: Record<string, string> = {
      'vw': 'Volkswagen',
      'mercedes': 'Mercedes-Benz',
      'bmw': 'BMW',
      'audi': 'Audi',
      'toyota': 'Toyota',
      'honda': 'Honda',
      'ford': 'Ford',
      'tesla': 'Tesla'
    };
    
    return brandMap[brand.toLowerCase()] || 
           brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
  }

  private parsePrice(priceStr: string): number {
    const price = parseInt(priceStr);
    // If price is less than 1000, assume it's in thousands (e.g., "30" means 30k)
    return price < 1000 ? price * 1000 : price;
  }

  private generateSmartSuggestions(intent: AISearchQuery['parsedIntent'], suggestions: string[]): void {
    // Generate contextual suggestions based on parsed intent
    
    if (intent.brand && !intent.model) {
      suggestions.push(`${intent.brand} popular models`);
      suggestions.push(`Best ${intent.brand} cars`);
    }
    
    if (intent.category) {
      suggestions.push(`Best ${intent.category} cars 2024`);
      suggestions.push(`Affordable ${intent.category} vehicles`);
    }
    
    if (intent.priceRange) {
      const { min, max } = intent.priceRange;
      if (max) suggestions.push(`Best cars under €${max/1000}k`);
      if (min) suggestions.push(`Premium cars over €${min/1000}k`);
    }
    
    if (intent.fuelType === 'electric') {
      suggestions.push('Electric cars with best range');
      suggestions.push('Affordable electric vehicles');
    }
  }

  // Generate natural language explanation of search results
  explainResults(query: AISearchQuery, resultCount: number): string {
    const { parsedIntent, confidence } = query;
    
    if (confidence < 0.3) {
      return `Found ${resultCount} cars matching "${query.originalQuery}"`;
    }
    
    let explanation = `Found ${resultCount} cars`;
    
    if (parsedIntent.brand) {
      explanation += ` from ${parsedIntent.brand}`;
    }
    
    if (parsedIntent.model) {
      explanation += ` ${parsedIntent.model}`;
    }
    
    if (parsedIntent.category) {
      explanation += ` in ${parsedIntent.category} category`;
    }
    
    if (parsedIntent.priceRange) {
      const { min, max } = parsedIntent.priceRange;
      if (min && max) {
        explanation += ` priced between €${min/1000}k-€${max/1000}k`;
      } else if (max) {
        explanation += ` under €${max/1000}k`;
      } else if (min) {
        explanation += ` over €${min/1000}k`;
      }
    }
    
    if (parsedIntent.fuelType) {
      explanation += ` with ${parsedIntent.fuelType} engine`;
    }
    
    return explanation;
  }
}
