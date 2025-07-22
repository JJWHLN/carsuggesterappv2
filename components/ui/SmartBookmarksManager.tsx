import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '@/constants/Colors';
import { CarCard } from '@/components/CarCard';
import { AnimatedBadge } from '@/components/ui/AnimatedBadge';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import SmartBookmarksService, { 
  SmartBookmark, 
  BookmarkCollection, 
  BookmarkAlert,
  BookmarkAnalytics 
} from '@/services/SmartBookmarksService';
import { Car } from '@/types/database';
import { 
  Bookmark, 
  User as Bell, 
  Settings, 
  Plus, 
  Calendar as Tag, 
  Calendar, 
  TrendingUp, 
  Filter,
  Star,
  Heart,
  Clock,
  DollarSign,
  ArrowLeft as ArrowDown,
  Eye,
  Phone,
  Car as CarIcon,
  Grid,
  List,
  Search,
  Menu as MoreHorizontal,
  X as Trash2,
  Edit3,
  Share,
  Info as AlertCircle,
  CheckCircle,
  X,
} from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');

interface SmartBookmarksManagerProps {
  onCarPress?: (car: Car) => void;
  onClose?: () => void;
}

type ViewMode = 'grid' | 'list';
type FilterMode = 'all' | 'priority' | 'alerts' | 'collections' | 'tags';
type SortMode = 'recent' | 'price' | 'views' | 'priority';

