import { useEffect } from 'react';
import { Stack, SplashScreen, router, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useThemeColors } from '@/hooks/useTheme';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { CrashReportingBoundary } from '@/components/ui/CrashReporting';
import { Analytics } from '@/services/analyticsService';
import { TouchableOpacity, View, ActivityIndicator } from 'react-native';

import { Spacing, Typography } from '@/constants/Colors'
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { ArrowLeft } from '@/utils/ultra-optimized-icons';

// Keep the splash screen visible until we're ready to render
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { user, loading: authLoading, isNewUser } = useAuth();
  const { colors, colorScheme } = useThemeColors();

  // Font loading
  const [fontsLoaded, fontError] = useFonts({
    // Add custom fonts here if needed
  });

  const segments = useSegments();
  const appRouter = useRouter();

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Initialize analytics when app loads
  useEffect(() => {
    const appStartTime = Date.now();
    
    // Track app launch
    Analytics.track('app_launched', {
      platform: 'react-native',
      timestamp: new Date().toISOString(),
    });

    // Track app launch performance
    const launchDuration = appStartTime - Date.now(); // This would be calculated differently in real app
    Analytics.trackPerformance('app_launch_time', Math.abs(launchDuration), 'ms');

    if (user) {
      Analytics.setUserId(user.id);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;

    const inAuthGroup = segments[0] === 'auth';
    const inWelcomeFlow = segments[0] === 'welcome' || segments[0] === 'preferences';
    const inMainApp = segments[0] === '(tabs)' || segments[0] === 'model' || segments[0] === 'car' || segments[0] === 'brand' || segments[0] === 'review' || segments[0] === 'search' || segments[0] === 'recommendations';

    // For new app launches or unknown routes, go directly to main app (anonymous access)
    if (!user && !inAuthGroup && !inWelcomeFlow && !inMainApp) {
      appRouter.replace('/(tabs)');
      return;
    }

    // Anonymous users can access main app features freely
    if (!user && inMainApp) {
      return;
    }
    
    // Allow users to stay in auth flow if they're trying to sign in
    if (!user && inAuthGroup) {
      return;
    }
    
    if (user && inAuthGroup) {
      if (isNewUser) {
        appRouter.replace('/preferences/onboarding');
      } else {
        appRouter.replace('/(tabs)');
      }
    } else if (user && isNewUser && !inWelcomeFlow && !inMainApp) {
      appRouter.replace('/preferences/onboarding');
    }
  }, [user, authLoading, segments, appRouter, isNewUser]);

  if (authLoading || (!fontsLoaded && !fontError)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
          headerShown: false,
        }}
      >
        <Stack.Screen name="welcome" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="preferences/onboarding" options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Stack.Screen name="recommendations" options={{ ...commonHeaderStyles, title: 'Recommendations' }} />
        
        <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="model/[id]" options={{ ...commonHeaderStyles, title: 'Model Details' }} />
        <Stack.Screen name="car/[id]" options={{ ...commonHeaderStyles, title: 'Car Details' }} />
        <Stack.Screen name="brand/[id]" options={{ ...commonHeaderStyles, title: 'Brand Details' }} />
        <Stack.Screen name="review/[id]" options={{ ...commonHeaderStyles, title: 'Review Details' }} />
        <Stack.Screen name="search" options={{ ...commonHeaderStyles, title: 'AI Car Search' }} />

        <Stack.Screen name="auth/sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="auth/sign-up" options={{ headerShown: false }} />
        <Stack.Screen name="auth/forgot-password" options={{ ...commonHeaderStyles, title: 'Reset Password', headerShown: true }} />

        <Stack.Screen name="+not-found" options={{ ...commonHeaderStyles, title: 'Oops!', headerShown: true }} />
      </Stack>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  return (
    <AuthProvider>
      <ThemeProvider>
        <ErrorBoundary>
          <CrashReportingBoundary>
            <AppContent />
          </CrashReportingBoundary>
        </ErrorBoundary>
      </ThemeProvider>
    </AuthProvider>
  );
}