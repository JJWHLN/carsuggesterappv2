import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useDesignSystem } from '@/hooks/useDesignSystem';

export interface SearchSuggestion {
  id: string;
  text: string;
  type:
    | 'brand'
    | 'model'
    | 'category'
    | 'recent'
    | 'popular'
    | 'natural_language';
  icon?: string;
  subtitle?: string;
  popularity?: number;
}

interface SearchSuggestionsProps {
  searchTerm: string;
  recentSearchHistory: string[];
  popularSearches: string[];
  showSuggestions: boolean;
  onSelectSuggestion: (suggestion: SearchSuggestion) => void;
  onClose: () => void;
}

export function SearchSuggestions({
  searchTerm,
  recentSearchHistory,
  popularSearches,
  showSuggestions,
  onSelectSuggestion,
  onClose,
}: SearchSuggestionsProps) {
  const { colors, spacing, typography, borderRadius } = useDesignSystem();

  const animatedOpacity = useSharedValue(showSuggestions ? 1 : 0);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withSpring(animatedOpacity.value),
    transform: [
      {
        scale: withSpring(animatedOpacity.value === 1 ? 1 : 0.95),
      },
    ],
  }));

  React.useEffect(() => {
    animatedOpacity.value = showSuggestions ? 1 : 0;
  }, [showSuggestions, animatedOpacity]);

  const generateSuggestions = useMemo((): SearchSuggestion[] => {
    if (!searchTerm.trim()) {
      // Show recent searches when no query
      const recents = recentSearchHistory.slice(0, 5).map((search, index) => ({
        id: `recent-${index}`,
        text: search,
        type: 'recent' as const,
        icon: '🕒',
        subtitle: 'Recent search',
        popularity: 90 - index * 10,
      }));

      const popular = popularSearches.slice(0, 3).map((search, index) => ({
        id: `popular-${index}`,
        text: search,
        type: 'popular' as const,
        icon: '🔥',
        subtitle: 'Popular search',
        popularity: 80 - index * 10,
      }));

      return [...recents, ...popular];
    }

    const suggestions: SearchSuggestion[] = [];
    const queryLower = searchTerm.toLowerCase();

    // Brand suggestions
    const brands = [
      'BMW',
      'Mercedes-Benz',
      'Audi',
      'Volkswagen',
      'Toyota',
      'Honda',
      'Nissan',
      'Ford',
      'Chevrolet',
      'Hyundai',
      'Kia',
      'Mazda',
      'Subaru',
      'Volvo',
      'Lexus',
      'Infiniti',
      'Acura',
      'Genesis',
      'Tesla',
      'Peugeot',
      'Renault',
      'Citroën',
      'Fiat',
      'Alfa Romeo',
    ];

    brands
      .filter((brand) => brand.toLowerCase().includes(queryLower))
      .slice(0, 3)
      .forEach((brand, index) => {
        suggestions.push({
          id: `brand-${brand}`,
          text: brand,
          type: 'brand',
          icon: '🚗',
          subtitle: 'Car brand',
          popularity: 95 - index * 5,
        });
      });

    // Model suggestions
    const models = [
      'BMW 3 Series',
      'Mercedes C-Class',
      'Audi A4',
      'VW Golf',
      'Toyota Camry',
      'Honda Civic',
      'Ford Focus',
      'Nissan Altima',
      'Tesla Model 3',
      'BMW X5',
      'Mercedes GLC',
      'Audi Q5',
    ];

    models
      .filter((model) => model.toLowerCase().includes(queryLower))
      .slice(0, 3)
      .forEach((model, index) => {
        suggestions.push({
          id: `model-${model}`,
          text: model,
          type: 'model',
          icon: '🚙',
          subtitle: 'Car model',
          popularity: 85 - index * 5,
        });
      });

    // Category suggestions
    const categories = [
      'SUV',
      'Sedan',
      'Hatchback',
      'Coupe',
      'Convertible',
      'Electric',
      'Hybrid',
      'Luxury',
      'Sports',
      'Family',
    ];

    categories
      .filter((cat) => cat.toLowerCase().includes(queryLower))
      .slice(0, 2)
      .forEach((category, index) => {
        suggestions.push({
          id: `category-${category}`,
          text: category,
          type: 'category',
          icon: '📋',
          subtitle: 'Car category',
          popularity: 70 - index * 5,
        });
      });

    // Add natural language search examples
    if (queryLower.length >= 3) {
      const naturalLanguageExamples = [
        'Show me reliable cars under €25k',
        'Best electric cars for families',
        'Luxury SUVs with low mileage',
        'Fuel efficient cars for city driving',
        'Sports cars similar to BMW M3',
        'Family cars with automatic transmission',
      ];

      naturalLanguageExamples
        .filter((example) => example.toLowerCase().includes(queryLower))
        .slice(0, 3)
        .forEach((example, index) => {
          suggestions.push({
            id: `natural-${index}`,
            text: example,
            type: 'natural_language',
            icon: '🤖',
            subtitle: 'AI-powered search',
            popularity: 50 - index * 5,
          });
        });
    }

    return suggestions
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 8);
  }, [searchTerm, recentSearchHistory, popularSearches]);

  const suggestions = generateSuggestions;

  if (!showSuggestions || suggestions.length === 0) {
    return null;
  }

  const renderSuggestion = ({ item }: { item: SearchSuggestion }) => (
    <TouchableOpacity
      style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
      onPress={() => onSelectSuggestion(item)}
      activeOpacity={0.7}
    >
      <View style={styles.suggestionIcon}>
        <Text style={styles.iconText}>{item.icon}</Text>
      </View>
      <View style={styles.suggestionContent}>
        <Text style={[styles.suggestionText, { color: colors.text }]}>
          {item.text}
        </Text>
        {item.subtitle && (
          <Text
            style={[styles.suggestionSubtitle, { color: colors.textSecondary }]}
          >
            {item.subtitle}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Animated.View
      style={[
        styles.suggestionsContainer,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: borderRadius.lg,
        },
        animatedStyle,
      ]}
    >
      <FlatList
        data={suggestions}
        renderItem={renderSuggestion}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        style={styles.suggestionsList}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  suggestionsContainer: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    maxHeight: 300,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 16,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  suggestionSubtitle: {
    fontSize: 12,
    opacity: 0.7,
  },
});
