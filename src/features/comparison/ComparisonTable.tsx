import React, { useState, useMemo } from 'react';
import { View, ScrollView, Text, TouchableOpacity, Image } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  SlideInUp,
  SlideOutUp,
} from 'react-native-reanimated';
import {
  X,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Star,
  Award,
  Share,
  FileText,
  Grip,
  Eye,
  EyeOff,
} from 'lucide-react-native';
import { useComparison } from '@/stores';
import { ExtendedCar, ComparisonField, comparisonSections } from './types';

interface ComparisonTableProps {
  className?: string;
}

export const ComparisonTable: React.FC<ComparisonTableProps> = ({
  className = '',
}) => {
  const comparison = useComparison();
  const [draggedCar, setDraggedCar] = useState<string | null>(null);

  // Get field value from car object using dot notation
  const getFieldValue = (car: ExtendedCar, field: ComparisonField): any => {
    const keys = field.key.split('.');
    let value: any = car;

    for (const key of keys) {
      value = value?.[key];
    }

    return value;
  };

  // Format field value based on type
  const formatFieldValue = (value: any, field: ComparisonField): string => {
    if (value === null || value === undefined) return 'N/A';

    if (field.format) {
      return field.format(value);
    }

    switch (field.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0,
        }).format(value);

      case 'percentage':
        return `${value}${field.unit || '%'}`;

      case 'number':
        return `${value}${field.unit ? ` ${field.unit}` : ''}`;

      case 'rating':
        return `${value}/5`;

      case 'array':
        return Array.isArray(value) ? value.join(', ') : String(value);

      default:
        return String(value);
    }
  };

  // Determine if field value is best/worst in comparison
  const getFieldHighlight = (car: ExtendedCar, field: ComparisonField) => {
    if (!field.highlightBest && !field.highlightWorst) return null;

    const values = comparison.comparisonCars
      .map((c) => getFieldValue(c, field))
      .filter((v) => v !== null && v !== undefined);
    if (values.length < 2) return null;

    const currentValue = getFieldValue(car, field);
    if (currentValue === null || currentValue === undefined) return null;

    const numericValues = values
      .map((v) => (typeof v === 'number' ? v : parseFloat(v)))
      .filter((v) => !isNaN(v));
    if (numericValues.length < 2) return null;

    const currentNumeric =
      typeof currentValue === 'number'
        ? currentValue
        : parseFloat(currentValue);
    if (isNaN(currentNumeric)) return null;

    const max = Math.max(...numericValues);
    const min = Math.min(...numericValues);

    if (field.highlightBest && currentNumeric === max) return 'best';
    if (field.highlightWorst && currentNumeric === min) return 'worst';
    if (
      field.highlightBest &&
      currentNumeric === min &&
      field.key.includes('acceleration')
    )
      return 'best'; // Lower is better for 0-60

    return null;
  };

  // Check if row has differences
  const hasRowDifferences = (field: ComparisonField) => {
    const values = comparison.comparisonCars.map((car) =>
      getFieldValue(car, field),
    );
    const uniqueValues = [...new Set(values.map((v) => JSON.stringify(v)))];
    return uniqueValues.length > 1;
  };

  // Filter sections and fields based on user preferences
  const visibleSections = useMemo(() => {
    return comparisonSections
      .filter((section) => state.selectedSections.includes(section.id))
      .map((section) => ({
        ...section,
        fields: section.fields.filter(
          (field) => !state.showDifferencesOnly || hasRowDifferences(field),
        ),
      }))
      .filter((section) => section.fields.length > 0);
  }, [
    state.selectedSections,
    state.showDifferencesOnly,
    comparison.comparisonCars,
  ]);

  // Handle drag and drop reordering
  const handleDragStart = (carId: string) => {
    setDraggedCar(carId);
  };

  const handleDragEnd = () => {
    setDraggedCar(null);
  };

  const handleDrop = (targetIndex: number) => {
    if (!draggedCar) return;

    const fromIndex = comparison.comparisonCars.findIndex(
      (car) => car.id === draggedCar,
    );
    if (fromIndex !== -1 && fromIndex !== targetIndex) {
      comparison.reorderComparison(fromIndex, targetIndex);
    }

    setDraggedCar(null);
  };

  if (comparison.comparisonCars.length === 0) {
    return (
      <View
        className={`flex-1 justify-center items-center bg-gray-50 ${className}`}
      >
        <Text className="text-6xl mb-4">🚗</Text>
        <Text className="text-xl font-semibold text-gray-800 mb-2">
          No Cars Selected
        </Text>
        <Text className="text-gray-600 text-center px-8">
          Add cars to your comparison to see detailed side-by-side analysis
        </Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 bg-white ${className}`}>
      {/* Header Controls */}
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
        <Text className="text-lg font-semibold text-gray-800">
          Compare {comparison.comparisonCars.length} Cars
        </Text>

        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={actions.toggleDifferencesOnly}
            className={`flex-row items-center px-3 py-2 rounded-lg ${
              state.showDifferencesOnly ? 'bg-blue-100' : 'bg-gray-100'
            }`}
          >
            {state.showDifferencesOnly ? (
              <Eye size={16} className="text-blue-600 mr-1" />
            ) : (
              <EyeOff size={16} className="text-gray-600 mr-1" />
            )}
            <Text
              className={`text-sm font-medium ${
                state.showDifferencesOnly ? 'text-blue-700' : 'text-gray-700'
              }`}
            >
              Differences Only
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={actions.shareComparison}
            className="flex-row items-center px-3 py-2 rounded-lg bg-green-100"
          >
            <Share size={16} className="text-green-600 mr-1" />
            <Text className="text-sm font-medium text-green-700">Share</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={actions.exportToPDF}
            className="flex-row items-center px-3 py-2 rounded-lg bg-gray-100"
          >
            <FileText size={16} className="text-gray-600 mr-1" />
            <Text className="text-sm font-medium text-gray-700">Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Sticky Car Headers */}
        <View className="sticky top-0 bg-white border-b border-gray-200 z-10">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row min-w-full">
              {/* Section Label Column */}
              <View className="w-48 p-4">
                <Text className="text-sm font-medium text-gray-600">
                  Vehicle
                </Text>
              </View>

              {/* Car Columns */}
              {comparison.comparisonCars.map((car, index) => (
                <motion.div
                  key={car.id}
                  layout
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  onDragStart={() => handleDragStart(car.id)}
                  onDragEnd={handleDragEnd}
                  className={`w-64 p-4 border-l border-gray-200 ${
                    draggedCar === car.id ? 'opacity-50' : ''
                  }`}
                  whileDrag={{ scale: 1.05, zIndex: 1000 }}
                >
                  <View className="relative">
                    {/* Drag Handle */}
                    <TouchableOpacity className="absolute top-0 right-0 p-1">
                      <Grip size={16} className="text-gray-400" />
                    </TouchableOpacity>

                    {/* Remove Button */}
                    <TouchableOpacity
                      onPress={() => comparison.removeFromComparison(car.id)}
                      className="absolute top-0 right-8 p-1"
                    >
                      <X size={16} className="text-red-500" />
                    </TouchableOpacity>

                    {/* Car Image */}
                    <View className="w-full h-32 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                      {car.images?.[0] ? (
                        <Image
                          source={{ uri: car.images[0] }}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <View className="w-full h-full justify-center items-center">
                          <Text className="text-4xl">🚗</Text>
                        </View>
                      )}
                    </View>

                    {/* Car Info */}
                    <Text className="font-bold text-gray-900 text-center mb-1">
                      {car.year} {car.make}
                    </Text>
                    <Text className="text-sm text-gray-600 text-center mb-2">
                      {car.model}
                    </Text>
                    <Text className="text-lg font-bold text-green-600 text-center">
                      ${car.price.toLocaleString()}
                    </Text>
                  </View>
                </motion.div>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Comparison Sections */}
        <AnimatePresence>
          {visibleSections.map((section) => (
            <motion.div
              key={section.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-b border-gray-200"
            >
              {/* Section Header */}
              <TouchableOpacity
                onPress={() =>
                  state.expandedSections.includes(section.id)
                    ? actions.collapseSection(section.id)
                    : actions.expandSection(section.id)
                }
                className="flex-row items-center justify-between p-4 bg-gray-50"
              >
                <View className="flex-row items-center">
                  <Text className="text-xl mr-2">{section.icon}</Text>
                  <Text className="text-lg font-semibold text-gray-800">
                    {section.title}
                  </Text>
                </View>

                {state.expandedSections.includes(section.id) ? (
                  <ChevronUp size={20} className="text-gray-600" />
                ) : (
                  <ChevronDown size={20} className="text-gray-600" />
                )}
              </TouchableOpacity>

              {/* Section Content */}
              {state.expandedSections.includes(section.id) && (
                <AnimatePresence>
                  {section.fields.map((field) => (
                    <motion.div
                      key={field.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                      >
                        <View className="flex-row min-w-full border-b border-gray-100">
                          {/* Field Label */}
                          <View className="w-48 p-4 justify-center">
                            <Text className="text-sm font-medium text-gray-700">
                              {field.label}
                            </Text>
                          </View>

                          {/* Field Values */}
                          {comparison.comparisonCars.map((car) => {
                            const value = getFieldValue(car, field);
                            const highlight = getFieldHighlight(car, field);

                            return (
                              <View
                                key={car.id}
                                className={`w-64 p-4 border-l border-gray-200 justify-center ${
                                  highlight === 'best'
                                    ? 'bg-green-50'
                                    : highlight === 'worst'
                                      ? 'bg-red-50'
                                      : hasRowDifferences(field)
                                        ? 'bg-yellow-50'
                                        : ''
                                }`}
                              >
                                <View className="flex-row items-center">
                                  {field.type === 'rating' && (
                                    <View className="flex-row mr-2">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          size={12}
                                          className={
                                            i < value
                                              ? 'text-yellow-400 fill-current'
                                              : 'text-gray-300'
                                          }
                                        />
                                      ))}
                                    </View>
                                  )}

                                  <Text
                                    className={`text-sm ${
                                      highlight === 'best'
                                        ? 'text-green-700 font-semibold'
                                        : highlight === 'worst'
                                          ? 'text-red-700 font-semibold'
                                          : 'text-gray-800'
                                    }`}
                                  >
                                    {formatFieldValue(value, field)}
                                  </Text>

                                  {highlight === 'best' && (
                                    <Award
                                      size={14}
                                      className="text-green-600 ml-1"
                                    />
                                  )}
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      </ScrollView>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </ScrollView>
    </View>
  );
};
