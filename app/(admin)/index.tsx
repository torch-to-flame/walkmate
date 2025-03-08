import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useWalk } from '../../context/WalkContext';
import { db } from '../../firebase';
import { Walk } from '../../types';

export default function AdminScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { currentWalk, loading: walkLoading, rotatePairs } = useWalk();
  const [walks, setWalks] = useState<Walk[]>([]);
  const [loadingWalks, setLoadingWalks] = useState(true);

  useEffect(() => {
    if (!user?.isAdmin) return;

    const fetchWalks = async () => {
      try {
        const walksSnapshot = await db
          .collection('walks')
          .orderBy('date', 'desc')
          .limit(20)
          .get();

        const walksData = walksSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date.toDate(),
          } as Walk;
        });

        setWalks(walksData);
      } catch (error) {
        console.error('Error fetching walks:', error);
      } finally {
        setLoadingWalks(false);
      }
    };

    fetchWalks();
  }, [user]);

  const handleRotatePairs = async () => {
    try {
      await rotatePairs();
      Alert.alert('Success', 'Pairs rotated successfully!');
    } catch (error) {
      console.error('Error rotating pairs:', error);
      Alert.alert('Error', 'Failed to rotate pairs. Please try again.');
    }
  };

  const handleDeleteWalk = async (walkId: string) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this walk? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await db.collection('walks').doc(walkId).delete();
              setWalks(walks.filter(walk => walk.id !== walkId));
              Alert.alert('Success', 'Walk deleted successfully!');
            } catch (error) {
              console.error('Error deleting walk:', error);
              Alert.alert('Error', 'Failed to delete walk. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderWalkItem = ({ item }: { item: Walk }) => {
    const isActive = item.active;
    
    return (
      <View style={[styles.walkItem, isActive && styles.activeWalkItem]}>
        <View style={styles.walkInfo}>
          <Text style={styles.walkDate}>
            {item.date.toLocaleDateString()} {item.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={styles.walkStatus}>
            {isActive ? 'Active' : 'Inactive'} • {item.pairs.length} pairs
          </Text>
        </View>
        
        <View style={styles.walkActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push(`/(admin)/edit-walk/${item.id}`)}
          >
            <Ionicons name="create-outline" size={22} color="#4285F4" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleDeleteWalk(item.id)}
          >
            <Ionicons name="trash-outline" size={22} color="#EA4335" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (authLoading || walkLoading || loadingWalks) {
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
    <View style={styles.container}>
      <StatusBar style="auto" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Manage Walks</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => router.push('/(admin)/new-walk')}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.createButtonText}>New Walk</Text>
        </TouchableOpacity>
      </View>
      
      {currentWalk && (
        <View style={styles.currentWalkContainer}>
          <Text style={styles.currentWalkTitle}>Current Active Walk</Text>
          <Text style={styles.currentWalkDate}>
            {currentWalk.date.toLocaleDateString()} {currentWalk.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          <Text style={styles.currentWalkPairs}>
            Pairs: {currentWalk.pairs.length}
          </Text>
          
          <TouchableOpacity 
            style={styles.rotateButton} 
            onPress={handleRotatePairs}
          >
            <Ionicons name="shuffle" size={20} color="white" />
            <Text style={styles.buttonText}>Rotate Pairs</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={styles.walksListContainer}>
        <Text style={styles.sectionTitle}>Recent Walks</Text>
        
        {walks.length > 0 ? (
          <FlatList
            data={walks}
            renderItem={renderWalkItem}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.walksList}
          />
        ) : (
          <Text style={styles.emptyText}>No walks found</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: '#34A853',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  currentWalkContainer: {
    backgroundColor: 'white',
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  currentWalkTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  currentWalkDate: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  currentWalkPairs: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  rotateButton: {
    backgroundColor: '#4285F4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  walksListContainer: {
    flex: 1,
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  walksList: {
    paddingBottom: 20,
  },
  walkItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  activeWalkItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#34A853',
  },
  walkInfo: {
    flex: 1,
  },
  walkDate: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  walkStatus: {
    fontSize: 14,
    color: '#666',
  },
  walkActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
    fontStyle: 'italic',
  },
});
