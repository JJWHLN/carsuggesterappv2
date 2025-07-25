import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Modal, 
  ScrollView,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  X, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  AlertCircle 
} from 'lucide-react-native';
import { useAuth } from '../AuthContext';
import { loginSchema, LoginFormData } from '../validation';
import { SocialLoginProvider } from '../types';

interface LoginModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSwitchToSignup: () => void;
  onForgotPassword: () => void;
}

const socialProviders: SocialLoginProvider[] = [
  {
    id: 'google',
    name: 'Google',
    icon: '🔵',
    color: 'bg-blue-500',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '📘',
    color: 'bg-blue-600',
  },
  {
    id: 'apple',
    name: 'Apple',
    icon: '🍎',
    color: 'bg-black',
  },
];

export const LoginModal: React.FC<LoginModalProps> = ({
  isVisible,
  onClose,
  onSwitchToSignup,
  onForgotPassword,
}) => {
  const { actions, state } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await actions.login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      });
      
      reset();
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      if (errorMessage.includes('Invalid email or password')) {
        setError('email', { message: 'Invalid email or password' });
        setError('password', { message: 'Invalid email or password' });
      } else if (errorMessage.includes('Too many attempts')) {
        Alert.alert(
          'Account Temporarily Locked',
          'Too many failed login attempts. Please try again later or reset your password.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Login Error', errorMessage);
      }
    }
  };

  const handleSocialLogin = async (provider: SocialLoginProvider) => {
    try {
      setSocialLoading(provider.id);
      
      // In a real app, this would open the social login flow
      // For demo purposes, we'll simulate it
      const mockToken = `mock_${provider.id}_token_${Date.now()}`;
      await actions.socialLogin(provider.id, mockToken);
      
      onClose();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Social login failed';
      Alert.alert('Login Error', errorMessage);
    } finally {
      setSocialLoading(null);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
          <Text className="text-xl font-bold text-gray-900">
            Welcome Back
          </Text>
          <TouchableOpacity
            onPress={handleClose}
            className="p-2 rounded-full bg-gray-100"
          >
            <X size={20} className="text-gray-600" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-6 py-8">
          {/* Welcome Message */}
          <View className="items-center mb-8">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Sign In
            </Text>
            <Text className="text-gray-600 text-center">
              Sign in to your account to access your saved cars and preferences
            </Text>
          </View>

          {/* Social Login Buttons */}
          <View className="mb-8">
            <Text className="text-sm font-medium text-gray-700 mb-4 text-center">
              Continue with
            </Text>
            <View className="space-y-3">
              {socialProviders.map((provider) => (
                <TouchableOpacity
                  key={provider.id}
                  onPress={() => handleSocialLogin(provider)}
                  disabled={socialLoading !== null}
                  className={`flex-row items-center justify-center py-3 px-4 rounded-lg border border-gray-300 ${
                    socialLoading === provider.id ? 'opacity-50' : ''
                  }`}
                >
                  {socialLoading === provider.id ? (
                    <ActivityIndicator size="small" color="#666" />
                  ) : (
                    <>
                      <Text className="text-xl mr-3">{provider.icon}</Text>
                      <Text className="text-gray-700 font-medium">
                        Continue with {provider.name}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Divider */}
          <View className="flex-row items-center mb-8">
            <View className="flex-1 h-px bg-gray-300" />
            <Text className="px-4 text-gray-500 text-sm">or</Text>
            <View className="flex-1 h-px bg-gray-300" />
          </View>

          {/* Login Form */}
          <View className="space-y-6">
            {/* Email Field */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Email Address
              </Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="relative">
                    <Mail size={20} className="absolute left-3 top-3 text-gray-400 z-10" />
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Enter your email"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      className={`w-full pl-12 pr-4 py-3 border rounded-lg text-gray-900 ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                      }`}
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                )}
              />
              {errors.email && (
                <View className="flex-row items-center mt-2">
                  <AlertCircle size={16} className="text-red-500 mr-1" />
                  <Text className="text-red-500 text-sm">{errors.email.message}</Text>
                </View>
              )}
            </View>

            {/* Password Field */}
            <View>
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Password
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View className="relative">
                    <Lock size={20} className="absolute left-3 top-3 text-gray-400 z-10" />
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Enter your password"
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                      className={`w-full pl-12 pr-12 py-3 border rounded-lg text-gray-900 ${
                        errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                      }`}
                      placeholderTextColor="#9CA3AF"
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3"
                    >
                      {showPassword ? (
                        <EyeOff size={20} className="text-gray-400" />
                      ) : (
                        <Eye size={20} className="text-gray-400" />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <View className="flex-row items-center mt-2">
                  <AlertCircle size={16} className="text-red-500 mr-1" />
                  <Text className="text-red-500 text-sm">{errors.password.message}</Text>
                </View>
              )}
            </View>

            {/* Remember Me & Forgot Password */}
            <View className="flex-row items-center justify-between">
              <Controller
                control={control}
                name="rememberMe"
                render={({ field: { onChange, value } }) => (
                  <TouchableOpacity
                    onPress={() => onChange(!value)}
                    className="flex-row items-center"
                  >
                    <View className={`w-5 h-5 border-2 rounded mr-3 items-center justify-center ${
                      value ? 'bg-green-500 border-green-500' : 'border-gray-300'
                    }`}>
                      {value && <Text className="text-white text-xs">✓</Text>}
                    </View>
                    <Text className="text-gray-700 text-sm">Remember me</Text>
                  </TouchableOpacity>
                )}
              />

              <TouchableOpacity onPress={onForgotPassword}>
                <Text className="text-green-600 text-sm font-medium">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting || state.isLoading}
              className={`w-full py-4 rounded-lg flex-row items-center justify-center ${
                isSubmitting || state.isLoading
                  ? 'bg-gray-300'
                  : 'bg-green-500'
              }`}
            >
              {(isSubmitting || state.isLoading) ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-white font-semibold text-lg">
                  Sign In
                </Text>
              )}
            </TouchableOpacity>

            {/* Sign Up Link */}
            <View className="flex-row items-center justify-center">
              <Text className="text-gray-600">Don't have an account? </Text>
              <TouchableOpacity onPress={onSwitchToSignup}>
                <Text className="text-green-600 font-medium">Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};
