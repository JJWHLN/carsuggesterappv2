/**
 * Real-time Price Tracking Service
 * 
 * Phase 2 Week 6 - Real-time Features & Live Communication
 * 
 * Features:
 * - Live price updates from dealers
 * - Price alerts and notifications
 * - Market trend analysis
 * - Price history tracking
 * - Competitor price monitoring
 */

import { EventEmitter } from 'events';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppWebSocketManager from './WebSocketManager';
import RealNotificationService from '../RealNotificationService';
import { supabase } from '../../lib/supabase';

export interface PriceUpdate {
  id: string;
  carId: string;
  dealerId: string;
  oldPrice: number;
  newPrice: number;
  change: number;
  changePercentage: number;
  reason?: 'market_adjustment' | 'promotion' | 'demand_change' | 'manual' | 'competitor_match';
  timestamp: number;
  isActive: boolean;
  validUntil?: number;
}

export interface PriceAlert {
  id: string;
  userId: string;
  carId: string;
  targetPrice: number;
  condition: 'below' | 'above' | 'exact';
  tolerance?: number;
  isActive: boolean;
  createdAt: number;
  triggeredAt?: number;
}

export interface MarketTrend {
  carId: string;
  make: string;
  model: string;
  year: number;
  avgPrice: number;
  priceChange24h: number;
  priceChange7d: number;
  priceChange30d: number;
  demandScore: number;
  supplyCount: number;
  lastUpdated: number;
}

export interface PriceHistory {
  carId: string;
  dealerId: string;
  price: number;
  timestamp: number;
  source: 'dealer' | 'market' | 'system';
}

export class PriceTrackingService extends EventEmitter {
  private ws: any;
  private currentUserId: string | null = null;
  private priceAlerts: Map<string, PriceAlert> = new Map();
  private marketTrends: Map<string, MarketTrend> = new Map();
  private priceHistory: Map<string, PriceHistory[]> = new Map();
  private watchedCars: Set<string> = new Set();
  
  private static readonly PRICE_ALERTS_KEY = '@price_alerts';
  private static readonly MARKET_TRENDS_KEY = '@market_trends';
  private static readonly PRICE_HISTORY_KEY = '@price_history';

  constructor() {
    super();
    this.initializeWebSocket();
    this.loadCachedData();
  }

  // Initialize WebSocket for real-time price updates
  private initializeWebSocket(): void {
    this.ws = AppWebSocketManager.getInstance();
    
    // Listen for price-related events
    this.ws.on('price_update', this.handlePriceUpdate.bind(this));
    this.ws.on('market_trend', this.handleMarketTrend.bind(this));
    this.ws.on('price_alert_triggered', this.handlePriceAlertTriggered.bind(this));
    this.ws.on('inventory_update', this.handleInventoryUpdate.bind(this));
  }

