/**
 * Price Alert Modal - Core Business Feature
 *
 * Modal for users to set up price alerts on cars they're interested in.
 * Key for user retention and conversion.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ModernButton } from '@/components/ui/ModernButton';
import { useThemeColors } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';
import { X, Bell, DollarSign, Star } from '@/utils/ultra-optimized-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { priceTrackingService } from '@/services/PriceTrackingService';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

const { width } = Dimensions.get('window');

interface PriceAlertModalProps {
  visible: boolean;
  onClose: () => void;
  car: {
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    image?: string;
  };
}

export function PriceAlertModal({
  visible,
  onClose,
  car,
}: PriceAlertModalProps) {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const [targetPrice, setTargetPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [priceTrend, setPriceTrend] = useState<any>(null);
  const [marketInsights, setMarketInsights] = useState<any>(null);

  const styles = getStyles(colors);
  const carTitle = `${car.year} ${car.make} ${car.model}`;

  // Load price insights when modal opens
  useEffect(() => {
    if (visible && car.id) {
      loadPriceInsights();
    }
  }, [visible, car.id]);

  const loadPriceInsights = async () => {
    try {
      const [trend, insights] = await Promise.all([
        priceTrackingService.getCarPriceTrend(car.id),
        priceTrackingService.getMarketInsights(car.id),
      ]);
      setPriceTrend(trend);
      setMarketInsights(insights);
    } catch (error) {
      logger.warn('Failed to load price insights', error);
    }
  };

  const handleCreateAlert = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to set up price alerts.');
      return;
    }

    const target = parseFloat(targetPrice);
    if (!target || target <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid target price.');
      return;
    }

    if (target >= car.price) {
      Alert.alert(
        'Price Too High',
        'Target price should be lower than the current price for a price drop alert.',
      );
      return;
    }

    setLoading(true);

    try {
      await priceTrackingService.createPriceAlert(user.id, car.id, target, {
        make: car.make,
        model: car.model,
        year: car.year,
        currentPrice: car.price,
      });

      Alert.alert(
        'Alert Created!',
        `We'll notify you when the ${carTitle} drops to $${target.toLocaleString()} or below.`,
        [{ text: 'OK', onPress: onClose }],
      );

      setTargetPrice('');
    } catch (error) {
      logger.error('Failed to create price alert', error);
      Alert.alert('Error', 'Failed to create price alert. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedPrices = () => {
    const currentPrice = car.price;
    return [
      { label: '5% off', price: Math.round(currentPrice * 0.95) },
      { label: '10% off', price: Math.round(currentPrice * 0.9) },
      { label: '15% off', price: Math.round(currentPrice * 0.85) },
    ];
  };

  const getPriceTrendIcon = () => {
    if (!priceTrend) return null;

    switch (priceTrend.trend) {
      case 'down':
        return (
          <MaterialCommunityIcons
            name="trending-down"
            color={colors.success}
            size={16}
          />
        );
      case 'up':
        return (
          <MaterialCommunityIcons
            name="trending-up"
            color={colors.error}
            size={16}
          />
        );
      default:
        return <DollarSign color={colors.textSecondary} size={16} />;
    }
  };

  const getPriceTrendText = () => {
    if (!priceTrend) return 'Loading trend...';

    const changeText = priceTrend.changePercent.toFixed(1);
    switch (priceTrend.trend) {
      case 'down':
        return `Price dropped ${changeText}% recently`;
      case 'up':
        return `Price increased ${changeText}% recently`;
      default:
        return 'Price has been stable';
    }
  };

  const getRecommendationColor = () => {
    if (!marketInsights) return colors.textSecondary;

    switch (marketInsights.recommendation) {
      case 'good_deal':
        return colors.success;
      case 'overpriced':
        return colors.error;
      default:
        return colors.warning;
    }
  };

  const getRecommendationText = () => {
    if (!marketInsights) return 'Analyzing market...';

    switch (marketInsights.recommendation) {
      case 'good_deal':
        return 'Great deal compared to market average';
      case 'overpriced':
        return 'Above market average price';
      default:
        return 'Fair market price';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Price Alert</Text>
            <Text style={styles.headerSubtitle}>{carTitle}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color={colors.textSecondary} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Current Price */}
          <View style={styles.currentPriceCard}>
            <Text style={styles.currentPriceLabel}>Current Price</Text>
            <Text style={styles.currentPrice}>
              ${car.price.toLocaleString()}
            </Text>

            {/* Price Trend */}
            <View style={styles.priceTrend}>
              {getPriceTrendIcon()}
              <Text style={styles.priceTrendText}>{getPriceTrendText()}</Text>
            </View>
          </View>

          {/* Market Insights */}
          {marketInsights && (
            <View style={styles.marketInsightsCard}>
              <Text style={styles.sectionTitle}>Market Insights</Text>
              <View style={styles.marketInsight}>
                <View style={styles.marketInsightLeft}>
                  <Star color={getRecommendationColor()} size={16} />
                  <Text
                    style={[
                      styles.marketInsightText,
                      { color: getRecommendationColor() },
                    ]}
                  >
                    {getRecommendationText()}
                  </Text>
                </View>
              </View>
              <View style={styles.marketStats}>
                <View style={styles.marketStat}>
                  <Text style={styles.marketStatValue}>
                    ${marketInsights.averagePrice.toLocaleString()}
                  </Text>
                  <Text style={styles.marketStatLabel}>Market Avg</Text>
                </View>
                <View style={styles.marketStat}>
                  <Text style={styles.marketStatValue}>
                    {marketInsights.totalListings}
                  </Text>
                  <Text style={styles.marketStatLabel}>Similar Cars</Text>
                </View>
              </View>
            </View>
          )}

          {/* Target Price Input */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Set Target Price</Text>
            <Text style={styles.sectionDescription}>
              We'll notify you when the price drops to your target or below.
            </Text>

            <View style={styles.priceInputContainer}>
              <Text style={styles.priceInputPrefix}>$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Enter target price"
                placeholderTextColor={colors.textMuted}
                value={targetPrice}
                onChangeText={setTargetPrice}
                keyboardType="numeric"
                returnKeyType="done"
              />
            </View>

            {/* Suggested Prices */}
            <View style={styles.suggestedPrices}>
              <Text style={styles.suggestedPricesLabel}>Quick options:</Text>
              <View style={styles.suggestedPricesRow}>
                {getSuggestedPrices().map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion.label}
                    style={styles.suggestedPrice}
                    onPress={() => setTargetPrice(suggestion.price.toString())}
                  >
                    <Text style={styles.suggestedPriceLabel}>
                      {suggestion.label}
                    </Text>
                    <Text style={styles.suggestedPriceValue}>
                      ${suggestion.price.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* How It Works */}
          <View style={styles.howItWorksCard}>
            <View style={styles.howItWorksHeader}>
              <Bell color={colors.primary} size={20} />
              <Text style={styles.howItWorksTitle}>How Price Alerts Work</Text>
            </View>
            <View style={styles.howItWorksSteps}>
              <Text style={styles.howItWorksStep}>
                • We monitor the price daily
              </Text>
              <Text style={styles.howItWorksStep}>
                • Get notified instantly when price drops
              </Text>
              <Text style={styles.howItWorksStep}>
                • Contact the dealer immediately
              </Text>
              <Text style={styles.howItWorksStep}>
                • Cancel anytime from your alerts
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <ModernButton
            title="Create Price Alert"
            onPress={handleCreateAlert}
            loading={loading}
            disabled={loading || !targetPrice}
            variant="primary"
            icon={<Bell color={colors.white} size={18} />}
            style={styles.createButton}
          />
        </View>
      </View>
    </Modal>
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
      paddingTop: Platform.OS === 'ios' ? 60 : Spacing.lg,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      ...Typography.title,
      color: colors.text,
      marginBottom: 4,
    },
    headerSubtitle: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    closeButton: {
      padding: Spacing.sm,
    },
    content: {
      flex: 1,
      paddingHorizontal: Spacing.lg,
    },
    currentPriceCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginVertical: Spacing.md,
      alignItems: 'center',
      ...Shadows.sm,
    },
    currentPriceLabel: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    currentPrice: {
      ...Typography.heading,
      color: colors.primary,
      fontWeight: '700',
      marginBottom: Spacing.sm,
    },
    priceTrend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    priceTrendText: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    marketInsightsCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
      ...Shadows.sm,
    },
    marketInsight: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.md,
    },
    marketInsightLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    marketInsightText: {
      ...Typography.body,
      fontWeight: '500',
    },
    marketStats: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    marketStat: {
      alignItems: 'center',
    },
    marketStatValue: {
      ...Typography.subtitle,
      color: colors.text,
      fontWeight: '600',
    },
    marketStatLabel: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    section: {
      marginVertical: Spacing.md,
    },
    sectionTitle: {
      ...Typography.subtitle,
      color: colors.text,
      marginBottom: Spacing.sm,
    },
    sectionDescription: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginBottom: Spacing.lg,
    },
    priceInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      paddingHorizontal: Spacing.md,
      backgroundColor: colors.white,
    },
    priceInputPrefix: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    priceInput: {
      flex: 1,
      paddingVertical: Spacing.md,
      paddingLeft: Spacing.xs,
      ...Typography.body,
      color: colors.text,
    },
    suggestedPrices: {
      marginTop: Spacing.lg,
    },
    suggestedPricesLabel: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    suggestedPricesRow: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    suggestedPrice: {
      flex: 1,
      backgroundColor: colors.neutral100,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      alignItems: 'center',
    },
    suggestedPriceLabel: {
      ...Typography.caption,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    suggestedPriceValue: {
      ...Typography.body,
      color: colors.text,
      fontWeight: '600',
    },
    howItWorksCard: {
      backgroundColor: colors.primaryLight,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      marginVertical: Spacing.md,
    },
    howItWorksHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    howItWorksTitle: {
      ...Typography.subtitle,
      color: colors.text,
      fontWeight: '600',
    },
    howItWorksSteps: {
      gap: Spacing.xs,
    },
    howItWorksStep: {
      ...Typography.caption,
      color: colors.textSecondary,
    },
    footer: {
      padding: Spacing.lg,
      paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    createButton: {
      width: '100%',
    },
  });
