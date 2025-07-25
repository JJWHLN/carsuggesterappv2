import { 
  PriceHistory, 
  PriceHistoryResponse, 
  MarketInsights, 
  DealRating, 
  PriceAlert,
  PriceAlertsResponse,
  SimilarCarPricing,
  MarketAnalysisResponse,
  PriceNotification,
  DepreciationData,
  PriceTrend,
  MarketCondition
} from './types';

// Mock API delays
const mockDelay = (ms: number = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Generate realistic price history data
const generatePriceHistory = (carId: string, basePrice: number): PriceHistory => {
  const pricePoints = [];
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  
  let currentPrice = basePrice * 1.15; // Start higher a year ago
  
  for (let i = 0; i < 52; i++) { // Weekly data points for a year
    const date = new Date(startDate);
    date.setDate(date.getDate() + (i * 7));
    
    // Add some realistic price volatility with seasonal trends
    const seasonalFactor = 1 + 0.05 * Math.sin((i / 52) * 2 * Math.PI); // 5% seasonal variation
    const randomFactor = 0.95 + Math.random() * 0.1; // ±5% random variation
    const depreciationFactor = Math.pow(0.85, i / 52); // 15% annual depreciation
    
    currentPrice = basePrice * seasonalFactor * randomFactor * depreciationFactor;
    
    pricePoints.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(currentPrice),
      source: i % 4 === 0 ? 'auction' : (i % 3 === 0 ? 'private' : 'dealer') as any
    });
  }
  
  const marketAverage = basePrice * 1.02; // Market is 2% higher on average
  const currentPriceValue = pricePoints[pricePoints.length - 1].price;
  const price30dAgo = pricePoints[pricePoints.length - 5].price;
  const price90dAgo = pricePoints[pricePoints.length - 13].price;
  
  return {
    carId,
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    pricePoints,
    currentPrice: currentPriceValue,
    marketAverage,
    priceChange30d: currentPriceValue - price30dAgo,
    priceChange90d: currentPriceValue - price90dAgo,
    priceChangePercent30d: ((currentPriceValue - price30dAgo) / price30dAgo) * 100,
    priceChangePercent90d: ((currentPriceValue - price90dAgo) / price90dAgo) * 100
  };
};

// Generate deal rating
const generateDealRating = (currentPrice: number, marketAverage: number): DealRating => {
  const priceDifference = ((currentPrice - marketAverage) / marketAverage) * 100;
  
  let rating: DealRating['rating'];
  let score: number;
  
  if (priceDifference <= -15) {
    rating = 'Great';
    score = 85 + Math.random() * 15;
  } else if (priceDifference <= -5) {
    rating = 'Good';
    score = 70 + Math.random() * 15;
  } else if (priceDifference <= 10) {
    rating = 'Fair';
    score = 50 + Math.random() * 20;
  } else {
    rating = 'Overpriced';
    score = Math.random() * 50;
  }
  
  const factors = [
    {
      name: 'Market Comparison',
      impact: priceDifference < 0 ? 'positive' : 'negative' as any,
      weight: 0.4,
      description: `${Math.abs(priceDifference).toFixed(1)}% ${priceDifference < 0 ? 'below' : 'above'} market average`
    },
    {
      name: 'Time on Market',
      impact: 'neutral' as any,
      weight: 0.2,
      description: '23 days on market (average: 28 days)'
    },
    {
      name: 'Seasonal Timing',
      impact: 'positive' as any,
      weight: 0.2,
      description: 'Good time to buy - winter season typically has lower prices'
    },
    {
      name: 'Mileage',
      impact: 'positive' as any,
      weight: 0.2,
      description: 'Below average mileage for year'
    }
  ];
  
  return {
    rating,
    score: Math.round(score),
    factors,
    recommendation: rating === 'Great' ? 'Excellent deal - act quickly!' :
                   rating === 'Good' ? 'Good value - worth considering' :
                   rating === 'Fair' ? 'Reasonable price - room for negotiation' :
                   'Overpriced - consider other options',
    confidence: 0.8 + Math.random() * 0.2
  };
};

// Generate market insights
const generateMarketInsights = (carId: string): MarketInsights => {
  return {
    carId,
    supply: {
      totalListings: 145 + Math.floor(Math.random() * 100),
      newListingsWeek: 12 + Math.floor(Math.random() * 20),
      averageDaysOnMarket: 25 + Math.floor(Math.random() * 20),
      inventoryTrend: ['increasing', 'stable', 'decreasing'][Math.floor(Math.random() * 3)] as any
    },
    demand: {
      searchVolume: 1200 + Math.floor(Math.random() * 800),
      inquiryRate: 0.15 + Math.random() * 0.1,
      saleSpeed: 20 + Math.floor(Math.random() * 15),
      demandTrend: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any
    },
    seasonality: {
      bestMonthToBuy: 'December',
      worstMonthToBuy: 'May',
      seasonalDiscount: 8.5,
      currentSeasonImpact: -3.2
    },
    regional: {
      region: 'New York Metro',
      priceVariation: 12.5,
      competitiveMarkets: ['Boston', 'Philadelphia', 'Washington DC'],
      regionScore: 0.7 + Math.random() * 0.3
    }
  };
};

