import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Formik } from 'formik';
import * as Yup from 'yup';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { Walk } from '../../../types';

// Create a validation schema using Yup
const WalkSchema = Yup.object().shape({
  location: Yup.object().shape({
    name: Yup.string().required('Location is required'),
    placeId: Yup.string().required('Valid location is required'),
    latitude: Yup.number().required('Location coordinates are required'),
    longitude: Yup.number().required('Location coordinates are required'),
  }),
  date: Yup.date().required('Date is required'),
  active: Yup.boolean().required('Active status is required'),
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
  active: boolean;
  durationMinutes: number;
  numberOfRotations: number;
}

export default function EditWalkScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [walk, setWalk] = useState<Walk | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    const fetchWalk = async () => {
      try {
        const walkDoc = await db.collection('walks').doc(id as string).get();
        
        if (!walkDoc.exists) {
          Alert.alert('Error', 'Walk not found');
          router.back();
          return;
        }
        
        const walkData = walkDoc.data();
        setWalk({
          id: walkDoc.id,
          ...walkData,
          date: walkData.date.toDate(),
        } as Walk);
        
      } catch (error) {
        console.error('Error fetching walk:', error);
        Alert.alert('Error', 'Failed to load walk details');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchWalk();
    }
  }, [id, router]);

  const handleSubmit = async (values: WalkFormValues) => {
    try {
      // If changing active status to true, deactivate other walks
      if (values.active && (!walk?.active)) {
        const activeWalksSnapshot = await db
          .collection('walks')
          .where('active', '==', true)
          .get();
        
        const deactivatePromises = activeWalksSnapshot.docs
          .filter(doc => doc.id !== id) // Don't deactivate the current walk
          .map(doc => doc.ref.update({ active: false }));

        await Promise.all(deactivatePromises);
      }

      // Update the walk
      await db.collection('walks').doc(id as string).update({
        date: values.date,
        location: values.location,
        active: values.active,
        durationMinutes: values.durationMinutes,
        numberOfRotations: values.numberOfRotations,
      });

      Alert.alert('Success', 'Walk updated successfully!');
      router.back();
    } catch (error) {
      console.error('Error updating walk:', error);
      Alert.alert('Error', 'Failed to update walk. Please try again.');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (authLoading || loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!user?.isAdmin || !walk) {
    return null; // Will redirect from useEffect in layout or from fetchWalk
  }

  const initialValues: WalkFormValues = {
    location: walk.location || {
      name: '',
      placeId: '',
      latitude: 0,
      longitude: 0,
    },
    date: walk.date,
    active: walk.active,
    durationMinutes: walk.durationMinutes || 0,
    numberOfRotations: walk.numberOfRotations || 0,
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <StatusBar style="auto" />
      
      <View style={styles.formContainer}>
        <Formik
          initialValues={initialValues}
          validationSchema={WalkSchema}
          onSubmit={handleSubmit}
          enableReinitialize
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
                  predefinedPlaces={[
                    {
                      description: values.location?.name || '',
                      geometry: { location: { lat: values.location?.latitude, lng: values.location?.longitude } },
                    },
                  ]}
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
                <Text style={styles.label}>Duration (minutes)</Text>
                <TextInput
                  style={styles.input}
                  value={values.durationMinutes.toString()}
                  onChangeText={(text) => setFieldValue('durationMinutes', parseInt(text, 10))}
                  keyboardType="numeric"
                />
                {errors.durationMinutes && touched.durationMinutes && (
                  <Text style={styles.errorText}>{errors.durationMinutes}</Text>
                )}
              </View>

              <Text style={styles.sectionTitle}>Number of Rotations</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Number of Rotations</Text>
                <TextInput
                  style={styles.input}
                  value={values.numberOfRotations.toString()}
                  onChangeText={(text) => setFieldValue('numberOfRotations', parseInt(text, 10))}
                  keyboardType="numeric"
                />
                {errors.numberOfRotations && touched.numberOfRotations && (
                  <Text style={styles.errorText}>{errors.numberOfRotations}</Text>
                )}
              </View>

              <Text style={styles.sectionTitle}>Walk Status</Text>
              <View style={styles.statusContainer}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    values.active ? styles.activeButton : styles.inactiveButton,
                  ]}
                  onPress={() => setFieldValue('active', !values.active)}
                >
                  <Text style={styles.statusButtonText}>
                    {values.active ? 'Active' : 'Inactive'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.statusHelpText}>
                  {values.active
                    ? 'This walk is currently active. Users can join it.'
                    : 'This walk is inactive. Users cannot join it.'}
                </Text>
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
                    <Text style={styles.submitButtonText}>Update Walk</Text>
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
  statusContainer: {
    marginBottom: 24,
  },
  statusButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  activeButton: {
    backgroundColor: '#34A853',
  },
  inactiveButton: {
    backgroundColor: '#EA4335',
  },
  statusButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusHelpText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  errorText: {
    color: '#EA4335',
    fontSize: 14,
    marginTop: 4,
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
    backgroundColor: '#4285F4',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  input: {
    height: 45,
    color: '#5d5d5d',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
});
