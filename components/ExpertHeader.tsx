import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useTheme';
import {
  Award,
  CheckCircle,
  TrendingUp,
  User,
  Star,
  Calendar,
} from '@/utils/ultra-optimized-icons';

interface ExpertHeaderProps {
  expertName?: string;
  credentials?: string;
  yearsExperience?: number;
  reviewsCount?: number;
  averageRating?: number;
  specializations?: string[];
  onViewProfile?: () => void;
}

export const ExpertHeader: React.FC<ExpertHeaderProps> = ({
  expertName = 'CarSuggester Expert Team',
  credentials = 'Automotive Industry Professionals',
  yearsExperience = 15,
  reviewsCount = 156,
  averageRating = 4.8,
  specializations = ['Luxury Cars', 'Electric Vehicles', 'Sports Cars', 'SUVs'],
  onViewProfile,
}) => {
  const { colors } = useThemeColors();
  const styles = getStyles(colors);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryHover]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Expert Info */}
          <View style={styles.expertInfo}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[colors.white, colors.surface]}
                style={styles.avatar}
              >
                <User color={colors.primary} size={32} />
              </LinearGradient>
              <View style={styles.verificationBadge}>
                <CheckCircle
                  color={colors.success}
                  size={16}
                  fill={colors.success}
                />
              </View>
            </View>

            <View style={styles.expertDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.expertName}>{expertName}</Text>
                <Shield color={colors.white} size={16} />
              </View>
              <Text style={styles.credentials}>{credentials}</Text>
              <View style={styles.experienceRow}>
                <Calendar color={colors.white} size={14} />
                <Text style={styles.experience}>
                  {yearsExperience}+ years experience
                </Text>
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <BookOpen color={colors.white} size={16} />
              <Text style={styles.statValue}>{reviewsCount}</Text>
              <Text style={styles.statLabel}>Expert Reviews</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Star color={colors.warning} size={16} fill={colors.warning} />
              <Text style={styles.statValue}>{averageRating}</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <TrendingUp color={colors.white} size={16} />
              <Text style={styles.statValue}>98%</Text>
              <Text style={styles.statLabel}>Reader Trust</Text>
            </View>
          </View>

          {/* Specializations */}
          <View style={styles.specializationsContainer}>
            <Text style={styles.specializationsTitle}>Specializations:</Text>
            <View style={styles.specializationsGrid}>
              {specializations.slice(0, 4).map((spec, index) => (
                <View key={index} style={styles.specializationChip}>
                  <Text style={styles.specializationText}>{spec}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Call to Action */}
          {onViewProfile && (
            <TouchableOpacity
              style={styles.profileButton}
              onPress={onViewProfile}
            >
              <Text style={styles.profileButtonText}>View Expert Profile</Text>
              <Award color={colors.primary} size={16} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Trust Indicators */}
      <View style={styles.trustIndicators}>
        <View style={styles.trustItem}>
          <CheckCircle color={colors.success} size={16} fill={colors.success} />
          <Text style={styles.trustText}>Verified Expert</Text>
        </View>
        <View style={styles.trustItem}>
          <Shield color={colors.primary} size={16} />
          <Text style={styles.trustText}>Independent Reviews</Text>
        </View>
        <View style={styles.trustItem}>
          <Award color={colors.warning} size={16} />
          <Text style={styles.trustText}>Industry Recognized</Text>
        </View>
      </View>
    </View>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      marginBottom: 20,
    },
    gradient: {
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 16,
    },
    content: {
      gap: 16,
    },

    // Expert Info
    expertInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    avatarContainer: {
      position: 'relative',
    },
    avatar: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.white,
    },
    verificationBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: colors.white,
      borderRadius: 12,
      padding: 2,
    },
    expertDetails: {
      flex: 1,
      gap: 4,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    expertName: {
      color: colors.white,
      fontSize: 20,
      fontWeight: 'bold',
    },
    credentials: {
      color: colors.white,
      fontSize: 14,
      opacity: 0.9,
      fontStyle: 'italic',
    },
    experienceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 4,
    },
    experience: {
      color: colors.white,
      fontSize: 12,
      opacity: 0.8,
    },

    // Stats
    statsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-around',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    statItem: {
      alignItems: 'center',
      gap: 4,
      flex: 1,
    },
    statDivider: {
      width: 1,
      height: 40,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    statValue: {
      color: colors.white,
      fontSize: 18,
      fontWeight: 'bold',
    },
    statLabel: {
      color: colors.white,
      fontSize: 10,
      opacity: 0.8,
      textAlign: 'center',
    },

    // Specializations
    specializationsContainer: {
      gap: 8,
    },
    specializationsTitle: {
      color: colors.white,
      fontSize: 14,
      fontWeight: '600',
      opacity: 0.9,
    },
    specializationsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    specializationChip: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    specializationText: {
      color: colors.white,
      fontSize: 12,
      fontWeight: '500',
    },

    // Profile Button
    profileButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.white,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 12,
      gap: 8,
    },
    profileButtonText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '600',
    },

    // Trust Indicators
    trustIndicators: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 12,
      paddingHorizontal: 16,
    },
    trustItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
      justifyContent: 'center',
    },
    trustText: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '500',
    },
  });
