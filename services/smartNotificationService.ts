import { Car as CarType } from '@/types/database';

export interface NotificationSettings {
  priceDrops: boolean;
  newListings: boolean;
  savedSearches: boolean;
  favoriteCarUpdates: boolean;
  marketInsights: boolean;
}

export interface SmartNotification {
  id: string;
  type: 'price_drop' | 'new_listing' | 'search_result' | 'market_insight' | 'favorite_update';
  title: string;
  message: string;
  data: any;
  timestamp: number;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

export interface PriceAlert {
  id: string;
  carId: string;
  targetPrice: number;
  currentPrice: number;
  isActive: boolean;
  createdAt: number;
}

export interface SavedSearchAlert {
  id: string;
  query: string;
  filters: any;
  isActive: boolean;
  lastNotified: number;
  createdAt: number;
}

class SmartNotificationService {
  private static instance: SmartNotificationService;
  private notifications: SmartNotification[] = [];
  private priceAlerts: PriceAlert[] = [];
  private savedSearchAlerts: SavedSearchAlert[] = [];
  private settings: NotificationSettings = {
    priceDrops: true,
    newListings: true,
    savedSearches: true,
    favoriteCarUpdates: true,
    marketInsights: false,
  };

  static getInstance(): SmartNotificationService {
    if (!SmartNotificationService.instance) {
      SmartNotificationService.instance = new SmartNotificationService();
    }
    return SmartNotificationService.instance;
  }

  // Notification Management
  async createNotification(
    type: SmartNotification['type'],
    title: string,
    message: string,
    data: any = {},
    priority: SmartNotification['priority'] = 'medium'
  ): Promise<SmartNotification> {
    const notification: SmartNotification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      message,
      data,
      timestamp: Date.now(),
      isRead: false,
      priority,
    };

    this.notifications.unshift(notification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    // Show system notification if enabled
    if (this.shouldShowNotification(type)) {
      await this.showSystemNotification(notification);
    }

    return notification;
  }

  private shouldShowNotification(type: SmartNotification['type']): boolean {
    switch (type) {
      case 'price_drop':
        return this.settings.priceDrops;
      case 'new_listing':
        return this.settings.newListings;
      case 'search_result':
        return this.settings.savedSearches;
      case 'favorite_update':
        return this.settings.favoriteCarUpdates;
      case 'market_insight':
        return this.settings.marketInsights;
      default:
        return true;
    }
  }

  private async showSystemNotification(notification: SmartNotification): Promise<void> {
    // TODO: Implement system notification using expo-notifications or react-native-push-notification
    console.log('System Notification:', notification.title, notification.message);
  }

  // Price Alerts
  async createPriceAlert(carId: string, targetPrice: number, currentPrice: number): Promise<PriceAlert> {
    const alert: PriceAlert = {
      id: `price_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      carId,
      targetPrice,
      currentPrice,
      isActive: true,
      createdAt: Date.now(),
    };

    this.priceAlerts.push(alert);
    return alert;
  }

  async checkPriceAlerts(cars: CarType[]): Promise<void> {
    const activeAlerts = this.priceAlerts.filter(alert => alert.isActive);
    
    for (const alert of activeAlerts) {
      const car = cars.find(c => c.id === alert.carId);
      if (car && car.price <= alert.targetPrice) {
        await this.createNotification(
          'price_drop',
          '🎉 Price Drop Alert!',
          `${car.make} ${car.model} is now €${car.price.toLocaleString()} (was €${alert.currentPrice.toLocaleString()})`,
          { carId: car.id, car, alert },
          'high'
        );
        
        // Mark alert as triggered
        alert.isActive = false;
      }
    }
  }

  // Saved Search Alerts
  async createSavedSearchAlert(query: string, filters: any): Promise<SavedSearchAlert> {
    const alert: SavedSearchAlert = {
      id: `search_alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      query,
      filters,
      isActive: true,
      lastNotified: 0,
      createdAt: Date.now(),
    };

    this.savedSearchAlerts.push(alert);
    return alert;
  }

