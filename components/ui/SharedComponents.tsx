import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Typography, Spacing, BorderRadius } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import { Check, ChevronRight } from '@/utils/ultra-optimized-icons';

// Common component factory functions to reduce duplication

// Category Chip Component
interface CategoryChipProps {
  text: string;
  isActive?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
  text,
  isActive = false,
  onPress,
  style,
}) => {
  const { colors } = useThemeColors();

  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor: isActive ? colors.primary : colors.surface,
          borderColor: isActive ? colors.primary : colors.border,
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          borderRadius: BorderRadius.full,
          borderWidth: 1,
          marginRight: Spacing.sm,
        },
        style,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <Text
        style={{
          ...Typography.caption,
          color: isActive ? colors.white : colors.text,
          fontWeight: isActive ? '600' : '500',
        }}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
};

// Loading Container Component
interface LoadingContainerProps {
  text?: string;
  children?: React.ReactNode;
}

export const LoadingContainer: React.FC<LoadingContainerProps> = ({
  text = 'Loading...',
  children,
}) => {
  const { colors } = useThemeColors();

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.md,
        backgroundColor: colors.background,
      }}
    >
      {children}
      <Text
        style={{
          ...Typography.body,
          color: colors.textSecondary,
        }}
      >
        {text}
      </Text>
    </View>
  );
};

// Section Header Component
interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onViewAll?: () => void;
  viewAllText?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  onViewAll,
  viewAllText = 'View All',
}) => {
  const { colors } = useThemeColors();

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.lg,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            ...Typography.h2,
            color: colors.text,
            fontWeight: '700',
            marginBottom: subtitle ? Spacing.xs : 0,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              ...Typography.body,
              color: colors.textSecondary,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {onViewAll && (
        <TouchableOpacity
          onPress={onViewAll}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.xs,
          }}
        >
          <Text
            style={{
              ...Typography.body,
              color: colors.primary,
              fontWeight: '600',
            }}
          >
            {viewAllText}
          </Text>
          <ChevronRight color={colors.primary} size={16} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// Badge Component
interface BadgeProps {
  text: string;
  variant?: 'primary' | 'success' | 'warning' | 'error';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  text,
  variant = 'primary',
  style,
  textStyle,
}) => {
  const { colors } = useThemeColors();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      default:
        return colors.primary;
    }
  };

  return (
    <View
      style={[
        {
          backgroundColor: getBackgroundColor(),
          paddingHorizontal: Spacing.sm,
          paddingVertical: Spacing.xs,
          borderRadius: BorderRadius.sm,
        },
        style,
      ]}
    >
      <Text
        style={[
          {
            ...Typography.caption,
            color: colors.white,
            fontWeight: '600',
            fontSize: 10,
          },
          textStyle,
        ]}
      >
        {text}
      </Text>
    </View>
  );
};

// Hero Section Component
interface HeroSectionProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  gradientColors?: [string, string];
  style?: ViewStyle;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  children,
  gradientColors,
  style,
}) => {
  const { colors } = useThemeColors();
  const defaultGradientColors: [string, string] = gradientColors || [
    colors.primary,
    colors.primaryHover,
  ];

  return (
    <LinearGradient
      colors={defaultGradientColors}
      style={[
        {
          paddingTop: Spacing.xl * 2,
          paddingBottom: Spacing.xl * 1.5,
          paddingHorizontal: Spacing.lg,
          justifyContent: 'center',
        },
        style,
      ]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View
        style={{
          alignItems: 'center',
          width: '100%',
        }}
      >
        <Text
          style={{
            ...Typography.heroTitle,
            color: colors.white,
            textAlign: 'center',
            marginBottom: Spacing.md,
            fontWeight: '800',
          }}
        >
          {title}
        </Text>

        {subtitle && (
          <Text
            style={{
              ...Typography.bodyLarge,
              color: colors.white,
              textAlign: 'center',
              marginBottom: Spacing.xl,
              opacity: 0.95,
              lineHeight: 26,
            }}
          >
            {subtitle}
          </Text>
        )}

        {children}
      </View>
    </LinearGradient>
  );
};

// View Toggle Component
interface ViewToggleProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  gridIcon?: React.ReactNode;
  listIcon?: React.ReactNode;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  viewMode,
  onViewModeChange,
  gridIcon,
  listIcon,
}) => {
  const { colors } = useThemeColors();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
      }}
    >
      <TouchableOpacity
        style={{
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          backgroundColor: viewMode === 'grid' ? colors.primary : 'transparent',
        }}
        onPress={() => onViewModeChange('grid')}
      >
        {gridIcon}
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          backgroundColor: viewMode === 'list' ? colors.primary : 'transparent',
        }}
        onPress={() => onViewModeChange('list')}
      >
        {listIcon}
      </TouchableOpacity>
    </View>
  );
};

// Filter Button Component
interface FilterButtonProps {
  text: string;
  onPress: () => void;
  icon?: React.ReactNode;
  isActive?: boolean;
}

export const FilterButton: React.FC<FilterButtonProps> = ({
  text,
  onPress,
  icon,
  isActive = false,
}) => {
  const { colors } = useThemeColors();

  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: isActive ? colors.primaryLight : colors.surface,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: isActive ? colors.primary : colors.border,
        gap: Spacing.xs,
      }}
      onPress={onPress}
    >
      {icon}
      <Text
        style={{
          ...Typography.caption,
          color: isActive ? colors.primary : colors.text,
          fontWeight: '500',
        }}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
};

// Results Header Component
interface ResultsHeaderProps {
  count: number;
  itemType: string;
  location?: string;
}

export const ResultsHeader: React.FC<ResultsHeaderProps> = ({
  count,
  itemType,
  location,
}) => {
  const { colors } = useThemeColors();

  return (
    <View
      style={{
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        backgroundColor: colors.background,
      }}
    >
      <Text
        style={{
          ...Typography.subtitle,
          color: colors.text,
          fontWeight: '700',
        }}
      >
        {count} {itemType}
        {count !== 1 ? 's' : ''} {location ? `in ${location}` : 'available'}
      </Text>
      <Text
        style={{
          ...Typography.caption,
          color: colors.textSecondary,
        }}
      >
        Updated recently
      </Text>
    </View>
  );
};
