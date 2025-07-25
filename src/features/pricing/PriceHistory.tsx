import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useQuery } from 'react-query';
import { LineChart } from 'react-native-chart-kit';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign,
  BarChart3,
  Info,
  Clock
} from 'lucide-react-native';
import { fetchPriceHistory, fetchDepreciationData } from './api';
import { PriceHistory as PriceHistoryType, DepreciationData } from './types';
import { formatCurrency } from '../../../utils/formatters';

interface PriceHistoryProps {
  carId: string;
  make: string;
  model: string;
  year: number;
}

type TimeRange = '1M' | '3M' | '6M' | '1Y' | 'ALL';

const { width } = Dimensions.get('window');

export const PriceHistory: React.FC<PriceHistoryProps> = ({ 
  carId, 
  make, 
  model, 
  year 
}) => {
  const [activeTab, setActiveTab] = useState<'history' | 'depreciation'>('history');
  const [timeRange, setTimeRange] = useState<TimeRange>('6M');

  const { data: priceData, isLoading: isPriceLoading, error: priceError } = useQuery(
    ['priceHistory', carId],
    () => fetchPriceHistory(carId),
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
    }
  );

  const { data: depreciationData, isLoading: isDepreciationLoading } = useQuery(
    ['depreciation', make, model, year],
    () => fetchDepreciationData(make, model, year),
    {
      staleTime: 60 * 60 * 1000, // 1 hour
      cacheTime: 24 * 60 * 60 * 1000, // 24 hours
    }
  );

  const filteredPriceData = useMemo(() => {
    if (!priceData?.data.pricePoints) return [];
    
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '1M':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'ALL':
        return priceData.data.pricePoints.map(point => ({
          ...point,
          formattedDate: new Date(point.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          })
        }));
    }
    
    return priceData.data.pricePoints
      .filter(point => new Date(point.date) >= startDate)
      .map(point => ({
        ...point,
        formattedDate: new Date(point.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      }));
  }, [priceData, timeRange]);

  const priceStats = useMemo(() => {
    if (!priceData?.data) return null;
    
    const data = priceData.data;
    const changeColor30d = data.priceChange30d >= 0 ? 'text-green-600' : 'text-red-600';
    const changeColor90d = data.priceChange90d >= 0 ? 'text-green-600' : 'text-red-600';
    
    return {
      current: data.currentPrice,
      marketAverage: data.marketAverage,
      change30d: data.priceChange30d,
      changePercent30d: data.priceChangePercent30d,
      change90d: data.priceChange90d,
      changePercent90d: data.priceChangePercent90d,
      changeColor30d,
      changeColor90d,
      vsMarket: data.currentPrice - data.marketAverage,
      vsMarketPercent: ((data.currentPrice - data.marketAverage) / data.marketAverage) * 100
    };
  }, [priceData]);

  const TimeRangeButton: React.FC<{ range: TimeRange; label: string }> = ({ range, label }) => (
    <TouchableOpacity
      onPress={() => setTimeRange(range)}
      className={`px-3 py-2 rounded-lg ${
        timeRange === range ? 'bg-blue-500' : 'bg-gray-200'
      }`}
    >
      <Text className={`text-sm font-medium ${
        timeRange === range ? 'text-white' : 'text-gray-700'
      }`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const TabButton: React.FC<{ tab: 'history' | 'depreciation'; label: string }> = ({ tab, label }) => (
    <TouchableOpacity
      onPress={() => setActiveTab(tab)}
      className={`flex-1 py-3 border-b-2 ${
        activeTab === tab ? 'border-blue-500' : 'border-gray-200'
      }`}
    >
      <Text className={`text-center font-medium ${
        activeTab === tab ? 'text-blue-600' : 'text-gray-600'
      }`}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  if (isPriceLoading || isDepreciationLoading) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <BarChart3 size={48} className="text-gray-400 mb-4" />
        <Text className="text-gray-600">Loading price data...</Text>
      </View>
    );
  }

  if (priceError) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Info size={48} className="text-red-400 mb-4" />
        <Text className="text-red-600 text-center">
          Failed to load price data. Please try again.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-4">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Price History
        </Text>
        <Text className="text-gray-600">
          {year} {make} {model}
        </Text>
      </View>

      {/* Tabs */}
      <View className="bg-white border-b border-gray-200">
        <View className="flex-row">
          <TabButton tab="history" label="Price History" />
          <TabButton tab="depreciation" label="Depreciation" />
        </View>
      </View>

      {activeTab === 'history' && (
        <>
          {/* Price Stats */}
          {priceStats && (
            <View className="bg-white border-b border-gray-200 p-4">
              <View className="flex-row justify-between items-center mb-4">
                <View>
                  <Text className="text-sm text-gray-600">Current Price</Text>
                  <Text className="text-2xl font-bold text-gray-900">
                    {formatCurrency(priceStats.current)}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-sm text-gray-600">vs Market Average</Text>
                  <Text className={`text-lg font-semibold ${
                    priceStats.vsMarket < 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {priceStats.vsMarket < 0 ? '-' : '+'}
                    {formatCurrency(Math.abs(priceStats.vsMarket))}
                  </Text>
                </View>
              </View>

              <View className="flex-row justify-between">
                <View className="flex-1 mr-4">
                  <Text className="text-sm text-gray-600 mb-1">30 Day Change</Text>
                  <View className="flex-row items-center">
                    {priceStats.change30d >= 0 ? (
                      <TrendingUp size={16} className="text-green-600 mr-1" />
                    ) : (
                      <TrendingDown size={16} className="text-red-600 mr-1" />
                    )}
                    <Text className={`font-semibold ${priceStats.changeColor30d}`}>
                      {formatCurrency(Math.abs(priceStats.change30d))} 
                      ({priceStats.changePercent30d.toFixed(1)}%)
                    </Text>
                  </View>
                </View>

                <View className="flex-1">
                  <Text className="text-sm text-gray-600 mb-1">90 Day Change</Text>
                  <View className="flex-row items-center">
                    {priceStats.change90d >= 0 ? (
                      <TrendingUp size={16} className="text-green-600 mr-1" />
                    ) : (
                      <TrendingDown size={16} className="text-red-600 mr-1" />
                    )}
                    <Text className={`font-semibold ${priceStats.changeColor90d}`}>
                      {formatCurrency(Math.abs(priceStats.change90d))} 
                      ({priceStats.changePercent90d.toFixed(1)}%)
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Time Range Selector */}
          <View className="bg-white border-b border-gray-200 px-4 py-3">
            <View className="flex-row space-x-2">
              <TimeRangeButton range="1M" label="1M" />
              <TimeRangeButton range="3M" label="3M" />
              <TimeRangeButton range="6M" label="6M" />
              <TimeRangeButton range="1Y" label="1Y" />
              <TimeRangeButton range="ALL" label="ALL" />
            </View>
          </View>

          {/* Price Chart */}
          <View className="bg-white p-4">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Price Trend
            </Text>
            
            <View style={{ height: 250 }}>
              <LineChart
                data={{
                  labels: filteredPriceData.map(point => point.formattedDate).slice(-6), // Last 6 points
                  datasets: [
                    {
                      data: filteredPriceData.map(point => point.price).slice(-6),
                      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Blue
                      strokeWidth: 2
                    },
                    ...(priceStats ? [{
                      data: Array(Math.min(6, filteredPriceData.length)).fill(priceStats.marketAverage),
                      color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, // Red
                      strokeWidth: 1,
                      withDots: false
                    }] : [])
                  ]
                }}
                width={width - 32} // Screen width minus padding
                height={220}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#ffffff',
                  backgroundGradientTo: '#ffffff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: '#3B82F6'
                  },
                  formatYLabel: (value) => `$${(Number(value) / 1000).toFixed(0)}k`
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16
                }}
              />
            </View>

            <View className="flex-row items-center justify-center mt-4 space-x-6">
              <View className="flex-row items-center">
                <View className="w-4 h-0.5 bg-blue-500 mr-2" />
                <Text className="text-sm text-gray-600">Actual Price</Text>
              </View>
              <View className="flex-row items-center">
                <View className="w-4 h-0.5 bg-red-500 mr-2" style={{ borderStyle: 'dashed' }} />
                <Text className="text-sm text-gray-600">Market Average</Text>
              </View>
            </View>
          </View>

          {/* Market Insights Preview */}
          {priceData?.insights && (
            <View className="bg-white mt-4 p-4">
              <Text className="text-lg font-semibold text-gray-900 mb-4">
                Market Context
              </Text>
              
              <View className="space-y-3">
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600">Total Listings</Text>
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
                  <View className={`px-3 py-1 rounded-full ${
                    priceData.insights.demand.demandTrend === 'high' ? 'bg-red-100' :
                    priceData.insights.demand.demandTrend === 'medium' ? 'bg-yellow-100' :
                    'bg-green-100'
                  }`}>
                    <Text className={`text-sm font-medium ${
                      priceData.insights.demand.demandTrend === 'high' ? 'text-red-700' :
                      priceData.insights.demand.demandTrend === 'medium' ? 'text-yellow-700' :
                      'text-green-700'
                    }`}>
                      {priceData.insights.demand.demandTrend.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </>
      )}

      {activeTab === 'depreciation' && depreciationData && (
        <View className="bg-white p-4">
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Depreciation Calculator
          </Text>
          
          <View style={{ height: 250 }}>
            <LineChart
              data={{
                labels: depreciationData.map(d => d.year.toString()),
                datasets: [{
                  data: depreciationData.map(d => d.estimatedValue),
                  color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`, // Purple
                  strokeWidth: 2
                }]
              }}
              width={width - 32}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#8B5CF6'
                },
                formatYLabel: (value) => `$${(Number(value) / 1000).toFixed(0)}k`
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          </View>

          {/* Depreciation Stats */}
          <View className="mt-6 space-y-4">
            {depreciationData.slice(-3).map((data, index) => (
              <View key={data.year} className="flex-row justify-between items-center p-3 bg-gray-50 rounded-lg">
                <View>
                  <Text className="font-semibold text-gray-900">{data.year}</Text>
                  <Text className="text-sm text-gray-600">
                    {data.depreciationRate.toFixed(1)}% depreciation
                  </Text>
                </View>
                <Text className="text-lg font-semibold text-gray-900">
                  {formatCurrency(data.estimatedValue)}
                </Text>
              </View>
            ))}
          </View>

          {/* Depreciation Insights */}
          <View className="mt-6 p-4 bg-blue-50 rounded-lg">
            <View className="flex-row items-center mb-2">
              <Info size={20} className="text-blue-600 mr-2" />
              <Text className="font-semibold text-blue-900">Depreciation Insights</Text>
            </View>
            <Text className="text-blue-800 text-sm leading-5">
              This {make} {model} has experienced typical depreciation patterns. 
              The steepest decline occurs in the first 3 years, after which the rate slows significantly.
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};
