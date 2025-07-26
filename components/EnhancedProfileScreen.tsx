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
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/hooks/useTheme';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import {
  socialService,
  UserProfile,
  SocialActivity,
  CarReview,
} from '@/services/socialService';
import { realTimeChatService } from '@/services/realTimeChatService';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';

import { useAuth } from '@/contexts/AuthContext';
import { SocialFeed } from './SocialFeed';
import {
  MessageCircle,
  Star,
  Heart,
  Users,
  Car,
  MapPin,
  Calendar,
  Award,
  TrendingUp,
  Settings,
  Mail,
  CheckCircle,
  Eye,
  Clock,
  Filter,
} from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');

interface EnhancedProfileScreenProps {
  userId?: string; // If not provided, shows current user's profile
  onBack?: () => void;
  onMessageUser?: (userId: string) => void;
  onCarPress?: (carId: string) => void;
}

interface ProfileStatsProps {
  userProfile: UserProfile;
  isOwnProfile: boolean;
  onFollowersPress: () => void;
  onFollowingPress: () => void;
}

interface ProfileHeaderProps {
  userProfile: UserProfile;
  isOwnProfile: boolean;
  isFollowing: boolean;
  onFollowToggle: () => void;
  onMessagePress: () => void;
  onEditPress: () => void;
  onSharePress: () => void;
}

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  reviewCount: number;
  activityCount: number;
  carsOwnedCount: number;
}

