import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { useAuth } from "../context/AuthContext";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState<"Younger" | "Older" | "">("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    if (!name || !email || !password || !age) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      await signUp(email, password, {
        name,
        age: age as "Younger" | "Older",
        location,
      });
      router.replace("/");
    } catch (error) {
      Alert.alert("Error", "Failed to create account");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const goToSignIn = () => {
    router.push("/signin");
  };

  return (
    <LinearGradient
      colors={["#4c669f", "#3b5998", "#192f6a"]}
      style={styles.gradientContainer}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity style={styles.backButton} onPress={goToSignIn}>
              <Text style={styles.backButtonText}>← Sign In</Text>
            </TouchableOpacity>

            <View style={styles.container}>
              <Text style={styles.title}>Create Your WalkMate Account</Text>

              <View style={styles.card}>
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your name"
                    value={name}
                    onChangeText={setName}
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Create a password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Age Group</Text>
                  <View style={styles.ageContainer}>
                    <TouchableOpacity
                      style={[
                        styles.ageButton,
                        age === "Younger" && styles.selectedAgeButton,
                      ]}
                      onPress={() => setAge("Younger")}
                    >
                      <Text
                        style={[
                          styles.ageButtonText,
                          age === "Younger" && styles.selectedAgeButtonText,
                        ]}
                      >
                        Younger
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.ageButton,
                        age === "Older" && styles.selectedAgeButton,
                      ]}
                      onPress={() => setAge("Older")}
                    >
                      <Text
                        style={[
                          styles.ageButtonText,
                          age === "Older" && styles.selectedAgeButtonText,
                        ]}
                      >
                        Older
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Location</Text>
                  <GooglePlacesAutocomplete
                    placeholder="Search for your location"
                    onPress={(data, details = null) => {
                      setLocation(data.description);
                    }}
                    query={{
                      key: "AIzaSyCVRcp8LoR83nVd-ur3kEQ6MdOYMBevHhk",
                      language: "en",
                    }}
                    styles={{
                      textInputContainer: styles.placesInputContainer,
                      textInput: styles.placesInput,
                      listView: styles.placesList,
                      row: styles.placesRow,
                      description: styles.placesDescription,
                    }}
                  />
                </View>

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleSignUp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Sign Up</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={styles.footerText}>
                    Already have an account?{" "}
                  </Text>
                  <TouchableOpacity onPress={goToSignIn}>
                    <Text style={styles.link}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  backButton: {
    marginLeft: 20,
    marginTop: 20,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "white",
    marginTop: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: "600",
    color: "#333",
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  ageContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  ageButton: {
    flex: 1,
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 5,
    backgroundColor: "#f9f9f9",
  },
  selectedAgeButton: {
    backgroundColor: "#4285F4",
    borderColor: "#4285F4",
  },
  ageButtonText: {
    fontSize: 16,
    color: "#333",
  },
  selectedAgeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  placesInputContainer: {
    width: "100%",
  },
  placesInput: {
    height: 50,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  placesList: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "white",
    zIndex: 1000,
    marginTop: 5,
  },
  placesRow: {
    padding: 13,
    height: "auto",
    backgroundColor: "white",
  },
  placesDescription: {
    fontSize: 14,
  },
  button: {
    backgroundColor: "#4285F4",
    width: "100%",
    height: 55,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  footer: {
    flexDirection: "row",
    marginTop: 20,
    justifyContent: "center",
  },
  footerText: {
    fontSize: 15,
    color: "#666",
  },
  link: {
    fontSize: 15,
    color: "#4285F4",
    fontWeight: "bold",
  },
});
