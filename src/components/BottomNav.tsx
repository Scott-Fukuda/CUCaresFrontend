
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
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ProfileIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M-4.5 12h22.5" />
    </svg>
);

const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962a3.75 3.75 0 015.965 0m-11.925 0a3.75 3.75 0 015.965 0M9 10.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM21 10.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
  </svg>
);


export default BottomNav;