
/**
 * React Native Core Optimization
 * Custom build configuration for maximum bundle reduction
 */

// metro.config.js - Enhanced for React Native optimization
const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // Advanced React Native tree-shaking
  config.resolver.platforms = ['native', 'android', 'ios'];
  
  // Exclude unused React Native components
  config.resolver.blacklistRE = /node_modules/react-native/.*/(Animation|Art|CameraRoll|Geolocation|ImageEditor|ImageStore|NetInfo|PushNotification|Settings|Vibration).js$/;
  
  // Platform-specific optimizations
  config.transformer.babelTransformerPath = require.resolve('./scripts/babel-transformer-optimized.js');
  
  // Advanced minification for React Native
  config.transformer.minifierConfig = {
    ecma: 8,
    warnings: false,
    parse: { ecma: 8 },
    compress: {
      ecma: 8,
      warnings: false,
      comparisons: false,
      inline: 2,
      drop_console: true,
      drop_debugger: true,
      pure_getters: true,
      unsafe: true,
      unsafe_comps: true,
      unsafe_math: true,
      unsafe_symbols: true,
      unsafe_methods: true,
      unsafe_proto: true,
      unsafe_regexp: true,
      conditionals: true,
      unused: true,
      dead_code: true,
      evaluate: true,
      if_return: true,
      join_vars: true,
      reduce_vars: true,
      collapse_vars: true,
      negate_iife: true,
      pure_funcs: [
        'console.log',
        'console.info', 
        'console.debug',
        'console.warn'
      ]
    },
    mangle: {
      safari10: true
    },
    output: {
      ecma: 8,
      comments: false,
      ascii_only: true
    }
  };

  return config;
})();
