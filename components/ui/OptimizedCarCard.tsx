import React, {
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { usePerformanceMonitor } from '../../src/utils/performance';
import { Car } from '../../src/features/recommendations/types';
import { OptimizedImage } from './OptimizedImage';

const { width: screenWidth } = Dimensions.get('window');

interface OptimizedCarCardProps {
  car: Car;
  onPress: (car: Car) => void;
  onFavorite?: (carId: string) => void;
  isFavorited?: boolean;
  style?: any;
  index?: number;
  priority?: boolean;
}

// Memoized sub-components for better performance
const CarImage = React.memo<{
  source: string;
  alt: string;
  priority?: boolean;
}>(({ source, alt, priority }) => (
  <OptimizedImage
    source={{ uri: source }}
    style={styles.carImage}
    priority={priority ? 'high' : 'normal'}
    lazy={!priority}
    quality="medium"
  />
));

const CarTitle = React.memo<{
  make: string;
  model: string;
  year: number;
}>(({ make, model, year }) => (
  <Text style={styles.carTitle} numberOfLines={1}>
    {year} {make} {model}
  </Text>
));

const CarPrice = React.memo<{
  price: number;
}>(({ price }) => {
  const formattedPrice = useMemo(() => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  }, [price]);

  return <Text style={styles.price}>{formattedPrice}</Text>;
});

const CarSpecs = React.memo<{
  fuelEfficiency: number;
  safetyRating: number;
}>(({ fuelEfficiency, safetyRating }) => (
  <View style={styles.specsContainer}>
    <Text style={styles.spec}>{fuelEfficiency} MPG</Text>
    <Text style={styles.spec}>★ {safetyRating}/5</Text>
  </View>
));

const FavoriteButton = React.memo<{
  isFavorited: boolean;
  onPress: () => void;
}>(({ isFavorited, onPress }) => (
  <TouchableOpacity
    style={styles.favoriteButton}
    onPress={onPress}
    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  >
    <Text style={[styles.favoriteIcon, isFavorited && styles.favorited]}>
      {isFavorited ? '♥' : '♡'}
    </Text>
  </TouchableOpacity>
));

// Main optimized car card component
export const OptimizedCarCard = React.memo<OptimizedCarCardProps>(
  ({
    car,
    onPress,
    onFavorite,
    isFavorited = false,
    style,
    index = 0,
    priority = false,
  }) => {
    const { trackRender } = usePerformanceMonitor();
    const renderStartTime = useRef<number>();

    // Track render performance
    useEffect(() => {
      renderStartTime.current = Date.now();
      return () => {
        if (renderStartTime.current) {
          const renderTime = Date.now() - renderStartTime.current;
          trackRender(`CarCard-${car.id}`, renderTime);
        }
      };
    });

    // Memoized handlers to prevent unnecessary re-renders
    const handlePress = useCallback(() => {
      onPress(car);
    }, [car, onPress]);

    const handleFavorite = useCallback(() => {
      onFavorite?.(car.id);
    }, [car.id, onFavorite]);

    // Memoize image source
    const imageSource = useMemo(() => {
      // Generate a placeholder car image URL based on car details
      const carImageUrl = `https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&h=300&auto=format&fit=crop&q=60&ixlib=rb-4.0.3`;
      return carImageUrl;
    }, [car.make, car.model, car.year]);

    // Memoize the entire card content
    const cardContent = useMemo(
      () => (
        <>
          <CarImage
            source={imageSource}
            alt={`${car.year} ${car.make} ${car.model}`}
            priority={priority || index < 5}
          />

          <View style={styles.cardContent}>
            <View style={styles.headerRow}>
              <CarTitle make={car.make} model={car.model} year={car.year} />

              {onFavorite && (
                <FavoriteButton
                  isFavorited={isFavorited}
                  onPress={handleFavorite}
                />
              )}
            </View>

            <CarPrice price={car.price} />

            <CarSpecs
              fuelEfficiency={car.fuelEfficiency}
              safetyRating={car.safetyRating}
            />

            <Text style={styles.bodyStyle} numberOfLines={1}>
              {car.bodyStyle}
            </Text>
          </View>
        </>
      ),
      [
        imageSource,
        car.year,
        car.make,
        car.model,
        car.price,
        car.fuelEfficiency,
        car.safetyRating,
        car.bodyStyle,
        isFavorited,
        handleFavorite,
        onFavorite,
        priority,
        index,
      ],
    );

    return (
      <TouchableOpacity
        style={[styles.card, style]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        {cardContent}
      </TouchableOpacity>
    );
  },
);

OptimizedCarCard.displayName = 'OptimizedCarCard';

// Custom hook for managing car card interactions
export function useCarCardInteractions() {
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const toggleFavorite = useCallback((carId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(carId)) {
        newFavorites.delete(carId);
      } else {
        newFavorites.add(carId);
      }
      return newFavorites;
    });
  }, []);

  const isFavorited = useCallback(
    (carId: string) => {
      return favorites.has(carId);
    },
    [favorites],
  );

  return {
    toggleFavorite,
    isFavorited,
    favorites: Array.from(favorites),
  };
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  carImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
  },
  cardContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  carTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 8,
  },
  specsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  spec: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  bodyStyle: {
    fontSize: 14,
    color: '#9ca3af',
    textTransform: 'capitalize',
  },
  favoriteButton: {
    padding: 4,
  },
  favoriteIcon: {
    fontSize: 20,
    color: '#d1d5db',
  },
  favorited: {
    color: '#ef4444',
  },
});

export default OptimizedCarCard;
