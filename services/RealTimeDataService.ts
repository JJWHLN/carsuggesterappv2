import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// Real-Time Data Types
export interface LiveInventoryUpdate {
  id: string;
  carId: string;
  dealerId: string;
  updateType: 'price_change' | 'availability' | 'new_listing' | 'sold' | 'features_updated' | 'photos_updated';
  previousData?: Record<string, any>;
  newData: Record<string, any>;
  changeReason?: string;
  timestamp: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  affectedUsers: string[];
}

export interface PriceChangeNotification {
  id: string;
  carId: string;
  previousPrice: number;
  newPrice: number;
  changeAmount: number;
  changePercentage: number;
  priceDirection: 'increase' | 'decrease';
  dealerId: string;
  reason?: 'market_adjustment' | 'promotion' | 'incentive' | 'clearance' | 'demand' | 'other';
  validUntil?: string;
  timestamp: string;
  notificationSent: boolean;
  subscribedUsers: string[];
}

export interface MarketTrend {
  id: string;
  category: 'make' | 'model' | 'body_type' | 'price_range' | 'fuel_type' | 'year_range';
  identifier: string; // e.g., 'Toyota', 'SUV', '$20000-$30000'
  metric: 'price' | 'demand' | 'inventory' | 'time_on_market' | 'views' | 'inquiries';
  currentValue: number;
  previousValue: number;
  changeAmount: number;
  changePercentage: number;
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  periodDays: number;
  confidence: number; // 0-100
  dataPoints: Array<{
    timestamp: string;
    value: number;
  }>;
  insights: string[];
  predictedDirection: 'up' | 'down' | 'stable';
  predictedChange: number;
  lastUpdated: string;
}

export interface PopularSearch {
  id: string;
  query: string;
  searchTerms: string[];
  filters: Record<string, any>;
  frequency: number;
  trendingScore: number;
  userSegment: 'all' | 'first_time_buyers' | 'luxury_buyers' | 'budget_conscious' | 'families';
  location?: {
    city: string;
    state: string;
    radius: number;
  };
  relatedSearches: string[];
  resultCount: number;
  averageResultPrice: number;
  topBrands: string[];
  seasonality: {
    isSeasonalTrend: boolean;
    peakMonths?: number[];
    seasonalMultiplier?: number;
  };
  demographics: {
    ageGroups: Record<string, number>;
    genderDistribution: Record<string, number>;
    incomeRanges: Record<string, number>;
  };
  timestamp: string;
  rank: number;
  changeFromPreviousPeriod: number;
}

