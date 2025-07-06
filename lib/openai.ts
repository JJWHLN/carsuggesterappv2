export interface CarSearchParams {
  make?: string;
  model?: string;
  year?: number;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  features?: string[];
}

interface AISearchResult {
  searchParams: CarSearchParams;
  explanation: string;
  confidence: number;
}

// Enhanced AI search with better parsing and validation
export async function parseSearchQuery(query: string): Promise<CarSearchParams> {
  try {
    // Simulate network delay for now - in production this would call OpenAI API
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const result = await processSearchWithAI(query);
    
    console.log('🤖 AI Search Result:', result);
    
    return result.searchParams;
  } catch (error) {
    console.error('❌ AI Search Error:', error);
    
    // Fallback to basic parsing if AI fails
    return fallbackParseQuery(query);
  }
}

// Simulate OpenAI API call - in production this would be a real API call
async function processSearchWithAI(query: string): Promise<AISearchResult> {
  // Enhanced parsing logic that simulates AI understanding
  const params: CarSearchParams = {};
  const lowerQuery = query.toLowerCase();
  let confidence = 0.7;
  let explanation = `Analyzing: "${query}"\n\n`;
  
  // Enhanced make detection with synonyms and brands
  const makeMap = {
    'toyota': ['toyota', 'prius', 'camry', 'corolla', 'rav4', 'highlander'],
    'honda': ['honda', 'civic', 'accord', 'cr-v', 'pilot'],
    'ford': ['ford', 'mustang', 'f-150', 'explorer', 'escape'],
    'chevrolet': ['chevrolet', 'chevy', 'silverado', 'tahoe', 'malibu'],
    'nissan': ['nissan', 'altima', 'sentra', 'rogue', 'pathfinder'],
    'bmw': ['bmw', 'beemer', 'bimmer', '3 series', '5 series', 'x3', 'x5'],
    'mercedes': ['mercedes', 'benz', 'mercedes-benz', 'c-class', 'e-class', 's-class'],
    'audi': ['audi', 'a3', 'a4', 'a6', 'q5', 'q7'],
    'lexus': ['lexus', 'rx', 'es', 'ls', 'gx'],
    'tesla': ['tesla', 'model s', 'model 3', 'model x', 'model y'],
    'hyundai': ['hyundai', 'elantra', 'sonata', 'tucson', 'santa fe'],
    'kia': ['kia', 'optima', 'forte', 'sorento', 'sportage']
  };
  
  for (const [make, keywords] of Object.entries(makeMap)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      params.make = make.charAt(0).toUpperCase() + make.slice(1);
      explanation += `🚗 Detected make: ${params.make}\n`;
      confidence += 0.1;
      break;
    }
  }

  // Enhanced model detection
  const modelPatterns = [
    { pattern: /civic/i, model: 'Civic', make: 'Honda' },
    { pattern: /accord/i, model: 'Accord', make: 'Honda' },
    { pattern: /camry/i, model: 'Camry', make: 'Toyota' },
    { pattern: /corolla/i, model: 'Corolla', make: 'Toyota' },
    { pattern: /prius/i, model: 'Prius', make: 'Toyota' },
    { pattern: /mustang/i, model: 'Mustang', make: 'Ford' },
    { pattern: /f-?150/i, model: 'F-150', make: 'Ford' },
    { pattern: /model [3sxy]/i, model: 'Model', make: 'Tesla' },
  ];

  for (const { pattern, model, make } of modelPatterns) {
    if (pattern.test(query)) {
      params.model = model;
      if (!params.make) {
        params.make = make;
        explanation += `🚗 Detected make from model: ${make}\n`;
      }
      explanation += `🚙 Detected model: ${model}\n`;
      confidence += 0.15;
      break;
    }
  }

  // Enhanced year detection
  const yearMatches = query.match(/\b(19|20)\d{2}\b/g);
  if (yearMatches) {
    const years = yearMatches.map(y => parseInt(y)).filter(y => y >= 1990 && y <= 2025);
    if (years.length > 0) {
      params.year = Math.max(...years); // Use the latest year if multiple found
      explanation += `📅 Detected year: ${params.year}\n`;
      confidence += 0.1;
    }
  }

  // Enhanced price detection
  const pricePatterns = [
    { pattern: /under\s*\$?(\d+(?:,?\d{3})*(?:k|thousand)?)/i, type: 'max' },
    { pattern: /below\s*\$?(\d+(?:,?\d{3})*(?:k|thousand)?)/i, type: 'max' },
    { pattern: /less than\s*\$?(\d+(?:,?\d{3})*(?:k|thousand)?)/i, type: 'max' },
    { pattern: /over\s*\$?(\d+(?:,?\d{3})*(?:k|thousand)?)/i, type: 'min' },
    { pattern: /above\s*\$?(\d+(?:,?\d{3})*(?:k|thousand)?)/i, type: 'min' },
    { pattern: /more than\s*\$?(\d+(?:,?\d{3})*(?:k|thousand)?)/i, type: 'min' },
    { pattern: /\$(\d+(?:,?\d{3})*(?:k|thousand)?)\s*-\s*\$?(\d+(?:,?\d{3})*(?:k|thousand)?)/i, type: 'range' },
  ];

  for (const { pattern, type } of pricePatterns) {
    const match = query.match(pattern);
    if (match) {
      if (type === 'range') {
        const min = parsePrice(match[1]);
        const max = parsePrice(match[2]);
        params.minPrice = min;
        params.maxPrice = max;
        explanation += `💰 Detected price range: $${min.toLocaleString()} - $${max.toLocaleString()}\n`;
      } else {
        const price = parsePrice(match[1]);
        if (type === 'max') {
          params.maxPrice = price;
          explanation += `💰 Detected max price: $${price.toLocaleString()}\n`;
        } else {
          params.minPrice = price;
          explanation += `💰 Detected min price: $${price.toLocaleString()}\n`;
        }
      }
      confidence += 0.1;
      break;
    }
  }

  // Location detection
  const locationPattern = /(in|near|around)\s+([a-zA-Z\s,]+?)(?:\s|$)/i;
  const locationMatch = query.match(locationPattern);
  if (locationMatch) {
    params.location = locationMatch[2].trim();
    explanation += `📍 Detected location: ${params.location}\n`;
    confidence += 0.1;
  }

  // Feature detection
  const featureKeywords = {
    'leather': ['leather', 'leather seats'],
    'sunroof': ['sunroof', 'moonroof'],
    'navigation': ['navigation', 'nav', 'gps'],
    'backup camera': ['backup camera', 'rear camera', 'reverse camera'],
    'heated seats': ['heated seats', 'seat heaters'],
    'bluetooth': ['bluetooth', 'wireless'],
    'automatic': ['automatic', 'auto transmission'],
    'manual': ['manual', 'stick shift', 'manual transmission'],
    'awd': ['awd', 'all wheel drive', '4wd', 'four wheel drive'],
    'hybrid': ['hybrid', 'electric'],
    'diesel': ['diesel'],
    'turbo': ['turbo', 'turbocharged']
  };

  const detectedFeatures: string[] = [];
  for (const [feature, keywords] of Object.entries(featureKeywords)) {
    if (keywords.some(keyword => lowerQuery.includes(keyword))) {
      detectedFeatures.push(feature);
    }
  }

  if (detectedFeatures.length > 0) {
    params.features = detectedFeatures;
    explanation += `⚙️ Detected features: ${detectedFeatures.join(', ')}\n`;
    confidence += 0.05 * detectedFeatures.length;
  }

  return {
    searchParams: params,
    explanation,
    confidence: Math.min(confidence, 1.0)
  };
}

// Helper function to parse price strings
function parsePrice(priceStr: string): number {
  const cleaned = priceStr.replace(/,/g, '').toLowerCase();
  const num = parseFloat(cleaned);
  
  if (cleaned.includes('k') || cleaned.includes('thousand')) {
    return num * 1000;
  }
  
  return num;
}

// Fallback parsing function for when AI processing fails
function fallbackParseQuery(query: string): CarSearchParams {
  const params: CarSearchParams = {};
  const lowerQuery = query.toLowerCase();
  
  // Basic make detection
  const makes = ['toyota', 'honda', 'ford', 'chevrolet', 'nissan', 'bmw', 'mercedes', 'audi', 'lexus'];
  for (const make of makes) {
    if (lowerQuery.includes(make)) {
      params.make = make.charAt(0).toUpperCase() + make.slice(1);
      break;
    }
  }
  
  // Basic year detection
  const yearMatch = query.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    params.year = parseInt(yearMatch[0]);
  }
  
  // Basic price detection
  const priceMatch = query.match(/under\s*\$?(\d+(?:,\d{3})*)/i);
  if (priceMatch) {
    params.maxPrice = parseInt(priceMatch[1].replace(/,/g, ''));
  }
  
  return params;
}
