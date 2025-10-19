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
  points: number; // Points earned from attended opportunities
  registration_date?: string; // Date and time when user registered
  phone?: string; // Phone number
  _lastUpdate?: number; // Internal timestamp for forcing re-renders
  car_seats: number; // Number of car seats available
  bio?: string; // bio
}

export interface Opportunity {
  id: number;
  nonprofit?: string | null; // Changed from organization to nonprofit, now nullable
  name: string; // Changed from title to name
  description: string;
  date: string;
  time: string;
  duration: number; // Duration of the event in hours
  total_slots: number;
  imageUrl: string;
  points: number;
  isPrivate?: boolean;
  causes: string[];
  tags: string[];
  host_id?: number; // ID of the user who created this opportunity
  host_org_id?: number; // ID of the organization hosting this opportunity
  host_org_name?: string; // Name of the organization hosting this opportunity
  involved_users?: User[]; // Users involved in this opportunity from backend
  address: string; // Location/address of the opportunity (now required)
  approved?: boolean; // Whether the opportunity has been approved by admin
  comments: string[]; // Comments on the opportunity
  qualifications: string[]; // Qualifications for the opportunity
  attendance_marked?: boolean; // Whether the attendance has been marked by the host
  visibility: number[]; // empty list means public, otherwise list of organization IDs that can see it
  redirect_url?: string | null; // External URL for signup, null means normal signup
}

export interface SignUp {
  userId: number;
  opportunityId: number;
}

export type StudentGroupCategory =
  | 'Fraternity'
  | 'Sorority'
  | 'Professional Club'
  | 'Sports Team'
  | 'Performing Arts Group'
  | 'Project Team';
export const studentGroupCategories: StudentGroupCategory[] = [
  'Fraternity',
  'Sorority',
  'Professional Club',
  'Sports Team',
  'Performing Arts Group',
  'Project Team',
];

export type OrganizationType =
  | 'Fraternity'
  | 'Sorority'
  | 'Professional Club'
  | 'Sports Team'
  | 'Performing Arts Group'
  | 'Project Team'
  | 'Cultural'
  | 'Community Service'
  | 'Religious'
  | 'Other';
export const organizationTypes: OrganizationType[] = [
  'Fraternity',
  'Sorority',
  'Professional Club',
  'Sports Team',
  'Performing Arts Group',
  'Project Team',
  'Cultural',
  'Community Service',
  'Religious',
  'Other',
];

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
  host_user_id?: number;
  member_count?: number;
  users?: User[]; // Array of users who are members of this organization
  date_created?: string;
}

export interface Friendship {
  id: number;
  receiver_name: string;
  requester_name: string;
  accepted: boolean;
}

export type FriendshipStatus = 'friends' | 'sent' | 'received' | 'add';

export interface UserWithFriendshipStatus {
  user_id: number;
  name: string;
  profile_image: string | null;
  email: string;
  friendship_status: FriendshipStatus;
  friendship_id: number;
}

export interface FriendshipsResponse {
  current_user_id: number;
  users: UserWithFriendshipStatus[];
  total_users: number;
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
  'Religious',
  'Other',
];

export const genderOptions = ['Male', 'Female', 'Prefer not to say'];

export const academicLevelOptions = ['Undergraduate', 'Graduate', 'Faculty'];

export interface Member {
  id: number;
  name: string;
  picture: string;
  hometown: string;
  major: string;
  class: string;
  campusOrgs: string[];
  favoriteService: string;
  role: string;
}
