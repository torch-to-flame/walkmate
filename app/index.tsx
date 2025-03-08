import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      console.log("User: ", { user });
      if (user) {
        router.replace("/(tabs)");
      } else {
        router.replace("/signin");
      }
    }
  }, [user, authLoading, router]);

  // Show loading indicator while checking auth state
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#4285F4" />
    </View>
  );
}
