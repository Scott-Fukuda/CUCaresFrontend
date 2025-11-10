import React, { useState, useEffect } from 'react';
import {
  User,
  SignUp,
  Badge,
  Organization,
  Opportunity,
  allInterests,
  FriendshipStatus,
  FriendshipsResponse,
} from '../types';
import BadgeIcon from '../components/BadgeIcon';
import { getProfilePictureUrl, updateUser } from '../api';
import { useNavigate, useParams } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase-config';
import Calendar from "../components/Calendar";

interface ProfilePageProps {
  students: User[];
  signups: SignUp[];
  organizations: Organization[];
  opportunities: Opportunity[];
  initialBadges: Badge[];
  currentUser: User;
  updateInterests: (interests: string[]) => void;
  updateProfilePicture: (file: File) => void;
  handleFriendRequest: (toUserId: number) => void;
  handleRemoveFriend: (friendId: number) => void;
  friendshipsData: FriendshipsResponse | null;
  checkFriendshipStatus: (otherUserId: number) => Promise<FriendshipStatus>;
  getFriendsForUser: (userId: number) => Promise<User[]>; // New async function
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>; // Add this prop
}

const ProfilePage: React.FC<ProfilePageProps> = (props) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    students,
    signups,
    organizations,
    opportunities,
    initialBadges,
    currentUser,
    updateInterests,
    updateProfilePicture,
    handleFriendRequest,
    handleRemoveFriend,
    friendshipsData,
    checkFriendshipStatus,
    getFriendsForUser,
    setCurrentUser,
  } = props;
  const user = id ? students.find((s) => s.id === parseInt(id!)) : currentUser;
  if (!user) return <p>User not found</p>;

  const key = `${user.id}-${user._lastUpdate || 'no-update'}`;
  const isCurrentUser = user.id === currentUser.id;
  const profileUserSignups = signups.filter((s) => s.userId === user.id);
  const userOrgs = organizations.filter(
    (g) => user.organizationIds && user.organizationIds.includes(g.id)
  );

  const profileUserPoints = user?.points || 0;
  const hoursVolunteered = profileUserSignups.reduce((total, signup) => {
    const opportunity = opportunities.find((o) => o.id === signup.opportunityId);
    return total + (opportunity?.duration || 0);
  }, 0);

  const earnedBadges = initialBadges.filter((b) =>
    b.threshold({
      points: profileUserPoints,
      signUpCount: profileUserSignups.length,
      signups,
      opportunities,
      friendsCount: user.friendIds.length,
    })
  );
  // Note: getFriendsForUser is now async, so we'll need to handle this differently
  // For now, we'll pass an empty array and handle the async loading in ProfilePage

  const [selectedInterests, setSelectedInterests] = useState(user.interests);
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>('add');
  const [profileUserFriends, setProfileUserFriends] = useState<User[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingBio, setEditingBio] = useState(user.bio || '');
  const [savingBio, setSavingBio] = useState(false);
  const [localUser, setLocalUser] = useState(user); // Add local user state

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  React.useEffect(() => {
    // console.log('local user: ', localUser)
  }, [localUser]);

  // Update selectedInterests when user.interests changes
  React.useEffect(() => {
    setSelectedInterests(user.interests);
  }, [user.interests]);

  // Update editingBio when user.bio changes
  React.useEffect(() => {
    setEditingBio(user.bio || '');
    setLocalUser(user); // Update local user when user prop changes
  }, [user]);

  // Check friendship status when component mounts or user changes
  useEffect(() => {
    if (!isCurrentUser && currentUser) {
      checkFriendshipStatus(user.id).then(setFriendshipStatus);
    }
  }, [isCurrentUser, currentUser, user.id, checkFriendshipStatus, friendshipsData]);

  useEffect(() => {}, [currentUser]);

  // Load friends when user changes
  useEffect(() => {
    const loadFriends = async () => {
      setLoadingFriends(true);
      try {
        const friends = await getFriendsForUser(user.id);
        setProfileUserFriends(friends);
      } catch (error) {
        console.error('Error loading friends:', error);
        setProfileUserFriends([]);
      } finally {
        setLoadingFriends(false);
      }
    };

    loadFriends();
  }, [user.id, getFriendsForUser]);

  const handleInterestChange = (interest: string) => {
    //console.log('🎯 ProfilePage: handleInterestChange called', { interest, isCurrentUser });
    if (!isCurrentUser) return;
    const newInterests = selectedInterests.includes(interest)
      ? selectedInterests.filter((i) => i !== interest)
      : [...selectedInterests, interest];
    //console.log('🎯 ProfilePage: New interests array:', newInterests);
    setSelectedInterests(newInterests);
    //console.log('🎯 ProfilePage: Calling updateInterests...');
    updateInterests(newInterests);
  };

  const handleProfilePicUpdate = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isCurrentUser && e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingProfilePic(true);
      try {
        await updateProfilePicture(file);
      } catch (error) {
        console.error('Error updating profile picture:', error);
      } finally {
        setUploadingProfilePic(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      sessionStorage.clear();
      localStorage.clear();
      navigate('/login'); // or your landing page
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isFriend = friendshipStatus === 'friends';
  const requestPending = friendshipStatus === 'sent' || friendshipStatus === 'received';

  // Debug logging
  //console.log('ProfilePage render:', {
  //         user: {
  //       id: user.id,
  //       profile_image: user.profile_image
  //     },
  //   friendshipStatus,
  //   isFriend,
  //           requestPending,
  //   currentUserId: currentUser?.id,
  //   profileUserId: user.id
  // });

  return (
  <div>
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"> {/* grid makes the contianer use the CSS grid layout; 1 column on small screens and 3 columns on large screens; gap is the space between the grid colums */}
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-8 lg:max-w-sm"> {/* on large screens, this div takes up 1 of the 3 columns */}
          <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
            <div className="relative w-32 h-32 mx-auto"> {/* positioning context for the profile picture; creates a square box centered horizontally */}
              <img
                src={getProfilePictureUrl(user.profile_image)}
                alt={user.name}
                className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-cornell-red object-cover"
              />
              {isCurrentUser && (
                <label
                  htmlFor="photo-upload"
                  className={`absolute bottom-2 right-0 flex items-center justify-center h-8 w-8 rounded-full text-white transition-colors ${
                    uploadingProfilePic
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-cornell-red cursor-pointer hover:bg-red-800'
                  }`}
                >
                  {uploadingProfilePic ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                      <path
                        fillRule="evenodd"
                        d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <input
                    id="photo-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleProfilePicUpdate}
                    disabled={uploadingProfilePic}
                  />
                </label>
              )}
            </div>
            <h2 className="text-2xl font-bold mt-4">{user.name}</h2>
            <p className="text-gray-500">{user.email}</p>
            <div className="mt-4 text-gray-600 font-semibold flex justify-center items-center gap-3">
              <span>{loadingFriends ? '...' : profileUserFriends.length} Friends</span>
              <span className="text-gray-300">&bull;</span>
              <span>{user.points || 0} Points</span>
              <span className="text-gray-300">&bull;</span>
              <span>{((user.points || 0) / 60).toFixed(1)} Hours</span>
            </div>
            {!isCurrentUser && (
              <div className="mt-4">
                {isFriend ? (
                  <div className="space-y-2">
                    <span className="w-full inline-block bg-green-100 text-green-700 font-semibold py-2 px-4 rounded-lg">
                      Friends ✓
                    </span>
                    <button
                      onClick={() => handleRemoveFriend(user.id)}
                      className="w-full bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm"
                    >
                      Remove Friend
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleFriendRequest(user.id)}
                    disabled={requestPending || isFriend}
                    className={`w-full font-bold py-2 px-4 rounded-lg transition-colors ${
                      isFriend
                        ? 'bg-green-600 text-white cursor-default'
                        : requestPending
                          ? 'bg-red-300 text-white cursor-not-allowed'
                          : 'bg-cornell-red text-white hover:bg-red-800'
                    }`}
                  >
                    {isFriend ? 'Friends!' : requestPending ? 'Request Sent' : 'Add Friend'}
                  </button>
                )}
              </div>
            )}
          </div>

          {isCurrentUser && (
            <div className="space-y-4">
              {/* <button
                onClick={() => navigate('/my-opportunities')}
                className="w-full font-bold py-2 px-4 rounded-lg transition-colors"
              >
                See my opportunities
              </button> */}

              {/*Service Calendar*/}
                <Calendar opportunities={opportunities}/>

              {/* 🧭 View Service Journal Button */}
              {/*
              <div>
                <button
                   onClick={() => navigate(`/service-journal/${user.id}`)}
                   className="w-full bg-cornell-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-800 transition-colors"
                >
                   View Service Journal
                </div></button>
               </div>
              */}

              {/* 🔴 Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Log out
              </button>
            </div>
          )}

          {/* <div className="bg-white p-6 rounded-2xl shadow-lg">
             <h3 className="text-xl font-bold mb-4">{user.name}'s Badges</h3>
             {earnedBadges.length > 0 ? (
                <div className="flex flex-wrap gap-4 justify-center">
                    {earnedBadges.map(badge => <BadgeIcon key={badge.id} badge={badge} />)}
                </div>
             ) : (
                <p className="text-gray-500 text-center">{user.name} has not earned any badges yet.</p>
             )}
        </div> */}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold mb-4">{user.name}'s Bio</h3>

            <div className="flex flex-wrap gap-3">
              {isEditing ? (
                <textarea
                  value={editingBio}
                  onChange={(e) => setEditingBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent resize-none"
                  rows={4}
                />
              ) : (
                <p className="text-sm text-gray-500">{localUser.bio || 'No bio added yet.'}</p>
              )}
            </div>
            {isCurrentUser && (
              <>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-cornell-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-800 transition-colors text-sm mt-4"
                  >
                    {user.bio ? 'Edit Bio' : 'Add Bio'}
                  </button>
                ) : (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={async () => {
                        setSavingBio(true);
                        try {
                          const updatedUser = await updateUser(user.id, { bio: editingBio });
                          // Update local user state
                          setLocalUser({ ...localUser, bio: editingBio });
                          setCurrentUser((prev) => ({ ...prev!, bio: editingBio }));
                          setIsEditing(false);
                        } catch (error) {
                          console.error('Error saving bio:', error);
                          alert('Failed to save bio. Please try again.');
                        } finally {
                          setSavingBio(false);
                        }
                      }}
                      disabled={savingBio}
                      className="bg-cornell-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savingBio ? 'Saving...' : 'Save Bio'}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditingBio(localUser.bio || ''); // Use localUser instead of user
                      }}
                      disabled={savingBio}
                      className="bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors text-sm disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
          {/* <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold mb-4">{user.name}'s Passions</h3>
            <div className="flex flex-wrap gap-3">
              {allInterests.map((interest) => (
                <button
                  key={interest}
                  onClick={() => handleInterestChange(interest)}
                  disabled={!isCurrentUser}
                  className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors ${
                    selectedInterests.includes(interest)
                      ? 'bg-cornell-red text-white'
                      : 'bg-light-gray text-gray-700'
                  } ${isCurrentUser ? 'hover:bg-gray-300 cursor-pointer' : 'cursor-default opacity-50'}`}
                >
                  {interest}
                </button>
              ))}
            </div>
            {isCurrentUser && user.interests.length === 0 && (
              <p className="text-sm text-gray-500 mt-4">
                Select some interests to get personalized recommendations!
              </p>
            )}
          </div> */}

          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{user.name}'s Organizations</h3>
              {isCurrentUser && (
                <button
                  onClick={() => navigate('/groups')}
                  className="bg-cornell-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-800 transition-colors text-sm"
                >
                  Manage Orgs
                </button>
              )}
            </div>
            {userOrgs.length > 0 ? (
              <ul className="space-y-3">
                {userOrgs.map((org) => (
                  <li
                    key={org.id}
                    onClick={() => navigate(`/group-detail/${org.id}`)}
                    className="bg-light-gray p-3 rounded-lg font-medium text-gray-800 cursor-pointer hover:bg-gray-200 transition-colors"
                  >
                    {org.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-center">
                {user.name} hasn't joined any organizations yet.
              </p>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-bold mb-4">
              {user.name}'s Friends ({profileUserFriends.length})
            </h3>
            {loadingFriends ? (
              <p className="text-gray-500 text-center">Loading friends...</p>
            ) : profileUserFriends.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {profileUserFriends.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => navigate(`/profile/${friend.id}`)}
                    className="flex flex-col items-center p-3 bg-light-gray rounded-lg cursor-pointer hover:bg-gray-200 transition-colors"
                  >
                    <img
                      src={getProfilePictureUrl(friend.profile_image)}
                      alt={friend.name}
                      className="w-16 h-16 rounded-full mb-2 border-2 border-cornell-red object-cover"
                    />
                    <span className="text-sm font-medium text-center">{friend.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center">{user.name} hasn't added any friends yet.</p>
            )}
          </div>
        </div>
      </div>
      <p className="mt-6 text-xs text-gray-500 text-center">
            Click here to see our{" "}
            <a
              href="/terms_of_service.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700"
            >
              Terms of Service and Privacy Policy
            </a>
            .
          </p>
          </div>
    </div>
  );
};

export default ProfilePage;
