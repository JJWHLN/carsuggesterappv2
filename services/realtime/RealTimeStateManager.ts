/**
 * Real-time State Manager for Live Data Synchronization
 * 
 * Phase 2 Week 6 - Real-time Features & Live Communication
 * 
 * Features:
 * - Real-time state synchronization across components
 * - Live data broadcasting and subscription
 * - Conflict resolution for concurrent updates
 * - Offline state management
 * - Event-driven architecture
 */

import { EventEmitter } from 'events';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppWebSocketManager from './WebSocketManager';

export interface StateUpdate {
  id: string;
  type: string;
  path: string;
  value: any;
  previousValue?: any;
  timestamp: number;
  userId?: string;
  source: 'local' | 'remote' | 'sync';
  version: number;
}

export interface StateSubscription {
  id: string;
  path: string;
  callback: (value: any, update: StateUpdate) => void;
  immediate?: boolean;
}

export interface StateConflict {
  path: string;
  localUpdate: StateUpdate;
  remoteUpdate: StateUpdate;
  resolution?: 'local' | 'remote' | 'merge' | 'manual';
}

export class RealTimeStateManager extends EventEmitter {
  private ws: any;
  private state: Map<string, any> = new Map();
  private subscriptions: Map<string, StateSubscription[]> = new Map();
  private pendingUpdates: Map<string, StateUpdate> = new Map();
  private conflictResolver: ((conflict: StateConflict) => Promise<StateUpdate>) | null = null;
  private isOnline = true;
  private syncTimer?: NodeJS.Timeout;
  
  private static readonly STATE_CACHE_KEY = '@realtime_state_cache';
  private static readonly PENDING_UPDATES_KEY = '@pending_state_updates';
  private static readonly SYNC_INTERVAL = 5000; // 5 seconds

  constructor() {
    super();
    this.initializeWebSocket();
    this.loadCachedState();
    this.startSyncTimer();
  }

  // Initialize WebSocket for real-time state sync
  private initializeWebSocket(): void {
    this.ws = AppWebSocketManager.getInstance();
    
    // Listen for state updates from server
    this.ws.on('state_update', this.handleRemoteStateUpdate.bind(this));
    this.ws.on('state_sync', this.handleStateSync.bind(this));
    this.ws.on('state_conflict', this.handleStateConflict.bind(this));
    
    // Listen for connection state changes
    this.ws.on('stateChange', (newState: string) => {
      this.isOnline = newState === 'connected';
      
      if (this.isOnline) {
        this.syncPendingUpdates();
      }
    });
  }

  // Set state value with real-time synchronization
  setState(path: string, value: any, source: 'local' | 'remote' | 'sync' = 'local'): StateUpdate {
    const previousValue = this.state.get(path);
    const update: StateUpdate = {
      id: this.generateUpdateId(),
      type: 'update',
      path,
      value,
      previousValue,
      timestamp: Date.now(),
      source,
      version: this.getNextVersion(path)
    };

    // Update local state
    this.state.set(path, value);

    // Notify subscribers
    this.notifySubscribers(path, value, update);

    // Broadcast to other clients if local update
    if (source === 'local') {
      this.broadcastUpdate(update);
    }

    // Cache state
    this.cacheState();

    this.emit('stateChanged', update);
    return update;
  }

  // Get state value
  getState(path: string): any {
    return this.state.get(path);
  }

  // Get all state
  getAllState(): Record<string, any> {
    return Object.fromEntries(this.state.entries());
  }

  // Subscribe to state changes
  subscribe(
    path: string,
    callback: (value: any, update: StateUpdate) => void,
    immediate = true
  ): string {
    const subscription: StateSubscription = {
      id: this.generateSubscriptionId(),
      path,
      callback,
      immediate
    };

    // Add to subscriptions
    const pathSubscriptions = this.subscriptions.get(path) || [];
    pathSubscriptions.push(subscription);
    this.subscriptions.set(path, pathSubscriptions);

    // Call immediately with current value if requested
    if (immediate && this.state.has(path)) {
      const currentValue = this.state.get(path);
      callback(currentValue, {
        id: 'initial',
        type: 'initial',
        path,
        value: currentValue,
        timestamp: Date.now(),
        source: 'local',
        version: 0
      });
    }

    return subscription.id;
  }

  // Unsubscribe from state changes
  unsubscribe(subscriptionId: string): void {
    for (const [path, pathSubscriptions] of this.subscriptions.entries()) {
      const filtered = pathSubscriptions.filter(sub => sub.id !== subscriptionId);
      if (filtered.length !== pathSubscriptions.length) {
        this.subscriptions.set(path, filtered);
        break;
      }
    }
  }

