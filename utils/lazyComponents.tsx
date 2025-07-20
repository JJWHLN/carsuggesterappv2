/**
 * Lazy-loaded Components for Performance Optimization
 * Implements code splitting to reduce initial bundle size
 */

import React, { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// Lazy load heavy components
export const LazyCarDetailsScreen = lazy(() => import('@/app/car/[id]'));
export const LazyModelDetailsScreen = lazy(() => import('@/app/model/[id]'));
export const LazyBrandDetailsScreen = lazy(() => import('@/app/brand/[id]'));
export const LazyReviewScreen = lazy(() => import('@/app/review/[id]'));

// Lazy load heavy UI components that export as default
export const LazyRecommendationScreen = lazy(() => 
  import('@/components/ui/RecommendationScreen').then(module => ({ default: module.RecommendationScreen }))
);
export const LazyOnboardingFlow = lazy(() => 
  import('@/components/ui/OnboardingFlow').then(module => ({ default: module.OnboardingFlow }))
);
export const LazyDealershipDashboard = lazy(() => 
  import('@/components/DealershipDashboard').then(module => ({ default: module.DealershipDashboard }))
);
export const LazyEnhancedMarketplaceScreen = lazy(() => 
  import('@/components/EnhancedMarketplaceScreen').then(module => ({ default: module.EnhancedMarketplaceScreen }))
);

// Higher-order component for lazy loading with error boundary
interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const LazyWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallback = <LoadingSpinner /> 
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

// Preload functions for better UX
export const preloadCarDetails = () => {
  import('@/app/car/[id]');
};

export const preloadRecommendations = () => {
  import('@/components/ui/RecommendationScreen');
};

export const preloadOnboarding = () => {
  import('@/components/ui/OnboardingFlow');
};

// Usage examples:
/*
// In your component:
const CarDetailsScreen = () => (
  <LazyWrapper>
    <LazyCarDetailsScreen />
  </LazyWrapper>
);

// Or with preloading:
useEffect(() => {
  // Preload on route enter or user interaction
  preloadCarDetails();
}, []);
*/
