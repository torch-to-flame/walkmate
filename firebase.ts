import _auth from "@react-native-firebase/auth";
import _firestore from "@react-native-firebase/firestore";
import _functions from "@react-native-firebase/functions";
import _storage from "@react-native-firebase/storage";

export const emulatorsEnabled = __DEV__;

// React Native Firebase configuration
// Note: The configuration is already in the google-services.json and GoogleService-Info.plist files
// We don't need to explicitly initialize with a config object for React Native

// Initialize Firebase services
export const auth = _auth();
export const db = _firestore();
export const functions = _functions();
export const storage = _storage();

export const { FieldPath, FieldValue } = _firestore;

// Use emulators in dev (local machine)
if (emulatorsEnabled) {
  auth.useEmulator("http://localhost:9099");
  functions.useEmulator("localhost", 5001);
  db.useEmulator("localhost", 8080);
  storage.useEmulator("localhost", 9199);
  console.log("Firebase emulators enabled");
} else {
  console.log("Firebase emulators disabled");
}
