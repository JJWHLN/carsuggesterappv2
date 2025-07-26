/**
 * 🚗 Car & Vehicle Models
 * Consolidated car-related type definitions
 */

// Base car interface - core properties all cars must have
export interface BaseCar {
  readonly id: string;
  readonly make: string;
  readonly model: string;
  readonly year: number;
  readonly price: number;
}

// Full car interface with all possible properties
export interface Car extends BaseCar {
  // Physical properties
  mileage?: number;
  bodyStyle?: string;
  condition?: 'new' | 'used' | 'certified';

  // Technical specifications
  fuelType?: string;
  transmission?: 'automatic' | 'manual' | 'cvt';
  drivetrain?: 'fwd' | 'rwd' | 'awd' | '4wd';
  engineSize?: string;
  fuelEfficiency?: number; // mpg or L/100km

  // Performance metrics
  powerHp?: number;
  torqueNm?: number;
  acceleration0To60?: number;
  topSpeedKmh?: number;
  co2Emissions?: number;

  // Features & equipment
  features?: readonly string[];
  standardFeatures?: readonly string[];
  optionalFeatures?: readonly string[];
  safetyRating?: number; // 0-5

  // Media & presentation
  images?: readonly string[];
  primaryImageUrl?: string;
  title?: string;
  description?: string;

  // Location & dealer info
  location?: string;
  locationCity?: string;
  locationState?: string;
  dealer?: DealerInfo;

  // User interaction
  isSaved?: boolean;
  isBookmarked?: boolean;
  rating?: number;
  viewCount?: number;

  // Metadata
  readonly createdAt?: string;
  readonly updatedAt?: string;
  status?: 'active' | 'sold' | 'pending' | 'inactive';
}

// Extended car with additional computed properties
export interface ExtendedCar extends Car {
  // Computed values
  priceRange?: string;
  formattedPrice?: string;
  formattedMileage?: string;
  ageInYears?: number;

  // Analytics & tracking
  viewDuration?: number;
  lastViewed?: string;

  // Comparison data
  comparisonData?: {
    pros: readonly string[];
    cons: readonly string[];
    score: number;
    rank?: number;
  };

  // Price analysis
  priceHistory?: readonly PriceHistoryEntry[];
  marketAnalysis?: {
    isGoodDeal: boolean;
    marketPosition: 'below' | 'average' | 'above';
    percentageDifference: number;
  };
}

// Car for display in lists/grids
export interface CarListItem extends BaseCar {
  primaryImage?: string;
  mileage?: number;
  location?: string;
  isSaved?: boolean;
  dealer?: Pick<DealerInfo, 'name' | 'verified'>;
  formattedPrice?: string;
}

// Database car model (matches Supabase schema)
export interface DatabaseCarModel {
  readonly id: number;
  readonly brand_id: number;
  readonly name: string;
  readonly model: string;
  readonly year: number;
  description?: string;
  image_url?: string;
  category?: readonly string[];

  // Engine specifications
  engine_size?: string;
  fuel_type?: string;
  transmission?: string;
  drivetrain?: string;

  // Performance metrics
  power_hp?: number;
  torque_nm?: number;
  acceleration_0_60?: number;
  top_speed_kmh?: number;

  // Economics
  fuel_economy_combined?: number;
  co2_emissions?: number;
  price_from?: number;
  price_to?: number;

  // Safety and warranty
  safety_rating?: number;
  warranty_years?: number;

  // Features
  standard_features?: readonly string[];
  optional_features?: readonly string[];

  // Metadata
  is_active?: boolean;
  readonly created_at?: string;
  readonly updated_at?: string;

  // Relations (populated by joins)
  brands?: Brand;
}

// Database vehicle listing (matches Supabase schema)
export interface DatabaseVehicleListing {
  readonly id: string;
  readonly dealer_id: string;
  readonly make: string;
  readonly model: string;
  readonly year: number;
  readonly price: number;
  vin?: string;
  mileage?: number;
  condition?: string;

  // Technical specs
  fuel_type?: string;
  transmission?: string;
  drivetrain?: string;
  exterior_color?: string;
  interior_color?: string;

  // Content
  title?: string;
  description?: string;
  images?: readonly string[];
  features?: readonly string[];

  // Location
  location_city?: string;
  location_state?: string;
  location_zip?: string;

  // Metadata
  status?: string;
  readonly created_at?: string;
  readonly updated_at?: string;

  // Relations (populated by joins)
  dealers?: Dealer;
}

