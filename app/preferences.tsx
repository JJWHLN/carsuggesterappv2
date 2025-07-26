import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { ModernButton } from '@/components/ui/ModernButton';
import { Card } from '@/components/ui/Card';
import { useThemeColors } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';

import UserPreferencesService from '@/services/core/UserPreferencesService';
import CarDataService from '@/services/core/CarDataService';
import { UserPreferences } from '@/services/core/SimpleRecommendationEngine';
import { formatPrice } from '@/utils/dataTransformers';
import {
  ArrowLeft,
  Settings,
  DollarSign,
  Car,
  TrendingUp,
  Eye,
  Heart,
  Search,
} from '@/utils/ultra-optimized-icons';

export default function UserPreferencesScreen() {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const styles = useMemo(() => getStyles(colors), [colors]);

  // Services
  const preferencesService = UserPreferencesService.getInstance();
  const carDataService = CarDataService.getInstance();

  // State
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [popularMakes, setPopularMakes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [budgetMin, setBudgetMin] = useState('0');
  const [budgetMax, setBudgetMax] = useState('100000');
  const [preferredMakes, setPreferredMakes] = useState<string[]>([]);
  const [enableRecommendations, setEnableRecommendations] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load user preferences
      const userPrefs = await preferencesService.getPreferences();
      setPreferences(userPrefs);

      // Load popular makes for selection
      const makesData = await carDataService.getPopularMakes();
      const makesList = makesData.map((item) => item.make);
      setPopularMakes(makesList);

      // Set form values
      setBudgetMin(userPrefs.budget?.min?.toString() || '0');
      setBudgetMax(userPrefs.budget?.max?.toString() || '100000');
      setPreferredMakes(userPrefs.preferredMakes || []);
      // For now, just default to true since the interface doesn't have this property
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'Failed to load your preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);

      const minBudget = parseInt(budgetMin) || 0;
      const maxBudget = parseInt(budgetMax) || 100000;

      if (minBudget >= maxBudget) {
        Alert.alert(
          'Invalid Budget',
          'Maximum budget must be greater than minimum budget',
        );
        return;
      }

      const updatedPreferences: Partial<UserPreferences> = {
        budget: { min: minBudget, max: maxBudget },
        preferredMakes,
        // Note: enablePersonalization is handled separately by the service
      };

      await preferencesService.updatePreferences(updatedPreferences);

      Alert.alert('Saved', 'Your preferences have been updated successfully!');
      router.back();
    } catch (error) {
      console.error('Error saving preferences:', error);
      Alert.alert('Error', 'Failed to save your preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleMakeToggle = (make: string) => {
    setPreferredMakes((prev) =>
      prev.includes(make) ? prev.filter((m) => m !== make) : [...prev, make],
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will reset all your preference and activity data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await preferencesService.clearUserData();
              Alert.alert('Cleared', 'Your data has been cleared.');
              loadData(); // Reload fresh data
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <LoadingSpinner />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your preferences...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Preferences
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Budget Preferences */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <DollarSign size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Budget Range
            </Text>
          </View>

          <Text
            style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
          >
            Set your preferred price range to get better recommendations
          </Text>

          <View style={styles.budgetContainer}>
            <View style={styles.budgetInputRow}>
              <View style={styles.budgetInput}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Minimum Budget
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={budgetMin}
                  onChangeText={setBudgetMin}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
                <Text style={[styles.budgetDisplay, { color: colors.primary }]}>
                  {formatPrice(parseInt(budgetMin) || 0)}
                </Text>
              </View>

              <View style={styles.budgetInput}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Maximum Budget
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: colors.surface,
                      color: colors.text,
                      borderColor: colors.border,
                    },
                  ]}
                  value={budgetMax}
                  onChangeText={setBudgetMax}
                  placeholder="100000"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                />
                <Text style={[styles.budgetDisplay, { color: colors.primary }]}>
                  {formatPrice(parseInt(budgetMax) || 0)}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Preferred Makes */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Car size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Preferred Car Brands
            </Text>
          </View>

          <Text
            style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
          >
            Select brands you're interested in for personalized recommendations
          </Text>

          <View style={styles.makesGrid}>
            {popularMakes.map((make) => (
              <TouchableOpacity
                key={make}
                style={[
                  styles.makeChip,
                  {
                    backgroundColor: preferredMakes.includes(make)
                      ? colors.primary
                      : colors.surface,
                    borderColor: preferredMakes.includes(make)
                      ? colors.primary
                      : colors.border,
                  },
                ]}
                onPress={() => handleMakeToggle(make)}
              >
                <Text
                  style={[
                    styles.makeChipText,
                    {
                      color: preferredMakes.includes(make)
                        ? 'white'
                        : colors.text,
                    },
                  ]}
                >
                  {make}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Recommendation Settings */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Settings size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recommendation Settings
            </Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={[styles.settingTitle, { color: colors.text }]}>
                Enable Personalized Recommendations
              </Text>
              <Text
                style={[
                  styles.settingDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Get car suggestions based on your preferences and activity
              </Text>
            </View>
            <Switch
              value={enableRecommendations}
              onValueChange={setEnableRecommendations}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={
                enableRecommendations ? 'white' : colors.textSecondary
              }
            />
          </View>
        </Card>

        {/* Data Management */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={20} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Data Management
            </Text>
          </View>

          <Text
            style={[styles.sectionSubtitle, { color: colors.textSecondary }]}
          >
            Manage your stored preferences and activity data
          </Text>

          <Button
            title="Clear All Data"
            onPress={handleClearData}
            variant="secondary"
            style={styles.clearButton}
          />
        </Card>

        {/* Save Button */}
        <Button
          title={saving ? 'Saving...' : 'Save Preferences'}
          onPress={handleSavePreferences}
          variant="primary"
          disabled={saving}
          style={styles.saveButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 32,
    },
    sectionCard: {
      marginBottom: 20,
      padding: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      marginLeft: 8,
    },
    sectionSubtitle: {
      fontSize: 14,
      marginBottom: 16,
      lineHeight: 20,
    },
    budgetContainer: {
      gap: 16,
    },
    budgetInputRow: {
      flexDirection: 'row',
      gap: 16,
    },
    budgetInput: {
      flex: 1,
      gap: 8,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
    },
    textInput: {
      borderWidth: 1,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
    },
    budgetDisplay: {
      fontSize: 16,
      fontWeight: '700',
      textAlign: 'center',
    },
    makesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    makeChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
    },
    makeChipText: {
      fontSize: 14,
      fontWeight: '600',
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingInfo: {
      flex: 1,
      marginRight: 16,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 4,
    },
    settingDescription: {
      fontSize: 14,
      lineHeight: 18,
    },
    clearButton: {
      marginTop: 8,
    },
    saveButton: {
      marginTop: 8,
    },
  });
