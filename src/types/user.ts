/**
 * 👤 User & Authentication Types
 * All user-related interfaces and authentication types
 */

// ===== CORE USER TYPES =====

// Base user interface
export interface User {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly avatar?: string;
  readonly isEmailVerified: boolean;
  readonly role: UserRole;
  readonly status: UserStatus;
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly lastLoginAt?: string;
}

// Extended user profile
export interface UserProfile extends User {
  // Personal information
  phone?: string;
  dateOfBirth?: string;
  location?: UserLocation;

  // Preferences
  preferences: UserPreferences;

  // Social & communication
  bio?: string;
  website?: string;
  socialLinks?: SocialLinks;

  // Privacy settings
  privacy: PrivacySettings;

  // Statistics
  stats: UserStats;

  // Metadata
  metadata?: UserMetadata;

  // Account status
  isPremium?: boolean;
  onboardingCompleted?: boolean;

  // Dealer information
  dealerInfo?: {
    readonly dealershipName: string;
    readonly licenseNumber: string;
    readonly businessAddress: string;
    readonly website?: string;
    readonly specialties: readonly string[];
  };
}

// User location information
export interface UserLocation {
  readonly address?: string;
  readonly city?: string;
  readonly state?: string;
  readonly zipCode?: string;
  readonly country?: string;
  readonly coordinates?: readonly [number, number]; // [lat, lng]
}

// User preferences for car shopping
export interface UserPreferences {
  // Budget preferences
  budget?: {
    min: number;
    max: number;
  };
  budgetMin?: number;
  budgetMax?: number;
  financingPreference?: 'cash' | 'lease' | 'finance' | 'any';

  // Vehicle preferences
  preferredBrands?: readonly string[];
  preferredBodyStyles?: readonly string[];
  fuelTypePreference?: readonly string[];
  transmissionPreference?: readonly string[];
  drivetrainPreference?: readonly string[];

  // Requirements
  maxMileage?: number;
  minYear?: number;
  maxYear?: number;
  requiredFeatures?: readonly string[];
  minFuelEfficiency?: number;
  minSafetyRating?: number;

  // Search preferences
  searchRadius?: number;
  preferredDealers?: readonly string[];

  // Notification preferences (simplified for store compatibility)
  notifications?: {
    priceDrops: boolean;
    newListings: boolean;
    savedSearches: boolean;
    recommendations: boolean;
    dealerMessages: boolean;
  };

  // App preferences
  theme?: 'light' | 'dark' | 'auto';
  language?: string;
  currency?: string;
  distanceUnit?: 'miles' | 'km';

  // Display preferences
  listViewType?: 'grid' | 'list';
  carsPerPage?: number;
  defaultSortOrder?: SortOrder;

  // Communication
  preferredContactMethod?: ContactMethod;
  bestTimeToContact?: TimeRange;

  // Privacy
  shareActivityWithDealers?: boolean;
  allowDataForRecommendations?: boolean;
}

// Social media links
export interface SocialLinks {
  readonly facebook?: string;
  readonly twitter?: string;
  readonly instagram?: string;
  readonly linkedin?: string;
}

// Privacy settings
export interface PrivacySettings {
  readonly profileVisibility: 'public' | 'private' | 'friends';
  readonly showEmail: boolean;
  readonly showPhone: boolean;
  readonly showLocation: boolean;
  readonly allowSearchByEmail: boolean;
  readonly allowSearchByPhone: boolean;
  readonly dataProcessingConsent: boolean;
  readonly marketingOptIn: boolean;
  readonly thirdPartyDataSharing: boolean;
}

// User statistics
export interface UserStats {
  readonly carsViewed: number;
  readonly searchesPerformed: number;
  readonly bookmarksCreated: number;
  readonly reviewsWritten: number;
  readonly dealerContactsMade: number;
  readonly comparisonsCreated: number;
  readonly timeSpentBrowsing: number; // minutes
  readonly averageSessionDuration: number; // minutes
  readonly favoriteSearchTerms?: readonly string[];
  readonly mostViewedBrands?: readonly string[];
}

// User metadata for analytics and personalization
export interface UserMetadata {
  readonly registrationSource?: string;
  readonly firstCarViewed?: string;
  readonly averageBudget?: number;
  readonly searchPatterns?: SearchPattern[];
  readonly deviceFingerprint?: string;
  readonly referralCode?: string;
  readonly utmSource?: string;
  readonly utmMedium?: string;
  readonly utmCampaign?: string;
}

// User search patterns for ML/recommendations
export interface SearchPattern {
  readonly timestamp: string;
  readonly query?: string;
  readonly filters: Record<string, unknown>;
  readonly resultsCount: number;
  readonly clickedCarId?: string;
  readonly timeSpent: number; // seconds
}

// ===== AUTHENTICATION TYPES =====

