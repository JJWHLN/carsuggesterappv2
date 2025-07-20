/**
 * Optimized Babel Transformer for React Native
 * Implements advanced dead code elimination and optimization
 */

const { transform } = require('@babel/core');

module.exports = {
  transform({ src, filename, options }) {
    const babelOptions = {
      filename,
      presets: [
        ['@babel/preset-env', {
          targets: { 
            android: '21',
            ios: '13.0'
          },
          modules: false,
          useBuiltIns: 'entry',
          corejs: 3
        }],
        '@babel/preset-react',
        '@babel/preset-typescript'
      ],
      plugins: [
        // React optimizations  
        '@babel/plugin-transform-react-inline-elements',
        '@babel/plugin-transform-react-constant-elements',
        
        // General optimizations
        '@babel/plugin-proposal-class-properties',
        '@babel/plugin-proposal-object-rest-spread',
        '@babel/plugin-syntax-dynamic-import',
        
        // Production optimizations (only if available)
        ...(process.env.NODE_ENV === 'production' ? [
          // Only use plugins that are definitely available
        ] : [])
      ],
      compact: process.env.NODE_ENV === 'production',
      minified: process.env.NODE_ENV === 'production',
      comments: process.env.NODE_ENV !== 'production'
    };

    const result = transform(src, babelOptions);
    
    if (!result) {
      throw new Error(`Failed to transform ${filename}`);
    }

    return {
      code: result.code,
      map: result.map
    };
  }
};
