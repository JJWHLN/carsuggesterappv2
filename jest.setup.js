import 'react-native-gesture-handler/jestSetup';

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
  Calendar: 'Calendar',
  Fuel: 'Fuel',
  Info: 'Info',
  ArrowRight: 'ArrowRight',
  Gauge: 'Gauge',
  Verified: 'Verified',
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
  const React = require('react');
  const { View } = require('react-native');
  
  const MockAnimatedView = React.forwardRef((props, ref) => React.createElement(View, { ...props, ref }));
  MockAnimatedView.displayName = 'Animated.View';

  return {
    __esModule: true,
    default: {
      call: () => {},
      Value: jest.fn(() => ({ setValue: jest.fn() })),
      event: jest.fn(() => jest.fn()),
      add: jest.fn(),
      eq: jest.fn(),
      set: jest.fn(),
      cond: jest.fn(),
      interpolate: jest.fn(),
      View: MockAnimatedView,
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
    View: MockAnimatedView,
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

// Mock react-native-fast-image
jest.mock('react-native-fast-image', () => ({
  __esModule: true,
  default: 'FastImage',
  ResizeMode: {
    contain: 'contain',
    cover: 'cover',
    stretch: 'stretch',
    center: 'center',
  },
  Priority: {
    low: 'low',
    normal: 'normal',
    high: 'high',
  },
  CacheControl: {
    immutable: 'immutable',
    web: 'web',
    cacheOnly: 'cacheOnly',
  },
}));

// Mock react-native-skeleton-placeholder
jest.mock('react-native-skeleton-placeholder', () => ({
  __esModule: true,
  default: ({ children }) => children,
}));

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

// Mock supabase client with comprehensive auth support
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ 
        data: { session: null }, 
        error: null 
      })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      })),
      signInWithPassword: jest.fn(() => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: null 
      })),
      signUp: jest.fn(() => Promise.resolve({ 
        data: { user: null, session: null }, 
        error: null 
      })),
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      resetPasswordForEmail: jest.fn(() => Promise.resolve({ error: null })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: null, error: null })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      update: jest.fn(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn(() => Promise.resolve({ data: null, error: null })),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
    })),
  },
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

// Mock theme hooks
jest.mock('@/hooks/useTheme', () => ({
  useTheme: jest.fn(() => ({
    theme: 'light',
    colorScheme: 'light',
    colors: {
      primary: '#007AFF',
      background: '#FFFFFF',
      text: '#000000',
    },
    setTheme: jest.fn(),
    isDark: false,
  })),
  useColorScheme: jest.fn(() => 'light'),
  useThemeColors: jest.fn(() => ({
    theme: 'light',
    colorScheme: 'light',
    colors: {
      primary: '#007AFF',
      background: '#FFFFFF',
      text: '#000000',
    },
    setTheme: jest.fn(),
    isDark: false,
  })),
}));

// Mock other services only for integration tests - not unit tests
// Service tests will handle their own mocking

