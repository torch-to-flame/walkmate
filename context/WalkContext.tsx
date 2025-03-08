import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { db } from "../firebase";
import { Pair, User, Walk } from "../types";
import { useAuth } from "./AuthContext";

interface WalkContextType {
  currentWalk: Walk | null;
  userPair: Pair | null;
  loading: boolean;
  createWalk: (walkData?: {
    location?: {
      name: string;
      placeId: string;
      latitude: number;
      longitude: number;
    };
    date?: Date;
    durationMinutes?: number;
    numberOfRotations?: number;
  }) => Promise<void>;
  joinWalk: (walkId: string) => Promise<void>;
  rotatePairs: () => Promise<void>;
  checkIn: (walkId: string) => Promise<void>;
}

const WalkContext = createContext<WalkContextType | undefined>(undefined);

export const useWalk = () => {
  const context = useContext(WalkContext);
  if (context === undefined) {
    throw new Error("useWalk must be used within a WalkProvider");
  }
  return context;
};

// Generate a random color
const getRandomColor = () => {
  const colors = [
    "red",
    "blue",
    "green",
    "purple",
    "orange",
    "pink",
    "cyan",
    "yellow", // Yellow is still included but will be rendered with a softer tone in the UI
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Generate a random number between 1 and 99
const getRandomNumber = () => {
  return Math.floor(Math.random() * 99) + 1;
};

interface WalkProviderProps {
  children: ReactNode;
}

export const WalkProvider: React.FC<WalkProviderProps> = ({ children }) => {
  const [currentWalk, setCurrentWalk] = useState<Walk | null>(null);
  const [userPair, setUserPair] = useState<Pair | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setCurrentWalk(null);
      setUserPair(null);
      setLoading(false);
      return;
    }

    const unsubscribe = db
      .collection("walks")
      .where("active", "==", true)
      .limit(1)
      .onSnapshot((querySnapshot) => {
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          const walkData = doc.data();
          const walk: Walk = {
            id: doc.id,
            ...walkData,
            date: walkData.date.toDate(),
          };
          setCurrentWalk(walk);

          // Find the pair that contains the current user
          const pair = walk.pairs.find((p) => p.users.includes(user.id)) || null;
          setUserPair(pair);
        } else {
          setCurrentWalk(null);
          setUserPair(null);
        }
        setLoading(false);
      });

    return () => unsubscribe();
  }, [user]);

  const createWalk = async (walkData?: {
    location?: {
      name: string;
      placeId: string;
      latitude: number;
      longitude: number;
    };
    date?: Date;
    durationMinutes?: number;
    numberOfRotations?: number;
  }) => {
    if (!user?.isAdmin) {
      throw new Error("Only admins can create walks");
    }

    try {
      // Get all users
      const usersSnapshot = await db.collection("users").get();
      const users = usersSnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as User)
      );

      // Create random pairs
      const pairs: Pair[] = [];
      const shuffledUsers = [...users].sort(() => Math.random() - 0.5);
      
      // If we have an odd number of users, we need to handle it specially
      if (shuffledUsers.length % 2 === 1) {
        // Take the last 3 users and make a group of 3
        const lastThreeUsers = shuffledUsers.splice(shuffledUsers.length - 3, 3);
        pairs.push({
          id: `pair-${Math.floor(shuffledUsers.length / 2)}`,
          users: lastThreeUsers.map((u) => u.id),
          color: getRandomColor(),
          number: getRandomNumber(),
          isTriple: true
        });
      }
      
      // Create pairs with the remaining users (which should be an even number)
      for (let i = 0; i < shuffledUsers.length; i += 2) {
        pairs.push({
          id: `pair-${i / 2}`,
          users: [shuffledUsers[i].id, shuffledUsers[i + 1].id],
          color: getRandomColor(),
          number: getRandomNumber()
        });
      }

      // Deactivate any existing active walks
      const activeWalksSnapshot = await db
        .collection("walks")
        .where("active", "==", true)
        .get();
      
      const deactivatePromises = activeWalksSnapshot.docs.map((doc) =>
        doc.ref.update({ active: false })
      );

      await Promise.all(deactivatePromises);

      // Create a new walk
      await db.collection("walks").add({
        date: walkData?.date || new Date(),
        location: walkData?.location,
        active: true,
        pairs,
        checkedInUsers: [],
        durationMinutes: walkData?.durationMinutes || 60, // Default to 60 minutes
        numberOfRotations: walkData?.numberOfRotations || 3, // Default to 3 rotations
        lastRotationTime: new Date(), // Set initial rotation time to now
        currentRotation: 0, // Start with 0 rotations
      });
    } catch (error) {
      console.error("Error creating walk:", error);
      throw error;
    }
  };

  const joinWalk = async (walkId: string) => {
    if (!user) throw new Error("User must be logged in to join a walk");

    try {
      const walkSnap = await db
        .collection("walks")
        .where("active", "==", true)
        .limit(1)
        .get();
      
      if (walkSnap.empty) {
        throw new Error("No active walk found");
      }

      // Check if user is already in a pair
      const walkDoc = walkSnap.docs[0];
      const walk = { id: walkDoc.id, ...walkDoc.data() } as Walk;
      const existingPair = walk.pairs.find((p) => p.users.includes(user.id));

      if (existingPair) {
        // User is already in a pair
        return;
      }

      // Find a pair with only one user or create a new pair
      let targetPair = walk.pairs.find((p) => p.users.length === 1);

      if (targetPair) {
        // Add user to existing pair
        const updatedPairs = walk.pairs.map((p) =>
          p.id === targetPair!.id ? { ...p, users: [...p.users, user.id] } : p
        );

        await walkDoc.ref.update({ pairs: updatedPairs });
      } else {
        // Create new pair
        const newPair: Pair = {
          id: `pair-${walk.pairs.length}`,
          users: [user.id],
          color: getRandomColor(),
          number: getRandomNumber()
        };

        await walkDoc.ref.update({
          pairs: [...walk.pairs, newPair],
        });
      }
    } catch (error) {
      console.error("Error joining walk:", error);
      throw error;
    }
  };

  const rotatePairs = async () => {
    if (!user?.isAdmin) {
      throw new Error("Only admins can rotate pairs");
    }

    if (!currentWalk) {
      throw new Error("No active walk to rotate pairs for");
    }

    try {
      // Get all users in the current walk
      const allUsers: string[] = currentWalk.pairs.reduce(
        (acc, pair) => [...acc, ...pair.users],
        [] as string[]
      );

      // Shuffle users
      const shuffledUsers = [...allUsers].sort(() => Math.random() - 0.5);

      // Create new pairs
      const newPairs: Pair[] = [];
      
      // If we have an odd number of users, we need to handle it specially
      if (shuffledUsers.length % 2 === 1) {
        // Take the last 3 users and make a group of 3
        const lastThreeUsers = shuffledUsers.splice(shuffledUsers.length - 3, 3);
        newPairs.push({
          id: `pair-${Math.floor(shuffledUsers.length / 2)}`,
          users: lastThreeUsers,
          color: getRandomColor(),
          number: getRandomNumber(),
          isTriple: true
        });
      }
      
      // Create pairs with the remaining users (which should be an even number)
      for (let i = 0; i < shuffledUsers.length; i += 2) {
        newPairs.push({
          id: `pair-${i / 2}`,
          users: [shuffledUsers[i], shuffledUsers[i + 1]],
          color: getRandomColor(),
          number: getRandomNumber()
        });
      }

      // Update the walk with new pairs
      await db
        .collection("walks")
        .doc(currentWalk.id)
        .update({
          pairs: newPairs,
          lastRotationTime: new Date(),
          currentRotation: (currentWalk.currentRotation || 0) + 1
        });
    } catch (error) {
      console.error("Error rotating pairs:", error);
      throw error;
    }
  };

  const checkIn = async (walkId: string) => {
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      const walkDoc = await db.collection("walks").doc(walkId).get();
      if (!walkDoc.exists) {
        throw new Error("Walk not found");
      }

      const walkData = walkDoc.data() as Walk;
      const checkedInUsers = walkData.checkedInUsers || [];

      // Check if user is already checked in
      if (checkedInUsers.includes(user.id)) {
        return;
      }

      // Add user to checkedInUsers array
      await walkDoc.ref.update({
        checkedInUsers: [...checkedInUsers, user.id],
      });

      console.log(`User ${user.id} checked in for walk ${walkId}`);
    } catch (error) {
      console.error("Error checking in for walk:", error);
      throw error;
    }
  };

  const value = {
    currentWalk,
    userPair,
    loading,
    createWalk,
    joinWalk,
    rotatePairs,
    checkIn,
  };

  return <WalkContext.Provider value={value}>{children}</WalkContext.Provider>;
};
