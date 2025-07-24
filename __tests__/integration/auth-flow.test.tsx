import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SignInScreen from '@/app/auth/sign-in';
import SignUpScreen from '@/app/auth/sign-up';
import ForgotPasswordScreen from '@/app/auth/forgot-password';
import {
  renderWithProviders,
  mockUser,
  expectSuccessfulAuth,
  expectAuthError,
  fillForm,
  submitForm,
  createMockSupabaseQuery
} from '../utils/testUtils';

// Create mock Supabase instance
const mockSupabase = createMockSupabaseQuery();

jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}));

// Mock expo-router
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

jest.mock('expo-router', () => ({
  router: mockRouter,
  useRouter: () => mockRouter,
}));

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Sign In Flow', () => {
    it('should successfully sign in with valid credentials', async () => {
      expectSuccessfulAuth(mockSupabase, mockUser);

      const { getByPlaceholderText, getByText } = renderWithProviders(<SignInScreen />);

      fillForm(getByPlaceholderText, {
        'email': 'test@example.com',
        'password': 'password123'
      });

      submitForm(getByText, 'Sign In');

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
      });
    });

    it('should handle sign in errors gracefully', async () => {
      expectAuthError(mockSupabase, 'Invalid credentials');

      const { getByPlaceholderText, getByText } = renderWithProviders(<SignInScreen />);

      fillForm(getByPlaceholderText, {
        'email': 'invalid@example.com',
        'password': 'wrongpassword'
      });

      submitForm(getByText, 'Sign In');

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Sign In Failed',
          'Invalid credentials'
        );
      });
    });

    it('should validate email format', async () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(<SignInScreen />);

      fillForm(getByPlaceholderText, {
        'email': 'invalid-email',
        'password': 'password123'
      });

      submitForm(getByText, 'Sign In');

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Validation Error',
          expect.stringContaining('email')
        );
      });
    });

    it('should navigate to sign up screen', () => {
      const { getByText } = renderWithProviders(<SignInScreen />);
      
      fireEvent.press(getByText('Create Account'));
      
      expect(mockRouter.push).toHaveBeenCalledWith('/auth/sign-up');
    });

    it('should navigate to forgot password screen', () => {
      const { getByText } = renderWithProviders(<SignInScreen />);
      
      fireEvent.press(getByText('Forgot Password?'));
      
      expect(mockRouter.push).toHaveBeenCalledWith('/auth/forgot-password');
    });
  });

  describe('Sign Up Flow', () => {
    it('should successfully create account with valid data', async () => {
      const newUser = { id: '1', email: 'newuser@example.com' };
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: newUser, session: null },
        error: null
      });

      const { getByPlaceholderText, getByText } = renderWithProviders(<SignUpScreen />);

      fillForm(getByPlaceholderText, {
        'full name': 'John Doe',
        'email': 'newuser@example.com',
        'password': 'securepassword',
        'confirm': 'securepassword'
      });

      submitForm(getByText, 'Create Account');

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Check Your Email',
          expect.stringContaining('verification')
        );
      });
    });

    it('should validate password confirmation', async () => {
      const { getByPlaceholderText, getByText } = renderWithProviders(<SignUpScreen />);

      fillForm(getByPlaceholderText, {
        'full name': 'John Doe',
        'email': 'newuser@example.com',
        'password': 'password123',
        'confirm': 'different'
      });

      submitForm(getByText, 'Create Account');

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Validation Error',
          expect.stringContaining('match')
        );
      });
    });
  });

  describe('Password Reset Flow', () => {
    it('should send password reset email', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null
      });

      const { getByPlaceholderText, getByText } = renderWithProviders(<ForgotPasswordScreen />);

      fillForm(getByPlaceholderText, {
        'email': 'user@example.com'
      });

      submitForm(getByText, 'Send Reset Link');

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Reset Link Sent',
          expect.stringContaining('check your email')
        );
      });
    });

    it('should handle invalid email for password reset', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: { message: 'User not found' }
      });

      const { getByPlaceholderText, getByText } = renderWithProviders(<ForgotPasswordScreen />);

      fillForm(getByPlaceholderText, {
        'email': 'nonexistent@example.com'
      });

      submitForm(getByText, 'Send Reset Link');

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'User not found'
        );
      });
    });
  });
});
