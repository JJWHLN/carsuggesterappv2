import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeIn,
  SlideInRight,
  Layout,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Star,
  Clock,
  MapPin,
  Car,
  Sparkles,
  Eye,
  Heart,
  MessageCircle as Bell,
  X,
  ArrowRight,
  Filter,
  Settings as SettingsIcon,
} from '@/utils/ultra-optimized-icons';
import { useThemeColors } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { BorderRadius, Spacing, Typography, Shadows } from '@/constants/Colors';
import { Car as CarType } from '@/types/database';

// Mock notification API for now (can be replaced with expo-notifications later)
const NotificationAPI = {
  requestPermissions: async () => ({ status: 'granted' }),
  scheduleNotification: async (notification: any) => {
    console.log('Would send notification:', notification);
  },
};

interface SmartNotification {
  id: string;
  type:
    | 'price_drop'
    | 'new_listing'
    | 'saved_search'
    | 'recommendation'
    | 'deal_alert'
    | 'market_insight';
  title: string;
  message: string;
  timestamp: Date;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  data?: {
    carId?: string;
    searchId?: string;
    priceChange?: number;
    originalPrice?: number;
    newPrice?: number;
    dealEndTime?: Date;
    confidence?: number;
  };
  icon: React.ComponentType<{ size: number; color: string }>;
  color: string;
  read: boolean;
  dismissed: boolean;
}

interface NotificationPreferences {
  priceDrops: boolean;
  priceDropThreshold: number; // Minimum $ amount
  newListings: boolean;
  savedSearchAlerts: boolean;
  recommendationUpdates: boolean;
  dealAlerts: boolean;
  marketInsights: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  frequency: 'instant' | 'daily' | 'weekly';
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string; // "08:00"
  };
}

interface SmartNotificationSystemProps {
  visible: boolean;
  onClose: () => void;
  onNotificationPress: (notification: SmartNotification) => void;
  onSettingsPress: () => void;
}

