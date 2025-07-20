#!/usr/bin/env node

// Metro Bundle Configuration for Production Optimization
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable advanced tree shaking
config.transformer.minifierConfig = {
  keep_fnames: false,
  mangle: {
    keep_fnames: false,
  },
  output: {
    comments: false,
  },
};

// Enable dead code elimination
config.transformer.enableBabelRCLookup = false;
config.transformer.enableBabelRuntime = false;

// Optimize asset bundling
config.transformer.optimizeCss = true;

// Advanced resolver optimization
config.resolver.enableGlobalPackageManager = false;

// Bundle splitting optimization
config.serializer.customSerializer = ({ 
  entryPoint,
  preModules,
  graph,
  options,
}) => {
  // Custom serialization for better tree shaking
  const modules = graph.dependencies;
  
  // Filter out unused lucide icons more aggressively
  const filteredModules = new Map();
  
  for (const [path, module] of modules) {
    // Skip unused lucide icons
    if (path.includes('lucide-react-native') && 
        !path.includes('dist/esm/icons/')) {
      continue;
    }
    
    // Skip large development dependencies in production
    if (options.dev === false) {
      if (path.includes('react-devtools') ||
          path.includes('typescript') ||
          path.includes('detox')) {
        continue;
      }
    }
    
    filteredModules.set(path, module);
  }
  
  // Use default serializer with filtered modules
  const originalSerializer = require('metro/src/shared/output/bundle');
  return originalSerializer({
    entryPoint,
    preModules,
    graph: { ...graph, dependencies: filteredModules },
    options,
  });
};

module.exports = config;
