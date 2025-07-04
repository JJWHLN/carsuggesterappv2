import React, { useState, memo } from 'react';
import { View, Image, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { useFadeAnimation } from '@/hooks/useAnimatedValue';
import { BorderRadius } from '@/constants/Colors'; // Removed currentColors
import { useThemeColors } from '@/hooks/useTheme'; // Import useThemeColors

interface OptimizedImageProps {
  source: { uri: string } | number;
  style?: ImageStyle;
  containerStyle?: ViewStyle;
  placeholder?: React.ReactNode;
  fallbackSource?: { uri: string } | number;
  onLoad?: () => void;
  onError?: () => void;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
  accessibilityLabel?: string;
}

const OptimizedImage = memo<OptimizedImageProps>(({
  source,
  style,
  containerStyle,
  placeholder,
  fallbackSource,
  onLoad,
  onError,
  resizeMode = 'cover',
  accessibilityLabel,
}) => {
  const { colors } = useThemeColors();
  const styles = getThemedOptimizedImageStyles(colors);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { fadeIn, animatedStyle } = useFadeAnimation(0);

  const handleLoad = () => {
    setIsLoading(false);
    fadeIn();
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError?.();
  };

  const imageSource = hasError && fallbackSource ? fallbackSource : source;

  return (
    <View style={[styles.container, containerStyle]}>
      {isLoading && (
        <View style={[styles.placeholder, containerStyle]}>
          {placeholder || <View style={styles.defaultPlaceholder} />}
        </View>
      )}
      
      <Animated.View style={[animatedStyle, { position: isLoading ? 'absolute' : 'relative' }]}>
        <Image
          source={imageSource}
          style={[styles.image, style]}
          onLoad={handleLoad}
          onError={handleError}
          resizeMode={resizeMode}
          accessible={!!accessibilityLabel}
          accessibilityLabel={accessibilityLabel}
        />
      </Animated.View>
    </View>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

const getThemedOptimizedImageStyles = (colors: typeof import('@/constants/Colors').Colors.light) => StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: { // This view wraps the placeholder content, its background is the image's direct style
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: colors.surfaceDark, // Background applied to image style directly if needed
  },
  defaultPlaceholder: { // This is the actual default placeholder visual
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceDark, // Use a themed placeholder color
    borderRadius: BorderRadius.md, // Consistent with other radius uses
  },
});

export { OptimizedImage };