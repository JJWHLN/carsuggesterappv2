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
import { StorageService } from '@/services/storageService';
import { VehicleListingService } from '@/services/featureServices';
import { 
  validateForm, 
  validateField,
  VehicleValidationRules, 
  formatValidationErrors, 
  getFieldError,
  sanitizeInput,
  FormField as ValidationFormField,
  ValidationError
} from '@/utils/validation';

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
  const [uploading, setUploading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

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

  const handleAddImage = async () => {
    if (selectedImages.length >= 8) {
      Alert.alert('Maximum Photos', 'You can upload up to 8 photos.');
      return;
    }

    Alert.alert(
      'Add Photos',
      'Choose how you want to add photos',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Camera', 
          onPress: async () => {
            try {
              setUploadingImages(true);
              // Mock camera capture - in real app would use actual camera
              const mockImageUri = `https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=800`;
              setSelectedImages(prev => [...prev, mockImageUri]);
            } catch (error) {
              Alert.alert('Error', 'Failed to capture image');
            } finally {
              setUploadingImages(false);
            }
          }
        },
        { 
          text: 'Gallery', 
          onPress: async () => {
            try {
              setUploadingImages(true);
              // Mock gallery selection - in real app would use actual gallery
              const mockImageUri = `https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=800`;
              setSelectedImages(prev => [...prev, mockImageUri]);
            } catch (error) {
              Alert.alert('Error', 'Failed to select image');
            } finally {
              setUploadingImages(false);
            }
          }
        }
      ]
    );
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateSingleField = (fieldId: string, value: any) => {
    const field = formFields.find(f => f.id === fieldId);
    if (!field) return '';

    const rules = VehicleValidationRules[fieldId as keyof typeof VehicleValidationRules];
    if (!rules) return '';

    return validateField(fieldId, value, rules) || '';
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    // Sanitize input based on field type
    let sanitizedValue = value;
    if (typeof value === 'string') {
      if (fieldId === 'price' || fieldId === 'mileage' || fieldId === 'year') {
        sanitizedValue = sanitizeInput.number(value);
      } else {
        sanitizedValue = sanitizeInput.text(value);
      }
    }
    
    // Update form data
    setFormData(prev => ({ ...prev, [fieldId]: sanitizedValue }));
    
    // Mark field as touched
    setTouchedFields(prev => new Set([...prev, fieldId]));
    
    // Validate field and update errors
    const error = validateSingleField(fieldId, sanitizedValue);
    setValidationErrors(prev => {
      const filtered = prev.filter(e => e.field !== fieldId);
      if (error) {
        return [...filtered, { field: fieldId, message: error }];
      }
      return filtered;
    });
  };

  const handleSubmit = async () => {
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

    // Mark all fields as touched for validation display
    const allFieldIds = formFields.map(f => f.id);
    setTouchedFields(new Set(allFieldIds));

    // Build form fields for validation
    const validationFields: ValidationFormField[] = formFields
      .filter(field => VehicleValidationRules[field.id as keyof typeof VehicleValidationRules])
      .map(field => ({
        name: field.id,
        value: formData[field.id],
        rules: VehicleValidationRules[field.id as keyof typeof VehicleValidationRules],
      }));

    // Validate entire form
    const errors = validateForm(validationFields);
    setValidationErrors(errors);

    if (errors.length > 0) {
      const errorMessage = formatValidationErrors(errors);
      Alert.alert(
        'Validation Errors',
        errorMessage
      );
      return;
    }

    try {
      setUploading(true);

      // Upload images to Supabase Storage
      let uploadedImageUrls: string[] = [];
      if (selectedImages.length > 0) {
        try {
          // Generate a temporary listing ID for organizing images
          const tempListingId = `temp_${user.id}_${Date.now()}`;
          
          uploadedImageUrls = await StorageService.uploadCarImages(
            user.id,
            tempListingId,
            selectedImages
          );
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          Alert.alert(
            'Upload Warning',
            'Some images failed to upload. The listing will be created without images.'
          );
        }
      }

      // Create the vehicle listing
      const listingData = {
        title: `${formData.year} ${formData.make} ${formData.model}`,
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year),
        price: parseInt(formData.price),
        mileage: formData.mileage ? parseInt(formData.mileage) : undefined,
        location_city: formData.location?.split(',')[0]?.trim(),
        location_state: formData.location?.split(',')[1]?.trim(),
        condition: formData.condition?.toLowerCase(),
        fuel_type: formData.fuel_type?.toLowerCase(),
        description: formData.description,
        images: uploadedImageUrls,
        features: [] // Add feature selection logic later
      };

      await VehicleListingService.createListing(user.id, listingData);

      Alert.alert(
        'Success!',
        'Your car listing has been created successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error creating listing:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create listing. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const FormField = ({ field }: { field: FormField }) => {
    const fieldError = getFieldError(validationErrors, field.id);
    const isFieldTouched = touchedFields.has(field.id);
    const showError = isFieldTouched && fieldError;
    
    return (
      <Card style={styles.fieldCard}>
        <View style={styles.fieldHeader}>
          {field.icon}
          <Text style={styles.fieldLabel}>
            {field.label}
            {field.required && <Text style={styles.requiredMark}> *</Text>}
          </Text>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.fieldInput,
            showError && styles.fieldInputError
          ]}
          onPress={() => {
            if (field.type === 'select' && field.options) {
              Alert.alert(
                field.label,
                'Select an option:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  ...field.options.map(option => ({
                    text: option,
                    onPress: () => handleFieldChange(field.id, option)
                  }))
                ]
              );
            } else {
              Alert.prompt(
                field.label,
                field.placeholder,
                (text) => handleFieldChange(field.id, text),
                'plain-text',
                formData[field.id]?.toString() || ''
              );
            }
          }}
        >
          <Text style={[
            styles.fieldInputText,
            !formData[field.id] && styles.placeholderText
          ]}>
            {formData[field.id] || field.placeholder}
          </Text>
        </TouchableOpacity>
        
        {showError && (
          <Text style={styles.errorText}>{fieldError}</Text>
        )}
      </Card>
    );
  };

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
            title={uploading ? "Creating Listing..." : "Submit Listing"}
            onPress={handleSubmit}
            variant="primary"
            icon={uploading ? undefined : <Upload color={colors.white} size={20} />}
            style={uploading ? 
              { ...styles.submitButton, ...styles.submitButtonDisabled } : 
              styles.submitButton
            }
            disabled={uploading}
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
  fieldInputError: {
    borderColor: colors.error,
    backgroundColor: colors.background,
  },
  errorText: {
    ...Typography.caption,
    color: colors.error,
    marginTop: Spacing.xs,
    marginLeft: Spacing.sm,
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitNote: {
    ...Typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
