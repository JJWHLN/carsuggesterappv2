import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SignInScreen from '@/app/auth/sign-in';
import SignUpScreen from '@/app/auth/sign-up';
import ForgotPasswordScreen from '@/app/auth/forgot-password';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

// Mock Supabase
const mockSupabase = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
  }
};

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

// Mock Alert (it's already mocked in jest.setup.js, so just spy on it)
const alertSpy = jest.spyOn(Alert, 'alert');

describe('Authentication Flow Integration Tests', () => {
  const renderWithAuthProvider = (component: React.ReactElement) => {
    return render(
      <AuthProvider>
        {component}
      </AuthProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Sign In Flow', () => {
    it('should successfully sign in with valid credentials', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: { access_token: 'token' } },
        error: null
      });

      const { getByPlaceholderText, getByText } = renderWithAuthProvider(
        <SignInScreen />
      );

      // Enter valid credentials
      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'test@example.com');
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');

      // Submit form
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(mockRouter.replace).toHaveBeenCalledWith('/(tabs)');
      });
    });

    it('should handle sign in errors gracefully', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      });

      const { getByPlaceholderText, getByText } = renderWithAuthProvider(
        <SignInScreen />
      );

      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'invalid@example.com');
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'wrongpassword');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Sign In Failed',
          'Invalid credentials'
        );
      });
    });

    it('should validate email format', async () => {
      const { getByPlaceholderText, getByText } = renderWithAuthProvider(
        <SignInScreen />
      );

      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'invalid-email');
      fireEvent.changeText(getByPlaceholderText('Enter your password'), 'password123');
      fireEvent.press(getByText('Sign In'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Validation Error',
          expect.stringContaining('email')
        );
      });
    });

    it('should navigate to sign up screen', () => {
      const { getByText } = renderWithAuthProvider(<SignInScreen />);
      
      fireEvent.press(getByText('Create Account'));
      
      expect(mockRouter.push).toHaveBeenCalledWith('/auth/sign-up');
    });

    it('should navigate to forgot password screen', () => {
      const { getByText } = renderWithAuthProvider(<SignInScreen />);
      
      fireEvent.press(getByText('Forgot Password?'));
      
      expect(mockRouter.push).toHaveBeenCalledWith('/auth/forgot-password');
    });
  });

  describe('Sign Up Flow', () => {
    it('should successfully create account with valid data', async () => {
      const mockUser = { id: '1', email: 'newuser@example.com' };
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: null },
        error: null
      });

      const { getByPlaceholderText, getByText } = renderWithAuthProvider(
        <SignUpScreen />
      );

      fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Doe');
      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'newuser@example.com');
      fireEvent.changeText(getByPlaceholderText('Create a password'), 'securepassword');
      fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'securepassword');

      fireEvent.press(getByText('Create Account'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Check Your Email',
          expect.stringContaining('verification')
        );
      });
    });

    it('should validate password confirmation', async () => {
      const { getByPlaceholderText, getByText } = renderWithAuthProvider(
        <SignUpScreen />
      );

      fireEvent.changeText(getByPlaceholderText('Enter your full name'), 'John Doe');
      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'newuser@example.com');
      fireEvent.changeText(getByPlaceholderText('Create a password'), 'password123');
      fireEvent.changeText(getByPlaceholderText('Confirm your password'), 'different');

      fireEvent.press(getByText('Create Account'));

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

      const { getByPlaceholderText, getByText } = renderWithAuthProvider(
        <ForgotPasswordScreen />
      );

      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'user@example.com');
      fireEvent.press(getByText('Send Reset Link'));

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

      const { getByPlaceholderText, getByText } = renderWithAuthProvider(
        <ForgotPasswordScreen />
      );

      fireEvent.changeText(getByPlaceholderText('Enter your email'), 'nonexistent@example.com');
      fireEvent.press(getByText('Send Reset Link'));

      await waitFor(() => {
        expect(Alert.alert).toHaveBeenCalledWith(
          'Error',
          'User not found'
        );
      });
    });
  });
});
