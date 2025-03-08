import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import { useWalk } from '../../context/WalkContext';

// Countdown component to show time until next rotation
const RotationCountdown = ({ walk }) => {
  const [timeRemaining, setTimeRemaining] = useState({ minutes: 0, seconds: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!walk) return;

    const calculateTimeRemaining = () => {
      // Calculate rotation interval in milliseconds
      const rotationInterval = (walk.durationMinutes / walk.numberOfRotations) * 60 * 1000;
      
      // Get the time of the last rotation
      const lastRotationTime = walk.lastRotationTime.toDate().getTime();
      
      // Calculate when the next rotation should happen
      const nextRotationTime = lastRotationTime + rotationInterval;
      
      // Calculate time remaining
      const now = new Date().getTime();
      const timeLeft = Math.max(0, nextRotationTime - now);
      
      // Convert to minutes and seconds
      const minutes = Math.floor(timeLeft / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
      
      setTimeRemaining({ minutes, seconds });
      setIsLoading(false);
    };

    // Calculate initially
    calculateTimeRemaining();
    
    // Update every second
    const interval = setInterval(calculateTimeRemaining, 1000);
    
    // Clean up
    return () => clearInterval(interval);
  }, [walk]);

  if (isLoading) {
    return <ActivityIndicator size="small" color="#0000ff" />;
  }

  // If we're at the last rotation, show a different message
  if (walk.currentRotation >= walk.numberOfRotations) {
    return (
      <View style={styles.countdownContainer}>
        <Text style={styles.countdownLabel}>Final rotation complete</Text>
      </View>
    );
  }

  return (
    <View style={styles.countdownContainer}>
      <Text style={styles.countdownLabel}>Next rotation in:</Text>
      <Text style={styles.countdownTime}>
        {timeRemaining.minutes}:{timeRemaining.seconds < 10 ? `0${timeRemaining.seconds}` : timeRemaining.seconds}
      </Text>
      <Text style={styles.rotationInfo}>
        Rotation {walk.currentRotation + 1} of {walk.numberOfRotations}
      </Text>
    </View>
  );
};

export default function WalkScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentWalk, loading: walkLoading, checkIn } = useWalk();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/signin');
    }
  }, [user, authLoading, router]);

  if (authLoading || walkLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!user) {
    return null; // Will redirect to signin
  }

  if (!currentWalk) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>No active walk available.</Text>
        <Text style={styles.subtitle}>Please check back later or contact an admin.</Text>
      </View>
    );
  }

  // Check if the user is checked in
  const isUserCheckedIn = currentWalk?.checkedInUsers?.includes(user?.id || '') || false;

  // Find the user's pair
  const userPair = currentWalk?.pairs.find((pair) =>
    pair.users.includes(user?.id || '')
  );

  // Get all users in the walk
  const allWalkUsers = currentWalk?.users || [];

  // Get the user's partner(s)
  const partners = userPair
    ? userPair.users
        .filter((userId) => userId !== user?.id)
        .map((userId) => allWalkUsers.find((u) => u.id === userId))
        .filter((u): u is User => u !== undefined)
    : [];

  if (!isUserCheckedIn) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Ready to join today's walk?</Text>
        <Text style={styles.subtitle}>Check in to get matched with a walking partner!</Text>
        <TouchableOpacity 
          style={styles.checkInButton} 
          onPress={() => {
            if (currentWalk) {
              checkIn(currentWalk.id);
            }
          }}
        >
          <Text style={styles.checkInButtonText}>Check In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!userPair) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>You're checked in!</Text>
        <Text style={styles.subtitle}>You'll be matched with a partner soon. Please wait for the next rotation.</Text>
        <RotationCountdown walk={currentWalk} />
      </View>
    );
  }

  // Get a more aesthetically pleasing color based on the assigned color
  const getEnhancedColor = (color) => {
    // Define nicer color palette with better contrast
    const colorMap = {
      'yellow': '#F9D949', // Softer yellow
      'red': '#E76F51',    // Coral red
      'blue': '#457B9D',   // Steel blue
      'green': '#2A9D8F',  // Teal green
      'purple': '#9B5DE5', // Lavender
      'orange': '#F4A261', // Light orange
      'pink': '#E07A5F',   // Terra cotta
      'cyan': '#48CAE4',   // Sky blue
    };
    
    return colorMap[color] || '#457B9D'; // Default to steel blue if color not found
  };
  
  const backgroundColor = getEnhancedColor(userPair.color);
  
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar style="auto" />
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Find Your Walking Partner{userPair.users.length > 2 ? 's' : ''}!</Text>
        
        <View style={styles.pairInfo}>
          <Text style={styles.pairNumber}>{userPair.number}</Text>
          {userPair.users.length > 2 && (
            <Text style={styles.tripleIndicator}>Group of {userPair.users.length}</Text>
          )}
        </View>
        
        <Text style={styles.instructions}>
          Look for {userPair.users.length > 2 ? 'others' : 'someone'} with the same number and color, and start walking together!
        </Text>
        
        <RotationCountdown walk={currentWalk} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 16,
    margin: 20,
    paddingVertical: 40,
    paddingHorizontal: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
  },
  pairInfo: {
    width: 150,
    height: 150,
    borderRadius: 75,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 30,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  pairNumber: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#333',
  },
  tripleIndicator: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  instructions: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
    color: '#333',
    marginBottom: 30,
  },
  checkInButton: {
    backgroundColor: '#2A9D8F',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  checkInButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  countdownContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    width: '100%',
  },
  countdownLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  countdownTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  rotationInfo: {
    fontSize: 14,
    color: '#555',
    marginTop: 5,
  },
});
