
export interface User {
  id: number;
  firstName: string;
  lastName:string;
  email: string; // Must be @cornell.edu
  password?: string; // In a real app, this would be a hash. Storing for simulation.
  profilePictureUrl?: string; // Can be a URL or a base64 string
  interests: string[];
  friendIds: number[];
  groupIds: number[];
  isAdmin?: boolean;
}

export interface Opportunity {
  id: number;
  organization: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: number; // Duration of the event in hours
  totalSlots: number;
  imageUrl: string;
  points: number;
  isPrivate?: boolean;
  cause?: string;
}

export interface SignUp {
  userId: number;
  opportunityId: number;
}

export type StudentGroupCategory = 'Fraternity' | 'Sorority' | 'Professional Club' | 'Sports Team' | 'Performing Arts Group' | 'Project Team';
export const studentGroupCategories: StudentGroupCategory[] = ['Fraternity', 'Sorority', 'Professional Club', 'Sports Team', 'Performing Arts Group', 'Project Team'];

export interface StudentGroup {
    id: number;
    name: string;
    category: StudentGroupCategory;
}

export interface FriendRequest {
    fromUserId: number;
    toUserId: number;
    status: 'pending' | 'accepted' | 'declined';
}

export interface BadgeThresholdData {
    points: number;
    signUpCount: number;
    signups: SignUp[];
    opportunities: Opportunity[];
    friendsCount: number;
}

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string; // emoji
    threshold: (data: BadgeThresholdData) => boolean;
}

export interface Notification {
  id: number;
  userId: number; // The user to notify
  type: 'friend_request' | 'mention' | 'badge_earned' | 'opportunity_reminder';
  content: string;
  link?: string; // e.g., to a post or profile
  isRead: boolean;
  createdAt: string; // ISO string
}

export const allInterests = [
  'Environment & Sustainability',
  'Homelessness Relief',
  'Food Security and Hunger Relief',
  'Health and Wellness',
  'Education',
  'Other'
];