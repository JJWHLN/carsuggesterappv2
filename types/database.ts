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
  // Expert verification fields
  expert_id?: string;
  expert_name?: string;
  expert_credentials?: string[];
  verification_level?: 'verified' | 'expert' | 'master';
  review_methodology?: string;
  testing_duration?: number; // days
  testing_conditions?: string[];
  photo_evidence?: string[];
  video_evidence?: string[];
  quality_score?: number;
  editorial_approval?: boolean;
  fact_checked?: boolean;
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

// Dealership Review System
export interface DealershipReview {
  id: string;
  dealer_id: string;
  title: string;
  content: string;
  overall_rating: number;
  customer_service_rating: number;
  sales_process_rating: number;
  facility_rating: number;
  pricing_transparency_rating: number;
  follow_up_rating: number;
  expert_summary: string;
  pros: string[];
  cons: string[];
  visit_date: string;
  review_type: 'expert_visit' | 'mystery_shopper' | 'customer_experience';
  verified_purchase?: boolean;
  vehicle_purchased?: string; // Make/Model if applicable
  author: string;
  author_credentials: string;
  images?: string[];
  created_at: string;
  updated_at: string;
  published: boolean;
  featured: boolean;
  dealers?: {
    business_name: string;
    verified: boolean;
    city: string;
    state: string;
  };
}

// Dealership Analytics & Performance Tracking
export interface DealershipMetrics {
  dealer_id: string;
  overall_score: number;
  review_count: number;
  average_customer_service: number;
  average_sales_process: number;
  average_facility: number;
  average_pricing_transparency: number;
  average_follow_up: number;
  recommendation_percentage: number;
  last_updated: string;
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

export type UserRole = 'user' | 'dealer' | 'admin' | 'expert' | 'editor';

export interface Profile {
  id: string;
  email?: string;
  role: UserRole;
  onboarding_completed?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Expert and Authority System Types
export interface ExpertProfile {
  id: string;
  user_id: string;
  name: string;
  title: string;
  bio: string;
  years_experience: number;
  specializations: string[];
  verification_level: 'verified' | 'expert' | 'master';
  profile_image_url?: string;
  location?: string;
  website?: string;
  social_proof: {
    reviews_written: number;
    helpful_votes: number;
    followers_count: number;
    industry_connections: number;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ExpertCredential {
  id: string;
  expert_id: string;
  title: string;
  organization: string;
  issue_date: string;
  expiry_date?: string;
  credential_id: string;
  verification_url?: string;
  logo_url?: string;
  category: 'certification' | 'education' | 'membership' | 'award';
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface QualityMetric {
  id: string;
  review_id: string;
  accuracy_score: number;
  completeness_score: number;
  timeliness_score: number;
  independence_score: number;
  expertise_score: number;
  transparency_score: number;
  overall_score: number;
  fact_checked: boolean;
  editorial_approved: boolean;
  quality_notes?: string;
  reviewed_by: string;
  reviewed_at: string;
  created_at: string;
  updated_at: string;
}

export interface TrustIndicator {
  id: string;
  type: 'iso_certification' | 'industry_partnership' | 'editorial_standard' | 'verification_process' | 'transparency_policy';
  title: string;
  description: string;
  verification_url?: string;
  issue_date: string;
  expiry_date?: string;
  status: 'active' | 'expired' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface AuthorityMetric {
  id: string;
  metric_type: 'trust_score' | 'expert_count' | 'reviews_published' | 'user_satisfaction' | 'industry_recognition' | 'media_features';
  value: number;
  trend_direction: 'up' | 'down' | 'stable';
  trend_percentage: number;
  measurement_period: string;
  recorded_at: string;
  created_at: string;
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