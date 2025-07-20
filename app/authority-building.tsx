import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useTheme';
import { ExpertVerificationModal, QuickVerificationBadge } from '@/components/ExpertVerification';
import TrustAndAuthority from '@/components/TrustAndAuthority';
import QualityAssurance from '@/components/QualityAssurance';
import ProfessionalBranding from '@/components/ProfessionalBranding';
import { Award, TrendingUp, Users, Star, CheckCircle, Zap, Clock } from '@/utils/ultra-optimized-icons';

interface AuthorityMetrics {
  trustScore: number;
  expertCount: number;
  reviewsPublished: number;
  userSatisfaction: number;
  industryRecognition: number;
  mediaFeatures: number;
}

interface AuthorityBuildingProps {
  navigation?: any;
}

export const AuthorityBuilding: React.FC<AuthorityBuildingProps> = ({ navigation }) => {
  const { colors } = useThemeColors();
  const styles = getStyles(colors);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'experts' | 'trust' | 'quality'>('overview');
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<any>(null);

  const authorityMetrics: AuthorityMetrics = {
    trustScore: 98,
    expertCount: 23,
    reviewsPublished: 1247,
    userSatisfaction: 96,
    industryRecognition: 15,
    mediaFeatures: 8,
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={[colors.primary, `${colors.primary}80`]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Shield color={colors.white} size={32} fill={colors.white} />
          <Text style={styles.headerTitle}>CarSuggester Authority</Text>
          <Text style={styles.headerSubtitle}>
            Trusted automotive expertise since 2015
          </Text>
          
          <View style={styles.authorityBadges}>
            <QuickVerificationBadge verificationLevel="master" size="large" />
            <View style={styles.trustBadge}>
              <Star color={colors.warning} size={16} fill={colors.warning} />
              <Text style={styles.trustBadgeText}>98% Trust Score</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
        onPress={() => setActiveTab('overview')}
      >
        <TrendingUp color={activeTab === 'overview' ? colors.primary : colors.textSecondary} size={16} />
        <Text style={[
          styles.tabText,
          activeTab === 'overview' && styles.activeTabText
        ]}>
          Overview
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'experts' && styles.activeTab]}
        onPress={() => setActiveTab('experts')}
      >
        <Users color={activeTab === 'experts' ? colors.primary : colors.textSecondary} size={16} />
        <Text style={[
          styles.tabText,
          activeTab === 'experts' && styles.activeTabText
        ]}>
          Experts
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'trust' && styles.activeTab]}
        onPress={() => setActiveTab('trust')}
      >
        <Shield color={activeTab === 'trust' ? colors.primary : colors.textSecondary} size={16} />
        <Text style={[
          styles.tabText,
          activeTab === 'trust' && styles.activeTabText
        ]}>
          Trust
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === 'quality' && styles.activeTab]}
        onPress={() => setActiveTab('quality')}
      >
        <BarChart3 color={activeTab === 'quality' ? colors.primary : colors.textSecondary} size={16} />
        <Text style={[
          styles.tabText,
          activeTab === 'quality' && styles.activeTabText
        ]}>
          Quality
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderAuthorityMetrics = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Authority Metrics</Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Shield color={colors.success} size={24} />
          <Text style={styles.metricValue}>{authorityMetrics.trustScore}%</Text>
          <Text style={styles.metricLabel}>Trust Score</Text>
          <View style={styles.metricTrend}>
            <TrendingUp color={colors.success} size={12} />
            <Text style={styles.metricTrendText}>+2% this month</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <Users color={colors.primary} size={24} />
          <Text style={styles.metricValue}>{authorityMetrics.expertCount}</Text>
          <Text style={styles.metricLabel}>Verified Experts</Text>
          <View style={styles.metricTrend}>
            <TrendingUp color={colors.success} size={12} />
            <Text style={styles.metricTrendText}>+3 this quarter</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <BookOpen color={colors.warning} size={24} />
          <Text style={styles.metricValue}>{authorityMetrics.reviewsPublished.toLocaleString()}</Text>
          <Text style={styles.metricLabel}>Expert Reviews</Text>
          <View style={styles.metricTrend}>
            <TrendingUp color={colors.success} size={12} />
            <Text style={styles.metricTrendText}>+47 this week</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <Star color={colors.warning} size={24} />
          <Text style={styles.metricValue}>{authorityMetrics.userSatisfaction}%</Text>
          <Text style={styles.metricLabel}>User Satisfaction</Text>
          <View style={styles.metricTrend}>
            <TrendingUp color={colors.success} size={12} />
            <Text style={styles.metricTrendText}>+1% this month</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderIndustryRecognition = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Industry Recognition</Text>
      <View style={styles.recognitionCard}>
        <View style={styles.recognitionHeader}>
          <Award color={colors.warning} size={24} />
          <Text style={styles.recognitionTitle}>Industry Awards & Features</Text>
        </View>
        
        <View style={styles.recognitionGrid}>
          <View style={styles.recognitionItem}>
            <Building color={colors.primary} size={16} />
            <Text style={styles.recognitionText}>
              {authorityMetrics.industryRecognition} Industry Partnerships
            </Text>
          </View>
          
          <View style={styles.recognitionItem}>
            <Globe color={colors.primary} size={16} />
            <Text style={styles.recognitionText}>
              {authorityMetrics.mediaFeatures} Media Features
            </Text>
          </View>
          
          <View style={styles.recognitionItem}>
            <CheckCircle color={colors.success} size={16} />
            <Text style={styles.recognitionText}>
              ISO 9001:2015 Certified
            </Text>
          </View>
          
          <View style={styles.recognitionItem}>
            <Target color={colors.primary} size={16} />
            <Text style={styles.recognitionText}>
              BBB A+ Rating
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderKeyStrengths = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Key Strengths</Text>
      <View style={styles.strengthsGrid}>
        <View style={styles.strengthCard}>
          <Shield color={colors.success} size={20} />
          <View style={styles.strengthContent}>
            <Text style={styles.strengthTitle}>Editorial Independence</Text>
            <Text style={styles.strengthDescription}>
              100% unbiased reviews with no manufacturer influence
            </Text>
          </View>
        </View>

        <View style={styles.strengthCard}>
          <Target color={colors.primary} size={20} />
          <View style={styles.strengthContent}>
            <Text style={styles.strengthTitle}>Expert Verification</Text>
            <Text style={styles.strengthDescription}>
              All reviewers professionally certified and background checked
            </Text>
          </View>
        </View>

        <View style={styles.strengthCard}>
          <BarChart3 color={colors.warning} size={20} />
          <View style={styles.strengthContent}>
            <Text style={styles.strengthTitle}>Data-Driven Analysis</Text>
            <Text style={styles.strengthDescription}>
              Comprehensive testing with measurable performance metrics
            </Text>
          </View>
        </View>

        <View style={styles.strengthCard}>
          <Clock color={colors.primary} size={20} />
          <View style={styles.strengthContent}>
            <Text style={styles.strengthTitle}>Real-Time Updates</Text>
            <Text style={styles.strengthDescription}>
              Continuous monitoring and updates to ensure accuracy
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderOverviewTab = () => (
    <ScrollView 
      style={styles.tabContent} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {renderAuthorityMetrics()}
      {renderIndustryRecognition()}
      {renderKeyStrengths()}
    </ScrollView>
  );

  const renderExpertsTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <ProfessionalBranding
        onContactExpert={() => {
          // Handle contact expert
        }}
        onViewCredentials={() => setVerificationModalVisible(true)}
      />
    </ScrollView>
  );

  const renderTrustTab = () => (
    <TrustAndAuthority
      showHeader={false}
      onLearnMore={() => {
        // Handle learn more
      }}
    />
  );

  const renderQualityTab = () => (
    <QualityAssurance />
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'experts':
        return renderExpertsTab();
      case 'trust':
        return renderTrustTab();
      case 'quality':
        return renderQualityTab();
      default:
        return renderOverviewTab();
    }
  };

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderTabs()}
      {renderContent()}

      <ExpertVerificationModal
        visible={verificationModalVisible}
        onClose={() => setVerificationModalVisible(false)}
        expertName="Dr. Sarah Johnson"
        title="Senior Automotive Engineer & Review Specialist"
        yearsExperience={15}
        verificationLevel="master"
        credentials={[
          {
            id: '1',
            title: 'ASE Master Technician',
            organization: 'National Institute for Automotive Service Excellence',
            year: 2020,
            verified: true,
            icon: Award,
            description: 'Comprehensive automotive service and repair certification',
          },
          {
            id: '2',
            title: 'PhD in Automotive Engineering',
            organization: 'MIT - Massachusetts Institute of Technology',
            year: 2015,
            verified: true,
            icon: BookOpen,
            description: 'Advanced degree in automotive systems and design',
          },
        ]}
        achievements={{
          reviewsWritten: 247,
          carsEvaluated: 89,
          dealershipsVisited: 45,
          readersHelped: 125000,
        }}
      />
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    height: 180,
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
    textAlign: 'center',
  },
  headerSubtitle: {
    color: colors.white,
    fontSize: 16,
    opacity: 0.9,
    textAlign: 'center',
  },
  authorityBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  trustBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
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
    fontSize: 12,
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

  // Authority Metrics
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
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
  metricTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  metricTrendText: {
    fontSize: 10,
    color: colors.success,
    fontWeight: '500',
  },

  // Recognition
  recognitionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recognitionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  recognitionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  recognitionGrid: {
    gap: 12,
  },
  recognitionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recognitionText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },

  // Strengths
  strengthsGrid: {
    gap: 12,
  },
  strengthCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  strengthContent: {
    flex: 1,
  },
  strengthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  strengthDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});

export default AuthorityBuilding;
