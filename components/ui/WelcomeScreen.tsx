import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { Button } from './Button';
import { OptimizedImage } from './OptimizedImage';
import { useThemeColors } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors';
import { Car, Zap, TrendingUp, ChevronRight } from '@/utils/ultra-optimized-icons';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onBrowseAnonymous?: () => void;
}

export const WelcomeScreen = memo<WelcomeScreenProps>(({
  onGetStarted,
  onSignIn,
  onBrowseAnonymous,
}) => {
  const { colors } = useThemeColors();

  const features = [
    {
      icon: <Car color={colors.primary} size={24} />,
      title: 'Smart Recommendations',
      description: 'AI-powered suggestions based on your preferences'
    },
    {
      icon: <Zap color={colors.accentGreen} size={24} />,
      title: 'Instant Search',
      description: 'Find your perfect car in seconds'
    },
    {
      icon: <TrendingUp color={colors.success} size={24} />,
      title: 'Market Insights',
      description: 'Real-time pricing and market trends'
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section with Gradient */}
        <LinearGradient
          colors={[colors.primary, colors.primaryHover]}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroContent}>
            {/* Logo/Brand */}
            <View style={styles.logoContainer}>
              <View style={[styles.logoCircle, { backgroundColor: colors.white }]}>
                <Car color={colors.primary} size={32} />
              </View>
              <Text style={[styles.brandName, { color: colors.white }]}>
                CarSuggester
              </Text>
            </View>          {/* Hero Text */}
          <View style={styles.heroTextContainer}>
            <Text style={[styles.heroTitle, { color: colors.white }]}>
              Find Your Perfect Car
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.white }]}>
              Already browsing? Sign up for AI-powered recommendations and personalized features
            </Text>
          </View>
          </View>
        </LinearGradient>

        {/* Features Section */}
        <View style={styles.featuresSection}>
          <Text style={[styles.featuresTitle, { color: colors.text }]}>
            Why Choose CarSuggester?
          </Text>
          
          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={[styles.featureCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primaryLight }]}>
                  {feature.icon}
                </View>
                <View style={styles.featureContent}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>
                    {feature.title}
                  </Text>
                  <Text style={[styles.featureDescription, { color: colors.textSecondary }]}>
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <Button
            title="Continue Browsing"
            onPress={() => onBrowseAnonymous ? onBrowseAnonymous() : onGetStarted()}
            style={styles.primaryButton}
            icon={<Car color={colors.white} size={20} />}
          />
          
          <Button
            title="Get Personalized Experience"
            onPress={onGetStarted}
            variant="outline"
            style={styles.secondaryButton}
            icon={<ChevronRight color={colors.primary} size={20} />}
          />
          
          <Button
            title="Sign In"
            onPress={onSignIn}
            variant="ghost"
            style={styles.secondaryButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

WelcomeScreen.displayName = 'WelcomeScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroSection: {
    minHeight: height * 0.5,
    paddingTop: (StatusBar.currentHeight || 0) + Spacing.lg,
  },
  heroContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    minHeight: height * 0.4,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    ...ColorsShadows.large,
  },
  brandName: {
    ...Typography.h2,
    fontWeight: '700',
  },
  heroTextContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  heroTitle: {
    ...Typography.heroTitle,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontWeight: '800',
    fontSize: Math.min(34, width * 0.08),
  },
  heroSubtitle: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
    maxWidth: width * 0.85,
    fontSize: 16,
  },
  featuresSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    backgroundColor: 'transparent',
  },
  featuresTitle: {
    ...Typography.subtitle,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontWeight: '700',
  },
  featuresContainer: {
    gap: Spacing.md,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    ...ColorsShadows.sm,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    ...Typography.caption,
    lineHeight: 20,
  },
  actionsSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  primaryButton: {
    marginBottom: Spacing.sm,
  },
  secondaryButton: {},
});
