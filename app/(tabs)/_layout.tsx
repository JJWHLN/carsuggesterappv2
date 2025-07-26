import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';

import { Spacing, Typography } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { useCanPerformAction } from '@/components/ui/RoleProtection';
import {
  Home,
  Sparkles,
  User,
  Settings,
  Edit3,
  MessageSquare,
  ShoppingBag,
} from '@/utils/ultra-optimized-icons';

export default function TabLayout() {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const canAccessAI = useCanPerformAction('accessAI');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.white,
            borderTopColor: colors.border,
            ...Platform.select({
              ios: {
                boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
              },
              android: {
                elevation: 12,
              },
            }),
          },
        ],
        tabBarLabelStyle: [styles.tabBarLabel, Typography.caption],
        tabBarIconStyle: styles.tabBarIcon,
        tabBarItemStyle: styles.tabBarItem,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home
              color={focused ? colors.primary : color}
              size={focused ? 26 : 24}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <Sparkles
              color={focused ? colors.primary : color}
              size={focused ? 26 : 24}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          title: 'Reviews',
          tabBarIcon: ({ color, focused }) => (
            <MessageSquare
              color={focused ? colors.primary : color}
              size={focused ? 26 : 24}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Marketplace',
          tabBarIcon: ({ color, focused }) => (
            <ShoppingBag
              color={focused ? colors.primary : color}
              size={focused ? 26 : 24}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI Search',
          tabBarIcon: ({ color, focused }) => (
            <Sparkles
              color={focused ? colors.primary : color}
              size={focused ? 26 : 24}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color, focused }) => (
            <Settings
              color={focused ? colors.primary : color}
              size={focused ? 26 : 24}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <User
              color={focused ? colors.primary : color}
              size={focused ? 26 : 24}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      {/* Hidden routes - accessible but not shown in tab bar */}
      <Tabs.Screen
        name="models"
        options={{
          href: null, // This hides the tab from the tab bar
        }}
      />
      <Tabs.Screen
        name="reviews_new"
        options={{
          href: null, // This hides the tab from the tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 0.5,
    elevation: Platform.OS === 'android' ? 12 : 0,
    ...Platform.select({
      ios: {
        boxShadow: '0 -3px 12px rgba(0,0,0,0.08)',
      },
      default: {},
    }),
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  tabBarIcon: {
    marginBottom: 2,
  },
  tabBarItem: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    borderRadius: 8,
  },
});
