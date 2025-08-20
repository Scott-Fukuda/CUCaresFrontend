
export interface User {
  id: number;
  firstName: string;
  lastName:string;
  email: string; // Must be @cornell.edu
  phone?: string; // Phone number for registration
  password?: string; // In a real app, this would be a hash. Storing for simulation.
  profilePictureUrl?: string; // Can be a URL or a base64 string
  interests: string[];
  friendIds: number[];
  organizationIds: number[];
  admin?: boolean;
  registered?: boolean; // Whether user is registered for an opportunity
  attended?: boolean; // Whether user attended an opportunity
}

export interface Opportunity {
  id: number;
  nonprofit: string;
  name: string;
  description: string;
  date: string;
  time: string;
  duration: number; // Duration of the event in hours
  totalSlots: number;
  imageUrl: string;
  points: number;
  isPrivate?: boolean;
  cause?: string;
  host_id?: number; // ID of the user who created this opportunity
  involved_users?: User[]; // Users involved in this opportunity from backend
  address?: string; // Location/address of the opportunity
}

export interface SignUp {
  userId: number;
  opportunityId: number;
}

export type OrganizationType = 'Fraternity' | 'Sorority' | 'Professional Club' | 'Sports Team' | 'Performing Arts Group' | 'Project Team' | 'Other';
export const organizationTypes: OrganizationType[] = ['Fraternity', 'Sorority', 'Professional Club', 'Sports Team', 'Performing Arts Group', 'Project Team', 'Other'];

export interface Organization {
    id: number;
    name: string;
    type: OrganizationType;
    description?: string;
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