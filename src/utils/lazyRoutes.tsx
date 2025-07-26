/**
 * 🚀 Lazy Route Definitions
 * Code-split all major screens and features for optimal loading
 */

import { createLazyComponent, preloadComponent } from './lazyLoading';

// ===== MAIN SCREENS =====
export const LazyHome = createLazyComponent(
  () => import('../../app/(tabs)/index'),
  { chunkName: 'home-screen' },
);

export const LazySearch = createLazyComponent(
  () => import('../../app/(tabs)/search'),
  { chunkName: 'search-screen' },
);

export const LazyMarketplace = createLazyComponent(
  () => import('../../app/(tabs)/marketplace'),
  { chunkName: 'marketplace-screen' },
);

export const LazyModels = createLazyComponent(
  () => import('../../app/(tabs)/models'),
  { chunkName: 'models-screen' },
);

export const LazyProfile = createLazyComponent(
  () => import('../../app/(tabs)/profile'),
  { chunkName: 'profile-screen' },
);

export const LazyReviews = createLazyComponent(
  () => import('../../app/(tabs)/reviews'),
  { chunkName: 'reviews-screen' },
);

// ===== FEATURE MODULES =====
export const LazyCarComparison = createLazyComponent(
  () => import('../src/features/comparison/ComparisonScreen'),
  { chunkName: 'comparison-feature' },
);

export const LazyPricingDashboard = createLazyComponent(
  () => import('../src/features/pricing/PricingDashboard'),
  { chunkName: 'pricing-feature' },
);

export const LazyRecommendationEngine = createLazyComponent(
  () => import('../src/features/recommendations/RecommendationEngine'),
  { chunkName: 'recommendations-feature' },
);

// ===== DETAIL SCREENS =====
export const LazyCarDetail = createLazyComponent(
  () => import('../app/car/[id]'),
  { chunkName: 'car-detail' },
);

export const LazyBrandDetail = createLazyComponent(
  () => import('../app/brand/[id]'),
  { chunkName: 'brand-detail' },
);

export const LazyModelDetail = createLazyComponent(
  () => import('../app/model/[id]'),
  { chunkName: 'model-detail' },
);

export const LazyReviewDetail = createLazyComponent(
  () => import('../app/review/[id]'),
  { chunkName: 'review-detail' },
);

// ===== AUTH SCREENS =====
export const LazySignIn = createLazyComponent(
  () => import('../app/auth/sign-in'),
  { chunkName: 'auth-signin' },
);

export const LazySignUp = createLazyComponent(
  () => import('../app/auth/sign-up'),
  { chunkName: 'auth-signup' },
);

export const LazyForgotPassword = createLazyComponent(
  () => import('../app/auth/forgot-password'),
  { chunkName: 'auth-forgot' },
);

// ===== HEAVY COMPONENTS =====
export const LazyEnhancedCarDetail = createLazyComponent(
  () => import('../components/EnhancedCarDetail'),
  { chunkName: 'enhanced-car-detail' },
);

export const LazyAdvancedSearchFilters = createLazyComponent(
  () => import('../src/features/search/AdvancedSearchFilters'),
  { chunkName: 'advanced-search' },
);

// ===== PRELOADING STRATEGIES =====

/**
 * Preload critical routes that users are likely to visit
 */
export const preloadCriticalRoutes = () => {
  // Primary navigation targets
  preloadComponent(() => import('../app/(tabs)/search'));
  preloadComponent(() => import('../app/(tabs)/marketplace'));

  // Common detail views
  preloadComponent(() => import('../components/EnhancedCarDetail'));
};

/**
 * Preload secondary routes based on user behavior
 */
export const preloadSecondaryRoutes = () => {
  // Feature modules
  preloadComponent(
    () => import('../src/features/comparison/ComparisonScreen'),
    500,
  );
  preloadComponent(
    () => import('../src/features/pricing/PricingDashboard'),
    1000,
  );

  // Detail screens
  preloadComponent(() => import('../app/model/[id]'), 1500);
  preloadComponent(() => import('../app/brand/[id]'), 2000);
};

/**
 * Preload routes based on user authentication status
 */
export const preloadAuthBasedRoutes = (isAuthenticated: boolean) => {
  if (isAuthenticated) {
    preloadComponent(() => import('../app/(tabs)/profile'));
    preloadComponent(
      () => import('../src/features/recommendations/RecommendationEngine'),
    );
  } else {
    preloadComponent(() => import('../app/auth/sign-in'));
    preloadComponent(() => import('../app/auth/sign-up'));
  }
};

/**
 * Initialize smart preloading system
 */
export const initializePreloading = (userContext?: {
  isAuthenticated?: boolean;
}) => {
  // Immediate critical routes
  preloadCriticalRoutes();

  // Delayed secondary routes
  setTimeout(() => {
    preloadSecondaryRoutes();
  }, 2000);

  // Auth-based routes
  if (userContext?.isAuthenticated !== undefined) {
    setTimeout(() => {
      preloadAuthBasedRoutes(userContext.isAuthenticated);
    }, 3000);
  }
};