// Mock React Native modules that might be missing
jest.mock('react-native', () => {
  return {
    Alert: {
      alert: jest.fn(),
      prompt: jest.fn(),
    },
    Platform: {
      OS: 'ios',
      select: jest.fn((obj) => obj.ios || obj.default),
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
      addEventListener: jest.fn(() => ({ remove: jest.fn() })),
      removeEventListener: jest.fn(),
      announceForAccessibility: jest.fn(),
    },
    Settings: {
      get: jest.fn(),
      set: jest.fn(),
      watchKeys: jest.fn(),
      clearWatch: jest.fn(),
    },
    StyleSheet: {
      create: jest.fn((styles) => styles),
      flatten: jest.fn((styles) => styles),
      compose: jest.fn((style1, style2) => [style1, style2]),
      setStyleAttributePreprocessor: jest.fn(),
      hairlineWidth: 1,
      absoluteFill: {},
      absoluteFillObject: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
      },
    },
    Text: 'Text',
    View: 'View',
    ScrollView: 'ScrollView',
    TouchableOpacity: 'TouchableOpacity',
    Pressable: 'Pressable',
    TextInput: 'TextInput',
    Image: 'Image',
    FlatList: 'FlatList',
    RefreshControl: 'RefreshControl',
    ActivityIndicator: 'ActivityIndicator',
    Modal: 'Modal',
    StatusBar: 'StatusBar',
    SafeAreaView: 'SafeAreaView',
    KeyboardAvoidingView: 'KeyboardAvoidingView',
    Keyboard: {
      addListener: jest.fn(() => ({ remove: jest.fn() })),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
      dismiss: jest.fn(),
    },
    Animated: {
      Value: jest.fn(() => ({
        setValue: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        removeAllListeners: jest.fn(),
        hasListeners: jest.fn(() => false),
        interpolate: jest.fn(() => ({ setValue: jest.fn() })),
      })),
      timing: jest.fn(() => ({ start: jest.fn() })),
      spring: jest.fn(() => ({ start: jest.fn() })),
      decay: jest.fn(() => ({ start: jest.fn() })),
      sequence: jest.fn(() => ({ start: jest.fn() })),
      parallel: jest.fn(() => ({ start: jest.fn() })),
      stagger: jest.fn(() => ({ start: jest.fn() })),
      loop: jest.fn(() => ({ start: jest.fn() })),
      createAnimatedComponent: jest.fn((Component) => Component),
      View: 'Animated.View',
      Text: 'Animated.Text',
      ScrollView: 'Animated.ScrollView',
      Image: 'Animated.Image',
      FlatList: 'Animated.FlatList',
    },
    Easing: {
      linear: jest.fn(),
      ease: jest.fn(),
      quad: jest.fn(),
      cubic: jest.fn(),
      poly: jest.fn(),
      sin: jest.fn(),
      circle: jest.fn(),
      exp: jest.fn(),
      elastic: jest.fn(),
      back: jest.fn(),
      bounce: jest.fn(),
      bezier: jest.fn(),
      in: jest.fn(),
      out: jest.fn(),
      inOut: jest.fn(),
    },
    PanResponder: {
      create: jest.fn(() => ({
        panHandlers: {},
      })),
    },
    findNodeHandle: jest.fn(),
    NativeModules: {},
    NativeEventEmitter: jest.fn(() => ({
      addListener: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
    })),
    DeviceEventEmitter: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
      removeAllListeners: jest.fn(),
    },
    InteractionManager: {
      runAfterInteractions: jest.fn((callback) => callback()),
      createInteractionHandle: jest.fn(),
      clearInteractionHandle: jest.fn(),
    },
    PixelRatio: {
      get: jest.fn(() => 2),
      getFontScale: jest.fn(() => 1),
      getPixelSizeForLayoutSize: jest.fn((size) => size * 2),
      roundToNearestPixel: jest.fn((size) => size),
    },
    useColorScheme: jest.fn(() => 'light'),
    useWindowDimensions: jest.fn(() => ({ width: 390, height: 844, scale: 2, fontScale: 1 })),
  };
});

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
}));

// Mock analytics hooks with proper function mocks
jest.mock('@/hooks/useAnalytics', () => {
  const mockTracker = {
    trackUserInteraction: jest.fn(),
    trackLoadingTime: jest.fn(),
    stopTracking: jest.fn(),
    renderCount: 0,
  };
  
  const mockApiTracker = {
    trackApiCall: jest.fn((endpoint, apiCall) => apiCall()),
  };
  
  const mockSearchTracker = {
    trackSearch: jest.fn(),
    trackSearchError: jest.fn(),
    trackSearchPerformance: jest.fn(),
  };
  
  const mockNavigationTracker = {
    trackScreenView: jest.fn(),
    trackNavigation: jest.fn(),
  };
  
  const mockEngagementTracker = {
    trackInteraction: jest.fn(),
  };

  return {
    __esModule: true,
    usePerformanceTracking: jest.fn(() => mockTracker),
    useApiPerformanceTracking: jest.fn(() => mockApiTracker),
    useSearchTracking: jest.fn(() => mockSearchTracker),
    useNavigationTracking: jest.fn(() => mockNavigationTracker),
    useMemoryTracking: jest.fn(() => {}),
    useEngagementTracking: jest.fn(() => mockEngagementTracker),
  };
});

