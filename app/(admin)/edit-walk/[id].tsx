import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Alert, ScrollView, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../../context/AuthContext';
import { db } from '../../../firebase';
import { Walk } from '../../../types';
import WalkForm, { WalkFormValues } from '../../../components/WalkForm';

export default function EditWalkScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [walk, setWalk] = useState<Walk | null>(null);
  const [loading, setLoading] = useState(true);

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
      if (!walk) return;

      const walkRef = db.collection("walks").doc(walk.id);
      await walkRef.update({
        location: values.location,
        date: values.date,
        active: values.active,
        durationMinutes: values.durationMinutes,
        numberOfRotations: values.numberOfRotations,
        organizer: values.organizer,
      });

      Alert.alert("Success", "Walk updated successfully!");
      router.back();
    } catch (error) {
      console.error("Error updating walk:", error);
      Alert.alert("Error", "Failed to update walk. Please try again.");
    }
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
    location: walk?.location || {
      name: "",
      placeId: "",
      latitude: 0,
      longitude: 0,
    },
    date: walk?.date || new Date(),
    durationMinutes: walk?.durationMinutes || 60,
    numberOfRotations: walk?.numberOfRotations || 3,
    active: walk?.active || false,
    organizer: walk?.organizer || user?.name || "",
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <StatusBar style="auto" />
      <WalkForm
        initialValues={initialValues}
        onSubmit={handleSubmit}
        submitButtonText="Update Walk"
        onCancel={() => router.back()}
        showActiveToggle={true}
        googleApiKey="AIzaSyCVRcp8LoR83nVd-ur3kEQ6MdOYMBevHhk"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
