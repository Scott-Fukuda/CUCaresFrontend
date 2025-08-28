
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { User, Opportunity, SignUp, Organization, FriendRequest, Badge, OrganizationType, Notification, Friendship, FriendshipStatus } from './types';
import * as api from './api';
import { initialBadges, initialFriendRequests } from './data/initialData'; // Using initial data for badges/requests
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
import CreateOpportunityPage from './pages/CreateOpportunityPage';
import MyOpportunitiesPage from './pages/MyOpportunitiesPage';
import AdminPage from './pages/AdminPage';

export type Page = 'opportunities' | 'myOpportunities' | 'admin' | 'leaderboard' | 'profile' | 'groups' | 'notifications' | 'opportunityDetail' | 'groupDetail' | 'createOpportunity';
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
  const [legacyFriendRequests, setLegacyFriendRequests] = useState<FriendRequest[]>(initialFriendRequests);

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
            admin: false, // Default to false for new users
            gender: gender || undefined,
            graduationYear,
            academicLevel,
            major,
            birthday,
            registration_date: api.formatRegistrationDate() // Format: YYYY-MM-DDTHH:MM:SS
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
        birthday,
        registration_date: api.formatRegistrationDate() // Format: YYYY-MM-DDTHH:MM:SS
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
    console.log('handleSignUp called for opportunity:', opportunityId, 'user:', currentUser.id);
    try {
      await api.registerForOpp({ user_id: currentUser.id, opportunity_id: opportunityId });
      console.log('API registerForOpp successful');
      setSignups(prev => [...prev, { userId: currentUser.id, opportunityId }]);
      
      // Refresh opportunities to get updated involved_users from backend
      console.log('Refreshing opportunities data...');
      const updatedOpps = await api.getOpportunities();
      console.log('Updated opportunities received:', updatedOpps.length);
      setOpportunities(updatedOpps);
      
      // Show success popup
      showPopup(
        'Thank you for signing up!',
        'Thank you for signing up for this opportunity. The event host may reach out to you with further details (i.e. ride coordination). Otherwise, please arrive at the listed address at the designated time. Thank you for serving!',
        'success'
      );
    } catch (e: any) {
      console.error('Error in handleSignUp:', e);
      alert(`Error signing up: ${e.message}`);
    }
  }, [currentUser]);

  const handleUnSignUp = useCallback(async (opportunityId: number) => {
    if (!currentUser) return;
    console.log('handleUnSignUp called for opportunity:', opportunityId, 'user:', currentUser.id);
    try {
        await api.unregisterForOpp({ user_id: currentUser.id, opportunity_id: opportunityId });
        console.log('API unregisterForOpp successful');
    setSignups(prev => prev.filter(s => !(s.userId === currentUser.id && s.opportunityId === opportunityId)));
        
        // Refresh opportunities to get updated involved_users from backend
        console.log('Refreshing opportunities data...');
        const updatedOpps = await api.getOpportunities();
        console.log('Updated opportunities received:', updatedOpps.length);
        setOpportunities(updatedOpps);
    } catch (e: any) {
        console.error('Error in handleUnSignUp:', e);
        alert(`Error un-registering: ${e.message}`);
    }
  }, [currentUser]);
  
  const currentUserSignupsSet = useMemo(() => {
    if (!currentUser) return new Set<number>();
    
    // Get user signups from backend data (opportunities.involved_users)
    const userSignups = new Set<number>();
    
    opportunities.forEach(opp => {
      // Check if user is in involved_users and registered
      const isRegistered = opp.involved_users?.some(user => 
        user.id === currentUser.id && user.registered === true
      );
      
      if (isRegistered) {
        userSignups.add(opp.id);
      }
    });
    
    return userSignups;
  }, [currentUser, opportunities]);

  const userPoints = currentUser?.points || 0;
  
  // New friend management system using backend endpoints
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);

  const pendingRequestCount = useMemo(() => {
    if (!currentUser || !Array.isArray(friendRequests)) return 0;
    return friendRequests.filter(r => r.toUserId === currentUser.id && r.status === 'pending').length;
  }, [currentUser, friendRequests]);

  // Load user's friendships and friend requests
  const loadUserFriendships = useCallback(async (userId: number) => {
    if (!currentUser) return;
    console.log('Loading friendships for user:', userId);
    try {
      const [friendshipsData, requestsData] = await Promise.all([
        api.getUserFriendships(userId),
        api.getUserFriendRequests(userId)
      ]);
      console.log('Raw friendship data from backend:', friendshipsData);
      console.log('Raw friend requests data from backend:', requestsData);
      
      const validFriendships = Array.isArray(friendshipsData) ? friendshipsData : [];
      const validRequests = Array.isArray(requestsData) ? requestsData : [];
      
      console.log('Setting friendships state:', validFriendships);
      console.log('Setting friend requests state:', validRequests);
      
      setFriendships(validFriendships);
      setFriendRequests(validRequests);
    } catch (e: any) {
      console.error('Error loading friendships:', e.message);
      // Set empty arrays on error to prevent filter errors
      setFriendships([]);
      setFriendRequests([]);
    }
  }, [currentUser]);

  // Send friend request
  const handleSendFriendRequest = async (friendId: number) => {
    if (!currentUser || friendId === currentUser.id) return;
    try {
      await api.sendFriendRequest(currentUser.id, friendId);
      alert(`Friend request sent to ${students.find(s => s.id === friendId)?.firstName}!`);
      // Refresh friendships to show updated status
      await loadUserFriendships(currentUser.id);
    } catch (e: any) {
      alert(`Error sending friend request: ${e.message}`);
    }
  };

  // Accept friend request
  const handleAcceptFriendRequest = async (friendshipId: number, receiverId: number) => {
    if (!currentUser) return;
    try {
      await api.acceptFriendRequest(friendshipId, receiverId);
      alert('Friend request accepted!');
      // Refresh friendships
      await loadUserFriendships(currentUser.id);
    } catch (e: any) {
      alert(`Error accepting friend request: ${e.message}`);
    }
  };

  // Reject friend request
  const handleRejectFriendRequest = async (friendshipId: number, receiverId: number) => {
    if (!currentUser) return;
    try {
      await api.rejectFriendRequest(friendshipId, receiverId);
      alert('Friend request rejected.');
      // Refresh friendships
      await loadUserFriendships(currentUser.id);
    } catch (e: any) {
      alert(`Error rejecting friend request: ${e.message}`);
    }
  };

  // Remove friend
  const handleRemoveFriend = async (friendId: number) => {
    if (!currentUser) return;
    try {
      await api.removeFriend(currentUser.id, friendId);
      alert('Friend removed successfully.');
      // Refresh friendships
      await loadUserFriendships(currentUser.id);
    } catch (e: any) {
      alert(`Error removing friend: ${e.message}`);
    }
  };

  // Check friendship status with another user
  const checkFriendshipStatus = async (otherUserId: number): Promise<FriendshipStatus> => {
    if (!currentUser) return { status: 'none' };
    try {
      return await api.checkFriendshipStatus(currentUser.id, otherUserId);
    } catch (e: any) {
      console.error('Error checking friendship status:', e.message);
      return { status: 'none' };
    }
  };

  // Get user's friends (accepted friendships) - using the new API endpoint
  const [userFriends, setUserFriends] = useState<User[]>([]);

  // Load user's friends when currentUser changes
  useEffect(() => {
    const loadUserFriends = async () => {
      if (!currentUser) {
        setUserFriends([]);
        return;
      }
      try {
        const friends = await api.getAcceptedFriendships(currentUser.id);
        setUserFriends(friends);
      } catch (e: any) {
        console.error('Error loading user friends:', e.message);
        setUserFriends([]);
      }
    };
    loadUserFriends();
  }, [currentUser]);

  const getUserFriends = useMemo(() => {
    return userFriends;
  }, [userFriends]);

  // Get friends for any user (for viewing other profiles)
  const getFriendsForUser = useCallback(async (userId: number): Promise<User[]> => {
    console.log('Getting friends for user:', userId);
    
    try {
      const friends = await api.getAcceptedFriendships(userId);
      console.log('Friends response from API:', friends);
      return friends;
    } catch (error) {
      console.error('Error fetching friends for user:', error);
      return [];
    }
  }, []);

  // Get pending friend requests received by current user
  const getPendingRequestsReceived = useMemo(() => {
    if (!currentUser || !Array.isArray(friendRequests)) return [];
    return friendRequests.filter(r => r.toUserId === currentUser.id && r.status === 'pending');
  }, [friendRequests, currentUser]);

  // Get pending friend requests sent by current user
  const getPendingRequestsSent = useMemo(() => {
    if (!currentUser || !Array.isArray(friendRequests)) return [];
    return friendRequests.filter(r => r.fromUserId === currentUser.id && r.status === 'pending');
  }, [friendRequests, currentUser]);

  // Legacy function names for compatibility with existing components
  const handleFriendRequest = handleSendFriendRequest;
  const handleAddFriend = handleSendFriendRequest;
  const handleRequestResponse = (fromUserId: number, response: 'accepted' | 'declined') => {
    if (!currentUser) return;
    if (response === 'accepted') {
      // Find the friendship ID for this request
      const friendship = friendships.find(f => 
        (f.user1_id === fromUserId && f.user2_id === currentUser.id) ||
        (f.user1_id === currentUser.id && f.user2_id === fromUserId)
      );
      if (friendship) {
        handleAcceptFriendRequest(friendship.id, currentUser.id);
      }
    } else {
      // Find the friendship ID for this request
      const friendship = friendships.find(f => 
        (f.user1_id === fromUserId && f.user2_id === currentUser.id) ||
        (f.user1_id === currentUser.id && f.user2_id === fromUserId)
      );
      if (friendship) {
        handleRejectFriendRequest(friendship.id, currentUser.id);
      }
    }
  };

  // Load user friendships when user logs in
  useEffect(() => {
    if (currentUser) {
      loadUserFriendships(currentUser.id);
    }
  }, [currentUser, loadUserFriendships]);

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
  const updateProfilePicture = useCallback(async (file: File) => {
    if (!currentUser) return;
    
    try {
      console.log('Starting profile picture upload for file:', file.name, file.size, file.type);
      
      // First upload the file to get the S3 URL
      const imageUrl = await api.uploadProfilePicture(file);
      console.log('Upload successful, got S3 URL:', imageUrl);
      
      // Immediately update frontend state with the new image URL
      const updatedUser = { ...currentUser, profile_image: imageUrl, profilePictureUrl: imageUrl };
      setCurrentUser(updatedUser);
      setStudents(prev => prev.map(s => s.id === currentUser.id ? updatedUser : s));
      
      // Then update the backend (in background)
      console.log('Updating backend with image URL:', imageUrl);
      await updateUserProfile({ profile_image: imageUrl });
      console.log('Backend update successful');
    } catch (error: any) {
      console.error('Error updating profile picture:', error);
      alert(`Error updating profile picture: ${error.message}`);
      
      // Revert frontend state if backend update failed
      if (currentUser) {
        setCurrentUser(currentUser);
        setStudents(prev => prev.map(s => s.id === currentUser.id ? currentUser : s));
      }
    }
  }, [currentUser, updateUserProfile]);

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
      
      // Refresh current user data to get updated organizations
      const updatedUser = await api.getUser(currentUser.id);
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
    const confirmed = window.confirm(`Are you sure you want to leave ${orgName}?`);
    
    if (!confirmed) return;
    
    try {
      // Make API call to unregister from organization using the new endpoint
      await api.unregisterFromOrg({ 
        user_id: currentUser.id, 
        organization_id: orgId 
      });
      
      // Refresh current user data to get updated organizations
      const updatedUser = await api.getUser(currentUser.id);
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
        case 'myOpportunities':
            return <MyOpportunitiesPage opportunities={opportunities} students={students} allOrgs={organizations} currentUser={currentUser} handleSignUp={handleSignUp} handleUnSignUp={handleUnSignUp} setPageState={setPageState} currentUserSignupsSet={currentUserSignupsSet} />;
        case 'admin':
            return <AdminPage currentUser={currentUser} setPageState={setPageState} />;
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
            return <LeaderboardPage allUsers={students} allOrgs={organizations} signups={signups} opportunities={opportunities} currentUser={currentUser} handleFriendRequest={handleFriendRequest} setPageState={setPageState} checkFriendshipStatus={checkFriendshipStatus} friendRequests={friendRequests}/>;
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
            // Note: getFriendsForUser is now async, so we'll need to handle this differently
            // For now, we'll pass an empty array and handle the async loading in ProfilePage
            const profileUserFriends: User[] = [];

            return <ProfilePage 
                        user={profileUser}
                        isCurrentUser={profileUser.id === currentUser.id}
                        currentUser={currentUser}
                        earnedBadges={profileUserBadges}
                        userOrgs={profileUserOrgs}
                        hoursVolunteered={profileUserHours}
                        userFriends={profileUserFriends}
                        setPageState={setPageState}
                        updateInterests={updateInterests}
                        updateProfilePicture={updateProfilePicture}
                        handleFriendRequest={handleFriendRequest}
                        handleRemoveFriend={handleRemoveFriend}
                        friendRequests={friendRequests}
                        checkFriendshipStatus={checkFriendshipStatus}
                        getFriendsForUser={getFriendsForUser}
                    />;
        case 'notifications':
            const requestsToUser = Array.isArray(friendRequests) ? friendRequests.filter(r => r.toUserId === currentUser.id) : [];
            return <NotificationsPage requests={requestsToUser} allUsers={students} handleRequestResponse={handleRequestResponse} currentUser={currentUser} />;
        case 'groups':
            return <GroupsPage currentUser={currentUser} allOrgs={organizations} joinOrg={joinOrg} leaveOrg={leaveOrg} createOrg={createOrg} setPageState={setPageState} />;
        case 'createOpportunity':
            return <CreateOpportunityPage currentUser={currentUser} organizations={organizations} setPageState={setPageState} />;
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
