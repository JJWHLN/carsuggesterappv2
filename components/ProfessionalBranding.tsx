import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useTheme';
import { QuickVerificationBadge } from '@/components/ExpertVerification';
import { Award, Star, Users, Calendar, TrendingUp, Zap, CheckCircle, Mail, MapPin } from '@/utils/ultra-optimized-icons';

interface ProfessionalCredential {
  id: string;
  title: string;
  organization: string;
  issueDate: string;
  expiryDate?: string;
  credentialId: string;
  verificationUrl?: string;
  logo?: string;
  icon: any;
  category: 'certification' | 'education' | 'membership' | 'award';
}

interface ExpertProfile {
  id: string;
  name: string;
  title: string;
  bio: string;
  yearsExperience: number;
  specializations: string[];
  verificationLevel: 'verified' | 'expert' | 'master';
  profileImage?: string;
  credentials: ProfessionalCredential[];
  socialProof: {
    reviewsWritten: number;
    helpfulVotes: number;
    followersCount: number;
    industryConnections: number;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    location?: string;
    website?: string;
  };
}

interface ProfessionalBrandingProps {
  expert?: ExpertProfile;
  showCredentials?: boolean;
  showSocialProof?: boolean;
  compact?: boolean;
  onContactExpert?: () => void;
  onViewCredentials?: () => void;
}

