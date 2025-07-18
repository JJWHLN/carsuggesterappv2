import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri, AuthRequest, ResponseType, CodeChallengeMethod } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';

// Complete the auth session
WebBrowser.maybeCompleteAuthSession();

// Car marketplace user preferences
export interface CarUserPreferences {
  preferredBrands: string[];
  budgetRange: { min: number; max: number };
  fuelTypes: string[];
  bodyTypes: string[];
  transmissionTypes: string[];
  location: string;
  searchRadius: number;
  notificationSettings: {
    priceDrops: boolean;
    newListings: boolean;
    savedSearchMatches: boolean;
    dealerMessages: boolean;
  };
}

// Car marketplace user profile
export interface CarUserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  phone?: string;
  location?: string;
  isDealer: boolean;
  dealerInfo?: {
    companyName: string;
    licenseNumber: string;
    address: string;
    website?: string;
  };
  preferences: CarUserPreferences;
  stats: {
    totalViews: number;
    savedCars: number;
    reviewsWritten: number;
    carsListed?: number; // Only for dealers
  };
  createdAt: string;
  lastLoginAt: string;
  onboardingCompleted: boolean;
}

// Authentication providers for car marketplace
export type AuthProvider = 'email' | 'google' | 'apple' | 'facebook';

// OAuth configuration for car marketplace
const googleConfig = {
  clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
  redirectUri: makeRedirectUri(),
  scopes: ['openid', 'profile', 'email'],
  additionalParameters: {},
};

export class EnhancedAuthService {
  private static instance: EnhancedAuthService;
  private userProfile: CarUserProfile | null = null;

  static getInstance(): EnhancedAuthService {
    if (!EnhancedAuthService.instance) {
      EnhancedAuthService.instance = new EnhancedAuthService();
    }
    return EnhancedAuthService.instance;
  }

