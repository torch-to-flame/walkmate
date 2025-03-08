import { router } from "expo-router";
import React from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useWalk } from "../context/WalkContext";
import { Walk } from "../types";
import WalkCard from "./WalkCard";

// App theme colors
const COLORS = {
  primary: "#4285F4",
  background: "#f8f8f8",
  card: "#ffffff",
  text: "#333333",
  textSecondary: "#666666",
};

const UpcomingWalks: React.FC = () => {
  const { upcomingWalks } = useWalk();

  if (upcomingWalks.length === 0) {
    return null;
  }

  const renderWalkItem = ({ item }: { item: Walk }) => {
    return <WalkCard walk={item} isUpcoming={true} />;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upcoming Walks</Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => router.push("/(tabs)/walks")}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={upcomingWalks.slice(0, 3)} // Show only the next 3 walks
        renderItem={renderWalkItem}
        keyExtractor={(item) => item.id}
        horizontal={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.text,
  },
  viewAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  viewAllText: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  listContent: {
    paddingBottom: 8,
  },
});

export default UpcomingWalks;
