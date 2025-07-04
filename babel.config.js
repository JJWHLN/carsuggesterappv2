module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // 'expo-router/babel', // Removed as per deprecation warning for SDK 50+
      'react-native-reanimated/plugin', // Must be last
    ],
  };
};