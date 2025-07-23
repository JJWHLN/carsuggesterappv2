import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

let SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
let SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  if (__DEV__) {
    logger.warn(
      '⚠️ Supabase URL or Anon Key is missing from environment variables. Using fallback for development (Bolt compatibility).'
    );
    SUPABASE_URL = SUPABASE_URL || 'https://jhenughcwmllbgoxrabk.supabase.co';
    SUPABASE_ANON_KEY = SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZW51Z2hjd21sbGJnb3hyYWJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0OTkwODIsImV4cCI6MjA2MzA3NTA4Mn0.6HMf8CI2NGyn31EtXEKo7NR2JqphdcZnxdM2T0_MMw0';
  } else {
    // In production, if variables are missing, it's a critical error.
    // You might throw an error or use a non-functional placeholder to prevent app crash but indicate failure.
    logger.error('⛔️ CRITICAL: Supabase URL or Anon Key is missing in production environment!');
    // To prevent app from running with fallback credentials in prod:
    // SUPABASE_URL = undefined;
    // SUPABASE_ANON_KEY = undefined;
    // Or throw new Error("Supabase environment variables are not set for production!");
    // For now, allow it to proceed with potentially undefined values, which createClient will handle by erroring.
  }
}


// Debug logging for development
if (__DEV__) {
  logger.debug('🔧 Supabase Configuration:');
  logger.debug('URL:', SUPABASE_URL);
  logger.debug('Anon Key:', SUPABASE_ANON_KEY ? '✅ Present' : '❌ MISSING');
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // This check ensures that if we are in production and variables were missing,
  // we don't proceed with createClient using undefined values if we chose not to throw an error above.
  // However, createClient itself will error if URL/key are invalid or missing.
  // For a robust app, you might replace `supabase` with a mock/dummy client that always errors.
  logger.error("⛔️ Supabase client cannot be initialized without URL and Key.");
  // A possible strategy: export a non-functional client or throw.
  // export const supabase = { auth: { /* dummy methods */ } /* ... other dummy services */ };
  // For now, let createClient attempt and fail, error will be caught by users of `supabase` object.
}

export const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Better web compatibility
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'carsuggester-mobile@1.0.0',
    },
  },
});

// Simple connection test
export async function testSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('car_models')
      .select('count')
      .limit(1);
    
    if (error) {
      logger.error('❌ Supabase connection test failed:', error.message);
      return false;
    }
    
    logger.debug('✅ Supabase connection successful');
    return true;
  } catch (error) {
    logger.error('❌ Supabase connection error:', error);
    return false;
  }
}

// Auth helpers
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logger.error('Error getting session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    logger.error('Session error:', error);
    return null;
  }
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback);
}