import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import WalkingCharacters from "../../components/WalkingCharacters";
import { useAuth } from "../../context/AuthContext";
import { useWalk } from "../../context/WalkContext";

export default function TabsHomeScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentWalk, loading: walkLoading, joinWalk } = useWalk();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/signin");
    }
  }, [user, authLoading, router]);

  const handleJoinWalk = async () => {
    try {
      if (currentWalk) {
        await joinWalk(currentWalk.id);
        router.push("/(tabs)/walk");
      }
    } catch (error) {
      console.error("Error joining walk:", error);
    }
  };

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

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Welcome to WalkMate, {user.name}!</Text>

        {currentWalk ? (
          <View style={styles.walkContainer}>
            <Text style={styles.subtitle}>There's a walk in progress!</Text>
            <TouchableOpacity style={styles.button} onPress={handleJoinWalk}>
              <Text style={styles.buttonText}>Join Walk</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.subtitle}>No active walks at the moment.</Text>
        )}

        <View style={styles.howItWorksContainer}>
          <Text style={styles.sectionTitle}>How It Works</Text>

          <View style={styles.stepContainer}>
            <View style={styles.stepNumberContainer}>
              <Text style={styles.stepNumber}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Join a Walk</Text>
              <Text style={styles.stepDescription}>
                Sign up for a scheduled walk in your area or join an ongoing
                one.
              </Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <View style={styles.stepNumberContainer}>
              <Text style={styles.stepNumber}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Check In</Text>
              <Text style={styles.stepDescription}>
                When you arrive, check in to confirm your participation and get
                matched with a partner.
              </Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <View style={styles.stepNumberContainer}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Meet New People</Text>
              <Text style={styles.stepDescription}>
                Get paired with interesting people to chat with while walking.
                Partners rotate throughout the walk.
              </Text>
            </View>
          </View>

          <View style={styles.stepContainer}>
            <View style={styles.stepNumberContainer}>
              <Text style={styles.stepNumber}>4</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Expand Your Network</Text>
              <Text style={styles.stepDescription}>
                Meet the whole group instead of sticking with people you already
                know. Make meaningful connections!
              </Text>
            </View>
          </View>

          <View style={styles.spacer} />
        </View>
      </ScrollView>

      <LinearGradient
        locations={[0, 0.2, 1]}
        colors={[
          "rgba(255,255,255,0)",
          "rgba(255,255,255,0.9)",
          "rgba(255,255,255,1)",
        ]}
        style={styles.gradient}
      />

      <View style={styles.animationsContainer}>
        <WalkingCharacters style={{ marginTop: 25 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollViewContent: {
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 180, // Add extra padding at the bottom for the gradient and animations
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  walkContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  button: {
    backgroundColor: "#4285F4",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  howItWorksContainer: {
    width: "100%",
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  stepContainer: {
    flexDirection: "row",
    marginBottom: 20,
    alignItems: "flex-start",
  },
  stepNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4285F4",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    marginTop: 2,
  },
  stepNumber: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 22,
    color: "#555",
  },
  spacer: {
    height: 30,
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 180,
    zIndex: 1,
  },
  animationsContainer: {
    width: "100%",
    position: "absolute",
    bottom: 0,
    zIndex: 2,
    height: 120,
  },
});
