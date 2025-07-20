import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { enhancedAuthService } from './enhancedAuthService';

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'text' | 'image' | 'car_link' | 'price_quote' | 'inspection_report' | 'system';
  metadata?: {
    car_id?: string;
    image_url?: string;
    price_amount?: number;
    inspection_data?: any;
    system_action?: string;
    car_details?: any;
    inquiry_id?: string;
    inquiry_type?: string;
    [key: string]: any;
  };
  read_by: string[];
  created_at: string;
  updated_at: string;
  sender_profile?: ChatParticipant;
}

export interface ChatConversation {
  id: string;
  type: 'direct' | 'group' | 'dealer_inquiry' | 'support';
  title?: string;
  description?: string;
  car_id?: string; // For car-related conversations
  participants: ChatParticipant[];
  last_message?: ChatMessage;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
  metadata?: {
    car_details?: any;
    dealer_info?: any;
    price_range?: { min: number; max: number };
    inquiry_id?: string;
    inquiry_type?: string;
    [key: string]: any;
  };
}

export interface ChatParticipant {
  id: string;
  user_id: string;
  conversation_id: string;
  role: 'member' | 'admin' | 'dealer' | 'buyer' | 'support';
  display_name: string;
  avatar_url?: string;
  is_online: boolean;
  last_seen_at: string;
  joined_at: string;
  notifications_enabled: boolean;
  user_profile?: {
    is_dealer: boolean;
    verified_buyer: boolean;
    location?: string;
    preferred_brands?: string[];
  };
}

export interface ChatTypingIndicator {
  user_id: string;
  conversation_id: string;
  display_name: string;
  timestamp: string;
}

export interface DealerInquiry {
  id: string;
  buyer_id: string;
  dealer_id: string;
  car_id: string;
  inquiry_type: 'price_quote' | 'availability' | 'test_drive' | 'financing' | 'trade_in' | 'general';
  message: string;
  status: 'pending' | 'responded' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
  metadata?: {
    preferred_contact?: 'chat' | 'phone' | 'email';
    budget_range?: { min: number; max: number };
    financing_needed?: boolean;
    trade_in_car?: any;
  };
}

export interface ChatNotification {
  id: string;
  user_id: string;
  conversation_id: string;
  message_id: string;
  type: 'new_message' | 'dealer_response' | 'price_update' | 'car_availability' | 'typing';
  title: string;
  content: string;
  read: boolean;
  created_at: string;
  metadata?: any;
}

class RealTimeChatService {
  private static instance: RealTimeChatService;
  private activeChannels: Map<string, RealtimeChannel> = new Map();
  private typingTimers: Map<string, NodeJS.Timeout> = new Map();
  private messageCache: Map<string, ChatMessage[]> = new Map();
  private conversationCache: Map<string, ChatConversation> = new Map();
  private onlineUsers: Set<string> = new Set();

  static getInstance(): RealTimeChatService {
    if (!RealTimeChatService.instance) {
      RealTimeChatService.instance = new RealTimeChatService();
    }
    return RealTimeChatService.instance;
  }