class SmartNotificationEngine {
  private static instance: SmartNotificationEngine;
  private notifications: SmartNotification[] = [];
  private preferences: NotificationPreferences = {
    priceDrops: true,
    priceDropThreshold: 1000,
    newListings: true,
    savedSearchAlerts: true,
    recommendationUpdates: true,
    dealAlerts: true,
    marketInsights: false,
    pushNotifications: true,
    emailNotifications: false,
    frequency: 'instant',
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '08:00',
    },
  };

  static getInstance(): SmartNotificationEngine {
    if (!SmartNotificationEngine.instance) {
      SmartNotificationEngine.instance = new SmartNotificationEngine();
    }
    return SmartNotificationEngine.instance;
  }

  async initialize() {
    // Load preferences
    try {
      const savedPrefs = await AsyncStorage.getItem('notification_preferences');
      if (savedPrefs) {
        this.preferences = { ...this.preferences, ...JSON.parse(savedPrefs) };
      }
    } catch (error) {
      console.warn('Failed to load notification preferences:', error);
    }

    // Request permissions
    if (this.preferences.pushNotifications) {
      await this.requestPermissions();
    }

    // Generate initial notifications (mock data)
    this.generateMockNotifications();

    // Start monitoring (in production, this would connect to real data sources)
    this.startMonitoring();
  }

  private async requestPermissions() {
    try {
      const result = await NotificationAPI.requestPermissions();
      if (result.status !== 'granted') {
        console.warn('Push notification permissions not granted');
      }
    } catch (error) {
      console.warn('Failed to request notification permissions:', error);
    }
  }

  private generateMockNotifications() {
    const mockNotifications: SmartNotification[] = [
      {
        id: '1',
        type: 'price_drop',
        title: 'Price Drop Alert!',
        message: '2023 Tesla Model 3 dropped $2,500 - Now $42,500',
        timestamp: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
        priority: 'high',
        actionable: true,
        data: {
          carId: 'tesla-model-3-123',
          priceChange: -2500,
          originalPrice: 45000,
          newPrice: 42500,
        },
        icon: DollarSign,
        color: '#EF4444',
        read: false,
        dismissed: false,
      },
      {
        id: '2',
        type: 'new_listing',
        title: 'New Match Found!',
        message: 'Honda CR-V matches your saved search criteria',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        priority: 'medium',
        actionable: true,
        data: {
          carId: 'honda-crv-456',
          searchId: 'saved-search-1',
          confidence: 0.85,
        },
        icon: Car,
        color: '#10B981',
        read: false,
        dismissed: false,
      },
      {
        id: '3',
        type: 'deal_alert',
        title: 'Limited Time Deal!',
        message: 'BMW 3 Series - Special financing 2.9% APR',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        priority: 'high',
        actionable: true,
        data: {
          carId: 'bmw-3series-789',
          dealEndTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
        },
        icon: Sparkles,
        color: '#F59E0B',
        read: true,
        dismissed: false,
      },
      {
        id: '4',
        type: 'recommendation',
        title: 'New AI Recommendation',
        message: 'We found 3 new cars perfect for your needs',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        priority: 'medium',
        actionable: true,
        data: {
          confidence: 0.92,
        },
        icon: Sparkles,
        color: '#8B5CF6',
        read: true,
        dismissed: false,
      },
      {
        id: '5',
        type: 'market_insight',
        title: 'Market Trend Alert',
        message: 'SUV prices trending down 3% this month',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        priority: 'low',
        actionable: false,
        icon: TrendingUp,
        color: '#3B82F6',
        read: true,
        dismissed: false,
      },
    ];

    this.notifications = mockNotifications;
  }

  private startMonitoring() {
    // In production, this would set up real-time monitoring of:
    // - Price changes from data sources
    // - New listings matching user criteria
    // - Market trends and insights
    // - Deal expirations

    console.log('Smart notification monitoring started');
  }

  async createNotification(
    notification: Omit<
      SmartNotification,
      'id' | 'timestamp' | 'read' | 'dismissed'
    >,
  ) {
    const newNotification: SmartNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false,
      dismissed: false,
    };

    this.notifications.unshift(newNotification);

    // Send push notification if enabled and not in quiet hours
    if (this.preferences.pushNotifications && this.shouldSendNow()) {
      await this.sendPushNotification(newNotification);
    }

    return newNotification;
  }

  private shouldSendNow(): boolean {
    if (!this.preferences.quietHours.enabled) return true;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const { start, end } = this.preferences.quietHours;

    // Simple time comparison (doesn't handle midnight crossover)
    return currentTime < start || currentTime > end;
  }

  private async sendPushNotification(notification: SmartNotification) {
    try {
      await NotificationAPI.scheduleNotification({
        title: notification.title,
        body: notification.message,
        data: notification.data,
        type: notification.type,
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  }

  getNotifications(): SmartNotification[] {
    return this.notifications.filter((n) => !n.dismissed);
  }

  getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read && !n.dismissed).length;
  }

  markAsRead(notificationId: string) {
    const notification = this.notifications.find(
      (n) => n.id === notificationId,
    );
    if (notification) {
      notification.read = true;
    }
  }

  markAllAsRead() {
    this.notifications.forEach((n) => (n.read = true));
  }

  dismissNotification(notificationId: string) {
    const notification = this.notifications.find(
      (n) => n.id === notificationId,
    );
    if (notification) {
      notification.dismissed = true;
    }
  }

  async updatePreferences(newPreferences: Partial<NotificationPreferences>) {
    this.preferences = { ...this.preferences, ...newPreferences };

    try {
      await AsyncStorage.setItem(
        'notification_preferences',
        JSON.stringify(this.preferences),
      );
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
    }
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }
}

export const SmartNotificationSystem: React.FC<
  SmartNotificationSystemProps
