import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useTheme';
import { CheckCircle, Award, Star, Users, Calendar, TrendingUp, Eye, Zap, X } from '@/utils/ultra-optimized-icons';

interface ExpertCredential {
  id: string;
  title: string;
  organization: string;
  year: number;
  verified: boolean;
  icon: any;
  description: string;
}

interface ExpertVerificationProps {
  visible: boolean;
  onClose: () => void;
  expertName: string;
  title: string;
  yearsExperience: number;
  credentials: ExpertCredential[];
  achievements: {
    reviewsWritten: number;
    carsEvaluated: number;
    dealershipsVisited: number;
    readersHelped: number;
  };
  verificationLevel: 'verified' | 'expert' | 'master';
}

export const ExpertVerificationModal: React.FC<ExpertVerificationProps> = ({
  visible,
  onClose,
  expertName,
  title,
  yearsExperience,
  credentials,
  achievements,
  verificationLevel,
}) => {
  const { colors } = useThemeColors();
  const styles = getStyles(colors);

  const getVerificationColor = () => {
    switch (verificationLevel) {
      case 'master': return '#FFD700'; // Gold
      case 'expert': return colors.primary;
      case 'verified': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const getVerificationBadge = () => {
    switch (verificationLevel) {
      case 'master': return 'Master Expert';
      case 'expert': return 'Expert Reviewer';
      case 'verified': return 'Verified Reviewer';
      default: return 'Reviewer';
    }
  };

  const renderVerificationHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={[getVerificationColor(), `${getVerificationColor()}80`]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.closeButton}>
            <TouchableOpacity onPress={onClose} style={styles.closeButtonInner}>
              <X color={colors.white} size={20} />
            </TouchableOpacity>
          </View>

          <View style={styles.verificationBadge}>
            <Shield color={colors.white} size={24} fill={colors.white} />
            <Text style={styles.verificationBadgeText}>
              {getVerificationBadge()}
            </Text>
          </View>

          <Text style={styles.expertNameHeader}>{expertName}</Text>
          <Text style={styles.expertTitleHeader}>{title}</Text>
          
          <View style={styles.experienceContainer}>
            <Calendar color={colors.white} size={16} />
            <Text style={styles.experienceText}>
              {yearsExperience}+ Years of Experience
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderAchievements = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Professional Achievements</Text>
      <View style={styles.achievementsGrid}>
        <View style={styles.achievementCard}>
          <BookOpen color={colors.primary} size={20} />
          <Text style={styles.achievementValue}>{achievements.reviewsWritten}</Text>
          <Text style={styles.achievementLabel}>Expert Reviews</Text>
        </View>
        
        <View style={styles.achievementCard}>
          <Target color={colors.primary} size={20} />
          <Text style={styles.achievementValue}>{achievements.carsEvaluated}</Text>
          <Text style={styles.achievementLabel}>Cars Evaluated</Text>
        </View>
        
        <View style={styles.achievementCard}>
          <Users color={colors.primary} size={20} />
          <Text style={styles.achievementValue}>{achievements.dealershipsVisited}</Text>
          <Text style={styles.achievementLabel}>Dealers Visited</Text>
        </View>
        
        <View style={styles.achievementCard}>
          <Eye color={colors.primary} size={20} />
          <Text style={styles.achievementValue}>{(achievements.readersHelped / 1000).toFixed(0)}K+</Text>
          <Text style={styles.achievementLabel}>Readers Helped</Text>
        </View>
      </View>
    </View>
  );

  const renderCredentials = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Professional Credentials</Text>
      {credentials.map((credential) => (
        <View key={credential.id} style={styles.credentialCard}>
          <View style={styles.credentialHeader}>
            <View style={styles.credentialIcon}>
              <credential.icon color={colors.primary} size={20} />
            </View>
            <View style={styles.credentialInfo}>
              <Text style={styles.credentialTitle}>{credential.title}</Text>
              <Text style={styles.credentialOrg}>{credential.organization}</Text>
              <Text style={styles.credentialYear}>{credential.year}</Text>
            </View>
            {credential.verified && (
              <CheckCircle color={colors.success} size={20} fill={colors.success} />
            )}
          </View>
          <Text style={styles.credentialDescription}>{credential.description}</Text>
        </View>
      ))}
    </View>
  );

  const renderVerificationProcess = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Verification Process</Text>
      <View style={styles.verificationSteps}>
        <View style={styles.verificationStep}>
          <View style={styles.stepIcon}>
            <CheckCircle color={colors.success} size={16} fill={colors.success} />
          </View>
          <Text style={styles.stepText}>Identity Verification</Text>
        </View>
        
        <View style={styles.verificationStep}>
          <View style={styles.stepIcon}>
            <CheckCircle color={colors.success} size={16} fill={colors.success} />
          </View>
          <Text style={styles.stepText}>Professional Background Check</Text>
        </View>
        
        <View style={styles.verificationStep}>
          <View style={styles.stepIcon}>
            <CheckCircle color={colors.success} size={16} fill={colors.success} />
          </View>
          <Text style={styles.stepText}>Industry Experience Validation</Text>
        </View>
        
        <View style={styles.verificationStep}>
          <View style={styles.stepIcon}>
            <CheckCircle color={colors.success} size={16} fill={colors.success} />
          </View>
          <Text style={styles.stepText}>Ongoing Quality Monitoring</Text>
        </View>
      </View>
    </View>
  );

  const renderTrustIndicators = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Trust & Quality Assurance</Text>
      <View style={styles.trustGrid}>
        <View style={styles.trustItem}>
          <Shield color={colors.success} size={16} />
          <Text style={styles.trustText}>Independent Reviews</Text>
        </View>
        
        <View style={styles.trustItem}>
          <Star color={colors.warning} size={16} />
          <Text style={styles.trustText}>Transparent Scoring</Text>
        </View>
        
        <View style={styles.trustItem}>
          <TrendingUp color={colors.primary} size={16} />
          <Text style={styles.trustText}>Data-Driven Analysis</Text>
        </View>
        
        <View style={styles.trustItem}>
          <Zap color={colors.primary} size={16} />
          <Text style={styles.trustText}>Real-World Testing</Text>
        </View>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {renderVerificationHeader()}
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderAchievements()}
          {renderCredentials()}
          {renderVerificationProcess()}
          {renderTrustIndicators()}
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              CarSuggester Expert verification ensures you receive trusted, 
              professional automotive advice from qualified industry experts.
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

