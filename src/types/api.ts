/**
 * 🔌 API Types & Interfaces
 * All API request/response types and service interfaces
 */

import type {
  Car,
  DatabaseCarModel,
  DatabaseVehicleListing,
  Brand,
  Dealer,
  CarFilters,
  CarSearchResult,
} from './models';
import type { User, UserProfile } from './user';

// ===== BASE API TYPES =====

// Generic API response wrapper
export interface ApiResponse<TData = unknown> {
  readonly data: TData | null;
  readonly error: string | null;
  readonly success: boolean;
  readonly message?: string;
  readonly timestamp: string;
}

// Paginated API response
export interface PaginatedApiResponse<TData = unknown>
  extends ApiResponse<TData[]> {
  readonly pagination: {
    readonly page: number;
    readonly limit: number;
    readonly total: number;
    readonly totalPages: number;
    readonly hasNextPage: boolean;
    readonly hasPreviousPage: boolean;
  };
}

// API Error class properties
export interface ApiErrorData {
  readonly message: string;
  readonly code?: string;
  readonly status?: number;
  readonly details?: string;
  readonly timestamp: string;
}

// ===== REQUEST TYPES =====

// Car search parameters
export interface CarSearchParams extends CarFilters {
  readonly query?: string;
  readonly sortBy?: 'price' | 'year' | 'mileage' | 'relevance' | 'created_at';
  readonly sortOrder?: 'asc' | 'desc';
  readonly page?: number;
  readonly limit?: number;
  readonly includeInactive?: boolean;
}

// Car models fetch options
export interface FetchCarModelsOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly searchQuery?: string;
  readonly category?: string;
  readonly brandName?: string;
  readonly year?: number;
  readonly sortBy?: 'name' | 'year' | 'popularity';
  readonly sortOrder?: 'asc' | 'desc';
}

// Brand fetch options
export interface FetchBrandsOptions {
  readonly limit?: number;
  readonly offset?: number;
  readonly searchQuery?: string;
  readonly includeInactive?: boolean;
  readonly countryOfOrigin?: string;
}

// ===== RESPONSE TYPES =====

// Car detail response
export interface CarDetailResponse extends ApiResponse<Car> {
  readonly similarCars?: readonly Car[];
  readonly recommendations?: readonly Car[];
  readonly dealerInfo?: Dealer;
}

// Car list response
export interface CarListResponse extends PaginatedApiResponse<Car> {
  readonly filters?: CarFilters;
  readonly appliedFilters?: CarFilters;
  readonly facets?: SearchFacets;
}

// Search facets for filtering
export interface SearchFacets {
  readonly makes: readonly FacetItem[];
  readonly models: readonly FacetItem[];
  readonly years: readonly NumberFacetItem[];
  readonly priceRanges: readonly NumberFacetItem[];
  readonly bodyStyles: readonly FacetItem[];
  readonly fuelTypes: readonly FacetItem[];
  readonly transmissions: readonly FacetItem[];
  readonly conditions: readonly FacetItem[];
}

export interface FacetItem {
  readonly value: string;
  readonly label: string;
  readonly count: number;
}

export interface NumberFacetItem {
  readonly min: number;
  readonly max: number;
  readonly label: string;
  readonly count: number;
}

// ===== AUTHENTICATION & USER TYPES =====

// Login request
export interface LoginRequest {
  readonly email: string;
  readonly password: string;
  readonly rememberMe?: boolean;
}

// Registration request
export interface RegisterRequest {
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly agreeToTerms: boolean;
  readonly marketingOptIn?: boolean;
}

// Password reset request
export interface PasswordResetRequest {
  readonly email: string;
}

// Password change request
export interface PasswordChangeRequest {
  readonly currentPassword: string;
  readonly newPassword: string;
  readonly confirmPassword: string;
}

// Profile update request
export interface ProfileUpdateRequest {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly phone?: string;
  readonly location?: string;
  readonly preferences?: UserPreferences;
}

