import React, { useState, useCallback, useMemo } from 'react';
import { View, TextInput, TouchableOpacity, Text, ScrollView } from 'react-native';
import { Search as SearchIcon, X, Filter, SlidersHorizontal } from 'lucide-react-native';
import { FilterBottomSheet } from '../Filters/FilterBottomSheet';
import { 
  SearchFilters, 
  FilterPreset, 
  SearchSuggestion
} from '../../features/recommendations/types/search';
import { Car } from '../../features/recommendations/types';
import { useDebounce } from '../../../hooks/useDebounce';

interface SearchBarProps {
  onSearchResults: (results: Car[]) => void;
  initialFilters?: Partial<SearchFilters>;
  showFilterButton?: boolean;
  showQuickFilters?: boolean;
  className?: string;
}

const defaultFilters: SearchFilters = {
  priceRange: [0, 200000],
  yearRange: [2000, new Date().getFullYear()],
  makes: [],
  bodyTypes: [],
  fuelTypes: [],
  transmission: [],
  features: [],
  mileageRange: [0, 200000],
  colors: [],
  minSafetyRating: 0,
};

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearchResults,
  initialFilters = {},
  showFilterButton = true,
  showQuickFilters = true,
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    ...defaultFilters,
    ...initialFilters,
  });
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounce search query
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Mock suggestions
  const suggestions = useMemo(() => [
    { id: '1', text: 'Toyota Camry', type: 'model' as const, icon: '🚗' },
    { id: '2', text: 'Honda Civic', type: 'model' as const, icon: '🚗' },
    { id: '3', text: 'Tesla', type: 'make' as const, icon: '🏢' },
    { id: '4', text: 'Hybrid Cars', type: 'feature' as const, icon: '🔋' },
  ].filter(s => 
    s.text.toLowerCase().includes(searchQuery.toLowerCase())
  ), [searchQuery]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.makes.length > 0) count++;
    if (filters.bodyTypes.length > 0) count++;
    if (filters.fuelTypes.length > 0) count++;
    if (filters.transmission.length > 0) count++;
    if (filters.colors.length > 0) count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 200000) count++;
    if (filters.yearRange[0] > 2000 || filters.yearRange[1] < new Date().getFullYear()) count++;
    if (filters.mileageRange[1] < 200000) count++;
    if (filters.features.length > 0) count++;
    if (filters.minSafetyRating > 0) count++;
    return count;
  }, [filters]);

  // Handle search
  const handleSearch = useCallback(async (query: string = searchQuery) => {
    setIsLoading(true);
    setShowSuggestions(false);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock search results based on query and filters
      const mockResults: Car[] = [
        {
          id: '1',
          make: 'Toyota',
          model: 'Camry',
          year: 2023,
          price: 28000,
          bodyStyle: 'Sedan',
          fuelEfficiency: 32,
          brand: 'Toyota',
          features: ['Backup Camera', 'Bluetooth', 'Navigation'],
          safetyRating: 5,
        },
        {
          id: '2',
          make: 'Honda',
          model: 'Civic',
          year: 2022,
          price: 24000,
          bodyStyle: 'Sedan',
          fuelEfficiency: 35,
          brand: 'Honda',
          features: ['Apple CarPlay', 'Lane Keeping Assist'],
          safetyRating: 5,
        }
      ];

      // Filter results based on current filters
      let filteredResults = mockResults;
      
      if (filters.makes.length > 0) {
        filteredResults = filteredResults.filter(car => 
          filters.makes.includes(car.make)
        );
      }
      
      if (filters.priceRange[1] < 200000) {
        filteredResults = filteredResults.filter(car => 
          car.price >= filters.priceRange[0] && car.price <= filters.priceRange[1]
        );
      }

      onSearchResults(filteredResults);
    } catch (error) {
      console.error('Search error:', error);
      onSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, filters, onSearchResults]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Handle apply filters
  const handleApplyFilters = useCallback(() => {
    setIsFilterSheetVisible(false);
    handleSearch();
  }, [handleSearch]);

  // Handle reset filters
  const handleResetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  // Handle save preset
  const handleSavePreset = useCallback((name: string) => {
    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name,
      filters,
      createdAt: Date.now(),
    };
    setPresets(prev => [...prev, newPreset]);
  }, [filters]);

  // Handle load preset
  const handleLoadPreset = useCallback((preset: FilterPreset) => {
    setFilters(prev => ({ ...prev, ...preset.filters }));
  }, []);

  // Quick filter options
  const quickFilters = [
    { label: 'Under $20k', action: () => handleFiltersChange({ priceRange: [0, 20000] }) },
    { label: 'Toyota', action: () => handleFiltersChange({ makes: ['Toyota'] }) },
    { label: 'Sedan', action: () => handleFiltersChange({ bodyTypes: ['Sedan'] }) },
    { label: 'High MPG', action: () => handleFiltersChange({ minSafetyRating: 4 }) },
  ];

  return (
    <View className={`bg-white ${className}`}>
      {/* Main Search Input */}
      <View className="px-4 py-3">
        <View className="flex-row items-center bg-gray-50 rounded-lg border border-gray-200">
          <SearchIcon size={20} className="text-gray-400 ml-3" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setShowSuggestions(true)}
            onSubmitEditing={() => handleSearch()}
            placeholder="Search cars, makes, models..."
            className="flex-1 px-3 py-3 text-gray-800"
            placeholderTextColor="#9CA3AF"
          />
          
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setShowSuggestions(false);
              }}
              className="p-2"
            >
              <X size={16} className="text-gray-400" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            onPress={() => handleSearch()}
            className="bg-green-500 rounded-r-lg px-4 py-3"
            disabled={isLoading}
          >
            <SearchIcon size={20} className="text-white" />
          </TouchableOpacity>
        </View>

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <View className="bg-white border border-gray-200 rounded-lg mt-2 shadow-sm">
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.id}
                onPress={() => {
                  setSearchQuery(suggestion.text);
                  setShowSuggestions(false);
                  handleSearch(suggestion.text);
                }}
                className="flex-row items-center p-3 border-b border-gray-100 last:border-b-0"
              >
                <Text className="mr-3 text-lg">{suggestion.icon}</Text>
                <Text className="flex-1 text-gray-800">{suggestion.text}</Text>
                <Text className="text-xs text-gray-500 capitalize">{suggestion.type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Filter Actions */}
        <View className="flex-row items-center justify-between mt-3">
          {showFilterButton && (
            <TouchableOpacity
              onPress={() => setIsFilterSheetVisible(true)}
              className="flex-row items-center bg-gray-100 rounded-full px-4 py-2 mr-3"
            >
              <SlidersHorizontal size={16} className="text-gray-600 mr-2" />
              <Text className="text-gray-700 font-medium">Filters</Text>
              {activeFilterCount > 0 && (
                <View className="bg-green-500 rounded-full w-5 h-5 items-center justify-center ml-2">
                  <Text className="text-white text-xs font-bold">
                    {activeFilterCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {activeFilterCount > 0 && (
            <TouchableOpacity
              onPress={handleResetFilters}
              className="flex-row items-center"
            >
              <X size={16} className="text-red-500 mr-1" />
              <Text className="text-red-500 font-medium">Clear All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Quick Filters */}
      {showQuickFilters && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="px-4 mb-3"
        >
          <View className="flex-row space-x-2">
            {quickFilters.map((filter, index) => (
              <TouchableOpacity
                key={index}
                onPress={filter.action}
                className="bg-blue-50 border border-blue-200 rounded-full px-4 py-2"
              >
                <Text className="text-blue-700 font-medium text-sm">
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <View className="px-4 mb-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-2">
              {filters.makes.map(make => (
                <View key={make} className="bg-green-100 rounded-full px-3 py-1 flex-row items-center">
                  <Text className="text-green-800 text-sm mr-1">{make}</Text>
                  <TouchableOpacity
                    onPress={() => handleFiltersChange({ 
                      makes: filters.makes.filter(m => m !== make) 
                    })}
                  >
                    <X size={12} className="text-green-600" />
                  </TouchableOpacity>
                </View>
              ))}
              {filters.bodyTypes.map(type => (
                <View key={type} className="bg-green-100 rounded-full px-3 py-1 flex-row items-center">
                  <Text className="text-green-800 text-sm mr-1">{type}</Text>
                  <TouchableOpacity
                    onPress={() => handleFiltersChange({ 
                      bodyTypes: filters.bodyTypes.filter(t => t !== type) 
                    })}
                  >
                    <X size={12} className="text-green-600" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Loading State */}
      {isLoading && (
        <View className="px-4 py-2">
          <Text className="text-gray-500 text-center">Searching...</Text>
        </View>
      )}

      {/* Filter Bottom Sheet */}
      <FilterBottomSheet
        isVisible={isFilterSheetVisible}
        onClose={() => setIsFilterSheetVisible(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onApply={handleApplyFilters}
        onReset={handleResetFilters}
        presets={presets}
        onSavePreset={handleSavePreset}
        onLoadPreset={handleLoadPreset}
      />
    </View>
  );
};
