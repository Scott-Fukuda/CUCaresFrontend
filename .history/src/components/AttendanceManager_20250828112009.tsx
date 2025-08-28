import React, { useState, useEffect } from 'react';
import { User, Opportunity } from '../types';
import * as api from '../api';

interface AttendanceManagerProps {
  opportunity: Opportunity;
  participants: User[];
  onAttendanceSubmitted: () => void;
}

const AttendanceManager: React.FC<AttendanceManagerProps> = ({ opportunity, participants, onAttendanceSubmitted }) => {
  const [attendedUsers, setAttendedUsers] = useState<Set<number>>(new Set());
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if current time is past the opportunity start time (Eastern Time)
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      
      // Parse the date and time components
      const [year, month, day] = opportunity.date.split('-').map(Number);
      const [hours, minutes] = opportunity.time.split(':').map(Number);
      
      // Create the opportunity date/time string
      const opportunityDateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      
      // Create date objects for comparison
      const opportunityDateTime = new Date(opportunityDateString);
      
      // Get current time in Eastern Time
      const nowEastern = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
      
      // Get opportunity time in Eastern Time
      const opportunityEastern = new Date(opportunityDateTime.toLocaleString("en-US", {timeZone: "America/New_York"}));
      
      console.log('Current time (Eastern):', nowEastern);
      console.log('Event start time (Eastern):', opportunityEastern);
      console.log('Raw opportunity date string:', opportunityDateString);
      console.log('Attendance enabled:', nowEastern >= opportunityEastern);
      
      setIsSubmitEnabled(nowEastern >= opportunityEastern);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [opportunity]);

  const handleAttendanceToggle = (userId: number) => {
    setAttendedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (!isSubmitEnabled || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await api.markAttendance({
        user_ids: Array.from(attendedUsers),
        opportunity_id: opportunity.id
      });
      
      onAttendanceSubmitted();
    } catch (error: any) {
      alert(`Error submitting attendance: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create opportunity date/time and display in Eastern Time
  const [year, month, day] = opportunity.date.split('-').map(Number);
  const [hours, minutes] = opportunity.time.split(':').map(Number);
  const opportunityDateTime = new Date(year, month - 1, day, hours, minutes);
  
  const displayTime = opportunityDateTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true,
    timeZone: 'America/New_York'
  });
  
  const displayDate = opportunityDateTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York'
  });

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h3 className="text-2xl font-bold mb-4">Attendance Management</h3>
      
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Event Start Date:</strong> {displayDate}
        </p>
        <p className="text-sm text-blue-800">
          <strong>Event Start Time (Eastern):</strong> {displayTime}
        </p>
        <p className="text-sm text-blue-800 mt-1">
          {isSubmitEnabled 
            ? "✅ Attendance submission is now enabled" 
            : "⏳ Attendance submission will be enabled at the event start time"
          }
        </p>
      </div>

      <div className="mb-6">
        <h4 className="text-lg font-semibold mb-3">Participants ({participants.length})</h4>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {participants.map(participant => (
            <div 
              key={participant.id} 
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <img 
                  src={api.getProfilePictureUrl(participant.profilePictureUrl)} 
                  alt={`${participant.firstName} ${participant.lastName}`}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-gray-900">
                    {participant.firstName} {participant.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{participant.email}</p>
                </div>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={attendedUsers.has(participant.id)}
                  onChange={() => handleAttendanceToggle(participant.id)}
                  className="w-4 h-4 text-cornell-red border-gray-300 rounded focus:ring-cornell-red"
                />
                <span className="text-sm font-medium text-gray-700">Attended</span>
              </label>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isSubmitEnabled || isSubmitting}
        className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-colors ${
          isSubmitEnabled && !isSubmitting
            ? 'bg-cornell-red hover:bg-red-800'
            : 'bg-gray-400 cursor-not-allowed'
        }`}
      >
        {isSubmitting 
          ? 'Submitting...' 
          : isSubmitEnabled 
            ? `Submit Attendance (${attendedUsers.size} marked)` 
            : 'Submit Attendance (disabled until event start)'
        }
      </button>
    </div>
  );
};

export default AttendanceManager;
