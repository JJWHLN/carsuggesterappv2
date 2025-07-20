/**
 * Real-time State Hooks for React Components
 * 
 * Phase 2 Week 6 - Real-time Features & Live Communication
 * 
 * Features:
 * - React hooks for real-time state management
 * - Automatic re-rendering on state changes
 * - Live data subscriptions
 * - Optimized performance with selective updates
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { getRealTimeStateManager, StateUpdate, StateConflict } from '../services/realtime/RealTimeStateManager';

// Hook for using real-time state
export function useRealTimeState<T = any>(
  path: string,
  defaultValue?: T
): [T, (value: T) => void, { loading: boolean; error: string | null }] {
  const [state, setState] = useState<T>(defaultValue as T);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const stateManager = getRealTimeStateManager();
  const subscriptionIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Get initial value
    const initialValue = stateManager.getState(path);
    if (initialValue !== undefined) {
      setState(initialValue);
    }
    setLoading(false);

    // Subscribe to changes
    subscriptionIdRef.current = stateManager.subscribe(
      path,
      (newValue: T) => {
        setState(newValue);
        setError(null);
      },
      false // Don't call immediately since we already got the value
    );

    // Cleanup subscription
    return () => {
      if (subscriptionIdRef.current) {
        stateManager.unsubscribe(subscriptionIdRef.current);
      }
    };
  }, [path]);

  const updateState = useCallback((newValue: T) => {
    try {
      stateManager.setState(path, newValue);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [path]);

  return [state, updateState, { loading, error }];
}

// Hook for live price tracking
export function useLivePrice(carId: string): {
  price: number | null;
  priceHistory: Array<{ price: number; timestamp: number }>;
  change24h: number;
  isTracking: boolean;
  startTracking: () => void;
  stopTracking: () => void;
} {
  const [price, setPrice] = useRealTimeState<number>(`prices.${carId}.current`);
  const [priceHistory, setPriceHistory] = useRealTimeState<Array<{ price: number; timestamp: number }>>(
    `prices.${carId}.history`,
    []
  );
  const [isTracking, setIsTracking] = useRealTimeState<boolean>(`prices.${carId}.tracking`, false);

  const change24h = priceHistory.length >= 2 
    ? ((price || 0) - (priceHistory[priceHistory.length - 2]?.price || 0))
    : 0;

  const startTracking = useCallback(() => {
    setIsTracking(true);
  }, [setIsTracking]);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
  }, [setIsTracking]);

  return {
    price,
    priceHistory,
    change24h,
    isTracking,
    startTracking,
    stopTracking
  };
}

// Hook for live chat state
export function useLiveChat(chatId: string): {
  messages: any[];
  typingUsers: string[];
  isConnected: boolean;
  sendMessage: (message: string) => void;
  startTyping: () => void;
  stopTyping: () => void;
} {
  const [messages, setMessages] = useRealTimeState<any[]>(`chats.${chatId}.messages`, []);
  const [typingUsers, setTypingUsers] = useRealTimeState<string[]>(`chats.${chatId}.typing`, []);
  const [isConnected, setIsConnected] = useRealTimeState<boolean>(`chats.${chatId}.connected`, false);
  const stateManager = getRealTimeStateManager();

  const sendMessage = useCallback((message: string) => {
    const newMessage = {
      id: `msg_${Date.now()}`,
      text: message,
      timestamp: Date.now(),
      sender: 'user'
    };
    
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
  }, [messages, setMessages]);

  const startTyping = useCallback(() => {
    const currentTyping = typingUsers.filter(u => u !== 'user');
    setTypingUsers([...currentTyping, 'user']);
  }, [typingUsers, setTypingUsers]);

  const stopTyping = useCallback(() => {
    const currentTyping = typingUsers.filter(u => u !== 'user');
    setTypingUsers(currentTyping);
  }, [typingUsers, setTypingUsers]);

  return {
    messages,
    typingUsers,
    isConnected,
    sendMessage,
    startTyping,
    stopTyping
  };
}

// Hook for live inventory tracking
export function useLiveInventory(filters?: {
  make?: string;
  model?: string;
  location?: string;
}): {
  cars: any[];
  totalCount: number;
  newArrivals: any[];
  priceDrops: any[];
  refreshing: boolean;
  refresh: () => void;
} {
  const filterKey = filters ? JSON.stringify(filters) : 'all';
  const [cars, setCars] = useRealTimeState<any[]>(`inventory.${filterKey}.cars`, []);
  const [totalCount, setTotalCount] = useRealTimeState<number>(`inventory.${filterKey}.total`, 0);
  const [newArrivals, setNewArrivals] = useRealTimeState<any[]>(`inventory.new_arrivals`, []);
  const [priceDrops, setPriceDrops] = useRealTimeState<any[]>(`inventory.price_drops`, []);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    // Trigger a refresh by updating a timestamp
    const stateManager = getRealTimeStateManager();
    stateManager.setState(`inventory.${filterKey}.last_refresh`, Date.now());
    setRefreshing(false);
  }, [filterKey]);

  return {
    cars,
    totalCount,
    newArrivals,
    priceDrops,
    refreshing,
    refresh
  };
}

// Hook for watching multiple paths with pattern
export function useRealTimePattern(
  pattern: RegExp,
  callback: (path: string, value: any) => void
): void {
  const stateManager = getRealTimeStateManager();
  const watchIdRef = useRef<string | null>(null);

  useEffect(() => {
    watchIdRef.current = stateManager.watchPattern(pattern, callback);

    return () => {
      // Note: watchPattern doesn't return a cleanup function in our implementation
      // This would need to be enhanced to support unsubscribing from patterns
    };
  }, [pattern, callback]);
}

// Hook for conflict resolution
export function useStateConflictResolver(
  resolver: (conflict: StateConflict) => Promise<StateUpdate>
): void {
  const stateManager = getRealTimeStateManager();

  useEffect(() => {
    stateManager.setConflictResolver(resolver);

    // Cleanup - reset to default resolver
    return () => {
      stateManager.setConflictResolver(async (conflict: StateConflict) => {
        // Default resolution: use remote value
        return conflict.remoteUpdate;
      });
    };
  }, [resolver]);
}

// Hook for batch state updates
export function useBatchStateUpdate(): (updates: Array<{ path: string; value: any }>) => void {
  const stateManager = getRealTimeStateManager();

  return useCallback((updates: Array<{ path: string; value: any }>) => {
    stateManager.batchUpdate(updates);
  }, [stateManager]);
}

// Hook for connection status
export function useRealTimeConnection(): {
  isConnected: boolean;
  isReconnecting: boolean;
  lastConnected: number | null;
  pendingUpdates: number;
} {
  const [isConnected, setIsConnected] = useRealTimeState<boolean>('connection.status', false);
  const [isReconnecting, setIsReconnecting] = useRealTimeState<boolean>('connection.reconnecting', false);
  const [lastConnected, setLastConnected] = useRealTimeState<number | null>('connection.last_connected', null);
  const [pendingUpdates, setPendingUpdates] = useRealTimeState<number>('connection.pending_updates', 0);

  return {
    isConnected,
    isReconnecting,
    lastConnected,
    pendingUpdates
  };
}

// Hook for live market data
export function useLiveMarketData(
  make?: string,
  model?: string
): {
  trends: any[];
  insights: any[];
  alerts: any[];
  averagePrice: number | null;
  demandLevel: 'low' | 'medium' | 'high' | null;
} {
  const filterKey = [make, model].filter(Boolean).join('_');
  const [trends, setTrends] = useRealTimeState<any[]>(`market.${filterKey}.trends`, []);
  const [insights, setInsights] = useRealTimeState<any[]>(`market.${filterKey}.insights`, []);
  const [alerts, setAlerts] = useRealTimeState<any[]>(`market.${filterKey}.alerts`, []);
  const [averagePrice, setAveragePrice] = useRealTimeState<number | null>(`market.${filterKey}.avg_price`, null);
  const [demandLevel, setDemandLevel] = useRealTimeState<'low' | 'medium' | 'high' | null>(`market.${filterKey}.demand`, null);

  return {
    trends,
    insights,
    alerts,
    averagePrice,
    demandLevel
  };
}

// Hook for persistent state that survives app restarts
export function usePersistentRealTimeState<T = any>(
  path: string,
  defaultValue?: T
): [T, (value: T) => void] {
  const [state, setState, { loading, error }] = useRealTimeState<T>(path, defaultValue);

  // State is automatically persisted by the RealTimeStateManager
  // This hook is just a semantic wrapper for clarity
  return [state, setState];
}

// Hook for optimistic updates
export function useOptimisticRealTimeState<T = any>(
  path: string,
  defaultValue?: T
): [T, (value: T, rollback?: () => void) => Promise<void>] {
  const [state, setState] = useRealTimeState<T>(path, defaultValue);
  const stateManager = getRealTimeStateManager();

  const setOptimisticState = useCallback(async (value: T, rollback?: () => void) => {
    const originalValue = state;
    
    // Apply optimistic update immediately
    setState(value);

    try {
      // Wait for confirmation (this is a simplified example)
      // In a real implementation, you'd wait for server confirmation
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      // Rollback on error
      if (rollback) {
        rollback();
      } else {
        setState(originalValue);
      }
      throw error;
    }
  }, [state, setState]);

  return [state, setOptimisticState];
}

export default {
  useRealTimeState,
  useLivePrice,
  useLiveChat,
  useLiveInventory,
  useRealTimePattern,
  useStateConflictResolver,
  useBatchStateUpdate,
  useRealTimeConnection,
  useLiveMarketData,
  usePersistentRealTimeState,
  useOptimisticRealTimeState
};
