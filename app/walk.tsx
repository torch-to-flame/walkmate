import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useWalk } from "../context/WalkContext";

export default function WalkScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { userPair, loading: walkLoading } = useWalk();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/signin");
    }
  }, [user, authLoading, router]);

  if (authLoading || walkLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!user) {
    return null; // Will redirect to signin
  }

  if (!userPair) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>You're not part of any pair yet.</Text>
        <Text style={styles.subtitle}>
          Please wait for the admin to assign you to a pair.
        </Text>
      </View>
    );
  }

  // Get a more aesthetically pleasing color based on the assigned color
  const getEnhancedColor = (color: string) => {
    // Define nicer color palette with better contrast
    const colorMap: Record<string, string> = {
      yellow: "#F9D949", // Softer yellow
      red: "#E76F51", // Coral red
      blue: "#457B9D", // Steel blue
      green: "#2A9D8F", // Teal green
      purple: "#9B5DE5", // Lavender
      orange: "#F4A261", // Light orange
      pink: "#E07A5F", // Terra cotta
      cyan: "#48CAE4", // Sky blue
    };

    return colorMap[color] || "#457B9D"; // Default to steel blue if color not found
  };

  const backgroundColor = getEnhancedColor(userPair.color);

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar style="auto" />
      <View style={[styles.contentContainer, { paddingTop: insets.top }]}>
        <Text style={styles.title}>Find Your Walking Partner!</Text>

        <View style={styles.pairInfo}>
          <Text style={styles.pairNumber}>{userPair.number}</Text>
        </View>

        <Text style={styles.instructions}>
          Look for someone with the same number and color, and start walking
          together!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 16,
    margin: 20,
    paddingVertical: 40,
    paddingHorizontal: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#333",
  },
  subtitle: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
    color: "#555",
  },
  pairInfo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 30,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  pairNumber: {
    fontSize: 60,
    fontWeight: "bold",
    color: "#333",
  },
  instructions: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
    paddingHorizontal: 20,
    color: "#333",
  },
});
