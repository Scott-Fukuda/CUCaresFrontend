
import { User, MinimalUser, Opportunity, Organization, SignUp, Friendship, FriendRequest, FriendshipStatus } from './types';

// Helper function to get profile picture URL
// Returns a generic silhouette when no profile image is available
export const getProfilePictureUrl = (profilePictureUrl?: string | null, userId?: number): string => {
  if (profilePictureUrl) {
    return profilePictureUrl;
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
// In a real app, this would also handle auth tokens.
const ENDPOINT_URL = 'http://localhost:8000'

// Helper to get Firebase token
const getFirebaseToken = async (): Promise<string | null> => {
  try {
    const { auth } = await import('./firebase-config');
    const currentUser = auth.currentUser;
    if (currentUser) {
      return await currentUser.getIdToken();
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

// Get detailed user data for a specific user
export const getUserById = async (id: number): Promise<User> => {
    const response = await authenticatedRequest(`/users/${id}`);
    return {
        ...response,
        firstName: response.name.split(' ')[0] || '',
        lastName: response.name.split(' ').slice(1).join(' ') || '',
        // Extract organization IDs from the organizations array
        organizationIds: (response.organizations || []).map((org: any) => org.id) || [],
        friendIds: response.friendIds || [],
        interests: response.interests || [],
        // Use helper function for profile picture
        profilePictureUrl: getProfilePictureUrl(response.profilePictureUrl || response.profile_image, response.id),
        // Handle registration_date field from backend
        registration_date: response.registration_date || response.registrationDate,
    };
};
export const getUser = async (id: number): Promise<User> => {
    const response = await request(`/users/${id}`);
    return {
        ...response,
        firstName: response.name.split(' ')[0] || '',
        lastName: response.name.split(' ').slice(1).join(' ') || '',
        // Extract organization IDs from the organizations array
        organizationIds: (response.organizations || []).map((org: any) => org.id) || [],
        friendIds: response.friendIds || [],
        interests: response.interests || [],
        // Use helper function for profile picture
        profilePictureUrl: getProfilePictureUrl(response.profilePictureUrl || response.profile_image, response.id),
        // Handle registration_date field from backend
        registration_date: response.registration_date || response.registrationDate,
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

export const getUserFriendRequests = async (userId: number): Promise<FriendRequest[]> => {
  console.log(`API: Fetching friend requests for user ${userId}`);
  const result = await authenticatedRequest(`/users/${userId}/friend-requests`);
  console.log(`API: Friend requests response:`, result);
  
  let rawRequests: any[] = [];
  
  // Handle different response structures the backend might return
  if (Array.isArray(result)) {
    rawRequests = result;
  } else if (result && Array.isArray(result.friend_requests)) {
    rawRequests = result.friend_requests;
  } else if (result && Array.isArray(result.friendRequests)) {
    rawRequests = result.friendRequests;
  } else if (result && Array.isArray(result.data)) {
    rawRequests = result.data;
  } else {
    console.warn('Unexpected friend requests response structure:', result);
    return [];
  }
  
  // Transform field names to match our interface
  return rawRequests.map(req => ({
    id: req.id,
    fromUserId: req.fromUserId || req.from_user_id || req.sender_id,
    toUserId: req.toUserId || req.to_user_id || req.receiver_id,
    status: req.status,
    created_at: req.created_at || req.createdAt,
    updated_at: req.updated_at || req.updatedAt
  }));
};

export const getUserFriendships = async (userId: number): Promise<Friendship[]> => {
  console.log(`API: Fetching friendships for user ${userId}`);
  const result = await authenticatedRequest(`/users/${userId}/friendships`);
  console.log(`API: Friendships response:`, result);
  
  let rawFriendships: any[] = [];
  
  // Handle different response structures the backend might return
  if (Array.isArray(result)) {
    rawFriendships = result;
  } else if (result && Array.isArray(result.friendships)) {
    rawFriendships = result.friendships;
  } else if (result && Array.isArray(result.data)) {
    rawFriendships = result.data;
  } else {
    console.warn('Unexpected friendships response structure:', result);
    return [];
  }
  
  // Transform field names to match our interface
  return rawFriendships.map(friendship => ({
    id: friendship.id,
    user1_id: friendship.user1_id || friendship.user1Id,
    user2_id: friendship.user2_id || friendship.user2Id,
    status: friendship.status,
    created_at: friendship.created_at || friendship.createdAt,
    updated_at: friendship.updated_at || friendship.updatedAt
  }));
};

export const sendFriendRequest = (userId: number, friendId: number) => authenticatedRequest(`/users/${userId}/friends`, {
  method: 'POST',
  body: JSON.stringify({ receiver_id: friendId }),
});

export const acceptFriendRequest = (friendshipId: number, receiverId: number) => authenticatedRequest(`/friendships/${friendshipId}/accept`, {
  method: 'PUT',
  body: JSON.stringify({ receiver_id: receiverId }),
});

export const rejectFriendRequest = (friendshipId: number, receiverId: number) => authenticatedRequest(`/friendships/${friendshipId}/reject`, {
  method: 'PUT',
  body: JSON.stringify({ receiver_id: receiverId }),
});

export const removeFriend = (userId: number, friendId: number) => request(`/users/${userId}/friends/${friendId}`, {
  method: 'DELETE',
});

export const checkFriendshipStatus = async (userId: number, friendId: number): Promise<FriendshipStatus> => {
  console.log(`API: Checking friendship status between user ${userId} and friend ${friendId}`);
  const result = await request(`/users/${userId}/friends/check/${friendId}`);
  console.log(`API: Friendship status response:`, result);
  return result;
};

// Get accepted friendships for a user
export const getAcceptedFriendships = async (userId: number): Promise<User[]> => {
  console.log(`API: Fetching accepted friendships for user ${userId}`);
  try {
    const result = await request(`/users/${userId}/friends`);
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
        firstName: (friendship.other_user_name || friendship.name || '').split(' ')[0] || '',
        lastName: (friendship.other_user_name || friendship.name || '').split(' ').slice(1).join(' ') || '',
        email: '', // Not provided in friendship response
        password: '', // Not provided in friendship response
        profilePictureUrl: friendship.other_user_profile_image || friendship.profile_image,
        interests: [], // Not provided in friendship response
        friendIds: [], // Not provided in friendship response
        organizationIds: [], // Not provided in friendship response
        graduationYear: '', // Not provided in friendship response
        academicLevel: '', // Not provided in friendship response
        major: '', // Not provided in friendship response
        birthday: '', // Not provided in friendship response
        points: 0, // Not provided in friendship response
        admin: false, // Not provided in friendship response
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
export const registerForOrg = (data: { user_id: number; organization_id: number }) => request('/register-org', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const unregisterFromOrg = (data: { user_id: number; organization_id: number }) => request('/unregister-org', {
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
        const response = await request('/opps');
        console.log('getOpportunities raw response:', response);
        
        // Transform backend data to match frontend expectations
        const transformedOpportunities = (response.opportunities || []).map((opp: any) => {
            console.log(`Processing opportunity ${opp.id} - ${opp.name}:`, opp);
            // Parse the date string from backend (e.g., "Sat, 26 Sep 2026 18:30:00 GMT" or "2025-08-18T18:17:00")
            const dateObj = new Date(opp.date);
            
            // Extract date and time components
            // Subtract one day from the date
            dateObj.setDate(dateObj.getDate() + 1);
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
                console.log('Raw involved user registered field:', involvedUser.registered);
                console.log('Raw involved user attended field:', involvedUser.attended);
                
                // Split the user name into firstName and lastName
                const nameParts = involvedUser.user.split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';
                
                const transformedUser = {
                    id: involvedUser.id,
                    firstName,
                    lastName,
                    email: '', // Not provided by backend
                    phone: involvedUser.phone || '',
                    profilePictureUrl: getProfilePictureUrl(involvedUser.profilePictureUrl || involvedUser.profile_image, involvedUser.id),
                    interests: [],
                    friendIds: [],
                    organizationIds: [],
                    // Add attendance info if needed
                    attended: involvedUser.attended,
                    registered: involvedUser.registered
                };
                
                console.log('Transformed user result:', transformedUser);
                return transformedUser;
            });
            
            // Use image URL directly from backend (full URLs like "https://imgur.com/a/y0f0Geb")
            const resolvedImageUrl = opp.image_url || opp.image || opp.imageUrl || 'https://campus-cares.s3.us-east-2.amazonaws.com/default-opp-image.png';
            
            return {
                id: opp.id,
                name: opp.name, // Use name directly from backend
                nonprofit: opp.nonprofit || null, // Use nonprofit from backend, can be null
                description: opp.description,
                date: dateOnly,
                time: timeOnly,
                duration: opp.duration,
                totalSlots: opp.total_slots || 10, // Use total_slots from backend
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
export const getOpportunity = (id: number): Promise<Opportunity> => request(`/opps/${id}`);

export const getUnapprovedOpportunities = async (): Promise<Opportunity[]> => {
    const response = await request('/opps/unapproved');
    return response.opportunities || [];
};

export const updateOpportunity = (id: number, data: object): Promise<Opportunity> => request(`/opps/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
});

export const deleteOpportunity = (id: number): Promise<void> => request(`/opps/${id}`, {
    method: 'DELETE'
});
// --- SignUps (Registrations) ---
// POST /register-opp for signing up.
export const registerForOpp = async (data: { user_id: number; opportunity_id: number }) => {
  console.log('Making registerForOpp API call with data:', data);
  const result = await request('/register-opp', {
  method: 'POST',
  body: JSON.stringify(data),
});
  console.log('registerForOpp API response:', result);
  return result;
};
// POST /unregister-opp for un-registering.
export const unregisterForOpp = (data: { user_id: number; opportunity_id: number }) => request('/unregister-opp', {
  method: 'POST',
  body: JSON.stringify(data),
});

// --- Create Opportunity ---
export const createOpportunity = async (formData: FormData): Promise<Opportunity> => {
  // Don't add approved field - let the backend set the default value
  // FormData only accepts strings, but backend expects boolean for approved field
  
  // Debug: Log the form data being sent
  console.log('Creating opportunity with form data:');
  for (let [key, value] of formData.entries()) {
    console.log(`${key}:`, value);
  }
  
  // For FormData, we need to let the browser set the Content-Type with boundary
  const response = await fetch(`${ENDPOINT_URL}/api/opps`, {
    method: 'POST',
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
    request('/attendance', {
      method: 'PUT',
      body: JSON.stringify({
        user_id: userId,
        opportunity_id: data.opportunity_id
      }),
    })
  );
  
  return Promise.all(promises);
};