/**
 * Unified Marketplace Screen - Phase 3
 * Consolidates design patterns and reduces redundancy using unified components
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ListRenderItem,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Filter, Car, Users, Shield } from '@/utils/icons';
import { SearchBar } from '@/components/ui/SearchBar';
import { CarCard } from '@/components/CarCard';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { UnifiedScreenState } from '@/components/ui/UnifiedScreenState';
import { useDesignTokens } from '@/hooks/useConsolidatedDesign';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchVehicleListings } from '@/services/supabaseService';
import { transformDatabaseVehicleListingToCar } from '@/utils/dataTransformers';
import { Car as CarType } from '@/types/database';

function MarketplaceScreen() {
  const { colors } = useDesignTokens();
  
  // Local state (consolidated)
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cars, setCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Load cars function
  const loadCars = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
        setError(null);
      } else {
        setLoading(true);
      }
      
      const data = await fetchVehicleListings(0, 20, debouncedSearchQuery);
      if (Array.isArray(data)) {
        const transformedCars = data.map(transformDatabaseVehicleListingToCar);
        setCars(transformedCars);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cars');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearchQuery]);
  
  // Load initial data
  useEffect(() => {
    loadCars();
  }, [loadCars]);
  
  // Styles
  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 16,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    heroTitle: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: colors.text,
      marginBottom: 8,
    },
    heroSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 20,
    },
    statsContainer: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
      marginBottom: 16,
    },
    statCard: {
      alignItems: 'center' as const,
      padding: 12,
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      minWidth: 80,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.text,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    controlsContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      padding: 16,
    },
    filterButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.cardBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterButtonText: {
      marginLeft: 8,
      color: colors.text,
    },
    viewModeContainer: {
      flexDirection: 'row' as const,
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      padding: 2,
    },
    viewModeButton: {
      padding: 8,
      borderRadius: 6,
    },
    viewModeButtonActive: {
      backgroundColor: colors.primary,
    },
    listContainer: {
      flex: 1,
    },
    gridItem: {
      flex: 1,
      margin: 8,
    },
    listItem: {
      marginHorizontal: 16,
      marginBottom: 16,
    },
    carCard: {
      width: '100%' as const,
    },
  }), [colors]);
  
  // Event handlers
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);
  
  const handleCarPress = useCallback((carId: string) => {
    console.log('Navigate to car details:', carId);
    // TODO: Add navigation logic
  }, []);
  
  const handleRefresh = useCallback(async () => {
    await loadCars(true);
  }, [loadCars]);
  
  const handleLoadMore = useCallback(() => {
    if (hasMore && !loading) {
      // TODO: Implement load more logic
    }
  }, [hasMore, loading]);
  
  // Render functions
  const renderStats = () => {
    const stats = [
      { icon: <Car color={colors.primary} size={24} />, value: Array.isArray(cars) ? cars.length.toString() : "0", label: "Cars Available" },
      { icon: <Users color={colors.accentGreen} size={24} />, value: "89", label: "Verified Dealers" },
      { icon: <Shield color={colors.primary} size={24} />, value: "100%", label: "Verified Listings" },
    ];
    
    return (
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            {stat.icon}
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    );
  };
  
  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.heroTitle}>Car Marketplace</Text>
      <Text style={styles.heroSubtitle}>
        Discover your perfect car from verified dealers
      </Text>
      {renderStats()}
    </View>
  );
  
  const renderControls = () => (
    <View style={styles.controlsContainer}>
      <TouchableOpacity style={styles.filterButton}>
        <Filter color={colors.primary} size={18} />
        <Text style={styles.filterButtonText}>Filters</Text>
      </TouchableOpacity>
      
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'grid' && styles.viewModeButtonActive
          ]}
          onPress={() => setViewMode('grid')}
        >
          <Text style={{ color: viewMode === 'grid' ? colors.white : colors.text }}>Grid</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.viewModeButton,
            viewMode === 'list' && styles.viewModeButtonActive
          ]}
          onPress={() => setViewMode('list')}
        >
          <Text style={{ color: viewMode === 'list' ? colors.white : colors.text }}>List</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderCar: ListRenderItem<CarType> = ({ item }) => (
    <View style={viewMode === 'grid' ? styles.gridItem : styles.listItem}>
      <CarCard
        car={item}
        onPress={() => handleCarPress(item.id)}
      />
    </View>
  );
  
  const renderListHeader = () => (
    <>
      {renderHeader()}
      <SearchBar
        placeholder="Search cars..."
        value={searchQuery}
        onChangeText={handleSearchChange}
        onClear={() => handleSearchChange('')}
      />
      {renderControls()}
    </>
  );
  
  // Main render using unified screen state
  return (
    <ErrorBoundary>
      <UnifiedScreenState
        loading={loading}
        error={error}
        data={cars}
        loadingText="Loading marketplace..."
        errorTitle="Unable to Load Marketplace"
        emptyTitle="No cars found"
        emptySubtitle="Try adjusting your search or filters"
        onRetry={handleRefresh}
        style={styles.container}
      >
        <SafeAreaView style={styles.container}>
          <FlatList<CarType>
            data={Array.isArray(cars) ? cars : []}
            renderItem={renderCar}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={renderListHeader}
            numColumns={viewMode === 'grid' ? 2 : 1}
            key={viewMode}
            contentContainerStyle={styles.listContainer}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            showsVerticalScrollIndicator={false}
          />
        </SafeAreaView>
      </UnifiedScreenState>
    </ErrorBoundary>
  );
}

export default React.memo(MarketplaceScreen);
