
import React from 'react';
import { ApiFriendRequest, User } from '../types';

interface NotificationsPageProps {
  requests: ApiFriendRequest[];
  allUsers: User[];
  handleRequestResponse: (requestId: number, response: 'accepted' | 'declined') => void;
  currentUser: User;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ requests, allUsers, handleRequestResponse, currentUser }) => {
  const pendingRequests = requests; // All requests from the new API are pending
  
  const getProfileImageUrl = (profileImage: string | null) => {
    if (profileImage) {
      return profileImage;
    }
    // Return a generic silhouette SVG when no profile image is available
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236B7280'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
  };

  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 mb-6">Notifications</h2>
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4">Friend Requests</h3>
        {pendingRequests.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {pendingRequests.map(req => (
              <li key={req.fromUserId} className="flex items-center justify-between py-4">
                <p><span className="font-semibold">{getUserName(req.fromUserId)}</span> wants to be your friend.</p>
                <div className="flex gap-2">
                  <button onClick={() => handleRequestResponse(req.fromUserId, 'accepted')} className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">Accept</button>
                  <button onClick={() => handleRequestResponse(req.fromUserId, 'declined')} className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors">Decline</button>
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
