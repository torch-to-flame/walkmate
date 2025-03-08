import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { Reminder } from './types';

/**
 * Cloud function that runs every 5 minutes to check for reminders that need to be sent
 */
export const sendReminders = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    
    try {
      // Get all unsent reminders scheduled for before now
      const remindersSnapshot = await admin.firestore()
        .collection('reminders')
        .where('sent', '==', false)
        .where('scheduledFor', '<=', now)
        .get();
      
      if (remindersSnapshot.empty) {
        console.log('No reminders to send at this time');
        return null;
      }
      
      console.log(`Found ${remindersSnapshot.size} reminders to send`);
      
      // Process each reminder
      const promises = remindersSnapshot.docs.map(async (doc) => {
        const reminder = { id: doc.id, ...doc.data() } as Reminder;
        
        try {
          // Get user and walk data
          const [userDoc, walkDoc] = await Promise.all([
            admin.firestore().collection('users').doc(reminder.userId).get(),
            admin.firestore().collection('walks').doc(reminder.walkId).get()
          ]);
          
          if (!userDoc.exists || !walkDoc.exists) {
            console.log(`User or walk not found for reminder ${reminder.id}, marking as sent`);
            await doc.ref.update({ sent: true });
            return;
          }
          
          const userData = userDoc.data();
          const walkData = walkDoc.data();
          
          if (!userData?.fcmToken) {
            console.log(`No FCM token for user ${reminder.userId}, marking reminder as sent`);
            await doc.ref.update({ sent: true });
            return;
          }
          
          // Format the date for display
          const walkDate = walkData?.date.toDate();
          const formattedDate = walkDate.toLocaleString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          });
          
          // Prepare notification based on reminder type
          let title = '';
          let body = '';
          
          if (reminder.type === 'day_before') {
            title = 'Walk Tomorrow!';
            body = `Don't forget your walk tomorrow at ${formattedDate} at ${walkData?.location?.name || 'the scheduled location'}`;
          } else if (reminder.type === 'hour_before') {
            title = 'Walk Starting Soon!';
            body = `Your walk starts in about an hour at ${walkData?.location?.name || 'the scheduled location'}`;
          }
          
          // Send notification
          await admin.messaging().send({
            token: userData.fcmToken,
            notification: {
              title,
              body,
            },
            data: {
              walkId: reminder.walkId,
              type: 'reminder',
              reminderType: reminder.type,
            }
          });
          
          console.log(`Sent ${reminder.type} reminder to user ${reminder.userId} for walk ${reminder.walkId}`);
          
          // Mark reminder as sent
          await doc.ref.update({ sent: true });
        } catch (error) {
          console.error(`Error processing reminder ${reminder.id}:`, error);
          // Don't mark as sent if there was an error, so we can retry
        }
      });
      
      await Promise.all(promises);
      console.log('Finished sending reminders');
      
      return null;
    } catch (error) {
      console.error('Error in sendReminders function:', error);
      return null;
    }
  });
