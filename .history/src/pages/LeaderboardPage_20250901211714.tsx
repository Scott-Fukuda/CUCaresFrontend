
import React, { useState, useMemo, useEffect } from 'react';
import { User, Organization, SignUp, Opportunity, OrganizationType, organizationTypes, FriendshipStatus, FriendRequest } from '../types';
import { PageState } from '../App';
import { getProfilePictureUrl } from '../api';

interface LeaderboardPageProps {
  allUsers: User[];
  allOrgs: Organization[];
  signups: SignUp[];
  opportunities: Opportunity[];
  currentUser: User;
  handleFriendRequest: (toUserId: number) => void;
  setPageState: (state: PageState) => void;
  checkFriendshipStatus: (otherUserId: number) => Promise<FriendshipStatus>;
  friendRequests: FriendRequest[];
}

type LeaderboardTab = 'Individuals' | 'All Organizations' | OrganizationType;

const TABS: LeaderboardTab[] = ['Individuals', 'All Organizations', ...organizationTypes];

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ allUsers, allOrgs, signups, opportunities, currentUser, handleFriendRequest, setPageState, checkFriendshipStatus, friendRequests }) => {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('Individuals');
  const [friendshipStatuses, setFriendshipStatuses] = useState<Map<number, FriendshipStatus>>(new Map());

  const userPointsMap = useMemo(() => {
    const map = new Map<number, number>();
    allUsers.forEach(user => {
        map.set(user.id, user.points || 0);
    });
    return map;
  }, [allUsers]);

  const individualLeaderboard = useMemo(() => {
    return [...allUsers]
        .map(user => ({ user, points: userPointsMap.get(user.id) || 0 }))
        .sort((a, b) => b.points - a.points);
  }, [allUsers, userPointsMap]);

  const groupLeaderboard = useMemo(() => {
    const filteredOrgs = activeTab === 'All Organizations' 
        ? allOrgs 
        : allOrgs.filter(g => g.type === activeTab);

    return filteredOrgs
        .map(org => {
            const memberIds = allUsers.filter(u => u.organizationIds.includes(org.id)).map(u => u.id);
            const totalPoints = memberIds.reduce((sum, memberId) => sum + (userPointsMap.get(memberId) || 0), 0);
            return { org, points: totalPoints, memberCount: memberIds.length };
        })
        .sort((a, b) => b.points - a.points);
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
            statuses.set(user.id, { status: 'none' });
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
    // Check local friendRequests first for immediate updates
    const localRequest = friendRequests.find(r => 
      (r.fromUserId === currentUser.id && r.toUserId === userId) ||
      (r.fromUserId === userId && r.toUserId === currentUser.id)
    );
    
    console.log('getFriendshipStatus for user', userId, 'Local request found:', localRequest);
    
    if (localRequest) {
      if (localRequest.fromUserId === currentUser.id) {
        console.log('Returning pending_sent for user', userId);
        return { status: 'pending_sent' };
      } else {
        console.log('Returning pending_received for user', userId);
        return { status: 'pending_received' };
      }
    }
    
    // Fall back to cached statuses
    const cachedStatus = friendshipStatuses.get(userId) || { status: 'none' };
    console.log('Returning cached status for user', userId, ':', cachedStatus);
    return cachedStatus;
  };

  const UserRow = ({ user, points, index }: { user: User, points: number, index: number}) => {
    const isCurrentUser = user.id === currentUser.id;
    const friendshipStatus = getFriendshipStatus(user.id);
    const isFriend = friendshipStatus.status === 'friends';
    const requestPending = friendshipStatus.status === 'pending';

    return (
        <li className={`flex items-center justify-between py-4 ${isCurrentUser ? 'bg-yellow-50 rounded-lg -mx-4 px-4' : ''}`}>
            <div className="flex items-center gap-4">
              <span className="font-bold text-lg text-gray-500 w-8 text-center">{index + 1}</span>
                                      <img src={getProfilePictureUrl(user.profilePictureUrl)} alt={`${user.firstName} ${user.lastName}`} className="h-10 w-10 rounded-full object-fill cursor-pointer" onClick={() => setPageState({ page: 'profile', userId: user.id})}/>
              <span className="font-medium text-gray-900 cursor-pointer" onClick={() => setPageState({ page: 'profile', userId: user.id})}>{user.firstName} {user.lastName}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-cornell-red text-lg">{points} pts</span>
              {!isCurrentUser && (
                 isFriend ? (
                    <span className="text-sm bg-green-100 text-green-700 font-semibold py-1 px-3 rounded-full">
                      Friends ✓
                    </span>
                 ) : requestPending ? (
                    <span className="text-sm bg-yellow-100 text-yellow-700 font-semibold py-1 px-3 rounded-full">
                      Request Sent
                    </span>
                 ) : (
                    <button onClick={() => handleFriendRequest(user.id)} className="text-sm bg-gray-200 text-gray-700 font-semibold py-1 px-3 rounded-full hover:bg-gray-300 transition-colors">
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
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">Leaderboard</h2>
      
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
            {individualLeaderboard.map(({ user, points }, index) => (
              <UserRow key={user.id} user={user} points={points} index={index} />
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-gray-200">
            {groupLeaderboard.map(({ org, points, memberCount }, index) => (
               <li key={org.id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-lg text-gray-500 w-8 text-center">{index + 1}</span>
                  <div className="cursor-pointer" onClick={() => setPageState({ page: 'groupDetail', id: org.id})}>
                    <p className="font-medium text-gray-900 hover:text-cornell-red">{org.name}</p>
                    <p className="text-sm text-gray-500">{memberCount} members &bull; {org.type}</p>
                  </div>
                </div>
                <span className="font-bold text-cornell-red text-lg">{points} pts</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default LeaderboardPage;