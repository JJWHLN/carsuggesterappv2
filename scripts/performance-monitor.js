#!/usr/bin/env node

/**
 * Performance monitoring script for the Car Suggester app
 * Analyzes bundle size, dependencies, and performance metrics
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');
const METRO_CONFIG_PATH = path.join(PROJECT_ROOT, 'metro.config.js');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, colors.blue);
  log(`${title}`, colors.bright);
  log(`${'='.repeat(60)}`, colors.blue);
}

// Analyze package.json dependencies
function analyzeDependencies() {
  logSection('📦 Dependency Analysis');
  
  const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  const dependencies = packageJson.dependencies || {};
  const devDependencies = packageJson.devDependencies || {};
  
  const totalDeps = Object.keys(dependencies).length;
  const totalDevDeps = Object.keys(devDependencies).length;
  
  log(`Production dependencies: ${totalDeps}`, colors.green);
  log(`Development dependencies: ${totalDevDeps}`, colors.cyan);
  
  // Check for heavy dependencies
  const heavyDeps = [
    'react-native-vector-icons',
    'react-native-svg'
  ];
  
  const foundHeavyDeps = heavyDeps.filter(dep => dependencies[dep]);
  if (foundHeavyDeps.length > 0) {
    log(`\n⚠️  Heavy dependencies found:`, colors.yellow);
    foundHeavyDeps.forEach(dep => {
      log(`  - ${dep}: ${dependencies[dep]}`, colors.yellow);
    });
    log(`Consider lazy loading or alternatives for these packages.`, colors.yellow);
  }
  
  // Check for duplicate functionality
  const duplicateChecks = [
    {
      category: 'HTTP clients',
      packages: ['axios', 'fetch', 'node-fetch'],
      found: Object.keys(dependencies).filter(dep => ['axios', 'fetch', 'node-fetch'].includes(dep))
    },
    {
      category: 'Date libraries',
      packages: ['moment', 'date-fns', 'dayjs'],
      found: Object.keys(dependencies).filter(dep => ['moment', 'date-fns', 'dayjs'].includes(dep))
    },
    {
      category: 'Animation libraries',
      packages: ['react-native-reanimated', 'lottie-react-native'],
      found: Object.keys(dependencies).filter(dep => ['react-native-reanimated', 'lottie-react-native'].includes(dep))
    }
  ];
  
  duplicateChecks.forEach(({ category, found }) => {
    if (found.length > 1) {
      log(`\n⚠️  Multiple ${category} found:`, colors.yellow);
      found.forEach(pkg => log(`  - ${pkg}`, colors.yellow));
      log(`Consider using only one to reduce bundle size.`, colors.yellow);
    }
  });
}

// Analyze bundle size (simulate for React Native)
function analyzeBundleSize() {
  logSection('📊 Bundle Size Analysis');
  
  try {
    // For React Native, we'll check the JavaScript bundle size estimation
    const srcDir = path.join(PROJECT_ROOT, 'src');
    const appDir = path.join(PROJECT_ROOT, 'app');
    const componentsDir = path.join(PROJECT_ROOT, 'components');
    
    let totalFiles = 0;
    let totalSize = 0;
    const largeFiles = [];
    
    function analyzeDirectory(dir, dirName) {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir, { withFileTypes: true });
      let dirSize = 0;
      let dirFiles = 0;
      
      files.forEach(file => {
        const filePath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          const subResult = analyzeDirectory(filePath, `${dirName}/${file.name}`);
          dirSize += subResult.size;
          dirFiles += subResult.files;
        } else if (file.name.endsWith('.tsx') || file.name.endsWith('.ts') || file.name.endsWith('.js')) {
          const stats = fs.statSync(filePath);
          const fileSize = stats.size;
          
          dirSize += fileSize;
          dirFiles++;
          
          // Flag large files (>50KB)
          if (fileSize > 50 * 1024) {
            largeFiles.push({
              path: path.relative(PROJECT_ROOT, filePath),
              size: fileSize,
              sizeKB: Math.round(fileSize / 1024)
            });
          }
        }
      });
      
      totalFiles += dirFiles;
      totalSize += dirSize;
      
      if (dirFiles > 0) {
        log(`${dirName}: ${dirFiles} files, ${Math.round(dirSize / 1024)}KB`, colors.cyan);
      }
      
      return { size: dirSize, files: dirFiles };
    }
    
    analyzeDirectory(srcDir, 'src');
    analyzeDirectory(appDir, 'app');
    analyzeDirectory(componentsDir, 'components');
    
    log(`\nTotal: ${totalFiles} files, ${Math.round(totalSize / 1024)}KB`, colors.green);
    
    if (largeFiles.length > 0) {
      log(`\n⚠️  Large files (>50KB):`, colors.yellow);
      largeFiles
        .sort((a, b) => b.size - a.size)
        .forEach(file => {
          log(`  - ${file.path}: ${file.sizeKB}KB`, colors.yellow);
        });
      log(`Consider splitting large files or lazy loading.`, colors.yellow);
    }
    
  } catch (error) {
    log(`Error analyzing bundle size: ${error.message}`, colors.red);
  }
}

// Check for performance optimizations
function checkPerformanceOptimizations() {
  logSection('⚡ Performance Optimization Check');
  
  const optimizations = [
    {
      name: 'Metro configuration',
      check: () => fs.existsSync(METRO_CONFIG_PATH),
      message: 'Metro config found - check for optimizations'
    },
    {
      name: 'Code splitting setup',
      check: () => {
        const codeSplittingFile = path.join(PROJECT_ROOT, 'src/utils/codeSplitting.tsx');
        return fs.existsSync(codeSplittingFile);
      },
      message: 'Code splitting utilities available'
    },
    {
      name: 'Performance monitoring',
      check: () => {
        const perfFile = path.join(PROJECT_ROOT, 'src/utils/performance.ts');
        return fs.existsSync(perfFile);
      },
      message: 'Performance monitoring setup'
    },
    {
      name: 'Optimized images',
      check: () => {
        const optimizedImageFile = path.join(PROJECT_ROOT, 'components/ui/OptimizedImage.tsx');
        return fs.existsSync(optimizedImageFile);
      },
      message: 'Optimized image component available'
    },
    {
      name: 'Virtual scrolling',
      check: () => {
        const virtualListFile = path.join(PROJECT_ROOT, 'components/ui/VirtualizedList.tsx');
        return fs.existsSync(virtualListFile);
      },
      message: 'Virtual scrolling component available'
    }
  ];
  
  optimizations.forEach(({ name, check, message }) => {
    const status = check();
    const icon = status ? '✅' : '❌';
    const color = status ? colors.green : colors.red;
    log(`${icon} ${name}: ${message}`, color);
  });
}

// Generate performance recommendations
function generateRecommendations() {
  logSection('💡 Performance Recommendations');
  
  const recommendations = [
    '1. Enable Hermes for better JavaScript performance',
    '2. Use React.memo for expensive components',
    '3. Implement virtual scrolling for large lists',
    '4. Lazy load non-critical components',
    '5. Optimize images with proper sizing and formats',
    '6. Use React Query for efficient data caching',
    '7. Minimize re-renders with useCallback and useMemo',
    '8. Profile app with React DevTools',
    '9. Monitor bundle size regularly',
    '10. Use performance monitoring in production'
  ];
  
  recommendations.forEach(rec => log(rec, colors.cyan));
  
  log(`\n📊 Performance Budget Guidelines:`, colors.bright);
  log(`- Initial bundle size: < 1MB`, colors.green);
  log(`- Component render time: < 16ms (60fps)`, colors.green);
  log(`- Navigation transitions: < 300ms`, colors.green);
  log(`- API response handling: < 100ms`, colors.green);
  log(`- Image loading: < 500ms`, colors.green);
}

// Main execution
function main() {
  log(`\n🚀 Car Suggester App Performance Monitor`, colors.bright);
  log(`Analyzing performance characteristics...\n`);
  
  try {
    analyzeDependencies();
    analyzeBundleSize();
    checkPerformanceOptimizations();
    generateRecommendations();
    
    log(`\n✅ Performance analysis complete!`, colors.green);
    log(`Run 'npm run bundle:analyze' for detailed bundle analysis.`, colors.cyan);
    
  } catch (error) {
    log(`\n❌ Error during analysis: ${error.message}`, colors.red);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  analyzeDependencies,
  analyzeBundleSize,
  checkPerformanceOptimizations,
  generateRecommendations
};
