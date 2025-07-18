import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Car, Search, TrendingUp, Star, Calendar, ChevronRight } from 'lucide-react-native';
import { SearchBar } from '@/components/ui/SearchBar';
import { Card } from '@/components/ui/Card';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { StatCard } from '@/components/ui/StatCard';
import { withUnifiedTabScreen } from '@/components/ui/UnifiedTabScreen';
import { UnifiedList } from '@/components/ui/UnifiedList';
import { useDesignTokens } from '@/hooks/useConsolidatedDesign';
import { useDebounce } from '@/hooks/useDebounce';
import { fetchCarModels, fetchPopularBrands } from '@/services/api';
import { CarModel, Brand } from '@/types/database';

const { width } = Dimensions.get('window');

function ModelsScreen() {
  const router = useRouter();
  const { colors, spacing, typography } = useDesignTokens();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  const categories = ['All', 'Sedan', 'SUV', 'Hatchback', 'Coupe', 'Truck', 'Convertible'];
  
  const handleModelPress = useCallback((modelId: number) => {
    router.push(`/model/${modelId}`);
  }, [router]);
  
  const renderModelItem = useCallback((model: CarModel, index: number) => (
    <TouchableOpacity
      style={styles.modelCard}
      onPress={() => handleModelPress(model.id)}
    >
      <Card style={styles.cardContainer}>
        <OptimizedImage
          source={{ uri: model.image_url || '' }}
          style={styles.modelImage}
          placeholder={true}
        />
        
        <View style={styles.modelInfo}>
          <Text style={[styles.modelName, { color: colors.text }]}>
            {model.brands?.name} {model.name}
          </Text>
          
          <View style={styles.modelMeta}>
            <Text style={[styles.modelCategory, { color: colors.textSecondary }]}>
              {Array.isArray(model.category) ? model.category.join(', ') : model.category || 'N/A'}
            </Text>
            <Text style={[styles.modelYear, { color: colors.textSecondary }]}>
              {model.year || 'N/A'}
            </Text>
          </View>
          
          <View style={styles.modelStats}>
            <View style={styles.statItem}>
              <Star size={16} color={colors.accentGreen} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                4.5
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <TrendingUp size={16} color={colors.primary} />
              <Text style={[styles.statText, { color: colors.textSecondary }]}>
                85%
              </Text>
            </View>
          </View>
        </View>
        
        <ChevronRight size={20} color={colors.textSecondary} />
      </Card>
    </TouchableOpacity>
  ), [handleModelPress, colors, styles]);
  
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Hero Section */}
      <View style={styles.heroSection}>
        <Text style={[styles.heroTitle, { color: colors.text }]}>Car Models</Text>
        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
          Explore detailed specifications and reviews
        </Text>
        
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search car models..."
          onClear={() => setSearchQuery('')}
        />
      </View>
      
      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <StatCard
          label="Total Models"
          value="2,500+"
          icon={<Car size={24} color={colors.primary} />}
          iconBackgroundColor={colors.cardBackground}
        />
        <StatCard
          label="Popular"
          value="850+"
          icon={<TrendingUp size={24} color={colors.accentGreen} />}
          iconBackgroundColor={colors.cardBackground}
        />
        <StatCard
          label="Latest"
          value="150+"
          icon={<Calendar size={24} color={colors.secondaryGreen} />}
          iconBackgroundColor={colors.cardBackground}
        />
      </View>
      
      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Categories</Text>
        <View style={styles.categoriesGrid}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                { backgroundColor: colors.cardBackground },
                selectedCategory === category && { backgroundColor: colors.primary },
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: colors.text },
                  selectedCategory === category && { color: colors.background },
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
  
  return (
    <UnifiedList<CarModel>
      fetchData={async (page: number, limit: number, searchTerm?: string) => {
        const result = await fetchCarModels({
          limit,
          searchQuery: searchTerm,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          brandName: selectedBrand || undefined,
        });
        return Array.isArray(result) ? result : [];
      }}
      renderItem={renderModelItem}
      renderHeader={renderHeader}
      keyExtractor={(item) => item.id.toString()}
      searchQuery={debouncedSearchQuery}
      emptyTitle="No models found"
      emptyMessage="Try adjusting your search or category filters"
      loadingMessage="Loading car models..."
      errorTitle="Unable to load models"
      style={styles.list}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 40,
  },
  
  // Header styles
  headerContainer: {
    paddingBottom: 16,
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 24,
  },
  
  // Categories
  categoriesContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Model cards
  modelCard: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  cardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  modelImage: {
    width: 80,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  modelMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modelCategory: {
    fontSize: 14,
    fontWeight: '500',
  },
  modelYear: {
    fontSize: 14,
  },
  modelStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

// Use the UnifiedTabScreen HOC
export default withUnifiedTabScreen(ModelsScreen);
