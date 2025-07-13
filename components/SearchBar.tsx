
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, StudentGroup, FriendRequest } from '../types';
import { PageState } from '../App';

interface SearchBarProps {
  allUsers: User[];
  allGroups: StudentGroup[];
  currentUser: User;
  friendRequests: FriendRequest[];
  joinGroup: (groupId: number) => void;
  leaveGroup: (groupId: number) => void;
  handleFriendRequest: (toUserId: number) => void;
  setPageState: (state: PageState) => void;
}

const SearchIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const SearchBar: React.FC<SearchBarProps> = ({
  allUsers,
  allGroups,
  currentUser,
  friendRequests,
  joinGroup,
  leaveGroup,
  handleFriendRequest,
  setPageState,
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { filteredUsers, filteredGroups } = useMemo(() => {
    if (!query) return { filteredUsers: [], filteredGroups: [] };
    const lowerCaseQuery = query.toLowerCase();
    
    const users = allUsers.filter(u => 
        (u.firstName.toLowerCase() + ' ' + u.lastName.toLowerCase()).includes(lowerCaseQuery) &&
        u.id !== currentUser.id
    ).slice(0, 4); 
    
    const groups = allGroups.filter(g => 
        g.name.toLowerCase().includes(lowerCaseQuery)
    ).slice(0, 4);

    return { filteredUsers: users, filteredGroups: groups };
  }, [query, allUsers, allGroups, currentUser.id]);

  const getFriendStatus = (userId: number) => {
    if (currentUser.friendIds.includes(userId)) return 'friends';
    if (friendRequests.some(r =>
      ((r.fromUserId === currentUser.id && r.toUserId === userId) ||
       (r.fromUserId === userId && r.toUserId === currentUser.id && r.status === 'pending'))
    )) return 'pending';
    return 'none';
  };
  
  const handleResultClick = () => {
      setQuery('');
      setIsFocused(false);
  }

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <SearchIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
        <input 
          type="text" 
          placeholder="Search students & groups..." 
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition"
        />
      </div>

      {isFocused && query.length > 0 && (
        <div className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg z-30">
          {(filteredUsers.length === 0 && filteredGroups.length === 0) ? (
            <p className="text-gray-500 text-center py-4 px-2">No results found for "{query}"</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredGroups.length > 0 && (
                <li>
                  <h3 className="px-4 py-2 text-xs font-bold text-gray-500 uppercase bg-light-gray">Organizations</h3>
                  <ul>
                    {filteredGroups.map(group => {
                      const isMember = currentUser.groupIds.includes(group.id);
                      return (
                        <li key={group.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                          <div>
                            <p className="font-semibold text-gray-800">{group.name}</p>
                            <p className="text-sm text-gray-500">{group.category}</p>
                          </div>
                          <button 
                            onClick={() => {
                                isMember ? leaveGroup(group.id) : joinGroup(group.id);
                                handleResultClick();
                            }}
                            className={`text-sm font-semibold py-1 px-3 rounded-full transition-colors ${
                                isMember 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {isMember ? 'Leave' : 'Join'}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              )}
              {filteredUsers.length > 0 && (
                 <li>
                  <h3 className="px-4 py-2 text-xs font-bold text-gray-500 uppercase bg-light-gray">Students</h3>
                  <ul>
                    {filteredUsers.map(user => {
                      const friendStatus = getFriendStatus(user.id);
                      return (
                        <li key={user.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                           <div 
                              className="flex items-center gap-3 cursor-pointer flex-grow"
                              onClick={() => {
                                setPageState({ page: 'profile', userId: user.id });
                                handleResultClick();
                              }}
                            >
                                <img src={user.profilePictureUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt="" className="h-9 w-9 rounded-full object-cover" />
                                <p className="font-semibold text-gray-800">{user.firstName} {user.lastName}</p>
                           </div>
                           <div className="pl-2">
                            {friendStatus === 'none' && <button onClick={() => { handleFriendRequest(user.id); handleResultClick(); }} className="text-sm bg-gray-200 text-gray-700 font-semibold py-1 px-3 rounded-full hover:bg-gray-300 transition-colors whitespace-nowrap">Add Friend</button>}
                            {friendStatus === 'pending' && <button disabled className="text-sm bg-gray-100 text-gray-500 font-semibold py-1 px-3 rounded-full cursor-not-allowed">Pending</button>}
                            {friendStatus === 'friends' && <span className="text-sm text-green-600 font-semibold">Friends ✓</span>}
                           </div>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;