import storage from "@react-native-firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { useFlashMessage } from "../context/FlashMessageContext";
import { useUpdates } from "../context/UpdatesContext";

export default function ProfileScreen() {
  const { user, loading, refreshToken, signOut, updateUserProfile } = useAuth();
  const { showMessage } = useFlashMessage();
  const { 
    checkForUpdate, 
    isCheckingForUpdate, 
    updateAvailable, 
    applyUpdate, 
    isApplyingUpdate 
  } = useUpdates();
  const [name, setName] = useState(user?.name || "");
  const [aboutMe, setAboutMe] = useState(user?.aboutMe || "");
  const [profilePicUrl, setProfilePicUrl] = useState(user?.profilePicUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Function to handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // First refresh the token
      await refreshToken();
      
      // Then check for updates
      await checkForUpdate();
    } catch (error) {
      // Error handling is done inside the functions
      console.error("Error during refresh:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refreshToken, checkForUpdate]);

  const pickImage = async () => {
    try {
      // Request permission
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Sorry, we need camera roll permissions to make this work!"
        );
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        await uploadImage(selectedImage.uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      showMessage("Failed to pick image", "error");
    }
  };

  const uploadImage = async (uri: string) => {
    if (!user) return;

    try {
      setIsSaving(true);

      // Create a reference to the file in Firebase Storage
      const filename = `profile_pictures/${user.id}/${Date.now()}.jpg`;
      const reference = storage().ref(filename);

      // Convert URI to blob for React Native
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload the file
      await reference.put(blob);

      // Get the download URL
      const downloadUrl = await reference.getDownloadURL();

      // Update the state
      setProfilePicUrl(downloadUrl);

      // Update the user profile in Firestore using the context function
      await updateUserProfile({ profilePicUrl: downloadUrl });

      showMessage("Profile picture updated successfully", "success");
    } catch (error) {
      console.error("Error uploading image:", error);
      showMessage("Failed to upload image", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    const updates: Partial<{ name: string; aboutMe: string }> = {};

    if (name !== user?.name) updates.name = name;
    if (aboutMe !== user?.aboutMe) updates.aboutMe = aboutMe;

    if (Object.keys(updates).length > 0) {
      try {
        setIsSaving(true);
        await updateUserProfile(updates);
      } catch (error) {
        console.error("Error saving profile:", error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!user) {
    return null; // Will redirect in _layout.tsx
  }

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isCheckingForUpdate}
            onRefresh={onRefresh}
            colors={["#4285F4"]}
            tintColor="#4285F4"
            title="Pull to refresh & check for updates"
            titleColor="#4285F4"
          />
        }
      >
        <StatusBar style="auto" />

        {updateAvailable && (
          <View style={styles.updateBanner}>
            <Text style={styles.updateText}>Update available!</Text>
            <TouchableOpacity
              style={[styles.button, styles.updateButton, isApplyingUpdate && styles.disabledButton]}
              onPress={applyUpdate}
              disabled={isApplyingUpdate}
            >
              {isApplyingUpdate ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Restart & Update</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.profileImageContainer}>
          <TouchableOpacity onPress={pickImage}>
            {profilePicUrl ? (
              <Image
                source={{ uri: profilePicUrl }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImagePlaceholderText}>
                  {name ? name.charAt(0).toUpperCase() : "U"}
                </Text>
              </View>
            )}
            <View style={styles.editIconContainer}>
              <Text style={styles.editIconText}>✏️</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
          />

          <Text style={styles.label}>About Me</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={aboutMe}
            onChangeText={setAboutMe}
            placeholder="Tell us about yourself"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={user.email}
            editable={false}
          />

          <TouchableOpacity
            style={[
              styles.button,
              styles.saveButton,
              isSaving && styles.disabledButton,
            ]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.signOutButton]}
            onPress={signOut}
          >
            <Text style={styles.buttonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    backgroundColor: "#fff",
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  updateBanner: {
    backgroundColor: "#d1ecf1",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: "column",
    alignItems: "center",
    borderLeftWidth: 5,
    borderLeftColor: "#17a2b8",
  },
  updateText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0c5460",
    marginBottom: 10,
  },
  updateButton: {
    backgroundColor: "#17a2b8",
    width: "100%",
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#4285F4",
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#4285F4",
  },
  profileImagePlaceholderText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#4285F4",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  editIconText: {
    fontSize: 16,
  },
  formContainer: {
    width: "100%",
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  disabledInput: {
    backgroundColor: "#e9e9e9",
    color: "#666",
  },
  button: {
    width: "100%",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
  },
  saveButton: {
    backgroundColor: "#4285F4",
    marginTop: 20,
  },
  signOutButton: {
    backgroundColor: "#EA4335",
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
