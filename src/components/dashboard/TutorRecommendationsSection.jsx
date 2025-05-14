import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useTutorRecommendations from '../../hooks/useTutorRecommendations';
import TutorRecommendationCard from './TutorRecommendationCard';
import { useRecommendationsContext } from '../../context/RecommendationsContext';
import TutorProfileModal from '../modals/TutorProfileModal';
import SessionBookingModal from '../modals/SessionBookingModal';
import { motion } from 'framer-motion';

/**
 * Component that displays tutor recommendations on the dashboard
 */
const TutorRecommendationsSection = () => {
  const navigate = useNavigate();
  const { recommendations, loading, error, refetch } = useTutorRecommendations({
    fetchOnMount: true,
    topN: 8
  });
  const { updateRecommendations } = useRecommendationsContext();
  const [displayedRecommendations, setDisplayedRecommendations] = useState([]);
  const [selectedTutorId, setSelectedTutorId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [weakSubjects, setWeakSubjects] = useState([]);

  // Process recommendations when they change
  useEffect(() => {
    if (recommendations && Array.isArray(recommendations)) {
      console.log('Setting displayed recommendations:', recommendations);
      setDisplayedRecommendations(recommendations);
    } else {
      console.log('Invalid recommendations format:', recommendations);
      setDisplayedRecommendations([]);
    }
  }, [recommendations]);

  // Add debug logging
  useEffect(() => {
    console.log('TutorRecommendationsSection - Current state:', { 
      recommendations,
      recommendationsLength: recommendations ? recommendations.length : 'undefined', 
      displayedLength: displayedRecommendations.length,
      loading, 
      error
    });
  }, [recommendations, displayedRecommendations, loading, error]);

  // Function to handle viewing a tutor's profile
  const handleViewProfile = (tutorId) => {
    setSelectedTutorId(tutorId);
    setIsProfileModalOpen(true);
  };

  // Function to handle requesting a session with a tutor
  const handleRequestSession = (tutorId) => {
    setSelectedTutorId(tutorId);
    setIsBookingModalOpen(true);
  };

  // Function to close the profile modal
  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
  };

  // Function to close the booking modal
  const handleCloseBookingModal = () => {
    setIsBookingModalOpen(false);
  };

  // Function to handle successful booking
  const handleBookingSuccess = (bookingDetails) => {
    console.log('Booking successful:', bookingDetails);
    // You could redirect to lessons page or show a success message
  };

  // Show toast notification if there's an error
  useEffect(() => {
    if (error) {
      console.error('Failed to load recommendations:', error);
    }
  }, [error]);

  const handleRefresh = () => {
    refetch();
  };

  // Animation variants
  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  if (loading) {
    return (
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="relative"
      >
        <div className="bg-white shadow-card rounded-xl p-6 mb-6 border border-gray-100 overflow-hidden">
          {/* Gold accent line at the top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-dark via-gold to-gold-light"></div>
          
          <div className="relative">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <h2 className="text-2xl font-semibold text-gray-800">Recommended Tutors</h2>
                <div className="ml-3 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-medium flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                  </svg>
                  AI Match
                </div>
              </div>
              
              <button 
                onClick={handleRefresh} 
                className="text-sm font-medium text-primary hover:text-primary-dark flex items-center transition-colors"
                disabled={loading}
              >
                <svg className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            {/* Weak subjects section */}
            {weakSubjects && weakSubjects.length > 0 && (
              <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex">
                  <div className="text-amber-500 mr-3 flex-shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-800 mb-1">Areas to Improve</h3>
                    <p className="text-sm text-gray-600">
                      Based on your performance, we've identified these subjects that need attention: 
                      <span className="font-medium text-amber-700 ml-1">
                        {weakSubjects.join(', ')}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="p-4 mb-6 bg-red-50 rounded-lg text-red-800 text-sm">
                <div className="flex">
                  <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p>Unable to load tutor recommendations. Please try again later.</p>
                </div>
              </div>
            )}
            
            {loading && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}
            
            {!loading && !error && displayedRecommendations.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {displayedRecommendations.map((tutor, index) => (
                  <TutorRecommendationCard
                    key={tutor.tutor_id || `tutor-${index}`}
                    tutor={tutor}
                    onViewProfile={handleViewProfile}
                    onRequestSession={handleRequestSession}
                  />
                ))}
              </div>
            )}
            
            {!loading && !error && displayedRecommendations.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No Recommendations Available</h3>
                <p className="text-gray-500 mb-4 max-w-md mx-auto">We couldn't find any tutor recommendations for you at this time.</p>
                <button 
                  onClick={handleRefresh} 
                  className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.section>
    );
  }

  return (
    <>
      <motion.section 
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="relative"
      >
        <div className="bg-white shadow-card rounded-xl p-6 mb-6 border border-gray-100 overflow-hidden">
          {/* Gold accent line at the top */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-dark via-gold to-gold-light"></div>
          
          <div className="relative">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <h2 className="text-2xl font-semibold text-gray-800">Recommended Tutors</h2>
                <div className="ml-3 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-medium flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                  </svg>
                  AI Match
                </div>
              </div>
              
              <button 
                onClick={handleRefresh} 
                className="text-sm font-medium text-primary hover:text-primary-dark flex items-center transition-colors"
                disabled={loading}
              >
                <svg className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            {/* Weak subjects section */}
            {weakSubjects && weakSubjects.length > 0 && (
              <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
                <div className="flex">
                  <div className="text-amber-500 mr-3 flex-shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-800 mb-1">Areas to Improve</h3>
                    <p className="text-sm text-gray-600">
                      Based on your performance, we've identified these subjects that need attention: 
                      <span className="font-medium text-amber-700 ml-1">
                        {weakSubjects.join(', ')}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="p-4 mb-6 bg-red-50 rounded-lg text-red-800 text-sm">
                <div className="flex">
                  <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p>Unable to load tutor recommendations. Please try again later.</p>
                </div>
              </div>
            )}
            
            {loading && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
              </div>
            )}
            
            {!loading && !error && displayedRecommendations.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {displayedRecommendations.map((tutor, index) => (
                  <TutorRecommendationCard
                    key={tutor.tutor_id || `tutor-${index}`}
                    tutor={tutor}
                    onViewProfile={handleViewProfile}
                    onRequestSession={handleRequestSession}
                  />
                ))}
              </div>
            )}
            
            {!loading && !error && displayedRecommendations.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-800 mb-2">No Recommendations Available</h3>
                <p className="text-gray-500 mb-4 max-w-md mx-auto">We couldn't find any tutor recommendations for you at this time.</p>
                <button 
                  onClick={handleRefresh} 
                  className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* Tutor Profile Modal */}
      {selectedTutorId && (
        <TutorProfileModal
          tutorId={selectedTutorId}
          isOpen={isProfileModalOpen}
          onClose={handleCloseProfileModal}
        />
      )}

      {/* Session Booking Modal */}
      <SessionBookingModal
        tutorId={selectedTutorId}
        isOpen={isBookingModalOpen}
        onClose={handleCloseBookingModal}
        onSuccess={handleBookingSuccess}
      />
    </>
  );
};

export default TutorRecommendationsSection; 