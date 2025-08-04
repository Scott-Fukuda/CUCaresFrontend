
import React from 'react';
import { FriendRequest, User } from '../types';

interface NotificationsPageProps {
  requests: FriendRequest[];
  allUsers: User[];
  handleRequestResponse: (fromUserId: number, response: 'accepted' | 'declined') => void;
}

const NotificationsPage: React.FC<NotificationsPageProps> = ({ requests, allUsers, handleRequestResponse }) => {
  const pendingRequests = requests.filter(r => r.status === 'pending');
  
  const getUserName = (userId: number) => {
    const user = allUsers.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
  }

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
