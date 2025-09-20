
import React from 'react';
import GroupsIcon from '@mui/icons-material/Groups';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useNavigate, useLocation } from "react-router-dom";
import { User } from '../types';

interface BottomNavProps {
  currentUser: User;
}

const NavItem: React.FC<{
  label: string;
  icon: JSX.Element;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${
      isActive ? 'text-cornell-red' : 'text-gray-500 hover:text-cornell-red'
    }`}
    aria-label={`Go to ${label} page`}
  >
    {React.cloneElement(icon, { className: 'h-6 w-6 mb-1' })}
    <span className="text-xs font-medium">{label}</span>
  </button>
);

const BottomNav: React.FC<BottomNavProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white shadow-[0_-2px_5px_rgba(0,0,0,0.1)] flex md:hidden z-20">
      <NavItem
        label="Events"
        icon={<EventIcon />}
        isActive={location.pathname === '/opportunities'}
        onClick={() => navigate('/')}
      />
       <NavItem
        label="Groups"
        icon={<GroupsIcon />}
        isActive={location.pathname === '/groups'}
        onClick={() => navigate("/groups")}
      />
      <NavItem
        label="Leaderboard"
        icon={<LeaderboardIcon />}
        isActive={location.pathname === '/leaderboard'}
        onClick={() => navigate("/leaderboard")}
      />
      <NavItem
        label="Profile"
        icon={<PersonIcon />}
        isActive={location.pathname === `/profile/${currentUser.id}`}
        onClick={() => navigate(`/profile/${currentUser.id}`)}
      />
      {currentUser.admin &&
        <NavItem
          label="Admin"
          icon={<AdminPanelSettingsIcon />}
          isActive={currentPage === 'admin'}
          // onClick={() => navigate("/admin")}
          onClick={() => setPageState({ page: 'admin'})}
        />
      }
    </nav>
  );
};

export default BottomNav;