import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useTutorRecommendations from '../../hooks/useTutorRecommendations';
import TutorRecommendationCard from './TutorRecommendationCard';
import { useRecommendationsContext } from '../../context/RecommendationsContext';

/**
 * Component that displays tutor recommendations on the dashboard
 */
const TutorRecommendationsSection = () => {
  const navigate = useNavigate();
  const { recommendations, loading, error, refetch } = useTutorRecommendations();
  const { updateRecommendations } = useRecommendationsContext();
  const [displayedRecommendations, setDisplayedRecommendations] = useState([]);

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
    navigate(`/tutors/${tutorId}`);
  };

  // Show toast notification if there's an error
  useEffect(() => {
    if (error) {
      console.error('Failed to load recommendations:', error);
    }
  }, [error]);

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Recommended Tutors</h2>
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Recommended Tutors</h2>
        <button
          onClick={refetch}
          className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="text-red-500 mb-4 p-3 bg-red-50 rounded-md">
          Failed to load recommendations. Please try again later.
        </div>
      )}

      {!loading && !error && displayedRecommendations.length === 0 && (
        <div className="text-gray-500 py-6 text-center">
          <p>No tutor recommendations available yet.</p>
          <p className="text-sm mt-2">Complete your profile to get personalized recommendations!</p>
          <button 
            onClick={refetch}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && displayedRecommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
  );
};

export default TutorRecommendationsSection; 