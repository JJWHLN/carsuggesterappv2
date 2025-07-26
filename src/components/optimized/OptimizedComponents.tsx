/**
 * 🚀 Optimized React Components
 * High-performance components with React.memo and advanced optimizations
 */

import React, { memo, useMemo, useCallback, useRef, forwardRef } from 'react';
import {
  FlatList,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ListRenderItem,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {
  debounce,
  performanceMonitor,
  useRenderPerformance,
} from './performanceUtils';

// ===== OPTIMIZED CAR LIST COMPONENT =====

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  price: number;
  image?: string;
}

interface OptimizedCarListProps {
  cars: Car[];
  onCarPress: (carId: string) => void;
  loading?: boolean;
  style?: ViewStyle;
}

// Memoized car item component to prevent unnecessary re-renders
const CarListItem = memo<{
  car: Car;
  onPress: (carId: string) => void;
}>(({ car, onPress }) => {
  useRenderPerformance('CarListItem');

  const handlePress = useCallback(() => {
    onPress(car.id);
  }, [car.id, onPress]);

  const itemStyle = useMemo(
    () => [styles.carItem, { backgroundColor: '#fff' }],
    [],
  );

  return (
    <TouchableOpacity style={itemStyle} onPress={handlePress}>
      <Text style={styles.carTitle}>
        {car.year} {car.make} {car.model}
      </Text>
      <Text style={styles.carPrice}>${car.price.toLocaleString()}</Text>
    </TouchableOpacity>
  );
});

CarListItem.displayName = 'CarListItem';

// Main optimized car list component
export const OptimizedCarList = memo<OptimizedCarListProps>(
  ({ cars, onCarPress, loading = false, style }) => {
    useRenderPerformance('OptimizedCarList');

    const listRef = useRef<FlatList<Car>>(null);

    // Memoize the key extractor to prevent recreation
    const keyExtractor = useCallback((item: Car) => item.id, []);

    // Memoize the render item function
    const renderItem: ListRenderItem<Car> = useCallback(
      ({ item }) => <CarListItem car={item} onPress={onCarPress} />,
      [onCarPress],
    );

    // Memoize performance optimization props
    const optimizationProps = useMemo(
      () => ({
        removeClippedSubviews: true,
        maxToRenderPerBatch: 10,
        windowSize: 21,
        initialNumToRender: 10,
        updateCellsBatchingPeriod: 100,
        getItemLayout: (_: Car[] | null | undefined, index: number) => ({
          length: 80,
          offset: 80 * index,
          index,
        }),
      }),
      [],
    );

    // Memoize the container style
    const containerStyle = useMemo(() => [styles.container, style], [style]);

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      );
    }

    return (
      <FlatList<Car>
        ref={listRef}
        data={cars}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        style={containerStyle}
        {...optimizationProps}
        onScrollToIndexFailed={() => {
          // Handle scroll failure gracefully
        }}
      />
    );
  },
);

OptimizedCarList.displayName = 'OptimizedCarList';

// ===== OPTIMIZED SEARCH BAR =====

interface OptimizedSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
  debounceMs?: number;
  style?: ViewStyle;
}

