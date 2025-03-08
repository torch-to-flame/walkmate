import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { format } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';

// App theme colors
const COLORS = {
  primary: "#4285F4",
  background: "#f8f8f8",
  card: "#ffffff",
  text: "#333333",
  textSecondary: "#666666",
  border: "#e0e0e0",
};

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

  const navigateToWalkDetails = (walkId: string) => {
    router.push(`/walk-details/${walkId}`);
  };

  const renderWalkItem = ({ item }: { item: HistoryWalk }) => {
    return (
      <TouchableOpacity 
        style={styles.walkItem} 
        onPress={() => navigateToWalkDetails(item.id)}
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
            {item.partners[0].id === 'solo' 
              ? 'Solo walk'
              : `You walked with ${item.partners.length} ${item.partners.length === 1 ? 'person' : 'people'}`
            }
          </Text>
          {item.pairNumbers.length > 1 && (
            <Text style={styles.rotationsText}>
              {item.pairNumbers.length} rotations
            </Text>
          )}
        </View>
        <View style={styles.iconContainer}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  if (authLoading || loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!user) {
    return null; // Will redirect to signin
  }

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      <View style={styles.header}>
        <Text style={styles.title}>Your Walk History</Text>
      </View>
      
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
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  walkItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
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
    color: COLORS.text,
  },
  yearText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  walkInfo: {
    flex: 1,
  },
  walkTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  partnerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  rotationsText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  iconContainer: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});
