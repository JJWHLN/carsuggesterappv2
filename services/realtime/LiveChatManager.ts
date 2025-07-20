/**
 * Live Chat System for Real-time Dealer Communication
 * 
 * Phase 2 Week 6 - Real-time Features & Live Communication
 * 
 * Features:
 * - Real-time messaging with dealers
 * - Message history and persistence
 * - Typing indicators
 * - Message status tracking (sent, delivered, read)
 * - File and image sharing
 * - Chat room management
 */

import { EventEmitter } from 'events';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppWebSocketManager from './WebSocketManager';
import { supabase } from '../../lib/supabase';

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  timestamp: number;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  replyTo?: string;
  attachments?: ChatAttachment[];
  metadata?: Record<string, any>;
}

export interface ChatAttachment {
  id: string;
  type: 'image' | 'file';
  url: string;
  name: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
}

export interface ChatRoom {
  id: string;
  dealerId: string;
  dealerName: string;
  dealerAvatar?: string;
  customerId: string;
  customerName: string;
  carId?: string;
  carDetails?: {
    make: string;
    model: string;
    year: number;
    price: number;
    image?: string;
  };
  lastMessage?: ChatMessage;
  unreadCount: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface TypingStatus {
  chatId: string;
  userId: string;
  userName: string;
  timestamp: number;
}

export class LiveChatManager extends EventEmitter {
  private ws: any;
  private currentUserId: string | null = null;
  private activeChats: Map<string, ChatRoom> = new Map();
  private messageCache: Map<string, ChatMessage[]> = new Map();
  private typingUsers: Map<string, TypingStatus[]> = new Map();
  private typingTimer?: NodeJS.Timeout;
  
  private static readonly CHAT_CACHE_KEY = '@chat_cache';
  private static readonly TYPING_TIMEOUT = 3000;

  constructor() {
    super();
    this.initializeWebSocket();
    this.loadCachedData();
  }

  // Initialize WebSocket connection for real-time chat
  private initializeWebSocket(): void {
    this.ws = AppWebSocketManager.getInstance();
    
    // Listen for chat-related messages
    this.ws.on('chat_message', this.handleIncomingMessage.bind(this));
    this.ws.on('message_status', this.handleMessageStatus.bind(this));
    this.ws.on('typing_start', this.handleTypingStart.bind(this));
    this.ws.on('typing_stop', this.handleTypingStop.bind(this));
    this.ws.on('chat_created', this.handleChatCreated.bind(this));
    this.ws.on('chat_updated', this.handleChatUpdated.bind(this));
  }

  // Set current user
  setCurrentUser(userId: string): void {
    this.currentUserId = userId;
  }

