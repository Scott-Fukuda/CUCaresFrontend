import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import {
  User,
  MinimalUser,
  Opportunity,
  SignUp,
  Organization,
  Badge,
  OrganizationType,
  Notification,
  Friendship,
  FriendshipStatus,
  FriendshipsResponse,
  UserWithFriendshipStatus,
  MultiOpp,
} from './types';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import OpportunitiesPage from './pages/OpportunitiesPage';
import MyOpportunitiesPage from './pages/MyOpportunitiesPage';
import AdminPage from './pages/AdminPage';
import OpportunityDetailPage from './pages/OpportunityDetailPage';
import GroupDetailPage from './pages/GroupDetailPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import GroupsPage from './pages/GroupsPage';
import CreateOpportunityPage from './pages/CreateOpportunityPage';
import PopupMessage from './components/PopupMessage';
import { initialBadges } from './data/initialData'; // Using initial data for badges
import AboutUsPage from './pages/AboutUs';
import PostRegistrationOrgSetup from './components/PostRegistrationOrgSetup';
import MultiOppPage from './pages/MultiOppPage';

interface AppRouterProps {
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  appError: string | null;
  pendingRequestCount: number;
  handleLogout: () => void;
  students: User[];
  opportunities: Opportunity[];
  setOpportunities: React.Dispatch<React.SetStateAction<Opportunity[] | []>>;
  multiopp: MultiOpp[];
  setMultiopp: React.Dispatch<React.SetStateAction<MultiOpp[] | []>>;
  allOpps: (Opportunity | MultiOpp)[];
  setAllOpps: React.Dispatch<React.SetStateAction<(Opportunity | MultiOpp)[] | []>>;
  signups: SignUp[];
  organizations: Organization[];
  setOrganizations: React.Dispatch<React.SetStateAction<Organization[] | []>>;
  joinOrg: (orgId: number) => void;
  leaveOrg: (orgId: number) => void;
  handleSendFriendRequest: (friendId: number) => void;
  leaderboardUsers: User[];
  handleSignUp: (opportunityId: number) => void;
  handleUnSignUp: (opportunityId: number) => void;
  currentUserSignupsSet: Set<number>;
  handleAcceptFriendRequest: (otherUserId: number) => void;
  handleRejectFriendRequest: (otherUserId: number) => void;
  checkFriendshipStatus: (otherUserId: number) => Promise<FriendshipStatus>;
  friendshipsData: FriendshipsResponse | null;
  updateInterests: (interests: string[]) => void;
  updateProfilePicture: (file: File) => void;
  handleRemoveFriend: (friendId: number) => void;
  getFriendsForUser: (userId: number) => Promise<User[]>;
  handleRequestResponse: (requestId: number, response: 'accepted' | 'declined') => void;
  createOrg: (orgName: string, type: OrganizationType, description?: string) => void;
  popupMessage: {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
  };
  closePopup: () => void;
}

