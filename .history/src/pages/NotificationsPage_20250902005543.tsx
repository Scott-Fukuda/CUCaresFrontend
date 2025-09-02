
import React from 'react';
import { User, FriendshipsResponse } from '../types';

interface NotificationsPageProps {
  friendshipsData: FriendshipsResponse | null;
  allUsers: User[];
  handleRequestResponse: (requestId: number, response: 'accepted' | 'declined') => void;
  currentUser: User;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ friendshipsData, allUsers, handleRequestResponse, currentUser }) => {
  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">Notifications</h2>
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Friend Requests</h3>
        {requests.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {requests.map(req => (
              <li key={req.id} className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  {req.requester_profile_image ? (
                    <img 
                      src={req.requester_profile_image} 
                      alt={req.requester_name} 
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 font-semibold text-sm">
                        {req.requester_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <p><span className="font-semibold">{req.requester_name}</span> wants to be your friend.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleRequestResponse(req.id, 'accepted')} 
                    className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleRequestResponse(req.id, 'declined')} 
                    className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No new friend requests.</p>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
