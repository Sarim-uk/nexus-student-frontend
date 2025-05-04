import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useTutorRecommendations from '../../hooks/useTutorRecommendations';
import TutorRecommendationCard from './TutorRecommendationCard';
import { useRecommendationsContext } from '../../context/RecommendationsContext';
import TutorProfileModal from '../modals/TutorProfileModal';

/**
 * Component that displays tutor recommendations on the dashboard
 */
const TutorRecommendationsSection = () => {
  const navigate = useNavigate();
  const { recommendations, loading, error, refetch } = useTutorRecommendations();
  const { updateRecommendations } = useRecommendationsContext();
  const [displayedRecommendations, setDisplayedRecommendations] = useState([]);
  const [selectedTutorId, setSelectedTutorId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    setIsModalOpen(true);
  };

  // Function to close the modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Show toast notification if there's an error
  useEffect(() => {
    if (error) {
      console.error('Failed to load recommendations:', error);
    }
  }, [error]);

  if (loading) {
    return (
      <div className="bg-white shadow-card rounded-xl p-6 mb-6 border border-gray-100">
        <div className="flex items-center mb-4">
          <h2 className="text-xl font-semibold text-primary">Recommended Tutors</h2>
          <div className="ml-4 px-2 py-1 text-xs bg-primary/10 text-primary rounded-full font-medium">Personalized</div>
        </div>
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/30 border-t-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white shadow-card rounded-xl p-6 mb-6 border border-gray-100 overflow-hidden">
        {/* Gold accent line at the top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-dark via-gold to-gold-light"></div>
        
        <div className="relative">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <h2 className="text-xl font-semibold text-gray-800">Recommended Tutors</h2>
              <div className="ml-3 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full font-medium flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Personalized
              </div>
            </div>
            <button
              onClick={refetch}
              className="text-sm text-primary hover:text-secondary transition-colors flex items-center"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-6 bg-error/10 border-l-4 border-error rounded-md p-4 text-error flex items-start">
              <div className="flex-shrink-0 mr-3">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <span>Failed to load recommendations. Please try again later.</span>
            </div>
          )}

          {!loading && !error && displayedRecommendations.length === 0 && (
            <div className="text-center py-10 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No recommendations available yet</h3>
              <p className="text-gray-500 mb-4 max-w-sm mx-auto">Complete your profile and subject preferences to get personalized tutor recommendations.</p>
              <button 
                onClick={refetch}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium inline-flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && displayedRecommendations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedRecommendations.map((tutor, index) => (
                <TutorRecommendationCard
                  key={tutor.tutor_id || `tutor-${index}`}
                  tutor={tutor}
                  onViewProfile={handleViewProfile}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tutor Profile Modal */}
      {selectedTutorId && (
        <TutorProfileModal
          tutorId={selectedTutorId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default TutorRecommendationsSection; 