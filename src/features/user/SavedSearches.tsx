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
  Search,
  Bell,
  BellOff,
  Trash2,
  Edit3,
  Plus,
  Clock,
  Filter,
  TrendingDown,
  Car,
  MapPin,
  DollarSign,
} from 'lucide-react-native';
import { useAuth } from '../auth/AuthContext';
import { SavedSearch, SavedSearchAlert } from '../auth/types';
import { formatCurrency, formatRelativeTime } from '../../../utils/formatters';

interface SavedSearchesProps {
  navigation?: any;
}

export const SavedSearches: React.FC<SavedSearchesProps> = ({ navigation }) => {
  const { actions, state } = useAuth();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = async () => {
    try {
      setIsLoading(true);
      // Mock API call - replace with actual implementation
      const searches = await mockGetSavedSearches();
      setSavedSearches(searches);
    } catch (error) {
      console.error('Failed to load saved searches:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadSavedSearches();
    setRefreshing(false);
  };

  const toggleAlert = async (searchId: string, alertType: string) => {
    try {
      const updatedSearches = savedSearches.map((search) => {
        if (search.id === searchId) {
          return {
            ...search,
            alerts: {
              ...search.alerts,
              [alertType]: !search.alerts[alertType as keyof SavedSearchAlert],
            },
          };
        }
        return search;
      });

      setSavedSearches(updatedSearches);

      // Mock API call
      await mockUpdateSearchAlert(searchId, alertType);

      Alert.alert(
        'Alert Updated',
        `${alertType} alerts have been ${updatedSearches.find((s) => s.id === searchId)?.alerts[alertType as keyof SavedSearchAlert] ? 'enabled' : 'disabled'}.`,
      );
    } catch (error) {
      console.error('Failed to update alert:', error);
      Alert.alert('Error', 'Failed to update alert settings');
    }
  };

  const deleteSearch = async (searchId: string) => {
    Alert.alert(
      'Delete Search',
      'Are you sure you want to delete this saved search?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSavedSearches((prev) => prev.filter((s) => s.id !== searchId));
              await mockDeleteSavedSearch(searchId);
            } catch (error) {
              console.error('Failed to delete search:', error);
              Alert.alert('Error', 'Failed to delete saved search');
            }
          },
        },
      ],
    );
  };

  const editSearch = (search: SavedSearch) => {
    navigation?.navigate('Search', {
      editSavedSearch: search,
      filters: search.filters,
    });
  };

  const runSearch = (search: SavedSearch) => {
    navigation?.navigate('Search', {
      filters: search.filters,
      autoSearch: true,
    });
  };

  const renderSearchCard = ({ item: search }: { item: SavedSearch }) => (
    <View className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 mx-4">
      {/* Search Header */}
      <View className="p-4 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-2">
          <Text
            className="text-lg font-semibold text-gray-900 flex-1"
            numberOfLines={1}
          >
            {search.name}
          </Text>
          <View className="flex-row items-center space-x-2">
            <TouchableOpacity
              onPress={() => editSearch(search)}
              className="p-2 bg-gray-100 rounded-full"
            >
              <Edit3 size={16} className="text-gray-600" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => deleteSearch(search.id)}
              className="p-2 bg-red-100 rounded-full"
            >
              <Trash2 size={16} className="text-red-600" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row items-center text-gray-600 mb-3">
          <Clock size={14} className="text-gray-400 mr-1" />
          <Text className="text-sm text-gray-600">
            Created {formatRelativeTime(search.createdAt)}
          </Text>
          <Text className="text-gray-400 mx-2">•</Text>
          <Text className="text-sm text-gray-600">
            {search.resultCount} cars found
          </Text>
        </View>

        {/* Search Criteria Summary */}
        <View className="flex-row flex-wrap gap-2">
          {search.filters.make && (
            <View className="flex-row items-center bg-blue-100 px-3 py-1 rounded-full">
              <Car size={12} className="text-blue-600 mr-1" />
              <Text className="text-blue-700 text-xs font-medium">
                {search.filters.make}
              </Text>
            </View>
          )}

          {search.filters.priceRange && (
            <View className="flex-row items-center bg-green-100 px-3 py-1 rounded-full">
              <DollarSign size={12} className="text-green-600 mr-1" />
              <Text className="text-green-700 text-xs font-medium">
                {formatCurrency(search.filters.priceRange.min)} -{' '}
                {formatCurrency(search.filters.priceRange.max)}
              </Text>
            </View>
          )}

          {search.filters.location && (
            <View className="flex-row items-center bg-purple-100 px-3 py-1 rounded-full">
              <MapPin size={12} className="text-purple-600 mr-1" />
              <Text className="text-purple-700 text-xs font-medium">
                {search.filters.location}
              </Text>
            </View>
          )}

          {search.filters.yearRange && (
            <View className="flex-row items-center bg-orange-100 px-3 py-1 rounded-full">
              <Text className="text-orange-700 text-xs font-medium">
                {search.filters.yearRange.min} - {search.filters.yearRange.max}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Alert Settings */}
      <View className="p-4 border-b border-gray-100">
        <Text className="text-sm font-medium text-gray-700 mb-3">
          Alert Settings
        </Text>

        <View className="space-y-3">
          {/* New Listings Alert */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Bell size={16} className="text-gray-600 mr-2" />
              <View>
                <Text className="text-sm font-medium text-gray-900">
                  New Listings
                </Text>
                <Text className="text-xs text-gray-600">
                  Get notified of new cars matching your criteria
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => toggleAlert(search.id, 'newListings')}
              className={`w-12 h-6 rounded-full p-1 ${
                search.alerts.newListings ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <View
                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  search.alerts.newListings ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </TouchableOpacity>
          </View>

          {/* Price Drop Alert */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <TrendingDown size={16} className="text-gray-600 mr-2" />
              <View>
                <Text className="text-sm font-medium text-gray-900">
                  Price Drops
                </Text>
                <Text className="text-xs text-gray-600">
                  Get notified when prices decrease
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => toggleAlert(search.id, 'priceDrops')}
              className={`w-12 h-6 rounded-full p-1 ${
                search.alerts.priceDrops ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <View
                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  search.alerts.priceDrops ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </TouchableOpacity>
          </View>

          {/* Weekly Summary */}
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <Filter size={16} className="text-gray-600 mr-2" />
              <View>
                <Text className="text-sm font-medium text-gray-900">
                  Weekly Summary
                </Text>
                <Text className="text-xs text-gray-600">
                  Weekly digest of market activity
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => toggleAlert(search.id, 'weeklySummary')}
              className={`w-12 h-6 rounded-full p-1 ${
                search.alerts.weeklySummary ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <View
                className={`w-4 h-4 bg-white rounded-full transition-transform ${
                  search.alerts.weeklySummary
                    ? 'translate-x-6'
                    : 'translate-x-0'
                }`}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="p-4">
        <TouchableOpacity
          onPress={() => runSearch(search)}
          className="w-full bg-green-500 py-3 rounded-lg flex-row items-center justify-center"
        >
          <Search size={16} className="text-white mr-2" />
          <Text className="text-white font-semibold">Run Search</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-6">
      <View className="w-24 h-24 bg-gray-100 rounded-full items-center justify-center mb-6">
        <Search size={32} className="text-gray-400" />
      </View>
      <Text className="text-xl font-semibold text-gray-900 mb-2 text-center">
        No Saved Searches
      </Text>
      <Text className="text-gray-600 text-center mb-8 leading-6">
        Save your searches to get notifications when new cars are listed or
        prices drop.
      </Text>
      <TouchableOpacity
        onPress={() => navigation?.navigate('Search')}
        className="bg-green-500 px-6 py-3 rounded-lg flex-row items-center"
      >
        <Plus size={16} className="text-white mr-2" />
        <Text className="text-white font-semibold">Create Search</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#10B981" />
        <Text className="text-gray-600 mt-2">Loading saved searches...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">
            Saved Searches
          </Text>
          <TouchableOpacity
            onPress={() => navigation?.navigate('Search')}
            className="p-2 bg-green-100 rounded-full"
          >
            <Plus size={20} className="text-green-600" />
          </TouchableOpacity>
        </View>
      </View>

      {savedSearches.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={savedSearches}
          renderItem={renderSearchCard}
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
const mockGetSavedSearches = async (): Promise<SavedSearch[]> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return [
    {
      id: '1',
      name: 'Toyota Camry Under $25k',
      query: 'Toyota Camry',
      userId: 'user1',
      alertsEnabled: true,
      frequency: 'immediate' as const,
      filters: {
        make: 'Toyota',
        model: 'Camry',
        priceRange: { min: 15000, max: 25000 },
        yearRange: { min: 2018, max: 2024 },
        location: 'New York, NY',
        radius: 50,
      },
      alerts: {
        newListings: true,
        priceDrops: true,
        weeklySummary: false,
      },
      resultCount: 23,
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-01-20T00:00:00Z',
    },
    {
      id: '2',
      name: 'Luxury SUVs',
      query: 'Luxury SUV',
      userId: 'user1',
      alertsEnabled: true,
      frequency: 'weekly' as const,
      filters: {
        category: 'SUV',
        priceRange: { min: 40000, max: 80000 },
        yearRange: { min: 2020, max: 2024 },
        location: 'Los Angeles, CA',
        radius: 25,
        features: ['leather', 'sunroof', 'navigation'],
      },
      alerts: {
        newListings: false,
        priceDrops: true,
        weeklySummary: true,
      },
      resultCount: 47,
      createdAt: '2024-01-10T00:00:00Z',
      updatedAt: '2024-01-18T00:00:00Z',
    },
  ];
};

const mockUpdateSearchAlert = async (
  searchId: string,
  alertType: string,
): Promise<void> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log(`Updated alert ${alertType} for search ${searchId}`);
};

const mockDeleteSavedSearch = async (searchId: string): Promise<void> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));
  console.log(`Deleted search ${searchId}`);
};
