import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import WalkingCharacters from "../../components/WalkingCharacters";
import UpcomingWalks from "../../components/UpcomingWalks";
import WalkCard from "../../components/WalkCard";
import { useAuth } from "../../context/AuthContext";
import { useWalk } from "../../context/WalkContext";

// App theme colors
const COLORS = {
  primary: "#4285F4",
  background: "#f8f8f8",
  card: "#ffffff",
  text: "#333333",
  textSecondary: "#666666",
};

export default function TabsHomeScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentWalk, loading: walkLoading } = useWalk();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/signin");
    }
  }, [user, authLoading, router]);

  if (authLoading || walkLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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
            <WalkCard walk={currentWalk} showRSVPButton={false} />
          </View>
        ) : (
          <Text style={styles.subtitle}>No active walks at the moment.</Text>
        )}

        <UpcomingWalks />

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
              <Text style={styles.stepTitle}>Walk & Talk</Text>
              <Text style={styles.stepDescription}>
                Enjoy a walk with your partner. Every 15 minutes, you'll be
                matched with someone new.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <LinearGradient
        colors={["rgba(255,255,255,0)", "rgba(255,255,255,1)"]}
        style={styles.bottomGradient}
      />

      <View style={styles.animationContainer}>
        <WalkingCharacters />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollViewContent: {
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 180, // Add extra padding at the bottom for the gradient and animations
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
    color: COLORS.textSecondary,
  },
  walkContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  howItWorksContainer: {
    width: "100%",
    marginTop: 20,
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: COLORS.text,
  },
  stepContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  stepNumberContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
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
    fontWeight: "bold",
    marginBottom: 8,
    color: COLORS.text,
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.textSecondary,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  animationContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    justifyContent: "flex-end",
    alignItems: "center",
  },
});
