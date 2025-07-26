import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { UnifiedSearchComponent as SearchBar } from '@/components/ui/unified';
import { Button } from '@/components/ui/Button';
import { UnifiedCarCard as CarCard } from '@/components/ui/unified';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useThemeColors } from '@/hooks/useTheme';
import { useDebounce } from '@/hooks/useDebounce';
import { Car, Filter, X } from '@/utils/ultra-optimized-icons';
import { fetchVehicleListings } from '@/services/supabaseService';
import { transformDatabaseVehicleListingToCar } from '@/utils/dataTransformers';
import { Car as CarType } from '@/types/database';

interface SearchFilters {
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
  make?: string;
  fuelType?: string;
}

export default function SearchScreen() {
  const { colors } = useThemeColors();
  const [searchTerm, setSearchTerm] = useState('');
  const [cars, setCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Simple search implementation
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setCars([]);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchVehicleListings(0, 20, query);

      const transformedCars = Array.isArray(data)
        ? data.map(transformDatabaseVehicleListingToCar)
        : [];

      setCars(transformedCars);
    } catch (error) {
      console.error('Search error:', error);
      setCars([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger search when debounced term changes
  React.useEffect(() => {
    handleSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm, handleSearch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await handleSearch(searchTerm);
    setRefreshing(false);
  }, [searchTerm, handleSearch]);

  const handleCarPress = useCallback((carId: string) => {
    router.push(`/car/${carId}`);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(
      (value) => value !== undefined && value !== '',
    );
  }, [filters]);

  const clearFilters = useCallback(() => {
    setFilters({});
    handleSearch(searchTerm);
  }, [searchTerm]);

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[styles.filterModal, { backgroundColor: colors.background }]}
        >
          <View style={styles.filterHeader}>
            <Text style={[styles.filterTitle, { color: colors.text }]}>
              Search Filters
            </Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <X color={colors.textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterContent}>
            <Text style={[styles.comingSoon, { color: colors.textSecondary }]}>
              🚧 Advanced filters coming soon!
            </Text>
            <Text
              style={[styles.comingSoonDesc, { color: colors.textSecondary }]}
            >
              Price range, year, make, fuel type, and location filters will be
              available in the next update.
            </Text>
          </View>

          <View style={styles.filterActions}>
            {hasActiveFilters && (
              <Button
                title="Clear All"
                variant="outline"
                onPress={clearFilters}
                style={styles.clearButton}
              />
            )}
            <Button
              title="Close"
              onPress={() => setShowFilters(false)}
              style={styles.applyButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderCar = useCallback(
    ({ item }: { item: CarType }) => (
      <CarCard car={item} onPress={() => handleCarPress(item.id)} />
    ),
    [handleCarPress],
  );

  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Search Header */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <SearchBar
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholder="Search cars, makes, models..."
            containerStyle={styles.searchBar}
          />
          <TouchableOpacity
            style={[styles.filterButton, { borderColor: colors.border }]}
            onPress={() => setShowFilters(true)}
          >
            <Filter
              color={hasActiveFilters ? colors.primary : colors.textSecondary}
              size={20}
            />
          </TouchableOpacity>
        </View>
        {hasActiveFilters && (
          <TouchableOpacity
            onPress={clearFilters}
            style={styles.clearFiltersButton}
          >
            <Text style={[styles.clearFiltersText, { color: colors.primary }]}>
              Clear filters
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      <View style={styles.content}>
        {loading && !refreshing ? (
          <LoadingState />
        ) : cars.length === 0 && searchTerm.trim() ? (
          <EmptyState
            title="No cars found"
            subtitle={`No results for "${searchTerm}"`}
            icon={<Car color={colors.textSecondary} size={48} />}
          />
        ) : cars.length === 0 ? (
          <EmptyState
            title="Start searching"
            subtitle="Enter a car make, model, or keyword above"
            icon={<Car color={colors.textSecondary} size={48} />}
          />
        ) : (
          <FlatList
            data={cars}
            renderItem={renderCar}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resultsList}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>

      {/* Render Filter Modal */}
      {renderFilterModal()}
    </SafeAreaView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    searchBar: {
      flex: 1,
      marginHorizontal: 0,
    },
    filterButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    clearFiltersButton: {
      paddingTop: 8,
      alignSelf: 'flex-start',
    },
    clearFiltersText: {
      fontSize: 14,
      fontWeight: '500',
    },
    content: {
      flex: 1,
    },
    resultsList: {
      padding: 16,
      gap: 12,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    filterModal: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
    },
    filterHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    filterTitle: {
      fontSize: 18,
      fontWeight: '600',
    },
    filterContent: {
      padding: 20,
      alignItems: 'center',
      minHeight: 150,
      justifyContent: 'center',
    },
    comingSoon: {
      fontSize: 24,
      marginBottom: 12,
    },
    comingSoonDesc: {
      fontSize: 16,
      textAlign: 'center',
      lineHeight: 22,
    },
    filterActions: {
      flexDirection: 'row',
      padding: 20,
      gap: 12,
    },
    clearButton: {
      flex: 1,
    },
    applyButton: {
      flex: 1,
    },
  });
