import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  User, 
  Mail,
  Settings,
  LogOut,
  Heart,
  FileText,
  Car,
  Shield,
  Bell,
  Moon,
  ChevronRight,
  Edit,
  Phone,
  MapPin,
  Crown,
  Calendar,
  Award,
  Sparkles,
  TrendingUp,
  MessageCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import { useCanPerformAction } from '@/components/ui/RoleProtection';

const { width } = Dimensions.get('window');


export default function ProfileScreen() {
  const { user, role, signOut, loading: authLoading } = useAuth();
  const { colors } = useThemeColors();
  const canPostCars = useCanPerformAction('postCars');
  const canWriteReviews = useCanPerformAction('writeReviews');
  const canBookmarkCars = useCanPerformAction('bookmarkCars');
  const canAccessAI = useCanPerformAction('accessAI');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const styles = useMemo(() => getThemedStyles(colors), [colors]);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Navigation will be handled by RootLayout/AppContent due to auth state change
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out.');
            }
          }
        }
      ]
    );
  };

  // Navigation handlers
  const handleNavigateToSettings = () => Alert.alert('Settings', 'Settings screen coming soon!');
  const handleNavigateToSavedCars = () => {
    if (canBookmarkCars) {
      // Navigate to a saved cars section or show alert for now
      Alert.alert('Saved Cars', 'Saved Cars feature coming soon!');
    } else {
      Alert.alert('Sign In Required', 'Please sign in to view saved cars');
    }
  };
  const handleNavigateToMyReviews = () => Alert.alert('My Reviews', 'My Reviews screen coming soon!');
  const handleNavigateToAddCar = () => {
    if (canPostCars) {
      Alert.alert('Add Car', 'Add Car feature coming soon!');
    } else {
      Alert.alert('Access Denied', 'Only dealers can post cars. Contact admin to upgrade your account.');
    }
  };
  const handleNavigateToAdmin = () => {
    if (role === 'admin') {
      Alert.alert('Admin Panel', 'Admin panel coming soon!');
    } else {
      Alert.alert('Access Denied', 'Admin access required');
    }
  };

  const getRoleColor = (userRole: string) => {
    switch (userRole) {
      case 'admin': return colors.error;
      case 'dealer': return colors.warning;
      case 'user': return colors.success;
      default: return colors.textSecondary;
    }
  };


  const renderMenuItem = (icon: React.ReactNode, title: string, subtitle: string, onPress: () => void) => (
    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={onPress}>
      <View style={styles.menuIcon}>{icon}</View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
      <ChevronRight color={colors.textSecondary} size={20} />
    </TouchableOpacity>
  );

  if (authLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    // Enhanced Anonymous user experience
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Hero Section for Anonymous Users */}
          <View style={styles.heroSection}>
            <LinearGradient
              colors={[colors.primary, colors.primaryHover]}
              style={styles.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroIcon}>
                  <Sparkles color={colors.white} size={32} />
                </View>
                <Text style={styles.heroTitle}>
                  Unlock Premium Features
                </Text>
                <Text style={styles.heroSubtitle}>
                  Sign in to save favorites, write reviews, and get AI-powered recommendations
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
              <View style={[styles.benefitCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Heart color={colors.error} size={24} />
                <Text style={[styles.benefitTitle, { color: colors.text }]}>Save Favorites</Text>
                <Text style={[styles.benefitDescription, { color: colors.textSecondary }]}>
                  Bookmark cars and get notifications
                </Text>
              </View>
              <View style={[styles.benefitCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <MessageCircle color={colors.primary} size={24} />
                <Text style={[styles.benefitTitle, { color: colors.text }]}>Write Reviews</Text>
                <Text style={[styles.benefitDescription, { color: colors.textSecondary }]}>
                  Share your car experiences
                </Text>
              </View>
              <View style={[styles.benefitCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Sparkles color={colors.success} size={24} />
                <Text style={[styles.benefitTitle, { color: colors.text }]}>AI Recommendations</Text>
                <Text style={[styles.benefitDescription, { color: colors.textSecondary }]}>
                  Get personalized car suggestions
                </Text>
              </View>
              <View style={[styles.benefitCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <TrendingUp color={colors.warning} size={24} />
                <Text style={[styles.benefitTitle, { color: colors.text }]}>Market Insights</Text>
                <Text style={[styles.benefitDescription, { color: colors.textSecondary }]}>
                  Access to price trends and analytics
                </Text>
              </View>
            </View>
          </View>

          {/* Basic Settings */}
          <View style={styles.section}>
            <Card style={styles.menuCard}>
              <Text style={[styles.menuSectionTitle, { color: colors.text }]}>App Settings</Text>
              
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <Moon color={colors.textSecondary} size={20} />
                  <View style={styles.settingContent}>
                    <Text style={[styles.settingTitle, { color: colors.text }]}>Dark Mode</Text>
                    <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
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
                () => Alert.alert('Notifications', 'Notification settings coming soon!')
              )}
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Enhanced Profile Header */}
        <View style={styles.section}>
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                <User color={colors.primary} size={32} />
              </View>
              <View style={styles.profileInfo}>
                <View style={styles.profileNameContainer}>
                  <Text style={[styles.profileName, { color: colors.text }]}>
                    {user.email?.split('@')[0] || 'User'}
                  </Text>
                  {role && (
                    <View style={[styles.roleBadge, { backgroundColor: getRoleColor(role) + '20' }]}>
                      <Text style={[styles.roleText, { color: getRoleColor(role) }]}>
                        {role.toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>
                  {user.email}
                </Text>
                <View style={styles.profileStats}>
                  <View style={styles.profileStat}>
                    <Text style={[styles.profileStatValue, { color: colors.text }]}>12</Text>
                    <Text style={[styles.profileStatLabel, { color: colors.textSecondary }]}>Saved</Text>
                  </View>
                  <View style={styles.profileStat}>
                    <Text style={[styles.profileStatValue, { color: colors.text }]}>5</Text>
                    <Text style={[styles.profileStatLabel, { color: colors.textSecondary }]}>Reviews</Text>
                  </View>
                  <View style={styles.profileStat}>
                    <Text style={[styles.profileStatValue, { color: colors.text }]}>2</Text>
                    <Text style={[styles.profileStatLabel, { color: colors.textSecondary }]}>Searches</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity style={styles.editButton}>
                <Edit color={colors.textSecondary} size={20} />
              </TouchableOpacity>
            </View>
          </Card>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Card style={styles.menuCard}>
            <Text style={[styles.menuSectionTitle, { color: colors.text }]}>Quick Actions</Text>
            
            {canAccessAI && renderMenuItem(
              <Sparkles color={colors.primary} size={20} />,
              'Get AI Recommendations',
              'Discover cars tailored for you',
              () => router.push('/search')
            )}
            
            {canBookmarkCars && renderMenuItem(
              <Heart color={colors.error} size={20} />,
              'Saved Cars',
              'View your favorite listings',
              handleNavigateToSavedCars
            )}
            
            {canWriteReviews && renderMenuItem(
              <MessageCircle color={colors.textSecondary} size={20} />,
              'My Reviews',
              'Reviews you\'ve written',
              handleNavigateToMyReviews
            )}

            {canPostCars && renderMenuItem(
              <Car color={colors.accentGreen} size={20} />,
              'Post a Car',
              'List your car for sale',
              handleNavigateToAddCar
            )}

            {role === 'admin' && renderMenuItem(
              <Shield color={colors.warning} size={20} />,
              'Admin Panel',
              'Manage users and content',
              handleNavigateToAdmin
            )}
          </Card>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Card style={styles.menuCard}>
            <Text style={[styles.menuSectionTitle, { color: colors.text }]}>Account & Settings</Text>
            
            {renderMenuItem(
              <User color={colors.textSecondary} size={20} />,
              'Edit Profile',
              'Update your personal information',
              () => Alert.alert('Edit Profile', 'Profile editing coming soon!')
            )}
            
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Moon color={colors.textSecondary} size={20} />
                <View style={styles.settingContent}>
                  <Text style={[styles.settingTitle, { color: colors.text }]}>Dark Mode</Text>
                  <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
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
              'Manage alerts and updates',
              () => Alert.alert('Notifications', 'Notification settings coming soon!')
            )}
            
            {renderMenuItem(
              <Shield color={colors.textSecondary} size={20} />,
              'Privacy & Security',
              'Data and account security',
              () => Alert.alert('Privacy', 'Privacy settings coming soon!')
            )}
          </Card>
        </View>

        {/* Support & About */}
        <View style={styles.section}>
          <Card style={styles.menuCard}>
            <Text style={[styles.menuSectionTitle, { color: colors.text }]}>Support & About</Text>
            
            {renderMenuItem(
              <MessageCircle color={colors.textSecondary} size={20} />,
              'Help & Support',
              'Get help and contact us',
              () => Alert.alert('Support', 'Support center coming soon!')
            )}
            
            {renderMenuItem(
              <FileText color={colors.textSecondary} size={20} />,
              'About CarSuggester',
              'Learn more about our app',
              () => Alert.alert('About', 'About page coming soon!')
            )}
          </Card>
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

const getThemedStyles = (colors: typeof import('@/constants/Colors').Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...Typography.body,
    color: colors.textSecondary,
  },
  
  // Hero Section (Anonymous Users)
  heroSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...ColorsShadows.large,
  },
  heroGradient: {
    padding: Spacing.xl,
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
    marginBottom: Spacing.lg,
  },
  heroTitle: {
    ...Typography.h1,
    color: colors.white,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontWeight: '700',
  },
  heroSubtitle: {
    ...Typography.body,
    color: colors.white,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    opacity: 0.9,
    lineHeight: 24,
  },
  heroButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
  },
  heroButton: {
    flex: 1,
  },
  
  // Sections and Benefits
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.h2,
    marginBottom: Spacing.lg,
    fontWeight: '700',
  },
  benefitsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  benefitCard: {
    width: (width - Spacing.lg * 3) / 2,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
    ...ColorsShadows.small,
  },
  benefitTitle: {
    ...Typography.h3,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    textAlign: 'center',
    fontWeight: '600',
  },
  benefitDescription: {
    ...Typography.bodySmall,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Settings
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingContent: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  settingTitle: {
    ...Typography.body,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  settingSubtitle: {
    ...Typography.bodySmall,
  },
  
  // Profile Card (Authenticated Users)
  profileCard: {
    marginBottom: Spacing.lg,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...Typography.h2,
    marginBottom: Spacing.xs,
    fontWeight: '700',
  },
  profileNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  roleText: {
    ...Typography.caption,
    fontWeight: '700',
    fontSize: 10,
  },
  profileEmail: {
    ...Typography.body,
    color: colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  profileStats: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  profileStat: {
    alignItems: 'center',
  },
  profileStatValue: {
    ...Typography.h3,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  profileStatLabel: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  editButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: colors.background,
  },
  
  // Menu items
  menuCard: {
    marginBottom: Spacing.lg,
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  menuSectionTitle: {
    ...Typography.h3,
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  menuIcon: {
    marginRight: Spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    ...Typography.body,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  menuSubtitle: {
    ...Typography.bodySmall,
  },
  menuChevron: {
    marginLeft: Spacing.sm,
  },
  
  // Buttons
  signOutButton: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.lg,
  },
  upgradeButton: {
    marginBottom: Spacing.lg,
  },
});