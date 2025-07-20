import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { useThemeColors } from '@/hooks/useTheme';
import { Search, Mic, MicOff, Sparkles, Clock, TrendingUp, Filter } from '@/utils/ultra-optimized-icons';
import { useDebounce } from '@/hooks/useDebounce';

const { width } = Dimensions.get('window');

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'natural_language' | 'brand' | 'model' | 'location' | 'price_range' | 'recent' | 'trending';
  confidence?: number;
  icon?: React.ReactNode;
  metadata?: {
    brandCount?: number;
    avgPrice?: number;
    location?: string;
  };
}

interface AdvancedSearchInterfaceProps {
  onSearch: (query: string, type?: string) => void;
  onVoiceSearch?: (transcript: string) => void;
  placeholder?: string;
  enableVoiceSearch?: boolean;
  enableMLSuggestions?: boolean;
  showRecentSearches?: boolean;
  showTrendingSearches?: boolean;
}

export const AdvancedSearchInterface: React.FC<AdvancedSearchInterfaceProps> = ({
  onSearch,
  onVoiceSearch,
  placeholder = "Search for your perfect car...",
  enableVoiceSearch = true,
  enableMLSuggestions = true,
  showRecentSearches = true,
  showTrendingSearches = true,
}) => {
  const { colors } = useThemeColors();
  const styles = getThemedStyles(colors);

  // State
  const [searchText, setSearchText] = useState('');
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced search text
  const debouncedSearchText = useDebounce(searchText, 300);

  // Animation values
  const suggestionOpacity = useRef(new Animated.Value(0)).current;
  const voiceAnimation = useRef(new Animated.Value(1)).current;
  const sparkleAnimation = useRef(new Animated.Value(0)).current;

  // ML-powered search suggestions
  const generateMLSuggestions = useCallback(async (query: string): Promise<SearchSuggestion[]> => {
    if (!enableMLSuggestions || query.length < 2) return [];

    // Simulate ML processing
    setIsLoading(true);
    
    // Mock AI-powered suggestions based on natural language
    const suggestions: SearchSuggestion[] = [];

    // Natural language processing simulation
    if (query.toLowerCase().includes('cheap') || query.toLowerCase().includes('affordable')) {
      suggestions.push({
        id: 'nl-1',
        type: 'natural_language',
        text: 'Cars under €20,000',
        confidence: 0.95,
        icon: <Sparkles size={16} color={colors.primary} />,
        metadata: { avgPrice: 18500 }
      });
    }

    if (query.toLowerCase().includes('family') || query.toLowerCase().includes('kids')) {
      suggestions.push({
        id: 'nl-2',
        type: 'natural_language',
        text: 'Family-friendly SUVs and MPVs',
        confidence: 0.92,
        icon: <Sparkles size={16} color={colors.primary} />,
        metadata: { brandCount: 12 }
      });
    }

    if (query.toLowerCase().includes('electric') || query.toLowerCase().includes('eco')) {
      suggestions.push({
        id: 'nl-3',
        type: 'natural_language',
        text: 'Electric and hybrid vehicles',
        confidence: 0.88,
        icon: <Sparkles size={16} color={colors.success} />,
        metadata: { brandCount: 8 }
      });
    }

    // Brand suggestions
    const brands = ['BMW', 'Mercedes', 'Audi', 'Toyota', 'Honda', 'Volkswagen'];
    brands.forEach((brand, index) => {
      if (brand.toLowerCase().includes(query.toLowerCase())) {
        suggestions.push({
          id: `brand-${index}`,
          type: 'brand',
          text: brand,
          confidence: 0.85,
          metadata: { brandCount: 50 + index * 10 }
        });
      }
    });

    // Location suggestions
    if (query.toLowerCase().includes('dublin') || query.toLowerCase().includes('cork')) {
      suggestions.push({
        id: 'location-1',
        type: 'location',
        text: `Cars in ${query}`,
        confidence: 0.90,
        metadata: { location: query }
      });
    }

    setIsLoading(false);
    return suggestions.slice(0, 6); // Limit to 6 suggestions
  }, [enableMLSuggestions, colors]);

  // Get recent and trending searches
  const getContextualSuggestions = useCallback((): SearchSuggestion[] => {
    const contextual: SearchSuggestion[] = [];

    if (showRecentSearches) {
      const recent = [
        'BMW 3 Series',
        'Mercedes C-Class',
        'Electric cars under €40k'
      ];

      recent.forEach((search, index) => {
        contextual.push({
          id: `recent-${index}`,
          type: 'recent',
          text: search,
          icon: <Clock size={14} color={colors.textSecondary} />
        });
      });
    }

    if (showTrendingSearches) {
      const trending = [
        'Tesla Model 3',
        'Hybrid SUVs',
        'Luxury sedans 2024'
      ];

      trending.forEach((search, index) => {
        contextual.push({
          id: `trending-${index}`,
          type: 'trending',
          text: search,
          icon: <TrendingUp size={14} color={colors.primary} />
        });
      });
    }

    return contextual;
  }, [showRecentSearches, showTrendingSearches, colors]);

  // Update suggestions based on search text
  useEffect(() => {
    const updateSuggestions = async () => {
      if (debouncedSearchText.length === 0) {
        setSuggestions(getContextualSuggestions());
      } else {
        const mlSuggestions = await generateMLSuggestions(debouncedSearchText);
        setSuggestions(mlSuggestions);
      }
    };

    updateSuggestions();
  }, [debouncedSearchText, generateMLSuggestions, getContextualSuggestions]);

  // Animate suggestions
  useEffect(() => {
    Animated.timing(suggestionOpacity, {
      toValue: showSuggestions ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showSuggestions, suggestionOpacity]);

  // Voice search animation
  useEffect(() => {
    if (isVoiceActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(voiceAnimation, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(voiceAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      return () => pulse.stop();
    }
  }, [isVoiceActive, voiceAnimation]);

  // Sparkle animation for ML suggestions
  useEffect(() => {
    if (enableMLSuggestions && suggestions.some(s => s.type === 'natural_language')) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [suggestions, enableMLSuggestions, sparkleAnimation]);

  // Handlers
  const handleSearchSubmit = useCallback(() => {
    if (searchText.trim()) {
      onSearch(searchText.trim(), 'manual');
      setShowSuggestions(false);
    }
  }, [searchText, onSearch]);

  const handleSuggestionPress = useCallback((suggestion: SearchSuggestion) => {
    setSearchText(suggestion.text);
    onSearch(suggestion.text, suggestion.type);
    setShowSuggestions(false);
  }, [onSearch]);

  const handleVoicePress = useCallback(async () => {
    if (!enableVoiceSearch) return;

    setIsVoiceActive(!isVoiceActive);
    
    // Voice search would be implemented here with react-native-voice
    // For now, simulate voice input
    if (!isVoiceActive) {
      setTimeout(() => {
        const mockTranscript = "Show me electric cars under 30000 euros";
        setSearchText(mockTranscript);
        onVoiceSearch?.(mockTranscript);
        setIsVoiceActive(false);
      }, 2000);
    }
  }, [enableVoiceSearch, isVoiceActive, onVoiceSearch]);

  const handleFocus = useCallback(() => {
    setShowSuggestions(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Delay hiding suggestions to allow for suggestion taps
    setTimeout(() => setShowSuggestions(false), 150);
  }, []);

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.inputContainer}>
          <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
          
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={handleSearchSubmit}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* ML Indicator */}
          {enableMLSuggestions && (
            <Animated.View 
              style={[
                styles.mlIndicator,
                { opacity: sparkleAnimation }
              ]}
            >
              <Sparkles size={16} color={colors.primary} />
            </Animated.View>
          )}

          {/* Voice Search Button */}
          {enableVoiceSearch && (
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={handleVoicePress}
              activeOpacity={0.7}
            >
              <Animated.View style={{ transform: [{ scale: voiceAnimation }] }}>
                {isVoiceActive ? (
                  <MicOff size={20} color={colors.error} />
                ) : (
                  <Mic size={20} color={colors.primary} />
                )}
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Animated.View style={styles.loadingDot} />
          </View>
        )}
      </View>

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Animated.View 
          style={[
            styles.suggestionsContainer,
            { opacity: suggestionOpacity }
          ]}
        >
          <ScrollView 
            style={styles.suggestionsList}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={suggestion.id}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionPress(suggestion)}
                activeOpacity={0.7}
              >
                <View style={styles.suggestionContent}>
                  <View style={styles.suggestionLeft}>
                    {suggestion.icon && (
                      <View style={styles.suggestionIcon}>
                        {suggestion.icon}
                      </View>
                    )}
                    <Text style={styles.suggestionText}>{suggestion.text}</Text>
                  </View>

                  <View style={styles.suggestionRight}>
                    {suggestion.confidence && (
                      <Text style={styles.confidenceText}>
                        {Math.round(suggestion.confidence * 100)}%
                      </Text>
                    )}
                    {suggestion.metadata?.brandCount && (
                      <Text style={styles.metadataText}>
                        {suggestion.metadata.brandCount} cars
                      </Text>
                    )}
                  </View>
                </View>

                {suggestion.type === 'natural_language' && (
                  <View style={styles.mlBadge}>
                    <Sparkles size={12} color={colors.background} />
                    <Text style={styles.mlBadgeText}>AI</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'Roboto',
    }),
  },
  mlIndicator: {
    marginHorizontal: 8,
  },
  voiceButton: {
    padding: 4,
    marginLeft: 8,
  },
  loadingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  loadingDot: {
    width: 4,
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: colors.border,
    maxHeight: 300,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    zIndex: 1000,
  },
  suggestionsList: {
    flex: 1,
  },
  suggestionItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    position: 'relative',
  },
  suggestionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  suggestionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  suggestionIcon: {
    marginRight: 12,
    width: 20,
    alignItems: 'center',
  },
  suggestionText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  suggestionRight: {
    alignItems: 'flex-end',
  },
  confidenceText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
  },
  metadataText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  mlBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 2,
  },
  mlBadgeText: {
    fontSize: 10,
    color: colors.background,
    fontWeight: '600',
  },
});

export default AdvancedSearchInterface;
