import { User, MinimalUser, Opportunity, Organization, SignUp, Car, Friendship, FriendshipStatus, FriendshipsResponse, MiniOpp, MultiOpp, Waiver, Ride } from './types';
import { auth } from './firebase-config';
import { canUnregisterFromOpportunity } from './utils/timeUtils';

// Helper function to get profile picture URL
// Returns a generic silhouette when no profile image is available
export const getProfilePictureUrl = (profile_image?: string | null, userId?: number): string => {
  if (profile_image) {
    return profile_image;
  }
  // Return a generic silhouette SVG
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236B7280'%3E%3Ccircle cx='12' cy='12' r='12' fill='white'/%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
};

// Helper function to format registration date for backend API
// Returns format: YYYY-MM-DDTHH:MM:SS (without timezone and milliseconds)
export const formatRegistrationDate = (date: Date = new Date()): string => {
  return date.toISOString().slice(0, 19);
};

// A helper for making Acucaresbackend.onrender.comPI requests.
// const ENDPOINT_URL = 'https://cucaresbackend.onrender.com'

const ENDPOINT_URL = import.meta.env.VITE_ENDPOINT_URL;

// Helper to get Firebase token
const getFirebaseToken = async (): Promise<string | null> => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      return token;
    } else {
      console.warn('No Firebase user found');
    }
  } catch (error) {
    console.warn('Failed to get Firebase token:', error);
  }
  return null;
};

const request = async (endpoint: string, options: RequestInit = {}) => {
  const { headers, ...restOptions } = options;
  const url = `${ENDPOINT_URL}/api${endpoint}`;

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...headers,
    },
    mode: 'cors',
    credentials: 'omit',
    ...restOptions,
  });

  if (!res.ok) {
    const errorInfo = await res.json().catch(() => ({ message: res.statusText }));
    console.error('API error:', errorInfo);
    throw new Error(errorInfo.message || 'An API error occurred');
  }

  // For DELETE requests or other methods that might not return a body
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.indexOf('application/json') !== -1) {
    try {
      return await res.json();
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      return {};
    }
  }
  return {}; // Return empty object if no JSON body
};

// Authenticated request helper that includes Firebase token
const authenticatedRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getFirebaseToken();
  const { headers, ...restOptions } = options;

  const authHeaders: Record<string, string> = {};
  if (token) {
    authHeaders['Authorization'] = `Bearer ${token}`;
    //console.log('Adding Authorization header to request:', endpoint);
  } else {
    console.warn('No Firebase token available for authenticated request:', endpoint);
  }

  return request(endpoint, {
    ...restOptions,
    headers: {
      ...authHeaders,
      ...headers,
    },
  });
};

// TEST LOGIN ENDPOINT
export const loginTest = async (userId: number) => {
  const response = await fetch(`${ENDPOINT_URL}/api/login-test/${userId}`, {
    method: "GET",
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error("Failed to log in test user")
  }

  // console.log("Logged in test user!")
  return response;
}

// --- Users ---
// Get all users data - now requires authentication and returns full user data
export const getUsers = async (): Promise<User[]> => {
  const response = await authenticatedRequest('/users');
  const users = response.users || [];

  // Transform each user to match our User interface
  return users.map((user: any) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    profile_image: user.profile_image,
    interests: user.interests || [],
    friendIds: user.friends || [],
    organizationIds: (user.organizations || []).map((org: any) => org.id) || [],
    admin: user.admin || false,
    gender: user.gender,
    graduationYear: user.graduation_year,
    academicLevel: user.academic_level,
    major: user.major,
    birthday: user.birthday,
    points: user.points || 0,
    registration_date: user.registration_date,
    phone: user.phone,
    car_seats: user.car_seats || 0,
    bio: user.bio,
    carpool_waiver_signed: user.carpool_waiver_signed
  }));
};

/**
 * Fetch minimal user data (for global state like allUsers/sharedStudents)
 */
export const getUsersMinimal = async (): Promise<User[]> => {
  const response = await authenticatedRequest('/users/minimal');
  const users = response.users || [];

  return users.map((user: any) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    points: user.points || 0,
    profile_image: user.profile_image || null,
    organizationIds: user.organizationIds || [],
    admin: user.admin || false,
    car_seats: user.car_seats || 0,
    carpool_waiver_signed: user.carpool_waiver_signed,
    bio: user.bio || '',

    // These remain empty for minimal payloads
    interests: [],
    friendIds: [],
    gender: null,
    graduationYear: null,
    academicLevel: null,
    major: null,
    birthday: null,
    registration_date: null,
  }));
};


