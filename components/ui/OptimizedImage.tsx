import React, { useState, memo, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Image, StyleSheet, ViewStyle, ImageStyle, Dimensions, LayoutChangeEvent } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  interpolate,
  runOnJS 
} from 'react-native-reanimated';
import { BorderRadius } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';

const { width: screenWidth } = Dimensions.get('window');

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
  lazy?: boolean;
  cacheKey?: string;
  priority?: 'low' | 'normal' | 'high';
  quality?: 'low' | 'medium' | 'high';
  blur?: boolean;
  progressive?: boolean;
}

// Simple in-memory cache for images
class ImageCache {
  private static instance: ImageCache;
  private cache = new Map<string, { uri: string; timestamp: number; size: number }>();
  private maxCacheSize = 50 * 1024 * 1024; // 50MB
  private currentCacheSize = 0;

  static getInstance(): ImageCache {
    if (!ImageCache.instance) {
      ImageCache.instance = new ImageCache();
    }
    return ImageCache.instance;
  }

  set(key: string, uri: string, size: number = 1024): void {
    // Remove old entry if exists
    if (this.cache.has(key)) {
      const oldEntry = this.cache.get(key)!;
      this.currentCacheSize -= oldEntry.size;
    }

    // Clean cache if needed
    while (this.currentCacheSize + size > this.maxCacheSize && this.cache.size > 0) {
      this.removeOldest();
    }

    this.cache.set(key, {
      uri,
      timestamp: Date.now(),
      size
    });
    this.currentCacheSize += size;
  }

  get(key: string): string | null {
    const entry = this.cache.get(key);
    if (entry) {
      // Update timestamp for LRU
      entry.timestamp = Date.now();
      return entry.uri;
    }
    return null;
  }

  private removeOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey)!;
      this.currentCacheSize -= entry.size;
      this.cache.delete(oldestKey);
    }
  }

  clear(): void {
    this.cache.clear();
    this.currentCacheSize = 0;
  }
}

const imageCache = ImageCache.getInstance();

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
  lazy = false,
  cacheKey,
  priority = 'normal',
  quality = 'medium',
  blur = false,
  progressive = true,
}) => {
  const { colors } = useThemeColors();
  const styles = getThemedOptimizedImageStyles(colors);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(!lazy);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<View>(null);
  
  // Animation values
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);
  const blurRadius = useSharedValue(blur ? 10 : 0);

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const blurStyle = useAnimatedStyle(() => ({
    opacity: interpolate(blurRadius.value, [0, 10], [1, 0.3]),
  }));

  // Get optimized image URI based on quality and size
  const getOptimizedUri = useCallback((originalUri: string): string => {
    if (typeof source === 'number') return originalUri;
    
    try {
      // For external images, add quality and size parameters
      const url = new URL(originalUri);
      
      // Add quality parameter
      const qualityMap = { low: 60, medium: 80, high: 95 };
      url.searchParams.set('q', qualityMap[quality].toString());
      
      // Add size parameters based on screen width
      const maxWidth = Math.floor(screenWidth * (quality === 'high' ? 2 : 1.5));
      url.searchParams.set('w', maxWidth.toString());
      url.searchParams.set('auto', 'compress');
      
      return url.toString();
    } catch (error) {
      // If URL parsing fails, return original URI
      return originalUri;
    }
  }, [quality, source]);

  // Cache management
  const getCachedUri = useCallback((): string | null => {
    if (!cacheKey || typeof source === 'number') return null;
    return imageCache.get(cacheKey);
  }, [cacheKey, source]);

  const setCachedUri = useCallback((uri: string): void => {
    if (!cacheKey || typeof source === 'number') return;
    imageCache.set(cacheKey, uri);
  }, [cacheKey, source]);

  // Viewport-based lazy loading effect (React Native specific)
  useEffect(() => {
    if (!lazy || isVisible) return;

    // Simple timeout-based approach for React Native
    // In a production app, you might use a more sophisticated intersection observer
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, [lazy, isVisible]);

  // Layout-based visibility detection for better lazy loading
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    if (!lazy) return;
    
    const { y } = event.nativeEvent.layout;
    const windowHeight = Dimensions.get('window').height;
    
    // If component is within viewport or close to it, make it visible
    if (y < windowHeight + 200) { // 200px buffer
      setIsVisible(true);
    }
  }, [lazy]);

  // Handle load completion
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    
    // Animate in
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withTiming(1, { duration: 300 });
    
    if (blur) {
      blurRadius.value = withTiming(0, { duration: 500 });
    }

    // Cache the loaded image
    if (typeof source === 'object' && source.uri) {
      setCachedUri(source.uri);
    }

    runOnJS(() => onLoad?.())();
  }, [blur, opacity, scale, blurRadius, onLoad, setCachedUri, source]);

  // Handle load error
  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    runOnJS(() => onError?.())();
  }, [onError]);

  // Determine image source with caching and optimization
  const imageSource = useMemo(() => {
    if (hasError && fallbackSource) return fallbackSource;
    if (typeof source === 'number') return source;

    // Check cache first
    const cachedUri = getCachedUri();
    if (cachedUri) {
      return { uri: cachedUri };
    }

    // Use optimized URI
    const optimizedUri = getOptimizedUri(source.uri);
    return { uri: optimizedUri };
  }, [hasError, fallbackSource, source, getCachedUri, getOptimizedUri]);

  // Don't render anything if lazy loading and not visible
  if (lazy && !isVisible) {
    return (
      <View 
        ref={containerRef} 
        style={[styles.container, containerStyle as ViewStyle]}
        onLayout={handleLayout}
      >
        <View style={[styles.placeholder, containerStyle as ViewStyle]}>
          {placeholder || <View style={styles.defaultPlaceholder} />}
        </View>
      </View>
    );
  }

  return (
    <View 
      ref={containerRef} 
      style={[styles.container, containerStyle as ViewStyle]}
      onLayout={handleLayout}
    >
      {isLoading && (
        <View style={[styles.placeholder, containerStyle as ViewStyle]}>
          {placeholder || <View style={styles.defaultPlaceholder} />}
        </View>
      )}
      
      <Animated.View style={[animatedStyle, { position: isLoading ? 'absolute' : 'relative' }]}>
        <Animated.View style={blurStyle}>
          <Image
            source={imageSource}
            style={[styles.image, style]}
            onLoad={handleLoad}
            onError={handleError}
            resizeMode={resizeMode}
            accessible={!!accessibilityLabel}
            accessibilityLabel={accessibilityLabel}
            progressiveRenderingEnabled={progressive}
            fadeDuration={300}
          />
        </Animated.View>
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
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceDark,
    borderRadius: BorderRadius.md,
  },
});

export { OptimizedImage, ImageCache };