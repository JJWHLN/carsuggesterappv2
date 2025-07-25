// Pricing and Market Analysis Components
export { PriceHistory } from './PriceHistory';
export { MarketInsights } from './MarketInsights';
export { DealRating } from './DealRating';
export { PriceAlerts } from './PriceAlerts';
export { PricingDashboard } from './PricingDashboard';

// API functions for external use
export {
  fetchPriceHistory,
  fetchUserPriceAlerts,
  createPriceAlert,
  updatePriceAlert,
  deletePriceAlert,
  fetchMarketAnalysis,
  fetchDepreciationData
} from './api';

// Types for external use
export type {
  PricePoint,
  PriceHistory as PriceHistoryType,
  DealRating as DealRatingType,
  DealFactor,
  MarketInsights as MarketInsightsType,
  PriceAlert,
  PriceNotification,
  SimilarCarPricing,
  DepreciationData,
  PriceTrend,
  MarketCondition,
  PriceHistoryResponse,
  PriceAlertsResponse,
  MarketAnalysisResponse
} from './types';
