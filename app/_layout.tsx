import { useEffect } from 'react';
import { Stack, SplashScreen, router, useSegments, useRouter } from 'expo-router'; // Added useSegments, useRouter
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font'; // For font loading
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useThemeColors } from '@/hooks/useTheme'; // Import ThemeProvider and useThemeColors
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'; // Import ErrorBoundary
import { TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { Spacing, Typography } from '@/constants/Colors'; // currentColors will come from useTheme

// Keep the splash screen visible until we're ready to render
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { colors, colorScheme } = useThemeColors(); // Get colors from theme

  // Font loading example - replace with actual fonts if any are custom
  const [fontsLoaded, fontError] = useFonts({
    // 'SpaceMono-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Move all hooks to the top, before any conditional returns
  const segments = useSegments(); // Get current route segments
  const appRouter = useRouter(); // For navigation

  useEffect(() => {
    if (fontsLoaded || !fontError) { // Or just !fontError if no custom fonts
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (authLoading) return; // Don't redirect until auth state is known

    const inAuthGroup = segments[0] === 'auth';

    if (!user && !inAuthGroup) {
      // User is not signed in and not in auth group, redirect to sign-in
      appRouter.replace('/auth/sign-in');
    } else if (user && inAuthGroup) {
      // User is signed in but in auth group, redirect to home
      appRouter.replace('/(tabs)');
    }
  }, [user, authLoading, segments, appRouter]);

  if (authLoading || (!fontsLoaded && !fontError)) { // Initial loading for auth and fonts
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Common header styles - defined inside AppContent to access themed 'colors'
  const commonHeaderStyles = {
    headerShown: true,
    headerStyle: {
      backgroundColor: colors.background,
    },
    headerTitleStyle: {
      ...Typography.h3,
      color: colors.text,
    },
    headerTitleAlign: 'center' as 'center' | 'left',
    headerBackVisible: false,
    headerLeft: () => (
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ marginLeft: Spacing.md, padding: Spacing.sm }}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <ArrowLeft color={colors.primary} size={24} />
      </TouchableOpacity>
    ),
  };

  return (
    <>
      <Stack
        screenOptions={{
          animation: 'slide_from_right',
          animationDuration: 300,
          headerShown: false, // Default to no header, individual screens can override
        }}
      >
        {/* Screens accessible when authenticated */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="model/[id]" options={{ ...commonHeaderStyles, title: 'Model Details' }} />
        <Stack.Screen name="car/[id]" options={{ ...commonHeaderStyles, title: 'Car Details' }} />
        <Stack.Screen name="brand/[id]" options={{ ...commonHeaderStyles, title: 'Brand Details' }} />
        <Stack.Screen name="review/[id]" options={{ ...commonHeaderStyles, title: 'Review Details' }} />
        <Stack.Screen name="search" options={{ ...commonHeaderStyles, title: 'Search Cars' }} />

        {/* Auth Screens - these should ideally be in a group if we want a different layout, but for now, this works with headerShown: false */}
        <Stack.Screen name="auth/sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="auth/sign-up" options={{ headerShown: false }} />
        <Stack.Screen name="auth/forgot-password" options={{ ...commonHeaderStyles, title: 'Reset Password', headerShown: true }} />
        {/* Forgot password might need a header for back navigation if not modal */}

        <Stack.Screen name="+not-found" options={{ ...commonHeaderStyles, title: 'Oops!', headerShown: true }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  // useFrameworkReady(); // Replaced by explicit font loading and SplashScreen management

  return (
    <AuthProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <AppContent />
        </ErrorBoundary>
      </ThemeProvider>
    </AuthProvider>
  );
}