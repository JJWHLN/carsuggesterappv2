import React, { useEffect } from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
  runOnJS,
} from 'react-native-reanimated';
import { Colors, Typography, BorderRadius, Spacing } from '@/constants/Colors';

interface AnimatedBadgeProps {
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  animateEntrance?: boolean;
  delay?: number;
  showRemove?: boolean;
  onRemove?: () => void;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({
  children,
  active = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  onPress,
  style,
  textStyle,
  animateEntrance = false,
  delay = 0,
  showRemove = false,
  onRemove,
}) => {
  const scale = useSharedValue(animateEntrance ? 0 : 1);
  const opacity = useSharedValue(animateEntrance ? 0 : 1);
  const pressScale = useSharedValue(1);
  const colorTransition = useSharedValue(active ? 1 : 0);

  // Entrance animation
  useEffect(() => {
    if (animateEntrance) {
      const timer = setTimeout(() => {
        scale.value = withSpring(1, {
          damping: 15,
          stiffness: 150,
        });
        opacity.value = withTiming(1, { duration: 300 });
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [animateEntrance, delay]);

  // Color transition when active state changes
  useEffect(() => {
    colorTransition.value = withTiming(active ? 1 : 0, { duration: 200 });
  }, [active]);

  const handlePress = () => {
    if (disabled || !onPress) return;
    
    pressScale.value = withSpring(0.95, { duration: 100 }, () => {
      pressScale.value = withSpring(1, { duration: 100 });
    });
    
    runOnJS(onPress)();
  };

  const handleRemove = () => {
    if (onRemove) {
      scale.value = withTiming(0, { duration: 200 });
      opacity.value = withTiming(0, { duration: 200 }, () => {
        runOnJS(onRemove)();
      });
    }
  };

  // Variant color definitions
  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return {
          inactive: Colors.light.surface,
          active: Colors.light.primary,
          text: active ? Colors.light.background : Colors.light.text,
          border: Colors.light.primary,
        };
      case 'secondary':
        return {
          inactive: Colors.light.surface,
          active: Colors.light.neutral300,
          text: active ? Colors.light.background : Colors.light.text,
          border: Colors.light.neutral300,
        };
      case 'outline':
        return {
          inactive: 'transparent',
          active: Colors.light.primary + '20',
          text: active ? Colors.light.primary : Colors.light.text,
          border: Colors.light.primary,
        };
      case 'success':
        return {
          inactive: Colors.light.surface,
          active: Colors.light.success,
          text: active ? Colors.light.background : Colors.light.text,
          border: Colors.light.success,
        };
      case 'warning':
        return {
          inactive: Colors.light.surface,
          active: Colors.light.warning,
          text: active ? Colors.light.background : Colors.light.text,
          border: Colors.light.warning,
        };
      case 'error':
        return {
          inactive: Colors.light.surface,
          active: Colors.light.error,
          text: active ? Colors.light.background : Colors.light.text,
          border: Colors.light.error,
        };
      case 'info':
        return {
          inactive: Colors.light.surface,
          active: Colors.light.info,
          text: active ? Colors.light.background : Colors.light.text,
          border: Colors.light.info,
        };
      default:
        return {
          inactive: Colors.light.surface,
          active: Colors.light.primary,
          text: active ? Colors.light.background : Colors.light.text,
          border: Colors.light.primary,
        };
    }
  };

  // Size definitions
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: Spacing.xs,
          paddingVertical: Spacing.xs / 2,
          borderRadius: BorderRadius.sm,
          fontSize: Typography.sm.fontSize,
        };
      case 'medium':
        return {
          paddingHorizontal: Spacing.sm,
          paddingVertical: Spacing.xs,
          borderRadius: BorderRadius.md,
          fontSize: Typography.base.fontSize,
        };
      case 'large':
        return {
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          borderRadius: BorderRadius.lg,
          fontSize: Typography.lg.fontSize,
        };
      default:
        return {
          paddingHorizontal: Spacing.sm,
          paddingVertical: Spacing.xs,
          borderRadius: BorderRadius.md,
          fontSize: Typography.base.fontSize,
        };
    }
  };

  const colors = getVariantColors();
  const sizeStyles = getSizeStyles();

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      colorTransition.value,
      [0, 1],
      [colors.inactive, colors.active]
    );

    return {
      transform: [
        { scale: scale.value * pressScale.value },
      ],
      opacity: opacity.value,
      backgroundColor,
      borderColor: colors.border,
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    const textColor = interpolateColor(
      colorTransition.value,
      [0, 1],
      [colors.text, colors.text]
    );

    return {
      color: textColor,
    };
  });

  return (
    <AnimatedTouchableOpacity
      style={[
        {
          borderWidth: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          ...sizeStyles,
        },
        animatedStyle,
        style,
        disabled && { opacity: 0.5 },
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={disabled}
    >
      <Animated.Text
        style={[
          {
            fontSize: sizeStyles.fontSize,
            fontWeight: active ? '600' : '500',
            textAlign: 'center',
          },
          textAnimatedStyle,
          textStyle,
        ]}
      >
        {children}
      </Animated.Text>
      
      {showRemove && (
        <TouchableOpacity
          onPress={handleRemove}
          style={{
            marginLeft: Spacing.xs,
            padding: 2,
          }}
          hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
        >
          <Text style={{ 
            color: colors.text, 
            fontSize: sizeStyles.fontSize * 0.8,
            lineHeight: sizeStyles.fontSize * 0.8,
          }}>
            ×
          </Text>
        </TouchableOpacity>
      )}
    </AnimatedTouchableOpacity>
  );
};

// Convenience wrapper for filter badges
export const FilterBadge: React.FC<Omit<AnimatedBadgeProps, 'variant'> & { 
  count?: number;
}> = ({ children, count, ...props }) => {
  return (
    <AnimatedBadge
      variant="outline"
      {...props}
    >
      {children}
      {count !== undefined && count > 0 && (
        <Text style={{ 
          marginLeft: 4, 
          fontWeight: '600',
          color: Colors.light.primary,
        }}>
          ({count})
        </Text>
      )}
    </AnimatedBadge>
  );
};

// Quick filter row component
interface QuickFiltersProps {
  filters: Array<{
    id: string;
    label: string;
    value: string;
    active?: boolean;
  }>;
  onFilterPress: (id: string, value: string) => void;
  onClearAll?: () => void;
  style?: ViewStyle;
}

export const QuickFilters: React.FC<QuickFiltersProps> = ({
  filters,
  onFilterPress,
  onClearAll,
  style,
}) => {
  const activeCount = filters.filter(f => f.active).length;

  return (
    <Animated.ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        {
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          gap: Spacing.sm,
        },
        style,
      ]}
    >
      {filters.map((filter, index) => (
        <AnimatedBadge
          key={filter.id}
          active={filter.active}
          variant="outline"
          size="medium"
          onPress={() => onFilterPress(filter.id, filter.value)}
          animateEntrance
          delay={index * 50}
        >
          {filter.label}
        </AnimatedBadge>
      ))}
      
      {activeCount > 0 && onClearAll && (
        <AnimatedBadge
          variant="error"
          size="medium"
          onPress={onClearAll}
          animateEntrance
          delay={filters.length * 50}
        >
          Clear All ({activeCount})
        </AnimatedBadge>
      )}
    </Animated.ScrollView>
  );
};
