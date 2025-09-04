
import { User, MinimalUser, Opportunity, Organization, SignUp, Friendship, FriendshipStatus, FriendshipsResponse } from './types';
import { auth } from './firebase-config';

// Helper function to get profile picture URL
// Returns a generic silhouette when no profile image is available
export const getProfilePictureUrl = (profile_image?: string | null, userId?: number): string => {
  if (profile_image) {
    return profile_image;
  }
  // Return a generic silhouette SVG instead of a randomly generated avatar
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236B7280'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
};

// Helper function to format registration date for backend API
// Returns format: YYYY-MM-DDTHH:MM:SS (without timezone and milliseconds)
export const formatRegistrationDate = (date: Date = new Date()): string => {
  return date.toISOString().slice(0, 19);
};

// A helper for making API requests.
const ENDPOINT_URL = 'https://cucaresbackend.onrender.com'

// Helper to get Firebase token
const getFirebaseToken = async (): Promise<string | null> => {
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const token = await currentUser.getIdToken();
      console.log('Firebase token retrieved successfully:', token ? 'Token exists' : 'No token');
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
      'Accept': 'application/json',
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
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    try {
        return await res.json();
    } catch(e) {
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
    console.log('Adding Authorization header to request:', endpoint);
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


// --- Users ---
// Get minimal user data (id and name only) for lists
export const getUsers = async (): Promise<MinimalUser[]> => {
    const response = await request('/users');
    return response.users || [];
};

export const getSecureUsers = async (): Promise<User[]> => {
    const response = await authenticatedRequest('/users/secure');
    const users = response.users || [];
    
    // Transform each user to extract organizationIds from organizations array
    return users.map((user: any) => ({
        ...user,
        // Extract organization IDs from the organizations array
        organizationIds: (user.organizations || []).map((org: any) => org.id) || [],
        // Ensure other fields have fallbacks
        friendIds: user.friends || [],
        interests: user.interests || [],
        // Use profile_image from backend
        profile_image: user.profile_image,
        // Handle registration_date field from backend
        registration_date: user.registration_date,
        // Ensure required fields have defaults
        points: user.points || 0,
        admin: user.admin || false,
        registered: false, // Default value
        attended: false, // Default value
    }));
};

// Get detailed user data for a specific user
export const getUserById = async (id: number): Promise<User> => {
    const response = await authenticatedRequest(`/users/${id}`);
    return {
        ...response,
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
    };
};
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
    };
};
export const updateUser = (id: number, data: object): Promise<User> => authenticatedRequest(`/users/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});

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
export const registerUser = (data: object): Promise<User> => authenticatedRequest('/users', {
  method: 'POST',
  body: JSON.stringify(data),
});

// --- Organizations (Groups) ---
export const getOrgs = async (): Promise<Organization[]> => {
    const response = await authenticatedRequest('/orgs');
    return response.organizations || [];
};

export const getApprovedOrgs = async (): Promise<Organization[]> => {
    const response = await authenticatedRequest('/orgs/approved');
    return response.organizations || [];
};

export const getOrg = (id: number): Promise<Organization> => authenticatedRequest(`/orgs/${id}`);
export const createOrg = (data: object): Promise<Organization> => authenticatedRequest('/orgs', {
    method: 'POST',
    body: JSON.stringify(data)
});

export const getUnapprovedOrgs = async (): Promise<Organization[]> => {
    const response = await authenticatedRequest('/orgs/unapproved');
    return response.organizations || [];
};

export const updateOrganization = (id: number, data: object): Promise<Organization> => authenticatedRequest(`/orgs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
});

export const deleteOrganization = (id: number): Promise<void> => authenticatedRequest(`/orgs/${id}`, {
    method: 'DELETE'
});

// --- Friend Management ---
export const getAllFriendships = (): Promise<Friendship[]> => authenticatedRequest('/friendships');

export const getUserFriends = async (userId: number): Promise<any> => {
  console.log(`API: Fetching friends for user ${userId}`);
  const result = await authenticatedRequest(`/users/${userId}/friends`);
  console.log(`API: Friends response:`, result);
  
  // The backend returns { count: number, friendships: [...] }
  if (result && Array.isArray(result.friendships)) {
    return result; // Return the full response structure
  }
  
  console.warn('Unexpected friends response structure:', result);
  return { count: 0, friendships: [] };
};

