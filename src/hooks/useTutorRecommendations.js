import { useState, useEffect } from 'react';
import { profileService } from '../services/api';
import { useRecommendationsContext } from '../context/RecommendationsContext';
import authService from '../services/auth';

/**
 * Custom hook to fetch tutor recommendations
 * @param {Object} options - Hook options
 * @param {boolean} options.fetchOnMount - Whether to fetch recommendations when component mounts
 * @param {number} options.topN - Number of recommendations to fetch (default: 5)
 * @param {number} options.cacheTime - How long to cache results in ms (default: 30 minutes)
 * @param {Object} options.profileState - Student profile state object to track for changes
 * @returns {Object} - { recommendations, loading, error, refetch }
 */
const useTutorRecommendations = ({ 
  fetchOnMount = true, 
  topN = 5,
  cacheTime = 30 * 60 * 1000, // 30 minutes
  profileState = null
} = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { 
    recommendations, 
    lastFetched, 
    updateRecommendations 
  } = useRecommendationsContext();
  
  // Function to fetch recommendations
  const fetchRecommendations = async (force = false) => {
    // Check if we have cached data and it's still fresh
    if (
      !force && 
      recommendations.length > 0 && 
      lastFetched && 
      (new Date() - new Date(lastFetched) < cacheTime)
    ) {
      return;
    }

    // No cached data or data is stale, fetch new data
    setLoading(true);
    setError(null);
    
    try {
      const response = await profileService.getTutorRecommendations(topN);
      console.log('API response:', response);
      
      // Extract recommendations from the response
      let recommendationsData = [];
      
      // Handle different response structures
      if (response.data && Array.isArray(response.data)) {
        // If response.data is already an array (old format)
        recommendationsData = response.data;
      } else if (response.data && response.data.recommendations && Array.isArray(response.data.recommendations)) {
        // If response.data.recommendations is an array (new format)
        recommendationsData = response.data.recommendations;
      } else if (response.data) {
        // Unexpected format, try to extract data
        console.warn('Unexpected API response format:', response.data);
        // Try to find any array in the response
        for (const key in response.data) {
          if (Array.isArray(response.data[key])) {
            recommendationsData = response.data[key];
            break;
          }
        }
      }
      
      console.log('Extracted recommendations:', recommendationsData);
      updateRecommendations(recommendationsData);
    } catch (err) {
      console.error("Failed to fetch tutor recommendations:", err);
      setError(err.response?.data?.detail || err.message || "Failed to fetch recommendations");
    } finally {
      setLoading(false);
    }
  };

  // Fetch recommendations on mount if needed
  useEffect(() => {
    // Only fetch if user is logged in and is a student
    if (fetchOnMount && authService.isAuthenticated() && authService.isStudent()) {
      fetchRecommendations();
    }
  }, [fetchOnMount]);

  // Refetch when profileState changes
  useEffect(() => {
    if (profileState && authService.isAuthenticated() && authService.isStudent()) {
      fetchRecommendations(true);
    }
  }, [profileState]);

  // Listen for login events
  useEffect(() => {
    const handleLoginSuccess = () => {
      if (authService.isAuthenticated() && authService.isStudent()) {
        fetchRecommendations(true);
      }
    };

    // Add event listener
    window.addEventListener('loginSuccess', handleLoginSuccess);

    // Clean up event listener
    return () => {
      window.removeEventListener('loginSuccess', handleLoginSuccess);
    };
  }, []);

  // Refetch function for manual triggers
  const refetch = () => fetchRecommendations(true);

  return {
    recommendations,
    loading,
    error,
    refetch
  };
};

export default useTutorRecommendations; 