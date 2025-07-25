import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Search as SearchIcon, Filter, SlidersHorizontal, X } from 'lucide-react-native';
import { AdvancedSearch } from './AdvancedSearch';
import { FilterBottomSheet } from '../Filters/FilterBottomSheet';
import { 
  SearchFilters, 
  FilterPreset, 
  SearchSuggestion,
  UseSearchResult
} from '../../features/recommendations/types/search';
import { Car } from '../../features/recommendations/types';

interface ComprehensiveSearchProps {
  onSearchResults: (results: Car[]) => void;
  initialFilters?: Partial<SearchFilters>;
  showFilterButton?: boolean;
  showQuickFilters?: boolean;
  enableUrlPersistence?: boolean;
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

export const ComprehensiveSearch: React.FC<ComprehensiveSearchProps> = ({
  onSearchResults,
  initialFilters = {},
  showFilterButton = true,
  showQuickFilters = true,
  enableUrlPersistence = false,
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    ...defaultFilters,
    ...initialFilters,
  });
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for suggestions
  const mockSuggestions: SearchSuggestion[] = [
    { id: '1', text: 'Toyota Camry', type: 'model', icon: '🚗' },
    { id: '2', text: 'Honda', type: 'make', icon: '🏢' },
    { id: '3', text: 'Hybrid', type: 'feature', icon: '🔋' },
    { id: '4', text: 'SUV', type: 'feature', icon: '🚙' },
  ];

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
  const handleSearch = useCallback(async (query: string, searchFilters: SearchFilters) => {
    setIsLoading(true);
    
    try {
      // Add to recent searches
      if (query.trim() && !recentSearches.includes(query.trim())) {
        setRecentSearches(prev => [query.trim(), ...prev.slice(0, 4)]);
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock search results
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
        }
      ];

      onSearchResults(mockResults);
    } catch (error) {
      console.error('Search error:', error);
      onSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [recentSearches, onSearchResults]);

  // Handle filter changes
  const handleFiltersChange = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Handle apply filters
  const handleApplyFilters = useCallback(() => {
    setIsFilterSheetVisible(false);
    handleSearch(searchQuery, filters);
  }, [searchQuery, filters, handleSearch]);

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
    { label: 'Hybrid', action: () => handleFiltersChange({ fuelTypes: ['Hybrid'] }) },
    { label: 'SUV', action: () => handleFiltersChange({ bodyTypes: ['SUV'] }) },
    { label: 'Low Mileage', action: () => handleFiltersChange({ mileageRange: [0, 30000] }) },
  ];

  // URL persistence (simplified)
  useEffect(() => {
    if (enableUrlPersistence) {
      // Save filters to localStorage for persistence
      try {
        localStorage.setItem('searchFilters', JSON.stringify(filters));
      } catch (error) {
        console.warn('Could not persist filters:', error);
      }
    }
  }, [filters, enableUrlPersistence]);

  return (
    <View className={`bg-white ${className}`}>
      {/* Main Search Bar */}
      <View className="px-4 py-3">
        <AdvancedSearch
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSearch={(query) => handleSearch(query, filters)}
          suggestions={mockSuggestions}
          recentSearches={recentSearches}
          placeholder="Search cars, makes, models..."
          isLoading={isLoading}
          className="mb-3"
        />

        {/* Filter Actions */}
        <View className="flex-row items-center justify-between">
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
