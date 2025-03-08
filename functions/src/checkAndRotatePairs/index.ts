import * as admin from "firebase-admin";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { getActiveWalks, processWalkRotation } from "./walkService";

// Initialize Firebase Admin if it hasn't been initialized yet
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Cloud function that runs every 5 minutes to:
 * 1. Find all active walks
 * 2. Rotates pairs if needed
 * 3. Sends notifications to users about their new partners
 */
export const checkAndRotatePairs = onSchedule(
  {
    schedule: "every 5 minutes",
    timeZone: "America/Chicago", // Adjust to your preferred timezone
    retryCount: 3,
    maxRetrySeconds: 60,
  },
  async (event) => {
    try {
      console.log("Starting pair rotation check...");

      // Get all active walks
      const activeWalks = await getActiveWalks();

      if (activeWalks.length === 0) {
        console.log("No active walks found");
        return;
      }

      console.log(`Found ${activeWalks.length} active walks`);

      // Process each walk
      let rotatedWalksCount = 0;
      for (const walk of activeWalks) {
        try {
          const rotated = await processWalkRotation(walk);
          if (rotated) {
            rotatedWalksCount++;
          }
        } catch (error) {
          console.error(`Error processing walk ${walk.id}:`, error);
          // Continue with other walks even if one fails
        }
      }

      console.log(
        `Pair rotation check completed. Rotated pairs for ${rotatedWalksCount} walks.`
      );
      return;
    } catch (error) {
      console.error("Error in checkAndRotatePairs function:", error);
      throw error;
    }
  }
);

// Re-export types and utilities for use elsewhere
export * from "./types";
export * from "./pairUtils";
export * from "./walkService";
export * from "./notificationService";
