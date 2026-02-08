import React, { useState } from 'react';
import { User, Organization, FriendshipsResponse, Opportunity } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { getProfilePictureUrl } from '../api';
import SearchBar from './SearchBar';
import Sidebar from './Sidebar';

interface HeaderProps {
  user: User;
  points: number;
  pendingRequestCount: number;
  onLogout: () => void;
  allUsers: User[];
  allOrgs: Organization[];
  opportunities: Opportunity[];
  friendshipsData: FriendshipsResponse | null;
  joinOrg: (orgId: number) => void;
  leaveOrg: (orgId: number) => void;
  handleFriendRequest: (toUserId: number) => void;
}

const Header: React.FC<HeaderProps> = (props) => {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, points, pendingRequestCount, onLogout } = props;
  const [toggleSideBar, setToggleSideBar] = useState<boolean>(false);

  const isActive = (page: string): boolean => {
    if (page === 'profile') {
      return location.pathname === `/${page}/${user.id}`;
    }

    return location.pathname === `/${page}`;
  };

  const NavButton = ({ page, label }: { page: string; label: string }) => (
    <button
      onClick={() => navigate(page === 'profile' ? `/${page}/${user.id}` : `/${page}`)}
      className={`font-semibold ${isActive(page) ? 'text-cornell-red' : 'text-gray-600 hover:text-cornell-red'}`}
    >
      {label}
    </button>
  );

  return (
    <header className="bg-white shadow-md w-full p-4 mb-8 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
        <div className="flex items-center gap-8">
          <button onClick={() => navigate('/opportunities')} className="hidden md:block">
            <img src="/logo.png" alt="CampusCares Logo" className="h-10 w-10 object-contain" />
          </button>

          {/* Mobile logo and title */}
          <div className="flex items-center gap-2 md:hidden">
            <img
              src="/logo.png"
              alt="CampusCares Logo"
              className="h-15 w-14 object-contain cursor-pointer"
              onClick={() => setToggleSideBar((prev) => !prev)}
            />
          </div>

          {/* Mobile sidebar */}
          <div className="md:hidden">
            <Sidebar
              toggleSideBar={toggleSideBar}
              setToggleSideBar={setToggleSideBar}
              currentUser={user}
            />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <NavButton page="opportunities" label="Events" />
            <NavButton page="groups" label="Groups" />
            {user.admin && <NavButton page="admin" label="Admin Page" />}
            <NavButton page="leaderboard" label="Leaderboard" />
            <NavButton page="about-us" label="About Us" />
            <NavButton page="profile" label="Profile" />
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Search Bar */}
          <div className="relative w-full max-w-sm hidden md:block">
            <SearchBar
              key={`searchbar-${user.id}-${user._lastUpdate || 'no-update'}`}
              allUsers={props.allUsers}
              allOrgs={props.allOrgs}
              opportunities={props.opportunities}
              currentUser={props.user}
              friendshipsData={props.friendshipsData}
              joinOrg={props.joinOrg}
              leaveOrg={props.leaveOrg}
              handleFriendRequest={props.handleFriendRequest}
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/notifications')}
              className="relative text-gray-500 hover:text-cornell-red"
            >
              <NotificationIcon />
              {pendingRequestCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cornell-red text-white text-xs font-bold">
                  {pendingRequestCount}
                </span>
              )}
            </button>
            <div className="text-right hidden lg:block">
              <p className="font-semibold text-gray-800">Welcome, {user.name}!</p>
              <p className="text-sm text-gray-600">
                <span className="font-bold text-cornell-red">{points}</span> points earned ✨
              </p>
            </div>
            <img
              src={getProfilePictureUrl(user.profile_image)}
              alt={user.name}
              className="h-10 w-10 rounded-full object-cover cursor-pointer"
              onClick={() => navigate(`/profile/${user.id}`)}
            />
            {/* <button onClick={onLogout} className="text-sm bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors hidden sm:block">
                Logout
              </button> */}
          </div>
        </div>
      </div>
    </header>
  );
};

const NotificationIcon = ({ className = 'h-6 w-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
    />
  </svg>
);

export default Header;
