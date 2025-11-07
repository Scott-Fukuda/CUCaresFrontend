import React from 'react';
import { MultiOpp, User, Organization } from '../types';
import { useNavigate } from 'react-router-dom';
import { getProfilePictureUrl } from '../api';
import { calculateEndTime } from '../utils/timeUtils';

interface MultiOppCardProps {
  multiopp: MultiOpp;
  currentUser: User;
  allOrgs: Organization[];
  onSignUp: (multiOppId: number) => void;
  onUnSignUp: (multiOppId: number) => void;
}

const PeopleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4zm0 2c-2.67 0-8 
    1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const MultiOppCard: React.FC<MultiOppCardProps> = ({
  multiopp,
  currentUser,
  allOrgs,
  onSignUp,
  onUnSignUp,
}) => {
  const navigate = useNavigate();

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/multiopp/${multiopp.id}`);
  };

  // For display: use the first MiniOpp as a representative sample
  const firstOpp = multiopp.opportunities?.[0];


  return (
    <div
      onClick={handleCardClick}
      className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col transition-transform hover:scale-105 duration-300 cursor-pointer"
    >
      <img
        src={multiopp.image || '/backup.jpeg'}
        alt={multiopp.name}
        className="w-full h-48 object-cover"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (target.src !== '/backup.jpeg') target.src = '/backup.jpeg';
        }}
      />

      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <span className="text-sm font-semibold text-cornell-red uppercase tracking-wider truncate">
            {multiopp.nonprofit || 'Community Organization'}
          </span>
          {/* <span
            className="text-white-50 text-xs font-bold py-1 rounded-full w-[80px] text-center inline-block flex-shrink-0 ml-2"
            style={{ backgroundColor: '#F5F5F5' }}
          >
            Recurring
          </span> */}
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">{multiopp.name}</h3>
        
        {multiopp.address && <p className="text-gray-600 text-sm mb-4">📍 {multiopp.address}</p>}

        <div className="text-sm text-gray-700 mb-4">
          <strong>Occurs on:</strong>{' '}
          {multiopp.days_of_week?.length > 0
            ? multiopp.days_of_week.map((d: any) => Object.keys(d)[0]).sort().join(", ")
            : 'Flexible'}
        </div>

        {multiopp.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">{multiopp.description}</p>
        )}

        {multiopp.visibility && multiopp.visibility.length > 0 && (
          <div className="mt-auto mb-4">
            <h4 className="text-sm font-semibold text-gray-800 mb-1">Visible to:</h4>
            <div className="flex flex-wrap gap-2">
              {multiopp.visibility.map((orgId) => {
                const org = allOrgs.find((o) => o.id === orgId);
                return org ? (
                  <span
                    key={org.id}
                    className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full border"
                  >
                    {org.name}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        )}

        <div className="mt-auto">
          <button
            onClick={(e) => {
              e.stopPropagation(); // prevent triggering the outer div’s click
              navigate(`/multiopp/${multiopp.id}`); // go directly to the multiopp page
            }}
            className="w-full mt-auto font-bold py-3 px-4 rounded-lg transition-colors bg-cornell-red hover:bg-red-800 text-white"
          >
            View All Dates
          </button>
        </div>
      </div>
    </div>
  );
};

export default MultiOppCard;