// Get user by email for login - new endpoint
export const getUserByEmail = async (email: string, token?: string): Promise<User | null> => {
  try {
    if (token) {
      const res = await fetch(`${ENDPOINT_URL}/api/users/email/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        return null;
      }

      const response: User = await res.json();
      return response;
    }

    // --- Fallback: no token provided ---
    // Here you can clear auth state if needed
    // Example: Firebase => await signOut(auth);
    // Example: Local => localStorage.removeItem('jwt');
    // Or just avoid sending Authorization header at all

    return null;
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
};

// Get detailed user data for a specific user
export const getUser = async (id: number): Promise<User> => {
  const response = await authenticatedRequest(`/users/${id}`);
  return {
    id: response.id,
    name: response.name,
    email: response.email,
    profile_image: response.profile_image,
    interests: response.interests || [],
    friendIds: response.friends || [],
    organizationIds: (response.organizations || []).map((org: any) => org.id) || [],
    admin: response.admin || false,
    gender: response.gender,
    graduationYear: response.graduation_year,
    academicLevel: response.academic_level,
    major: response.major,
    birthday: response.birthday,
    points: response.points || 0,
    registration_date: response.registration_date,
    phone: response.phone,
    car_seats: response.car_seats || 0,
    carpool_waiver_signed: response.carpool_waiver_signed || false
  };
};
export const updateUser = (id: number, data: object): Promise<User> => {

  return authenticatedRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const uploadProfilePicture = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const token = await getFirebaseToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${ENDPOINT_URL}/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload profile picture: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  return result.url; // Return the S3 URL
};
export const registerUser = async (data: object, token?: string): Promise<User> => {
  // If caller provides a Firebase ID token, use it directly so registration is authenticated
  if (token) {
    const res = await fetch(`${ENDPOINT_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
      mode: 'cors',
      credentials: 'omit',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'Failed to register user');
    }
    return res.json();
  }

  // Fallback: use existing authenticatedRequest (reads token from auth.currentUser)
  return authenticatedRequest('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }) as Promise<User>;
};

// Get all user emails - returns array of email strings
export const getUserEmails = async (): Promise<string[]> => {
  const response = await authenticatedRequest('/users/emails');
  // console.log('getUserEmails response:', response);
  // If the response is the array directly:
  return response || [];

  // OR if it's wrapped differently:
  // return response.emails || response || [];
};

// --- Organizations (Groups) ---
export const getOrgs = async (): Promise<Organization[]> => {
  const response = await authenticatedRequest('/orgs');
  const orgs = response.organizations || [];

  // Transform backend data to match frontend expectations and define local state
  return orgs.map((org: any) => ({
    id: org.id,
    name: org.name,
    type: org.type || 'Other',
    description: org.description || '',
    approved: org.approved || false,
    host_user_id: org.host_user_id || null,
    member_count: org.member_count || 0,
    users: org.users || [], // Ensure users array exists
    // Add local state properties
    _lastUpdate: Date.now(), // Track when this org data was last updated
    _isLocal: false, // Mark as coming from backend
    _isJoined: false, // Will be set by parent component based on currentUser.organizationIds
  }));
};

export const getApprovedOrgs = async (): Promise<Organization[]> => {
  const response = await authenticatedRequest('/orgs/approved');
  const orgs = response.organizations || [];

  // Transform backend data to match frontend expectations and define local state
  return orgs.map((org: any) => ({
    id: org.id,
    name: org.name,
    type: org.type || 'Other',
    description: org.description || '',
    approved: org.approved || false,
    host_user_id: org.host_user_id || null,
    member_count: org.member_count || 0,
    users: org.users || [], // Ensure users array exists
    // Add local state properties
    _lastUpdate: Date.now(), // Track when this org data was last updated
    _isLocal: false, // Mark as coming from backend
    _isJoined: false, // Will be set by parent component based on currentUser.organizationIds
  }));
};

export const getOrg = (id: number): Promise<Organization> => authenticatedRequest(`/orgs/${id}`);
export const createOrg = (data: object): Promise<Organization> =>
  authenticatedRequest('/orgs', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getUnapprovedOrgs = async (): Promise<Organization[]> => {
  const response = await authenticatedRequest('/orgs/unapproved');
  return response.organizations || [];
};

export const updateOrganization = (id: number, data: object): Promise<Organization> =>
  authenticatedRequest(`/orgs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteOrganization = (id: number): Promise<void> =>
  authenticatedRequest(`/orgs/${id}`, {
    method: 'DELETE',
  });

// --- Friend Management ---
export const getAllFriendships = (): Promise<Friendship[]> => authenticatedRequest('/friendships');

export const getUserFriends = async (userId: number): Promise<any> => {
  //console.log(`API: Fetching friends for user ${userId}`);
  const result = await authenticatedRequest(`/users/${userId}/friends`);
  //console.log(`API: Friends response:`, result);

  // The backend returns { count: number, friendships: [...] }
  if (result && Array.isArray(result.friendships)) {
    return result; // Return the full response structure
  }

  console.warn('Unexpected friends response structure:', result);
  return { count: 0, friendships: [] };
};

export const getUserFriendships = async (userId: number): Promise<FriendshipsResponse> => {
  //console.log(`API: Fetching friendships for user ${userId}`);
  const result = await authenticatedRequest(`/users/${userId}/friendships/all`);
  //console.log(`API: Friendships response:`, result);
  return result;
};

// Get friendship ID between two users
export const getFriendshipId = async (
  userId: number,
  otherUserId: number
): Promise<number | null> => {
  try {
    //console.log(`API: Getting friendship ID between user ${userId} and ${otherUserId}`);
    const result = await authenticatedRequest(`/users/${userId}/friendships/all`);

    // Find the friendship for the other user
    const userData = result.users?.find((user: any) => user.user_id === otherUserId);
    if (userData && userData.friendship_id) {
      // The friendship_id is now provided directly in the response
      return userData.friendship_id;
    }
    return null;
  } catch (error) {
    console.error(`API: Error getting friendship ID:`, error);
    return null;
  }
};

export const sendFriendRequest = (userId: number, friendId: number) =>
  authenticatedRequest(`/users/${userId}/friends`, {
    method: 'POST',
    body: JSON.stringify({ receiver_id: friendId }),
  });

export const acceptFriendRequest = (friendshipId: number) =>
  authenticatedRequest(`/friendships/${friendshipId}/accept`, {
    method: 'PUT',
  });

export const rejectFriendRequest = (friendshipId: number) =>
  authenticatedRequest(`/friendships/${friendshipId}/reject`, {
    method: 'PUT',
  });

export const removeFriend = (userId: number, friendId: number) =>
  authenticatedRequest(`/users/${userId}/friends/${friendId}`, {
    method: 'DELETE',
  });

export const checkFriendshipStatus = async (
  userId: number,
  friendId: number
): Promise<FriendshipStatus> => {
  //console.log(`API: Checking friendship status between user ${userId} and friend ${friendId}`);
  const result = await authenticatedRequest(`/users/${userId}/friends/check/${friendId}`);
  //console.log(`API: Friendship status response:`, result);
  return result;
};

// Get accepted friendships for a user
export const getAcceptedFriendships = async (userId: number): Promise<User[]> => {
  //console.log(`API: Fetching accepted friendships for user ${userId}`);
  try {
    const result = await authenticatedRequest(`/users/${userId}/friends`);
    //console.log(`API: Friends response:`, result);

    let friendsArray: any[] = [];
    if (Array.isArray(result)) {
      friendsArray = result;
    } else if (result && Array.isArray(result.friends)) {
      friendsArray = result.friends;
    } else if (result && Array.isArray(result.accepted_friendships)) {
      friendsArray = result.accepted_friendships;
    } else if (result && Array.isArray(result.data)) {
      friendsArray = result.data;
    } else if (result && result.users && Array.isArray(result.users)) {
      friendsArray = result.users;
    } else if (result && result.user && Array.isArray(result.user)) {
      friendsArray = result.user;
    }

    if (friendsArray.length >= 0) {
      // Process even empty arrays
      return friendsArray.map((friendship: any) => ({
        id: friendship.other_user_id || friendship.id || friendship.user_id,
        name: friendship.other_user_name || friendship.name || 'Unknown User',
        email: '', // Not provided in friendship response
        password: '', // Not provided in friendship response
        profile_image: friendship.other_user_profile_image || friendship.profile_image,
        interests: [], // Not provided in friendship response
        friendIds: [], // Not provided in friendship response
        organizationIds: [], // Not provided in friendship response
        graduationYear: '', // Not provided in friendship response
        academicLevel: '', // Not provided in friendship response
        major: '', // Not provided in friendship response
        birthday: '', // Not provided in friendship response
        points: 0, // Not provided in friendship response
        admin: false, // Not provided in friendship response
        car_seats: 0, // Not provided in friendship response
        registration_date: '', // Not provided in friendship response
        registered: false, // Not provided in friendship response
        attended: false, // Not provided in friendship response
      }));
    }
    console.warn('Unexpected friends response structure:', result);
    //console.log('Response type:', typeof result);
    //console.log('Response keys:', result ? Object.keys(result) : 'null/undefined');
    //console.log('Response structure:', JSON.stringify(result, null, 2));
    return [];
  } catch (error) {
    console.warn(`API: Friends endpoint not available yet: ${error}`);
    return [];
  }
};

// --- Organization Registration ---
export const registerForOrg = (data: { user_id: number; organization_id: number }) =>
  authenticatedRequest('/register-org', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const unregisterFromOrg = (data: { user_id: number; organization_id: number }) =>
  authenticatedRequest('/unregister-org', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// --- Firebase Authentication ---
export const verifyFirebaseToken = async (token: string) => {
  const response = await fetch(`${ENDPOINT_URL}/api/protected`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Handle non-JSON responses (like HTML error pages)
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(
      `Server returned ${response.status}: ${response.statusText}. Expected JSON response.`
    );
  }

  const responseData = await response.json();

  if (response.ok && responseData.status === 'authenticated') {
    return { success: true, user: responseData.user };
  } else {
    // Handle error responses
    if (responseData.error === 'Authorization header is required') {
      throw new Error('Authentication failed: Please provide a valid Firebase ID token');
    } else if (responseData.error === 'Invalid token') {
      throw new Error('Authentication failed: Token is invalid or expired');
    } else {
      throw new Error(responseData.message || 'Authentication failed. Please try again.');
    }
  }
};

export const unregisterForOrg = (data: { user_id: number; organization_id: number }) =>
  request('/unregister-org', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// --- Opportunities ---
export const getOpportunities = async (): Promise<Opportunity[]> => {
  try {
    const response = await authenticatedRequest('/opps');

    // Transform backend data to match frontend expectations
    const transformedOpportunities = (response.opportunities || []).map((opp: any) => {
      //console.log(`Processing opportunity ${opp.id} - ${opp.name}:`, opp);

      // Parse the UTC date string from backend
      const dateObj = new Date(opp.date);

      // Convert UTC to Eastern Time
      const easternDateStr = dateObj.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      // Parse the Eastern time string to extract date and time
      // Format: "MM/DD/YYYY, HH:MM:SS"
      const [datePart, timePart] = easternDateStr.split(', ');
      const [month, day, year] = datePart.split('/');
      const dateOnly = `${year}-${month}-${day}`; // YYYY-MM-DD format
      const timeOnly = timePart; // HH:MM:SS format

      // Transform involved_users from backend format to frontend User format
      const transformedInvolvedUsers = (opp.involved_users || []).map((involvedUser: any) => {
        //console.log('Transforming involved user:', involvedUser);

        const transformedUser = {
          id: involvedUser.id,
          name: involvedUser.user || 'Unknown User', // Use full name from backend
          email: involvedUser.email || '', // Now provided by backend
          phone: involvedUser.phone || '',
          profile_image: involvedUser.profile_image,
          interests: [],
          friendIds: [],
          organizationIds: [],
          // Add attendance info if needed
          attended: involvedUser.attended,
          registered: involvedUser.registered,
        };

        return transformedUser;
      });

      // Use image URL directly from backend (full URLs like "https://imgur.com/a/y0f0Geb")
      const resolvedImageUrl =
        opp.image_url ||
        opp.image ||
        opp.imageUrl ||
        'https://campus-cares.s3.us-east-2.amazonaws.com';

      return {
        id: opp.id,
        name: opp.name, // Use name directly from backend
        nonprofit: opp.nonprofit || null, // Use nonprofit from backend, can be null
        description: opp.description,
        date: dateOnly,
        time: timeOnly,
        duration: opp.duration,
        total_slots: opp.total_slots || 10, // Use total_slots from backend
        imageUrl: resolvedImageUrl,
        points: opp.duration || 0, // 1 minute = 1 point
        cause: opp.cause || opp.cause ? [opp.cause] : [], // Handle both array and single cause
        isPrivate: false, // Default
        host_id: opp.host_user_id || opp.host_org_id, // Include host_id from backend
        host_org_id: opp.host_org_id, // Include host organization ID
        host_org_name: opp.host_org_name, // Include host organization name
        involved_users: transformedInvolvedUsers, // Include transformed involved_users
        address: opp.address || '', // Address is now required
        approved: opp.approved !== undefined ? opp.approved : true, // Default to true if not specified
        attendance_marked: opp.attendance_marked !== undefined ? opp.attendance_marked : false,
        visibility: opp.visibility !== undefined ? opp.visibility : [],
        comments: opp.comments !== undefined ? opp.comments : [],
        qualifications: opp.qualifications !== undefined ? opp.qualifications : [],
        causes: opp.causes !== undefined ? opp.causes : [],
        tags: opp.tags !== undefined ? opp.tags : [],
        redirect_url: opp.redirect_url !== undefined ? opp.redirect_url : null,
        multiopp: opp.multiopp || null,
        multiopp_id: opp.multiopp_id || null,
        allow_carpool: opp.allow_carpool,
        carpool_id: opp.carpool_id !== undefined ? opp.carpool_id : null
      };
    });

    return transformedOpportunities;
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    throw error;
  }
};

export const getCurrentOpportunities = async (): Promise<Opportunity[]> => {
  try {
    const response = await authenticatedRequest('/opps/current');
    //console.log('getOpportunities raw response:', response);

    // Transform backend data to match frontend expectations
    const transformedOpportunities = (response.opportunities || []).map((opp: any) => {
      //console.log(`Processing opportunity ${opp.id} - ${opp.name}:`, opp);

      // Parse the UTC date string from backend
      const dateObj = new Date(opp.date);

      // Convert UTC to Eastern Time
      const easternDateStr = dateObj.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      // Parse the Eastern time string to extract date and time
      // Format: "MM/DD/YYYY, HH:MM:SS"
      const [datePart, timePart] = easternDateStr.split(', ');
      const [month, day, year] = datePart.split('/');
      const dateOnly = `${year}-${month}-${day}`; // YYYY-MM-DD format
      const timeOnly = timePart; // HH:MM:SS format

      // Transform involved_users from backend format to frontend User format
      const transformedInvolvedUsers = (opp.involved_users || []).map((involvedUser: any) => {
        //console.log('Transforming involved user:', involvedUser);

        const transformedUser = {
          id: involvedUser.id,
          name: involvedUser.user || 'Unknown User', // Use full name from backend
          email: involvedUser.email || '', // Now provided by backend
          phone: involvedUser.phone || '',
          profile_image: involvedUser.profile_image,
          interests: [],
          friendIds: [],
          organizationIds: [],
          // Add attendance info if needed
          attended: involvedUser.attended,
          registered: involvedUser.registered,
        };

        return transformedUser;
      });

      // Use image URL directly from backend (full URLs like "https://imgur.com/a/y0f0Geb")
      const resolvedImageUrl =
        opp.image_url ||
        opp.image ||
        opp.imageUrl ||
        'https://campus-cares.s3.us-east-2.amazonaws.com';

      return {
        id: opp.id,
        name: opp.name, // Use name directly from backend
        nonprofit: opp.nonprofit || null, // Use nonprofit from backend, can be null
        description: opp.description,
        date: dateOnly,
        time: timeOnly,
        duration: opp.duration,
        total_slots: opp.total_slots || 10, // Use total_slots from backend
        imageUrl: resolvedImageUrl,
        points: opp.duration || 0, // 1 minute = 1 point
        cause: opp.cause || opp.cause ? [opp.cause] : [], // Handle both array and single cause
        isPrivate: false, // Default
        host_id: opp.host_user_id || opp.host_org_id, // Include host_id from backend
        host_org_id: opp.host_org_id, // Include host organization ID
        host_org_name: opp.host_org_name, // Include host organization name
        involved_users: transformedInvolvedUsers, // Include transformed involved_users
        address: opp.address || '', // Address is now required
        approved: opp.approved !== undefined ? opp.approved : true, // Default to true if not specified
        attendance_marked: opp.attendance_marked !== undefined ? opp.attendance_marked : false,
        visibility: opp.visibility !== undefined ? opp.visibility : [],
        comments: opp.comments !== undefined ? opp.comments : [],
        qualifications: opp.qualifications !== undefined ? opp.qualifications : [],
        causes: opp.causes !== undefined ? opp.causes : [],
        tags: opp.tags !== undefined ? opp.tags : [],
        redirect_url: opp.redirect_url !== undefined ? opp.redirect_url : null,
        multiopp: opp.multiopp || null,
        multiopp_id: opp.multiopp_id || null,
        allow_carpool: opp.allow_carpool,
        carpool_id: opp.carpool_id !== undefined ? opp.carpool_id : null
      };
    });

    return transformedOpportunities;
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    throw error;
  }
};

export const getOpportunity = async (id: number): Promise<Opportunity> => {
  try {
    const opp = await authenticatedRequest(`/opps/${id}`);

    // --- Parse date & time ---
    const dateObj = new Date(opp.date);

    // Convert UTC to Eastern Time
    const easternDateStr = dateObj.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Parse the Eastern time string to extract date and time
    // Format: "MM/DD/YYYY, HH:MM:SS"
    const [datePart, timePart] = easternDateStr.split(', ');
    const [month, day, year] = datePart.split('/');
    const dateOnly = `${year}-${month}-${day}`; // YYYY-MM-DD format
    const timeOnly = timePart; // HH:MM:SS format

    // --- Transform involved users ---
    const transformedInvolvedUsers = (opp.involved_users || []).map((involvedUser: any) => ({
      id: involvedUser.id,
      name: involvedUser.user || 'Unknown User',
      email: involvedUser.email || '',
      phone: involvedUser.phone || '',
      profile_image: involvedUser.profile_image,
      interests: [],
      friendIds: [],
      organizationIds: [],
      attended: involvedUser.attended,
      registered: involvedUser.registered,
    }));

    // --- Resolve image ---
    const resolvedImageUrl =
      opp.image_url || opp.image || opp.imageUrl || 'https://campus-cares.s3.us-east-2.amazonaws.com';

    // --- Build unified Opportunity object ---
    const transformedOpp: Opportunity = {
      id: opp.id,
      name: opp.name,
      nonprofit: opp.nonprofit || null,
      description: opp.description,
      date: dateOnly,
      time: timeOnly,
      duration: opp.duration,
      total_slots: opp.total_slots || 10,
      imageUrl: resolvedImageUrl,
      points: opp.duration || 0, // 1 minute = 1 point
      isPrivate: false,
      host_id: opp.host_user_id || opp.host_org_id,
      host_org_id: opp.host_org_id,
      host_org_name: opp.host_org_name,
      involved_users: transformedInvolvedUsers,
      address: opp.address || '',
      approved: opp.approved !== undefined ? opp.approved : true,
      attendance_marked: opp.attendance_marked !== undefined ? opp.attendance_marked : false,
      visibility: opp.visibility !== undefined ? opp.visibility : [],
      comments: opp.comments !== undefined ? opp.comments : [],
      qualifications: opp.qualifications !== undefined ? opp.qualifications : [],
      causes: opp.causes !== undefined ? opp.causes : [],
      tags: opp.tags !== undefined ? opp.tags : [],
      redirect_url: opp.redirect_url !== undefined ? opp.redirect_url : null,
      multiopp: opp.multiopp || null,
      multiopp_id: opp.multiopp_id || null,
      allow_carpool: opp.allow_carpool,
      carpool_id: opp.carpool_id !== undefined ? opp.carpool_id : null,
    };

    return transformedOpp;
  } catch (error) {
    console.error(`Error fetching opportunity ${id}:`, error);
    throw error;
  }
};


export const getUnapprovedOpportunities = async (): Promise<Opportunity[]> => {
  try {
    const response = await authenticatedRequest('/opps/unapproved');

    // Transform backend data to match frontend expectations (same logic as getOpportunities)
    const transformedOpportunities = (response.opportunities || []).map((opp: any) => {
      // Parse the UTC date string from backend
      const dateObj = new Date(opp.date);

      // Convert UTC to Eastern Time
      const easternDateStr = dateObj.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      // Parse the Eastern time string to extract date and time
      // Format: "MM/DD/YYYY, HH:MM:SS"
      const [datePart, timePart] = easternDateStr.split(', ');
      const [month, day, year] = datePart.split('/');
      const dateOnly = `${year}-${month}-${day}`; // YYYY-MM-DD format
      const timeOnly = timePart; // HH:MM:SS format

      // Transform involved users if they exist
      const transformedInvolvedUsers = opp.involved_users ? opp.involved_users.map((involvedUser: any) => {
        const user = involvedUser.user || involvedUser;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          profile_image: user.profile_image,
          interests: user.interests || [],
          friendIds: user.friends || [],
          organizationIds: (user.organizations || []).map((org: any) => org.id) || [],
          admin: user.admin || false,
          gender: user.gender,
          graduationYear: user.graduation_year,
          academicLevel: user.academic_level,
          major: user.major,
          birthday: user.birthday,
          points: user.points || 0,
          registration_date: user.registration_date,
          phone: user.phone,
          car_seats: user.car_seats || 0,
          bio: user.bio,
          registered: involvedUser.registered || false,
          attended: involvedUser.attended || false,
        };
      }) : [];

      // Use image URL directly from backend
      const resolvedImageUrl = opp.image_url || opp.image || opp.imageUrl || 'https://campus-cares.s3.us-east-2.amazonaws.com';

      return {
        id: opp.id,
        name: opp.name,
        nonprofit: opp.nonprofit || null,
        description: opp.description,
        date: dateOnly,
        time: timeOnly,
        duration: opp.duration,
        total_slots: opp.total_slots || 10,
        imageUrl: resolvedImageUrl,
        points: opp.duration || 0,
        causes: opp.causes !== undefined ? opp.causes : [],
        isPrivate: false,
        host_id: opp.host_user_id || opp.host_org_id,
        host_org_id: opp.host_org_id,
        host_org_name: opp.host_org_name,
        involved_users: transformedInvolvedUsers,
        address: opp.address || '',
        approved: opp.approved !== undefined ? opp.approved : false, // Default to false for unapproved
        attendance_marked: opp.attendance_marked !== undefined ? opp.attendance_marked : false,
        visibility: opp.visibility !== undefined ? opp.visibility : [],
        comments: opp.comments !== undefined ? opp.comments : [],
        qualifications: opp.qualifications !== undefined ? opp.qualifications : [],
        tags: opp.tags !== undefined ? opp.tags : [],
        redirect_url: opp.redirect_url !== undefined ? opp.redirect_url : null,
        allow_carpool: opp.allow_carpool,
        carpool_id: opp.carpool_id !== undefined ? opp.carpool_id : null
      };
    });

    return transformedOpportunities;
  } catch (error) {
    console.error('Error fetching unapproved opportunities:', error);
    throw error;
  }
};

export const updateOpportunity = (id: number, data: object): Promise<Opportunity> =>
  authenticatedRequest(`/opps/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteOpportunity = (id: number): Promise<void> =>
  authenticatedRequest(`/opps/${id}`, {
    method: 'DELETE',
  });
// --- SignUps (Registrations) ---
// Check if opportunity is fully booked
export const checkOpportunityAvailability = async (
  opportunityId: number
): Promise<{ is_full: boolean }> => {
  //console.log('Checking availability for opportunity:', opportunityId);
  const result = await authenticatedRequest(`/opps/${opportunityId}/full`);
  //console.log('Opportunity availability response:', result);
  return result;
};

// POST /register-opp for signing up.
export const registerForOpp = async (data: { user_id: number; opportunity_id: number }) => {
  //console.log('Making registerForOpp API call with data:', data);
  const result = await authenticatedRequest('/register-opp', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  //console.log('registerForOpp API response:', result);
  return result;
};
// POST /unregister-opp for un-registering.
export const unregisterForOpp = async (data: {
  user_id: number;
  opportunity_id: number;
  opportunityDate?: string;
  opportunityTime?: string;
  isAdminOrHost?: boolean; // New parameter to bypass 7-hour rule
}) => {
  // Validate 7-hour window only if user is not admin or host
  if (data.opportunityDate && data.opportunityTime && !data.isAdminOrHost) {
    const { canUnregister } = canUnregisterFromOpportunity(
      data.opportunityDate,
      data.opportunityTime
    );
    if (!canUnregister) {
      throw new Error('Cannot unregister within 7 hours of the event');
    }
  }

  return authenticatedRequest('/unregister-opp', {
    method: 'POST',
    body: JSON.stringify({
      user_id: data.user_id,
      opportunity_id: data.opportunity_id,
    }),
  });
};

// --- Create Opportunity ---
export const createOpportunity = async (formData: FormData): Promise<Opportunity> => {
  const token = await getFirebaseToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // For FormData, we need to let the browser set the Content-Type with boundary
  const response = await fetch(`${ENDPOINT_URL}/api/opps`, {
    method: 'POST',
    headers,
    body: formData,
    // Don't set Content-Type header - let browser set it automatically for FormData
  });


  if (!response.ok) {
    console.error('Create opportunity failed with status:', response.status);
    const errorInfo = await response.json().catch(() => ({ message: response.statusText }));
    console.error('Error details:', errorInfo);
    throw new Error(errorInfo.message || 'Failed to create opportunity');
  }

  return response.json();
};

// --- Attendance ---
// PUT /api/attendance for marking attendance
export const markAttendance = async (data: {
  user_ids: number[];
  opportunity_id: number;
  duration: number;
}) => {
  return authenticatedRequest('/attendance', {
    method: 'PUT',
    body: JSON.stringify({
      user_ids: data.user_ids,
      opportunity_id: data.opportunity_id,
      duration: data.duration,
    }),
  });
};

// GET /api/opps/<opp_id>/attendance for getting attendance data
export const getOpportunityAttendance = async (opportunityId: number) => {
  return authenticatedRequest(`/opps/${opportunityId}/attendance`);
};

// --- Email Approval Check ---
// GET /api/approved-emails/check/{email} for checking if email is approved
export const checkEmailApproval = async (email: string) => {
  const response = await fetch(
    `${ENDPOINT_URL}/api/approved-emails/check/${encodeURIComponent(email)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to check email approval: ${response.statusText}`);
  }

  return response.json();
};

export const checkUserExists = async (email: string, token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    const t = await getFirebaseToken();
    if (t) headers['Authorization'] = `Bearer ${t}`;
  }

  const encodedEmail = encodeURIComponent(email);
  const response = await fetch(`${ENDPOINT_URL}/api/users/check/${encodedEmail}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`Failed to check user existence: ${text}`);
  }
  const data = await response.json().catch(() => ({}));
  if (data && data.exists) {
    return { success: true, exists: true }; // User exists
  }
  return { success: true, data: false };
};

// Add approved email - POST /api/approved-emails
export const addApprovedEmail = async (email: string) => {
  const response = await authenticatedRequest('/approved-emails', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
  return response;
};

// --- Monthly Points ---
// GET /api/monthly-points for getting monthly points
export const getMonthlyPoints = async (
  date: string
): Promise<{ users: Array<{ id: number; points: number }> }> => {
  const token = await getFirebaseToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(
    `${ENDPOINT_URL}/api/monthly-points?date=${encodeURIComponent(date)}`,
    {
      method: 'GET',
      headers,
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get monthly points: ${response.statusText}`);
  }

  return response.json();
};

// --- Waivers ---
export const createWaiver = async (data: {
  typed_name: string,
  type: string,
  content: string;
  checked_consent: boolean,
  user_id: number,
  organization_id?: number
}): Promise<Waiver> => {
  const token = await getFirebaseToken();

  const response = await fetch(`${ENDPOINT_URL}/api/waivers/create-waiver`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      typed_name: data.typed_name,
      type: data.type,
      content: data.content,
      checked_consent: data.checked_consent,
      user_id: data.user_id,
      organization_id: data.organization_id
    })
  });

  if (!response.ok) {
    console.error('Create opportunity failed with status:', response.status);
    const errorInfo = await response.json().catch(() => ({ message: response.statusText }));
    console.error('Error details:', errorInfo);
    throw new Error(errorInfo.message || 'Failed to create waiver');
  }

  return response.json();
};
// api.ts
const BASE_URL = 'https://cucaresbackend.onrender.com'; // adjust if you store it elsewhere

