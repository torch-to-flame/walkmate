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
};

export type Pair = {
  id: string;
  users: string[]; // User IDs
  color: string;
  number: number;
  isTriple?: boolean;
};
