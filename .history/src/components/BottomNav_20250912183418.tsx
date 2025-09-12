
import React from 'react';
import { Page, PageState } from '../App';


interface BottomNavProps {
  currentPage: Page;
  setPageState: (page: PageState) => void;
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

const BottomNav: React.FC<BottomNavProps> = ({ currentPage, setPageState }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white shadow-[0_-2px_5px_rgba(0,0,0,0.1)] flex md:hidden z-20">
      <NavItem
        label="Events"
        icon={<CalendarIcon />}
        isActive={currentPage === 'opportunities'}
        onClick={() => setPageState({ page: 'opportunities' })}
      />
       <NavItem
        label="Groups"
        icon={<UsersIcon />}
        isActive={currentPage === 'groups'}
        onClick={() => setPageState({ page: 'groups'})}
      />
      <NavItem
        label="Leaders"
        icon={<LeaderboardIcon />}
        isActive={currentPage === 'leaderboard'}
        onClick={() => setPageState({ page: 'leaderboard'})}
      />
      <NavItem
        label="Profile"
        icon={<ProfileIcon />}
        isActive={currentPage === 'profile'}
        onClick={() => setPageState({ page: 'profile'})}
      />
    </nav>
  );
};

const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const LeaderboardIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <img 
    src="/icons/leaderboard-icon.png" 
    alt="Leaderboard" 
    className={props.className || 'h-6 w-6'}
  />
);

const ProfileIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <img 
    src="/icons/profile-icon.png" 
    alt="Profile" 
    className={props.className || 'h-10 w-10'}
    />
);

const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <img 
  src="/icons/calendar-icon.png" 
  alt="Events" 
  className={props.className || 'h-10 w-10'}
  />
);

const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <img 
    src="/icons/groups-icon-grey.png" 
    alt="Groups" 
    className={props.className || 'h-10 w-10'}
  />
);


export default BottomNav;