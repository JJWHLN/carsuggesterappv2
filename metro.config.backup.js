const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Phase 2 Performance Optimizations
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Enhanced resolver for better tree-shaking
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];
config.resolver.sourceExts = [...config.resolver.sourceExts, 'mjs', 'jsx', 'js', 'ts', 'tsx'];

// Exclude heavy dependencies from production bundle when possible
if (process.env.NODE_ENV === 'production') {
  console.log('🚀 Metro: Phase 4 advanced production optimizations loading...');
  
  // Comprehensive blockList for maximum bundle reduction
  config.resolver.blockList = [
    // Development tools (16-20MB potential savings)
    /node_modules\/react-devtools-core/,
    /node_modules\/detox/,
    /node_modules\/@types\//,
    /node_modules\/jest/,
    /node_modules\/eslint/,
    /node_modules\/typescript(?!\/lib)/,
    /node_modules\/@expo\/cli/,
    /node_modules\/@expo\/config-plugins/,
    
    // Build tools that shouldn't be in production
    /node_modules\/sucrase/,
    /node_modules\/ts-node/,
    /node_modules\/react-test-renderer/,
    /node_modules\/@babel\/standalone/,
    
    // Platform-specific exclusions for native builds
    ...(process.env.EXPO_PLATFORM !== 'web' ? [
      /node_modules\/web-streams-polyfill/,
      /node_modules\/lightningcss-win32/
    ] : []),
    
    // Babel dev plugins (5-8MB potential savings)  
    /node_modules\/@babel\/plugin-(?!proposal-class-properties|proposal-object-rest-spread|transform-runtime)/,
    /node_modules\/@babel\/preset-(?!env|react|typescript)/
  ];
  
  // Enhanced transformer for maximum production optimization
  config.transformer = {
    ...config.transformer,
    minifierConfig: {
      mangle: {
        keep_fnames: false,
        keep_classnames: false,
        reserved: ['$', 'exports', 'require', 'module']
      },
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn', 'console.info', 'console.debug'],
        dead_code: true,
        unused: true,
        passes: 2, // Multiple passes for better optimization
        global_defs: {
          __DEV__: false
        }
      },
      output: {
        comments: false,
        ascii_only: true
      },
    },
    experimentalImportSupport: true,
    unstable_allowRequireContext: true,
  };
  
  console.log('✅ Metro: Advanced optimizations enabled');
  console.log('📦 Blocked dev tools, enhanced minification, tree-shaking activated');
} else {
  // Development optimizations
  config.transformer = {
    ...config.transformer,
    minifierConfig: {
      keep_fnames: false,
      mangle: {
        keep_fnames: false,
      },
    },
  };
}

module.exports = config;
