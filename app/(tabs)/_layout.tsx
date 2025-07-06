import { Tabs } from 'expo-router';
import { Chrome as Home, Car, TrendingUp, FileText, Sparkles, User } from 'lucide-react-native';
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
          height: 70,
          paddingBottom: Spacing.sm,
          paddingTop: Spacing.xs,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          ...Typography.caption,
          marginTop: 2,
          fontWeight: '600',
          fontSize: 11,
        },
        tabBarIconStyle: {
          marginBottom: 0,
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
            <FileText color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="ai-search-tab"
        options={{
          title: 'AI',
          href: '/search',
          tabBarIcon: ({ color, size }) => (
            <Sparkles color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <User color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}