export interface RealtimeRecommendation {
  id: string;
  userId: string;
  carId: string;
  type: 'price_drop' | 'new_match' | 'inventory_alert' | 'trending' | 'seasonal' | 'similar_interest';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  actionText: string;
  reasons: string[];
  confidenceScore: number; // 0-100
  expiresAt?: string;
  metadata: {
    originalPrice?: number;
    newPrice?: number;
    savingsAmount?: number;
    timeRemaining?: string;
    similarUsers?: number;
    matchingCriteria?: string[];
  };
  trigger: {
    event: string;
    timestamp: string;
    data: Record<string, any>;
  };
  userInteraction: {
    viewed: boolean;
    viewedAt?: string;
    clicked: boolean;
    clickedAt?: string;
    dismissed: boolean;
    dismissedAt?: string;
    shared: boolean;
    sharedAt?: string;
  };
  effectiveness: {
    impressions: number;
    clicks: number;
    conversions: number;
    clickThroughRate: number;
    conversionRate: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DataSyncStatus {
  lastSync: string;
  syncDuration: number;
  recordsProcessed: number;
  errors: Array<{
    type: string;
    message: string;
    timestamp: string;
  }>;
  status: 'syncing' | 'completed' | 'failed' | 'idle';
  nextScheduledSync: string;
  syncFrequencyMinutes: number;
}

export interface RealtimeConfig {
  enableLiveUpdates: boolean;
  enablePriceAlerts: boolean;
  enableTrendingNotifications: boolean;
  enableInventoryAlerts: boolean;
  syncFrequencyMinutes: number;
  maxNotificationsPerDay: number;
  priceChangeThresholdPercent: number;
  trendingThresholdRank: number;
  dataRetentionDays: number;
  enableDetailedLogging: boolean;
  priorityUsers: string[];
  blacklistedDealers: string[];
}

class RealTimeDataService {
  private static instance: RealTimeDataService;
  private inventoryUpdates: Map<string, LiveInventoryUpdate> = new Map();
  private priceChanges: Map<string, PriceChangeNotification> = new Map();
  private marketTrends: Map<string, MarketTrend> = new Map();
  private popularSearches: Map<string, PopularSearch> = new Map();
  private recommendations: Map<string, RealtimeRecommendation[]> = new Map();
  private syncStatus: DataSyncStatus;
  private config: RealtimeConfig;
  private subscriptions: Map<string, Array<(data: any) => void>> = new Map();
  private syncInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  private constructor() {
    this.config = {
      enableLiveUpdates: true,
      enablePriceAlerts: true,
      enableTrendingNotifications: true,
      enableInventoryAlerts: true,
      syncFrequencyMinutes: 5,
      maxNotificationsPerDay: 10,
      priceChangeThresholdPercent: 5,
      trendingThresholdRank: 50,
      dataRetentionDays: 30,
      enableDetailedLogging: false,
      priorityUsers: [],
      blacklistedDealers: [],
    };

    this.syncStatus = {
      lastSync: new Date().toISOString(),
      syncDuration: 0,
      recordsProcessed: 0,
      errors: [],
      status: 'idle',
      nextScheduledSync: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      syncFrequencyMinutes: 5,
    };
  }

  public static getInstance(): RealTimeDataService {
    if (!RealTimeDataService.instance) {
      RealTimeDataService.instance = new RealTimeDataService();
    }
    return RealTimeDataService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Promise.all([
        this.loadInventoryUpdates(),
        this.loadPriceChanges(),
        this.loadMarketTrends(),
        this.loadPopularSearches(),
        this.loadRecommendations(),
        this.loadConfig(),
        this.loadSyncStatus(),
      ]);

      // Initialize with sample data
      await this.initializeSampleData();

      // Start background synchronization
      this.startBackgroundSync();

      this.isInitialized = true;
      console.log('RealTimeDataService initialized');
    } catch (error) {
      console.error('Failed to initialize RealTimeDataService:', error);
    }
  }

  // Live Inventory Management
  public async processInventoryUpdate(update: Omit<LiveInventoryUpdate, 'id' | 'timestamp'>): Promise<LiveInventoryUpdate> {
    const inventoryUpdate: LiveInventoryUpdate = {
      ...update,
      id: `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    this.inventoryUpdates.set(inventoryUpdate.id, inventoryUpdate);
    await this.saveInventoryUpdates();

    // Notify subscribers
    this.notifySubscribers('inventory_update', inventoryUpdate);

    // Generate recommendations if applicable
    if (inventoryUpdate.updateType === 'price_change') {
      await this.processPriceChange(inventoryUpdate);
    }

    // Process trending if new listing
    if (inventoryUpdate.updateType === 'new_listing') {
      await this.updateTrendingData(inventoryUpdate);
    }

    return inventoryUpdate;
  }

  public async getInventoryUpdates(filters?: {
    carId?: string;
    dealerId?: string;
    updateType?: LiveInventoryUpdate['updateType'];
    priority?: LiveInventoryUpdate['priority'];
    since?: string;
    limit?: number;
  }): Promise<LiveInventoryUpdate[]> {
    let updates = Array.from(this.inventoryUpdates.values());

    if (filters) {
      if (filters.carId) {
        updates = updates.filter(update => update.carId === filters.carId);
      }
      
      if (filters.dealerId) {
        updates = updates.filter(update => update.dealerId === filters.dealerId);
      }
      
      if (filters.updateType) {
        updates = updates.filter(update => update.updateType === filters.updateType);
      }
      
      if (filters.priority) {
        updates = updates.filter(update => update.priority === filters.priority);
      }
      
      if (filters.since) {
        const sinceDate = new Date(filters.since);
        updates = updates.filter(update => new Date(update.timestamp) > sinceDate);
      }
    }

    // Sort by timestamp (newest first)
    updates = updates.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (filters?.limit) {
      updates = updates.slice(0, filters.limit);
    }

    return updates;
  }

  // Price Change Notifications
  private async processPriceChange(update: LiveInventoryUpdate): Promise<void> {
    if (!update.previousData?.price || !update.newData?.price) return;

    const previousPrice = update.previousData.price;
    const newPrice = update.newData.price;
    const changeAmount = newPrice - previousPrice;
    const changePercentage = (changeAmount / previousPrice) * 100;

    // Only process significant price changes
    if (Math.abs(changePercentage) < this.config.priceChangeThresholdPercent) return;

    const priceChange: PriceChangeNotification = {
      id: `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      carId: update.carId,
      previousPrice,
      newPrice,
      changeAmount,
      changePercentage,
      priceDirection: changeAmount > 0 ? 'increase' : 'decrease',
      dealerId: update.dealerId,
      reason: this.determinePriceChangeReason(changePercentage),
      timestamp: new Date().toISOString(),
      notificationSent: false,
      subscribedUsers: update.affectedUsers,
    };

    this.priceChanges.set(priceChange.id, priceChange);
    await this.savePriceChanges();

    // Generate recommendations for price drops
    if (priceChange.priceDirection === 'decrease') {
      await this.generatePriceDropRecommendations(priceChange);
    }

    // Notify subscribers
    this.notifySubscribers('price_change', priceChange);
  }

  private determinePriceChangeReason(changePercentage: number): PriceChangeNotification['reason'] {
    const absChange = Math.abs(changePercentage);
    
    if (absChange > 20) return 'clearance';
    if (absChange > 15) return 'promotion';
    if (absChange > 10) return 'incentive';
    if (absChange > 5) return 'market_adjustment';
    return 'other';
  }

  public async getPriceChanges(filters?: {
    carId?: string;
    dealerId?: string;
    priceDirection?: 'increase' | 'decrease';
    minChangePercent?: number;
    since?: string;
    limit?: number;
  }): Promise<PriceChangeNotification[]> {
    let changes = Array.from(this.priceChanges.values());

    if (filters) {
      if (filters.carId) {
        changes = changes.filter(change => change.carId === filters.carId);
      }
      
      if (filters.dealerId) {
        changes = changes.filter(change => change.dealerId === filters.dealerId);
      }
      
      if (filters.priceDirection) {
        changes = changes.filter(change => change.priceDirection === filters.priceDirection);
      }
      
      if (filters.minChangePercent !== undefined) {
        changes = changes.filter(change => Math.abs(change.changePercentage) >= filters.minChangePercent!);
      }
      
      if (filters.since) {
        const sinceDate = new Date(filters.since);
        changes = changes.filter(change => new Date(change.timestamp) > sinceDate);
      }
    }

    // Sort by change percentage (largest changes first)
    changes = changes.sort((a, b) => Math.abs(b.changePercentage) - Math.abs(a.changePercentage));

    if (filters?.limit) {
      changes = changes.slice(0, filters.limit);
    }

    return changes;
  }

  // Market Trend Analysis
  public async updateMarketTrend(trendData: Omit<MarketTrend, 'id' | 'lastUpdated'>): Promise<MarketTrend> {
    const trendKey = `${trendData.category}_${trendData.identifier}_${trendData.metric}`;
    
    const trend: MarketTrend = {
      ...trendData,
      id: trendKey,
      lastUpdated: new Date().toISOString(),
    };

    this.marketTrends.set(trendKey, trend);
    await this.saveMarketTrends();

    // Notify subscribers
    this.notifySubscribers('market_trend', trend);

    return trend;
  }

  public async getMarketTrends(filters?: {
    category?: MarketTrend['category'];
    identifier?: string;
    metric?: MarketTrend['metric'];
    trend?: MarketTrend['trend'];
    minConfidence?: number;
    limit?: number;
  }): Promise<MarketTrend[]> {
    let trends = Array.from(this.marketTrends.values());

    if (filters) {
      if (filters.category) {
        trends = trends.filter(trend => trend.category === filters.category);
      }
      
      if (filters.identifier) {
        trends = trends.filter(trend => trend.identifier.toLowerCase().includes(filters.identifier!.toLowerCase()));
      }
      
      if (filters.metric) {
        trends = trends.filter(trend => trend.metric === filters.metric);
      }
      
      if (filters.trend) {
        trends = trends.filter(trend => trend.trend === filters.trend);
      }
      
      if (filters.minConfidence) {
        trends = trends.filter(trend => trend.confidence >= filters.minConfidence!);
      }
    }

    // Sort by confidence and trend significance
    trends = trends.sort((a, b) => {
      const scoreA = a.confidence + Math.abs(a.changePercentage);
      const scoreB = b.confidence + Math.abs(b.changePercentage);
      return scoreB - scoreA;
    });

    if (filters?.limit) {
      trends = trends.slice(0, filters.limit);
    }

    return trends;
  }

  // Popular Searches Tracking
  public async updatePopularSearch(searchData: Omit<PopularSearch, 'id' | 'timestamp' | 'rank'>): Promise<PopularSearch> {
    const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const search: PopularSearch = {
      ...searchData,
      id: searchId,
      timestamp: new Date().toISOString(),
      rank: this.calculateSearchRank(searchData),
    };

    this.popularSearches.set(searchId, search);
    await this.savePopularSearches();

    // Update trending rankings
    await this.updateSearchRankings();

    return search;
  }

  private calculateSearchRank(searchData: Omit<PopularSearch, 'id' | 'timestamp' | 'rank'>): number {
    // Simplified ranking algorithm
    const frequencyWeight = 0.4;
    const trendingWeight = 0.3;
    const recencyWeight = 0.2;
    const engagementWeight = 0.1;

    const maxFrequency = Math.max(...Array.from(this.popularSearches.values()).map(s => s.frequency), 1);
    const normalizedFrequency = (searchData.frequency / maxFrequency) * 100;
    
    const score = (normalizedFrequency * frequencyWeight) + 
                  (searchData.trendingScore * trendingWeight) + 
                  (80 * recencyWeight) + // Recent searches get higher score
                  ((searchData.resultCount > 0 ? 90 : 50) * engagementWeight);

    return Math.round(score);
  }

  private async updateSearchRankings(): Promise<void> {
    const searches = Array.from(this.popularSearches.values())
      .sort((a, b) => b.rank - a.rank);

    searches.forEach((search, index) => {
      search.rank = index + 1;
      this.popularSearches.set(search.id, search);
    });

    await this.savePopularSearches();
  }

  public async getPopularSearches(filters?: {
    userSegment?: PopularSearch['userSegment'];
    location?: { city?: string; state?: string };
    minRank?: number;
    maxRank?: number;
    limit?: number;
  }): Promise<PopularSearch[]> {
    let searches = Array.from(this.popularSearches.values());

    if (filters) {
      if (filters.userSegment) {
        searches = searches.filter(search => search.userSegment === filters.userSegment);
      }
      
      if (filters.location?.city) {
        searches = searches.filter(search => 
          search.location?.city.toLowerCase().includes(filters.location!.city!.toLowerCase())
        );
      }
      
      if (filters.location?.state) {
        searches = searches.filter(search => 
          search.location?.state.toLowerCase().includes(filters.location!.state!.toLowerCase())
        );
      }
      
      if (filters.minRank) {
        searches = searches.filter(search => search.rank >= filters.minRank!);
      }
      
      if (filters.maxRank) {
        searches = searches.filter(search => search.rank <= filters.maxRank!);
      }
    }

    // Sort by rank
    searches = searches.sort((a, b) => a.rank - b.rank);

    if (filters?.limit) {
      searches = searches.slice(0, filters.limit);
    }

    return searches;
  }

  // Real-time Recommendations
  private async generatePriceDropRecommendations(priceChange: PriceChangeNotification): Promise<void> {
    for (const userId of priceChange.subscribedUsers) {
      const recommendation: RealtimeRecommendation = {
        id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        carId: priceChange.carId,
        type: 'price_drop',
        urgency: this.calculateUrgency(priceChange.changePercentage),
        title: `Price Drop Alert: ${Math.abs(priceChange.changePercentage).toFixed(1)}% Off!`,
        description: `The car you're interested in just dropped by $${Math.abs(priceChange.changeAmount).toLocaleString()}`,
        actionText: 'View Deal',
        reasons: [`${Math.abs(priceChange.changePercentage).toFixed(1)}% price reduction`, 'Limited time opportunity'],
        confidenceScore: 95,
        metadata: {
          originalPrice: priceChange.previousPrice,
          newPrice: priceChange.newPrice,
          savingsAmount: Math.abs(priceChange.changeAmount),
        },
        trigger: {
          event: 'price_change',
          timestamp: priceChange.timestamp,
          data: { priceChangeId: priceChange.id },
        },
        userInteraction: {
          viewed: false,
          clicked: false,
          dismissed: false,
          shared: false,
        },
        effectiveness: {
          impressions: 0,
          clicks: 0,
          conversions: 0,
          clickThroughRate: 0,
          conversionRate: 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Add to user's recommendations
      const userRecommendations = this.recommendations.get(userId) || [];
      userRecommendations.unshift(recommendation);
      
      // Keep only recent recommendations
      if (userRecommendations.length > 20) {
        userRecommendations.splice(20);
      }
      
      this.recommendations.set(userId, userRecommendations);
    }

    await this.saveRecommendations();
  }

  private calculateUrgency(changePercentage: number): RealtimeRecommendation['urgency'] {
    const absChange = Math.abs(changePercentage);
    
    if (absChange > 20) return 'critical';
    if (absChange > 15) return 'high';
    if (absChange > 10) return 'medium';
    return 'low';
  }

  public async getUserRecommendations(userId: string, limit: number = 10): Promise<RealtimeRecommendation[]> {
    const userRecommendations = this.recommendations.get(userId) || [];
    
    // Filter out expired recommendations
    const activeRecommendations = userRecommendations.filter(rec => {
      if (!rec.expiresAt) return true;
      return new Date(rec.expiresAt) > new Date();
    });

    // Sort by urgency and confidence
    const sorted = activeRecommendations.sort((a, b) => {
      const urgencyScore = { critical: 4, high: 3, medium: 2, low: 1 };
      const scoreA = urgencyScore[a.urgency] * 25 + a.confidenceScore;
      const scoreB = urgencyScore[b.urgency] * 25 + b.confidenceScore;
      return scoreB - scoreA;
    });

    return sorted.slice(0, limit);
  }

  public async markRecommendationInteraction(
    recommendationId: string, 
    interaction: keyof RealtimeRecommendation['userInteraction'], 
    value: boolean = true
  ): Promise<boolean> {
    // Find recommendation across all users
    for (const [userId, recommendations] of this.recommendations.entries()) {
      const recommendation = recommendations.find(rec => rec.id === recommendationId);
      
      if (recommendation) {
        (recommendation.userInteraction as any)[interaction] = value;
        
        if (interaction === 'viewed' && value) {
          recommendation.userInteraction.viewedAt = new Date().toISOString();
          recommendation.effectiveness.impressions++;
        } else if (interaction === 'clicked' && value) {
          recommendation.userInteraction.clickedAt = new Date().toISOString();
          recommendation.effectiveness.clicks++;
        }
        
        recommendation.updatedAt = new Date().toISOString();
        
        // Update effectiveness metrics
        this.updateRecommendationEffectiveness(recommendation);
        
        this.recommendations.set(userId, recommendations);
        await this.saveRecommendations();
        
        return true;
      }
    }
    
    return false;
  }

  private updateRecommendationEffectiveness(recommendation: RealtimeRecommendation): void {
    const { impressions, clicks, conversions } = recommendation.effectiveness;
    
    recommendation.effectiveness.clickThroughRate = impressions > 0 ? (clicks / impressions) * 100 : 0;
    recommendation.effectiveness.conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
  }

  // Subscription Management
  public subscribe(event: string, callback: (data: any) => void): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, []);
    }
    
    this.subscriptions.get(event)!.push(callback);
    
    return subscriptionId;
  }

