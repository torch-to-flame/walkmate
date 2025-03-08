import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  TextInput,
} from "react-native";
import { Formik } from "formik";
import * as Yup from "yup";
import DateTimePicker from "@react-native-community/datetimepicker";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";
import { Ionicons } from "@expo/vector-icons";
import { Picker } from '@react-native-picker/picker';

// Create a validation schema using Yup
export const WalkSchema = Yup.object().shape({
  location: Yup.object().shape({
    name: Yup.string().required("Location is required"),
    placeId: Yup.string().required("Valid location is required"),
    latitude: Yup.number().required("Location coordinates are required"),
    longitude: Yup.number().required("Location coordinates are required"),
  }),
  date: Yup.date()
    .required("Date is required")
    .min(new Date(), "Date must be in the future"),
  durationMinutes: Yup.number()
    .required("Duration is required")
    .min(15, "Duration must be at least 15 minutes")
    .max(240, "Duration cannot exceed 4 hours"),
  numberOfRotations: Yup.number()
    .required("Number of rotations is required")
    .min(1, "Must have at least 1 rotation")
    .max(10, "Cannot exceed 10 rotations"),
  active: Yup.boolean(),
  organizer: Yup.string().required("Organizer name is required"),
});

export interface WalkFormValues {
  location: {
    name: string;
    placeId: string;
    latitude: number;
    longitude: number;
  };
  date: Date;
  durationMinutes: number;
  numberOfRotations: number;
  active?: boolean;
  organizer?: string;
}

interface WalkFormProps {
  initialValues: WalkFormValues;
  onSubmit: (values: WalkFormValues) => Promise<void>;
  submitButtonText: string;
  onCancel: () => void;
  showActiveToggle?: boolean;
  googleApiKey: string;
}

