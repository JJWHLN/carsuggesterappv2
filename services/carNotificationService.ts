import { webCompatibleStorage } from './webCompatibleStorage';
import { supabase } from '@/lib/supabase';
import { CarUserPreferences } from './enhancedAuthService';

export interface CarNotification {
  id: string;
  type: 'price_drop' | 'new_listing' | 'saved_search_match' | 'dealer_message' | 'watchlist_update' | 'review_request';
  title: string;
  message: string;
  carId?: string;
  dealerId?: string;
  searchId?: string;
  data?: any;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  expiresAt?: string;
}

export interface PriceAlert {
  id: string;
  userId: string;
  carId: string;
  targetPrice: number;
  currentPrice: number;
  isActive: boolean;
  createdAt: string;
}

export interface SavedSearch {
  id: string;
  userId: string;
  name: string;
  filters: any;
  isActive: boolean;
  lastNotified: string;
  createdAt: string;
}

export class CarNotificationService {
  private static instance: CarNotificationService;
  private notifications: CarNotification[] = [];
  private priceAlerts: PriceAlert[] = [];
  private savedSearches: SavedSearch[] = [];
  private listeners: ((notifications: CarNotification[]) => void)[] = [];

  static getInstance(): CarNotificationService {
    if (!CarNotificationService.instance) {
      CarNotificationService.instance = new CarNotificationService();
    }
    return CarNotificationService.instance;
  }

  // Initialize the service
  async initialize(userId: string): Promise<void> {
    try {
      await Promise.all([
        this.loadNotifications(userId),
        this.loadPriceAlerts(userId),
        this.loadSavedSearches(userId),
      ]);

      // Set up real-time subscriptions
      this.setupRealtimeSubscriptions(userId);
    } catch (error) {
      logger.error('Error initializing notification service:', error);
    }
  }

  // Load notifications from storage
  private async loadNotifications(userId: string): Promise<void> {
    try {
      // Load from local storage first for quick access
      const localNotifications = await webCompatibleStorage.getItem(`notifications_${userId}`);
      if (localNotifications) {
        this.notifications = JSON.parse(localNotifications);
        this.notifyListeners();
      }

      // Then sync with server
      const { data, error } = await supabase
        .from('car_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      this.notifications = data.map(this.mapSupabaseNotification) || [];
      await this.saveNotificationsLocally(userId);
      this.notifyListeners();
    } catch (error) {
      logger.error('Error loading notifications:', error);
    }
  }

  // Load price alerts
  private async loadPriceAlerts(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      this.priceAlerts = data || [];
    } catch (error) {
      logger.error('Error loading price alerts:', error);
    }
  }

