import { DatabaseVehicleListing, Car, DatabaseReview, Review, DatabaseCarModel, CarModel, DatabaseBrand, Brand } from '@/types/database';
// Import the consolidated formatters and necessary validation helpers
import {
    isValidUrl as _isValidUrl, // Alias to avoid naming conflict if a local one was intended for some reason
    isValidString as _isValidString,
    isValidNumber as _isValidNumber,
    isValidDate as _isValidDate
    // Specific formatters are not directly used by transformers, but re-exported for compatibility
} from './formatters';

// Re-export formatters for backward compatibility
// Components that used formatters from dataTransformers will still work.
// Ideally, they should be updated to import from formatters.ts directly.
export {
    formatPrice,
    formatMileage,
    formatDate,
    formatFullDate,
    formatCondition,
    formatFuelType,
    formatTransmission,
    formatLocation,
    getImageUrl
} from './formatters';


const DEFAULT_CAR_IMAGES = [
  'https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/909907/pexels-photo-909907.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1149137/pexels-photo-1149137.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=800',
];

const DEFAULT_REVIEW_IMAGES = [
  'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=800',
  'https://images.pexels.com/photos/1149137/pexels-photo-1149137.jpeg?auto=compress&cs=tinysrgb&w=800',
];

// Use aliased validation helpers from formatters.ts
// These are now effectively local to this module after import.
const isValidUrl = _isValidUrl;
const isValidString = _isValidString;
const isValidNumber = _isValidNumber;
const isValidDate = _isValidDate;


// Enhanced transformer with better error handling and validation
export function transformDatabaseVehicleListingToCar(dbListing: DatabaseVehicleListing): Car {
  if (!dbListing || typeof dbListing !== 'object') {
    // Consider throwing a more specific error or returning a default Car object
    logger.warn('Invalid database listing provided to transformer:', dbListing);
    // Fallback to a default structure or throw error
    return { /* default/empty Car structure */ } as Car;
  }

  const location = (() => {
    const city = isValidString(dbListing.location_city) ? dbListing.location_city.trim() : '';
    const state = isValidString(dbListing.location_state) ? dbListing.location_state.trim() : '';
    if (city && state) return `${city}, ${state}`;
    if (city) return city;
    if (state) return state;
    return 'N/A';
  })();

  const images = (() => {
    let validImages: string[] = [];
    if (Array.isArray(dbListing.images)) {
      validImages = dbListing.images
        .filter(img => isValidString(img) && isValidUrl(img))
        .slice(0, 10);
    }
    if (validImages.length === 0) {
      const makeIndex = isValidString(dbListing.make) 
        ? dbListing.make.toLowerCase().charCodeAt(0) % DEFAULT_CAR_IMAGES.length 
        : 0;
      validImages = [DEFAULT_CAR_IMAGES[makeIndex]];
    }
    return validImages;
  })();

  const features = Array.isArray(dbListing.features) 
    ? dbListing.features
        .filter(feature => isValidString(feature))
        .map(feature => feature.trim())
        .slice(0, 20)
    : [];

  const dealer = dbListing.dealers ? {
    name: isValidString(dbListing.dealers.business_name) 
      ? dbListing.dealers.business_name.trim() 
      : 'Unknown Dealer',
    verified: Boolean(dbListing.dealers.verified)
  } : undefined;

  return {
    id: isValidString(dbListing.id) ? dbListing.id : `unknown-${Date.now()}`,
    make: isValidString(dbListing.make) ? dbListing.make.trim() : 'Unknown',
    model: isValidString(dbListing.model) ? dbListing.model.trim() : 'Unknown',
    year: isValidNumber(dbListing.year) && dbListing.year >= 1900 && dbListing.year <= new Date().getFullYear() + 2
      ? dbListing.year 
      : new Date().getFullYear(),
    price: isValidNumber(dbListing.price) && dbListing.price >= 0 ? dbListing.price : 0,
    mileage: isValidNumber(dbListing.mileage) && dbListing.mileage >= 0 ? dbListing.mileage : 0,
    location,
    images,
    created_at: isValidDate(dbListing.created_at) ? dbListing.created_at : new Date().toISOString(),
    title: isValidString(dbListing.title) ? dbListing.title.trim() : `${dbListing.year || ''} ${dbListing.make || ''} ${dbListing.model || ''}`.trim(),
    description: isValidString(dbListing.description) ? dbListing.description.trim() : undefined,
    features,
    dealer,
    condition: isValidString(dbListing.condition) ? dbListing.condition : undefined,
    fuel_type: isValidString(dbListing.fuel_type) ? dbListing.fuel_type : undefined,
    transmission: isValidString(dbListing.transmission) ? dbListing.transmission : undefined,
    exterior_color: isValidString(dbListing.exterior_color) ? dbListing.exterior_color.trim() : undefined,
    interior_color: isValidString(dbListing.interior_color) ? dbListing.interior_color.trim() : undefined,
  };
}

