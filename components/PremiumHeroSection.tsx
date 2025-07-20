import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  useAnimatedScrollHandler,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { Search, Sparkles, ArrowRight, Star, Crown } from '@/utils/ultra-optimized-icons';
import { useThemeColors } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography, Shadows } from '@/constants/Colors';

const { width, height } = Dimensions.get('window');

interface HeroCarouselItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  gradient: string[];
  featured?: boolean;
}

interface PremiumHeroSectionProps {
  onSearchPress: () => void;
  onExplorePress: () => void;
  onGetRecommendations: () => void;
}

const HERO_CARS: HeroCarouselItem[] = [
  {
    id: '1',
    title: 'Find Your Dream Car',
    subtitle: 'AI-powered recommendations just for you',
    image: 'https://images.unsplash.com/photo-1627568262094-3d8407473117?w=800&q=80',
    gradient: ['#667eea', '#764ba2'],
    featured: true,
  },
  {
    id: '2',
    title: 'Luxury Redefined',
    subtitle: 'Explore premium vehicles with virtual showrooms',
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80',
    gradient: ['#f093fb', '#f5576c'],
  },
  {
    id: '3',
    title: 'Electric Future',
    subtitle: 'Discover the latest in electric vehicle technology',
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80',
    gradient: ['#4facfe', '#00f2fe'],
  },
];

export const PremiumHeroSection: React.FC<PremiumHeroSectionProps> = ({
  onSearchPress,
  onExplorePress,
  onGetRecommendations,
}) => {
  const { colors } = useThemeColors();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);
  const scale = useSharedValue(1);

  // Auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % HERO_CARS.length;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }, 5000);

    return () => clearInterval(interval);
  }, [currentIndex]);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handlePress = async (action: () => void) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSpring(0.95, {}, () => {
      scale.value = withSpring(1);
    });
    action();
  };

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const renderCarouselItem = ({ item, index }: { item: HeroCarouselItem; index: number }) => {
    const animatedStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        scrollX.value,
        [(index - 1) * width, index * width, (index + 1) * width],
        [0.5, 1, 0.5]
      );
      const scale = interpolate(
        scrollX.value,
        [(index - 1) * width, index * width, (index + 1) * width],
        [0.8, 1, 0.8]
      );
      return {
        opacity,
        transform: [{ scale }],
      };
    });

    return (
      <Animated.View style={[styles.carouselItem, animatedStyle]}>
        <ImageBackground source={{ uri: item.image }} style={styles.backgroundImage}>
          <LinearGradient 
            colors={[item.gradient[0], item.gradient[1], 'rgba(0,0,0,0.3)']} 
            style={styles.overlay}
          >
            <View style={styles.heroContent}>
              {item.featured && (
                <View style={styles.featuredBadge}>
                  <Crown size={16} color={colors.white} />
                  <Text style={[styles.featuredText, { color: colors.white }]}>Featured</Text>
                </View>
              )}
              
              <Text style={[styles.heroTitle, { color: colors.white }]}>{item.title}</Text>
              <Text style={[styles.heroSubtitle, { color: colors.white }]}>{item.subtitle}</Text>
              
              <View style={styles.heroButtons}>
                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                  onPress={() => handlePress(onGetRecommendations)}
                  activeOpacity={0.8}
                >
                  <Sparkles size={20} color={colors.white} />
                  <Text style={[styles.primaryButtonText, { color: colors.white }]}>
                    Get AI Recommendations
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.secondaryButton, { borderColor: colors.white }]}
                  onPress={() => handlePress(onExplorePress)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.secondaryButtonText, { color: colors.white }]}>
                    Explore Cars
                  </Text>
                  <ArrowRight size={18} color={colors.white} />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </Animated.View>
    );
  };

  const renderDot = (index: number) => {
    const animatedDotStyle = useAnimatedStyle(() => {
      const opacity = interpolate(
        scrollX.value,
        [(index - 1) * width, index * width, (index + 1) * width],
        [0.3, 1, 0.3]
      );
      const scale = interpolate(
        scrollX.value,
        [(index - 1) * width, index * width, (index + 1) * width],
        [0.8, 1.2, 0.8]
      );
      return {
        opacity,
        transform: [{ scale }],
      };
    });

    return (
      <Animated.View
        key={index}
        style={[
          styles.dot,
          { backgroundColor: colors.white },
          animatedDotStyle,
        ]}
      />
    );
  };

  return (
    <Animated.View style={[styles.container, animatedContainerStyle]}>
      <FlatList
        ref={flatListRef}
        data={HERO_CARS}
        renderItem={renderCarouselItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        scrollEventThrottle={16}
      />
      
      {/* Enhanced Search Bar */}
      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={[styles.searchBar, { backgroundColor: colors.white }]}
          onPress={() => handlePress(onSearchPress)}
          activeOpacity={0.9}
        >
          <Search size={24} color={colors.textSecondary} />
          <Text style={[styles.searchPlaceholder, { color: colors.textSecondary }]}>
            Search by make, model, or keyword...
          </Text>
          <View style={[styles.searchButton, { backgroundColor: colors.primary }]}>
            <ArrowRight size={18} color={colors.white} />
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Page Indicators */}
      <View style={styles.dotContainer}>
        {HERO_CARS.map((_, index) => renderDot(index))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: height * 0.6,
    position: 'relative',
  },
  carouselItem: {
    width,
    height: '100%',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  heroContent: {
    alignItems: 'flex-start',
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  featuredText: {
    ...Typography.caption,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  heroTitle: {
    ...Typography.heroTitle,
    fontWeight: '800',
    marginBottom: Spacing.sm,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroSubtitle: {
    ...Typography.body,
    opacity: 0.9,
    marginBottom: Spacing.xl,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  heroButtons: {
    width: '100%',
    gap: Spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadows.medium,
  },
  primaryButtonText: {
    ...Typography.button,
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  secondaryButtonText: {
    ...Typography.button,
    fontWeight: '500',
  },
  searchContainer: {
    position: 'absolute',
    top: height * 0.45,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.large,
  },
  searchPlaceholder: {
    ...Typography.body,
    flex: 1,
    marginLeft: Spacing.sm,
  },
  searchButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  dotContainer: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
