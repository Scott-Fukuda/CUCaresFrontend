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
import { getProfilePictureUrl, updateUser, getUserAllTimeOpps } from '../api';
import { useNavigate, useParams } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase-config';

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
  getFriendsForUser: (userId: number) => Promise<User[]>;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  allTimeMyOpps: Opportunity[];
  setAllTimeMyOpps: React.Dispatch<React.SetStateAction<Opportunity[]>>;
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
    allTimeMyOpps,
    setAllTimeMyOpps,
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
  const [editingPhone, setEditingPhone] = useState(user.phone || '');

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

  useEffect(() => { }, [currentUser]);

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

  // Load allTimeMyOpps when viewing the current user's own profile
  useEffect(() => {
    if (!isCurrentUser || allTimeMyOpps.length > 0) return;
    getUserAllTimeOpps(currentUser.id)
      .then(setAllTimeMyOpps)
      .catch((err) => console.error('Error loading allTimeMyOpps:', err));
  }, [isCurrentUser, currentUser.id]);

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

  const handleSubscriptionUpdate = async () => {
    if (!isCurrentUser) return;
    try {
      const newValue = !localUser.subscribed;
      await updateUser(localUser.id, {
        subscribed: newValue
      });
      setLocalUser((prev) => ({
        ...prev,
        subscribed: newValue
      }));
      setCurrentUser((prev) =>
        prev ? { ...prev, subscribed: newValue } : prev
      );
    } catch (error) {
      console.error("Error updating subscription:", error);
    }
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
            <div className="relative w-32 h-32 mx-auto">
              <img
                src={getProfilePictureUrl(user.profile_image, user.photoURL)}
                alt={user.name}
                className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-cornell-red object-cover"
              />
              {isCurrentUser && (
                <label
                  htmlFor="photo-upload"
                  className={`absolute bottom-2 right-0 flex items-center justify-center h-8 w-8 rounded-full text-white transition-colors ${uploadingProfilePic
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
                    className={`w-full font-bold py-2 px-4 rounded-lg transition-colors ${isFriend
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

          {(isCurrentUser || currentUser.admin) && (
            <div className="space-y-4">
              <div className="flex justify-center mt-4">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "18px",
                  }}
                >
                  <div
                    style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                    <span style={{ fontSize: "18px", fontWeight: 600, color: "#1f2937" }}>
                      Email newsletter
                    </span>
                    <span style={{ fontSize: "14px", color: "#767676" }}>
                      Get notified about upcoming opportunities
                    </span>
                  </div>
                  <label style={{ position: "relative", width: "44px", height: "28px" }}>
                    <input
                      type="checkbox"
                      checked={localUser.subscribed}
                      onChange={handleSubscriptionUpdate}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        cursor: "pointer",
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: localUser.subscribed ? "#b31b1b" : "#d9d9d9",
                        border: localUser.subscribed ? "2px solid #b31b1b" : "2px solid #757575",
                         borderRadius: "24px",
                        transition: "0.25s",
                      }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        height: "20.5px", width: "20.5px",
                        left: localUser.subscribed ? "19px" : "4px",
                        bottom: "4px",
                        backgroundColor: localUser.subscribed ? "#ffffff" : "#757575",
                        borderRadius: "50%",
                        transition: "0.3s",
                      }}
                    />
                  </label>
                </div>
                {/* <button
                  onClick={handleSubscriptionUpdate}
                  className={`font-bold py-2 px-4 rounded-lg transition-colors text-sm mt-4 ${
                    localUser.subscribed
                      ? "bg-gray-400 text-white hover:bg-gray-500"
                      : "bg-cornell-red text-white hover:bg-red-800"
                  }`}
                >
                  {localUser.subscribed ? "Unsubscribe from Emails" : "Subscribe to Emails"}
                </button> */}
              </div>
              <button
                onClick={() => navigate(`/service-journal/${user.id}`)}
                className="w-full font-bold py-2 px-4 rounded-lg transition-colors"
              >
                See my opportunities
              </button>

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

            {/* Phone Number Section */}
            {isCurrentUser && (
              <div className="mt-10 bg-white p-6 rounded-2xl shadow-lg border-l-4 border-cornell-red">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Private Information</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-cornell-red bg-red-50 px-2 py-1 rounded-full border border-red-100">
                    Private to you
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                    Phone Number
                  </label>
                  
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editingPhone}
                      onChange={(e) => setEditingPhone(e.target.value)}
                      placeholder="e.g. 012-345-6789"
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent transition-all"
                    />
                  ) : (
                    <div className="flex items-center gap-3 group">
                      <div className="p-2 bg-gray-100 rounded-lg group-hover:bg-red-50 transition-colors">
                        <svg xmlns="http://w3.org" className="h-4 w-4 text-gray-500 group-hover:text-cornell-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                      </div>
                      <p className="text-gray-700 font-medium">
                        {localUser.phone || <span className="text-gray-400 italic font-normal">No phone number on file</span>}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isCurrentUser && (
              <>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-cornell-red text-white font-bold py-2 px-4 rounded-lg hover:bg-red-800 transition-colors text-sm mt-4"
                  >
                    {localUser.bio ? 'Edit Bio' : 'Add Bio'}
                  </button>
                ) : (
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={async () => {
                        setSavingBio(true);
                        try {
                          const updatedUser = await updateUser(user.id, { bio: editingBio, phone: editingPhone });
                          // Update local user state
                          if (updatedUser) {
                            setLocalUser(updatedUser);
                            setCurrentUser(updatedUser);
                            
                            setIsEditing(false);
                          } else {
                            setLocalUser((prev: any) => ({ ...prev, bio: editingBio, phone: editingPhone }));
                            setCurrentUser((prev: any) => ({ ...prev, bio: editingBio, phone: editingPhone }));
                            setIsEditing(false);
                          }
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
                      src={getProfilePictureUrl(friend.profile_image, friend.photoURL)}
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
          className="underline hover: text-gray-700"
        >
          Terms of Service and Privacy Policy
        </a>
        .
      </p>
    </div>
  );
};

export default ProfilePage;
