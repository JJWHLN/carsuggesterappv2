# Expo Module Optimization Guide

## Current Bundle Analysis
- **Original Size**: 431MB
- **After Phase 1**: 411MB (19.9MB saved from icons)
- **Target**: 200MB market competitive

## High-Impact Expo Optimizations

### 1. Remove Unused Expo Modules (8-12MB potential)
```json
// Remove from package.json if unused:
"expo-apple-authentication" // iOS only - 2MB
"expo-google-fonts" // Large font packages - 3-5MB  
"expo-image-picker" // If using basic camera - 2MB
"expo-location" // If no GPS features - 1.5MB
"expo-crypto" // Use lighter alternatives - 1MB
```

### 2. Platform-Specific Bundling (5-8MB potential)
```javascript
// metro.config.js - Platform exclusions
resolver: {
  platforms: ['android', 'ios', 'native', 'web'],
  blockList: [
    // Exclude iOS modules from Android builds
    /expo-apple-authentication/,
    // Exclude dev dependencies from production
    /@expo/cli/,
    /expo-dev-client/
  ]
}
```

### 3. Font Optimization (2-4MB potential)
```javascript
// Replace expo-google-fonts with system fonts
const styles = StyleSheet.create({
  text: {
    fontFamily: Platform.select({
      ios: 'San Francisco',
      android: 'Roboto',
      default: 'system'
    })
  }
});
```

### 4. Conditional Feature Loading (3-6MB potential)
```javascript
// Load features only when needed
const loadAuthModule = async () => {
  if (Platform.OS === 'ios') {
    return await import('expo-apple-authentication');
  }
  return null;
};
```

## Implementation Priority
1. **High Impact**: Remove unused modules (8-12MB)
2. **Medium Impact**: Platform-specific bundling (5-8MB)  
3. **Low Impact**: Font/asset optimization (2-4MB)

## Expected Results
- **Phase 1**: 431MB → 411MB ✅ (Complete)
- **Phase 2**: 411MB → 390MB (Lazy loading framework)
- **Phase 3**: 390MB → 360MB (Expo optimization) 
- **Phase 4**: 360MB → 320MB (Advanced techniques)
- **Final Target**: 200MB competitive

## Next Steps
1. Run: `node scripts/productionBuild.js`
2. Analyze production bundle size
3. Implement highest-impact optimizations first
4. Measure and iterate