import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import {
  Search,
  Sparkles,
  TrendingUp,
  Award,
} from '@/utils/ultra-optimized-icons';
import { ModernButton } from './ui/ModernButton';
import { Colors, Spacing, BorderRadius, Typography } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';

const { width } = Dimensions.get('window');

interface ModernHeroSectionProps {
  onSearchPress: () => void;
  onGetRecommendations: () => void;
  userName?: string;
}

export const ModernHeroSection = memo<ModernHeroSectionProps>(
  ({ onSearchPress, onGetRecommendations, userName }) => {
    const { colors } = useThemeColors();

    // Animation values
    const titleOpacity = useSharedValue(0);
    const titleTranslateY = useSharedValue(30);
    const subtitleOpacity = useSharedValue(0);
    const subtitleTranslateY = useSharedValue(30);
    const buttonsOpacity = useSharedValue(0);
    const buttonsTranslateY = useSharedValue(30);
    const sparkleRotation = useSharedValue(0);
    const statsScale = useSharedValue(0.8);

    // Animated styles
    const titleAnimatedStyle = useAnimatedStyle(() => ({
      opacity: titleOpacity.value,
      transform: [{ translateY: titleTranslateY.value }],
    }));

    const subtitleAnimatedStyle = useAnimatedStyle(() => ({
      opacity: subtitleOpacity.value,
      transform: [{ translateY: subtitleTranslateY.value }],
    }));

    const buttonsAnimatedStyle = useAnimatedStyle(() => ({
      opacity: buttonsOpacity.value,
      transform: [{ translateY: buttonsTranslateY.value }],
    }));

    const sparkleAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ rotate: `${sparkleRotation.value}deg` }],
    }));

    const statsAnimatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: statsScale.value }],
    }));

    // Start animations on mount
    useEffect(() => {
      // Sequence animations for entrance
      titleOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
      titleTranslateY.value = withDelay(
        200,
        withSpring(0, { damping: 20, stiffness: 100 }),
      );

      subtitleOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
      subtitleTranslateY.value = withDelay(
        400,
        withSpring(0, { damping: 20, stiffness: 100 }),
      );

      buttonsOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));
      buttonsTranslateY.value = withDelay(
        600,
        withSpring(0, { damping: 20, stiffness: 100 }),
      );

      statsScale.value = withDelay(
        800,
        withSpring(1, { damping: 15, stiffness: 150 }),
      );

      // Continuous sparkle rotation
      sparkleRotation.value = withSequence(
        withTiming(360, { duration: 3000 }),
        withTiming(0, { duration: 0 }),
      );
    }, []);

    const greeting = userName
      ? `Welcome back, ${userName}!`
      : 'Find Your Perfect Car';

    return (
      <View style={styles.container}>
        {/* Background Gradient */}
        <LinearGradient
          colors={['#48cc6c', '#56d478', '#6be085']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Decorative Elements */}
          <View style={styles.decorativeContainer}>
            <Animated.View
              style={[styles.sparkleContainer, sparkleAnimatedStyle]}
            >
              <Sparkles size={24} color={Colors.light.white} />
            </Animated.View>

            <View style={styles.trendingContainer}>
              <TrendingUp size={20} color={Colors.light.white} />
            </View>

            <View style={styles.awardContainer}>
              <Award size={18} color={Colors.light.white} />
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            {/* Title */}
            <Animated.Text style={[styles.title, titleAnimatedStyle]}>
              {greeting}
            </Animated.Text>

            {/* Subtitle */}
            <Animated.Text style={[styles.subtitle, subtitleAnimatedStyle]}>
              Discover thousands of verified cars with AI-powered
              recommendations tailored just for you
            </Animated.Text>

            {/* Stats Row */}
            <Animated.View style={[styles.statsContainer, statsAnimatedStyle]}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>50K+</Text>
                <Text style={styles.statLabel}>Cars Available</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>98%</Text>
                <Text style={styles.statLabel}>Happy Customers</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>24/7</Text>
                <Text style={styles.statLabel}>Support</Text>
              </View>
            </Animated.View>

            {/* Action Buttons */}
            <Animated.View
              style={[styles.buttonsContainer, buttonsAnimatedStyle]}
            >
              <View style={styles.primaryButtonContainer}>
                <ModernButton
                  title="Search Cars"
                  onPress={onSearchPress}
                  variant="secondary"
                  size="large"
                  icon={<Search size={20} color={Colors.light.primary} />}
                  style={styles.searchButton}
                  textStyle={styles.searchButtonText}
                />
              </View>

              <View style={styles.secondaryButtonContainer}>
                <ModernButton
                  title="Get AI Recommendations"
                  onPress={onGetRecommendations}
                  variant="ghost"
                  size="large"
                  icon={<Sparkles size={20} color={Colors.light.white} />}
                  style={styles.recommendButton}
                  textStyle={styles.recommendButtonText}
                />
              </View>
            </Animated.View>
          </View>
        </LinearGradient>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    height: 320,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    position: 'relative',
  },
  decorativeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  sparkleContainer: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
  },
  trendingContainer: {
    position: 'absolute',
    top: Spacing.xl,
    left: Spacing.lg,
    opacity: 0.7,
  },
  awardContainer: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.xl,
    opacity: 0.6,
  },
  content: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  title: {
    ...Typography.heading,
    color: Colors.light.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    fontWeight: '800',
  },
  subtitle: {
    ...Typography.base,
    color: Colors.light.white,
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...Typography.lg,
    color: Colors.light.white,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    ...Typography.xs,
    color: Colors.light.white,
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.light.white,
    opacity: 0.3,
    marginHorizontal: Spacing.sm,
  },
  buttonsContainer: {
    gap: Spacing.md,
  },
  primaryButtonContainer: {
    marginBottom: Spacing.sm,
  },
  searchButton: {
    backgroundColor: Colors.light.white,
    borderWidth: 0,
  },
  searchButtonText: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  secondaryButtonContainer: {},
  recommendButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: Colors.light.white,
    borderWidth: 1,
  },
  recommendButtonText: {
    color: Colors.light.white,
    fontWeight: '500',
  },
});

ModernHeroSection.displayName = 'ModernHeroSection';
