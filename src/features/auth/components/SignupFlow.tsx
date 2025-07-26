import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  X,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react-native';
import { useAuth } from '../AuthContext';
import { signupSchema, SignupFormData } from '../validation';

interface SignupFlowProps {
  isVisible: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

const passwordRequirements = [
  { text: 'At least 8 characters', regex: /.{8,}/ },
  { text: 'One uppercase letter', regex: /[A-Z]/ },
  { text: 'One lowercase letter', regex: /[a-z]/ },
  { text: 'One number', regex: /[0-9]/ },
  { text: 'One special character', regex: /[^A-Za-z0-9]/ },
];

export const SignupFlow: React.FC<SignupFlowProps> = ({
  isVisible,
  onClose,
  onSwitchToLogin,
}) => {
  const { actions, state } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [password, setPassword] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    watch,
    trigger,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      acceptTerms: false,
    },
  });

  const watchedPassword = watch('password');

  const checkPasswordRequirement = (requirement: { regex: RegExp }) => {
    return requirement.regex.test(watchedPassword || '');
  };

  const onSubmit = async (data: SignupFormData) => {
    try {
      await actions.signup({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      reset();
      onClose();

      Alert.alert(
        'Welcome!',
        'Your account has been created successfully. You can now start exploring cars tailored to your preferences.',
        [{ text: 'Get Started' }],
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Signup failed';

      if (errorMessage.includes('email already exists')) {
        setError('email', {
          message: 'An account with this email already exists',
        });
      } else if (errorMessage.includes('Too many attempts')) {
        Alert.alert(
          'Too Many Attempts',
          'Please wait a few minutes before trying again.',
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert('Signup Error', errorMessage);
      }
    }
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      const isValid = await trigger(['firstName', 'lastName']);
      if (isValid) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      const isValid = await trigger(['email']);
      if (isValid) {
        setCurrentStep(3);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    reset();
    setCurrentStep(1);
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
          <View className="flex-row items-center">
            {currentStep > 1 && (
              <TouchableOpacity
                onPress={handleBack}
                className="mr-3 p-2 rounded-full bg-gray-100"
              >
                <ArrowRight size={20} className="text-gray-600 rotate-180" />
              </TouchableOpacity>
            )}
            <Text className="text-xl font-bold text-gray-900">
              Create Account
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleClose}
            className="p-2 rounded-full bg-gray-100"
          >
            <X size={20} className="text-gray-600" />
          </TouchableOpacity>
        </View>

        {/* Progress Indicator */}
        <View className="flex-row p-4">
          {[1, 2, 3].map((step) => (
            <View key={step} className="flex-1 flex-row items-center">
              <View
                className={`w-8 h-8 rounded-full items-center justify-center ${
                  step <= currentStep ? 'bg-green-500' : 'bg-gray-200'
                }`}
              >
                <Text
                  className={`text-sm font-bold ${
                    step <= currentStep ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {step}
                </Text>
              </View>
              {step < 3 && (
                <View
                  className={`flex-1 h-1 mx-2 ${
                    step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </View>
          ))}
        </View>

        <ScrollView className="flex-1 px-6">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <View className="py-8">
              <View className="items-center mb-8">
                <Text className="text-2xl font-bold text-gray-900 mb-2">
                  Personal Information
                </Text>
                <Text className="text-gray-600 text-center">
                  Let's start with your basic information
                </Text>
              </View>

              <View className="space-y-6">
                {/* First Name */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </Text>
                  <Controller
                    control={control}
                    name="firstName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className="relative">
                        <User
                          size={20}
                          className="absolute left-3 top-3 text-gray-400 z-10"
                        />
                        <TextInput
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          placeholder="Enter your first name"
                          autoCapitalize="words"
                          className={`w-full pl-12 pr-4 py-3 border rounded-lg text-gray-900 ${
                            errors.firstName
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-300 bg-white'
                          }`}
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    )}
                  />
                  {errors.firstName && (
                    <View className="flex-row items-center mt-2">
                      <AlertCircle size={16} className="text-red-500 mr-1" />
                      <Text className="text-red-500 text-sm">
                        {errors.firstName.message}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Last Name */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </Text>
                  <Controller
                    control={control}
                    name="lastName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className="relative">
                        <User
                          size={20}
                          className="absolute left-3 top-3 text-gray-400 z-10"
                        />
                        <TextInput
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          placeholder="Enter your last name"
                          autoCapitalize="words"
                          className={`w-full pl-12 pr-4 py-3 border rounded-lg text-gray-900 ${
                            errors.lastName
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-300 bg-white'
                          }`}
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    )}
                  />
                  {errors.lastName && (
                    <View className="flex-row items-center mt-2">
                      <AlertCircle size={16} className="text-red-500 mr-1" />
                      <Text className="text-red-500 text-sm">
                        {errors.lastName.message}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={handleNext}
                  className="w-full py-4 bg-green-500 rounded-lg flex-row items-center justify-center mt-8"
                >
                  <Text className="text-white font-semibold text-lg mr-2">
                    Continue
                  </Text>
                  <ArrowRight size={20} className="text-white" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 2: Email */}
          {currentStep === 2 && (
            <View className="py-8">
              <View className="items-center mb-8">
                <Text className="text-2xl font-bold text-gray-900 mb-2">
                  Email Address
                </Text>
                <Text className="text-gray-600 text-center">
                  We'll use this to send you car alerts and updates
                </Text>
              </View>

              <View className="space-y-6">
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </Text>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className="relative">
                        <Mail
                          size={20}
                          className="absolute left-3 top-3 text-gray-400 z-10"
                        />
                        <TextInput
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          placeholder="Enter your email address"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          autoComplete="email"
                          className={`w-full pl-12 pr-4 py-3 border rounded-lg text-gray-900 ${
                            errors.email
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-300 bg-white'
                          }`}
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    )}
                  />
                  {errors.email && (
                    <View className="flex-row items-center mt-2">
                      <AlertCircle size={16} className="text-red-500 mr-1" />
                      <Text className="text-red-500 text-sm">
                        {errors.email.message}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={handleNext}
                  className="w-full py-4 bg-green-500 rounded-lg flex-row items-center justify-center mt-8"
                >
                  <Text className="text-white font-semibold text-lg mr-2">
                    Continue
                  </Text>
                  <ArrowRight size={20} className="text-white" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Step 3: Password & Terms */}
          {currentStep === 3 && (
            <View className="py-8">
              <View className="items-center mb-8">
                <Text className="text-2xl font-bold text-gray-900 mb-2">
                  Secure Your Account
                </Text>
                <Text className="text-gray-600 text-center">
                  Create a strong password to protect your account
                </Text>
              </View>

              <View className="space-y-6">
                {/* Password */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Password
                  </Text>
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className="relative">
                        <Lock
                          size={20}
                          className="absolute left-3 top-3 text-gray-400 z-10"
                        />
                        <TextInput
                          value={value}
                          onChangeText={(text) => {
                            onChange(text);
                            setPassword(text);
                          }}
                          onBlur={onBlur}
                          placeholder="Create a password"
                          secureTextEntry={!showPassword}
                          className={`w-full pl-12 pr-12 py-3 border rounded-lg text-gray-900 ${
                            errors.password
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-300 bg-white'
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

                  {/* Password Requirements */}
                  <View className="mt-3 space-y-2">
                    {passwordRequirements.map((req, index) => {
                      const isMet = checkPasswordRequirement(req);
                      return (
                        <View key={index} className="flex-row items-center">
                          {isMet ? (
                            <CheckCircle
                              size={16}
                              className="text-green-500 mr-2"
                            />
                          ) : (
                            <View className="w-4 h-4 border-2 border-gray-300 rounded-full mr-2" />
                          )}
                          <Text
                            className={`text-sm ${
                              isMet ? 'text-green-600' : 'text-gray-500'
                            }`}
                          >
                            {req.text}
                          </Text>
                        </View>
                      );
                    })}
                  </View>

                  {errors.password && (
                    <View className="flex-row items-center mt-2">
                      <AlertCircle size={16} className="text-red-500 mr-1" />
                      <Text className="text-red-500 text-sm">
                        {errors.password.message}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Confirm Password */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </Text>
                  <Controller
                    control={control}
                    name="confirmPassword"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className="relative">
                        <Lock
                          size={20}
                          className="absolute left-3 top-3 text-gray-400 z-10"
                        />
                        <TextInput
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          placeholder="Confirm your password"
                          secureTextEntry={!showConfirmPassword}
                          className={`w-full pl-12 pr-12 py-3 border rounded-lg text-gray-900 ${
                            errors.confirmPassword
                              ? 'border-red-300 bg-red-50'
                              : 'border-gray-300 bg-white'
                          }`}
                          placeholderTextColor="#9CA3AF"
                        />
                        <TouchableOpacity
                          onPress={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          className="absolute right-3 top-3"
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={20} className="text-gray-400" />
                          ) : (
                            <Eye size={20} className="text-gray-400" />
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                  {errors.confirmPassword && (
                    <View className="flex-row items-center mt-2">
                      <AlertCircle size={16} className="text-red-500 mr-1" />
                      <Text className="text-red-500 text-sm">
                        {errors.confirmPassword.message}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Terms Acceptance */}
                <View>
                  <Controller
                    control={control}
                    name="acceptTerms"
                    render={({ field: { onChange, value } }) => (
                      <TouchableOpacity
                        onPress={() => onChange(!value)}
                        className="flex-row items-start"
                      >
                        <View
                          className={`w-5 h-5 border-2 rounded mr-3 items-center justify-center mt-1 ${
                            value
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300'
                          }`}
                        >
                          {value && (
                            <Text className="text-white text-xs">✓</Text>
                          )}
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-700 text-sm leading-5">
                            I accept the{' '}
                            <Text className="text-green-600 font-medium">
                              Terms of Service
                            </Text>{' '}
                            and{' '}
                            <Text className="text-green-600 font-medium">
                              Privacy Policy
                            </Text>
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                  {errors.acceptTerms && (
                    <View className="flex-row items-center mt-2">
                      <AlertCircle size={16} className="text-red-500 mr-1" />
                      <Text className="text-red-500 text-sm">
                        {errors.acceptTerms.message}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSubmit(onSubmit)}
                  disabled={isSubmitting || state.isLoading}
                  className={`w-full py-4 rounded-lg flex-row items-center justify-center mt-8 ${
                    isSubmitting || state.isLoading
                      ? 'bg-gray-300'
                      : 'bg-green-500'
                  }`}
                >
                  {isSubmitting || state.isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-semibold text-lg">
                      Create Account
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Login Link */}
                <View className="flex-row items-center justify-center mt-6">
                  <Text className="text-gray-600">
                    Already have an account?{' '}
                  </Text>
                  <TouchableOpacity onPress={onSwitchToLogin}>
                    <Text className="text-green-600 font-medium">Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};
