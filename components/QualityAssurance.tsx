import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/hooks/useTheme';
import { CheckCircle, AlertTriangle, Star, Clock, TrendingUp, Award, Users, Zap, Eye, X } from '@/utils/ultra-optimized-icons';

interface QualityMetric {
  id: string;
  title: string;
  description: string;
  score: number;
  status: 'excellent' | 'good' | 'needs-improvement';
  icon: any;
  details: string[];
}

interface ReviewStandard {
  id: string;
  category: string;
  title: string;
  description: string;
  requirements: string[];
  verificationMethod: string;
  icon: any;
}

interface QualityAssuranceProps {
  visible?: boolean;
  onClose?: () => void;
  showAsModal?: boolean;
  compact?: boolean;
}

export const QualityAssurance: React.FC<QualityAssuranceProps> = ({
  visible = false,
  onClose,
  showAsModal = false,
  compact = false,
}) => {
  const { colors } = useThemeColors();
  const styles = getStyles(colors);
  const [activeSection, setActiveSection] = useState<'overview' | 'standards' | 'metrics'>('overview');

  const qualityMetrics: QualityMetric[] = [
    {
      id: 'accuracy',
      title: 'Review Accuracy',
      description: 'Factual correctness and verification of information',
      score: 98,
      status: 'excellent',
      icon: Target,
      details: [
        'All specifications verified against official sources',
        'Pricing data updated weekly',
        'Performance claims tested independently',
        'Features confirmed through hands-on testing',
      ],
    },
    {
      id: 'completeness',
      title: 'Review Completeness',
      description: 'Comprehensive coverage of all relevant aspects',
      score: 96,
      status: 'excellent',
      icon: CheckCircle,
      details: [
        'All review categories thoroughly evaluated',
        'Detailed explanations for all ratings',
        'Visual documentation provided',
        'Multiple expert perspectives included',
      ],
    },
    {
      id: 'timeliness',
      title: 'Update Timeliness',
      description: 'Frequency and speed of review updates',
      score: 94,
      status: 'excellent',
      icon: Clock,
      details: [
        'Reviews updated within 30 days of model changes',
        'Pricing updates within 7 days',
        'Market availability checked weekly',
        'Seasonal adjustments made quarterly',
      ],
    },
    {
      id: 'independence',
      title: 'Editorial Independence',
      description: 'Freedom from manufacturer influence',
      score: 100,
      status: 'excellent',
      icon: Shield,
      details: [
        'No manufacturer sponsorship of reviews',
        'Independent vehicle acquisition',
        'Transparent conflict of interest disclosure',
        'Unbiased scoring methodology',
      ],
    },
    {
      id: 'expertise',
      title: 'Expert Credentials',
      description: 'Qualifications and experience of reviewers',
      score: 97,
      status: 'excellent',
      icon: Award,
      details: [
        'All reviewers professionally certified',
        'Minimum 5 years industry experience',
        'Ongoing professional development',
        'Peer review process for all content',
      ],
    },
    {
      id: 'transparency',
      title: 'Process Transparency',
      description: 'Openness about methodology and criteria',
      score: 99,
      status: 'excellent',
      icon: Eye,
      details: [
        'Public methodology documentation',
        'Open scoring criteria',
        'Review process videos available',
        'Regular methodology updates published',
      ],
    },
  ];

  const reviewStandards: ReviewStandard[] = [
    {
      id: 'testing-protocol',
      category: 'Testing',
      title: 'Comprehensive Vehicle Testing',
      description: 'Standardized testing protocol for all vehicle reviews',
      requirements: [
        'Minimum 7-day extended test period',
        'Real-world driving conditions (city, highway, mixed)',
        'Multiple weather condition testing',
        'Full feature functionality verification',
        'Safety system testing',
        'Fuel economy validation',
      ],
      verificationMethod: 'GPS tracking, photo documentation, performance data logging',
      icon: Camera,
    },
    {
      id: 'dealership-evaluation',
      category: 'Dealership',
      title: 'Dealership Assessment Standards',
      description: 'Comprehensive evaluation criteria for dealership reviews',
      requirements: [
        'Mystery shopper visits',
        'Service department evaluation',
        'Sales process assessment',
        'Facility inspection',
        'Customer service interaction testing',
        'Post-sale follow-up evaluation',
      ],
      verificationMethod: 'Documented interactions, photo evidence, transaction records',
      icon: Users,
    },
    {
      id: 'expert-verification',
      category: 'Expertise',
      title: 'Expert Qualification Standards',
      description: 'Minimum requirements for automotive reviewers',
      requirements: [
        'ASE certification or equivalent',
        'Minimum 5 years automotive industry experience',
        'Clean driving record',
        'Ongoing professional development',
        'Background verification',
        'Performance monitoring',
      ],
      verificationMethod: 'Credential verification, background checks, performance reviews',
      icon: Award,
    },
    {
      id: 'content-quality',
      category: 'Content',
      title: 'Editorial Quality Standards',
      description: 'Content creation and review standards',
      requirements: [
        'Multi-point editorial review process',
        'Fact-checking verification',
        'Grammar and style compliance',
        'Visual content quality standards',
        'Accessibility compliance',
        'SEO optimization',
      ],
      verificationMethod: 'Editorial review board, automated quality checks, peer review',
      icon: FileText,
    },
    {
      id: 'data-integrity',
      category: 'Data',
      title: 'Data Accuracy Standards',
      description: 'Ensuring accuracy and reliability of all data',
      requirements: [
        'Primary source verification',
        'Regular data audits',
        'Cross-reference validation',
        'Update frequency monitoring',
        'Error correction protocols',
        'Version control tracking',
      ],
      verificationMethod: 'Automated data validation, manual audits, source verification',
      icon: BarChart3,
    },
    {
      id: 'ethics-compliance',
      category: 'Ethics',
      title: 'Ethical Review Standards',
      description: 'Maintaining ethical standards in all reviews',
      requirements: [
        'Conflict of interest disclosure',
        'Independent funding verification',
        'Transparent methodology',
        'Fair representation of all brands',
        'Consumer advocacy priority',
        'Privacy protection compliance',
      ],
      verificationMethod: 'Ethics board review, public disclosure, audit trails',
      icon: Shield,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return colors.success;
      case 'good': return colors.warning;
      case 'needs-improvement': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={[colors.primary, `${colors.primary}80`]}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          {showAsModal && onClose && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X color={colors.white} size={24} />
            </TouchableOpacity>
          )}
          <Shield color={colors.white} size={32} fill={colors.white} />
          <Text style={styles.headerTitle}>Quality Assurance</Text>
          <Text style={styles.headerSubtitle}>
            Professional standards you can trust
          </Text>
        </View>
      </LinearGradient>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeSection === 'overview' && styles.activeTab]}
        onPress={() => setActiveSection('overview')}
      >
        <TrendingUp color={activeSection === 'overview' ? colors.primary : colors.textSecondary} size={16} />
        <Text style={[
          styles.tabText,
          activeSection === 'overview' && styles.activeTabText
        ]}>
          Overview
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeSection === 'metrics' && styles.activeTab]}
        onPress={() => setActiveSection('metrics')}
      >
        <BarChart3 color={activeSection === 'metrics' ? colors.primary : colors.textSecondary} size={16} />
        <Text style={[
          styles.tabText,
          activeSection === 'metrics' && styles.activeTabText
        ]}>
          Metrics
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeSection === 'standards' && styles.activeTab]}
        onPress={() => setActiveSection('standards')}
      >
        <FileText color={activeSection === 'standards' ? colors.primary : colors.textSecondary} size={16} />
        <Text style={[
          styles.tabText,
          activeSection === 'standards' && styles.activeTabText
        ]}>
          Standards
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderOverview = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quality Commitment</Text>
        <View style={styles.commitmentCard}>
          <Shield color={colors.primary} size={24} />
          <Text style={styles.commitmentTitle}>100% Quality Guarantee</Text>
          <Text style={styles.commitmentDescription}>
            Every review meets our rigorous quality standards. We're committed to 
            providing accurate, unbiased, and comprehensive automotive guidance.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quality Highlights</Text>
        <View style={styles.highlightsGrid}>
          <View style={styles.highlightCard}>
            <Target color={colors.success} size={20} />
            <Text style={styles.highlightValue}>98%</Text>
            <Text style={styles.highlightLabel}>Accuracy Rate</Text>
          </View>

          <View style={styles.highlightCard}>
            <Clock color={colors.primary} size={20} />
            <Text style={styles.highlightValue}>24h</Text>
            <Text style={styles.highlightLabel}>Update Time</Text>
          </View>

          <View style={styles.highlightCard}>
            <Award color={colors.warning} size={20} />
            <Text style={styles.highlightValue}>100%</Text>
            <Text style={styles.highlightLabel}>Expert Verified</Text>
          </View>

          <View style={styles.highlightCard}>
            <Eye color={colors.primary} size={20} />
            <Text style={styles.highlightValue}>100%</Text>
            <Text style={styles.highlightLabel}>Transparent</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quality Process</Text>
        <View style={styles.processSteps}>
          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Research & Planning</Text>
              <Text style={styles.stepDescription}>
                Comprehensive research and test planning phase
              </Text>
            </View>
          </View>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Expert Testing</Text>
              <Text style={styles.stepDescription}>
                Professional evaluation by certified experts
              </Text>
            </View>
          </View>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Quality Review</Text>
              <Text style={styles.stepDescription}>
                Multi-point quality assurance and fact-checking
              </Text>
            </View>
          </View>

          <View style={styles.processStep}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Publication</Text>
              <Text style={styles.stepDescription}>
                Final review and publication with ongoing monitoring
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderMetrics = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quality Metrics</Text>
        {qualityMetrics.map((metric) => (
          <View key={metric.id} style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <View style={styles.metricIcon}>
                <metric.icon color={colors.primary} size={20} />
              </View>
              <View style={styles.metricInfo}>
                <Text style={styles.metricTitle}>{metric.title}</Text>
                <Text style={styles.metricDescription}>{metric.description}</Text>
              </View>
              <View style={styles.metricScore}>
                <Text style={[styles.metricScoreText, { color: getStatusColor(metric.status) }]}>
                  {metric.score}%
                </Text>
              </View>
            </View>

            <View style={styles.metricDetails}>
              {metric.details.map((detail, index) => (
                <View key={index} style={styles.metricDetail}>
                  <CheckCircle color={colors.success} size={12} />
                  <Text style={styles.metricDetailText}>{detail}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderStandards = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Review Standards</Text>
        {reviewStandards.map((standard) => (
          <View key={standard.id} style={styles.standardCard}>
            <View style={styles.standardHeader}>
              <View style={styles.standardIcon}>
                <standard.icon color={colors.primary} size={20} />
              </View>
              <View style={styles.standardInfo}>
                <Text style={styles.standardCategory}>{standard.category}</Text>
                <Text style={styles.standardTitle}>{standard.title}</Text>
                <Text style={styles.standardDescription}>{standard.description}</Text>
              </View>
            </View>

            <View style={styles.standardRequirements}>
              <Text style={styles.requirementsTitle}>Requirements:</Text>
              {standard.requirements.map((requirement, index) => (
                <View key={index} style={styles.requirement}>
                  <CheckCircle color={colors.success} size={12} />
                  <Text style={styles.requirementText}>{requirement}</Text>
                </View>
              ))}
            </View>

            <View style={styles.standardVerification}>
              <Text style={styles.verificationTitle}>Verification Method:</Text>
              <Text style={styles.verificationText}>{standard.verificationMethod}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'metrics':
        return renderMetrics();
      case 'standards':
        return renderStandards();
      default:
        return renderOverview();
    }
  };

  const renderCompact = () => (
    <View style={styles.compactContainer}>
      <View style={styles.compactHeader}>
        <Shield color={colors.success} size={16} />
        <Text style={styles.compactTitle}>Quality Assured</Text>
        <View style={styles.compactBadge}>
          <Text style={styles.compactBadgeText}>98% Accuracy</Text>
        </View>
      </View>
      <Text style={styles.compactDescription}>
        Professional standards • Expert verified • Transparent process
      </Text>
    </View>
  );

  if (compact) {
    return renderCompact();
  }

  const content = (
    <View style={styles.container}>
      {renderHeader()}
      {renderTabs()}
      {renderContent()}
    </View>
  );

  if (showAsModal) {
    return (
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        {content}
      </Modal>
    );
  }

  return content;
};

const getStyles = (colors: any) => StyleSheet.create({
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
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
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

  // Commitment
  commitmentCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  commitmentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  commitmentDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },

  // Highlights
  highlightsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  highlightCard: {
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
  highlightValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  highlightLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  // Process Steps
  processSteps: {
    gap: 16,
  },
  processStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Metrics
  metricCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  metricIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricInfo: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  metricDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  metricScore: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricScoreText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricDetails: {
    gap: 8,
  },
  metricDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricDetailText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },

  // Standards
  standardCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  standardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  standardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  standardInfo: {
    flex: 1,
  },
  standardCategory: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    marginBottom: 2,
  },
  standardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  standardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  standardRequirements: {
    marginBottom: 12,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  standardVerification: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  verificationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  verificationText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  // Compact
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
    flex: 1,
  },
  compactBadge: {
    backgroundColor: colors.success,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  compactBadgeText: {
    fontSize: 10,
    color: colors.white,
    fontWeight: '600',
  },
  compactDescription: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default QualityAssurance;
