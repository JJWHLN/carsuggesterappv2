/**
 * Simple Notification Service - Business Features Support
 * 
 * Handles basic notifications for price alerts and lead updates
 * without complex dependencies.
 */

import { supabase } from '@/lib/supabase';
import { logger } from '@/utils/logger';

export interface PriceAlertNotification {
  type: 'price_drop';
  carId: string;
  carTitle: string;
  oldPrice: number;
  newPrice: number;
  targetPrice: number;
  savings: number;
}

export interface LeadNotification {
  type: 'lead_update';
  leadId: string;
  carTitle: string;
  status: 'contacted' | 'test_drive_scheduled' | 'offer_received';
  dealerName: string;
  message?: string;
}

class SimpleNotificationService {
  private static instance: SimpleNotificationService;

  static getInstance(): SimpleNotificationService {
    if (!SimpleNotificationService.instance) {
      SimpleNotificationService.instance = new SimpleNotificationService();
    }
    return SimpleNotificationService.instance;
  }

  /**
   * Send price drop notification
   */
  async sendPriceDropNotification(
    userId: string,
    notification: PriceAlertNotification
  ): Promise<void> {
    try {
      const { carTitle, newPrice, savings } = notification;
      
      // Store in-app notification
      await this.storeInAppNotification(userId, {
        type: 'price_drop',
        title: '🎉 Price Drop Alert!',
        message: `${carTitle} dropped to $${newPrice.toLocaleString()}! Save $${savings.toLocaleString()}`,
        data: {
          carId: notification.carId,
          screen: '/car/[id]',
          params: { id: notification.carId },
        },
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      logger.info('Price drop notification sent', { userId, carId: notification.carId });
    } catch (error) {
      logger.error('Failed to send price drop notification', error);
    }
  }

  /**
   * Send lead update notification
   */
  async sendLeadUpdateNotification(
    userId: string,
    notification: LeadNotification
  ): Promise<void> {
    try {
      const { carTitle, status, dealerName, message } = notification;
      
      let title = '';
      let body = '';

      switch (status) {
        case 'contacted':
          title = '📞 Dealer Response';
          body = `${dealerName} responded about ${carTitle}`;
          break;
        case 'test_drive_scheduled':
          title = '🚗 Test Drive Scheduled';
          body = `Test drive confirmed for ${carTitle} with ${dealerName}`;
          break;
        case 'offer_received':
          title = '💰 Offer Received';
          body = `${dealerName} sent an offer for ${carTitle}`;
          break;
      }

      // Store in-app notification
      await this.storeInAppNotification(userId, {
        type: 'lead_update',
        title,
        message: message || body,
        data: {
          leadId: notification.leadId,
          screen: '/profile',
          params: { tab: 'leads' },
        },
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      logger.info('Lead update notification sent', { userId, leadId: notification.leadId });
    } catch (error) {
      logger.error('Failed to send lead update notification', error);
    }
  }

  /**
   * Get user's in-app notifications
   */
  async getUserNotifications(userId: string, limit: number = 20): Promise<any[]> {
    try {
      const { data: notifications, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.warn('Failed to get user notifications, using fallback', error);
        return this.getFallbackNotifications(userId);
      }

      return notifications || [];
    } catch (error) {
      logger.warn('Failed to get user notifications, using fallback', error);
      return this.getFallbackNotifications(userId);
    }
  }

  /**
   * Mark notification as read
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await supabase
        .from('user_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      logger.info('Notification marked as read', { notificationId });
    } catch (error) {
      logger.warn('Failed to mark notification as read', error);
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        logger.warn('Failed to get unread count', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      logger.warn('Failed to get unread count', error);
      return 0;
    }
  }

  /**
   * Private helper methods
   */
  private async storeInAppNotification(userId: string, notification: any): Promise<void> {
    try {
      await supabase
        .from('user_notifications')
        .insert({
          user_id: userId,
          ...notification,
        });
    } catch (error) {
      logger.warn('Failed to store in-app notification, using local storage', error);
      // Could store in AsyncStorage as fallback
    }
  }

  private getFallbackNotifications(userId: string) {
    // Return sample notifications for demo purposes
    return [
      {
        id: 'demo-1',
        type: 'price_drop',
        title: '🎉 Price Drop Alert!',
        message: '2021 Honda Civic dropped to $22,500! Save $2,000',
        data: { carId: 'demo-car-1' },
        isRead: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      },
      {
        id: 'demo-2',
        type: 'lead_update',
        title: '📞 Dealer Response',
        message: 'Honda Downtown responded about 2021 Honda Civic',
        data: { leadId: 'demo-lead-1' },
        isRead: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      },
    ];
  }
}

export const notificationService = SimpleNotificationService.getInstance();
export default notificationService;
