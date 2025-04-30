import React, { createContext, useState, useContext } from 'react';

// Create the context
const RecommendationsContext = createContext();

// Create a provider component
export const RecommendationsProvider = ({ children }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [lastFetched, setLastFetched] = useState(null);

  // Function to update recommendations
  const updateRecommendations = (newRecommendations) => {
    setRecommendations(newRecommendations);
    setLastFetched(new Date());
  };

  // Function to clear recommendations
  const clearRecommendations = () => {
    setRecommendations([]);
    setLastFetched(null);
  };

  // Value object that will be provided to consumers
  const value = {
    recommendations,
    lastFetched,
    updateRecommendations,
    clearRecommendations
  };

  return (
    <RecommendationsContext.Provider value={value}>
      {children}
    </RecommendationsContext.Provider>
  );
};

// Custom hook for using the recommendations context
export const useRecommendationsContext = () => {
  const context = useContext(RecommendationsContext);
  if (context === undefined) {
    throw new Error('useRecommendationsContext must be used within a RecommendationsProvider');
  }
  return context;
};

export default RecommendationsContext; 