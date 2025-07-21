import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as Notifications from 'expo-notifications'; // TODO: Install expo-notifications
import { Car as CarType } from '@/types/database';
import { formatPrice } from '@/utils/dataTransformers';

// Mock notifications object for development
const Notifications = {
  setNotificationHandler: (handler: any) => {
    console.log('Notification handler set:', handler);
  },
  requestPermissionsAsync: async () => ({ status: 'granted' }),
  getPermissionsAsync: async () => ({ status: 'granted' }),
  setNotificationCategoryAsync: async (category: string, actions: any[]) => {
    console.log('Notification category set:', category, actions);
  },
  getExpoPushTokenAsync: async (config: any) => ({ data: 'mock-push-token' }),
  scheduleNotificationAsync: async (notification: any) => {
    console.log('Notification scheduled:', notification);
    
    // Show alert for development
    if (notification.content) {
      Alert.alert(
        notification.content.title || 'Notification',
        notification.content.body || 'You have a new notification',
        [{ text: 'OK' }]
      );
    }
    
    return 'mock-notification-id';
  },
  cancelScheduledNotificationAsync: async (id: string) => {
    console.log('Notification canceled:', id);
  },
};

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface NotificationPreferences {
  priceDropAlerts: boolean;
  newCarMatches: boolean;
  savedSearchAlerts: boolean;
  recommendationUpdates: boolean;
  systemAnnouncements: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  maxDailyNotifications: number;
  quietHoursStart: string; // HH:mm format
  quietHoursEnd: string; // HH:mm format
}

export interface PriceDropAlert {
  id: string;
  carId: string;
  userId: string;
  originalPrice: number;
  newPrice: number;
  carTitle: string;
  threshold: number; // Percentage drop threshold
  createdAt: string;
}

export interface SavedSearchAlert {
  id: string;
  userId: string;
  searchQuery: string;
  newCarsCount: number;
  cars: CarType[];
  createdAt: string;
}

export interface RecommendationUpdate {
  id: string;
  userId: string;
  reason: string;
  cars: CarType[];
  createdAt: string;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'promotion';
  targetUsers: string[] | 'all';
  expiresAt?: string;
  createdAt: string;
}