  // Batch state updates
  batchUpdate(updates: { path: string; value: any }[]): StateUpdate[] {
    const batchUpdates: StateUpdate[] = [];

    updates.forEach(({ path, value }) => {
      const update = this.setState(path, value, 'local');
      batchUpdates.push(update);
    });

    // Broadcast as batch
    this.broadcastBatchUpdate(batchUpdates);

    return batchUpdates;
  }

  // Watch multiple paths with pattern matching
  watchPattern(
    pattern: RegExp,
    callback: (path: string, value: any, update: StateUpdate) => void
  ): string {
    const watchId = this.generateSubscriptionId();
    
    // Subscribe to all existing paths that match
    for (const [path] of this.state.entries()) {
      if (pattern.test(path)) {
        this.subscribe(path, (value, update) => {
          callback(path, value, update);
        });
      }
    }

    // Listen for new paths that match
    this.on('stateChanged', (update: StateUpdate) => {
      if (pattern.test(update.path)) {
        callback(update.path, update.value, update);
      }
    });

    return watchId;
  }

  // Merge states (for conflict resolution)
  mergeState(localUpdate: StateUpdate, remoteUpdate: StateUpdate): any {
    // Default merge strategy - prefer newer timestamp
    if (localUpdate.timestamp > remoteUpdate.timestamp) {
      return localUpdate.value;
    } else if (remoteUpdate.timestamp > localUpdate.timestamp) {
      return remoteUpdate.value;
    }

    // If timestamps are equal, try to merge if both are objects
    if (
      typeof localUpdate.value === 'object' &&
      typeof remoteUpdate.value === 'object' &&
      localUpdate.value !== null &&
      remoteUpdate.value !== null
    ) {
      return { ...localUpdate.value, ...remoteUpdate.value };
    }

    // Default to remote value
    return remoteUpdate.value;
  }

  // Set custom conflict resolver
  setConflictResolver(
    resolver: (conflict: StateConflict) => Promise<StateUpdate>
  ): void {
    this.conflictResolver = resolver;
  }

  // Clear all state
  clearState(): void {
    this.state.clear();
    this.pendingUpdates.clear();
    this.cacheState();
    this.emit('stateCleared');
  }

  // Export state as JSON
  exportState(): string {
    return JSON.stringify(Object.fromEntries(this.state.entries()));
  }

  // Import state from JSON
  importState(stateJson: string): void {
    try {
      const imported = JSON.parse(stateJson);
      
      Object.entries(imported).forEach(([path, value]) => {
        this.setState(path, value, 'local');
      });
    } catch (error) {
      console.error('Error importing state:', error);
    }
  }

  // WebSocket event handlers
  private handleRemoteStateUpdate(update: StateUpdate): void {
    // Check for conflicts
    const pendingUpdate = this.pendingUpdates.get(update.path);
    
    if (pendingUpdate && pendingUpdate.timestamp > update.timestamp) {
      // We have a newer local update, create conflict
      const conflict: StateConflict = {
        path: update.path,
        localUpdate: pendingUpdate,
        remoteUpdate: update
      };
      
      this.handleStateConflict(conflict);
      return;
    }

    // No conflict, apply remote update
    this.setState(update.path, update.value, 'remote');
    
    // Remove from pending if exists
    this.pendingUpdates.delete(update.path);
  }

  private async handleStateConflict(conflict: StateConflict): Promise<void> {
    try {
      let resolvedUpdate: StateUpdate;

      if (this.conflictResolver) {
        // Use custom resolver
        resolvedUpdate = await this.conflictResolver(conflict);
      } else {
        // Use default merge strategy
        const mergedValue = this.mergeState(conflict.localUpdate, conflict.remoteUpdate);
        
        resolvedUpdate = {
          ...conflict.remoteUpdate,
          value: mergedValue,
          source: 'sync'
        };
      }

      // Apply resolved update
      this.setState(conflict.path, resolvedUpdate.value, 'sync');
      
      // Broadcast resolution
      this.broadcastUpdate(resolvedUpdate);
      
      this.emit('conflictResolved', conflict, resolvedUpdate);
    } catch (error) {
      console.error('Error resolving state conflict:', error);
      
      // Fallback to remote value
      this.setState(conflict.path, conflict.remoteUpdate.value, 'remote');
    }
  }

