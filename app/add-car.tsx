import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { 
  Camera,
  Plus,
  X,
  Upload,
  Car,
  DollarSign,
  Calendar,
  MapPin,
  Settings,
  Fuel,
  Award,
  Info,
} from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { ComingSoon } from '@/components/ui/ComingSoon';
import { Spacing, Typography, BorderRadius, Shadows as ColorsShadows } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';

interface FormField {
  id: string;
  label: string;
  placeholder: string;
  required: boolean;
  type: 'text' | 'number' | 'select' | 'multiselect';
  options?: string[];
  icon: React.ReactNode;
}

export default function AddCarScreen() {
  const { colors } = useThemeColors();
  const { user } = useAuth();
  const styles = useMemo(() => getThemedStyles(colors), [colors]);

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const formFields: FormField[] = [
    {
      id: 'make',
      label: 'Make',
      placeholder: 'e.g., Toyota, BMW, Ford',
      required: true,
      type: 'text',
      icon: <Car color={colors.primary} size={20} />
    },
    {
      id: 'model',
      label: 'Model',
      placeholder: 'e.g., Camry, 3 Series, F-150',
      required: true,
      type: 'text',
      icon: <Car color={colors.primary} size={20} />
    },
    {
      id: 'year',
      label: 'Year',
      placeholder: 'e.g., 2020',
      required: true,
      type: 'number',
      icon: <Calendar color={colors.primary} size={20} />
    },
    {
      id: 'price',
      label: 'Price',
      placeholder: 'e.g., 25000',
      required: true,
      type: 'number',
      icon: <DollarSign color={colors.primary} size={20} />
    },
    {
      id: 'mileage',
      label: 'Mileage',
      placeholder: 'e.g., 45000',
      required: true,
      type: 'number',
      icon: <Settings color={colors.primary} size={20} />
    },
    {
      id: 'location',
      label: 'Location',
      placeholder: 'e.g., Los Angeles, CA',
      required: true,
      type: 'text',
      icon: <MapPin color={colors.primary} size={20} />
    },
    {
      id: 'condition',
      label: 'Condition',
      placeholder: 'Select condition',
      required: true,
      type: 'select',
      options: ['New', 'Like New', 'Excellent', 'Good', 'Fair'],
      icon: <Award color={colors.primary} size={20} />
    },
    {
      id: 'fuel_type',
      label: 'Fuel Type',
      placeholder: 'Select fuel type',
      required: false,
      type: 'select',
      options: ['Gasoline', 'Diesel', 'Hybrid', 'Electric', 'Plug-in Hybrid'],
      icon: <Fuel color={colors.primary} size={20} />
    }
  ];

  const handleAddImage = () => {
    Alert.alert(
      'Add Photos',
      'Choose how you want to add photos',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Camera', onPress: () => console.log('Open camera') },
        { text: 'Gallery', onPress: () => console.log('Open gallery') }
      ]
    );
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!user) {
      Alert.alert(
        'Authentication Required',
        'You need to sign in to list a car.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => router.push('/auth/sign-in') }
        ]
      );
      return;
    }

    // Validate required fields
    const missingFields = formFields
      .filter(field => field.required && !formData[field.id])
      .map(field => field.label);

    if (missingFields.length > 0) {
      Alert.alert(
        'Missing Information',
        `Please fill in the following required fields: ${missingFields.join(', ')}`
      );
      return;
    }

    console.log('Submitting car listing:', formData);
    Alert.alert(
      'Success!',
      'Your car listing has been submitted for review.',
      [{ text: 'OK', onPress: () => router.back() }]
    );
  };

  const FormField = ({ field }: { field: FormField }) => (
    <Card style={styles.fieldCard}>
      <View style={styles.fieldHeader}>
        {field.icon}
        <Text style={styles.fieldLabel}>
          {field.label}
          {field.required && <Text style={styles.requiredMark}> *</Text>}
        </Text>
      </View>
      
      <TouchableOpacity style={styles.fieldInput}>
        <Text style={[
          styles.fieldInputText,
          !formData[field.id] && styles.placeholderText
        ]}>
          {formData[field.id] || field.placeholder}
        </Text>
      </TouchableOpacity>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>List Your Car</Text>
          <Text style={styles.subtitle}>
            Share your car with thousands of potential buyers
          </Text>
        </View>

        {/* Coming Soon Notice */}
        <View style={styles.comingSoonSection}>
          <ComingSoon
            title="Car Listing Coming Soon!"
            message="We're building a comprehensive car listing platform. Soon you'll be able to list your car, add photos, and connect with buyers effortlessly."
            icon={<Upload color={colors.primary} size={32} />}
          />
        </View>

        {/* Photo Upload Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <Text style={styles.sectionSubtitle}>
            Add high-quality photos to attract more buyers
          </Text>
          
          <View style={styles.photoGrid}>
            {selectedImages.map((image, index) => (
              <View key={index} style={styles.photoContainer}>
                <OptimizedImage
                  source={{ uri: image }}
                  style={styles.photo}
                />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <X color={colors.white} size={16} />
                </TouchableOpacity>
              </View>
            ))}
            
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={handleAddImage}
            >
              <Camera color={colors.textSecondary} size={32} />
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Car Details Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Car Details</Text>
          <Text style={styles.sectionSubtitle}>
            Provide accurate information about your vehicle
          </Text>
          
          {formFields.map((field) => (
            <FormField key={field.id} field={field} />
          ))}
        </View>

        {/* Additional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          <Card style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <Info color={colors.primary} size={20} />
              <Text style={styles.fieldLabel}>Description</Text>
            </View>
            <TouchableOpacity style={[styles.fieldInput, styles.textAreaInput]}>
              <Text style={[styles.fieldInputText, styles.placeholderText]}>
                Describe your car's condition, features, maintenance history, etc.
              </Text>
            </TouchableOpacity>
          </Card>

          <Card style={styles.fieldCard}>
            <View style={styles.fieldHeader}>
              <Award color={colors.primary} size={20} />
              <Text style={styles.fieldLabel}>Features</Text>
            </View>
            <View style={styles.featuresGrid}>
              {['Leather Seats', 'Sunroof', 'Navigation', 'Backup Camera', 'Heated Seats', 'Bluetooth'].map((feature) => (
                <TouchableOpacity key={feature} style={styles.featureTag}>
                  <Text style={styles.featureText}>{feature}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <Button
            title="Submit Listing"
            onPress={handleSubmit}
            variant="primary"
            icon={<Upload color={colors.white} size={20} />}
            style={styles.submitButton}
          />
          
          <Text style={styles.submitNote}>
            By submitting, you agree to our terms and conditions. Your listing will be reviewed before going live.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getThemedStyles = (colors: typeof import('@/constants/Colors').Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  header: {
    padding: Spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  title: {
    ...Typography.h1,
    color: colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  comingSoonSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h2,
    color: colors.text,
    marginBottom: Spacing.sm,
  },
  sectionSubtitle: {
    ...Typography.body,
    color: colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  photoContainer: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.md,
    backgroundColor: colors.surfaceDark,
  },
  removePhotoButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: BorderRadius.full,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoButton: {
    width: 100,
    height: 100,
    backgroundColor: colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  addPhotoText: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  fieldCard: {
    marginBottom: Spacing.md,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    ...Typography.bodySmall,
    color: colors.text,
    fontWeight: '600',
  },
  requiredMark: {
    color: colors.error,
  },
  fieldInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  textAreaInput: {
    minHeight: 80,
    alignItems: 'flex-start',
    paddingTop: Spacing.md,
  },
  fieldInputText: {
    ...Typography.body,
    color: colors.text,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  featureTag: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  featureText: {
    ...Typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
  submitSection: {
    padding: Spacing.xl,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  submitButton: {
    minWidth: 200,
    marginBottom: Spacing.lg,
  },
  submitNote: {
    ...Typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
