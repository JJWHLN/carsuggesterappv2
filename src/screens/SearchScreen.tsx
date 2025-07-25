import React, { useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { UnifiedSearchComponent as SearchBar } from '@/components/ui/unified';
import { Car } from '../features/recommendations/types';

interface SearchScreenProps {
  navigation?: any;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ navigation }) => {
  const [searchResults, setSearchResults] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearchResults = (results: Car[]) => {
    setSearchResults(results);
  };

  const renderCarCard = (car: Car) => (
    <View key={car.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 mx-4">
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-900">
            {car.year} {car.make} {car.model}
          </Text>
          <Text className="text-sm text-gray-600 capitalize">
            {car.bodyStyle}
          </Text>
        </View>
        <Text className="text-xl font-bold text-green-600">
          ${car.price.toLocaleString()}
        </Text>
      </View>
      
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-sm text-gray-600">
          {car.fuelEfficiency} MPG
        </Text>
        <View className="flex-row">
          {[...Array(5)].map((_, i) => (
            <Text key={i} className={i < car.safetyRating ? 'text-yellow-400' : 'text-gray-300'}>
              ⭐
            </Text>
          ))}
        </View>
      </View>
      
      {car.features.length > 0 && (
        <View className="flex-row flex-wrap">
          {car.features.slice(0, 3).map((feature, index) => (
            <View key={index} className="bg-blue-100 rounded-full px-2 py-1 mr-2 mb-1">
              <Text className="text-xs text-blue-700">{feature}</Text>
            </View>
          ))}
          {car.features.length > 3 && (
            <View className="bg-gray-100 rounded-full px-2 py-1">
              <Text className="text-xs text-gray-600">+{car.features.length - 3} more</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search Bar */}
      <SearchBar
        onSearchResults={handleSearchResults}
        showFilterButton={true}
        showQuickFilters={true}
        className="bg-white shadow-sm"
      />
      
      {/* Results */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {searchResults.length > 0 && (
          <View className="py-4">
            <Text className="text-lg font-semibold text-gray-800 px-4 mb-4">
              {searchResults.length} Cars Found
            </Text>
            {searchResults.map(renderCarCard)}
          </View>
        )}
        
        {searchResults.length === 0 && !isLoading && (
          <View className="flex-1 justify-center items-center py-20">
            <Text className="text-6xl mb-4">🔍</Text>
            <Text className="text-xl font-semibold text-gray-800 mb-2">
              Find Your Perfect Car
            </Text>
            <Text className="text-gray-600 text-center px-8">
              Use the search bar above to find cars by make, model, or features
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