export function transformDatabaseReviewToReview(dbReview: DatabaseReview): Review {
  if (!dbReview || typeof dbReview !== 'object') {
    logger.warn('Invalid database review provided to transformer:', dbReview);
    return { /* default/empty Review structure */ } as Review;
  }

  const carMake = dbReview.car_models?.brands?.name && isValidString(dbReview.car_models.brands.name)
    ? dbReview.car_models.brands.name.trim()
    : 'Unknown Make';
  const carModel = dbReview.car_models?.name && isValidString(dbReview.car_models.name)
    ? dbReview.car_models.name.trim()
    : 'Unknown Model';
  const carYear = isValidNumber(dbReview.car_models?.year) && 
    dbReview.car_models.year >= 1900 && 
    dbReview.car_models.year <= new Date().getFullYear() + 2
    ? dbReview.car_models.year 
    : new Date().getFullYear();

  const sections = {
    summary: isValidString(dbReview.summary) ? dbReview.summary.trim() : undefined, // Keep summary distinct
    performance: isValidString(dbReview.performance) ? dbReview.performance.trim() : undefined,
    exterior: isValidString(dbReview.exterior) ? dbReview.exterior.trim() : undefined,
    interior: isValidString(dbReview.interior) ? dbReview.interior.trim() : undefined,
    practicality: isValidString(dbReview.practicality) ? dbReview.practicality.trim() : undefined,
    tech: isValidString(dbReview.tech) ? dbReview.tech.trim() : undefined,
    verdict: isValidString(dbReview.verdict) ? dbReview.verdict.trim() : undefined,
  };

  // Construct main content from available sections if summary is not primary source
  const contentParts = Object.values(sections).filter(isValidString);
  const content = contentParts.length > 0 ? contentParts.join('\n\n') : 'No detailed content available.';


  const title = isValidString(dbReview.summary) // Prefer summary for title if available and short enough
    ? dbReview.summary.substring(0, 70) + (dbReview.summary.length > 70 ? '...' : '')
    : `${carYear} ${carMake} ${carModel} In-depth Review`;

  const tags: string[] = [];
  if (sections.performance) tags.push('Performance');
  if (sections.exterior) tags.push('Design');
  if (sections.interior) tags.push('Interior');
  if (sections.practicality) tags.push('Practicality');
  if (sections.tech) tags.push('Technology');
  
  const csScore = isValidNumber(dbReview.cs_score) ? Math.max(0, Math.min(100, dbReview.cs_score)) : 70;
  if (csScore >= 80) tags.push('Highly Rated');
  if (csScore >= 90) tags.push('Editor\'s Choice');

  const images = (() => {
    if (dbReview.car_models?.image_url && isValidUrl(dbReview.car_models.image_url)) {
      return [dbReview.car_models.image_url];
    }
    // Fallback to a default review image if no car model image
    const modelIndex = isValidString(carModel)
        ? carModel.toLowerCase().charCodeAt(0) % DEFAULT_REVIEW_IMAGES.length
        : 0;
    return [DEFAULT_REVIEW_IMAGES[modelIndex]];
  })();

  const rating = Math.min(Math.max(Math.round(csScore / 20), 1), 5);

  return {
    id: isValidNumber(dbReview.id) ? dbReview.id.toString() : `review-${Date.now()}`,
    model_id: dbReview.car_models?.id,
    title,
    content, // This is the main combined content
    rating,
    author: 'CarSuggester Expert', // Assuming a default author
    car_make: carMake,
    car_model: carModel,
    car_year: carYear,
    images,
    tags,
    created_at: new Date().toISOString(),
    cs_score: csScore,
    sections, // Keep individual sections if needed for structured display
    summary: sections.summary, // Explicitly include summary here as well
    car_models: dbReview.car_models ? transformDatabaseCarModelToCarModel(dbReview.car_models as DatabaseCarModel) : undefined,
  };
}

