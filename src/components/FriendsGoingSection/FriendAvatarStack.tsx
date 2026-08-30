import React from 'react';
import { User } from '../../types';
import { getProfilePictureUrl } from '../../api';

interface FriendAvatarStackProps {
  friends: User[];
  max?: number;
}

const FriendAvatarStack: React.FC<FriendAvatarStackProps> = ({ friends, max = 3 }) => {
  if (friends.length === 0) return null;

  const shown = friends.slice(0, max);
  const overflow = friends.length - shown.length;

  return (
    <div className="flex items-center">
      {shown.map((friend) => (
        <img
          key={friend.id}
          src={getProfilePictureUrl(friend.profile_image, friend.photoURL)}
          alt={friend.name}
          title={friend.name}
          className="h-7 w-7 rounded-full border-2 border-white object-cover bg-gray-200 -ml-2 first:ml-0"
        />
      ))}
      {overflow > 0 && (
        <span className="h-7 w-7 -ml-2 rounded-full border-2 border-white bg-gray-200 text-gray-700 text-xs font-semibold flex items-center justify-center">
          +{overflow}
        </span>
      )}
    </div>
  );
};

export default FriendAvatarStack;
