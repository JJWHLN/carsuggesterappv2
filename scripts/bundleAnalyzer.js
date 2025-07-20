#!/usr/bin/env node

/**
 * Bundle Size Analyzer & Cleanup Tool
 * Identifies and removes large unused dependencies
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing Bundle for Large Dependencies...\n');

// Get directory size
const getDirectorySize = (dirPath) => {
  let totalSize = 0;
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        totalSize += getDirectorySize(filePath);
      } else {
        totalSize += stat.size;
      }
    });
  }
  return totalSize;
};

// Format bytes
const formatBytes = (bytes) => {
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Analyze node_modules subdirectories
const analyzeNodeModules = () => {
  const nodeModulesPath = 'node_modules';
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('❌ node_modules not found');
    return;
  }

  console.log('📊 Top 20 Largest Dependencies:\n');
  
  const dependencies = [];
  const items = fs.readdirSync(nodeModulesPath);
  
  items.forEach(item => {
    if (item.startsWith('.')) return;
    
    const itemPath = path.join(nodeModulesPath, item);
    const stat = fs.statSync(itemPath);
    
    if (stat.isDirectory()) {
      const size = getDirectorySize(itemPath);
      dependencies.push({ name: item, size, formattedSize: formatBytes(size) });
    }
  });

  // Sort by size (largest first)
  dependencies.sort((a, b) => b.size - a.size);
  
  // Show top 20
  dependencies.slice(0, 20).forEach((dep, index) => {
    const icon = index < 3 ? '🚨' : index < 10 ? '⚠️' : '📦';
    console.log(`${icon} ${dep.name}: ${dep.formattedSize}`);
  });

  return dependencies;
};

// Check for removable dependencies
const checkRemovableDependencies = (dependencies) => {
  console.log('\n🎯 Potentially Removable Dependencies:\n');
  
  const potentiallyUnused = [
    '@types/detox',
    'detox', 
    '@testing-library/jest-native',
    '@testing-library/react-native',
    'react-test-renderer',
    '@expo/cli',
    'ts-node'
  ];

  const removable = [];
  
  dependencies.forEach(dep => {
    // Check if it's a large dev dependency that might be included in production
    if (dep.size > 5 * 1024 * 1024) { // > 5MB
      if (potentiallyUnused.includes(dep.name)) {
        removable.push(dep);
        console.log(`🗑️  ${dep.name}: ${dep.formattedSize} (move to devDependencies)`);
      } else if (dep.name.includes('test') || dep.name.includes('mock')) {
        removable.push(dep);
        console.log(`🧪 ${dep.name}: ${dep.formattedSize} (test dependency)`);
      } else if (dep.size > 20 * 1024 * 1024) { // > 20MB
        console.log(`🚨 ${dep.name}: ${dep.formattedSize} (investigate usage)`);
      }
    }
  });

  return removable;
};

// Generate optimization commands
const generateOptimizationCommands = (removable) => {
  if (removable.length === 0) {
    console.log('\n✅ No obvious removable dependencies found');
    return;
  }

  console.log('\n🔧 Suggested Optimization Commands:\n');
  
  const devDeps = removable.filter(dep => 
    dep.name.includes('test') || 
    dep.name.includes('detox') ||
    dep.name.includes('@types/')
  );

  if (devDeps.length > 0) {
    console.log('# Move to devDependencies:');
    const devDepNames = devDeps.map(dep => dep.name).join(' ');
    console.log(`npm uninstall ${devDepNames} && npm install ${devDepNames} --save-dev\n`);
  }

  const totalSavings = removable.reduce((sum, dep) => sum + dep.size, 0);
  console.log(`💰 Potential Savings: ${formatBytes(totalSavings)}`);
};

// Analyze package.json for optimization opportunities
const analyzePackageJson = () => {
  console.log('\n📋 Package.json Analysis:\n');
  
  if (!fs.existsSync('package.json')) {
    console.log('❌ package.json not found');
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const depCount = Object.keys(packageJson.dependencies || {}).length;
  const devDepCount = Object.keys(packageJson.devDependencies || {}).length;
  
  console.log(`📦 Production Dependencies: ${depCount}`);
  console.log(`🧪 Dev Dependencies: ${devDepCount}`);
  console.log(`📊 Total Packages: ${depCount + devDepCount}`);
  
  // Check for commonly unused dependencies
  const deps = packageJson.dependencies || {};
  const unusedChecks = [
    { name: 'expo-camera', reason: 'Camera not used in current build' },
    { name: 'react-native-fast-image', reason: 'Replaced with OptimizedImage' },
    { name: 'react-native-skeleton-placeholder', reason: 'Not actively used' }
  ];

  console.log('\n🔍 Dependency Usage Check:');
  unusedChecks.forEach(check => {
    if (deps[check.name]) {
      console.log(`❌ ${check.name}: ${check.reason}`);
    } else {
      console.log(`✅ ${check.name}: Already removed`);
    }
  });
};

// Generate performance report
const generateReport = () => {
  const totalSize = getDirectorySize('node_modules');
  const targetSize = 200 * 1024 * 1024; // 200MB
  
  console.log('\n📈 Performance Summary:\n');
  console.log(`Current Bundle Size: ${formatBytes(totalSize)}`);
  console.log(`Target Size: ${formatBytes(targetSize)}`);
  console.log(`Reduction Needed: ${formatBytes(totalSize - targetSize)}`);
  
  const reductionPercent = ((totalSize - targetSize) / totalSize * 100).toFixed(1);
  console.log(`Percentage Reduction Needed: ${reductionPercent}%`);
  
  if (totalSize <= targetSize) {
    console.log('🎉 Target bundle size achieved!');
  } else {
    console.log('⚡ Continue optimization to reach target');
  }
};

// Main execution
const main = () => {
  const dependencies = analyzeNodeModules();
  const removable = checkRemovableDependencies(dependencies);
  generateOptimizationCommands(removable);
  analyzePackageJson();
  generateReport();
  
  console.log('\n🏁 Analysis Complete!');
  console.log('💡 Run specific optimization commands above to reduce bundle size.');
};

main();