export function transformDatabaseCarModelToCarModel(dbModel: DatabaseCarModel): CarModel {
  if (!dbModel || typeof dbModel !== 'object') {
     logger.warn('Invalid database car model provided to transformer:', dbModel);
    return { /* default/empty CarModel structure */ } as CarModel;
  }

  return {
    id: isValidNumber(dbModel.id) ? dbModel.id : 0,
    brand_id: isValidNumber(dbModel.brand_id) ? dbModel.brand_id : 0,
    name: isValidString(dbModel.name) ? dbModel.name.trim() : 'Unknown Model',
    year: isValidNumber(dbModel.year) ? dbModel.year : undefined,
    description: isValidString(dbModel.description) ? dbModel.description.trim() : undefined,
    image_url: isValidString(dbModel.image_url) && isValidUrl(dbModel.image_url) 
      ? dbModel.image_url 
      : DEFAULT_CAR_IMAGES[0],
    category: Array.isArray(dbModel.category) 
      ? dbModel.category.filter(cat => isValidString(cat))
      : [], // Default to empty array
    brands: dbModel.brands ? {
      id: isValidNumber(dbModel.brands.id) ? dbModel.brands.id : 0,
      name: isValidString(dbModel.brands.name) ? dbModel.brands.name.trim() : 'Unknown Brand',
      logo_url: isValidString(dbModel.brands.logo_url) && isValidUrl(dbModel.brands.logo_url)
        ? dbModel.brands.logo_url
        : undefined,
    } : undefined,
    is_active: dbModel.is_active !== undefined ? dbModel.is_active : true,
    created_at: isValidDate(dbModel.created_at) ? dbModel.created_at : undefined,
    updated_at: isValidDate(dbModel.updated_at) ? dbModel.updated_at : undefined,
  };
}

export function transformDatabaseBrandToBrand(dbBrand: DatabaseBrand): Brand {
  if (!dbBrand || typeof dbBrand !== 'object') {
    logger.warn('Invalid database brand provided to transformer:', dbBrand);
    return { /* default/empty Brand structure */ } as Brand;
  }

  return {
    id: isValidNumber(dbBrand.id) ? dbBrand.id : 0,
    name: isValidString(dbBrand.name) ? dbBrand.name.trim() : 'Unknown Brand',
    logo_url: isValidString(dbBrand.logo_url) && isValidUrl(dbBrand.logo_url) 
      ? dbBrand.logo_url 
      : undefined,
    description: isValidString(dbBrand.description) ? dbBrand.description.trim() : undefined,
    category: Array.isArray(dbBrand.category) 
      ? dbBrand.category.filter(cat => isValidString(cat))
      : [], // Default to empty array
    is_active: dbBrand.is_active !== undefined ? dbBrand.is_active : true,
    created_at: isValidDate(dbBrand.created_at) ? dbBrand.created_at : undefined,
    updated_at: isValidDate(dbBrand.updated_at) ? dbBrand.updated_at : undefined,
  };
}

// Enhanced sanitization with better security - kept here as it's query-specific
export function sanitizeSearchQuery(query: string): string {
  if (!_isValidString(query)) return ''; // Use the imported helper
  
  // More restrictive sanitization for search queries
  let sanitized = query.trim();
  // Remove characters that are problematic for 'ilike' or FTS, beyond basic SQL injection
  sanitized = sanitized.replace(/[%_]/g, ''); // Remove LIKE wildcards if user shouldn't control them
  sanitized = sanitized.replace(/[<>;&|*()$`]/g, ''); // Remove other potentially problematic chars
  sanitized = sanitized.replace(/['"]/g, "''"); // Escape single quotes for SQL strings
  sanitized = sanitized.replace(/--+/g, ''); // Remove SQL comments
  sanitized = sanitized.replace(/\s\s+/g, ' '); // Normalize multiple spaces to one
  
  return sanitized.substring(0, 100); // Limit length
}


// Legacy function names for backward compatibility
export const transformDatabaseCarToCar = transformDatabaseVehicleListingToCar;