  // Enhanced sign-up with car marketplace onboarding
  async signUpWithEmail(
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string,
    isDealer: boolean = false
  ): Promise<{ user: any; error: any }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            is_dealer: isDealer,
            onboarding_completed: false,
          }
        }
      });

      if (error) throw error;

      // Create user profile with car marketplace defaults
      if (data.user) {
        await this.createUserProfile(data.user, { firstName, lastName, isDealer });
      }

      return { user: data.user, error: null };
    } catch (error: any) {
      console.error('Enhanced signup error:', error);
      return { user: null, error };
    }
  }

  // Sign in with Apple (car enthusiast friendly)
  async signInWithApple(): Promise<{ user: any; error: any }> {
    try {
      if (Platform.OS !== 'ios') {
        throw new Error('Apple Sign-In is only available on iOS');
      }

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (error) throw error;

        // Create or update user profile
        if (data.user && !this.userProfile) {
          await this.createUserProfile(data.user, {
            firstName: credential.fullName?.givenName || '',
            lastName: credential.fullName?.familyName || '',
            isDealer: false
          });
        }

        return { user: data.user, error: null };
      }

      throw new Error('No identity token received');
    } catch (error: any) {
      console.error('Apple sign-in error:', error);
      return { user: null, error };
    }
  }

  // Sign in with Google (popular among car dealers)
  async signInWithGoogle(): Promise<{ user: any; error: any }> {
    try {
      const state = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(),
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      const codeChallenge = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(),
        { encoding: Crypto.CryptoEncoding.BASE64 }
      );

      const request = new AuthRequest({
        clientId: googleConfig.clientId,
        scopes: googleConfig.scopes,
        redirectUri: googleConfig.redirectUri,
        responseType: ResponseType.Code,
        state,
        codeChallenge,
        codeChallengeMethod: CodeChallengeMethod.S256,
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      if (result?.type === 'success' && result.params?.code) {
        // Exchange code for session using Supabase
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: googleConfig.redirectUri,
            queryParams: {
              code: result.params.code,
            },
          }
        });

        if (error) throw error;

        // Note: OAuth flow will complete through redirect, 
        // user session will be available through auth state change
        return { user: null, error: null };
      }

      throw new Error('Google sign-in was cancelled or failed');
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      return { user: null, error };
    }
  }

  // Create comprehensive user profile for car marketplace
  private async createUserProfile(
    user: any, 
    additionalInfo: { firstName: string; lastName: string; isDealer: boolean }
  ): Promise<void> {
    const defaultPreferences: CarUserPreferences = {
      preferredBrands: [],
      budgetRange: { min: 5000, max: 100000 },
      fuelTypes: ['petrol', 'diesel', 'electric', 'hybrid'],
      bodyTypes: ['sedan', 'suv', 'hatchback', 'coupe'],
      transmissionTypes: ['automatic', 'manual'],
      location: '',
      searchRadius: 50,
      notificationSettings: {
        priceDrops: true,
        newListings: true,
        savedSearchMatches: true,
        dealerMessages: true,
      },
    };

    const profile: Omit<CarUserProfile, 'id' | 'createdAt' | 'lastLoginAt'> = {
      email: user.email,
      firstName: additionalInfo.firstName,
      lastName: additionalInfo.lastName,
      avatar: user.user_metadata?.avatar_url || '',
      phone: user.user_metadata?.phone || '',
      location: '',
      isDealer: additionalInfo.isDealer,
      dealerInfo: additionalInfo.isDealer ? {
        companyName: '',
        licenseNumber: '',
        address: '',
        website: '',
      } : undefined,
      preferences: defaultPreferences,
      stats: {
        totalViews: 0,
        savedCars: 0,
        reviewsWritten: 0,
        ...(additionalInfo.isDealer && { carsListed: 0 }),
      },
      onboardingCompleted: false,
    };

    const { error } = await supabase
      .from('car_user_profiles')
      .upsert({
        id: user.id,
        ...profile,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }

    this.userProfile = {
      id: user.id,
      ...profile,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
  }

  // Get comprehensive user profile
  async getUserProfile(userId: string): Promise<CarUserProfile | null> {
    if (this.userProfile && this.userProfile.id === userId) {
      return this.userProfile;
    }

    try {
      const { data, error } = await supabase
        .from('car_user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      this.userProfile = data;
      return data;
    } catch (error) {
      console.error('Exception fetching user profile:', error);
      return null;
    }
  }

  // Update user preferences (car-specific)
  async updateUserPreferences(userId: string, preferences: Partial<CarUserPreferences>): Promise<boolean> {
    try {
      const currentProfile = await this.getUserProfile(userId);
      if (!currentProfile) return false;

      const updatedPreferences = { ...currentProfile.preferences, ...preferences };

      const { error } = await supabase
        .from('car_user_profiles')
        .update({
          preferences: updatedPreferences,
          last_login_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      // Update cached profile
      if (this.userProfile) {
        this.userProfile.preferences = updatedPreferences;
        this.userProfile.lastLoginAt = new Date().toISOString();
      }

      return true;
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return false;
    }
  }

  // Complete onboarding process
  async completeOnboarding(
    userId: string, 
    onboardingData: {
      preferences: Partial<CarUserPreferences>;
      location?: string;
      phone?: string;
      dealerInfo?: any;
    }
  ): Promise<boolean> {
    try {
      const currentProfile = await this.getUserProfile(userId);
      if (!currentProfile) return false;

      const updatedProfile = {
        preferences: { ...currentProfile.preferences, ...onboardingData.preferences },
        location: onboardingData.location || currentProfile.location,
        phone: onboardingData.phone || currentProfile.phone,
        dealerInfo: onboardingData.dealerInfo || currentProfile.dealerInfo,
        onboarding_completed: true,
        last_login_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('car_user_profiles')
        .update(updatedProfile)
        .eq('id', userId);

      if (error) throw error;

      // Update cached profile
      if (this.userProfile) {
        this.userProfile = { ...this.userProfile, ...updatedProfile };
      }

      // Store onboarding completion locally
      await AsyncStorage.setItem('onboarding_completed', 'true');

      return true;
    } catch (error) {
      console.error('Error completing onboarding:', error);
      return false;
    }
  }

  // Track user activity (car marketplace specific)
  async trackUserActivity(userId: string, activity: 'view' | 'save' | 'review' | 'list'): Promise<void> {
    try {
      const currentProfile = await this.getUserProfile(userId);
      if (!currentProfile) return;

      const updatedStats = { ...currentProfile.stats };

      switch (activity) {
        case 'view':
          updatedStats.totalViews += 1;
          break;
        case 'save':
          updatedStats.savedCars += 1;
          break;
        case 'review':
          updatedStats.reviewsWritten += 1;
          break;
        case 'list':
          if (currentProfile.isDealer && updatedStats.carsListed !== undefined) {
            updatedStats.carsListed += 1;
          }
          break;
      }

      const { error } = await supabase
        .from('car_user_profiles')
        .update({
          stats: updatedStats,
          last_login_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      // Update cached profile
      if (this.userProfile) {
        this.userProfile.stats = updatedStats;
        this.userProfile.lastLoginAt = new Date().toISOString();
      }
    } catch (error) {
      console.error('Error tracking user activity:', error);
    }
  }

  // Get personalized car recommendations based on user preferences
  async getPersonalizedRecommendations(userId: string): Promise<any[]> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) return [];

      const { preferences } = profile;
      
      // Query cars based on user preferences
      let query = supabase
        .from('cars')
        .select('*')
        .gte('price', preferences.budgetRange.min)
        .lte('price', preferences.budgetRange.max);

      if (preferences.preferredBrands.length > 0) {
        query = query.in('make', preferences.preferredBrands);
      }

      if (preferences.fuelTypes.length > 0) {
        query = query.in('fuel_type', preferences.fuelTypes);
      }

      // Add location-based filtering if available
      if (profile.location && preferences.searchRadius > 0) {
        // This would require PostGIS extension in Supabase for geographical queries
        // For now, we'll implement a simple location filter
      }

      const { data, error } = await query.limit(20);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return [];
    }
  }

  // Clear user data on logout
  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
      this.userProfile = null;
      await AsyncStorage.multiRemove([
        'onboarding_completed',
        'user_preferences',
        'saved_searches',
      ]);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  // Check if user needs onboarding
  async needsOnboarding(userId: string): Promise<boolean> {
    const localOnboarding = await AsyncStorage.getItem('onboarding_completed');
    if (localOnboarding === 'true') return false;

    const profile = await this.getUserProfile(userId);
    return !profile?.onboardingCompleted;
  }

  // Get supported authentication providers
  static getSupportedProviders(): { id: AuthProvider; name: string; icon: string; available: boolean }[] {
    return [
      {
        id: 'email',
        name: 'Email & Password',
        icon: '📧',
        available: true,
      },
      {
        id: 'google',
        name: 'Continue with Google',
        icon: '🔍',
        available: true,
      },
      {
        id: 'apple',
        name: 'Sign in with Apple',
        icon: '🍎',
        available: Platform.OS === 'ios',
      },
      {
        id: 'facebook',
        name: 'Continue with Facebook',
        icon: '📘',
        available: false, // To be implemented
      },
    ];
  }
}

// Export singleton instance
export const enhancedAuthService = EnhancedAuthService.getInstance();
