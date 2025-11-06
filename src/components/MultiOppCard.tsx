import React, { useMemo } from 'react';
import { MultiOpp, Organization, User } from '../types';
import { useNavigate } from 'react-router-dom';
import { getProfilePictureUrl } from '../api';

interface MultiOppCardProps {
  multiopp: MultiOpp;
  currentUser: User;
  allOrgs: Organization[];
  onSignUp: (multiOppId: number) => void;
  onUnSignUp: (multiOppId: number) => void;
}

type ParticipantLite = {
  id: number;
  name: string;
  profile_image: string | null;
};

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
  console.log('Rendering MultiOppCard for:', multiopp);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/multiopp/${multiopp.id}`);
  };

  // Aggregate all unique participants across nested opportunities
  const { allParticipants } = useMemo(() => {
    const seen = new Map<number, ParticipantLite>();

    // Guard against missing/undefined arrays
    const opps = Array.isArray(multiopp?.opportunities) ? multiopp.opportunities : [];
    for (const opp of opps) {
      const users = Array.isArray((opp as any).involved_users) ? (opp as any).involved_users : [];
      for (const u of users) {
        if (!u || typeof u.id !== 'number') continue;
        // Normalize to the shape we actually render
        const p: ParticipantLite = {
          id: u.id,
          name: u.name ?? 'Unknown',
          profile_image: u.profile_image ?? null,
        };
        seen.set(p.id, p);
      }
    }

    return { allParticipants: Array.from(seen.values()) };
  }, [multiopp]); // re-run whenever the multiopp object changes

  console.log(allParticipants)
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
        </div>

        <h3 className="text-xl font-bold text-gray-900 mb-2">{multiopp.name}</h3>

        {!!multiopp.address && (
          <p className="text-gray-600 text-sm mb-4">📍 {multiopp.address}</p>
        )}

        <div className="text-sm text-gray-700 mb-4">
          <strong>Occurs on:</strong>{' '}
          {Array.isArray(multiopp.days_of_week) && multiopp.days_of_week.length > 0
            ? multiopp.days_of_week
                .map((d: any) => Object.keys(d)[0])
                .filter(Boolean)
                .sort()
                .join(', ')
            : 'Flexible'}
        </div>

        {!!multiopp.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {multiopp.description}
          </p>
        )}

        {Array.isArray(multiopp.visibility) && multiopp.visibility.length > 0 && (
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

        {/* Participants Section */}
        
        {allParticipants.length > 0 && (
          <div className="mt-auto mb-4">
            <div className="flex items-center mb-2">
              <PeopleIcon className="w-5 h-5 mr-2 text-gray-500" />
              <span className="text-sm font-semibold text-gray-800">
                Participants
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {allParticipants.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full"
                >
                  <img
                    src={getProfilePictureUrl(p.profile_image || null)}
                    alt={p.name}
                    className="w-6 h-6 rounded-full border border-gray-300 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== '/backup.jpeg') target.src = '/backup.jpeg';
                    }}
                  />
                  <span className="text-xs text-gray-700 truncate max-w-[70px]">
                    {p.name?.split(' ')[0] ?? 'User'}
                  </span>
                </div>
              ))}
              {allParticipants.length > 6 && (
                <span className="text-xs text-gray-500 self-center">
                  +{allParticipants.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="mt-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/multiopp/${multiopp.id}`);
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
