// Database types matching your actual Supabase schema
export interface UserProfile {
  id: string; // UUID references auth.users
  username?: string;
  full_name?: string;
  bio?: string;
  phone?: string;
  location?: string;
  avatar_url?: string;
  twitter_url?: string;
  linkedin_url?: string;
  instagram_url?: string;
  email_confirmed?: boolean;
  deletion_requested_at?: string;
  deletion_reason?: string;
  gdpr_consent_date?: string;
  county?: string;
  created_at?: string;
  updated_at?: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'dealer' | 'user';
  created_at: string;
}

export interface Brand {
  id: number;
  name: string;
  description?: string;
  logo_url?: string;
  category?: string[];
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CarModel {
  id: number;
  brand_id: number;
  name: string;
  model: string;
  year: number;
  description?: string;
  image_url?: string;
  category?: string[];
  
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
  standard_features?: string[];
  optional_features?: string[];
  
  // Metadata
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  
  // Relations
  brands?: Brand;
}

export interface Review {
  id: number;
  model_id: number;
  cs_score?: number; // 1-10 rating
  summary?: string;
  performance?: string;
  exterior?: string;
  interior?: string;
  practicality?: string;
  tech?: string;
  verdict?: string;
  created_at?: string;
  updated_at?: string;
  
  // Relations
  car_models?: CarModel;
}

export interface ReviewSection {
  id: string;
  review_id: number;
  section_type: string;
  content: string;
  rating?: number; // 1-10 rating
  created_at?: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  target_type: string; // 'car_model', 'vehicle_listing', etc.
  target_id: string;
  created_at: string;
}

export interface SearchHistory {
  id: string;
  user_id: string;
  search_query: string;
  filters?: Record<string, any>; // JSONB
  results_count: number;
  created_at: string;
}

export interface Dealer {
  id: string;
  user_id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  website?: string;
  description?: string;
  logo_url?: string;
  specialties?: string[];
  verified?: boolean;
  rating?: number;
  total_reviews?: number;
  social_media?: Record<string, any>; // JSONB
  business_hours?: Record<string, any>; // JSONB
  created_at?: string;
  updated_at?: string;
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
  condition?: string;
  fuel_type?: string;
  transmission?: string;
  drivetrain?: string;
  exterior_color?: string;
  interior_color?: string;
  vin?: string;
  description?: string;
  features?: string[];
  images?: string[];
  location_city?: string;
  location_state?: string;
  county?: string;
  status?: string;
  featured?: boolean;
  sold_at?: string;
  view_count?: number;
  rating?: number;
  total_reviews?: number;
  created_at?: string;
  updated_at?: string;
  
  // Relations
  dealers?: Dealer;
}

export interface DealerLead {
  id: string;
  user_id: string;
  dealer_id: string;
  lead_type: 'inquiry' | 'phone_call' | 'email' | 'visit';
  lead_source: 'search' | 'featured' | 'ai_recommendation' | 'browse';
  vehicle_id?: string;
  contact_info?: Record<string, any>; // JSONB
  status?: string;
  commission_rate?: number;
  commission_amount?: number;
  conversion_date?: string;
  created_at?: string;
}

export interface FeaturedCar {
  id: number;
  model_id: number;
  priority: number;
  featured_text?: string;
  created_at?: string;
  
  // Relations
  car_models?: CarModel;
}

export interface RecommendedCar {
  id: number;
  model_id: number;
  priority: number;
  recommendation_reason?: string;
  created_at?: string;
  
  // Relations
  car_models?: CarModel;
}

// Legacy interface for backward compatibility
export interface CarModelLegacy extends CarModel {
  // Alias for CarModel to maintain compatibility
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
  rating?: number;
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

export type UserRoleType = 'user' | 'dealer' | 'admin' | 'expert' | 'editor';

export interface Profile {
  id: string;
  email?: string;
  role: UserRoleType;
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

// User preferences and behavior tracking types
export interface UserPreferences {
  id?: string;
  userId?: string;
  budget?: {
    min: number;
    max: number;
  };
  preferredMakes?: string[];
  enableRecommendations?: boolean;
  enableBehaviorTracking?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BehaviorEvent {
  id?: string;
  type: 'view' | 'save' | 'unsave' | 'search' | 'contact_dealer' | 'share';
  carId: string;
  make: string;
  model?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  timestamp: number;
  userId?: string;
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