// --- Car Recommendation Types ---

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  bodyStyle: string;
  fuelEfficiency: number; // mpg or L/100km
  brand: string;
  features: string[];
  safetyRating: number; // 0-5
}

export interface UserPreferences {
  budget: number;
  preferredBodyStyles: string[];
  minFuelEfficiency: number;
  preferredBrands: string[];
  requiredFeatures: string[];
  minSafetyRating: number;
}

export interface UserBehavior {
  carViews: Array<{ carId: string; duration: number; timestamp: number }>;
  filterSelections: Array<{ filter: string; value: string; timestamp: number }>;
  comparisonSelections: Array<{ carIds: string[]; timestamp: number }>;
}

export interface Recommendation {
  car: Car;
  score: number;
  reasons: string[];
  confidence: number;
}