// User preferences
export interface UserPreferences {
  readonly budgetMin?: number;
  readonly budgetMax?: number;
  readonly preferredBrands?: readonly string[];
  readonly preferredBodyStyles?: readonly string[];
  readonly fuelTypePreference?: readonly string[];
  readonly transmissionPreference?: readonly string[];
  readonly maxMileage?: number;
  readonly minYear?: number;
  readonly requiredFeatures?: readonly string[];
  readonly locationPreference?: string;
  readonly searchRadius?: number;
  readonly notifications?: NotificationPreferences;
}

// Notification preferences
export interface NotificationPreferences {
  readonly priceAlerts: boolean;
  readonly newListings: boolean;
  readonly savedSearches: boolean;
  readonly recommendations: boolean;
  readonly dealerMessages: boolean;
  readonly marketingEmails: boolean;
}

// ===== BOOKMARK & FAVORITES =====

// Bookmark request
export interface BookmarkRequest {
  readonly carId: string;
  readonly notes?: string;
}

// Bookmark response
export interface BookmarkResponse extends ApiResponse<Bookmark> {}

export interface Bookmark {
  readonly id: string;
  readonly userId: string;
  readonly carId: string;
  readonly car?: Car;
  readonly notes?: string;
  readonly createdAt: string;
}

// ===== REVIEWS & RATINGS =====

// Review request
export interface ReviewRequest {
  readonly carId: string;
  readonly rating: number; // 1-5
  readonly title: string;
  readonly content: string;
  readonly pros?: readonly string[];
  readonly cons?: readonly string[];
  readonly recommendToFriend: boolean;
  readonly ownershipDuration?: number; // months
  readonly images?: readonly string[];
}

// Review response
export interface Review {
  readonly id: string;
  readonly userId: string;
  readonly user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'>;
  readonly carId: string;
  readonly car?: Pick<Car, 'id' | 'make' | 'model' | 'year'>;
  readonly rating: number;
  readonly title: string;
  readonly content: string;
  readonly pros?: readonly string[];
  readonly cons?: readonly string[];
  readonly recommendToFriend: boolean;
  readonly ownershipDuration?: number;
  readonly images?: readonly string[];
  readonly helpful: number;
  readonly notHelpful: number;
  readonly userFound?: 'helpful' | 'not_helpful' | null;
  readonly verified: boolean;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

// ===== DEALER & CONTACT =====

// Contact dealer request
export interface ContactDealerRequest {
  readonly carId: string;
  readonly dealerId: string;
  readonly contactType: 'inquiry' | 'test_drive' | 'financing' | 'trade_in';
  readonly message: string;
  readonly contactInfo: {
    readonly name: string;
    readonly email: string;
    readonly phone?: string;
    readonly preferredContact: 'email' | 'phone' | 'text';
    readonly bestTimeToContact?: string;
  };
  readonly tradeInInfo?: {
    readonly make: string;
    readonly model: string;
    readonly year: number;
    readonly mileage: number;
    readonly condition: string;
  };
}

// Contact dealer response
export interface ContactDealerResponse extends ApiResponse<DealerLead> {}

export interface DealerLead {
  readonly id: string;
  readonly userId: string;
  readonly dealerId: string;
  readonly carId: string;
  readonly contactType: string;
  readonly message: string;
  readonly contactInfo: Record<string, unknown>;
  readonly status:
    | 'new'
    | 'contacted'
    | 'scheduled'
    | 'completed'
    | 'cancelled';
  readonly createdAt: string;
  readonly updatedAt?: string;
}

// ===== COMPARISON TYPES =====

// Add to comparison request
export interface AddToComparisonRequest {
  readonly carId: string;
}

// Comparison response
export interface ComparisonResponse extends ApiResponse<CarComparison> {}

export interface CarComparison {
  readonly id: string;
  readonly userId: string;
  readonly cars: readonly ComparisonCar[];
  readonly createdAt: string;
  readonly updatedAt?: string;
}

export interface ComparisonCar extends Car {
  readonly comparisonScores?: {
    readonly overall: number;
    readonly value: number;
    readonly reliability: number;
    readonly features: number;
    readonly fuelEconomy: number;
    readonly safety: number;
    readonly performance: number;
  };
  readonly pros?: readonly string[];
  readonly cons?: readonly string[];
}

// ===== SEARCH & ANALYTICS =====

// Search analytics
export interface SearchAnalyticsRequest {
  readonly query: string;
  readonly filters?: CarFilters;
  readonly resultCount: number;
  readonly clickedCarId?: string;
  readonly searchDuration: number;
}

// User activity tracking
export interface UserActivityRequest {
  readonly activityType:
    | 'view'
    | 'search'
    | 'bookmark'
    | 'contact'
    | 'comparison';
  readonly carId?: string;
  readonly searchQuery?: string;
  readonly duration?: number;
  readonly metadata?: Record<string, unknown>;
}

// ===== IMAGE & MEDIA =====

// Image upload request
export interface ImageUploadRequest {
  readonly file: File | Blob;
  readonly carId?: string;
  readonly type: 'car_image' | 'review_image' | 'profile_avatar';
  readonly alt?: string;
}

// Image upload response
export interface ImageUploadResponse extends ApiResponse<UploadedImage> {}

export interface UploadedImage {
  readonly id: string;
  readonly url: string;
  readonly thumbnailUrl?: string;
  readonly alt?: string;
  readonly size: number;
  readonly mimeType: string;
  readonly createdAt: string;
}

// ===== ERROR HANDLING =====

// Validation error details
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
  readonly value?: unknown;
}

