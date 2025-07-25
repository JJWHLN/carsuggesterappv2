import React, { useState, useEffect } from 'react';
import { View, ScrollView, TouchableOpacity, Text, Dimensions } from 'react-native';
import { ArrowLeft, Plus, Settings } from 'lucide-react-native';
import { ComparisonProvider, useComparison } from './ComparisonContext';
import { ComparisonTable } from './ComparisonTable';
import { ComparisonDrawer } from './ComparisonDrawer';
import { ExtendedCar } from './types';

interface ComparisonScreenProps {
  navigation?: any;
  initialCars?: ExtendedCar[];
}

const ComparisonScreenContent: React.FC<ComparisonScreenProps> = ({ 
  navigation, 
  initialCars = [] 
}) => {
  const { state, actions } = useComparison();
  const [showDrawer, setShowDrawer] = useState(false);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);

  // Handle screen orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
      // Auto-switch to mobile view on narrow screens
      if (window.width < 768) {
        actions.setViewMode('mobile');
      } else {
        actions.setViewMode('desktop');
      }
    });

    return () => subscription?.remove();
  }, [actions]);

  // Load initial cars
  useEffect(() => {
    initialCars.forEach(car => {
      actions.addCar(car);
    });
  }, [initialCars, actions]);

  // Mock data for demonstration
  const mockCars: ExtendedCar[] = [
    {
      id: '1',
      make: 'Toyota',
      model: 'Camry',
      year: 2023,
      price: 28000,
      bodyStyle: 'Sedan',
      fuelEfficiency: 32,
      brand: 'Toyota',
      features: ['Backup Camera', 'Bluetooth', 'Navigation', 'Lane Keep Assist'],
      safetyRating: 5,
      images: [],
      msrp: 30000,
      marketPrice: 28000,
      depreciation: 15,
      acceleration: 7.8,
      horsepower: 203,
      torque: 184,
      dimensions: {
        length: 192.7,
        width: 72.4,
        height: 56.9,
        wheelbase: 111.2,
        cargoSpace: 15.1,
        seatingCapacity: 5,
      },
      safetyDetails: {
        overallRating: 5,
        frontalCrash: 5,
        sideCrash: 5,
        rollover: 4,
        pedestrianSafety: 5,
      },
      featuresByCategory: {
        'Safety': ['Lane Keep Assist', 'Automatic Emergency Braking', 'Blind Spot Monitor'],
        'Technology': ['Navigation', 'Bluetooth', 'Apple CarPlay', 'Android Auto'],
        'Comfort': ['Heated Seats', 'Dual-Zone Climate', 'Power Driver Seat'],
      },
      warranty: {
        basic: '3 years/36,000 miles',
        powertrain: '5 years/60,000 miles',
        corrosion: '5 years/unlimited miles',
        roadside: '2 years/25,000 miles',
      },
      reliabilityScore: 85,
      ownerSatisfaction: 82,
      resaleValue: 65,
    },
    {
      id: '2',
      make: 'Honda',
      model: 'Accord',
      year: 2023,
      price: 26500,
      bodyStyle: 'Sedan',
      fuelEfficiency: 35,
      brand: 'Honda',
      features: ['Apple CarPlay', 'Lane Keeping Assist', 'Adaptive Cruise Control'],
      safetyRating: 5,
      images: [],
      msrp: 28500,
      marketPrice: 26500,
      depreciation: 18,
      acceleration: 7.2,
      horsepower: 192,
      torque: 192,
      dimensions: {
        length: 195.7,
        width: 73.3,
        height: 57.1,
        wheelbase: 111.4,
        cargoSpace: 16.7,
        seatingCapacity: 5,
      },
      safetyDetails: {
        overallRating: 5,
        frontalCrash: 5,
        sideCrash: 5,
        rollover: 5,
        pedestrianSafety: 4,
      },
      featuresByCategory: {
        'Safety': ['Honda Sensing Suite', 'Collision Mitigation', 'Road Departure Mitigation'],
        'Technology': ['Apple CarPlay', 'Android Auto', 'Wireless Charging', '8" Display'],
        'Comfort': ['Heated/Ventilated Seats', 'Remote Start', '12-Way Power Seat'],
      },
      warranty: {
        basic: '3 years/36,000 miles',
        powertrain: '5 years/60,000 miles',
        corrosion: '5 years/unlimited miles',
        roadside: '3 years/36,000 miles',
      },
      reliabilityScore: 88,
      ownerSatisfaction: 85,
      resaleValue: 68,
    },
  ];

  const handleAddCar = (car: ExtendedCar) => {
    actions.addCar(car);
    setShowDrawer(false);
  };

  const handleOpenDrawer = () => {
    setShowDrawer(true);
  };

  const handleCloseDrawer = () => {
    setShowDrawer(false);
  };

  const handleOpenFullComparison = () => {
    setShowDrawer(false);
  };

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          {navigation && (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="mr-3 p-2"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </TouchableOpacity>
          )}
          
          <Text className="text-xl font-bold text-gray-900">
            Car Comparison
          </Text>
          
          {state.cars.length > 0 && (
            <View className="bg-green-500 rounded-full w-6 h-6 items-center justify-center ml-2">
              <Text className="text-white text-xs font-bold">
                {state.cars.length}
              </Text>
            </View>
          )}
        </View>

        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={handleOpenDrawer}
            className="flex-row items-center bg-green-500 rounded-lg px-4 py-2"
          >
            <Plus size={16} className="text-white mr-1" />
            <Text className="text-white font-medium">Add Cars</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      {state.viewMode === 'mobile' && screenWidth < 768 ? (
        /* Mobile View - Swipeable Cards */
        <ScrollView 
          horizontal 
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          className="flex-1"
        >
          {state.cars.length > 0 ? (
            state.cars.map((car, index) => (
              <View key={car.id} className="w-full px-4 py-6" style={{ width: screenWidth }}>
                <View className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-lg font-bold text-gray-900">
                      {car.year} {car.make} {car.model}
                    </Text>
                    <TouchableOpacity
                      onPress={() => actions.removeCar(car.id)}
                      className="p-2"
                    >
                      <Text className="text-red-500">✕</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Car details in mobile format */}
                  <View className="space-y-4">
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">Price</Text>
                      <Text className="font-semibold text-green-600">
                        ${car.price.toLocaleString()}
                      </Text>
                    </View>
                    
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">Fuel Economy</Text>
                      <Text className="font-semibold">{car.fuelEfficiency} MPG</Text>
                    </View>
                    
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">Horsepower</Text>
                      <Text className="font-semibold">{car.horsepower} HP</Text>
                    </View>
                    
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">Safety Rating</Text>
                      <View className="flex-row">
                        {[...Array(5)].map((_, i) => (
                          <Text
                            key={i}
                            className={i < car.safetyRating ? 'text-yellow-400' : 'text-gray-300'}
                          >
                            ⭐
                          </Text>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Page indicator */}
                  <View className="flex-row justify-center mt-6 space-x-1">
                    {state.cars.map((_, i) => (
                      <View
                        key={i}
                        className={`w-2 h-2 rounded-full ${
                          i === index ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className="flex-1 justify-center items-center px-8" style={{ width: screenWidth }}>
              <Text className="text-6xl mb-4">🚗</Text>
              <Text className="text-xl font-semibold text-gray-800 mb-2 text-center">
                No Cars Selected
              </Text>
              <Text className="text-gray-600 text-center mb-6">
                Add cars to your comparison to see detailed analysis
              </Text>
              <TouchableOpacity
                onPress={handleOpenDrawer}
                className="bg-green-500 rounded-lg px-6 py-3"
              >
                <Text className="text-white font-semibold">Add Cars</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      ) : (
        /* Desktop View - Full Table */
        <ComparisonTable />
      )}

      {/* Quick Add Demo Cars Button */}
      {state.cars.length === 0 && (
        <View className="absolute bottom-6 left-6 right-6">
          <TouchableOpacity
            onPress={() => {
              mockCars.forEach(car => handleAddCar(car));
            }}
            className="bg-blue-500 rounded-lg py-4 items-center"
          >
            <Text className="text-white font-semibold">
              Add Demo Cars for Testing
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Comparison Drawer */}
      <ComparisonDrawer
        isVisible={showDrawer}
        onClose={handleCloseDrawer}
        onOpenFullComparison={handleOpenFullComparison}
      />
    </View>
  );
};

export const ComparisonScreen: React.FC<ComparisonScreenProps> = (props) => {
  return (
    <ComparisonProvider>
      <ComparisonScreenContent {...props} />
    </ComparisonProvider>
  );
};
