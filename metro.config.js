const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add .lottie files to the asset extensions
config.resolver.assetExts.push('lottie');

module.exports = config;
