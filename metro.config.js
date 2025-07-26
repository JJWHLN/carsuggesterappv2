
/**
 * ⚡ Production-Optimized Metro Configuration
 * Advanced bundle optimization for React Native
 */

const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  // ===== RESOLVER OPTIMIZATIONS =====
  config.resolver.platforms = ['native', 'android', 'ios'];
  config.resolver.alias = {
    '@': __dirname,
    '@components': __dirname + '/src/components',
    '@features': __dirname + '/src/features',
    '@hooks': __dirname + '/src/hooks',
    '@services': __dirname + '/src/services',
    '@store': __dirname + '/src/store',
    '@utils': __dirname + '/src/utils',
    '@types': __dirname + '/src/types',
  };

  // Exclude unused React Native modules (tree-shaking)
  config.resolver.blacklistRE = /node_modules\/react-native\/.*\/(
    Animation|Art|CameraRoll|Geolocation|ImageEditor|ImageStore|
    NetInfo|PushNotification|Settings|Vibration|WebView
  )\.js$/x;

  // ===== TRANSFORMER OPTIMIZATIONS =====
  config.transformer.minifierPath = 'metro-minify-terser';
  config.transformer.minifierConfig = {
    ecma: 8,
    warnings: false,
    parse: { ecma: 8 },
    compress: {
      ecma: 8,
      warnings: false,
      comparisons: false,
      inline: 2,
      drop_console: true,  // Remove console.logs in production
      drop_debugger: true,
      pure_getters: true,
      unsafe: true,
      unsafe_comps: true,
      sequences: true,
      dead_code: true,
      evaluate: true,
      if_return: true,
      join_vars: true,
      reduce_vars: true,
      collapse_vars: true,
      unused: true,
    },
    mangle: {
      safari10: true,
      reserved: ['__DEV__', 'global', 'require'],
    },
    output: {
      ascii_only: true,
      comments: false,
      webkit: true,
    },
  };
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
