// Complete and consistent database types for the CarSuggester app
export interface CarModel {
  id: number;
  name: string;
  year?: number;
  image_url?: string;
  description?: string;
  category?: string[];
  brand_id: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  brands?: {
    id: number;
    name: string;
    logo_url?: string;
  };
}

export interface Brand {
  id: number;
  name: string;
  logo_url?: string;
  description?: string;
  category?: string[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Review {
  id: number | string;
  model_id?: number;
  cs_score?: number;
  summary?: string;
  performance?: string;
  exterior?: string;
  interior?: string;
  practicality?: string;
  tech?: string;
  verdict?: string;
  title: string;
  content: string;
  rating: number;
  author: string;
  car_make: string;
  car_model: string;
  car_year: number;
  images?: string[];
  tags?: string[];
  created_at: string;
  sections?: {
    performance?: string;
    exterior?: string;
    interior?: string;
    practicality?: string;
    tech?: string;
    verdict?: string;
  };
  car_models?: CarModel;
}

export interface VehicleListing {
  id: string;
  dealer_id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  location_city?: string;
  location_state?: string;
  condition?: string;
  fuel_type?: string;
  transmission?: string;
  exterior_color?: string;
  interior_color?: string;
  description?: string;
  features?: string[];
  images?: string[];
  status?: string;
  created_at: string;
  updated_at: string;
  dealers?: {
    business_name: string;
    verified: boolean;
    rating?: number;
  };
}

export interface Dealer {
  id: string;
  user_id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  verified?: boolean;
  rating?: number;
  specialties?: string[];
  created_at: string;
  updated_at: string;
}

// Transformed types for the app
export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  location: string;
  images: string[];
  created_at: string;
  title?: string;
  description?: string;
  features?: string[];
  condition?: string;
  fuel_type?: string;
  transmission?: string;
  exterior_color?: string;
  interior_color?: string;
  dealer?: {
    name: string;
    verified: boolean;
  };
}

// Database types (raw from Supabase)
export interface DatabaseVehicleListing {
  id: string;
  dealer_id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  location_city?: string;
  location_state?: string;
  condition?: string;
  fuel_type?: string;
  transmission?: string;
  exterior_color?: string;
  interior_color?: string;
  description?: string;
  features?: string[];
  images?: string[];
  status?: string;
  created_at: string;
  updated_at: string;
  dealers?: {
    business_name: string;
    verified: boolean;
    rating?: number;
  };
}

export interface DatabaseReview {
  id: number;
  model_id?: number;
  cs_score?: number;
  summary?: string;
  performance?: string;
  exterior?: string;
  interior?: string;
  practicality?: string;
  tech?: string;
  verdict?: string;
  car_models?: {
    id: number;
    name: string;
    year?: number;
    image_url?: string;
    brands?: {
      id: number;
      name: string;
      logo_url?: string;
    };
  };
}

export interface DatabaseCarModel {
  id: number;
  brand_id: number;
  name: string;
  year?: number;
  description?: string;
  image_url?: string;
  category?: string[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  brands?: {
    id: number;
    name: string;
    logo_url?: string;
  };
}

export interface DatabaseBrand {
  id: number;
  name: string;
  logo_url?: string;
  description?: string;
  category?: string[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}