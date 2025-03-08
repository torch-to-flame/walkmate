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

// App theme colors
const COLORS = {
  primary: "#4285F4",
  background: "#f8f8f8",
  card: "#ffffff",
  text: "#333333",
  textSecondary: "#666666",
  border: "#e0e0e0",
};

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
  location?: {
    name: string;
    placeId: string;
    latitude: number;
    longitude: number;
  };
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
          location: walkData.location,
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

  const handleGoBack = () => {
    router.back();
  };

  if (authLoading || loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Walk Details",
          headerStyle: {
            backgroundColor: COLORS.card,
          },
          headerTintColor: COLORS.text,
          headerShadowVisible: false,
          headerBackVisible: true,
          headerBackTitle: "Back",
        }}
      />
      <StatusBar style="auto" />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.card}>
          <Text style={styles.walkName}>{walkDetails.name}</Text>
          <Text style={styles.dateTime}>
            {format(walkDetails.date, "EEEE, MMMM d, yyyy")} at{" "}
            {format(walkDetails.date, "h:mm a")}
          </Text>
          
          {walkDetails.location && (
            <Text style={styles.location}>
              <Ionicons name="location-outline" size={16} color={COLORS.textSecondary} /> {walkDetails.location.name}
            </Text>
          )}
          
          <Text style={styles.duration}>
            <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} /> {walkDetails.durationMinutes} minutes
          </Text>
          
          {walkDetails.numberOfRotations > 1 && (
            <Text style={styles.rotations}>
              <Ionicons name="swap-horizontal-outline" size={16} color={COLORS.textSecondary} /> {walkDetails.numberOfRotations} rotations
            </Text>
          )}
        </View>

        <View style={styles.partnersContainer}>
          <Text style={styles.sectionTitle}>Your Walking Partners</Text>
          
          {walkDetails.rotationPartners.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>You walked solo on this walk.</Text>
            </View>
          ) : (
            walkDetails.rotationPartners.map((rotation, index) => (
              <View
                key={rotation.pairId}
                style={[
                  styles.partnerItem,
                  index === walkDetails.rotationPartners.length - 1 && styles.partnerItem_last,
                ]}
              >
                <View
                  style={[
                    styles.colorIndicator,
                    { backgroundColor: getEnhancedColor(rotation.pairColor) },
                  ]}
                >
                  <Text style={styles.pairNumber}>{rotation.pairNumber}</Text>
                </View>
                <View style={styles.partnerInfo}>
                  {rotation.partner ? (
                    <>
                      <Text style={styles.partnerName}>{rotation.partner.name}</Text>
                      <Text style={styles.rotationText}>
                        Rotation {rotation.pairNumber}
                      </Text>
                      {rotation.partner.aboutMe && (
                        <Text style={styles.aboutMe}>
                          {rotation.partner.aboutMe}
                        </Text>
                      )}
                    </>
                  ) : (
                    <Text style={styles.partnerName}>Solo Rotation</Text>
                  )}
                </View>
                {rotation.partner?.profilePicUrl && (
                  <Image
                    source={{ uri: rotation.partner.profilePicUrl }}
                    style={styles.profilePic}
                  />
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  walkName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  dateTime: {
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
  },
  location: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  duration: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  rotations: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  partnersContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 16,
  },
  partnerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  partnerItem_last: {
    marginBottom: 0,
    paddingBottom: 0,
    borderBottomWidth: 0,
  },
  colorIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pairNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  rotationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  aboutMe: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginLeft: 16,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    padding: 20,
  },
});
