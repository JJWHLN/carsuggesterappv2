import 'react-native-gesture-handler/jestSetup';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo-router
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  Stack: {
    Screen: () => null,
  },
  Tabs: {
    Screen: () => null,
  },
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null } })),
      signInWithPassword: jest.fn(() => Promise.resolve({ data: { session: null, user: null }, error: null })),
      signUp: jest.fn(() => Promise.resolve({ data: { session: null, user: null }, error: null })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      resetPasswordForEmail: jest.fn(() => Promise.resolve({ data: null, error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            range: jest.fn(() => Promise.resolve({ data: [], error: null })),
          })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: [], error: null })),
      update: jest.fn(() => Promise.resolve({ data: [], error: null })),
      delete: jest.fn(() => Promise.resolve({ data: [], error: null })),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: { path: 'test-path' }, error: null })),
        remove: jest.fn(() => Promise.resolve({ data: [], error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'test-url' } })),
      })),
    },
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(() => Promise.resolve({ status: 'SUBSCRIBED' })),
      })),
      unsubscribe: jest.fn(() => Promise.resolve({ status: 'CLOSED' })),
    })),
  },
}));

// Mock analytics hooks
jest.mock('@/hooks/useAnalytics', () => ({
  usePerformanceTracking: jest.fn(() => ({
    trackUserInteraction: jest.fn(),
    trackLoadingTime: jest.fn(),
    stopTracking: jest.fn(),
    renderCount: 0,
  })),
  useEngagementTracking: jest.fn(() => ({
    trackInteraction: jest.fn(),
  })),
  useSearchTracking: jest.fn(() => ({
    trackSearch: jest.fn(),
    trackSearchError: jest.fn(),
    trackSearchPerformance: jest.fn(),
  })),
  useNavigationTracking: jest.fn(() => ({
    trackScreenView: jest.fn(),
    trackNavigation: jest.fn(),
  })),
  useApiPerformanceTracking: jest.fn(() => ({
    trackApiCall: jest.fn(),
  })),
  useMemoryTracking: jest.fn(),
}));

// Mock analytics service
jest.mock('@/services/analyticsService', () => ({
  Analytics: {
    track: jest.fn(),
    trackScreenView: jest.fn(),
    trackUserAction: jest.fn(),
    trackError: jest.fn(),
    trackPerformance: jest.fn(),
    trackApiCall: jest.fn(),
    trackSearch: jest.fn(),
    trackLoadingTime: jest.fn(),
    setUserId: jest.fn(),
    identify: jest.fn(),
  },
}));

// Mock other services only for integration tests - not unit tests
// Service tests will handle their own mocking

// Mock React Native modules that might be missing
jest.mock('react-native', () => {
  return {
    AccessibilityInfo: {
      isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
      isReduceMotionEnabled: jest.fn(() => Promise.resolve(false)),
      isReduceTransparencyEnabled: jest.fn(() => Promise.resolve(false)),
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
      announceForAccessibility: jest.fn(),
    },
    Settings: {
      get: jest.fn(),
      set: jest.fn(),
    },
    Platform: {
      OS: 'ios',
      select: jest.fn((options) => options.ios || options.default),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 375, height: 667 })),
      addEventListener: jest.fn(),
    },
    StyleSheet: {
      create: jest.fn((styles) => styles),
      flatten: jest.fn((styles) => styles),
    },
    Text: 'Text',
    View: 'View',
    ScrollView: 'ScrollView',
    TouchableOpacity: 'TouchableOpacity',
    TextInput: 'TextInput',
    Image: 'Image',
    FlatList: 'FlatList',
    RefreshControl: 'RefreshControl',
  };
});