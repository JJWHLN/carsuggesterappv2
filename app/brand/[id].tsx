import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { ModelCard } from '@/components/ModelCard'; // Using ModelCard for brand's models
import {
  currentColors,
  Spacing,
  Typography,
  BorderRadius,
} from '@/constants/Colors';
import { useApi } from '@/hooks/useApi';
import { fetchBrandById, fetchCarModels, ApiError } from '@/services/api';
import { Brand as BrandType, CarModel as CarModelType } from '@/types/database';
import { ArrowLeft, Star, Car, Award } from '@/utils/ultra-optimized-icons';
import { getImageUrl } from '@/utils/formatters'; // For brand logo

export default function BrandDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const {
    data: brand,
    loading: brandLoading,
    error: brandError,
    refetch: refetchBrand,
  } = useApi<BrandType | null>(async () => {
    if (!id) return null;
    try {
      return await fetchBrandById(id);
    } catch (e) {
      if (e instanceof ApiError) throw new Error(e.userFriendlyMessage);
      throw e;
    }
  }, [id]);

  const {
    data: models,
    loading: modelsLoading,
    error: modelsError,
    refetch: refetchModels,
  } = useApi<CarModelType[]>(
    async () => {
      if (!brand?.name) return []; // Don't fetch if brand name isn't available
      try {
        // Fetch car models by brand name
        return await fetchCarModels({ brandName: brand.name, limit: 20 });
      } catch (e) {
        if (e instanceof ApiError) throw new Error(e.userFriendlyMessage);
        throw e;
      }
    },
    [brand?.name], // Re-fetch if brand name changes (after brand is loaded)
  );

  const handleBack = () => {
    router.back();
  };

  const handleModelPress = (model: CarModelType) => {
    router.push(`/model/${model.id}`);
  };

  const renderModel: ListRenderItem<CarModelType> = ({ item }) => (
    <ModelCard // Changed from CarCard to ModelCard
      model={item}
      onPress={() => handleModelPress(item)}
    />
  );

  const isLoading = brandLoading || (brand && modelsLoading && !models); // Adjusted loading state

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft color={currentColors.text} size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size={32} />
          <Text style={styles.loadingText}>Loading brand details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Combined error checking for brand and models
  const displayError = brandError || (brand && modelsError);
  const errorMessage = brandError || modelsError || 'Brand or models not found';

  if (displayError && !brand) {
    // Show error only if brand itself failed to load or no brand and models error
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft color={currentColors.text} size={24} />
          </TouchableOpacity>
        </View>
        <ErrorState
          title="Error Loading Brand"
          message={errorMessage}
          onRetry={() => {
            if (brandError) refetchBrand();
            if (modelsError) refetchModels();
          }}
        />
      </SafeAreaView>
    );
  }

  if (!brand) {
    // Should be caught by loading or error state, but as a fallback
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft color={currentColors.text} size={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Brand not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Mock data for founded and headquarters as it's not in the BrandType
  const foundedYear = brand.name === 'Toyota' ? 1937 : (brand.id % 50) + 1970; // Example mock
  const headquartersLocation =
    brand.name === 'Toyota' ? 'Toyota City, Japan' : 'Global City, World'; // Example mock
  // Mock popular models based on brand name, not in DB type
  const popularModels = brand.name
    ? [
        `${brand.name} Model S`,
        `${brand.name} Model X`,
        `${brand.name} Roadster`,
      ]
    : [];

  return (
    <SafeAreaView style={styles.container}>
      {/* Custom header View removed, native header is used */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <Image
            source={{ uri: getImageUrl(brand.logo_url) }}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>{brand.name}</Text>
          {brand.description && (
            <Text style={styles.brandDescription}>{brand.description}</Text>
          )}
        </View>

        {/* Brand Info - Using mock data for fields not in BrandType */}
        <View style={styles.brandInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Founded:</Text>
            <Text style={styles.infoValue}>{foundedYear}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Headquarters:</Text>
            <Text style={styles.infoValue}>{headquartersLocation}</Text>
          </View>
        </View>

        {/* Categories from BrandType */}
        {brand.category && brand.category.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Specialties</Text>
            <View style={styles.categoriesContainer}>
              {brand.category.map((category: string, index: number) => (
                <View key={index} style={styles.categoryTag}>
                  <Award color={currentColors.primary} size={16} />
                  <Text style={styles.categoryText}>{category}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Popular Models (Mocked) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Popular Models (Examples)</Text>
          <View style={styles.modelsGrid}>
            {popularModels.map((modelName: string, index: number) => (
              <View key={index} style={styles.modelTag}>
                <Car color={currentColors.textSecondary} size={16} />
                <Text style={styles.modelText}>{modelName}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Available Models from this Brand */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Models from {brand.name}</Text>
            {models && (
              <Text style={styles.sectionSubtitle}>
                {models.length} {models.length === 1 ? 'model' : 'models'} found
              </Text>
            )}
          </View>

          {modelsLoading && !models && <LoadingSpinner />}
          {modelsError && !modelsLoading && (
            <ErrorState message={modelsError} onRetry={refetchModels} />
          )}
          {models && models.length > 0 ? (
            <FlatList
              data={models}
              renderItem={renderModel} // Changed from renderCar
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false} // If inside ScrollView
              showsVerticalScrollIndicator={false}
            />
          ) : (
            !modelsLoading &&
            !modelsError && (
              <View style={styles.emptyState}>
                <Car color={currentColors.textSecondary} size={48} />
                <Text style={styles.emptyText}>
                  No models currently listed for {brand.name}
                </Text>
              </View>
            )
          )}
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
  header: {
    // Add back the missing header style
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: currentColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: currentColors.border,
  },
  backButton: {
    // Add back the missing backButton style
    padding: Spacing.sm,
    marginRight: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  brandHeader: {
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: currentColors.surface,
  },
  brandLogo: {
    width: 80,
    height: 80,
    marginBottom: Spacing.lg,
    backgroundColor: currentColors.surfaceDark,
    borderRadius: BorderRadius.lg,
  },
  brandName: {
    ...Typography.h1,
    color: currentColors.text,
    marginBottom: Spacing.md,
  },
  brandDescription: {
    ...Typography.body,
    color: currentColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  brandInfo: {
    backgroundColor: currentColors.surface,
    margin: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  infoLabel: {
    ...Typography.body,
    color: currentColors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    ...Typography.body,
    color: currentColors.text,
    fontWeight: '600',
  },
  section: {
    margin: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h3,
    color: currentColors.text,
  },
  sectionSubtitle: {
    ...Typography.bodySmall,
    color: currentColors.textSecondary,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap: Spacing.sm, // Removed unsupported property
  },
  categoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: currentColors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginRight: Spacing.sm, // Add spacing between tags
    marginBottom: Spacing.sm, // Add spacing between rows
  },
  categoryText: {
    ...Typography.bodySmall,
    color: currentColors.primary,
    fontWeight: '500',
    marginLeft: Spacing.xs,
  },
  modelsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap: Spacing.sm, // Removed unsupported property
  },
  modelTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: currentColors.surfaceDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.sm, // Add spacing between tags
    marginBottom: Spacing.sm, // Add spacing between rows
  },
  modelText: {
    ...Typography.bodySmall,
    color: currentColors.text,
    fontWeight: '500',
    marginLeft: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    ...Typography.body,
    color: currentColors.textSecondary,
    marginTop: Spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // gap: Spacing.md, // Removed unsupported property
  },
  loadingText: {
    ...Typography.body,
    color: currentColors.textSecondary,
    marginTop: Spacing.md, // Add margin instead of gap
  },
});
