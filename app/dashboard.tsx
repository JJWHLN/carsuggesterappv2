import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { Button } from '@/components/ui/Button';
import { ModernButton } from '@/components/ui/ModernButton';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { CarCard } from '@/components/CarCard';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { Spacing, Typography, BorderRadius } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { Car as CarType } from '@/types/database';
import { formatPrice } from '@/utils/dataTransformers';
import { BookmarkService } from '@/services/featureServices';
import { notificationService, NotificationPreferences } from '@/services/NotificationService';
import {
  User,
  Heart,
  Search,
  Eye,
  TrendingUp,
  Clock,
  Settings,
  Star,
  Calendar,
  MapPin,
  DollarSign,
  Filter,
  CheckCircle,
  Info,
  Share,
} from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');

interface UserActivity {
  totalViews: number;
  totalSearches: number;
  totalBookmarks: number;
  totalComparisons: number;
  averageSessionTime: number;
  lastActive: string;
  favoriteCategory: string;
  averagePriceRange: { min: number; max: number };
}

interface SavedSearch {
  id: string;
  query: string;
  filters: Record<string, any>;
  createdAt: string;
  lastNotified?: string;
  newMatches: number;
  isActive: boolean;
}

interface RecentActivity {
  id: string;
  type: 'view' | 'search' | 'bookmark' | 'comparison';
  title: string;
  description: string;
  timestamp: string;
  carId?: string;
  data?: any;
}

interface PriceAlert {
  id: string;
  carId: string;
  carTitle: string;
  originalPrice: number;
  targetPrice: number;
  isActive: boolean;
  createdAt: string;
}

