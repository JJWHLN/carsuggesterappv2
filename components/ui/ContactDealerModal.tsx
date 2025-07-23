/**
 * Contact Dealer Modal - Core Business Feature
 * 
 * Modal component for users to contact dealers about cars.
 * Handles lead generation and dealer communication.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ModernButton } from '@/components/ui/ModernButton';
import { useThemeColors } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius, Shadows } from '@/constants/Colors';
import { X, Phone, Mail, MessageCircle, MapPin, Clock, Heart } from '@/utils/ultra-optimized-icons';
import { leadService, ContactRequest } from '@/services/LeadGenerationService';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/utils/logger';

const { width, height } = Dimensions.get('window');

interface ContactDealerModalProps {
  visible: boolean;
  onClose: () => void;
  car: {
    id: string;
    make: string;
    model: string;
    year: number;
    price: number;
    image?: string;
  };
  dealerInfo?: {
    name: string;
    phone: string;
    email: string;
    address: string;
    hours: string;
  };
}

export function ContactDealerModal({ visible, onClose, car, dealerInfo }: ContactDealerModalProps) {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<'phone' | 'email' | 'text' | 'in_person'>('phone');
  const [message, setMessage] = useState('');
  const [interestedInFinancing, setInterestedInFinancing] = useState(false);
  const [interestedInTrade, setInterestedInTrade] = useState(false);
  const [loading, setLoading] = useState(false);

  const styles = getStyles(colors);

  const carTitle = `${car.year} ${car.make} ${car.model}`;

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to contact the dealer.');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Message Required', 'Please enter a message for the dealer.');
      return;
    }

    setLoading(true);

    try {
      const contactRequest: ContactRequest = {
        carId: car.id,
        carTitle,
        contactMethod: selectedMethod,
        message: message.trim(),
        urgency: 'medium',
        interestedInFinancing,
        interestedInTrade,
      };

      await leadService.submitLead(user.id, contactRequest);

      Alert.alert(
        'Inquiry Sent!',
        `Your inquiry about the ${carTitle} has been sent to the dealer. They will contact you within 24 hours.`,
        [{ text: 'OK', onPress: onClose }]
      );

      // Reset form
      setMessage('');
      setInterestedInFinancing(false);
      setInterestedInTrade(false);
    } catch (error) {
      logger.error('Failed to submit contact request', error);
      Alert.alert('Error', 'Failed to send your inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const contactMethods = [
    { id: 'phone' as const, label: 'Phone Call', icon: Phone, description: 'Get a call from the dealer' },
    { id: 'email' as const, label: 'Email', icon: Mail, description: 'Receive detailed information via email' },
    { id: 'text' as const, label: 'Text Message', icon: MessageCircle, description: 'Quick communication via SMS' },
    { id: 'in_person' as const, label: 'Visit Dealership', icon: MapPin, description: 'Schedule an in-person visit' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Contact Dealer</Text>
            <Text style={styles.headerSubtitle}>{carTitle}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X color={colors.textSecondary} size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Dealer Info */}
          {dealerInfo && (
            <View style={styles.dealerInfoCard}>
              <Text style={styles.dealerName}>{dealerInfo.name}</Text>
              <View style={styles.dealerDetail}>
                <Phone color={colors.primary} size={16} />
                <Text style={styles.dealerDetailText}>{dealerInfo.phone}</Text>
              </View>
              <View style={styles.dealerDetail}>
                <Mail color={colors.primary} size={16} />
                <Text style={styles.dealerDetailText}>{dealerInfo.email}</Text>
              </View>
              <View style={styles.dealerDetail}>
                <MapPin color={colors.primary} size={16} />
                <Text style={styles.dealerDetailText}>{dealerInfo.address}</Text>
              </View>
              <View style={styles.dealerDetail}>
                <Clock color={colors.primary} size={16} />
                <Text style={styles.dealerDetailText}>{dealerInfo.hours}</Text>
              </View>
            </View>
          )}

          {/* Contact Method Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How would you like to be contacted?</Text>
            {contactMethods.map((method) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;
              
              return (
                <TouchableOpacity
                  key={method.id}
                  style={[styles.contactMethod, isSelected && styles.contactMethodSelected]}
                  onPress={() => setSelectedMethod(method.id)}
                >
                  <View style={styles.contactMethodLeft}>
                    <View style={[styles.contactMethodIcon, isSelected && styles.contactMethodIconSelected]}>
                      <Icon color={isSelected ? colors.white : colors.primary} size={20} />
                    </View>
                    <View style={styles.contactMethodText}>
                      <Text style={[styles.contactMethodLabel, isSelected && styles.contactMethodLabelSelected]}>
                        {method.label}
                      </Text>
                      <Text style={styles.contactMethodDescription}>{method.description}</Text>
                    </View>
                  </View>
                  <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                    {isSelected && <View style={styles.radioButtonInner} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Message */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Message</Text>
            <TextInput
              style={styles.messageInput}
              placeholder={`Hi, I'm interested in the ${carTitle}. Please contact me with more information.`}
              placeholderTextColor={colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Additional Interests */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Interests</Text>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setInterestedInFinancing(!interestedInFinancing)}
            >
              <View style={[styles.checkbox, interestedInFinancing && styles.checkboxSelected]}>
                {interestedInFinancing && <View style={styles.checkboxInner} />}
              </View>
              <Text style={styles.checkboxLabel}>I'm interested in financing options</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setInterestedInTrade(!interestedInTrade)}
            >
              <View style={[styles.checkbox, interestedInTrade && styles.checkboxSelected]}>
                {interestedInTrade && <View style={styles.checkboxInner} />}
              </View>
              <Text style={styles.checkboxLabel}>I have a trade-in vehicle</Text>
            </TouchableOpacity>
          </View>

          {/* Car Summary */}
          <View style={styles.carSummary}>
            <Text style={styles.carSummaryTitle}>Inquiring About:</Text>
            <Text style={styles.carSummaryText}>{carTitle}</Text>
            <Text style={styles.carSummaryPrice}>${car.price.toLocaleString()}</Text>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <ModernButton
            title="Send Inquiry"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            variant="primary"
            style={styles.submitButton}
          />
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: Platform.OS === 'ios' ? 60 : Spacing.lg,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...Typography.title,
    color: colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  dealerInfoCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginVertical: Spacing.md,
    ...Shadows.sm,
  },
  dealerName: {
    ...Typography.subtitle,
    color: colors.text,
    marginBottom: Spacing.sm,
  },
  dealerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  dealerDetailText: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  section: {
    marginVertical: Spacing.md,
  },
  sectionTitle: {
    ...Typography.subtitle,
    color: colors.text,
    marginBottom: Spacing.md,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: Spacing.sm,
  },
  contactMethodSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  contactMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  contactMethodIconSelected: {
    backgroundColor: colors.primary,
  },
  contactMethodText: {
    flex: 1,
  },
  contactMethodLabel: {
    ...Typography.body,
    color: colors.text,
    marginBottom: 2,
  },
  contactMethodLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  contactMethodDescription: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Typography.body,
    color: colors.text,
    minHeight: 100,
    backgroundColor: colors.white,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxInner: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: colors.white,
  },
  checkboxLabel: {
    ...Typography.body,
    color: colors.text,
    flex: 1,
  },
  carSummary: {
    backgroundColor: colors.neutral100,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginVertical: Spacing.md,
  },
  carSummaryTitle: {
    ...Typography.caption,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  carSummaryText: {
    ...Typography.body,
    color: colors.text,
    marginBottom: 4,
  },
  carSummaryPrice: {
    ...Typography.subtitle,
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    padding: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  submitButton: {
    width: '100%',
  },
});
