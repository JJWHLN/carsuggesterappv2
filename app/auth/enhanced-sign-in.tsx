import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
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
import { Car, Mail, Eye, EyeOff } from '@/utils/ultra-optimized-icons';

const { width } = Dimensions.get('window');

function EnhancedSignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const { signInWithPassword, signInWithApple, signInWithGoogle } = useAuth();
  const router = useRouter();
  const { colors } = useThemeColors();

  // Get available auth providers
  const authProviders = EnhancedAuthService.getSupportedProviders();

  const handleEmailSignIn = async () => {
    if (!email || !password) {
      Alert.alert(
        'Missing Information',
        'Please enter both email and password.',
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    try {
      await signInWithPassword(email, password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert(
        'Sign In Failed',
        error.message || 'Please check your credentials and try again.',
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: string) => {
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
      logger.error(`${provider} sign-in error:`, error);
      Alert.alert(
        'Sign In Failed',
        error.message ||
          `Failed to sign in with ${provider}. Please try again.`,
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
          },
        ]}
        onPress={() => handleSocialSignIn(provider.id)}
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
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Car Theme */}
        <View style={styles.header}>
          <LinearGradient
            colors={[colors.primary, colors.primaryLight]}
            style={styles.logoContainer}
          >
            <Car color={colors.background} size={32} />
          </LinearGradient>
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome Back
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sign in to find your perfect car
          </Text>
        </View>

        {/* Social Sign-In Options */}
        <View style={styles.socialSection}>
          {authProviders
            .filter((provider) => provider.id !== 'email')
            .map(renderSocialButton)}
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textSecondary }]}>
            or continue with email
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        {/* Email Sign-In Form */}
        <View style={styles.formSection}>
          <View style={styles.inputContainer}>
            <Mail color={colors.textSecondary} size={20} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email address"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
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
              style={[
                styles.input,
                styles.passwordInput,
                { color: colors.text },
              ]}
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
              textContentType="password"
            />
          </View>

          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={() => router.push('/auth/forgot-password')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text
              style={[styles.forgotPasswordText, { color: colors.primary }]}
            >
              Forgot your password?
            </Text>
          </TouchableOpacity>

          <Button
            title="Sign In"
            onPress={handleEmailSignIn}
            loading={loading}
            disabled={socialLoading !== null}
            style={styles.signInButton}
          />
        </View>

        {/* Sign Up Link */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            New to our car marketplace?{' '}
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/auth/sign-up')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.signUpLink, { color: colors.primary }]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* Car Marketplace Benefits */}
        <View style={styles.benefitsSection}>
          <Text style={[styles.benefitsTitle, { color: colors.text }]}>
            Why sign in?
          </Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🔔</Text>
              <Text
                style={[styles.benefitText, { color: colors.textSecondary }]}
              >
                Get alerts for price drops and new listings
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>💾</Text>
              <Text
                style={[styles.benefitText, { color: colors.textSecondary }]}
              >
                Save your favorite cars and searches
              </Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🎯</Text>
              <Text
                style={[styles.benefitText, { color: colors.textSecondary }]}
              >
                Get personalized car recommendations
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function WrappedEnhancedSignInScreen() {
  return (
    <ErrorBoundary>
      <EnhancedSignInScreen />
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
  },
  signInButton: {
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
  signUpLink: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  benefitsSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 32,
    textAlign: 'center',
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
