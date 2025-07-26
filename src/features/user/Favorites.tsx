import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  Heart,
  Trash2,
  Eye,
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Car,
  Clock,
  Share,
} from 'lucide-react-native';
import { useAuth } from '../auth/AuthContext';
import { FavoriteCar } from '../auth/types';
import { formatCurrency, formatRelativeTime } from '../../../utils/formatters';

interface FavoritesProps {
  navigation?: any;
}

interface TabButtonProps {
  title: string;
  isActive: boolean;
  onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ title, isActive, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className={`px-4 py-2 rounded-full ${
      isActive ? 'bg-green-500' : 'bg-gray-200'
    }`}
  >
    <Text
      className={`font-medium ${isActive ? 'text-white' : 'text-gray-700'}`}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

export const Favorites: React.FC<FavoritesProps> = ({ navigation }) => {
  const { actions, state } = useAuth();
  const [favorites, setFavorites] = useState<FavoriteCar[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<FavoriteCar[]>([]);
  const [activeTab, setActiveTab] = useState<'favorites' | 'recent'>(
    'favorites',
  );
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [favoritesData, recentData] = await Promise.all([
        mockGetFavorites(),
        mockGetRecentlyViewed(),
      ]);
      setFavorites(favoritesData);
      setRecentlyViewed(recentData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const removeFavorite = async (favoriteId: string) => {
    Alert.alert(
      'Remove Favorite',
      'Are you sure you want to remove this car from your favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
              await mockRemoveFavorite(favoriteId);
            } catch (error) {
              console.error('Failed to remove favorite:', error);
              Alert.alert('Error', 'Failed to remove favorite');
            }
          },
        },
      ],
    );
  };

  const viewCarDetails = (car: any) => {
    navigation?.navigate('CarDetails', { carId: car.id });
  };

  const shareCar = (car: any) => {
    // Implement share functionality
    Alert.alert('Share', `Share ${car.make} ${car.model}`);
  };

  const renderFavoriteCard = ({ item: favorite }: { item: FavoriteCar }) => {
    const priceChangeColor =
      favorite.priceChange > 0
        ? 'text-red-500'
        : favorite.priceChange < 0
          ? 'text-green-500'
          : 'text-gray-500';
    const priceChangeIcon =
      favorite.priceChange > 0
        ? TrendingUp
        : favorite.priceChange < 0
          ? TrendingDown
          : null;

    return (
      <View className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 mx-4">
        {/* Car Image Placeholder */}
        <View className="h-48 bg-gray-200 rounded-t-lg items-center justify-center">
          <Car size={48} className="text-gray-400" />
        </View>

        {/* Car Info */}
        <View className="p-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text
              className="text-lg font-bold text-gray-900 flex-1"
              numberOfLines={1}
            >
              {favorite.car.year} {favorite.car.make} {favorite.car.model}
            </Text>
            <TouchableOpacity
              onPress={() => removeFavorite(favorite.id)}
              className="p-2"
            >
              <Heart size={24} className="text-red-500" fill="rgb(239 68 68)" />
            </TouchableOpacity>
          </View>

          {/* Price Information */}
          <View className="mb-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-bold text-green-600">
                {formatCurrency(favorite.currentPrice)}
              </Text>
              {favorite.priceChange !== 0 && (
                <View className="flex-row items-center">
                  {priceChangeIcon &&
                    React.createElement(priceChangeIcon, {
                      size: 16,
                      className: priceChangeColor.replace('text-', ''),
                    })}
                  <Text className={`font-medium ml-1 ${priceChangeColor}`}>
                    {formatCurrency(Math.abs(favorite.priceChange))}
                  </Text>
                </View>
              )}
            </View>

            {favorite.priceWhenAdded !== favorite.currentPrice && (
              <Text className="text-sm text-gray-600">
                Originally {formatCurrency(favorite.priceWhenAdded)}
              </Text>
            )}
          </View>

          {/* Car Details */}
          <View className="flex-row flex-wrap gap-2 mb-4">
            <View className="bg-blue-100 px-3 py-1 rounded-full">
              <Text className="text-blue-700 text-xs font-medium">
                {(favorite.car as any).mileage?.toLocaleString() || 'Unknown'}{' '}
                miles
              </Text>
            </View>
            <View className="bg-purple-100 px-3 py-1 rounded-full">
              <Text className="text-purple-700 text-xs font-medium">
                {(favorite.car as any).transmission || 'Unknown'}
              </Text>
            </View>
            <View className="bg-orange-100 px-3 py-1 rounded-full">
              <Text className="text-orange-700 text-xs font-medium">
                {(favorite.car as any).fuelType || 'Unknown'}
              </Text>
            </View>
          </View>

          {/* Notes */}
          {favorite.notes && (
            <View className="bg-gray-50 p-3 rounded-lg mb-4">
              <Text className="text-gray-700 text-sm">{favorite.notes}</Text>
            </View>
          )}

          {/* Added Date */}
          <View className="flex-row items-center mb-4">
            <Calendar size={14} className="text-gray-400 mr-1" />
            <Text className="text-sm text-gray-600">
              Added {formatRelativeTime(favorite.addedAt)}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={() => viewCarDetails(favorite.car)}
              className="flex-1 bg-green-500 py-3 rounded-lg flex-row items-center justify-center"
            >
              <Eye size={16} className="text-white mr-2" />
              <Text className="text-white font-semibold">View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => shareCar(favorite.car)}
              className="px-4 py-3 border border-gray-300 rounded-lg flex-row items-center justify-center"
            >
              <Share size={16} className="text-gray-600" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderRecentCard = ({ item: recent }: { item: FavoriteCar }) => (
    <View className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 mx-4">
      {/* Car Image Placeholder */}
      <View className="h-32 bg-gray-200 rounded-t-lg items-center justify-center">
        <Car size={32} className="text-gray-400" />
      </View>

      {/* Car Info */}
      <View className="p-4">
        <Text
          className="text-lg font-bold text-gray-900 mb-1"
          numberOfLines={1}
        >
          {recent.car.year} {recent.car.make} {recent.car.model}
        </Text>

        <Text className="text-xl font-bold text-green-600 mb-2">
          {formatCurrency(recent.currentPrice)}
        </Text>

        {/* View Time */}
        <View className="flex-row items-center mb-3">
          <Clock size={14} className="text-gray-400 mr-1" />
          <Text className="text-sm text-gray-600">
            Viewed {formatRelativeTime(recent.addedAt)}
          </Text>
        </View>

        {/* Quick Details */}
        <View className="flex-row flex-wrap gap-2 mb-4">
          <View className="bg-blue-100 px-2 py-1 rounded">
            <Text className="text-blue-700 text-xs">
              {(recent.car as any).mileage?.toLocaleString() || 'Unknown'} mi
            </Text>
          </View>
          <View className="bg-purple-100 px-2 py-1 rounded">
            <Text className="text-purple-700 text-xs">
              {(recent.car as any).transmission || 'Unknown'}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={() => viewCarDetails(recent.car)}
            className="flex-1 bg-green-500 py-2 rounded flex-row items-center justify-center"
          >
            <Eye size={14} className="text-white mr-1" />
            <Text className="text-white font-medium text-sm">View</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => actions.addToFavorites(recent.car)}
            className="px-3 py-2 border border-gray-300 rounded flex-row items-center justify-center"
          >
            <Heart size={14} className="text-gray-600" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => {
    const isEmptyFavorites =
      activeTab === 'favorites' && favorites.length === 0;
    const isEmptyRecent = activeTab === 'recent' && recentlyViewed.length === 0;

    return (
      <View className="flex-1 justify-center items-center px-6">
        <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6">
          {activeTab === 'favorites' ? (
            <Heart size={32} className="text-gray-400" />
          ) : (
            <Clock size={32} className="text-gray-400" />
          )}
        </View>

        <Text className="text-xl font-semibold text-gray-900 mb-2 text-center">
          {activeTab === 'favorites'
            ? 'No Favorites Yet'
            : 'No Recently Viewed Cars'}
        </Text>

        <Text className="text-gray-600 text-center mb-8 leading-6">
          {activeTab === 'favorites'
            ? 'Save cars you love to keep track of price changes and updates.'
            : 'Cars you view will appear here for quick access.'}
        </Text>

        <TouchableOpacity
          onPress={() => navigation?.navigate('Search')}
          className="bg-green-500 px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Browse Cars</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#10B981" />
        <Text className="text-gray-600 mt-2">Loading your favorites...</Text>
      </View>
    );
  }

  const currentData = activeTab === 'favorites' ? favorites : recentlyViewed;
  const renderItem =
    activeTab === 'favorites' ? renderFavoriteCard : renderRecentCard;

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-4">
        <Text className="text-2xl font-bold text-gray-900 mb-4">My Cars</Text>

        {/* Tabs */}
        <View className="flex-row space-x-3">
          <TabButton
            title={`Favorites (${favorites.length})`}
            isActive={activeTab === 'favorites'}
            onPress={() => setActiveTab('favorites')}
          />
          <TabButton
            title={`Recent (${recentlyViewed.length})`}
            isActive={activeTab === 'recent'}
            onPress={() => setActiveTab('recent')}
          />
        </View>
      </View>

      {currentData.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={currentData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical: 16 }}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
};

