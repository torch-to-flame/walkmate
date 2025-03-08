import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Formik } from 'formik';
import * as Yup from 'yup';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { useWalk } from '../../context/WalkContext'; // Import the WalkContext

// Create a validation schema using Yup
const WalkSchema = Yup.object().shape({
  location: Yup.object().shape({
    name: Yup.string().required('Location is required'),
    placeId: Yup.string().required('Valid location is required'),
    latitude: Yup.number().required('Location coordinates are required'),
    longitude: Yup.number().required('Location coordinates are required'),
  }),
  date: Yup.date().required('Date is required').min(new Date(), 'Date must be in the future'),
  durationMinutes: Yup.number()
    .required('Duration is required')
    .min(15, 'Duration must be at least 15 minutes')
    .max(240, 'Duration cannot exceed 4 hours'),
  numberOfRotations: Yup.number()
    .required('Number of rotations is required')
    .min(1, 'Must have at least 1 rotation')
    .max(10, 'Cannot exceed 10 rotations'),
});

interface WalkFormValues {
  location: {
    name: string;
    placeId: string;
    latitude: number;
    longitude: number;
  };
  date: Date;
  durationMinutes: number;
  numberOfRotations: number;
}

export default function NewWalkScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { createWalk } = useWalk(); // Get the createWalk function from WalkContext
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const initialValues: WalkFormValues = {
    location: {
      name: '',
      placeId: '',
      latitude: 0,
      longitude: 0,
    },
    date: new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // Default to tomorrow
    durationMinutes: 60, // Default to 60 minutes
    numberOfRotations: 3, // Default to 3 rotations
  };

  const handleSubmit = async (values: WalkFormValues) => {
    try {
      // Use the createWalk function from WalkContext
      await createWalk({
        location: values.location,
        date: values.date,
        durationMinutes: values.durationMinutes,
        numberOfRotations: values.numberOfRotations,
      });

      Alert.alert('Success', 'New walk created successfully!');
      router.back();
    } catch (error) {
      console.error('Error creating walk:', error);
      Alert.alert('Error', 'Failed to create walk. Please try again.');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      
      <View style={styles.formContainer}>
        <Formik
          initialValues={initialValues}
          validationSchema={WalkSchema}
          onSubmit={handleSubmit}
        >
          {({ handleSubmit, values, setFieldValue, errors, touched, isSubmitting }) => (
            <View>
              <Text style={styles.sectionTitle}>Walk Location</Text>
              <View style={styles.inputContainer}>
                <GooglePlacesAutocomplete
                  placeholder="Search for a location"
                  fetchDetails={true}
                  onPress={(data, details = null) => {
                    if (details) {
                      setFieldValue('location', {
                        name: data.description,
                        placeId: data.place_id,
                        latitude: details.geometry.location.lat,
                        longitude: details.geometry.location.lng,
                      });
                    }
                  }}
                  query={{
                    key: 'YOUR_GOOGLE_API_KEY', // Replace with your Google API key
                    language: 'en',
                  }}
                  styles={{
                    container: {
                      flex: 0,
                    },
                    textInputContainer: {
                      backgroundColor: 'rgba(0,0,0,0)',
                      borderTopWidth: 0,
                      borderBottomWidth: 0,
                    },
                    textInput: {
                      marginLeft: 0,
                      marginRight: 0,
                      height: 45,
                      color: '#5d5d5d',
                      fontSize: 16,
                      borderWidth: 1,
                      borderColor: '#ddd',
                      borderRadius: 8,
                    },
                    predefinedPlacesDescription: {
                      color: '#1faadb',
                    },
                    listView: {
                      backgroundColor: 'white',
                      borderRadius: 8,
                      marginTop: 5,
                    },
                  }}
                />
                {errors.location && touched.location && (
                  <Text style={styles.errorText}>{errors.location.name}</Text>
                )}
              </View>

              <Text style={styles.sectionTitle}>Walk Date & Time</Text>
              <View style={styles.dateTimeContainer}>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#666" />
                  <Text style={styles.datePickerText}>
                    {formatDate(values.date)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Ionicons name="time-outline" size={20} color="#666" />
                  <Text style={styles.datePickerText}>
                    {formatTime(values.date)}
                  </Text>
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={values.date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) {
                      const newDate = new Date(selectedDate);
                      // Preserve the time from the existing date
                      newDate.setHours(values.date.getHours());
                      newDate.setMinutes(values.date.getMinutes());
                      setFieldValue('date', newDate);
                    }
                  }}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={values.date}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowTimePicker(false);
                    if (selectedDate) {
                      const newDate = new Date(selectedDate);
                      // Preserve the date from the existing date
                      newDate.setFullYear(values.date.getFullYear());
                      newDate.setMonth(values.date.getMonth());
                      newDate.setDate(values.date.getDate());
                      setFieldValue('date', newDate);
                    }
                  }}
                />
              )}

              {errors.date && touched.date && (
                <Text style={styles.errorText}>{errors.date}</Text>
              )}

              <Text style={styles.sectionTitle}>Walk Duration</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={values.durationMinutes.toString()}
                  onChangeText={(text) => {
                    const numValue = parseInt(text) || 0;
                    setFieldValue('durationMinutes', numValue);
                  }}
                  keyboardType="number-pad"
                  placeholder="Enter duration in minutes"
                />
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
                    setFieldValue('numberOfRotations', numValue);
                  }}
                  keyboardType="number-pad"
                  placeholder="Enter number of rotations"
                />
                {errors.numberOfRotations && touched.numberOfRotations && (
                  <Text style={styles.errorText}>{errors.numberOfRotations}</Text>
                )}
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => router.back()}
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
                    <Text style={styles.submitButtonText}>Create Walk</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Formik>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 16,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 0.48,
  },
  datePickerText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  errorText: {
    color: '#EA4335',
    fontSize: 14,
    marginTop: 4,
  },
  input: {
    height: 45,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 0.48,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  submitButton: {
    flex: 0.48,
    backgroundColor: '#34A853',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
