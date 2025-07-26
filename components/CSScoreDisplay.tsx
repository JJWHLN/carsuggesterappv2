import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useTheme';
import { Award, TrendingUp, Zap, Star } from '@/utils/ultra-optimized-icons';

interface CSScoreDisplayProps {
  score: number; // 0-100
  breakdown?: {
    performance: number;
    value: number;
    reliability: number;
    features: number;
    design: number;
  };
  size?: 'small' | 'medium' | 'large';
  showBreakdown?: boolean;
  onInfoPress?: () => void;
}

export const CSScoreDisplay: React.FC<CSScoreDisplayProps> = ({
  score,
  breakdown,
  size = 'medium',
  showBreakdown = false,
  onInfoPress,
}) => {
  const { colors } = useThemeColors();
  const styles = getStyles(colors, size);

  const getScoreColor = (score: number) => {
    if (score >= 90) return colors.success;
    if (score >= 80) return colors.primary;
    if (score >= 70) return colors.warning;
    return colors.error;
  };

  const getScoreGrade = (score: number) => {
    if (score >= 95) return 'Exceptional';
    if (score >= 90) return 'Excellent';
    if (score >= 85) return 'Outstanding';
    if (score >= 80) return 'Very Good';
    if (score >= 75) return 'Good';
    if (score >= 70) return 'Above Average';
    if (score >= 60) return 'Average';
    return 'Below Average';
  };

  const scoreColor = getScoreColor(score);
  const grade = getScoreGrade(score);

  const renderScoreCircle = () => (
    <View style={styles.scoreContainer}>
      <LinearGradient
        colors={[scoreColor, `${scoreColor}80`]}
        style={styles.scoreCircle}
      >
        <View style={styles.scoreInner}>
          <Award color={colors.white} size={size === 'large' ? 24 : 20} />
          <Text style={styles.scoreText}>{score}</Text>
          <Text style={styles.scoreMax}>/100</Text>
        </View>
      </LinearGradient>

      <View style={styles.scoreInfo}>
        <Text style={styles.scoreBrand}>CS Score</Text>
        <Text style={styles.scoreGrade}>{grade}</Text>
      </View>
    </View>
  );

  const renderBreakdown = () => {
    if (!breakdown || !showBreakdown) return null;

    const categories = [
      {
        key: 'performance',
        label: 'Performance',
        icon: Zap,
        value: breakdown.performance,
      },
      {
        key: 'value',
        label: 'Value',
        icon: TrendingUp,
        value: breakdown.value,
      },
      {
        key: 'reliability',
        label: 'Reliability',
        icon: Shield,
        value: breakdown.reliability,
      },
      {
        key: 'features',
        label: 'Features',
        icon: Star,
        value: breakdown.features,
      },
      { key: 'design', label: 'Design', icon: Award, value: breakdown.design },
    ];

    return (
      <View style={styles.breakdown}>
        <View style={styles.breakdownHeader}>
          <Text style={styles.breakdownTitle}>Score Breakdown</Text>
          {onInfoPress && (
            <TouchableOpacity onPress={onInfoPress} style={styles.infoButton}>
              <Info color={colors.textSecondary} size={16} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.breakdownGrid}>
          {categories.map((category) => (
            <View key={category.key} style={styles.breakdownItem}>
              <View style={styles.breakdownItemHeader}>
                <category.icon
                  color={getScoreColor(category.value)}
                  size={16}
                />
                <Text style={styles.breakdownLabel}>{category.label}</Text>
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${category.value}%`,
                        backgroundColor: getScoreColor(category.value),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.breakdownValue}>{category.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (size === 'small') {
    return (
      <View style={styles.smallContainer}>
        <View style={styles.smallScore}>
          <Award color={scoreColor} size={16} />
          <Text style={styles.smallScoreText}>{score}</Text>
        </View>
        <Text style={styles.smallLabel}>CS Score</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderScoreCircle()}
      {renderBreakdown()}

      {!showBreakdown && onInfoPress && (
        <TouchableOpacity onPress={onInfoPress} style={styles.learnMoreButton}>
          <Text style={styles.learnMoreText}>Learn about CS Score</Text>
          <Info color={colors.primary} size={14} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const getStyles = (colors: any, size: 'small' | 'medium' | 'large') => {
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  return StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: 16,
    },

    // Small Size
    smallContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    smallScore: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surface,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    smallScoreText: {
      fontSize: 14,
      fontWeight: 'bold',
      color: colors.text,
    },
    smallLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },

    // Score Circle
    scoreContainer: {
      alignItems: 'center',
      gap: 8,
    },
    scoreCircle: {
      width: isLarge ? 120 : 100,
      height: isLarge ? 120 : 100,
      borderRadius: isLarge ? 60 : 50,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    scoreInner: {
      alignItems: 'center',
      gap: 4,
    },
    scoreText: {
      fontSize: isLarge ? 32 : 28,
      fontWeight: 'bold',
      color: colors.white,
    },
    scoreMax: {
      fontSize: isLarge ? 14 : 12,
      color: colors.white,
      opacity: 0.8,
    },
    scoreInfo: {
      alignItems: 'center',
      gap: 2,
    },
    scoreBrand: {
      fontSize: isLarge ? 16 : 14,
      fontWeight: '600',
      color: colors.primary,
    },
    scoreGrade: {
      fontSize: isLarge ? 14 : 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },

    // Breakdown
    breakdown: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      gap: 12,
    },
    breakdownHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    breakdownTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    infoButton: {
      padding: 4,
    },
    breakdownGrid: {
      gap: 12,
    },
    breakdownItem: {
      gap: 8,
    },
    breakdownItemHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    breakdownLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      flex: 1,
    },
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    progressTrack: {
      flex: 1,
      height: 6,
      backgroundColor: colors.border,
      borderRadius: 3,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    breakdownValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      minWidth: 24,
      textAlign: 'right',
    },

    // Learn More
    learnMoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.primaryLight,
      borderRadius: 8,
    },
    learnMoreText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
  });
};
