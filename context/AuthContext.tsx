import {
  createUserWithEmailAndPassword,
  FirebaseAuthTypes,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "@react-native-firebase/auth";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { auth, db } from "../firebase";
import { User } from "../types";
import { useFlashMessage } from "./FlashMessageContext";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    userData: Omit<User, "id" | "email">
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  validateToken: () => Promise<boolean>;
  refreshToken: () => Promise<void>;
  updateUserProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { showMessage } = useFlashMessage();

  // Function to fetch user data and update state
  const fetchUserData = async (firebaseUser: FirebaseAuthTypes.User): Promise<void> => {
    try {
      // Get the user's custom claims from the token
      const idTokenResult = await firebaseUser.getIdTokenResult();
      const isAdmin = idTokenResult.claims.admin === true;

      const userDoc = await db
        .collection("users")
        .doc(firebaseUser.uid)
        .get();
      
      if (userDoc.exists) {
        setUser({
          id: firebaseUser.uid,
          ...userDoc.data(),
          isAdmin, // Set isAdmin based on custom claims
        } as User);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      showMessage("Error loading user data", "error");
      throw error;
    }
  };

  // Function to refresh the user's token and update state
  const refreshToken = async (): Promise<void> => {
    try {
      if (!auth.currentUser) {
        throw new Error("No user logged in");
      }

      // Force token refresh
      await auth.currentUser.getIdToken(true);
      
      // Fetch updated user data with new token
      await fetchUserData(auth.currentUser);
      
      showMessage("Session refreshed successfully", "success");
    } catch (error) {
      console.error("Error refreshing token:", error);
      showMessage("Failed to refresh session", "error");
      throw error;
    }
  };

  // Function to validate the user's token
  const validateToken = async (): Promise<boolean> => {
    try {
      if (!auth.currentUser) return false;

      // Get the current user's ID token
      const token = await auth.currentUser.getIdToken(true);

      // Check if the token is valid by making a request that requires authentication
      // This will throw an error if the token is invalid
      await auth.currentUser.getIdTokenResult();

      return true;
    } catch (error) {
      console.error("Token validation error:", error);

      // Show error message and log the user out
      showMessage("Your session has expired. Please sign in again.", "error");
      await signOut();

      return false;
    }
  };

  const updateUserProfile = async (data: Partial<User>): Promise<void> => {
    try {
      if (!user) throw new Error("No user logged in");

      // Update the user document in Firestore
      await db.collection("users").doc(user.id).update(data);

      // Update the local user state
      setUser((prev) => (prev ? { ...prev, ...data } : null));

      showMessage("Profile updated successfully", "success");
    } catch (error) {
      console.error("Error updating profile:", error);
      showMessage("Failed to update profile", "error");
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseAuthTypes.User | null) => {
        if (firebaseUser) {
          try {
            // Validate token once when user is loaded
            await validateToken();
            
            // Fetch user data
            await fetchUserData(firebaseUser);
          } catch (error) {
            console.error("Error during auth state change:", error);
            showMessage("Error loading user data", "error");
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    userData: Omit<User, "id" | "email">
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const newUser: User = {
        id: userCredential.user.uid,
        email,
        ...userData,
        isAdmin: false, // Default to non-admin
      };
      await db.collection("users").doc(userCredential.user.uid).set(newUser);
      setUser(newUser);
      showMessage("Account created successfully!", "success");
    } catch (error) {
      console.error("Error signing up:", error);
      showMessage("Failed to create account", "error");
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      showMessage("Signed in successfully!", "success");
    } catch (error) {
      console.error("Error signing in:", error);
      showMessage("Invalid email or password", "error");
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      showMessage("Signed out successfully", "info");
    } catch (error) {
      console.error("Error signing out:", error);
      showMessage("Error signing out", "error");
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    validateToken,
    refreshToken,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
