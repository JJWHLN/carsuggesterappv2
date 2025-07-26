import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '@/contexts/AuthContext';
import { RealAuthService } from '@/services/RealAuthService';
import { Button } from '@/components/ui/Button';
import { ModernButton } from '@/components/ui/ModernButton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useThemeColors } from '@/hooks/useTheme';
import { Spacing, Typography, BorderRadius } from '@/constants/Colors';
import {
  Car,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
} from '@/utils/ultra-optimized-icons';

function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const { signInWithPassword } = useAuth();
  const router = useRouter();
  const { colors } = useThemeColors();

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Use RealAuthService for more robust authentication
      const result = await RealAuthService.signIn({ email, password });

      if (result.success) {
        // Update auth context with new user
        if (result.user) {
          // Auth context will handle the user state update
          router.replace('/(tabs)');
        }
      } else {
        Alert.alert(
          'Sign In Failed',
          result.error || 'Please check your credentials and try again.',
        );
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      Alert.alert(
        'Sign In Failed',
        'An unexpected error occurred. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      // Implement real social sign-in with Supabase
      Alert.alert(
        'Social Sign-In',
        `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in is being implemented. Please use email sign-in for now.`,
      );
    } catch (error) {
      console.error('Social sign-in error:', error);
      Alert.alert('Error', 'Social sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Logo */}
          <View style={styles.header}>
            <View
              style={[
                styles.logoContainer,
                { backgroundColor: colors.primary },
              ]}
            >
              <Car color={colors.white} size={32} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>
              Welcome Back
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign in to access your personalized car recommendations
            </Text>
          </View>

          {/* Sign In Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Email
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  { borderColor: errors.email ? colors.error : colors.border },
                ]}
              >
                <Mail
                  color={colors.textSecondary}
                  size={20}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textMuted}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email)
                      setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
              {errors.email && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.email}
                </Text>
              )}
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Password
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  {
                    borderColor: errors.password ? colors.error : colors.border,
                  },
                ]}
              >
                <Lock
                  color={colors.textSecondary}
                  size={20}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textMuted}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password)
                      setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  secureTextEntry={!showPassword}
                  autoComplete="password"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  {showPassword ? (
                    <EyeOff color={colors.textSecondary} size={20} />
                  ) : (
                    <Eye color={colors.textSecondary} size={20} />
                  )}
                </TouchableOpacity>
              </View>
              {errors.password && (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.password}
                </Text>
              )}
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              onPress={() => router.push('/auth/forgot-password')}
              style={styles.forgotPasswordContainer}
            >
              <Text
                style={[styles.forgotPasswordText, { color: colors.primary }]}
              >
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <Button
              title="Sign In"
              onPress={handleSignIn}
              loading={loading}
              style={styles.signInButton}
              icon={<ArrowRight color={colors.white} size={20} />}
            />

            {/* Divider */}
            <View style={styles.divider}>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.border }]}
              />
              <Text
                style={[styles.dividerText, { color: colors.textSecondary }]}
              >
                or continue with
              </Text>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.border }]}
              />
            </View>

            {/* Social Sign In Options */}
            <View style={styles.socialContainer}>
              <Button
                title="Continue with Google"
                onPress={() => handleSocialSignIn('google')}
                variant="outline"
                style={styles.socialButton}
              />
              <Button
                title="Continue with Apple"
                onPress={() => handleSocialSignIn('apple')}
                variant="outline"
                style={styles.socialButton}
              />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Don't have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.push('/auth/sign-up')}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function WrappedSignInScreen() {
  return (
    <ErrorBoundary>
      <SignInScreen />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.body,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 56,
    backgroundColor: 'transparent',
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    ...Typography.body,
    height: '100%',
  },
  eyeIcon: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  errorText: {
    ...Typography.caption,
    marginTop: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.lg,
  },
  forgotPasswordText: {
    ...Typography.body,
    fontWeight: '500',
  },
  signInButton: {
    marginBottom: Spacing.lg,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...Typography.caption,
    marginHorizontal: Spacing.md,
    fontWeight: '500',
  },
  socialContainer: {
    gap: Spacing.sm,
  },
  socialButton: {
    marginBottom: Spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  footerText: {
    ...Typography.body,
  },
  footerLink: {
    ...Typography.body,
    fontWeight: '600',
  },
});
