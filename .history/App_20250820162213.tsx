
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { User, Opportunity, SignUp, Organization, FriendRequest, Badge, OrganizationType, Notification } from './types';
import * as api from './api';
import { initialBadges, initialFriendRequests } from './data/staticData'; // Using static data for badges/requests
import { signInWithGoogle, FirebaseUser, auth } from './firebase-config';
import Header from './components/Header';
import Login from './components/Login';
import Register from './components/Register';
import BottomNav from './components/BottomNav';
import PopupMessage from './components/PopupMessage';
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
  
  // Popup State
  const [popupMessage, setPopupMessage] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Load all app data after user is logged in
  useEffect(() => {
    console.log('App useEffect triggered:', { currentUser, isLoading });
    if (currentUser) {
      const loadAppData = async () => {
        console.log('Loading app data...');
        setIsLoading(true);
        setAppError(null);
        try {
          console.log('Making API calls...');
          const [usersData, oppsData, orgsData] = await Promise.all([
            api.getUsers(),
            api.getOpportunities(),
            api.getApprovedOrgs(),
          ]);
          console.log('API calls completed:', {
            usersCount: usersData.length,
            opportunitiesCount: oppsData.length,
            orgsCount: orgsData.length
          });
          setStudents(usersData);
          setOpportunities(oppsData);
          setOrganizations(orgsData);
          setSignups([]); // Initialize empty signups - we'll track this locally
        } catch (e: any) {
          console.error('API call failed:', e);
          setAppError(e.message || "Failed to load app data. Please try again later.");
        } finally {
          setIsLoading(false);
        }
      };
      loadAppData();
    } else {
      console.log('No currentUser, skipping API calls');
    }
  }, [currentUser]);

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    console.log('handleGoogleSignIn called');
    setAuthError(null);
    setIsLoading(true);
    
    try {
      // Trigger Firebase Google sign-in popup
      console.log('Triggering Firebase sign-in...');
      const firebaseUser = await signInWithGoogle();
      console.log('Firebase sign-in successful:', firebaseUser.email);
      
      // Check if email is @cornell.edu
      if (!firebaseUser.email.toLowerCase().endsWith('@cornell.edu')) {
        setAuthError('Please use a valid @cornell.edu email address.');
        setIsLoading(false);
        return;
      }
      
      // Get the ID token from Firebase
      const token = await firebaseUser.getIdToken();
      
      // Verify token with backend
      console.log('Verifying Firebase token with backend...');
      const authResult = await api.verifyFirebaseToken(token);
      console.log('Token verification result:', authResult);
      
      if (authResult.success) {
        // User is authenticated, check if they exist in our database
        console.log('Checking if user exists in database...');
        const allUsers = await api.getUsers();
        console.log('Retrieved users from database:', allUsers.length);
        const existingUser = allUsers.find((user: User) => 
          user.email.toLowerCase() === firebaseUser.email.toLowerCase()
        );
        
        if (existingUser) {
          // User exists, log them in
          console.log('User found, logging in:', existingUser);
          setCurrentUser(existingUser);
          setPageState({ page: 'opportunities' });
        } else {
          // User doesn't exist, redirect to registration
          console.log('User not found, redirecting to registration');
          setAuthView('register');
        }
      }
      
    } catch (e: any) {
      console.error('Google sign-in error:', e);
      setAuthError(e.message || 'Google sign-in failed. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };

  // Registration Handler
  const handleRegister = async (firstName: string, lastName: string, phone: string, gender: string, graduationYear: string, academicLevel: string, major: string, birthday: string) => {
    setAuthError(null);
    
    // Get email from Firebase user (stored during Google sign-in)
    const firebaseUser = auth.currentUser;
    if (!firebaseUser || !firebaseUser.email) {
      setAuthError('No authenticated user found. Please sign in with Google first.');
      return;
    }
    
    const email = firebaseUser.email;
    
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
            profilePictureUrl: '',
            gender: gender || undefined,
            graduationYear,
            academicLevel,
            major,
            birthday
        };
      
      // API takes `name`, so we combine first and last, and include phone
      const responseUser = await api.registerUser({ 
        name: `${firstName} ${lastName}`, 
        email, 
        phone,
        gender: gender || null,
        graduation_year: graduationYear,
        academic_level: academicLevel,
        major,
        birthday
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

  const closePopup = () => {
    setPopupMessage(prev => ({ ...prev, isOpen: false }));
  };

  const showPopup = (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error' = 'info') => {
    setPopupMessage({
      isOpen: true,
      title,
      message,
      type
    });
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
      
      // Refresh opportunities to get updated involved_users from backend
      const updatedOpps = await api.getOpportunities();
      setOpportunities(updatedOpps);
      
      // Show success popup
      showPopup(
        'Thank you for signing up!',
        'Thank you for signing up for this opportunity. The event host may reach out to you with further details (i.e. ride coordination). Otherwise, please arrive at the listed address at the designated time. Thank you for serving!',
        'success'
      );
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
    const userSignups = new Set(signups.filter(s => s.userId === currentUser.id).map(s => s.opportunityId));
    
    // Automatically include opportunities where the user is the host
    opportunities.forEach(opp => {
      if (opp.host_id === currentUser.id) {
        userSignups.add(opp.id);
      }
    });
    
    return userSignups;
  }, [currentUser, signups, opportunities]);

  const userPoints = currentUser?.points || 0;

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

  // Function to refresh user data (including points) from backend
  const refreshUserData = async (userId: number) => {
    try {
      const updatedUser = await api.getUser(userId);
      setStudents(prev => prev.map(s => s.id === userId ? updatedUser : s));
      if (currentUser && currentUser.id === userId) {
        setCurrentUser(updatedUser);
      }
    } catch (e: any) {
      console.error('Error refreshing user data:', e.message);
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
        // Prepare the complete user data for the API
        const completeUserData = {
            name: `${currentUser.firstName} ${currentUser.lastName}`,
            email: currentUser.email,
            phone: currentUser.phone || '',
            interests: currentUser.interests,
            ...userData // Override with the new data
        };
        
        console.log('Sending user update to API:', completeUserData);
        
        const updatedUser = await api.updateUser(currentUser.id, completeUserData);
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
        
        // Show success popup
        showPopup(
          'Organization Created Successfully!',
          'Admins will verify your organization shortly. Once approved, you will be able to post events and opportunities.',
          'success'
        );
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
            
            const profileUserPoints = profileUser?.points || 0;
            const profileUserHours = profileUserSignups.reduce((total, signup) => {
              const opportunity = opportunities.find(o => o.id === signup.opportunityId);
              return total + (opportunity?.duration || 0);
            }, 0);

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
          <PopupMessage
            isOpen={popupMessage.isOpen}
            onClose={closePopup}
            title={popupMessage.title}
            message={popupMessage.message}
            type={popupMessage.type}
          />
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
      <PopupMessage
        isOpen={popupMessage.isOpen}
        onClose={closePopup}
        title={popupMessage.title}
        message={popupMessage.message}
        type={popupMessage.type}
      />
    </div>
  );
};

export default App;
