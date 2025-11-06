import React from 'react';
import { MultiOpp, Organization, User } from '../types';
import { useNavigate, useParams } from 'react-router-dom';
import { calculateEndTime, formatMiniOppTime } from '../utils/timeUtils';

interface MultiOppDetailPageProps {
  multiopps: MultiOpp[];
  currentUser: User;
  allOrgs: Organization[];
  setMultiOpps: React.Dispatch<React.SetStateAction<MultiOpp[]>>;
  staticId?: number; // new optional prop
}

const MultiOppDetailPage: React.FC<MultiOppDetailPageProps> = ({
  multiopps,
  currentUser,
  allOrgs,
  setMultiOpps,
  staticId,
}) => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Pick either the static ID (for friendly URLs) or the dynamic one
  const multioppId = staticId ?? parseInt(id || '', 10);

  const multiopp = multiopps.find((m) => m.id === multioppId);

  if (!multiopp)
    return (
      <p className="text-center text-gray-500 mt-10">
        Recurring opportunity not found.
      </p>
    );
  // Determine which sub-opps occur this week
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday

  const isThisWeek = (dateString: string) => {
    const d = new Date(dateString);
    return d >= startOfWeek && d <= endOfWeek;
  };

  const weeklyOpps = multiopp.opportunities?.filter((opp) => isThisWeek(opp.date)) || [];

 function formatEventTimeRange(gmtString: string, duration: number) {
  const start = new Date(gmtString);
  const end = new Date(start.getTime() + duration * 60000);

  const startTime = start.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const endTime = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  return `${startTime} – ${endTime}`;
}

  return (
    <div className="pb-12">
      {/* Header */}
      <div className="relative mb-8 rounded-2xl overflow-hidden">
        <img
          src={multiopp.image || '/backup.jpeg'}
          alt={multiopp.name}
          className="w-full h-64 md:h-80 object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src !== '/backup.jpeg') target.src = '/backup.jpeg';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-8">
          <h1 className="text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">{multiopp.name}</h1>
          {multiopp.nonprofit && (
            <h2 className="text-2xl font-semibold text-white/90 drop-shadow-lg">{multiopp.nonprofit}</h2>
          )}
          {multiopp.host_org_name && (
            <h3 className="text-xl font-semibold text-white/80 drop-shadow-lg">
              Hosted by {multiopp.host_org_name}
            </h3>
          )}
        </div>
      </div>

      {/* Details + Description */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left content */}
        <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-lg">
          <h3 className="text-2xl font-bold mb-4">Event Details</h3>
          <p className="text-gray-600 mb-4">{multiopp.description || 'No description provided.'}</p>
          {multiopp.address && (
            <p className="text-gray-700 text-sm mb-6">
              📍{' '}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(multiopp.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cornell-red hover:text-red-800 underline"
              >
                {multiopp.address}
              </a>
            </p>
          )}

          {/* Weekly Opportunities */}
          <div>
            <h3 className="text-xl font-bold mb-3">Upcoming Dates</h3>
            {multiopp.opportunities && multiopp.opportunities.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {multiopp.opportunities.map((opp) => {
                  const thisWeek = isThisWeek(opp.date);
                  return (
                    <div
                      key={opp.id}
                      onClick={() => navigate(`/opportunity/${opp.id}`)}
                      className={`p-4 rounded-xl border transition-transform cursor-pointer hover:scale-[1.02] ${
                        thisWeek
                          ? 'border-cornell-red bg-red-50/50 shadow-sm'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <p className="font-semibold text-gray-800">
                        {new Date(opp.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-sm text-gray-600">{formatEventTimeRange(opp.date, opp.duration)}</p>
                      {thisWeek && (
                        <p className="text-xs font-semibold text-cornell-red mt-1">🌟 This week</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">No specific dates have been added yet.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h4 className="text-lg font-bold mb-2">Recurring Schedule</h4>
            {multiopp.days_of_week && multiopp.days_of_week.length > 0 ? (
              <ul className="text-gray-700">
                <ul className="text-gray-700">
                  {multiopp.days_of_week.map((dayObj, idx) => {
                    const day = Object.keys(dayObj)[0];
                    const slots = dayObj[day]; // e.g. [["17:00", "90"], ["12:00", "80"]]
                    return (
                      <li key={idx}>
                        <span className="font-medium">{day}</span> —{' '}
                        {slots.map(([time, duration], i) => (
                          <span key={i}>
                            {formatMiniOppTime(time, duration)}
                            {i < slots.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </li>
                    );
                  })}
                </ul> 
              </ul>
            ) : (
              <p className="text-gray-500">Flexible or varies by week.</p>
            )}
          </div>

          {/* <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h4 className="text-lg font-bold mb-2">Contact</h4>
            {multiopp.host_org_name ? (
              <p className="text-gray-700">{multiopp.host_org_name}</p>
            ) : (
              <p className="text-gray-500">No contact info provided.</p>
            )}
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default MultiOppDetailPage;
