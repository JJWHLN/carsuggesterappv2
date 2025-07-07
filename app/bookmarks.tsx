import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Heart, Trash2 } from 'lucide-react-native';
import { RoleGate } from '@/components/ui/RoleProtection';
import { CarCard } from '@/components/CarCard';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { BookmarkService } from '@/services/featureServices';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/useTheme';
import { Spacing, Typography } from '@/constants/Colors';

export default function BookmarksScreen() {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBookmarks = async () => {
    if (!user) return;

    try {
      setError(null);
      const data = await BookmarkService.getUserBookmarks(user.id);
      setBookmarks(data);
    } catch (err: any) {
      console.error('Error loading bookmarks:', err);
      setError(err.message || 'Failed to load bookmarks');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    loadBookmarks();
  };

  const handleRemoveBookmark = async (bookmarkId: string, target: any) => {
    if (!user) return;

    try {
      await BookmarkService.removeBookmark(user.id, target);
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    } catch (err: any) {
      console.error('Error removing bookmark:', err);
    }
  };

  const transformBookmarkToCar = (bookmark: any) => {
    if (bookmark.car_models) {
      // Car model bookmark
      const carModel = bookmark.car_models;
      return {
        id: `model-${carModel.id}`,
        make: carModel.brands?.name || 'Unknown',
        model: carModel.name,
        year: carModel.year || new Date().getFullYear(),
        price: 0, // Price on request for models
        mileage: 0,
        location: 'Multiple locations',
        images: carModel.image_url ? [carModel.image_url] : [],
        created_at: bookmark.created_at,
        features: [],
        dealer: {
          name: 'CarSuggester',
          verified: true,
        },
        _bookmark: {
          id: bookmark.id,
          target: { carModelId: carModel.id },
        },
      };
    } else if (bookmark.vehicle_listings) {
      // Vehicle listing bookmark
      const listing = bookmark.vehicle_listings;
      return {
        id: listing.id,
        make: listing.make,
        model: listing.model,
        year: listing.year,
        price: listing.price,
        mileage: 0,
        location: 'See listing',
        images: listing.images || [],
        created_at: bookmark.created_at,
        features: [],
        title: listing.title,
        _bookmark: {
          id: bookmark.id,
          target: { vehicleListingId: listing.id },
        },
      };
    }
    return null;
  };

  const renderBookmarkItem = ({ item }: { item: any }) => {
    const car = transformBookmarkToCar(item);
    if (!car) return null;

    return (
      <View style={styles.bookmarkItem}>
        <CarCard
          car={car}
          onPress={() => {
            if (car._bookmark.target.carModelId) {
              router.push(`/model/${car._bookmark.target.carModelId}`);
            } else if (car._bookmark.target.vehicleListingId) {
              router.push(`/car/${car._bookmark.target.vehicleListingId}`);
            }
          }}
          showSaveButton={false}
        />
        <TouchableOpacity
          style={[styles.removeButton, { backgroundColor: colors.error }]}
          onPress={() => handleRemoveBookmark(car._bookmark.id, car._bookmark.target)}
        >
          <Trash2 color={colors.white} size={16} />
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <LoadingSpinner color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading your saved cars...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ErrorState
          title="Failed to Load Bookmarks"
          message={error}
          onRetry={loadBookmarks}
        />
      </SafeAreaView>
    );
  }

  return (
    <RoleGate requiredRoles={['user', 'dealer', 'admin']} requireAuth={true}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft color={colors.text} size={24} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Saved Cars</Text>
          <View style={styles.placeholder} />
        </View>

        {bookmarks.length === 0 ? (
          <EmptyState
            icon={<Heart color={colors.textSecondary} size={48} />}
            title="No Saved Cars"
            subtitle="Start exploring and save cars you're interested in"
            action={
              <TouchableOpacity 
                style={[styles.browseButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/marketplace')}
              >
                <Text style={[styles.browseButtonText, { color: colors.white }]}>
                  Browse Cars
                </Text>
              </TouchableOpacity>
            }
          />
        ) : (
          <FlatList
            data={bookmarks}
            renderItem={renderBookmarkItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </RoleGate>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  loadingText: {
    ...Typography.body,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerTitle: {
    ...Typography.h1,
    fontWeight: '700',
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  bookmarkItem: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  removeButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    borderRadius: 20,
    padding: Spacing.sm,
    zIndex: 1,
  },
  browseButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
    marginTop: Spacing.md,
  },
  browseButtonText: {
    ...Typography.body,
    fontWeight: '600',
    textAlign: 'center',
  },
});
