// Service for handling walk-related operations

import * as admin from "firebase-admin";
import { Walk, Pair } from "./types";
import { rotatePairs } from "./pairUtils";
import { sendRotationNotificationsToAllUsers } from "./notificationService";

/**
 * Fetches all active walks from Firestore
 */
export const getActiveWalks = async (): Promise<Walk[]> => {
  try {
    const walksSnapshot = await admin
      .firestore()
      .collection("walks")
      .where("active", "==", true)
      .get();

    if (walksSnapshot.empty) {
      return [];
    }

    return walksSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Walk)
    );
  } catch (error) {
    console.error("Error fetching active walks:", error);
    throw error;
  }
};

/**
 * Checks if a walk needs rotation based on time since last rotation
 */
export const checkIfWalkNeedsRotation = (walk: Walk): boolean => {
  const now = admin.firestore.Timestamp.now();
  const lastRotationTime = walk.lastRotationTime.toDate();
  const minutesSinceLastRotation =
    (now.toDate().getTime() - lastRotationTime.getTime()) / (1000 * 60);
  const rotationInterval = walk.durationMinutes / walk.numberOfRotations;

  return (
    walk.currentRotation < walk.numberOfRotations &&
    minutesSinceLastRotation >= rotationInterval
  );
};

/**
 * Updates a walk with new pairs and increments rotation counter
 */
export const updateWalkWithNewPairs = async (
  walkId: string,
  newPairs: Pair[],
  currentRotation: number
): Promise<void> => {
  try {
    const now = admin.firestore.Timestamp.now();
    await admin.firestore().collection("walks").doc(walkId).update({
      pairs: newPairs,
      lastRotationTime: now,
      currentRotation: currentRotation + 1,
    });
  } catch (error) {
    console.error(`Error updating walk ${walkId} with new pairs:`, error);
    throw error;
  }
};

/**
 * Gets checked-in users from a walk
 */
export const getCheckedInUsers = (walk: Walk): string[] => {
  return walk.checkedInUsers || [];
};

/**
 * Creates pairs only for checked-in users
 */
export const createPairsForCheckedInUsers = (walk: Walk): Pair[] => {
  const checkedInUsers = getCheckedInUsers(walk);
  
  if (checkedInUsers.length === 0) {
    return [];
  }
  
  // Filter pairs to only include checked-in users
  const pairsWithCheckedInUsers = walk.pairs
    .map(pair => {
      const checkedInUsersInPair = pair.users.filter(userId => 
        checkedInUsers.includes(userId)
      );
      
      if (checkedInUsersInPair.length > 0) {
        return {
          ...pair,
          users: checkedInUsersInPair
        };
      }
      return null;
    })
    .filter((pair): pair is Pair => pair !== null);
  
  return pairsWithCheckedInUsers;
};

/**
 * Processes rotation for a walk if needed
 */
export const processWalkRotation = async (walk: Walk): Promise<boolean> => {
  if (!checkIfWalkNeedsRotation(walk)) {
    return false;
  }

  console.log(`Rotating pairs for walk ${walk.id}`);

  // Get checked-in users
  const checkedInUsers = getCheckedInUsers(walk);
  
  if (checkedInUsers.length === 0) {
    console.log(`No checked-in users for walk ${walk.id}, skipping rotation`);
    return false;
  }
  
  // Create pairs with only checked-in users
  const pairsWithCheckedInUsers = createPairsForCheckedInUsers(walk);
  
  if (pairsWithCheckedInUsers.length === 0) {
    console.log(`No pairs with checked-in users for walk ${walk.id}, skipping rotation`);
    return false;
  }
  
  // Generate new pairs from the checked-in users
  const newPairs = rotatePairs(pairsWithCheckedInUsers);

  // Update walk with new pairs
  await updateWalkWithNewPairs(
    walk.id,
    newPairs,
    walk.currentRotation
  );

  // Send notifications to all users in the new pairs
  await sendRotationNotificationsToAllUsers(newPairs, walk.id);

  return true;
};
