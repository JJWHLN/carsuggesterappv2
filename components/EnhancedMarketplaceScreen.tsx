import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useTheme';
import { useDebounce } from '@/hooks/useDebounce';
import { socialService } from '@/services/socialService';
import { realTimeChatService } from '@/services/realTimeChatService';
import { SearchBar } from '@/components/ui/SearchBar';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';

import { useAuth } from '@/contexts/AuthContext';
import { Car, Search, Filter, MapPin, Clock, DollarSign, MessageCircle, Heart, Calendar, Gauge, Fuel, Settings, CheckCircle, AlertTriangle, TrendingUp, Star, Eye, List, SlidersHorizontal } from '@/utils/ultra-optimized-icons';

interface MarketplaceListing {
  id: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  price: number;
  original_price?: number;
  mileage: number;
  condition: string;
  fuel_type: string;
  transmission: string;
  engine: string;
  location: string;
  distance?: number;
  listed_date: string;
  views?: number;
  favorites?: number;
  inquiries?: number;
  featured?: boolean;
  dealer_info?: {
    id: string;
    name: string;
    verified: boolean;
    rating: number;
  };
}

const { width } = Dimensions.get('window');

interface EnhancedMarketplaceScreenProps {
  onCarPress?: (carId: string) => void;
  onDealerPress?: (dealerId: string) => void;
  onLocationPress?: (latitude: number, longitude: number) => void;
  onMessageDealer?: (dealerId: string, carId?: string) => void;
}

interface MarketplaceListingCardProps {
  listing: MarketplaceListing;
  onPress: () => void;
  onMessagePress: () => void;
  onSharePress: () => void;
  onSavePress: () => void;
  onPriceHistoryPress: () => void;
  isSaved: boolean;
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: MarketplaceFilters) => void;
  currentFilters: MarketplaceFilters;
}

interface MarketplaceFilters {
  priceRange: [number, number];
  yearRange: [number, number];
  mileageRange: [number, number];
  condition: string[];
  fuelType: string[];
  transmission: string[];
  brands: string[];
  location: string;
  radius: number;
  verified: boolean;
  hasPhotos: boolean;
  sortBy: 'price_asc' | 'price_desc' | 'year_desc' | 'mileage_asc' | 'date_desc' | 'distance';
}

interface MarketplaceStatsProps {
  totalListings: number;
  averagePrice: number;
  priceChange: number;
  newListings: number;
}

