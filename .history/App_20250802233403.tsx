
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { User, Opportunity, Organization, Badge } from './types';
import { initialBadges } from './data/initialData';
import Header from './components/Header';
import Login from './components/Login';
import BottomNav from './components/BottomNav';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import GroupsPage from './pages/GroupsPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import OpportunityDetailPage from './pages/OpportunityDetailPage';


export type Page = 'opportunities' | 'leaderboard' | 'profile' | 'groups' | 'notifications' | 'opportunityDetail';
export type PageState = {
  page: Page;
  [key: string]: any;
};

// =================================================================
// API Functions
// =================================================================

const API_BASE_URL = '/api';

// A generic fetch wrapper
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options
    });

    if (!response.ok) {
        let errorMsg = `API Error: ${response.status} ${response.statusText}`;
        try {
            const errorBody = await response.json();
            errorMsg = errorBody.message || errorMsg;
        } catch (e) { /* Not a JSON response */ }
        throw new Error(errorMsg);
    }
    
    if (response.status === 204 || options.method === 'DELETE' || options.method === 'PUT') {
        return {} as T;
    }

    return response.json();
}

// User Endpoints
const api = {
    // NOTE: A real login endpoint is missing. This simulates login by fetching all users
    // and finding one by email. This is insecure and inefficient and for demonstration only.
    login: async (email: string): Promise<User> => {
       const { users } = await apiRequest<{users: User[]}>(`/users?email=${encodeURIComponent(email)}`);
       if (users.length === 0) throw new Error("User not found.");
       return users[0];
    },
    register: (name: string, email: string, password: string): Promise<User> => 
        apiRequest<User>('/users', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
    updateUser: (userId: number, data: Partial<User>): Promise<void> =>
        apiRequest(`/users/${userId}`, { method: 'PUT', body: JSON.stringify(data) }),
    getUsers: (): Promise<{users: User[]}> => apiRequest('/users'),
    // Opp Endpoints
    getOpportunities: (): Promise<{opportunities: Opportunity[]}> => apiRequest('/opps'),
    signUpForOpportunity: (userId: number, opportunityId: number): Promise<void> => 
        apiRequest('/register-opp', { method: 'POST', body: JSON.stringify({ user_id: userId, opportunity_id: opportunityId }) }),
    // NOTE: An un-register endpoint is missing. Assuming a DELETE method to the same endpoint.
    unSignUpFromOpportunity: (userId: number, opportunityId: number): Promise<void> =>
        apiRequest('/register-opp', { method: 'DELETE', body: JSON.stringify({ user_id: userId, opportunity_id: opportunityId }) }),
    // Org Endpoints
    getOrganizations: (): Promise<{organizations: Organization[]}> => apiRequest('/orgs'),
};

// =================================================================


const App: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pageState, setPageState] = useState<PageState>({ page: 'opportunities' });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersData, oppsData, orgsData] = await Promise.all([
        api.getUsers(),
        api.getOpportunities(),
        api.getOrganizations(),
      ]);
      setUsers(usersData.users || []);
      setOpportunities(oppsData.opportunities || []);
      setOrganizations(orgsData.organizations || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auth Handlers
  const handleLogin = async (email: string, password: string) => {
    setAuthError(null);
    try {
      // The password is not used here as we can't verify it without a proper backend endpoint
      const user = await api.login(email);
      setCurrentUser(user);
      // Fetch the latest data after login
      await fetchData();
      setPageState({ page: 'opportunities' });
    } catch (err: any) {
      setAuthError(err.message || 'Invalid email or password.');
    }
  };

  const handleRegister = async (firstName: string, lastName: string, email: string, password: string) => {
    setAuthError(null);
    if (!email.toLowerCase().endsWith('@cornell.edu')) {
      setAuthError('Please use a valid @cornell.edu email address.');
      return;
    }
    try {
      const newUser = await api.register(`${firstName} ${lastName}`, email, password);
      setCurrentUser(newUser);
      // Add new user to local state to avoid full refetch
      setUsers(prev => [...prev, newUser]);
      setPageState({ page: 'profile' });
    } catch(err: any) {
      setAuthError(err.message || 'Registration failed.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthError(null);
    setPageState({ page: 'opportunities' });
  };
  
  const refreshData = async () => {
    // Optionally refresh a specific user or all data
    await fetchData();
  };

  // Signups
  const handleSignUp = useCallback(async (opportunityId: number) => {
    if (!currentUser) return;
    try {
      await api.signUpForOpportunity(currentUser.id, opportunityId);
      // For immediate UI feedback, we can optimistically update state or refetch
      await refreshData();
    } catch (err) {
      console.error("Failed to sign up", err);
      alert("There was an error signing up. Please try again.");
    }
  }, [currentUser]);

  const handleUnSignUp = useCallback(async (opportunityId: number) => {
    if (!currentUser) return;
     try {
      await api.unSignUpFromOpportunity(currentUser.id, opportunityId);
      await refreshData();
    } catch (err) {
      console.error("Failed to un-sign up", err);
      alert("There was an error removing your signup. Please try again.");
    }
  }, [currentUser]);
  
  const currentUserSignupsSet = useMemo(() => {
    if (!currentUser) return new Set<number>();
     // Derive from opportunities data if it contains registration info
    const userSignups = opportunities.filter(opp => 
        opp.registrations?.some(reg => reg.userId === currentUser.id)
    ).map(opp => opp.id);
    return new Set(userSignups);
  }, [currentUser, opportunities]);

  // Badges Calculation (remains frontend for now)
  const { userPoints, earnedBadges } = useMemo(() => {
    if (!currentUser) return { userPoints: 0, earnedBadges: [] };
    const points = currentUser.points || 0;
    
    // We can't calculate signups for badges accurately without full registration data
    // This is a simplification based on what we can derive
    const signUpCount = currentUserSignupsSet.size;

    const badges = initialBadges.filter(b => b.threshold({
        points, 
        signUpCount,
        // The following are simplified as full data may not be on client
        signups: [], 
        opportunities: [], 
        friendsCount: 0 
    }));
    return { userPoints: points, earnedBadges: badges };
  }, [currentUser, currentUserSignupsSet]);

  // Profile Updates
  const updateInterests = useCallback(async (interests: string[]) => {
    if (!currentUser) return;
    try {
        await api.updateUser(currentUser.id, { interests });
        setCurrentUser(prev => prev ? { ...prev, interests } : null);
        setUsers(prev => prev.map(s => s.id === currentUser.id ? { ...s, interests } : s));
    } catch (err) {
        console.error("Failed to update interests", err);
        alert("There was an error updating your interests.");
    }
  }, [currentUser]);

  const updateProfilePicture = useCallback(async (base64: string) => {
    if (!currentUser) return;
     try {
        await api.updateUser(currentUser.id, { profilePictureUrl: base64 });
        setCurrentUser(prev => prev ? { ...prev, profilePictureUrl: base64 } : null);
        setUsers(prev => prev.map(s => s.id === currentUser.id ? { ...s, profilePictureUrl: base64 } : s));
    } catch (err) {
        console.error("Failed to update profile picture", err);
        alert("There was an error updating your profile picture.");
    }
  }, [currentUser]);


  const renderPage = () => {
    if (isLoading) {
        return <div className="text-center p-10">Loading...</div>;
    }
    if (error) {
        return <div className="text-center p-10 text-red-600">{error}</div>;
    }
    if (!currentUser) return null;

    switch (pageState.page) {
        case 'opportunities':
            return <OpportunitiesPage opportunities={opportunities} users={users} allOrgs={organizations} currentUser={currentUser} handleSignUp={handleSignUp} handleUnSignUp={handleUnSignUp} setPageState={setPageState} currentUserSignupsSet={currentUserSignupsSet} />;
        case 'opportunityDetail':
            const opp = opportunities.find(o => o.id === pageState.id);
            if (!opp) return <p>Opportunity not found.</p>;
            return <OpportunityDetailPage opportunity={opp} users={users} currentUser={currentUser} handleSignUp={handleSignUp} handleUnSignUp={handleUnSignUp} setPageState={setPageState} allOrgs={organizations} currentUserSignupsSet={currentUserSignupsSet} />;
        case 'leaderboard':
            return <LeaderboardPage allUsers={users} allOrgs={organizations} currentUser={currentUser} setPageState={setPageState}/>;
        case 'profile':
            const profileUser = pageState.userId ? users.find(s => s.id === pageState.userId) : currentUser;
            if(!profileUser) return <p>User not found</p>;
            
            // This logic can be simplified as most data comes from the user object now
            const profileUserGroups = organizations.filter(g => profileUser.organizationIds?.includes(g.id));
            const profileHours = 0; // This data isn't provided by the backend API spec.
            const profileBadges = []; // Badge calculation needs to be re-evaluated with backend data.

            return <ProfilePage 
                        user={profileUser}
                        isCurrentUser={profileUser.id === currentUser.id}
                        currentUser={currentUser}
                        earnedBadges={profileUser.id === currentUser.id ? earnedBadges : profileBadges}
                        userGroups={profileUserGroups}
                        hoursVolunteered={profileHours}
                        setPageState={setPageState}
                        updateInterests={updateInterests}
                        updateProfilePicture={updateProfilePicture}
                    />;
        case 'groups':
            return <GroupsPage currentUser={currentUser} allOrgs={organizations} />;
        default:
            return <OpportunitiesPage opportunities={opportunities} users={users} allOrgs={organizations} currentUser={currentUser} handleSignUp={handleSignUp} handleUnSignUp={handleUnSignUp} setPageState={setPageState} currentUserSignupsSet={currentUserSignupsSet} />;
    }
  };

  if (!currentUser) {
    return (
        <div className="min-h-screen flex items-start justify-center p-4 bg-light-gray">
           <Login onLogin={handleLogin} onRegister={handleRegister} error={authError} />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-gray pb-20 md:pb-0">
      <Header 
        user={currentUser} 
        points={userPoints} 
        currentPage={pageState.page} 
        setPageState={setPageState} 
        onLogout={handleLogout}
        allUsers={users}
        allOrgs={organizations}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {renderPage()}
      </main>
      <BottomNav currentPage={pageState.page} setPageState={setPageState} />
    </div>
  );
};

export default App;