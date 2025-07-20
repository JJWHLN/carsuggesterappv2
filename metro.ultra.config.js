
/**
 * Ultra-Aggressive Metro Configuration
 * Maximum bundle optimization and code elimination
 */

const { getDefaultConfig } = require('expo/metro-config');
const fs = require('fs');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Ultra-aggressive tree shaking
  config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
  config.resolver.hasteImplModulePath = require.resolve('./scripts/ultra-haste-map.js');
  
  // Exclude entire unused modules at bundler level
  config.resolver.blockList = [
    /node_modules/react-native/.*/(Libraries/Alert|Libraries/ActionSheetIOS|Libraries/Animated/src/createAnimatedComponent|Libraries/AppRegistry|Libraries/BackHandler|Libraries/CameraRoll|Libraries/Clipboard|Libraries/Components/DatePickerIOS|Libraries/Components/DrawerLayoutAndroid|Libraries/Components/ImageEditor|Libraries/Components/ImagePickerIOS|Libraries/Components/ImageStore|Libraries/EventEmitter|Libraries/Geolocation|Libraries/Image/ImageEditor|Libraries/Image/ImagePickerIOS|Libraries/Image/ImageStore|Libraries/InteractionManager|Libraries/Keyboard|Libraries/LayoutAnimation|Libraries/Linking|Libraries/Modal|Libraries/NativeAnimation|Libraries/Network|Libraries/PanResponder|Libraries/PermissionsAndroid|Libraries/PushNotificationIOS|Libraries/Settings|Libraries/Share|Libraries/StatusBar|Libraries/Systrace|Libraries/Text/TextInput|Libraries/TimePickerAndroid|Libraries/ToastAndroid|Libraries/Utilities|Libraries/Vibration|Libraries/VirtualizedList).js$/,
    /node_modules/@react-native-community/(art|geolocation|push-notification-ios)/,
    /node_modules/react-native-vector-icons/(?!Ionicons)/,
    /node_modules/lodash/(?!pick|get|set|has|merge).js$/,
    /node_modules/moment/locale/,
    /node_modules/date-fns/(?!format|parseISO|isValid)/,
  ];

  // Ultra-aggressive transformer
  config.transformer.babelTransformerPath = require.resolve('./scripts/ultra-babel-transformer.js');
  
  // Maximum compression
  config.transformer.minifierConfig = {
    ecma: 8,
    parse: { ecma: 8 },
    compress: {
      arguments: true,
      booleans_as_integers: true,
      collapse_vars: true,
      comparisons: true,
      computed_props: true,
      conditionals: true,
      dead_code: true,
      directives: true,
      drop_console: true,
      drop_debugger: true,
      evaluate: true,
      expression: true,
      hoist_funs: true,
      hoist_props: true,
      hoist_vars: true,
      if_return: true,
      inline: 3,
      join_vars: true,
      keep_fargs: false,
      loops: true,
      negate_iife: true,
      properties: true,
      pure_getters: true,
      pure_funcs: [
        'console.log', 'console.info', 'console.debug', 'console.warn', 'console.error',
        'invariant', '__DEV__', 'performance.mark', 'performance.measure'
      ],
      reduce_funcs: true,
      reduce_vars: true,
      sequences: true,
      side_effects: true,
      switches: true,
      top_retain: false,
      typeofs: true,
      unsafe: true,
      unsafe_arrows: true,
      unsafe_comps: true,
      unsafe_Function: true,
      unsafe_math: true,
      unsafe_symbols: true,
      unsafe_methods: true,
      unsafe_proto: true,
      unsafe_regexp: true,
      unsafe_undefined: true,
      unused: true
    },
    mangle: {
      eval: true,
      keep_fnames: false,
      reserved: [],
      toplevel: true,
      safari10: true
    },
    output: {
      ascii_only: true,
      beautify: false,
      comments: false,
      ecma: 8
    }
  };

  // Bundle splitting configuration
  config.serializer.createModuleIdFactory = () => {
    let nextId = 0;
    const moduleIdMap = new Map();
    
    return (path) => {
      if (moduleIdMap.has(path)) {
        return moduleIdMap.get(path);
      }
      
      const id = nextId++;
      moduleIdMap.set(path, id);
      return id;
    };
  };

  // Ultra-aggressive asset optimization
  config.transformer.assetRegistryPath = require.resolve('./scripts/ultra-asset-registry.js');
  
  return config;
})();