// Authentication state
export interface AuthState {
  readonly isAuthenticated: boolean;
  readonly isLoading: boolean;
  readonly user: User | null;
  readonly error: string | null;
  readonly token?: string;
  readonly refreshToken?: string;
  readonly expiresAt?: string;
}

// Login credentials
export interface LoginCredentials {
  readonly email: string;
  readonly password: string;
  readonly rememberMe?: boolean;
}

// Registration data
export interface RegistrationData {
  readonly email: string;
  readonly password: string;
  readonly confirmPassword: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone?: string;
  readonly agreeToTerms: boolean;
  readonly marketingOptIn?: boolean;
  readonly referralCode?: string;
}

// Social login provider
export interface SocialLoginProvider {
  readonly provider: 'google' | 'facebook' | 'apple' | 'microsoft';
  readonly providerAccountId: string;
  readonly accessToken: string;
  readonly refreshToken?: string;
  readonly idToken?: string;
  readonly expiresAt?: number;
}

// Password reset request
export interface PasswordResetRequest {
  readonly email: string;
}

// Password reset confirmation
export interface PasswordResetConfirmation {
  readonly token: string;
  readonly newPassword: string;
  readonly confirmPassword: string;
}

// Password change request (for authenticated users)
export interface PasswordChangeRequest {
  readonly currentPassword: string;
  readonly newPassword: string;
  readonly confirmPassword: string;
}

// Email verification
export interface EmailVerificationRequest {
  readonly token: string;
}

// Two-factor authentication
export interface TwoFactorAuthSetup {
  readonly secret: string;
  readonly qrCode: string;
  readonly backupCodes: readonly string[];
}

export interface TwoFactorAuthVerification {
  readonly code: string;
  readonly backupCode?: string;
}

// ===== USER ACTIVITY & BEHAVIOR =====

