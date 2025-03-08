// This is an alternative approach to using environment variables with Expo
// You can use this file instead of app.json and set up EAS secrets for your API keys

export default {
  "expo": {
    "name": "WalkMate",
    "slug": "walkmate",
    "version": "1.0.1",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "newArchEnabled": true,
    "splash": {
      "image": "./assets/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ddd0c7"
    },
    "scheme": "walkmate",
    "assetBundlePatterns": ["**/*", "assets/animations/*.lottie"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.michaeldawson.walkmate",
      "googleServicesFile": "./GoogleService-Info.plist",
      "config": {
        "googleMapsApiKey": process.env.GOOGLE_MAPS_API_KEY
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "googleServicesFile": "./google-services.json",
      "package": "com.michaeldawson.walkmate",
      "config": {
        "googleMaps": {
          "apiKey": process.env.GOOGLE_MAPS_API_KEY
        }
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-firebase/crashlytics",
      "expo-updates",
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ]
    ],
    "updates": {
      "enabled": true,
      "fallbackToCacheTimeout": 0,
      "url": "https://u.expo.dev/7b384d5a-3e2e-4c79-895f-30255a67819a"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "extra": {
      "eas": {
        "projectId": "7b384d5a-3e2e-4c79-895f-30255a67819a"
      }
    }
  }
};
