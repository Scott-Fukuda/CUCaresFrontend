// Time utility functions for opportunity management

/**
 * Check if a user can unregister from an opportunity
 * Users can unregister if more than 7 hours before the event
 * @param opportunityDate - The event date (YYYY-MM-DD format)
 * @param opportunityTime - The event time (HH:MM:SS format)
 * @returns Object with canUnregister boolean and timeUntilEvent
 */
export const canUnregisterFromOpportunity = (
  opportunityDate: string,
  opportunityTime: string
): { canUnregister: boolean; timeUntilEvent: number; hoursUntilEvent: number } => {
  // Create the event date/time string
  const eventDateTimeString = `${opportunityDate}T${opportunityTime}`;
  const eventDateTime = new Date(eventDateTimeString);
  
  // Get current time
  const now = new Date();
  
  // Calculate time difference in milliseconds
  const timeDifference = eventDateTime.getTime() - now.getTime();
  const hoursUntilEvent = timeDifference / (1000 * 60 * 60);
  
  // Users can unregister if more than 7 hours before the event
  const canUnregister = hoursUntilEvent > 7;
  
  return {
    canUnregister,
    timeUntilEvent: timeDifference,
    hoursUntilEvent
  };
};

/**
 * Format remaining time in a user-friendly way
 * @param hoursUntilEvent - Hours until the event
 * @returns Formatted string like "2 days, 5 hours" or "11 hours, 30 minutes"
 */
export const formatTimeUntilEvent = (hoursUntilEvent: number): string => {
  if (hoursUntilEvent <= 0) {
    return "Event has started";
  }
  
  if (hoursUntilEvent < 1) {
    const minutes = Math.floor(hoursUntilEvent * 60);
    return `${minutes} minutes`;
  }
  
  if (hoursUntilEvent < 24) {
    const hours = Math.floor(hoursUntilEvent);
    const minutes = Math.floor((hoursUntilEvent - hours) * 60);
    if (minutes > 0) {
      return `${hours} hours, ${minutes} minutes`;
    }
    return `${hours} hours`;
  }
  
  const days = Math.floor(hoursUntilEvent / 24);
  const remainingHours = Math.floor(hoursUntilEvent % 24);
  
  if (remainingHours > 0) {
    return `${days} days, ${remainingHours} hours`;
  }
  return `${days} days`;
};

/**
 * Check if an opportunity is within the unregistration window
 * Since users can now unregister at any time, this always returns false
 * @param opportunityDate - The event date (YYYY-MM-DD format)
 * @param opportunityTime - The event time (HH:MM:SS format)
 * @returns boolean indicating if within unregistration window (always false now)
 */
export const isWithinUnregistrationWindow = (
  opportunityDate: string,
  opportunityTime: string
): boolean => {
  // Users can now unregister at any time, so this window no longer exists
  return false;
};

/**
 * Format datetime for backend
 * @param date - Date in YYYY-MM-DD format
 * @param time - Time in HH:MM format
 * @returns ISO string in the exact format expected by backend (YYYY-MM-DDTHH:MM:SS)
 */
export const formatDateTimeForBackend = (date: string, time: string): string => {
  // Return the datetime exactly as entered, without timezone conversion
  // Backend expects format: YYYY-MM-DDTHH:MM:SS
  return `${date}T${time}`;
};

/**
 * Calculate the end time of an opportunity
 * @param date - Date in YYYY-MM-DD format
 * @param time - Time in HH:MM format
 * @param duration - Duration in minutes
 * @returns Formatted end time string (e.g., "2:30 PM")
 */
export const calculateEndTime = (date: string, time: string, duration: number): string => {
  // Parse the date and time
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  
  // Create a date object with the start time
  const startDateTime = new Date(year, month - 1, day, hours, minutes);
  
  // Add the duration in minutes
  const endDateTime = new Date(startDateTime.getTime() + (duration * 60 * 1000));
  
  // Format the end time
  return endDateTime.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
};
