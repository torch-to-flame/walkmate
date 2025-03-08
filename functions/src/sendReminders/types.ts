export interface Reminder {
  id: string;
  userId: string;
  walkId: string;
  type: 'day_before' | 'hour_before';
  scheduledFor: FirebaseFirestore.Timestamp;
  sent: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  fcmToken?: string;
}

export interface Walk {
  id: string;
  date: FirebaseFirestore.Timestamp;
  location?: {
    name: string;
    placeId: string;
    latitude: number;
    longitude: number;
  };
  active: boolean;
}
