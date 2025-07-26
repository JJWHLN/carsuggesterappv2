import React, { memo, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Platform,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
  useDerivedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

import { useThemeColors } from '@/hooks/useTheme';
import {
  Home,
  Search,
  Car,
  MessageCircle,
  User,
  Plus,
  Heart,
  TrendingUp,
  MapPin,
  Settings,
} from '@/utils/ultra-optimized-icons';
import { BorderRadius, Spacing, Shadows } from '@/constants/Colors';

const { width } = Dimensions.get('window');
const tabBarHeight = 80;
const tabBarWidth = width - Spacing.lg * 2;

interface FloatingTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  activeRoute?: string;
  onTabPress?: (routeName: string) => void;
}

interface TabConfig {
  name: string;
  icon: React.ComponentType<{ size: number; color: string; fill?: string }>;
  activeIcon?: React.ComponentType<{
    size: number;
    color: string;
    fill?: string;
  }>;
  label: string;
  gradient?: string[];
  special?: boolean;
}

const tabConfigs: Record<string, TabConfig> = {
  index: {
    name: 'index',
    icon: Home,
    label: 'Home',
    gradient: ['#22C55E', '#16A34A'],
  },
  search: {
    name: 'search',
    icon: Search,
    label: 'Search',
    gradient: ['#3B82F6', '#1D4ED8'],
  },
  marketplace: {
    name: 'marketplace',
    icon: Car,
    label: 'Cars',
    gradient: ['#8B5CF6', '#7C3AED'],
    special: true, // Center elevated button
  },
  reviews: {
    name: 'reviews',
    icon: MessageCircle,
    label: 'Reviews',
    gradient: ['#F59E0B', '#D97706'],
  },
  profile: {
    name: 'profile',
    icon: User,
    label: 'Profile',
    gradient: ['#EF4444', '#DC2626'],
  },
};

