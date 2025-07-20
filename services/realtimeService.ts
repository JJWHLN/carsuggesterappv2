import { supabase } from '@/lib/supabase';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { DatabaseVehicleListing, DatabaseReview } from '@/types/database';

export interface RealtimeSubscription {
  channel: RealtimeChannel;
  unsubscribe: () => void;
}

/**
 * Service for managing real-time subscriptions
 */
export class RealtimeService {
  private static subscriptions = new Map<string, RealtimeSubscription>();

  /**
   * Subscribe to new vehicle listings
   */
  static subscribeToVehicleListings(
    callback: (payload: RealtimePostgresChangesPayload<any>) => void
  ): RealtimeSubscription {
    const channelName = 'vehicle_listings_changes';
    
    // Unsubscribe existing if any
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_listings',
          filter: 'status=eq.active'
        },
        (payload) => {
          logger.debug('🔄 Vehicle listing change:', payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        logger.debug('📡 Vehicle listings subscription status:', status);
      });

    const subscription: RealtimeSubscription = {
      channel,
      unsubscribe: () => this.unsubscribe(channelName)
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  /**
   * Subscribe to new reviews
   */
  static subscribeToReviews(
    callback: (payload: RealtimePostgresChangesPayload<DatabaseReview>) => void
  ): RealtimeSubscription {
    const channelName = 'reviews_changes';
    
    // Unsubscribe existing if any
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews'
        },
        (payload) => {
          logger.debug('🔄 Review change:', payload);
          callback(payload as RealtimePostgresChangesPayload<DatabaseReview>);
        }
      )
      .subscribe((status) => {
        logger.debug('📡 Reviews subscription status:', status);
      });

    const subscription: RealtimeSubscription = {
      channel,
      unsubscribe: () => this.unsubscribe(channelName)
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  /**
   * Subscribe to user-specific bookmarks
   */
  static subscribeToUserBookmarks(
    userId: string,
    callback: (payload: RealtimePostgresChangesPayload<any>) => void
  ): RealtimeSubscription {
    const channelName = `bookmarks_${userId}`;
    
    // Unsubscribe existing if any
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          logger.debug('🔄 Bookmark change:', payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        logger.debug('📡 Bookmarks subscription status:', status);
      });

    const subscription: RealtimeSubscription = {
      channel,
      unsubscribe: () => this.unsubscribe(channelName)
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  /**
   * Subscribe to dealer's listings (for dealers to get real-time updates)
   */
  static subscribeToDealerListings(
    dealerId: string,
    callback: (payload: RealtimePostgresChangesPayload<DatabaseVehicleListing>) => void
  ): RealtimeSubscription {
    const channelName = `dealer_listings_${dealerId}`;
    
    // Unsubscribe existing if any
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vehicle_listings',
          filter: `dealer_id=eq.${dealerId}`
        },
        (payload) => {
          logger.debug('🔄 Dealer listing change:', payload);
          callback(payload as RealtimePostgresChangesPayload<DatabaseVehicleListing>);
        }
      )
      .subscribe((status) => {
        logger.debug('📡 Dealer listings subscription status:', status);
      });

    const subscription: RealtimeSubscription = {
      channel,
      unsubscribe: () => this.unsubscribe(channelName)
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  /**
   * Subscribe to admin activity feed
   */
  static subscribeToAdminActivity(
    callback: (payload: RealtimePostgresChangesPayload<any>) => void
  ): RealtimeSubscription {
    const channelName = 'admin_activity';
    
    // Unsubscribe existing if any
    this.unsubscribe(channelName);

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vehicle_listings'
        },
        (payload) => callback(payload)
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reviews'
        },
        (payload) => callback(payload)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => callback(payload)
      )
      .subscribe((status) => {
        logger.debug('📡 Admin activity subscription status:', status);
      });

    const subscription: RealtimeSubscription = {
      channel,
      unsubscribe: () => this.unsubscribe(channelName)
    };

    this.subscriptions.set(channelName, subscription);
    return subscription;
  }

  /**
   * Unsubscribe from a specific channel
   */
  static unsubscribe(channelName: string): void {
    const subscription = this.subscriptions.get(channelName);
    if (subscription) {
      subscription.channel.unsubscribe();
      this.subscriptions.delete(channelName);
      logger.debug(`🔌 Unsubscribed from ${channelName}`);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  static unsubscribeAll(): void {
    this.subscriptions.forEach((subscription, channelName) => {
      subscription.channel.unsubscribe();
      logger.debug(`🔌 Unsubscribed from ${channelName}`);
    });
    this.subscriptions.clear();
  }

  /**
   * Get connection status
   */
  static getConnectionStatus(): string {
    // Note: connection property may not be available in all Supabase versions
    return (supabase.realtime as any).connection?.connectionState || 'unknown';
  }

  /**
   * Reconnect realtime connection
   */
  static reconnect(): void {
    supabase.realtime.connect();
  }

  /**
   * Disconnect realtime connection
   */
  static disconnect(): void {
    this.unsubscribeAll();
    supabase.realtime.disconnect();
  }
}
