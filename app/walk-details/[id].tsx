import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../firebase";

interface Partner {
  id: string;
  name: string;
  profilePicUrl?: string;
  aboutMe?: string;
}

interface RotationPartner {
  partner: Partner | null;
  pairNumber: number;
  pairColor: string;
  pairId: string;
}

interface WalkDetails {
  id: string;
  name: string;
  date: Date;
  durationMinutes: number;
  numberOfRotations: number;
  rotationPartners: RotationPartner[];
}

export default function WalkDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [walkDetails, setWalkDetails] = useState<WalkDetails | null>(null);
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/signin");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !id) return;

    const fetchWalkDetails = async () => {
      try {
        // Get the walk document
        const walkDoc = await db
          .collection("walks")
          .doc(id as string)
          .get();

        if (!walkDoc.exists) {
          console.error("Walk not found");
          setLoading(false);
          return;
        }

        const walkData = walkDoc.data();
        const walkDate = walkData.date.toDate();

        // Find all pairs that contained the current user
        const userPairs = walkData.pairs.filter((p: any) =>
          p.users.includes(user.id)
        );

        if (userPairs.length === 0) {
          console.error("User pairs not found in this walk");
          setLoading(false);
          return;
        }

        // Process each pair to get partner details
        const rotationPartners: RotationPartner[] = [];

        for (const pair of userPairs) {
          // Find the partner (other user in the pair)
          const partnerIds = pair.users.filter((id: string) => id !== user.id);
          let partner: Partner | null = null;

          if (partnerIds.length > 0) {
            // For simplicity, we'll just use the first partner if it's a group of 3
            const partnerId = partnerIds[0];
            // Fetch partner's details
            const partnerDoc = await db.collection("users").doc(partnerId).get();
            if (partnerDoc.exists) {
              const partnerData = partnerDoc.data();
              partner = {
                id: partnerId,
                name: partnerData.name || "Unknown User",
                profilePicUrl: partnerData.profilePicUrl,
                aboutMe: partnerData.aboutMe,
              };
            }
          }

          rotationPartners.push({
            partner,
            pairNumber: pair.number,
            pairColor: pair.color,
            pairId: pair.id,
          });
        }

        setWalkDetails({
          id: walkDoc.id,
          name: walkData.name || `Walk on ${format(walkDate, 'MMM d, yyyy')}`,
          date: walkDate,
          durationMinutes: walkData.durationMinutes || 60,
          numberOfRotations: walkData.numberOfRotations || 3,
          rotationPartners,
        });
      } catch (error) {
        console.error("Error fetching walk details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWalkDetails();
  }, [user, id]);

  // Get a more aesthetically pleasing color based on the assigned color
  const getEnhancedColor = (color?: string) => {
    if (!color) return "#457B9D";

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

  if (authLoading || loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!user) {
    return null; // Will redirect to signin
  }

  if (!walkDetails) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Walk not found or you were not part of this walk.
        </Text>
      </View>
    );
  }

  // Use the first rotation's color for the header background
  const firstPartner = walkDetails.rotationPartners[0];
  const backgroundColor = getEnhancedColor(firstPartner?.pairColor);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Walk Details",
          headerStyle: {
            backgroundColor,
          },
          headerTintColor: "white",
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.goBack()}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <StatusBar style="auto" />

        <View
          style={[styles.header, { backgroundColor, paddingTop: insets.top }]}
        >
          <Text style={styles.walkName}>{walkDetails.name}</Text>
          <Text style={styles.date}>
            {format(walkDetails.date, "MMMM d, yyyy")} at{" "}
            {format(walkDetails.date, "h:mm a")}
          </Text>
          <Text style={styles.walkInfo}>
            {walkDetails.durationMinutes} minutes • {walkDetails.numberOfRotations} rotations
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Your Walking Partners
            {walkDetails.rotationPartners.length > 1 ? " (All Rotations)" : ""}
          </Text>

          {walkDetails.rotationPartners.map((rotation, index) => (
            <View key={rotation.pairId} style={styles.rotationContainer}>
              {walkDetails.rotationPartners.length > 1 && (
                <Text style={styles.rotationLabel}>
                  Rotation {index + 1} of {walkDetails.rotationPartners.length}
                </Text>
              )}
              
              <View style={styles.pairInfoContainer}>
                <View style={styles.pairInfo}>
                  <View 
                    style={[
                      styles.pairNumber, 
                      { backgroundColor: getEnhancedColor(rotation.pairColor) }
                    ]}
                  >
                    <Text style={styles.pairNumberText}>
                      {rotation.pairNumber}
                    </Text>
                  </View>
                </View>
              </View>

              {rotation.partner ? (
                <View style={styles.partnerInfo}>
                  <View style={styles.partnerHeader}>
                    {rotation.partner.profilePicUrl ? (
                      <Image
                        source={{ uri: rotation.partner.profilePicUrl }}
                        style={styles.profilePic}
                      />
                    ) : (
                      <View style={styles.profilePlaceholder}>
                        <Text style={styles.profileInitial}>
                          {rotation.partner.name.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.partnerNameContainer}>
                      <Text style={styles.partnerName}>
                        {rotation.partner.name}
                      </Text>
                    </View>
                  </View>

                  {rotation.partner.aboutMe && (
                    <View style={styles.aboutMeContainer}>
                      <Text style={styles.aboutMeLabel}>About</Text>
                      <Text style={styles.aboutMeText}>
                        {rotation.partner.aboutMe}
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                <Text style={styles.soloText}>
                  You were on a solo walk for this rotation.
                </Text>
              )}
              
              {index < walkDetails.rotationPartners.length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  contentContainer: {
    paddingBottom: 30,
  },
  header: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  walkName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  date: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 4,
  },
  walkInfo: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  rotationContainer: {
    marginBottom: 16,
  },
  rotationLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  pairInfoContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  pairInfo: {
    alignItems: "center",
  },
  pairNumber: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  pairNumberText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  pairText: {
    fontSize: 16,
    color: "#666",
  },
  partnerInfo: {
    marginBottom: 8,
  },
  partnerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profilePic: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  profilePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4285F4",
  },
  partnerNameContainer: {
    marginLeft: 16,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  aboutMeContainer: {
    marginTop: 8,
  },
  aboutMeLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 4,
  },
  aboutMeText: {
    fontSize: 16,
    color: "#333",
    lineHeight: 22,
  },
  soloText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 16,
  },
});
