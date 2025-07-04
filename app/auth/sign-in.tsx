import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, SafeAreaView, ScrollView } from 'react-native'; // Added ScrollView
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Spacing, Typography, currentColors as defaultColors } from '@/constants/Colors'; // Using default for now, theme can be applied later
import { useThemeColors } from '@/hooks/useTheme'; // To get themed colors

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithPassword } = useAuth();
  const router = useRouter();
  const { colors } = useThemeColors(); // Themed colors

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      await signInWithPassword(email, password);
      // Navigation to main app content will be handled by RootLayout/AppContent based on auth state
      // router.replace('/(tabs)/'); // Or let RootLayout handle redirect
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'An unexpected error occurred.');
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
        <Text style={[styles.title, { color: colors.text }]}>Sign In</Text>
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
        <Button title="Sign In" onPress={handleSignIn} loading={loading} />
        <Button
          title="Don't have an account? Sign Up"
          onPress={() => router.push('/auth/sign-up')}
          variant="ghost"
          style={{ marginTop: Spacing.md }}
        />
        <Button
          title="Forgot Password?"
          onPress={() => router.push('/auth/forgot-password')}
          variant="ghost"
          style={{ marginTop: Spacing.sm }}
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