  async checkSavedSearchAlerts(newCars: CarType[]): Promise<void> {
    const activeAlerts = this.savedSearchAlerts.filter(alert => alert.isActive);
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    
    for (const alert of activeAlerts) {
      // Only check if we haven't notified in the last 24 hours
      if (alert.lastNotified > oneDayAgo) continue;
      
      // Simple matching logic - can be enhanced with AI search integration
      const matchingCars = newCars.filter(car => {
        const queryLower = alert.query.toLowerCase();
        return (
          car.make.toLowerCase().includes(queryLower) ||
          car.model.toLowerCase().includes(queryLower) ||
          (car.fuel_type && car.fuel_type.toLowerCase().includes(queryLower))
        );
      });

      if (matchingCars.length > 0) {
        await this.createNotification(
          'search_result',
          '🔍 New Search Results!',
          `${matchingCars.length} new cars found for "${alert.query}"`,
          { query: alert.query, cars: matchingCars.slice(0, 5), alert },
          'medium'
        );
        
        alert.lastNotified = Date.now();
      }
    }
  }

  // Market Insights
  async generateMarketInsights(cars: CarType[]): Promise<void> {
    if (!this.settings.marketInsights) return;

    const insights = this.analyzeMarketTrends(cars);
    
    for (const insight of insights) {
      await this.createNotification(
        'market_insight',
        '📊 Market Insight',
        insight.message,
        insight.data,
        'low'
      );
    }
  }

  private analyzeMarketTrends(cars: CarType[]): Array<{ message: string; data: any }> {
    const insights: Array<{ message: string; data: any }> = [];
    
    // Price trend analysis
    const avgPrice = cars.reduce((sum, car) => sum + car.price, 0) / cars.length;
    const recentCars = cars.filter(car => new Date(car.created_at).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000));
    const avgRecentPrice = recentCars.reduce((sum, car) => sum + car.price, 0) / recentCars.length;
    
    if (avgRecentPrice > avgPrice * 1.05) {
      insights.push({
        message: `Car prices have increased by ${Math.round(((avgRecentPrice - avgPrice) / avgPrice) * 100)}% this week`,
        data: { avgPrice, avgRecentPrice, trend: 'up' }
      });
    } else if (avgRecentPrice < avgPrice * 0.95) {
      insights.push({
        message: `Car prices have decreased by ${Math.round(((avgPrice - avgRecentPrice) / avgPrice) * 100)}% this week`,
        data: { avgPrice, avgRecentPrice, trend: 'down' }
      });
    }

    // Popular models analysis
    const modelCounts = cars.reduce((acc, car) => {
      const key = `${car.make} ${car.model}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularModel = Object.entries(modelCounts).reduce((a, b) => a[1] > b[1] ? a : b);
    if (popularModel[1] > 5) {
      insights.push({
        message: `${popularModel[0]} is trending with ${popularModel[1]} new listings`,
        data: { model: popularModel[0], count: popularModel[1] }
      });
    }

    return insights.slice(0, 2); // Limit to 2 insights to avoid spam
  }

  // Notification Getters
  getNotifications(): SmartNotification[] {
    return [...this.notifications];
  }

  getUnreadNotifications(): SmartNotification[] {
    return this.notifications.filter(n => !n.isRead);
  }

  getNotificationsByType(type: SmartNotification['type']): SmartNotification[] {
    return this.notifications.filter(n => n.type === type);
  }

  // Notification Actions
  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
    }
  }

  async markAllAsRead(): Promise<void> {
    this.notifications.forEach(n => n.isRead = true);
  }

  async deleteNotification(notificationId: string): Promise<void> {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
  }

  async clearAllNotifications(): Promise<void> {
    this.notifications = [];
  }

  // Settings Management
  updateSettings(newSettings: Partial<NotificationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Alert Management
  getPriceAlerts(): PriceAlert[] {
    return [...this.priceAlerts];
  }

  getSavedSearchAlerts(): SavedSearchAlert[] {
    return [...this.savedSearchAlerts];
  }

  async deletePriceAlert(alertId: string): Promise<void> {
    this.priceAlerts = this.priceAlerts.filter(alert => alert.id !== alertId);
  }

  async deleteSavedSearchAlert(alertId: string): Promise<void> {
    this.savedSearchAlerts = this.savedSearchAlerts.filter(alert => alert.id !== alertId);
  }

  // Statistics
  getNotificationStats(): {
    total: number;
    unread: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
  } {
    const byType = this.notifications.reduce((acc, n) => {
      acc[n.type] = (acc[n.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byPriority = this.notifications.reduce((acc, n) => {
      acc[n.priority] = (acc[n.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.notifications.length,
      unread: this.getUnreadNotifications().length,
      byType,
      byPriority,
    };
  }
}

export default SmartNotificationService;
