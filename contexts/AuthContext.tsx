import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase'; // Assuming supabase client is exported from here

type AuthContextType = {
  session: Session | null;
  user: User | null;
  role: string | null; // Added role
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<any>;
  signUpWithPassword: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<any>;
  // Add other auth methods if needed
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null); // Added role state
  const [loading, setLoading] = useState(true); // Overall loading including role fetch

  // Function to fetch user profile/role
  // Assumes a 'user_profiles' table with 'id' (matching auth.users.id) and 'role' columns
  const fetchUserRole = async (userId: string): Promise<string | null> => {
    try {
      const { data, error, status } = await supabase
        .from('user_profiles') // Or 'user_roles' if that's the table structure
        .select('role')
        .eq('id', userId)
        .single();

      if (error && status !== 406) { // 406: PostgREST error for "Requested resource not found" (when .single() finds no rows)
        console.error('Error fetching user role:', error);
        return null;
      }
      return data?.role || 'user'; // Default to 'user' if no role found or profile missing
    } catch (error) {
      console.error('Exception fetching user role:', error);
      return 'user'; // Default on exception
    }
  };

  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        const userRole = await fetchUserRole(currentUser.id);
        setRole(userRole);
      } else {
        setRole(null);
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
          const userRole = await fetchUserRole(currentUser.id);
          setRole(userRole);
          setLoading(false);
        } else {
          setRole(null);
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
    signInWithPassword,
    signUpWithPassword,
    signOut,
    resetPasswordForEmail,
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
