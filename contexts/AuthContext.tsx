import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { enhancedAuthService, CarUserProfile, CarUserPreferences } from '@/services/enhancedAuthService';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  userProfile: CarUserProfile | null;
  role: string | null;
  loading: boolean;
  isNewUser: boolean;
  signInWithPassword: (email: string, password: string) => Promise<any>;
  signUpWithPassword: (email: string, password: string, firstName: string, lastName: string, isDealer?: boolean) => Promise<any>;
  signInWithApple: () => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<any>;
  updateUserPreferences: (preferences: Partial<CarUserPreferences>) => Promise<boolean>;
  completeOnboarding: (onboardingData: any) => Promise<boolean>;
  trackUserActivity: (activity: 'view' | 'save' | 'review' | 'list') => Promise<void>;
  markOnboardingComplete: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<CarUserProfile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  const fetchUserRole = async (userId: string): Promise<{ role: string | null; isNew: boolean }> => {
    try {
      // First try to get the enhanced profile
      const profile = await enhancedAuthService.getUserProfile(userId);
      if (profile) {
        setUserProfile(profile);
        return { 
          role: profile.isDealer ? 'dealer' : 'user', 
          isNew: !profile.onboardingCompleted 
        };
      }

      // Fallback to basic profile check
      const { data, error, status } = await supabase
        .from('profiles')
        .select('role, onboarding_completed')
        .eq('id', userId)
        .single();

      if (error && status !== 406) {
        console.error('Error fetching user role:', error);
        return { role: 'user', isNew: true };
      }
      
      const userRole = data?.role || 'user';
      const hasCompletedOnboarding = data?.onboarding_completed || false;
      
      return { role: userRole, isNew: !hasCompletedOnboarding };
    } catch (error) {
      console.error('Exception fetching user role:', error);
      return { role: 'user', isNew: true };
    }
  };

  const signUpWithPassword = async (
    email: string, 
    password: string, 
    firstName: string, 
    lastName: string, 
    isDealer: boolean = false
  ) => {
    return await enhancedAuthService.signUpWithEmail(email, password, firstName, lastName, isDealer);
  };

  const signInWithApple = async () => {
    return await enhancedAuthService.signInWithApple();
  };

  const signInWithGoogle = async () => {
    return await enhancedAuthService.signInWithGoogle();
  };

  const updateUserPreferences = async (preferences: Partial<CarUserPreferences>) => {
    if (!user) return false;
    const success = await enhancedAuthService.updateUserPreferences(user.id, preferences);
    if (success) {
      // Refresh user profile
      const updatedProfile = await enhancedAuthService.getUserProfile(user.id);
      setUserProfile(updatedProfile);
    }
    return success;
  };

  const completeOnboarding = async (onboardingData: any) => {
    if (!user) return false;
    const success = await enhancedAuthService.completeOnboarding(user.id, onboardingData);
    if (success) {
      setIsNewUser(false);
      // Refresh user profile
      const updatedProfile = await enhancedAuthService.getUserProfile(user.id);
      setUserProfile(updatedProfile);
    }
    return success;
  };

  const trackUserActivity = async (activity: 'view' | 'save' | 'review' | 'list') => {
    if (!user) return;
    await enhancedAuthService.trackUserActivity(user.id, activity);
    // Optionally refresh profile to update stats
    const updatedProfile = await enhancedAuthService.getUserProfile(user.id);
    if (updatedProfile) {
      setUserProfile(updatedProfile);
    }
  };

  const markOnboardingComplete = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('profiles')
        .upsert({ 
          id: user.id, 
          onboarding_completed: true,
          role: role || 'user'
        });
      setIsNewUser(false);
    } catch (error) {
      console.error('Error marking onboarding complete:', error);
    }
  };

  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const { role: userRole, isNew } = await fetchUserRole(currentUser.id);
        setRole(userRole);
        setIsNewUser(isNew);
      } else {
        setRole(null);
        setIsNewUser(false);
      }
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession);
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          setLoading(true);
          const { role: userRole, isNew } = await fetchUserRole(currentUser.id);
          setRole(userRole);
          setIsNewUser(isNew);
          setLoading(false);
        } else {
          setRole(null);
          setIsNewUser(false);
          setLoading(false);
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    setLoading(true);
    await enhancedAuthService.logout();
    setUser(null);
    setUserProfile(null);
    setRole(null);
    setIsNewUser(false);
    setLoading(false);
  };

  const resetPasswordForEmail = async (email: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) throw error;
    return data;
  };

  const value = {
    session,
    user,
    userProfile,
    role,
    loading,
    isNewUser,
    signInWithPassword,
    signUpWithPassword,
    signInWithApple,
    signInWithGoogle,
    signOut,
    resetPasswordForEmail,
    updateUserPreferences,
    completeOnboarding,
    trackUserActivity,
    markOnboardingComplete,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};