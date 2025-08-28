
import React, { useState, useEffect } from 'react';
import { Opportunity, User, SignUp, Organization } from '../types';
import { PageState } from '../App';
import { getProfilePictureUrl, updateOpportunity, getOpportunity } from '../api';
import AttendanceManager from '../components/AttendanceManager';

interface OpportunityDetailPageProps {
  opportunity: Opportunity;
  students: User[];
  signups: SignUp[];
  currentUser: User;
  handleSignUp: (opportunityId: number) => void;
  handleUnSignUp: (opportunityId: number) => void;
  setPageState: (state: PageState) => void;
  allOrgs: Organization[];
  currentUserSignupsSet: Set<number>;
}

const OpportunityDetailPage: React.FC<OpportunityDetailPageProps> = ({ opportunity, students, signups, currentUser, handleSignUp, handleUnSignUp, setPageState, allOrgs, currentUserSignupsSet }) => {
  const [currentOpportunity, setCurrentOpportunity] = useState<Opportunity>(opportunity);
  const [loading, setLoading] = useState(false);

  // Fetch the latest opportunity data from backend when component mounts
  useEffect(() => {
    const fetchLatestOpportunity = async () => {
      setLoading(true);
      try {
        const latestOpportunity = await getOpportunity(opportunity.id);
        setCurrentOpportunity(latestOpportunity);
        console.log('Fetched latest opportunity data:', latestOpportunity);
      } catch (error) {
        console.error('Error fetching latest opportunity:', error);
        // Fallback to the prop data if fetch fails
        setCurrentOpportunity(opportunity);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestOpportunity();
  }, [opportunity.id]);
  // Use involved_users from backend if available, but filter to only registered users
  // Note: For hosts, being in involved_users means they're signed up, regardless of registered flag
  const signedUpStudents = currentOpportunity.involved_users 
    ? currentOpportunity.involved_users.filter(user => user.registered === true || currentOpportunity.host_id === user.id)
    : students.filter(student =>
        signups.filter(s => s.opportunityId === currentOpportunity.id).map(s => s.userId).includes(student.id)
      );

  // Debug: Log the involved_users data to see profile picture URLs
  console.log('OpportunityDetailPage - involved_users:', currentOpportunity.involved_users);
  console.log('OpportunityDetailPage - signedUpStudents:', signedUpStudents);

  // Check if current user is signed up by looking in involved_users from backend
  // This persists across login/logout cycles
  // Note: For hosts, being in involved_users means they're signed up, regardless of registered flag
  const isUserSignedUp = currentOpportunity.involved_users 
    ? currentOpportunity.involved_users.some(user => user.id === currentUser.id && (user.registered === true || currentOpportunity.host_id === currentUser.id))
    : currentUserSignupsSet.has(currentOpportunity.id);

  const isUserHost = currentOpportunity.host_id === currentUser.id;
  const availableSlots = currentOpportunity.totalSlots - signedUpStudents.length;
  const canSignUp = availableSlots > 0 && !isUserSignedUp;

  const displayDate = new Date(currentOpportunity.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  
  // Parse time correctly for display (assuming Eastern Time)
  const [hours, minutes] = currentOpportunity.time.split(':');
  const displayTime = new Date(2024, 0, 1, parseInt(hours), parseInt(minutes)).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const handleButtonClick = () => {
    if (isUserSignedUp) {
      handleUnSignUp(currentOpportunity.id);
    } else {
      handleSignUp(currentOpportunity.id);
    }
  };

  const handleAttendanceSubmitted = () => {
    // You can add a success message or redirect here
    alert('Attendance submitted successfully!');
  };

  const handleUnapproveOpportunity = async () => {
    const confirmed = window.confirm(`Are you sure you want to unapprove the opportunity "${currentOpportunity.name}"? This will hide it from all users.`);
    if (!confirmed) return;

    try {
      await updateOpportunity(currentOpportunity.id, { approved: false });
      alert('Opportunity has been unapproved successfully!');
      // Refresh the page to reflect changes
      window.location.reload();
    } catch (error: any) {
      alert(`Error unapproving opportunity: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cornell-red"></div>
        <span className="ml-3 text-lg">Loading opportunity details...</span>
      </div>
    );
  }

  return (
    <div key={`opportunity-${currentOpportunity.id}-${currentOpportunity.involved_users?.length || 0}`}>
        <div className="relative mb-8 rounded-2xl overflow-hidden">
            <img src={currentOpportunity.imageUrl} alt={currentOpportunity.name} className="w-full h-64 md:h-80 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8">
                {currentOpportunity.causes && currentOpportunity.causes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {currentOpportunity.causes.map((cause, index) => (
                      <span key={index} className="text-white bg-cornell-red/80 px-3 py-1 rounded-full text-sm font-semibold">{cause}</span>
                    ))}
                  </div>
                )}
                <h1 className="text-4xl lg:text-5xl font-bold text-white mt-2 drop-shadow-lg">{currentOpportunity.name}</h1>
                {currentOpportunity.nonprofit && (
                  <h2 className="text-2xl font-semibold text-white/90 drop-shadow-lg">{currentOpportunity.nonprofit}</h2>
                )}
                {isUserHost && (
                  <div className="mt-2">
                    <span className="text-white bg-green-600/80 px-3 py-1 rounded-full text-sm font-semibold">You are the host</span>
                  </div>
                )}
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4">Event Details</h3>
                <p className="text-gray-700 text-lg leading-relaxed">{currentOpportunity.description}</p>
                
                <div className="mt-8">
                    <h3 className="text-2xl font-bold mb-4">Participants ({signedUpStudents.length}/{currentOpportunity.totalSlots})</h3>
                    {signedUpStudents.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {signedUpStudents.map(student => (
                                <div key={`${student.id}-${student._lastUpdate || 'no-update'}`} onClick={() => setPageState({ page: 'profile', userId: student.id})} className="text-center cursor-pointer group">
                                    <img 
                                        src={getProfilePictureUrl(student.profilePictureUrl)} 
                                        alt={`${student.firstName} ${student.lastName}`}
                                        className="w-20 h-20 rounded-full mx-auto object-fill border-2 border-transparent group-hover:border-cornell-red transition"
                                    />
                                    <p className="mt-2 font-semibold text-gray-800 group-hover:text-cornell-red transition">{student.firstName} {student.lastName}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="text-center p-6 bg-light-gray rounded-lg text-lg text-gray-500">Be the first to sign up!</div>
                    )}
                </div>
            </div>
            <div className="lg:col-span-1 space-y-8">
                {isUserHost ? (
                  <AttendanceManager 
                    opportunity={currentOpportunity}
                    participants={signedUpStudents}
                    onAttendanceSubmitted={handleAttendanceSubmitted}
                  />
                ) : (
                  <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <ul className="space-y-4 text-gray-700">
                        <li className="flex items-center gap-3"><CalendarIcon /> <span>{displayDate}</span></li>
                        <li className="flex items-center gap-3"><ClockIcon /> <span>{displayTime}</span></li>
                        <li className="flex items-center gap-3"><UsersIcon /> <span>{availableSlots} of {currentOpportunity.totalSlots} slots remaining</span></li>
                        <li className="flex items-center gap-3"><StarIcon /> <span>{currentOpportunity.points} points</span></li>
                    </ul>
                     <button
                        onClick={handleButtonClick}
                        disabled={!canSignUp && !isUserSignedUp}
                        className={`w-full mt-6 font-bold py-4 px-4 rounded-lg transition-colors text-white text-lg ${
                            isUserSignedUp
                            ? 'bg-green-600 hover:bg-green-700'
                            : canSignUp
                            ? 'bg-cornell-red hover:bg-red-800'
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                        >
                        {isUserSignedUp ? 'Signed Up ✓' : canSignUp ? 'Sign Up Now' : 'Event Full'}
                    </button>
                    
                    {/* Admin Unapprove Button */}
                    {currentUser.admin && currentOpportunity.approved !== false && (
                      <button
                        onClick={handleUnapproveOpportunity}
                        className="w-full mt-4 font-bold py-3 px-4 rounded-lg transition-colors text-white text-lg bg-orange-600 hover:bg-orange-700"
                      >
                        Unapprove Opportunity
                      </button>
                    )}
                  </div>
                )}
                 <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h4 className="text-lg font-bold mb-2">Location</h4>
                    <div className="mb-4">
                      <p className="text-gray-700">{currentOpportunity.address}</p>
                    </div>
                    
                 </div>
            </div>
        </div>
    </div>
  );
};


// Icons
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cornell-red" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cornell-red" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cornell-red" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.125-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.125-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cornell-red" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18v-5.5M12 8V6m0 14h.01M7 12h.01M17 12h.01M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M5.64 5.64L4.22 4.22m14.14 0l-1.42 1.42" /></svg>;

export default OpportunityDetailPage;