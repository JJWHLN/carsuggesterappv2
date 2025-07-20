import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useTheme';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { socialService, SocialActivity, CarReview, CarComparison, UserProfile } from '@/services/socialService';
import { realTimeChatService } from '@/services/realTimeChatService';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';

import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageCircle, Star, TrendingUp, Users, Car, Calendar, MapPin, DollarSign, Zap, Award, Eye, Clock, CheckCircle, Filter, Search, User } from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');

interface SocialFeedProps {
  filterType?: 'all' | 'following' | 'reviews' | 'comparisons' | 'activity';
  carId?: string; // For car-specific feeds
  userId?: string; // For user-specific feeds
}

interface SocialFeedItemProps {
  activity: SocialActivity;
  onLike: (activityId: string) => void;
  onComment: (activityId: string) => void;
  onShare: (activityId: string) => void;
  onUserPress: (userId: string) => void;
  onCarPress: (carId: string) => void;
}

const SocialFeedItem: React.FC<SocialFeedItemProps> = ({
  activity,
  onLike,
  onComment,
  onShare,
  onUserPress,
  onCarPress,
}) => {
  const { colors } = useThemeColors();
  const { cards, spacing } = useDesignTokens();
  
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [showFullContent, setShowFullContent] = useState(false);

  const handleLike = useCallback(() => {
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    onLike(activity.id);
  }, [isLiked, activity.id, onLike]);

  const renderActivityContent = () => {
    switch (activity.type) {
      case 'review':
        return (
          <View style={styles.reviewContent}>
            <View style={styles.reviewHeader}>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    color={star <= (activity.metadata?.rating || 0) ? colors.warning : colors.border}
                    fill={star <= (activity.metadata?.rating || 0) ? colors.warning : 'transparent'}
                  />
                ))}
                <Text style={[styles.ratingText, { color: colors.text }]}>
                  {activity.metadata?.rating}/5
                </Text>
              </View>
              {activity.metadata?.verified_purchase && (
                <View style={[styles.verifiedBadge, { backgroundColor: colors.success }]}>
                  <CheckCircle size={12} color={colors.white} />
                  <Text style={[styles.verifiedText, { color: colors.white }]}>
                    Verified Purchase
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={[styles.reviewTitle, { color: colors.text }]}>
              {activity.metadata?.title || 'Car Review'}
            </Text>
            
            <Text
              style={[styles.reviewContentText, { color: colors.textSecondary }]}
              numberOfLines={showFullContent ? undefined : 3}
            >
              {activity.metadata?.content || 'No review content available'}
            </Text>
            
            {activity.metadata?.content && activity.metadata.content.length > 100 && (
              <TouchableOpacity onPress={() => setShowFullContent(!showFullContent)}>
                <Text style={[styles.readMoreText, { color: colors.primary }]}>
                  {showFullContent ? 'Show less' : 'Read more'}
                </Text>
              </TouchableOpacity>
            )}

            {activity.metadata?.car_details && (
              <TouchableOpacity
                style={[styles.carInfoContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => onCarPress(activity.metadata.car_id)}
              >
                <View style={styles.carInfoContent}>
                  <Car size={20} color={colors.primary} />
                  <View style={styles.carInfoText}>
                    <Text style={[styles.carTitle, { color: colors.text }]}>
                      {activity.metadata.car_details.make} {activity.metadata.car_details.model}
                    </Text>
                    <Text style={[styles.carSubtitle, { color: colors.textSecondary }]}>
                      {activity.metadata.car_details.year} • ${activity.metadata.car_details.price?.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'comparison':
        return (
          <View style={styles.comparisonContent}>
            <Text style={[styles.comparisonTitle, { color: colors.text }]}>
              {activity.metadata?.title || 'Car Comparison'}
            </Text>
            
            <View style={styles.comparisonCars}>
              {activity.metadata?.cars?.slice(0, 3).map((carId: string, index: number) => (
                <TouchableOpacity
                  key={carId}
                  style={[styles.comparisonCarChip, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => onCarPress(carId)}
                >
                  <Car size={16} color={colors.primary} />
                  <Text style={[styles.comparisonCarText, { color: colors.text }]}>
                    Car {index + 1}
                  </Text>
                </TouchableOpacity>
              ))}
              {activity.metadata?.cars?.length > 3 && (
                <View style={[styles.comparisonCarChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[styles.comparisonCarText, { color: colors.textSecondary }]}>
                    +{activity.metadata.cars.length - 3} more
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.comparisonStats}>
              <View style={styles.comparisonStat}>
                <TrendingUp size={16} color={colors.success} />
                <Text style={[styles.comparisonStatText, { color: colors.success }]}>
                  {activity.metadata?.winner || 'Analysis Complete'}
                </Text>
              </View>
              <View style={styles.comparisonStat}>
                <Eye size={16} color={colors.textSecondary} />
                <Text style={[styles.comparisonStatText, { color: colors.textSecondary }]}>
                  {activity.metadata?.views || 0} views
                </Text>
              </View>
            </View>
          </View>
        );

      case 'follow':
        return (
          <View style={styles.followContent}>
            <View style={styles.followAction}>
              <UserPlus size={20} color={colors.primary} />
              <Text style={[styles.followText, { color: colors.text }]}>
                Started following{' '}
                <Text style={[styles.followUsername, { color: colors.primary }]}>
                  {activity.metadata?.target_username || 'a user'}
                </Text>
              </Text>
            </View>
          </View>
        );

      case 'car_interest':
        return (
          <View style={styles.carInterestContent}>
            <View style={styles.carInterestHeader}>
              <Heart size={20} color={colors.error} />
              <Text style={[styles.carInterestText, { color: colors.text }]}>
                Interested in this car
              </Text>
            </View>
            
            {activity.metadata?.car_details && (
              <TouchableOpacity
                style={[styles.carInfoContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => onCarPress(activity.metadata.car_id)}
              >
                <View style={styles.carInfoContent}>
                  <Car size={20} color={colors.primary} />
                  <View style={styles.carInfoText}>
                    <Text style={[styles.carTitle, { color: colors.text }]}>
                      {activity.metadata.car_details.make} {activity.metadata.car_details.model}
                    </Text>
                    <Text style={[styles.carSubtitle, { color: colors.textSecondary }]}>
                      {activity.metadata.car_details.year} • ${activity.metadata.car_details.price?.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>
        );

      case 'price_watch':
        return (
          <View style={styles.priceWatchContent}>
            <View style={styles.priceWatchHeader}>
              <AlertCircle size={20} color={colors.warning} />
              <Text style={[styles.priceWatchText, { color: colors.text }]}>
                Price Alert: {activity.metadata?.alert_type || 'Price Drop'}
              </Text>
            </View>
            
            <View style={styles.priceChangeContainer}>
              <View style={styles.priceChange}>
                <Text style={[styles.oldPrice, { color: colors.textSecondary }]}>
                  ${activity.metadata?.old_price?.toLocaleString()}
                </Text>
                <Text style={[styles.newPrice, { color: colors.success }]}>
                  ${activity.metadata?.new_price?.toLocaleString()}
                </Text>
              </View>
              <View style={[styles.savingsContainer, { backgroundColor: colors.primaryLight }]}>
                <Text style={[styles.savingsText, { color: colors.primary }]}>
                  Save ${(activity.metadata?.old_price - activity.metadata?.new_price)?.toLocaleString()}
                </Text>
              </View>
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.defaultContent}>
            <Text style={[styles.defaultText, { color: colors.text }]}>
              {activity.metadata?.description || 'New activity'}
            </Text>
          </View>
        );
    }
  };

  const getActivityIcon = () => {
    switch (activity.type) {
      case 'review':
        return <Star size={20} color={colors.warning} />;
      case 'comparison':
        return <TrendingUp size={20} color={colors.primary} />;
      case 'follow':
        return <UserPlus size={20} color={colors.success} />;
      case 'car_interest':
        return <Heart size={20} color={colors.error} />;
      case 'price_watch':
        return <DollarSign size={20} color={colors.warning} />;
      default:
        return <Zap size={20} color={colors.primary} />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return activityTime.toLocaleDateString();
  };

  return (
    <View style={[styles.feedItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.feedItemHeader}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => onUserPress(activity.user_id)}
        >
          <View style={[styles.avatar, { backgroundColor: colors.surface }]}>
            {activity.user_profile?.avatar_url ? (
              <Image source={{ uri: activity.user_profile.avatar_url }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: colors.text }]}>
                {activity.user_profile?.display_name?.charAt(0) || '?'}
              </Text>
            )}
          </View>
          <View style={styles.userDetails}>
            <View style={styles.userNameContainer}>
              <Text style={[styles.username, { color: colors.text }]}>
                {activity.user_profile?.display_name || 'Unknown User'}
              </Text>
              {activity.user_profile?.verified_buyer && (
                <CheckCircle size={14} color={colors.success} />
              )}
            </View>
            <View style={styles.activityMeta}>
              {getActivityIcon()}
              <Text style={[styles.activityType, { color: colors.textSecondary }]}>
                {activity.type.replace('_', ' ')}
              </Text>
              <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                • {getTimeAgo(activity.created_at)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuButton}>
          <MoreHorizontal size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.feedItemContent}>
        {renderActivityContent()}
      </View>

      {/* Actions */}
      <View style={styles.feedItemActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleLike}
        >
          <Heart
            size={18}
            color={isLiked ? colors.error : colors.textSecondary}
            fill={isLiked ? colors.error : 'transparent'}
          />
          <Text style={[styles.actionText, { color: isLiked ? colors.error : colors.textSecondary }]}>
            {likeCount > 0 ? likeCount : 'Like'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onComment(activity.id)}
        >
          <MessageCircle size={18} color={colors.textSecondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            Comment
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onShare(activity.id)}
        >
          <Share2 size={18} color={colors.textSecondary} />
          <Text style={[styles.actionText, { color: colors.textSecondary }]}>
            Share
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const SocialFeed: React.FC<SocialFeedProps> = ({
  filterType = 'all',
  carId,
  userId,
}) => {
  const { colors } = useThemeColors();
  const { spacing } = useDesignTokens();
  const { user } = useAuth();
  
  const [activities, setActivities] = useState<SocialActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState(filterType);

  const filters = [
    { id: 'all', label: 'All Activity', icon: Zap },
    { id: 'following', label: 'Following', icon: Users },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'comparisons', label: 'Comparisons', icon: TrendingUp },
    { id: 'activity', label: 'My Activity', icon: User },
  ];

  const loadActivities = useCallback(async (pageNum = 1, refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const options = {
        page: pageNum,
        limit: 20,
        types: activeFilter === 'all' ? undefined : [activeFilter],
        following_only: activeFilter === 'following',
      };

      const newActivities = await socialService.getSocialActivityFeed(options);
      
      if (refresh || pageNum === 1) {
        setActivities(newActivities);
      } else {
        setActivities(prev => [...prev, ...newActivities]);
      }
      
      setHasMore(newActivities.length === 20);
      setPage(pageNum);
    } catch (error) {
      logger.error('Error loading activities:', error);
      Alert.alert('Error', 'Failed to load social activities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    loadActivities(1, true);
  }, [loadActivities]);

  const handleRefresh = useCallback(() => {
    loadActivities(1, true);
  }, [loadActivities]);

  const handleLoadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadActivities(page + 1);
    }
  }, [loading, hasMore, page, loadActivities]);

  const handleLike = useCallback(async (activityId: string) => {
    try {
      // TODO: Implement like functionality
      logger.debug('Like activity:', activityId);
    } catch (error) {
      logger.error('Error liking activity:', error);
    }
  }, []);

  const handleComment = useCallback(async (activityId: string) => {
    try {
      // TODO: Navigate to comments screen
      logger.debug('Comment on activity:', activityId);
    } catch (error) {
      logger.error('Error commenting on activity:', error);
    }
  }, []);

  const handleShare = useCallback(async (activityId: string) => {
    try {
      // TODO: Implement share functionality
      logger.debug('Share activity:', activityId);
    } catch (error) {
      logger.error('Error sharing activity:', error);
    }
  }, []);

  const handleUserPress = useCallback((userId: string) => {
    // TODO: Navigate to user profile
    logger.debug('View user profile:', userId);
  }, []);

  const handleCarPress = useCallback((carId: string) => {
    // TODO: Navigate to car details
    logger.debug('View car details:', carId);
  }, []);

  const filteredActivities = useMemo(() => {
    if (carId) {
      return activities.filter(activity => 
        activity.metadata?.car_id === carId
      );
    }
    if (userId) {
      return activities.filter(activity => 
        activity.user_id === userId
      );
    }
    return activities;
  }, [activities, carId, userId]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text }]}>
            {carId ? 'Car Activity' : userId ? 'User Activity' : 'Social Feed'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Stay connected with the car community
          </Text>
        </View>
        
        <TouchableOpacity style={styles.searchButton}>
          <Search size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Filters */}
      {!carId && !userId && (
        <View style={styles.filtersContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          >
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: activeFilter === filter.id ? colors.primary : colors.surface,
                    borderColor: activeFilter === filter.id ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => {
                  setActiveFilter(filter.id as typeof activeFilter);
                  setPage(1);
                }}
              >
                <filter.icon
                  size={16}
                  color={activeFilter === filter.id ? colors.white : colors.textSecondary}
                />
                <Text style={[
                  styles.filterText,
                  {
                    color: activeFilter === filter.id ? colors.white : colors.textSecondary,
                  }
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Feed */}
      <ScrollView
        style={styles.feed}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        onMomentumScrollEnd={(event) => {
          const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
          const paddingToBottom = 20;
          if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
            handleLoadMore();
          }
        }}
      >
        {filteredActivities.map((activity) => (
          <SocialFeedItem
            key={activity.id}
            activity={activity}
            onLike={handleLike}
            onComment={handleComment}
            onShare={handleShare}
            onUserPress={handleUserPress}
            onCarPress={handleCarPress}
          />
        ))}
        
        {loading && activities.length === 0 && (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading social activities...
            </Text>
          </View>
        )}
        
        {!loading && filteredActivities.length === 0 && (
          <View style={styles.emptyContainer}>
            <Users size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No activities yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Follow users and interact with cars to see activities here
            </Text>
          </View>
        )}
      </ScrollView>
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...Typography.pageTitle,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Typography.bodyText,
    lineHeight: 20,
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filtersContainer: {
    paddingVertical: Spacing.md,
  },
  filtersContent: {
    paddingHorizontal: Spacing.lg,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    marginRight: Spacing.sm,
    ...Shadows.small,
  },
  filterText: {
    ...Typography.bodySmall,
    fontWeight: '500',
    marginLeft: Spacing.xs,
  },
  feed: {
    flex: 1,
  },
  feedItem: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    ...Shadows.card,
  },
  feedItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  userDetails: {
    flex: 1,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    ...Typography.bodyLarge,
    fontWeight: '600',
    marginRight: Spacing.xs,
  },
  activityMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs / 2,
  },
  activityType: {
    ...Typography.bodySmall,
    marginLeft: Spacing.xs,
    textTransform: 'capitalize',
  },
  timestamp: {
    ...Typography.bodySmall,
    marginLeft: Spacing.xs,
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedItemContent: {
    marginBottom: Spacing.md,
  },
  reviewContent: {
    gap: Spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
  },
  ratingText: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginLeft: Spacing.xs,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs / 2,
  },
  verifiedText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  reviewTitle: {
    ...Typography.cardTitle,
    fontWeight: '600',
  },
  reviewContentText: {
    ...Typography.bodyText,
    lineHeight: 22,
  },
  readMoreText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  carInfoContainer: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    marginTop: Spacing.xs,
  },
  carInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  carInfoText: {
    flex: 1,
  },
  carTitle: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  carSubtitle: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs / 2,
  },
  comparisonContent: {
    gap: Spacing.sm,
  },
  comparisonTitle: {
    ...Typography.cardTitle,
    fontWeight: '600',
  },
  comparisonCars: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  comparisonCarChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs / 2,
  },
  comparisonCarText: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  comparisonStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  comparisonStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
  },
  comparisonStatText: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  followContent: {
    gap: Spacing.sm,
  },
  followAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  followText: {
    ...Typography.bodyText,
  },
  followUsername: {
    fontWeight: '600',
  },
  carInterestContent: {
    gap: Spacing.sm,
  },
  carInterestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  carInterestText: {
    ...Typography.bodyText,
    fontWeight: '500',
  },
  priceWatchContent: {
    gap: Spacing.sm,
  },
  priceWatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  priceWatchText: {
    ...Typography.bodyText,
    fontWeight: '600',
  },
  priceChangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceChange: {
    gap: Spacing.xs / 2,
  },
  oldPrice: {
    ...Typography.bodySmall,
    textDecorationLine: 'line-through',
  },
  newPrice: {
    ...Typography.bodyLarge,
    fontWeight: '700',
  },
  savingsContainer: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  savingsText: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  defaultContent: {
    padding: Spacing.sm,
  },
  defaultText: {
    ...Typography.bodyText,
  },
  feedItemActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  actionText: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    ...Typography.bodyText,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.cardTitle,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.bodyText,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default SocialFeed;
