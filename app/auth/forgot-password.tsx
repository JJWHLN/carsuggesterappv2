import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, SafeAreaView, ScrollView } from 'react-native'; // Added SafeAreaView and ScrollView
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Spacing, Typography } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPasswordForEmail } = useAuth();
  const router = useRouter();
  const { colors } = useThemeColors();

  const handlePasswordReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address.');
      return;
    }
    setLoading(true);
    try {
      await resetPasswordForEmail(email);
      Alert.alert(
        'Password Reset Email Sent',
        'If an account exists for this email, a password reset link has been sent. Please check your inbox.'
      );
      router.back(); // Go back to sign-in or previous screen
    } catch (error: any) {
      // Supabase doesn't typically throw an error here if email doesn't exist for security reasons.
      // It might throw for other reasons like network issues.
      Alert.alert('Error', error.message || 'An unexpected error occurred while trying to send the reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Enter your email address below and we'll send you a link to reset your password.
      </Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
        placeholder="Email"
        placeholderTextColor={colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Button title="Send Reset Link" onPress={handlePasswordReset} loading={loading} />
      <Button
        title="Back to Sign In"
        onPress={() => router.replace('/auth/sign-in')}
        variant="ghost"
        style={{ marginTop: Spacing.md }}
      />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: { // Now for ScrollView's contentContainerStyle
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  input: {
    ...Typography.body,
    height: 50,
    borderWidth: 1,
    borderRadius: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
});
