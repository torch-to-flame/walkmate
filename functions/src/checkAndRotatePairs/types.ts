// Define types used across the rotation functionality

export interface Pair {
  id: string;
  users: string[];
  color: string;
  number: number;
  isTriple?: boolean;
}

export interface Walk {
  id: string;
  name: string;
  location: string;
  date: FirebaseFirestore.Timestamp;
  active: boolean;
  pairs: Pair[];
  users: {
    id: string;
    name: string;
    fcmToken?: string;
  }[];
  checkedInUsers: string[];
  durationMinutes: number;
  numberOfRotations: number;
  currentRotation: number;
  lastRotationTime: FirebaseFirestore.Timestamp;
}

export interface NotificationPayload {
  title: string;
  body: string;
  data?: {
    [key: string]: string;
  };
}
