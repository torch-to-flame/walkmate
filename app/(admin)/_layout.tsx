import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Alert, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function AdminLayout() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/signin');
    } else if (!loading && user && !user.isAdmin) {
      Alert.alert('Unauthorized', 'You do not have permission to access this page.');
      router.replace('/');
    }
  }, [user, loading, router]);

  if (!user?.isAdmin) {
    return null; // Will redirect from useEffect
  }

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginLeft: 10 }}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Admin Panel',
        }}
      />
      <Stack.Screen
        name="new-walk"
        options={{
          title: 'Create New Walk',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="edit-walk/[id]"
        options={{
          title: 'Edit Walk',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
