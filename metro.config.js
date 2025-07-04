const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// getDefaultConfig from expo/metro-config should handle 'ts' and 'tsx' by default.
// Removing explicit push and unstable_enablePackageExports to simplify and revert to a more stable default.
// config.resolver.sourceExts.push('ts', 'tsx');
// config.resolver.unstable_enablePackageExports = true;

module.exports = config;