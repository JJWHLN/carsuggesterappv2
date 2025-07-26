import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useTheme';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import {
  realTimeChatService,
  ChatMessage,
  ChatConversation,
  ChatParticipant,
  ChatTypingIndicator,
} from '@/services/realTimeChatService';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';

import { useAuth } from '@/contexts/AuthContext';
import {
  Car,
  DollarSign,
  MoreVertical,
  ArrowLeft,
  CheckCircle,
  Check,
  Clock,
  MapPin,
} from '@/utils/ultra-optimized-icons';

const { width, height } = Dimensions.get('window');

interface CarMarketplaceChatProps {
  conversationId: string;
  onBack?: () => void;
  carId?: string; // For car-specific chat features
}

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  showAvatar: boolean;
  onCarPress?: (carId: string) => void;
  onImagePress?: (imageUrl: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwn,
  showAvatar,
  onCarPress,
  onImagePress,
}) => {
  const { colors } = useThemeColors();

  const getMessageStatusIcon = () => {
    if (message.read_by.length > 1) {
      return <CheckCircle size={14} color={colors.success} />;
    } else {
      return <Check size={14} color={colors.textSecondary} />;
    }
  };

  const renderMessageContent = () => {
    switch (message.message_type) {
      case 'text':
        return (
          <Text
            style={[
              styles.messageText,
              { color: isOwn ? colors.white : colors.text },
            ]}
          >
            {message.content}
          </Text>
        );

      case 'image':
        return (
          <TouchableOpacity
            onPress={() =>
              message.metadata?.image_url &&
              onImagePress?.(message.metadata.image_url)
            }
            style={styles.imageMessage}
          >
            <Image
              source={{ uri: message.metadata?.image_url }}
              style={styles.messageImage}
              resizeMode="cover"
            />
            {message.content && (
              <Text
                style={[
                  styles.imageCaption,
                  { color: isOwn ? colors.white : colors.text },
                ]}
              >
                {message.content}
              </Text>
            )}
          </TouchableOpacity>
        );

      case 'car_link':
        return (
          <TouchableOpacity
            onPress={() =>
              message.metadata?.car_id && onCarPress?.(message.metadata.car_id)
            }
            style={[
              styles.carLinkMessage,
              { backgroundColor: isOwn ? colors.white : colors.surface },
            ]}
          >
            <View style={styles.carLinkHeader}>
              <Car size={20} color={colors.primary} />
              <Text style={[styles.carLinkTitle, { color: colors.text }]}>
                Car Details
              </Text>
            </View>

            <Text style={[styles.carLinkText, { color: colors.text }]}>
              {message.metadata?.car_details?.make}{' '}
              {message.metadata?.car_details?.model}
            </Text>
            <Text
              style={[styles.carLinkSubtext, { color: colors.textSecondary }]}
            >
              {message.metadata?.car_details?.year} • $
              {message.metadata?.car_details?.price?.toLocaleString()}
            </Text>

            {message.content && (
              <Text style={[styles.carLinkCaption, { color: colors.text }]}>
                {message.content}
              </Text>
            )}
          </TouchableOpacity>
        );

      case 'price_quote':
        return (
          <View
            style={[
              styles.priceQuoteMessage,
              { backgroundColor: isOwn ? colors.white : colors.surface },
            ]}
          >
            <View style={styles.priceQuoteHeader}>
              <DollarSign size={20} color={colors.success} />
              <Text style={[styles.priceQuoteTitle, { color: colors.text }]}>
                Price Quote
              </Text>
            </View>

            <Text style={[styles.priceAmount, { color: colors.success }]}>
              ${message.metadata?.price_amount?.toLocaleString()}
            </Text>

            {message.content && (
              <Text style={[styles.priceQuoteText, { color: colors.text }]}>
                {message.content}
              </Text>
            )}
          </View>
        );

      case 'system':
        return (
          <Text style={[styles.systemMessage, { color: colors.textSecondary }]}>
            {message.content}
          </Text>
        );

      default:
        return (
          <Text
            style={[
              styles.messageText,
              { color: isOwn ? colors.white : colors.text },
            ]}
          >
            {message.content}
          </Text>
        );
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (message.message_type === 'system') {
    return (
      <View style={styles.systemMessageContainer}>
        <View
          style={[
            styles.systemMessageBubble,
            { backgroundColor: colors.surface },
          ]}
        >
          {renderMessageContent()}
          <Text
            style={[styles.systemMessageTime, { color: colors.textSecondary }]}
          >
            {formatTime(message.created_at)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.messageContainer,
        isOwn ? styles.ownMessage : styles.otherMessage,
      ]}
    >
      {!isOwn && showAvatar && (
        <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
          {message.sender_profile?.avatar_url ? (
            <Image
              source={{ uri: message.sender_profile.avatar_url }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={[styles.avatarText, { color: colors.text }]}>
              {message.sender_profile?.display_name?.charAt(0) || '?'}
            </Text>
          )}
        </View>
      )}

      <View
        style={[
          styles.messageBubble,
          {
            backgroundColor: isOwn ? colors.primary : colors.cardBackground,
            marginLeft: !isOwn && !showAvatar ? 40 : 0,
          },
        ]}
      >
        {renderMessageContent()}

        <View style={styles.messageFooter}>
          <Text
            style={[
              styles.messageTime,
              { color: isOwn ? colors.white : colors.textSecondary },
            ]}
          >
            {formatTime(message.created_at)}
          </Text>
          {isOwn && (
            <View style={styles.messageStatus}>{getMessageStatusIcon()}</View>
          )}
        </View>
      </View>
    </View>
  );
};

const TypingIndicator: React.FC<{ typingUsers: ChatTypingIndicator[] }> = ({
  typingUsers,
}) => {
  const { colors } = useThemeColors();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (typingUsers.length > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    }
  }, [typingUsers.length, animatedValue]);

  if (typingUsers.length === 0) return null;

  const typingText =
    typingUsers.length === 1
      ? `${typingUsers[0].display_name} is typing...`
      : `${typingUsers.length} people are typing...`;

  return (
    <View style={styles.typingContainer}>
      <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
        <Animated.View style={{ opacity: animatedValue }}>
          <Text style={[styles.typingDots, { color: colors.textSecondary }]}>
            •••
          </Text>
        </Animated.View>
      </View>
      <View style={[styles.typingBubble, { backgroundColor: colors.surface }]}>
        <Text style={[styles.typingText, { color: colors.textSecondary }]}>
          {typingText}
        </Text>
      </View>
    </View>
  );
};

export const CarMarketplaceChat: React.FC<CarMarketplaceChatProps> = ({
  conversationId,
  onBack,
  carId,
}) => {
  const { colors } = useThemeColors();
  const { spacing } = useDesignTokens();
  const { user } = useAuth();

  const [conversation, setConversation] = useState<ChatConversation | null>(
    null,
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<ChatTypingIndicator[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const loadConversation = useCallback(async () => {
    try {
      const conversationData =
        await realTimeChatService.getConversation(conversationId);
      setConversation(conversationData);
    } catch (error) {
      logger.error('Error loading conversation:', error);
      Alert.alert('Error', 'Failed to load conversation');
    }
  }, [conversationId]);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      const messagesData = await realTimeChatService.getMessages(
        conversationId,
        { limit: 50 },
      );
      setMessages(messagesData);
    } catch (error) {
      logger.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const subscribeToRealTime = useCallback(async () => {
    try {
      await realTimeChatService.subscribeToConversation(conversationId, {
        onMessage: (message) => {
          setMessages((prev) => [...prev, message]);
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        },
        onTyping: (indicator) => {
          setTypingUsers((prev) => {
            const filtered = prev.filter(
              (t) => t.user_id !== indicator.user_id,
            );
            return [...filtered, indicator];
          });

          // Remove typing indicator after 3 seconds
          setTimeout(() => {
            setTypingUsers((prev) =>
              prev.filter((t) => t.user_id !== indicator.user_id),
            );
          }, 3000);
        },
        onUserOnline: (userId) => {
          setOnlineUsers((prev) => new Set([...prev, userId]));
        },
        onUserOffline: (userId) => {
          setOnlineUsers((prev) => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
          });
        },
      });
    } catch (error) {
      logger.error('Error subscribing to real-time updates:', error);
    }
  }, [conversationId]);

  useEffect(() => {
    loadConversation();
    loadMessages();
    subscribeToRealTime();

    return () => {
      realTimeChatService.unsubscribeFromConversation(conversationId);
    };
  }, [conversationId, loadConversation, loadMessages, subscribeToRealTime]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || sending) return;

    try {
      setSending(true);
      const messageText = inputText.trim();
      setInputText('');

      await realTimeChatService.sendMessage(conversationId, {
        content: messageText,
        message_type: 'text',
      });

      // Stop typing indicator
      await realTimeChatService.stopTyping(conversationId);
    } catch (error) {
      logger.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      setInputText(inputText); // Restore message on error
    } finally {
      setSending(false);
    }
  }, [inputText, sending, conversationId]);

  const handleInputChange = useCallback(
    async (text: string) => {
      setInputText(text);

      // Start typing indicator
      if (text.length > 0) {
        await realTimeChatService.startTyping(conversationId);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }

        // Stop typing after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          realTimeChatService.stopTyping(conversationId);
        }, 3000);
      }
    },
    [conversationId],
  );

  const handleCarShare = useCallback(
    async (carId: string) => {
      try {
        await realTimeChatService.sendCarShareMessage(
          conversationId,
          carId,
          'Check out this car!',
        );
      } catch (error) {
        logger.error('Error sharing car:', error);
        Alert.alert('Error', 'Failed to share car');
      }
    },
    [conversationId],
  );

  const handlePriceQuote = useCallback(
    async (amount: number) => {
      try {
        await realTimeChatService.sendPriceQuoteMessage(
          conversationId,
          carId || '',
          amount,
          "Here's my price quote for this vehicle:",
        );
      } catch (error) {
        logger.error('Error sending price quote:', error);
        Alert.alert('Error', 'Failed to send price quote');
      }
    },
    [conversationId, carId],
  );

  const getParticipantStatus = (participant: ChatParticipant) => {
    if (onlineUsers.has(participant.user_id)) {
      return 'online';
    }
    return 'offline';
  };

  const getHeaderTitle = () => {
    if (conversation?.type === 'dealer_inquiry') {
      return 'Dealer Conversation';
    }
    if (conversation?.title) {
      return conversation.title;
    }
    // Get other participants (excluding current user)
    const otherParticipants =
      conversation?.participants?.filter((p) => p.user_id !== user?.id) || [];
    if (otherParticipants.length === 1) {
      return otherParticipants[0].display_name;
    }
    if (otherParticipants.length > 1) {
      return `${otherParticipants[0].display_name} +${otherParticipants.length - 1}`;
    }
    return 'Chat';
  };

  const getHeaderSubtitle = () => {
    const otherParticipants =
      conversation?.participants?.filter((p) => p.user_id !== user?.id) || [];
    const onlineCount = otherParticipants.filter((p) =>
      onlineUsers.has(p.user_id),
    ).length;

    if (onlineCount === 0) {
      return 'Offline';
    }
    if (onlineCount === 1 && otherParticipants.length === 1) {
      return 'Online';
    }
    return `${onlineCount} of ${otherParticipants.length} online`;
  };

  if (loading && messages.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading conversation...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.cardBackground,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {getHeaderTitle()}
            </Text>
            <Text
              style={[styles.headerSubtitle, { color: colors.textSecondary }]}
            >
              {getHeaderSubtitle()}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerAction}>
            <Phone size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <Video size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerAction}>
            <MoreVertical size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Car Info Banner (if applicable) */}
      {conversation?.car_id && conversation.metadata?.car_details && (
        <View
          style={[
            styles.carBanner,
            {
              backgroundColor: colors.surface,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <Car size={20} color={colors.primary} />
          <View style={styles.carBannerText}>
            <Text style={[styles.carBannerTitle, { color: colors.text }]}>
              {conversation.metadata.car_details.make}{' '}
              {conversation.metadata.car_details.model}
            </Text>
            <Text
              style={[
                styles.carBannerSubtitle,
                { color: colors.textSecondary },
              ]}
            >
              {conversation.metadata.car_details.year} • $
              {conversation.metadata.car_details.price?.toLocaleString()}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => logger.debug('View car details')}
            style={[styles.viewCarButton, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.viewCarButtonText, { color: colors.white }]}>
              View
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.messagesContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }}
        >
          {messages.map((message, index) => {
            const isOwn = message.sender_id === user?.id;
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const showAvatar =
              !prevMessage || prevMessage.sender_id !== message.sender_id;

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
                onCarPress={(carId) => logger.debug('View car:', carId)}
                onImagePress={(imageUrl) =>
                  logger.debug('View image:', imageUrl)
                }
              />
            );
          })}

          <TypingIndicator typingUsers={typingUsers} />
        </ScrollView>

        {/* Input */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.cardBackground,
              borderTopColor: colors.border,
            },
          ]}
        >
          <View style={styles.inputActions}>
            <TouchableOpacity style={styles.inputAction}>
              <Camera size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.inputAction}>
              <ImageIcon size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {carId && (
              <TouchableOpacity
                style={styles.inputAction}
                onPress={() => handleCarShare(carId)}
              >
                <Car size={20} color={colors.primary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Type a message..."
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={handleInputChange}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={handleSendMessage}
            />

            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: inputText.trim()
                    ? colors.primary
                    : colors.border,
                },
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Send
                  size={18}
                  color={inputText.trim() ? colors.white : colors.textSecondary}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.bodyText,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    ...Shadows.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.cardTitle,
    fontWeight: '600',
  },
  headerSubtitle: {
    ...Typography.caption,
    marginTop: Spacing.xs / 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    gap: Spacing.sm,
  },
  carBannerText: {
    flex: 1,
  },
  carBannerTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  carBannerSubtitle: {
    ...Typography.caption,
    marginTop: Spacing.xs / 2,
  },
  viewCarButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  viewCarButtonText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    maxWidth: width * 0.8,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  otherMessage: {
    alignSelf: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: Spacing.xs,
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  messageBubble: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  messageText: {
    ...Typography.bodyText,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  messageTime: {
    ...Typography.caption,
  },
  messageStatus: {
    marginLeft: Spacing.xs,
  },
  imageMessage: {
    overflow: 'hidden',
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
  },
  imageCaption: {
    ...Typography.bodyText,
    marginTop: Spacing.sm,
  },
  carLinkMessage: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  carLinkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  carLinkTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  carLinkText: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  carLinkSubtext: {
    ...Typography.caption,
    marginTop: Spacing.xs / 2,
  },
  carLinkCaption: {
    ...Typography.bodyText,
    marginTop: Spacing.sm,
  },
  priceQuoteMessage: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  priceQuoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  priceQuoteTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  priceAmount: {
    ...Typography.pageTitle,
    fontWeight: '700',
  },
  priceQuoteText: {
    ...Typography.bodyText,
    marginTop: Spacing.sm,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  systemMessageBubble: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    maxWidth: width * 0.6,
  },
  systemMessage: {
    ...Typography.caption,
    textAlign: 'center',
  },
  systemMessageTime: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.xs / 2,
  },
  typingContainer: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    maxWidth: width * 0.8,
    alignSelf: 'flex-start',
  },
  typingBubble: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.sm,
  },
  typingText: {
    ...Typography.caption,
    fontStyle: 'italic',
  },
  typingDots: {
    ...Typography.bodyLarge,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  inputAction: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
    ...Typography.bodyText,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
});

export default CarMarketplaceChat;