export default function WalkForm({
  initialValues,
  onSubmit,
  submitButtonText,
  onCancel,
  showActiveToggle = false,
  googleApiKey,
}: WalkFormProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | 'duration' | null>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Helper function to handle opening pickers in a mutually exclusive way
  const openPicker = (mode: 'date' | 'time' | 'duration') => {
    // Close any open picker first
    setShowDatePicker(false);
    setShowTimePicker(false);
    setShowDurationPicker(false);
    
    // Set the new picker mode
    setPickerMode(mode);
    
    // Open the requested picker
    if (mode === 'date') setShowDatePicker(true);
    if (mode === 'time') setShowTimePicker(true);
    if (mode === 'duration') setShowDurationPicker(true);
  };

  // Helper function to close all pickers
  const closePickers = () => {
    setShowDatePicker(false);
    setShowTimePicker(false);
    setShowDurationPicker(false);
    setPickerMode(null);
  };

  return (
    <View style={styles.formContainer}>
      <Formik
        initialValues={initialValues}
        validationSchema={WalkSchema}
        onSubmit={onSubmit}
        enableReinitialize
      >
        {({
          handleSubmit,
          values,
          setFieldValue,
          errors,
          touched,
          isSubmitting,
        }) => (
          <View>
            <Text style={styles.sectionTitle}>Walk Location</Text>
            <View style={styles.inputContainer}>
              <GooglePlacesAutocomplete
                placeholder="Search for a location"
                fetchDetails={true}
                onPress={(data, details = null) => {
                  if (details) {
                    setFieldValue("location", {
                      name: data.description,
                      placeId: data.place_id,
                      latitude: details.geometry.location.lat,
                      longitude: details.geometry.location.lng,
                    });
                  }
                }}
                query={{
                  key: googleApiKey,
                  language: "en",
                }}
                predefinedPlaces={
                  values.location?.name
                    ? [
                        {
                          description: values.location.name,
                          geometry: {
                            location: {
                              lat: values.location.latitude,
                              lng: values.location.longitude,
                            },
                          },
                        },
                      ]
                    : []
                }
                styles={{
                  container: {
                    flex: 0,
                  },
                  textInputContainer: {
                    backgroundColor: "rgba(0,0,0,0)",
                    borderTopWidth: 0,
                    borderBottomWidth: 0,
                  },
                  textInput: {
                    marginLeft: 0,
                    marginRight: 0,
                    height: 45,
                    color: "#5d5d5d",
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: "#ddd",
                    borderRadius: 8,
                  },
                  predefinedPlacesDescription: {
                    color: "#1faadb",
                  },
                  listView: {
                    backgroundColor: "white",
                    borderRadius: 8,
                    marginTop: 5,
                  },
                }}
              />
              {errors.location && touched.location && (
                <Text style={styles.errorText}>{errors.location.name}</Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>Walk Organizer</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={values.organizer}
                onChangeText={(text) => setFieldValue("organizer", text)}
                placeholder="Enter organizer name"
              />
              {errors.organizer && touched.organizer && (
                <Text style={styles.errorText}>{errors.organizer}</Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>Walk Date & Time</Text>
            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => openPicker('date')}
              >
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.datePickerText}>
                  {formatDate(values.date)}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => openPicker('time')}
              >
                <Ionicons name="time-outline" size={20} color="#666" />
                <Text style={styles.datePickerText}>
                  {formatTime(values.date)}
                </Text>
              </TouchableOpacity>
            </View>

            {pickerMode === 'date' && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={values.date}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      const newDate = new Date(selectedDate);
                      // Preserve the time from the existing date
                      newDate.setHours(values.date.getHours());
                      newDate.setMinutes(values.date.getMinutes());
                      setFieldValue("date", newDate);
                    }
                    if (Platform.OS === "android") {
                      closePickers();
                    }
                  }}
                />
                {Platform.OS === "ios" && (
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={closePickers}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {pickerMode === 'time' && (
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={values.date}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) {
                      const newDate = new Date(selectedDate);
                      // Preserve the date from the existing date
                      newDate.setFullYear(values.date.getFullYear());
                      newDate.setMonth(values.date.getMonth());
                      newDate.setDate(values.date.getDate());
                      setFieldValue("date", newDate);
                    }
                    if (Platform.OS === "android") {
                      closePickers();
                    }
                  }}
                />
                {Platform.OS === "ios" && (
                  <TouchableOpacity
                    style={styles.doneButton}
                    onPress={closePickers}
                  >
                    <Text style={styles.doneButtonText}>Done</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {errors.date && touched.date && (
              <Text style={styles.errorText}>{errors.date}</Text>
            )}

            <Text style={styles.sectionTitle}>Walk Duration</Text>
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => openPicker('duration')}
              >
                <Ionicons name="hourglass-outline" size={20} color="#666" />
                <Text style={styles.datePickerText}>
                  {formatDuration(values.durationMinutes)}
                </Text>
              </TouchableOpacity>

              {pickerMode === 'duration' && (
                <View style={styles.pickerContainer}>
                  {Platform.OS === "ios" && (
                    <>
                      <View style={styles.durationPickerWrapper}>
                        {/* Custom picker for hours */}
                        <View style={styles.durationPickerColumn}>
                          <Text style={styles.durationPickerLabel}>Hours</Text>
                          <Picker
                            selectedValue={Math.floor(values.durationMinutes / 60)}
                            style={styles.durationPicker}
                            onValueChange={(itemValue) => {
                              const totalMinutes = (itemValue * 60) + (values.durationMinutes % 60);
                              setFieldValue("durationMinutes", totalMinutes);
                            }}
                          >
                            {Array.from({ length: 5 }, (_, i) => (
                              <Picker.Item key={`hour-${i}`} label={`${i}`} value={i} />
                            ))}
                          </Picker>
                        </View>
                        
                        {/* Custom picker for minutes */}
                        <View style={styles.durationPickerColumn}>
                          <Text style={styles.durationPickerLabel}>Minutes</Text>
                          <Picker
                            selectedValue={values.durationMinutes % 60}
                            style={styles.durationPicker}
                            onValueChange={(itemValue) => {
                              const totalMinutes = (Math.floor(values.durationMinutes / 60) * 60) + itemValue;
                              setFieldValue("durationMinutes", totalMinutes);
                            }}
                          >
                            {Array.from({ length: 60 }, (_, i) => (
                              <Picker.Item key={`minute-${i}`} label={`${i}`} value={i} />
                            ))}
                          </Picker>
                        </View>
                      </View>
                      
                      <TouchableOpacity
                        style={styles.doneButton}
                        onPress={closePickers}
                      >
                        <Text style={styles.doneButtonText}>Done</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  
                  {Platform.OS === "android" && (
                    <View>
                      <Text style={styles.durationPickerLabel}>Select Duration</Text>
                      <View style={styles.androidDurationContainer}>
                        <View style={styles.androidDurationPickerWrapper}>
                          <Text style={styles.androidDurationLabel}>Hours</Text>
                          <Picker
                            selectedValue={Math.floor(values.durationMinutes / 60)}
                            style={styles.androidDurationPicker}
                            onValueChange={(itemValue) => {
                              const totalMinutes = (itemValue * 60) + (values.durationMinutes % 60);
                              setFieldValue("durationMinutes", totalMinutes);
                            }}
                          >
                            {Array.from({ length: 5 }, (_, i) => (
                              <Picker.Item key={`hour-${i}`} label={`${i}`} value={i} />
                            ))}
                          </Picker>
                        </View>
                        
                        <View style={styles.androidDurationPickerWrapper}>
                          <Text style={styles.androidDurationLabel}>Minutes</Text>
                          <Picker
                            selectedValue={values.durationMinutes % 60}
                            style={styles.androidDurationPicker}
                            onValueChange={(itemValue) => {
                              const totalMinutes = (Math.floor(values.durationMinutes / 60) * 60) + itemValue;
                              setFieldValue("durationMinutes", totalMinutes);
                            }}
                          >
                            {Array.from({ length: 60 }, (_, i) => (
                              <Picker.Item key={`minute-${i}`} label={`${i}`} value={i} />
                            ))}
                          </Picker>
                        </View>
                      </View>
                      
                      <TouchableOpacity
                        style={styles.doneButton}
                        onPress={closePickers}
                      >
                        <Text style={styles.doneButtonText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}

              {errors.durationMinutes && touched.durationMinutes && (
                <Text style={styles.errorText}>{errors.durationMinutes}</Text>
              )}
            </View>

            <Text style={styles.sectionTitle}>Number of Rotations</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={values.numberOfRotations.toString()}
                onChangeText={(text) => {
                  const numValue = parseInt(text) || 0;
                  setFieldValue("numberOfRotations", numValue);
                }}
                keyboardType="numeric"
                placeholder="Enter number of rotations"
              />
              {errors.numberOfRotations && touched.numberOfRotations && (
                <Text style={styles.errorText}>{errors.numberOfRotations}</Text>
              )}
            </View>

            {showActiveToggle && (
              <>
                <Text style={styles.sectionTitle}>Walk Status</Text>
                <View style={styles.statusContainer}>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      values.active ? styles.activeButton : styles.inactiveButton,
                    ]}
                    onPress={() => setFieldValue("active", !values.active)}
                  >
                    <Text style={styles.statusButtonText}>
                      {values.active ? "Active" : "Inactive"}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.statusHelpText}>
                    {values.active
                      ? "This walk is currently active. Users can join it."
                      : "This walk is inactive. Users cannot join it."}
                  </Text>
                </View>
              </>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                disabled={isSubmitting}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={() => handleSubmit()}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitButtonText}>{submitButtonText}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Formik>
    </View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 16,
    color: "#333",
  },
  inputContainer: {
    marginBottom: 16,
  },
  dateTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    flex: 0.48,
  },
  datePickerText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#333",
  },
  pickerContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  doneButton: {
    alignSelf: "flex-end",
    padding: 8,
    marginTop: 8,
  },
  doneButtonText: {
    color: "#4285F4",
    fontSize: 16,
    fontWeight: "bold",
  },
  durationPickerWrapper: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  durationPickerColumn: {
    alignItems: "center",
    width: "45%",
  },
  durationPickerLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
    textAlign: "center",
  },
  durationPicker: {
    width: 120,
    height: 180,
  },
  androidDurationContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  androidDurationPickerWrapper: {
    alignItems: "center",
    width: "45%",
  },
  androidDurationLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  androidDurationPicker: {
    width: 120,
    height: 80,
  },
  statusContainer: {
    marginBottom: 24,
  },
  statusButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 8,
  },
  activeButton: {
    backgroundColor: "#34A853",
  },
  inactiveButton: {
    backgroundColor: "#EA4335",
  },
  statusButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  statusHelpText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  errorText: {
    color: "#EA4335",
    fontSize: 14,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  cancelButton: {
    flex: 0.48,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButton: {
    flex: 0.48,
    backgroundColor: "#4285F4",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    height: 45,
    color: "#5d5d5d",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
  },
});