const MarketplaceStats: React.FC<MarketplaceStatsProps> = ({
  totalListings,
  averagePrice,
  priceChange,
  newListings,
}) => {
  const { colors } = useThemeColors();

  const stats = [
    {
      label: 'Active Listings',
      value: totalListings.toLocaleString(),
      icon: Car,
      color: colors.primary,
    },
    {
      label: 'Average Price',
      value: `$${Math.round(averagePrice / 1000)}k`,
      icon: DollarSign,
      color: colors.accentGreen,
    },
    {
      label: 'Price Trend',
      value: `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(1)}%`,
      icon: priceChange >= 0 ? TrendingUp : TrendingDown,
      color: priceChange >= 0 ? colors.success : colors.error,
    },
    {
      label: 'New Today',
      value: newListings.toString(),
      icon: Clock,
      color: colors.warning,
    },
  ];

  return (
    <View style={styles.statsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsContent}>
        {stats.map((stat, index) => (
          <View key={index} style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}>
              <stat.icon size={20} color={stat.color} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const MarketplaceListingCard: React.FC<MarketplaceListingCardProps> = ({
  listing,
  onPress,
  onMessagePress,
  onSharePress,
  onSavePress,
  onPriceHistoryPress,
  isSaved,
}) => {
  const { colors } = useThemeColors();

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(0)}k`;
    }
    return `$${price.toLocaleString()}`;
  };

  const formatMileage = (mileage: number) => {
    if (mileage >= 1000) {
      return `${(mileage / 1000).toFixed(0)}k`;
    }
    return mileage.toString();
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const listingDate = new Date(date);
    const diffInHours = Math.floor((now.getTime() - listingDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  const getConditionColor = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'excellent': return colors.success;
      case 'good': return colors.accentGreen;
      case 'fair': return colors.warning;
      case 'poor': return colors.error;
      default: return colors.textSecondary;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.listingCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.listingInfo}>
          <Text style={[styles.listingTitle, { color: colors.text }]}>
            {listing.year} {listing.make} {listing.model}
          </Text>
          <Text style={[styles.listingSubtitle, { color: colors.textSecondary }]}>
            {listing.trim || listing.engine}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={onSavePress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Bookmark 
              size={20} 
              color={isSaved ? colors.primary : colors.textSecondary}
              fill={isSaved ? colors.primary : 'transparent'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onSharePress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Share2 size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listingDetails}>
        <View style={styles.priceSection}>
          <Text style={[styles.price, { color: colors.primary }]}>
            {formatPrice(listing.price)}
          </Text>
          {listing.original_price && listing.original_price > listing.price && (
            <Text style={[styles.originalPrice, { color: colors.textSecondary }]}>
              ${listing.original_price.toLocaleString()}
            </Text>
          )}
          <TouchableOpacity onPress={onPriceHistoryPress} style={styles.priceHistoryButton}>
            <TrendingUp size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.keyDetails}>
          <View style={styles.detailItem}>
            <Gauge size={14} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {formatMileage(listing.mileage)} mi
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Fuel size={14} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {listing.fuel_type}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Settings size={14} color={colors.textSecondary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {listing.transmission}
            </Text>
          </View>
        </View>

        <View style={styles.conditionLocation}>
          <View style={[styles.conditionBadge, { backgroundColor: `${getConditionColor(listing.condition)}15` }]}>
            <Text style={[styles.conditionText, { color: getConditionColor(listing.condition) }]}>
              {listing.condition}
            </Text>
          </View>
          
          {listing.dealer_info && (
            <View style={styles.dealerBadge}>
              {listing.dealer_info.verified && (
                <CheckCircle size={12} color={colors.success} />
              )}
              <Text style={[styles.dealerText, { color: colors.textSecondary }]}>
                {listing.dealer_info.name}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.locationTime}>
          <View style={styles.locationInfo}>
            <MapPin size={12} color={colors.textSecondary} />
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>
              {listing.location}
            </Text>
            {listing.distance && (
              <Text style={[styles.distanceText, { color: colors.textSecondary }]}>
                • {listing.distance.toFixed(1)} mi
              </Text>
            )}
          </View>
          <Text style={[styles.timeAgo, { color: colors.textSecondary }]}>
            {getTimeAgo(listing.listed_date)}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.engagementStats}>
          <View style={styles.engagementItem}>
            <Eye size={14} color={colors.textSecondary} />
            <Text style={[styles.engagementText, { color: colors.textSecondary }]}>
              {listing.views || 0}
            </Text>
          </View>
          <View style={styles.engagementItem}>
            <Heart size={14} color={colors.textSecondary} />
            <Text style={[styles.engagementText, { color: colors.textSecondary }]}>
              {listing.favorites || 0}
            </Text>
          </View>
          <View style={styles.engagementItem}>
            <MessageCircle size={14} color={colors.textSecondary} />
            <Text style={[styles.engagementText, { color: colors.textSecondary }]}>
              {listing.inquiries || 0}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.messageButton, { backgroundColor: colors.primary }]}
          onPress={onMessagePress}
        >
          <MessageCircle size={16} color={colors.white} />
          <Text style={[styles.messageButtonText, { color: colors.white }]}>
            Contact
          </Text>
        </TouchableOpacity>
      </View>

      {listing.featured && (
        <View style={[styles.featuredBadge, { backgroundColor: colors.warning }]}>
          <Star size={12} color={colors.white} fill={colors.white} />
          <Text style={[styles.featuredText, { color: colors.white }]}>Featured</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onApply, currentFilters }) => {
  const { colors } = useThemeColors();
  const [filters, setFilters] = useState(currentFilters);

  const sortOptions = [
    { value: 'date_desc', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'year_desc', label: 'Year: Newest First' },
    { value: 'mileage_asc', label: 'Mileage: Low to High' },
    { value: 'distance', label: 'Distance: Nearest First' },
  ];

  const conditionOptions = ['Excellent', 'Good', 'Fair', 'Poor'];
  const fuelTypeOptions = ['Gasoline', 'Hybrid', 'Electric', 'Diesel'];
  const transmissionOptions = ['Automatic', 'Manual', 'CVT'];

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters: MarketplaceFilters = {
      priceRange: [0, 200000],
      yearRange: [1990, new Date().getFullYear()],
      mileageRange: [0, 300000],
      condition: [],
      fuelType: [],
      transmission: [],
      brands: [],
      location: '',
      radius: 50,
      verified: false,
      hasPhotos: false,
      sortBy: 'date_desc',
    };
    setFilters(defaultFilters);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={[styles.filterModal, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.modalCancelButton, { color: colors.textSecondary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Filters</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={[styles.modalResetButton, { color: colors.primary }]}>
              Reset
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.filterContent} showsVerticalScrollIndicator={false}>
          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Sort By</Text>
            <View style={styles.sortOptions}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.sortOption,
                    {
                      backgroundColor: filters.sortBy === option.value ? colors.primary : colors.surface,
                      borderColor: colors.border,
                    }
                  ]}
                  onPress={() => setFilters({ ...filters, sortBy: option.value as any })}
                >
                  <Text style={[
                    styles.sortOptionText,
                    { color: filters.sortBy === option.value ? colors.white : colors.text }
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Condition</Text>
            <View style={styles.checkboxGroup}>
              {conditionOptions.map((condition) => (
                <TouchableOpacity
                  key={condition}
                  style={styles.checkboxItem}
                  onPress={() => {
                    const updatedConditions = filters.condition.includes(condition)
                      ? filters.condition.filter(c => c !== condition)
                      : [...filters.condition, condition];
                    setFilters({ ...filters, condition: updatedConditions });
                  }}
                >
                  <View style={[
                    styles.checkbox,
                    {
                      backgroundColor: filters.condition.includes(condition) ? colors.primary : 'transparent',
                      borderColor: colors.border,
                    }
                  ]}>
                    {filters.condition.includes(condition) && (
                      <CheckCircle size={16} color={colors.white} />
                    )}
                  </View>
                  <Text style={[styles.checkboxLabel, { color: colors.text }]}>{condition}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterSectionTitle, { color: colors.text }]}>Quick Filters</Text>
            <View style={styles.quickFilters}>
              <TouchableOpacity
                style={[
                  styles.quickFilter,
                  {
                    backgroundColor: filters.verified ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  }
                ]}
                onPress={() => setFilters({ ...filters, verified: !filters.verified })}
              >
                <CheckCircle size={16} color={filters.verified ? colors.white : colors.textSecondary} />
                <Text style={[
                  styles.quickFilterText,
                  { color: filters.verified ? colors.white : colors.text }
                ]}>
                  Verified Dealers
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.quickFilter,
                  {
                    backgroundColor: filters.hasPhotos ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  }
                ]}
                onPress={() => setFilters({ ...filters, hasPhotos: !filters.hasPhotos })}
              >
                <Camera size={16} color={filters.hasPhotos ? colors.white : colors.textSecondary} />
                <Text style={[
                  styles.quickFilterText,
                  { color: filters.hasPhotos ? colors.white : colors.text }
                ]}>
                  Has Photos
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: colors.primary }]}
            onPress={handleApply}
          >
            <Text style={[styles.applyButtonText, { color: colors.white }]}>
              Apply Filters
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export const EnhancedMarketplaceScreen: React.FC<EnhancedMarketplaceScreenProps> = ({
  onCarPress,
  onDealerPress,
  onLocationPress,
  onMessageDealer,
}) => {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [savedListings, setSavedListings] = useState<Set<string>>(new Set());
  
  const [filters, setFilters] = useState<MarketplaceFilters>({
    priceRange: [0, 200000],
    yearRange: [1990, new Date().getFullYear()],
    mileageRange: [0, 300000],
    condition: [],
    fuelType: [],
    transmission: [],
    brands: [],
    location: '',
    radius: 50,
    verified: false,
    hasPhotos: false,
    sortBy: 'date_desc',
  });

  const [marketplaceStats, setMarketplaceStats] = useState({
    totalListings: 0,
    averagePrice: 0,
    priceChange: 0,
    newListings: 0,
  });

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const loadMarketplaceData = useCallback(async () => {
    try {
      // TODO: Implement marketplace data loading
      const mockListings: MarketplaceListing[] = [
        {
          id: '1',
          year: 2022,
          make: 'Toyota',
          model: 'Camry',
          trim: 'SE',
          price: 28500,
          original_price: 32000,
          mileage: 15000,
          condition: 'Excellent',
          fuel_type: 'Gasoline',
          transmission: 'Automatic',
          engine: '2.5L 4-cyl',
          location: 'Los Angeles, CA',
          distance: 5.2,
          listed_date: new Date().toISOString(),
          views: 245,
          favorites: 12,
          inquiries: 8,
          featured: true,
          dealer_info: {
            id: 'dealer1',
            name: 'Premium Auto',
            verified: true,
            rating: 4.8,
          },
        },
        // Add more mock listings...
      ];

      setListings(mockListings);
      setMarketplaceStats({
        totalListings: 1247,
        averagePrice: 35000,
        priceChange: 2.3,
        newListings: 23,
      });
    } catch (error) {
      logger.error('Error loading marketplace data:', error);
    }
  }, [filters, debouncedSearchQuery]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadMarketplaceData();
      setLoading(false);
    };

    loadData();
  }, [loadMarketplaceData]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadMarketplaceData();
    setRefreshing(false);
  }, [loadMarketplaceData]);

  const handleListingPress = useCallback((listing: MarketplaceListing) => {
    onCarPress?.(listing.id);
  }, [onCarPress]);

  const handleMessageDealer = useCallback(async (listing: MarketplaceListing) => {
    try {
      if (!listing.dealer_info) return;

      // Create a conversation with the dealer
      const conversation = await realTimeChatService.createConversation({
        type: 'dealer_inquiry',
        title: `Inquiry about ${listing.year} ${listing.make} ${listing.model}`,
        metadata: {
          car_id: listing.id,
          dealer_id: listing.dealer_info.id,
          listing_price: listing.price,
        },
      });

      // Add dealer as participant
      await realTimeChatService.addParticipant(conversation.id, listing.dealer_info.id, 'dealer');

      // Send initial message with car details
        await realTimeChatService.sendMessage(conversation.id, {
          content: `I'm interested in the ${listing.year} ${listing.make} ${listing.model}.`,
          metadata: {
            car_id: listing.id,
            price: listing.price,
            mileage: listing.mileage,
          },
        });      onMessageDealer?.(listing.dealer_info.id, listing.id);
    } catch (error) {
      logger.error('Error starting dealer conversation:', error);
      Alert.alert('Error', 'Failed to contact dealer');
    }
  }, [onMessageDealer]);

  const handleSaveListing = useCallback(async (listingId: string) => {
    try {
      const newSavedListings = new Set(savedListings);
      if (savedListings.has(listingId)) {
        newSavedListings.delete(listingId);
        // TODO: Remove from saved listings in backend
      } else {
        newSavedListings.add(listingId);
        // TODO: Save listing in backend
      }
      setSavedListings(newSavedListings);
    } catch (error) {
      logger.error('Error saving listing:', error);
    }
  }, [savedListings]);

  const renderListingCard = useCallback(({ item }: { item: MarketplaceListing }) => (
    <MarketplaceListingCard
      listing={item}
      onPress={() => handleListingPress(item)}
      onMessagePress={() => handleMessageDealer(item)}
      onSharePress={() => {
        // TODO: Implement sharing
        logger.debug('Share listing:', item.id);
      }}
      onSavePress={() => handleSaveListing(item.id)}
      onPriceHistoryPress={() => {
        // TODO: Show price history
        logger.debug('Show price history:', item.id);
      }}
      isSaved={savedListings.has(item.id)}
    />
  ), [handleListingPress, handleMessageDealer, handleSaveListing, savedListings]);

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.screenTitle, { color: colors.text }]}>Marketplace</Text>
      <View style={styles.headerActions}>
        <TouchableOpacity
          style={[styles.viewModeButton, { backgroundColor: colors.surface }]}
          onPress={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
        >
          {viewMode === 'list' ? (
            <Grid3X3 size={20} color={colors.text} />
          ) : (
            <List size={20} color={colors.text} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.surface }]}
          onPress={() => setShowFilters(true)}
        >
          <SlidersHorizontal size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingState message="Loading marketplace..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {renderHeader()}
      
      <SearchBar
        placeholder="Search cars, makes, models..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <MarketplaceStats
        totalListings={marketplaceStats.totalListings}
        averagePrice={marketplaceStats.averagePrice}
        priceChange={marketplaceStats.priceChange}
        newListings={marketplaceStats.newListings}
      />

      <FlatList
        data={listings}
        renderItem={renderListingCard}
        keyExtractor={(item) => item.id}
        style={styles.listingsList}
        contentContainerStyle={styles.listingsContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Car size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No listings found</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Try adjusting your search or filters
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                setSearchQuery('');
                setFilters({
                  ...filters,
                  priceRange: [0, 200000],
                  condition: [],
                  fuelType: [],
                  transmission: [],
                  brands: [],
                });
              }}
            >
              <Text style={[styles.emptyButtonText, { color: colors.white }]}>
                Browse All Cars
              </Text>
            </TouchableOpacity>
          </View>
        }
      />

      <FilterModal
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={setFilters}
        currentFilters={filters}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  screenTitle: {
    ...Typography.pageTitle,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  searchBar: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  statsContainer: {
    marginBottom: Spacing.md,
  },
  statsContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    minWidth: 100,
    ...Shadows.small,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    ...Typography.cardTitle,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.caption,
    textAlign: 'center',
  },
  listingsList: {
    flex: 1,
  },
  listingsContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  listingCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    gap: Spacing.md,
    position: 'relative',
    ...Shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  listingInfo: {
    flex: 1,
  },
  listingTitle: {
    ...Typography.cardTitle,
    fontWeight: '600',
  },
  listingSubtitle: {
    ...Typography.bodyText,
    marginTop: Spacing.xs / 2,
  },
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  listingDetails: {
    gap: Spacing.sm,
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  price: {
    ...Typography.pageTitle,
    fontWeight: '700',
  },
  originalPrice: {
    ...Typography.bodyText,
    textDecorationLine: 'line-through',
  },
  priceHistoryButton: {
    padding: Spacing.xs / 2,
  },
  keyDetails: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
  },
  detailText: {
    ...Typography.bodySmall,
  },
  conditionLocation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conditionBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
  },
  conditionText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  dealerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
  },
  dealerText: {
    ...Typography.caption,
  },
  locationTime: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
    flex: 1,
  },
  locationText: {
    ...Typography.bodySmall,
  },
  distanceText: {
    ...Typography.bodySmall,
  },
  timeAgo: {
    ...Typography.caption,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  engagementStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
  },
  engagementText: {
    ...Typography.caption,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    ...Shadows.small,
  },
  messageButtonText: {
    ...Typography.bodyText,
    fontWeight: '600',
  },
  featuredBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs / 2,
  },
  featuredText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  // Filter Modal Styles
  filterModal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalCancelButton: {
    ...Typography.bodyText,
  },
  modalTitle: {
    ...Typography.sectionTitle,
    fontWeight: '600',
  },
  modalResetButton: {
    ...Typography.bodyText,
    fontWeight: '600',
  },
  filterContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  filterSection: {
    marginBottom: Spacing.xl,
  },
  filterSectionTitle: {
    ...Typography.sectionTitle,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  sortOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  sortOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  sortOptionText: {
    ...Typography.bodyText,
    fontWeight: '500',
  },
  checkboxGroup: {
    gap: Spacing.md,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    ...Typography.bodyText,
  },
  quickFilters: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  quickFilterText: {
    ...Typography.bodyText,
    fontWeight: '500',
  },
  modalFooter: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  applyButton: {
    width: '100%',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.small,
  },
  applyButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  // Empty state styles
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  emptyTitle: {
    ...Typography.sectionTitle,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.bodyText,
    textAlign: 'center',
  },
  emptyButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
    ...Shadows.small,
  },
  emptyButtonText: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
});

export default EnhancedMarketplaceScreen;
