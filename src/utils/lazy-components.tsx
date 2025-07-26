/**
 * Enhanced Code Splitting Utilities
 *
 * Provides better control over bundle splitting and loading
 */

import React, { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';

// Loading component for lazy-loaded components
const LoadingFallback = ({ message = 'Loading...' }: { message?: string }) => (
  <View
    style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    }}
  >
    <ActivityIndicator size="large" />
    <Text style={{ marginTop: 10, textAlign: 'center' }}>{message}</Text>
  </View>
);

/**
 * Enhanced lazy loading with better error handling
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallbackMessage?: string,
) {
  const LazyComponent = React.lazy(importFn);

  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={<LoadingFallback message={fallbackMessage} />}>
      <LazyComponent {...props} />
    </Suspense>
  );
}

// Pre-defined lazy components for major app sections
export const LazyAIRecommendations = createLazyComponent(
  () => import('@/components/SmartRecommendations'),
  'Loading AI recommendations...',
);

export const LazyExpertReviews = createLazyComponent(
  () => import('@/components/ExpertReviewCard'),
  'Loading expert reviews...',
);

export const LazySocialFeed = createLazyComponent(
  () => import('@/components/SocialFeed'),
  'Loading social features...',
);

export const LazyMarketplaceChat = createLazyComponent(
  () => import('@/components/CarMarketplaceChat'),
  'Loading chat...',
);