export const OptimizedSearchBar = memo<OptimizedSearchBarProps>(
  ({
    onSearch,
    placeholder = 'Search cars...',
    initialValue = '',
    debounceMs = 300,
    style,
  }) => {
    useRenderPerformance('OptimizedSearchBar');

    const inputRef = useRef<TextInput>(null);
    const currentValue = useRef(initialValue);

    // Create debounced search function
    const debouncedSearch = useMemo(
      () =>
        debounce((query: string) => {
          performanceMonitor.track('search.query', 1, { query });
          onSearch(query);
        }, debounceMs),
      [onSearch, debounceMs],
    );

    const handleTextChange = useCallback(
      (text: string) => {
        currentValue.current = text;
        debouncedSearch(text);
      },
      [debouncedSearch],
    );

    const handleClear = useCallback(() => {
      if (inputRef.current) {
        inputRef.current.clear();
        currentValue.current = '';
        onSearch('');
      }
    }, [onSearch]);

    const containerStyle = useMemo(
      () => [styles.searchContainer, style],
      [style],
    );

    return (
      <View style={containerStyle}>
        <TextInput
          ref={inputRef}
          placeholder={placeholder}
          placeholderTextColor="#999"
          onChangeText={handleTextChange}
          defaultValue={initialValue}
          style={styles.searchInput}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {currentValue.current.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  },
);

OptimizedSearchBar.displayName = 'OptimizedSearchBar';

// ===== OPTIMIZED MODAL COMPONENT =====

interface OptimizedModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  animationType?: 'slide' | 'fade' | 'none';
}

export const OptimizedModal = memo<OptimizedModalProps>(
  ({ visible, onClose, children, animationType = 'slide' }) => {
    useRenderPerformance('OptimizedModal');

    const handleBackdropPress = useCallback(() => {
      onClose();
    }, [onClose]);

    // Don't render anything if not visible
    if (!visible) {
      return null;
    }

    return (
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.modalBackdrop}
          onPress={handleBackdropPress}
          activeOpacity={1}
        />
        <View style={styles.modalContent}>{children}</View>
      </View>
    );
  },
);

OptimizedModal.displayName = 'OptimizedModal';

// ===== OPTIMIZED BUTTON COMPONENT =====

interface OptimizedButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const OptimizedButton = memo<OptimizedButtonProps>(
  ({
    title,
    onPress,
    variant = 'primary',
    disabled = false,
    loading = false,
    style,
    textStyle,
  }) => {
    useRenderPerformance('OptimizedButton');

    const buttonStyle = useMemo(
      () => [
        styles.button,
        styles[
          `button${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof styles
        ],
        disabled && styles.buttonDisabled,
        style,
      ],
      [variant, disabled, style],
    );

    const buttonTextStyle = useMemo(
      () => [
        styles.buttonText,
        styles[
          `buttonText${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof styles
        ],
        disabled && styles.buttonTextDisabled,
        textStyle,
      ],
      [variant, disabled, textStyle],
    );

    const handlePress = useCallback(() => {
      if (!disabled && !loading) {
        performanceMonitor.track('button.press', 1, { variant, title });
        onPress();
      }
    }, [disabled, loading, onPress, variant, title]);

    return (
      <TouchableOpacity
        style={buttonStyle}
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.7}
      >
        <Text style={buttonTextStyle}>{loading ? 'Loading...' : title}</Text>
      </TouchableOpacity>
    );
  },
);

OptimizedButton.displayName = 'OptimizedButton';

// ===== OPTIMIZED CARD COMPONENT =====

interface OptimizedCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  shadow?: boolean;
}

export const OptimizedCard = memo<OptimizedCardProps>(
  ({ children, onPress, style, shadow = true }) => {
    useRenderPerformance('OptimizedCard');

    const cardStyle = useMemo(
      () => [styles.card, shadow && styles.cardShadow, style],
      [shadow, style],
    );

    if (onPress) {
      return (
        <TouchableOpacity style={cardStyle} onPress={onPress}>
          {children}
        </TouchableOpacity>
      );
    }

    return <View style={cardStyle}>{children}</View>;
  },
);

OptimizedCard.displayName = 'OptimizedCard';

// ===== STYLES =====

const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Car list item styles
  carItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    height: 80,
    justifyContent: 'center',
  },
  carTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  carPrice: {
    fontSize: 14,
    color: '#666',
  },

  // Search bar styles
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  clearText: {
    fontSize: 16,
    color: '#999',
  },

  // Modal styles
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    minWidth: 280,
    maxWidth: '90%',
  },

  // Button styles
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonSecondary: {
    backgroundColor: '#6c757d',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextPrimary: {
    color: '#fff',
  },
  buttonTextSecondary: {
    color: '#fff',
  },
  buttonTextOutline: {
    color: '#007AFF',
  },
  buttonTextDisabled: {
    color: '#999',
  },

  // Card styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
