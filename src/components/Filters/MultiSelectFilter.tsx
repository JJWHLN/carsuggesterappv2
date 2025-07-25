import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, FlatList, VirtualizedList } from 'react-native';
import { Search, Check, X } from 'lucide-react-native';
import { FilterOption } from '../../features/recommendations/types/search';

interface MultiSelectFilterProps {
  options: FilterOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  searchable?: boolean;
  virtualized?: boolean;
  maxHeight?: number;
  placeholder?: string;
  className?: string;
}

export const MultiSelectFilter: React.FC<MultiSelectFilterProps> = React.memo(({
  options,
  selectedValues,
  onChange,
  searchable = false,
  virtualized = false,
  maxHeight = 200,
  placeholder = "Search options...",
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    
    return options.filter(option =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.value.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  const handleToggleOption = useCallback((value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(newValues);
  }, [selectedValues, onChange]);

  const handleSelectAll = useCallback(() => {
    const allValues = filteredOptions.map(option => option.value);
    const hasAllSelected = allValues.every(value => selectedValues.includes(value));
    
    if (hasAllSelected) {
      // Deselect all filtered options
      const newValues = selectedValues.filter(value => 
        !allValues.includes(value)
      );
      onChange(newValues);
    } else {
      // Select all filtered options
      const newValues = [...new Set([...selectedValues, ...allValues])];
      onChange(newValues);
    }
  }, [filteredOptions, selectedValues, onChange]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const renderOption = useCallback(({ item }: { item: FilterOption }) => {
    const isSelected = selectedValues.includes(item.value);
    
    return (
      <TouchableOpacity
        onPress={() => handleToggleOption(item.value)}
        className={`flex-row items-center p-3 border-b border-gray-100 ${
          isSelected ? 'bg-green-50' : 'bg-white'
        }`}
      >
        <View className={`w-5 h-5 border-2 rounded mr-3 items-center justify-center ${
          isSelected 
            ? 'border-green-500 bg-green-500' 
            : 'border-gray-300 bg-white'
        }`}>
          {isSelected && <Check size={12} className="text-white" />}
        </View>
        
        {item.icon && (
          <Text className="mr-2 text-lg">{item.icon}</Text>
        )}
        
        <View className="flex-1">
          <Text className={`font-medium ${
            isSelected ? 'text-green-700' : 'text-gray-800'
          }`}>
            {item.label}
          </Text>
          {item.count !== undefined && (
            <Text className="text-xs text-gray-500">
              {item.count} cars
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [selectedValues, handleToggleOption]);

  const renderVirtualizedOption = useCallback((info: { item: FilterOption; index: number }) => {
    return renderOption({ item: info.item });
  }, [renderOption]);

  const getItem = useCallback((data: FilterOption[], index: number) => data[index], []);
  const getItemCount = useCallback((data: FilterOption[]) => data.length, []);
  const keyExtractor = useCallback((item: FilterOption) => item.value, []);

  const hasAllSelected = useMemo(() => {
    if (filteredOptions.length === 0) return false;
    return filteredOptions.every(option => selectedValues.includes(option.value));
  }, [filteredOptions, selectedValues]);

  return (
    <View className={className}>
      {/* Search Bar */}
      {searchable && (
        <View className="flex-row items-center bg-gray-50 rounded-lg border border-gray-200 mb-3">
          <Search size={16} className="text-gray-400 ml-3" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 text-gray-800"
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} className="p-2">
              <X size={16} className="text-gray-400" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Select All / Clear All */}
      {filteredOptions.length > 0 && (
        <TouchableOpacity
          onPress={handleSelectAll}
          className="flex-row items-center p-2 mb-2 bg-gray-50 rounded-lg"
        >
          <View className={`w-5 h-5 border-2 rounded mr-3 items-center justify-center ${
            hasAllSelected 
              ? 'border-green-500 bg-green-500' 
              : 'border-gray-300 bg-white'
          }`}>
            {hasAllSelected && <Check size={12} className="text-white" />}
          </View>
          <Text className="font-medium text-gray-700">
            {hasAllSelected ? 'Deselect All' : 'Select All'}
          </Text>
          <Text className="text-sm text-gray-500 ml-2">
            ({filteredOptions.length} options)
          </Text>
        </TouchableOpacity>
      )}

      {/* Options List */}
      <View style={{ maxHeight }} className="border border-gray-200 rounded-lg">
        {virtualized && filteredOptions.length > 50 ? (
          <VirtualizedList
            data={filteredOptions}
            renderItem={renderVirtualizedOption}
            keyExtractor={keyExtractor}
            getItem={getItem}
            getItemCount={getItemCount}
            showsVerticalScrollIndicator={false}
            initialNumToRender={10}
            maxToRenderPerBatch={20}
            windowSize={10}
          />
        ) : (
          <FlatList
            data={filteredOptions}
            renderItem={renderOption}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            scrollEnabled={filteredOptions.length > 5}
          />
        )}
      </View>

      {/* Selected Count */}
      {selectedValues.length > 0 && (
        <Text className="text-sm text-gray-600 mt-2">
          {selectedValues.length} selected
        </Text>
      )}

      {/* No Results */}
      {searchQuery && filteredOptions.length === 0 && (
        <View className="p-4 items-center">
          <Text className="text-gray-500">No options found for "{searchQuery}"</Text>
        </View>
      )}
    </View>
  );
});

MultiSelectFilter.displayName = 'MultiSelectFilter';
