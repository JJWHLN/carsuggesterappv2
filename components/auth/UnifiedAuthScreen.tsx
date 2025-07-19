import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useComprehensiveTheme } from '../../hooks/useComprehensiveTheme';
import { useUnifiedForm, authFormConfigs } from '../../hooks/useUnifiedForm';
import { UnifiedFormInput } from '../ui/UnifiedFormInput';
import { Button } from '../ui/Button';
import { notifications } from '../../services/notifications';
import { useAuth } from '../../contexts/AuthContext';

export interface UnifiedAuthScreenProps {
  mode: 'sign-in' | 'sign-up' | 'forgot-password';
  title?: string;
  subtitle?: string;
  showSocialLogin?: boolean;
  redirectPath?: string;
  onSuccess?: () => void;
}

/**
 * Unified auth screen component that eliminates redundancies across auth screens
 * Handles sign-in, sign-up, and forgot-password flows with consistent UI and validation
 */
export const UnifiedAuthScreen: React.FC<UnifiedAuthScreenProps> = ({
  mode,
  title,
  subtitle,
  showSocialLogin = false,
  redirectPath,
  onSuccess,
}) => {
  const { theme } = useComprehensiveTheme();
  const { signInWithPassword, signUpWithPassword, resetPasswordForEmail } = useAuth();

  // Configure form based on mode
  const getFormConfig = () => {
    switch (mode) {
      case 'sign-up':
        return {
          email: authFormConfigs.signUp.email,
          password: authFormConfigs.signUp.password,
          confirmPassword: authFormConfigs.signUp.confirmPassword,
        };
      case 'forgot-password':
        return {
          email: authFormConfigs.forgotPassword.email,
        };
      default:
        return {
          email: authFormConfigs.signIn.email,
          password: authFormConfigs.signIn.password,
        };
    }
  };

  const form = useUnifiedForm(getFormConfig() as any, {
    onSubmit: handleSubmit,
    validateOnChange: false,
    showErrorAlerts: false,
  });

  // Handle password confirmation validation for sign-up
  React.useEffect(() => {
    if (mode === 'sign-up' && form.values.confirmPassword && form.values.password) {
      const confirmPasswordValidator = (confirmPassword: string) => {
        if (confirmPassword !== form.values.password) {
          return 'Passwords do not match';
        }
        return undefined;
      };
      const error = confirmPasswordValidator(form.values.confirmPassword);
      form.setFieldError('confirmPassword' as any, error);
    }
  }, [form.values.password, form.values.confirmPassword, mode]);

  async function handleSubmit(values: Record<string, string>) {
    try {
      switch (mode) {
        case 'sign-in':
          await signInWithPassword(values.email, values.password);
          notifications.auth.signInSuccess();
          break;
          
        case 'sign-up':
          await signUpWithPassword(values.email, values.password, '', '');
          notifications.auth.signUpSuccess();
          break;
          
        case 'forgot-password':
          await resetPasswordForEmail(values.email);
          notifications.auth.passwordResetSent();
          router.back();
          return;
      }

      // Handle success
      onSuccess?.();
      if (redirectPath) {
        router.replace(redirectPath as any);
      } else if (mode === 'sign-in' || mode === 'sign-up') {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      // Handle specific auth errors
      const errorCode = error.code || error.message;
      
      if (errorCode.includes('invalid-credential') || errorCode.includes('wrong-password')) {
        notifications.auth.invalidCredentials();
      } else if (errorCode.includes('email-already-in-use')) {
        notifications.auth.emailAlreadyInUse();
      } else if (errorCode.includes('weak-password')) {
        notifications.auth.weakPassword();
      } else if (errorCode.includes('email-not-verified')) {
        notifications.auth.emailNotVerified();
      } else {
        notifications.error('Authentication Error', error.message);
      }
    }
  }

  const getTitle = () => {
    if (title) return title;
    switch (mode) {
      case 'sign-up': return 'Create Account';
      case 'forgot-password': return 'Reset Password';
      default: return 'Sign In';
    }
  };

  const getSubtitle = () => {
    if (subtitle) return subtitle;
    switch (mode) {
      case 'sign-up': return 'Join CarSuggester to find your perfect car';
      case 'forgot-password': return 'Enter your email to reset your password';
      default: return 'Welcome back to CarSuggester';
    }
  };

  const getSubmitButtonText = () => {
    switch (mode) {
      case 'sign-up': return 'Create Account';
      case 'forgot-password': return 'Send Reset Email';
      default: return 'Sign In';
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 32,
    },
    header: {
      marginBottom: 32,
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    form: {
      marginBottom: 24,
    },
    submitButton: {
      marginTop: 8,
    },
    links: {
      marginTop: 24,
      alignItems: 'center',
    },
    linkText: {
      fontSize: 14,
      color: theme.colors.primary,
      textAlign: 'center',
      paddingVertical: 8,
    },
    divider: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 24,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.border,
    },
    dividerText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginHorizontal: 16,
    },
    socialButtons: {
      gap: 12,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{getTitle()}</Text>
            <Text style={styles.subtitle}>{getSubtitle()}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <UnifiedFormInput
              label="Email"
              type="email"
              placeholder="Enter your email"
              required
              {...form.getFieldProps('email')}
            />

            {(mode === 'sign-in' || mode === 'sign-up') && (
              <UnifiedFormInput
                label="Password"
                type="password"
                placeholder="Enter your password"
                required
                {...form.getFieldProps('password' as any)}
              />
            )}

            {mode === 'sign-up' && (
              <UnifiedFormInput
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                required
                {...form.getFieldProps('confirmPassword' as any)}
              />
            )}

            <Button
              title={getSubmitButtonText()}
              onPress={form.handleSubmit}
              loading={form.isSubmitting}
              disabled={!form.isValid || form.isSubmitting}
              style={styles.submitButton}
            />
          </View>

          {/* Links */}
          <View style={styles.links}>
            {mode === 'sign-in' && (
              <>
                <TouchableOpacity onPress={() => router.push('/auth/forgot-password')}>
                  <Text style={styles.linkText}>Forgot your password?</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => router.push('/auth/sign-up')}>
                  <Text style={styles.linkText}>
                    Don't have an account? Sign up
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {mode === 'sign-up' && (
              <TouchableOpacity onPress={() => router.push('/auth/sign-in')}>
                <Text style={styles.linkText}>
                  Already have an account? Sign in
                </Text>
              </TouchableOpacity>
            )}

            {mode === 'forgot-password' && (
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.linkText}>
                  Remember your password? Sign in
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Social Login */}
          {showSocialLogin && mode !== 'forgot-password' && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.socialButtons}>
                <Button
                  title="Continue with Google"
                  variant="outline"
                  onPress={() => notifications.comingSoon('Google Sign In')}
                />
                <Button
                  title="Continue with Apple"
                  variant="outline"
                  onPress={() => notifications.comingSoon('Apple Sign In')}
                />
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