  // Create new chat with dealer
  async createChat(dealerId: string, carId?: string): Promise<ChatRoom> {
    try {
      // Get dealer info
      const { data: dealer } = await supabase
        .from('dealers')
        .select('name, avatar, contact_info')
        .eq('id', dealerId)
        .single();

      // Get car info if provided
      let carDetails;
      if (carId) {
        const { data: car } = await supabase
          .from('cars')
          .select('make, model, year, price, images')
          .eq('id', carId)
          .single();
        
        if (car) {
          carDetails = {
            make: car.make,
            model: car.model,
            year: car.year,
            price: car.price,
            image: car.images?.[0]
          };
        }
      }

      const chatRoom: ChatRoom = {
        id: this.generateChatId(),
        dealerId,
        dealerName: dealer?.name || 'Dealer',
        dealerAvatar: dealer?.avatar,
        customerId: this.currentUserId!,
        customerName: 'You',
        carId,
        carDetails,
        unreadCount: 0,
        isActive: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Save to database
      await supabase.from('chat_rooms').insert({
        id: chatRoom.id,
        dealer_id: dealerId,
        customer_id: this.currentUserId,
        car_id: carId,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Add to local cache
      this.activeChats.set(chatRoom.id, chatRoom);
      this.messageCache.set(chatRoom.id, []);

      // Notify via WebSocket
      this.ws.send({
        type: 'chat_create',
        payload: {
          chatRoom,
          participants: [dealerId, this.currentUserId]
        }
      });

      this.emit('chatCreated', chatRoom);
      this.saveCachedData();

      return chatRoom;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  // Send message in chat
  async sendMessage(
    chatId: string,
    message: string,
    messageType: 'text' | 'image' | 'file' = 'text',
    attachments?: ChatAttachment[],
    replyTo?: string
  ): Promise<ChatMessage> {
    const chatMessage: ChatMessage = {
      id: this.generateMessageId(),
      chatId,
      senderId: this.currentUserId!,
      senderName: 'You',
      message,
      messageType,
      timestamp: Date.now(),
      status: 'sending',
      replyTo,
      attachments
    };

    // Add to cache immediately
    const messages = this.messageCache.get(chatId) || [];
    messages.push(chatMessage);
    this.messageCache.set(chatId, messages);

    // Update chat room
    const chatRoom = this.activeChats.get(chatId);
    if (chatRoom) {
      chatRoom.lastMessage = chatMessage;
      chatRoom.updatedAt = Date.now();
      this.activeChats.set(chatId, chatRoom);
    }

    this.emit('messageAdded', chatMessage);

    try {
      // Save to database
      await supabase.from('chat_messages').insert({
        id: chatMessage.id,
        chat_id: chatId,
        sender_id: this.currentUserId,
        message,
        message_type: messageType,
        attachments: attachments || [],
        reply_to: replyTo,
        created_at: new Date().toISOString()
      });

      // Send via WebSocket
      this.ws.send({
        type: 'chat_message',
        payload: chatMessage
      });

      // Update status to sent
      chatMessage.status = 'sent';
      this.emit('messageStatusChanged', chatMessage);

    } catch (error) {
      console.error('Error sending message:', error);
      chatMessage.status = 'failed';
      this.emit('messageStatusChanged', chatMessage);
    }

    this.saveCachedData();
    return chatMessage;
  }

  // Load chat history
  async loadChatHistory(chatId: string, limit: number = 50, before?: number): Promise<ChatMessage[]> {
    try {
      let query = supabase
        .from('chat_messages')
        .select(`
          *,
          sender:sender_id(name, avatar)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', new Date(before).toISOString());
      }

      const { data: messages, error } = await query;

      if (error) throw error;

      const chatMessages: ChatMessage[] = messages.map(msg => ({
        id: msg.id,
        chatId: msg.chat_id,
        senderId: msg.sender_id,
        senderName: msg.sender?.name || 'Unknown',
        senderAvatar: msg.sender?.avatar,
        message: msg.message,
        messageType: msg.message_type,
        timestamp: new Date(msg.created_at).getTime(),
        status: 'delivered', // Assume delivered if in database
        replyTo: msg.reply_to,
        attachments: msg.attachments || []
      }));

      // Merge with cache
      const existingMessages = this.messageCache.get(chatId) || [];
      const allMessages = [...chatMessages.reverse(), ...existingMessages];
      
      // Remove duplicates
      const uniqueMessages = allMessages.filter((msg, index, self) => 
        index === self.findIndex(m => m.id === msg.id)
      );

      this.messageCache.set(chatId, uniqueMessages);
      return chatMessages;

    } catch (error) {
      console.error('Error loading chat history:', error);
      return this.messageCache.get(chatId) || [];
    }
  }

  // Get all chat rooms
  async getChatRooms(): Promise<ChatRoom[]> {
    try {
      const { data: rooms, error } = await supabase
        .from('chat_rooms')
        .select(`
          *,
          dealer:dealer_id(name, avatar),
          customer:customer_id(name, avatar),
          car:car_id(make, model, year, price, images),
          last_message:chat_messages(message, created_at, message_type)
        `)
        .eq('customer_id', this.currentUserId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const chatRooms: ChatRoom[] = rooms.map(room => ({
        id: room.id,
        dealerId: room.dealer_id,
        dealerName: room.dealer?.name || 'Dealer',
        dealerAvatar: room.dealer?.avatar,
        customerId: room.customer_id,
        customerName: room.customer?.name || 'Customer',
        carId: room.car_id,
        carDetails: room.car ? {
          make: room.car.make,
          model: room.car.model,
          year: room.car.year,
          price: room.car.price,
          image: room.car.images?.[0]
        } : undefined,
        unreadCount: 0, // TODO: Calculate from messages
        isActive: room.is_active,
        createdAt: new Date(room.created_at).getTime(),
        updatedAt: new Date(room.updated_at).getTime()
      }));

      // Update local cache
      chatRooms.forEach(room => {
        this.activeChats.set(room.id, room);
      });

      this.saveCachedData();
      return chatRooms;

    } catch (error) {
      console.error('Error loading chat rooms:', error);
      return Array.from(this.activeChats.values());
    }
  }

  // Start typing indicator
  startTyping(chatId: string): void {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    this.ws.send({
      type: 'typing_start',
      payload: {
        chatId,
        userId: this.currentUserId,
        userName: 'You'
      }
    });

    // Auto-stop typing after timeout
    this.typingTimer = setTimeout(() => {
      this.stopTyping(chatId);
    }, LiveChatManager.TYPING_TIMEOUT);
  }

  // Stop typing indicator
  stopTyping(chatId: string): void {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = undefined;
    }

    this.ws.send({
      type: 'typing_stop',
      payload: {
        chatId,
        userId: this.currentUserId
      }
    });
  }

  // Mark messages as read
  async markAsRead(chatId: string, messageIds: string[]): Promise<void> {
    try {
      // Update in database
      await supabase
        .from('chat_message_status')
        .upsert(
          messageIds.map(messageId => ({
            message_id: messageId,
            user_id: this.currentUserId,
            status: 'read',
            timestamp: new Date().toISOString()
          }))
        );

      // Send read receipts
      this.ws.send({
        type: 'messages_read',
        payload: {
          chatId,
          messageIds,
          userId: this.currentUserId
        }
      });

      // Update local cache
      const messages = this.messageCache.get(chatId) || [];
      messages.forEach(msg => {
        if (messageIds.includes(msg.id) && msg.senderId !== this.currentUserId) {
          msg.status = 'read';
        }
      });

      this.emit('messagesRead', { chatId, messageIds });

    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  // Get typing users for chat
  getTypingUsers(chatId: string): TypingStatus[] {
    return this.typingUsers.get(chatId) || [];
  }

  // WebSocket event handlers
  private handleIncomingMessage(message: ChatMessage): void {
    const messages = this.messageCache.get(message.chatId) || [];
    messages.push(message);
    this.messageCache.set(message.chatId, messages);

    // Update chat room
    const chatRoom = this.activeChats.get(message.chatId);
    if (chatRoom) {
      chatRoom.lastMessage = message;
      chatRoom.updatedAt = Date.now();
      if (message.senderId !== this.currentUserId) {
        chatRoom.unreadCount++;
      }
      this.activeChats.set(message.chatId, chatRoom);
    }

    this.emit('messageReceived', message);
    this.saveCachedData();
  }

  private handleMessageStatus(data: { messageId: string; status: string; userId: string }): void {
    // Update message status in cache
    for (const [chatId, messages] of this.messageCache.entries()) {
      const message = messages.find(m => m.id === data.messageId);
      if (message) {
        message.status = data.status as any;
        this.emit('messageStatusChanged', message);
        break;
      }
    }
  }

  private handleTypingStart(data: TypingStatus): void {
    if (data.userId === this.currentUserId) return;

    const typingUsers = this.typingUsers.get(data.chatId) || [];
    const existingIndex = typingUsers.findIndex(u => u.userId === data.userId);
    
    if (existingIndex >= 0) {
      typingUsers[existingIndex] = data;
    } else {
      typingUsers.push(data);
    }
    
    this.typingUsers.set(data.chatId, typingUsers);
    this.emit('typingChanged', data.chatId, typingUsers);
  }

  private handleTypingStop(data: { chatId: string; userId: string }): void {
    if (data.userId === this.currentUserId) return;

    const typingUsers = this.typingUsers.get(data.chatId) || [];
    const filteredUsers = typingUsers.filter(u => u.userId !== data.userId);
    
    this.typingUsers.set(data.chatId, filteredUsers);
    this.emit('typingChanged', data.chatId, filteredUsers);
  }

  private handleChatCreated(chatRoom: ChatRoom): void {
    this.activeChats.set(chatRoom.id, chatRoom);
    this.messageCache.set(chatRoom.id, []);
    this.emit('chatCreated', chatRoom);
    this.saveCachedData();
  }

  private handleChatUpdated(chatRoom: ChatRoom): void {
    this.activeChats.set(chatRoom.id, chatRoom);
    this.emit('chatUpdated', chatRoom);
    this.saveCachedData();
  }

  // Cache management
  private async saveCachedData(): Promise<void> {
    try {
      const cacheData = {
        chats: Array.from(this.activeChats.values()),
        messages: Object.fromEntries(this.messageCache.entries())
      };
      
      await AsyncStorage.setItem(
        LiveChatManager.CHAT_CACHE_KEY,
        JSON.stringify(cacheData)
      );
    } catch (error) {
      console.error('Error saving chat cache:', error);
    }
  }

  private async loadCachedData(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(LiveChatManager.CHAT_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached);
        
        // Restore chats
        if (data.chats) {
          data.chats.forEach((chat: ChatRoom) => {
            this.activeChats.set(chat.id, chat);
          });
        }
        
        // Restore messages
        if (data.messages) {
          this.messageCache = new Map(Object.entries(data.messages));
        }
      }
    } catch (error) {
      console.error('Error loading chat cache:', error);
    }
  }

  // Utility functions
  private generateChatId(): string {
    return `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cleanup
  destroy(): void {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    
    this.removeAllListeners();
    this.activeChats.clear();
    this.messageCache.clear();
    this.typingUsers.clear();
  }
}

export default LiveChatManager;