// Brand information
export interface Brand {
  readonly id: number;
  readonly name: string;
  readonly logo_url?: string;
  description?: string;
  country_of_origin?: string;
  website_url?: string;
  is_active?: boolean;
  readonly created_at?: string;
}

// Dealer information
export interface DealerInfo {
  readonly id: string;
  readonly name: string;
  businessName?: string;
  verified?: boolean;
  rating?: number;
  reviewCount?: number;
  location?: string;
  phone?: string;
  email?: string;
  website?: string;
}

// Full dealer interface (matches database)
export interface Dealer extends DealerInfo {
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  licenseNumber?: string;
  businessHours?: Record<string, string>;
  specialties?: readonly string[];
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

// Price history entry
export interface PriceHistoryEntry {
  readonly date: string;
  readonly price: number;
  source?: string;
}

// Car filters for search
export interface CarFilters {
  make?: readonly string[];
  model?: readonly string[];
  year?: {
    min: number;
    max: number;
  };
  price?: {
    min: number;
    max: number;
  };
  mileage?: {
    max: number;
  };
  bodyStyle?: readonly string[];
  fuelType?: readonly string[];
  transmission?: readonly string[];
  drivetrain?: readonly string[];
  condition?: readonly ('new' | 'used' | 'certified')[];
  features?: readonly string[];
  location?: {
    radius: number;
    center: readonly [number, number]; // [lat, lng]
  };
  safetyRating?: {
    min: number;
  };
  fuelEfficiency?: {
    min: number;
  };
}

// Car search result
export interface CarSearchResult {
  readonly cars: readonly Car[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly filters: CarFilters;
  readonly facets?: SearchFacets;
}

// Search facets for filtering UI
export interface SearchFacets {
  readonly makes: readonly FacetItem[];
  readonly models: readonly FacetItem[];
  readonly years: readonly FacetItem[];
  readonly priceRanges: readonly FacetItem[];
  readonly bodyStyles: readonly FacetItem[];
  readonly fuelTypes: readonly FacetItem[];
}

export interface FacetItem {
  readonly value: string;
  readonly count: number;
  readonly label?: string;
}

// Car comparison types
export interface ComparisonCar extends Car {
  comparisonData?: {
    pros: readonly string[];
    cons: readonly string[];
    score: number;
    categories: Record<string, number>; // category -> score
  };
}

export interface CarComparison {
  readonly id: string;
  readonly cars: readonly ComparisonCar[];
  readonly createdAt: string;
  readonly updatedAt?: string;
}

// Car recommendation
export interface CarRecommendation {
  readonly car: Car;
  readonly score: number;
  readonly reasons: readonly string[];
  readonly confidence: number;
  readonly matchPercentage: number;
  readonly category:
    | 'perfect_match'
    | 'good_match'
    | 'consider'
    | 'alternative';
}

// Featured car
export interface FeaturedCar {
  readonly id: number;
  readonly modelId: number;
  readonly priority: number;
  readonly featuredText?: string;
  readonly car?: Car;
  readonly createdAt?: string;
}

// Type guards for runtime type checking
export const isBaseCar = (obj: unknown): obj is BaseCar => {
  if (typeof obj !== 'object' || obj === null) return false;
  const car = obj as Record<string, unknown>;
  return (
    typeof car.id === 'string' &&
    typeof car.make === 'string' &&
    typeof car.model === 'string' &&
    typeof car.year === 'number' &&
    typeof car.price === 'number'
  );
};

export const isCar = (obj: unknown): obj is Car => {
  return isBaseCar(obj);
};

export const isDatabaseCarModel = (obj: unknown): obj is DatabaseCarModel => {
  if (typeof obj !== 'object' || obj === null) return false;
  const model = obj as Record<string, unknown>;
  return (
    typeof model.id === 'number' &&
    typeof model.brand_id === 'number' &&
    typeof model.name === 'string' &&
    typeof model.model === 'string' &&
    typeof model.year === 'number'
  );
};

// Utility types
export type CarSortOption =
  | 'price_asc'
  | 'price_desc'
  | 'year_desc'
  | 'year_asc'
  | 'mileage_asc'
  | 'mileage_desc'
  | 'relevance'
  | 'created_desc';

export type CarCondition = 'new' | 'used' | 'certified';
export type TransmissionType = 'automatic' | 'manual' | 'cvt';
export type DrivetrainType = 'fwd' | 'rwd' | 'awd' | '4wd';
export type FuelType =
  | 'gasoline'
  | 'diesel'
  | 'hybrid'
  | 'electric'
  | 'plug-in-hybrid';
