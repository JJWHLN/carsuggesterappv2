import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useThemeColors } from '@/hooks/useTheme';
import { EnhancedAuthService } from '@/services/enhancedAuthService';
import { Car, Mail, Eye, EyeOff, User, Building2 } from '@/utils/ultra-optimized-icons';

function EnhancedSignUpScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    isDealer: false,
    agreeToTerms: false,
    agreeToMarketing: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const { signUpWithPassword, signInWithApple, signInWithGoogle } = useAuth();
  const router = useRouter();
  const { colors } = useThemeColors();

  const authProviders = EnhancedAuthService.getSupportedProviders();

  const updateFormData = (key: string, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      Alert.alert('Missing Information', 'Please enter your first name.');
      return false;
    }
    if (!formData.lastName.trim()) {
      Alert.alert('Missing Information', 'Please enter your last name.');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Missing Information', 'Please enter your email address.');
      return false;
    }
    if (!formData.email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }
    if (formData.password.length < 8) {
      Alert.alert('Weak Password', 'Password must be at least 8 characters long.');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return false;
    }
    if (!formData.agreeToTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms of Service and Privacy Policy.');
      return false;
    }
    return true;
  };

  const handleEmailSignUp = async () => {
    if (!validateForm()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    try {
      const result = await signUpWithPassword(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.isDealer
      );

      if (result?.error) {
        throw result.error;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        'Account Created!',
        'Please check your email to verify your account.',
        [
          {
            text: 'OK',
            onPress: () => router.push('/auth/sign-in'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Sign Up Failed',
        error.message || 'Failed to create account. Please try again.'
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignUp = async (provider: string) => {
    setSocialLoading(provider);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      let result;
      switch (provider) {
        case 'apple':
          result = await signInWithApple();
          break;
        case 'google':
          result = await signInWithGoogle();
          break;
        default:
          throw new Error('Unsupported provider');
      }

      if (result?.error) {
        throw result.error;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      logger.error(`${provider} sign-up error:`, error);
      Alert.alert(
        'Sign Up Failed',
        error.message || `Failed to sign up with ${provider}. Please try again.`
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSocialLoading(null);
    }
  };

  const renderSocialButton = (provider: any) => {
    if (!provider.available) return null;

    const isLoading = socialLoading === provider.id;
    
    return (
      <TouchableOpacity
        key={provider.id}
        style={[
          styles.socialButton,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          }
        ]}
        onPress={() => handleSocialSignUp(provider.id)}
        disabled={isLoading || loading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <LoadingSpinner size="small" color={colors.primary} />
        ) : (
          <>
            <Text style={styles.socialButtonIcon}>{provider.icon}</Text>
            <Text style={[styles.socialButtonText, { color: colors.text }]}>
              {provider.name}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            style={styles.logoContainer}
          >
            <Car color={colors.background} size={32} />
          </LinearGradient>
          <Text style={[styles.title, { color: colors.text }]}>
            Join Our Car Marketplace
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Create your account to start buying or selling cars
          </Text>
        </View>

        {/* Account Type Selection */}
        <View style={styles.accountTypeSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Account Type
          </Text>
          <View style={styles.accountTypeOptions}>
            <TouchableOpacity
              style={[
                styles.accountTypeOption,
                {
                  backgroundColor: !formData.isDealer ? colors.primaryLight : colors.cardBackground,
                  borderColor: !formData.isDealer ? colors.primary : colors.border,
                }
              ]}
              onPress={() => updateFormData('isDealer', false)}
            >
              <User color={!formData.isDealer ? colors.primary : colors.textSecondary} size={24} />
              <Text style={[
                styles.accountTypeLabel,
                { color: !formData.isDealer ? colors.primary : colors.textSecondary }
              ]}>
                Car Buyer
              </Text>
              <Text style={[
                styles.accountTypeDescription,
                { color: !formData.isDealer ? colors.primary : colors.textSecondary }
              ]}>
                Looking to buy a car
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.accountTypeOption,
                {
                  backgroundColor: formData.isDealer ? colors.primaryLight : colors.cardBackground,
                  borderColor: formData.isDealer ? colors.primary : colors.border,
                }
              ]}
              onPress={() => updateFormData('isDealer', true)}
            >
              <Building2 color={formData.isDealer ? colors.primary : colors.textSecondary} size={24} />
              <Text style={[
                styles.accountTypeLabel,
                { color: formData.isDealer ? colors.primary : colors.textSecondary }
              ]}>
                Car Dealer
              </Text>
              <Text style={[
                styles.accountTypeDescription,
                { color: formData.isDealer ? colors.primary : colors.textSecondary }
              ]}>
                Selling cars professionally
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Social Sign-Up Options */}
        <View style={styles.socialSection}>
          {authProviders
            .filter(provider => provider.id !== 'email')
            .map(renderSocialButton)}
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
            or create account with email
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        {/* Sign-Up Form */}
        <View style={styles.formSection}>
          <View style={styles.nameRow}>
            <View style={[styles.inputContainer, styles.nameInput]}>
              <User color={colors.textSecondary} size={20} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="First name"
                placeholderTextColor={colors.textSecondary}
                value={formData.firstName}
                onChangeText={(text) => updateFormData('firstName', text)}
                autoCapitalize="words"
                autoComplete="given-name"
                textContentType="givenName"
              />
            </View>

            <View style={[styles.inputContainer, styles.nameInput]}>
              <User color={colors.textSecondary} size={20} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Last name"
                placeholderTextColor={colors.textSecondary}
                value={formData.lastName}
                onChangeText={(text) => updateFormData('lastName', text)}
                autoCapitalize="words"
                autoComplete="family-name"
                textContentType="familyName"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Mail color={colors.textSecondary} size={20} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email address"
              placeholderTextColor={colors.textSecondary}
              value={formData.email}
              onChangeText={(text) => updateFormData('email', text)}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
            />
          </View>

          <View style={styles.inputContainer}>
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.passwordIcon}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showPassword ? (
                <EyeOff color={colors.textSecondary} size={20} />
              ) : (
                <Eye color={colors.textSecondary} size={20} />
              )}
            </TouchableOpacity>
            <TextInput
              style={[styles.input, styles.passwordInput, { color: colors.text }]}
              placeholder="Password (min. 8 characters)"
              placeholderTextColor={colors.textSecondary}
              value={formData.password}
              onChangeText={(text) => updateFormData('password', text)}
              secureTextEntry={!showPassword}
              autoComplete="password-new"
              textContentType="newPassword"
            />
          </View>

          <View style={styles.inputContainer}>
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.passwordIcon}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showConfirmPassword ? (
                <EyeOff color={colors.textSecondary} size={20} />
              ) : (
                <Eye color={colors.textSecondary} size={20} />
              )}
            </TouchableOpacity>
            <TextInput
              style={[styles.input, styles.passwordInput, { color: colors.text }]}
              placeholder="Confirm password"
              placeholderTextColor={colors.textSecondary}
              value={formData.confirmPassword}
              onChangeText={(text) => updateFormData('confirmPassword', text)}
              secureTextEntry={!showConfirmPassword}
              autoComplete="password-new"
              textContentType="newPassword"
            />
          </View>

          {/* Terms and Privacy */}
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[
                styles.checkbox,
                {
                  backgroundColor: formData.agreeToTerms ? colors.primary : colors.cardBackground,
                  borderColor: formData.agreeToTerms ? colors.primary : colors.border,
                }
              ]}
              onPress={() => updateFormData('agreeToTerms', !formData.agreeToTerms)}
            >
              {formData.agreeToTerms && (
                <Text style={[styles.checkmark, { color: colors.background }]}>✓</Text>
              )}
            </TouchableOpacity>
            <Text style={[styles.checkboxText, { color: colors.textSecondary }]}>
              I agree to the{' '}
              <Text style={[styles.link, { color: colors.primary }]}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={[styles.link, { color: colors.primary }]}>Privacy Policy</Text>
            </Text>
          </View>

          {/* Marketing Consent */}
          <View style={styles.switchContainer}>
            <Switch
              value={formData.agreeToMarketing}
              onValueChange={(value) => updateFormData('agreeToMarketing', value)}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={formData.agreeToMarketing ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.switchText, { color: colors.textSecondary }]}>
              Send me updates about new cars and price drops
            </Text>
          </View>

          <Button 
            title="Create Account" 
            onPress={handleEmailSignUp} 
            loading={loading}
            disabled={socialLoading !== null}
            style={styles.signUpButton}
          />
        </View>

        {/* Sign In Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/auth/sign-in')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.signInLink, { color: colors.primary }]}>
              Sign In
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function WrappedEnhancedSignUpScreen() {
  return (
    <ErrorBoundary>
      <EnhancedSignUpScreen />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
  },
  accountTypeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  accountTypeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  accountTypeOption: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  accountTypeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  accountTypeDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  socialSection: {
    marginBottom: 24,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    minHeight: 56,
  },
  socialButtonIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 14,
    marginHorizontal: 16,
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  nameInput: {
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    minHeight: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  passwordInput: {
    marginLeft: 12,
  },
  passwordIcon: {
    padding: 4,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '600',
  },
  checkboxText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    textDecorationLine: 'underline',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  switchText: {
    flex: 1,
    fontSize: 14,
    marginLeft: 12,
    lineHeight: 20,
  },
  signUpButton: {
    minHeight: 56,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 24,
  },
  footerText: {
    fontSize: 14,
  },
  signInLink: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
