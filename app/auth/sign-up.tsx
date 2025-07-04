import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, SafeAreaView, ScrollView } from 'react-native'; // Added ScrollView
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Spacing, Typography } from '@/constants/Colors';
import { useThemeColors } from '@/hooks/useTheme';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUpWithPassword } = useAuth();
  const router = useRouter();
  const { colors } = useThemeColors();

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await signUpWithPassword(email, password);
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        // This case might indicate email confirmation is required but user object is returned.
        // Supabase behavior: if email confirmation is on, user is created but session is null until confirmed.
        Alert.alert('Sign Up Successful', 'Please check your email to confirm your account.');
        router.replace('/auth/sign-in'); // Go to sign-in after showing message
      } else if (data.session) {
        // User signed up and logged in (e.g. if auto-confirm is on or email confirmation is off)
        // Navigation to main app content will be handled by RootLayout/AppContent
      } else {
        // Default case, often means email confirmation needed
         Alert.alert('Sign Up Successful', 'Please check your email to confirm your account.');
         router.replace('/auth/sign-in');
      }
    } catch (error: any) {
      Alert.alert('Sign Up Failed', error.message || 'An unexpected error occurred.');
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
        <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="Email"
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="Password"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
          placeholder="Confirm Password"
          placeholderTextColor={colors.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        <Button title="Sign Up" onPress={handleSignUp} loading={loading} />
        <Button
          title="Already have an account? Sign In"
          onPress={() => router.push('/auth/sign-in')}
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