// Mock API functions - replace with actual implementation
const mockGetFavorites = async (): Promise<FavoriteCar[]> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return [
    {
      id: '1',
      userId: 'user1',
      car: {
        id: 'car1',
        make: 'Toyota',
        model: 'Camry',
        year: 2022,
        price: 28500,
        bodyStyle: 'Sedan',
        fuelEfficiency: 32,
        brand: 'Toyota',
        features: ['Backup Camera', 'Bluetooth', 'Keyless Entry'],
        safetyRating: 5,
      } as any, // Extended with mileage, transmission etc for display
      notes: 'Perfect for daily commuting. Love the fuel efficiency!',
      addedAt: '2024-01-16T00:00:00Z',
      priceWhenAdded: 29000,
      currentPrice: 28500,
      priceChange: -500,
    },
    {
      id: '2',
      userId: 'user1',
      car: {
        id: 'car2',
        make: 'Honda',
        model: 'CR-V',
        year: 2023,
        price: 32000,
        bodyStyle: 'SUV',
        fuelEfficiency: 30,
        brand: 'Honda',
        features: ['AWD', 'Heated Seats', 'Apple CarPlay'],
        safetyRating: 5,
      } as any, // Extended with additional properties for display
      notes: 'Great for weekend trips. Need to test drive soon.',
      addedAt: '2024-01-12T00:00:00Z',
      priceWhenAdded: 31500,
      currentPrice: 32000,
      priceChange: 500,
    },
  ];
};

const mockGetRecentlyViewed = async (): Promise<FavoriteCar[]> => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  return [
    {
      id: '3',
      userId: 'user1',
      car: {
        id: 'car3',
        make: 'Mazda',
        model: 'CX-5',
        year: 2021,
        price: 26500,
        bodyStyle: 'SUV',
        fuelEfficiency: 28,
        brand: 'Mazda',
        features: ['Backup Camera', 'Blind Spot Monitoring'],
        safetyRating: 4,
      } as any, // Extended with additional properties for display
      addedAt: '2024-01-19T14:30:00Z',
      priceWhenAdded: 26500,
      currentPrice: 26500,
      priceChange: 0,
    },
  ];
};

const mockRemoveFavorite = async (favoriteId: string): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log(`Removed favorite ${favoriteId}`);
};
