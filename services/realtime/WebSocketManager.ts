/**
 * WebSocket Connection Manager for Real-time Features
 * 
 * Phase 2 Week 6 - Real-time Features & Live Communication
 * 
 * Features:
 * - Auto-reconnecting WebSocket connections
 * - Event-based messaging system
 * - Offline message queuing
 * - Connection state management
 * - Real-time data synchronization
 */

import { EventEmitter } from 'events';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

export interface WebSocketMessage {
  type: string;
  payload: any;
  id?: string;
  timestamp: number;
  priority?: 'low' | 'normal' | 'high';
}

export interface ConnectionConfig {
  url: string;
  protocols?: string[];
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
  enableLogging?: boolean;
}

export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';

export class WebSocketManager extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: ConnectionConfig;
  private state: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private heartbeatTimer?: NodeJS.Timeout;
  private reconnectTimer?: NodeJS.Timeout;
  private messageQueue: WebSocketMessage[] = [];
  private appStateSubscription?: any;
  
  private static readonly MESSAGE_QUEUE_KEY = '@websocket_message_queue';
  private static readonly MAX_QUEUE_SIZE = 100;

  constructor(config: ConnectionConfig) {
    super();
    this.config = {
      maxReconnectAttempts: 5,
      reconnectInterval: 3000,
      heartbeatInterval: 30000,
      enableLogging: true,
      ...config,
    };

    this.setupAppStateHandling();
    this.loadMessageQueue();
  }

  // Connect to WebSocket server
  async connect(): Promise<void> {
    if (this.state === 'connected' || this.state === 'connecting') {
      return;
    }

    this.setState('connecting');
    this.log('Connecting to WebSocket...', this.config.url);

    try {
      this.ws = new WebSocket(this.config.url, this.config.protocols);
      this.setupWebSocketHandlers();
    } catch (error) {
      this.log('Connection error:', error);
      this.setState('error');
      this.scheduleReconnect();
    }
  }

  // Disconnect from WebSocket
  disconnect(): void {
    this.log('Disconnecting WebSocket...');
    
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.setState('disconnected');
  }

  // Send message through WebSocket
  send(message: Omit<WebSocketMessage, 'timestamp'>): boolean {
    const fullMessage: WebSocketMessage = {
      ...message,
      timestamp: Date.now(),
      id: message.id || this.generateMessageId(),
    };

    if (this.state === 'connected' && this.ws) {
      try {
        this.ws.send(JSON.stringify(fullMessage));
        this.log('Message sent:', fullMessage.type);
        return true;
      } catch (error) {
        this.log('Send error:', error);
        this.queueMessage(fullMessage);
        return false;
      }
    } else {
      this.log('Queuing message (not connected):', fullMessage.type);
      this.queueMessage(fullMessage);
      return false;
    }
  }

  // Get current connection state
  getState(): ConnectionState {
    return this.state;
  }

  // Check if connected
  isConnected(): boolean {
    return this.state === 'connected';
  }

  // Setup WebSocket event handlers
  private setupWebSocketHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.log('WebSocket connected');
      this.setState('connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.processMessageQueue();
    };

    this.ws.onclose = (event) => {
      this.log('WebSocket closed:', event.code, event.reason);
      this.stopHeartbeat();
      
      if (event.code !== 1000) { // Not a normal closure
        this.setState('disconnected');
        this.scheduleReconnect();
      } else {
        this.setState('disconnected');
      }
    };

    this.ws.onerror = (error) => {
      this.log('WebSocket error:', error);
      this.setState('error');
      this.emit('error', error);
    };

    this.ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        this.handleIncomingMessage(message);
      } catch (error) {
        this.log('Message parse error:', error);
      }
    };
  }

  // Handle incoming messages
  private handleIncomingMessage(message: WebSocketMessage): void {
    this.log('Message received:', message.type);
    this.emit('message', message);
    this.emit(message.type, message.payload);

    // Handle system messages
    switch (message.type) {
      case 'ping':
        this.send({ type: 'pong', payload: {} });
        break;
      case 'pong':
        // Heartbeat response received
        break;
      default:
        // Emit as custom event
        break;
    }
  }

  // Queue message for later sending
  private queueMessage(message: WebSocketMessage): void {
    this.messageQueue.push(message);
    
    // Limit queue size
    if (this.messageQueue.length > WebSocketManager.MAX_QUEUE_SIZE) {
      this.messageQueue.shift();
    }

    this.saveMessageQueue();
  }

  // Process queued messages when connected
  private async processMessageQueue(): Promise<void> {
    if (this.messageQueue.length === 0) return;

    this.log(`Processing ${this.messageQueue.length} queued messages`);
    
    const messages = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of messages) {
      if (this.isConnected()) {
        this.send(message);
        // Small delay between messages to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 10));
      } else {
        // Re-queue if disconnected
        this.queueMessage(message);
        break;
      }
    }

    this.saveMessageQueue();
  }

  // Start heartbeat to keep connection alive
  private startHeartbeat(): void {
    if (this.heartbeatTimer) return;

    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping', payload: { timestamp: Date.now() } });
      }
    }, this.config.heartbeatInterval);
  }

  // Stop heartbeat
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }

  // Schedule reconnection attempt
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
      this.log('Max reconnection attempts reached');
      this.setState('error');
      this.emit('maxReconnectAttemptsReached');
      return;
    }

    this.setState('reconnecting');
    this.reconnectAttempts++;
    
    const delay = this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1);
    this.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  // Set connection state and emit event
  private setState(newState: ConnectionState): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      this.log(`State changed: ${oldState} -> ${newState}`);
      this.emit('stateChange', newState, oldState);
    }
  }

  // Setup app state handling
  private setupAppStateHandling(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground
        if (this.state === 'disconnected') {
          this.log('App became active, reconnecting...');
          this.connect();
        }
      } else if (nextAppState === 'background') {
        // App went to background
        this.log('App went to background');
        // Keep connection alive but reduce heartbeat frequency
      }
    });
  }

  // Save message queue to storage
  private async saveMessageQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        WebSocketManager.MESSAGE_QUEUE_KEY,
        JSON.stringify(this.messageQueue)
      );
    } catch (error) {
      this.log('Error saving message queue:', error);
    }
  }

  // Load message queue from storage
  private async loadMessageQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(WebSocketManager.MESSAGE_QUEUE_KEY);
      if (stored) {
        this.messageQueue = JSON.parse(stored);
        this.log(`Loaded ${this.messageQueue.length} queued messages`);
      }
    } catch (error) {
      this.log('Error loading message queue:', error);
      this.messageQueue = [];
    }
  }

  // Generate unique message ID
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Logging utility
  private log(...args: any[]): void {
    if (this.config.enableLogging) {
      console.log('[WebSocketManager]', ...args);
    }
  }

  // Cleanup when destroying instance
  destroy(): void {
    this.disconnect();
    
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }

    this.removeAllListeners();
  }
}

// Singleton WebSocket manager for the app
class AppWebSocketManager {
  private static instance: WebSocketManager | null = null;
  
  static getInstance(config?: ConnectionConfig): WebSocketManager {
    if (!AppWebSocketManager.instance && config) {
      AppWebSocketManager.instance = new WebSocketManager(config);
    }
    
    if (!AppWebSocketManager.instance) {
      throw new Error('WebSocketManager not initialized. Provide config on first call.');
    }
    
    return AppWebSocketManager.instance;
  }

  static initialize(config: ConnectionConfig): void {
    if (AppWebSocketManager.instance) {
      AppWebSocketManager.instance.destroy();
    }
    AppWebSocketManager.instance = new WebSocketManager(config);
  }

  static destroy(): void {
    if (AppWebSocketManager.instance) {
      AppWebSocketManager.instance.destroy();
      AppWebSocketManager.instance = null;
    }
  }
}

export default AppWebSocketManager;
