import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  ArrowRight, 
  Settings, 
  ChevronUp,
  Eye,
  EyeOff,
  Share,
  FileText,
  Trash2 
} from 'lucide-react-native';
import { useComparison, useComparisonCars, useComparisonCount } from './ComparisonContext';
import { comparisonSections } from './types';

interface ComparisonDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  onOpenFullComparison: () => void;
}

export const ComparisonDrawer: React.FC<ComparisonDrawerProps> = ({
  isVisible,
  onClose,
  onOpenFullComparison,
}) => {
  const { state, actions } = useComparison();
  const cars = useComparisonCars();
  const carCount = useComparisonCount();
  const [showSettings, setShowSettings] = useState(false);

  const quickStats = [
    { label: 'Avg Price', value: cars.length > 0 ? `$${Math.round(cars.reduce((sum, car) => sum + car.price, 0) / cars.length).toLocaleString()}` : 'N/A' },
    { label: 'Price Range', value: cars.length > 0 ? `$${Math.min(...cars.map(c => c.price)).toLocaleString()} - $${Math.max(...cars.map(c => c.price)).toLocaleString()}` : 'N/A' },
    { label: 'Avg MPG', value: cars.length > 0 ? `${Math.round(cars.reduce((sum, car) => sum + car.fuelEfficiency, 0) / cars.length)} mpg` : 'N/A' },
  ];

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <View className="absolute inset-0 bg-black/50 z-40" />
      
      {/* Drawer */}
      <motion.div
        initial={{ translateY: '100%' }}
        animate={{ translateY: 0 }}
        exit={{ translateY: '100%' }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[80vh]"
      >
        {/* Handle */}
        <View className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-4" />
        
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pb-4">
          <View className="flex-row items-center">
            <Text className="text-xl font-bold text-gray-900 mr-2">
              Car Comparison
            </Text>
            {carCount > 0 && (
              <View className="bg-green-500 rounded-full w-6 h-6 items-center justify-center">
                <Text className="text-white text-xs font-bold">{carCount}</Text>
              </View>
            )}
          </View>
          
          <View className="flex-row space-x-2">
            <TouchableOpacity
              onPress={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full bg-gray-100"
            >
              <Settings size={18} className="text-gray-600" />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onClose}
              className="p-2 rounded-full bg-gray-100"
            >
              <X size={18} className="text-gray-600" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-gray-200 bg-gray-50"
            >
              <View className="p-4">
                <Text className="text-sm font-semibold text-gray-700 mb-3">
                  Display Options
                </Text>
                
                <View className="space-y-3">
                  {/* View Mode Toggle */}
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-gray-600">View Mode</Text>
                    <View className="flex-row bg-gray-200 rounded-lg p-1">
                      <TouchableOpacity
                        onPress={() => actions.setViewMode('desktop')}
                        className={`px-3 py-1 rounded-md ${
                          state.viewMode === 'desktop' ? 'bg-white shadow-sm' : ''
                        }`}
                      >
                        <Text className={`text-xs ${
                          state.viewMode === 'desktop' ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          Desktop
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => actions.setViewMode('mobile')}
                        className={`px-3 py-1 rounded-md ${
                          state.viewMode === 'mobile' ? 'bg-white shadow-sm' : ''
                        }`}
                      >
                        <Text className={`text-xs ${
                          state.viewMode === 'mobile' ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          Mobile
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Differences Only Toggle */}
                  <View className="flex-row items-center justify-between">
                    <Text className="text-sm text-gray-600">Show Differences Only</Text>
                    <TouchableOpacity
                      onPress={actions.toggleDifferencesOnly}
                      className={`flex-row items-center px-3 py-1 rounded-lg ${
                        state.showDifferencesOnly ? 'bg-blue-100' : 'bg-gray-200'
                      }`}
                    >
                      {state.showDifferencesOnly ? (
                        <Eye size={14} className="text-blue-600 mr-1" />
                      ) : (
                        <EyeOff size={14} className="text-gray-600 mr-1" />
                      )}
                      <Text className={`text-xs ${
                        state.showDifferencesOnly ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        {state.showDifferencesOnly ? 'On' : 'Off'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Section Selection */}
                  <View>
                    <Text className="text-sm text-gray-600 mb-2">Visible Sections</Text>
                    <View className="flex-row flex-wrap">
                      {comparisonSections.map((section) => (
                        <TouchableOpacity
                          key={section.id}
                          onPress={() => actions.toggleSection(section.id)}
                          className={`flex-row items-center m-1 px-3 py-1 rounded-full border ${
                            state.selectedSections.includes(section.id)
                              ? 'bg-green-50 border-green-200'
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <Text className="mr-1">{section.icon}</Text>
                          <Text className={`text-xs ${
                            state.selectedSections.includes(section.id)
                              ? 'text-green-700'
                              : 'text-gray-600'
                          }`}>
                            {section.title}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </motion.div>
          )}
        </AnimatePresence>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {carCount === 0 ? (
            /* Empty State */
            <View className="py-12 px-6 items-center">
              <Text className="text-6xl mb-4">🚗</Text>
              <Text className="text-xl font-semibold text-gray-800 mb-2 text-center">
                Start Your Comparison
              </Text>
              <Text className="text-gray-600 text-center mb-6">
                Add up to 4 cars to compare their features, pricing, and specifications side-by-side.
              </Text>
              
              <TouchableOpacity
                onPress={onClose}
                className="flex-row items-center bg-green-500 rounded-lg px-6 py-3"
              >
                <Plus size={20} className="text-white mr-2" />
                <Text className="text-white font-semibold">Add Cars</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="px-6 pb-6">
              {/* Quick Stats */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-800 mb-3">
                  Quick Overview
                </Text>
                <View className="flex-row space-x-4">
                  {quickStats.map((stat, index) => (
                    <View key={index} className="flex-1 bg-gray-50 rounded-lg p-3">
                      <Text className="text-xs text-gray-600 mb-1">{stat.label}</Text>
                      <Text className="text-sm font-semibold text-gray-900">{stat.value}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Car Cards */}
              <View className="mb-6">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-lg font-semibold text-gray-800">
                    Selected Cars ({carCount}/4)
                  </Text>
                  
                  {carCount > 0 && (
                    <TouchableOpacity
                      onPress={comparison.clearComparison}
                      className="flex-row items-center px-3 py-1 rounded-lg bg-red-50"
                    >
                      <Trash2 size={14} className="text-red-600 mr-1" />
                      <Text className="text-red-700 text-xs font-medium">Clear All</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row space-x-3">
                    {cars.map((car, index) => (
                      <motion.div
                        key={car.id}
                        layout
                        className="w-48 bg-white border border-gray-200 rounded-lg p-3"
                      >
                        <View className="relative">
                          <TouchableOpacity
                            onPress={() => comparison.removeFromComparison(car.id)}
                            className="absolute top-0 right-0 p-1 z-10"
                          >
                            <X size={14} className="text-red-500" />
                          </TouchableOpacity>
                          
                          <View className="w-full h-24 bg-gray-100 rounded-lg mb-2 items-center justify-center">
                            <Text className="text-2xl">🚗</Text>
                          </View>
                          
                          <Text className="font-semibold text-gray-900 text-sm mb-1">
                            {car.year} {car.make} {car.model}
                          </Text>
                          
                          <Text className="text-green-600 font-bold text-lg">
                            ${car.price.toLocaleString()}
                          </Text>
                          
                          <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-100">
                            <Text className="text-xs text-gray-600">
                              {car.fuelEfficiency} MPG
                            </Text>
                            <View className="flex-row">
                              {[...Array(5)].map((_, i) => (
                                <Text
                                  key={i}
                                  className={i < car.safetyRating ? 'text-yellow-400' : 'text-gray-300'}
                                  style={{ fontSize: 10 }}
                                >
                                  ⭐
                                </Text>
                              ))}
                            </View>
                          </View>
                        </View>
                      </motion.div>
                    ))}

                    {/* Add More Button */}
                    {carCount < 4 && (
                      <TouchableOpacity
                        onPress={onClose}
                        className="w-48 h-32 border-2 border-dashed border-gray-300 rounded-lg items-center justify-center"
                      >
                        <Plus size={24} className="text-gray-400 mb-2" />
                        <Text className="text-gray-500 text-sm font-medium">
                          Add Car
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>
              </View>

              {/* Action Buttons */}
              <View className="space-y-3">
                <TouchableOpacity
                  onPress={onOpenFullComparison}
                  className="flex-row items-center justify-center bg-green-500 rounded-lg py-4"
                  disabled={carCount === 0}
                >
                  <Text className="text-white font-semibold mr-2">
                    View Full Comparison
                  </Text>
                  <ArrowRight size={20} className="text-white" />
                </TouchableOpacity>

                {carCount > 0 && (
                  <View className="flex-row space-x-3">
                    <TouchableOpacity
                      onPress={actions.shareComparison}
                      className="flex-1 flex-row items-center justify-center bg-blue-500 rounded-lg py-3"
                    >
                      <Share size={18} className="text-white mr-2" />
                      <Text className="text-white font-medium">Share</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={actions.exportToPDF}
                      className="flex-1 flex-row items-center justify-center bg-gray-500 rounded-lg py-3"
                    >
                      <FileText size={18} className="text-white mr-2" />
                      <Text className="text-white font-medium">Export</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </motion.div>
    </>
  );
};
