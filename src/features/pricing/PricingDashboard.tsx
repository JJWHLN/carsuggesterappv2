import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  TrendingUp,
  Bell,
  Star,
  Activity,
} from 'lucide-react-native';
import { PriceHistory } from './PriceHistory';
import { MarketInsights } from './MarketInsights';
import { DealRating } from './DealRating';
import { PriceAlerts } from './PriceAlerts';
import { fetchPriceHistory } from './api';

interface PricingDashboardProps {
  carId: string;
  make: string;
  model: string;
  year: number;
  currentPrice: number;
}

type ActiveView = 'overview' | 'history' | 'insights' | 'rating' | 'alerts';

export const PricingDashboard: React.FC<PricingDashboardProps> = ({
  carId,
  make,
  model,
  year,
  currentPrice,
}) => {
  const [activeView, setActiveView] = useState<ActiveView>('overview');

  const { data: priceData, isLoading } = useQuery(
    ['pricingDashboard', carId],
    () => fetchPriceHistory(carId),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
    },
  );

  const TabButton: React.FC<{
    view: ActiveView;
    label: string;
    icon: React.ComponentType<any>;
    badge?: string;
  }> = ({ view, label, icon: IconComponent, badge }) => (
    <TouchableOpacity
      onPress={() => setActiveView(view)}
      className={`flex-1 py-3 px-2 items-center border-b-2 ${
        activeView === view ? 'border-blue-500' : 'border-gray-200'
      }`}
    >
      <View className="relative">
        <IconComponent
          size={20}
          className={activeView === view ? 'text-blue-600' : 'text-gray-600'}
        />
        {badge && (
          <View className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full items-center justify-center">
            <Text className="text-white text-xs font-bold">{badge}</Text>
          </View>
        )}
      </View>
      <Text
        className={`text-xs mt-1 ${
          activeView === view ? 'text-blue-600' : 'text-gray-600'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Activity size={48} className="text-gray-400 mb-4" />
        <Text className="text-gray-600">Loading pricing data...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-4">
        <Text className="text-2xl font-bold text-gray-900 mb-1">
          Pricing Analysis
        </Text>
        <Text className="text-gray-600">
          {year} {make} {model}
        </Text>
      </View>

      {/* Navigation Tabs */}
      <View className="bg-white border-b border-gray-200">
        <View className="flex-row">
          <TabButton view="overview" label="Overview" icon={Activity} />
          <TabButton view="history" label="History" icon={BarChart3} />
          <TabButton view="insights" label="Market" icon={TrendingUp} />
          <TabButton view="rating" label="Deal" icon={Star} />
          <TabButton view="alerts" label="Alerts" icon={Bell} badge="2" />
        </View>
      </View>

      {/* Content */}
      <View className="flex-1">
        {activeView === 'overview' && priceData && (
          <ScrollView className="flex-1">
            {/* Quick Stats */}
            <View className="p-4">
              <View className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm mb-4">
                <Text className="text-lg font-semibold text-gray-900 mb-4">
                  Price Summary
                </Text>

                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-gray-600">Current Price</Text>
                  <Text className="text-2xl font-bold text-gray-900">
                    ${currentPrice.toLocaleString()}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-gray-600">Market Average</Text>
                  <Text className="text-lg font-semibold text-gray-700">
                    ${priceData.data.marketAverage.toLocaleString()}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600">30-Day Change</Text>
                  <Text
                    className={`font-semibold ${
                      priceData.data.priceChange30d >= 0
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}
                  >
                    {priceData.data.priceChange30d >= 0 ? '+' : ''}$
                    {priceData.data.priceChange30d.toLocaleString()}(
                    {priceData.data.priceChangePercent30d.toFixed(1)}%)
                  </Text>
                </View>
              </View>

              {/* Deal Rating Preview */}
              <View className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-lg font-semibold text-gray-900">
                    Deal Rating
                  </Text>
                  <TouchableOpacity
                    onPress={() => setActiveView('rating')}
                    className="px-3 py-1 bg-blue-100 rounded-full"
                  >
                    <Text className="text-blue-600 text-sm font-medium">
                      View Details
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center">
                  <View
                    className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
                      priceData.dealRating.rating === 'Great'
                        ? 'bg-green-100'
                        : priceData.dealRating.rating === 'Good'
                          ? 'bg-blue-100'
                          : priceData.dealRating.rating === 'Fair'
                            ? 'bg-yellow-100'
                            : 'bg-red-100'
                    }`}
                  >
                    <Text
                      className={`font-bold ${
                        priceData.dealRating.rating === 'Great'
                          ? 'text-green-600'
                          : priceData.dealRating.rating === 'Good'
                            ? 'text-blue-600'
                            : priceData.dealRating.rating === 'Fair'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                      }`}
                    >
                      {priceData.dealRating.score}
                    </Text>
                  </View>
                  <View>
                    <Text className="font-bold text-gray-900">
                      {priceData.dealRating.rating} Deal
                    </Text>
                    <Text className="text-sm text-gray-600">
                      {priceData.dealRating.recommendation}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Market Insights Preview */}
              <View className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-lg font-semibold text-gray-900">
                    Market Snapshot
                  </Text>
                  <TouchableOpacity
                    onPress={() => setActiveView('insights')}
                    className="px-3 py-1 bg-blue-100 rounded-full"
                  >
                    <Text className="text-blue-600 text-sm font-medium">
                      View All
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="space-y-3">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-600">Available Listings</Text>
                    <Text className="font-semibold text-gray-900">
                      {priceData.insights.supply.totalListings}
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-600">Avg. Days on Market</Text>
                    <Text className="font-semibold text-gray-900">
                      {priceData.insights.supply.averageDaysOnMarket} days
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-600">Demand Level</Text>
                    <View
                      className={`px-3 py-1 rounded-full ${
                        priceData.insights.demand.demandTrend === 'high'
                          ? 'bg-red-100'
                          : priceData.insights.demand.demandTrend === 'medium'
                            ? 'bg-yellow-100'
                            : 'bg-green-100'
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          priceData.insights.demand.demandTrend === 'high'
                            ? 'text-red-700'
                            : priceData.insights.demand.demandTrend === 'medium'
                              ? 'text-yellow-700'
                              : 'text-green-700'
                        }`}
                      >
                        {priceData.insights.demand.demandTrend.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        )}

        {activeView === 'history' && (
          <PriceHistory carId={carId} make={make} model={model} year={year} />
        )}

        {activeView === 'insights' && priceData && (
          <MarketInsights
            insights={priceData.insights}
            similarCars={priceData.similarCars}
          />
        )}

        {activeView === 'rating' && priceData && (
          <ScrollView>
            <DealRating
              dealRating={priceData.dealRating}
              currentPrice={currentPrice}
              marketAverage={priceData.data.marketAverage}
              onLearnMore={() => {
                // Handle learn more action
                console.log('Learn more about deal rating');
              }}
            />
          </ScrollView>
        )}

        {activeView === 'alerts' && (
          <PriceAlerts carId={carId} currentPrice={currentPrice} />
        )}
      </View>
    </View>
  );
};

// Export for use in other parts of the app
export default PricingDashboard;