export const getUserFriendships = async (userId: number): Promise<FriendshipsResponse> => {
  console.log(`API: Fetching friendships for user ${userId}`);
  const result = await authenticatedRequest(`/users/${userId}/friendships/all`);
  console.log(`API: Friendships response:`, result);
  return result;
};

// Get friendship ID between two users
export const getFriendshipId = async (userId: number, otherUserId: number): Promise<number | null> => {
  try {
    console.log(`API: Getting friendship ID between user ${userId} and ${otherUserId}`);
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



export const sendFriendRequest = (userId: number, friendId: number) => authenticatedRequest(`/users/${userId}/friends`, {
  method: 'POST',
  body: JSON.stringify({ receiver_id: friendId }),
});

export const acceptFriendRequest = (friendshipId: number) => authenticatedRequest(`/friendships/${friendshipId}/accept`, {
  method: 'PUT',
});

export const rejectFriendRequest = (friendshipId: number) => authenticatedRequest(`/friendships/${friendshipId}/reject`, {
  method: 'PUT',
});

export const removeFriend = (userId: number, friendId: number) => authenticatedRequest(`/users/${userId}/friends/${friendId}`, {
  method: 'DELETE',
});

export const checkFriendshipStatus = async (userId: number, friendId: number): Promise<FriendshipStatus> => {
  console.log(`API: Checking friendship status between user ${userId} and friend ${friendId}`);
  const result = await authenticatedRequest(`/users/${userId}/friends/check/${friendId}`);
  console.log(`API: Friendship status response:`, result);
  return result;
};

// Get accepted friendships for a user
export const getAcceptedFriendships = async (userId: number): Promise<User[]> => {
  console.log(`API: Fetching accepted friendships for user ${userId}`);
  try {
    const result = await authenticatedRequest(`/users/${userId}/friends`);
    console.log(`API: Friends response:`, result);
    
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
    
    if (friendsArray.length >= 0) { // Process even empty arrays
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
        attended: false // Not provided in friendship response
      }));
    }
    console.warn('Unexpected friends response structure:', result);
    console.log('Response type:', typeof result);
    console.log('Response keys:', result ? Object.keys(result) : 'null/undefined');
    console.log('Response structure:', JSON.stringify(result, null, 2));
    return [];
  } catch (error) {
    console.warn(`API: Friends endpoint not available yet: ${error}`);
    return [];
  }
};

// --- Organization Registration ---
export const registerForOrg = (data: { user_id: number; organization_id: number }) => authenticatedRequest('/register-org', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const unregisterFromOrg = (data: { user_id: number; organization_id: number }) => authenticatedRequest('/unregister-org', {
  method: 'POST',
  body: JSON.stringify(data),
});

// --- Firebase Authentication ---
export const verifyFirebaseToken = async (token: string) => {
  const response = await fetch(`${ENDPOINT_URL}/api/protected`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
  
  // Handle non-JSON responses (like HTML error pages)
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`Server returned ${response.status}: ${response.statusText}. Expected JSON response.`);
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

export const unregisterForOrg = (data: { user_id: number; organization_id: number }) => request('/unregister-org', {
  method: 'POST',
  body: JSON.stringify(data),
});

// --- Opportunities ---
export const getOpportunities = async (): Promise<Opportunity[]> => {
    try {
        const response = await authenticatedRequest('/opps');
        console.log('getOpportunities raw response:', response);
        
        // Transform backend data to match frontend expectations
        const transformedOpportunities = (response.opportunities || []).map((opp: any) => {
            console.log(`Processing opportunity ${opp.id} - ${opp.name}:`, opp);
            // Parse the date string from backend (e.g., "Sat, 26 Sep 2026 18:30:00 GMT" or "2025-08-18T18:17:00")
            const dateObj = new Date(opp.date);
            
            // Extract date and time components
            // Use the date as provided by the backend without manipulation
            const dateOnly = dateObj.toISOString().split('T')[0]; // YYYY-MM-DD format
          
            
            // Extract time in HH:MM:SS format
            // If the original string contains GMT, convert GMT to Eastern Time (UTC-4)
            // Otherwise, assume it's already Eastern Time
            let timeOnly;
            if (opp.date.includes('GMT')) {
                // GMT format - convert to Eastern Time (UTC-4)
                const gmtHours = dateObj.getUTCHours();
                const easternHours = (gmtHours - 4 + 24) % 24; // Convert GMT to Eastern
                const hours = easternHours.toString().padStart(2, '0');
                const minutes = dateObj.getUTCMinutes().toString().padStart(2, '0');
                const seconds = dateObj.getUTCSeconds().toString().padStart(2, '0');
                timeOnly = `${hours}:${minutes}:${seconds}`;
            } else {
                // Already Eastern Time - use as is
                const hours = dateObj.getHours().toString().padStart(2, '0');
                const minutes = dateObj.getMinutes().toString().padStart(2, '0');
                const seconds = dateObj.getSeconds().toString().padStart(2, '0');
                timeOnly = `${hours}:${minutes}:${seconds}`;
            }
            
            // Transform involved_users from backend format to frontend User format
            const transformedInvolvedUsers = (opp.involved_users || []).map((involvedUser: any) => {
                console.log('Transforming involved user:', involvedUser);
                
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
                    registered: involvedUser.registered
                };
                
                return transformedUser;
            });
            
            // Use image URL directly from backend (full URLs like "https://imgur.com/a/y0f0Geb")
            const resolvedImageUrl = opp.image_url || opp.image || opp.imageUrl || 'https://campus-cares.s3.us-east-2.amazonaws.com';
            
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
                causes: opp.causes || opp.cause ? [opp.cause] : [], // Handle both array and single cause
                isPrivate: false, // Default
                host_id: opp.host_user_id || opp.host_org_id, // Include host_id from backend
                host_org_id: opp.host_org_id, // Include host organization ID
                host_org_name: opp.host_org_name, // Include host organization name
                involved_users: transformedInvolvedUsers, // Include transformed involved_users
                address: opp.address || '', // Address is now required
                approved: opp.approved !== undefined ? opp.approved : true // Default to true if not specified
            };
        });
        
        return transformedOpportunities;
    } catch (error) {
        console.error('Error fetching opportunities:', error);
        throw error;
    }
};
export const getOpportunity = (id: number): Promise<Opportunity> => authenticatedRequest(`/opps/${id}`);

