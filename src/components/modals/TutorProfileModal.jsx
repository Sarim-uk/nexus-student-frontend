import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { profileService } from '../../services/api';

/**
 * A modal component that displays a tutor's profile information
 * 
 * @param {Object} props - Component props
 * @param {string|number} props.tutorId - ID of the tutor to display
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call when the modal is closed
 */
const TutorProfileModal = ({ tutorId, isOpen, onClose }) => {
  const [tutor, setTutor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch tutor data when modal opens or tutorId changes
  useEffect(() => {
    if (isOpen && tutorId) {
      const fetchTutorData = async () => {
        setLoading(true);
        setError(null);
        try {
          // Fetch tutor basic data
          const tutorResponse = await profileService.getTutorById(tutorId);
          const tutorData = tutorResponse.data;
          
          // Try to fetch additional tutor details if available
          try {
            const detailsResponse = await profileService.getTutorDetails(tutorId);
            if (detailsResponse.data) {
              setTutor({
                ...tutorData,
                ...detailsResponse.data
              });
            } else {
              setTutor(tutorData);
            }
          } catch (detailsError) {
            // If we can't get additional details, just use the basic data
            console.log('Could not fetch additional tutor details:', detailsError);
            setTutor(tutorData);
          }
        } catch (err) {
          console.error('Error fetching tutor data:', err);
          setError('Failed to load tutor profile. Please try again later.');
        } finally {
          setLoading(false);
        }
      };

      fetchTutorData();
    }
  }, [isOpen, tutorId]);

  // Don't render anything if not open
  if (!isOpen) return null;

  // Function to generate random subjects based on tutorId
  const getTutorSubjects = () => {
    // This is a placeholder. In a real app, you'd get this from the tutor data
    const allSubjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 
      'Literature', 'History', 'Geography', 'Computer Science', 'Economics',
      'Psychology', 'Philosophy', 'Art', 'Music', 'Foreign Languages'];
    
    const numSubjects = 2 + (parseInt(tutorId) % 3); // 2-4 subjects
    const selectedSubjects = [];
    
    for (let i = 0; i < numSubjects; i++) {
      const index = (parseInt(tutorId) + i) % allSubjects.length;
      selectedSubjects.push(allSubjects[index]);
    }
    
    return selectedSubjects;
  };

  // Function to calculate tutor experience years based on tutorId
  const getTutorExperience = () => {
    return 1 + (parseInt(tutorId) % 20); // 1-20 years
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Modal Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-[1000] backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 flex items-center justify-center z-[1010] px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-xl overflow-hidden shadow-card border border-gray-100 max-h-[90vh] overflow-y-auto w-full max-w-2xl mx-auto relative">
              {/* Modal Header */}
              <div className="relative h-24 bg-gradient-to-r from-primary to-secondary flex items-end">
                <button 
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors z-10"
                  aria-label="Close modal"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="absolute -bottom-10 left-8">
                  <div className="w-20 h-20 rounded-full bg-white p-1 shadow-lg">
                    {tutor?.profile_picture_url ? (
                      <img 
                        src={tutor.profile_picture_url} 
                        alt={tutor?.first_name} 
                        className="w-full h-full rounded-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-2xl font-semibold text-gray-500">
                          {tutor?.first_name?.[0]}{tutor?.last_name?.[0]}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Loading State */}
              {loading && (
                <div className="p-6 pt-16 flex justify-center items-center min-h-[300px]">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                </div>
              )}
              
              {/* Error State */}
              {error && !loading && (
                <div className="p-6 pt-16 min-h-[300px]">
                  <div className="bg-error/10 border-l-4 border-error rounded-md p-4 text-error">
                    <p>{error}</p>
                    <button 
                      onClick={onClose}
                      className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
              
              {/* Tutor Profile Content */}
              {!loading && !error && tutor && (
                <div className="p-6 pt-16">
                  {/* Tutor Name and Verification */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-800">
                        {tutor.first_name} {tutor.last_name}
                      </h2>
                      <p className="text-gray-500 mt-1">{tutor.email}</p>
                    </div>
                    <div className="flex items-center bg-success/10 text-success px-3 py-1 rounded-full text-xs font-medium">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified Tutor
                    </div>
                  </div>
                  
                  {/* Tutor Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-gray-500 text-sm mb-1">Experience</p>
                      <p className="text-xl font-semibold text-primary">{getTutorExperience()} years</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-gray-500 text-sm mb-1">Subjects</p>
                      <p className="text-xl font-semibold text-primary">{getTutorSubjects().length}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-gray-500 text-sm mb-1">Rating</p>
                      <div className="flex justify-center">
                        <span className="text-xl font-semibold text-primary mr-1">
                          {4 + (parseInt(tutorId) % 10) / 10}
                        </span>
                        <svg className="w-6 h-6 text-gold" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expertise */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">Areas of Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {getTutorSubjects().map((subject, index) => (
                        <span 
                          key={index} 
                          className="px-3 py-1.5 bg-primary/5 text-primary rounded-full text-sm font-medium"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Bio */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">About</h3>
                    <p className="text-gray-600 leading-relaxed">
                      {tutor.bio || `${tutor.first_name} is a dedicated tutor with ${getTutorExperience()} years of experience in ${getTutorSubjects().join(', ')}. ${tutor.first_name} is passionate about helping students achieve their academic goals and develop a deep understanding of their subjects.`}
                    </p>
                  </div>
                  
                  {/* Teaching Style or Meeting Details */}
                  {tutor.meeting_link && (
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold mb-3 text-gray-800">Session Details</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-600 mb-3">
                          Connect with {tutor.first_name} through their personal meeting room:
                        </p>
                        <a 
                          href={tutor.meeting_link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors text-sm font-medium"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Join Meeting Room
                        </a>
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3 mt-8">
                    <button
                      className="flex-1 py-3 px-4 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors font-medium shadow-sm hover:shadow"
                    >
                      Request Session
                    </button>
                    <button
                      className="flex-1 py-3 px-4 bg-white text-primary border border-primary rounded-lg hover:bg-primary/5 transition-colors font-medium"
                      onClick={onClose}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

TutorProfileModal.propTypes = {
  tutorId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default TutorProfileModal; 