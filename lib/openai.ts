export interface CarSearchParams {
  make?: string;
  model?: string;
  year?: number;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  features?: string[];
}

// Mock function that simulates what would happen with a backend API call
export async function parseSearchQuery(query: string): Promise<CarSearchParams> {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simple client-side parsing as a fallback until proper backend is implemented
    const params: CarSearchParams = {};
    const lowerQuery = query.toLowerCase();
    
    // Extract make
    const makes = ['toyota', 'honda', 'ford', 'chevrolet', 'nissan', 'bmw', 'mercedes', 'audi', 'lexus', 'acura'];
    for (const make of makes) {
      if (lowerQuery.includes(make)) {
        params.make = make.charAt(0).toUpperCase() + make.slice(1);
        break;
      }
    }
    
    // Extract model (basic patterns)
    const models = ['camry', 'civic', 'accord', 'corolla', 'altima', 'sentra', 'mustang', 'f-150', 'silverado'];
    for (const model of models) {
      if (lowerQuery.includes(model)) {
        params.model = model.charAt(0).toUpperCase() + model.slice(1);
        break;
      }
    }
    
    // Extract year
    const yearMatch = query.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
      params.year = parseInt(yearMatch[0]);
    }
    
    // Extract price
    const priceMatch = query.match(/under\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    if (priceMatch) {
      const price = parseInt(priceMatch[1].replace(/,/g, ''));
      params.maxPrice = price;
    }
    
    const minPriceMatch = query.match(/over\s*\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    if (minPriceMatch) {
      const price = parseInt(minPriceMatch[1].replace(/,/g, ''));
      params.minPrice = price;
    }
    
    // Extract location
    const locationMatch = query.match(/in\s+([a-zA-Z\s]+?)(?:\s|$)/i);
    if (locationMatch) {
      params.location = locationMatch[1].trim();
    }
    
    // Extract features
    const features = [];
    if (lowerQuery.includes('leather')) features.push('leather seats');
    if (lowerQuery.includes('sunroof')) features.push('sunroof');
    if (lowerQuery.includes('navigation')) features.push('navigation');
    if (lowerQuery.includes('bluetooth')) features.push('bluetooth');
    if (lowerQuery.includes('backup camera')) features.push('backup camera');
    
    if (features.length > 0) {
      params.features = features;
    }
    
    return params;
  } catch (error) {
    console.error('Search parsing error:', error);
    return {};
  }
}