
import React from 'react';
import { Opportunity, User, SignUp, StudentGroup } from '../types';
import { PageState } from '../App';

interface OpportunityDetailPageProps {
  opportunity: Opportunity;
  students: User[];
  signups: SignUp[];
  currentUser: User;
  handleSignUp: (opportunityId: number) => void;
  handleUnSignUp: (opportunityId: number) => void;
  setPageState: (state: PageState) => void;
  allGroups: StudentGroup[];
  currentUserSignupsSet: Set<number>;
}

const OpportunityDetailPage: React.FC<OpportunityDetailPageProps> = ({ opportunity, students, signups, currentUser, handleSignUp, handleUnSignUp, setPageState, allGroups, currentUserSignupsSet }) => {
  const signedUpUsersIds = signups
    .filter(s => s.opportunityId === opportunity.id)
    .map(s => s.userId);

  const signedUpStudents = students.filter(student =>
    signedUpUsersIds.includes(student.id)
  );

  const isUserSignedUp = currentUserSignupsSet.has(opportunity.id);
  const availableSlots = opportunity.totalSlots - signedUpStudents.length;
  const canSignUp = availableSlots > 0 && !isUserSignedUp;

  const displayDate = new Date(opportunity.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const displayTime = new Date(`1970-01-01T${opportunity.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const handleButtonClick = () => {
    if (isUserSignedUp) {
      handleUnSignUp(opportunity.id);
    } else {
      handleSignUp(opportunity.id);
    }
  };

  return (
    <div>
        <div className="relative mb-8 rounded-2xl overflow-hidden">
            <img src={opportunity.imageUrl} alt={opportunity.title} className="w-full h-64 md:h-80 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8">
                <span className="text-white bg-cornell-red/80 px-3 py-1 rounded-full text-sm font-semibold">{opportunity.cause}</span>
                <h1 className="text-4xl lg:text-5xl font-bold text-white mt-2 drop-shadow-lg">{opportunity.title}</h1>
                <h2 className="text-2xl font-semibold text-white/90 drop-shadow-lg">{opportunity.organization}</h2>
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-lg">
                <h3 className="text-2xl font-bold mb-4">Event Details</h3>
                <p className="text-gray-700 text-lg leading-relaxed">{opportunity.description}</p>
                
                <div className="mt-8">
                    <h3 className="text-2xl font-bold mb-4">Participants ({signedUpStudents.length}/{opportunity.totalSlots})</h3>
                    {signedUpStudents.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {signedUpStudents.map(student => (
                                <div key={student.id} onClick={() => setPageState({ page: 'profile', userId: student.id})} className="text-center cursor-pointer group">
                                    <img 
                                        src={student.profilePictureUrl || `https://i.pravatar.cc/150?u=${student.id}`} 
                                        alt={`${student.firstName} ${student.lastName}`}
                                        className="w-20 h-20 rounded-full mx-auto object-cover border-2 border-transparent group-hover:border-cornell-red transition"
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
                 <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <ul className="space-y-4 text-gray-700">
                        <li className="flex items-center gap-3"><CalendarIcon /> <span>{displayDate}</span></li>
                        <li className="flex items-center gap-3"><ClockIcon /> <span>{displayTime}</span></li>
                        <li className="flex items-center gap-3"><UsersIcon /> <span>{availableSlots} of {opportunity.totalSlots} slots remaining</span></li>
                        <li className="flex items-center gap-3"><StarIcon /> <span>{opportunity.points} points</span></li>
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
                 </div>
                 <div className="bg-white p-6 rounded-2xl shadow-lg h-64">
                    <h4 className="text-lg font-bold mb-2">Location</h4>
                    <div className="bg-gray-200 h-full rounded-lg flex items-center justify-center text-gray-500">
                        <p>Map placeholder</p>
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
