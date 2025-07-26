// Database types matching your actual Supabase schema
// Updated to work with your comprehensive car marketplace platform

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

export interface UserConsent {
  id: string;
  user_id: string;
  consent_type: string;
  consent_given: boolean;
  consent_date?: string;
  withdrawal_date?: string;
  ip_address?: string;
  user_agent?: string;
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

export interface SponsoredContent {
  id: string;
  sponsor_name: string;
  content_type:
    | 'featured_placement'
    | 'banner'
    | 'native_article'
    | 'comparison_highlight';
  target_data?: Record<string, any>; // JSONB
  content_data?: Record<string, any>; // JSONB
  pricing_tier?: string;
  monthly_rate?: number;
  start_date?: string;
  end_date?: string;
  impressions_count?: number;
  clicks_count?: number;
  created_at?: string;
}

export interface AffiliateProduct {
  id: string;
  product_name: string;
  product_category:
    | 'insurance'
    | 'financing'
    | 'accessories'
    | 'maintenance'
    | 'warranties';
  affiliate_partner: string;
  commission_rate?: number;
  product_url?: string;
  image_url?: string;
  description?: string;
  target_categories?: string[];
  created_at?: string;
}

export interface RevenueTracking {
  id: string;
  revenue_type: string;
  source_id: string;
  amount: number;
  commission_rate?: number;
  payment_status?: string;
  details?: Record<string, any>; // JSONB
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

export interface SecurityAuditLog {
  id: string;
  user_id?: string;
  action_type: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, any>; // JSONB
  ip_address?: string;
  user_agent?: string;
  success: boolean;
  created_at: string;
}

export interface AuthRateLimit {
  id: string;
  identifier: string;
  attempt_type: string;
  attempts: number;
  window_start: string;
}

export interface DataRetentionPolicy {
  id: string;
  data_type: string;
  retention_period_days: number;
  description?: string;
  created_at?: string;
}

export interface AdminAction {
  id: string;
  admin_id: string;
  action_type: string;
  target_table?: string;
  target_id?: string;
  old_data?: Record<string, any>; // JSONB
  new_data?: Record<string, any>; // JSONB
  created_at: string;
}

// Legacy alias for backward compatibility
export interface Car extends CarModel {}

// API response wrapper types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

// Search and filter types
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
  condition?: string;
  location?: string;
  features?: string[];
}

export interface CarSearchResult {
  cars: CarModel[];
  total: number;
  page: number;
  limit: number;
  filters: SearchFilters;
}

// Recommendation types
export interface CarRecommendation {
  car: CarModel;
  score: number;
  reasons: string[];
  match_percentage: number;
  price_match: boolean;
  feature_match: number;
}

// User preference types
export interface UserPreferences {
  budget_min?: number;
  budget_max?: number;
  preferred_brands?: string[];
  fuel_type_preference?: string[];
  body_style_preference?: string[];
  transmission_preference?: string[];
  must_have_features?: string[];
  location_preference?: string;
  mileage_preference?: number;
}

// Analytics types
export interface UserActivity {
  searches: number;
  views: number;
  bookmarks: number;
  inquiries: number;
  last_active: string;
}

export interface CarAnalytics {
  views: number;
  bookmarks: number;
  inquiries: number;
  shares: number;
  rating: number;
  review_count: number;
}

// Utility types
export type DatabaseTables =
  | 'user_profiles'
  | 'user_roles'
  | 'user_consent'
  | 'brands'
  | 'car_models'
  | 'reviews'
  | 'review_sections'
  | 'bookmarks'
  | 'search_history'
  | 'dealers'
  | 'vehicle_listings'
  | 'dealer_leads'
  | 'sponsored_content'
  | 'affiliate_products'
  | 'revenue_tracking'
  | 'featured_cars'
  | 'recommended_cars'
  | 'security_audit_log'
  | 'auth_rate_limits'
  | 'data_retention_policies'
  | 'admin_actions';

export type UserRoleType = 'admin' | 'dealer' | 'user';
export type LeadType = 'inquiry' | 'phone_call' | 'email' | 'visit';
export type LeadSource = 'search' | 'featured' | 'ai_recommendation' | 'browse';
export type ContentType =
  | 'featured_placement'
  | 'banner'
  | 'native_article'
  | 'comparison_highlight';
export type ProductCategory =
  | 'insurance'
  | 'financing'
  | 'accessories'
  | 'maintenance'
  | 'warranties';
export type VehicleCondition = 'new' | 'used' | 'certified';
export type ListingStatus = 'active' | 'pending' | 'sold' | 'inactive';
