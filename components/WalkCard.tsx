import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useWalk } from "../context/WalkContext";
import { Walk } from "../types";

// App theme colors
const COLORS = {
  primary: "#4285F4",
  background: "#f8f8f8",
  card: "#ffffff",
  text: "#333333",
  textSecondary: "#666666",
  success: "#34A853",
  action: "#EA4335",
  icon: "#666666",
  border: "#e0e0e0",
};

interface WalkCardProps {
  walk: Walk;
  showRSVPButton?: boolean;
  isUpcoming?: boolean;
}

const WalkCard: React.FC<WalkCardProps> = ({
  walk,
  showRSVPButton = true,
  isUpcoming = false,
}) => {
  const { rsvpForWalk, cancelRSVP, hasUserRSVPed, checkIn, joinWalk } =
    useWalk();
  const router = useRouter();
  const isRSVPed = hasUserRSVPed(walk.id);

  const formattedDate = format(walk.date, "EEE, MMM d");
  const formattedTime = format(walk.date, "h:mm a");
  const walkDate = new Date(walk.date);
  const now = new Date();
  const isToday = walkDate.toDateString() === now.toDateString();
  const isPast = walkDate < now;

  // Check if the walk is active or about to start (within 1 hour)
  const isActiveOrStartingSoon =
    walk.active ||
    (walkDate.getTime() - now.getTime() <= 60 * 60 * 1000 &&
      walkDate.getTime() >= now.getTime());

  const handleRSVP = async () => {
    try {
      if (isRSVPed) {
        await cancelRSVP(walk.id);
      } else {
        await rsvpForWalk(walk.id);
      }
    } catch (error) {
      console.error("Error handling RSVP:", error);
    }
  };

  const handleCheckIn = async () => {
    try {
      await checkIn(walk.id);
    } catch (error) {
      console.error("Error checking in:", error);
    }
  };

  const handleJoinWalk = async () => {
    try {
      await joinWalk(walk.id);
      router.push("/(tabs)/walk");
    } catch (error) {
      console.error("Error joining walk:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.dateTimeContainer}>
        <Text style={styles.date}>{formattedDate}</Text>
        <Text style={styles.time}>{formattedTime}</Text>
      </View>

      <View style={styles.detailsContainer}>
        {walk.location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color={COLORS.icon} />
            <Text style={styles.location} numberOfLines={1}>
              {walk.location.name}
            </Text>
          </View>
        )}

        <View style={styles.statsContainer}>
          {walk.organizer && (
            <View style={styles.statItem}>
              <Ionicons name="person" size={16} color={COLORS.icon} />
              <Text style={styles.organizer}>{walk.organizer}</Text>
            </View>
          )}

          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={16} color={COLORS.icon} />
            <Text style={styles.statText}>{walk.durationMinutes} min</Text>
          </View>

          {walk.rsvpUsers && (
            <View style={styles.statItem}>
              <Ionicons name="people" size={16} color={COLORS.icon} />
              <Text style={styles.statText}>{walk.rsvpUsers.length} RSVPs</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.actionContainer}>
        {isActiveOrStartingSoon && (
          <TouchableOpacity style={styles.joinButton} onPress={handleJoinWalk}>
            <Text style={[styles.buttonText, styles.buttonTextActive]}>
              Join Walk
            </Text>
            <Ionicons
              name="enter"
              size={16}
              color="#fff"
              style={styles.buttonIcon}
            />
          </TouchableOpacity>
        )}

        {showRSVPButton && isUpcoming && !isActiveOrStartingSoon && (
          <TouchableOpacity
            style={[
              styles.rsvpButton,
              isRSVPed ? styles.rsvpButtonActive : styles.rsvpButtonInactive,
            ]}
            onPress={handleRSVP}
          >
            <Text
              style={[
                styles.buttonText,
                isRSVPed ? styles.buttonTextActive : styles.buttonTextInactive,
              ]}
            >
              {isRSVPed ? "RSVP'd" : "RSVP"}
            </Text>
            {isRSVPed && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color="#fff"
                style={styles.buttonIcon}
              />
            )}
          </TouchableOpacity>
        )}

        {isToday && !isPast && walk.active && !isActiveOrStartingSoon && (
          <TouchableOpacity
            style={styles.checkInButton}
            onPress={handleCheckIn}
          >
            <Text style={styles.buttonText}>Check In</Text>
            <Ionicons
              name="enter"
              size={16}
              color="#fff"
              style={styles.buttonIcon}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateTimeContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  date: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.text,
    marginRight: 8,
  },
  time: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },
  detailsContainer: {
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: COLORS.text,
    marginLeft: 6,
    flex: 1,
  },
  organizerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  organizer: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 4,
  },
  statText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  rsvpButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginLeft: 8,
  },
  rsvpButtonActive: {
    backgroundColor: COLORS.primary,
  },
  rsvpButtonInactive: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  checkInButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.success,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginLeft: 8,
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.action,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  buttonTextActive: {
    color: "#fff",
  },
  buttonTextInactive: {
    color: COLORS.primary,
  },
  buttonIcon: {
    marginLeft: 4,
  },
});

export default WalkCard;