/**
 * Fetches user CSV data from the backend.
 * @returns CSV text as a string
 */
export const getUserCsv = async (): Promise<string> => {
  const token = await getFirebaseToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${BASE_URL}/api/users/csv`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user CSV: ${response.statusText}`);
  }

  // Return raw text since it's CSV format
  return response.text();
};

/**
 * Fetches opportunity CSV data from the backend.
 * @returns CSV text as a string
 */
export const getOpportunityCsv = async (): Promise<string> => {
  const token = await getFirebaseToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(`${BASE_URL}/api/opps/csv`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch opportunity CSV: ${response.statusText}`);
  }

  return response.text();
};

export const getServiceDataCsv = async (
  startDate: string,
  endDate: string
): Promise<Response> => {
  const token = await getFirebaseToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}/api/service-data/org/`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      start_date: startDate,
      end_date: endDate,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch opportunity CSV: ${response.statusText}`);
  }

  return await response;
};


// MULTIOPP endpoints
export const getMultiOpps = async (): Promise<MultiOpp[]> => {
  try {
    const response = await authenticatedRequest('/multiopps');
    const rawMultiOpps = Array.isArray(response) ? response : response.multiopps || [];

    return rawMultiOpps.map((multiopp: any) => {
      // Normalize start_date
      const startDate =
        typeof multiopp.start_date === 'string'
          ? multiopp.start_date
          : multiopp.start_date
            ? new Date(multiopp.start_date).toISOString()
            : null;

      // Map miniopps (individual opportunities)
      const opportunities: MiniOpp[] = Array.isArray(multiopp.opportunities)
        ? multiopp.opportunities.map((opp: any) => ({
          id: opp.id,
          date:
            typeof opp.date === 'string'
              ? opp.date
              : new Date(opp.date).toISOString(),
          duration: opp.duration ?? 0,
          total_slots: opp.total_slots ?? 10,
          involved_users: Array.isArray(opp.involved_users)
            ? opp.involved_users.map((u: any) => ({
              id: u.id,
              name: u.name ?? 'Unknown',
              profile_image: u.profile_image ?? null,
            }))
            : [],
          allow_carpool: opp.allow_carpool
        }))
        : [];


      // Extract a representative time from the first opportunity's ISO date
      const time =
        opportunities.length > 0
          ? new Date(opportunities[0].date)
            .toISOString()
            .substring(11, 16) // "HH:MM" from ISO 8601
          : null;

      return {
        id: multiopp.id,
        name: multiopp.name,
        description: multiopp.description ?? null,
        causes: multiopp.causes ?? [],
        tags: multiopp.tags ?? [],
        address: multiopp.address ?? '',
        nonprofit: multiopp.nonprofit ?? null,
        image: multiopp.image ?? null,
        approved: multiopp.approved ?? false,
        host_org_name: multiopp.host_org_name ?? null,
        host_org_id: multiopp.host_org_id ?? null,
        host_user_id: multiopp.host_user_id ?? null,
        qualifications: multiopp.qualifications ?? [],
        visibility: multiopp.visibility ?? [],
        date: startDate,
        time,
        days_of_week: multiopp.days_of_week ?? [],
        week_frequency: multiopp.week_frequency ?? null,
        week_recurrences: multiopp.week_recurrences ?? 4,
        opportunities,
      };
    });
  } catch (error) {
    console.error('Error fetching multiopps:', error);
    throw error;
  }
};

export const createMultiOpportunity = async (formData: FormData): Promise<any> => {
  const token = await getFirebaseToken();

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${ENDPOINT_URL}/api/multiopps`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    console.error('Create multiopportunity failed with status:', response.status);
    const errorInfo = await response.json().catch(() => ({ message: response.statusText }));
    console.error('Error details:', errorInfo);
    throw new Error(errorInfo.message || 'Failed to create multiopportunity');
  }

  return response.json(); // { multiopp, generated_opportunities }
};

