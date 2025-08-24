
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
  gender?: string; // Gender (nullable)
  graduationYear?: string; // Graduation year
  academicLevel?: string; // Academic level
  major?: string; // Major/field of study
  birthday?: string; // Birthday (date)
  points?: number; // Points earned from attended opportunities
  registration_date?: string; // Date and time when user registered
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
  approved?: boolean; // Whether the opportunity has been approved by admin
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

export interface Friendship {
    id: number;
    user1_id: number;
    user2_id: number;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    updated_at: string;
}

export interface FriendRequest {
    id: number;
    fromUserId: number;
    toUserId: number;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    updated_at: string;
}

export interface FriendshipStatus {
    status: 'friends' | 'pending_sent' | 'pending_received' | 'none';
    friendship_id?: number;
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

export const genderOptions = [
  'Male',
  'Female', 
  'Other',
  'Prefer not to say'
];

export const academicLevelOptions = [
  'Undergraduate',
  'Graduate',
  'Faculty'
];