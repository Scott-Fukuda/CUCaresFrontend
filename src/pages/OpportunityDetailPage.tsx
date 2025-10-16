
import React, { useState, useEffect } from 'react';
import { Opportunity, User, SignUp, Organization } from '../types';
import { getProfilePictureUrl, updateOpportunity, deleteOpportunity, registerForOpp, unregisterForOpp, getOpportunities, uploadProfilePicture, getOpportunityAttendance } from '../api';
import { formatDateTimeForBackend, calculateEndTime } from '../utils/timeUtils';
import AttendanceManager from '../components/AttendanceManager';
import { upload } from '@testing-library/user-event/dist/upload';
import { useNavigate, useParams } from 'react-router-dom';

interface OpportunityDetailPageProps {
  opportunities: Opportunity[];
  students: User[];
  signups: SignUp[];
  currentUser: User;
  handleSignUp: (opportunityId: number) => void;
  handleUnSignUp: (opportunityId: number, opportunityDate?: string, opportunityTime?: string) => void;
  allOrgs: Organization[];
  currentUserSignupsSet: Set<number>;
  setOpportunities: React.Dispatch<React.SetStateAction<Opportunity[]>>;
}

const OpportunityDetailPage: React.FC<OpportunityDetailPageProps> = ({ opportunities, students, signups, currentUser, handleSignUp, handleUnSignUp, allOrgs, currentUserSignupsSet, setOpportunities }) => {
  const navigate = useNavigate();
  const { id } = useParams();

  const opportunity = opportunities.find(o => o.id === parseInt(id!));

  if (!opportunity) return <p>Opportunity not found.</p>;

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: opportunity.name,
    description: opportunity.description,
    address: opportunity.address,
    date: opportunity.date,
    time: opportunity.time,
    duration: opportunity.duration,
    redirect_url: opportunity.redirect_url || '' // Add redirect_url to form state
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Slot limit management state
  const [isEditingSlots, setIsEditingSlots] = useState(false);
  const [newSlotLimit, setNewSlotLimit] = useState(opportunity.total_slots);
  const [isUpdatingSlots, setIsUpdatingSlots] = useState(false);
  
  // Comment/announcement state
  const [newComment, setNewComment] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [showUserLookup, setShowUserLookup] = useState(false);
  const [userLookupName, setUserLookupName] = useState(''); // Changed from userLookupEmail
  const [userLookupResults, setUserLookupResults] = useState<User[]>([]); // Changed to array
  const [isRegisteringUser, setIsRegisteringUser] = useState(false);
  
  // Use involved_users from backend if available, but filter to only registered users
  // Note: For hosts, being in involved_users means they're signed up, regardless of registered flag
  const signedUpStudents = opportunity.involved_users 
    ? opportunity.involved_users.filter(user => user.registered === true || opportunity.host_id === user.id)
    : students.filter(student => {
        const signupUserIds = signups
          .filter(s => s.opportunityId === opportunity.id)
          .map(s => s.userId);
        return signupUserIds.includes(student.id);
      });

  // Check if current user is signed up by looking in involved_users from backend
  // This persists across login/logout cycles
  // Note: For hosts, being in involved_users means they're signed up, regardless of registered flag
  const isUserSignedUp = opportunity.involved_users 
    ? opportunity.involved_users.some(user => user.id === currentUser.id && (user.registered === true || opportunity.host_id === user.id))
    : currentUserSignupsSet.has(opportunity.id);

  const isUserHost = opportunity.host_id === currentUser.id;
  const canManageOpportunity = isUserHost || currentUser.admin;
  const availableSlots = opportunity.total_slots - signedUpStudents.length;
  const canSignUp = availableSlots > 0 && !isUserSignedUp;

  // Parse date components manually to avoid timezone issues
  const [year, month, day] = opportunity.date.split('-').map(Number);
  const displayDate = new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  
  // Parse time correctly for display (assuming Eastern Time)
  const [hours, minutes] = opportunity.time.split(':');
  const displayTime = new Date(2024, 0, 1, parseInt(hours), parseInt(minutes)).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  
  // Calculate and format end time
  const displayEndTime = calculateEndTime(opportunity.date, opportunity.time, opportunity.duration);
  // Organizations that can see this opportunity (visibility list)
  const visibilityOrgs = (allOrgs || [])
    .filter(org => Array.isArray(opportunity.visibility) && opportunity.visibility.includes(org.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  const handleButtonClick = () => {
    if (isUserSignedUp) {
              handleUnSignUp(opportunity.id, opportunity.date, opportunity.time);
    } else {
      handleSignUp(opportunity.id);
    }
  };

  const handleAttendanceSubmitted = async () => {
    try {
      // Fetch updated attendance data from the API
      const attendanceData = await getOpportunityAttendance(opportunity.id);
      
      // Update the opportunity's involved_users with the attendance data
      if (attendanceData.users && opportunity.involved_users) {
        const updatedInvolvedUsers = opportunity.involved_users.map(user => {
          const attendanceUser = attendanceData.users.find((au: any) => au.user_id === user.id);
          if (attendanceUser) {
            return {
              ...user,
              attended: attendanceUser.attended
            };
          }
          return user;
        });
        
        // Update the opportunity object
        const updatedOpportunity = {
          ...opportunity,
          involved_users: updatedInvolvedUsers,
          attendance_marked: true
        };
        
        // Update the opportunities in the parent component
        setOpportunities(prev => prev.map(opp => 
          opp.id === opportunity.id ? updatedOpportunity : opp
        ));
      }
      
      alert('Attendance submitted successfully!');
    } catch (error: any) {
      console.error('Error updating attendance data:', error);
      alert('Attendance submitted, but failed to update display. Please refresh the page.');
    }
  };

  // Admin functions for user management
  const handleUserLookup = () => {
    if (!userLookupName.trim()) {
      setUserLookupResults([]);
      return;
    }
    
    // Filter students by name (case-insensitive partial match) in real-time
    const matchingUsers = students.filter(student => 
      student.name.toLowerCase().includes(userLookupName.toLowerCase().trim())
    );
    
    setUserLookupResults(matchingUsers);
  };

  const handleRegisterUser = async (userId: number) => {
    if (signedUpStudents.length >= opportunity.total_slots) {
      alert('This event has reached its maximum capacity.');
      return;
    }

    setIsRegisteringUser(true);
    try {
      await registerForOpp({ user_id: userId, opportunity_id: opportunity.id });
      // Refresh opportunities data to get updated involved_users
      const updatedOpps = await getOpportunities();
      setOpportunities(updatedOpps);
      // alert('User registered successfully!');
    } catch (error) {
      console.error('Error registering user:', error);
      alert('Failed to register user. They may already be registered.');
    } finally {
      setIsRegisteringUser(false);
    }
  };

  const handleUnregisterUser = async (userId: number) => {
    try {
      await unregisterForOpp({ 
        user_id: userId, 
        opportunity_id: opportunity.id,
        opportunityDate: opportunity.date,
        opportunityTime: opportunity.time,
        isAdminOrHost: currentUser.admin || opportunity.host_id === currentUser.id // Pass admin/host status
      });
      // Refresh opportunities data to get updated involved_users
      const updatedOpps = await getOpportunities();
      setOpportunities(updatedOpps);
      alert('User unregistered successfully!');
    } catch (error) {
      console.error('Error unregistering user:', error);
      alert('Failed to unregister user.');
    }
  };

  const handleUnapproveOpportunity = async () => {
    const confirmed = window.confirm(`Are you sure you want to unapprove the opportunity "${opportunity.name}"? This will hide it from all users.`);
    if (!confirmed) return;

    try {
      await updateOpportunity(opportunity.id, { approved: false });
      
      // Update the local opportunity object to reflect changes
      opportunity.approved = false;
      
      // Update the opportunities list in the parent component
      setOpportunities(prevOpportunities => 
        prevOpportunities.map(opp => 
          opp.id === opportunity.id 
            ? { ...opp, approved: false }
            : opp
        )
      );
      
      alert('Opportunity has been unapproved successfully!');
    } catch (error: any) {
      alert(`Error unapproving opportunity: ${error.message}`);
    }
  };

  const handleDeleteOpportunity = async () => {
    const confirmed = window.confirm(`Are you sure you want to delete the opportunity "${opportunity.name}"? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteOpportunity(opportunity.id);
      
      // Remove the opportunity from the state
      setOpportunities(prevOpportunities => 
        prevOpportunities.filter(opp => opp.id !== opportunity.id)
      );
      
      alert('Opportunity has been deleted successfully!');
      // Navigate back to opportunities page
      navigate('/opportunities');
    } catch (error: any) {
      alert(`Error deleting opportunity: ${error.message}`);
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Format the date and time correctly using the utility function
      const formattedDateTime = formatDateTimeForBackend(editForm.date, editForm.time);
      
      const updateData = {
        name: editForm.name,
        description: editForm.description,
        address: editForm.address,
        date: formattedDateTime,
        duration: editForm.duration,
        redirect_url: editForm.redirect_url.trim() || null // Send null if empty
      };
      
      await updateOpportunity(opportunity.id, updateData);
      
      // Update the opportunity in the state
      setOpportunities(prevOpportunities => 
        prevOpportunities.map(opp => 
          opp.id === opportunity.id 
            ? {
                ...opp,
                name: editForm.name,
                description: editForm.description,
                address: editForm.address,
                date: editForm.date,
                time: editForm.time,
                duration: editForm.duration,
                redirect_url: editForm.redirect_url.trim() || null
              }
            : opp
        )
      );
      
      // Update the local opportunity object to reflect changes
      Object.assign(opportunity, {
        name: editForm.name,
        description: editForm.description,
        address: editForm.address,
        date: editForm.date,
        time: editForm.time,
        duration: editForm.duration,
        redirect_url: editForm.redirect_url.trim() || null
      });
      
      alert('Opportunity details updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      alert(`Error updating opportunity: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditForm({
      name: opportunity.name,
      description: opportunity.description,
      address: opportunity.address,
      date: opportunity.date,
      time: opportunity.time,
      duration: opportunity.duration,
      redirect_url: opportunity.redirect_url || '' // Reset redirect_url
    });
    setSelectedImage(null);
    setImagePreview(null);
    setIsEditing(false);
  };

  // Slot limit management functions
  const handleUpdateSlotLimit = async () => {
    if (newSlotLimit < signedUpStudents.length) {
      alert(`Cannot set slot limit lower than current number of participants (${signedUpStudents.length}).`);
      return;
    }

    if (newSlotLimit === opportunity.total_slots) {
      setIsEditingSlots(false);
      return;
    }

    setIsUpdatingSlots(true);
    try {
      await updateOpportunity(opportunity.id, { "total_slots": newSlotLimit });
      alert(`Slot limit updated successfully to ${newSlotLimit}!`);
      
      // Update the local opportunity object
      opportunity.total_slots = newSlotLimit;
      setIsEditingSlots(false);
    } catch (error: any) {
      alert(`Error updating slot limit: ${error.message}`);
    } finally {
      setIsUpdatingSlots(false);
    }
  };

  const handleCancelSlotEdit = () => {
    setNewSlotLimit(opportunity.total_slots);
    setIsEditingSlots(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setIsAddingComment(true);
    try {
      const currentComments = opportunity.comments || [];
      const updatedComments = [...currentComments, newComment.trim()];
      
      await updateOpportunity(opportunity.id, { comments: updatedComments });
      
      // Update the local opportunity object to reflect changes
      opportunity.comments = updatedComments;
      
      // Clear the input and show success message
      setNewComment('');
      alert('Announcement added successfully!');
      
      // Force a re-render by updating the opportunity object
      navigate(`/opportunity/${opportunity.id}`);
    } catch (error: any) {
      alert(`Error adding announcement: ${error.message}`);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleStartSlotEdit = () => {
    setNewSlotLimit(opportunity.total_slots);
    setIsEditingSlots(true);
  };

  // Handle image selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Handle image upload
  const handleImageUpload = async () => {
    if (!selectedImage) return;

    setIsUploadingImage(true);
    try {
      const uploadResult = await uploadProfilePicture(selectedImage);
      const imageUrl = uploadResult;

      // Update the opportunity with the new image URL
      await updateOpportunity(opportunity.id, { image: imageUrl });

      // Update local state
      opportunity.imageUrl = imageUrl;
      setOpportunities(prevOpportunities => 
        prevOpportunities.map(opp => 
          opp.id === opportunity.id 
            ? { ...opp, imageUrl: imageUrl }
            : opp
        )
      );

      // Clear the selected image and preview
      setSelectedImage(null);
      setImagePreview(null);
      
      alert('Image updated successfully!');
    } catch (error: any) {
      alert(`Error uploading image: ${error.message}`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  useEffect(() => {
    if (!userLookupName.trim()) {
      setUserLookupResults([]);
      return;
    }
    
    // Filter students by name (case-insensitive partial match) in real-time
    const matchingUsers = students.filter(student => 
      student.name.toLowerCase().includes(userLookupName.toLowerCase().trim())
    );

    setUserLookupResults(matchingUsers);
  }, [userLookupName, students]);

  // Function to format description text with newlines and links
  const formatDescription = (text: string) => {
    // Split by newlines and process each line
    const lines = text.split(/\r?\n/); // Handle both \n and \r\n (Windows line endings)
    
    return lines.map((line, lineIndex) => {
      // URL regex pattern
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = line.split(urlRegex);
      
      return (
        <div key={lineIndex} className="mb-2">
          {parts.map((part, partIndex) => {
            if (urlRegex.test(part)) {
              return (
                <a
                  key={partIndex}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cornell-red hover:text-red-800 underline break-all"
                >
                  {part}
                </a>
              );
            }
            return <span key={partIndex}>{part}</span>;
          })}
        </div>
      );
    });
  };

  const handleCloneOpportunity = () => {
    // Prepare the opportunity data for cloning
    const clonedOpportunityData = {
      name: opportunity.name,
      description: opportunity.description,
      address: opportunity.address,
      date: opportunity.date,
      time: opportunity.time,
      duration: opportunity.duration,
      total_slots: opportunity.total_slots,
      nonprofit: opportunity.nonprofit || '',
      host_org_id: opportunity.host_org_id || '',
      causes: opportunity.causes || [],
      tags: opportunity.tags || [],
      redirect_url: opportunity.redirect_url || '',
      imageUrl: opportunity.imageUrl || '',
      visibility: opportunity.visibility || [],
      isPrivate: opportunity.isPrivate || false
    };

    // Navigate to create opportunity page with cloned data
    navigate('/create-opportunity', {
      state: {
        clonedOpportunityData: clonedOpportunityData
      }
    })
  };

  return (
    <div>
        <div className="relative mb-8 rounded-2xl overflow-hidden">
            <img 
                src={opportunity.imageUrl || '/backup.jpeg'} 
                alt={opportunity.name} 
                className="w-full h-64 md:h-80 object-cover"
                onError={(e) => {
                    // Fallback to backup image if the main image fails to load
                    const target = e.target as HTMLImageElement;
                    if (target.src !== '/backup.jpeg') {
                        target.src = '/backup.jpeg';
                    }
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8">
                <h1 className="text-4xl lg:text-5xl font-bold text-white drop-shadow-lg">{opportunity.name}</h1>
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
                {currentUser.admin && !isUserHost && (
                  <div className="mt-2">
                    <span className="text-white bg-blue-600/80 px-3 py-1 rounded-full text-sm font-semibold">Admin View</span>
                  </div>
                )}
            </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold">Event Details</h3>
                    {canManageOpportunity && (
                        <div className="flex gap-2">
                            {!isEditing ? (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="bg-cornell-red text-white px-4 py-2 rounded-lg hover:bg-red-800 transition-colors"
                                    >
                                        Edit Details
                                    </button>
                                    <button
                                        onClick={handleCloneOpportunity}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Clone Opportunity
                                    </button>
                                    <button
                                        onClick={handleDeleteOpportunity}
                                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Delete Opportunity
                                    </button>
                                </>
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
                        {/* Image Upload Section */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Event Image</label>
                            <div className="space-y-4">
                                {/* Current Image Preview */}
                                <div className="relative">
                                    <img 
                                        src={imagePreview || opportunity.imageUrl || '/backup.jpeg'} 
                                        alt="Event preview" 
                                        className="w-full h-48 object-cover rounded-lg border border-gray-300"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            if (target.src !== '/backup.jpeg') {
                                                target.src = '/backup.jpeg';
                                            }
                                        }}
                                    />
                                    {imagePreview && (
                                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                                            New Image Selected
                                        </div>
                                    )}
                                </div>
                                
                                {/* File Input */}
                                <div className="flex gap-3">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                                    />
                                    {selectedImage && (
                                        <button
                                            onClick={handleImageUpload}
                                            disabled={isUploadingImage}
                                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isUploadingImage ? 'Uploading...' : 'Upload Image'}
                                        </button>
                                    )}
                                </div>
                                
                                {selectedImage && (
                                    <p className="text-sm text-gray-600">
                                        Selected: {selectedImage.name} ({(selectedImage.size / 1024 / 1024).toFixed(2)} MB)
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Event Name</label>
                            <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                            />
                        </div>
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
                        <div className="grid grid-cols-3 gap-4">
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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                                <input
                                    type="time"
                                    value={editForm.time}
                                    onChange={(e) => setEditForm({...editForm, time: e.target.value})}
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

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Redirect Link (Optional)</label>
                            <input
                                type="url"
                                value={editForm.redirect_url}
                                onChange={(e) => setEditForm({...editForm, redirect_url: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cornell-red focus:border-transparent"
                                placeholder="https://example.com/register"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                If you would like this opportunity to redirect to an external registration, enter the link here.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="text-gray-700 text-lg leading-relaxed break-words">
                        {formatDescription(opportunity.description)}
                    </div>
                )}
                
                <div className="mt-8 bg-white p-6 rounded-2xl shadow-lg">
  <div className="flex justify-between items-center mb-4">
    <h3 className="text-2xl font-bold">
      Participants ({signedUpStudents.length}/{opportunity.total_slots})
    </h3>
    <div className="text-right">
      <p className="text-sm text-gray-600">Available Slot</p>
      <p
        className={`text-lg font-semibold ${
          availableSlots > 0 ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {availableSlots}
      </p>
    </div>
  </div>

  {signedUpStudents.length > 0 ? (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
      {signedUpStudents.map((student) => (
        <div
          key={`${student.id}-${student._lastUpdate || 'no-update'}`}
          className="text-center group relative"
        >
          <div
            onClick={() => navigate(`/profile/${student.id}`)}
            className="cursor-pointer"
          >
            <p className="font-semibold text-gray-800 group-hover:text-cornell-red transition">
              {student.name}
            </p>
          </div>
          {currentUser.admin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleUnregisterUser(student.id);
              }}
              className="mt-1 text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition-colors"
            >
              Unregister
            </button>
          )}
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center p-6 bg-light-gray rounded-lg text-lg text-gray-500 mb-6">
      Be the first to sign up! +5 bonus points
    </div>
  )}

  {/* Visible To Section */}
  {visibilityOrgs && visibilityOrgs.length > 0 && (
    <div>
      <h4 className="text-lg font-bold mb-3">Visible To</h4>
      <div className="flex flex-wrap gap-2">
        {visibilityOrgs.map((org) => (
          <button
            key={org.id}
            onClick={() => navigate(`/group-detail/${org.id}`)}
            className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-200 transition-colors"
          >
            {org.name}
          </button>
        ))}
      </div>
    </div>
  )}
</div>

                    
                    {/* Slot limit warning for hosts */}
                    {canManageOpportunity && availableSlots <= 0 && (
                        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-700 text-center">
                                ⚠️ This event has reached its maximum capacity. Consider increasing the slot limit if you want to allow more participants. 
                            </p>
                        </div>
                    )}
                </div>
                
                {/* Announcements Section */}
                <div className="mt-8">
                    <h3 className="text-2xl font-bold mb-4">Announcements</h3>
                    
                    {/* Host can add new announcements */}
                    {canManageOpportunity && (
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="text-lg font-semibold text-blue-800 mb-3">Add New Announcement</h4>
                            <div className="space-y-3">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Enter your announcement here..."
                                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={3}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleAddComment}
                                        disabled={!newComment.trim() || isAddingComment}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
                                    >
                                        {isAddingComment ? 'Adding...' : 'Post Announcement'}
                                    </button>
                                    <button
                                        onClick={() => setNewComment('')}
                                        disabled={!newComment.trim()}
                                        className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Display existing announcements */}
                    {opportunity.comments && opportunity.comments.length > 0 ? (
                        <div className="space-y-4">
                            {opportunity.comments.map((comment, index) => (
                                <div key={index} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 bg-cornell-red rounded-full flex items-center justify-center flex-shrink-0">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-gray-800 leading-relaxed">{comment}</p>
                                            <p className="text-xs text-gray-500 mt-2">Posted by host</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-6 bg-gray-50 rounded-lg text-gray-500">
                            {canManageOpportunity ? 'No announcements yet. Add one above!' : 'No announcements yet.'}
                        </div>
                    )}
                </div>
            </div>
            <div className="lg:col-span-1 space-y-8">
                {canManageOpportunity ? (
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
                            <p className="text-2xl font-bold text-gray-800">{opportunity.total_slots}</p>
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
                                type="text"
                                value={newSlotLimit}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '') {
                                    setNewSlotLimit(0);
                                  } else {
                                    const numValue = parseInt(value);
                                    if (!isNaN(numValue) && numValue >= 1) {
                                      setNewSlotLimit(numValue);
                                    }
                                  }
                                }}
                                onBlur={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (isNaN(value) || value < signedUpStudents.length) {
                                    setNewSlotLimit(signedUpStudents.length);
                                  }
                                }}
                                placeholder={`Minimum: ${signedUpStudents.length}`}
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
                    {/* Admin Unapprove Button - Now visible to admins and hosts */}
                    {currentUser.admin && opportunity.approved !== false && (
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h4 className="text-lg font-bold mb-4">Admin Actions</h4>
                        <button
                          onClick={handleUnapproveOpportunity}
                          className="w-full font-bold py-3 px-4 rounded-lg transition-colors text-white text-lg bg-orange-600 hover:bg-orange-700"
                        >
                          Unapprove Opportunity
                        </button>
                      </div>
                    )}
                    {/* Send Email to All Participants Button */}
                    {signedUpStudents.length > 0 && (
                      <div className="bg-white p-6 rounded-2xl shadow-lg">
                        <h4 className="text-lg font-bold mb-4">Communication</h4>
                        <button
                          onClick={() => {
                            // Debug: Log the signedUpStudents to see what data we have
                            //console.log('Signed up students:', signedUpStudents);
                            //console.log('Opportunity involved_users:', opportunity.involved_users);
                            
                            // Get all participant emails - now directly available from backend
                            const participantEmails = signedUpStudents
                              .filter(student => {
                                const hasEmail = student.email && student.email.trim() !== '';
                                //console.log(`Student ${student.name}:`, { 
                              //     email: student.email,
                              //     hasEmail: !!hasEmail 
                              //   });
                                return hasEmail;
                              })
                              .map(student => student.email)
                              .join(', ');
                            
                            //console.log('Participant emails collected:', participantEmails);
                            
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
                        
                        {/* Participant Phone Numbers Button */}
                        <button
                          onClick={() => {
                            // Get all participant phone numbers
                            const participantPhones = signedUpStudents
                              .filter(student => {
                                const hasPhone = student.phone && student.phone.trim() !== '';
                                return hasPhone;
                              })
                              .map(student => student.phone)
                              .join('\n');
                            
                            if (participantPhones) {
                              // Copy to clipboard
                              navigator.clipboard.writeText(participantPhones).then(() => {
                                alert('Participant phone numbers copied to clipboard!');
                              }).catch(() => {
                                // Fallback: show in alert if clipboard fails
                                alert(`Participant phone numbers:\n\n${participantPhones}`);
                              });
                            } else {
                              alert('No participant phone numbers available.');
                            }
                          }}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-3"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          Participant Phone Numbers
                        </button>
                        <p className="text-sm text-gray-500 mt-2 text-center">
                          Copies participant phone numbers to clipboard
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <ul className="space-y-4 text-gray-700">
                        <li className="flex items-center gap-3"><CalendarIcon /> <span>{displayDate}</span></li>
                        <li className="flex items-center gap-3"><ClockIcon /> <span>{displayTime} - {displayEndTime}</span></li>
                        <li className="flex items-center gap-3"><UsersIcon /> <span>{availableSlots} of {opportunity.total_slots} slots remaining</span></li>
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
                          This event has reached its maximum capacity of {opportunity.total_slots} participants.
                        </p>
                      </div>
                    )}

                  </div>
                )}
                 <div className="bg-white p-6 rounded-2xl shadow-lg">
                    <h4 className="text-lg font-bold mb-2">Location</h4>
                    <div className="mb-4">
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(opportunity.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cornell-red hover:text-red-800 underline"
                      >
                        {opportunity.address}
                      </a>
                    </div>
                    
                 </div>
                 
                 {/* Causes and Tags Section */}
                 {(opportunity.causes && opportunity.causes.length > 0) || (opportunity.tags && opportunity.tags.length > 0) ? (
                   <div className="bg-white p-6 rounded-2xl shadow-lg">
                     <h4 className="text-lg font-bold mb-4">Categories & Tags</h4>
                     <div className="space-y-3">
                       {opportunity.causes && Array.isArray(opportunity.causes) && opportunity.causes.length > 0 && (
                         <div>
                           <h5 className="text-sm font-medium text-gray-700 mb-2">Causes</h5>
                           <div className="flex flex-wrap gap-2">
                             {opportunity.causes.map((cause, index) => (
                               <span key={index} className="bg-cornell-red/10 text-cornell-red px-3 py-1 rounded-full text-sm font-medium">
                                 {cause}
                               </span>
                             ))}
                           </div>
                         </div>
                       )}
                       {opportunity.tags && Array.isArray(opportunity.tags) && opportunity.tags.length > 0 && (
                         <div>
                           <h5 className="text-sm font-medium text-gray-700 mb-2">Tags</h5>
                           <div className="flex flex-wrap gap-2">
                             {opportunity.tags.map((tag, index) => (
                               <span key={index} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                                 {tag}
                               </span>
                             ))}
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 ) : null}
                 
                 {/* Contact Host Section - Available to all users */}
                 {opportunity.host_id && (
                   <div className="bg-white p-6 rounded-2xl shadow-lg">
                     <h4 className="text-lg font-bold mb-4">Contact Host</h4>
                     {(() => {
                       const hostUser = students.find(student => student.id === opportunity.host_id);
                       if (hostUser) {
                        //console.log(hostUser);
                         return (
                           <div className="space-y-3">
                             <div 
                               className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                               onClick={() => navigate(`/profile/${hostUser.id}`)}
                             >
                               <div className="w-10 h-10 bg-cornell-red rounded-full flex items-center justify-center flex-shrink-0">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                 </svg>
                               </div>
                               <div className="flex-1">
                                 <p className="font-semibold text-gray-800 hover:text-cornell-red transition-colors">{hostUser.name}</p>
                                 <p className="text-sm text-gray-600">Event Host</p>
                               </div>
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                               </svg>
                             </div>
                             
                             {/* Host Organization Information */}
                             {opportunity.host_org_name && (
                               <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cornell-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                 </svg>
                                 <div className="flex-1">
                                   <p className="text-sm text-gray-600">Host Organization</p>
                                   <p className="font-semibold text-gray-800">{opportunity.host_org_name}</p>
                                 </div>
                               </div>
                             )}
                             
                             {hostUser.email && (
                               <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cornell-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                 </svg>
                                 <div className="flex-1">
                                   <p className="text-sm text-gray-600">Email</p>
                                   <a 
                                     href={`mailto:${hostUser.email}`}
                                     className="text-cornell-red hover:text-red-800 font-medium break-all"
                                   >
                                     {hostUser.email}
                                   </a>
                                 </div>
                               </div>
                             )}
                             
                             {hostUser.phone && isUserSignedUp &&(
                               <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cornell-red" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                 </svg>
                                 <div className="flex-1">
                                   <p className="text-sm text-gray-600">Phone</p>
                                   <a 
                                     href={`tel:${hostUser.phone}`}
                                     className="text-cornell-red hover:text-red-800 font-medium"
                                   >
                                     {hostUser.phone}
                                   </a>
                                 </div>
                               </div>
                             )}
                             
                             {!hostUser.email && !hostUser.phone && (
                               <div className="text-center p-4 bg-gray-50 rounded-lg">
                                 <p className="text-sm text-gray-500">
                                   No contact information available for the host.
                                 </p>
                               </div>
                             )}
                           </div>
                         );
                       }
                       return (
                         <div className="text-center p-4 bg-gray-50 rounded-lg">
                           <p className="text-sm text-gray-500">
                             Host information not available.
                           </p>
                         </div>
                       );
                     })()}
                   </div>
                 )}
            </div>
        </div>
  );
};


// Icons
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cornell-red" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ClockIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cornell-red" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const UsersIcon = () => (
  <img 
    src="/icons/groups-icon.png" 
    alt="Groups" 
    className="h-6 w-6"
  />
);
const StarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cornell-red" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18v-5.5M12 8V6m0 14h.01M7 12h.01M17 12h.01M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M5.64 5.64L4.22 4.22m14.14 0l-1.42 1.42" /></svg>;

export default OpportunityDetailPage;