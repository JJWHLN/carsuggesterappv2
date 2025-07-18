import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useComprehensiveTheme } from '../../hooks/useComprehensiveTheme';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';

export interface UnifiedDetailScreenProps<T = any> {
  // Data fetching
  fetchData: (id: string) => Promise<T>;
  
  // Render functions
  renderContent: (data: T) => React.ReactNode;
  renderHeader?: (data: T) => React.ReactNode;
  renderActions?: (data: T) => React.ReactNode;
  
  // Configuration
  title?: string;
  loadingText?: string;
  errorTitle?: string;
  errorMessage?: string;
  showBackButton?: boolean;
  refreshable?: boolean;
  
  // Styling
  containerStyle?: any;
  contentStyle?: any;
  
  // Callbacks
  onDataLoaded?: (data: T) => void;
  onError?: (error: Error) => void;
  onRefresh?: () => void;
  onBack?: () => void;
}

/**
 * Unified detail screen component that eliminates redundancies across [id].tsx screens
 * Handles common patterns: route params, data fetching, loading states, error handling, navigation
 */
export function UnifiedDetailScreen<T = any>({
  fetchData,
  renderContent,
  renderHeader,
  renderActions,
  title,
  loadingText = 'Loading...',
  errorTitle = 'Error',
  errorMessage = 'Failed to load data',
  showBackButton = true,
  refreshable = true,
  containerStyle,
  contentStyle,
  onDataLoaded,
  onError,
  onRefresh,
  onBack,
}: UnifiedDetailScreenProps<T>) {
  const { theme } = useComprehensiveTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load initial data
  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async (isRefresh = false) => {
    if (!id) return;
    
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const result = await fetchData(id);
      setData(result);
      onDataLoaded?.(result);
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      onError?.(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    onRefresh?.();
    loadData(true);
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    backButton: {
      marginRight: 12,
      padding: 8,
      borderRadius: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.onSurface,
      flex: 1,
    },
    actionsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      padding: 16,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 32,
    },
    errorContainer: {
      alignItems: 'center',
    },
    errorTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: theme.colors.error,
      marginBottom: 8,
      textAlign: 'center',
    },
    errorMessage: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
      textAlign: 'center',
      marginBottom: 16,
    },
    retryButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
    },
    retryButtonText: {
      color: theme.colors.onPrimary,
      fontWeight: '600',
    },
  });

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, containerStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {showBackButton && (
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handleBack}
                accessibilityLabel="Go back"
              >
                <Ionicons 
                  name="arrow-back" 
                  size={24} 
                  color={theme.colors.onSurface} 
                />
              </TouchableOpacity>
            )}
            {title && <Text style={styles.title}>{title}</Text>}
          </View>
        </View>

        {/* Loading Content */}
        <View style={styles.centerContainer}>
          <LoadingState message={loadingText} />
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, containerStyle]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {showBackButton && (
              <TouchableOpacity 
                style={styles.backButton}
                onPress={handleBack}
                accessibilityLabel="Go back"
              >
                <Ionicons 
                  name="arrow-back" 
                  size={24} 
                  color={theme.colors.onSurface} 
                />
              </TouchableOpacity>
            )}
            {title && <Text style={styles.title}>{title}</Text>}
          </View>
        </View>

        {/* Error Content */}
        <View style={styles.centerContainer}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>{errorTitle}</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => loadData()}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show main content
  return (
    <SafeAreaView style={[styles.container, containerStyle]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {showBackButton && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBack}
              accessibilityLabel="Go back"
            >
              <Ionicons 
                name="arrow-back" 
                size={24} 
                color={theme.colors.onSurface} 
              />
            </TouchableOpacity>
          )}
          {title && <Text style={styles.title}>{title}</Text>}
        </View>
        
        {data && renderActions && (
          <View style={styles.actionsContainer}>
            {renderActions(data)}
          </View>
        )}
      </View>

      {/* Custom Header */}
      {data && renderHeader && renderHeader(data)}

      {/* Content */}
      <ScrollView 
        style={[styles.content, contentStyle]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          refreshable ? (
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
      >
        {data && renderContent(data)}
      </ScrollView>
    </SafeAreaView>
  );
}

// HOC for creating detail screen components
export function createDetailScreen<T = any>(
  config: Omit<UnifiedDetailScreenProps<T>, 'children'>
) {
  return function DetailScreenComponent(props: Partial<UnifiedDetailScreenProps<T>> = {}) {
    return <UnifiedDetailScreen<T> {...config} {...props} />;
  };
}
