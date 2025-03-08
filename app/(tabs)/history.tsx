import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { format } from 'date-fns';

interface HistoryWalk {
  id: string;
  date: Date;
  walkName: string;
  durationMinutes: number;
  numberOfRotations: number;
  partners: {
    name: string;
    id: string;
  }[];
  colors: string[];
  pairNumbers: number[];
}

export default function HistoryScreen() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [pastWalks, setPastWalks] = useState<HistoryWalk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchPastWalks = async () => {
      try {
        // Get all walks that are not active (past walks)
        const walksSnapshot = await db
          .collection('walks')
          .where('active', '==', false)
          .orderBy('date', 'desc')
          .get();

        const walks: HistoryWalk[] = [];

        for (const doc of walksSnapshot.docs) {
          const walkData = doc.data();
          const walkDate = walkData.date.toDate();
          
          // Find all pairs that contained the current user
          const userPairs = walkData.pairs.filter((p: any) => p.users.includes(user.id));
          
          if (userPairs.length > 0) {
            // Get unique partner IDs across all pairs
            const partnerIds = new Set<string>();
            const colors: string[] = [];
            const pairNumbers: number[] = [];
            
            userPairs.forEach((pair: any) => {
              // Add each partner from this pair
              pair.users.forEach((userId: string) => {
                if (userId !== user.id) {
                  partnerIds.add(userId);
                }
              });
              
              // Store the pair color and number
              colors.push(pair.color);
              pairNumbers.push(pair.number);
            });
            
            // Fetch partner names
            const partners = [];
            
            if (partnerIds.size > 0) {
              for (const partnerId of partnerIds) {
                const partnerDoc = await db.collection('users').doc(partnerId).get();
                if (partnerDoc.exists) {
                  partners.push({
                    id: partnerId,
                    name: partnerDoc.data()?.name || 'Unknown User'
                  });
                }
              }
            } else {
              // If no partners were found, it was a solo walk
              partners.push({
                id: 'solo',
                name: 'Solo Walk'
              });
            }
            
            walks.push({
              id: doc.id,
              date: walkDate,
              walkName: walkData.name || `Walk on ${format(walkDate, 'MMM d, yyyy')}`,
              durationMinutes: walkData.durationMinutes || 60,
              numberOfRotations: walkData.numberOfRotations || 3,
              partners,
              colors,
              pairNumbers,
            });
          }
        }

        setPastWalks(walks);
      } catch (error) {
        console.error('Error fetching past walks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPastWalks();
  }, [user]);

  const navigateToWalkDetails = (walk: HistoryWalk) => {
    router.push({
      pathname: '/walk-details/[id]',
      params: { id: walk.id }
    });
  };

  const renderWalkItem = ({ item }: { item: HistoryWalk }) => {
    // Get a comma-separated list of partner names
    const partnerNames = item.partners.map(p => p.name).join(', ');
    
    // Use the first color and pair number for the display (we'll show all in the details)
    const primaryColor = item.colors[0] || 'blue';
    
    return (
      <TouchableOpacity 
        style={styles.walkItem} 
        onPress={() => navigateToWalkDetails(item)}
      >
        <View style={styles.walkDate}>
          <Text style={styles.dateText}>{format(item.date, 'MMM d')}</Text>
          <Text style={styles.yearText}>{format(item.date, 'yyyy')}</Text>
        </View>
        <View style={styles.walkInfo}>
          <Text style={styles.walkTitle}>
            {item.walkName}
          </Text>
          <Text style={styles.timeText}>
            {format(item.date, 'h:mm a')} • {item.durationMinutes} min
          </Text>
          <Text style={styles.partnerText}>
            {item.partners.length > 1 
              ? `Partners: ${partnerNames}`
              : `Partner: ${partnerNames}`
            }
          </Text>
          {item.pairNumbers.length > 1 && (
            <Text style={styles.rotationsText}>
              {item.pairNumbers.length} rotations
            </Text>
          )}
        </View>
        <View style={[styles.colorIndicator, { backgroundColor: getEnhancedColor(primaryColor) }]}>
          {item.pairNumbers.length > 1 && (
            <Text style={styles.rotationCount}>{item.pairNumbers.length}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Get a more aesthetically pleasing color based on the assigned color
  const getEnhancedColor = (color?: string) => {
    if (!color) return '#457B9D';
    
    // Define nicer color palette with better contrast
    const colorMap: Record<string, string> = {
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

  if (authLoading || loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!user) {
    return null; // Will redirect to signin
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <Text style={styles.title}>Your Walk History</Text>
      
      {pastWalks.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>You haven't been on any walks yet.</Text>
        </View>
      ) : (
        <FlatList
          data={pastWalks}
          renderItem={renderWalkItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  listContainer: {
    paddingBottom: 20,
  },
  walkItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  walkDate: {
    width: 60,
    alignItems: 'center',
    marginRight: 16,
  },
  dateText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  yearText: {
    fontSize: 14,
    color: '#666',
  },
  walkInfo: {
    flex: 1,
  },
  walkTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  partnerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  rotationsText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  colorIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginLeft: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rotationCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
