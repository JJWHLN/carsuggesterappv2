import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@/components/ui/Button';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import { Sparkles, ArrowRight, Zap } from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');

interface CTASectionProps {
  onGetRecommendations: () => void;
  onBrowseAll: () => void;
  canAccessAI: boolean;
}

export const CTASection: React.FC<CTASectionProps> = ({
  onGetRecommendations,
  onBrowseAll,
  canAccessAI,
}) => {
  const { colors } = useThemeColors();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#22C55E', '#16A34A', '#15803D']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Background Elements */}
        <View style={styles.backgroundElements}>
          <View style={[styles.floatingElement, styles.element1]}>
            <Zap color="rgba(255,255,255,0.2)" size={24} />
          </View>
          <View style={[styles.floatingElement, styles.element2]}>
            <Shield color="rgba(255,255,255,0.15)" size={20} />
          </View>
          <View style={[styles.floatingElement, styles.element3]}>
            <Sparkles color="rgba(255,255,255,0.1)" size={16} />
          </View>
        </View>

        <View style={styles.content}>
          {/* Badge */}
          <View style={styles.badge}>
            <Sparkles color="#22C55E" size={14} />
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              {canAccessAI ? 'AI-Powered Recommendations' : 'Get Started Today'}
            </Text>
          </View>

          {/* Main Content */}
          <Text style={styles.title}>
            {canAccessAI
              ? 'Ready to Find Your Dream Car?'
              : 'Join Thousands of Happy Car Buyers'}
          </Text>

          <Text style={styles.subtitle}>
            {canAccessAI
              ? 'Get personalized recommendations powered by advanced AI technology. Find the perfect car that matches your needs, budget, and lifestyle.'
              : 'Sign up now and get access to exclusive AI-powered car recommendations, verified listings, and expert reviews.'}
          </Text>

          {/* Features List */}
          <View style={styles.features}>
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Sparkles color="#FFFFFF" size={16} />
              </View>
              <Text style={styles.featureText}>AI-powered recommendations</Text>
            </View>
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Shield color="#FFFFFF" size={16} />
              </View>
              <Text style={styles.featureText}>
                Verified dealers & listings
              </Text>
            </View>
            <View style={styles.feature}>
              <View style={styles.featureIcon}>
                <Zap color="#FFFFFF" size={16} />
              </View>
              <Text style={styles.featureText}>Instant price comparisons</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Button
              title={canAccessAI ? 'Get My Recommendations' : 'Sign Up Free'}
              onPress={onGetRecommendations}
              variant="secondary"
              style={styles.primaryButton}
              icon={<Sparkles color="#22C55E" size={18} />}
            />
            <Button
              title="Browse All Cars"
              onPress={onBrowseAll}
              variant="outline"
              style={styles.secondaryButton}
              icon={<ArrowRight color="#FFFFFF" size={18} />}
            />
          </View>

          {/* Trust Indicator - removed fake claim */}
          <View style={styles.trustIndicator}>
            <Text style={styles.trustText}>
              ✓ Verified dealer network & secure platform
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.large,
  },
  gradient: {
    padding: Spacing.xl,
    position: 'relative',
    minHeight: 400,
  },
  backgroundElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingElement: {
    position: 'absolute',
    borderRadius: 50,
    padding: Spacing.sm,
  },
  element1: {
    top: '15%',
    right: '10%',
    transform: [{ rotate: '15deg' }],
  },
  element2: {
    bottom: '20%',
    left: '8%',
    transform: [{ rotate: '-10deg' }],
  },
  element3: {
    top: '60%',
    right: '15%',
    transform: [{ rotate: '25deg' }],
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.xl,
    gap: Spacing.xs,
    ...Shadows.medium,
  },
  badgeText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  title: {
    ...Typography.sectionTitle,
    fontSize: Math.min(32, width * 0.08),
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: Math.min(38, width * 0.095),
    letterSpacing: -0.5,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.xl,
    opacity: 0.95,
    lineHeight: 26,
    maxWidth: width * 0.85,
  },
  features: {
    width: '100%',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    ...Typography.bodyText,
    color: '#FFFFFF',
    fontWeight: '500',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    marginBottom: Spacing.lg,
  },
  primaryButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
  },
  trustIndicator: {
    alignItems: 'center',
  },
  trustText: {
    ...Typography.caption,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    fontWeight: '500',
  },
});
