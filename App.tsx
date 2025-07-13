
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { User, Opportunity, SignUp, StudentGroup, FriendRequest, Badge, StudentGroupCategory, Notification } from './types';
import { 
  initialStudents, initialOpportunities, initialSignUps, 
  initialStudentGroups, initialFriendRequests, initialBadges
} from './data/initialData';
import Header from './components/Header';
import Login from './components/Login';
import BottomNav from './components/BottomNav';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import NotificationsPage from './pages/NotificationsPage';
import GroupsPage from './pages/GroupsPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import OpportunityDetailPage from './pages/OpportunityDetailPage';


export type Page = 'opportunities' | 'leaderboard' | 'profile' | 'groups' | 'notifications' | 'opportunityDetail';
export type PageState = {
  page: Page;
  [key: string]: any;
};

// =================================================================
// DEVELOPMENT CONFIG - Easy access to toggle features
// =================================================================
// To disable auto-login, set this to false
const AUTO_LOGIN_ENABLED = false; 
const AUTO_LOGIN_EMAIL = 'ejm376@cornell.edu';

// To disable auto-accepting friend requests, set this to false
const AUTO_ACCEPT_FRIEND_REQUESTS = true;
// =================================================================


const App: React.FC = () => {
  // Simulates a database
  const [students, setStudents] = useState<User[]>(initialStudents);
  const [opportunities, setOpportunities] = useState<Opportunity[]>(initialOpportunities);
  const [signups, setSignups] = useState<SignUp[]>(initialSignUps);
  const [studentGroups, setStudentGroups] = useState<StudentGroup[]>(initialStudentGroups);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(initialFriendRequests);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [pageState, setPageState] = useState<PageState>({ page: 'opportunities' });
  const [authError, setAuthError] = useState<string | null>(null);

  // Auto-login logic
  useEffect(() => {
    if (AUTO_LOGIN_ENABLED && !currentUser) {
      const adminUser = students.find(s => s.email === AUTO_LOGIN_EMAIL);
      if(adminUser) {
        setCurrentUser(adminUser);
      }
    }
  }, [students, currentUser]);

  // Auth Handlers
  const handleLogin = (email: string, password: string) => {
    setAuthError(null);
    const user = students.find(s => s.email.toLowerCase() === email.toLowerCase() && s.password === password);
    if (user) {
      setCurrentUser(user);
      setPageState({ page: 'opportunities' });
    } else {
      setAuthError('Invalid email or password.');
    }
  };

  const handleRegister = (firstName: string, lastName: string, email: string, password: string) => {
    setAuthError(null);
    if (!email.toLowerCase().endsWith('@cornell.edu')) {
      setAuthError('Please use a valid @cornell.edu email address.');
      return;
    }
    if (students.some(s => s.email.toLowerCase() === email.toLowerCase())) {
      setAuthError('An account with this email already exists.');
      return;
    }
    const newId = Math.max(...students.map(s => s.id), 0) + 1;
    const newUser: User = { 
        id: newId, 
        firstName, 
        lastName,
        email, 
        password,
        interests: [], 
        friendIds: [], 
        groupIds: [], 
        profilePictureUrl: '' 
    };
    setStudents(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setPageState({ page: 'profile' }); // Redirect to profile page after registration
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthError(null);
    setPageState({ page: 'opportunities' });
  };

  // Signups
  const handleSignUp = useCallback((opportunityId: number) => {
    if (!currentUser) return;
    setSignups(prevSignups => {
      // Prevent duplicate signups using the most up-to-date state
      if (prevSignups.some(s => s.userId === currentUser.id && s.opportunityId === opportunityId)) {
        return prevSignups;
      }
      return [...prevSignups, { userId: currentUser.id, opportunityId }];
    });
  }, [currentUser]);

  const handleUnSignUp = useCallback((opportunityId: number) => {
    if (!currentUser) return;
    setSignups(prev => prev.filter(s => !(s.userId === currentUser.id && s.opportunityId === opportunityId)));
  }, [currentUser]);
  
  // A derived state for efficient lookups of the current user's signups.
  const currentUserSignupsSet = useMemo(() => {
    if (!currentUser) return new Set<number>();
    return new Set(
        signups
            .filter(s => s.userId === currentUser.id)
            .map(s => s.opportunityId)
    );
  }, [currentUser, signups]);

  // Points and Badges Calculation
  const { userPoints, earnedBadges } = useMemo(() => {
    if (!currentUser) return { userPoints: 0, earnedBadges: [] };
    const userSignups = signups.filter(s => s.userId === currentUser.id);
    const points = userSignups.reduce((total, signup) => {
      const opportunity = opportunities.find(o => o.id === signup.opportunityId);
      return total + (opportunity?.points || 0);
    }, 0);
    const badges = initialBadges.filter(b => b.threshold({points, signUpCount: userSignups.length, signups, opportunities, friendsCount: currentUser.friendIds.length}));
    return { userPoints: points, earnedBadges: badges };
  }, [currentUser, signups, opportunities]);

  // Friend Requests
  const pendingRequestCount = useMemo(() => {
    if (!currentUser) return 0;
    return friendRequests.filter(r => r.toUserId === currentUser.id && r.status === 'pending').length;
  }, [currentUser, friendRequests]);

  const handleFriendRequest = (toUserId: number) => {
    if (!currentUser || toUserId === currentUser.id) return;
    const existingRequest = friendRequests.some(r => (r.fromUserId === currentUser.id && r.toUserId === toUserId) || (r.fromUserId === toUserId && r.toUserId === currentUser.id));
    if (existingRequest || currentUser.friendIds.includes(toUserId)) {
        alert("You've already sent a friend request or are friends with this user.");
        return;
    }
    
    const newRequest = { fromUserId: currentUser.id, toUserId: toUserId, status: 'pending' as const };
    
    if(AUTO_ACCEPT_FRIEND_REQUESTS){
      // Instantly accept the request
      handleRequestResponse(currentUser.id, 'accepted', toUserId);
      alert(`You are now friends with ${students.find(s => s.id === toUserId)?.firstName}!`);
      // Update the request list to show it as accepted, though it won't be seen
      setFriendRequests(prev => [...prev, { ...newRequest, status: 'accepted' }]);
    } else {
      alert(`Friend request sent to ${students.find(s => s.id === toUserId)?.firstName}!`);
      setFriendRequests(prev => [...prev, newRequest]);
    }
  };

  const handleRequestResponse = (fromUserId: number, response: 'accepted' | 'declined', toUserIdOverride?: number) => {
    if (!currentUser) return;
    const toUserId = toUserIdOverride || currentUser.id;
    
    // Update the visual status of the request
    setFriendRequests(prev => prev.map(r => r.fromUserId === fromUserId && r.toUserId === toUserId ? { ...r, status: response } : r));

    if (response === 'accepted') {
        let updatedCurrentUser: User | null = null;
        
        // Update the main students list
        setStudents(prev => prev.map(s => {
            let updatedUser = s;
            if (s.id === toUserId) {
                updatedUser = { ...s, friendIds: [...new Set([...s.friendIds, fromUserId])] };
            } else if (s.id === fromUserId) {
                updatedUser = { ...s, friendIds: [...new Set([...s.friendIds, toUserId])] };
            }

            if (updatedUser.id === currentUser.id) {
                updatedCurrentUser = updatedUser;
            }
            return updatedUser;
        }));

        // If the current user was affected, update their state object
        if (updatedCurrentUser) {
            setCurrentUser(updatedCurrentUser);
        }
    }
  };

  // Profile Updates
  const updateInterests = useCallback((interests: string[]) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, interests };
    setCurrentUser(updatedUser);
    setStudents(prev => prev.map(s => s.id === currentUser.id ? updatedUser : s));
  }, [currentUser]);

  const updateProfilePicture = useCallback((base64: string) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, profilePictureUrl: base64 };
    setCurrentUser(updatedUser);
    setStudents(prev => prev.map(s => s.id === currentUser.id ? updatedUser : s));
  }, [currentUser]);

  // Group Management
  const userGroups = useMemo(() => {
    if (!currentUser) return [];
    return studentGroups.filter(g => currentUser.groupIds.includes(g.id));
  }, [currentUser, studentGroups]);

  const joinGroup = useCallback((groupId: number) => {
    if (!currentUser || currentUser.groupIds.includes(groupId)) return;
    const updatedUser = { ...currentUser, groupIds: [...currentUser.groupIds, groupId] };
    setCurrentUser(updatedUser);
    setStudents(prev => prev.map(s => s.id === currentUser.id ? updatedUser : s));
  }, [currentUser]);

  const leaveGroup = useCallback((groupId: number) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, groupIds: currentUser.groupIds.filter(id => id !== groupId) };
    setCurrentUser(updatedUser);
    setStudents(prev => prev.map(s => s.id === currentUser.id ? updatedUser : s));
  }, [currentUser]);

  const createGroup = (groupName: string, category: StudentGroupCategory) => {
    const newId = Math.max(...studentGroups.map(g => g.id), 0) + 1;
    const newGroup = { id: newId, name: groupName, category };
    setStudentGroups(prev => [...prev, newGroup]);
    joinGroup(newId);
  };

  const renderPage = () => {
    if (!currentUser) return null;
    switch (pageState.page) {
        case 'opportunities':
            return <OpportunitiesPage opportunities={opportunities} students={students} allGroups={studentGroups} signups={signups} currentUser={currentUser} handleSignUp={handleSignUp} handleUnSignUp={handleUnSignUp} setPageState={setPageState} currentUserSignupsSet={currentUserSignupsSet} />;
        case 'opportunityDetail':
            const opp = opportunities.find(o => o.id === pageState.id);
            if (!opp) return <p>Opportunity not found.</p>;
            return <OpportunityDetailPage opportunity={opp} students={students} signups={signups} currentUser={currentUser} handleSignUp={handleSignUp} handleUnSignUp={handleUnSignUp} setPageState={setPageState} allGroups={studentGroups} currentUserSignupsSet={currentUserSignupsSet} />;
        case 'leaderboard':
            return <LeaderboardPage allUsers={students} allGroups={studentGroups} signups={signups} opportunities={opportunities} currentUser={currentUser} handleFriendRequest={handleFriendRequest} setPageState={setPageState}/>;
        case 'profile':
            const profileUser = pageState.userId ? students.find(s => s.id === pageState.userId) : currentUser;
            if(!profileUser) return <p>User not found</p>;
            
            // Calculate stats for the user being viewed
            const profileUserSignups = signups.filter(s => s.userId === profileUser.id);
            const profileUserGroups = studentGroups.filter(g => profileUser.groupIds.includes(g.id));
            
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
                        userGroups={profileUserGroups}
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
            return <GroupsPage currentUser={currentUser} allGroups={studentGroups} joinGroup={joinGroup} leaveGroup={leaveGroup} createGroup={createGroup} />;
        default:
            return <OpportunitiesPage opportunities={opportunities} students={students} allGroups={studentGroups} signups={signups} currentUser={currentUser} handleSignUp={handleSignUp} handleUnSignUp={handleUnSignUp} setPageState={setPageState} currentUserSignupsSet={currentUserSignupsSet} />;
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
        allGroups={studentGroups}
        friendRequests={friendRequests}
        joinGroup={joinGroup}
        leaveGroup={leaveGroup}
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