  public unsubscribe(event: string, subscriptionId: string): boolean {
    const callbacks = this.subscriptions.get(event);
    if (!callbacks) return false;

    // In a real implementation, would track subscription IDs properly
    // For now, just return true
    return true;
  }

  private notifySubscribers(event: string, data: any): void {
    const callbacks = this.subscriptions.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in subscription callback for ${event}:`, error);
      }
    });
  }

  // Background Synchronization
  private startBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(async () => {
      await this.performSync();
    }, this.config.syncFrequencyMinutes * 60 * 1000);

    // Perform initial sync
    this.performSync();
  }

  private async performSync(): Promise<void> {
    const startTime = Date.now();
    this.syncStatus.status = 'syncing';
    this.syncStatus.errors = [];

    try {
      // Simulate data synchronization
      await this.syncInventoryData();
      await this.syncPriceData();
      await this.syncTrendData();
      await this.syncSearchData();

      this.syncStatus.status = 'completed';
      this.syncStatus.recordsProcessed = Math.floor(Math.random() * 1000) + 100;
    } catch (error) {
      this.syncStatus.status = 'failed';
      this.syncStatus.errors.push({
        type: 'sync_error',
        message: error instanceof Error ? error.message : 'Unknown sync error',
        timestamp: new Date().toISOString(),
      });
    } finally {
      this.syncStatus.syncDuration = Date.now() - startTime;
      this.syncStatus.lastSync = new Date().toISOString();
      this.syncStatus.nextScheduledSync = new Date(
        Date.now() + this.config.syncFrequencyMinutes * 60 * 1000
      ).toISOString();

      await this.saveSyncStatus();
    }
  }

  private async syncInventoryData(): Promise<void> {
    // Simulate inventory data sync
    console.log('Syncing inventory data...');
  }

  private async syncPriceData(): Promise<void> {
    // Simulate price data sync
    console.log('Syncing price data...');
  }

  private async syncTrendData(): Promise<void> {
    // Simulate trend data sync
    console.log('Syncing trend data...');
  }

  private async syncSearchData(): Promise<void> {
    // Simulate search data sync
    console.log('Syncing search data...');
  }

  // Trending Update Processing
  private async updateTrendingData(update: LiveInventoryUpdate): Promise<void> {
    // Update popular searches based on new listings
    // This is a simplified version - in reality would be more complex
    
    if (update.newData.make && update.newData.model) {
      const searchQuery = `${update.newData.make} ${update.newData.model}`;
      
      // Find existing search or create new one
      let existingSearch = Array.from(this.popularSearches.values())
        .find(search => search.query.toLowerCase() === searchQuery.toLowerCase());

      if (existingSearch) {
        existingSearch.frequency++;
        existingSearch.trendingScore += 5;
        this.popularSearches.set(existingSearch.id, existingSearch);
      } else {
        await this.updatePopularSearch({
          query: searchQuery,
          searchTerms: [update.newData.make, update.newData.model],
          filters: {},
          frequency: 1,
          trendingScore: 75,
          userSegment: 'all',
          relatedSearches: [],
          resultCount: 1,
          averageResultPrice: update.newData.price || 25000,
          topBrands: [update.newData.make],
          seasonality: { isSeasonalTrend: false },
          demographics: {
            ageGroups: { '25-44': 60, '45-64': 30, 'other': 10 },
            genderDistribution: { 'male': 55, 'female': 45 },
            incomeRanges: { 'middle': 70, 'upper': 20, 'lower': 10 },
          },
          changeFromPreviousPeriod: 0,
        });
      }
    }
  }

  // Configuration Management
  public updateConfig(newConfig: Partial<RealtimeConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.saveConfig();
    
    // Restart sync with new frequency if changed
    if (newConfig.syncFrequencyMinutes) {
      this.startBackgroundSync();
    }
  }

  public getConfig(): RealtimeConfig {
    return { ...this.config };
  }

  public getSyncStatus(): DataSyncStatus {
    return { ...this.syncStatus };
  }

  // Sample Data Initialization
  private async initializeSampleData(): Promise<void> {
    if (this.marketTrends.size > 0) return;

    // Sample market trends
    const sampleTrends: Omit<MarketTrend, 'id' | 'lastUpdated'>[] = [
      {
        category: 'make',
        identifier: 'Toyota',
        metric: 'demand',
        currentValue: 850,
        previousValue: 780,
        changeAmount: 70,
        changePercentage: 8.97,
        trend: 'increasing',
        periodDays: 30,
        confidence: 92,
        dataPoints: [
          { timestamp: '2024-01-01', value: 780 },
          { timestamp: '2024-01-15', value: 810 },
          { timestamp: '2024-01-30', value: 850 },
        ],
        insights: ['Strong demand growth', 'Hybrid models driving popularity', 'Supply constraints boosting interest'],
        predictedDirection: 'up',
        predictedChange: 5.2,
      },
      {
        category: 'body_type',
        identifier: 'SUV',
        metric: 'price',
        currentValue: 35500,
        previousValue: 34200,
        changeAmount: 1300,
        changePercentage: 3.8,
        trend: 'increasing',
        periodDays: 30,
        confidence: 88,
        dataPoints: [
          { timestamp: '2024-01-01', value: 34200 },
          { timestamp: '2024-01-15', value: 34850 },
          { timestamp: '2024-01-30', value: 35500 },
        ],
        insights: ['Steady price appreciation', 'High demand in suburban markets', 'Limited inventory pushing prices up'],
        predictedDirection: 'up',
        predictedChange: 2.1,
      },
    ];

    // Sample popular searches
    const sampleSearches: Omit<PopularSearch, 'id' | 'timestamp' | 'rank'>[] = [
      {
        query: 'Toyota Camry',
        searchTerms: ['Toyota', 'Camry', 'sedan'],
        filters: { make: 'Toyota', model: 'Camry' },
        frequency: 1250,
        trendingScore: 95,
        userSegment: 'families',
        relatedSearches: ['Honda Accord', 'Nissan Altima', 'Toyota Corolla'],
        resultCount: 89,
        averageResultPrice: 28500,
        topBrands: ['Toyota'],
        seasonality: { isSeasonalTrend: false },
        demographics: {
          ageGroups: { '25-34': 35, '35-44': 30, '45-54': 25, '55+': 10 },
          genderDistribution: { 'male': 52, 'female': 48 },
          incomeRanges: { 'middle': 65, 'upper_middle': 25, 'lower_middle': 10 },
        },
        changeFromPreviousPeriod: 12.5,
      },
    ];

    // Create sample data
    for (const trendData of sampleTrends) {
      await this.updateMarketTrend(trendData);
    }

    for (const searchData of sampleSearches) {
      await this.updatePopularSearch(searchData);
    }
  }

  // Data Persistence Methods
  private async loadInventoryUpdates(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('realtime_inventory_updates');
      if (data) {
        const updates = JSON.parse(data);
        this.inventoryUpdates = new Map(updates);
      }
    } catch (error) {
      console.error('Failed to load inventory updates:', error);
    }
  }

  private async saveInventoryUpdates(): Promise<void> {
    try {
      const updates = Array.from(this.inventoryUpdates.entries());
      await AsyncStorage.setItem('realtime_inventory_updates', JSON.stringify(updates));
    } catch (error) {
      console.error('Failed to save inventory updates:', error);
    }
  }

  private async loadPriceChanges(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('realtime_price_changes');
      if (data) {
        const changes = JSON.parse(data);
        this.priceChanges = new Map(changes);
      }
    } catch (error) {
      console.error('Failed to load price changes:', error);
    }
  }

  private async savePriceChanges(): Promise<void> {
    try {
      const changes = Array.from(this.priceChanges.entries());
      await AsyncStorage.setItem('realtime_price_changes', JSON.stringify(changes));
    } catch (error) {
      console.error('Failed to save price changes:', error);
    }
  }

  private async loadMarketTrends(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('realtime_market_trends');
      if (data) {
        const trends = JSON.parse(data);
        this.marketTrends = new Map(trends);
      }
    } catch (error) {
      console.error('Failed to load market trends:', error);
    }
  }

  private async saveMarketTrends(): Promise<void> {
    try {
      const trends = Array.from(this.marketTrends.entries());
      await AsyncStorage.setItem('realtime_market_trends', JSON.stringify(trends));
    } catch (error) {
      console.error('Failed to save market trends:', error);
    }
  }

  private async loadPopularSearches(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('realtime_popular_searches');
      if (data) {
        const searches = JSON.parse(data);
        this.popularSearches = new Map(searches);
      }
    } catch (error) {
      console.error('Failed to load popular searches:', error);
    }
  }

  private async savePopularSearches(): Promise<void> {
    try {
      const searches = Array.from(this.popularSearches.entries());
      await AsyncStorage.setItem('realtime_popular_searches', JSON.stringify(searches));
    } catch (error) {
      console.error('Failed to save popular searches:', error);
    }
  }

  private async loadRecommendations(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('realtime_recommendations');
      if (data) {
        const recommendations = JSON.parse(data);
        this.recommendations = new Map(recommendations);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  }

  private async saveRecommendations(): Promise<void> {
    try {
      const recommendations = Array.from(this.recommendations.entries());
      await AsyncStorage.setItem('realtime_recommendations', JSON.stringify(recommendations));
    } catch (error) {
      console.error('Failed to save recommendations:', error);
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('realtime_config');
      if (data) {
        this.config = { ...this.config, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  }

  private async saveConfig(): Promise<void> {
    try {
      await AsyncStorage.setItem('realtime_config', JSON.stringify(this.config));
    } catch (error) {
      console.error('Failed to save config:', error);
    }
  }

  private async loadSyncStatus(): Promise<void> {
    try {
      const data = await AsyncStorage.getItem('realtime_sync_status');
      if (data) {
        this.syncStatus = { ...this.syncStatus, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  }

  private async saveSyncStatus(): Promise<void> {
    try {
      await AsyncStorage.setItem('realtime_sync_status', JSON.stringify(this.syncStatus));
    } catch (error) {
      console.error('Failed to save sync status:', error);
    }
  }

  // Cleanup
  public destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    this.subscriptions.clear();
    this.isInitialized = false;
  }
}

// Singleton instance
export const realTimeDataService = RealTimeDataService.getInstance();

// React Hook for Real-Time Data
export const useRealTimeData = () => {
  return {
    processInventoryUpdate: realTimeDataService.processInventoryUpdate.bind(realTimeDataService),
    getInventoryUpdates: realTimeDataService.getInventoryUpdates.bind(realTimeDataService),
    getPriceChanges: realTimeDataService.getPriceChanges.bind(realTimeDataService),
    getMarketTrends: realTimeDataService.getMarketTrends.bind(realTimeDataService),
    getPopularSearches: realTimeDataService.getPopularSearches.bind(realTimeDataService),
    getUserRecommendations: realTimeDataService.getUserRecommendations.bind(realTimeDataService),
    markRecommendationInteraction: realTimeDataService.markRecommendationInteraction.bind(realTimeDataService),
    subscribe: realTimeDataService.subscribe.bind(realTimeDataService),
    unsubscribe: realTimeDataService.unsubscribe.bind(realTimeDataService),
    updateConfig: realTimeDataService.updateConfig.bind(realTimeDataService),
    getConfig: realTimeDataService.getConfig.bind(realTimeDataService),
    getSyncStatus: realTimeDataService.getSyncStatus.bind(realTimeDataService),
  };
};

export default realTimeDataService;
