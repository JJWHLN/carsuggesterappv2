import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  CheckCircle,
  Camera,
  Settings,
  Bell,
  MapPin,
  Save
} from 'lucide-react-native';
import { useAuth, useUser } from '../auth/AuthContext';
import { profileUpdateSchema, ProfileUpdateFormData } from '../auth/validation';

interface UserProfileProps {
  navigation?: any;
}

export const UserProfile: React.FC<UserProfileProps> = ({ navigation }) => {
  const { actions, state } = useAuth();
  const user = useUser();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    watch,
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const watchNewPassword = watch('newPassword');

  const onSubmit = async (data: ProfileUpdateFormData) => {
    try {
      const updateData: any = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
      };

      // Only include password fields if changing password
      if (data.newPassword && data.currentPassword) {
        updateData.currentPassword = data.currentPassword;
        updateData.newPassword = data.newPassword;
      }

      await actions.updateProfile(updateData);
      
      Alert.alert(
        'Profile Updated',
        'Your profile has been successfully updated.',
        [{ text: 'OK' }]
      );

      // Reset password fields
      reset({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      
      setIsChangingPassword(false);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      Alert.alert('Update Error', errorMessage);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: actions.logout
        },
      ]
    );
  };

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-lg text-gray-600">Please sign in to view your profile</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white border-b border-gray-200 px-4 py-4">
        <Text className="text-2xl font-bold text-gray-900">Profile</Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="bg-white border-b border-gray-200 p-6">
          <View className="items-center">
            {/* Avatar */}
            <View className="relative mb-4">
              <View className="w-24 h-24 bg-gray-200 rounded-full items-center justify-center">
                {user.avatar ? (
                  <Text className="text-3xl">👤</Text>
                ) : (
                  <User size={32} className="text-gray-400" />
                )}
              </View>
              <TouchableOpacity className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full items-center justify-center">
                <Camera size={16} className="text-white" />
              </TouchableOpacity>
            </View>

            <Text className="text-xl font-bold text-gray-900 mb-1">
              {user.firstName} {user.lastName}
            </Text>
            <Text className="text-gray-600 mb-2">{user.email}</Text>
            
            {!user.isVerified && (
              <View className="flex-row items-center bg-yellow-50 px-3 py-2 rounded-full">
                <AlertCircle size={16} className="text-yellow-600 mr-2" />
                <Text className="text-yellow-700 text-sm font-medium">
                  Email not verified
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Profile Form */}
        <View className="bg-white mt-6 mx-4 rounded-lg shadow-sm border border-gray-200">
          <View className="p-6">
            <Text className="text-lg font-semibold text-gray-900 mb-6">
              Personal Information
            </Text>

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
                      <User size={20} className="absolute left-3 top-3 text-gray-400 z-10" />
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="First name"
                        autoCapitalize="words"
                        className={`w-full pl-12 pr-4 py-3 border rounded-lg text-gray-900 ${
                          errors.firstName ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                        }`}
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  )}
                />
                {errors.firstName && (
                  <View className="flex-row items-center mt-2">
                    <AlertCircle size={16} className="text-red-500 mr-1" />
                    <Text className="text-red-500 text-sm">{errors.firstName.message}</Text>
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
                      <User size={20} className="absolute left-3 top-3 text-gray-400 z-10" />
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="Last name"
                        autoCapitalize="words"
                        className={`w-full pl-12 pr-4 py-3 border rounded-lg text-gray-900 ${
                          errors.lastName ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                        }`}
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  )}
                />
                {errors.lastName && (
                  <View className="flex-row items-center mt-2">
                    <AlertCircle size={16} className="text-red-500 mr-1" />
                    <Text className="text-red-500 text-sm">{errors.lastName.message}</Text>
                  </View>
                )}
              </View>

              {/* Email */}
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
                        placeholder="Email address"
                        keyboardType="email-address"
                        autoCapitalize="none"
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
            </View>
          </View>
        </View>

        {/* Password Change Section */}
        <View className="bg-white mt-6 mx-4 rounded-lg shadow-sm border border-gray-200">
          <View className="p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-lg font-semibold text-gray-900">
                Password
              </Text>
              <TouchableOpacity
                onPress={() => setIsChangingPassword(!isChangingPassword)}
                className={`px-4 py-2 rounded-lg ${
                  isChangingPassword ? 'bg-red-100' : 'bg-blue-100'
                }`}
              >
                <Text className={`text-sm font-medium ${
                  isChangingPassword ? 'text-red-700' : 'text-blue-700'
                }`}>
                  {isChangingPassword ? 'Cancel' : 'Change Password'}
                </Text>
              </TouchableOpacity>
            </View>

            {isChangingPassword && (
              <View className="space-y-6">
                {/* Current Password */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </Text>
                  <Controller
                    control={control}
                    name="currentPassword"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className="relative">
                        <Lock size={20} className="absolute left-3 top-3 text-gray-400 z-10" />
                        <TextInput
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          placeholder="Enter current password"
                          secureTextEntry={!showCurrentPassword}
                          className={`w-full pl-12 pr-12 py-3 border rounded-lg text-gray-900 ${
                            errors.currentPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                          }`}
                          placeholderTextColor="#9CA3AF"
                        />
                        <TouchableOpacity
                          onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-3"
                        >
                          {showCurrentPassword ? (
                            <EyeOff size={20} className="text-gray-400" />
                          ) : (
                            <Eye size={20} className="text-gray-400" />
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                  {errors.currentPassword && (
                    <View className="flex-row items-center mt-2">
                      <AlertCircle size={16} className="text-red-500 mr-1" />
                      <Text className="text-red-500 text-sm">{errors.currentPassword.message}</Text>
                    </View>
                  )}
                </View>

                {/* New Password */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </Text>
                  <Controller
                    control={control}
                    name="newPassword"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className="relative">
                        <Lock size={20} className="absolute left-3 top-3 text-gray-400 z-10" />
                        <TextInput
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          placeholder="Enter new password"
                          secureTextEntry={!showNewPassword}
                          className={`w-full pl-12 pr-12 py-3 border rounded-lg text-gray-900 ${
                            errors.newPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                          }`}
                          placeholderTextColor="#9CA3AF"
                        />
                        <TouchableOpacity
                          onPress={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-3"
                        >
                          {showNewPassword ? (
                            <EyeOff size={20} className="text-gray-400" />
                          ) : (
                            <Eye size={20} className="text-gray-400" />
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  />
                  {errors.newPassword && (
                    <View className="flex-row items-center mt-2">
                      <AlertCircle size={16} className="text-red-500 mr-1" />
                      <Text className="text-red-500 text-sm">{errors.newPassword.message}</Text>
                    </View>
                  )}
                </View>

                {/* Confirm New Password */}
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </Text>
                  <Controller
                    control={control}
                    name="confirmNewPassword"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <View className="relative">
                        <Lock size={20} className="absolute left-3 top-3 text-gray-400 z-10" />
                        <TextInput
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          placeholder="Confirm new password"
                          secureTextEntry={!showConfirmPassword}
                          className={`w-full pl-12 pr-12 py-3 border rounded-lg text-gray-900 ${
                            errors.confirmNewPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                          }`}
                          placeholderTextColor="#9CA3AF"
                        />
                        <TouchableOpacity
                          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
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
                  {errors.confirmNewPassword && (
                    <View className="flex-row items-center mt-2">
                      <AlertCircle size={16} className="text-red-500 mr-1" />
                      <Text className="text-red-500 text-sm">{errors.confirmNewPassword.message}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-white mt-6 mx-4 rounded-lg shadow-sm border border-gray-200">
          <View className="p-6">
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </Text>
            
            <View className="space-y-3">
              <TouchableOpacity 
                onPress={() => navigation?.navigate('Preferences')}
                className="flex-row items-center p-4 bg-gray-50 rounded-lg"
              >
                <Settings size={20} className="text-gray-600 mr-3" />
                <View className="flex-1">
                  <Text className="font-medium text-gray-900">Preferences</Text>
                  <Text className="text-sm text-gray-600">Update your car preferences</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => navigation?.navigate('Notifications')}
                className="flex-row items-center p-4 bg-gray-50 rounded-lg"
              >
                <Bell size={20} className="text-gray-600 mr-3" />
                <View className="flex-1">
                  <Text className="font-medium text-gray-900">Notifications</Text>
                  <Text className="text-sm text-gray-600">Manage alert preferences</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => navigation?.navigate('Location')}
                className="flex-row items-center p-4 bg-gray-50 rounded-lg"
              >
                <MapPin size={20} className="text-gray-600 mr-3" />
                <View className="flex-1">
                  <Text className="font-medium text-gray-900">Location</Text>
                  <Text className="text-sm text-gray-600">Update search location</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="p-6 space-y-4">
          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting || !isDirty}
            className={`w-full py-4 rounded-lg flex-row items-center justify-center ${
              isSubmitting || !isDirty
                ? 'bg-gray-300'
                : 'bg-green-500'
            }`}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Save size={20} className="text-white mr-2" />
                <Text className="text-white font-semibold text-lg">
                  Save Changes
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Logout Button */}
          <TouchableOpacity
            onPress={handleLogout}
            className="w-full py-4 border border-red-300 rounded-lg flex-row items-center justify-center"
          >
            <Text className="text-red-600 font-semibold text-lg">
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};
