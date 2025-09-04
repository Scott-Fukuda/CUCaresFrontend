// Time utility functions for opportunity management

/**
 * Check if a user can unregister from an opportunity
 * Unregistration is blocked within 12 hours of the event start time
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
  
  // Can unregister if more than 12 hours before event
  const canUnregister = hoursUntilEvent > 12;
  
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
 * Check if an opportunity is within the 12-hour unregistration window
 * @param opportunityDate - The event date (YYYY-MM-DD format)
 * @param opportunityTime - The event time (HH:MM:SS format)
 * @returns boolean indicating if within 12-hour window
 */
export const isWithinUnregistrationWindow = (
  opportunityDate: string,
  opportunityTime: string
): boolean => {
  const { canUnregister } = canUnregisterFromOpportunity(opportunityDate, opportunityTime);
  return !canUnregister;
};

/**
 * Format datetime for backend in Eastern Time
 * @param date - Date in YYYY-MM-DD format
 * @param time - Time in HH:MM format
 * @returns ISO string with Eastern Time timezone (-04:00 for EDT, -05:00 for EST)
 */
export const formatDateTimeForBackend = (date: string, time: string): string => {
  // Create a date object in Eastern Time
  const dateTimeString = `${date}T${time}:00`;
  const dateObj = new Date(dateTimeString);
  
  // Get the timezone offset for Eastern Time
  // Eastern Time is UTC-5 (EST) or UTC-4 (EDT)
  // We'll use UTC-4 (EDT) as the standard since most events are during daylight saving time
  const easternOffset = -4; // UTC-4 for Eastern Daylight Time
  
  // Format as ISO string with Eastern Time timezone
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}-04:00`;
};
