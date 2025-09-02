
// Minimal user data returned by GET /api/users
export interface MinimalUser {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string; // Single name property from backend
  email: string; // Must be @cornell.edu
  password?: string; // In a real app, this would be a hash. Storing for simulation.
  profile_image?: string; // Profile image URL from backend
  interests: string[];
  friendIds: number[];
  organizationIds: number[]; // Changed from groupIds to organizationIds
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
  phone?: string; // Phone number
  _lastUpdate?: number; // Internal timestamp for forcing re-renders
}

export interface Opportunity {
  id: number;
  nonprofit?: string | null; // Changed from organization to nonprofit, now nullable
  name: string; // Changed from title to name
  description: string;
  date: string;
  time: string;
  duration: number; // Duration of the event in hours
  totalSlots: number;
  imageUrl: string;
  points: number;
  isPrivate?: boolean;
  causes: string[]; // Changed from cause to causes as array
  host_id?: number; // ID of the user who created this opportunity
  host_org_id?: number; // ID of the organization hosting this opportunity
  host_org_name?: string; // Name of the organization hosting this opportunity
  involved_users?: User[]; // Users involved in this opportunity from backend
  address: string; // Location/address of the opportunity (now required)
  approved?: boolean; // Whether the opportunity has been approved by admin
}

export interface SignUp {
  userId: number;
  opportunityId: number;
}

export type StudentGroupCategory = 'Fraternity' | 'Sorority' | 'Professional Club' | 'Sports Team' | 'Performing Arts Group' | 'Project Team';
export const studentGroupCategories: StudentGroupCategory[] = ['Fraternity', 'Sorority', 'Professional Club', 'Sports Team', 'Performing Arts Group', 'Project Team'];

export type OrganizationType = 'Fraternity' | 'Sorority' | 'Professional Club' | 'Sports Team' | 'Performing Arts Group' | 'Project Team' | 'Cultural' | 'Community Service' | 'Other';
export const organizationTypes: OrganizationType[] = ['Fraternity', 'Sorority', 'Professional Club', 'Sports Team', 'Performing Arts Group', 'Project Team', 'Cultural', 'Community Service', 'Other'];

export interface StudentGroup {
    id: number;
    name: string;
    category: StudentGroupCategory;
}

export interface Organization {
    id: number;
    name: string;
    type: string;
    description?: string;
    approved?: boolean;
    member_count?: number;
    users?: User[]; // Array of users who are members of this organization
}

export interface Friendship {
  id: number;
  receiver_name: string;
  requester_name: string;
  accepted: boolean;
}



export type FriendshipStatus = 'friends' | 'sent' | 'received' | 'add';

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

// New interface for the actual API response from /api/users/{id}/friend-requests
export interface ApiFriendRequest {
  id: number;
  requester_name: string;
  requester_profile_image: string | null;
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