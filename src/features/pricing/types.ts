// --- Pricing and Market Insights Types ---

export interface PricePoint {
  date: string;
  price: number;
  mileage?: number;
  source: 'dealer' | 'private' | 'auction' | 'estimate';
}

export interface PriceHistory {
  carId: string;
  make: string;
  model: string;
  year: number;
  pricePoints: PricePoint[];
  currentPrice: number;
  marketAverage: number;
  priceChange30d: number;
  priceChange90d: number;
  priceChangePercent30d: number;
  priceChangePercent90d: number;
}

export interface DealRating {
  rating: 'Great' | 'Good' | 'Fair' | 'Overpriced';
  score: number; // 0-100
  factors: DealFactor[];
  recommendation: string;
  confidence: number; // 0-1
}

export interface DealFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
}

export interface MarketInsights {
  carId: string;
  supply: {
    totalListings: number;
    newListingsWeek: number;
    averageDaysOnMarket: number;
    inventoryTrend: 'increasing' | 'stable' | 'decreasing';
  };
  demand: {
    searchVolume: number;
    inquiryRate: number;
    saleSpeed: number; // days to sell
    demandTrend: 'high' | 'medium' | 'low';
  };
  seasonality: {
    bestMonthToBuy: string;
    worstMonthToBuy: string;
    seasonalDiscount: number;
    currentSeasonImpact: number;
  };
  regional: {
    region: string;
    priceVariation: number;
    competitiveMarkets: string[];
    regionScore: number;
  };
}

export interface PriceAlert {
  id: string;
  userId: string;
  carId: string;
  targetPrice: number;
  alertType: 'below' | 'above' | 'drop' | 'increase';
  isActive: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
  createdAt: string;
  lastTriggered?: string;
  notifications: PriceNotification[];
}

export interface PriceNotification {
  id: string;
  alertId: string;
  triggeredAt: string;
  oldPrice: number;
  newPrice: number;
  priceChange: number;
  message: string;
  read: boolean;
}

export interface SimilarCarPricing {
  car: {
    id: string;
    make: string;
    model: string;
    year: number;
    mileage: number;
    price: number;
  };
  similarity: number; // 0-1
  priceDifference: number;
  factors: string[];
}

export interface DepreciationData {
  year: number;
  estimatedValue: number;
  depreciationRate: number;
  marketFactors: string[];
}

export interface PriceTrend {
  direction: 'up' | 'down' | 'stable';
  strength: 'weak' | 'moderate' | 'strong';
  confidence: number;
  timeframe: '7d' | '30d' | '90d' | '1y';
}

export interface MarketCondition {
  type: 'buyers' | 'sellers' | 'balanced';
  strength: number; // 0-1
  indicators: {
    priceMovement: number;
    inventoryLevel: number;
    saleSpeed: number;
  };
}

// API Response Types
export interface PriceHistoryResponse {
  data: PriceHistory;
  insights: MarketInsights;
  dealRating: DealRating;
  similarCars: SimilarCarPricing[];
}

export interface PriceAlertsResponse {
  alerts: PriceAlert[];
  recentNotifications: PriceNotification[];
}

export interface MarketAnalysisResponse {
  marketCondition: MarketCondition;
  trends: PriceTrend[];
  recommendations: string[];
  forecast: {
    nextMonth: number;
    nextQuarter: number;
    confidence: number;
  };
}
