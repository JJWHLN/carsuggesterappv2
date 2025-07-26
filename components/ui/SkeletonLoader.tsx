import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useThemeColors } from '@/hooks/useTheme';
import { BorderRadius, Spacing } from '@/constants/Colors';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { colors } = useThemeColors();
  const shimmerOpacity = useSharedValue(0.3);

  React.useEffect(() => {
    shimmerOpacity.value = withRepeat(
      withTiming(1, {
        duration: 1000,
        easing: Easing.inOut(Easing.ease),
      }),
      -1,
      true,
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: shimmerOpacity.value,
  }));

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.border,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: colors.background,
          },
          shimmerStyle,
        ]}
      />
    </View>
  );
};

export const BrandSkeletonLoader: React.FC<{ featured?: boolean }> = ({
  featured = false,
}) => {
  const { colors } = useThemeColors();

  return (
    <View
      style={[
        featured ? styles.featuredBrandSkeleton : styles.brandSkeleton,
        { backgroundColor: colors.white, borderColor: colors.border },
      ]}
    >
      {/* Logo Skeleton */}
      <View
        style={[styles.logoSkeleton, featured && styles.featuredLogoSkeleton]}
      >
        <SkeletonLoader
          width={featured ? 64 : 48}
          height={featured ? 64 : 48}
          borderRadius={featured ? 32 : 24}
        />
      </View>

      {/* Brand Name Skeleton */}
      <View style={styles.brandInfoSkeleton}>
        <SkeletonLoader
          width={featured ? 100 : 60}
          height={featured ? 16 : 12}
          borderRadius={4}
        />

        {featured && (
          <View style={{ marginTop: 4 }}>
            <SkeletonLoader width={80} height={12} borderRadius={4} />
          </View>
        )}
      </View>

      {featured && (
        <View style={{ marginTop: 8 }}>
          <SkeletonLoader width={16} height={16} borderRadius={8} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  featuredBrandSkeleton: {
    width: 140,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: 16,
  },
  brandSkeleton: {
    width: 90,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  logoSkeleton: {
    marginBottom: Spacing.sm,
  },
  featuredLogoSkeleton: {
    marginBottom: Spacing.md,
  },
  brandInfoSkeleton: {
    alignItems: 'center',
  },
});
