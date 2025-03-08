import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export const ProfileButton = () => {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <TouchableOpacity
      style={styles.profileButton}
      onPress={() => router.push("/profile")}
    >
      {user.profilePicUrl ? (
        <Image
          source={{ uri: user.profilePicUrl }}
          style={styles.profileImage}
        />
      ) : (
        <View style={styles.profilePlaceholder}>
          <Text style={styles.profileInitial}>
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  adminButton: {
    backgroundColor: "#34A853",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginLeft: 8,
  },
  adminButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  profileButton: {
    marginRight: 8,
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#fff",
  },
  profilePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4285F4",
  },
});
