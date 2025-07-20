import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@/components/ui/Button';
import { SearchBar } from '@/components/ui/SearchBar';
import { ModernCarCard } from '@/components/ModernCarCard';
import { useThemeColors } from '@/hooks/useTheme';
import { Car } from '@/types/database';
import { Search, Filter, MapPin, List, Settings } from '@/utils/ultra-optimized-icons';

const { width, height } = Dimensions.get('window');

interface ZillowStyleSearchProps {
  cars: Car[];
  onSearch: (query: string) => void;
  onFilterPress: () => void;
  loading?: boolean;
}

const ZillowStyleSearch: React.FC<ZillowStyleSearchProps> = ({
  cars,
  onSearch,
  onFilterPress,
  loading = false,
}) => {
  const { colors } = useThemeColors();
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const styles = useMemo(() => getThemedStyles(colors), [colors]);
  
  const slideAnim = useRef(new Animated.Value(0)).current;

  const handleSearchSubmit = useCallback(() => {
    onSearch(searchQuery);
  }, [searchQuery, onSearch]);

  const toggleFilters = useCallback(() => {
    const toValue = showFilters ? 0 : 1;
    setShowFilters(!showFilters);
    
    Animated.spring(slideAnim, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  }, [showFilters, slideAnim]);

  const quickFilters = [
    { id: '1', label: 'Under $30k', active: false },
    { id: '2', label: 'Electric', active: true },
    { id: '3', label: 'Low Mileage', active: false },
    { id: '4', label: 'Certified', active: false },
    { id: '5', label: 'Near Me', active: false },
  ];

  const priceRanges = [
    'Under $20k',
    '$20k - $35k',
    '$35k - $50k',
    '$50k - $75k',
    '$75k+',
  ];

  const carTypes = [
    'Sedan',
    'SUV',
    'Hatchback',
    'Coupe',
    'Truck',
    'Convertible',
  ];

  return (
    <View style={styles.container}>
      {/* Zillow-style sticky search header */}
      <View style={[styles.searchHeader, { backgroundColor: colors.background }]}>
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search cars, brands, or features..."
            onSubmit={handleSearchSubmit}
            containerStyle={styles.searchBar}
          />
          
          <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: colors.primary }]}
            onPress={toggleFilters}
          >
            <Settings color={colors.white} size={20} />
          </TouchableOpacity>
        </View>

        {/* Quick filters row (Instagram-style stories) */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickFiltersContainer}
        >
          {quickFilters.map((filter) => (
            <TouchableOpacity
              key={filter.id}
              style={[
                styles.quickFilterChip,
                filter.active 
                  ? { backgroundColor: colors.primary }
                  : { backgroundColor: colors.cardBackground, borderColor: colors.border }
              ]}
            >
              <Text
                style={[
                  styles.quickFilterText,
                  { color: filter.active ? colors.white : colors.text }
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* View toggle (List/Map like Zillow) */}
        <View style={styles.viewToggle}>
          <View style={[styles.toggleContainer, { backgroundColor: colors.cardBackground }]}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'list' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setViewMode('list')}
            >
              <List color={viewMode === 'list' ? colors.white : colors.text} size={18} />
              <Text
                style={[
                  styles.toggleText,
                  { color: viewMode === 'list' ? colors.white : colors.text }
                ]}
              >
                List
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'map' && { backgroundColor: colors.primary }
              ]}
              onPress={() => setViewMode('map')}
            >
              <MapPin color={viewMode === 'map' ? colors.white : colors.text} size={18} />
              <Text
                style={[
                  styles.toggleText,
                  { color: viewMode === 'map' ? colors.white : colors.text }
                ]}
              >
                Map
              </Text>
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
            {cars.length} cars found
          </Text>
        </View>
      </View>

      {/* Advanced Filters Panel (slide from top like TikTok) */}
      <Animated.View
        style={[
          styles.filtersPanel,
          {
            backgroundColor: colors.cardBackground,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-300, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.filtersPanelHeader}>
          <Text style={[styles.filtersPanelTitle, { color: colors.text }]}>
            Advanced Filters
          </Text>
          <TouchableOpacity onPress={toggleFilters}>
            <Text style={[styles.doneText, { color: colors.primary }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.filtersContent}>
          {/* Price Range */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
              Price Range
            </Text>
            <View style={styles.filterOptionsGrid}>
              {priceRanges.map((range, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.filterOption,
                    { backgroundColor: colors.background, borderColor: colors.border }
                  ]}
                >
                  <Text style={[styles.filterOptionText, { color: colors.text }]}>
                    {range}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Vehicle Type */}
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
              Vehicle Type
            </Text>
            <View style={styles.filterOptionsGrid}>
              {carTypes.map((type, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.filterOption,
                    { backgroundColor: colors.background, borderColor: colors.border }
                  ]}
                >
                  <Text style={[styles.filterOptionText, { color: colors.text }]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Results content */}
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {viewMode === 'list' ? (
          // Instagram-style vertical feed
          <View style={styles.listView}>
            {cars.map((car) => (
              <ModernCarCard
                key={car.id}
                car={car}
                onPress={() => {
                  // Navigate to car detail
                }}
                showSaveButton={true}
                style={styles.carCard}
              />
            ))}
          </View>
        ) : (
          // Map view placeholder (would integrate with actual map)
          <View style={styles.mapView}>
            <View style={[styles.mapPlaceholder, { backgroundColor: colors.cardBackground }]}>
              <MapPin color={colors.textSecondary} size={48} />
              <Text style={[styles.mapPlaceholderText, { color: colors.textSecondary }]}>
                Map view coming soon
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchHeader: {
    paddingTop: 8,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickFiltersContainer: {
    paddingRight: 20,
    gap: 8,
    marginBottom: 16,
  },
  quickFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickFilterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  filtersPanel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    zIndex: 20,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  filtersPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filtersPanelTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filtersContent: {
    flex: 1,
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  resultsContainer: {
    flex: 1,
  },
  listView: {
    paddingBottom: 100,
  },
  carCard: {
    marginBottom: 0, // ModernCarCard has its own margins
  },
  mapView: {
    flex: 1,
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    borderRadius: 16,
    minHeight: 400,
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
});

export { ZillowStyleSearch };
