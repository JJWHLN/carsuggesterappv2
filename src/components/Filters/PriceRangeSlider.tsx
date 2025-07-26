import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, PanResponder, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  runOnJS,
} from 'react-native-reanimated';

interface PriceRangeSliderProps {
  value: [number, number];
  onChange: (range: [number, number]) => void;
  min: number;
  max: number;
  step: number;
  formatValue: (value: number) => string;
  className?: string;
}

const SLIDER_WIDTH = Dimensions.get('window').width - 64; // Account for padding
const THUMB_SIZE = 24;

export const PriceRangeSlider: React.FC<PriceRangeSliderProps> = React.memo(
  ({ value, onChange, min, max, step, formatValue, className = '' }) => {
    const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null);

    // Convert values to positions
    const minPosition = useSharedValue(
      ((value[0] - min) / (max - min)) * SLIDER_WIDTH,
    );
    const maxPosition = useSharedValue(
      ((value[1] - min) / (max - min)) * SLIDER_WIDTH,
    );

    // Update positions when value prop changes
    React.useEffect(() => {
      minPosition.value = ((value[0] - min) / (max - min)) * SLIDER_WIDTH;
      maxPosition.value = ((value[1] - min) / (max - min)) * SLIDER_WIDTH;
    }, [value, min, max, minPosition, maxPosition]);

    const snapToStep = useCallback(
      (position: number): number => {
        const rawValue = min + (position / SLIDER_WIDTH) * (max - min);
        const steppedValue = Math.round(rawValue / step) * step;
        return Math.max(min, Math.min(max, steppedValue));
      },
      [min, max, step],
    );

    const onValueChange = useCallback(
      (newMin: number, newMax: number) => {
        const sortedValues: [number, number] =
          newMin <= newMax ? [newMin, newMax] : [newMax, newMin];
        onChange(sortedValues);
      },
      [onChange],
    );

    // Min thumb pan responder
    const minPanResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging('min');
      },
      onPanResponderMove: (_, gestureState) => {
        const newPosition = Math.max(
          0,
          Math.min(SLIDER_WIDTH, minPosition.value + gestureState.dx),
        );
        minPosition.value = newPosition;

        const newValue = snapToStep(newPosition);
        const currentMax = snapToStep(maxPosition.value);
        runOnJS(onValueChange)(newValue, currentMax);
      },
      onPanResponderRelease: () => {
        setIsDragging(null);
      },
    });

    // Max thumb pan responder
    const maxPanResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsDragging('max');
      },
      onPanResponderMove: (_, gestureState) => {
        const newPosition = Math.max(
          0,
          Math.min(SLIDER_WIDTH, maxPosition.value + gestureState.dx),
        );
        maxPosition.value = newPosition;

        const newValue = snapToStep(newPosition);
        const currentMin = snapToStep(minPosition.value);
        runOnJS(onValueChange)(currentMin, newValue);
      },
      onPanResponderRelease: () => {
        setIsDragging(null);
      },
    });

    // Animated styles
    const minThumbStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: minPosition.value }],
    }));

    const maxThumbStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: maxPosition.value }],
    }));

    const trackStyle = useAnimatedStyle(() => ({
      left: minPosition.value,
      width: maxPosition.value - minPosition.value,
    }));

    return (
      <View className={`py-4 ${className}`}>
        {/* Value Display */}
        <View className="flex-row justify-between mb-4">
          <Text className="text-sm font-medium text-gray-700">
            {formatValue(value[0])}
          </Text>
          <Text className="text-sm font-medium text-gray-700">
            {formatValue(value[1])}
          </Text>
        </View>

        {/* Slider Container */}
        <View className="relative h-12 justify-center">
          {/* Background Track */}
          <View
            className="absolute h-2 bg-gray-200 rounded-full"
            style={{ width: SLIDER_WIDTH }}
          />

          {/* Active Track */}
          <Animated.View
            className="absolute h-2 bg-green-500 rounded-full"
            style={trackStyle}
          />

          {/* Min Thumb */}
          <Animated.View
            {...minPanResponder.panHandlers}
            style={[
              {
                position: 'absolute',
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                marginLeft: -THUMB_SIZE / 2,
              },
              minThumbStyle,
            ]}
            className={`rounded-full border-2 border-white shadow-lg ${
              isDragging === 'min' ? 'bg-green-600' : 'bg-green-500'
            }`}
          />

          {/* Max Thumb */}
          <Animated.View
            {...maxPanResponder.panHandlers}
            style={[
              {
                position: 'absolute',
                width: THUMB_SIZE,
                height: THUMB_SIZE,
                marginLeft: -THUMB_SIZE / 2,
              },
              maxThumbStyle,
            ]}
            className={`rounded-full border-2 border-white shadow-lg ${
              isDragging === 'max' ? 'bg-green-600' : 'bg-green-500'
            }`}
          />
        </View>

        {/* Min/Max Labels */}
        <View className="flex-row justify-between mt-2">
          <Text className="text-xs text-gray-500">{formatValue(min)}</Text>
          <Text className="text-xs text-gray-500">{formatValue(max)}</Text>
        </View>
      </View>
    );
  },
);

PriceRangeSlider.displayName = 'PriceRangeSlider';
