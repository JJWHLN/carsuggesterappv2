import React, { useMemo } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { useThemeColors } from '../../hooks/useTheme';
import { ErrorBoundary } from './ErrorBoundary';
import { UnifiedScreenState } from './UnifiedScreenState';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface UnifiedTabScreenProps {
  children: React.ReactNode;
  enableErrorBoundary?: boolean;
  loadingState?: {
    loading: boolean;
    error?: string | null;
    onRetry?: () => void;
  };
  screenName?: string;
}

/**
 * Unified tab screen wrapper that eliminates wrapper redundancies
 * Provides consistent error boundaries, theme integration, and common screen patterns
 */
export const UnifiedTabScreen: React.FC<UnifiedTabScreenProps> = ({
  children,
  enableErrorBoundary = true,
  loadingState,
  screenName,
}) => {
  // Handle loading states
  if (loadingState?.loading || loadingState?.error) {
    return (
      <UnifiedScreenState
        loading={loadingState.loading}
        error={loadingState.error}
        onRetry={loadingState.onRetry}
      />
    );
  }

  // Render content with optional error boundary
  const content = (
    <React.Fragment>
      {children}
    </React.Fragment>
  );

  if (enableErrorBoundary) {
    return (
      <ErrorBoundary>
        {content}
      </ErrorBoundary>
    );
  }

  return content;
};

// Higher-order component for creating tab screens
export function withUnifiedTabScreen<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<UnifiedTabScreenProps, 'children'> = {}
) {
  return function UnifiedTabScreenWrapper(props: P) {
    return (
      <UnifiedTabScreen {...options}>
        <Component {...props} />
      </UnifiedTabScreen>
    );
  };
}

// Common screen dimensions and calculations
export const screenDimensions = {
  width: screenWidth,
  height: screenHeight,
  
  // Common responsive breakpoints
  isSmallScreen: screenWidth < 375,
  isMediumScreen: screenWidth >= 375 && screenWidth < 768,
  isLargeScreen: screenWidth >= 768,
  
  // Common grid calculations
  twoColumnWidth: (screenWidth - 48) / 2,
  threeColumnWidth: (screenWidth - 64) / 3,
  
  // Common padding calculations
  screenPadding: 16,
  sectionPadding: 24,
  itemSpacing: 12,
  
  // Common card sizes
  cardHeight: 200,
  listItemHeight: 80,
  
  // Common header heights
  headerHeight: 60,
  tabBarHeight: 84,
  
  // Safe area calculations
  contentHeight: screenHeight - 60 - 84, // screen - header - tabBar
};

// Export common style utilities
export const commonStyleUtils = {
  // Shadow styles
  smallShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  mediumShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  largeShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  
  // Common border radius
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },
  
  // Common spacing
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
};

// Export screen-specific hooks
export function useTabScreenStyles() {
  const { colors } = useThemeColors();
  
  return useMemo(() => {
    const styles = StyleSheet.create({
      // Container styles
      container: {
        flex: 1,
        backgroundColor: colors.background,
      },
      
      // Header styles
      header: {
        padding: 16,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
      
      // Content styles
      content: {
        flex: 1,
      },
      
      // List styles
      listContainer: {
        paddingVertical: 8,
      },
      
      // Card styles
      card: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 16,
        ...commonStyleUtils.mediumShadow,
      },
      
      // Loading styles
      loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
      },
      
      // Error styles
      errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
      },
      
      // Empty state styles
      emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
      },
      
      // Common text styles
      title: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
      },
      
      subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        marginBottom: 16,
      },
      
      bodyText: {
        fontSize: 14,
        color: colors.text,
        lineHeight: 20,
      },
      
      caption: {
        fontSize: 12,
        color: colors.textSecondary,
        lineHeight: 16,
      },
      
      // Common layout styles
      row: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      
      spaceBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      },
      
      center: {
        justifyContent: 'center',
        alignItems: 'center',
      },
      
      // Common grid styles
      gridItem: {
        width: screenDimensions.twoColumnWidth,
        marginBottom: 16,
      },
      
      listItem: {
        marginHorizontal: 16,
        marginBottom: 16,
      },
      
      // Common button styles
      primaryButton: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
      },
      
      primaryButtonText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
      },
      
      secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
      },
      
      secondaryButtonText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: '600',
      },
    });
    
    return {
      styles,
      colors,
      screenDimensions,
    };
  }, [colors]);
}

// Common utility functions for tab screens
export const tabScreenUtils = {
  // Get responsive column count
  getColumnCount: (minItemWidth: number = 150) => {
    return Math.floor(screenWidth / minItemWidth);
  },
  
  // Get responsive item width
  getItemWidth: (columns: number, padding: number = 16) => {
    return (screenWidth - (padding * (columns + 1))) / columns;
  },
  
  // Get responsive font size
  getResponsiveFontSize: (baseSize: number) => {
    if (screenDimensions.isSmallScreen) return baseSize * 0.9;
    if (screenDimensions.isLargeScreen) return baseSize * 1.1;
    return baseSize;
  },
  
  // Get responsive spacing
  getResponsiveSpacing: (baseSpacing: number) => {
    if (screenDimensions.isSmallScreen) return baseSpacing * 0.8;
    if (screenDimensions.isLargeScreen) return baseSpacing * 1.2;
    return baseSpacing;
  },
};