export const updateMultiOpp = (id: number, data: object): Promise<Opportunity> =>
  authenticatedRequest(`/multiopps/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const deleteMultiOpp = (id: number): Promise<void> =>
  authenticatedRequest(`/multiopps/${id}`, {
    method: 'DELETE',
  });

// -- Cars --
export const getCar = async (userId: string) => {
  try {
    const res = await authenticatedRequest(`/cars/${userId}`);
    if (res.exists) {
      return {
        exists: true,
        car: res.car
      }
    }

    return {
      exists: false
    }
  } catch (error) {
    console.error('Error fetching car:', error);
    throw error;
  }
}

export const createOrUpdateCar = async (data: object) => {
  try {
    await authenticatedRequest('/cars', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (err) {
    throw err;
  }
}

// -- Rides -- 
export const createRide = async (data: object) => {
  try {
    await authenticatedRequest('/rides', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (err) {
    throw err;
  }
}

export const addRider = async (data: object) => {
  try {
    await authenticatedRequest('/rides/add-rider', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (err) {
    throw err;
  }
}

export const removeRider = async (data: object) => {
  try {
    await authenticatedRequest('/rides/remove-rider', {
      method: 'DELETE',
      body: JSON.stringify(data)
    });
  } catch (err) {
    throw err;
  }
}

export const removeCarpoolUser = async (data: object) => {
  try {
    const res = await authenticatedRequest('/rides/remove-carpool-user', {
      method: 'DELETE',
      body: JSON.stringify(data)
    });

    return res;
  } catch (err) {
    throw err;
  }
}

export const getRides = async (carpoolId: number): Promise<Ride[]> => {
  try {
    const res = await authenticatedRequest(`/rides/${carpoolId}`);
    return res.rides;
  } catch (err) {
    throw err;
  }
}


// Fetch all opportunities for a user (registered or hosted, past and present)
export const getUserAllTimeOpps = async (userId: number): Promise<Opportunity[]> => {
  try {
    const response = await authenticatedRequest(`/service-journal/opps/${userId}`);
    const opps = Array.isArray(response) ? response : (response.opportunities || []);

    return opps.map((opp: any) => {
      const dateObj = new Date(opp.date);
      const easternDateStr = dateObj.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const [datePart, timePart] = easternDateStr.split(', ');
      const [month, day, year] = datePart.split('/');
      const dateOnly = `${year}-${month}-${day}`;
      const timeOnly = timePart;

      const transformedInvolvedUsers = (opp.involved_users || []).map((u: any) => ({
        id: u.id,
        name: u.user || 'Unknown User',
        email: u.email || '',
        phone: u.phone || '',
        profile_image: u.profile_image,
        interests: [],
        friendIds: [],
        organizationIds: [],
        attended: u.attended,
        registered: u.registered,
      }));

      return {
        id: opp.id,
        name: opp.name,
        nonprofit: opp.nonprofit || null,
        description: opp.description || '',
        date: dateOnly,
        time: timeOnly,
        duration: opp.duration || 0,
        total_slots: opp.total_slots || 10,
        imageUrl: opp.image_url || opp.image || opp.imageUrl || '',
        points: opp.duration || 0,
        isPrivate: false,
        host_id: opp.host_user_id || opp.host_org_id,
        host_org_id: opp.host_org_id,
        host_org_name: opp.host_org_name,
        involved_users: transformedInvolvedUsers,
        address: opp.address || '',
        approved: opp.approved !== undefined ? opp.approved : true,
        attendance_marked: opp.attendance_marked !== undefined ? opp.attendance_marked : false,
        visibility: opp.visibility || [],
        comments: opp.comments || [],
        qualifications: opp.qualifications || [],
        causes: opp.causes || [],
        tags: opp.tags || [],
        redirect_url: opp.redirect_url || null,
        multiopp: opp.multiopp || null,
        multiopp_id: opp.multiopp_id || null,
        allow_carpool: opp.allow_carpool,
        carpool_id: opp.carpool_id !== undefined ? opp.carpool_id : null,
      } as Opportunity;
    });
  } catch (error) {
    console.error('Error fetching user all-time opps:', error);
    throw error;
  }
};

// Fetch the user's service journal data (JSON)
export async function getServiceJournal(userId: string, token: string) {
  try {
    const response = await fetch(`${ENDPOINT_URL}/api/service-journal/opps/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch service journal: ${response.status}`);
    }

    const data = await response.json();
    return data; // an array of opportunities
  } catch (error) {
    console.error("Error fetching service journal:", error);
    throw error;
  }
}

// Download the user's service journal CSV
export const downloadServiceJournalCSV = async (userId: string, token: string) => {
  try {
    const response = await fetch(`${ENDPOINT_URL}/api/service-journal/opps/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch service journal: ${response.statusText}`);
    }

    const data = await response.json();

    // Convert data to CSV
    const csvRows = [
      ["Event Name", "Date", "Hours", "Attended"], // header
      ...data.map((opp: any) => [
        opp.name,
        new Date(opp.date).toLocaleDateString(),
        opp.duration / 60, // convert minutes to hours
        opp.attended ? "Yes" : "No",
      ]),
    ];

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `service-journal_${userId}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error downloading CSV:", err);
  }
};