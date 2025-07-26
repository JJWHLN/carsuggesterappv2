import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useColorScheme } from 'react-native';
import DesignSystem from '@/constants/DesignSystem';
import { useCommonThemedStyles } from '@/hooks/useThemedStyles';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { Home, AlertTriangle } from '@/utils/ultra-optimized-icons';

export default function NotFoundScreen() {
  const colorScheme = useColorScheme();
  const colors =
    colorScheme === 'dark'
      ? DesignSystem.Colors.dark
      : DesignSystem.Colors.light;
  const commonStyles = useCommonThemedStyles();

  return (
    <ErrorBoundary>
      <Stack.Screen options={{ title: 'Page Not Found' }} />
      <SafeAreaView style={commonStyles.container}>
        <EmptyState
          icon={<AlertTriangle color={colors.textMuted} size={64} />}
          title="Page Not Found"
          subtitle="The page you're looking for doesn't exist or has been moved."
          action={
            <Link href="/" asChild>
              <Button
                title="Go to Home"
                icon={<Home color={colors.white} size={20} />}
                variant="primary"
                onPress={() => {}}
              />
            </Link>
          }
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
}
