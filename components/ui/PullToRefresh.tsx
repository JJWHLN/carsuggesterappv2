import React, { useState, useCallback } from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';
import { currentColors } from '@/constants/Colors';

interface PullToRefreshProps extends Omit<RefreshControlProps, 'refreshing' | 'onRefresh'> {
  onRefresh: () => Promise<void>;
  isRefreshing?: boolean;
}

export function PullToRefresh({ 
  onRefresh, 
  isRefreshing = false,
  ...props 
}: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (refreshing || isRefreshing) return;
    
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, refreshing, isRefreshing]);

  return (
    <RefreshControl
      refreshing={refreshing || isRefreshing}
      onRefresh={handleRefresh}
      tintColor={currentColors.primary}
      colors={[currentColors.primary]}
      progressBackgroundColor={currentColors.surface}
      {...props}
    />
  );
}