> = ({ visible, onClose, onNotificationPress, onSettingsPress }) => {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const styles = getThemedStyles(colors);

  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [engine] = useState(() => SmartNotificationEngine.getInstance());

  useEffect(() => {
    engine.initialize();
    loadNotifications();
  }, [engine]);

  const loadNotifications = useCallback(() => {
    const notifs = engine.getNotifications();
    const unread = engine.getUnreadCount();

    setNotifications(notifs);
    setUnreadCount(unread);
  }, [engine]);

  const handleNotificationPress = useCallback(
    async (notification: SmartNotification) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      engine.markAsRead(notification.id);
      loadNotifications();
      onNotificationPress(notification);
    },
    [engine, loadNotifications, onNotificationPress],
  );

  const handleDismiss = useCallback(
    async (notificationId: string) => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      engine.dismissNotification(notificationId);
      loadNotifications();
    },
    [engine, loadNotifications],
  );

  const handleMarkAllRead = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    engine.markAllAsRead();
    loadNotifications();
  }, [engine, loadNotifications]);

  const getTimeAgo = (timestamp: Date): string => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const renderNotification = ({
    item,
    index,
  }: {
    item: SmartNotification;
    index: number;
  }) => {
    const Icon = item.icon;

    return (
      <Animated.View
        entering={FadeIn.delay(index * 50).springify()}
        layout={Layout.springify()}
        style={styles.notificationContainer}
      >
        <TouchableOpacity
          style={[
            styles.notification,
            !item.read && styles.notificationUnread,
            {
              backgroundColor: item.read
                ? colors.cardBackground
                : colors.cardBackground + 'CC',
            },
          ]}
          onPress={() => handleNotificationPress(item)}
          activeOpacity={0.7}
        >
          {/* Priority Indicator */}
          {item.priority === 'high' && (
            <View
              style={[
                styles.priorityIndicator,
                { backgroundColor: item.color },
              ]}
            />
          )}

          {/* Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: item.color + '20' },
            ]}
          >
            <Icon size={20} color={item.color} />
          </View>

          {/* Content */}
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text
                style={[styles.notificationTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.notificationTime,
                  { color: colors.textSecondary },
                ]}
              >
                {getTimeAgo(item.timestamp)}
              </Text>
            </View>

            <Text
              style={[
                styles.notificationMessage,
                { color: colors.textSecondary },
              ]}
              numberOfLines={2}
            >
              {item.message}
            </Text>

            {/* Action indicators */}
            {item.actionable && (
              <View style={styles.actionIndicator}>
                <ArrowRight size={14} color={colors.primary} />
                <Text style={[styles.actionText, { color: colors.primary }]}>
                  Tap to view
                </Text>
              </View>
            )}

            {/* Deal countdown */}
            {item.type === 'deal_alert' && item.data?.dealEndTime && (
              <View style={styles.countdownContainer}>
                <Clock size={12} color={colors.textSecondary} />
                <Text
                  style={[
                    styles.countdownText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Expires in 2 days
                </Text>
              </View>
            )}
          </View>

          {/* Dismiss button */}
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={() => handleDismiss(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Unread indicator */}
          {!item.read && (
            <View style={[styles.unreadDot, { backgroundColor: item.color }]} />
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Bell size={24} color={colors.text} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Smart Notifications
          </Text>
          {unreadCount > 0 && (
            <View
              style={[styles.unreadBadge, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.unreadBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              style={styles.markAllButton}
            >
              <Text style={[styles.markAllText, { color: colors.primary }]}>
                Mark all read
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onSettingsPress}
            style={styles.settingsButton}
          >
            <SettingsIcon size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        style={styles.notificationsList}
        contentContainerStyle={styles.notificationsContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Bell size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No notifications yet
            </Text>
            <Text
              style={[styles.emptyMessage, { color: colors.textSecondary }]}
            >
              We'll notify you about price drops, new matches, and deals
            </Text>
          </View>
        }
      />
    </View>
  );
};

const getThemedStyles = (colors: any) => {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flex: 1,
    },
    headerTitle: {
      ...Typography.sectionTitle,
      fontWeight: '700',
    },
    unreadBadge: {
      minWidth: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Spacing.xs,
    },
    unreadBadgeText: {
      ...Typography.caption,
      color: colors.white,
      fontWeight: '600',
      fontSize: 10,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    markAllButton: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
    },
    markAllText: {
      ...Typography.caption,
      fontWeight: '600',
    },
    settingsButton: {
      padding: Spacing.sm,
    },
    closeButton: {
      padding: Spacing.sm,
    },
    notificationsList: {
      flex: 1,
    },
    notificationsContent: {
      paddingVertical: Spacing.sm,
    },
    notificationContainer: {
      marginHorizontal: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    notification: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      position: 'relative',
      ...Shadows.sm,
    },
    notificationUnread: {
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    priorityIndicator: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 4,
      borderTopLeftRadius: BorderRadius.lg,
      borderBottomLeftRadius: BorderRadius.lg,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: Spacing.sm,
    },
    notificationContent: {
      flex: 1,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.xs,
    },
    notificationTitle: {
      ...Typography.bodyText,
      fontWeight: '600',
      flex: 1,
      marginRight: Spacing.sm,
    },
    notificationTime: {
      ...Typography.caption,
      fontWeight: '500',
    },
    notificationMessage: {
      ...Typography.caption,
      lineHeight: 18,
      marginBottom: Spacing.xs,
    },
    actionIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: Spacing.xs,
    },
    actionText: {
      ...Typography.caption,
      fontWeight: '600',
    },
    countdownContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: Spacing.xs,
    },
    countdownText: {
      ...Typography.caption,
      fontWeight: '500',
    },
    dismissButton: {
      padding: Spacing.xs,
      marginLeft: Spacing.sm,
    },
    unreadDot: {
      position: 'absolute',
      top: Spacing.md,
      right: Spacing.md,
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.xxl,
      paddingHorizontal: Spacing.lg,
    },
    emptyTitle: {
      ...Typography.sectionTitle,
      fontWeight: '600',
      textAlign: 'center',
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    emptyMessage: {
      ...Typography.bodyText,
      textAlign: 'center',
      lineHeight: 24,
    },
  });
};
