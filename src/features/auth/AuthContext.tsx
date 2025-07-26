import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  User,
  AuthState,
  AuthActions,
  LoginCredentials,
  SignupData,
  UserPreferences,
  SavedSearch,
  FavoriteCar,
  RecentlyViewed,
  ComparisonHistory,
  SocialLoginProvider,
} from './types';
import { Car } from '../recommendations/types';

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | {
      type: 'SET_TOKENS';
      payload: { accessToken: string | null; refreshToken: string | null };
    }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  tokens: {
    accessToken: null,
    refreshToken: null,
  },
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };

    case 'SET_TOKENS':
      return {
        ...state,
        tokens: action.payload,
      };

    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };

    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        user: state.user
          ? {
              ...state.user,
              preferences: { ...state.user.preferences, ...action.payload },
            }
          : null,
      };

    default:
      return state;
  }
}

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER_DATA: 'auth_user_data',
  REMEMBER_ME: 'auth_remember_me',
};

// Rate limiting store
const rateLimitStore = new Map<
  string,
  { attempts: number; lastAttempt: Date; blockUntil?: Date }
>();

const AuthContext = createContext<{
  state: AuthState;
  actions: AuthActions;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from storage
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      const [accessToken, refreshToken, userData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.getItem(STORAGE_KEYS.USER_DATA),
      ]);

      if (accessToken && refreshToken && userData) {
        const user = JSON.parse(userData);
        dispatch({
          type: 'SET_TOKENS',
          payload: { accessToken, refreshToken },
        });
        dispatch({ type: 'SET_USER', payload: user });

        // Validate token and refresh if needed
        await validateAndRefreshToken();
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const validateAndRefreshToken = async () => {
    try {
      // In a real app, this would make an API call to validate the token
      // For now, we'll simulate token validation
      const isValid = await simulateTokenValidation(state.tokens.accessToken);

      if (!isValid) {
        await refreshAuth();
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      await logout();
    }
  };

  // Rate limiting helper
  const checkRateLimit = (
    key: string,
    maxAttempts: number = 5,
    windowMs: number = 15 * 60 * 1000,
  ): boolean => {
    const now = new Date();
    const limit = rateLimitStore.get(key);

    if (limit) {
      if (limit.blockUntil && now < limit.blockUntil) {
        throw new Error('Too many attempts. Please try again later.');
      }

      const timeSinceLastAttempt = now.getTime() - limit.lastAttempt.getTime();

      if (timeSinceLastAttempt < windowMs) {
        if (limit.attempts >= maxAttempts) {
          const blockUntil = new Date(now.getTime() + windowMs);
          rateLimitStore.set(key, { ...limit, blockUntil });
          throw new Error('Too many attempts. Please try again later.');
        }

        rateLimitStore.set(key, {
          attempts: limit.attempts + 1,
          lastAttempt: now,
        });
      } else {
        // Reset counter after window expires
        rateLimitStore.set(key, { attempts: 1, lastAttempt: now });
      }
    } else {
      rateLimitStore.set(key, { attempts: 1, lastAttempt: now });
    }

    return true;
  };

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      // Rate limiting
      checkRateLimit(`login_${credentials.email}`);

      dispatch({ type: 'SET_LOADING', payload: true });

      // Simulate API call
      const response = await simulateApiCall('/auth/login', {
        method: 'POST',
        body: credentials,
      });

      const { user, tokens } = response;

      // Store tokens and user data
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user)),
        credentials.rememberMe
          ? AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true')
          : AsyncStorage.removeItem(STORAGE_KEYS.REMEMBER_ME),
      ]);

      dispatch({ type: 'SET_TOKENS', payload: tokens });
      dispatch({ type: 'SET_USER', payload: user });

      // Clear rate limit on successful login
      rateLimitStore.delete(`login_${credentials.email}`);
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const signup = async (data: SignupData): Promise<void> => {
    try {
      // Rate limiting
      checkRateLimit(`signup_${data.email}`);

      dispatch({ type: 'SET_LOADING', payload: true });

      // Simulate API call
      const response = await simulateApiCall('/auth/signup', {
        method: 'POST',
        body: data,
      });

      const { user, tokens } = response;

      // Store tokens and user data
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user)),
      ]);

      dispatch({ type: 'SET_TOKENS', payload: tokens });
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const socialLogin = async (
    provider: SocialLoginProvider['id'],
    token: string,
  ): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Simulate API call
      const response = await simulateApiCall('/auth/social', {
        method: 'POST',
        body: { provider, token },
      });

      const { user, tokens } = response;

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
        AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user)),
      ]);

      dispatch({ type: 'SET_TOKENS', payload: tokens });
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Call logout API to invalidate tokens
      if (state.tokens.accessToken) {
        await simulateApiCall('/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${state.tokens.accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear storage regardless of API call success
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN),
        AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA),
        AsyncStorage.removeItem(STORAGE_KEYS.REMEMBER_ME),
      ]);

      dispatch({ type: 'LOGOUT' });
    }
  };

  const refreshAuth = async (): Promise<void> => {
    try {
      if (!state.tokens.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await simulateApiCall('/auth/refresh', {
        method: 'POST',
        body: { refreshToken: state.tokens.refreshToken },
      });

      const { tokens } = response;

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken),
        AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken),
      ]);

      dispatch({ type: 'SET_TOKENS', payload: tokens });
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
      throw error;
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      // Rate limiting
      checkRateLimit(`reset_${email}`, 3, 5 * 60 * 1000); // 3 attempts per 5 minutes

      await simulateApiCall('/auth/reset-password', {
        method: 'POST',
        body: { email },
      });
    } catch (error) {
      throw error;
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<void> => {
    try {
      const response = await simulateApiCall('/user/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${state.tokens.accessToken}`,
        },
        body: data,
      });

      dispatch({ type: 'UPDATE_USER', payload: response.user });

      // Update stored user data
      if (state.user) {
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER_DATA,
          JSON.stringify({ ...state.user, ...response.user }),
        );
      }
    } catch (error) {
      throw error;
    }
  };

  const updatePreferences = async (
    preferences: Partial<UserPreferences>,
  ): Promise<void> => {
    try {
      const response = await simulateApiCall('/user/preferences', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${state.tokens.accessToken}`,
        },
        body: preferences,
      });

      dispatch({ type: 'UPDATE_PREFERENCES', payload: response.preferences });

      // Update stored user data
      if (state.user) {
        const updatedUser = {
          ...state.user,
          preferences: { ...state.user.preferences, ...response.preferences },
        };
        await AsyncStorage.setItem(
          STORAGE_KEYS.USER_DATA,
          JSON.stringify(updatedUser),
        );
      }
    } catch (error) {
      throw error;
    }
  };

  const addToFavorites = async (car: Car): Promise<void> => {
    try {
      await simulateApiCall('/user/favorites', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.tokens.accessToken}`,
        },
        body: { carId: car.id },
      });
    } catch (error) {
      throw error;
    }
  };

  const removeFromFavorites = async (carId: string): Promise<void> => {
    try {
      await simulateApiCall(`/user/favorites/${carId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${state.tokens.accessToken}`,
        },
      });
    } catch (error) {
      throw error;
    }
  };

  const saveSearch = async (
    search: Omit<SavedSearch, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  ): Promise<void> => {
    try {
      await simulateApiCall('/user/saved-searches', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.tokens.accessToken}`,
        },
        body: search,
      });
    } catch (error) {
      throw error;
    }
  };

  const deleteSearch = async (searchId: string): Promise<void> => {
    try {
      await simulateApiCall(`/user/saved-searches/${searchId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${state.tokens.accessToken}`,
        },
      });
    } catch (error) {
      throw error;
    }
  };

  const addToRecentlyViewed = async (
    car: Car,
    duration: number,
  ): Promise<void> => {
    try {
      await simulateApiCall('/user/recently-viewed', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.tokens.accessToken}`,
        },
        body: { carId: car.id, duration },
      });
    } catch (error) {
      console.error('Failed to add to recently viewed:', error);
      // Don't throw error for recently viewed as it's not critical
    }
  };

  const saveComparison = async (
    carIds: string[],
    name?: string,
  ): Promise<void> => {
    try {
      await simulateApiCall('/user/comparisons', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${state.tokens.accessToken}`,
        },
        body: { carIds, name },
      });
    } catch (error) {
      throw error;
    }
  };

  const actions: AuthActions = {
    login,
    signup,
    socialLogin,
    logout,
    refreshAuth,
    resetPassword,
    updateProfile,
    updatePreferences,
    addToFavorites,
    removeFromFavorites,
    saveSearch,
    deleteSearch,
    addToRecentlyViewed,
    saveComparison,
  };

  return (
    <AuthContext.Provider value={{ state, actions }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Convenience hooks
export const useUser = () => useAuth().state.user;
export const useIsAuthenticated = () => useAuth().state.isAuthenticated;

// Simulate API calls (replace with actual API calls)
async function simulateApiCall(
  endpoint: string,
  options: any = {},
): Promise<any> {
  // Simulate network delay
  await new Promise((resolve) =>
    setTimeout(resolve, 1000 + Math.random() * 1000),
  );

  // Simulate different responses based on endpoint
  if (endpoint === '/auth/login') {
    if (
      options.body.email === 'test@example.com' &&
      options.body.password === 'password'
    ) {
      return {
        user: createMockUser(options.body.email),
        tokens: {
          accessToken: 'mock_access_token_' + Date.now(),
          refreshToken: 'mock_refresh_token_' + Date.now(),
        },
      };
    } else {
      throw new Error('Invalid email or password');
    }
  }

  if (endpoint === '/auth/signup') {
    return {
      user: createMockUser(
        options.body.email,
        options.body.firstName,
        options.body.lastName,
      ),
      tokens: {
        accessToken: 'mock_access_token_' + Date.now(),
        refreshToken: 'mock_refresh_token_' + Date.now(),
      },
    };
  }

  if (endpoint === '/auth/refresh') {
    return {
      tokens: {
        accessToken: 'mock_access_token_' + Date.now(),
        refreshToken: 'mock_refresh_token_' + Date.now(),
      },
    };
  }

  // Default success response
  return { success: true };
}

async function simulateTokenValidation(token: string | null): Promise<boolean> {
  if (!token) return false;

  // Simulate token expiration (tokens expire after 1 hour for demo)
  const tokenTimestamp = token.split('_').pop();
  if (tokenTimestamp) {
    const tokenTime = parseInt(tokenTimestamp);
    const now = Date.now();
    const hourInMs = 60 * 60 * 1000;

    return now - tokenTime < hourInMs;
  }

  return false;
}

function createMockUser(
  email: string,
  firstName?: string,
  lastName?: string,
): User {
  return {
    id: 'user_' + Date.now(),
    email,
    firstName: firstName || 'John',
    lastName: lastName || 'Doe',
    isVerified: false,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    preferences: {
      budget: { min: 15000, max: 50000 },
      bodyStyles: ['Sedan', 'SUV'],
      fuelTypes: ['Gasoline', 'Hybrid'],
      makes: [],
      yearRange: { min: 2018, max: 2024 },
      mileageRange: { min: 0, max: 75000 },
      features: [],
      location: {
        city: 'Los Angeles',
        state: 'CA',
        radius: 50,
      },
      notifications: {
        email: true,
        push: true,
        priceDrops: true,
        newListings: true,
        savedSearchAlerts: true,
      },
    },
  };
}
