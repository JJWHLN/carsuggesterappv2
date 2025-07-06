import 'react-native-gesture-handler/jestSetup';

// Mock React Native Alert
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  return {
    ...RN,
    Alert: {
      alert: jest.fn(),
      prompt: jest.fn(),
    },
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios),
    },
    Dimensions: {
      get: jest.fn(() => ({ width: 390, height: 844 })),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
    Appearance: {
      getColorScheme: jest.fn(() => 'light'),
      addChangeListener: jest.fn(),
      removeChangeListener: jest.fn(),
    },
    AccessibilityInfo: {
      isScreenReaderEnabled: jest.fn().mockResolvedValue(false),
      isReduceMotionEnabled: jest.fn().mockResolvedValue(false),
      isReduceTransparencyEnabled: jest.fn().mockResolvedValue(false),
      isBoldTextEnabled: jest.fn().mockResolvedValue(false),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    },
  };
});

// Mock Expo modules
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {},
  },
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => ({
  Svg: 'Svg',
  Path: 'Path',
  Circle: 'Circle',
  Rect: 'Rect',
  G: 'G',
  Text: 'Text',
  Defs: 'Defs',
  LinearGradient: 'LinearGradient',
  Stop: 'Stop',
  Mixin: {},
}));

// Mock lucide-react-native icons
jest.mock('lucide-react-native', () => ({
  Search: 'Search',
  Filter: 'Filter',
  MapPin: 'MapPin',
  DollarSign: 'DollarSign',
  Car: 'Car',
  TrendingUp: 'TrendingUp',
  Users: 'Users',
  Shield: 'Shield',
  Star: 'Star',
  Building2: 'Building2',
  Award: 'Award',
  Clock: 'Clock',
  ChevronRight: 'ChevronRight',
  Phone: 'Phone',
  Mail: 'Mail',
  ExternalLink: 'ExternalLink',
  Grid2x2: 'Grid2x2',
  List: 'List',
  CircleAlert: 'CircleAlert',
  X: 'X',
  Sparkles: 'Sparkles',
  Camera: 'Camera',
  Plus: 'Plus',
  Eye: 'Eye',
  EyeOff: 'EyeOff',
  ChevronDown: 'ChevronDown',
  Upload: 'Upload',
  Image: 'Image',
  CalendarDays: 'CalendarDays',
  Settings: 'Settings',
  User: 'User',
  Home: 'Home',
  Heart: 'Heart',
  MessageSquare: 'MessageSquare',
  Bookmark: 'Bookmark',
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  SafeAreaProvider: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
}));

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  return {
    default: {
      call: () => {},
      Value: jest.fn(() => ({ setValue: jest.fn() })),
      event: jest.fn(() => jest.fn()),
      add: jest.fn(),
      eq: jest.fn(),
      set: jest.fn(),
      cond: jest.fn(),
      interpolate: jest.fn(),
      View: jest.fn(),
      Extrapolate: { CLAMP: 'clamp' },
      Transition: { Together: 'together' },
      Easing: { in: jest.fn(), out: jest.fn(), inOut: jest.fn() },
      runOnJS: jest.fn((fn) => fn),
      useSharedValue: jest.fn(() => ({ value: 0 })),
      useAnimatedStyle: jest.fn(() => ({})),
      useDerivedValue: jest.fn(),
      useAnimatedGestureHandler: jest.fn(),
      useAnimatedProps: jest.fn(),
      interpolateColor: jest.fn(),
      createAnimatedComponent: jest.fn((Component) => Component),
      withTiming: jest.fn((value) => value),
      withSpring: jest.fn((value) => value),
      withSequence: jest.fn((...values) => values[values.length - 1]),
      withRepeat: jest.fn((value) => value),
      cancelAnimation: jest.fn(),
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    useDerivedValue: jest.fn(),
    useAnimatedGestureHandler: jest.fn(),
    useAnimatedProps: jest.fn(),
    interpolateColor: jest.fn(),
    createAnimatedComponent: jest.fn((Component) => Component),
    withTiming: jest.fn((value) => value),
    withSpring: jest.fn((value) => value),
    withSequence: jest.fn((...values) => values[values.length - 1]),
    withRepeat: jest.fn((value) => value),
    cancelAnimation: jest.fn(),
    runOnJS: jest.fn((fn) => fn),
    Easing: { 
      in: jest.fn(), 
      out: jest.fn((fn) => fn), 
      inOut: jest.fn(),
      ease: jest.fn(),
    },
  };
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