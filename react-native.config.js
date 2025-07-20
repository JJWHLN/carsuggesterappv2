
/**
 * Custom React Native Build Configuration
 * Removes unused modules for maximum bundle reduction
 */

// react-native.config.js - Custom build configuration
module.exports = {
  dependencies: {
    // Disable unused React Native modules
    '@react-native-community/art': {
      platforms: {
        android: null,
        ios: null
      }
    },
    '@react-native-community/geolocation': {
      platforms: {
        android: null,
        ios: null
      }
    },
    '@react-native-community/push-notification-ios': {
      platforms: {
        android: null,
        ios: null
      }
    }
  },
  
  // Custom native modules only
  customModules: [
    'RNCarSuggesterCore',    // Custom core module
    'RNOptimizedNetworking', // Custom networking
    'RNLightweightStorage'   // Custom storage
  ],
  
  // Remove unused React Native components
  excludeModules: [
    'Alert',
    'ActionSheetIOS', 
    'Animated.createAnimatedComponent', // Use custom animations
    'AppRegistry',
    'BackHandler',
    'CameraRoll',
    'Clipboard',
    'DatePickerIOS',
    'DeviceEventEmitter',
    'Dimensions',
    'DrawerLayoutAndroid',
    'ImageEditor',
    'ImagePickerIOS',
    'ImageStore',
    'InteractionManager',
    'Keyboard',
    'LayoutAnimation',
    'Linking',
    'NativeEventEmitter',
    'NativeModules',
    'NetInfo',
    'PanResponder',
    'PermissionsAndroid',
    'PixelRatio',
    'PushNotificationIOS',
    'Settings',
    'Share',
    'StatusBar',
    'StyleSheet',
    'Systrace',
    'TimePickerAndroid',
    'ToastAndroid',
    'Vibration',
    'VirtualizedList'
  ]
};

// Custom React Native bridge optimization
const RNOptimizations = {
  // Disable bridge for non-critical operations
  disableBridge: [
    'DeviceInfo',
    'NetworkingIOS',
    'RCTNetworking', 
    'RCTWebSocketModule',
    'RCTImageLoader'
  ],
  
  // Use lightweight native implementations
  lightweightModules: {
    networking: 'RNOptimizedNetworking',
    storage: 'RNLightweightStorage', 
    deviceInfo: 'RNBasicDeviceInfo'
  },
  
  // Bundle splitting for React Native
  splitBundles: {
    core: ['React', 'ReactNative', 'View', 'Text', 'Image'],
    ui: ['TouchableOpacity', 'ScrollView', 'FlatList'],
    navigation: ['NavigationContainer', 'Stack'],
    features: ['Search', 'Marketplace', 'Models']
  }
};