  // Set current user
  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
    this.loadUserPriceAlerts();
  }

  // Create price alert
  async createPriceAlert(
    carId: string,
    targetPrice: number,
    condition: 'below' | 'above' | 'exact',
    tolerance?: number
  ): Promise<PriceAlert> {
    const alert: PriceAlert = {
      id: this.generateAlertId(),
      userId: this.currentUserId!,
      carId,
      targetPrice,
      condition,
      tolerance,
      isActive: true,
      createdAt: Date.now()
    };

    try {
      // Save to database
      await supabase.from('price_alerts').insert({
        id: alert.id,
        user_id: this.currentUserId,
        car_id: carId,
        target_price: targetPrice,
        condition,
        tolerance,
        is_active: true,
        created_at: new Date().toISOString()
      });

      // Add to local cache
      this.priceAlerts.set(alert.id, alert);
      this.watchedCars.add(carId);

      // Subscribe to real-time updates for this car
      this.subscribeToCarPriceUpdates(carId);

      this.emit('priceAlertCreated', alert);
      this.saveCachedData();

      return alert;
    } catch (error) {
      console.error('Error creating price alert:', error);
      throw error;
    }
  }

  // Subscribe to price updates for a car
  subscribeToCarPriceUpdates(carId: string): void {
    this.watchedCars.add(carId);
    
    this.ws.send({
      type: 'subscribe_price_updates',
      payload: {
        carId,
        userId: this.currentUserId
      }
    });
  }

  // Unsubscribe from price updates
  unsubscribeFromCarPriceUpdates(carId: string): void {
    this.watchedCars.delete(carId);
    
    this.ws.send({
      type: 'unsubscribe_price_updates',
      payload: {
        carId,
        userId: this.currentUserId
      }
    });
  }

  // Get current price for a car
  async getCurrentPrice(carId: string): Promise<number | null> {
    try {
      const { data: car, error } = await supabase
        .from('cars')
        .select('price')
        .eq('id', carId)
        .single();

      if (error) throw error;
      return car?.price || null;
    } catch (error) {
      console.error('Error getting current price:', error);
      return null;
    }
  }

  // Get price history for a car
  async getPriceHistory(
    carId: string,
    dealerId?: string,
    days: number = 30
  ): Promise<PriceHistory[]> {
    const since = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    try {
      let query = supabase
        .from('price_history')
        .select('*')
        .eq('car_id', carId)
        .gte('created_at', new Date(since).toISOString())
        .order('created_at', { ascending: true });

      if (dealerId) {
        query = query.eq('dealer_id', dealerId);
      }

      const { data: history, error } = await query;

      if (error) throw error;

      const priceHistory: PriceHistory[] = history.map(h => ({
        carId: h.car_id,
        dealerId: h.dealer_id,
        price: h.price,
        timestamp: new Date(h.created_at).getTime(),
        source: h.source || 'dealer'
      }));

      // Cache the data
      this.priceHistory.set(carId, priceHistory);
      this.saveCachedData();

      return priceHistory;
    } catch (error) {
      console.error('Error getting price history:', error);
      return this.priceHistory.get(carId) || [];
    }
  }

  // Get market trends
  async getMarketTrends(
    make?: string,
    model?: string,
    year?: number
  ): Promise<MarketTrend[]> {
    try {
      let query = supabase
        .from('market_trends')
        .select('*')
        .order('last_updated', { ascending: false });

      if (make) query = query.eq('make', make);
      if (model) query = query.eq('model', model);
      if (year) query = query.eq('year', year);

      const { data: trends, error } = await query;

      if (error) throw error;

      const marketTrends: MarketTrend[] = trends.map(t => ({
        carId: t.car_id,
        make: t.make,
        model: t.model,
        year: t.year,
        avgPrice: t.avg_price,
        priceChange24h: t.price_change_24h,
        priceChange7d: t.price_change_7d,
        priceChange30d: t.price_change_30d,
        demandScore: t.demand_score,
        supplyCount: t.supply_count,
        lastUpdated: new Date(t.last_updated).getTime()
      }));

      // Update cache
      marketTrends.forEach(trend => {
        this.marketTrends.set(trend.carId, trend);
      });

      this.saveCachedData();
      return marketTrends;
    } catch (error) {
      console.error('Error getting market trends:', error);
      return Array.from(this.marketTrends.values());
    }
  }

  // Get user's price alerts
  async getUserPriceAlerts(): Promise<PriceAlert[]> {
    try {
      const { data: alerts, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', this.currentUserId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const priceAlerts: PriceAlert[] = alerts.map(a => ({
        id: a.id,
        userId: a.user_id,
        carId: a.car_id,
        targetPrice: a.target_price,
        condition: a.condition,
        tolerance: a.tolerance,
        isActive: a.is_active,
        createdAt: new Date(a.created_at).getTime(),
        triggeredAt: a.triggered_at ? new Date(a.triggered_at).getTime() : undefined
      }));

      // Update cache
      priceAlerts.forEach(alert => {
        this.priceAlerts.set(alert.id, alert);
        this.watchedCars.add(alert.carId);
      });

      this.saveCachedData();
      return priceAlerts;
    } catch (error) {
      console.error('Error getting price alerts:', error);
      return Array.from(this.priceAlerts.values());
    }
  }

  // Delete price alert
  async deletePriceAlert(alertId: string): Promise<void> {
    try {
      await supabase
        .from('price_alerts')
        .update({ is_active: false })
        .eq('id', alertId);

      const alert = this.priceAlerts.get(alertId);
      if (alert) {
        alert.isActive = false;
        this.priceAlerts.set(alertId, alert);
        
        // Check if we need to unsubscribe from this car
        const hasOtherAlerts = Array.from(this.priceAlerts.values())
          .some(a => a.carId === alert.carId && a.isActive && a.id !== alertId);
        
        if (!hasOtherAlerts) {
          this.unsubscribeFromCarPriceUpdates(alert.carId);
        }
      }

      this.emit('priceAlertDeleted', alertId);
      this.saveCachedData();
    } catch (error) {
      console.error('Error deleting price alert:', error);
      throw error;
    }
  }

  // Calculate price trend
  calculatePriceTrend(prices: PriceHistory[], period: '24h' | '7d' | '30d'): number {
    if (prices.length < 2) return 0;

    const now = Date.now();
    const periodMs = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    }[period];

    const currentPrice = prices[prices.length - 1].price;
    const pastPrices = prices.filter(p => now - p.timestamp <= periodMs);
    
    if (pastPrices.length === 0) return 0;

    const oldPrice = pastPrices[0].price;
    return ((currentPrice - oldPrice) / oldPrice) * 100;
  }

  // WebSocket event handlers
  private handlePriceUpdate(update: PriceUpdate): void {
    this.emit('priceUpdate', update);

    // Check if any alerts should be triggered
    this.checkPriceAlerts(update);

    // Add to price history
    const history = this.priceHistory.get(update.carId) || [];
    history.push({
      carId: update.carId,
      dealerId: update.dealerId,
      price: update.newPrice,
      timestamp: update.timestamp,
      source: 'dealer'
    });
    this.priceHistory.set(update.carId, history);

    // Send notification for significant price changes
    if (Math.abs(update.changePercentage) >= 5) {
      RealNotificationService.showLivePriceUpdate(
        update.carId,
        update.newPrice,
        update.oldPrice,
        update.changePercentage,
        update.reason
      );
    }

    this.saveCachedData();
  }

  private handleMarketTrend(trend: MarketTrend): void {
    this.marketTrends.set(trend.carId, trend);
    this.emit('marketTrendUpdate', trend);
    this.saveCachedData();
  }

  private handlePriceAlertTriggered(data: { alertId: string; currentPrice: number }): void {
    const alert = this.priceAlerts.get(data.alertId);
    if (alert) {
      alert.triggeredAt = Date.now();
      this.priceAlerts.set(alert.id, alert);
      this.emit('priceAlertTriggered', alert, data.currentPrice);
    }
  }

  private handleInventoryUpdate(data: { carId: string; isAvailable: boolean; price?: number }): void {
    if (data.price && this.watchedCars.has(data.carId)) {
      // Treat inventory updates with price changes as price updates
      const update: PriceUpdate = {
        id: `inv_${Date.now()}`,
        carId: data.carId,
        dealerId: 'system',
        oldPrice: 0, // We don't have the old price in this context
        newPrice: data.price,
        change: 0,
        changePercentage: 0,
        reason: 'market_adjustment',
        timestamp: Date.now(),
        isActive: data.isAvailable
      };

      this.handlePriceUpdate(update);
    }
  }

  // Check if any price alerts should be triggered
  private checkPriceAlerts(update: PriceUpdate): void {
    const alerts = Array.from(this.priceAlerts.values())
      .filter(alert => alert.carId === update.carId && alert.isActive);

    for (const alert of alerts) {
      let shouldTrigger = false;

      switch (alert.condition) {
        case 'below':
          shouldTrigger = update.newPrice <= alert.targetPrice;
          break;
        case 'above':
          shouldTrigger = update.newPrice >= alert.targetPrice;
          break;
        case 'exact':
          const tolerance = alert.tolerance || 0;
          shouldTrigger = Math.abs(update.newPrice - alert.targetPrice) <= tolerance;
          break;
      }

      if (shouldTrigger) {
        this.triggerPriceAlert(alert, update.newPrice);
      }
    }
  }

  // Trigger price alert
  private async triggerPriceAlert(alert: PriceAlert, currentPrice: number): Promise<void> {
    try {
      // Update alert in database
      await supabase
        .from('price_alerts')
        .update({ 
          triggered_at: new Date().toISOString(),
          is_active: false 
        })
        .eq('id', alert.id);

      // Update local cache
      alert.triggeredAt = Date.now();
      alert.isActive = false;
      this.priceAlerts.set(alert.id, alert);

      // Send notification
      await RealNotificationService.showPriceAlertTriggered(
        alert.carId,
        alert.targetPrice,
        currentPrice,
        alert.condition
      );

      this.emit('priceAlertTriggered', alert, currentPrice);
      this.saveCachedData();
    } catch (error) {
      console.error('Error triggering price alert:', error);
    }
  }

  // Load user's price alerts
  private async loadUserPriceAlerts(): Promise<void> {
    if (!this.currentUserId) return;
    
    try {
      await this.getUserPriceAlerts();
    } catch (error) {
      console.error('Error loading user price alerts:', error);
    }
  }

  // Cache management
  private async saveCachedData(): Promise<void> {
    try {
      const cacheData = {
        alerts: Array.from(this.priceAlerts.values()),
        trends: Array.from(this.marketTrends.values()),
        history: Object.fromEntries(this.priceHistory.entries()),
        watchedCars: Array.from(this.watchedCars)
      };

      await AsyncStorage.multiSet([
        [PriceTrackingService.PRICE_ALERTS_KEY, JSON.stringify(cacheData.alerts)],
        [PriceTrackingService.MARKET_TRENDS_KEY, JSON.stringify(cacheData.trends)],
        [PriceTrackingService.PRICE_HISTORY_KEY, JSON.stringify(cacheData.history)]
      ]);
    } catch (error) {
      console.error('Error saving price tracking cache:', error);
    }
  }

  private async loadCachedData(): Promise<void> {
    try {
      const keys = [
        PriceTrackingService.PRICE_ALERTS_KEY,
        PriceTrackingService.MARKET_TRENDS_KEY,
        PriceTrackingService.PRICE_HISTORY_KEY
      ];

      const cached = await AsyncStorage.multiGet(keys);
      
      // Load alerts
      if (cached[0][1]) {
        const alerts: PriceAlert[] = JSON.parse(cached[0][1]);
        alerts.forEach(alert => {
          this.priceAlerts.set(alert.id, alert);
          if (alert.isActive) {
            this.watchedCars.add(alert.carId);
          }
        });
      }

      // Load trends
      if (cached[1][1]) {
        const trends: MarketTrend[] = JSON.parse(cached[1][1]);
        trends.forEach(trend => {
          this.marketTrends.set(trend.carId, trend);
        });
      }

      // Load history
      if (cached[2][1]) {
        const history = JSON.parse(cached[2][1]);
        this.priceHistory = new Map(Object.entries(history));
      }
    } catch (error) {
      console.error('Error loading price tracking cache:', error);
    }
  }

  // Utility functions
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  destroy(): void {
    this.removeAllListeners();
    this.priceAlerts.clear();
    this.marketTrends.clear();
    this.priceHistory.clear();
    this.watchedCars.clear();
  }
}

export default PriceTrackingService;
