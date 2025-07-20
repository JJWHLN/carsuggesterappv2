/**
 * Offline-First Data Manager
 * 
 * Phase 2 Week 8 - Performance Optimization & Advanced Features
 * 
 * Features:
 * - Offline data storage and synchronization
 * - Conflict resolution algorithms
 * - Delta synchronization
 * - Background sync scheduling
 * - Data compression and optimization
 * - Offline-first operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../../lib/supabase';

export interface OfflineEntity {
  id: string;
  table: string;
  data: Record<string, any>;
  localId?: string;
  version: number;
  lastModified: number;
  syncStatus: 'pending' | 'synced' | 'failed' | 'conflict';
  operation: 'create' | 'update' | 'delete';
  metadata?: Record<string, any>;
}

export interface SyncConflict {
  id: string;
  entityId: string;
  table: string;
  localData: Record<string, any>;
  serverData: Record<string, any>;
  localVersion: number;
  serverVersion: number;
  conflictFields: string[];
  resolution?: ConflictResolution;
  timestamp: number;
}

export interface ConflictResolution {
  strategy: 'local_wins' | 'server_wins' | 'merge' | 'manual';
  mergedData?: Record<string, any>;
  resolvedBy?: string;
  resolvedAt: number;
}

export interface SyncStats {
  totalEntities: number;
  pendingSync: number;
  conflicts: number;
  lastSync: number;
  syncDuration: number;
  dataSize: number;
  compressionRatio: number;
  networkUsage: number;
}

export interface OfflineQuery {
  table: string;
  filters?: Record<string, any>;
  sorting?: { field: string; direction: 'asc' | 'desc' }[];
  limit?: number;
  offset?: number;
  includeDeleted?: boolean;
}

export interface SyncConfiguration {
  tables: string[];
  batchSize: number;
  retryAttempts: number;
  retryDelay: number;
  conflictResolution: 'auto' | 'manual';
  enableCompression: boolean;
  syncInterval: number; // minutes
  deltaSync: boolean;
  backgroundSync: boolean;
}

export interface DeltaSyncPoint {
  table: string;
  lastSyncTimestamp: number;
  lastSyncVersion: number;
  checksum: string;
}

export class OfflineDataManager {
  private static instance: OfflineDataManager | null = null;
  private readonly STORAGE_PREFIX = '@offline_data_';
  private readonly SYNC_QUEUE_KEY = '@sync_queue';
  private readonly CONFLICT_KEY = '@sync_conflicts';
  private readonly DELTA_SYNC_KEY = '@delta_sync_points';
  
  private syncQueue: OfflineEntity[] = [];
  private conflicts: SyncConflict[] = [];
  private deltaSyncPoints: Map<string, DeltaSyncPoint> = new Map();
  private isOnline: boolean = false;
  private isSyncing: boolean = false;
  private syncInterval?: NodeJS.Timeout;
  
  private readonly defaultConfig: SyncConfiguration = {
    tables: ['cars', 'reviews', 'favorites', 'searches'],
    batchSize: 50,
    retryAttempts: 3,
    retryDelay: 5000,
    conflictResolution: 'auto',
    enableCompression: true,
    syncInterval: 15, // 15 minutes
    deltaSync: true,
    backgroundSync: true
  };
  
  private config: SyncConfiguration = { ...this.defaultConfig };

  private constructor() {
    this.initialize();
  }

  static getInstance(): OfflineDataManager {
    if (!OfflineDataManager.instance) {
      OfflineDataManager.instance = new OfflineDataManager();
    }
    return OfflineDataManager.instance;
  }

  // Initialize offline data manager
  async initialize(): Promise<void> {
    try {
      // Load existing data
      await this.loadSyncQueue();
      await this.loadConflicts();
      await this.loadDeltaSyncPoints();
      
      // Set up network monitoring
      await this.setupNetworkMonitoring();
      
      // Start background sync if enabled
      if (this.config.backgroundSync) {
        this.startBackgroundSync();
      }
      
      console.log('Offline Data Manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Offline Data Manager:', error);
    }
  }

  // Configure sync settings
  configure(config: Partial<SyncConfiguration>): void {
    this.config = { ...this.config, ...config };
    
    // Restart background sync with new configuration
    if (this.config.backgroundSync) {
      this.stopBackgroundSync();
      this.startBackgroundSync();
    }
  }

  // Create or update entity offline
  async createOrUpdate(
    table: string, 
    data: Record<string, any>, 
    operation: 'create' | 'update' = 'create'
  ): Promise<string> {
    try {
      const entityId = data.id || this.generateLocalId();
      const localId = operation === 'create' ? entityId : undefined;
      
      const entity: OfflineEntity = {
        id: entityId,
        table,
        data: { ...data, id: entityId },
        localId,
        version: 1,
        lastModified: Date.now(),
        syncStatus: 'pending',
        operation,
        metadata: {
          createdOffline: !this.isOnline,
          originalOperation: operation
        }
      };
      
      // Store locally
      await this.storeEntity(entity);
      
      // Add to sync queue
      this.addToSyncQueue(entity);
      
      // Try immediate sync if online
      if (this.isOnline) {
        this.triggerSync();
      }
      
      console.log(`Entity ${entityId} stored offline for table ${table}`);
      return entityId;
    } catch (error) {
      console.error('Error creating/updating entity offline:', error);
      throw error;
    }
  }

  // Delete entity offline
  async delete(table: string, id: string): Promise<void> {
    try {
      const entity: OfflineEntity = {
        id,
        table,
        data: { id },
        version: 1,
        lastModified: Date.now(),
        syncStatus: 'pending',
        operation: 'delete',
        metadata: {
          deletedOffline: !this.isOnline
        }
      };
      
      // Mark as deleted locally
      await this.markAsDeleted(table, id);
      
      // Add to sync queue
      this.addToSyncQueue(entity);
      
      // Try immediate sync if online
      if (this.isOnline) {
        this.triggerSync();
      }
      
      console.log(`Entity ${id} marked for deletion in table ${table}`);
    } catch (error) {
      console.error('Error deleting entity offline:', error);
      throw error;
    }
  }

  // Query offline data
  async query(query: OfflineQuery): Promise<Record<string, any>[]> {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${query.table}`;
      const stored = await AsyncStorage.getItem(storageKey);
      
      if (!stored) {
        return [];
      }
      
      let entities: OfflineEntity[] = JSON.parse(stored);
      
      // Filter out deleted entities unless explicitly requested
      if (!query.includeDeleted) {
        entities = entities.filter(e => e.operation !== 'delete');
      }
      
      // Apply filters
      if (query.filters) {
        entities = this.applyFilters(entities, query.filters);
      }
      
      // Apply sorting
      if (query.sorting) {
        entities = this.applySorting(entities, query.sorting);
      }
      
      // Apply pagination
      if (query.offset) {
        entities = entities.slice(query.offset);
      }
      
      if (query.limit) {
        entities = entities.slice(0, query.limit);
      }
      
      return entities.map(e => e.data);
    } catch (error) {
      console.error('Error querying offline data:', error);
      return [];
    }
  }

  // Get entity by ID
  async getById(table: string, id: string): Promise<Record<string, any> | null> {
    try {
      const results = await this.query({
        table,
        filters: { id },
        limit: 1
      });
      
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error getting entity by ID:', error);
      return null;
    }
  }

  // Manual sync trigger
  async sync(tables?: string[]): Promise<SyncStats> {
    if (this.isSyncing) {
      console.log('Sync already in progress');
      return this.getSyncStats();
    }
    
    if (!this.isOnline) {
      console.log('Cannot sync while offline');
      return this.getSyncStats();
    }
    
    this.isSyncing = true;
    const startTime = Date.now();
    
    try {
      console.log('Starting manual sync...');
      
      const tablesToSync = tables || this.config.tables;
      
      // Step 1: Download changes from server
      await this.downloadChanges(tablesToSync);
      
      // Step 2: Resolve conflicts
      await this.resolveConflicts();
      
      // Step 3: Upload local changes
      await this.uploadChanges();
      
      // Step 4: Update delta sync points
      await this.updateDeltaSyncPoints(tablesToSync);
      
      const syncDuration = Date.now() - startTime;
      console.log(`Sync completed in ${syncDuration}ms`);
      
      return this.getSyncStats();
    } catch (error) {
      console.error('Error during sync:', error);
      throw error;
    } finally {
      this.isSyncing = false;
    }
  }

  // Get sync statistics
  getSyncStats(): SyncStats {
    const totalEntities = this.syncQueue.length;
    const pendingSync = this.syncQueue.filter(e => e.syncStatus === 'pending').length;
    const conflicts = this.conflicts.length;
    
    return {
      totalEntities,
      pendingSync,
      conflicts,
      lastSync: this.getLastSyncTime(),
      syncDuration: 0,
      dataSize: this.calculateDataSize(),
      compressionRatio: 0.7, // Mock compression ratio
      networkUsage: 0
    };
  }

  // Get pending conflicts
  getConflicts(): SyncConflict[] {
    return [...this.conflicts];
  }

  // Resolve conflict manually
  async resolveConflict(conflictId: string, resolution: ConflictResolution): Promise<void> {
    try {
      const conflictIndex = this.conflicts.findIndex(c => c.id === conflictId);
      if (conflictIndex === -1) {
        throw new Error(`Conflict ${conflictId} not found`);
      }
      
      const conflict = this.conflicts[conflictIndex];
      conflict.resolution = resolution;
      
      // Apply resolution
      await this.applyConflictResolution(conflict);
      
      // Remove from conflicts
      this.conflicts.splice(conflictIndex, 1);
      await this.saveConflicts();
      
      console.log(`Conflict ${conflictId} resolved`);
    } catch (error) {
      console.error('Error resolving conflict:', error);
      throw error;
    }
  }

  // Clear all offline data
  async clearOfflineData(): Promise<void> {
    try {
      // Clear all table data
      for (const table of this.config.tables) {
        await AsyncStorage.removeItem(`${this.STORAGE_PREFIX}${table}`);
      }
      
      // Clear sync data
      await AsyncStorage.removeItem(this.SYNC_QUEUE_KEY);
      await AsyncStorage.removeItem(this.CONFLICT_KEY);
      await AsyncStorage.removeItem(this.DELTA_SYNC_KEY);
      
      // Reset in-memory data
      this.syncQueue = [];
      this.conflicts = [];
      this.deltaSyncPoints.clear();
      
      console.log('All offline data cleared');
    } catch (error) {
      console.error('Error clearing offline data:', error);
      throw error;
    }
  }

  // Export offline data
  async exportData(format: 'json' | 'csv' = 'json'): Promise<string> {
    try {
      const data: Record<string, any> = {};
      
      for (const table of this.config.tables) {
        data[table] = await this.query({ table });
      }
      
      data.syncQueue = this.syncQueue;
      data.conflicts = this.conflicts;
      data.deltaSyncPoints = Array.from(this.deltaSyncPoints.entries());
      
      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      } else {
        return this.convertToCSV(data);
      }
    } catch (error) {
      console.error('Error exporting offline data:', error);
      return '';
    }
  }

  // Private methods

  private async setupNetworkMonitoring(): Promise<void> {
    try {
      // Get initial network state
      const netInfo = await NetInfo.fetch();
      this.isOnline = netInfo.isConnected || false;
      
      // Listen for network changes
      NetInfo.addEventListener(state => {
        const wasOnline = this.isOnline;
        this.isOnline = state.isConnected || false;
        
        if (!wasOnline && this.isOnline) {
          console.log('Device came online, triggering sync...');
          this.triggerSync();
        }
      });
    } catch (error) {
      console.error('Error setting up network monitoring:', error);
    }
  }

  private startBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
    
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.sync().catch(error => {
          console.error('Background sync failed:', error);
        });
      }
    }, this.config.syncInterval * 60 * 1000);
    
    console.log(`Background sync started (interval: ${this.config.syncInterval} minutes)`);
  }

  private stopBackgroundSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = undefined;
      console.log('Background sync stopped');
    }
  }

  private async storeEntity(entity: OfflineEntity): Promise<void> {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${entity.table}`;
      const stored = await AsyncStorage.getItem(storageKey);
      const entities: OfflineEntity[] = stored ? JSON.parse(stored) : [];
      
      // Update or add entity
      const existingIndex = entities.findIndex(e => e.id === entity.id);
      if (existingIndex >= 0) {
        entities[existingIndex] = entity;
      } else {
        entities.push(entity);
      }
      
      await AsyncStorage.setItem(storageKey, JSON.stringify(entities));
    } catch (error) {
      console.error('Error storing entity:', error);
      throw error;
    }
  }

  private addToSyncQueue(entity: OfflineEntity): void {
    // Remove existing entry for same entity
    this.syncQueue = this.syncQueue.filter(e => 
      !(e.table === entity.table && e.id === entity.id)
    );
    
    // Add new entry
    this.syncQueue.push(entity);
    
    // Save sync queue
    this.saveSyncQueue();
  }

  private async markAsDeleted(table: string, id: string): Promise<void> {
    try {
      const storageKey = `${this.STORAGE_PREFIX}${table}`;
      const stored = await AsyncStorage.getItem(storageKey);
      const entities: OfflineEntity[] = stored ? JSON.parse(stored) : [];
      
      // Mark entity as deleted
      const entityIndex = entities.findIndex(e => e.id === id);
      if (entityIndex >= 0) {
        entities[entityIndex].operation = 'delete';
        entities[entityIndex].lastModified = Date.now();
        entities[entityIndex].syncStatus = 'pending';
        
        await AsyncStorage.setItem(storageKey, JSON.stringify(entities));
      }
    } catch (error) {
      console.error('Error marking entity as deleted:', error);
      throw error;
    }
  }

  private applyFilters(entities: OfflineEntity[], filters: Record<string, any>): OfflineEntity[] {
    return entities.filter(entity => {
      return Object.entries(filters).every(([key, value]) => {
        if (Array.isArray(value)) {
          return value.includes(entity.data[key]);
        }
        return entity.data[key] === value;
      });
    });
  }

  private applySorting(
    entities: OfflineEntity[], 
    sorting: { field: string; direction: 'asc' | 'desc' }[]
  ): OfflineEntity[] {
    return entities.sort((a, b) => {
      for (const sort of sorting) {
        const aVal = a.data[sort.field];
        const bVal = b.data[sort.field];
        
        if (aVal === bVal) continue;
        
        const comparison = aVal < bVal ? -1 : 1;
        return sort.direction === 'asc' ? comparison : -comparison;
      }
      return 0;
    });
  }

  private async downloadChanges(tables: string[]): Promise<void> {
    for (const table of tables) {
      try {
        const deltaPoint = this.deltaSyncPoints.get(table);
        const lastSync = deltaPoint?.lastSyncTimestamp || 0;
        
        // Download changes since last sync
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .gt('updated_at', new Date(lastSync).toISOString());
        
        if (error) {
          console.error(`Error downloading changes for ${table}:`, error);
          continue;
        }
        
        // Process downloaded data
        if (data && data.length > 0) {
          await this.processDownloadedData(table, data);
        }
      } catch (error) {
        console.error(`Error downloading changes for ${table}:`, error);
      }
    }
  }

  private async processDownloadedData(table: string, data: any[]): Promise<void> {
    for (const item of data) {
      const localEntity = await this.getById(table, item.id);
      
      if (localEntity && this.hasLocalChanges(table, item.id)) {
        // Potential conflict
        await this.createConflict(table, item, localEntity);
      } else {
        // Safe to update
        const entity: OfflineEntity = {
          id: item.id,
          table,
          data: item,
          version: 1,
          lastModified: Date.now(),
          syncStatus: 'synced',
          operation: localEntity ? 'update' : 'create'
        };
        
        await this.storeEntity(entity);
      }
    }
  }

  private async uploadChanges(): Promise<void> {
    const pendingEntities = this.syncQueue.filter(e => e.syncStatus === 'pending');
    
    for (const entity of pendingEntities) {
      try {
        await this.uploadEntity(entity);
      } catch (error) {
        console.error(`Error uploading entity ${entity.id}:`, error);
        entity.syncStatus = 'failed';
      }
    }
    
    await this.saveSyncQueue();
  }

  private async uploadEntity(entity: OfflineEntity): Promise<void> {
    try {
      let result;
      
      switch (entity.operation) {
        case 'create':
          result = await supabase
            .from(entity.table)
            .insert(entity.data);
          break;
          
        case 'update':
          result = await supabase
            .from(entity.table)
            .update(entity.data)
            .eq('id', entity.id);
          break;
          
        case 'delete':
          result = await supabase
            .from(entity.table)
            .delete()
            .eq('id', entity.id);
          break;
      }
      
      if (result.error) {
        throw result.error;
      }
      
      entity.syncStatus = 'synced';
      console.log(`Entity ${entity.id} uploaded successfully`);
    } catch (error) {
      entity.syncStatus = 'failed';
      throw error;
    }
  }

  private async resolveConflicts(): Promise<void> {
    if (this.config.conflictResolution === 'auto') {
      for (const conflict of this.conflicts) {
        // Auto-resolve using last-write-wins
        const resolution: ConflictResolution = {
          strategy: 'server_wins', // Conservative approach
          resolvedBy: 'system',
          resolvedAt: Date.now()
        };
        
        await this.applyConflictResolution({ ...conflict, resolution });
      }
      
      this.conflicts = [];
      await this.saveConflicts();
    }
  }

  private async createConflict(table: string, serverData: any, localData: any): Promise<void> {
    const conflict: SyncConflict = {
      id: this.generateConflictId(),
      entityId: serverData.id,
      table,
      localData,
      serverData,
      localVersion: 1,
      serverVersion: 1,
      conflictFields: this.findConflictFields(localData, serverData),
      timestamp: Date.now()
    };
    
    this.conflicts.push(conflict);
    await this.saveConflicts();
    
    console.log(`Conflict created for entity ${serverData.id} in table ${table}`);
  }

  private async applyConflictResolution(conflict: SyncConflict): Promise<void> {
    if (!conflict.resolution) return;
    
    let finalData;
    
    switch (conflict.resolution.strategy) {
      case 'local_wins':
        finalData = conflict.localData;
        break;
      case 'server_wins':
        finalData = conflict.serverData;
        break;
      case 'merge':
        finalData = conflict.resolution.mergedData || conflict.serverData;
        break;
      default:
        finalData = conflict.serverData;
    }
    
    // Update local storage
    const entity: OfflineEntity = {
      id: conflict.entityId,
      table: conflict.table,
      data: finalData,
      version: 1,
      lastModified: Date.now(),
      syncStatus: 'synced',
      operation: 'update'
    };
    
    await this.storeEntity(entity);
  }

  private findConflictFields(localData: any, serverData: any): string[] {
    const conflicts: string[] = [];
    
    for (const key in localData) {
      if (localData[key] !== serverData[key]) {
        conflicts.push(key);
      }
    }
    
    return conflicts;
  }

  private hasLocalChanges(table: string, id: string): boolean {
    return this.syncQueue.some(e => 
      e.table === table && e.id === id && e.syncStatus === 'pending'
    );
  }

  private async updateDeltaSyncPoints(tables: string[]): Promise<void> {
    for (const table of tables) {
      const deltaPoint: DeltaSyncPoint = {
        table,
        lastSyncTimestamp: Date.now(),
        lastSyncVersion: 1,
        checksum: this.calculateChecksum(table)
      };
      
      this.deltaSyncPoints.set(table, deltaPoint);
    }
    
    await this.saveDeltaSyncPoints();
  }

  private calculateChecksum(table: string): string {
    // Simple checksum calculation - in production, use proper hash
    return `checksum_${table}_${Date.now()}`;
  }

  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error saving sync queue:', error);
    }
  }

  private async loadSyncQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.SYNC_QUEUE_KEY);
      this.syncQueue = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading sync queue:', error);
      this.syncQueue = [];
    }
  }

  private async saveConflicts(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CONFLICT_KEY, JSON.stringify(this.conflicts));
    } catch (error) {
      console.error('Error saving conflicts:', error);
    }
  }

  private async loadConflicts(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.CONFLICT_KEY);
      this.conflicts = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading conflicts:', error);
      this.conflicts = [];
    }
  }

  private async saveDeltaSyncPoints(): Promise<void> {
    try {
      const data = Array.from(this.deltaSyncPoints.entries());
      await AsyncStorage.setItem(this.DELTA_SYNC_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving delta sync points:', error);
    }
  }

  private async loadDeltaSyncPoints(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.DELTA_SYNC_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.deltaSyncPoints = new Map(data);
      }
    } catch (error) {
      console.error('Error loading delta sync points:', error);
      this.deltaSyncPoints = new Map();
    }
  }

  private triggerSync(): void {
    // Debounced sync trigger
    setTimeout(() => {
      if (this.isOnline && !this.isSyncing) {
        this.sync().catch(error => {
          console.error('Triggered sync failed:', error);
        });
      }
    }, 1000);
  }

  private generateLocalId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getLastSyncTime(): number {
    const timestamps = Array.from(this.deltaSyncPoints.values())
      .map(point => point.lastSyncTimestamp);
    
    return timestamps.length > 0 ? Math.max(...timestamps) : 0;
  }

  private calculateDataSize(): number {
    // Calculate approximate data size
    return JSON.stringify(this.syncQueue).length + 
           JSON.stringify(this.conflicts).length;
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - in production, use proper CSV library
    return JSON.stringify(data);
  }
}

export default OfflineDataManager;
