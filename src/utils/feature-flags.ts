/**
 * Feature Flags for Conditional Loading
 *
 * Controls which features are loaded upfront vs on-demand
 */

export const FEATURE_FLAGS = {
  // Core features (always loaded)
  SEARCH: true,
  CAR_LISTINGS: true,
  USER_AUTH: true,

  // Optional features (lazy loaded)
  AI_RECOMMENDATIONS: false, // Load when AI button pressed
  ADVANCED_FILTERS: false, // Load when advanced search used
  SOCIAL_FEATURES: false, // Load when social tab accessed
  EXPERT_REVIEWS: false, // Load when reviews tab accessed
  MARKETPLACE_CHAT: false, // Load when chat feature used

  // Premium features (conditional)
  PREMIUM_ANALYTICS: false,
  DEALERSHIP_TOOLS: false,

  // Development features (production disabled)
  DEBUG_TOOLS: process.env.NODE_ENV !== 'production',
  PERFORMANCE_MONITOR: process.env.NODE_ENV !== 'production',
};

/**
 * Lazy load a feature when needed
 */
export async function loadFeature(featureName: string) {
  if (FEATURE_FLAGS[featureName as keyof typeof FEATURE_FLAGS]) {
    return; // Already loaded
  }

  logger.debug(`🔄 Loading feature: ${featureName}`);

  try {
    switch (featureName) {
      case 'AI_RECOMMENDATIONS':
        return await import('@/components/SmartRecommendations');
      case 'ADVANCED_FILTERS':
        return await import('@/components/search/SearchFiltersPanel');
      case 'SOCIAL_FEATURES':
        return await import('@/components/SocialFeed');
      case 'EXPERT_REVIEWS':
        return await import('@/components/ExpertReviewCard');
      case 'MARKETPLACE_CHAT':
        return await import('@/components/CarMarketplaceChat');
      default:
        logger.warn(`Unknown feature: ${featureName}`);
        return null;
    }
  } catch (error) {
    logger.error(`Failed to load feature ${featureName}:`, error);
    return null;
  }
}