  private handleStateSync(data: { states: Record<string, any>; timestamp: number }): void {
    // Sync all states from server
    Object.entries(data.states).forEach(([path, value]) => {
      this.setState(path, value, 'remote');
    });

    this.emit('stateSynced', data);
  }

  // Broadcast update to other clients
  private broadcastUpdate(update: StateUpdate): void {
    if (this.isOnline) {
      this.ws.send({
        type: 'state_update',
        payload: update
      });
    } else {
      // Queue for later
      this.pendingUpdates.set(update.path, update);
      this.cachePendingUpdates();
    }
  }

  // Broadcast batch updates
  private broadcastBatchUpdate(updates: StateUpdate[]): void {
    if (this.isOnline) {
      this.ws.send({
        type: 'state_batch_update',
        payload: { updates }
      });
    } else {
      // Queue all updates
      updates.forEach(update => {
        this.pendingUpdates.set(update.path, update);
      });
      this.cachePendingUpdates();
    }
  }

  // Notify subscribers of state changes
  private notifySubscribers(path: string, value: any, update: StateUpdate): void {
    const pathSubscriptions = this.subscriptions.get(path) || [];
    
    pathSubscriptions.forEach(subscription => {
      try {
        subscription.callback(value, update);
      } catch (error) {
        console.error('Error in state subscription callback:', error);
      }
    });
  }

  // Sync pending updates when coming online
  private async syncPendingUpdates(): Promise<void> {
    if (this.pendingUpdates.size === 0) return;

    const updates = Array.from(this.pendingUpdates.values());
    
    try {
      // Send all pending updates
      this.ws.send({
        type: 'state_sync_pending',
        payload: { updates }
      });

      // Clear pending updates after successful sync
      this.pendingUpdates.clear();
      this.cachePendingUpdates();
      
      this.emit('pendingUpdatesSynced', updates);
    } catch (error) {
      console.error('Error syncing pending updates:', error);
    }
  }

  // Start periodic sync timer
  private startSyncTimer(): void {
    this.syncTimer = setInterval(() => {
      if (this.isOnline && this.pendingUpdates.size > 0) {
        this.syncPendingUpdates();
      }
    }, RealTimeStateManager.SYNC_INTERVAL);
  }

  // Cache management
  private async cacheState(): Promise<void> {
    try {
      const stateData = Object.fromEntries(this.state.entries());
      await AsyncStorage.setItem(
        RealTimeStateManager.STATE_CACHE_KEY,
        JSON.stringify(stateData)
      );
    } catch (error) {
      console.error('Error caching state:', error);
    }
  }

  private async loadCachedState(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(RealTimeStateManager.STATE_CACHE_KEY);
      if (cached) {
        const stateData = JSON.parse(cached);
        Object.entries(stateData).forEach(([path, value]) => {
          this.state.set(path, value);
        });
      }

      // Load pending updates
      const pendingCached = await AsyncStorage.getItem(RealTimeStateManager.PENDING_UPDATES_KEY);
      if (pendingCached) {
        const pendingData = JSON.parse(pendingCached);
        Object.entries(pendingData).forEach(([path, update]) => {
          this.pendingUpdates.set(path, update as StateUpdate);
        });
      }
    } catch (error) {
      console.error('Error loading cached state:', error);
    }
  }

  private async cachePendingUpdates(): Promise<void> {
    try {
      const pendingData = Object.fromEntries(this.pendingUpdates.entries());
      await AsyncStorage.setItem(
        RealTimeStateManager.PENDING_UPDATES_KEY,
        JSON.stringify(pendingData)
      );
    } catch (error) {
      console.error('Error caching pending updates:', error);
    }
  }

  // Utility functions
  private generateUpdateId(): string {
    return `update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getNextVersion(path: string): number {
    // Simple version counter - in production, this could be more sophisticated
    const currentState = this.state.get(path);
    return currentState ? (currentState._version || 0) + 1 : 1;
  }

  // Cleanup
  destroy(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.removeAllListeners();
    this.state.clear();
    this.subscriptions.clear();
    this.pendingUpdates.clear();
  }
}

// Singleton instance for app-wide state management
let stateManagerInstance: RealTimeStateManager | null = null;

export const getRealTimeStateManager = (): RealTimeStateManager => {
  if (!stateManagerInstance) {
    stateManagerInstance = new RealTimeStateManager();
  }
  return stateManagerInstance;
};

export const destroyRealTimeStateManager = (): void => {
  if (stateManagerInstance) {
    stateManagerInstance.destroy();
    stateManagerInstance = null;
  }
};

export default RealTimeStateManager;
