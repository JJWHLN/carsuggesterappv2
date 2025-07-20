#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Read package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const dependencies = Object.keys(packageJson.dependencies || {});

console.log('🔍 Checking for unused dependencies...\n');

// Common packages that are often unused
const potentiallyUnused = [
  'moment', // Large date library, could use date-fns or native Date
  'web-streams-polyfill', // Large polyfill
  '@react-native-community/netinfo', // Network info
  'expo-apple-authentication', // Apple-specific
  'expo-auth-session', // Auth
  'expo-blur', // Visual effects
  'expo-crypto', // Crypto operations
  'expo-device', // Device info
  'expo-haptics', // Haptic feedback
  'expo-linking', // Deep linking
  'expo-web-browser', // Web browser
];

let totalSavings = 0;
const removalCandidates = [];

potentiallyUnused.forEach(dep => {
  if (dependencies.includes(dep)) {
    try {
      // Get package size
      const size = execSync(`npm list ${dep} --depth=0 2>/dev/null | grep ${dep} || echo "not found"`, { encoding: 'utf8' });
      console.log(`⚠️  Found potentially unused: ${dep}`);
      removalCandidates.push(dep);
    } catch (e) {
      // Package not found or error
    }
  }
});

// Check for usage patterns
console.log('\n📋 Checking actual usage in code...\n');

const searchPatterns = {
  'moment': ['moment', 'Moment'],
  'web-streams-polyfill': ['ReadableStream', 'web-streams'],
  '@react-native-community/netinfo': ['NetInfo', '@react-native-community/netinfo'],
  'expo-apple-authentication': ['AppleAuthentication', 'expo-apple-authentication'],
  'expo-blur': ['BlurView', 'expo-blur'],
  'expo-crypto': ['Crypto.', 'expo-crypto'],
  'expo-device': ['Device.', 'expo-device'],
  'expo-haptics': ['Haptics.', 'expo-haptics'],
  'expo-linking': ['Linking.', 'expo-linking'],
  'expo-web-browser': ['WebBrowser.', 'expo-web-browser'],
};

removalCandidates.forEach(dep => {
  const patterns = searchPatterns[dep] || [dep];
  let used = false;
  
  patterns.forEach(pattern => {
    try {
      const result = execSync(`grep -r "${pattern}" app components hooks lib services --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null || echo ""`, { encoding: 'utf8' });
      if (result.trim() && !result.includes('not found')) {
        used = true;
      }
    } catch (e) {
      // Ignore errors
    }
  });
  
  if (!used) {
    console.log(`🗑️  UNUSED: ${dep} - Safe to remove`);
  } else {
    console.log(`✅ USED: ${dep} - Keep`);
  }
});

console.log('\n🔧 Suggested removal commands:');
console.log('# Remove unused packages:');
removalCandidates.forEach(dep => {
  console.log(`npm uninstall ${dep}`);
});

console.log('\n💡 After removing unused packages, run the bundle analyzer again to see savings.');