export default function PersonalizationDashboard() {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data state
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<CarType[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences | null>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'searches' | 'alerts' | 'settings'>('overview');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    activity: true,
    recommendations: true,
    searches: false,
    alerts: false,
  });

  const styles = useMemo(() => getStyles(colors), [colors]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      if (!user) return;

      // Load all dashboard data in parallel
      await Promise.all([
        loadUserActivity(),
        loadRecentlyViewed(),
        loadSavedSearches(),
        loadRecentActivity(),
        loadPriceAlerts(),
        loadNotificationPreferences(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadUserActivity = async () => {
    try {
      // Mock user activity data - TODO: Replace with real analytics
      const mockActivity: UserActivity = {
        totalViews: 127,
        totalSearches: 45,
        totalBookmarks: 12,
        totalComparisons: 8,
        averageSessionTime: 385, // seconds
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        favoriteCategory: 'SUV',
        averagePriceRange: { min: 15000, max: 35000 },
      };
      
      setUserActivity(mockActivity);
    } catch (error) {
      console.error('Error loading user activity:', error);
    }
  };

  const loadRecentlyViewed = async () => {
    try {
      // Mock recently viewed cars - TODO: Replace with real data
      const mockRecentlyViewed: CarType[] = [
        {
          id: '1',
          make: 'Toyota',
          model: 'Camry',
          year: 2023,
          price: 28500,
          mileage: 15000,
          condition: 'used',
          fuel_type: 'gasoline',
          transmission: 'Automatic',
          location: 'Los Angeles, CA',
          images: ['https://images.pexels.com/photos/1007410/pexels-photo-1007410.jpeg?auto=compress&cs=tinysrgb&w=400'],
          description: 'Well-maintained Toyota Camry',
          dealer: { name: 'Premium Auto', verified: true },
          features: ['Bluetooth', 'Backup Camera'],
          created_at: new Date().toISOString(),
        },
      ];
      
      setRecentlyViewed(mockRecentlyViewed);
    } catch (error) {
      console.error('Error loading recently viewed:', error);
    }
  };

  const loadSavedSearches = async () => {
    try {
      // Mock saved searches - TODO: Replace with real data
      const mockSavedSearches: SavedSearch[] = [
        {
          id: '1',
          query: 'Toyota SUV under $30k',
          filters: { make: 'Toyota', maxPrice: 30000, bodyType: 'SUV' },
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          newMatches: 3,
          isActive: true,
        },
        {
          id: '2',
          query: 'Honda Civic 2020-2023',
          filters: { make: 'Honda', model: 'Civic', yearMin: 2020, yearMax: 2023 },
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          newMatches: 1,
          isActive: true,
        },
      ];
      
      setSavedSearches(mockSavedSearches);
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      // Mock recent activity - TODO: Replace with real data
      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'bookmark',
          title: 'Bookmarked 2023 Toyota Camry',
          description: '$28,500 • 15K miles',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          carId: '1',
        },
        {
          id: '2',
          type: 'search',
          title: 'Searched for "Honda Civic"',
          description: '12 results found',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '3',
          type: 'comparison',
          title: 'Compared 3 cars',
          description: 'Toyota Camry vs Honda Accord vs Nissan Altima',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        },
      ];
      
      setRecentActivity(mockActivity);
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const loadPriceAlerts = async () => {
    try {
      // Mock price alerts - TODO: Replace with real data
      const mockAlerts: PriceAlert[] = [
        {
          id: '1',
          carId: '1',
          carTitle: '2023 Toyota Camry',
          originalPrice: 28500,
          targetPrice: 26000,
          isActive: true,
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];
      
      setPriceAlerts(mockAlerts);
    } catch (error) {
      console.error('Error loading price alerts:', error);
    }
  };

  const loadNotificationPreferences = async () => {
    try {
      if (!user) return;
      
      const preferences = await notificationService.getNotificationPreferences(user.id);
      setNotificationPreferences(preferences);
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  }, []);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatSessionTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'view': return <Eye color={colors.primary} size={16} />;
      case 'search': return <Search color={colors.primary} size={16} />;
      case 'bookmark': return <Heart color={colors.primary} size={16} />;
      case 'comparison': return <TrendingUp color={colors.primary} size={16} />;
      default: return <Info color={colors.primary} size={16} />;
    }
  };

  const getTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const handleUpdateNotificationPreferences = async (key: keyof NotificationPreferences, value: any) => {
    try {
      if (!user || !notificationPreferences) return;
      
      const updatedPreferences = { ...notificationPreferences, [key]: value };
      await notificationService.updateNotificationPreferences(user.id, updatedPreferences);
      setNotificationPreferences(updatedPreferences);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      Alert.alert('Error', 'Failed to update notification preferences.');
    }
  };

  const renderOverviewTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* User Stats */}
      <Card style={styles.statsCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Your Activity Overview
        </Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.primaryLight }]}>
              <Eye color={colors.primary} size={20} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {userActivity?.totalViews || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Cars Viewed
            </Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.primaryLight }]}>
              <Search color={colors.primary} size={20} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {userActivity?.totalSearches || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Searches
            </Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.primaryLight }]}>
              <Heart color={colors.primary} size={20} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {userActivity?.totalBookmarks || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Favorites
            </Text>
          </View>

          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: colors.primaryLight }]}>
              <TrendingUp color={colors.primary} size={20} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {userActivity?.totalComparisons || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Comparisons
            </Text>
          </View>
        </View>

        <View style={styles.additionalStats}>
          <View style={styles.additionalStatItem}>
            <Clock color={colors.textSecondary} size={16} />
            <Text style={[styles.additionalStatText, { color: colors.textSecondary }]}>
              Avg. session: {userActivity ? formatSessionTime(userActivity.averageSessionTime) : '0m 0s'}
            </Text>
          </View>
          
          <View style={styles.additionalStatItem}>
            <TrendingUp color={colors.textSecondary} size={16} />
            <Text style={[styles.additionalStatText, { color: colors.textSecondary }]}>
              Favorite: {userActivity?.favoriteCategory || 'None'}
            </Text>
          </View>
        </View>
      </Card>

      {/* Recently Viewed Cars */}
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Recently Viewed
          </Text>
          <TouchableOpacity onPress={() => router.push('/favorites')}>
            <Text style={[styles.sectionAction, { color: colors.primary }]}>
              View All
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.horizontalList}>
            {recentlyViewed.map((car) => (
              <View key={car.id} style={styles.horizontalCarItem}>
                <CarCard 
                  car={car} 
                  onPress={() => router.push(`/car/${car.id}`)}
                />
              </View>
            ))}
            
            {recentlyViewed.length === 0 && (
              <View style={styles.emptyState}>
                <Eye color={colors.textSecondary} size={48} />
                <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                  No recently viewed cars
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.quickActionsCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Quick Actions
        </Text>
        
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/search')}
          >
            <Search color={colors.primary} size={24} />
            <Text style={[styles.quickActionText, { color: colors.text }]}>
              Search Cars
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/favorites')}
          >
            <Heart color={colors.primary} size={24} />
            <Text style={[styles.quickActionText, { color: colors.text }]}>
              My Favorites
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => setActiveTab('alerts')}
          >
            <Star color={colors.primary} size={24} />
            <Text style={[styles.quickActionText, { color: colors.text }]}>
              Price Alerts
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => setActiveTab('settings')}
          >
            <Settings color={colors.primary} size={24} />
            <Text style={[styles.quickActionText, { color: colors.text }]}>
              Settings
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );

  const renderActivityTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recent Activity
        </Text>
        
        <View style={styles.activityList}>
          {recentActivity.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                {getActivityIcon(activity.type)}
              </View>
              
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: colors.text }]}>
                  {activity.title}
                </Text>
                <Text style={[styles.activityDescription, { color: colors.textSecondary }]}>
                  {activity.description}
                </Text>
              </View>
              
              <Text style={[styles.activityTime, { color: colors.textSecondary }]}>
                {getTimeAgo(activity.timestamp)}
              </Text>
            </View>
          ))}
          
          {recentActivity.length === 0 && (
            <View style={styles.emptyState}>
              <Eye color={colors.textSecondary} size={48} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                No recent activity
              </Text>
            </View>
          )}
        </View>
      </Card>
    </ScrollView>
  );

  const renderSearchesTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Card style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Saved Searches
          </Text>
          <TouchableOpacity onPress={() => router.push('/search')}>
            <Text style={[styles.sectionAction, { color: colors.primary }]}>
              New Search
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.savedSearchesList}>
          {savedSearches.map((search) => (
            <View key={search.id} style={[styles.savedSearchItem, { borderColor: colors.border }]}>
              <View style={styles.savedSearchHeader}>
                <Text style={[styles.savedSearchQuery, { color: colors.text }]}>
                  {search.query}
                </Text>
                <Switch
                  value={search.isActive}
                  onValueChange={(value) => {
                    // TODO: Update search active status
                    console.log('Toggle search active:', search.id, value);
                  }}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={search.isActive ? colors.primary : colors.textSecondary}
                />
              </View>
              
              <Text style={[styles.savedSearchDate, { color: colors.textSecondary }]}>
                Created {getTimeAgo(search.createdAt)}
              </Text>
              
              {search.newMatches > 0 && (
                <View style={[styles.newMatchesBadge, { backgroundColor: colors.primaryLight }]}>
                  <Text style={[styles.newMatchesText, { color: colors.primary }]}>
                    {search.newMatches} new match{search.newMatches !== 1 ? 'es' : ''}
                  </Text>
                </View>
              )}
              
              <View style={styles.savedSearchActions}>
                <TouchableOpacity style={styles.savedSearchAction}>
                  <Settings color={colors.textSecondary} size={16} />
                  <Text style={[styles.savedSearchActionText, { color: colors.textSecondary }]}>
                    Edit
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.savedSearchAction}>
                  <Info color={colors.error} size={16} />
                  <Text style={[styles.savedSearchActionText, { color: colors.error }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          
          {savedSearches.length === 0 && (
            <View style={styles.emptyState}>
              <Search color={colors.textSecondary} size={48} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                No saved searches
              </Text>
              <Button
                title="Create First Search"
                onPress={() => router.push('/search')}
                variant="primary"
                style={styles.emptyStateButton}
              />
            </View>
          )}
        </View>
      </Card>
    </ScrollView>
  );

  const renderAlertsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Price Alerts
        </Text>
        
        <View style={styles.priceAlertsList}>
          {priceAlerts.map((alert) => (
            <View key={alert.id} style={[styles.priceAlertItem, { borderColor: colors.border }]}>
              <View style={styles.priceAlertHeader}>
                <Text style={[styles.priceAlertTitle, { color: colors.text }]}>
                  {alert.carTitle}
                </Text>
                <Switch
                  value={alert.isActive}
                  onValueChange={(value) => {
                    // TODO: Update alert active status
                    console.log('Toggle alert active:', alert.id, value);
                  }}
                  trackColor={{ false: colors.border, true: colors.primaryLight }}
                  thumbColor={alert.isActive ? colors.primary : colors.textSecondary}
                />
              </View>
              
              <View style={styles.priceAlertDetails}>
                <Text style={[styles.priceAlertText, { color: colors.textSecondary }]}>
                  Current: {formatPrice(alert.originalPrice)}
                </Text>
                <Text style={[styles.priceAlertText, { color: colors.textSecondary }]}>
                  Target: {formatPrice(alert.targetPrice)}
                </Text>
              </View>
              
              <Text style={[styles.priceAlertDate, { color: colors.textSecondary }]}>
                Created {getTimeAgo(alert.createdAt)}
              </Text>
            </View>
          ))}
          
          {priceAlerts.length === 0 && (
            <View style={styles.emptyState}>
              <Star color={colors.textSecondary} size={48} />
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                No price alerts
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                Save cars to get notified when prices drop
              </Text>
            </View>
          )}
        </View>
      </Card>
    </ScrollView>
  );

  const renderSettingsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Notification Preferences
        </Text>
        
        {notificationPreferences && (
          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Price Drop Alerts
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Get notified when saved cars drop in price
                </Text>
              </View>
              <Switch
                value={notificationPreferences.priceDropAlerts}
                onValueChange={(value) => handleUpdateNotificationPreferences('priceDropAlerts', value)}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={notificationPreferences.priceDropAlerts ? colors.primary : colors.textSecondary}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  New Car Matches
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Get notified when new cars match your searches
                </Text>
              </View>
              <Switch
                value={notificationPreferences.newCarMatches}
                onValueChange={(value) => handleUpdateNotificationPreferences('newCarMatches', value)}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={notificationPreferences.newCarMatches ? colors.primary : colors.textSecondary}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Saved Search Alerts
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Get notified about your saved searches
                </Text>
              </View>
              <Switch
                value={notificationPreferences.savedSearchAlerts}
                onValueChange={(value) => handleUpdateNotificationPreferences('savedSearchAlerts', value)}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={notificationPreferences.savedSearchAlerts ? colors.primary : colors.textSecondary}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: colors.text }]}>
                  Email Notifications
                </Text>
                <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                  Receive notifications via email
                </Text>
              </View>
              <Switch
                value={notificationPreferences.emailNotifications}
                onValueChange={(value) => handleUpdateNotificationPreferences('emailNotifications', value)}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={notificationPreferences.emailNotifications ? colors.primary : colors.textSecondary}
              />
            </View>
          </View>
        )}
      </Card>

      <Card style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Account Actions
        </Text>
        
        <View style={styles.actionsList}>
          <TouchableOpacity style={styles.actionItem}>
            <Share color={colors.primary} size={20} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              Share App
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Info color={colors.primary} size={20} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              Send Feedback
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Info color={colors.primary} size={20} />
            <Text style={[styles.actionText, { color: colors.text }]}>
              About App
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverviewTab();
      case 'activity': return renderActivityTab();
      case 'searches': return renderSearchesTab();
      case 'alerts': return renderAlertsTab();
      case 'settings': return renderSettingsTab();
      default: return renderOverviewTab();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSpinner size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Dashboard
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Welcome back, {user?.user_metadata?.name || 'User'}!
          </Text>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabNavigation, { borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabContainer}>
            {[
              { key: 'overview', label: 'Overview', icon: TrendingUp },
              { key: 'activity', label: 'Activity', icon: Eye },
              { key: 'searches', label: 'Searches', icon: Search },
              { key: 'alerts', label: 'Alerts', icon: Star },
              { key: 'settings', label: 'Settings', icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.tab,
                    isActive && { borderBottomColor: colors.primary }
                  ]}
                  onPress={() => setActiveTab(tab.key as any)}
                >
                  <Icon 
                    color={isActive ? colors.primary : colors.textSecondary} 
                    size={16} 
                  />
                  <Text style={[
                    styles.tabLabel,
                    { color: isActive ? colors.primary : colors.textSecondary }
                  ]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
        >
          {renderTabContent()}
        </RefreshControl>
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  headerContent: {
    gap: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabNavigation: {
    borderBottomWidth: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginRight: Spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  statsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    minWidth: (width - 4 * Spacing.lg) / 4,
    gap: 8,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  additionalStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  additionalStatText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionAction: {
    fontSize: 16,
    fontWeight: '600',
  },
  horizontalList: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  horizontalCarItem: {
    width: 280,
  },
  quickActionsCard: {
    padding: Spacing.lg,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  quickAction: {
    alignItems: 'center',
    gap: 8,
    minWidth: (width - 5 * Spacing.lg) / 4,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  activityList: {
    gap: Spacing.md,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
    gap: 4,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  activityDescription: {
    fontSize: 14,
  },
  activityTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  savedSearchesList: {
    gap: Spacing.md,
  },
  savedSearchItem: {
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  savedSearchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savedSearchQuery: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  savedSearchDate: {
    fontSize: 14,
  },
  newMatchesBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newMatchesText: {
    fontSize: 12,
    fontWeight: '600',
  },
  savedSearchActions: {
    flexDirection: 'row',
    gap: Spacing.lg,
    marginTop: Spacing.sm,
  },
  savedSearchAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  savedSearchActionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  priceAlertsList: {
    gap: Spacing.md,
  },
  priceAlertItem: {
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  priceAlertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceAlertTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  priceAlertDetails: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  priceAlertText: {
    fontSize: 14,
  },
  priceAlertDate: {
    fontSize: 12,
  },
  settingsList: {
    gap: Spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  settingInfo: {
    flex: 1,
    gap: 4,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 14,
  },
  actionsList: {
    gap: Spacing.lg,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.lg,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyStateButton: {
    marginTop: Spacing.md,
    minWidth: 200,
  },
});
