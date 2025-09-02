
import React, { useState, useEffect } from 'react';
import { Opportunity, User, SignUp, Organization } from '../types';
import { PageState } from '../App';
import { getProfilePictureUrl, updateOpportunity, getUserById } from '../api';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    description: opportunity.description,
    address: opportunity.address,
    date: opportunity.date,
    duration: opportunity.duration
  });
  const [isSaving, setIsSaving] = useState(false);
  
  // Slot limit management state
  const [isEditingSlots, setIsEditingSlots] = useState(false);
  const [newSlotLimit, setNewSlotLimit] = useState(opportunity.totalSlots);
  const [isUpdatingSlots, setIsUpdatingSlots] = useState(false);
  
  // Use involved_users from backend if available, but filter to only registered users
  // Note: For hosts, being in involved_users means they're signed up, regardless of registered flag
  const signedUpStudents = opportunity.involved_users 
    ? opportunity.involved_users.filter(user => user.registered === true || opportunity.host_id === user.id)
    : students.filter(student =>
        signups.filter(s => s.opportunityId === opportunity.id).map(s => s.userId).includes(student.id)
      );

  // Check if current user is signed up by looking in involved_users from backend
  // This persists across login/logout cycles
  // Note: For hosts, being in involved_users means they're signed up, regardless of registered flag
  const isUserSignedUp = opportunity.involved_users 
    ? opportunity.involved_users.some(user => user.id === currentUser.id && (user.registered === true || opportunity.host_id === user.id))
    : currentUserSignupsSet.has(opportunity.id);

  const isUserHost = opportunity.host_id === currentUser.id;
  const availableSlots = opportunity.totalSlots - signedUpStudents.length;
  const canSignUp = availableSlots > 0 && !isUserSignedUp;

  const displayDate = new Date(opportunity.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  
  // Parse time correctly for display (assuming Eastern Time)
  const [hours, minutes] = opportunity.time.split(':');
  const displayTime = new Date(2024, 0, 1, parseInt(hours), parseInt(minutes)).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const handleButtonClick = () => {
    if (isUserSignedUp) {
      handleUnSignUp(opportunity.id);
    } else {
      handleSignUp(opportunity.id);
    }
  };

  const handleAttendanceSubmitted = () => {
    // You can add a success message or redirect here
    alert('Attendance submitted successfully!');
  };

  const handleUnapproveOpportunity = async () => {
    const confirmed = window.confirm(`Are you sure you want to unapprove the opportunity "${opportunity.name}"? This will hide it from all users.`);
    if (!confirmed) return;

    try {
      await updateOpportunity(opportunity.id, { approved: false });
      alert('Opportunity has been unapproved successfully!');
      // Refresh the page to reflect changes
      window.location.reload();
    } catch (error: any) {
      alert(`Error unapproving opportunity: ${error.message}`);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Format the date correctly by combining the new date with the original time
      const formattedDate = `${editForm.date}T${opportunity.time}`;
      
      const updateData = {
        description: editForm.description,
        address: editForm.address,
        date: formattedDate,
        duration: editForm.duration
      };
      
      await updateOpportunity(opportunity.id, updateData);
      alert('Opportunity details updated successfully!');
      setIsEditing(false);
      
      // Update the local opportunity object to reflect changes
      Object.assign(opportunity, {
        description: editForm.description,
        address: editForm.address,
        date: editForm.date,
        duration: editForm.duration
      });
    } catch (error: any) {
      alert(`Error updating opportunity: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      description: opportunity.description,
      address: opportunity.address,
      date: opportunity.date,
      duration: opportunity.duration
    });
    setIsEditing(false);
  };

  // Slot limit management functions
  const handleUpdateSlotLimit = async () => {
    if (newSlotLimit < signedUpStudents.length) {
      alert(`Cannot set slot limit lower than current number of participants (${signedUpStudents.length}).`);
      return;
    }

    if (newSlotLimit === opportunity.totalSlots) {
      setIsEditingSlots(false);
      return;
    }

    setIsUpdatingSlots(true);
    try {
      await updateOpportunity(opportunity.id, { totalSlots: newSlotLimit });
      alert(`Slot limit updated successfully to ${newSlotLimit}!`);
      
      // Update the local opportunity object
      opportunity.totalSlots = newSlotLimit;
      setIsEditingSlots(false);
    } catch (error: any) {
      alert(`Error updating slot limit: ${error.message}`);
    } finally {
      setIsUpdatingSlots(false);
    }
  };

  const handleCancelSlotEdit = () => {
    setNewSlotLimit(opportunity.totalSlots);
    setIsEditingSlots(false);
  };

  const handleStartSlotEdit = () => {
    setNewSlotLimit(opportunity.totalSlots);
    setIsEditingSlots(true);
  };

  return (
    <div>
        <div className="relative mb-8 rounded-2xl overflow-hidden">
            <img src={opportunity.imageUrl} alt={opportunity.name} className="w-full h-64 md:h-80 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8">
                {opportunity.causes && opportunity.causes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {opportunity.causes.map((cause, index) => (
                      <span key={index} className="text-white bg-cornell-red/80 px-3 py-1 rounded-full text-sm font-semibold">{cause}</span>
                    ))}
                  </div>
                )}
                <h1 className="text-4xl lg:text-5xl font-bold text-white mt-2 drop-shadow-lg">{opportunity.name}</h1>
                {opportunity.nonprofit && (
                  <h2 className="text-2xl font-semibold text-white/90 drop-shadow-lg">{opportunity.nonprofit}</h2>
                )}
                {opportunity.host_org_name && (
                  <h3 className="text-xl font-semibold text-white/80 drop-shadow-lg">Hosted by {opportunity.host_org_name}</h3>
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
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">Event Details</h3>
                    {isUserHost && (
                        <div className="flex gap-2">
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-cornell-red text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
                                >
                                    Edit Details
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleSaveChanges}
                                        disabled={isSaving}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                    >
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
                
                {isEditing ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Event Description</label>
                            <textarea
                                value={editForm.description}
                                onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                                rows={4}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                            <input
                                type="text"
                                value={editForm.address}
                                onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                <input
                                    type="date"
                                    value={editForm.date}
                                    onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                                <input
                                    type="number"
                                    value={editForm.duration}
                                    onChange={(e) => setEditForm({...editForm, duration: parseInt(e.target.value)})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                                    min="1"
                                />
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-700 text-lg leading-relaxed">{opportunity.description}</p>
                )}
                
                <div className="mt-8">
                    <h3 className="text-2xl font-bold mb-4">Participants ({signedUpStudents.length}/{opportunity.totalSlots})</h3>
                    {signedUpStudents.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {signedUpStudents.map(student => (
                                <div key={`${student.id}-${student._lastUpdate || 'no-update'}`} onClick={() => setPageState({ page: 'profile', userId: student.id})} className="text-center cursor-pointer group">
                                                                         <p className="font-semibold text-gray-800 group-hover:text-cornell-red transition">{student.name}</p>
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
                  <div className="space-y-6">
                    <AttendanceManager 
                      opportunity={opportunity}
                      participants={signedUpStudents}
                      onAttendanceSubmitted={handleAttendanceSubmitted}
                    />
                    
                    {/* Slot Limit Management */}
                    <div className="bg-white p-6 rounded-2xl shadow-lg">
                      <h4 className="text-lg font-bold mb-4">Slot Management</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Current Slot Limit</p>
                            <p className="text-2xl font-bold text-gray-800">{opportunity.totalSlots}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Available Slots</p>
                            <p className={`text-lg font-semibold ${availableSlots > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {availableSlots}
                            </p>
                          </div>
                        </div>
                        
                        {!isEditingSlots ? (
                          <button
                            onClick={handleStartSlotEdit}
                            className="w-full bg-cornell-red hover:bg-red-800 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                          >
                            Update Slot Limit
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                New Slot Limit
                              </label>
                              <input
                                type="number"
                                value={newSlotLimit}
                                onChange={(e) => setNewSlotLimit(parseInt(e.target.value) || 1)}
                                min={signedUpStudents.length}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Minimum: {signedUpStudents.length} (current participants)
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleUpdateSlotLimit}
                                disabled={isUpdatingSlots || newSlotLimit < signedUpStudents.length}
                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
                              >
                                {isUpdatingSlots ? 'Updating...' : 'Save Changes'}
                              </button>
                              <button
                                onClick={handleCancelSlotEdit}
                                disabled={isUpdatingSlots}
                                className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Send Email to All Participants Button */}
                    {signedUpStudents.length > 0 && (
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h4 className="text-lg font-bold mb-4">Communication</h4>
                        <button
                          onClick={() => {
                            // Debug: Log the signedUpStudents to see what data we have
                            console.log('Signed up students:', signedUpStudents);
                            console.log('Opportunity involved_users:', opportunity.involved_users);
                            
                            // Get all participant emails - now directly available from backend
                            const participantEmails = signedUpStudents
                              .filter(student => {
                                const hasEmail = student.email && student.email.trim() !== '';
                                console.log(`Student ${student.name}:`, { 
                                  email: student.email,
                                  hasEmail: !!hasEmail 
                                });
                                return hasEmail;
                              })
                              .map(student => student.email)
                              .join(', ');
                            
                            console.log('Participant emails collected:', participantEmails);
                            
                            if (participantEmails) {
                              // Create Gmail draft with all participant emails
                              const subject = encodeURIComponent(`Update for ${opportunity.name}`);
                                                             const body = encodeURIComponent(`Hi everyone,\n\nThis is an update regarding ${opportunity.name}.\n\nBest regards,\n${currentUser.name}`);
                              const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(participantEmails)}&su=${subject}&body=${body}`;
                              window.open(gmailUrl, '_blank');
                            } else {
                              alert('No participant emails available to send to. Please check the console for debugging information.');
                            }
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Send Email to All Participants
                        </button>
                        <p className="text-sm text-gray-500 mt-2 text-center">
                          Opens Gmail draft with all participant emails
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
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
                    
                    {/* Slot limit enforcement message */}
                    {!isUserSignedUp && availableSlots <= 0 && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700 text-center">
                          This event has reached its maximum capacity of {opportunity.totalSlots} participants.
                        </p>
                      </div>
                    )}
                    
                    {/* Admin Unapprove Button */}
                    {currentUser.admin && opportunity.approved !== false && (
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
                      <p className="text-gray-700">{opportunity.address}</p>
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