import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import FastImage, { FastImageProps } from 'react-native-fast-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '../../hooks/useTheme';
import { BorderRadius } from '../../constants/Colors';

interface ProgressiveImageProps extends Omit<FastImageProps, 'source'> {
  source: {
    uri: string;
    priority?: any; // FastImage priority
  };
  thumbnailSource?: {
    uri: string;
  };
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  showPlaceholder?: boolean;
  placeholderColor?: string;
  children?: React.ReactNode;
}

const AnimatedFastImage = Animated.createAnimatedComponent(FastImage);

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  source,
  thumbnailSource,
  width = '100%',
  height = 200,
  borderRadius = BorderRadius.lg,
  showPlaceholder = true,
  placeholderColor,
  children,
  style,
  ...props
}) => {
  const { colors } = useThemeColors();
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const thumbnailOpacity = useSharedValue(0);
  const imageOpacity = useSharedValue(0);
  const placeholderOpacity = useSharedValue(1);

  const animatedThumbnailStyle = useAnimatedStyle(() => ({
    opacity: thumbnailOpacity.value,
  }));

  const animatedImageStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  const animatedPlaceholderStyle = useAnimatedStyle(() => ({
    opacity: placeholderOpacity.value,
  }));

  const handleThumbnailLoad = useCallback(() => {
    thumbnailOpacity.value = withTiming(1, { duration: 300 });
    placeholderOpacity.value = withTiming(0, { duration: 300 });
    runOnJS(setThumbnailLoaded)(true);
  }, []);

  const handleImageLoad = useCallback(() => {
    imageOpacity.value = withTiming(1, { duration: 500 });
    thumbnailOpacity.value = withTiming(0, { duration: 500 });
    runOnJS(setImageLoaded)(true);
  }, []);

  const containerStyle: ViewStyle[] = [
    styles.container,
    {
      width: width as any,
      height: height as any,
      borderRadius,
      backgroundColor: placeholderColor || colors.border,
    },
  ];

  if (style) {
    containerStyle.push(style as ViewStyle);
  }

  return (
    <View style={containerStyle}>
      {/* Placeholder with shimmer effect */}
      {showPlaceholder && !imageLoaded && (
        <Animated.View
          style={[
            styles.placeholder,
            {
              borderRadius,
            },
            animatedPlaceholderStyle,
          ]}
        >
          <LinearGradient
            colors={[
              placeholderColor || colors.border,
              placeholderColor || colors.cardBackground,
              placeholderColor || colors.border,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmer}
          />
        </Animated.View>
      )}

      {/* Thumbnail (low quality/small size) */}
      {thumbnailSource && !imageLoaded && (
        <AnimatedFastImage
          source={{
            ...thumbnailSource,
            priority: FastImage.priority.high,
          }}
          style={[
            styles.image,
            {
              borderRadius,
            },
            animatedThumbnailStyle,
          ]}
          resizeMode={FastImage.resizeMode.cover}
          onLoad={handleThumbnailLoad}
        />
      )}

      {/* Full quality image */}
      <AnimatedFastImage
        source={{
          ...source,
          priority: source.priority || FastImage.priority.normal,
        }}
        style={[
          styles.image,
          {
            borderRadius,
          },
          animatedImageStyle,
        ]}
        resizeMode={FastImage.resizeMode.cover}
        onLoad={handleImageLoad}
        {...props}
      />

      {/* Overlay content */}
      {children && <View style={styles.overlay}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  placeholder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  shimmer: {
    flex: 1,
    transform: [{ translateX: -100 }],
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