// Generate similar cars
const generateSimilarCars = (): SimilarCarPricing[] => {
  const cars = [
    { make: 'Honda', model: 'Accord', basePrice: 24000 },
    { make: 'Nissan', model: 'Altima', basePrice: 22000 },
    { make: 'Mazda', model: 'Mazda6', basePrice: 23500 },
    { make: 'Subaru', model: 'Legacy', basePrice: 25000 }
  ];
  
  return cars.map((car, index) => ({
    car: {
      id: `similar-${index}`,
      make: car.make,
      model: car.model,
      year: 2020,
      mileage: 25000 + Math.floor(Math.random() * 20000),
      price: car.basePrice + Math.floor(Math.random() * 4000 - 2000)
    },
    similarity: 0.7 + Math.random() * 0.3,
    priceDifference: Math.floor(Math.random() * 4000 - 2000),
    factors: ['Same year', 'Similar mileage', 'Comparable features']
  }));
};

// API Functions
export const fetchPriceHistory = async (carId: string): Promise<PriceHistoryResponse> => {
  await mockDelay();
  
  const basePrice = 25000 + Math.floor(Math.random() * 10000);
  const priceHistory = generatePriceHistory(carId, basePrice);
  const insights = generateMarketInsights(carId);
  const dealRating = generateDealRating(priceHistory.currentPrice, priceHistory.marketAverage);
  const similarCars = generateSimilarCars();
  
  return {
    data: priceHistory,
    insights,
    dealRating,
    similarCars
  };
};

export const fetchUserPriceAlerts = async (userId: string): Promise<PriceAlertsResponse> => {
  await mockDelay();
  
  const alerts: PriceAlert[] = [
    {
      id: 'alert-1',
      userId,
      carId: 'car-1',
      targetPrice: 23000,
      alertType: 'below',
      isActive: true,
      frequency: 'immediate',
      createdAt: '2024-01-15T00:00:00Z',
      notifications: []
    },
    {
      id: 'alert-2',
      userId,
      carId: 'car-2',
      targetPrice: 28000,
      alertType: 'drop',
      isActive: true,
      frequency: 'daily',
      createdAt: '2024-01-10T00:00:00Z',
      lastTriggered: '2024-01-20T00:00:00Z',
      notifications: []
    }
  ];
  
  const recentNotifications: PriceNotification[] = [
    {
      id: 'notif-1',
      alertId: 'alert-2',
      triggeredAt: '2024-01-20T10:30:00Z',
      oldPrice: 28500,
      newPrice: 27800,
      priceChange: -700,
      message: 'Price dropped by $700 on your saved car',
      read: false
    }
  ];
  
  return { alerts, recentNotifications };
};

export const createPriceAlert = async (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'notifications'>): Promise<PriceAlert> => {
  await mockDelay();
  
  return {
    ...alert,
    id: `alert-${Date.now()}`,
    createdAt: new Date().toISOString(),
    notifications: []
  };
};

export const updatePriceAlert = async (alertId: string, updates: Partial<PriceAlert>): Promise<PriceAlert> => {
  await mockDelay();
  
  // Mock update - in real app, this would update the backend
  return {
    id: alertId,
    userId: 'user-1',
    carId: 'car-1',
    targetPrice: 23000,
    alertType: 'below',
    isActive: true,
    frequency: 'immediate',
    createdAt: '2024-01-15T00:00:00Z',
    notifications: [],
    ...updates
  };
};

export const deletePriceAlert = async (alertId: string): Promise<void> => {
  await mockDelay();
  // Mock delete
};

export const fetchMarketAnalysis = async (region: string = 'national'): Promise<MarketAnalysisResponse> => {
  await mockDelay();
  
  const marketCondition: MarketCondition = {
    type: ['buyers', 'sellers', 'balanced'][Math.floor(Math.random() * 3)] as any,
    strength: 0.6 + Math.random() * 0.4,
    indicators: {
      priceMovement: -2.5 + Math.random() * 5,
      inventoryLevel: 0.7 + Math.random() * 0.3,
      saleSpeed: 0.8 + Math.random() * 0.2
    }
  };
  
  const trends: PriceTrend[] = [
    {
      direction: 'down',
      strength: 'moderate',
      confidence: 0.85,
      timeframe: '30d'
    },
    {
      direction: 'stable',
      strength: 'weak',
      confidence: 0.72,
      timeframe: '90d'
    }
  ];
  
  return {
    marketCondition,
    trends,
    recommendations: [
      'Good time for buyers - prices trending down',
      'Consider waiting for winter months for better deals',
      'High inventory levels give buyers more options'
    ],
    forecast: {
      nextMonth: -1.5,
      nextQuarter: -3.2,
      confidence: 0.78
    }
  };
};

export const fetchDepreciationData = async (make: string, model: string, year: number): Promise<DepreciationData[]> => {
  await mockDelay();
  
  const currentYear = new Date().getFullYear();
  const baseValue = 35000; // Starting MSRP
  const data: DepreciationData[] = [];
  
  for (let i = 0; i <= currentYear - year; i++) {
    const yearValue = year + i;
    const age = i;
    
    // Realistic depreciation curve
    let depreciationRate: number;
    if (age === 0) depreciationRate = 0.2; // 20% first year
    else if (age <= 3) depreciationRate = 0.15; // 15% per year for years 2-4
    else if (age <= 7) depreciationRate = 0.1; // 10% per year for years 5-8
    else depreciationRate = 0.05; // 5% per year after that
    
    const estimatedValue = baseValue * Math.pow(1 - depreciationRate, age);
    
    data.push({
      year: yearValue,
      estimatedValue: Math.round(estimatedValue),
      depreciationRate: depreciationRate * 100,
      marketFactors: age === 0 ? ['New car depreciation'] :
                    age <= 3 ? ['High depreciation period', 'Warranty coverage'] :
                    age <= 7 ? ['Moderate depreciation', 'Maintenance increases'] :
                    ['Slow depreciation', 'Higher maintenance costs']
    });
  }
  
  return data;
};