export const ProfessionalBranding: React.FC<ProfessionalBrandingProps> = ({
  expert,
  showCredentials = true,
  showSocialProof = true,
  compact = false,
  onContactExpert,
  onViewCredentials,
}) => {
  const { colors } = useThemeColors();
  const styles = getStyles(colors);
  const [activeCredentialCategory, setActiveCredentialCategory] = useState<string>('all');

  // Example expert data (replace with actual data)
  const defaultExpert: ExpertProfile = {
    id: 'expert-1',
    name: 'Dr. Sarah Johnson',
    title: 'Senior Automotive Engineer & Review Specialist',
    bio: 'With over 15 years in automotive engineering and extensive experience in vehicle testing, Dr. Johnson provides expert analysis on vehicle performance, safety, and technology integration.',
    yearsExperience: 15,
    specializations: ['Electric Vehicles', 'Safety Systems', 'Performance Testing', 'Hybrid Technology'],
    verificationLevel: 'master',
    credentials: [
      {
        id: 'ase-cert',
        title: 'ASE Master Technician',
        organization: 'National Institute for Automotive Service Excellence',
        issueDate: '2020-03-15',
        expiryDate: '2025-03-15',
        credentialId: 'ASE-MT-2020-7845',
        verificationUrl: 'https://example.com/verify/ase',
        icon: Award,
        category: 'certification',
      },
      {
        id: 'phd-auto',
        title: 'PhD in Automotive Engineering',
        organization: 'MIT - Massachusetts Institute of Technology',
        issueDate: '2015-06-01',
        credentialId: 'MIT-PhD-AE-2015',
        icon: BookOpen,
        category: 'education',
      },
      {
        id: 'sae-member',
        title: 'SAE International Member',
        organization: 'Society of Automotive Engineers',
        issueDate: '2010-01-01',
        credentialId: 'SAE-2010-45789',
        verificationUrl: 'https://example.com/verify/sae',
        icon: Users,
        category: 'membership',
      },
      {
        id: 'excellence-award',
        title: 'Automotive Excellence Award',
        organization: 'International Automotive Association',
        issueDate: '2022-11-20',
        credentialId: 'IAA-AEA-2022',
        icon: Star,
        category: 'award',
      },
    ],
    socialProof: {
      reviewsWritten: 247,
      helpfulVotes: 15600,
      followersCount: 8900,
      industryConnections: 156,
    },
    contactInfo: {
      email: 'sarah.johnson@carsuggester.com',
      location: 'Detroit, MI',
      website: 'https://sarahjohnson-automotive.com',
    },
  };

  const currentExpert = expert || defaultExpert;

  const openVerificationUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      logger.error('Error opening verification URL:', error);
    }
  };

  const getCredentialsByCategory = (category: string) => {
    if (category === 'all') return currentExpert.credentials;
    return currentExpert.credentials.filter(cred => cred.category === category);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'certification': return Award;
      case 'education': return BookOpen;
      case 'membership': return Users;
      case 'award': return Star;
      default: return Award;
    }
  };

  const renderExpertHeader = () => (
    <View style={styles.expertHeader}>
      <LinearGradient
        colors={[colors.primary, `${colors.primary}80`]}
        style={styles.expertHeaderGradient}
      >
        <View style={styles.expertHeaderContent}>
          <View style={styles.expertInfo}>
            <View style={styles.expertAvatar}>
              {currentExpert.profileImage ? (
                <Image source={{ uri: currentExpert.profileImage }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {currentExpert.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.expertDetails}>
              <View style={styles.expertNameRow}>
                <Text style={styles.expertName}>{currentExpert.name}</Text>
                <QuickVerificationBadge 
                  verificationLevel={currentExpert.verificationLevel}
                  size="small"
                />
              </View>
              
              <Text style={styles.expertTitle}>{currentExpert.title}</Text>
              
              <View style={styles.experienceRow}>
                <Calendar color={colors.white} size={14} />
                <Text style={styles.experienceText}>
                  {currentExpert.yearsExperience}+ Years Experience
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.expertBio}>{currentExpert.bio}</Text>

          <View style={styles.specializations}>
            {currentExpert.specializations.map((spec, index) => (
              <View key={index} style={styles.specializationTag}>
                <Text style={styles.specializationText}>{spec}</Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderSocialProof = () => {
    if (!showSocialProof) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Professional Impact</Text>
        <View style={styles.socialProofGrid}>
          <View style={styles.proofCard}>
            <FileText color={colors.primary} size={20} />
            <Text style={styles.proofValue}>{currentExpert.socialProof.reviewsWritten}</Text>
            <Text style={styles.proofLabel}>Expert Reviews</Text>
          </View>

          <View style={styles.proofCard}>
            <TrendingUp color={colors.success} size={20} />
            <Text style={styles.proofValue}>{(currentExpert.socialProof.helpfulVotes / 1000).toFixed(1)}K+</Text>
            <Text style={styles.proofLabel}>Helpful Votes</Text>
          </View>

          <View style={styles.proofCard}>
            <Users color={colors.warning} size={20} />
            <Text style={styles.proofValue}>{(currentExpert.socialProof.followersCount / 1000).toFixed(1)}K+</Text>
            <Text style={styles.proofLabel}>Followers</Text>
          </View>

          <View style={styles.proofCard}>
            <Building color={colors.primary} size={20} />
            <Text style={styles.proofValue}>{currentExpert.socialProof.industryConnections}</Text>
            <Text style={styles.proofLabel}>Connections</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCredentialCategories = () => (
    <View style={styles.categoryContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.categoryTab, activeCredentialCategory === 'all' && styles.activeCategoryTab]}
          onPress={() => setActiveCredentialCategory('all')}
        >
          <Shield color={activeCredentialCategory === 'all' ? colors.primary : colors.textSecondary} size={16} />
          <Text style={[
            styles.categoryTabText,
            activeCredentialCategory === 'all' && styles.activeCategoryTabText
          ]}>
            All
          </Text>
        </TouchableOpacity>

        {['certification', 'education', 'membership', 'award'].map(category => {
          const Icon = getCategoryIcon(category);
          return (
            <TouchableOpacity
              key={category}
              style={[styles.categoryTab, activeCredentialCategory === category && styles.activeCategoryTab]}
              onPress={() => setActiveCredentialCategory(category)}
            >
              <Icon color={activeCredentialCategory === category ? colors.primary : colors.textSecondary} size={16} />
              <Text style={[
                styles.categoryTabText,
                activeCredentialCategory === category && styles.activeCategoryTabText
              ]}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderCredentials = () => {
    if (!showCredentials) return null;

    const filteredCredentials = getCredentialsByCategory(activeCredentialCategory);

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Professional Credentials</Text>
        {renderCredentialCategories()}
        
        <View style={styles.credentialsContainer}>
          {filteredCredentials.map((credential) => (
            <View key={credential.id} style={styles.credentialCard}>
              <View style={styles.credentialHeader}>
                <View style={styles.credentialIcon}>
                  <credential.icon color={colors.primary} size={20} />
                </View>
                
                <View style={styles.credentialInfo}>
                  <Text style={styles.credentialTitle}>{credential.title}</Text>
                  <Text style={styles.credentialOrg}>{credential.organization}</Text>
                  <Text style={styles.credentialDate}>
                    Issued: {new Date(credential.issueDate).toLocaleDateString()}
                    {credential.expiryDate && ` • Expires: ${new Date(credential.expiryDate).toLocaleDateString()}`}
                  </Text>
                  <Text style={styles.credentialId}>ID: {credential.credentialId}</Text>
                </View>

                <CheckCircle color={colors.success} size={20} fill={colors.success} />
              </View>

              {credential.verificationUrl && (
                <TouchableOpacity
                  style={styles.verificationButton}
                  onPress={() => openVerificationUrl(credential.verificationUrl!)}
                >
                  <ExternalLink color={colors.primary} size={14} />
                  <Text style={styles.verificationButtonText}>Verify Credential</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderContactInfo = () => {
    if (!currentExpert.contactInfo) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Professional Contact</Text>
        <View style={styles.contactCard}>
          {currentExpert.contactInfo.email && (
            <View style={styles.contactItem}>
              <Mail color={colors.primary} size={16} />
              <Text style={styles.contactText}>{currentExpert.contactInfo.email}</Text>
            </View>
          )}

          {currentExpert.contactInfo.location && (
            <View style={styles.contactItem}>
              <MapPin color={colors.primary} size={16} />
              <Text style={styles.contactText}>{currentExpert.contactInfo.location}</Text>
            </View>
          )}

          {currentExpert.contactInfo.website && (
            <TouchableOpacity
              style={styles.contactItem}
              onPress={() => openVerificationUrl(currentExpert.contactInfo!.website!)}
            >
              <Globe color={colors.primary} size={16} />
              <Text style={[styles.contactText, styles.contactLink]}>
                {currentExpert.contactInfo.website.replace('https://', '')}
              </Text>
              <ExternalLink color={colors.textSecondary} size={14} />
            </TouchableOpacity>
          )}

          {onContactExpert && (
            <TouchableOpacity style={styles.contactButton} onPress={onContactExpert}>
              <Mail color={colors.white} size={16} />
              <Text style={styles.contactButtonText}>Contact Expert</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderCompact = () => (
    <View style={styles.compactContainer}>
      <View style={styles.compactHeader}>
        <View style={styles.compactAvatar}>
          <Text style={styles.compactAvatarText}>
            {currentExpert.name.split(' ').map(n => n[0]).join('')}
          </Text>
        </View>
        
        <View style={styles.compactInfo}>
          <View style={styles.compactNameRow}>
            <Text style={styles.compactName}>{currentExpert.name}</Text>
            <QuickVerificationBadge 
              verificationLevel={currentExpert.verificationLevel}
              size="small"
              showText={false}
            />
          </View>
          <Text style={styles.compactTitle}>{currentExpert.title}</Text>
        </View>
      </View>

      <View style={styles.compactStats}>
        <Text style={styles.compactStat}>
          {currentExpert.yearsExperience}+ years • {currentExpert.socialProof.reviewsWritten} reviews
        </Text>
      </View>
    </View>
  );

  if (compact) {
    return renderCompact();
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {renderExpertHeader()}
      {renderSocialProof()}
      {renderCredentials()}
      {renderContactInfo()}
    </ScrollView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Expert Header
  expertHeader: {
    minHeight: 300,
  },
  expertHeaderGradient: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  expertHeaderContent: {
    gap: 16,
  },
  expertInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  expertAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.white,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  expertDetails: {
    flex: 1,
    gap: 4,
  },
  expertNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expertName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  expertTitle: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.9,
    lineHeight: 22,
  },
  experienceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  experienceText: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
  },
  expertBio: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    lineHeight: 20,
  },
  specializations: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specializationTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  specializationText: {
    fontSize: 12,
    color: colors.white,
    fontWeight: '500',
  },

  // Sections
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

  // Social Proof
  socialProofGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  proofCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  proofValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  proofLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Credential Categories
  categoryContainer: {
    marginBottom: 16,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  activeCategoryTab: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  categoryTabText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeCategoryTabText: {
    color: colors.primary,
  },

  // Credentials
  credentialsContainer: {
    gap: 12,
  },
  credentialCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  credentialHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
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
    marginBottom: 2,
  },
  credentialOrg: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  credentialDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  credentialId: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  verificationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  verificationButtonText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },

  // Contact Info
  contactCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  contactLink: {
    color: colors.primary,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  contactButtonText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
  },

  // Compact
  compactContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  compactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.white,
  },
  compactInfo: {
    flex: 1,
  },
  compactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  compactTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  compactStats: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  compactStat: {
    fontSize: 11,
    color: colors.textSecondary,
  },
});

export default ProfessionalBranding;
