import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Sparkles, Search, Zap } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useCanPerformAction } from '@/components/ui/RoleProtection';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Typography, Spacing } from '@/constants/Colors';

export default function AITab() {
  const { colors } = useThemeColors();
  const router = useRouter();
  const { user } = useAuth();
  const canAccessAI = useCanPerformAction('accessAI');

  const handleAISearch = () => {
    if (canAccessAI) {
      router.push('/search');
    } else {
      router.push('/auth/sign-in');
    }
  };

  if (!canAccessAI) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Sparkles size={64} color={colors.textMuted} />
          </View>
          <Text style={[styles.title, Typography.sectionTitle, { color: colors.text }]}>
            AI-Powered Car Search
          </Text>
          <Text style={[styles.description, Typography.bodyText, { color: colors.textSecondary }]}>
            Get personalized car recommendations using advanced AI technology. 
            Sign in to access this premium feature.
          </Text>
          <Button
            title="Sign In to Access AI"
            onPress={handleAISearch}
            style={styles.button}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Sparkles size={32} color={colors.primary} />
          <Text style={[styles.title, Typography.sectionTitle, { color: colors.text }]}>
            AI Car Assistant
          </Text>
        </View>

        <Text style={[styles.subtitle, Typography.bodyText, { color: colors.textSecondary }]}>
          Let our AI help you find the perfect car based on your preferences, budget, and needs.
        </Text>

        <Card style={styles.featureCard}>
          <View style={styles.featureHeader}>
            <Search size={24} color={colors.primary} />
            <Text style={[styles.featureTitle, Typography.cardTitle, { color: colors.text }]}>
              Smart Search
            </Text>
          </View>
          <Text style={[styles.featureDescription, Typography.bodySmall, { color: colors.textSecondary }]}>
            Describe what you're looking for in natural language and get personalized recommendations.
          </Text>
          <Button
            title="Start AI Search"
            onPress={handleAISearch}
            variant="primary"
            style={styles.featureButton}
          />
        </Card>

        <Card style={styles.featureCard}>
          <View style={styles.featureHeader}>
            <Zap size={24} color={colors.primary} />
            <Text style={[styles.featureTitle, Typography.cardTitle, { color: colors.text }]}>
              Quick Recommendations
            </Text>
          </View>
          <Text style={[styles.featureDescription, Typography.bodySmall, { color: colors.textSecondary }]}>
            Get instant car suggestions based on your previous searches and preferences.
          </Text>
          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={() => router.push('/search')}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
              View Recommendations
            </Text>
          </TouchableOpacity>
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.md,
    marginLeft: Spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  description: {
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
    paddingHorizontal: Spacing.md,
  },
  button: {
    marginHorizontal: Spacing.md,
  },
  featureCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  featureTitle: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  featureDescription: {
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  featureButton: {
    marginTop: Spacing.sm,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
