import { Tabs } from 'expo-router';
import { Home, Search, Car, TrendingUp, UserCircle as ProfileIcon, FileText as ReviewsIcon } from 'lucide-react-native';
import { Spacing, Typography } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';

export default function TabLayout() {
  const { colors } = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60 + Spacing.md,
          paddingBottom: Spacing.sm,
          paddingTop: Spacing.xs,
        },
        tabBarLabelStyle: {
          ...Typography.caption,
          marginTop: 0,
        },
        tabBarIconStyle: {
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-search-tab"
        options={{
          title: 'AI Search',
          href: '/search',
          tabBarIcon: ({ color, size }) => (
            <Search color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="models"
        options={{
          title: 'Browse Cars',
          tabBarIcon: ({ color, size }) => (
            <Car color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Marketplace',
          tabBarIcon: ({ color, size }) => (
            <TrendingUp color={color} size={24} />
          ),
        }}
      />
       <Tabs.Screen
        name="reviews"
        options={{
          title: 'Reviews',
          tabBarIcon: ({ color }) => (
            <ReviewsIcon color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <ProfileIcon color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}