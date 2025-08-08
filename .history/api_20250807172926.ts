
import { User, Opportunity, Organization, SignUp } from './types';

// A helper for making API requests.
// In a real app, this would also handle auth tokens.
const ENDPOINT_URL = 'http://localhost:8000'
const request = async (endpoint: string, options: RequestInit = {}) => {
  const { headers, ...restOptions } = options;
  const res = await fetch(`${ENDPOINT_URL}/api${endpoint}`, {
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
    throw new Error(errorInfo.message || 'An API error occurred');
  }
  
  // For DELETE requests or other methods that might not return a body
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.indexOf("application/json") !== -1) {
    try {
        return await res.json();
    } catch(e) {
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
        console.log('Debug - Calling /opps endpoint...');
        const response = await request('/opps');
        console.log('Debug - /opps response:', response);
        console.log('Debug - response.opportunities:', response.opportunities);
        return response.opportunities || [];
    } catch (error) {
        console.error('Debug - Error fetching opportunities:', error);
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