export const PremiumFloatingTabBar = memo<FloatingTabBarProps>(
  ({ state, descriptors, navigation, activeRoute, onTabPress }) => {
    const { colors } = useThemeColors();
    const styles = getThemedStyles(colors);

    // Animation values
    const activeIndex = useSharedValue(state.index);
    const tabAnimations = state.routes.map(() => useSharedValue(0));
    const specialButtonScale = useSharedValue(1);
    const specialButtonRotation = useSharedValue(0);

    // Update active index when state changes
    useEffect(() => {
      activeIndex.value = withSpring(state.index, {
        stiffness: 300,
        damping: 30,
      });

      // Animate tabs
      tabAnimations.forEach((anim: any, index: number) => {
        anim.value = withSpring(index === state.index ? 1 : 0, {
          stiffness: 400,
          damping: 30,
        });
      });

      // Special animation for center button
      if (state.routes[state.index]?.name === 'marketplace') {
        specialButtonScale.value = withSpring(1.1);
        specialButtonRotation.value = withSpring(180);
      } else {
        specialButtonScale.value = withSpring(1);
        specialButtonRotation.value = withSpring(0);
      }
    }, [state.index]);

    const handleTabPress = useCallback(
      async (routeName: string, index: number) => {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (onTabPress) {
          onTabPress(routeName);
        } else {
          navigation.navigate(routeName);
        }
      },
      [navigation, onTabPress],
    );

    // Animated indicator style
    const indicatorStyle = useAnimatedStyle(() => {
      const tabWidth = tabBarWidth / state.routes.length;
      return {
        transform: [
          {
            translateX: interpolate(
              activeIndex.value,
              [0, state.routes.length - 1],
              [0, tabWidth * (state.routes.length - 1)],
            ),
          },
        ],
      };
    });

    const renderTab = (route: any, index: number) => {
      const isFocused = state.index === index;
      const config = tabConfigs[route.name] || tabConfigs.index;
      const Icon = config.icon;

      const animatedTabStyle = useAnimatedStyle(() => {
        const scale = interpolate(tabAnimations[index].value, [0, 1], [0.9, 1]);
        const translateY = interpolate(
          tabAnimations[index].value,
          [0, 1],
          [2, 0],
        );

        return {
          transform: [{ scale }, { translateY }],
        };
      });

      const animatedIconStyle = useAnimatedStyle(() => {
        const iconScale = interpolate(
          tabAnimations[index].value,
          [0, 1],
          [1, 1.2],
        );
        return {
          transform: [{ scale: iconScale }],
        };
      });

      if (config.special) {
        // Special center button with elevated design
        const specialButtonStyle = useAnimatedStyle(() => {
          return {
            transform: [
              { scale: specialButtonScale.value },
              { rotate: `${specialButtonRotation.value}deg` },
            ],
          };
        });

        return (
          <Animated.View
            key={route.key}
            style={[styles.specialTab, animatedTabStyle]}
          >
            <TouchableOpacity
              style={styles.specialTabTouchable}
              onPress={() => handleTabPress(route.name, index)}
              activeOpacity={0.8}
            >
              <Animated.View
                style={[styles.specialTabButton, specialButtonStyle]}
              >
                <LinearGradient
                  colors={
                    config.gradient?.[0] && config.gradient?.[1]
                      ? [config.gradient[0], config.gradient[1]]
                      : [colors.primary, colors.primaryHover]
                  }
                  style={styles.specialTabGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.specialTabInner}>
                    <Animated.View style={animatedIconStyle}>
                      <Icon
                        size={28}
                        color={colors.white}
                        fill={isFocused ? colors.white : 'none'}
                      />
                    </Animated.View>
                    {isFocused && (
                      <View style={styles.specialTabDot}>
                        <View style={styles.specialTabDotInner} />
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </Animated.View>
            </TouchableOpacity>
          </Animated.View>
        );
      }

      return (
        <Animated.View key={route.key} style={[styles.tab, animatedTabStyle]}>
          <TouchableOpacity
            style={styles.tabTouchable}
            onPress={() => handleTabPress(route.name, index)}
            activeOpacity={0.7}
          >
            <Animated.View style={[styles.tabContent, animatedIconStyle]}>
              <Icon
                size={24}
                color={isFocused ? colors.primary : colors.textSecondary}
                fill={isFocused ? colors.primary : 'none'}
              />
              {isFocused && <View style={styles.tabIndicatorDot} />}
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      );
    };

    return (
      <View style={styles.container}>
        {/* Background blur and shadow */}
        <BlurView intensity={80} style={styles.blurBackground}>
          <LinearGradient
            colors={[
              `${colors.white}E6`, // 90% opacity
              `${colors.white}F0`, // 94% opacity
            ]}
            style={styles.gradientBackground}
          />
        </BlurView>

        {/* Tab content */}
        <View style={styles.tabContainer}>
          {/* Animated indicator */}
          <Animated.View style={[styles.activeIndicator, indicatorStyle]} />

          {/* Render all tabs */}
          {state.routes.map((route: any, index: number) =>
            renderTab(route, index),
          )}
        </View>

        {/* Additional visual effects */}
        <View style={styles.topBorder} />
      </View>
    );
  },
);

const getThemedStyles = (colors: any) => {
  return StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: Spacing.lg,
      left: Spacing.lg,
      right: Spacing.lg,
      height: tabBarHeight,
      borderRadius: BorderRadius.xl,
      overflow: 'hidden',
      ...Shadows.xl,
    },
    blurBackground: {
      ...StyleSheet.absoluteFillObject,
    },
    gradientBackground: {
      ...StyleSheet.absoluteFillObject,
    },
    tabContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingHorizontal: Spacing.sm,
      position: 'relative',
    },
    activeIndicator: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: colors.primary,
      borderRadius: BorderRadius.full,
      width: tabBarWidth / 5, // Assuming 5 tabs
    },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabTouchable: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.xs,
      width: '100%',
    },
    tabContent: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    tabIndicatorDot: {
      position: 'absolute',
      bottom: -8,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.primary,
    },
    specialTab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: -20, // Elevate the center button
    },
    specialTabTouchable: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    specialTabButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      overflow: 'hidden',
      ...Shadows.large,
    },
    specialTabGradient: {
      width: '100%',
      height: '100%',
      alignItems: 'center',
      justifyContent: 'center',
    },
    specialTabInner: {
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    specialTabDot: {
      position: 'absolute',
      bottom: -6,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
    },
    specialTabDotInner: {
      width: 2,
      height: 2,
      borderRadius: 1,
      backgroundColor: colors.primary,
    },
    topBorder: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 1,
      backgroundColor: `${colors.primary}20`, // 12% opacity
    },
  });
};