const ProfileStats: React.FC<ProfileStatsProps> = ({
  userProfile,
  isOwnProfile,
  onFollowersPress,
  onFollowingPress,
}) => {
  const { colors } = useThemeColors();

  const stats = [
    {
      id: 'reviews',
      label: 'Reviews',
      value: userProfile.social_stats?.reviews_written || 0,
      icon: Star,
      color: colors.warning,
    },
    {
      id: 'followers',
      label: 'Followers',
      value: userProfile.social_stats?.followers_count || 0,
      icon: Users,
      color: colors.primary,
      onPress: onFollowersPress,
    },
    {
      id: 'following',
      label: 'Following',
      value: userProfile.social_stats?.following_count || 0,
      icon: UserPlus,
      color: colors.primary,
      onPress: onFollowingPress,
    },
    {
      id: 'helpful',
      label: 'Helpful',
      value: userProfile.social_stats?.helpful_votes_received || 0,
      icon: ThumbsUp,
      color: colors.success,
    },
    {
      id: 'cars',
      label: 'Cars Owned',
      value: userProfile.cars_owned?.length || 0,
      icon: Car,
      color: colors.accentGreen,
    },
  ];

  return (
    <View style={styles.statsContainer}>
      {stats.map((stat) => (
        <TouchableOpacity
          key={stat.id}
          style={styles.statItem}
          onPress={stat.onPress}
          disabled={!stat.onPress}
        >
          <View
            style={[styles.statIcon, { backgroundColor: `${stat.color}15` }]}
          >
            <stat.icon size={20} color={stat.color} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {stat.value.toLocaleString()}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            {stat.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userProfile,
  isOwnProfile,
  isFollowing,
  onFollowToggle,
  onMessagePress,
  onEditPress,
  onSharePress,
}) => {
  const { colors } = useThemeColors();

  const formatMemberSince = (date: string) => {
    return new Date(date).getFullYear().toString();
  };

  return (
    <View style={styles.profileHeader}>
      <View style={styles.profileInfo}>
        <View
          style={[styles.profileAvatar, { backgroundColor: colors.surface }]}
        >
          {userProfile.avatar_url ? (
            <Image
              source={{ uri: userProfile.avatar_url }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={[styles.avatarText, { color: colors.text }]}>
              {userProfile.display_name.charAt(0)}
            </Text>
          )}
          {userProfile.verified_buyer && (
            <View
              style={[
                styles.verifiedBadge,
                { backgroundColor: colors.success },
              ]}
            >
              <CheckCircle size={14} color={colors.white} />
            </View>
          )}
        </View>

        <View style={styles.profileDetails}>
          <View style={styles.nameContainer}>
            <Text style={[styles.profileName, { color: colors.text }]}>
              {userProfile.display_name}
            </Text>
            {userProfile.verified_buyer && (
              <Badge size={16} color={colors.success} />
            )}
          </View>

          {userProfile.location && (
            <View style={styles.locationContainer}>
              <MapPin size={14} color={colors.textSecondary} />
              <Text
                style={[styles.locationText, { color: colors.textSecondary }]}
              >
                {userProfile.location}
              </Text>
            </View>
          )}

          <View style={styles.memberSince}>
            <Calendar size={14} color={colors.textSecondary} />
            <Text
              style={[styles.memberSinceText, { color: colors.textSecondary }]}
            >
              Member since {formatMemberSince(userProfile.member_since)}
            </Text>
          </View>

          {userProfile.preferred_brands &&
            userProfile.preferred_brands.length > 0 && (
              <View style={styles.preferredBrands}>
                <Text
                  style={[
                    styles.preferredBrandsLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  Interested in:
                </Text>
                <View style={styles.brandsContainer}>
                  {userProfile.preferred_brands.slice(0, 3).map((brand) => (
                    <View
                      key={brand}
                      style={[
                        styles.brandChip,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.brandText, { color: colors.text }]}>
                        {brand}
                      </Text>
                    </View>
                  ))}
                  {userProfile.preferred_brands.length > 3 && (
                    <Text
                      style={[
                        styles.moreBrands,
                        { color: colors.textSecondary },
                      ]}
                    >
                      +{userProfile.preferred_brands.length - 3} more
                    </Text>
                  )}
                </View>
              </View>
            )}
        </View>
      </View>

      <View style={styles.profileActions}>
        {isOwnProfile ? (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.primaryButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={onEditPress}
          >
            <Edit size={16} color={colors.white} />
            <Text style={[styles.actionButtonText, { color: colors.white }]}>
              Edit Profile
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.actionButton,
                isFollowing ? styles.secondaryButton : styles.primaryButton,
                {
                  backgroundColor: isFollowing
                    ? colors.surface
                    : colors.primary,
                  borderColor: colors.border,
                },
              ]}
              onPress={onFollowToggle}
            >
              {isFollowing ? (
                <UserMinus size={16} color={colors.text} />
              ) : (
                <UserPlus size={16} color={colors.white} />
              )}
              <Text
                style={[
                  styles.actionButtonText,
                  { color: isFollowing ? colors.text : colors.white },
                ]}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.secondaryButton,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={onMessagePress}
            >
              <MessageCircle size={16} color={colors.text} />
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                Message
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.menuButton} onPress={onSharePress}>
          <Share2 size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ProfileTabs: React.FC<ProfileTabsProps> = ({
  activeTab,
  onTabChange,
  reviewCount,
  activityCount,
  carsOwnedCount,
}) => {
  const { colors } = useThemeColors();

  const tabs = [
    {
      id: 'activity',
      label: 'Activity',
      count: activityCount,
      icon: TrendingUp,
    },
    { id: 'reviews', label: 'Reviews', count: reviewCount, icon: Star },
    { id: 'cars', label: 'Cars Owned', count: carsOwnedCount, icon: Car },
    { id: 'about', label: 'About', icon: Users },
  ];

  return (
    <View
      style={[
        styles.tabsContainer,
        {
          backgroundColor: colors.cardBackground,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContent}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && {
                borderBottomColor: colors.primary,
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => onTabChange(tab.id)}
          >
            <View style={styles.tabContentInner}>
              <tab.icon
                size={18}
                color={
                  activeTab === tab.id ? colors.primary : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === tab.id
                        ? colors.primary
                        : colors.textSecondary,
                  },
                ]}
              >
                {tab.label}
              </Text>
              {tab.count !== undefined && (
                <View
                  style={[
                    styles.tabBadge,
                    {
                      backgroundColor:
                        activeTab === tab.id ? colors.primary : colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabBadgeText,
                      {
                        color:
                          activeTab === tab.id
                            ? colors.white
                            : colors.textSecondary,
                      },
                    ]}
                  >
                    {tab.count}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export const EnhancedProfileScreen: React.FC<EnhancedProfileScreenProps> = ({
  userId,
  onBack,
  onMessageUser,
  onCarPress,
}) => {
  const { colors } = useThemeColors();
  const { spacing } = useDesignTokens();
  const { user } = useAuth();

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState('activity');
  const [reviews, setReviews] = useState<CarReview[]>([]);
  const [activities, setActivities] = useState<SocialActivity[]>([]);

  const targetUserId = userId || user?.id || '';
  const isOwnProfile = !userId || userId === user?.id;

  const loadUserProfile = useCallback(async () => {
    try {
      const profile = await socialService.getUserProfile(targetUserId);
      setUserProfile(profile);

      if (!isOwnProfile) {
        // Check if following
        // TODO: Implement isFollowing check
        setIsFollowing(false);
      }
    } catch (error) {
      logger.error('Error loading user profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
    }
  }, [targetUserId, isOwnProfile]);

  const loadUserContent = useCallback(async () => {
    try {
      // Load user's reviews, activities, etc.
      // TODO: Implement user-specific content loading
      setReviews([]);
      setActivities([]);
    } catch (error) {
      logger.error('Error loading user content:', error);
    }
  }, [targetUserId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([loadUserProfile(), loadUserContent()]);
      setLoading(false);
    };

    loadData();
  }, [loadUserProfile, loadUserContent]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadUserProfile(), loadUserContent()]);
    setRefreshing(false);
  }, [loadUserProfile, loadUserContent]);

  const handleFollowToggle = useCallback(async () => {
    try {
      if (isFollowing) {
        await socialService.unfollowUser(targetUserId);
        setIsFollowing(false);
      } else {
        await socialService.followUser(targetUserId);
        setIsFollowing(true);
      }
      // Refresh profile to update follower counts
      loadUserProfile();
    } catch (error) {
      logger.error('Error toggling follow:', error);
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to update follow status',
      );
    }
  }, [isFollowing, targetUserId, loadUserProfile]);

  const handleMessagePress = useCallback(async () => {
    try {
      if (!userProfile) return;

      // Create a direct conversation
      const conversation = await realTimeChatService.createConversation({
        type: 'direct',
        title: `Chat with ${userProfile.display_name}`,
      });

      // Add the target user as a participant
      await realTimeChatService.addParticipant(
        conversation.id,
        targetUserId,
        'member',
      );

      onMessageUser?.(targetUserId);
    } catch (error) {
      logger.error('Error creating conversation:', error);
      Alert.alert('Error', 'Failed to start conversation');
    }
  }, [userProfile, targetUserId, onMessageUser]);

  const handleEditPress = useCallback(() => {
    // TODO: Navigate to edit profile screen
    logger.debug('Edit profile');
  }, []);

  const handleSharePress = useCallback(async () => {
    if (!userProfile) return;

    try {
      await Share.share({
        message: `Check out ${userProfile.display_name}'s profile on CarSuggester`,
        url: `https://carsuggester.app/profile/${targetUserId}`,
      });
    } catch (error) {
      logger.error('Error sharing profile:', error);
    }
  }, [userProfile, targetUserId]);

  const handleFollowersPress = useCallback(() => {
    // TODO: Navigate to followers screen
    logger.debug('Show followers');
  }, []);

  const handleFollowingPress = useCallback(() => {
    // TODO: Navigate to following screen
    logger.debug('Show following');
  }, []);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'activity':
        return <SocialFeed filterType="activity" userId={targetUserId} />;

      case 'reviews':
        return (
          <View style={styles.tabContent}>
            <Text
              style={[styles.comingSoonText, { color: colors.textSecondary }]}
            >
              Reviews content coming soon
            </Text>
          </View>
        );

      case 'cars':
        return (
          <View style={styles.tabContent}>
            {userProfile?.cars_owned && userProfile.cars_owned.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {userProfile.cars_owned.map((car, index) => (
                  <View
                    key={index}
                    style={[
                      styles.carOwnedItem,
                      {
                        backgroundColor: colors.cardBackground,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <View style={styles.carOwnedInfo}>
                      <Text
                        style={[styles.carOwnedTitle, { color: colors.text }]}
                      >
                        {car.make} {car.model}
                      </Text>
                      <Text
                        style={[
                          styles.carOwnedYear,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {car.year}
                      </Text>
                      <Text
                        style={[
                          styles.carOwnedPeriod,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {car.owned_from} - {car.owned_to || 'Present'}
                      </Text>
                    </View>
                    {car.verified && (
                      <View
                        style={[
                          styles.verifiedOwnership,
                          { backgroundColor: colors.success },
                        ]}
                      >
                        <CheckCircle size={14} color={colors.white} />
                        <Text
                          style={[styles.verifiedText, { color: colors.white }]}
                        >
                          Verified
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyState}>
                <Car size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyStateText, { color: colors.text }]}>
                  No cars owned yet
                </Text>
                <Text
                  style={[
                    styles.emptyStateSubtext,
                    { color: colors.textSecondary },
                  ]}
                >
                  {isOwnProfile
                    ? 'Add your car ownership history'
                    : "This user hasn't added any cars yet"}
                </Text>
              </View>
            )}
          </View>
        );

      case 'about':
        return (
          <View style={styles.aboutContent}>
            <View style={styles.aboutSection}>
              <Text style={[styles.aboutSectionTitle, { color: colors.text }]}>
                Profile Stats
              </Text>
              <View style={styles.aboutStats}>
                <View style={styles.aboutStat}>
                  <Text
                    style={[
                      styles.aboutStatLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Total Reviews
                  </Text>
                  <Text style={[styles.aboutStatValue, { color: colors.text }]}>
                    {userProfile?.total_reviews || 0}
                  </Text>
                </View>
                <View style={styles.aboutStat}>
                  <Text
                    style={[
                      styles.aboutStatLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Average Rating Given
                  </Text>
                  <View style={styles.ratingDisplay}>
                    <Star
                      size={16}
                      color={colors.warning}
                      fill={colors.warning}
                    />
                    <Text
                      style={[styles.aboutStatValue, { color: colors.text }]}
                    >
                      {userProfile?.average_rating_given?.toFixed(1) || '0.0'}
                    </Text>
                  </View>
                </View>
                <View style={styles.aboutStat}>
                  <Text
                    style={[
                      styles.aboutStatLabel,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Marketplace Interactions
                  </Text>
                  <Text style={[styles.aboutStatValue, { color: colors.text }]}>
                    {userProfile?.social_stats?.marketplace_interactions || 0}
                  </Text>
                </View>
              </View>
            </View>

            {userProfile?.preferred_brands &&
              userProfile.preferred_brands.length > 0 && (
                <View style={styles.aboutSection}>
                  <Text
                    style={[styles.aboutSectionTitle, { color: colors.text }]}
                  >
                    Preferred Brands
                  </Text>
                  <View style={styles.brandsGrid}>
                    {userProfile.preferred_brands.map((brand) => (
                      <View
                        key={brand}
                        style={[
                          styles.brandItem,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[styles.brandItemText, { color: colors.text }]}
                        >
                          {brand}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
          </View>
        );

      default:
        return null;
    }
  };

  if (loading && !userProfile) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Profile not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <ProfileHeader
          userProfile={userProfile}
          isOwnProfile={isOwnProfile}
          isFollowing={isFollowing}
          onFollowToggle={handleFollowToggle}
          onMessagePress={handleMessagePress}
          onEditPress={handleEditPress}
          onSharePress={handleSharePress}
        />

        <ProfileStats
          userProfile={userProfile}
          isOwnProfile={isOwnProfile}
          onFollowersPress={handleFollowersPress}
          onFollowingPress={handleFollowingPress}
        />

        <ProfileTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          reviewCount={userProfile.total_reviews}
          activityCount={activities.length}
          carsOwnedCount={userProfile.cars_owned?.length || 0}
        />

        <View style={styles.tabContentContainer}>{renderTabContent()}</View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.bodyText,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...Typography.bodyText,
  },
  profileHeader: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarText: {
    ...Typography.pageTitle,
    fontWeight: '700',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileDetails: {
    flex: 1,
    gap: Spacing.sm,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  profileName: {
    ...Typography.pageTitle,
    fontWeight: '700',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  locationText: {
    ...Typography.bodyText,
  },
  memberSince: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  memberSinceText: {
    ...Typography.bodyText,
  },
  preferredBrands: {
    gap: Spacing.xs,
  },
  preferredBrandsLabel: {
    ...Typography.caption,
  },
  brandsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  brandChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  brandText: {
    ...Typography.caption,
    fontWeight: '500',
  },
  moreBrands: {
    ...Typography.caption,
  },
  profileActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    flex: 1,
    justifyContent: 'center',
    ...Shadows.sm,
  },
  primaryButton: {
    // backgroundColor set dynamically
  },
  secondaryButton: {
    borderWidth: 1,
    // backgroundColor and borderColor set dynamically
  },
  actionButtonText: {
    ...Typography.bodyText,
    fontWeight: '600',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
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
  tabsContainer: {
    borderBottomWidth: 1,
    ...Shadows.sm,
  },
  tabsContent: {
    paddingHorizontal: Spacing.lg,
  },
  tab: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginRight: Spacing.md,
  },
  tabContentInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tabText: {
    ...Typography.bodyText,
    fontWeight: '500',
  },
  tabBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  tabContentContainer: {
    flex: 1,
    minHeight: 400,
  },
  tabContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  comingSoonText: {
    ...Typography.bodyText,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  carOwnedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  carOwnedInfo: {
    flex: 1,
  },
  carOwnedTitle: {
    ...Typography.cardTitle,
    fontWeight: '600',
  },
  carOwnedYear: {
    ...Typography.bodyText,
    marginTop: Spacing.xs / 2,
  },
  carOwnedPeriod: {
    ...Typography.caption,
    marginTop: Spacing.xs / 2,
  },
  verifiedOwnership: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs / 2,
  },
  verifiedText: {
    ...Typography.caption,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyStateText: {
    ...Typography.cardTitle,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    ...Typography.bodyText,
    textAlign: 'center',
  },
  aboutContent: {
    padding: Spacing.lg,
    gap: Spacing.xl,
  },
  aboutSection: {
    gap: Spacing.md,
  },
  aboutSectionTitle: {
    ...Typography.sectionTitle,
    fontWeight: '600',
  },
  aboutStats: {
    gap: Spacing.md,
  },
  aboutStat: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aboutStatLabel: {
    ...Typography.bodyText,
    flex: 1,
  },
  aboutStatValue: {
    ...Typography.bodyLarge,
    fontWeight: '600',
  },
  ratingDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs / 2,
  },
  brandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  brandItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  brandItemText: {
    ...Typography.bodyText,
    fontWeight: '500',
  },
});

export default EnhancedProfileScreen;