export function SmartBookmarksManager({ onCarPress, onClose }: SmartBookmarksManagerProps) {
  const [bookmarks, setBookmarks] = useState<SmartBookmark[]>([]);
  const [collections, setCollections] = useState<BookmarkCollection[]>([]);
  const [alerts, setAlerts] = useState<BookmarkAlert[]>([]);
  const [analytics, setAnalytics] = useState<BookmarkAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<'low' | 'medium' | 'high' | null>(null);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  
  // Modal States
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateCollection, setShowCreateCollection] = useState(false);
  const [showBookmarkDetails, setShowBookmarkDetails] = useState<SmartBookmark | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  const [bookmarkService] = useState(() => SmartBookmarksService.getInstance());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookmarksData, collectionsData, alertsData, analyticsData] = await Promise.all([
        bookmarkService.getAllBookmarks(),
        bookmarkService.getAllCollections(),
        bookmarkService.getAllAlerts(),
        bookmarkService.getBookmarkAnalytics(),
      ]);

      setBookmarks(bookmarksData);
      setCollections(collectionsData);
      setAlerts(alertsData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load bookmarks data:', error);
      Alert.alert('Error', 'Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter and sort bookmarks
  const filteredAndSortedBookmarks = useMemo(() => {
    let filtered = [...bookmarks];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(bookmark => 
        bookmark.car.make.toLowerCase().includes(query) ||
        bookmark.car.model.toLowerCase().includes(query) ||
        bookmark.tags.some(tag => tag.toLowerCase().includes(query)) ||
        bookmark.notes.toLowerCase().includes(query)
      );
    }

    // Apply category filters
    switch (filterMode) {
      case 'priority':
        if (selectedPriority) {
          filtered = filtered.filter(b => b.priority === selectedPriority);
        }
        break;
      case 'alerts':
        const alertCarIds = alerts.filter(a => !a.isRead).map(a => a.carId);
        filtered = filtered.filter(b => alertCarIds.includes(b.car.id));
        break;
      case 'collections':
        if (selectedCollection) {
          const collection = collections.find(c => c.id === selectedCollection);
          if (collection) {
            filtered = filtered.filter(b => collection.bookmarkIds.includes(b.id));
          }
        }
        break;
      case 'tags':
        if (selectedTag) {
          filtered = filtered.filter(b => b.tags.includes(selectedTag));
        }
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortMode) {
        case 'recent':
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        case 'price':
          return a.car.price - b.car.price;
        case 'views':
          return b.viewCount - a.viewCount;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });

    return filtered;
  }, [bookmarks, searchQuery, filterMode, selectedPriority, selectedCollection, selectedTag, sortMode, alerts, collections]);

  // Get unique tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    bookmarks.forEach(bookmark => {
      bookmark.tags.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [bookmarks]);

  const handleBookmarkPress = async (bookmark: SmartBookmark) => {
    await bookmarkService.recordBookmarkView(bookmark.id);
    await loadData(); // Refresh to update view count
    
    if (onCarPress) {
      onCarPress(bookmark.car);
    }
  };

  const handleRemoveBookmark = async (bookmarkId: string) => {
    Alert.alert(
      'Remove Bookmark',
      'Are you sure you want to remove this bookmark? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await bookmarkService.removeBookmark(bookmarkId);
            if (success) {
              await loadData();
            } else {
              Alert.alert('Error', 'Failed to remove bookmark');
            }
          },
        },
      ]
    );
  };

  const handleMarkAlertRead = async (alertId: string) => {
    await bookmarkService.markAlertAsRead(alertId);
    await loadData();
  };

  const handleDismissAlert = async (alertId: string) => {
    await bookmarkService.dismissAlert(alertId);
    await loadData();
  };

  const renderBookmarkCard = ({ item: bookmark }: { item: SmartBookmark }) => {
    const hasAlerts = alerts.some(alert => alert.carId === bookmark.car.id && !alert.isRead);
    
    return (
      <View style={styles.bookmarkCard}>
        <TouchableOpacity
          onPress={() => handleBookmarkPress(bookmark)}
          style={styles.bookmarkCardContent}
        >
          <View style={styles.bookmarkHeader}>
            <View style={styles.bookmarkImageContainer}>
              <OptimizedImage
                source={{ uri: bookmark.car.images?.[0] || 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=300' }}
                style={styles.bookmarkImage}
                cacheKey={`bookmark_${bookmark.car.id}`}
              />
              {hasAlerts && (
                <View style={styles.alertBadge}>
                  <Bell size={12} color={Colors.light.textInverse} strokeWidth={2} />
                </View>
              )}
            </View>
            
            <View style={styles.bookmarkInfo}>
              <Text style={styles.bookmarkTitle} numberOfLines={1}>
                {bookmark.car.make} {bookmark.car.model}
              </Text>
              <Text style={styles.bookmarkPrice}>
                €{bookmark.car.price.toLocaleString()}
              </Text>
              <View style={styles.bookmarkMeta}>
                <Text style={styles.bookmarkYear}>{bookmark.car.year}</Text>
                <Text style={styles.bookmarkDivider}>•</Text>
                <Text style={styles.bookmarkMileage}>
                  {bookmark.car.mileage?.toLocaleString()} km
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setShowBookmarkDetails(bookmark)}
              style={styles.bookmarkMoreButton}
            >
              <MoreHorizontal size={20} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.bookmarkDetails}>
            <View style={styles.bookmarkStats}>
              <View style={styles.stat}>
                <Eye size={14} color={Colors.light.textMuted} />
                <Text style={styles.statText}>{bookmark.viewCount}</Text>
              </View>
              <View style={styles.stat}>
                <Clock size={14} color={Colors.light.textMuted} />
                <Text style={styles.statText}>
                  {Math.floor((Date.now() - new Date(bookmark.addedAt).getTime()) / (1000 * 60 * 60 * 24))}d
                </Text>
              </View>
              {bookmark.priceAlertEnabled && (
                <View style={styles.stat}>
                  <Bell size={14} color={Colors.light.primary} />
                  <Text style={[styles.statText, { color: Colors.light.primary }]}>
                    {bookmark.priceAlertThreshold}%
                  </Text>
                </View>
              )}
            </View>

            {bookmark.tags.length > 0 && (
              <View style={styles.bookmarkTags}>
                {bookmark.tags.slice(0, 2).map((tag, index) => (
                  <AnimatedBadge
                    key={index}
                    variant="outline"
                    size="small"
                  >
                    {tag}
                  </AnimatedBadge>
                ))}
                {bookmark.tags.length > 2 && (
                  <Text style={styles.moreTagsText}>+{bookmark.tags.length - 2}</Text>
                )}
              </View>
            )}

            <View style={styles.priorityIndicator}>
              <AnimatedBadge
                variant={bookmark.priority === 'high' ? 'warning' : bookmark.priority === 'medium' ? 'info' : 'outline'}
                size="small"
              >
                {bookmark.priority.toUpperCase()}
              </AnimatedBadge>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.bookmarkActions}>
          <TouchableOpacity
            onPress={() => setShowBookmarkDetails(bookmark)}
            style={styles.actionButton}
          >
            <Edit3 size={16} color={Colors.light.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRemoveBookmark(bookmark.id)}
            style={styles.actionButton}
          >
            <Trash2 size={16} color={Colors.light.error} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAlert = ({ item: alert }: { item: BookmarkAlert }) => {
    const getAlertIcon = () => {
      switch (alert.type) {
        case 'price_drop':
          return <ArrowDown size={16} color={Colors.light.success} />;
        case 'similar_car':
          return <CarIcon size={16} color={Colors.light.info} />;
        case 'dealer_update':
          return <Phone size={16} color={Colors.light.warning} />;
        case 'expiring_soon':
          return <AlertCircle size={16} color={Colors.light.error} />;
        default:
          return <Bell size={16} color={Colors.light.textSecondary} />;
      }
    };

    return (
      <View style={[styles.alertCard, !alert.isRead && styles.unreadAlert]}>
        <View style={styles.alertIcon}>
          {getAlertIcon()}
        </View>
        
        <View style={styles.alertContent}>
          <Text style={[styles.alertMessage, !alert.isRead && styles.unreadAlertText]}>
            {alert.message}
          </Text>
          <Text style={styles.alertTime}>
            {new Date(alert.createdAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.alertActions}>
          {!alert.isRead && (
            <TouchableOpacity
              onPress={() => handleMarkAlertRead(alert.id)}
              style={styles.alertActionButton}
            >
              <CheckCircle size={16} color={Colors.light.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => handleDismissAlert(alert.id)}
            style={styles.alertActionButton}
          >
            <X size={16} color={Colors.light.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
        <Text style={styles.loadingText}>Loading your bookmarks...</Text>
      </View>
    );
  }

  const unreadAlerts = alerts.filter(a => !a.isRead);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Smart Bookmarks</Text>
            <Text style={styles.subtitle}>
              {bookmarks.length} cars • {unreadAlerts.length} alerts
            </Text>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setShowAnalytics(true)}
              style={styles.headerActionButton}
            >
              <TrendingUp size={20} color={Colors.light.primary} />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setShowFilters(true)}
              style={styles.headerActionButton}
            >
              <Filter size={20} color={Colors.light.primary} />
              {filterMode !== 'all' && <View style={styles.filterActiveDot} />}
            </TouchableOpacity>
            
            {onClose && (
              <TouchableOpacity onPress={onClose} style={styles.headerActionButton}>
                <X size={20} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search size={20} color={Colors.light.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search bookmarks..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.light.textMuted}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={20} color={Colors.light.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Stats */}
        {analytics && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickStats}
          >
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analytics.totalBookmarks}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analytics.activeAlerts}</Text>
              <Text style={styles.statLabel}>Alerts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>€{analytics.priceDropsSaved.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analytics.conversionRate}%</Text>
              <Text style={styles.statLabel}>Contact Rate</Text>
            </View>
          </ScrollView>
        )}

        {/* Active Filters */}
        {filterMode !== 'all' && (
          <View style={styles.activeFilters}>
            <Text style={styles.activeFiltersLabel}>Active filters:</Text>
            <AnimatedBadge
              variant="primary"
              size="small"
              onPress={() => {
                setFilterMode('all');
                setSelectedPriority(null);
                setSelectedCollection(null);
                setSelectedTag(null);
              }}
            >
              {filterMode.charAt(0).toUpperCase() + filterMode.slice(1)}
            </AnimatedBadge>
          </View>
        )}
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Unread Alerts */}
        {unreadAlerts.length > 0 && (
          <View style={styles.alertsSection}>
            <Text style={styles.sectionTitle}>🔔 New Alerts ({unreadAlerts.length})</Text>
            <FlatList
              data={unreadAlerts.slice(0, 3)}
              renderItem={renderAlert}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
            {unreadAlerts.length > 3 && (
              <TouchableOpacity style={styles.viewAllAlertsButton}>
                <Text style={styles.viewAllAlertsText}>View all {unreadAlerts.length} alerts</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Bookmarks */}
        <View style={styles.bookmarksSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              📚 Your Bookmarks ({filteredAndSortedBookmarks.length})
            </Text>
            
            <View style={styles.viewModeToggle}>
              <TouchableOpacity
                onPress={() => setViewMode('grid')}
                style={[styles.viewModeButton, viewMode === 'grid' && styles.activeViewMode]}
              >
                <Grid size={16} color={viewMode === 'grid' ? Colors.light.primary : Colors.light.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setViewMode('list')}
                style={[styles.viewModeButton, viewMode === 'list' && styles.activeViewMode]}
              >
                <List size={16} color={viewMode === 'list' ? Colors.light.primary : Colors.light.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {filteredAndSortedBookmarks.length > 0 ? (
            <FlatList
              data={filteredAndSortedBookmarks}
              renderItem={renderBookmarkCard}
              keyExtractor={(item) => item.id}
              numColumns={viewMode === 'grid' ? 2 : 1}
              key={viewMode} // Force re-render when view mode changes
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
              columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
            />
          ) : (
            <View style={styles.emptyState}>
              <Bookmark size={48} color={Colors.light.textMuted} />
              <Text style={styles.emptyStateTitle}>No bookmarks found</Text>
              <Text style={styles.emptyStateText}>
                {searchQuery ? 'Try adjusting your search or filters' : 'Start bookmarking cars you\'re interested in'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Analytics Modal */}
      {showAnalytics && analytics && (
        <Modal visible={showAnalytics} animationType="slide" presentationStyle="pageSheet">
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📊 Bookmark Analytics</Text>
              <TouchableOpacity onPress={() => setShowAnalytics(false)}>
                <X size={24} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.analyticsGrid}>
                <View style={styles.analyticsCard}>
                  <Text style={styles.analyticsValue}>{analytics.totalBookmarks}</Text>
                  <Text style={styles.analyticsLabel}>Total Bookmarks</Text>
                </View>
                <View style={styles.analyticsCard}>
                  <Text style={styles.analyticsValue}>{analytics.activeAlerts}</Text>
                  <Text style={styles.analyticsLabel}>Active Alerts</Text>
                </View>
                <View style={styles.analyticsCard}>
                  <Text style={styles.analyticsValue}>{analytics.averageTimeToContact}d</Text>
                  <Text style={styles.analyticsLabel}>Avg. Time to Contact</Text>
                </View>
                <View style={styles.analyticsCard}>
                  <Text style={styles.analyticsValue}>{analytics.conversionRate}%</Text>
                  <Text style={styles.analyticsLabel}>Conversion Rate</Text>
                </View>
              </View>

              <View style={styles.savingsCard}>
                <Text style={styles.savingsTitle}>💰 Money Saved from Price Drops</Text>
                <Text style={styles.savingsAmount}>€{analytics.priceDropsSaved.toLocaleString()}</Text>
              </View>

              <View style={styles.brandsSection}>
                <Text style={styles.analyticsSubtitle}>🏆 Popular Brands</Text>
                {analytics.popularBrands.map((brand, index) => (
                  <View key={brand.brand} style={styles.brandItem}>
                    <Text style={styles.brandName}>{brand.brand}</Text>
                    <Text style={styles.brandCount}>{brand.count} cars</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.light.textSecondary,
    marginTop: Spacing.md,
  },
  header: {
    backgroundColor: Colors.light.surface,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    ...Shadows.sm,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: Spacing.sm,
  },
  title: {
    ...Typography.heading,
    color: Colors.light.text,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  headerActionButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.light.surfaceSecondary,
    position: 'relative',
  },
  filterActiveDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.light.primary,
  },
  searchContainer: {
    marginTop: Spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Colors.light.text,
    paddingVertical: Spacing.sm,
  },
  quickStats: {
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  statCard: {
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    minWidth: 80,
  },
  statValue: {
    ...Typography.subtitle,
    color: Colors.light.primary,
    fontWeight: '700',
  },
  statLabel: {
    ...Typography.xs,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  activeFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  activeFiltersLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
  content: {
    flex: 1,
  },
  alertsSection: {
    padding: Spacing.md,
    backgroundColor: Colors.light.surface,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: Colors.light.text,
    marginBottom: Spacing.sm,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  unreadAlert: {
    backgroundColor: Colors.light.primary + '10',
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.primary,
  },
  alertIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  alertContent: {
    flex: 1,
  },
  alertMessage: {
    ...Typography.body,
    color: Colors.light.text,
    marginBottom: 4,
  },
  unreadAlertText: {
    fontWeight: '600',
  },
  alertTime: {
    ...Typography.xs,
    color: Colors.light.textMuted,
  },
  alertActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  alertActionButton: {
    padding: Spacing.xs,
  },
  viewAllAlertsButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  viewAllAlertsText: {
    ...Typography.caption,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  bookmarksSection: {
    padding: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  viewModeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surfaceSecondary,
    borderRadius: BorderRadius.sm,
    padding: 2,
  },
  viewModeButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm - 2,
  },
  activeViewMode: {
    backgroundColor: Colors.light.surface,
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  bookmarkCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
    flex: 1,
    marginHorizontal: 4,
  },
  bookmarkCardContent: {
    padding: Spacing.sm,
  },
  bookmarkHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  bookmarkImageContainer: {
    position: 'relative',
    marginRight: Spacing.sm,
  },
  bookmarkImage: {
    width: 60,
    height: 45,
    borderRadius: BorderRadius.sm,
  },
  alertBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.light.error,
    borderRadius: 8,
    padding: 2,
  },
  bookmarkInfo: {
    flex: 1,
  },
  bookmarkTitle: {
    ...Typography.body,
    color: Colors.light.text,
    fontWeight: '600',
    marginBottom: 2,
  },
  bookmarkPrice: {
    ...Typography.caption,
    color: Colors.light.primary,
    fontWeight: '700',
    marginBottom: 2,
  },
  bookmarkMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookmarkYear: {
    ...Typography.xs,
    color: Colors.light.textMuted,
  },
  bookmarkDivider: {
    ...Typography.xs,
    color: Colors.light.textMuted,
    marginHorizontal: 4,
  },
  bookmarkMileage: {
    ...Typography.xs,
    color: Colors.light.textMuted,
  },
  bookmarkMoreButton: {
    padding: Spacing.xs,
  },
  bookmarkDetails: {
    gap: Spacing.xs,
  },
  bookmarkStats: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    ...Typography.xs,
    color: Colors.light.textMuted,
  },
  bookmarkTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  moreTagsText: {
    ...Typography.xs,
    color: Colors.light.textMuted,
  },
  priorityIndicator: {
    alignSelf: 'flex-start',
  },
  bookmarkActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.sm,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyStateTitle: {
    ...Typography.subtitle,
    color: Colors.light.textSecondary,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyStateText: {
    ...Typography.body,
    color: Colors.light.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalTitle: {
    ...Typography.heading,
    color: Colors.light.text,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.md,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  analyticsCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: 'center',
    width: (width - Spacing.md * 3) / 2,
    ...Shadows.sm,
  },
  analyticsValue: {
    ...Typography.title,
    color: Colors.light.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  analyticsLabel: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  savingsCard: {
    backgroundColor: Colors.light.success + '10',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  savingsTitle: {
    ...Typography.subtitle,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  savingsAmount: {
    ...Typography.title,
    fontSize: 28,
    color: Colors.light.success,
    fontWeight: '700',
  },
  brandsSection: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  analyticsSubtitle: {
    ...Typography.subtitle,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  brandItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  brandName: {
    ...Typography.body,
    color: Colors.light.text,
  },
  brandCount: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
  },
});