  // Conversation Management
  async createConversation(conversationData: Partial<ChatConversation>): Promise<ChatConversation> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const conversation = {
        ...conversationData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('chat_conversations')
        .insert(conversation)
        .select()
        .single();

      if (error) throw error;

      // Add creator as participant
      await this.addParticipant(data.id, user.id, 'admin');

      // Cache the conversation
      this.conversationCache.set(data.id, data);

      return data;
    } catch (error) {
      logger.error('Error creating conversation:', error);
      throw error;
    }
  }

  async getConversations(options: {
    type?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ChatConversation[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { type, limit = 20, offset = 0 } = options;

      let query = supabase
        .from('chat_conversations')
        .select(`
          *,
          participants!inner(*),
          last_message:chat_messages(*)
        `)
        .eq('participants.user_id', user.id)
        .order('last_activity_at', { ascending: false });

      if (type) {
        query = query.eq('type', type);
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;
      if (error) throw error;

      // Cache conversations
      data?.forEach(conv => {
        this.conversationCache.set(conv.id, conv);
      });

      return data || [];
    } catch (error) {
      logger.error('Error getting conversations:', error);
      throw error;
    }
  }

  async getConversation(conversationId: string): Promise<ChatConversation | null> {
    try {
      // Check cache first
      const cached = this.conversationCache.get(conversationId);
      if (cached) return cached;

      const { data, error } = await supabase
        .from('chat_conversations')
        .select(`
          *,
          participants(*),
          last_message:chat_messages(*)
        `)
        .eq('id', conversationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      // Cache the conversation
      this.conversationCache.set(conversationId, data);
      return data;
    } catch (error) {
      logger.error('Error getting conversation:', error);
      throw error;
    }
  }

  // Message Management
  async sendMessage(conversationId: string, messageData: Partial<ChatMessage>): Promise<ChatMessage> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const message = {
        ...messageData,
        conversation_id: conversationId,
        sender_id: user.id,
        read_by: [user.id],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('chat_messages')
        .insert(message)
        .select(`
          *,
          sender_profile:chat_participants!sender_id(*)
        `)
        .single();

      if (error) throw error;

      // Update conversation last activity
      await supabase
        .from('chat_conversations')
        .update({
          last_activity_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      // Cache the message
      const cached = this.messageCache.get(conversationId) || [];
      cached.push(data);
      this.messageCache.set(conversationId, cached);

      // Clear typing indicator
      this.stopTyping(conversationId);

      // Send notifications to other participants
      await this.sendMessageNotifications(conversationId, data);

      return data;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  async getMessages(conversationId: string, options: {
    limit?: number;
    offset?: number;
    before?: string;
  } = {}): Promise<ChatMessage[]> {
    try {
      const { limit = 50, offset = 0, before } = options;

      let query = supabase
        .from('chat_messages')
        .select(`
          *,
          sender_profile:chat_participants!sender_id(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false });

      if (before) {
        query = query.lt('created_at', before);
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;
      if (error) throw error;

      const messages = data?.reverse() || [];

      // Cache messages
      this.messageCache.set(conversationId, messages);

      return messages;
    } catch (error) {
      logger.error('Error getting messages:', error);
      throw error;
    }
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      await supabase.rpc('mark_message_as_read', {
        message_id: messageId,
        user_id: user.id,
      });
    } catch (error) {
      logger.error('Error marking message as read:', error);
      throw error;
    }
  }

  // Participant Management
  async addParticipant(conversationId: string, userId: string, role: ChatParticipant['role'] = 'member'): Promise<void> {
    try {
      const participant = {
        user_id: userId,
        conversation_id: conversationId,
        role,
        joined_at: new Date().toISOString(),
        notifications_enabled: true,
        is_online: false,
        last_seen_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('chat_participants')
        .insert(participant);

      if (error) throw error;

      // Clear conversation cache
      this.conversationCache.delete(conversationId);
    } catch (error) {
      logger.error('Error adding participant:', error);
      throw error;
    }
  }

  async removeParticipant(conversationId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('chat_participants')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (error) throw error;

      // Clear conversation cache
      this.conversationCache.delete(conversationId);
    } catch (error) {
      logger.error('Error removing participant:', error);
      throw error;
    }
  }

  // Dealer Inquiry System
  async createDealerInquiry(inquiryData: Partial<DealerInquiry>): Promise<DealerInquiry> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const inquiry = {
        ...inquiryData,
        buyer_id: user.id,
        status: 'pending',
        priority: 'medium',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('dealer_inquiries')
        .insert(inquiry)
        .select()
        .single();

      if (error) throw error;

      // Create a conversation for this inquiry
      const conversation = await this.createConversation({
        type: 'dealer_inquiry',
        title: `Inquiry about ${inquiryData.car_id}`,
        car_id: inquiryData.car_id,
        metadata: {
          inquiry_id: data.id,
          inquiry_type: inquiryData.inquiry_type,
        },
      });

      // Add dealer as participant
      if (inquiryData.dealer_id) {
        await this.addParticipant(conversation.id, inquiryData.dealer_id, 'dealer');
      }

      // Send initial message
      await this.sendMessage(conversation.id, {
        content: inquiryData.message || 'New inquiry about your car listing',
        message_type: 'text',
        metadata: {
          car_id: inquiryData.car_id,
          inquiry_type: inquiryData.inquiry_type,
        },
      });

      return data;
    } catch (error) {
      logger.error('Error creating dealer inquiry:', error);
      throw error;
    }
  }

  async getDealerInquiries(options: {
    status?: string;
    type?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<DealerInquiry[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { status, type, limit = 20, offset = 0 } = options;

      let query = supabase
        .from('dealer_inquiries')
        .select('*')
        .or(`buyer_id.eq.${user.id},dealer_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      if (type) {
        query = query.eq('inquiry_type', type);
      }

      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Error getting dealer inquiries:', error);
      throw error;
    }
  }

  // Real-time Features
  async subscribeToConversation(conversationId: string, callbacks: {
    onMessage?: (message: ChatMessage) => void;
    onTyping?: (indicator: ChatTypingIndicator) => void;
    onUserOnline?: (userId: string) => void;
    onUserOffline?: (userId: string) => void;
  }): Promise<RealtimeChannel> {
    try {
      const channel = supabase.channel(`conversation:${conversationId}`);

      // Subscribe to new messages
      if (callbacks.onMessage) {
        channel.on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`,
        }, (payload) => {
          callbacks.onMessage!(payload.new as ChatMessage);
        });
      }

      // Subscribe to typing indicators
      if (callbacks.onTyping) {
        channel.on('broadcast', {
          event: 'typing',
        }, (payload) => {
          callbacks.onTyping!(payload.payload as ChatTypingIndicator);
        });
      }

      // Subscribe to user presence
      if (callbacks.onUserOnline || callbacks.onUserOffline) {
        channel.on('presence', {
          event: 'sync',
        }, () => {
          const state = channel.presenceState();
          const onlineUsers = Object.keys(state);
          
          // Handle user online/offline events
          onlineUsers.forEach(userId => {
            if (!this.onlineUsers.has(userId) && callbacks.onUserOnline) {
              callbacks.onUserOnline(userId);
            }
          });

          this.onlineUsers.forEach(userId => {
            if (!onlineUsers.includes(userId) && callbacks.onUserOffline) {
              callbacks.onUserOffline(userId);
            }
          });

          this.onlineUsers = new Set(onlineUsers);
        });

        // Track user presence
        channel.on('presence', {
          event: 'join',
        }, ({ key, newPresences }) => {
          if (callbacks.onUserOnline) {
            callbacks.onUserOnline(key);
          }
        });

        channel.on('presence', {
          event: 'leave',
        }, ({ key, leftPresences }) => {
          if (callbacks.onUserOffline) {
            callbacks.onUserOffline(key);
          }
        });
      }

      await channel.subscribe();

      // Track user presence
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
        });
      }

      this.activeChannels.set(conversationId, channel);
      return channel;
    } catch (error) {
      logger.error('Error subscribing to conversation:', error);
      throw error;
    }
  }

  async unsubscribeFromConversation(conversationId: string): Promise<void> {
    const channel = this.activeChannels.get(conversationId);
    if (channel) {
      await channel.unsubscribe();
      this.activeChannels.delete(conversationId);
    }
  }

  // Typing Indicators
  async startTyping(conversationId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = this.activeChannels.get(conversationId);
      if (!channel) return;

      // Clear existing typing timer
      const existingTimer = this.typingTimers.get(conversationId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Broadcast typing indicator
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          user_id: user.id,
          conversation_id: conversationId,
          timestamp: new Date().toISOString(),
        },
      });

      // Set timer to stop typing after 3 seconds
      const timer = setTimeout(() => {
        this.stopTyping(conversationId);
      }, 3000);

      this.typingTimers.set(conversationId, timer);
    } catch (error) {
      logger.error('Error starting typing:', error);
    }
  }

  async stopTyping(conversationId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = this.activeChannels.get(conversationId);
      if (!channel) return;

      // Clear typing timer
      const timer = this.typingTimers.get(conversationId);
      if (timer) {
        clearTimeout(timer);
        this.typingTimers.delete(conversationId);
      }

      // Broadcast stop typing
      await channel.send({
        type: 'broadcast',
        event: 'stop_typing',
        payload: {
          user_id: user.id,
          conversation_id: conversationId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error('Error stopping typing:', error);
    }
  }

  // Car-specific messaging features
  async sendCarShareMessage(conversationId: string, carId: string, message?: string): Promise<ChatMessage> {
    try {
      // Get car details
      const { data: car } = await supabase
        .from('cars')
        .select('*')
        .eq('id', carId)
        .single();

      return await this.sendMessage(conversationId, {
        content: message || `Check out this ${car?.make} ${car?.model}`,
        message_type: 'car_link',
        metadata: {
          car_id: carId,
          car_details: car,
        },
      });
    } catch (error) {
      logger.error('Error sending car share message:', error);
      throw error;
    }
  }

  async sendPriceQuoteMessage(conversationId: string, carId: string, priceAmount: number, message?: string): Promise<ChatMessage> {
    return await this.sendMessage(conversationId, {
      content: message || `Price quote for this vehicle: $${priceAmount.toLocaleString()}`,
      message_type: 'price_quote',
      metadata: {
        car_id: carId,
        price_amount: priceAmount,
      },
    });
  }

  // Notification Management
  private async sendMessageNotifications(conversationId: string, message: ChatMessage): Promise<void> {
    try {
      // Get conversation participants (excluding sender)
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('user_id, notifications_enabled')
        .eq('conversation_id', conversationId)
        .neq('user_id', message.sender_id)
        .eq('notifications_enabled', true);

      if (!participants || participants.length === 0) return;

      // Create notifications for each participant
      const notifications = participants.map(participant => ({
        user_id: participant.user_id,
        conversation_id: conversationId,
        message_id: message.id,
        type: 'new_message',
        title: 'New Message',
        content: message.content.substring(0, 100),
        read: false,
        created_at: new Date().toISOString(),
        metadata: {
          sender_id: message.sender_id,
          message_type: message.message_type,
        },
      }));

      await supabase
        .from('chat_notifications')
        .insert(notifications);
    } catch (error) {
      logger.error('Error sending message notifications:', error);
    }
  }

  // Cache Management
  clearCache(): void {
    this.messageCache.clear();
    this.conversationCache.clear();
  }

  // Cleanup
  async cleanup(): Promise<void> {
    // Clear all timers
    this.typingTimers.forEach(timer => clearTimeout(timer));
    this.typingTimers.clear();

    // Unsubscribe from all channels
    for (const [conversationId, channel] of this.activeChannels) {
      await channel.unsubscribe();
    }
    this.activeChannels.clear();

    // Clear caches
    this.clearCache();
  }
}

export const realTimeChatService = RealTimeChatService.getInstance();
export default realTimeChatService;