// Quick verification badge component for use throughout the app
interface QuickVerificationBadgeProps {
  verificationLevel: 'verified' | 'expert' | 'master';
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  onPress?: () => void;
}

export const QuickVerificationBadge: React.FC<QuickVerificationBadgeProps> = ({
  verificationLevel,
  size = 'medium',
  showText = true,
  onPress,
}) => {
  const { colors } = useThemeColors();
  const styles = getStyles(colors);

  const getVerificationColor = () => {
    switch (verificationLevel) {
      case 'master': return '#FFD700';
      case 'expert': return colors.primary;
      case 'verified': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const getBadgeText = () => {
    switch (verificationLevel) {
      case 'master': return 'Master Expert';
      case 'expert': return 'Expert';
      case 'verified': return 'Verified';
      default: return 'Reviewer';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small': return 12;
      case 'large': return 20;
      default: return 16;
    }
  };

  const badgeStyle = [
    styles.quickBadge,
    size === 'small' && styles.quickBadgeSmall,
    size === 'large' && styles.quickBadgeLarge,
    { backgroundColor: `${getVerificationColor()}20` }
  ];

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component style={badgeStyle} onPress={onPress}>
      <Shield 
        color={getVerificationColor()} 
        size={getIconSize()} 
        fill={getVerificationColor()} 
      />
      {showText && (
        <Text style={[
          styles.quickBadgeText,
          { color: getVerificationColor() },
          size === 'small' && styles.quickBadgeTextSmall,
          size === 'large' && styles.quickBadgeTextLarge,
        ]}>
          {getBadgeText()}
        </Text>
      )}
    </Component>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    height: 200,
  },
  headerGradient: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  closeButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  verificationBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  expertNameHeader: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  expertTitleHeader: {
    color: colors.white,
    fontSize: 16,
    opacity: 0.9,
    textAlign: 'center',
  },
  experienceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  experienceText: {
    color: colors.white,
    fontSize: 14,
    opacity: 0.9,
  },

  // Content
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 16,
  },

  // Achievements
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  achievementValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  achievementLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Credentials
  credentialCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  credentialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  credentialIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  credentialInfo: {
    flex: 1,
  },
  credentialTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  credentialOrg: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  credentialYear: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  credentialDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Verification Steps
  verificationSteps: {
    gap: 12,
  },
  verificationStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },

  // Trust Indicators
  trustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  trustItem: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: colors.primaryLight,
    borderRadius: 8,
  },
  trustText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },

  // Footer
  footer: {
    padding: 20,
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Quick Badge
  quickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  quickBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 3,
  },
  quickBadgeLarge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 6,
  },
  quickBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  quickBadgeTextSmall: {
    fontSize: 10,
  },
  quickBadgeTextLarge: {
    fontSize: 14,
  },
});
