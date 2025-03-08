export type User = {
  id: string;
  name: string;
  age: 'Younger' | 'Older';
  location: string;
  email: string;
  isAdmin?: boolean;
  profilePicUrl?: string;
  aboutMe?: string;
  fcmToken?: string;
};

export type Walk = {
  id: string;
  date: Date;
  active: boolean;
  pairs: Pair[];
  checkedInUsers: string[]; // Array of user IDs who have checked in
  location?: {
    name: string;
    placeId: string;
    latitude: number;
    longitude: number;
  };
  durationMinutes: number;
  numberOfRotations: number;
  lastRotationTime?: Date;
  currentRotation: number;
  rsvpUsers?: string[]; // Array of user IDs who have RSVPed
  organizer?: string; // Name of the walk organizer
};

export type Pair = {
  id: string;
  users: string[]; // User IDs
  color: string;
  number: number;
  isTriple?: boolean;
};

export type Reminder = {
  id: string;
  userId: string;
  walkId: string;
  type: 'day_before' | 'hour_before';
  scheduledFor: Date;
  sent: boolean;
};

export type RSVP = {
  userId: string;
  walkId: string;
  timestamp: Date;
};
