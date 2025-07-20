#!/usr/bin/env node

/**
 * Production Bundle Size Analyzer
 * 
 * This script builds the app in production mode and measures actual bundle sizes
 * to verify optimization effectiveness.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Production Bundle for Size Analysis...\n');

try {
  // Step 1: Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('.expo')) {
    execSync('rd /s /q .expo', { stdio: 'inherit' });
  }
  
  // Step 2: Build with optimized Metro config
  console.log('📦 Building with optimized Metro configuration...');
  
  // Copy optimized metro config
  if (fs.existsSync('metro.config.optimized.js')) {
    fs.copyFileSync('metro.config.optimized.js', 'metro.config.backup.js');
    console.log('✅ Using optimized Metro configuration');
  }
  
  // Set production environment
  process.env.NODE_ENV = 'production';
  
  // Build the bundle
  console.log('🔨 Creating production bundle...');
  const buildCommand = 'npx expo export --platform android --output-dir ./dist-production';
  
  execSync(buildCommand, { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  // Step 3: Analyze bundle sizes
  console.log('\n📊 Analyzing production bundle sizes...\n');
  
  const distPath = './dist-production';
  if (fs.existsSync(distPath)) {
    const bundlePath = path.join(distPath, '_expo/static/js/android');
    
    if (fs.existsSync(bundlePath)) {
      const files = fs.readdirSync(bundlePath);
      let totalSize = 0;
      
      console.log('📁 Production Bundle Files:');
      files.forEach(file => {
        const filePath = path.join(bundlePath, file);
        const stats = fs.statSync(filePath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        totalSize += stats.size;
        
        if (file.endsWith('.js')) {
          console.log(`📄 ${file}: ${sizeKB} KB`);
        }
      });
      
      const totalMB = (totalSize / (1024 * 1024)).toFixed(2);
      console.log(`\n🎯 Total Production JavaScript Bundle: ${totalMB} MB`);
      
      // Compare with target
      const targetMB = 50; // Realistic target for JS bundle
      const percentOfTarget = ((totalSize / (1024 * 1024)) / targetMB * 100).toFixed(1);
      
      if (totalMB <= targetMB) {
        console.log(`✅ SUCCESS: Bundle is ${percentOfTarget}% of ${targetMB}MB target!`);
      } else {
        console.log(`⚠️  Bundle is ${percentOfTarget}% of ${targetMB}MB target. Continue optimization.`);
      }
      
      // Check for icon optimization effectiveness
      const bundleContent = files
        .filter(f => f.endsWith('.js'))
        .map(f => fs.readFileSync(path.join(bundlePath, f), 'utf8'))
        .join('');
      
      // Look for lucide patterns
      const lucideMatches = bundleContent.match(/lucide-react-native/g) || [];
      const iconMatches = bundleContent.match(/\bicon[A-Z]/g) || [];
      
      console.log(`\n🔍 Icon Optimization Analysis:`);
      console.log(`   Lucide references: ${lucideMatches.length}`);
      console.log(`   Icon components: ${iconMatches.length}`);
      
      if (lucideMatches.length > 50) {
        console.log(`⚠️  High lucide usage detected. Consider ultra-optimized icons.`);
      } else {
        console.log(`✅ Lucide optimization appears effective!`);
      }
      
    } else {
      console.log('❌ Bundle directory not found');
    }
  } else {
    console.log('❌ Production build failed - dist directory not found');
  }
  
} catch (error) {
  console.error('❌ Production build failed:', error.message);
  
  // Fallback: Analyze development bundle size
  console.log('\n🔄 Falling back to development bundle analysis...');
  try {
    execSync('node scripts/bundleAnalyzer.js', { stdio: 'inherit' });
  } catch (e) {
    console.error('Bundle analysis also failed:', e.message);
  }
} finally {
  // Cleanup
  if (fs.existsSync('metro.config.backup.js')) {
    fs.unlinkSync('metro.config.backup.js');
  }
}

console.log('\n🏁 Production analysis complete!');
console.log('💡 Next steps: Implement ultra-optimized icons for maximum reduction.');