// Individual activity record
export interface UserActivityRecord {
  readonly id: string;
  readonly userId: string;
  readonly activityType: UserActivityType;
  readonly entityType?: EntityType;
  readonly entityId?: string;
  readonly metadata?: Record<string, unknown>;
  readonly timestamp: string;
  readonly sessionId?: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

// Aggregated user activity data for store
export interface UserActivity {
  readonly carViews: ReadonlyArray<{
    readonly carId: string;
    readonly viewedAt: string;
    readonly duration: number;
    readonly source: string;
  }>;
  readonly searches: ReadonlyArray<{
    readonly query: string;
    readonly filters: Record<string, unknown>;
    readonly searchedAt: string;
    readonly resultCount: number;
  }>;
  readonly comparisons: ReadonlyArray<{
    readonly carIds: readonly string[];
    readonly comparedAt: string;
  }>;
  readonly bookmarks: ReadonlyArray<{
    readonly carId: string;
    readonly bookmarkedAt: string;
  }>;
  readonly reviews: ReadonlyArray<{
    readonly carId: string;
    readonly rating: number;
    readonly reviewedAt: string;
  }>;
}

// Saved search
export interface SavedSearch {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly query?: string;
  readonly filters: Record<string, unknown>;
  readonly alertsEnabled: boolean;
  readonly alertFrequency?: AlertFrequency;
  readonly lastNotifiedAt?: string;
  readonly createdAt: string;
  readonly updatedAt?: string;
}

// Search alert
export interface SearchAlert {
  readonly id: string;
  readonly savedSearchId: string;
  readonly newResults: readonly string[]; // car IDs
  readonly sentAt: string;
  readonly clickedResults?: readonly string[];
}

// Recently viewed items
export interface RecentlyViewed {
  readonly carId: string;
  readonly viewedAt: string;
  readonly viewDuration?: number; // seconds
  readonly deviceType?: DeviceType;
}

// User bookmark
export interface UserBookmark {
  readonly id: string;
  readonly userId: string;
  readonly carId: string;
  readonly notes?: string;
  readonly tags?: readonly string[];
  readonly createdAt: string;
  readonly updatedAt?: string;
}

// ===== NOTIFICATION TYPES =====

// Notification preferences
export interface NotificationPreferences {
  readonly email: EmailNotificationSettings;
  readonly push: PushNotificationSettings;
  readonly sms: SmsNotificationSettings;
  readonly inApp: InAppNotificationSettings;
}

export interface EmailNotificationSettings {
  readonly enabled: boolean;
  readonly priceAlerts: boolean;
  readonly newListings: boolean;
  readonly savedSearchResults: boolean;
  readonly dealerMessages: boolean;
  readonly reviewReplies: boolean;
  readonly weeklyDigest: boolean;
  readonly marketingEmails: boolean;
  readonly systemNotifications: boolean;
}

export interface PushNotificationSettings {
  readonly enabled: boolean;
  readonly priceAlerts: boolean;
  readonly newListings: boolean;
  readonly dealerMessages: boolean;
  readonly appUpdates: boolean;
  readonly reminders: boolean;
}

export interface SmsNotificationSettings {
  readonly enabled: boolean;
  readonly priceAlerts: boolean;
  readonly dealerMessages: boolean;
  readonly appointmentReminders: boolean;
}

export interface InAppNotificationSettings {
  readonly enabled: boolean;
  readonly showBadges: boolean;
  readonly playSound: boolean;
  readonly vibrate: boolean;
}

// User notification
export interface UserNotification {
  readonly id: string;
  readonly userId: string;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly data?: Record<string, unknown>;
  readonly read: boolean;
  readonly priority: NotificationPriority;
  readonly channelsUsed: readonly NotificationChannel[];
  readonly createdAt: string;
  readonly readAt?: string;
  readonly expiresAt?: string;
}

// ===== ENUMS & UNION TYPES =====

export type UserRole =
  | 'user'
  | 'premium_user'
  | 'dealer'
  | 'admin'
  | 'moderator'
  | 'expert'
  | 'editor';

export type UserStatus =
  | 'active'
  | 'inactive'
  | 'suspended'
  | 'pending_verification'
  | 'deactivated';

export type ContactMethod = 'email' | 'phone' | 'text' | 'app_notification';

export type DealerType =
  | 'franchise'
  | 'independent'
  | 'certified_pre_owned'
  | 'online_only';

export type SortOrder =
  | 'price_asc'
  | 'price_desc'
  | 'year_desc'
  | 'mileage_asc'
  | 'relevance'
  | 'newest_first';

export type TimeRange =
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'weekdays'
  | 'weekends'
  | 'anytime';

export type UserActivityType =
  | 'login'
  | 'logout'
  | 'car_view'
  | 'search'
  | 'bookmark_add'
  | 'bookmark_remove'
  | 'review_write'
  | 'dealer_contact'
  | 'comparison_create'
  | 'filter_apply'
  | 'share';

export type EntityType = 'car' | 'dealer' | 'review' | 'search' | 'comparison';

export type AlertFrequency =
  | 'immediate'
  | 'daily'
  | 'weekly'
  | 'bi_weekly'
  | 'monthly';

export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'other';

export type NotificationType =
  | 'price_alert'
  | 'new_listing'
  | 'saved_search_result'
  | 'dealer_message'
  | 'review_reply'
  | 'system_notification'
  | 'promotion'
  | 'reminder';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export type NotificationChannel = 'email' | 'push' | 'sms' | 'in_app';

// ===== TYPE GUARDS =====

export const isUser = (obj: unknown): obj is User => {
  if (typeof obj !== 'object' || obj === null) return false;
  const user = obj as Record<string, unknown>;
  return (
    typeof user.id === 'string' &&
    typeof user.email === 'string' &&
    typeof user.firstName === 'string' &&
    typeof user.lastName === 'string' &&
    typeof user.isEmailVerified === 'boolean' &&
    typeof user.createdAt === 'string'
  );
};

export const isUserProfile = (obj: unknown): obj is UserProfile => {
  return (
    isUser(obj) &&
    typeof (obj as UserProfile).preferences === 'object' &&
    typeof (obj as UserProfile).privacy === 'object' &&
    typeof (obj as UserProfile).stats === 'object'
  );
};

// ===== UTILITY FUNCTIONS =====

// Get user display name
export const getUserDisplayName = (
  user: Pick<User, 'firstName' | 'lastName'>,
): string => {
  return `${user.firstName} ${user.lastName}`.trim();
};

// Get user initials
export const getUserInitials = (
  user: Pick<User, 'firstName' | 'lastName'>,
): string => {
  const first = user.firstName.charAt(0).toUpperCase();
  const last = user.lastName.charAt(0).toUpperCase();
  return `${first}${last}`;
};

// Check if user has role
export const userHasRole = (
  user: Pick<User, 'role'>,
  role: UserRole,
): boolean => {
  return user.role === role;
};

// Check if user has any of the specified roles
export const userHasAnyRole = (
  user: Pick<User, 'role'>,
  roles: readonly UserRole[],
): boolean => {
  return roles.includes(user.role);
};

// Check if user is premium
export const isPremiumUser = (user: Pick<User, 'role'>): boolean => {
  return userHasAnyRole(user, ['premium_user', 'dealer', 'admin', 'expert']);
};

// Check if notification channel is enabled
export const isNotificationChannelEnabled = (
  preferences: NotificationPreferences,
  channel: NotificationChannel,
  type: keyof EmailNotificationSettings,
): boolean => {
  switch (channel) {
    case 'email':
      return preferences.email.enabled && preferences.email[type];
    case 'push':
      return preferences.push.enabled && (preferences.push as any)[type];
    case 'sms':
      return preferences.sms.enabled && (preferences.sms as any)[type];
    case 'in_app':
      return preferences.inApp.enabled;
    default:
      return false;
  }
};
