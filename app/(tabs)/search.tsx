import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Search, 
  Sparkles, 
  Filter, 
  TrendingUp,
  Car,
  MapPin,
  DollarSign
} from 'lucide-react-native';
import { ComingSoon } from '@/components/ui/ComingSoon';
import { currentColors, Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);

  const popularSearches = [
    "Toyota Camry under $25,000",
    "BMW 3 Series in California", 
    "Electric vehicles near me",
    "SUVs with low mileage",
    "Luxury cars under $50,000"
  ];

  const searchFilters = [
    { id: 'make', label: 'Make & Model', icon: <Car color={currentColors.primary} size={20} /> },
    { id: 'price', label: 'Price Range', icon: <DollarSign color={currentColors.success} size={20} /> },
    { id: 'location', label: 'Location', icon: <MapPin color={currentColors.accentGreen} size={20} /> },
    { id: 'features', label: 'Features', icon: <Filter color={currentColors.secondaryGreen} size={20} /> },
  ];

  const SearchSuggestionCard = ({ suggestion }: { suggestion: string }) => (
    <TouchableOpacity 
      style={styles.suggestionCard}
      onPress={() => setSearchQuery(suggestion)}
    >
      <Search color={currentColors.textSecondary} size={16} />
      <Text style={[styles.suggestionText, { marginLeft: Spacing.sm }]}>{suggestion}</Text>
    </TouchableOpacity>
  );

  const FilterCard = ({ filter }: { filter: any }) => (
    <TouchableOpacity 
      style={[
        styles.filterCard,
        selectedFilter === filter.id && styles.filterCardActive
      ]}
      onPress={() => setSelectedFilter(selectedFilter === filter.id ? null : filter.id)}
    >
      <View style={styles.filterIcon}>{filter.icon}</View>
      <Text style={[
        styles.filterText,
        selectedFilter === filter.id && styles.filterTextActive
      ]}>
        {filter.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Sparkles color={currentColors.primary} size={28} />
            <Text style={styles.title}>AI Car Search</Text>
          </View>
          <Text style={styles.subtitle}>
            Find your perfect car using natural language
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Sparkles color={currentColors.primary} size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Try 'Red Toyota under $25,000 in California'"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={currentColors.textMuted}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearButton}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity style={styles.aiSearchButton}>
            <Sparkles color={currentColors.white} size={16} />
            <Text style={[styles.aiSearchButtonText, { marginLeft: Spacing.sm }]}>Search with AI</Text>
          </TouchableOpacity>
        </View>

        {/* Coming Soon Notice */}
        <ComingSoon
          title="AI Search Coming Soon!"
          message="We're building an intelligent search experience that understands natural language. Soon you'll be able to search like 'Find me a reliable family car under $30,000 in Los Angeles'."
          icon={<Sparkles color={currentColors.primary} size={32} />} // Using Sparkles to match AI theme
        />

        {/* Search Filters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search Filters (Preview)</Text>
          <View style={styles.filtersGrid}>
            {searchFilters.map((filter) => (
              <FilterCard key={filter.id} filter={filter} />
            ))}
          </View>
        </View>

        {/* Popular Searches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Searches</Text>
          <Text style={styles.sectionSubtitle}>
            Examples of what you'll be able to search for
          </Text>
          {popularSearches.map((suggestion, index) => (
            <SearchSuggestionCard key={index} suggestion={suggestion} />
          ))}
        </View>

        {/* Search Examples */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How AI Search Will Work</Text>
          
          <View style={styles.exampleCard}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/1149137/pexels-photo-1149137.jpeg?auto=compress&cs=tinysrgb&w=400' }}
              style={styles.exampleImage}
            />
            <View style={styles.exampleContent}>
              <Text style={styles.exampleQuery}>"Find me a reliable family SUV under $35,000"</Text>
              <Text style={styles.exampleResult}>
                AI will understand you want: SUV body type, family-friendly features, 
                reliability ratings, and price under $35,000
              </Text>
            </View>
          </View>
          
          <View style={styles.exampleCard}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/1592384/pexels-photo-1592384.jpeg?auto=compress&cs=tinysrgb&w=400' }}
              style={styles.exampleImage}
            />
            <View style={styles.exampleContent}>
              <Text style={styles.exampleQuery}>"Show me electric cars with long range in California"</Text>
              <Text style={styles.exampleResult}>
                AI will filter for: Electric vehicles, high battery range, 
                available in California dealerships
              </Text>
            </View>
          </View>
        </View>

        {/* Features Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Features</Text>
          
          <View style={styles.featureCard}>
            <Sparkles color={currentColors.primary} size={24} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Natural Language Processing</Text>
              <Text style={styles.featureDescription}>
                Search using everyday language instead of complex filters
              </Text>
            </View>
          </View>
          
          <View style={styles.featureCard}>
            <TrendingUp color={currentColors.success} size={24} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Smart Recommendations</Text>
              <Text style={styles.featureDescription}>
                Get personalized suggestions based on your preferences
              </Text>
            </View>
          </View>
          
          <View style={styles.featureCard}>
            <Filter color={currentColors.accentGreen} size={24} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Advanced Filtering</Text>
              <Text style={styles.featureDescription}>
                Combine multiple criteria in a single search query
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: currentColors.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: currentColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: currentColors.border,
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    ...Typography.h1,
    color: currentColors.text,
    marginLeft: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: currentColors.textSecondary,
    textAlign: 'center',
  },
  searchSection: {
    padding: Spacing.lg,
    backgroundColor: currentColors.surface,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: currentColors.background,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 2,
    borderColor: currentColors.primary,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.sm,
    ...Typography.body,
    color: currentColors.text,
  },
  clearButton: {
    ...Typography.body,
    color: currentColors.textSecondary,
    padding: Spacing.xs,
  },
  aiSearchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: currentColors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
  },
  aiSearchButtonText: {
    ...Typography.button,
    color: currentColors.white,
  },
  // comingSoonCard, comingSoonTitle, comingSoonText styles are now in ComingSoon.tsx
  section: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h2,
    color: currentColors.text,
    marginBottom: Spacing.md,
  },
  sectionSubtitle: {
    ...Typography.bodySmall,
    color: currentColors.textSecondary,
    marginBottom: Spacing.lg,
  },
  filtersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  filterCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: currentColors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: currentColors.border,
    ...ColorsShadows.small,
    marginBottom: Spacing.md, // Add spacing between rows
    marginRight: Spacing.md, // Add spacing between columns
  },
  filterCardActive: {
    borderColor: currentColors.primary,
    backgroundColor: currentColors.primaryLight,
  },
  filterIcon: {
    marginBottom: Spacing.sm,
  },
  filterText: {
    ...Typography.bodySmall,
    color: currentColors.text,
    fontWeight: '500',
    textAlign: 'center',
  },
  filterTextActive: {
    color: currentColors.primary,
    fontWeight: '600',
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: currentColors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    ...ColorsShadows.small,
  },
  suggestionText: {
    ...Typography.bodySmall,
    color: currentColors.text,
    flex: 1,
  },
  exampleCard: {
    backgroundColor: currentColors.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...ColorsShadows.medium,
  },
  exampleImage: {
    width: '100%',
    height: 120,
    backgroundColor: currentColors.surfaceDark,
  },
  exampleContent: {
    padding: Spacing.lg,
  },
  exampleQuery: {
    ...Typography.body,
    color: currentColors.primary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
  },
  exampleResult: {
    ...Typography.bodySmall,
    color: currentColors.textSecondary,
    lineHeight: 20,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: currentColors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    ...ColorsShadows.small,
  },
  featureContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  featureTitle: {
    ...Typography.body,
    color: currentColors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    ...Typography.bodySmall,
    color: currentColors.textSecondary,
    lineHeight: 20,
  },
});