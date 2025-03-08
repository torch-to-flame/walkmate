import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from "react-native";
import WalkForm, { WalkFormValues } from "../../components/WalkForm";
import { useAuth } from "../../context/AuthContext";
import { useWalk } from "../../context/WalkContext";

export default function NewWalkScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { createWalk } = useWalk();

  const initialValues: WalkFormValues = {
    location: {
      name: "",
      placeId: "",
      latitude: 0,
      longitude: 0,
    },
    date: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // Default to tomorrow
    durationMinutes: 60, // Default to 60 minutes
    numberOfRotations: 3, // Default to 3 rotations
    organizer: user?.name || "", // Default to current user's name
  };

  const handleSubmit = async (values: WalkFormValues) => {
    try {
      await createWalk({
        location: values.location,
        date: values.date,
        durationMinutes: values.durationMinutes,
        numberOfRotations: values.numberOfRotations,
        organizer: values.organizer,
      });

      Alert.alert("Success", "New walk created successfully!");
      router.back();
    } catch (error) {
      console.error("Error creating walk:", error);
      Alert.alert("Error", "Failed to create walk. Please try again.");
    }
  };

  if (authLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!user || !user.isAdmin) {
    return null; // Will redirect from useEffect in layout
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <StatusBar style="auto" />
      <WalkForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitButtonText="Create Walk"
        onCancel={() => router.back()}
        googleApiKey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
});