export const getUnapprovedOpportunities = async (): Promise<Opportunity[]> => {
    const response = await authenticatedRequest('/opps/unapproved');
    return response.opportunities || [];
};

export const updateOpportunity = (id: number, data: object): Promise<Opportunity> => authenticatedRequest(`/opps/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
});

export const deleteOpportunity = (id: number): Promise<void> => authenticatedRequest(`/opps/${id}`, {
    method: 'DELETE'
});
// --- SignUps (Registrations) ---
// POST /register-opp for signing up.
export const registerForOpp = async (data: { user_id: number; opportunity_id: number }) => {
  console.log('Making registerForOpp API call with data:', data);
  const result = await authenticatedRequest('/register-opp', {
  method: 'POST',
  body: JSON.stringify(data),
});
  console.log('registerForOpp API response:', result);
  return result;
};
// POST /unregister-opp for un-registering.
export const unregisterForOpp = async (data: { user_id: number; opportunity_id: number; opportunityDate?: string; opportunityTime?: string }) => {
  // If opportunity date/time is provided, validate the 12-hour rule on frontend
  if (data.opportunityDate && data.opportunityTime) {
    const { canUnregister } = await import('./utils/timeUtils').then(utils => 
      utils.canUnregisterFromOpportunity(data.opportunityDate!, data.opportunityTime!)
    );
    
    if (!canUnregister) {
      throw new Error('Cannot unregister within 12 hours of the event. Please contact the event organizer if you need to cancel.');
    }
  }
  
  return authenticatedRequest('/unregister-opp', {
  method: 'POST',
    body: JSON.stringify({
      user_id: data.user_id,
      opportunity_id: data.opportunity_id
    }),
});
};

// --- Create Opportunity ---
export const createOpportunity = async (formData: FormData): Promise<Opportunity> => {
  // Don't add approved field - let the backend set the default value
  // FormData only accepts strings, but backend expects boolean for approved field
  
  // Debug: Log the form data being sent
  console.log('Creating opportunity with form data:');
  for (let [key, value] of formData.entries()) {
    console.log(`${key}:`, value);
  }
  
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
export const markAttendance = async (data: { user_ids: number[]; opportunity_id: number }) => {
  // The API expects user_id (singular), so we need to make individual calls for each user
  const promises = data.user_ids.map(userId => 
    authenticatedRequest('/attendance', {
      method: 'PUT',
      body: JSON.stringify({
        user_id: userId,
        opportunity_id: data.opportunity_id
      }),
    })
  );
  
  return Promise.all(promises);
};
