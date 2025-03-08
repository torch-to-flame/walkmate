import React from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { useWalk } from '../../context/WalkContext';
import WalkCard from '../../components/WalkCard';
import { Walk } from '../../types';
import { Ionicons } from '@expo/vector-icons';

// App theme colors
const COLORS = {
  primary: "#4285F4",
  background: "#f8f8f8",
  card: "#ffffff",
  text: "#333333",
  textSecondary: "#666666",
};

export default function TabWalksScreen() {
  const { upcomingWalks, loading } = useWalk();

  const renderWalkItem = ({ item }: { item: Walk }) => {
    return <WalkCard walk={item} isUpcoming={true} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading walks...</Text>
        </View>
      ) : upcomingWalks.length > 0 ? (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>Upcoming Walks</Text>
          </View>
          <FlatList
            data={upcomingWalks}
            renderItem={renderWalkItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="calendar-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No upcoming walks scheduled</Text>
          <Text style={styles.emptySubtext}>Check back later for new walks</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: COLORS.card,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  listContent: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});
