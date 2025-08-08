
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { User, Opportunity, SignUp, Organization, FriendRequest, Badge, OrganizationCategory, Notification } from './types';
import * as api from './api';
import { initialBadges, initialFriendRequests } from './data/staticData'; // Using static data for badges/requests
import Header from './components/Header';
import Login from './components/Login';
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
            api.getOrgs(),
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


  // Auth Handlers
  const handleLogin = async (email: string, password: string) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      // In a real app, this would be a single POST /api/login call.
      // Based on the provided spec, we fetch all users and find the one that matches.
      const allUsers = await api.getUsers();
      const user = allUsers.find((s: User) => s.email.toLowerCase() === email.toLowerCase() && s.password === password);
      if (user) {
        setCurrentUser(user);
        setPageState({ page: 'opportunities' });
      } else {
        setAuthError('Invalid email or password.');
      }
    } catch (e: any) {
      setAuthError(e.message || 'Login failed.');
    } finally {
        setIsLoading(false);
    }
  };

  const handleRegister = async (firstName: string, lastName: string, email: string, password: string) => {
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
            password,
            interests: [], 
            friendIds: [], 
            organizationIds: [], 
            profilePictureUrl: ''
        };
        // API takes `name`, so we combine first and last.
        const responseUser = await api.registerUser({ name: `${firstName} ${lastName}`, email, password });
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

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthError(null);
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
  
  // NOTE: Friend request logic is kept client-side as there are no specified backend endpoints.
  const handleFriendRequest = (toUserId: number) => {
     if (!currentUser || toUserId === currentUser.id) return;
     // This logic would be replaced by API calls
     alert("Friend functionality requires backend endpoints.");
  };
  const handleRequestResponse = (fromUserId: number, response: 'accepted' | 'declined') => {
     if (!currentUser) return;
     alert("Friend functionality requires backend endpoints.");
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
    const newOrgIds = [...currentUser.organizationIds, orgId];
    await updateUserProfile({ organizationIds: newOrgIds });
  }, [currentUser, updateUserProfile]);

  const leaveOrg = useCallback(async (orgId: number) => {
    if (!currentUser) return;
    const newOrgIds = currentUser.organizationIds.filter(id => id !== orgId);
    await updateUserProfile({ organizationIds: newOrgIds });
  }, [currentUser, updateUserProfile]);

  const createOrg = async (orgName: string, category: OrganizationCategory) => {
    if (!currentUser) return;
    try {
        // API takes `host_user_id`
        const newOrg = await api.createOrg({ name: orgName, category, host_user_id: currentUser.id });
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
        case 'groupDetail':
          const group = organizations.find(g => g.id === pageState.id);
          if (!group) return <p>Group not found.</p>;
          const groupMembers = students.filter(s => s.groupIds.includes(group.id));
          return (
            <GroupDetailPage
              group={group}
              members={groupMembers}
              signups={signups}
              opportunities={opportunities}
            />
          );      
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
           <Login onLogin={handleLogin} onRegister={handleRegister} error={authError} />
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
