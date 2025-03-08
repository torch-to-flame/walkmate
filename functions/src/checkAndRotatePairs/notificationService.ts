// Service for handling notifications

import * as admin from "firebase-admin";
import { Pair, NotificationPayload } from "./types";

/**
 * Sends a notification to a user
 */
export const sendNotificationToUser = async (
  userId: string,
  payload: NotificationPayload
): Promise<void> => {
  try {
    // Get user's FCM token
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      console.log(`User ${userId} not found, skipping notification`);
      return;
    }
    
    const userData = userDoc.data();
    const fcmToken = userData?.fcmToken;
    
    if (!fcmToken) {
      console.log(`No FCM token found for user ${userId}, skipping notification`);
      return;
    }
    
    // Send notification
    const message: admin.messaging.Message = {
      token: fcmToken,
      notification: {
        title: payload.title,
        body: payload.body,
      }
    };
    
    // Add data if provided
    if (payload.data) {
      message.data = payload.data;
    }
    
    await admin.messaging().send(message);
    
    console.log(`Notification sent to user ${userId}`);
  } catch (error) {
    console.error(`Error sending notification to user ${userId}:`, error);
    // Don't throw, just log the error
  }
};

/**
 * Sends notifications to all users in a pair
 */
export const sendRotationNotificationsToPair = async (
  pair: Pair,
  walkId: string
): Promise<void> => {
  const isTriple = pair.isTriple || pair.users.length > 2;
  
  const payload: NotificationPayload = {
    title: "New Walking Partner!",
    body: isTriple
      ? `You've been matched with new partners in a group of ${pair.users.length}. Look for number ${pair.number}!`
      : `You've been matched with a new partner. Look for number ${pair.number}!`,
    data: {
      walkId,
      pairId: pair.id,
      pairColor: pair.color,
      pairNumber: pair.number.toString(),
      isTriple: isTriple ? "true" : "false"
    },
  };
  
  // Send notifications to all users in the pair
  await Promise.all(
    pair.users.map((userId) => sendNotificationToUser(userId, payload))
  );
};

/**
 * Sends notifications to all users in all pairs
 */
export const sendRotationNotificationsToAllUsers = async (
  pairs: Pair[],
  walkId: string
): Promise<void> => {
  await Promise.all(
    pairs.map((pair) => sendRotationNotificationsToPair(pair, walkId))
  );
};
