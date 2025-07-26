import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { LineChart, BarChart } from 'react-native-chart-kit';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  MapPin,
  Users,
  Clock,
  Zap,
  AlertCircle,
  Eye,
  Search,
  ShoppingCart,
} from 'lucide-react-native';
import { fetchMarketAnalysis } from './api';
import {
  MarketInsights as MarketInsightsType,
  SimilarCarPricing,
} from './types';
import { formatCurrency } from '../../../utils/formatters';

interface MarketInsightsProps {
  insights: MarketInsightsType;
  similarCars: SimilarCarPricing[];
}

interface InsightCardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon: React.ComponentType<any>;
  color?: string;
  subtitle?: string;
}

const { width } = Dimensions.get('window');

const InsightCard: React.FC<InsightCardProps> = ({
  title,
  value,
  change,
  trend,
  icon: IconComponent,
  color = 'bg-blue-500',
  subtitle,
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return TrendingUp;
      case 'down':
        return TrendingDown;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const TrendIcon = getTrendIcon();

  return (
    <View className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <View className="flex-row items-center justify-between mb-3">
        <View
          className={`w-12 h-12 ${color} rounded-lg items-center justify-center`}
        >
          <IconComponent size={24} className="text-white" />
        </View>
        {change !== undefined && TrendIcon && (
          <View className="flex-row items-center">
            <TrendIcon size={16} className={getTrendColor()} />
            <Text className={`ml-1 text-sm font-medium ${getTrendColor()}`}>
              {Math.abs(change)}%
            </Text>
          </View>
        )}
      </View>

      <Text className="text-2xl font-bold text-gray-900 mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Text>
      <Text className="text-gray-600 text-sm mb-1">{title}</Text>
      {subtitle && <Text className="text-gray-500 text-xs">{subtitle}</Text>}
    </View>
  );
};

interface SimilarCarCardProps {
  car: SimilarCarPricing;
  basePrice: number;
}

const SimilarCarCard: React.FC<SimilarCarCardProps> = ({ car, basePrice }) => {
  const priceDiff = car.car.price - basePrice;
  const isHigher = priceDiff > 0;

  return (
    <View
      className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm mr-4"
      style={{ width: 280 }}
    >
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <Text className="font-bold text-gray-900 text-lg" numberOfLines={1}>
            {car.car.year} {car.car.make} {car.car.model}
          </Text>
          <Text className="text-gray-600 text-sm">
            {car.car.mileage.toLocaleString()} miles
          </Text>
        </View>
        <View
          className={`px-2 py-1 rounded-full ${
            car.similarity > 0.8 ? 'bg-green-100' : 'bg-yellow-100'
          }`}
        >
          <Text
            className={`text-xs font-medium ${
              car.similarity > 0.8 ? 'text-green-700' : 'text-yellow-700'
            }`}
          >
            {Math.round(car.similarity * 100)}% match
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-xl font-bold text-gray-900">
          {formatCurrency(car.car.price)}
        </Text>
        <View className="flex-row items-center">
          {isHigher ? (
            <TrendingUp size={16} className="text-red-600 mr-1" />
          ) : (
            <TrendingDown size={16} className="text-green-600 mr-1" />
          )}
          <Text
            className={`font-medium ${isHigher ? 'text-red-600' : 'text-green-600'}`}
          >
            {isHigher ? '+' : ''}
            {formatCurrency(priceDiff)}
          </Text>
        </View>
      </View>

      <View className="flex-row flex-wrap gap-1">
        {car.factors.slice(0, 3).map((factor, index) => (
          <View key={index} className="bg-gray-100 px-2 py-1 rounded">
            <Text className="text-xs text-gray-600">{factor}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export const MarketInsights: React.FC<MarketInsightsProps> = ({
  insights,
  similarCars,
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'trends' | 'regional'
  >('overview');

  const { data: marketAnalysis, isLoading } = useQuery(
    ['marketAnalysis', insights.regional.region],
    () => fetchMarketAnalysis(insights.regional.region),
    {
      staleTime: 10 * 60 * 1000, // 10 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
    },
  );

  const supplyTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        data: [120, 135, 148, 142, 156, insights.supply.totalListings],
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

  const demandData = {
    labels: ['Search', 'Inquiries', 'Sales'],
    datasets: [
      {
        data: [
          insights.demand.searchVolume / 10, // Scale down for visualization
          insights.demand.inquiryRate * 1000,
          100 - insights.demand.saleSpeed, // Invert sale speed for better viz
        ],
        colors: [
          (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
          (opacity = 1) => `rgba(168, 85, 247, ${opacity})`,
          (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
        ],
      },
    ],
  };

  const TabButton: React.FC<{ tab: typeof activeTab; label: string }> = ({
    tab,
    label,
  }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      className={`flex-1 py-3 border-b-2 ${
        activeTab === tab ? 'border-blue-500' : 'border-gray-200'
      }`}
    >
      <Text
        className={`text-center font-medium ${
          activeTab === tab ? 'text-blue-600' : 'text-gray-600'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-4">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Market Insights
        </Text>
        <View className="flex-row items-center">
          <MapPin size={16} className="text-gray-500 mr-1" />
          <Text className="text-gray-600">{insights.regional.region}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View className="bg-white border-b border-gray-200">
        <View className="flex-row">
          <TabButton tab="overview" label="Overview" />
          <TabButton tab="trends" label="Trends" />
          <TabButton tab="regional" label="Regional" />
        </View>
      </View>

      {activeTab === 'overview' && (
        <View className="p-4">
          {/* Key Metrics */}
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Market Overview
          </Text>

          <View className="flex-row mb-4">
            <View className="flex-1 mr-2">
              <InsightCard
                title="Total Listings"
                value={insights.supply.totalListings}
                change={5.2}
                trend="up"
                icon={ShoppingCart}
                color="bg-blue-500"
                subtitle="Active inventory"
              />
            </View>
            <View className="flex-1 ml-2">
              <InsightCard
                title="Avg. Days on Market"
                value={`${insights.supply.averageDaysOnMarket} days`}
                change={-8.1}
                trend="down"
                icon={Clock}
                color="bg-green-500"
                subtitle="Time to sell"
              />
            </View>
          </View>

          <View className="flex-row mb-6">
            <View className="flex-1 mr-2">
              <InsightCard
                title="Search Volume"
                value={insights.demand.searchVolume}
                change={12.3}
                trend="up"
                icon={Search}
                color="bg-purple-500"
                subtitle="Monthly searches"
              />
            </View>
            <View className="flex-1 ml-2">
              <InsightCard
                title="Inquiry Rate"
                value={`${(insights.demand.inquiryRate * 100).toFixed(1)}%`}
                change={-2.4}
                trend="down"
                icon={Eye}
                color="bg-orange-500"
                subtitle="Buyer interest"
              />
            </View>
          </View>

          {/* Market Condition */}
          {marketAnalysis && (
            <View className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Current Market Condition
              </Text>

              <View
                className={`p-4 rounded-lg mb-4 ${
                  marketAnalysis.marketCondition.type === 'buyers'
                    ? 'bg-green-50 border border-green-200'
                    : marketAnalysis.marketCondition.type === 'sellers'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-yellow-50 border border-yellow-200'
                }`}
              >
                <View className="flex-row items-center mb-2">
                  <Users
                    size={20}
                    className={
                      marketAnalysis.marketCondition.type === 'buyers'
                        ? 'text-green-600'
                        : marketAnalysis.marketCondition.type === 'sellers'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                    }
                  />
                  <Text
                    className={`ml-2 font-bold text-lg ${
                      marketAnalysis.marketCondition.type === 'buyers'
                        ? 'text-green-900'
                        : marketAnalysis.marketCondition.type === 'sellers'
                          ? 'text-red-900'
                          : 'text-yellow-900'
                    }`}
                  >
                    {marketAnalysis.marketCondition.type === 'buyers'
                      ? "Buyer's Market"
                      : marketAnalysis.marketCondition.type === 'sellers'
                        ? "Seller's Market"
                        : 'Balanced Market'}
                  </Text>
                </View>
                <Text
                  className={`text-sm ${
                    marketAnalysis.marketCondition.type === 'buyers'
                      ? 'text-green-800'
                      : marketAnalysis.marketCondition.type === 'sellers'
                        ? 'text-red-800'
                        : 'text-yellow-800'
                  }`}
                >
                  Strength:{' '}
                  {Math.round(marketAnalysis.marketCondition.strength * 100)}%
                </Text>
              </View>

              <View className="space-y-2">
                {marketAnalysis.recommendations.map((recommendation, index) => (
                  <View key={index} className="flex-row items-start">
                    <AlertCircle
                      size={16}
                      className="text-blue-600 mr-2 mt-0.5"
                    />
                    <Text className="text-gray-700 flex-1">
                      {recommendation}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Similar Cars */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Similar Cars in Market
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {similarCars.map((car, index) => (
                <SimilarCarCard
                  key={index}
                  car={car}
                  basePrice={insights.supply.totalListings > 0 ? 25000 : 0} // Mock base price
                />
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {activeTab === 'trends' && (
        <View className="p-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Market Trends
          </Text>

          {/* Supply Trend Chart */}
          <View className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
            <Text className="font-semibold text-gray-900 mb-4">
              Inventory Levels
            </Text>
            <LineChart
              data={supplyTrendData}
              width={width - 64}
              height={200}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
                style: { borderRadius: 16 },
                propsForDots: { r: '4', strokeWidth: '2', stroke: '#3B82F6' },
              }}
              bezier
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
          </View>

          {/* Demand Chart */}
          <View className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
            <Text className="font-semibold text-gray-900 mb-4">
              Demand Indicators
            </Text>
            <BarChart
              data={demandData}
              width={width - 64}
              height={200}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
                style: { borderRadius: 16 },
              }}
              style={{ marginVertical: 8, borderRadius: 16 }}
            />
          </View>

          {/* Seasonality Info */}
          <View className="bg-white rounded-lg p-4 border border-gray-200">
            <Text className="font-semibold text-gray-900 mb-4">
              Seasonal Patterns
            </Text>

            <View className="space-y-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Best Month to Buy</Text>
                <Text className="font-semibold text-green-600">
                  {insights.seasonality.bestMonthToBuy}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Worst Month to Buy</Text>
                <Text className="font-semibold text-red-600">
                  {insights.seasonality.worstMonthToBuy}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Seasonal Discount</Text>
                <Text className="font-semibold text-blue-600">
                  {insights.seasonality.seasonalDiscount}%
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Current Impact</Text>
                <Text
                  className={`font-semibold ${
                    insights.seasonality.currentSeasonImpact < 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {insights.seasonality.currentSeasonImpact > 0 ? '+' : ''}
                  {insights.seasonality.currentSeasonImpact}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {activeTab === 'regional' && (
        <View className="p-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Regional Analysis
          </Text>

          {/* Regional Score */}
          <View className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
            <Text className="font-semibold text-gray-900 mb-4">
              Market Score
            </Text>

            <View className="items-center mb-4">
              <View className="w-32 h-32 rounded-full border-8 border-gray-200 items-center justify-center relative">
                <Text className="text-3xl font-bold text-gray-900">
                  {Math.round(insights.regional.regionScore * 100)}
                </Text>
                <Text className="text-sm text-gray-600">/ 100</Text>
                <View
                  className="absolute inset-0 rounded-full border-8 border-blue-500"
                  style={{
                    transform: [
                      { rotate: `${insights.regional.regionScore * 360}deg` },
                    ],
                    borderTopColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderBottomColor:
                      insights.regional.regionScore > 0.5
                        ? undefined
                        : 'transparent',
                  }}
                />
              </View>
            </View>

            <Text className="text-center text-gray-600 mb-4">
              Market competitiveness score for {insights.regional.region}
            </Text>
          </View>

          {/* Price Variation */}
          <View className="bg-white rounded-lg p-4 border border-gray-200 mb-6">
            <Text className="font-semibold text-gray-900 mb-4">
              Price Variation
            </Text>

            <View className="flex-row items-center justify-between">
              <Text className="text-gray-600">Regional Price Spread</Text>
              <Text className="text-2xl font-bold text-gray-900">
                ±{insights.regional.priceVariation}%
              </Text>
            </View>

            <Text className="text-sm text-gray-500 mt-2">
              Prices vary by this amount across the region
            </Text>
          </View>

          {/* Competitive Markets */}
          <View className="bg-white rounded-lg p-4 border border-gray-200">
            <Text className="font-semibold text-gray-900 mb-4">
              Competitive Markets
            </Text>

            <View className="space-y-3">
              {insights.regional.competitiveMarkets.map((market, index) => (
                <View
                  key={index}
                  className="flex-row items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <View className="flex-row items-center">
                    <MapPin size={16} className="text-gray-500 mr-2" />
                    <Text className="font-medium text-gray-900">{market}</Text>
                  </View>
                  <TouchableOpacity className="px-3 py-1 bg-blue-100 rounded-full">
                    <Text className="text-blue-600 text-sm">Compare</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};
