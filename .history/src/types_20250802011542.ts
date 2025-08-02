
export interface Opportunity {
  id: number;
  name: string;
  description: string;
  date: string;
  duration: number;
  cause: string;
  completed: boolean;
  host_org_id: number;
  host_user_id: number;
  involved_users: {
    user: string;
    id: number;
    registered: boolean;
    attended: boolean;
  }[];
  participating_organizations: string[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  profile_image: string;
  points: number;
  organizations: StudentGroup[];
  opportunities_hosted: {
    name: string;
  }[];
  opportunities_involved: {
    name: string;
    registered: boolean;
    attended: boolean;
  }[];
}

export interface StudentGroup {
  id: number;
  name: string;
  description: string;
  member_count: number;
  type: string;

  points: number;
  host_user_id: number;
  users: {
    id: number;
    name: string;
  }[];
  opportunities_attended: {
    id: number;
    name: string;
  }[];
}


export interface SignUp {
  userId: number;
  opportunityId: number;
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