const AppRouter: React.FC<AppRouterProps> = ({
  currentUser,
  setCurrentUser,
  isLoading,
  appError,
  pendingRequestCount,
  handleLogout,
  students,
  opportunities,
  setOpportunities,
  multiopp,
  setMultiopp,
  allOpps,
  setAllOpps,
  signups,
  organizations,
  setOrganizations,
  joinOrg,
  leaveOrg,
  handleSendFriendRequest,
  handleSignUp,
  handleUnSignUp,
  currentUserSignupsSet,
  handleAcceptFriendRequest,
  handleRejectFriendRequest,
  checkFriendshipStatus,
  friendshipsData,
  updateInterests,
  updateProfilePicture,
  handleRemoveFriend,
  getFriendsForUser,
  handleRequestResponse,
  createOrg,
  leaderboardUsers,
  popupMessage,
  closePopup,
}) => {
  const AdminRoute: React.FC = () => {
    const location = useLocation();
    if (!currentUser.admin) {
      return <Navigate to="/opportunities" state={{ from: location }} replace />;
    }

    return (
      <AdminPage
        currentUser={currentUser}
        opportunities={opportunities}
        setOpportunities={setOpportunities}
        organizations={organizations}
        setOrganizations={setOrganizations}
        allUsers={students}
      />
    );
  };

  if (!currentUser) return null;
  if (isLoading) {
    return <div className="text-center p-10 font-semibold text-lg">Loading...</div>;
  }
  if (appError) {
    return (
      <div className="text-center p-10 font-semibold text-lg text-red-600 bg-red-100 rounded-lg">
        {appError}
      </div>
    );
  }

  const userPoints = currentUser?.points || 0;

  // Legacy function names for compatibility with existing components
  const handleFriendRequest = handleSendFriendRequest;
  const handleAddFriend = handleSendFriendRequest;

  return (
    <div className="min-h-screen bg-light-gray pb-20 md:pb-0">
      <Header
        key={`header-${currentUser.id}-${currentUser._lastUpdate || 'no-update'}`}
        user={currentUser}
        points={userPoints}
        pendingRequestCount={pendingRequestCount}
        onLogout={handleLogout}
        allUsers={students}
        allOrgs={organizations}
        friendshipsData={friendshipsData}
        joinOrg={joinOrg}
        leaveOrg={leaveOrg}
        handleFriendRequest={handleFriendRequest}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <Routes>
          <Route
            path="/opportunities"
            element={
              <OpportunitiesPage
                multiopps={multiopp}
                opportunities={opportunities}
                students={students}
                allOrgs={organizations}
                signups={signups}
                currentUser={currentUser}
                handleSignUp={handleSignUp}
                handleUnSignUp={handleUnSignUp}
                currentUserSignupsSet={currentUserSignupsSet}
              />
            }
          />
          ;
          <Route
            path="/my-opportunities"
            element={
              <MyOpportunitiesPage
                opportunities={opportunities}
                students={students}
                allOrgs={organizations}
                currentUser={currentUser}
                handleSignUp={handleSignUp}
                handleUnSignUp={handleUnSignUp}
                currentUserSignupsSet={currentUserSignupsSet}
              />
            }
          />
          <Route
            path="/account-setup"
            element={
              <PostRegistrationOrgSetup
                currentUser={currentUser}
                allOrgs={organizations}
                joinOrg={joinOrg}
                createOrg={createOrg}
              />
            }
          />
          <Route path="/admin" element={<AdminRoute />} />
          <Route
            path="/opportunity/:id"
            element={
              <OpportunityDetailPage
                opportunities={opportunities}
                students={students}
                signups={signups}
                currentUser={currentUser}
                handleSignUp={handleSignUp}
                handleUnSignUp={handleUnSignUp}
                allOrgs={organizations}
                currentUserSignupsSet={currentUserSignupsSet}
                setOpportunities={setOpportunities}
              />
            }
          />
          <Route
            path="/group-detail/:id"
            element={
              <GroupDetailPage
                allUsers={students}
                allOrgs={organizations}
                opportunities={opportunities}
                signups={signups}
                currentUser={currentUser}
                joinOrg={joinOrg}
                leaveOrg={leaveOrg}
              />
            }
          />
          <Route
            path="/leaderboard"
            element={
              <LeaderboardPage
                allUsers={leaderboardUsers}
                allOrgs={organizations}
                signups={signups}
                opportunities={opportunities}
                currentUser={currentUser}
                handleFriendRequest={handleFriendRequest}
                handleAcceptFriendRequest={handleAcceptFriendRequest}
                handleRejectFriendRequest={handleRejectFriendRequest}
                checkFriendshipStatus={checkFriendshipStatus}
                friendshipsData={friendshipsData}
                joinOrg={joinOrg}
                leaveOrg={leaveOrg}
              />
            }
          />
          <Route
            path="/profile/:id"
            element={
              <ProfilePage
                students={students}
                signups={signups}
                organizations={organizations}
                opportunities={opportunities}
                initialBadges={initialBadges}
                currentUser={currentUser}
                updateInterests={updateInterests}
                updateProfilePicture={updateProfilePicture}
                handleFriendRequest={handleFriendRequest}
                handleRemoveFriend={handleRemoveFriend}
                friendshipsData={friendshipsData}
                checkFriendshipStatus={checkFriendshipStatus}
                getFriendsForUser={getFriendsForUser}
                setCurrentUser={setCurrentUser}
              />
            }
          />
          <Route
            path="/notifications"
            element={
              <NotificationsPage
                friendshipsData={friendshipsData}
                allUsers={students}
                handleRequestResponse={handleRequestResponse}
                currentUser={currentUser}
              />
            }
          />
          <Route
            path="/groups"
            element={
              <GroupsPage
                currentUser={currentUser}
                allOrgs={organizations}
                joinOrg={joinOrg}
                leaveOrg={leaveOrg}
                createOrg={createOrg}
              />
            }
          />
          <Route
            path="/create-opportunity"
            element={
              <CreateOpportunityPage
                currentUser={currentUser}
                allOpps={allOpps}
                setAllOpps={setAllOpps}
                organizations={organizations}
                opportunities={opportunities}
                setOpportunities={setOpportunities}
              />
            }
          />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route
            path="/org-setup"
            element={
              <PostRegistrationOrgSetup
                currentUser={currentUser}
                allOrgs={organizations}
                joinOrg={joinOrg}
                createOrg={createOrg}
              />
            }
          />
          <Route
              path="/the-salvation-army"
              element={
                <MultiOppPage
                  opportunities={opportunities}
                  users={students}
                  multiopps={multiopp}
                  currentUser={currentUser}
                  allOrgs={organizations}
                  setMultiOpps={setMultiopp}
                  onSignUp={(id) => handleSignUp(id)}
                  staticId={4} // the backend ID for Salvation Army
                />
              }
            />

            <Route
              path="/loaves-and-fishes"
              element={
                <MultiOppPage
                  opportunities={opportunities}
                  users={students}
                  multiopps={multiopp}
                  currentUser={currentUser}
                  allOrgs={organizations}
                  setMultiOpps={setMultiopp}
                  onSignUp={(id) => handleSignUp(id)}
                  staticId={6}
                />
              }
            />

             <Route
              path="/prisoner-express"
              element={
                <MultiOppPage
                  opportunities={opportunities}
                  users={students}
                  multiopps={multiopp}
                  currentUser={currentUser}
                  allOrgs={organizations}
                  setMultiOpps={setMultiopp}
                  onSignUp={(id) => handleSignUp(id)}
                  staticId={7}
                />
              }
            />
            
            <Route
              path="/ithaca-reuse"
              element={
                <MultiOppPage
                  opportunities={opportunities}
                  users={students}
                  multiopps={multiopp}
                  currentUser={currentUser}
                  allOrgs={organizations}
                  setMultiOpps={setMultiopp}
                  onSignUp={(id) => handleSignUp(id)}
                  staticId={5}
                />
              }
            />
          <Route
            path="/multiopp/:id"
            element={
              <MultiOppPage
                opportunities={opportunities}
                users={students}
                multiopps={multiopp}
                currentUser={currentUser}
                allOrgs={organizations}
                setMultiOpps={setMultiopp}
                onSignUp={(id) => handleSignUp(id)}
              />
            }
          />
          {/* <Route path="/" element={<OpportunitiesPage opportunities={opportunities} students={students} allOrgs={organizations} signups={signups} currentUser={currentUser} handleSignUp={handleSignUp} handleUnSignUp={handleUnSignUp} currentUserSignupsSet={currentUserSignupsSet} />}/> */}
          <Route path="/" element={<Navigate to="/opportunities" replace />} />
        </Routes>
      </main>
      <BottomNav currentUser={currentUser} />
      {/* <PopupMessage
                isOpen={popupMessage.isOpen}
                onClose={closePopup}
                title={popupMessage.title}
                message={popupMessage.message}
                type={popupMessage.type}
            /> */}

      {/* Report Bug Button */}
      <a
        href="mailto:sdf72@cornell.edu?subject=Bug Report - CampusCares Frontend&body=Please describe the bug you encountered:"
        className="hidden md:flex fixed bottom-6 right-6 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full shadow-lg transition-colors duration-200 items-center gap-2 z-50 text-base"
        title="Report a Bug"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 md:h-5 md:w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <span className="hidden sm:inline">Report Bug</span>
        <span className="sm:hidden">Report Bug</span>
      </a>
    </div>
  );
};

export default AppRouter;