// API error response
export interface ApiErrorResponse {
  readonly success: false;
  readonly error: string;
  readonly code?: string;
  readonly status: number;
  readonly details?: string;
  readonly validationErrors?: readonly ValidationError[];
  readonly timestamp: string;
}

// ===== SERVICE INTERFACES =====

// Car service interface
export interface CarService {
  searchCars(params: CarSearchParams): Promise<CarListResponse>;
  getCarById(id: string): Promise<CarDetailResponse>;
  getSimilarCars(carId: string, limit?: number): Promise<CarListResponse>;
  getRecommendedCars(userId: string, limit?: number): Promise<CarListResponse>;
  getFeaturedCars(limit?: number): Promise<CarListResponse>;
}

// User service interface
export interface UserService {
  login(credentials: LoginRequest): Promise<ApiResponse<User>>;
  register(data: RegisterRequest): Promise<ApiResponse<User>>;
  logout(): Promise<ApiResponse<void>>;
  getCurrentUser(): Promise<ApiResponse<User>>;
  updateProfile(data: ProfileUpdateRequest): Promise<ApiResponse<UserProfile>>;
  changePassword(data: PasswordChangeRequest): Promise<ApiResponse<void>>;
  resetPassword(data: PasswordResetRequest): Promise<ApiResponse<void>>;
}

// Bookmark service interface
export interface BookmarkService {
  getBookmarks(userId: string): Promise<PaginatedApiResponse<Bookmark>>;
  addBookmark(data: BookmarkRequest): Promise<BookmarkResponse>;
  removeBookmark(bookmarkId: string): Promise<ApiResponse<void>>;
  isBookmarked(carId: string): Promise<ApiResponse<boolean>>;
}

// Review service interface
export interface ReviewService {
  getReviews(
    carId: string,
    page?: number,
  ): Promise<PaginatedApiResponse<Review>>;
  addReview(data: ReviewRequest): Promise<ApiResponse<Review>>;
  updateReview(
    reviewId: string,
    data: Partial<ReviewRequest>,
  ): Promise<ApiResponse<Review>>;
  deleteReview(reviewId: string): Promise<ApiResponse<void>>;
  markHelpful(reviewId: string, helpful: boolean): Promise<ApiResponse<void>>;
}

// ===== UTILITY TYPES =====

// Extract the data type from an ApiResponse
export type ExtractApiData<T> = T extends ApiResponse<infer U> ? U : never;

// Extract the data type from a PaginatedApiResponse
export type ExtractPaginatedData<T> =
  T extends PaginatedApiResponse<infer U> ? U : never;

// Make all properties of T optional except for K
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// Make all properties of T required except for K
export type RequiredExcept<T, K extends keyof T> = Required<Omit<T, K>> &
  Pick<T, K>;

// HTTP methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// API endpoint configuration
export interface ApiEndpoint {
  readonly method: HttpMethod;
  readonly path: string;
  readonly requiresAuth?: boolean;
  readonly timeout?: number;
}
