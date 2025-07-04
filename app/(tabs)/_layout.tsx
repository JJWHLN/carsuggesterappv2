import { Tabs } from 'expo-router';
import { Home, Search, Car, TrendingUp, UserCircle as ProfileIcon, FileText as ReviewsIcon } from 'lucide-react-native';
import { Spacing, Typography } from '@/constants/Colors'; // Removed currentColors
import { useThemeColors } from '@/hooks/useTheme'; // Import useThemeColors

export default function TabLayout() {
  const { colors } = useThemeColors(); // Use themed colors

  // Note: Blur effect for tab bar background requires a library like @react-native-community/blur or expo-blur
  // For now, a solid white background is used.
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface, // Use surface for tab bar background (white in light, dark in dark)
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60 + Spacing.md,
          paddingBottom: Spacing.sm,
          paddingTop: Spacing.xs,
          // Shadow from previous version, can be removed if design implies no shadow or uses a top border only
          // shadowColor: currentColors.black,
          // shadowOffset: { width: 0, height: -2 },
          // shadowOpacity: 0.1,
          // shadowRadius: 8,
          // elevation: 10,
        },
        tabBarLabelStyle: {
          ...Typography.caption, // Using caption style from new Typography (12px, Medium)
          // fontWeight: '600', // Overridden by Typography.caption if different
          marginTop: 0, // Adjust if icon and label need more/less spacing
        },
        tabBarIconStyle: {
          // marginBottom: Spacing.xs/2, // Optional: if icons need to be pushed up a bit
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home color={color} size={24} /> // Explicitly 24px
          ),
        }}
      />
      <Tabs.Screen
        name="ai-search-tab" // Changed name to be unique for the tab instance
        options={{
          title: 'AI Search',
          href: '/search', // Directs this tab to the top-level /search route
          tabBarIcon: ({ color, size }) => (
            <Search color={color} size={24} /> // Explicitly 24px
          ),
        }}
      />
      <Tabs.Screen
        name="models"
        options={{
          title: 'Browse Cars',
          tabBarIcon: ({ color, size }) => (
            <Car color={color} size={24} /> // Explicitly 24px
          ),
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Marketplace',
          tabBarIcon: ({ color, size }) => (
            <TrendingUp color={color} size={24} /> // Explicitly 24px
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