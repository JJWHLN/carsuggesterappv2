import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { ChevronDown, ChevronUp, X } from 'lucide-react-native';
import { SearchFilters, FilterPreset } from '../../features/recommendations/types/search';
import { PriceRangeSlider } from './PriceRangeSlider';
import { MultiSelectFilter } from './MultiSelectFilter';

interface FilterPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onClearAll: () => void;
  presets: FilterPreset[];
  onSavePreset: (name: string) => void;
  onLoadPreset: (preset: FilterPreset) => void;
  isVisible: boolean;
  onClose: () => void;
  appliedCount: number;
  className?: string;
}

interface FilterSection {
  id: keyof SearchFilters;
  title: string;
  component: React.ReactNode;
  isExpanded: boolean;
}

export const FilterPanel: React.FC<FilterPanelProps> = React.memo(({
  filters,
  onFiltersChange,
  onClearAll,
  presets,
  onSavePreset,
  onLoadPreset,
  isVisible,
  onClose,
  appliedCount,
  className = "",
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['priceRange', 'makes', 'bodyTypes'])
  );
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [presetName, setPresetName] = useState('');

  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  const handleSavePreset = useCallback(() => {
    if (presetName.trim()) {
      onSavePreset(presetName.trim());
      setPresetName('');
      setShowPresetInput(false);
    }
  }, [presetName, onSavePreset]);

  const bodyTypeOptions = [
    { value: 'sedan', label: 'Sedan', icon: '🚗' },
    { value: 'suv', label: 'SUV', icon: '🚙' },
    { value: 'hatchback', label: 'Hatchback', icon: '🚗' },
    { value: 'coupe', label: 'Coupe', icon: '🏎️' },
    { value: 'convertible', label: 'Convertible', icon: '🚗' },
    { value: 'truck', label: 'Truck', icon: '🚚' },
    { value: 'van', label: 'Van', icon: '🚐' },
    { value: 'wagon', label: 'Wagon', icon: '🚗' },
  ];

  const fuelTypeOptions = [
    { value: 'gasoline', label: 'Gasoline', icon: '⛽' },
    { value: 'electric', label: 'Electric', icon: '🔋' },
    { value: 'hybrid', label: 'Hybrid', icon: '🔋⛽' },
    { value: 'diesel', label: 'Diesel', icon: '⛽' },
    { value: 'plugin-hybrid', label: 'Plug-in Hybrid', icon: '🔌' },
  ];

  const transmissionOptions = [
    { value: 'automatic', label: 'Automatic' },
    { value: 'manual', label: 'Manual' },
    { value: 'cvt', label: 'CVT' },
  ];

  const colorOptions = [
    { value: 'white', label: 'White', color: '#FFFFFF' },
    { value: 'black', label: 'Black', color: '#000000' },
    { value: 'silver', label: 'Silver', color: '#C0C0C0' },
    { value: 'gray', label: 'Gray', color: '#808080' },
    { value: 'red', label: 'Red', color: '#FF0000' },
    { value: 'blue', label: 'Blue', color: '#0000FF' },
    { value: 'green', label: 'Green', color: '#008000' },
    { value: 'yellow', label: 'Yellow', color: '#FFFF00' },
  ];

  const filterSections: FilterSection[] = useMemo(() => [
    {
      id: 'priceRange',
      title: 'Price Range',
      isExpanded: expandedSections.has('priceRange'),
      component: (
        <PriceRangeSlider
          value={filters.priceRange}
          onChange={(range) => onFiltersChange({ priceRange: range })}
          min={0}
          max={200000}
          step={1000}
          formatValue={(value) => `$${value.toLocaleString()}`}
        />
      ),
    },
    {
      id: 'yearRange',
      title: 'Year Range',
      isExpanded: expandedSections.has('yearRange'),
      component: (
        <PriceRangeSlider
          value={filters.yearRange}
          onChange={(range) => onFiltersChange({ yearRange: range })}
          min={2015}
          max={2025}
          step={1}
          formatValue={(value) => value.toString()}
        />
      ),
    },
    {
      id: 'makes',
      title: 'Make',
      isExpanded: expandedSections.has('makes'),
      component: (
        <MultiSelectFilter
          options={[
            { value: 'toyota', label: 'Toyota' },
            { value: 'honda', label: 'Honda' },
            { value: 'ford', label: 'Ford' },
            { value: 'chevrolet', label: 'Chevrolet' },
            { value: 'nissan', label: 'Nissan' },
            { value: 'bmw', label: 'BMW' },
            { value: 'mercedes', label: 'Mercedes-Benz' },
            { value: 'audi', label: 'Audi' },
            { value: 'volkswagen', label: 'Volkswagen' },
            { value: 'hyundai', label: 'Hyundai' },
          ]}
          selectedValues={filters.makes}
          onChange={(values) => onFiltersChange({ makes: values })}
          searchable
        />
      ),
    },
    {
      id: 'bodyTypes',
      title: 'Body Type',
      isExpanded: expandedSections.has('bodyTypes'),
      component: (
        <View className="grid grid-cols-2 gap-2">
          {bodyTypeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => {
                const newBodyTypes = filters.bodyTypes.includes(option.value)
                  ? filters.bodyTypes.filter(bt => bt !== option.value)
                  : [...filters.bodyTypes, option.value];
                onFiltersChange({ bodyTypes: newBodyTypes });
              }}
              className={`p-3 rounded-lg border-2 items-center ${
                filters.bodyTypes.includes(option.value)
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <Text className="text-2xl mb-1">{option.icon}</Text>
              <Text className={`text-sm font-medium ${
                filters.bodyTypes.includes(option.value)
                  ? 'text-green-700'
                  : 'text-gray-700'
              }`}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ),
    },
    {
      id: 'fuelTypes',
      title: 'Fuel Type',
      isExpanded: expandedSections.has('fuelTypes'),
      component: (
        <View className="flex-row flex-wrap gap-2">
          {fuelTypeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => {
                const newFuelTypes = filters.fuelTypes.includes(option.value)
                  ? filters.fuelTypes.filter(ft => ft !== option.value)
                  : [...filters.fuelTypes, option.value];
                onFiltersChange({ fuelTypes: newFuelTypes });
              }}
              className={`px-4 py-2 rounded-full border flex-row items-center ${
                filters.fuelTypes.includes(option.value)
                  ? 'border-green-500 bg-green-500'
                  : 'border-gray-300 bg-white'
              }`}
            >
              <Text className="mr-2">{option.icon}</Text>
              <Text className={`font-medium ${
                filters.fuelTypes.includes(option.value)
                  ? 'text-white'
                  : 'text-gray-700'
              }`}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ),
    },
    {
      id: 'colors',
      title: 'Color',
      isExpanded: expandedSections.has('colors'),
      component: (
        <View className="flex-row flex-wrap gap-3">
          {colorOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => {
                const newColors = filters.colors.includes(option.value)
                  ? filters.colors.filter(c => c !== option.value)
                  : [...filters.colors, option.value];
                onFiltersChange({ colors: newColors });
              }}
              className={`w-12 h-12 rounded-full border-4 items-center justify-center ${
                filters.colors.includes(option.value)
                  ? 'border-green-500'
                  : 'border-gray-300'
              }`}
              style={{ backgroundColor: option.color }}
            >
              {filters.colors.includes(option.value) && (
                <Text className="text-white font-bold">✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ),
    },
  ], [filters, expandedSections, onFiltersChange]);

  if (!isVisible) return null;

  return (
    <View className={`bg-white border-t border-gray-200 ${className}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
        <View className="flex-row items-center">
          <Text className="text-lg font-semibold text-gray-800">Filters</Text>
          {appliedCount > 0 && (
            <View className="ml-2 bg-green-500 rounded-full px-2 py-1">
              <Text className="text-white text-xs font-bold">{appliedCount}</Text>
            </View>
          )}
        </View>
        
        <View className="flex-row items-center space-x-2">
          {appliedCount > 0 && (
            <TouchableOpacity
              onPress={onClearAll}
              className="px-3 py-1 bg-gray-100 rounded-full"
            >
              <Text className="text-gray-600 text-sm">Clear All</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity onPress={onClose} className="p-1">
            <X size={24} className="text-gray-600" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
        {/* Filter Sections */}
        {filterSections.map((section) => (
          <View key={section.id} className="border-b border-gray-100">
            <TouchableOpacity
              onPress={() => toggleSection(section.id)}
              className="flex-row items-center justify-between p-4 bg-gray-50"
            >
              <Text className="font-medium text-gray-800">{section.title}</Text>
              {section.isExpanded ? (
                <ChevronUp size={20} className="text-gray-600" />
              ) : (
                <ChevronDown size={20} className="text-gray-600" />
              )}
            </TouchableOpacity>
            
            {section.isExpanded && (
              <View className="p-4">
                {section.component}
              </View>
            )}
          </View>
        ))}

        {/* Presets Section */}
        <View className="p-4">
          <Text className="font-medium text-gray-800 mb-3">Filter Presets</Text>
          
          <View className="flex-row flex-wrap gap-2 mb-3">
            {presets.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                onPress={() => onLoadPreset(preset)}
                className="px-3 py-2 bg-blue-100 rounded-full border border-blue-300"
              >
                <Text className="text-blue-700 text-sm">{preset.name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => setShowPresetInput(true)}
            className="px-4 py-2 bg-green-500 rounded-lg items-center"
          >
            <Text className="text-white font-medium">Save Current Filters</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
});

FilterPanel.displayName = 'FilterPanel';
