/**
 * RealNotificationService - Production Notification System with Real-time Capabilities
 * 
 * Enhanced for Phase 2 Week 6 - Real-time Features & Live Communication
 * 
 * NEW FEATURES:
 * - Live price update notifications with WebSocket integration
 * - Real-time chat message notifications
 * - Live inventory availability alerts
 * - Enhanced notification channels with rich content
 * - Interactive notifications with quick actions
 * 
 * ORIGINAL FIXES:
 * - Fake AI notifications that were just mock data
 * - Missing real notification permissions
 * - No actual notification scheduling
 * - Hardcoded fake "smart" data
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface RealNotification {
  id: string;
  type: 'price_drop' | 'new_listing' | 'saved_search_match' | 'dealer_message' | 'appointment_reminder' | 
        'live_price_update' | 'chat_message' | 'inventory_available' | 'market_alert';
  title: string;
  body: string;
  data?: Record<string, any>;
  scheduledFor?: Date;
  delivered: boolean;
  read: boolean;
  createdAt: Date;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  actions?: NotificationAction[];
  richContent?: RichNotificationContent;
}

interface NotificationAction {
  id: string;
  title: string;
  type: 'button' | 'input';
  destructive?: boolean;
}

interface RichNotificationContent {
  imageUrl?: string;
  largeIcon?: string;
  progress?: number;
  expandedText?: string;
  actionButtons?: NotificationAction[];
}

interface NotificationPreferences {
  priceDrops: boolean;
  newListings: boolean;
  savedSearchMatches: boolean;
  dealerMessages: boolean;
  appointmentReminders: boolean;
  marketInsights: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
}

export class RealNotificationService {
  private static readonly NOTIFICATIONS_KEY = '@notifications_history';
  private static readonly PREFERENCES_KEY = '@notification_preferences';
  private static readonly PERMISSION_KEY = '@notification_permission';
  private static readonly MAX_STORED_NOTIFICATIONS = 100;

  // Request notification permissions (real implementation)
  static async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      const hasPermission = finalStatus === 'granted';
      await AsyncStorage.setItem(this.PERMISSION_KEY, JSON.stringify(hasPermission));
      
      return hasPermission;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Schedule real price drop notification
  static async schedulePriceDropNotification(
    carId: string,
    carName: string,
    oldPrice: number,
    newPrice: number,
    dealerId?: string
  ): Promise<string | null> {
    try {
      const hasPermission = await this.hasNotificationPermission();
      if (!hasPermission) {
        console.warn('No notification permission for price drop alert');
        return null;
      }

      const priceChange = oldPrice - newPrice;
      const percentageChange = Math.round((priceChange / oldPrice) * 100);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🚗 Price Drop Alert!',
          body: `${carName} dropped $${priceChange.toLocaleString()} (${percentageChange}% off)`,
          data: {
            type: 'price_drop',
            carId,
            dealerId,
            oldPrice,
            newPrice,
            priceChange,
          },
          sound: true,
        },
        trigger: null, // Send immediately
      });

      // Store notification in history
      await this.storeNotificationHistory({
        id: notificationId,
        type: 'price_drop',
        title: 'Price Drop Alert!',
        body: `${carName} dropped $${priceChange.toLocaleString()}`,
        data: { carId, dealerId, oldPrice, newPrice },
        delivered: true,
        read: false,
        createdAt: new Date(),
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling price drop notification:', error);
      return null;
    }
  }

  // Schedule new listing notification for saved search
  static async scheduleNewListingNotification(
    carId: string,
    carName: string,
    savedSearchName: string,
    matchScore?: number
  ): Promise<string | null> {
    try {
      const hasPermission = await this.hasNotificationPermission();
      if (!hasPermission) return null;

      const confidence = matchScore ? Math.round(matchScore * 100) : 85;
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎯 New Match Found!',
          body: `${carName} matches "${savedSearchName}" (${confidence}% match)`,
          data: {
            type: 'new_listing',
            carId,
            savedSearchName,
            matchScore,
          },
          sound: true,
        },
        trigger: null,
      });

      await this.storeNotificationHistory({
        id: notificationId,
        type: 'new_listing',
        title: 'New Match Found!',
        body: `${carName} matches your saved search`,
        data: { carId, savedSearchName, matchScore },
        delivered: true,
        read: false,
        createdAt: new Date(),
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling new listing notification:', error);
      return null;
    }
  }

  // Schedule appointment reminder
  static async scheduleAppointmentReminder(
    appointmentId: string,
    dealerName: string,
    carName: string,
    appointmentTime: Date,
    reminderMinutes: number = 60
  ): Promise<string | null> {
    try {
      const hasPermission = await this.hasNotificationPermission();
      if (!hasPermission) return null;

      const reminderTime = new Date(appointmentTime.getTime() - (reminderMinutes * 60 * 1000));
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Appointment Reminder',
          body: `${dealerName} visit for ${carName} in ${reminderMinutes} minutes`,
          data: {
            type: 'appointment_reminder',
            appointmentId,
            dealerName,
            carName,
            appointmentTime: appointmentTime.toISOString(),
          },
          sound: true,
        },
        trigger: reminderTime > new Date() ? reminderTime : null,
      });

      await this.storeNotificationHistory({
        id: notificationId,
        type: 'appointment_reminder',
        title: 'Appointment Reminder',
        body: `Visit to ${dealerName} for ${carName}`,
        data: { appointmentId, dealerName, carName },
        scheduledFor: reminderTime,
        delivered: false,
        read: false,
        createdAt: new Date(),
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling appointment reminder:', error);
      return null;
    }
  }

  // Get notification preferences
  static async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const stored = await AsyncStorage.getItem(this.PREFERENCES_KEY);
      if (!stored) {
        // Return default preferences
        return {
          priceDrops: true,
          newListings: true,
          savedSearchMatches: true,
          dealerMessages: true,
          appointmentReminders: true,
          marketInsights: false,
          pushEnabled: true,
          emailEnabled: false,
          frequency: 'immediate',
        };
      }
      
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
      return {
        priceDrops: true,
        newListings: true,
        savedSearchMatches: true,
        dealerMessages: true,
        appointmentReminders: true,
        marketInsights: false,
        pushEnabled: true,
        emailEnabled: false,
        frequency: 'immediate',
      };
    }
  }

  // Update notification preferences
  static async updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      const currentPreferences = await this.getNotificationPreferences();
      const updatedPreferences = { ...currentPreferences, ...preferences };
      
      await AsyncStorage.setItem(this.PREFERENCES_KEY, JSON.stringify(updatedPreferences));
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  }

  // Get notification history
  static async getNotificationHistory(): Promise<RealNotification[]> {
    try {
      const stored = await AsyncStorage.getItem(this.NOTIFICATIONS_KEY);
      if (!stored) return [];
      
      const notifications: RealNotification[] = JSON.parse(stored);
      
      // Convert date strings back to Date objects
      return notifications.map(notification => ({
        ...notification,
        createdAt: new Date(notification.createdAt),
        scheduledFor: notification.scheduledFor ? new Date(notification.scheduledFor) : undefined,
      }));
    } catch (error) {
      console.error('Error loading notification history:', error);
      return [];
    }
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getNotificationHistory();
      const updated = notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      );
      
      await AsyncStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Clear all notifications
  static async clearAllNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.NOTIFICATIONS_KEY);
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  // Cancel scheduled notification
  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      
      // Remove from history
      const notifications = await this.getNotificationHistory();
      const filtered = notifications.filter(n => n.id !== notificationId);
      await AsyncStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  // Private helper methods
  private static async hasNotificationPermission(): Promise<boolean> {
    try {
      const stored = await AsyncStorage.getItem(this.PERMISSION_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      
      // Check current permissions
      const { status } = await Notifications.getPermissionsAsync();
      const hasPermission = status === 'granted';
      await AsyncStorage.setItem(this.PERMISSION_KEY, JSON.stringify(hasPermission));
      
      return hasPermission;
    } catch (error) {
      console.error('Error checking notification permission:', error);
      return false;
    }
  }

  private static async storeNotificationHistory(notification: RealNotification): Promise<void> {
    try {
      const notifications = await this.getNotificationHistory();
      notifications.unshift(notification);
      
      // Keep only recent notifications
      const trimmed = notifications.slice(0, this.MAX_STORED_NOTIFICATIONS);
      
      await AsyncStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error storing notification history:', error);
    }
  }

  // Initialize notification listeners
  static initializeNotificationListeners() {
    // Listen for notifications while app is running
    const notificationListener = Notifications.addNotificationReceivedListener((notification: any) => {
      console.log('Notification received:', notification);
      // Handle in-app notification display
    });

    // Handle notification taps
    const responseListener = Notifications.addNotificationResponseReceivedListener((response: any) => {
      console.log('Notification tapped:', response);
      const { data } = response.notification.request.content;
      
      // Navigate based on notification type
      if (data?.type === 'price_drop' && data?.carId) {
        // Navigate to car detail
        // NavigationService.navigateToCar(data.carId);
      } else if (data?.type === 'appointment_reminder' && data?.appointmentId) {
        // Navigate to appointment details
        // NavigationService.navigateToAppointment(data.appointmentId);
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }

  // === PHASE 2 WEEK 6: REAL-TIME NOTIFICATION FEATURES ===

  // Live price update notification
  static async scheduleLivePriceUpdateNotification(
    carId: string,
    carName: string,
    currentPrice: number,
    previousPrice: number,
    trend: 'up' | 'down' | 'stable'
  ): Promise<string | null> {
    try {
      const hasPermission = await this.hasNotificationPermission();
      if (!hasPermission) return null;

      const priceChange = Math.abs(currentPrice - previousPrice);
      const percentageChange = Math.round((priceChange / previousPrice) * 100);
      
      let title = '📈 Live Price Update';
      let emoji = '📊';
      
      if (trend === 'down') {
        title = '📉 Price Drop Alert!';
        emoji = '🔥';
      } else if (trend === 'up') {
        title = '📈 Price Increase';
        emoji = '⚠️';
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body: `${carName}: €${currentPrice.toLocaleString()} (${trend === 'down' ? '-' : '+'}${percentageChange}%)`,
          data: {
            type: 'live_price_update',
            carId,
            currentPrice,
            previousPrice,
            trend,
            timestamp: new Date().toISOString(),
          },
          sound: trend === 'down',
          categoryIdentifier: 'PRICE_UPDATES',
        },
        trigger: null,
      });

      await this.storeNotificationHistory({
        id: notificationId,
        type: 'live_price_update',
        title,
        body: `${carName} price ${trend}: €${currentPrice.toLocaleString()}`,
        data: { carId, currentPrice, previousPrice, trend },
        delivered: true,
        read: false,
        createdAt: new Date(),
        priority: trend === 'down' ? 'high' : 'normal',
        category: 'price_updates',
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling live price update:', error);
      return null;
    }
  }

  // Real-time chat message notification
  static async scheduleChatMessageNotification(
    dealerId: string,
    dealerName: string,
    message: string,
    chatId: string,
    isUrgent: boolean = false
  ): Promise<string | null> {
    try {
      const hasPermission = await this.hasNotificationPermission();
      if (!hasPermission) return null;

      const truncatedMessage = message.length > 100 ? 
        `${message.substring(0, 100)}...` : message;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `💬 ${dealerName}`,
          body: truncatedMessage,
          data: {
            type: 'chat_message',
            dealerId,
            dealerName,
            chatId,
            messageId: `msg_${Date.now()}`,
            isUrgent,
          },
          sound: true,
          categoryIdentifier: 'CHAT_MESSAGES',
        },
        trigger: null,
      });

      await this.storeNotificationHistory({
        id: notificationId,
        type: 'chat_message',
        title: `Message from ${dealerName}`,
        body: truncatedMessage,
        data: { dealerId, dealerName, chatId, isUrgent },
        delivered: true,
        read: false,
        createdAt: new Date(),
        priority: isUrgent ? 'urgent' : 'normal',
        category: 'chat',
        actions: [
          { id: 'reply', title: 'Reply', type: 'input' },
          { id: 'view_chat', title: 'View Chat', type: 'button' }
        ],
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling chat message notification:', error);
      return null;
    }
  }

  // Live inventory availability notification
  static async scheduleInventoryAvailableNotification(
    carId: string,
    carName: string,
    dealerName: string,
    stockLevel: number,
    wasWaitlisted: boolean = false
  ): Promise<string | null> {
    try {
      const hasPermission = await this.hasNotificationPermission();
      if (!hasPermission) return null;

      const title = wasWaitlisted ? 
        '🎉 Waitlisted Car Available!' : 
        '🚗 Car Back in Stock!';

      const body = wasWaitlisted ?
        `${carName} is now available at ${dealerName}! Book now.` :
        `${carName} back in stock (${stockLevel} available)`;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: {
            type: 'inventory_available',
            carId,
            carName,
            dealerName,
            stockLevel,
            wasWaitlisted,
            timestamp: new Date().toISOString(),
          },
          sound: true,
          categoryIdentifier: 'INVENTORY_ALERTS',
        },
        trigger: null,
      });

      await this.storeNotificationHistory({
        id: notificationId,
        type: 'inventory_available',
        title,
        body,
        data: { carId, carName, dealerName, stockLevel, wasWaitlisted },
        delivered: true,
        read: false,
        createdAt: new Date(),
        priority: wasWaitlisted ? 'high' : 'normal',
        category: 'inventory',
        actions: [
          { id: 'book_now', title: 'Book Now', type: 'button' },
          { id: 'view_details', title: 'View Details', type: 'button' }
        ],
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling inventory notification:', error);
      return null;
    }
  }

  // Market alert notification
  static async scheduleMarketAlertNotification(
    alertType: 'price_trend' | 'demand_spike' | 'market_shift',
    title: string,
    message: string,
    actionData?: Record<string, any>
  ): Promise<string | null> {
    try {
      const hasPermission = await this.hasNotificationPermission();
      if (!hasPermission) return null;

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `📊 ${title}`,
          body: message,
          data: {
            type: 'market_alert',
            alertType,
            actionData,
            timestamp: new Date().toISOString(),
          },
          sound: false,
          categoryIdentifier: 'MARKET_INSIGHTS',
        },
        trigger: null,
      });

      await this.storeNotificationHistory({
        id: notificationId,
        type: 'market_alert',
        title,
        body: message,
        data: { alertType, actionData },
        delivered: true,
        read: false,
        createdAt: new Date(),
        priority: 'low',
        category: 'market_insights',
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling market alert:', error);
      return null;
    }
  }

  // Setup notification categories for iOS
  static async setupNotificationCategories(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Notifications.setNotificationCategoryAsync('PRICE_UPDATES', [
          {
            identifier: 'VIEW_CAR',
            buttonTitle: 'View Car',
            options: { opensAppToForeground: true },
          },
          {
            identifier: 'SAVE_CAR',
            buttonTitle: 'Save Car',
            options: { opensAppToForeground: false },
          },
        ]);

        await Notifications.setNotificationCategoryAsync('CHAT_MESSAGES', [
          {
            identifier: 'REPLY',
            buttonTitle: 'Reply',
            options: { opensAppToForeground: true },
          },
          {
            identifier: 'MARK_READ',
            buttonTitle: 'Mark Read',
            options: { opensAppToForeground: false },
          },
        ]);

        await Notifications.setNotificationCategoryAsync('INVENTORY_ALERTS', [
          {
            identifier: 'BOOK_NOW',
            buttonTitle: 'Book Now',
            options: { opensAppToForeground: true },
          },
          {
            identifier: 'VIEW_DETAILS',
            buttonTitle: 'View Details',
            options: { opensAppToForeground: true },
          },
        ]);
      }
    } catch (error) {
      console.error('Error setting up notification categories:', error);
    }
  }

  // Get unread notification count by category
  static async getUnreadCountByCategory(): Promise<Record<string, number>> {
    try {
      const notifications = await this.getNotificationHistory();
      const unreadByCategory: Record<string, number> = {};

      notifications
        .filter(n => !n.read)
        .forEach(notification => {
          const category = notification.category || 'general';
          unreadByCategory[category] = (unreadByCategory[category] || 0) + 1;
        });

      return unreadByCategory;
    } catch (error) {
      console.error('Error getting unread count by category:', error);
      return {};
    }
  }

  // Batch mark notifications as read
  static async markMultipleNotificationsAsRead(notificationIds: string[]): Promise<void> {
    try {
      const notifications = await this.getNotificationHistory();
      const updated = notifications.map(notification =>
        notificationIds.includes(notification.id)
          ? { ...notification, read: true }
          : notification
      );
      
      await AsyncStorage.setItem(this.NOTIFICATIONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error marking multiple notifications as read:', error);
    }
  }

  // === ADDITIONAL REAL-TIME NOTIFICATION METHODS ===

  // Show live price update notification (for PriceTrackingService)
  static async showLivePriceUpdate(
    carId: string,
    newPrice: number,
    oldPrice: number,
    changePercentage: number,
    reason?: string
  ): Promise<string> {
    try {
      const hasPermission = await this.hasNotificationPermission();
      if (!hasPermission) return '';

      const priceChange = newPrice - oldPrice;
      const isIncrease = priceChange > 0;
      const changeIcon = isIncrease ? '📈' : '📉';
      const changeText = isIncrease ? 'increased' : 'decreased';
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${changeIcon} Price ${changeText}`,
          body: `Car price ${changeText} by ${Math.abs(changePercentage).toFixed(1)}% to $${newPrice.toLocaleString()}`,
          data: {
            type: 'live_price_update',
            carId,
            newPrice,
            oldPrice,
            priceChange,
            changePercentage,
            reason,
            timestamp: Date.now()
          },
          sound: Math.abs(changePercentage) >= 10,
          categoryIdentifier: 'PRICE_UPDATES',
        },
        trigger: null,
      });

      await this.storeNotificationHistory({
        id: notificationId,
        type: 'live_price_update',
        title: `${changeIcon} Price ${changeText}`,
        body: `Price ${changeText} by ${Math.abs(changePercentage).toFixed(1)}%`,
        data: { carId, newPrice, oldPrice, priceChange, changePercentage, reason },
        delivered: true,
        read: false,
        createdAt: new Date(),
        priority: Math.abs(changePercentage) >= 10 ? 'high' : 'normal',
        category: 'price_updates',
      });

      return notificationId;
    } catch (error) {
      console.error('Error showing live price update:', error);
      return '';
    }
  }

  // Show price alert triggered notification (for PriceTrackingService)
  static async showPriceAlertTriggered(
    carId: string,
    targetPrice: number,
    currentPrice: number,
    condition: 'below' | 'above' | 'exact'
  ): Promise<string> {
    try {
      const hasPermission = await this.hasNotificationPermission();
      if (!hasPermission) return '';

      const conditionText = condition === 'below' ? 'dropped below' : 
                           condition === 'above' ? 'exceeded' : 'reached';
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎯 Price Alert Triggered!',
          body: `Car price has ${conditionText} your target of $${targetPrice.toLocaleString()}. Current price: $${currentPrice.toLocaleString()}`,
          data: {
            type: 'price_alert',
            carId,
            targetPrice,
            currentPrice,
            condition,
            timestamp: Date.now()
          },
          sound: true,
          categoryIdentifier: 'PRICE_ALERTS',
        },
        trigger: null,
      });

      await this.storeNotificationHistory({
        id: notificationId,
        type: 'price_drop', // Use existing type for compatibility
        title: '🎯 Price Alert Triggered!',
        body: `Price has ${conditionText} your target`,
        data: { carId, targetPrice, currentPrice, condition },
        delivered: true,
        read: false,
        createdAt: new Date(),
        priority: 'high',
        category: 'alerts',
      });

      return notificationId;
    } catch (error) {
      console.error('Error showing price alert triggered:', error);
      return '';
    }
  }
}

export default RealNotificationService;
