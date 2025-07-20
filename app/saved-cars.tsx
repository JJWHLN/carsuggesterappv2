import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { LinearGradient } from 'expo-linear-gradient';
import { CarCard } from '@/components/CarCard';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/useTheme';
import { Car as CarType } from '@/types/database';
import { fetchSavedCars, removeSavedCar } from '@/services/supabaseService';
import { transformDatabaseVehicleListingToCar } from '@/utils/dataTransformers';
import * as Haptics from 'expo-haptics';
import { Heart, Car, ArrowLeft, Filter } from '@/utils/ultra-optimized-icons';

function SavedCarsScreen() {
  const { user } = useAuth();
  const { colors } = useThemeColors();
  const styles = useMemo(() => getThemedStyles(colors), [colors]);

  const [savedCars, setSavedCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCars, setSelectedCars] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  const loadSavedCars = useCallback(async (isRefresh = false) => {
    if (!user) {
      setError('Please sign in to view saved cars');
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await fetchSavedCars(user.id);
      if (data) {
        const transformedCars = data.map((item: any) => transformDatabaseVehicleListingToCar(item.vehicle_listing));
        setSavedCars(transformedCars);
      }
    } catch (err) {
      logger.error('Error loading saved cars:', err);
      setError('Failed to load saved cars');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadSavedCars();
  }, [loadSavedCars]);

  const handleRemoveCar = useCallback(async (carId: string) => {
    if (!user) return;

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      Alert.alert(
        'Remove Car',
        'Are you sure you want to remove this car from your saved list?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                await removeSavedCar(user.id, carId);
                setSavedCars(prev => prev.filter(car => car.id !== carId));
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (error) {
                logger.error('Error removing saved car:', error);
                Alert.alert('Error', 'Failed to remove car');
              }
            },
          },
        ]
      );
    } catch (error) {
      logger.error('Error removing car:', error);
    }
  }, [user]);

  const handleSelectCar = useCallback((carId: string) => {
    setSelectedCars(prev => {
      const newSet = new Set(prev);
      if (newSet.has(carId)) {
        newSet.delete(carId);
      } else {
        newSet.add(carId);
      }
      return newSet;
    });
  }, []);

  const handleRemoveSelected = useCallback(async () => {
    if (!user || selectedCars.size === 0) return;

    Alert.alert(
      'Remove Cars',
      `Are you sure you want to remove ${selectedCars.size} car(s) from your saved list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const promises = Array.from(selectedCars).map(carId => 
                removeSavedCar(user.id, carId)
              );
              await Promise.all(promises);
              
              setSavedCars(prev => prev.filter(car => !selectedCars.has(car.id)));
              setSelectedCars(new Set());
              setSelectionMode(false);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              logger.error('Error removing cars:', error);
              Alert.alert('Error', 'Failed to remove some cars');
            }
          },
        },
      ]
    );
  }, [user, selectedCars]);

  const handleCarPress = useCallback((car: CarType) => {
    if (selectionMode) {
      handleSelectCar(car.id);
    } else {
      router.push(`/car/${car.id}`);
    }
  }, [selectionMode, handleSelectCar]);

  const renderCarItem = useCallback(({ item }: { item: CarType }) => (
    <View style={styles.carItemContainer}>
      <TouchableOpacity
        style={[
          styles.carItem,
          selectionMode && selectedCars.has(item.id) && styles.selectedCarItem
        ]}
        onPress={() => handleCarPress(item)}
        onLongPress={() => {
          setSelectionMode(true);
          handleSelectCar(item.id);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
      >
        <CarCard 
          car={item} 
          onPress={() => handleCarPress(item)}
          showSaveButton={false}
        />
        {selectionMode && (
          <View style={[
            styles.selectionIndicator,
            selectedCars.has(item.id) && styles.selectedIndicator
          ]} />
        )}
      </TouchableOpacity>
      {!selectionMode && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveCar(item.id)}
        >
          <Trash2 color={colors.error} size={20} />
        </TouchableOpacity>
      )}
    </View>
  ), [
    styles, 
    selectionMode, 
    selectedCars, 
    handleCarPress, 
    handleSelectCar, 
    handleRemoveCar, 
    colors.error
  ]);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <ArrowLeft color={colors.text} size={24} />
      </TouchableOpacity>
      
      <View style={styles.headerContent}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Saved Cars
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          {savedCars.length} {savedCars.length === 1 ? 'car' : 'cars'} saved
        </Text>
      </View>

      {savedCars.length > 0 && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setSelectionMode(!selectionMode)}
        >
          <Text style={[styles.actionButtonText, { color: colors.primary }]}>
            {selectionMode ? 'Done' : 'Select'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <EmptyState
          title="Sign In Required"
          subtitle="Please sign in to view your saved cars"
          action={
            <Button
              title="Sign In"
              onPress={() => router.push('/auth/sign-in')}
            />
          }
        />
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <LoadingState message="Loading your saved cars..." />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <ErrorState
          title="Failed to Load Cars"
          message={error}
          onRetry={() => loadSavedCars()}
        />
      </SafeAreaView>
    );
  }

  if (savedCars.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <EmptyState
          title="No Saved Cars"
          subtitle="Start exploring and save cars you're interested in!"
          icon={<Heart color={colors.textMuted} size={48} />}
          action={
            <Button
              title="Browse Cars"
              onPress={() => router.push('/marketplace')}
            />
          }
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      
      {selectionMode && (
        <View style={[styles.selectionBar, { backgroundColor: colors.cardBackground }]}>
          <Text style={[styles.selectionText, { color: colors.text }]}>
            {selectedCars.size} selected
          </Text>
          <Button
            title="Remove Selected"
            onPress={handleRemoveSelected}
            variant="danger"
            size="small"
            disabled={selectedCars.size === 0}
          />
        </View>
      )}

      <FlatList
        data={savedCars}
        renderItem={renderCarItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadSavedCars(true)}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const getThemedStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.cardBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    padding: 20,
  },
  carItemContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  carItem: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedCarItem: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  selectionIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  selectedIndicator: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default function WrappedSavedCarsScreen() {
  return (
    <ErrorBoundary>
      <SavedCarsScreen />
    </ErrorBoundary>
  );
}
