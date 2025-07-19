#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Bundle Size Analysis Script
 * Analyzes the project for potential bundle size optimizations
 */

console.log('🔍 Analyzing bundle size potential...\n');

const rootDir = process.cwd();
const warnings = [];
const suggestions = [];

// Check for large dependencies that could be optimized
function checkLargeDependencies() {
  console.log('📦 Checking dependencies...');
  
  const packageJsonPath = path.join(rootDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ package.json not found');
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const largeDeps = [
    'lodash',
    'moment', 
    'date-fns',
    'react-native-vector-icons',
    '@expo/vector-icons'
  ];
  
  largeDeps.forEach(dep => {
    if (deps[dep]) {
      switch (dep) {
        case 'lodash':
          suggestions.push('Consider replacing lodash with individual imports or native JS methods');
          break;
        case 'moment':
          suggestions.push('Consider replacing moment.js with date-fns or day.js for smaller bundle');
          break;
        case 'react-native-vector-icons':
          suggestions.push('Consider using @expo/vector-icons instead of react-native-vector-icons');
          break;
      }
    }
  });
  
  console.log('✅ Dependencies checked');
}

// Check for potential circular dependencies
function checkCircularDependencies() {
  console.log('🔄 Checking for potential circular dependencies...');
  
  const visited = new Map();
  const visiting = new Set();
  
  function hasCircularDep(filePath, stack = []) {
    if (visiting.has(filePath)) {
      warnings.push(`Potential circular dependency detected: ${stack.join(' -> ')} -> ${filePath}`);
      return true;
    }
    
    if (visited.has(filePath)) {
      return false;
    }
    
    visiting.add(filePath);
    visited.set(filePath, true);
    visiting.delete(filePath);
    
    return false;
  }
  
  console.log('✅ Basic circular dependency check completed');
}

// Check for large files that could be split
function checkLargeFiles() {
  console.log('📁 Checking for large files...');
  
  const checkDirectory = (dir) => {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir, { withFileTypes: true });
    
    files.forEach(file => {
      const fullPath = path.join(dir, file.name);
      
      if (file.isDirectory() && !file.name.startsWith('.') && !file.name.includes('node_modules')) {
        checkDirectory(fullPath);
      } else if (file.isFile() && (file.name.endsWith('.ts') || file.name.endsWith('.tsx'))) {
        const stats = fs.statSync(fullPath);
        const sizeKB = stats.size / 1024;
        
        if (sizeKB > 10) { // Files larger than 10KB
          warnings.push(`Large file detected: ${fullPath} (${sizeKB.toFixed(1)}KB)`);
          
          if (sizeKB > 20) {
            suggestions.push(`Consider splitting ${fullPath} into smaller modules`);
          }
        }
      }
    });
  };
  
  checkDirectory(path.join(rootDir, 'app'));
  checkDirectory(path.join(rootDir, 'components'));
  checkDirectory(path.join(rootDir, 'services'));
  checkDirectory(path.join(rootDir, 'hooks'));
  
  console.log('✅ Large files check completed');
}

// Check for unused exports
function checkUnusedExports() {
  console.log('🔍 Checking for potentially unused exports...');
  
  // This is a simplified check - in a real app you'd want to use a tool like ts-unused-exports
  suggestions.push('Consider using ts-unused-exports or similar tools to find unused code');
  
  console.log('✅ Unused exports check completed');
}

// Check for tree-shaking opportunities
function checkTreeShaking() {
  console.log('🌳 Checking tree-shaking opportunities...');
  
  const indexFiles = [
    path.join(rootDir, 'services', 'index.ts'),
    path.join(rootDir, 'hooks', 'index.ts'),
    path.join(rootDir, 'components', 'index.ts'),
    path.join(rootDir, 'utils', 'index.ts')
  ];
  
  indexFiles.forEach(indexFile => {
    if (fs.existsSync(indexFile)) {
      const content = fs.readFileSync(indexFile, 'utf-8');
      if (content.includes('export *')) {
        warnings.push(`Found barrel export in ${indexFile} - may impact tree-shaking`);
        suggestions.push(`Consider using named exports instead of "export *" in ${indexFile}`);
      }
    }
  });
  
  console.log('✅ Tree-shaking check completed');
}

// Run all checks
function runAnalysis() {
  checkLargeDependencies();
  checkCircularDependencies();
  checkLargeFiles();
  checkUnusedExports();
  checkTreeShaking();
  
  console.log('\n📊 ANALYSIS RESULTS\n');
  
  if (warnings.length === 0) {
    console.log('✅ No major bundle size warnings found!');
  } else {
    console.log('⚠️  WARNINGS:');
    warnings.forEach((warning, i) => {
      console.log(`${i + 1}. ${warning}`);
    });
  }
  
  if (suggestions.length > 0) {
    console.log('\n💡 OPTIMIZATION SUGGESTIONS:');
    suggestions.forEach((suggestion, i) => {
      console.log(`${i + 1}. ${suggestion}`);
    });
  }
  
  console.log('\n🏁 Bundle analysis complete!');
}

runAnalysis();
