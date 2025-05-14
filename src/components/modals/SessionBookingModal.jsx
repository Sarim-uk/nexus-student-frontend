import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';
import { lessonsService } from '../../services/api';

const weekDays = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
];

/**
 * Slide-in panel for booking a session with a tutor, showing their availability slots
 */
const SessionBookingModal = ({ tutorId, isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [tutor, setTutor] = useState(null);

  // Fetch tutor availability when the panel opens
  useEffect(() => {
    if (isOpen && tutorId) {
      fetchAvailabilitySlots();
    }
  }, [isOpen, tutorId]);

  // Reset state when panel closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedSlot(null);
      setBookingSuccess(false);
      setBookingError(null);
    }
  }, [isOpen]);

  // Fetch availability slots from the backend
  const fetchAvailabilitySlots = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await lessonsService.getTutorAvailability(tutorId);
      setAvailabilitySlots(response || []);
      
      // Also get tutor details
      const tutorResponse = await lessonsService.getTutorDetails(tutorId);
      setTutor(tutorResponse || {});
    } catch (err) {
      console.error('Error fetching tutor availability:', err);
      setError('Unable to load availability slots. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle booking a slot
  const handleBookSlot = async () => {
    if (!selectedSlot) return;
    
    setBookingLoading(true);
    setBookingError(null);

    try {
      const bookingData = {
        availability: selectedSlot.id,
        // Student ID will be automatically set on the backend based on the authenticated user
      };
      
      const response = await lessonsService.bookSession(bookingData);
      setBookingSuccess(true);
      
      // Call the success callback with booking details
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err) {
      console.error('Error booking session:', err);
      setBookingError(err.response?.data?.detail || 'Failed to book session. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Format time for better display (24h -> 12h format)
  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  // Group slots by day for better organization
  const slotsByDay = weekDays.map(day => ({
    day,
    slots: availabilitySlots.filter(slot => slot.day === day && !slot.is_booked)
  })).filter(group => group.slots.length > 0);

  // Check if we have any available slots
  const hasAvailableSlots = slotsByDay.some(group => group.slots.length > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
            onClick={onClose}
          />
          
          {/* Slide-in panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full md:w-96 bg-white shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10">
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 mr-2"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold text-gray-800 flex-1">
                Book a Session
                {tutor && <span className="block text-sm text-primary">with {tutor.first_name} {tutor.last_name}</span>}
              </h2>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : error ? (
                <div className="p-4 mb-6 bg-red-50 rounded-lg text-red-800 text-sm">
                  <div className="flex">
                    <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p>{error}</p>
                  </div>
                </div>
              ) : bookingSuccess ? (
                <div className="text-center py-8 bg-white rounded-lg p-6 shadow-sm">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-900">Session Booked!</h3>
                  <p className="mt-3 text-gray-500">
                    You've successfully booked a session with {tutor?.first_name} {tutor?.last_name}.
                    You can view your upcoming sessions in the Lessons page.
                  </p>
                  <div className="mt-6">
                    <button
                      type="button"
                      className="w-full px-4 py-3 text-white bg-primary rounded-md hover:bg-primary-dark focus:outline-none transition-colors"
                      onClick={onClose}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
                    <p className="text-gray-600">
                      Select an available time slot to book a session with {tutor?.first_name} {tutor?.last_name}.
                      Each session lasts for 1 hour.
                    </p>
                  </div>
                  
                  {bookingError && (
                    <div className="p-4 mb-4 bg-red-50 rounded-lg text-red-800 text-sm">
                      <div className="flex">
                        <svg className="w-5 h-5 mr-2 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <p>{bookingError}</p>
                      </div>
                    </div>
                  )}
                  
                  {!hasAvailableSlots ? (
                    <div className="p-6 bg-white rounded-lg shadow-sm text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No availability</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        This tutor doesn't have any available time slots at the moment.
                        Please check back later or try another tutor.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {slotsByDay.map(({ day, slots }) => (
                        <div key={day} className="bg-white rounded-lg overflow-hidden shadow-sm">
                          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                            <h3 className="font-medium text-gray-800">{day}</h3>
                          </div>
                          <div className="divide-y divide-gray-100">
                            {slots.map(slot => (
                              <div 
                                key={slot.id} 
                                className={`px-4 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors ${selectedSlot?.id === slot.id ? 'bg-primary/5 border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
                                onClick={() => setSelectedSlot(slot)}
                              >
                                <div className="flex items-center">
                                  <div className={`w-5 h-5 rounded-full mr-3 flex items-center justify-center ${selectedSlot?.id === slot.id ? 'bg-primary' : 'border border-gray-300'}`}>
                                    {selectedSlot?.id === slot.id && (
                                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fillRule="evenodd" clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"></path>
                                      </svg>
                                    )}
                                  </div>
                                  <span className="text-gray-800 font-medium">
                                    {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-500">
                                  {slot.time_zone}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Footer */}
            {!bookingSuccess && !loading && hasAvailableSlots && (
              <div className="px-5 py-4 border-t border-gray-200 bg-white shadow-lg sticky bottom-0">
                <button
                  onClick={handleBookSlot}
                  disabled={!selectedSlot || bookingLoading}
                  className={`w-full py-3 text-white rounded-md focus:outline-none flex items-center justify-center transition-colors ${!selectedSlot ? 'bg-gray-400 cursor-not-allowed' : 'bg-primary hover:bg-primary-dark'}`}
                >
                  {bookingLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Book Session'
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

SessionBookingModal.propTypes = {
  tutorId: PropTypes.string.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func
};

export default SessionBookingModal; 