import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import SkeletonPlaceholder from 'react-native-skeleton-placeholder';
import { useThemeColors } from '../../hooks/useTheme';
import { Spacing, BorderRadius } from '../../constants/Colors';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.lg * 3) / 2;

interface SkeletonCarCardProps {
  variant?: 'grid' | 'list';
  count?: number;
}

export const SkeletonCarCard: React.FC<SkeletonCarCardProps> = ({
  variant = 'grid',
  count = 1,
}) => {
  const { colors } = useThemeColors();

  const renderSkeleton = () => {
    if (variant === 'list') {
      return (
        <SkeletonPlaceholder
          backgroundColor={colors.border}
          highlightColor={colors.cardBackground}
          speed={1200}
        >
          <View style={styles.listContainer}>
            <View style={styles.listImage} />
            <View style={styles.listContent}>
              <View style={styles.listTitle} />
              <View style={styles.listPrice} />
              <View style={styles.listDetails}>
                <View style={styles.listDetail} />
                <View style={styles.listDetail} />
              </View>
            </View>
          </View>
        </SkeletonPlaceholder>
      );
    }

    return (
      <SkeletonPlaceholder
        backgroundColor={colors.border}
        highlightColor={colors.cardBackground}
        speed={1200}
      >
        <View style={styles.gridContainer}>
          <View style={styles.gridImage} />
          <View style={styles.gridContent}>
            <View style={styles.gridTitle} />
            <View style={styles.gridPrice} />
            <View style={styles.gridDetails}>
              <View style={styles.gridDetail} />
              <View style={styles.gridDetail} />
            </View>
            <View style={styles.gridDealer} />
          </View>
        </View>
      </SkeletonPlaceholder>
    );
  };

  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.wrapper}>
          {renderSkeleton()}
        </View>
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },

  // Grid variant styles
  gridContainer: {
    width: CARD_WIDTH,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
  },
  gridContent: {
    padding: Spacing.sm,
    gap: 8,
  },
  gridTitle: {
    width: '85%',
    height: 16,
    borderRadius: 4,
  },
  gridPrice: {
    width: '60%',
    height: 18,
    borderRadius: 4,
  },
  gridDetails: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  gridDetail: {
    width: 60,
    height: 12,
    borderRadius: 4,
  },
  gridDealer: {
    width: '70%',
    height: 12,
    borderRadius: 4,
  },

  // List variant styles
  listContainer: {
    width: '100%',
    height: 120,
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  listImage: {
    width: 120,
    height: 120,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  listContent: {
    flex: 1,
    padding: Spacing.md,
    gap: 8,
  },
  listTitle: {
    width: '80%',
    height: 16,
    borderRadius: 4,
  },
  listPrice: {
    width: '50%',
    height: 18,
    borderRadius: 4,
  },
  listDetails: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  listDetail: {
    width: 50,
    height: 12,
    borderRadius: 4,
  },
});
