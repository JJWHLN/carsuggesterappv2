import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { X, Filter } from 'lucide-react-native';
import { FilterPanel } from './FilterPanel';
import { SearchFilters, FilterPreset } from '../../features/recommendations/types/search';

interface FilterBottomSheetProps {
  isVisible: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onApply: () => void;
  onReset: () => void;
  presets?: FilterPreset[];
  onSavePreset?: (name: string) => void;
  onLoadPreset?: (preset: FilterPreset) => void;
}

export const FilterBottomSheet: React.FC<FilterBottomSheetProps> = ({
  isVisible,
  onClose,
  filters,
  onFiltersChange,
  onApply,
  onReset,
  presets = [],
  onSavePreset = () => {},
  onLoadPreset = () => {},
}) => {
  if (!isVisible) return null;

  const hasActiveFilters = () => {
    return (
      filters.makes.length > 0 ||
      filters.bodyTypes.length > 0 ||
      filters.fuelTypes.length > 0 ||
      filters.transmission.length > 0 ||
      filters.colors.length > 0 ||
      filters.priceRange[0] > 0 ||
      filters.priceRange[1] < 200000 ||
      filters.yearRange[0] > 2000 ||
      filters.yearRange[1] < new Date().getFullYear() ||
      filters.mileageRange[1] < 200000 ||
      filters.features.length > 0 ||
      filters.minSafetyRating > 0
    );
  };

  const activeFilterCount = () => {
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
  };

  return (
    <View className="absolute inset-0 bg-black/50 flex justify-end z-50">
      <View className="bg-white rounded-t-3xl max-h-[85%] flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <View className="flex-row items-center">
            <Filter size={20} className="text-gray-700 mr-2" />
            <Text className="text-lg font-semibold text-gray-800">
              Filters
            </Text>
            {hasActiveFilters() && (
              <View className="bg-green-500 rounded-full w-6 h-6 items-center justify-center ml-2">
                <Text className="text-white text-xs font-bold">
                  {activeFilterCount()}
                </Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            onPress={onClose}
            className="p-2 rounded-full bg-gray-100"
          >
            <X size={20} className="text-gray-600" />
          </TouchableOpacity>
        </View>

        {/* Filter Content */}
        <ScrollView 
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
        >
          <FilterPanel
            filters={filters}
            onFiltersChange={onFiltersChange}
            onClearAll={onReset}
            presets={presets}
            onSavePreset={onSavePreset}
            onLoadPreset={onLoadPreset}
            isVisible={true}
            onClose={() => {}}
            appliedCount={activeFilterCount()}
            className="py-4"
          />
        </ScrollView>

        {/* Action Buttons */}
        <View className="flex-row p-4 border-t border-gray-200 space-x-3">
          <TouchableOpacity
            onPress={onReset}
            className="flex-1 py-3 rounded-lg border border-gray-300 items-center"
            disabled={!hasActiveFilters()}
          >
            <Text className={`font-medium ${
              hasActiveFilters() ? 'text-gray-700' : 'text-gray-400'
            }`}>
              Reset
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={onApply}
            className="flex-2 py-3 rounded-lg bg-green-500 items-center"
          >
            <Text className="text-white font-semibold">
              Apply Filters
              {hasActiveFilters() && ` (${activeFilterCount()})`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
