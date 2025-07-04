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
  const { user, loading: authLoading, isNewUser } = useAuth();
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
    const inWelcomeFlow = segments[0] === 'welcome' || segments[0] === 'preferences';
    const inMainApp = segments[0] === '(tabs)' || segments[0] === 'model' || segments[0] === 'car' || segments[0] === 'brand' || segments[0] === 'review' || segments[0] === 'search' || segments[0] === 'recommendations';

    // For new app launches or unknown routes, go directly to main app (anonymous access)
    if (!user && !inAuthGroup && !inWelcomeFlow && !inMainApp) {
      // Direct to main app for anonymous browsing
      appRouter.replace('/(tabs)');
      return;
    }

    // Anonymous users can access main app features freely
    if (!user && inMainApp) {
      // Allow anonymous access to main app - no redirect needed
      return;
    }
    
    // Allow users to stay in auth flow if they're trying to sign in
    if (!user && inAuthGroup) {
      // User is trying to sign in, let them stay in auth flow
      return;
    }
    
    if (user && inAuthGroup) {
      // User is signed in but in auth group
      if (isNewUser) {
        // New user needs onboarding
        appRouter.replace('/preferences/onboarding');
      } else {
        // Existing user can go to main app
        appRouter.replace('/(tabs)');
      }
    } else if (user && isNewUser && !inWelcomeFlow && !inMainApp) {
      // Existing signed-in user who hasn't completed onboarding
      appRouter.replace('/preferences/onboarding');
    }
  }, [user, authLoading, segments, appRouter, isNewUser]);

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
        {/* Welcome and Onboarding Screens */}
        <Stack.Screen name="welcome" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="preferences/onboarding" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="recommendations" options={{ ...commonHeaderStyles, title: 'Recommendations' }} />
        
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