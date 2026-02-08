import React, { useState, useMemo, useRef, useEffect } from 'react';
import { User, Organization, FriendshipsResponse, Opportunity } from '../types';
import { useNavigate } from 'react-router-dom';
import { getProfilePictureUrl } from '../api';

interface SearchBarProps {
  allUsers: User[];
  allOrgs: Organization[];
  opportunities: Opportunity[];
  currentUser: User;
  friendshipsData: FriendshipsResponse | null;
  joinOrg: (orgId: number) => void;
  leaveOrg: (orgId: number) => void;
  handleFriendRequest: (toUserId: number) => void;
}

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const SearchBar: React.FC<SearchBarProps> = ({
  allUsers,
  allOrgs,
  opportunities,
  currentUser,
  friendshipsData,
  joinOrg,
  leaveOrg,
  handleFriendRequest,
}) => {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const RESULTS_LIMIT = 3;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { filteredUsers, filteredOrgs, filteredOpps, hasMoreOpps } = useMemo(() => {
    if (!query) return { filteredUsers: [], filteredOrgs: [], filteredOpps: [], hasMoreOpps: false };
    const lowerCaseQuery = query.toLowerCase();

    const users = allUsers
      .filter((u) => u.name.toLowerCase().includes(lowerCaseQuery) && u.id !== currentUser.id)
      .slice(0, RESULTS_LIMIT);

    const orgs = allOrgs.filter((g) => g.name.toLowerCase().includes(lowerCaseQuery)).slice(0, RESULTS_LIMIT);

    const allMatchingOpps = opportunities
      .filter((opp) => {
        if (opp.approved === false) return false;
        if (Array.isArray(opp.visibility) && opp.visibility.length > 0) {
          if (currentUser.admin) return true;
          const userOrgIds = currentUser.organizationIds || [];
          return opp.visibility.some((orgId) => userOrgIds.includes(orgId));
        }
        return true;
      })
      .filter((opp) => {
        const oppName = opp.name.toLowerCase();
        const oppNonprofit = opp.nonprofit ? opp.nonprofit.toLowerCase() : '';
        const oppHostOrg = opp.host_org_name ? opp.host_org_name.toLowerCase() : '';
        return (
          oppName.includes(lowerCaseQuery) ||
          oppNonprofit.includes(lowerCaseQuery) ||
          oppHostOrg.includes(lowerCaseQuery)
        );
      });

    const opps = allMatchingOpps.slice(0, RESULTS_LIMIT);
    const hasMore = allMatchingOpps.length > RESULTS_LIMIT;

    return { filteredUsers: users, filteredOrgs: orgs, filteredOpps: opps, hasMoreOpps: hasMore };
  }, [query, allUsers, allOrgs, opportunities, currentUser.id, RESULTS_LIMIT]);

  const getFriendStatus = (userId: number) => {
    if (friendshipsData) {
      const userData = friendshipsData.users.find((user) => user.user_id === userId);
      if (userData) {
        return userData.friendship_status;
      }
    }
    return 'add';
  };

  const handleResultClick = () => {
    setQuery('');
    setIsFocused(false);
  };

  return (
    <div className="relative" ref={searchRef}>
      <div className="relative">
        <SearchIcon className="h-5 w-5 text-gray-400 absolute top-1/2 left-3 transform -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search students, orgs & opportunities..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cornell-red focus:outline-none transition"
        />
      </div>

      {isFocused && query.length > 0 && (
        <div className="absolute top-full mt-2 w-full max-h-96 overflow-y-auto bg-white rounded-lg shadow-lg z-30">
          {filteredUsers.length === 0 && filteredOrgs.length === 0 && filteredOpps.length === 0 ? (
            <p className="text-gray-500 text-center py-4 px-2">No results found for "{query}"</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {filteredOpps.length > 0 && (
                <li>
                  <h3 className="px-4 py-2 text-xs font-bold text-gray-500 uppercase bg-light-gray">
                    Opportunities
                  </h3>
                  <ul>
                    {filteredOpps.map((opp) => (
                      <li
                        key={opp.id}
                        className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                      >
                        <div
                          className="flex-grow cursor-pointer"
                          onClick={() => {
                            navigate(`/opportunity/${opp.id}`);
                            handleResultClick();
                          }}
                        >
                          <p className="font-semibold text-gray-800">{opp.name}</p>
                          <p className="text-sm text-gray-500">
                            {opp.nonprofit || opp.host_org_name || 'Opportunity'}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                  {hasMoreOpps && (
                    <div className="px-4 py-2 border-t border-gray-100">
                      <button
                        onClick={() => {
                          navigate(`/opportunity-search?q=${encodeURIComponent(query)}`);
                          handleResultClick();
                        }}
                        className="w-full text-center text-sm text-cornell-red font-semibold hover:text-red-800 transition-colors py-2"
                      >
                        See All Opportunities
                      </button>
                    </div>
                  )}
                </li>
              )}
              {filteredOrgs.length > 0 && (
                <li>
                  <h3 className="px-4 py-2 text-xs font-bold text-gray-500 uppercase bg-light-gray">
                    Organizations
                  </h3>
                  <ul>
                    {filteredOrgs.map((org) => {
                      const isMember =
                        currentUser.organizationIds && currentUser.organizationIds.includes(org.id);
                      return (
                        <li
                          key={org.id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                        >
                          <div
                            className="flex-grow cursor-pointer"
                            onClick={() => {
                              navigate(`/group-detail/${org.id}`);
                              handleResultClick();
                            }}
                          >
                            <p className="font-semibold text-gray-800">{org.name}</p>
                            <p className="text-sm text-gray-500">{org.type}</p>
                          </div>
                          <button
                            onClick={() => {
                              isMember ? leaveOrg(org.id) : joinOrg(org.id);
                            }}
                            className={`text-sm font-semibold py-1 px-3 rounded-full transition-colors ml-4 ${
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
                  <h3 className="px-4 py-2 text-xs font-bold text-gray-500 uppercase bg-light-gray">
                    Students
                  </h3>
                  <ul>
                    {filteredUsers.map((user) => {
                      const friendStatus = getFriendStatus(user.id);
                      return (
                        <li
                          key={user.id}
                          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
                        >
                          <div
                            className="flex items-center gap-3 cursor-pointer flex-grow"
                            onClick={() => {
                              navigate(`/profile/${user.id}`);
                              handleResultClick();
                            }}
                          >
                            <img
                              src={getProfilePictureUrl(user.profile_image)}
                              alt=""
                              className="h-9 w-9 rounded-full object-cover"
                            />
                            <p className="font-semibold text-gray-800">{user.name}</p>
                          </div>
                          <div className="pl-2">
                            {friendStatus === 'add' && (
                              <button
                                onClick={() => {
                                  handleFriendRequest(user.id);
                                  handleResultClick();
                                }}
                                className="text-sm bg-gray-200 text-gray-700 font-semibold py-1 px-3 rounded-full hover:bg-gray-300 transition-colors whitespace-nowrap"
                              >
                                Add Friend
                              </button>
                            )}
                            {/* Pending status not available with new API structure */}
                            {friendStatus === 'friends' && (
                              <span className="text-sm text-green-600 font-semibold">
                                Friends ✓
                              </span>
                            )}
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
