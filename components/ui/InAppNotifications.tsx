/**
 * In-App Notifications Component
 *
 * Displays price alerts, lead updates, and other notifications
 * within the app interface.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';
import {
  Bell,
  Car,
  DollarSign,
  MessageCircle,
  Trash,
  CheckCircle,
} from '@/utils/ultra-optimized-icons';
import { notificationService } from '@/services/NotificationService';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { logger } from '@/utils/logger';

interface Notification {
  id: string;
  type: 'price_drop' | 'lead_update' | 'marketing';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export function InAppNotifications() {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const styles = getStyles(colors);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const [notifs, count] = await Promise.all([
        notificationService.getUserNotifications(user.id),
        notificationService.getUnreadCount(user.id),
      ]);

      setNotifications(notifs);
      setUnreadCount(count);
    } catch (error) {
      logger.error('Failed to load notifications', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  const handleNotificationPress = useCallback(
    async (notification: Notification) => {
      try {
        // Mark as read if unread
        if (!notification.isRead) {
          await notificationService.markNotificationAsRead(notification.id);
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notification.id ? { ...n, isRead: true } : n,
            ),
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }

        // Navigate based on notification data
        if (notification.data?.screen) {
          router.push({
            pathname: notification.data.screen,
            params: notification.data.params || {},
          });
        }
      } catch (error) {
        logger.error('Failed to handle notification press', error);
      }
    },
    [],
  );

  const handleDeleteNotification = useCallback(
    async (notificationId: string) => {
      Alert.alert(
        'Delete Notification',
        'Are you sure you want to delete this notification?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                // Remove from local state
                setNotifications((prev) =>
                  prev.filter((n) => n.id !== notificationId),
                );

                // Note: In a real app, you'd also delete from the database
                logger.info('Notification deleted', { notificationId });
              } catch (error) {
                logger.error('Failed to delete notification', error);
              }
            },
          },
        ],
      );
    },
    [],
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'price_drop':
        return <DollarSign color={colors.success} size={24} />;
      case 'lead_update':
        return <MessageCircle color={colors.primary} size={24} />;
      default:
        return <Bell color={colors.textSecondary} size={24} />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'price_drop':
        return colors.primaryLight;
      case 'lead_update':
        return colors.primaryLight;
      default:
        return colors.neutral100;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationCard,
        {
          backgroundColor: item.isRead
            ? colors.cardBackground
            : getNotificationColor(item.type),
        },
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <View style={styles.notificationLeft}>
            <View style={styles.iconContainer}>
              {getNotificationIcon(item.type)}
            </View>
            <View style={styles.notificationText}>
              <Text
                style={[
                  styles.notificationTitle,
                  { opacity: item.isRead ? 0.7 : 1 },
                ]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.notificationMessage,
                  { opacity: item.isRead ? 0.6 : 0.8 },
                ]}
              >
                {item.message}
              </Text>
              <Text style={styles.notificationTime}>
                {formatTimeAgo(item.createdAt)}
              </Text>
            </View>
          </View>

          <View style={styles.notificationActions}>
            {!item.isRead && <View style={styles.unreadDot} />}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteNotification(item.id)}
            >
              <Trash color={colors.textMuted} size={16} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyState}>
      <Bell color={colors.textMuted} size={48} />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyMessage}>
        You'll see price alerts, lead updates, and other important notifications
        here.
      </Text>
    </View>
  );

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Sign In Required</Text>
          <Text style={styles.emptyMessage}>
            Please sign in to view your notifications.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        contentContainerStyle={[
          styles.listContainer,
          notifications.length === 0 && styles.listContainerEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
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
    headerTitle: {
      ...Typography.title,
      color: colors.text,
    },
    unreadBadge: {
      backgroundColor: colors.error,
      borderRadius: 12,
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      minWidth: 24,
      alignItems: 'center',
    },
    unreadText: {
      ...Typography.caption,
      color: colors.white,
      fontWeight: '600',
    },
    listContainer: {
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    listContainerEmpty: {
      flex: 1,
      justifyContent: 'center',
    },
    notificationCard: {
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      ...Shadows.sm,
    },
    notificationContent: {
      flex: 1,
    },
    notificationHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    notificationLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: Spacing.md,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
      ...Shadows.sm,
    },
    notificationText: {
      flex: 1,
    },
    notificationTitle: {
      ...Typography.subtitle,
      color: colors.text,
      marginBottom: 4,
    },
    notificationMessage: {
      ...Typography.body,
      color: colors.textSecondary,
      marginBottom: Spacing.xs,
    },
    notificationTime: {
      ...Typography.caption,
      color: colors.textMuted,
    },
    notificationActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    deleteButton: {
      padding: Spacing.xs,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: Spacing.xl * 2,
    },
    emptyTitle: {
      ...Typography.title,
      color: colors.text,
      marginTop: Spacing.lg,
      marginBottom: Spacing.sm,
    },
    emptyMessage: {
      ...Typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      maxWidth: 280,
    },
  });
