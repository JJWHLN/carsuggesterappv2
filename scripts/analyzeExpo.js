#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔍 Analyzing @expo package breakdown...\n');

// Get detailed expo package sizes
const expoCandidates = [
  'expo-splash-screen',
  'expo-status-bar', 
  'expo-system-ui',
  'expo-constants',
  'expo-font',
  'expo-router',
  'expo-linear-gradient',
  'expo-linking'
];

console.log('📦 Expo Module Sizes:');
expoCandidates.forEach(pkg => {
  try {
    const result = execSync(`npm list ${pkg} --depth=0`, { encoding: 'utf8' });
    if (result.includes(pkg)) {
      console.log(`✅ ${pkg} - installed`);
    }
  } catch (e) {
    console.log(`❌ ${pkg} - not found`);
  }
});

// Check for usage of each
console.log('\n🔍 Usage Analysis:');

const checkUsage = (pkg, patterns) => {
  let used = false;
  patterns.forEach(pattern => {
    try {
      const files = ['app', 'components', 'hooks', 'lib', 'services', 'constants'];
      files.forEach(dir => {
        if (fs.existsSync(dir)) {
          const result = execSync(`findstr /S /I "${pattern}" ${dir}\\*.ts ${dir}\\*.tsx 2>nul || echo ""`, { encoding: 'utf8' });
          if (result.trim() && !result.includes('not found')) {
            used = true;
          }
        }
      });
    } catch (e) {
      // Ignore
    }
  });
  return used;
};

const usageChecks = {
  'expo-splash-screen': ['SplashScreen', 'expo-splash-screen'],
  'expo-status-bar': ['StatusBar', 'expo-status-bar'],
  'expo-system-ui': ['SystemUI', 'expo-system-ui'],
  'expo-constants': ['Constants', 'expo-constants'],
  'expo-font': ['Font', 'expo-font'],
  'expo-router': ['expo-router', 'useRouter', 'router'],
  'expo-linear-gradient': ['LinearGradient', 'expo-linear-gradient'],
  'expo-linking': ['Linking', 'expo-linking']
};

Object.entries(usageChecks).forEach(([pkg, patterns]) => {
  const used = checkUsage(pkg, patterns);
  if (used) {
    console.log(`✅ USED: ${pkg}`);
  } else {
    console.log(`🗑️  POTENTIALLY UNUSED: ${pkg}`);
  }
});

console.log('\n💡 Focus on removing unused expo modules for maximum @expo bundle reduction.');
