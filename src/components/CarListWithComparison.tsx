import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Plus, GitCompare } from 'lucide-react-native';
import { 
  ComparisonProvider, 
  useComparison, 
  useIsCarInComparison,
  useCanAddCar,
  ExtendedCar 
} from '../features/comparison';
import { Car } from '../features/recommendations/types';

interface CarListWithComparisonProps {
  cars: Car[];
  onNavigateToComparison: () => void;
}

// Convert basic Car to ExtendedCar with mock data
const extendCarData = (car: Car): ExtendedCar => ({
  ...car,
  images: [],
  msrp: car.price * 1.1,
  marketPrice: car.price,
  depreciation: Math.floor(Math.random() * 20) + 10,
  acceleration: Math.random() * 3 + 6,
  horsepower: Math.floor(Math.random() * 100) + 150,
  torque: Math.floor(Math.random() * 50) + 150,
  dimensions: {
    length: Math.random() * 20 + 180,
    width: Math.random() * 5 + 70,
    height: Math.random() * 5 + 55,
    wheelbase: Math.random() * 10 + 105,
    cargoSpace: Math.random() * 10 + 10,
    seatingCapacity: 5,
  },
  safetyDetails: {
    overallRating: car.safetyRating,
    frontalCrash: Math.min(5, car.safetyRating + Math.floor(Math.random() * 2)),
    sideCrash: Math.min(5, car.safetyRating + Math.floor(Math.random() * 2)),
    rollover: Math.min(5, car.safetyRating + Math.floor(Math.random() * 2)),
    pedestrianSafety: Math.min(5, car.safetyRating + Math.floor(Math.random() * 2)),
  },
  featuresByCategory: {
    'Safety': car.features.filter(f => f.toLowerCase().includes('safety') || f.toLowerCase().includes('assist')),
    'Technology': car.features.filter(f => f.toLowerCase().includes('bluetooth') || f.toLowerCase().includes('navigation')),
    'Comfort': car.features.filter(f => !f.toLowerCase().includes('safety') && !f.toLowerCase().includes('bluetooth')),
  },
  warranty: {
    basic: '3 years/36,000 miles',
    powertrain: '5 years/60,000 miles',
    corrosion: '5 years/unlimited miles',
    roadside: '2 years/25,000 miles',
  },
  reliabilityScore: Math.floor(Math.random() * 20) + 75,
  ownerSatisfaction: Math.floor(Math.random() * 20) + 75,
  resaleValue: Math.floor(Math.random() * 20) + 55,
});

const CarCard: React.FC<{ car: Car; onNavigateToComparison: () => void }> = ({ 
  car, 
  onNavigateToComparison 
}) => {
  const { actions } = useComparison();
  const isInComparison = useIsCarInComparison(car.id);
  const canAddCar = useCanAddCar();

  const handleToggleComparison = () => {
    if (isInComparison) {
      actions.removeCar(car.id);
    } else if (canAddCar) {
      const extendedCar = extendCarData(car);
      actions.addCar(extendedCar);
    }
  };

  return (
    <View className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3">
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
        <View className="flex-row flex-wrap mb-3">
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

      <View className="flex-row space-x-2">
        <TouchableOpacity
          onPress={handleToggleComparison}
          disabled={!canAddCar && !isInComparison}
          className={`flex-1 flex-row items-center justify-center py-2 px-4 rounded-lg ${
            isInComparison 
              ? 'bg-green-100 border border-green-200' 
              : canAddCar 
                ? 'bg-blue-100 border border-blue-200' 
                : 'bg-gray-100 border border-gray-200'
          }`}
        >
          {isInComparison ? (
            <>
              <Text className="text-green-700 font-medium text-sm mr-1">✓ Added</Text>
            </>
          ) : (
            <>
              <Plus size={16} className={canAddCar ? 'text-blue-600' : 'text-gray-400'} />
              <Text className={`font-medium text-sm ml-1 ${
                canAddCar ? 'text-blue-700' : 'text-gray-400'
              }`}>
                Compare
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={onNavigateToComparison}
          className="px-4 py-2 rounded-lg bg-gray-100 border border-gray-200"
        >
          <Text className="text-gray-700 font-medium text-sm">View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ComparisonFloat: React.FC<{ onNavigateToComparison: () => void }> = ({ 
  onNavigateToComparison 
}) => {
  const { state } = useComparison();
  
  if (state.cars.length === 0) return null;

  return (
    <View className="absolute bottom-6 left-6 right-6">
      <TouchableOpacity
        onPress={onNavigateToComparison}
        className="bg-green-500 rounded-full shadow-lg px-6 py-4 flex-row items-center justify-center"
      >
        <GitCompare size={20} className="text-white mr-2" />
        <Text className="text-white font-semibold">
          Compare {state.cars.length} Car{state.cars.length > 1 ? 's' : ''}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const CarListWithComparisonContent: React.FC<CarListWithComparisonProps> = ({ 
  cars, 
  onNavigateToComparison 
}) => {
  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">
          Available Cars
        </Text>
        
        {cars.map(car => (
          <CarCard 
            key={car.id} 
            car={car} 
            onNavigateToComparison={onNavigateToComparison}
          />
        ))}
      </ScrollView>
      
      <ComparisonFloat onNavigateToComparison={onNavigateToComparison} />
    </View>
  );
};

export const CarListWithComparison: React.FC<CarListWithComparisonProps> = (props) => {
  return (
    <ComparisonProvider>
      <CarListWithComparisonContent {...props} />
    </ComparisonProvider>
  );
};

// Example usage component
export const ComparisonExample: React.FC = () => {
  const [showComparison, setShowComparison] = useState(false);
  
  // Mock cars data
  const mockCars: Car[] = [
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
      model: 'Accord',
      year: 2023,
      price: 26500,
      bodyStyle: 'Sedan',
      fuelEfficiency: 35,
      brand: 'Honda',
      features: ['Apple CarPlay', 'Lane Keep Assist'],
      safetyRating: 5,
    },
    {
      id: '3',
      make: 'Nissan',
      model: 'Altima',
      year: 2023,
      price: 25000,
      bodyStyle: 'Sedan',
      fuelEfficiency: 31,
      brand: 'Nissan',
      features: ['Remote Start', 'Heated Seats'],
      safetyRating: 4,
    },
  ];

  if (showComparison) {
    return (
      <ComparisonProvider>
        <View className="flex-1">
          <View className="bg-white border-b border-gray-200 p-4">
            <TouchableOpacity
              onPress={() => setShowComparison(false)}
              className="flex-row items-center"
            >
              <Text className="text-blue-600 font-medium">← Back to Cars</Text>
            </TouchableOpacity>
          </View>
          {/* ComparisonScreen would go here */}
          <View className="flex-1 justify-center items-center">
            <Text className="text-xl font-semibold text-gray-800">
              Comparison Screen
            </Text>
            <Text className="text-gray-600 mt-2">
              (ComparisonScreen component would render here)
            </Text>
          </View>
        </View>
      </ComparisonProvider>
    );
  }

  return (
    <CarListWithComparison
      cars={mockCars}
      onNavigateToComparison={() => setShowComparison(true)}
    />
  );
};
