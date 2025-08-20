
import { User, Opportunity, Organization, SignUp } from './types';

// A helper for making API requests.
// In a real app, this would also handle auth tokens.
const ENDPOINT_URL = 'http://localhost:8000'
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


// --- Users ---
export const getUsers = async (): Promise<User[]> => {
    const response = await request('/users');
    // API spec has `name`, but app uses `firstName`, `lastName`. We'll split it.
    return response.users.map((u: any) => ({
        ...u,
        firstName: u.name.split(' ')[0] || '',
        lastName: u.name.split(' ').slice(1).join(' ') || '',
        // Ensure arrays are present
        organizationIds: u.organizationIds || [],
        friendIds: u.friendIds || [],
        interests: u.interests || [],
    }));
};
export const getUser = (id: number): Promise<User> => request(`/users/${id}`);
export const updateUser = (id: number, data: object): Promise<User> => request(`/users/${id}`, {
  method: 'PUT',
  body: JSON.stringify(data),
});
export const registerUser = (data: object): Promise<User> => request('/users', {
  method: 'POST',
  body: JSON.stringify(data),
});

// --- Organizations (Groups) ---
export const getOrgs = async (): Promise<Organization[]> => {
    const response = await request('/orgs');
    return response.organizations || [];
};

export const getApprovedOrgs = async (): Promise<Organization[]> => {
    const response = await request('/orgs/approved');
    return response.organizations || [];
};

export const getOrg = (id: number): Promise<Organization> => request(`/orgs/${id}`);
export const createOrg = (data: object): Promise<Organization> => request('/orgs', {
    method: 'POST',
    body: JSON.stringify(data)
});

// --- Friend Management ---
export const getUserFriends = (userId: number): Promise<User[]> => request(`/users/${userId}/friends`);

export const addFriend = (userId: number, friendId: number) => request(`/users/${userId}/friends`, {
  method: 'POST',
  body: JSON.stringify({ friend_id: friendId }),
});

export const removeFriend = (userId: number, friendId: number) => request(`/users/${userId}/friends/${friendId}`, {
  method: 'DELETE',
});

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

export const unregisterForOrg = (data: { user_id: number; organization_id: number }) => request('/register-org', {
  method: 'DELETE',
  body: JSON.stringify(data),
});

// --- Opportunities ---
export const getOpportunities = async (): Promise<Opportunity[]> => {
    try {
        const response = await request('/opps');
        
        // Transform backend data to match frontend expectations
        const transformedOpportunities = (response.opportunities || []).map((opp: any) => {
            // Parse the date string from backend (e.g., "Sat, 26 Sep 2026 18:30:00 GMT" or "2025-08-18T18:17:00")
            const dateObj = new Date(opp.date);
            
            // Extract date and time components
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
                    profilePictureUrl: `https://i.pravatar.cc/150?u=${involvedUser.id}`,
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
            const resolvedImageUrl = opp.image_url || opp.image || opp.imageUrl || 'https://via.placeholder.com/300x200?text=Opportunity';
            
            return {
                id: opp.id,
                name: opp.name, // Use name directly from backend
                nonprofit: opp.nonprofit || `Organization ${opp.host_org_id}`, // Use nonprofit from backend
                description: opp.description,
                date: dateOnly,
                time: timeOnly,
                duration: opp.duration,
                totalSlots: opp.total_slots || 10, // Use total_slots from backend
                imageUrl: resolvedImageUrl,
                points: opp.duration || 0, // 1 minute = 1 point
                cause: opp.cause,
                isPrivate: false, // Default
                host_id: opp.host_user_id || opp.host_org_id, // Include host_id from backend
                involved_users: transformedInvolvedUsers // Include transformed involved_users
            };
        });
        
        return transformedOpportunities;
    } catch (error) {
        console.error('Error fetching opportunities:', error);
        throw error;
    }
};
export const getOpportunity = (id: number): Promise<Opportunity> => request(`/opps/${id}`);
// --- SignUps (Registrations) ---
// POST /register-opp for signing up.
export const registerForOpp = (data: { user_id: number; opportunity_id: number }) => request('/register-opp', {
  method: 'POST',
  body: JSON.stringify(data),
});
// POST /unregister-opp for un-registering.
export const unregisterForOpp = (data: { user_id: number; opportunity_id: number }) => request('/unregister-opp', {
  method: 'POST',
  body: JSON.stringify(data),
});

// --- Create Opportunity ---
export const createOpportunity = async (formData: FormData): Promise<Opportunity> => {
  const response = await fetch(`${ENDPOINT_URL}/api/opps`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorInfo = await response.json().catch(() => ({ message: response.statusText }));
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