
import React, { useState, useMemo, useEffect } from 'react';
import { User, Organization, SignUp, Opportunity, OrganizationType, organizationTypes, FriendshipStatus, FriendshipsResponse } from '../types';
import { PageState } from '../App';
import { getProfilePictureUrl, getMonthlyPoints } from '../api';

interface LeaderboardPageProps {
  allUsers: User[];
  allOrgs: Organization[];
  signups: SignUp[];
  opportunities: Opportunity[];
  currentUser: User;
  handleFriendRequest: (toUserId: number) => void;
  handleAcceptFriendRequest: (otherUserId: number) => void;
  handleRejectFriendRequest: (otherUserId: number) => void;
  setPageState: (state: PageState) => void;
  checkFriendshipStatus: (otherUserId: number) => Promise<FriendshipStatus>;
  friendshipsData: FriendshipsResponse | null;
  joinOrg: (orgId: number) => void; // Add joinOrg prop
  leaveOrg: (orgId: number) => void; // Add leaveOrg prop
}

type LeaderboardTab = 'Individuals' | 'All Organizations' | OrganizationType;

const TABS: LeaderboardTab[] = ['Individuals', 'All Organizations', ...organizationTypes];

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ allUsers, allOrgs, signups, opportunities, currentUser, handleFriendRequest, handleAcceptFriendRequest, handleRejectFriendRequest, setPageState, checkFriendshipStatus, friendshipsData, joinOrg, leaveOrg }) => {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('Individuals');
  const [friendshipStatuses, setFriendshipStatuses] = useState<Map<number, FriendshipStatus>>(new Map());
  const [pointsView, setPointsView] = useState<'monthly' | 'alltime'>('monthly');
  const [monthlyPointsData, setMonthlyPointsData] = useState<Map<number, number>>(new Map());
  const [isLoadingMonthlyPoints, setIsLoadingMonthlyPoints] = useState(false);

  // Helper function to get the start date for monthly points
  const getMonthlyPointsStartDate = (): string => {
    const now = new Date();
    const oct1_2025 = new Date('2025-10-01T00:00:00');
    
    if (now < oct1_2025) {
      // Before Oct 1, 2025, use Sept 16, 2025
      return '2025-09-16';
    } else {
      // On or after Oct 1, 2025, use first day of current month
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return firstDayOfMonth.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    }
  };

  // Load monthly points data
  useEffect(() => {
    const loadMonthlyPoints = async () => {
      if (pointsView !== 'monthly') return;
      
      setIsLoadingMonthlyPoints(true);
      try {
        const startDate = getMonthlyPointsStartDate();
        const response = await getMonthlyPoints(startDate);
        
        const pointsMap = new Map<number, number>();
        response.users.forEach(({ id, points }) => {
          pointsMap.set(id, points);
        });
        
        setMonthlyPointsData(pointsMap);
      } catch (error) {
        console.error('Error loading monthly points:', error);
        // Fall back to all-time points if monthly points fail
        setPointsView('alltime');
      } finally {
        setIsLoadingMonthlyPoints(false);
      }
    };

    loadMonthlyPoints();
  }, [pointsView]);

  const userPointsMap = useMemo(() => {
    const map = new Map<number, number>();
    
    if (pointsView === 'monthly' && monthlyPointsData.size > 0) {
      // Use monthly points data
      allUsers.forEach(user => {
        map.set(user.id, monthlyPointsData.get(user.id) || 0);
      });
    } else {
      // Use regular points data
      allUsers.forEach(user => {
        map.set(user.id, user.points || 0);
      });
    }
    
    return map;
  }, [allUsers, pointsView, monthlyPointsData]);

  const individualLeaderboard = useMemo(() => {
    const sortedUsers = [...allUsers]
        .map(user => ({ user, points: userPointsMap.get(user.id) || 0 }))
        .sort((a, b) => b.points - a.points);
    
    // Add rank information with tie handling
    return sortedUsers.map((item, index) => {
      let rank = index + 1;
      
      // If this user has the same points as the previous user, use the same rank
      if (index > 0 && sortedUsers[index - 1].points === item.points) {
        // Find the first user with the same points to get their rank
        for (let i = index - 1; i >= 0; i--) {
          if (sortedUsers[i].points === item.points) {
            rank = i + 1;
          } else {
            break;
          }
        }
      }
      
      return { ...item, rank };
    });
  }, [allUsers, userPointsMap]);

  const groupLeaderboard = useMemo(() => {
    const filteredOrgs = activeTab === 'All Organizations' 
        ? allOrgs 
        : allOrgs.filter(g => g.type === activeTab);

    const sortedOrgs = filteredOrgs
        .map(org => {
            const memberIds = allUsers.filter(u => u.organizationIds && u.organizationIds.includes(org.id)).map(u => u.id);
            const totalPoints = memberIds.reduce((sum, memberId) => sum + (userPointsMap.get(memberId) || 0), 0);
            return { org, points: totalPoints, memberCount: memberIds.length };
        })
        .sort((a, b) => b.points - a.points);
    
    // Add rank information with tie handling
    return sortedOrgs.map((item, index) => {
      let rank = index + 1;
      
      // If this org has the same points as the previous org, use the same rank
      if (index > 0 && sortedOrgs[index - 1].points === item.points) {
        // Find the first org with the same points to get their rank
        for (let i = index - 1; i >= 0; i--) {
          if (sortedOrgs[i].points === item.points) {
            rank = i + 1;
          } else {
            break;
          }
        }
      }
      
      return { ...item, rank };
    });
  }, [allOrgs, allUsers, userPointsMap, activeTab]);

  // Load friendship statuses for all users
  useEffect(() => {
    const loadFriendshipStatuses = async () => {
      const statuses = new Map<number, FriendshipStatus>();
      
      for (const user of allUsers) {
        if (user.id !== currentUser.id) {
          try {
            const status = await checkFriendshipStatus(user.id);
            statuses.set(user.id, status);
          } catch (error) {
            console.error(`Error checking friendship status for user ${user.id}:`, error);
            statuses.set(user.id, 'add');
          }
        }
      }
      
      setFriendshipStatuses(statuses);
    };

    if (currentUser) {
      loadFriendshipStatuses();
    }
  }, [allUsers, currentUser, checkFriendshipStatus]);

  const getFriendshipStatus = (userId: number): FriendshipStatus => {
    // Check friendshipsData first for immediate updates
    if (friendshipsData) {
      const userData = friendshipsData.users.find(user => user.user_id === userId);
      if (userData) {
        return userData.friendship_status;
      }
    }
    
    // Fall back to cached statuses
    return friendshipStatuses.get(userId) || 'add';
  };

  const UserRow = ({ user, points, rank }: { user: User, points: number, rank: number}) => {
    const isCurrentUser = user.id === currentUser.id;
    const friendshipStatus = getFriendshipStatus(user.id);
    const isFriend = friendshipStatus === 'friends';
    const requestSent = friendshipStatus === 'sent';
    const requestReceived = friendshipStatus === 'received';

    return (
        <li className={`flex items-center justify-between py-4 ${isCurrentUser ? 'bg-yellow-50 rounded-lg -mx-4 px-4' : ''}`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="font-bold text-lg text-gray-500 w-6 text-center flex-shrink-0">{rank}</span>
              <img src={getProfilePictureUrl(user.profile_image)} alt={user.name} className="h-10 w-10 rounded-full object-cover cursor-pointer flex-shrink-0" onClick={() => setPageState({ page: 'profile', userId: user.id})}/>
              <span className="font-medium text-gray-900 cursor-pointer truncate min-w-0" onClick={() => setPageState({ page: 'profile', userId: user.id})}>{user.name}</span>
            </div>
            
            {/* Mobile layout: stacked vertically */}
            <div className="flex flex-col items-end gap-1 sm:hidden">
              {!isCurrentUser && (
                 isFriend ? (
                    <span className="text-xs bg-green-100 text-green-700 font-medium py-1 px-2 rounded-full text-center flex items-center justify-center min-w-[60px]">
                      Friends ✓
                    </span>
                 ) : requestSent ? (
                    <span className="text-xs bg-yellow-100 text-yellow-700 font-medium py-1 px-2 rounded-full text-center flex items-center justify-center min-w-[80px]">
                      Request Sent
                    </span>
                 ) : requestReceived ? (
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleAcceptFriendRequest(user.id)} 
                        className="text-xs bg-green-600 text-white font-medium py-1 px-2 rounded-full hover:bg-green-700 transition-colors text-center"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleRejectFriendRequest(user.id)} 
                        className="text-xs bg-gray-300 text-gray-800 font-medium py-1 px-2 rounded-full hover:bg-gray-400 transition-colors text-center"
                      >
                        Decline
                      </button>
                    </div>
                 ) : (
                    <button onClick={() => handleFriendRequest(user.id)} className="text-xs bg-gray-200 text-gray-700 font-medium py-1 px-2 rounded-full hover:bg-gray-300 transition-colors text-center min-w-[70px]">
                      Add Friend
                    </button>
                 )
              )}
              <span className="font-bold text-cornell-red text-sm">{points} pts</span>
            </div>

            {/* Desktop layout: horizontal */}
            <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
              <span className="font-bold text-cornell-red text-lg">{points} pts</span>
              {!isCurrentUser && (
                 isFriend ? (
                    <span className="text-xs bg-green-100 text-green-700 font-medium py-1 px-2 rounded-full text-center flex items-center justify-center min-w-[60px]">
                      Friends ✓
                    </span>
                 ) : requestSent ? (
                    <span className="text-xs bg-yellow-100 text-yellow-700 font-medium py-1 px-2 rounded-full text-center flex items-center justify-center min-w-[80px]">
                      Request Sent
                    </span>
                 ) : requestReceived ? (
                    <div className="flex gap-1">
                      <button 
                        onClick={() => handleAcceptFriendRequest(user.id)} 
                        className="text-xs bg-green-600 text-white font-medium py-1 px-2 rounded-full hover:bg-green-700 transition-colors text-center"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleRejectFriendRequest(user.id)} 
                        className="text-xs bg-gray-300 text-gray-800 font-medium py-1 px-2 rounded-full hover:bg-gray-400 transition-colors text-center"
                      >
                        Decline
                      </button>
                    </div>
                 ) : (
                    <button onClick={() => handleFriendRequest(user.id)} className="text-xs bg-gray-200 text-gray-700 font-medium py-1 px-2 rounded-full hover:bg-gray-300 transition-colors text-center min-w-[70px]">
                      Add Friend
                    </button>
                 )
              )}
            </div>
        </li>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Leaderboard</h2>
        
        {/* Points View Options */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pointsView"
                value="monthly"
                checked={pointsView === 'monthly'}
                onChange={(e) => setPointsView(e.target.value as 'monthly' | 'alltime')}
                className="w-4 h-4 text-cornell-red border-gray-300 focus:ring-cornell-red focus:ring-2"
              />
              <span className="text-sm font-medium text-gray-700">Monthly</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="pointsView"
                value="alltime"
                checked={pointsView === 'alltime'}
                onChange={(e) => setPointsView(e.target.value as 'monthly' | 'alltime')}
                className="w-4 h-4 text-cornell-red border-gray-300 focus:ring-cornell-red focus:ring-2"
              />
              <span className="text-sm font-medium text-gray-700">All-Time</span>
            </label>
          </div>
          {isLoadingMonthlyPoints && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cornell-red"></div>
              Loading...
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
            {TABS.map(tab => (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`${
                        activeTab === tab
                        ? 'border-cornell-red text-cornell-red'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-2 border-b-2 font-medium text-sm`}
                >
                    {tab}
                </button>
            ))}
          </nav>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-lg p-6">
        {activeTab === 'Individuals' ? (
          <ul className="divide-y divide-gray-200">
            {individualLeaderboard.map(({ user, points, rank }) => (
              <UserRow key={user.id} user={user} points={points} rank={rank} />
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-gray-200">
            {groupLeaderboard.map(({ org, points, memberCount, rank }) => {
              const isJoined = currentUser.organizationIds?.includes(org.id) || false;
              const isCurrentUserHost = org.host_user_id === currentUser.id;
              
              return (
                <li key={org.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="font-bold text-lg text-gray-500 w-6 text-center flex-shrink-0">{rank}</span>
                    <div className="cursor-pointer flex-1 min-w-0" onClick={() => setPageState({ page: 'groupDetail', id: org.id})}>
                      <p className="font-medium text-gray-900 hover:text-cornell-red truncate">{org.name}</p>
                      <p className="text-sm text-gray-500">{memberCount} members &bull; {org.type}</p>
                    </div>
                  </div>
                  
                  {/* Mobile layout: stacked vertically */}
                  <div className="flex flex-col items-end gap-1 sm:hidden">
                    {!isCurrentUserHost && (
                      isJoined ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); leaveOrg(org.id); }}
                          className="text-xs bg-gray-500 text-white font-medium py-1 px-2 rounded-full hover:bg-gray-600 transition-colors text-center min-w-[50px]"
                        >
                          Leave
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); joinOrg(org.id); }}
                          className="text-xs bg-cornell-red text-white font-medium py-1 px-2 rounded-full hover:bg-red-800 transition-colors text-center min-w-[50px]"
                        >
                          Join
                        </button>
                      )
                    )}
                    <span className="font-bold text-cornell-red text-sm">{points} pts</span>
                  </div>

                  {/* Desktop layout: horizontal */}
                  <div className="hidden sm:flex items-center gap-3 flex-shrink-0">
                    <span className="font-bold text-cornell-red text-lg">{points} pts</span>
                    {!isCurrentUserHost && (
                      isJoined ? (
                        <button 
                          onClick={(e) => { e.stopPropagation(); leaveOrg(org.id); }}
                          className="text-xs bg-gray-500 text-white font-medium py-1 px-2 rounded-full hover:bg-gray-600 transition-colors text-center min-w-[60px]"
                        >
                          Leave
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); joinOrg(org.id); }}
                          className="text-xs bg-cornell-red text-white font-medium py-1 px-2 rounded-full hover:bg-red-800 transition-colors text-center min-w-[60px]"
                        >
                          Join
                        </button>
                      )
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;