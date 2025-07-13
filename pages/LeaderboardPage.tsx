
import React, { useState, useMemo } from 'react';
import { User, StudentGroup, SignUp, Opportunity, StudentGroupCategory, studentGroupCategories } from '../types';
import { PageState } from '../App';

interface LeaderboardPageProps {
  allUsers: User[];
  allGroups: StudentGroup[];
  signups: SignUp[];
  opportunities: Opportunity[];
  currentUser: User;
  handleFriendRequest: (toUserId: number) => void;
  setPageState: (state: PageState) => void;
}

type LeaderboardTab = 'Individuals' | 'All Organizations' | StudentGroupCategory;

const TABS: LeaderboardTab[] = ['Individuals', 'All Organizations', ...studentGroupCategories];

const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ allUsers, allGroups, signups, opportunities, currentUser, handleFriendRequest, setPageState }) => {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('Individuals');

  const userPointsMap = useMemo(() => {
    const map = new Map<number, number>();
    allUsers.forEach(user => {
        const points = signups
            .filter(s => s.userId === user.id)
            .reduce((total, signup) => {
                const opp = opportunities.find(o => o.id === signup.opportunityId);
                return total + (opp?.points || 0);
            }, 0);
        map.set(user.id, points);
    });
    return map;
  }, [allUsers, signups, opportunities]);

  const individualLeaderboard = useMemo(() => {
    return [...allUsers]
        .map(user => ({ user, points: userPointsMap.get(user.id) || 0 }))
        .sort((a, b) => b.points - a.points);
  }, [allUsers, userPointsMap]);

  const groupLeaderboard = useMemo(() => {
    const filteredGroups = activeTab === 'All Organizations' 
        ? allGroups 
        : allGroups.filter(g => g.category === activeTab);

    return filteredGroups
        .map(group => {
            const memberIds = allUsers.filter(u => u.groupIds.includes(group.id)).map(u => u.id);
            const totalPoints = memberIds.reduce((sum, memberId) => sum + (userPointsMap.get(memberId) || 0), 0);
            return { group, points: totalPoints, memberCount: memberIds.length };
        })
        .sort((a, b) => b.points - a.points);
  }, [allGroups, allUsers, userPointsMap, activeTab]);

  const isFriend = (userId: number) => {
    return currentUser.friendIds.includes(userId);
  };

  const UserRow = ({ user, points, index }: { user: User, points: number, index: number}) => {
    const isCurrentUser = user.id === currentUser.id;

    return (
        <li className={`flex items-center justify-between py-4 ${isCurrentUser ? 'bg-yellow-50 rounded-lg -mx-4 px-4' : ''}`}>
            <div className="flex items-center gap-4">
              <span className="font-bold text-lg text-gray-500 w-8 text-center">{index + 1}</span>
              <img src={user.profilePictureUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt={`${user.firstName} ${user.lastName}`} className="h-10 w-10 rounded-full object-cover cursor-pointer" onClick={() => setPageState({ page: 'profile', userId: user.id})}/>
              <span className="font-medium text-gray-900 cursor-pointer" onClick={() => setPageState({ page: 'profile', userId: user.id})}>{user.firstName} {user.lastName}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-cornell-red text-lg">{points} pts</span>
              {!isCurrentUser && (
                 isFriend(user.id) ? (
                    <span className="text-sm bg-green-100 text-green-700 font-semibold py-1 px-3 rounded-full">
                      Friends ✓
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
            {groupLeaderboard.map(({ group, points, memberCount }, index) => (
               <li key={group.id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <span className="font-bold text-lg text-gray-500 w-8 text-center">{index + 1}</span>
                  <div>
                    <p className="font-medium text-gray-900">{group.name}</p>
                    <p className="text-sm text-gray-500">{memberCount} members &bull; {group.category}</p>
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