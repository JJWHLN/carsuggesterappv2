import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useTheme';
import { QuickVerificationBadge } from '@/components/ExpertVerification';
import {
  CheckCircle,
  Award,
  Users,
  Star,
  TrendingUp,
  Clock,
  Zap,
  AlertTriangle,
} from '@/utils/ultra-optimized-icons';

interface TrustMetrics {
  totalReviews: number;
  verifiedExperts: number;
  industryConnections: number;
  transparencyScore: number;
  userSatisfaction: number;
  responseTime: string;
  lastUpdated: string;
}

interface CredibilityIndicator {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: 'verified' | 'pending' | 'in-progress';
  value?: string;
  link?: string;
}

interface TrustBuildingProps {
  showHeader?: boolean;
  compact?: boolean;
  onLearnMore?: () => void;
}

export const TrustAndAuthority: React.FC<TrustBuildingProps> = ({
  showHeader = true,
  compact = false,
  onLearnMore,
}) => {
  const { colors } = useThemeColors();
  const styles = getStyles(colors);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'verification' | 'transparency'
  >('overview');

  const trustMetrics: TrustMetrics = {
    totalReviews: 1247,
    verifiedExperts: 23,
    industryConnections: 156,
    transparencyScore: 98,
    userSatisfaction: 96,
    responseTime: '< 24 hours',
    lastUpdated: '2 hours ago',
  };

  const credibilityIndicators: CredibilityIndicator[] = [
    {
      id: 'iso-certified',
      title: 'ISO 9001:2015 Certified',
      description:
        'Quality management system certification for consistent service delivery',
      icon: Award,
      status: 'verified',
      value: 'Valid until 2026',
      link: 'https://example.com/iso-certificate',
    },
    {
      id: 'industry-partnerships',
      title: 'Industry Partnerships',
      description:
        'Verified partnerships with leading automotive organizations',
      icon: Building,
      status: 'verified',
      value: '15+ Active Partnerships',
    },
    {
      id: 'editorial-standards',
      title: 'Editorial Standards',
      description: 'Published editorial guidelines and review methodology',
      icon: FileText,
      status: 'verified',
      link: 'https://example.com/editorial-standards',
    },
    {
      id: 'real-world-testing',
      title: 'Real-World Testing',
      description:
        'All reviews based on actual vehicle testing and dealership visits',
      icon: Camera,
      status: 'verified',
      value: '100% Authentic',
    },
    {
      id: 'data-transparency',
      title: 'Data Transparency',
      description: 'Open access to review methodology and scoring criteria',
      icon: Globe,
      status: 'verified',
      link: 'https://example.com/methodology',
    },
    {
      id: 'expert-network',
      title: 'Expert Network',
      description: 'Verified automotive professionals and industry veterans',
      icon: Users,
      status: 'verified',
      value: '23 Verified Experts',
    },
  ];

  const openLink = useCallback(async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      logger.error('Error opening link:', error);
    }
  }, []);

  const renderHeader = () => {
    if (!showHeader) return null;

    return (
      <View style={styles.header}>
        <LinearGradient
          colors={[colors.primary, `${colors.primary}80`]}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Shield color={colors.white} size={32} fill={colors.white} />
            <Text style={styles.headerTitle}>Trust & Authority</Text>
            <Text style={styles.headerSubtitle}>
              Verified expertise you can trust
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
        onPress={() => setActiveTab('overview')}
      >
        <TrendingUp
          color={
            activeTab === 'overview' ? colors.primary : colors.textSecondary
          }
          size={16}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'overview' && styles.activeTabText,
          ]}
        >
          Overview
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'verification' && styles.activeTab]}
        onPress={() => setActiveTab('verification')}
      >
        <CheckCircle
          color={
            activeTab === 'verification' ? colors.primary : colors.textSecondary
          }
          size={16}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'verification' && styles.activeTabText,
          ]}
        >
          Verification
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'transparency' && styles.activeTab]}
        onPress={() => setActiveTab('transparency')}
      >
        <Globe
          color={
            activeTab === 'transparency' ? colors.primary : colors.textSecondary
          }
          size={16}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === 'transparency' && styles.activeTabText,
          ]}
        >
          Transparency
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTrustMetrics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Trust Metrics</Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <BookOpen color={colors.primary} size={20} />
          <Text style={styles.metricValue}>
            {trustMetrics.totalReviews.toLocaleString()}
          </Text>
          <Text style={styles.metricLabel}>Expert Reviews</Text>
        </View>

        <View style={styles.metricCard}>
          <Users color={colors.success} size={20} />
          <Text style={styles.metricValue}>{trustMetrics.verifiedExperts}</Text>
          <Text style={styles.metricLabel}>Verified Experts</Text>
        </View>

        <View style={styles.metricCard}>
          <Building color={colors.warning} size={20} />
          <Text style={styles.metricValue}>
            {trustMetrics.industryConnections}
          </Text>
          <Text style={styles.metricLabel}>Industry Partners</Text>
        </View>

        <View style={styles.metricCard}>
          <Star color={colors.warning} size={20} />
          <Text style={styles.metricValue}>
            {trustMetrics.userSatisfaction}%
          </Text>
          <Text style={styles.metricLabel}>User Satisfaction</Text>
        </View>
      </View>

      <View style={styles.additionalMetrics}>
        <View style={styles.additionalMetric}>
          <Shield color={colors.success} size={16} />
          <Text style={styles.additionalMetricText}>
            Transparency Score: {trustMetrics.transparencyScore}%
          </Text>
        </View>

        <View style={styles.additionalMetric}>
          <Clock color={colors.primary} size={16} />
          <Text style={styles.additionalMetricText}>
            Response Time: {trustMetrics.responseTime}
          </Text>
        </View>

        <View style={styles.additionalMetric}>
          <Zap color={colors.warning} size={16} />
          <Text style={styles.additionalMetricText}>
            Last Updated: {trustMetrics.lastUpdated}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCredibilityIndicators = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Credibility Indicators</Text>
      {credibilityIndicators.map((indicator) => (
        <View key={indicator.id} style={styles.indicatorCard}>
          <View style={styles.indicatorHeader}>
            <View style={styles.indicatorIcon}>
              <indicator.icon color={colors.primary} size={20} />
            </View>
            <View style={styles.indicatorInfo}>
              <Text style={styles.indicatorTitle}>{indicator.title}</Text>
              <Text style={styles.indicatorDescription}>
                {indicator.description}
              </Text>
              {indicator.value && (
                <Text style={styles.indicatorValue}>{indicator.value}</Text>
              )}
            </View>
            <View style={styles.indicatorStatus}>
              {indicator.status === 'verified' && (
                <CheckCircle
                  color={colors.success}
                  size={20}
                  fill={colors.success}
                />
              )}
            </View>
          </View>

          {indicator.link && (
            <TouchableOpacity
              style={styles.indicatorLink}
              onPress={() => openLink(indicator.link!)}
            >
              <ExternalLink color={colors.primary} size={14} />
              <Text style={styles.indicatorLinkText}>View Documentation</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </View>
  );

  const renderExpertNetwork = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Expert Network</Text>
      <View style={styles.expertNetworkCard}>
        <View style={styles.expertNetworkHeader}>
          <Users color={colors.primary} size={24} />
          <Text style={styles.expertNetworkTitle}>
            Verified Automotive Experts
          </Text>
        </View>

        <Text style={styles.expertNetworkDescription}>
          Our team consists of certified automotive professionals, former
          dealership managers, automotive journalists, and industry veterans
          with combined experience of over 200 years in the automotive sector.
        </Text>

        <View style={styles.expertCategories}>
          <View style={styles.expertCategory}>
            <Target color={colors.primary} size={16} />
            <Text style={styles.expertCategoryText}>
              ASE Certified Technicians
            </Text>
          </View>

          <View style={styles.expertCategory}>
            <Award color={colors.primary} size={16} />
            <Text style={styles.expertCategoryText}>
              Former Dealership Managers
            </Text>
          </View>

          <View style={styles.expertCategory}>
            <BookOpen color={colors.primary} size={16} />
            <Text style={styles.expertCategoryText}>
              Automotive Journalists
            </Text>
          </View>

          <View style={styles.expertCategory}>
            <Building color={colors.primary} size={16} />
            <Text style={styles.expertCategoryText}>Industry Consultants</Text>
          </View>
        </View>

        {onLearnMore && (
          <TouchableOpacity
            style={styles.learnMoreButton}
            onPress={onLearnMore}
          >
            <Text style={styles.learnMoreText}>Meet Our Experts</Text>
            <ExternalLink color={colors.primary} size={16} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderQualityAssurance = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quality Assurance</Text>
      <View style={styles.qualityGrid}>
        <View style={styles.qualityItem}>
          <CheckCircle color={colors.success} size={20} />
          <View style={styles.qualityContent}>
            <Text style={styles.qualityTitle}>Multi-Point Review Process</Text>
            <Text style={styles.qualityDescription}>
              Every review undergoes a comprehensive evaluation process
            </Text>
          </View>
        </View>

        <View style={styles.qualityItem}>
          <Shield color={colors.success} size={20} />
          <View style={styles.qualityContent}>
            <Text style={styles.qualityTitle}>Editorial Independence</Text>
            <Text style={styles.qualityDescription}>
              Reviews are free from manufacturer influence
            </Text>
          </View>
        </View>

        <View style={styles.qualityItem}>
          <Camera color={colors.success} size={20} />
          <View style={styles.qualityContent}>
            <Text style={styles.qualityTitle}>Photo & Video Evidence</Text>
            <Text style={styles.qualityDescription}>
              Visual documentation of all testing and visits
            </Text>
          </View>
        </View>

        <View style={styles.qualityItem}>
          <TrendingUp color={colors.success} size={20} />
          <View style={styles.qualityContent}>
            <Text style={styles.qualityTitle}>Continuous Monitoring</Text>
            <Text style={styles.qualityDescription}>
              Ongoing quality checks and expert performance reviews
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderOverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {renderTrustMetrics()}
      {renderExpertNetwork()}
      {renderQualityAssurance()}
    </ScrollView>
  );

  const renderVerificationTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      {renderCredibilityIndicators()}
    </ScrollView>
  );

  const renderTransparencyTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transparency Commitment</Text>
        <View style={styles.transparencyCard}>
          <Globe color={colors.primary} size={24} />
          <Text style={styles.transparencyTitle}>Open & Honest Reviews</Text>
          <Text style={styles.transparencyDescription}>
            We believe in complete transparency. Our review methodology, scoring
            criteria, and expert backgrounds are publicly available. We disclose
            any potential conflicts of interest and maintain editorial
            independence.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Public Documentation</Text>
        <View style={styles.documentationLinks}>
          <TouchableOpacity
            style={styles.documentationLink}
            onPress={() => openLink('https://example.com/methodology')}
          >
            <FileText color={colors.primary} size={16} />
            <Text style={styles.documentationLinkText}>Review Methodology</Text>
            <ExternalLink color={colors.textSecondary} size={14} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.documentationLink}
            onPress={() => openLink('https://example.com/scoring')}
          >
            <Target color={colors.primary} size={16} />
            <Text style={styles.documentationLinkText}>Scoring Criteria</Text>
            <ExternalLink color={colors.textSecondary} size={14} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.documentationLink}
            onPress={() => openLink('https://example.com/ethics')}
          >
            <Shield color={colors.primary} size={16} />
            <Text style={styles.documentationLinkText}>Editorial Ethics</Text>
            <ExternalLink color={colors.textSecondary} size={14} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'verification':
        return renderVerificationTab();
      case 'transparency':
        return renderTransparencyTab();
      default:
        return renderOverviewTab();
    }
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <QuickVerificationBadge verificationLevel="expert" size="small" />
          <Text style={styles.compactTitle}>
            Trusted by {trustMetrics.userSatisfaction}% of users
          </Text>
        </View>
        <Text style={styles.compactDescription}>
          {trustMetrics.verifiedExperts} verified experts •{' '}
          {trustMetrics.totalReviews.toLocaleString()} reviews
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderTabs()}
      {renderContent()}
    </View>
  );
};

const getStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },

    // Header
    header: {
      height: 140,
    },
    headerGradient: {
      flex: 1,
      paddingTop: 20,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    headerContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    headerTitle: {
      color: colors.white,
      fontSize: 24,
      fontWeight: 'bold',
    },
    headerSubtitle: {
      color: colors.white,
      fontSize: 16,
      opacity: 0.9,
    },

    // Tabs
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      gap: 6,
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    activeTabText: {
      color: colors.primary,
    },
    tabContent: {
      flex: 1,
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

    // Trust Metrics
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    metricCard: {
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
    metricValue: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
    },
    metricLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    additionalMetrics: {
      gap: 8,
    },
    additionalMetric: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    additionalMetricText: {
      fontSize: 14,
      color: colors.textSecondary,
    },

    // Credibility Indicators
    indicatorCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    indicatorHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    indicatorIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    indicatorInfo: {
      flex: 1,
    },
    indicatorTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    indicatorDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 4,
    },
    indicatorValue: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
    indicatorStatus: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    indicatorLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    indicatorLinkText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },

    // Expert Network
    expertNetworkCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    expertNetworkHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    expertNetworkTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    expertNetworkDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    expertCategories: {
      gap: 8,
      marginBottom: 16,
    },
    expertCategory: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    expertCategoryText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    learnMoreButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      backgroundColor: colors.primaryLight,
      borderRadius: 8,
    },
    learnMoreText: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },

    // Quality Assurance
    qualityGrid: {
      gap: 16,
    },
    qualityItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    qualityContent: {
      flex: 1,
    },
    qualityTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    qualityDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },

    // Transparency
    transparencyCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      gap: 12,
    },
    transparencyTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    transparencyDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      textAlign: 'center',
    },
    documentationLinks: {
      gap: 12,
    },
    documentationLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    documentationLinkText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
      flex: 1,
      marginLeft: 12,
    },

    // Compact version
    compactContainer: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    compactHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    compactTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    compactDescription: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });

export default TrustAndAuthority;
