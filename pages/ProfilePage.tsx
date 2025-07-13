
import React, { useState } from 'react';
import { User, Badge, StudentGroup, allInterests, FriendRequest } from '../types';
import BadgeIcon from '../components/BadgeIcon';
import { PageState } from '../App';

interface ProfilePageProps {
  user: User; // The user whose profile is being viewed
  isCurrentUser: boolean;
  currentUser: User;
  earnedBadges: Badge[];
  userGroups: StudentGroup[]; // Groups of the user being viewed
  hoursVolunteered: number;
  setPageState: (state: PageState) => void;
  updateInterests: (interests: string[]) => void;
  updateProfilePicture: (base64: string) => void;
  handleFriendRequest: (toUserId: number) => void;
  friendRequests: FriendRequest[];
}

const ProfilePage: React.FC<ProfilePageProps> = (props) => {
  const { 
    user, isCurrentUser, currentUser, earnedBadges, userGroups, 
    hoursVolunteered, setPageState, updateInterests, 
    updateProfilePicture, handleFriendRequest, friendRequests
  } = props;
  
  const [selectedInterests, setSelectedInterests] = useState(user.interests);
  
  const handleInterestChange = (interest: string) => {
    if (!isCurrentUser) return;
    const newInterests = selectedInterests.includes(interest)
      ? selectedInterests.filter(i => i !== interest)
      : [...selectedInterests, interest];
    setSelectedInterests(newInterests);
    updateInterests(newInterests);
  };

  const handleProfilePicUpdate = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCurrentUser && e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProfilePicture(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const friendStatus = currentUser.friendIds.includes(user.id);
  const requestSent = friendRequests.some(r => r.fromUserId === currentUser.id && r.toUserId === user.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column */}
      <div className="lg:col-span-1 space-y-8">
        <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
            <div className="relative w-32 h-32 mx-auto">
                <img 
                    src={user.profilePictureUrl || `https://i.pravatar.cc/150?u=${user.id}`}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-cornell-red object-cover"
                />
                {isCurrentUser && (
                  <label htmlFor="photo-upload" className="absolute bottom-2 right-0 flex items-center justify-center h-8 w-8 bg-cornell-red rounded-full text-white cursor-pointer hover:bg-red-800 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                          <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                      </svg>
                      <input id="photo-upload" type="file" className="hidden" accept="image/*" onChange={handleProfilePicUpdate} />
                  </label>
                )}
            </div>
            <h2 className="text-2xl font-bold mt-4">{user.firstName} {user.lastName}</h2>
            <p className="text-gray-500">{user.email}</p>
            <div className="mt-2 text-gray-600 font-semibold flex justify-center items-center gap-3">
              <span>{user.friendIds.length} Friends</span>
              <span className="text-gray-300">&bull;</span>
              <span>{hoursVolunteered.toFixed(1)} Hours</span>
            </div>
             {!isCurrentUser && (
              <div className="mt-4">
                {friendStatus ? (
                  <span className="w-full inline-block bg-green-100 text-green-700 font-semibold py-2 px-4 rounded-lg">
                    Friends ✓
                  </span>
                ) : (
                  <button onClick={() => handleFriendRequest(user.id)} disabled={requestSent} className="w-full bg-cornell-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-800 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed">
                    {requestSent ? 'Request Sent' : 'Add Friend'}
                  </button>
                )}
              </div>
            )}
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg">
             <h3 className="text-xl font-bold mb-4">{user.firstName}'s Badges</h3>
             {earnedBadges.length > 0 ? (
                <div className="flex flex-wrap gap-4 justify-center">
                    {earnedBadges.map(badge => <BadgeIcon key={badge.id} badge={badge} />)}
                </div>
             ) : (
                <p className="text-gray-500 text-center">{user.firstName} has not earned any badges yet.</p>
             )}
        </div>
      </div>
      
      {/* Right Column */}
      <div className="lg:col-span-2 space-y-8">
         <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold mb-4">{user.firstName}'s Interests</h3>
            <div className="flex flex-wrap gap-3">
                {allInterests.map(interest => (
                    <button 
                        key={interest}
                        onClick={() => handleInterestChange(interest)}
                        disabled={!isCurrentUser}
                        className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                            selectedInterests.includes(interest) 
                                ? 'bg-cornell-red text-white' 
                                : 'bg-light-gray text-gray-700'
                        } ${isCurrentUser ? 'hover:bg-gray-300' : 'cursor-default'}`}
                    >
                        {interest}
                    </button>
                ))}
            </div>
             {isCurrentUser && user.interests.length === 0 && (
                <p className="text-sm text-gray-500 mt-4">Select some interests to get personalized recommendations!</p>
             )}
         </div>

         <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{user.firstName}'s Student Groups</h3>
              {isCurrentUser && (
                <button onClick={() => setPageState({ page: 'groups'})} className="bg-cornell-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-800 transition-colors text-sm">
                  Manage Groups
                </button>
              )}
            </div>
            {userGroups.length > 0 ? (
                <ul className="space-y-3">
                    {userGroups.map(group => (
                        <li key={group.id} className="bg-light-gray p-3 rounded-lg font-medium text-gray-800">
                            {group.name}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500 text-center">{user.firstName} hasn't joined any groups yet.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;