  // Load saved searches
  private async loadSavedSearches(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw error;

      this.savedSearches = data || [];
    } catch (error) {
      logger.error('Error loading saved searches:', error);
    }
  }

  // Set up real-time subscriptions
  private setupRealtimeSubscriptions(userId: string): void {
    // Subscribe to new notifications
    supabase
      .channel('car_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'car_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const notification = this.mapSupabaseNotification(payload.new);
          this.addNotification(notification);
        }
      )
      .subscribe();

    // Subscribe to car price changes for alerts
    supabase
      .channel('car_prices')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cars',
        },
        async (payload) => {
          await this.checkPriceChanges(payload.new, payload.old);
        }
      )
      .subscribe();
  }

  // Map Supabase notification to local format
  private mapSupabaseNotification(dbNotification: any): CarNotification {
    return {
      id: dbNotification.id,
      type: dbNotification.type,
      title: dbNotification.title,
      message: dbNotification.message,
      carId: dbNotification.car_id,
      dealerId: dbNotification.dealer_id,
      searchId: dbNotification.search_id,
      data: dbNotification.data,
      isRead: dbNotification.is_read,
      priority: dbNotification.priority || 'medium',
      createdAt: dbNotification.created_at,
      expiresAt: dbNotification.expires_at,
    };
  }

  // Create a new notification
  async createNotification(
    userId: string,
    type: CarNotification['type'],
    title: string,
    message: string,
    options?: {
      carId?: string;
      dealerId?: string;
      searchId?: string;
      data?: any;
      priority?: 'low' | 'medium' | 'high';
      expiresAt?: string;
    }
  ): Promise<void> {
    try {
      const notification: Omit<CarNotification, 'id'> = {
        type,
        title,
        message,
        carId: options?.carId,
        dealerId: options?.dealerId,
        searchId: options?.searchId,
        data: options?.data,
        isRead: false,
        priority: options?.priority || 'medium',
        createdAt: new Date().toISOString(),
        expiresAt: options?.expiresAt,
      };

      // Save to database
      const { data, error } = await supabase
        .from('car_notifications')
        .insert([{
          user_id: userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          car_id: notification.carId,
          dealer_id: notification.dealerId,
          search_id: notification.searchId,
          data: notification.data,
          is_read: notification.isRead,
          priority: notification.priority,
          created_at: notification.createdAt,
          expires_at: notification.expiresAt,
        }])
        .select()
        .single();

      if (error) throw error;

      // Add to local notifications (will be handled by real-time subscription)
      // But we can add it immediately for better UX
      const fullNotification: CarNotification = {
        ...notification,
        id: data.id,
      };

      this.addNotification(fullNotification);
    } catch (error) {
      logger.error('Error creating notification:', error);
    }
  }

  // Add notification to local list
  private addNotification(notification: CarNotification): void {
    this.notifications.unshift(notification);
    
    // Keep only the latest 50 notifications
    this.notifications = this.notifications.slice(0, 50);
    
    this.notifyListeners();
    this.saveNotificationsLocally(notification.id.split('_')[0]); // Extract user ID
  }

  // Check for price changes and create alerts
  private async checkPriceChanges(newCar: any, oldCar: any): Promise<void> {
    if (newCar.price !== oldCar.price) {
      // Find relevant price alerts
      const relevantAlerts = this.priceAlerts.filter(
        alert => alert.carId === newCar.id && alert.isActive
      );

      for (const alert of relevantAlerts) {
        if (newCar.price <= alert.targetPrice && newCar.price < alert.currentPrice) {
          // Price dropped to or below target
          await this.createNotification(
            alert.userId,
            'price_drop',
            '🎉 Price Drop Alert!',
            `${newCar.make} ${newCar.model} is now €${newCar.price.toLocaleString()} (was €${alert.currentPrice.toLocaleString()})`,
            {
              carId: newCar.id,
              priority: 'high',
              data: {
                oldPrice: alert.currentPrice,
                newPrice: newCar.price,
                savings: alert.currentPrice - newCar.price,
              },
            }
          );

          // Update the alert
          await supabase
            .from('price_alerts')
            .update({ current_price: newCar.price })
            .eq('id', alert.id);
        }
      }
    }
  }

  // Create price alert
  async createPriceAlert(
    userId: string,
    carId: string,
    targetPrice: number,
    currentPrice: number
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('price_alerts')
        .insert([{
          user_id: userId,
          car_id: carId,
          target_price: targetPrice,
          current_price: currentPrice,
          is_active: true,
          created_at: new Date().toISOString(),
        }]);

      if (error) throw error;

      // Reload price alerts
      await this.loadPriceAlerts(userId);

      // Create confirmation notification
      await this.createNotification(
        userId,
        'watchlist_update',
        '🔔 Price Alert Set',
        `You'll be notified when this car drops to €${targetPrice.toLocaleString()} or below`,
        {
          carId,
          priority: 'low',
          data: { targetPrice, currentPrice },
        }
      );

      return true;
    } catch (error) {
      logger.error('Error creating price alert:', error);
      return false;
    }
  }

  // Save search and set up notifications
  async createSavedSearch(
    userId: string,
    name: string,
    filters: any
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('saved_searches')
        .insert([{
          user_id: userId,
          name,
          filters,
          is_active: true,
          last_notified: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }]);

      if (error) throw error;

      // Reload saved searches
      await this.loadSavedSearches(userId);

      // Create confirmation notification
      await this.createNotification(
        userId,
        'saved_search_match',
        '💾 Search Saved',
        `"${name}" - You'll get notified about new matching cars`,
        {
          priority: 'low',
          data: { searchName: name, filters },
        }
      );

      return true;
    } catch (error) {
      logger.error('Error creating saved search:', error);
      return false;
    }
  }

  // Check saved searches for new matches
  async checkSavedSearchMatches(userId: string): Promise<void> {
    try {
      for (const savedSearch of this.savedSearches) {
        // Query cars that match the saved search criteria
        let query = supabase
          .from('cars')
          .select('*')
          .gte('created_at', savedSearch.lastNotified);

        // Apply filters (this would be more complex in a real implementation)
        if (savedSearch.filters.make) {
          query = query.eq('make', savedSearch.filters.make);
        }
        if (savedSearch.filters.minPrice) {
          query = query.gte('price', savedSearch.filters.minPrice);
        }
        if (savedSearch.filters.maxPrice) {
          query = query.lte('price', savedSearch.filters.maxPrice);
        }

        const { data: matchingCars, error } = await query.limit(5);

        if (error) throw error;

        if (matchingCars && matchingCars.length > 0) {
          // Create notification about new matches
          await this.createNotification(
            userId,
            'saved_search_match',
            '🔍 New Search Matches!',
            `${matchingCars.length} new car${matchingCars.length > 1 ? 's' : ''} match your saved search "${savedSearch.name}"`,
            {
              searchId: savedSearch.id,
              priority: 'medium',
              data: {
                searchName: savedSearch.name,
                matchCount: matchingCars.length,
                cars: matchingCars.map(car => ({
                  id: car.id,
                  make: car.make,
                  model: car.model,
                  price: car.price,
                })),
              },
            }
          );

          // Update last notified time
          await supabase
            .from('saved_searches')
            .update({ last_notified: new Date().toISOString() })
            .eq('id', savedSearch.id);
        }
      }
    } catch (error) {
      logger.error('Error checking saved search matches:', error);
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    try {
      // Update in database
      await supabase
        .from('car_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      // Update locally
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.isRead = true;
        this.notifyListeners();
        await this.saveNotificationsLocally(notification.id.split('_')[0]);
      }
    } catch (error) {
      logger.error('Error marking notification as read:', error);
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    try {
      // Update in database
      await supabase
        .from('car_notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      // Update locally
      this.notifications.forEach(notification => {
        notification.isRead = true;
      });

      this.notifyListeners();
      await this.saveNotificationsLocally(userId);
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      // Delete from database
      await supabase
        .from('car_notifications')
        .delete()
        .eq('id', notificationId);

      // Remove locally
      this.notifications = this.notifications.filter(n => n.id !== notificationId);
      this.notifyListeners();
      await this.saveNotificationsLocally(notificationId.split('_')[0]);
    } catch (error) {
      logger.error('Error deleting notification:', error);
    }
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  // Get all notifications
  getNotifications(): CarNotification[] {
    return [...this.notifications];
  }

  // Subscribe to notification changes
  subscribe(listener: (notifications: CarNotification[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify all listeners
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  // Save notifications to local storage
  private async saveNotificationsLocally(userId: string): Promise<void> {
    try {
      await webCompatibleStorage.setItem(
        `notifications_${userId}`,
        JSON.stringify(this.notifications)
      );
    } catch (error) {
      logger.error('Error saving notifications locally:', error);
    }
  }

  // Clean up expired notifications
  private async cleanupExpiredNotifications(): Promise<void> {
    const now = new Date();
    const validNotifications = this.notifications.filter(notification => {
      if (!notification.expiresAt) return true;
      return new Date(notification.expiresAt) > now;
    });

    if (validNotifications.length !== this.notifications.length) {
      this.notifications = validNotifications;
      this.notifyListeners();
    }
  }

  // Simulate dealer messages (for demo purposes)
  async simulateDealerMessage(
    userId: string,
    dealerName: string,
    carMake: string,
    carModel: string,
    message: string
  ): Promise<void> {
    await this.createNotification(
      userId,
      'dealer_message',
      `💬 Message from ${dealerName}`,
      `About ${carMake} ${carModel}: "${message}"`,
      {
        priority: 'medium',
        data: {
          dealerName,
          carMake,
          carModel,
          message,
        },
      }
    );
  }

  // Generate smart notifications based on user behavior
  async generateSmartNotifications(
    userId: string,
    userPreferences: CarUserPreferences,
    recentActivity: any[]
  ): Promise<void> {
    try {
      // Analyze user behavior and generate relevant notifications
      const viewedBrands = recentActivity
        .filter(activity => activity.type === 'view')
        .map(activity => activity.carBrand);

      const frequentBrand = this.getMostFrequent(viewedBrands);

      if (frequentBrand && !userPreferences.preferredBrands.includes(frequentBrand)) {
        await this.createNotification(
          userId,
          'new_listing',
          '🎯 We noticed you like ' + frequentBrand,
          `Would you like to add ${frequentBrand} to your preferred brands for better recommendations?`,
          {
            priority: 'low',
            data: { suggestedBrand: frequentBrand },
          }
        );
      }
    } catch (error) {
      logger.error('Error generating smart notifications:', error);
    }
  }

  private getMostFrequent<T>(array: T[]): T | null {
    if (array.length === 0) return null;
    
    const frequency: { [key: string]: number } = {};
    let maxCount = 0;
    let mostFrequent: T | null = null;

    array.forEach(item => {
      const key = String(item);
      frequency[key] = (frequency[key] || 0) + 1;
      if (frequency[key] > maxCount) {
        maxCount = frequency[key];
        mostFrequent = item;
      }
    });

    return mostFrequent;
  }
}

// Export singleton instance
export const carNotificationService = CarNotificationService.getInstance();
