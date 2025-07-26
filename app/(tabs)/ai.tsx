import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useThemeColors } from '@/hooks/useTheme';
import {
  Sparkles,
  MessageCircle,
  TrendingUp,
  Zap,
  Clock,
  Trash,
} from '@/utils/ultra-optimized-icons';

export default function AIScreen() {
  const { colors } = useThemeColors();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const suggestedPrompts = [
    'Show me electric cars under $40k',
    'Best family SUVs with good safety ratings',
    'Fuel-efficient cars for city driving',
    'Luxury sedans with latest tech features',
    'Reliable used cars under $20k',
  ];

  // Load search history on mount
  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('ai_search_history');
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  const saveToHistory = async (searchQuery: string) => {
    try {
      const newHistory = [
        searchQuery,
        ...searchHistory.filter((item) => item !== searchQuery),
      ].slice(0, 5);
      setSearchHistory(newHistory);
      await AsyncStorage.setItem(
        'ai_search_history',
        JSON.stringify(newHistory),
      );
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  const clearHistory = async () => {
    try {
      setSearchHistory([]);
      await AsyncStorage.removeItem('ai_search_history');
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  };

  const handleSearchWithAI = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        Alert.alert('Please enter a search query');
        return;
      }

      setLoading(true);
      await saveToHistory(searchQuery);
      // Redirect to search with the AI query
      router.push(`/(tabs)/search?q=${encodeURIComponent(searchQuery)}`);
      setLoading(false);
    },
    [searchHistory],
  );

  const handlePromptPress = useCallback((prompt: string) => {
    setQuery(prompt);
  }, []);

  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Sparkles color={colors.primary} size={32} />
            <Text style={[styles.title, { color: colors.text }]}>
              AI Car Search
            </Text>
          </View>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Ask me anything about cars and I'll help you find the perfect match
          </Text>
        </View>

        {/* Search Input */}
        <Card style={styles.searchCard}>
          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Ask me about cars... (e.g., 'Show me electric SUVs under $50k')"
              placeholderTextColor={colors.textSecondary}
              value={query}
              onChangeText={setQuery}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <Button
              title="Search with AI"
              onPress={() => handleSearchWithAI(query)}
              disabled={loading || !query.trim()}
              style={styles.searchButton}
              icon={<Zap color={colors.white} size={16} />}
            />
          </View>
        </Card>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <View style={styles.historySection}>
            <View style={styles.historySectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Recent AI Searches
              </Text>
              <TouchableOpacity onPress={clearHistory}>
                <Trash color={colors.textSecondary} size={16} />
              </TouchableOpacity>
            </View>
            <View style={styles.historyContainer}>
              {searchHistory.map((historyItem, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.historyItem,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleSearchWithAI(historyItem)}
                >
                  <Clock color={colors.textSecondary} size={14} />
                  <Text
                    style={[styles.historyText, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {historyItem}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Suggested Prompts */}
        <View style={styles.promptsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Try asking me about:
          </Text>
          <View style={styles.promptsContainer}>
            {suggestedPrompts.map((prompt, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.promptCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => handlePromptPress(prompt)}
              >
                <MessageCircle color={colors.primary} size={16} />
                <Text style={[styles.promptText, { color: colors.text }]}>
                  {prompt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            AI Features
          </Text>
          <View style={styles.featuresGrid}>
            <View
              style={[
                styles.featureCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <TrendingUp color={colors.primary} size={24} />
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Smart Recommendations
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Get personalized car suggestions based on your preferences
              </Text>
            </View>

            <View
              style={[
                styles.featureCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <MessageCircle color={colors.primary} size={24} />
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                Natural Language
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  { color: colors.textSecondary },
                ]}
              >
                Search using everyday language - no complex filters needed
              </Text>
            </View>
          </View>
        </View>

        {/* Coming Soon Notice */}
        <Card style={styles.comingSoonCard}>
          <Text style={[styles.comingSoonTitle, { color: colors.text }]}>
            🚀 Coming Soon
          </Text>
          <Text
            style={[styles.comingSoonText, { color: colors.textSecondary }]}
          >
            Advanced AI features including car comparisons, detailed analysis,
            and personalized buying guides are coming soon!
          </Text>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      padding: 20,
      alignItems: 'center',
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 22,
    },
    searchCard: {
      margin: 16,
      padding: 16,
    },
    searchContainer: {
      gap: 12,
    },
    searchInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      minHeight: 80,
    },
    searchButton: {
      alignSelf: 'stretch',
    },
    promptsSection: {
      margin: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 12,
    },
    promptsContainer: {
      gap: 8,
    },
    promptCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      gap: 12,
    },
    promptText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
    },
    featuresSection: {
      margin: 16,
    },
    featuresGrid: {
      gap: 12,
    },
    featureCard: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      gap: 8,
    },
    featureTitle: {
      fontSize: 16,
      fontWeight: '600',
    },
    featureDescription: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    comingSoonCard: {
      margin: 16,
      padding: 20,
      alignItems: 'center',
    },
    comingSoonTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
    },
    comingSoonText: {
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 20,
    },
    // History styles
    historySection: {
      margin: 16,
    },
    historySectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    historyContainer: {
      gap: 8,
    },
    historyItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      gap: 8,
    },
    historyText: {
      flex: 1,
      fontSize: 14,
    },
  });
