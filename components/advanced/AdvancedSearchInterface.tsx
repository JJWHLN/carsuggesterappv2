/**
 * Advanced Search Interface Component
 * 
 * Phase 2 Week 9 - Advanced Features & Platform Expansion
 * Day 1-2 Implementation
 * 
 * Integrates:
 * - SemanticSearchEngine
 * - VoiceSearchService  
 * - PersonalizationEngine
 * - CrossPlatformOptimizationService
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SemanticSearchEngine, { SearchResponse } from '../../services/advanced/SemanticSearchEngine';
import VoiceSearchService, { VoiceSearchResult } from '../../services/advanced/VoiceSearchService';
import PersonalizationEngine, { RecommendationResponse } from '../../services/advanced/PersonalizationEngine';
import CrossPlatformOptimizationService from '../../services/advanced/CrossPlatformOptimizationService';
import { useTheme } from '../../hooks/useTheme';
import { useDebounce } from '../../hooks/useDebounce';

interface AdvancedSearchInterfaceProps {
  onSearchResults?: (results: SearchResponse) => void;
  onVoiceResults?: (results: VoiceSearchResult) => void;
  onRecommendations?: (recommendations: RecommendationResponse) => void;
  userId?: string;
  placeholder?: string;
  showVoiceSearch?: boolean;
  showRecommendations?: boolean;
  enableFilters?: boolean;
}

interface SearchSuggestion {
  text: string;
  type: 'suggestion' | 'history' | 'personalized';
  score: number;
  icon?: string;
}

interface SearchFilter {
  key: string;
  label: string;
  value: any;
  type: 'range' | 'select' | 'boolean';
  options?: Array<{ label: string; value: any }>;
}

const AdvancedSearchInterface: React.FC<AdvancedSearchInterfaceProps> = ({
  onSearchResults,
  onVoiceResults,
  onRecommendations,
  userId = 'guest',
  placeholder = 'Search for your perfect car...',
  showVoiceSearch = true,
  showRecommendations = true,
  enableFilters = true,
}) => {
  // Services
  const semanticSearch = SemanticSearchEngine.getInstance();
  const voiceSearch = VoiceSearchService.getInstance();
  const personalization = PersonalizationEngine.getInstance();
  const platformOptimization = CrossPlatformOptimizationService.getInstance();
  
  // Theme and platform
  const { colors, isDark } = useTheme();
  const platformCapabilities = platformOptimization.getPlatformCapabilities();
  const adaptiveUI = platformOptimization.getAdaptiveUI();
  
  // State
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [filters, setFilters] = useState<SearchFilter[]>([]);
  const [showFilters, setShowFiltersModal] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  
  // Refs
  const searchInputRef = useRef<TextInput>(null);
  const suggestionOpacity = useRef(new Animated.Value(0)).current;
  const voicePulse = useRef(new Animated.Value(1)).current;
  
  // Debounced search
  const debouncedQuery = useDebounce(query, 300);
  
  // Initialize component
  useEffect(() => {
    initializeAdvancedSearch();
  }, []);
  
  // Handle query changes
  useEffect(() => {
    if (debouncedQuery.trim().length > 2) {
      handleSearchSuggestions(debouncedQuery);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [debouncedQuery]);
  
  // Check voice availability
  useEffect(() => {
    checkVoiceAvailability();
  }, []);
  
  /**
   * Initialize advanced search features
   */
  const initializeAdvancedSearch = async () => {
    try {
      // Initialize search filters
      const defaultFilters: SearchFilter[] = [
        {
          key: 'priceRange',
          label: 'Price Range',
          value: [0, 100000],
          type: 'range',
        },
        {
          key: 'vehicleType',
          label: 'Vehicle Type',
          value: 'all',
          type: 'select',
          options: [
            { label: 'All Types', value: 'all' },
            { label: 'Sedan', value: 'sedan' },
            { label: 'SUV', value: 'suv' },
            { label: 'Truck', value: 'truck' },
            { label: 'Coupe', value: 'coupe' },
            { label: 'Convertible', value: 'convertible' },
          ],
        },
        {
          key: 'fuelType',
          label: 'Fuel Type',
          value: 'all',
          type: 'select',
          options: [
            { label: 'All Types', value: 'all' },
            { label: 'Gasoline', value: 'gasoline' },
            { label: 'Hybrid', value: 'hybrid' },
            { label: 'Electric', value: 'electric' },
            { label: 'Diesel', value: 'diesel' },
          ],
        },
        {
          key: 'newUsed',
          label: 'Condition',
          value: 'all',
          type: 'select',
          options: [
            { label: 'All', value: 'all' },
            { label: 'New', value: 'new' },
            { label: 'Used', value: 'used' },
            { label: 'Certified', value: 'certified' },
          ],
        },
      ];
      
      setFilters(defaultFilters);
      
      // Load personalized recommendations if enabled
      if (showRecommendations && userId !== 'guest') {
        await loadPersonalizedRecommendations();
      }
      
    } catch (error) {
      console.error('Advanced search initialization error:', error);
    }
  };
  
  /**
   * Check voice search availability
   */
  const checkVoiceAvailability = async () => {
    try {
      const isAvailable = voiceSearch.isVoiceSearchAvailable();
      setVoiceEnabled(isAvailable && showVoiceSearch);
    } catch (error) {
      console.error('Voice availability check error:', error);
      setVoiceEnabled(false);
    }
  };
  
  /**
   * Handle search suggestions
   */
  const handleSearchSuggestions = async (searchQuery: string) => {
    try {
      // Get personalized suggestions
      const personalizedSuggestions = await personalization.getPersonalizedSearchSuggestions(
        userId,
        searchQuery,
        5
      );
      
      // Get semantic suggestions (mock implementation since method doesn't exist)
      const semanticSuggestions = [
        `${searchQuery} cars`,
        `${searchQuery} vehicles`,
        `${searchQuery} automotive`,
        `best ${searchQuery}`,
        `affordable ${searchQuery}`,
      ];
      
      // Combine and format suggestions
      const allSuggestions: SearchSuggestion[] = [
        ...personalizedSuggestions.map(s => ({
          text: s.suggestion,
          type: 'personalized' as const,
          score: s.score,
          icon: 'person',
        })),
        ...semanticSuggestions.slice(0, 5).map(s => ({
          text: s,
          type: 'suggestion' as const,
          score: 0.8,
          icon: 'search',
        })),
      ];
      
      // Sort by score and remove duplicates
      const uniqueSuggestions = allSuggestions
        .filter((suggestion, index, self) => 
          self.findIndex(s => s.text.toLowerCase() === suggestion.text.toLowerCase()) === index
        )
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
      
      setSuggestions(uniqueSuggestions);
      setShowSuggestions(uniqueSuggestions.length > 0);
      
      // Animate suggestions
      Animated.timing(suggestionOpacity, {
        toValue: uniqueSuggestions.length > 0 ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
      
    } catch (error) {
      console.error('Search suggestions error:', error);
    }
  };
  
  /**
   * Handle text search
   */
  const handleSearch = async (searchQuery?: string) => {
    const finalQuery = searchQuery || query.trim();
    
    if (!finalQuery) return;
    
    try {
      setIsSearching(true);
      setShowSuggestions(false);
      
      // Track search interaction
      await personalization.trackInteraction(userId, 'search', {
        query: finalQuery,
        timestamp: new Date(),
        context: 'advanced_search',
      });
      
      // Perform semantic search
      const results = await semanticSearch.search(finalQuery, {
        sessionId: `advanced_${userId}_${Date.now()}`,
        userId,
      });
      
      setSearchResults(results);
      
      if (onSearchResults) {
        onSearchResults(results);
      }
      
      // Clear input focus on mobile
      if (searchInputRef.current && Platform.OS !== ('web' as any)) {
        searchInputRef.current.blur();
      }
      
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Search Error', 'Unable to perform search. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };
  
  /**
   * Handle voice search
   */
  const handleVoiceSearch = async () => {
    if (!voiceEnabled) {
      Alert.alert('Voice Search', 'Voice search is not available on this device.');
      return;
    }
    
    try {
      setIsListening(true);
      
      // Start voice pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(voicePulse, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(voicePulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Start listening
      await voiceSearch.startListening(
        async (result: VoiceSearchResult) => {
          setIsListening(false);
          voicePulse.stopAnimation();
          voicePulse.setValue(1);
          
          if (result.transcript) {
            setQuery(result.transcript);
            
            // Perform search with voice result
            if (result.searchResults) {
              setSearchResults(result.searchResults);
              if (onSearchResults) {
                onSearchResults(result.searchResults);
              }
            } else {
              await handleSearch(result.transcript);
            }
            
            if (onVoiceResults) {
              onVoiceResults(result);
            }
            
            // Provide voice feedback
            await voiceSearch.provideFeedback(
              `Found ${result.searchResults?.results.length || 0} results for ${result.transcript}`
            );
          }
        },
        (error: Error) => {
          setIsListening(false);
          voicePulse.stopAnimation();
          voicePulse.setValue(1);
          console.error('Voice search error:', error);
          Alert.alert('Voice Search Error', error.message);
        }
      );
      
      // Auto-stop after 10 seconds
      setTimeout(async () => {
        if (isListening) {
          await voiceSearch.stopListening();
          setIsListening(false);
          voicePulse.stopAnimation();
          voicePulse.setValue(1);
        }
      }, 10000);
      
    } catch (error) {
      setIsListening(false);
      voicePulse.stopAnimation();
      voicePulse.setValue(1);
      console.error('Voice search error:', error);
      Alert.alert('Voice Search Error', 'Unable to start voice search.');
    }
  };
  
  /**
   * Stop voice search
   */
  const stopVoiceSearch = async () => {
    try {
      await voiceSearch.stopListening();
      setIsListening(false);
      voicePulse.stopAnimation();
      voicePulse.setValue(1);
    } catch (error) {
      console.error('Stop voice search error:', error);
    }
  };
  
  /**
   * Load personalized recommendations
   */
  const loadPersonalizedRecommendations = async () => {
    try {
      const recs = await personalization.getRecommendations({
        userId,
        context: 'search_interface',
        limit: 10,
        includeExplanations: true,
        diversityFactor: 0.7,
      });
      
      setRecommendations(recs);
      
      if (onRecommendations) {
        onRecommendations(recs);
      }
      
    } catch (error) {
      console.error('Recommendations loading error:', error);
    }
  };
  
  /**
   * Handle suggestion selection
   */
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    handleSearch(suggestion.text);
  };
  
  /**
   * Get active filters
   */
  const getActiveFilters = () => {
    const activeFilters: Record<string, any> = {};
    filters.forEach(filter => {
      if (filter.value !== 'all' && filter.value !== null && filter.value !== undefined) {
        activeFilters[filter.key] = filter.value;
      }
    });
    return activeFilters;
  };
  
  /**
   * Update filter value
   */
  const updateFilter = (key: string, value: any) => {
    setFilters(prev => prev.map(filter => 
      filter.key === key ? { ...filter, value } : filter
    ));
  };
  
  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters(prev => prev.map(filter => ({
      ...filter,
      value: filter.type === 'range' ? [0, 100000] : 'all',
    })));
  };
  
  // Get platform-optimized styles
  const styles = getStyles(colors, adaptiveUI);
  
  return (
    <View style={styles.container}>
      {/* Search Input Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <Ionicons 
            name="search" 
            size={adaptiveUI.components.fontSize.medium + 4} 
            color={colors.textMuted} 
            style={styles.searchIcon} 
          />
          
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder={placeholder}
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          
          {query.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setQuery('');
                setSuggestions([]);
                setShowSuggestions(false);
              }}
            >
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          )}
          
          {voiceEnabled && (
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={isListening ? stopVoiceSearch : handleVoiceSearch}
              disabled={isSearching}
            >
              <Animated.View style={[styles.voiceButtonInner, { transform: [{ scale: voicePulse }] }]}>
                <Ionicons 
                  name={isListening ? "stop" : "mic"} 
                  size={adaptiveUI.components.fontSize.medium + 2} 
                  color={isListening ? colors.error : colors.primary} 
                />
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Filter Toggle */}
        {enableFilters && (
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFiltersModal(!showFilters)}
          >
            <Ionicons name="filter" size={20} color={colors.primary} />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Animated.View style={[styles.suggestionsContainer, { opacity: suggestionOpacity }]}>
          <ScrollView style={styles.suggestionsList} keyboardShouldPersistTaps="handled">
            {suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionItem}
                onPress={() => handleSuggestionSelect(suggestion)}
              >
                <Ionicons 
                  name={suggestion.icon as any || 'search'} 
                  size={16} 
                  color={suggestion.type === 'personalized' ? colors.primary : colors.textMuted} 
                />
                <Text style={styles.suggestionText}>{suggestion.text}</Text>
                {suggestion.type === 'personalized' && (
                  <View style={styles.personalizedBadge}>
                    <Text style={styles.personalizedBadgeText}>FOR YOU</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}
      
      {/* Search Status */}
      {isSearching && (
        <View style={styles.searchStatus}>
          <Text style={styles.searchStatusText}>
            Searching with AI-powered semantic understanding...
          </Text>
        </View>
      )}
      
      {isListening && (
        <View style={styles.voiceStatus}>
          <Text style={styles.voiceStatusText}>
            🎤 Listening... Speak now or tap to stop
          </Text>
        </View>
      )}
    </View>
  );
};

/**
 * Get platform-optimized styles
 */
const getStyles = (colors: any, adaptiveUI: any) => {
  const { width } = Dimensions.get('window');
  const isTablet = width > 768;
  
  return StyleSheet.create({
    container: {
      backgroundColor: colors.background,
    },
    searchSection: {
      paddingHorizontal: adaptiveUI.layout.gridSystem.margins,
      paddingVertical: adaptiveUI.components.spacing.medium,
    },
    searchInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: adaptiveUI.components.touchTargetSize / 2,
      paddingHorizontal: adaptiveUI.components.spacing.medium,
      paddingVertical: Platform.OS === 'ios' ? 12 : 8,
      marginBottom: adaptiveUI.components.spacing.small,
      ...Platform.select({
        ios: {
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 2,
        },
        default: {
          borderWidth: 1,
          borderColor: colors.border,
        },
      }),
    },
    searchIcon: {
      marginRight: adaptiveUI.components.spacing.small,
    },
    searchInput: {
      flex: 1,
      fontSize: adaptiveUI.components.fontSize.medium,
      color: colors.text,
      paddingVertical: 0,
    },
    clearButton: {
      padding: adaptiveUI.components.spacing.small / 2,
      marginLeft: adaptiveUI.components.spacing.small,
    },
    voiceButton: {
      marginLeft: adaptiveUI.components.spacing.small,
    },
    voiceButtonInner: {
      width: adaptiveUI.components.touchTargetSize,
      height: adaptiveUI.components.touchTargetSize,
      borderRadius: adaptiveUI.components.touchTargetSize / 2,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      paddingHorizontal: adaptiveUI.components.spacing.medium,
      paddingVertical: adaptiveUI.components.spacing.small,
      borderRadius: 20,
      alignSelf: 'flex-start',
    },
    filterButtonText: {
      marginLeft: adaptiveUI.components.spacing.small / 2,
      fontSize: adaptiveUI.components.fontSize.small,
      color: colors.primary,
      fontWeight: '500',
    },
    suggestionsContainer: {
      backgroundColor: colors.surface,
      marginHorizontal: adaptiveUI.layout.gridSystem.margins,
      borderRadius: 8,
      maxHeight: 300,
      ...Platform.select({
        ios: {
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
        default: {
          borderWidth: 1,
          borderColor: colors.border,
        },
      }),
    },
    suggestionsList: {
      flex: 1,
    },
    suggestionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: adaptiveUI.components.spacing.medium,
      paddingVertical: adaptiveUI.components.spacing.medium,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    suggestionText: {
      flex: 1,
      marginLeft: adaptiveUI.components.spacing.small,
      fontSize: adaptiveUI.components.fontSize.medium,
      color: colors.text,
    },
    personalizedBadge: {
      backgroundColor: colors.primary,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
    },
    personalizedBadgeText: {
      fontSize: 10,
      color: colors.white,
      fontWeight: 'bold',
    },
    searchStatus: {
      paddingHorizontal: adaptiveUI.layout.gridSystem.margins,
      paddingVertical: adaptiveUI.components.spacing.small,
      backgroundColor: colors.primary,
      borderRadius: 8,
      marginHorizontal: adaptiveUI.layout.gridSystem.margins,
    },
    searchStatusText: {
      fontSize: adaptiveUI.components.fontSize.small,
      color: colors.white,
      textAlign: 'center',
    },
    voiceStatus: {
      paddingHorizontal: adaptiveUI.layout.gridSystem.margins,
      paddingVertical: adaptiveUI.components.spacing.small,
      backgroundColor: colors.success,
      borderRadius: 8,
      marginHorizontal: adaptiveUI.layout.gridSystem.margins,
    },
    voiceStatusText: {
      fontSize: adaptiveUI.components.fontSize.small,
      color: colors.white,
      textAlign: 'center',
    },
  });
};

export default AdvancedSearchInterface;
