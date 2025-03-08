import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useAuth } from "../context/AuthContext";

export const AdminButton = () => {
  const router = useRouter();
  const { user } = useAuth();

  if (!user?.isAdmin) return null;

  return (
    <TouchableOpacity
      style={styles.adminButton}
      onPress={() => router.push("/(admin)/")}
    >
      <Text style={styles.adminButtonText}>Admin</Text>
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