class NotificationService {
  private static instance: NotificationService;
  private notificationQueue: any[] = [];
  private isProcessing = false;
  private permissionStatus: string | null = null;

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize notification service
  async initialize(userId?: string): Promise<void> {
    try {
      await this.requestPermissions();
      await this.setupNotificationCategories();
      
      if (userId) {
        await this.registerForPushNotifications(userId);
      }
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  // Request notification permissions
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        const { status } = await Notifications.requestPermissionsAsync();
        this.permissionStatus = status;
        return status === 'granted';
      } else {
        const { status } = await Notifications.getPermissionsAsync();
        this.permissionStatus = status;
        
        if (status !== 'granted') {
          const { status: newStatus } = await Notifications.requestPermissionsAsync();
          this.permissionStatus = newStatus;
          return newStatus === 'granted';
        }
        return true;
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Setup notification categories for different types
  async setupNotificationCategories(): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync('PRICE_DROP', [
        {
          identifier: 'VIEW_CAR',
          buttonTitle: 'View Car',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'DISMISS',
          buttonTitle: 'Dismiss',
          options: { opensAppToForeground: false },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('NEW_MATCHES', [
        {
          identifier: 'VIEW_RESULTS',
          buttonTitle: 'View Results',
          options: { opensAppToForeground: true },
        },
        {
          identifier: 'UPDATE_SEARCH',
          buttonTitle: 'Update Search',
          options: { opensAppToForeground: true },
        },
      ]);

      await Notifications.setNotificationCategoryAsync('RECOMMENDATIONS', [
        {
          identifier: 'VIEW_RECOMMENDATIONS',
          buttonTitle: 'View',
          options: { opensAppToForeground: true },
        },
      ]);
    } catch (error) {
      console.error('Error setting up notification categories:', error);
    }
  }

  // Register for push notifications
  async registerForPushNotifications(userId: string): Promise<string | null> {
    try {
      if (!this.permissionStatus || this.permissionStatus !== 'granted') {
        const hasPermission = await this.requestPermissions();
        if (!hasPermission) {
          throw new Error('Notification permissions not granted');
        }
      }

      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your Expo project ID
      });

      // Store token for user
      await AsyncStorage.setItem(`pushToken_${userId}`, token.data);
      
      // TODO: Send token to your backend server
      console.log('Push token registered:', token.data);
      
      return token.data;
    } catch (error) {
      console.error('Error registering for push notifications:', error);
      return null;
    }
  }

  // Get user notification preferences
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const stored = await AsyncStorage.getItem(`notificationPrefs_${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }

      // Default preferences
      const defaultPrefs: NotificationPreferences = {
        priceDropAlerts: true,
        newCarMatches: true,
        savedSearchAlerts: true,
        recommendationUpdates: false,
        systemAnnouncements: true,
        emailNotifications: true,
        pushNotifications: true,
        maxDailyNotifications: 5,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
      };

      await this.updateNotificationPreferences(userId, defaultPrefs);
      return defaultPrefs;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      throw error;
    }
  }

  // Update user notification preferences
  async updateNotificationPreferences(
    userId: string, 
    preferences: NotificationPreferences
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `notificationPrefs_${userId}`, 
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // Check if notifications should be sent (quiet hours, daily limit)
  async shouldSendNotification(userId: string, type: string): Promise<boolean> {
    try {
      const preferences = await this.getNotificationPreferences(userId);
      
      // Check if notification type is enabled
      switch (type) {
        case 'PRICE_DROP':
          if (!preferences.priceDropAlerts || !preferences.pushNotifications) return false;
          break;
        case 'NEW_MATCHES':
          if (!preferences.newCarMatches || !preferences.pushNotifications) return false;
          break;
        case 'SAVED_SEARCH':
          if (!preferences.savedSearchAlerts || !preferences.pushNotifications) return false;
          break;
        case 'RECOMMENDATIONS':
          if (!preferences.recommendationUpdates || !preferences.pushNotifications) return false;
          break;
        case 'SYSTEM':
          if (!preferences.systemAnnouncements || !preferences.pushNotifications) return false;
          break;
        default:
          return false;
      }

      // Check quiet hours
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const quietStart = preferences.quietHoursStart;
      const quietEnd = preferences.quietHoursEnd;
      
      if (quietStart > quietEnd) {
        // Quiet hours span midnight
        if (currentTime >= quietStart || currentTime <= quietEnd) {
          return false;
        }
      } else {
        // Normal quiet hours
        if (currentTime >= quietStart && currentTime <= quietEnd) {
          return false;
        }
      }

      // Check daily notification limit
      const today = new Date().toDateString();
      const dailyCountKey = `dailyNotificationCount_${userId}_${today}`;
      const dailyCountStr = await AsyncStorage.getItem(dailyCountKey);
      const dailyCount = dailyCountStr ? parseInt(dailyCountStr) : 0;
      
      if (dailyCount >= preferences.maxDailyNotifications) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking if notification should be sent:', error);
      return false;
    }
  }

  // Increment daily notification count
  async incrementDailyNotificationCount(userId: string): Promise<void> {
    try {
      const today = new Date().toDateString();
      const dailyCountKey = `dailyNotificationCount_${userId}_${today}`;
      const dailyCountStr = await AsyncStorage.getItem(dailyCountKey);
      const dailyCount = dailyCountStr ? parseInt(dailyCountStr) : 0;
      
      await AsyncStorage.setItem(dailyCountKey, (dailyCount + 1).toString());
    } catch (error) {
      console.error('Error incrementing daily notification count:', error);
    }
  }

  // Send price drop alert
  async sendPriceDropAlert(alert: PriceDropAlert): Promise<void> {
    try {
      const canSend = await this.shouldSendNotification(alert.userId, 'PRICE_DROP');
      if (!canSend) return;

      const priceDrop = alert.originalPrice - alert.newPrice;
      const percentageDrop = ((priceDrop / alert.originalPrice) * 100).toFixed(0);

      const notification = {
        title: '🎉 Price Drop Alert!',
        body: `${alert.carTitle} dropped by ${formatPrice(priceDrop)} (${percentageDrop}%) - now ${formatPrice(alert.newPrice)}`,
        data: {
          type: 'PRICE_DROP',
          carId: alert.carId,
          alertId: alert.id,
        },
        categoryIdentifier: 'PRICE_DROP',
      };

      await this.scheduleNotification(notification);
      await this.incrementDailyNotificationCount(alert.userId);
      
      // Store alert history
      await this.storeNotificationHistory(alert.userId, notification);
    } catch (error) {
      console.error('Error sending price drop alert:', error);
    }
  }

  // Send new car matches notification
  async sendNewCarMatchesAlert(alert: SavedSearchAlert): Promise<void> {
    try {
      const canSend = await this.shouldSendNotification(alert.userId, 'NEW_MATCHES');
      if (!canSend) return;

      const notification = {
        title: '🚗 New Car Matches!',
        body: `${alert.newCarsCount} new cars match your search "${alert.searchQuery}"`,
        data: {
          type: 'NEW_MATCHES',
          searchQuery: alert.searchQuery,
          alertId: alert.id,
        },
        categoryIdentifier: 'NEW_MATCHES',
      };

      await this.scheduleNotification(notification);
      await this.incrementDailyNotificationCount(alert.userId);
      
      // Store alert history
      await this.storeNotificationHistory(alert.userId, notification);
    } catch (error) {
      console.error('Error sending new car matches alert:', error);
    }
  }

  // Send recommendation update
  async sendRecommendationUpdate(update: RecommendationUpdate): Promise<void> {
    try {
      const canSend = await this.shouldSendNotification(update.userId, 'RECOMMENDATIONS');
      if (!canSend) return;

      const notification = {
        title: '💡 New Recommendations',
        body: `We found ${update.cars.length} cars you might like based on ${update.reason}`,
        data: {
          type: 'RECOMMENDATIONS',
          updateId: update.id,
          reason: update.reason,
        },
        categoryIdentifier: 'RECOMMENDATIONS',
      };

      await this.scheduleNotification(notification);
      await this.incrementDailyNotificationCount(update.userId);
      
      // Store alert history
      await this.storeNotificationHistory(update.userId, notification);
    } catch (error) {
      console.error('Error sending recommendation update:', error);
    }
  }

  // Send system announcement
  async sendSystemAnnouncement(
    announcement: SystemAnnouncement, 
    userId: string
  ): Promise<void> {
    try {
      const canSend = await this.shouldSendNotification(userId, 'SYSTEM');
      if (!canSend) return;

      const icon = announcement.type === 'promotion' ? '🎉' : 
                   announcement.type === 'warning' ? '⚠️' : 
                   announcement.type === 'success' ? '✅' : 'ℹ️';

      const notification = {
        title: `${icon} ${announcement.title}`,
        body: announcement.message,
        data: {
          type: 'SYSTEM',
          announcementId: announcement.id,
          announcementType: announcement.type,
        },
      };

      await this.scheduleNotification(notification);
      await this.incrementDailyNotificationCount(userId);
      
      // Store alert history
      await this.storeNotificationHistory(userId, notification);
    } catch (error) {
      console.error('Error sending system announcement:', error);
    }
  }

  // Schedule a local notification
  async scheduleNotification(notification: any, delay: number = 0): Promise<string> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: notification,
        trigger: delay > 0 ? { seconds: delay } : null,
      });

      return identifier;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  }

  // Cancel a scheduled notification
  async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  // Get notification history for user
  async getNotificationHistory(
    userId: string, 
    limit: number = 50
  ): Promise<any[]> {
    try {
      const historyKey = `notificationHistory_${userId}`;
      const stored = await AsyncStorage.getItem(historyKey);
      
      if (!stored) return [];
      
      const history = JSON.parse(stored);
      return history.slice(0, limit);
    } catch (error) {
      console.error('Error getting notification history:', error);
      return [];
    }
  }

  // Store notification in history
  async storeNotificationHistory(userId: string, notification: any): Promise<void> {
    try {
      const historyKey = `notificationHistory_${userId}`;
      const stored = await AsyncStorage.getItem(historyKey);
      
      const history = stored ? JSON.parse(stored) : [];
      const historyItem = {
        ...notification,
        timestamp: new Date().toISOString(),
        read: false,
      };
      
      history.unshift(historyItem);
      
      // Keep only last 100 notifications
      const trimmedHistory = history.slice(0, 100);
      
      await AsyncStorage.setItem(historyKey, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error storing notification history:', error);
    }
  }

  // Mark notification as read
  async markNotificationAsRead(userId: string, timestamp: string): Promise<void> {
    try {
      const historyKey = `notificationHistory_${userId}`;
      const stored = await AsyncStorage.getItem(historyKey);
      
      if (!stored) return;
      
      const history = JSON.parse(stored);
      const updatedHistory = history.map((item: any) => 
        item.timestamp === timestamp ? { ...item, read: true } : item
      );
      
      await AsyncStorage.setItem(historyKey, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Clear all notifications for user
  async clearAllNotifications(userId: string): Promise<void> {
    try {
      const historyKey = `notificationHistory_${userId}`;
      await AsyncStorage.removeItem(historyKey);
      
      // Reset daily count
      const today = new Date().toDateString();
      const dailyCountKey = `dailyNotificationCount_${userId}_${today}`;
      await AsyncStorage.removeItem(dailyCountKey);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Get unread notification count
  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const history = await this.getNotificationHistory(userId);
      return history.filter(item => !item.read).length;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }

  // Setup price monitoring for a car
  async setupPriceMonitoring(
    userId: string, 
    carId: string, 
    currentPrice: number,
    threshold: number = 5 // 5% default threshold
  ): Promise<void> {
    try {
      const priceMonitorKey = `priceMonitor_${userId}`;
      const stored = await AsyncStorage.getItem(priceMonitorKey);
      
      const monitors = stored ? JSON.parse(stored) : [];
      
      // Remove existing monitor for this car
      const filteredMonitors = monitors.filter((m: any) => m.carId !== carId);
      
      // Add new monitor
      const newMonitor = {
        carId,
        userId,
        originalPrice: currentPrice,
        threshold,
        createdAt: new Date().toISOString(),
      };
      
      filteredMonitors.push(newMonitor);
      
      await AsyncStorage.setItem(priceMonitorKey, JSON.stringify(filteredMonitors));
    } catch (error) {
      console.error('Error setting up price monitoring:', error);
    }
  }

  // Remove price monitoring for a car
  async removePriceMonitoring(userId: string, carId: string): Promise<void> {
    try {
      const priceMonitorKey = `priceMonitor_${userId}`;
      const stored = await AsyncStorage.getItem(priceMonitorKey);
      
      if (!stored) return;
      
      const monitors = JSON.parse(stored);
      const filteredMonitors = monitors.filter((m: any) => m.carId !== carId);
      
      await AsyncStorage.setItem(priceMonitorKey, JSON.stringify(filteredMonitors));
    } catch (error) {
      console.error('Error removing price monitoring:', error);
    }
  }

  // Get active price monitors for user
  async getActivePriceMonitors(userId: string): Promise<any[]> {
    try {
      const priceMonitorKey = `priceMonitor_${userId}`;
      const stored = await AsyncStorage.getItem(priceMonitorKey);
      
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting active price monitors:', error);
      return [];
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
export default NotificationService;
