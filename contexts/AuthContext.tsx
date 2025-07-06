import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  role: string | null;
  loading: boolean;
  isNewUser: boolean;
  signInWithPassword: (email: string, password: string) => Promise<any>;
  signUpWithPassword: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<any>;
  markOnboardingComplete: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  const fetchUserRole = async (userId: string): Promise<{ role: string | null; isNew: boolean }> => {
    try {
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

  const signUpWithPassword = async (email: string, password: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
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
    role,
    loading,
    isNewUser,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    resetPasswordForEmail,
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