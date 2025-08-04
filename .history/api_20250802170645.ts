
import { User, Opportunity, Organization, SignUp } from './types';

// A helper for making API requests.
// In a real app, this would also handle auth tokens.
const ENDPOINT_URL = 'http://127.0.0.1:8000/'
const request = async (endpoint: string, options: RequestInit = {}) => {
  const { headers, ...restOptions } = options;
  const res = await fetch(`${ENDPOINT_URL}/api${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
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
export const getOrg = (id: number): Promise<Organization> => request(`/orgs/${id}`);
export const createOrg = (data: object): Promise<Organization> => request('/orgs', {
    method: 'POST',
    body: JSON.stringify(data)
});

// --- Opportunities ---
export const getOpportunities = async (): Promise<Opportunity[]> => {
    const response = await request('/opps');
    return response.opportunities || [];
};
export const getOpportunity = (id: number): Promise<Opportunity> => request(`/opps/${id}`);

// --- Registrations (SignUps) ---
// The provided API spec is ambiguous for these endpoints. We're making assumptions.
// 1. GET /register-opp must exist to fetch all signups.
export const getSignups = (): Promise<any[]> => request('/register-opp').catch(() => []); // Default to empty array if endpoint doesn't exist
// 2. POST /register-opp for signing up.
export const registerForOpp = (data: { user_id: number; opportunity_id: number }) => request('/register-opp', {
  method: 'POST',
  body: JSON.stringify(data),
});
// 3. DELETE /register-opp for un-registering. This is a common pattern but not in the spec.
export const unregisterForOpp = (data: { user_id: number; opportunity_id: number }) => request('/register-opp', {
  method: 'DELETE',
  body: JSON.stringify(data),
});