import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase'; // Assuming supabase client is exported from here

type AuthContextType = {
  session: Session | null;
  user: User | null;
  role: string | null; // Added role
  loading: boolean;
  isNewUser: boolean; // Added isNewUser flag
  signInWithPassword: (email: string, password: string) => Promise<any>;
  signUpWithPassword: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<any>;
  markOnboardingComplete: () => void; // Added function to mark onboarding as complete
  // Add other auth methods if needed
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null); // Added role state
  const [loading, setLoading] = useState(true); // Overall loading including role fetch
  const [isNewUser, setIsNewUser] = useState(false); // Added isNewUser state

  // Function to fetch user profile/role and determine if user is new
  // Assumes a 'user_profiles' table with 'id' (matching auth.users.id), 'role', and 'onboarding_completed' columns
  const fetchUserRole = async (userId: string): Promise<{ role: string | null; isNew: boolean }> => {
    try {
      const { data, error, status } = await supabase
        .from('user_profiles') // Or 'user_roles' if that's the table structure
        .select('role, onboarding_completed')
        .eq('id', userId)
        .single();

      if (error && status !== 406) { // 406: PostgREST error for "Requested resource not found" (when .single() finds no rows)
        console.error('Error fetching user role:', error);
        return { role: 'user', isNew: true }; // Default to new user if error
      }
      
      const userRole = data?.role || 'user';
      const hasCompletedOnboarding = data?.onboarding_completed || false;
      
      return { role: userRole, isNew: !hasCompletedOnboarding };
    } catch (error) {
      console.error('Exception fetching user role:', error);
      return { role: 'user', isNew: true }; // Default on exception
    }
  };

  const markOnboardingComplete = async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('user_profiles')
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
          setLoading(true); // Set loading true while fetching role
          const { role: userRole, isNew } = await fetchUserRole(currentUser.id);
          setRole(userRole);
          setIsNewUser(isNew);
          setLoading(false);
        } else {
          setRole(null);
          setIsNewUser(false);
          setLoading(false); // Ensure loading is false if user becomes null
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
    // Add additional user metadata or options if needed
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // options: { data: { full_name: 'Test User' } } // Example for additional data
    });
    setLoading(false);
    if (error) throw error;
    // Potentially trigger profile creation here if not handled by a DB trigger
    return data;
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    // Session and user will be set to null by onAuthStateChange
    setLoading(false);
  };

  const resetPasswordForEmail = async (email: string) => {
    setLoading(true);
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      // redirectTo: 'yourapp://reset-password-callback' // Replace with your app's deep link
    });
    setLoading(false);
    if (error) throw error;
    return data;
  };

  const value = {
    session,
    user,
    role, // Added role
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
