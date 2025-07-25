import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Zap,
  Info
} from 'lucide-react-native';
import { DealRating as DealRatingType, DealFactor } from './types';
import { formatCurrency } from '../../../utils/formatters';

interface DealRatingProps {
  dealRating: DealRatingType;
  currentPrice: number;
  marketAverage: number;
  onLearnMore?: () => void;
}

interface RatingBadgeProps {
  rating: DealRatingType['rating'];
  score: number;
}

const RatingBadge: React.FC<RatingBadgeProps> = ({ rating, score }) => {
  const config = {
    Great: {
      color: 'bg-green-500',
      textColor: 'text-green-900',
      bgColor: 'bg-green-100',
      icon: CheckCircle
    },
    Good: {
      color: 'bg-blue-500',
      textColor: 'text-blue-900',
      bgColor: 'bg-blue-100',
      icon: TrendingUp
    },
    Fair: {
      color: 'bg-yellow-500',
      textColor: 'text-yellow-900',
      bgColor: 'bg-yellow-100',
      icon: Clock
    },
    Overpriced: {
      color: 'bg-red-500',
      textColor: 'text-red-900',
      bgColor: 'bg-red-100',
      icon: AlertTriangle
    }
  };

  const { color, textColor, bgColor, icon: IconComponent } = config[rating];

  return (
    <View className={`${bgColor} rounded-lg p-4 mb-4`}>
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <View className={`w-10 h-10 ${color} rounded-full items-center justify-center mr-3`}>
            <IconComponent size={20} className="text-white" />
          </View>
          <View>
            <Text className={`text-xl font-bold ${textColor}`}>
              {rating} Deal
            </Text>
            <Text className={`text-sm ${textColor} opacity-80`}>
              Score: {score}/100
            </Text>
          </View>
        </View>
        
        {/* Score Visualization */}
        <View className="items-center">
          <View className="w-16 h-16 rounded-full border-4 border-gray-200 items-center justify-center relative">
            <Text className={`text-lg font-bold ${textColor}`}>
              {score}
            </Text>
            <View 
              className={`absolute inset-0 rounded-full border-4 ${color.replace('bg-', 'border-')}`}
              style={{
                transform: [{ rotate: `${(score / 100) * 360}deg` }],
                borderTopColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: score > 50 ? undefined : 'transparent'
              }}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

interface FactorItemProps {
  factor: DealFactor;
}

const FactorItem: React.FC<FactorItemProps> = ({ factor }) => {
  const impactConfig = {
    positive: {
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    negative: {
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    neutral: {
      icon: Clock,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100'
    }
  };

  const { icon: IconComponent, color, bgColor } = impactConfig[factor.impact];

  return (
    <View className="flex-row items-start p-3 bg-white rounded-lg border border-gray-200 mb-3">
      <View className={`w-8 h-8 ${bgColor} rounded-full items-center justify-center mr-3 mt-1`}>
        <IconComponent size={16} className={color} />
      </View>
      
      <View className="flex-1">
        <View className="flex-row items-center justify-between mb-1">
          <Text className="font-semibold text-gray-900">{factor.name}</Text>
          <View className="flex-row">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={12}
                className={i < factor.weight * 5 ? 'text-yellow-400' : 'text-gray-300'}
                fill={i < factor.weight * 5 ? '#FCD34D' : 'transparent'}
              />
            ))}
          </View>
        </View>
        <Text className="text-sm text-gray-600 leading-5">
          {factor.description}
        </Text>
      </View>
    </View>
  );
};

export const DealRating: React.FC<DealRatingProps> = ({
  dealRating,
  currentPrice,
  marketAverage,
  onLearnMore
}) => {
  const priceDifference = currentPrice - marketAverage;
  const percentDifference = (priceDifference / marketAverage) * 100;

  return (
    <View className="bg-gray-50 p-4">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-6">
        <Text className="text-2xl font-bold text-gray-900">Deal Analysis</Text>
        {onLearnMore && (
          <TouchableOpacity
            onPress={onLearnMore}
            className="flex-row items-center px-3 py-2 bg-blue-100 rounded-lg"
          >
            <Info size={16} className="text-blue-600 mr-1" />
            <Text className="text-blue-600 text-sm font-medium">Learn More</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Rating Badge */}
      <RatingBadge rating={dealRating.rating} score={dealRating.score} />

      {/* Price Comparison */}
      <View className="bg-white rounded-lg p-4 mb-6 border border-gray-200">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          Price Comparison
        </Text>
        
        <View className="space-y-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-600">Listed Price</Text>
            <Text className="text-xl font-bold text-gray-900">
              {formatCurrency(currentPrice)}
            </Text>
          </View>
          
          <View className="flex-row justify-between items-center">
            <Text className="text-gray-600">Market Average</Text>
            <Text className="text-lg font-semibold text-gray-700">
              {formatCurrency(marketAverage)}
            </Text>
          </View>
          
          <View className="h-px bg-gray-200 my-2" />
          
          <View className="flex-row justify-between items-center">
            <Text className="font-medium text-gray-900">Difference</Text>
            <View className="items-end">
              <Text className={`text-lg font-bold ${
                priceDifference < 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {priceDifference < 0 ? '-' : '+'}
                {formatCurrency(Math.abs(priceDifference))}
              </Text>
              <Text className={`text-sm ${
                priceDifference < 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                ({percentDifference.toFixed(1)}%)
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Recommendation */}
      <View className={`rounded-lg p-4 mb-6 ${
        dealRating.rating === 'Great' ? 'bg-green-50 border border-green-200' :
        dealRating.rating === 'Good' ? 'bg-blue-50 border border-blue-200' :
        dealRating.rating === 'Fair' ? 'bg-yellow-50 border border-yellow-200' :
        'bg-red-50 border border-red-200'
      }`}>
        <View className="flex-row items-center mb-2">
          <Zap size={20} className={
            dealRating.rating === 'Great' ? 'text-green-600' :
            dealRating.rating === 'Good' ? 'text-blue-600' :
            dealRating.rating === 'Fair' ? 'text-yellow-600' :
            'text-red-600'
          } />
          <Text className={`ml-2 font-semibold ${
            dealRating.rating === 'Great' ? 'text-green-900' :
            dealRating.rating === 'Good' ? 'text-blue-900' :
            dealRating.rating === 'Fair' ? 'text-yellow-900' :
            'text-red-900'
          }`}>
            Our Recommendation
          </Text>
        </View>
        <Text className={`leading-6 ${
          dealRating.rating === 'Great' ? 'text-green-800' :
          dealRating.rating === 'Good' ? 'text-blue-800' :
          dealRating.rating === 'Fair' ? 'text-yellow-800' :
          'text-red-800'
        }`}>
          {dealRating.recommendation}
        </Text>
        
        <View className="flex-row items-center mt-3">
          <Text className={`text-sm ${
            dealRating.rating === 'Great' ? 'text-green-700' :
            dealRating.rating === 'Good' ? 'text-blue-700' :
            dealRating.rating === 'Fair' ? 'text-yellow-700' :
            'text-red-700'
          }`}>
            Confidence: {Math.round(dealRating.confidence * 100)}%
          </Text>
        </View>
      </View>

      {/* Analysis Factors */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-900 mb-4">
          Analysis Factors
        </Text>
        
        {dealRating.factors.map((factor, index) => (
          <FactorItem key={index} factor={factor} />
        ))}
      </View>

      {/* Quick Actions */}
      <View className="space-y-3">
        {dealRating.rating === 'Great' && (
          <TouchableOpacity className="bg-green-500 py-4 rounded-lg">
            <Text className="text-white text-center font-semibold text-lg">
              Contact Seller Now
            </Text>
          </TouchableOpacity>
        )}
        
        {dealRating.rating === 'Good' && (
          <TouchableOpacity className="bg-blue-500 py-4 rounded-lg">
            <Text className="text-white text-center font-semibold text-lg">
              Schedule Test Drive
            </Text>
          </TouchableOpacity>
        )}
        
        {dealRating.rating === 'Fair' && (
          <TouchableOpacity className="bg-yellow-500 py-4 rounded-lg">
            <Text className="text-white text-center font-semibold text-lg">
              Make an Offer
            </Text>
          </TouchableOpacity>
        )}
        
        {dealRating.rating === 'Overpriced' && (
          <TouchableOpacity className="bg-gray-500 py-4 rounded-lg">
            <Text className="text-white text-center font-semibold text-lg">
              View Similar Cars
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity className="border border-gray-300 py-4 rounded-lg">
          <Text className="text-gray-700 text-center font-semibold text-lg">
            Set Price Alert
          </Text>
        </TouchableOpacity>
      </View>

      {/* Disclaimer */}
      <View className="mt-6 p-3 bg-gray-100 rounded-lg">
        <Text className="text-xs text-gray-600 text-center leading-5">
          Deal ratings are based on market data and algorithmic analysis. 
          Always inspect the vehicle and verify information before purchasing.
        </Text>
      </View>
    </View>
  );
};
