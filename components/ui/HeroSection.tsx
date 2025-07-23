import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@/components/ui/Button';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import { Search, Sparkles, ArrowRight, MapPin, Filter } from '@/utils/ultra-optimized-icons';

const { width, height } = Dimensions.get('window');

interface HeroSectionProps {
  onSearchPress: () => void;
  onAIRecommendations: () => void;
  onBrowseAll: () => void;
  canAccessAI: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onSearchPress,
  onAIRecommendations,
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
        {/* Background Pattern */}
        <View style={styles.backgroundPattern}>
          <View style={[styles.patternDot, { backgroundColor: 'rgba(255,255,255,0.1)' }]} />
          <View style={[styles.patternDot, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />
          <View style={[styles.patternDot, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />
        </View>

        <View style={styles.content}>
          {/* Trust Badge - removed fake claim */}
          <View style={styles.trustBadge}>
            <Sparkles color="#22C55E" size={14} />
            <Text style={styles.trustBadgeText}>Expert Car Recommendations</Text>
          </View>

          {/* Main Headlines */}
          <Text style={styles.mainTitle}>
            Find Your Perfect Car
          </Text>
          <Text style={styles.subtitle}>
            Search thousands of verified listings from trusted dealers.{'\n'}
            Get AI-powered recommendations tailored just for you.
          </Text>

          {/* Enhanced Search Bar */}
          <View style={styles.searchContainer}>
            <TouchableOpacity 
              style={styles.searchBar}
              onPress={onSearchPress}
              activeOpacity={0.9}
            >
              <View style={styles.searchInput}>
                <Search color="#6B7280" size={20} />
                <Text style={styles.searchPlaceholder}>
                  Try "BMW under $30k" or "Family SUV"
                </Text>
              </View>
              
              {/* Quick Filters */}
              <View style={styles.quickFilters}>
                <View style={styles.filterChip}>
                  <MapPin color="#6B7280" size={14} />
                  <Text style={styles.filterText}>Location</Text>
                </View>
                <View style={styles.filterChip}>
                  <Filter color="#6B7280" size={14} />
                  <Text style={styles.filterText}>Filters</Text>
                </View>
              </View>
              
              <View style={styles.searchButton}>
                <Search color="#FFFFFF" size={20} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              title={canAccessAI ? "Get AI Recommendations" : "Try AI Search Free"}
              onPress={onAIRecommendations}
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

          {/* Trust Indicators */}
          <View style={styles.trustIndicators}>
            <View style={styles.trustItem}>
              <Text style={styles.trustNumber}>15,000+</Text>
              <Text style={styles.trustLabel}>Verified Cars</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Text style={styles.trustNumber}>500+</Text>
              <Text style={styles.trustLabel}>Trusted Dealers</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Text style={styles.trustNumber}>2,500+</Text>
              <Text style={styles.trustLabel}>Happy Customers</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  gradient: {
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    minHeight: Math.min(height * 0.5, 500),
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignItems: 'center',
    opacity: 0.3,
  },
  patternDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    margin: 15,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  trustBadge: {
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
  trustBadgeText: {
    ...Typography.caption,
    fontWeight: '600',
    color: '#22C55E',
  },
  mainTitle: {
    fontSize: Math.min(42, width * 0.11),
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.md,
    lineHeight: Math.min(48, width * 0.12),
    letterSpacing: -0.5,
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.xl,
    opacity: 0.95,
    lineHeight: 26,
    maxWidth: width * 0.9,
    fontWeight: '400',
  },
  searchContainer: {
    width: '100%',
    maxWidth: 420,
    marginBottom: Spacing.xl,
  },
  searchBar: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.sm,
    ...Shadows.large,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: Spacing.sm,
  },
  searchPlaceholder: {
    ...Typography.bodyText,
    color: '#6B7280',
    marginLeft: Spacing.sm,
    flex: 1,
  },
  quickFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  filterText: {
    ...Typography.caption,
    color: '#6B7280',
    fontWeight: '500',
  },
  searchButton: {
    backgroundColor: '#22C55E',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
    marginTop: -50,
    marginRight: Spacing.sm,
    width: 48,
    height: 48,
    ...Shadows.medium,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    maxWidth: 400,
    marginBottom: Spacing.xxl,
  },
  primaryButton: {
    flex: 1,
  },
  secondaryButton: {
    flex: 1,
  },
  trustIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.lg,
  },
  trustItem: {
    alignItems: 'center',
  },
  trustNumber: {
    ...Typography.subtitle,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  trustLabel: {
    ...Typography.caption,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  trustDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});
