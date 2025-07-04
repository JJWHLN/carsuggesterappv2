import React, { useState, useEffect, useMemo } from 'react'; // Added useMemo
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  ActivityIndicator, // Added ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  User, 
  Mail,
  Settings,
  LogOut,
  Heart,
  FileText,
  // Car, // Assuming 'My Listings' for dealer is future
  // Shield, // For Privacy & Security, future
  // Phone, MapPin for future detailed profile
} from 'lucide-react-native';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { Spacing, Typography } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme'; // Import useThemeColors
import { useRouter } // For navigation if needed for settings etc.
from 'expo-router';


export default function ProfileScreen() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { colors } = useThemeColors();
  const styles = useMemo(() => getThemedStyles(colors), [colors]); // Memoize styles
  const router = useRouter(); // If needed for navigation

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

  // Placeholder for future navigation or actions
  const handleNavigateToSettings = () => Alert.alert('Settings', 'Settings screen coming soon!');
  const handleNavigateToSavedCars = () => Alert.alert('Saved Cars', 'Saved Cars screen coming soon!');
  const handleNavigateToMyReviews = () => Alert.alert('My Reviews', 'My Reviews screen coming soon!');


  const renderMenuItem = (icon: React.ReactNode, title: string, subtitle: string, onPress: () => void) => (
    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.border }]} onPress={onPress}>
      <View style={styles.menuIcon}>{icon}</View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      </View>
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
    // This case should ideally be handled by the root navigator redirecting to auth screens.
    // If somehow reached, provide a fallback.
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{color: colors.text}}>Please sign in.</Text>
          <Button title="Sign In" onPress={() => router.replace('/auth/sign-in')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={[styles.content, {backgroundColor: colors.background}]}>
        <Card style={{...styles.profileCard, backgroundColor: colors.surface, borderColor: colors.border}}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <User color={colors.primary} size={32} />
            </View>
            <View style={styles.profileInfo}>
              {/* Name will come from user_profiles table later */}
              <Text style={[styles.profileName, { color: colors.text }]}>User Profile</Text>
            </View>
          </View>
          
          <View style={styles.profileDetails}>
            {renderMenuItem(
              <Mail color={colors.textSecondary} size={20} />,
              'Email',
              user.email || 'Not available',
              () => {} // No action on email press for now
            )}
            {/* More profile details (name, phone, location) will be added once user_profiles integration is done */}
          </View>
        </Card>

        <Card style={{...styles.menuCard, backgroundColor: colors.surface, borderColor: colors.border}}>
          <Text style={[styles.menuSectionTitle, { color: colors.text }]}>My Activity</Text>
          {renderMenuItem(
            <Heart color={colors.textSecondary} size={20} />,
            'Saved Cars',
            'View your favorite listings',
            handleNavigateToSavedCars
          )}
          {renderMenuItem(
            <FileText color={colors.textSecondary} size={20} />,
            'My Reviews',
            'Reviews you\'ve written',
            handleNavigateToMyReviews
          )}
          {/* My Listings for dealers will be added later based on role */}
        </Card>

        <Card style={{...styles.menuCard, backgroundColor: colors.surface, borderColor: colors.border}}>
          <Text style={[styles.menuSectionTitle, { color: colors.text }]}>Account</Text>
          {renderMenuItem(
            <Settings color={colors.textSecondary} size={20} />,
            'Settings',
            'App preferences and notifications',
            handleNavigateToSettings
          )}
          {/* Privacy & Security menu item can be added later */}
        </Card>

        {/* "Become a Dealer" button can be added later based on profile data/role */}

        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="secondary" // Or 'outline' depending on desired look with themes
          style={styles.signOutButton}
          icon={<LogOut color={colors.primary} size={16} />} // Added icon
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const getThemedStyles = (colors: typeof import('@/constants/Colors').Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor is applied to SafeAreaView directly using themed `colors.background`
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    // backgroundColor is applied to ScrollView directly using themed `colors.background`
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor is applied to SafeAreaView directly
  },
  loadingText: { // This style might not be used if ActivityIndicator is primary loading display
    ...Typography.body,
    color: colors.textSecondary,
  },
  // Styles for the '!user' fallback state (sign-in prompt)
  signInFallbackContainer: { // Renamed from signInContainer to avoid confusion if a real sign-in screen style exists
    flex: 1, // Ensure it takes full height if it's the only content
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  signInFallbackText: { // For the "Please sign in." text
    ...Typography.bodyLarge,
    color: colors.text,
    marginBottom: Spacing.lg,
  },
  // Profile card and menu items
  profileCard: {
    marginBottom: Spacing.lg,
    // backgroundColor and borderColor are applied inline using themed `colors.surface` and `colors.border`
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    // backgroundColor is applied inline using themed `colors.primaryLight`
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...Typography.h2,
    // color is applied inline using themed `colors.text`
    marginBottom: Spacing.xs,
  },
  profileType: { // This style is currently not used in the refactored JSX
    ...Typography.bodySmall,
    color: colors.primary,
    fontWeight: '500',
  },
  profileDetails: {
    borderTopWidth: 1,
    // borderTopColor is applied inline using themed `colors.border` (though Card itself has border)
    // Consider removing if Card's border is sufficient
    paddingTop: Spacing.md,
  },
  menuCard: {
    marginBottom: Spacing.lg,
    // backgroundColor and borderColor are applied inline
  },
  menuSectionTitle: {
    ...Typography.h3,
    // color is applied inline
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    // borderBottomColor is applied inline
  },
  menuIcon: {
    marginRight: Spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    ...Typography.body,
    // color is applied inline
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  menuSubtitle: {
    ...Typography.bodySmall,
    // color is applied inline
  },
  dealerButton: { // This style is currently not used
    marginBottom: Spacing.md,
  },
  signOutButton: {
    marginTop: Spacing.md,
  },
});
// Inside ProfileScreen: const styles = getThemedStyles(colors);