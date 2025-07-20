import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useThemeColors } from '@/hooks/useTheme';
import { Building2, Users, Star, MapPin } from '@/utils/ultra-optimized-icons';

interface DealerSectionProps {
  onPressDealer?: (dealerId: string) => void;
}

const DealerSection: React.FC<DealerSectionProps> = ({ onPressDealer }) => {
  const { colors } = useThemeColors();
  const styles = getThemedStyles(colors);

  const topDealers = [
    {
      id: '1',
      name: 'Premium Auto Group',
      rating: 4.8,
      reviewCount: 245,
      location: 'Dublin',
      specialization: 'Luxury Vehicles',
    },
    {
      id: '2',
      name: 'City Motors',
      rating: 4.6,
      reviewCount: 178,
      location: 'Cork',
      specialization: 'Family Cars',
    },
    {
      id: '3',
      name: 'Green Drive Auto',
      rating: 4.9,
      reviewCount: 156,
      location: 'Galway',
      specialization: 'Electric Vehicles',
    },
  ];

  return (
    <View style={styles.dealerSection}>
      <View style={styles.sectionHeader}>
        <Building2 size={20} color={colors.primary} />
        <Text style={styles.sectionTitle}>Top Dealers</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {topDealers.map((dealer) => (
          <TouchableOpacity
            key={dealer.id}
            style={styles.dealerCard}
            onPress={() => onPressDealer?.(dealer.id)}
          >
            <View style={styles.dealerHeader}>
              <View style={styles.dealerIcon}>
                <Building2 size={24} color={colors.primary} />
              </View>
              <View style={styles.dealerInfo}>
                <Text style={styles.dealerName}>{dealer.name}</Text>
                <View style={styles.dealerRating}>
                  <Star size={14} color={colors.warning} />
                  <Text style={styles.ratingText}>{dealer.rating}</Text>
                  <Text style={styles.reviewText}>({dealer.reviewCount})</Text>
                </View>
              </View>
            </View>
            <View style={styles.dealerDetails}>
              <View style={styles.dealerLocation}>
                <MapPin size={12} color={colors.textSecondary} />
                <Text style={styles.locationText}>{dealer.location}</Text>
              </View>
              <Text style={styles.specializationText}>{dealer.specialization}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const getThemedStyles = (colors: any) => StyleSheet.create({
  dealerSection: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 8,
  },
  dealerCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginLeft: 16,
    width: 200,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dealerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dealerIcon: {
    width: 40,
    height: 40,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dealerInfo: {
    flex: 1,
  },
  dealerName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  dealerRating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: colors.text,
    marginLeft: 2,
    fontWeight: '500',
  },
  reviewText: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: 2,
  },
  dealerDetails: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  dealerLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  specializationText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '500',
  },
});

export default DealerSection;
