/**
 * Live Car Details Component - Real-time Features Demo
 * 
 * Phase 2 Week 6 - Real-time Features & Live Communication
 * 
 * Demonstrates:
 * - Live price updates
 * - Real-time chat with dealers
 * - Live inventory status
 * - Price alerts
 * - Market insights
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  useLivePrice,
  useLiveChat,
  useRealTimeConnection,
  useLiveMarketData,
  useRealTimeState,
} from '../../hooks/useRealTime';
import PriceTrackingService from '../../services/realtime/PriceTrackingService';
import LiveChatManager from '../../services/realtime/LiveChatManager';

interface LiveCarDetailsProps {
  carId: string;
  dealerId: string;
  make: string;
  model: string;
  year: number;
}

export default function LiveCarDetails({
  carId,
  dealerId,
  make,
  model,
  year,
}: LiveCarDetailsProps) {
  // Real-time price tracking
  const {
    price,
    priceHistory,
    change24h,
    isTracking,
    startTracking,
    stopTracking,
  } = useLivePrice(carId);

  // Live chat with dealer
  const [chatId, setChatId] = useState<string | null>(null);
  const {
    messages,
    typingUsers,
    isConnected: chatConnected,
    sendMessage,
    startTyping,
    stopTyping,
  } = useLiveChat(chatId || '');

  // Connection status
  const { isConnected, isReconnecting, pendingUpdates } = useRealTimeConnection();

  // Market data
  const { trends, insights, averagePrice, demandLevel } = useLiveMarketData(make, model);

  // Inventory status
  const [inventoryStatus, setInventoryStatus] = useRealTimeState<{
    available: boolean;
    count: number;
    lastUpdated: number;
  }>(`inventory.${carId}.status`);

  // Services
  const [priceService] = useState(() => new PriceTrackingService());
  const [chatService] = useState(() => new LiveChatManager());

  useEffect(() => {
    // Initialize services
    priceService.setCurrentUser('current_user_id');
    chatService.setCurrentUser('current_user_id');

    // Subscribe to price updates for this car
    if (carId) {
      priceService.subscribeToCarPriceUpdates(carId);
    }

    return () => {
      priceService.destroy();
      chatService.destroy();
    };
  }, [carId]);

  // Create price alert
  const handleCreatePriceAlert = async () => {
    if (!price) return;

    Alert.prompt(
      'Price Alert',
      'Enter your target price:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create Alert',
          onPress: async (targetPriceStr) => {
            const targetPrice = parseFloat(targetPriceStr || '0');
            if (targetPrice > 0) {
              try {
                await priceService.createPriceAlert(
                  carId,
                  targetPrice,
                  targetPrice < price ? 'below' : 'above'
                );
                Alert.alert('Success', 'Price alert created!');
              } catch (error) {
                Alert.alert('Error', 'Failed to create price alert');
              }
            }
          },
        },
      ],
      'plain-text',
      price?.toString()
    );
  };

  // Start chat with dealer
  const handleStartChat = async () => {
    try {
      const chat = await chatService.createChat(dealerId, carId);
      setChatId(chat.id);
    } catch (error) {
      Alert.alert('Error', 'Failed to start chat with dealer');
    }
  };

  // Send chat message
  const handleSendMessage = async (message: string) => {
    if (!chatId || !message.trim()) return;

    try {
      await chatService.sendMessage(chatId, message.trim());
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const formatPrice = (price: number) => `$${price.toLocaleString()}`;
  
  const getPriceChangeColor = (change: number) => {
    if (change > 0) return '#e74c3c';
    if (change < 0) return '#27ae60';
    return '#7f8c8d';
  };

  const getDemandColor = (level: string) => {
    switch (level) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#7f8c8d';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Connection Status */}
      <View style={styles.connectionStatus}>
        <View style={[
          styles.connectionDot,
          { backgroundColor: isConnected ? '#27ae60' : '#e74c3c' }
        ]} />
        <Text style={styles.connectionText}>
          {isConnected ? 'Live' : isReconnecting ? 'Reconnecting...' : 'Offline'}
        </Text>
        {pendingUpdates > 0 && (
          <Text style={styles.pendingText}>({pendingUpdates} pending)</Text>
        )}
      </View>

      {/* Live Price Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Live Price</Text>
          <TouchableOpacity
            style={[styles.trackButton, isTracking && styles.trackButtonActive]}
            onPress={isTracking ? stopTracking : startTracking}
          >
            <Text style={[styles.trackButtonText, isTracking && styles.trackButtonTextActive]}>
              {isTracking ? '📊 Tracking' : '🔔 Track Price'}
            </Text>
          </TouchableOpacity>
        </View>

        {price ? (
          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>{formatPrice(price)}</Text>
            {change24h !== 0 && (
              <Text style={[styles.priceChange, { color: getPriceChangeColor(change24h) }]}>
                {change24h > 0 ? '+' : ''}{formatPrice(change24h)} (24h)
              </Text>
            )}
          </View>
        ) : (
          <ActivityIndicator size="small" color="#3498db" />
        )}

        <TouchableOpacity style={styles.alertButton} onPress={handleCreatePriceAlert}>
          <Text style={styles.alertButtonText}>🎯 Set Price Alert</Text>
        </TouchableOpacity>
      </View>

      {/* Market Insights */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Market Insights</Text>
        
        {averagePrice && (
          <View style={styles.marketRow}>
            <Text style={styles.marketLabel}>Average Price:</Text>
            <Text style={styles.marketValue}>{formatPrice(averagePrice)}</Text>
          </View>
        )}

        {demandLevel && (
          <View style={styles.marketRow}>
            <Text style={styles.marketLabel}>Demand Level:</Text>
            <Text style={[styles.demandLevel, { color: getDemandColor(demandLevel) }]}>
              {demandLevel.toUpperCase()}
            </Text>
          </View>
        )}

        {trends.length > 0 && (
          <View style={styles.trendsContainer}>
            <Text style={styles.trendsTitle}>Recent Trends:</Text>
            {trends.slice(0, 3).map((trend, index) => (
              <Text key={index} style={styles.trendItem}>
                • {trend.description}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Live Inventory */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Inventory</Text>
        
        {inventoryStatus ? (
          <View style={styles.inventoryContainer}>
            <View style={styles.inventoryRow}>
              <Text style={styles.inventoryLabel}>Availability:</Text>
              <Text style={[
                styles.inventoryStatus,
                { color: inventoryStatus.available ? '#27ae60' : '#e74c3c' }
              ]}>
                {inventoryStatus.available ? '✅ Available' : '❌ Out of Stock'}
              </Text>
            </View>
            
            {inventoryStatus.available && (
              <View style={styles.inventoryRow}>
                <Text style={styles.inventoryLabel}>Units Available:</Text>
                <Text style={styles.inventoryCount}>{inventoryStatus.count}</Text>
              </View>
            )}
          </View>
        ) : (
          <Text style={styles.inventoryLoading}>Loading inventory status...</Text>
        )}
      </View>

      {/* Live Chat */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chat with Dealer</Text>
          {chatConnected && (
            <View style={styles.chatStatus}>
              <View style={styles.connectionDot} />
              <Text style={styles.chatStatusText}>Online</Text>
            </View>
          )}
        </View>

        {!chatId ? (
          <TouchableOpacity style={styles.startChatButton} onPress={handleStartChat}>
            <Text style={styles.startChatButtonText}>💬 Start Chat</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.chatContainer}>
            <View style={styles.messagesContainer}>
              {messages.slice(-3).map((message, index) => (
                <View
                  key={index}
                  style={[
                    styles.messageItem,
                    message.sender === 'user' && styles.userMessage
                  ]}
                >
                  <Text style={styles.messageText}>{message.text}</Text>
                  <Text style={styles.messageTime}>
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              ))}
              
              {typingUsers.length > 0 && (
                <Text style={styles.typingIndicator}>
                  {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.sendMessageButton}
              onPress={() => {
                Alert.prompt(
                  'Send Message',
                  'Type your message:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Send',
                      onPress: (message) => {
                        if (message) {
                          handleSendMessage(message);
                        }
                      },
                    },
                  ]
                );
              }}
            >
              <Text style={styles.sendMessageButtonText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
    backgroundColor: '#27ae60',
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  pendingText: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 4,
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
  },
  trackButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3498db',
  },
  trackButtonActive: {
    backgroundColor: '#3498db',
  },
  trackButtonText: {
    fontSize: 12,
    color: '#3498db',
    fontWeight: '600',
  },
  trackButtonTextActive: {
    color: '#ffffff',
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  currentPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2c3e50',
  },
  priceChange: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
  },
  alertButton: {
    backgroundColor: '#f39c12',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  alertButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  marketRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  marketLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  marketValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  demandLevel: {
    fontSize: 14,
    fontWeight: '700',
  },
  trendsContainer: {
    marginTop: 12,
  },
  trendsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  trendItem: {
    fontSize: 13,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  inventoryContainer: {
    marginTop: 8,
  },
  inventoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inventoryLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  inventoryStatus: {
    fontSize: 14,
    fontWeight: '600',
  },
  inventoryCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
  },
  inventoryLoading: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  chatStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatStatusText: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '600',
  },
  startChatButton: {
    backgroundColor: '#27ae60',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  startChatButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
  chatContainer: {
    marginTop: 8,
  },
  messagesContainer: {
    maxHeight: 200,
    marginBottom: 12,
  },
  messageItem: {
    backgroundColor: '#ecf0f1',
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#3498db',
    alignSelf: 'flex-end',
  },
  messageText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  messageTime: {
    fontSize: 10,
    color: '#7f8c8d',
    marginTop: 4,
  },
  typingIndicator: {
    fontSize: 12,
    color: '#7f8c8d',
    fontStyle: 'italic',
  },
  sendMessageButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  sendMessageButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});
