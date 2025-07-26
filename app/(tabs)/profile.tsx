import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Switch,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/Button';
import { ModernButton } from '@/components/ui/ModernButton';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { logger } from '@/utils/logger';
import {
  BaseFormInput,
  FloatingLabelInput,
  FormFieldGroup,
  useFormValidation,
} from '@/components/ui/UnifiedFormComponents';
import { useDesignTokens } from '@/hooks/useDesignTokens';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/useTheme';
import {
  User,
  Mail,
  Settings,
  Heart,
  Car,
  ChevronRight,
  MapPin,
  Crown,
  Calendar,
  Award,
  Sparkles,
  TrendingUp,
  MessageCircle,
  Moon,
  Bell,
  Edit,
  Shield,
  FileText,
  LogOut,
} from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');

function ProfileScreen() {
  const { user, role, signOut, loading: authLoading } = useAuth();
  const { colors } = useThemeColors();
  const { layout, cards, buttons, inputs } = useDesignTokens();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const styles = useMemo(() => getThemedStyles(colors), [colors]);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            logger.error('Error signing out:', error);
            Alert.alert('Error', 'Failed to sign out.');
          }
        },
      },
    ]);
  };

  // Navigation handlers
  const handleNavigateToSettings = () => {
    Alert.alert('Settings', 'Settings screen coming soon!');
  };

  const handleNavigateToSavedCars = () => {
    if (user) {
      router.push('/saved-cars');
    } else {
      Alert.alert('Sign In Required', 'Please sign in to view saved cars', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/auth/sign-in') },
      ]);
    }
  };

  const handleNavigateToMyReviews = () => {
    Alert.alert('My Reviews', 'My Reviews screen coming soon!');
  };

  const handleNavigateToAddCar = () => {
    if (role === 'dealer' || role === 'admin') {
      Alert.alert('Add Car', 'Add Car feature coming soon!');
    } else {
      Alert.alert(
        'Access Denied',
        'Only dealers can post cars. Contact admin to upgrade your account.',
      );
    }
  };

  const getRoleColor = (userRole: string) => {
    switch (userRole) {
      case 'admin':
        return colors.error;
      case 'dealer':
        return colors.warning;
      case 'user':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const renderMenuItem = (
    icon: React.ReactNode,
    title: string,
    subtitle: string,
    onPress: () => void,
  ) => (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
    >
      <View style={styles.menuIcon}>{icon}</View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
      <ChevronRight color={colors.textSecondary} size={20} />
    </TouchableOpacity>
  );

  if (authLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (!user) {
    // Anonymous user experience
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section for Anonymous Users */}
          <View style={styles.heroSection}>
            <LinearGradient
              colors={[colors.primary, '#16A34A']}
              style={styles.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroIcon}>
                  <Sparkles color={colors.background} size={32} />
                </View>
                <Text style={styles.heroTitle}>Unlock Premium Features</Text>
                <Text style={styles.heroSubtitle}>
                  Sign in to save favorites, write reviews, and get AI-powered
                  recommendations
                </Text>
                <View style={styles.heroButtons}>
                  <Button
                    title="Sign In"
                    onPress={() => router.push('/auth/sign-in')}
                    variant="secondary"
                    style={styles.heroButton}
                  />
                  <Button
                    title="Create Account"
                    onPress={() => router.push('/auth/sign-up')}
                    variant="outline"
                    style={styles.heroButton}
                  />
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Benefits Preview */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              What You'll Get
            </Text>
            <View style={styles.benefitsGrid}>
              <View
                style={[
                  styles.benefitCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Heart color={colors.error} size={24} />
                <Text style={[styles.benefitTitle, { color: colors.text }]}>
                  Save Favorites
                </Text>
                <Text
                  style={[
                    styles.benefitDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Bookmark cars and get notifications
                </Text>
              </View>
              <View
                style={[
                  styles.benefitCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <MessageCircle color={colors.primary} size={24} />
                <Text style={[styles.benefitTitle, { color: colors.text }]}>
                  Write Reviews
                </Text>
                <Text
                  style={[
                    styles.benefitDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Share your car experiences
                </Text>
              </View>
              <View
                style={[
                  styles.benefitCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Sparkles color={colors.success} size={24} />
                <Text style={[styles.benefitTitle, { color: colors.text }]}>
                  AI Recommendations
                </Text>
                <Text
                  style={[
                    styles.benefitDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Get personalized car suggestions
                </Text>
              </View>
              <View
                style={[
                  styles.benefitCard,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TrendingUp color={colors.warning} size={24} />
                <Text style={[styles.benefitTitle, { color: colors.text }]}>
                  Market Insights
                </Text>
                <Text
                  style={[
                    styles.benefitDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Get price trends and alerts
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (authLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    // Enhanced Anonymous user experience
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section for Anonymous Users */}
          <View style={styles.heroSection}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              style={styles.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroIcon}>
                  <Sparkles color={colors.white} size={32} />
                </View>
                <Text style={styles.heroTitle}>Unlock Premium Features</Text>
                <Text style={styles.heroSubtitle}>
                  Sign in to save favorites, write reviews, and get AI-powered
                  recommendations
                </Text>
                <View style={styles.heroButtons}>
                  <Button
                    title="Sign In"
                    onPress={() => router.push('/auth/sign-in')}
                    variant="secondary"
                    style={styles.heroButton}
                  />
                  <Button
                    title="Create Account"
                    onPress={() => router.push('/auth/sign-up')}
                    variant="outline"
                    style={styles.heroButton}
                    textStyle={{ color: colors.white }}
                  />
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Benefits Preview */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              What You'll Get
            </Text>
            <View style={styles.benefitsGrid}>
              <View
                style={[
                  styles.benefitCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Heart color={colors.error} size={24} />
                <Text style={[styles.benefitTitle, { color: colors.text }]}>
                  Save Favorites
                </Text>
                <Text
                  style={[
                    styles.benefitDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Bookmark cars and get notifications
                </Text>
              </View>
              <View
                style={[
                  styles.benefitCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <MessageCircle color={colors.primary} size={24} />
                <Text style={[styles.benefitTitle, { color: colors.text }]}>
                  Write Reviews
                </Text>
                <Text
                  style={[
                    styles.benefitDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Share your car experiences
                </Text>
              </View>
              <View
                style={[
                  styles.benefitCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Sparkles color={colors.success} size={24} />
                <Text style={[styles.benefitTitle, { color: colors.text }]}>
                  AI Recommendations
                </Text>
                <Text
                  style={[
                    styles.benefitDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Get personalized car suggestions
                </Text>
              </View>
              <View
                style={[
                  styles.benefitCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <TrendingUp color={colors.warning} size={24} />
                <Text style={[styles.benefitTitle, { color: colors.text }]}>
                  Market Insights
                </Text>
                <Text
                  style={[
                    styles.benefitDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  Access to price trends and analytics
                </Text>
              </View>
            </View>
          </View>

          {/* Basic Settings */}
          <View style={styles.section}>
            <View
              style={[
                styles.menuCard,
                { backgroundColor: colors.cardBackground },
              ]}
            >
              <Text style={[styles.menuSectionTitle, { color: colors.text }]}>
                App Settings
              </Text>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Moon color={colors.textSecondary} size={20} />
                  <View style={styles.settingContent}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>
                      Dark Mode
                    </Text>
                    <Text
                      style={[
                        styles.settingSubtitle,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Toggle app theme
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={setIsDarkMode}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.white}
                />
              </View>

              {renderMenuItem(
                <Bell color={colors.textSecondary} size={20} />,
                'Notifications',
                'Manage your alerts and updates',
                () =>
                  Alert.alert(
                    'Notifications',
                    'Notification settings coming soon!',
                  ),
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Authenticated user experience
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.section}>
          <View
            style={[
              styles.profileCard,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <View style={styles.profileHeader}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: colors.primary + '20' },
                ]}
              >
                <User color={colors.primary} size={32} />
              </View>
              <View style={styles.profileInfo}>
                <View style={styles.profileNameContainer}>
                  <Text style={[styles.profileName, { color: colors.text }]}>
                    {user.email?.split('@')[0] || 'User'}
                  </Text>
                  {role && (
                    <View
                      style={[
                        styles.roleBadge,
                        { backgroundColor: getRoleColor(role) + '20' },
                      ]}
                    >
                      <Text
                        style={[styles.roleText, { color: getRoleColor(role) }]}
                      >
                        {role.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <Text
                  style={[styles.profileEmail, { color: colors.textSecondary }]}
                >
                  {user.email}
                </Text>
                <View style={styles.profileStats}>
                  <View style={styles.profileStat}>
                    <Text
                      style={[styles.profileStatValue, { color: colors.text }]}
                    >
                      12
                    </Text>
                    <Text
                      style={[
                        styles.profileStatLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Saved
                    </Text>
                  </View>
                  <View style={styles.profileStat}>
                    <Text
                      style={[styles.profileStatValue, { color: colors.text }]}
                    >
                      5
                    </Text>
                    <Text
                      style={[
                        styles.profileStatLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Reviews
                    </Text>
                  </View>
                  <View style={styles.profileStat}>
                    <Text
                      style={[styles.profileStatValue, { color: colors.text }]}
                    >
                      2
                    </Text>
                    <Text
                      style={[
                        styles.profileStatLabel,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Searches
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.editButton}>
                <Edit color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View
            style={[
              styles.menuCard,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Text style={[styles.menuSectionTitle, { color: colors.text }]}>
              Quick Actions
            </Text>

            {renderMenuItem(
              <Sparkles color={colors.primary} size={20} />,
              'Get AI Recommendations',
              'Discover cars tailored for you',
              () => router.push('/search'),
            )}

            {renderMenuItem(
              <Heart color={colors.error} size={20} />,
              'Saved Cars',
              'View your favorite listings',
              handleNavigateToSavedCars,
            )}

            {renderMenuItem(
              <MessageCircle color={colors.textSecondary} size={20} />,
              'My Reviews',
              "Reviews you've written",
              handleNavigateToMyReviews,
            )}

            {(role === 'dealer' || role === 'admin') &&
              renderMenuItem(
                <Car color={colors.success} size={20} />,
                'Post a Car',
                'List your car for sale',
                handleNavigateToAddCar,
              )}
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <View
            style={[
              styles.menuCard,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Text style={[styles.menuSectionTitle, { color: colors.text }]}>
              Account & Settings
            </Text>

            {renderMenuItem(
              <User color={colors.textSecondary} size={20} />,
              'Edit Profile',
              'Update your personal information',
              () => Alert.alert('Edit Profile', 'Profile editing coming soon!'),
            )}

            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Moon color={colors.textSecondary} size={20} />
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>
                    Dark Mode
                  </Text>
                  <Text
                    style={[
                      styles.settingSubtitle,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Toggle app theme
                  </Text>
                </View>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={setIsDarkMode}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={colors.background}
              />
            </View>

            {renderMenuItem(
              <Bell color={colors.textSecondary} size={20} />,
              'Notifications',
              'Manage alerts and updates',
              () =>
                Alert.alert(
                  'Notifications',
                  'Notification settings coming soon!',
                ),
            )}

            {renderMenuItem(
              <Shield color={colors.textSecondary} size={20} />,
              'Privacy & Security',
              'Data and account security',
              () => Alert.alert('Privacy', 'Privacy settings coming soon!'),
            )}
          </View>
        </View>

        {/* Support & About */}
        <View style={styles.section}>
          <View
            style={[
              styles.menuCard,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <Text style={[styles.menuSectionTitle, { color: colors.text }]}>
              Support & About
            </Text>

            {renderMenuItem(
              <MessageCircle color={colors.textSecondary} size={20} />,
              'Help & Support',
              'Get help and contact us',
              () => Alert.alert('Support', 'Support center coming soon!'),
            )}

            {renderMenuItem(
              <FileText color={colors.textSecondary} size={20} />,
              'About CarSuggester',
              'Learn more about our app',
              () => Alert.alert('About', 'About page coming soon!'),
            )}
          </View>
        </View>

        {/* Sign Out Button */}
        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="outline"
          style={styles.signOutButton}
          icon={<LogOut color={colors.primary} size={16} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

export default function WrappedProfileScreen() {
  return (
    <ErrorBoundary>
      <ProfileScreen />
    </ErrorBoundary>
  );
}

const getThemedStyles = (colors: any) =>
  StyleSheet.create({
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

    // Hero Section (Anonymous Users)
    heroSection: {
      marginHorizontal: 20,
      marginTop: 20,
      marginBottom: 32,
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
    },
    heroGradient: {
      padding: 32,
    },
    heroContent: {
      alignItems: 'center',
    },
    heroIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(255,255,255,0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    heroTitle: {
      fontSize: 24,
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 12,
      fontWeight: '700',
    },
    heroSubtitle: {
      fontSize: 16,
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 32,
      opacity: 0.9,
      lineHeight: 24,
    },
    heroButtons: {
      flexDirection: 'row',
      gap: 12,
      width: '100%',
    },
    heroButton: {
      flex: 1,
    },

    // Sections and Benefits
    section: {
      paddingHorizontal: 20,
      marginBottom: 32,
    },
    sectionTitle: {
      fontSize: 20,
      marginBottom: 16,
      fontWeight: '700',
    },
    benefitsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'space-between',
    },
    benefitCard: {
      width: (width - 20 * 3) / 2,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    benefitTitle: {
      fontSize: 16,
      marginTop: 12,
      marginBottom: 4,
      textAlign: 'center',
      fontWeight: '600',
    },
    benefitDescription: {
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 20,
    },

    // Settings
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingContent: {
      marginLeft: 12,
      flex: 1,
    },
    settingTitle: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 4,
    },
    settingSubtitle: {
      fontSize: 12,
    },

    // Profile Card (Authenticated Users)
    profileCard: {
      marginBottom: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    profileHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    profileInfo: {
      flex: 1,
    },
    profileName: {
      fontSize: 20,
      marginBottom: 4,
      fontWeight: '700',
    },
    profileNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    roleBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    roleText: {
      fontSize: 10,
      fontWeight: '700',
    },
    profileEmail: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    profileStats: {
      flexDirection: 'row',
      gap: 16,
    },
    profileStat: {
      alignItems: 'center',
    },
    profileStatValue: {
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 4,
    },
    profileStatLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    editButton: {
      padding: 8,
      borderRadius: 12,
      backgroundColor: colors.background,
    },

    // Menu items
    menuCard: {
      marginBottom: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    menuSectionTitle: {
      fontSize: 18,
      marginBottom: 12,
      fontWeight: '600',
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    menuIcon: {
      marginRight: 12,
    },
    menuContent: {
      flex: 1,
    },
    menuTitle: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 4,
    },
    menuSubtitle: {
      fontSize: 12,
    },

    // Buttons
    signOutButton: {
      marginTop: 12,
      marginHorizontal: 20,
    },
  });
