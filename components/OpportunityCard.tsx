
import React, { useMemo } from 'react';
import { Opportunity, User, SignUp, StudentGroup } from '../types';
import { PageState } from '../App';

interface OpportunityCardProps {
  opportunity: Opportunity;
  signedUpStudents: User[];
  allGroups: StudentGroup[];
  currentUser: User;
  onSignUp: (opportunityId: number) => void;
  onUnSignUp: (opportunityId: number) => void;
  isUserSignedUp: boolean;
  setPageState: (state: PageState) => void;
}

const PeopleIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 20 20" fill="currentColor">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0019 16v1h-6.07zM6 11a5 5 0 00-4.54 2.91A6.978 6.978 0 001 16v1h11v-1a6.97 6.97 0 00-1.5-4.33A5 5 0 006 11z" />
    </svg>
);

const TrophyIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M11.64 3.163a.75.75 0 01.09.986l-1.073 1.878A.75.75 0 019.83 6.5H6.17a.75.75 0 01-.826-.473L4.27 4.15A.75.75 0 015.344 3h9.312a.75.75 0 01.986.973l-1.878 3.286a.75.75 0 01-.65.378H8.812a.75.75 0 01-.65-.378L6.284 4.15A.75.75 0 017.357 3h4.283zM5.023 8.25a.75.75 0 01.75-.75h8.454a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75H5.773a.75.75 0 01-.75-.75v-1.5zM3.523 12a.75.75 0 01.75-.75h11.454a.75.75 0 01.75.75v1.5a.75.75 0 01-.75.75H4.273a.75.75 0 01-.75-.75v-1.5zM4 16.5a.75.75 0 000 1.5h12a.75.75 0 000-1.5H4z" clipRule="evenodd" />
    </svg>
);

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, signedUpStudents, allGroups, onSignUp, onUnSignUp, isUserSignedUp, setPageState }) => {
  const availableSlots = opportunity.totalSlots - signedUpStudents.length;
  const canSignUp = availableSlots > 0 && !isUserSignedUp;

  const handleCardClick = (e: React.MouseEvent) => {
    // Prevent navigation if the signup button was clicked
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }
    setPageState({ page: 'opportunityDetail', id: opportunity.id });
  };
  
  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUserSignedUp) {
      onUnSignUp(opportunity.id);
    } else {
      onSignUp(opportunity.id);
    }
  };

  const topGroups = useMemo(() => {
    const groupCounts: {[key: number]: number} = {};
    signedUpStudents.forEach(student => {
        student.groupIds.forEach(groupId => {
            groupCounts[groupId] = (groupCounts[groupId] || 0) + 1;
        });
    });

    return Object.entries(groupCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([groupId]) => allGroups.find(g => g.id === parseInt(groupId)))
        .filter((g): g is StudentGroup => !!g);

  }, [signedUpStudents, allGroups]);

  const displayDate = new Date(opportunity.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  const displayTime = new Date(`1970-01-01T${opportunity.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div onClick={handleCardClick} className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col transition-transform hover:scale-105 duration-300 cursor-pointer">
      <img src={opportunity.imageUrl} alt={opportunity.title} className="w-full h-48 object-cover" />
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
            <span className="text-sm font-semibold text-cornell-red uppercase tracking-wider">{opportunity.organization}</span>
            <span className="bg-yellow-200 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded-full">{opportunity.points} PTS</span>
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{opportunity.title}</h3>
        <p className="text-gray-500 text-sm mb-4">{displayDate} &bull; {displayTime}</p>
        <p className="text-gray-700 mb-6 flex-grow">{opportunity.description}</p>
        
        <div className="flex justify-between items-center text-sm font-medium text-gray-600 mb-2">
            <div className="flex items-center gap-2">
                <PeopleIcon className="h-5 w-5 text-cornell-red" />
                <span>Signed Up ({signedUpStudents.length}/{opportunity.totalSlots})</span>
            </div>
             <span className={`${availableSlots > 0 || isUserSignedUp ? 'text-green-600' : 'text-red-600'} font-bold`}>
                {availableSlots} slots left
             </span>
        </div>
        
        {signedUpStudents.length > 0 ? (
             <div className="flex items-center -space-x-2 mb-4">
                {signedUpStudents.slice(0, 10).map(student => (
                    <div key={student.id} className="group relative hover:z-10">
                        <img 
                            className="h-8 w-8 rounded-full object-cover ring-2 ring-white" 
                            src={student.profilePictureUrl || `https://i.pravatar.cc/150?u=${student.id}`} 
                            alt={`${student.firstName} ${student.lastName}`}
                        />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {student.firstName} {student.lastName}
                            <svg className="absolute text-gray-800 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255" xmlSpace="preserve">
                                <polygon className="fill-current" points="0,0 127.5,127.5 255,0"/>
                            </svg>
                        </div>
                    </div>
                ))}
                {signedUpStudents.length > 10 && <div className="h-8 w-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-semibold ring-2 ring-white">+{signedUpStudents.length - 10}</div>}
             </div>
        ) : (
            <div className="text-center h-8 mb-4 rounded-lg text-sm text-gray-500">Be the first to sign up!</div>
        )}
        
        {topGroups.length > 0 && (
             <div className="mb-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 mb-2">
                    <TrophyIcon className="h-5 w-5 text-yellow-500" />
                    <span>Top Organizations Attending</span>
                </div>
                <div className="flex flex-wrap gap-2 p-3 bg-light-gray rounded-lg">
                    {topGroups.map(group => (
                        <span key={group.id} className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full">{group.name}</span>
                    ))}
                </div>
            </div>
        )}

        <button
          onClick={handleButtonClick}
          disabled={!canSignUp && !isUserSignedUp}
          className={`w-full mt-auto font-bold py-3 px-4 rounded-lg transition-colors text-white ${
            isUserSignedUp
              ? 'bg-green-600 hover:bg-green-700'
              : canSignUp
              ? 'bg-cornell-red hover:bg-red-800'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isUserSignedUp ? 'Signed Up ✓' : canSignUp ? 'Sign Up' : 'No Slots Available'}
        </button>
      </div>
    </div>
  );
};

export default OpportunityCard;
