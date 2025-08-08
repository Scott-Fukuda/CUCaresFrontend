
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { User, Opportunity, SignUp, Organization, FriendRequest, Badge, OrganizationType, Notification } from './types';
import * as api from './api';
import { initialBadges, initialFriendRequests } from './data/staticData'; // Using static data for badges/requests
import Header from './components/Header';
import Login from './components/Login';
import Register from './components/Register';
import BottomNav from './components/BottomNav';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import NotificationsPage from './pages/NotificationsPage';
import GroupsPage from './pages/GroupsPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import OpportunityDetailPage from './pages/OpportunityDetailPage';
import GroupDetailPage from './pages/GroupDetailPage';

export type Page = 'opportunities' | 'leaderboard' | 'profile' | 'groups' | 'notifications' | 'opportunityDetail' | 'groupDetail';
export type PageState = {
  page: Page;
  [key: string]: any;
};

type AuthView = 'login' | 'register';

const App: React.FC = () => {
  // Data state from API
  const [students, setStudents] = useState<User[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [signups, setSignups] = useState<SignUp[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  
  // Local state for features not in API spec
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(initialFriendRequests);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pageState, setPageState] = useState<PageState>({ page: 'opportunities' });
  
  // UI State
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [authView, setAuthView] = useState<AuthView>('login');

  // Load all app data after user is logged in
  useEffect(() => {
    if (currentUser) {
      const loadAppData = async () => {
        setIsLoading(true);
        setAppError(null);
        try {
          const [usersData, oppsData, orgsData, signupsData] = await Promise.all([
            api.getUsers(),
            api.getOpportunities(),
            api.getApprovedOrgs(),
            api.getSignups(),
          ]);
          setStudents(usersData);
          setOpportunities(oppsData);
          setOrganizations(orgsData);
          setSignups(signupsData.map((s: any) => ({ userId: s.user_id, opportunityId: s.opportunity_id }))); // Adapt from snake_case
        } catch (e: any) {
          setAppError(e.message || "Failed to load app data. Please try again later.");
        } finally {
          setIsLoading(false);
        }
      };
      loadAppData();
    }
  }, [currentUser]);

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsLoading(true);
    
    try {
      // This would be replaced with actual Firebase authentication
      // For now, we'll simulate the flow
      
      // Simulate Firebase Google popup and token verification
      const mockFirebaseUser = {
        email: 'test@cornell.edu',
        displayName: 'Test User',
        uid: 'mock-uid-123'
      };
      
      // Check if email is @cornell.edu
      if (!mockFirebaseUser.email.toLowerCase().endsWith('@cornell.edu')) {
        setAuthError('Please use a valid @cornell.edu email address.');
        setIsLoading(false);
        return;
      }
      
      // Send token to backend for verification
      const token = 'mock-firebase-token';
      const response = await fetch('/api/protected', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Token verification failed');
      }
      
      // Check if user exists in database
      const allUsers = await api.getUsers();
      const existingUser = allUsers.find((user: User) => 
        user.email.toLowerCase() === mockFirebaseUser.email.toLowerCase()
      );
      
      if (existingUser) {
        // User exists, log them in
        setCurrentUser(existingUser);
        setPageState({ page: 'opportunities' });
      } else {
        // User doesn't exist, redirect to registration
        setAuthView('register');
      }
      
    } catch (e: any) {
      setAuthError(e.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Registration Handler
  const handleRegister = async (firstName: string, lastName: string, email: string, phone: string) => {
    setAuthError(null);
    if (!email.toLowerCase().endsWith('@cornell.edu')) {
      setAuthError('Please use a valid @cornell.edu email address.');
      return;
    }
    
    // Client-side check for existing email
    if (students.some(s => s.email.toLowerCase() === email.toLowerCase())) {
      setAuthError('An account with this email already exists.');
      return;
    }

    setIsLoading(true);
    try {
      const newUser: User = { 
        id: 0, // Will be replaced by API response
        firstName, 
        lastName,
        email, 
        phone,
        interests: [], 
        friendIds: [], 
        organizationIds: [], 
        profilePictureUrl: ''
      };
      
      // API takes `name`, so we combine first and last, and include phone
      const responseUser = await api.registerUser({ 
        name: `${firstName} ${lastName}`, 
        email, 
        phone 
      });
      
      const finalNewUser = { ...newUser, ...responseUser };

      setStudents(prev => [...prev, finalNewUser]);
      setCurrentUser(finalNewUser);
      setPageState({ page: 'profile' }); // Redirect to profile page after registration
    } catch (e: any) {
      setAuthError(e.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowRegister = () => {
    setAuthView('register');
    setAuthError(null);
  };

  const handleBackToLogin = () => {
    setAuthView('login');
    setAuthError(null);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthError(null);
    setAuthView('login');
    setPageState({ page: 'opportunities' });
  };

  // Data Handlers
  const handleSignUp = useCallback(async (opportunityId: number) => {
    if (!currentUser) return;
    try {
      await api.registerForOpp({ user_id: currentUser.id, opportunity_id: opportunityId });
      setSignups(prev => [...prev, { userId: currentUser.id, opportunityId }]);
    } catch (e: any) {
      alert(`Error signing up: ${e.message}`);
    }
  }, [currentUser]);

  const handleUnSignUp = useCallback(async (opportunityId: number) => {
    if (!currentUser) return;
    try {
        await api.unregisterForOpp({ user_id: currentUser.id, opportunity_id: opportunityId });
        setSignups(prev => prev.filter(s => !(s.userId === currentUser.id && s.opportunityId === opportunityId)));
    } catch (e: any) {
        alert(`Error un-registering: ${e.message}`);
    }
  }, [currentUser]);
  
  const currentUserSignupsSet = useMemo(() => {
    if (!currentUser) return new Set<number>();
    return new Set(signups.filter(s => s.userId === currentUser.id).map(s => s.opportunityId));
  }, [currentUser, signups]);

  const { userPoints } = useMemo(() => {
    if (!currentUser) return { userPoints: 0, earnedBadges: [] };
    const userSignups = signups.filter(s => s.userId === currentUser.id);
    const points = userSignups.reduce((total, signup) => {
      const opportunity = opportunities.find(o => o.id === signup.opportunityId);
      return total + (opportunity?.points || 0);
    }, 0);
    return { userPoints: points };
  }, [currentUser, signups, opportunities]);

  const pendingRequestCount = useMemo(() => {
    if (!currentUser) return 0;
    return friendRequests.filter(r => r.toUserId === currentUser.id && r.status === 'pending').length;
  }, [currentUser, friendRequests]);
  
  // Friend management using backend endpoints
  const handleAddFriend = async (friendId: number) => {
    if (!currentUser || friendId === currentUser.id) return;
    try {
      await api.addFriend(currentUser.id, friendId);
      // Update local state to reflect the new friendship
      const updatedUser = { ...currentUser, friendIds: [...currentUser.friendIds, friendId] };
      setCurrentUser(updatedUser);
      setStudents(prev => prev.map(s => s.id === currentUser.id ? updatedUser : s));
      alert(`You are now friends with ${students.find(s => s.id === friendId)?.firstName}!`);
    } catch (e: any) {
      alert(`Error adding friend: ${e.message}`);
    }
  };

  const handleRemoveFriend = async (friendId: number) => {
    if (!currentUser) return;
    try {
      await api.removeFriend(currentUser.id, friendId);
      // Update local state to reflect the removed friendship
      const updatedUser = { ...currentUser, friendIds: currentUser.friendIds.filter(id => id !== friendId) };
      setCurrentUser(updatedUser);
      setStudents(prev => prev.map(s => s.id === currentUser.id ? updatedUser : s));
      alert(`Friend removed successfully.`);
    } catch (e: any) {
      alert(`Error removing friend: ${e.message}`);
    }
  };

  // Function to load user's friends from backend
  const loadUserFriends = async (userId: number) => {
    if (!currentUser) return;
    try {
      const friends = await api.getUserFriends(userId);
      // Update the user's friendIds with the actual friend IDs from backend
      const updatedUser = { ...currentUser, friendIds: friends.map(f => f.id) };
      setCurrentUser(updatedUser);
      setStudents(prev => prev.map(s => s.id === userId ? updatedUser : s));
    } catch (e: any) {
      console.error('Error loading friends:', e.message);
    }
  };

  // Legacy function names for compatibility with existing components
  const handleFriendRequest = handleAddFriend;
  const handleRequestResponse = (fromUserId: number, response: 'accepted' | 'declined') => {
    if (!currentUser) return;
    if (response === 'accepted') {
      handleAddFriend(fromUserId);
    } else {
      alert('Friend request declined.');
    }
  };

  const updateUserProfile = useCallback(async (userData: Partial<User>) => {
    if (!currentUser) return;
    try {
        const updatedUser = await api.updateUser(currentUser.id, userData);
        const finalUser = { ...currentUser, ...updatedUser };
        setCurrentUser(finalUser);
        setStudents(prev => prev.map(s => s.id === currentUser.id ? finalUser : s));
    } catch (e: any) {
        alert(`Error updating profile: ${e.message}`);
    }
  }, [currentUser]);

  const updateInterests = useCallback((interests: string[]) => updateUserProfile({ interests }), [updateUserProfile]);
  const updateProfilePicture = useCallback((base64: string) => updateUserProfile({ profilePictureUrl: base64 }), [updateUserProfile]);

  const userOrgs = useMemo(() => {
    if (!currentUser) return [];
    return organizations.filter(g => currentUser.organizationIds.includes(g.id));
  }, [currentUser, organizations]);

  const joinOrg = useCallback(async (orgId: number) => {
    if (!currentUser || currentUser.organizationIds.includes(orgId)) return;
    
    // Get organization name for feedback
    const org = organizations.find(o => o.id === orgId);
    const orgName = org?.name || 'this organization';
    
    try {
      // Make API call to register for organization
      await api.registerForOrg({ 
        user_id: currentUser.id, 
        organization_id: orgId 
      });
      
      // Update local state
      const newOrgIds = [...currentUser.organizationIds, orgId];
      const updatedUser = { ...currentUser, organizationIds: newOrgIds };
      setCurrentUser(updatedUser);
      setStudents(prev => prev.map(s => s.id === currentUser.id ? updatedUser : s));
      
      alert(`Successfully joined ${orgName}!`);
    } catch (e: any) {
      alert(`Error joining organization: ${e.message}`);
    }
  }, [currentUser, organizations]);

  const leaveOrg = useCallback(async (orgId: number) => {
    if (!currentUser || !currentUser.organizationIds.includes(orgId)) return;
    
    // Get organization name for confirmation
    const org = organizations.find(o => o.id === orgId);
    const orgName = org?.name || 'this organization';
    
    // Show confirmation popup
    const confirmed = window.confirm(`Are you sure you want to leave ${orgName}? This action cannot be undone.`);
    
    if (!confirmed) return;
    
    try {
      // Make API call to unregister from organization using the new endpoint
      await api.unregisterFromOrg({ 
        user_id: currentUser.id, 
        organization_id: orgId 
      });
      
      // Update local state
      const newOrgIds = currentUser.organizationIds.filter(id => id !== orgId);
      const updatedUser = { ...currentUser, organizationIds: newOrgIds };
      setCurrentUser(updatedUser);
      setStudents(prev => prev.map(s => s.id === currentUser.id ? updatedUser : s));
      
      alert(`Successfully left ${orgName}.`);
    } catch (e: any) {
      alert(`Error leaving organization: ${e.message}`);
    }
  }, [currentUser, organizations]);

  const createOrg = async (orgName: string, type: OrganizationType, description?: string) => {
    if (!currentUser) return;
    try {
        // API takes `host_user_id`
        const newOrg = await api.createOrg({ name: orgName, type, description, host_user_id: currentUser.id });
        setOrganizations(prev => [...prev, newOrg]);
        joinOrg(newOrg.id);
    } catch (e: any) {
        alert(`Error creating organization: ${e.message}`);
    }
  };

  const renderPage = () => {
    if (!currentUser) return null;
    if (isLoading) {
      return <div className="text-center p-10 font-semibold text-lg">Loading...</div>;
    }
    if (appError) {
      return <div className="text-center p-10 font-semibold text-lg text-red-600 bg-red-100 rounded-lg">{appError}</div>;
    }

    switch (pageState.page) {
        case 'opportunities':
            return <OpportunitiesPage opportunities={opportunities} students={students} allOrgs={organizations} signups={signups} currentUser={currentUser} handleSignUp={handleSignUp} handleUnSignUp={handleUnSignUp} setPageState={setPageState} currentUserSignupsSet={currentUserSignupsSet} />;
        case 'opportunityDetail':
            const opp = opportunities.find(o => o.id === pageState.id);
            if (!opp) return <p>Opportunity not found.</p>;
            return <OpportunityDetailPage opportunity={opp} students={students} signups={signups} currentUser={currentUser} handleSignUp={handleSignUp} handleUnSignUp={handleUnSignUp} setPageState={setPageState} allOrgs={organizations} currentUserSignupsSet={currentUserSignupsSet} />;
        case 'groupDetail':
            const org = organizations.find(g => g.id === pageState.id);
            if (!org) return <p>Organization not found.</p>;
            return <GroupDetailPage 
                        org={org}
                        allUsers={students}
                        allOrgs={organizations}
                        opportunities={opportunities}
                        signups={signups}
                        currentUser={currentUser}
                        setPageState={setPageState}
                        joinOrg={joinOrg}
                        leaveOrg={leaveOrg}
                    />;
        case 'leaderboard':
            return <LeaderboardPage allUsers={students} allOrgs={organizations} signups={signups} opportunities={opportunities} currentUser={currentUser} handleFriendRequest={handleFriendRequest} setPageState={setPageState}/>;
        case 'profile':
            const profileUser = pageState.userId ? students.find(s => s.id === pageState.userId) : currentUser;
            if(!profileUser) return <p>User not found</p>;
            
            const profileUserSignups = signups.filter(s => s.userId === profileUser.id);
            const profileUserOrgs = organizations.filter(g => profileUser.organizationIds.includes(g.id));
            
            const {profileUserPoints, profileUserHours} = profileUserSignups.reduce((acc, signup) => {
              const opportunity = opportunities.find(o => o.id === signup.opportunityId);
              if (opportunity) {
                acc.profileUserPoints += opportunity.points;
                acc.profileUserHours += opportunity.duration;
              }
              return acc;
            }, { profileUserPoints: 0, profileUserHours: 0 });

            const profileUserBadges = initialBadges.filter(b => b.threshold({points: profileUserPoints, signUpCount: profileUserSignups.length, signups, opportunities, friendsCount: profileUser.friendIds.length}));

            return <ProfilePage 
                        user={profileUser}
                        isCurrentUser={profileUser.id === currentUser.id}
                        currentUser={currentUser}
                        earnedBadges={profileUserBadges}
                        userOrgs={profileUserOrgs}
                        hoursVolunteered={profileUserHours}
                        setPageState={setPageState}
                        updateInterests={updateInterests}
                        updateProfilePicture={updateProfilePicture}
                        handleFriendRequest={handleFriendRequest}
                        handleRemoveFriend={handleRemoveFriend}
                        friendRequests={friendRequests}
                    />;
        case 'notifications':
            const requestsToUser = friendRequests.filter(r => r.toUserId === currentUser.id);
            return <NotificationsPage requests={requestsToUser} allUsers={students} handleRequestResponse={handleRequestResponse} />;
        case 'groups':
            return <GroupsPage currentUser={currentUser} allOrgs={organizations} joinOrg={joinOrg} leaveOrg={leaveOrg} createOrg={createOrg} setPageState={setPageState} />;
        default:
            return <OpportunitiesPage opportunities={opportunities} students={students} allOrgs={organizations} signups={signups} currentUser={currentUser} handleSignUp={handleSignUp} handleUnSignUp={handleUnSignUp} setPageState={setPageState} currentUserSignupsSet={currentUserSignupsSet} />;
    }
  };

  if (!currentUser) {
    return (
        <div className="min-h-screen flex items-start justify-center p-4 bg-light-gray">
          {authView === 'login' ? (
            <Login 
              onGoogleSignIn={handleGoogleSignIn} 
              onShowRegister={handleShowRegister} 
              error={authError} 
              isLoading={isLoading}
            />
          ) : (
            <Register 
              onRegister={handleRegister} 
              onBackToLogin={handleBackToLogin} 
              error={authError} 
              isLoading={isLoading}
            />
          )}
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-gray pb-20 md:pb-0">
      <Header 
        user={currentUser} 
        points={userPoints} 
        pendingRequestCount={pendingRequestCount} 
        currentPage={pageState.page} 
        setPageState={setPageState} 
        onLogout={handleLogout}
        allUsers={students}
        allOrgs={organizations}
        friendRequests={friendRequests}
        joinOrg={joinOrg}
        leaveOrg={leaveOrg}
        handleFriendRequest={handleFriendRequest}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {renderPage()}
      </main>
      <BottomNav currentPage={pageState.page} setPageState={setPageState} />
    </div>
  );
};

export default App;
