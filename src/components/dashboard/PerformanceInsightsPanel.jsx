import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { dashboardService } from '../../services/api';

const PerformanceInsightsPanel = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      setLoading(true);
      
      // Set a timeout to ensure loading state doesn't get stuck
      const loadingTimeout = setTimeout(() => {
        if (loading) {
          console.log("Performance insights loading timed out");
          setLoading(false);
          setError('Loading timed out. Please try refreshing the page.');
        }
      }, 8000);
      
      try {
        const response = await dashboardService.getDetailedPerformance();
        setPerformanceData(response.data);
        clearTimeout(loadingTimeout);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching performance insights:', err);
        setError('Failed to load performance insights');
        clearTimeout(loadingTimeout);
        setLoading(false);
        
        // Initialize with empty data rather than fallback mock data
        setPerformanceData({
          strengths_weaknesses: {
            strengths: [],
            weaknesses: []
          },
          recommendations: []
        });
      }
    };

    fetchPerformanceData();
    
    // Cleanup function to clear timeout
    return () => {
      setLoading(false);
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white shadow-card rounded-xl border border-gray-100 overflow-hidden p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Performance Insights</h2>
        <div className="py-8 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !performanceData) {
    return (
      <div className="bg-white shadow-card rounded-xl border border-gray-100 overflow-hidden p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Performance Insights</h2>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-gray-500">Unable to load performance insights at this time.</p>
        </div>
      </div>
    );
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100
      }
    }
  };

  return (
    <div className="bg-white shadow-card rounded-xl border border-gray-100 overflow-hidden p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Performance Insights</h2>
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Strengths Section */}
        {performanceData.strengths_weaknesses?.strengths?.length > 0 && (
          <motion.div variants={itemVariants} className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-success" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Your Strengths
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {performanceData.strengths_weaknesses.strengths.map((strength, index) => (
                <div key={index} className="bg-success/10 p-3 rounded-lg flex items-center">
                  <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center mr-3">
                    <span className="text-success font-bold">{strength.score}%</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{strength.subject}</h4>
                    <p className="text-sm text-gray-600">Keep up the great work!</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Weaknesses Section */}
        {performanceData.strengths_weaknesses?.weaknesses?.length > 0 && (
          <motion.div variants={itemVariants} className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-amber-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Areas to Improve
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {performanceData.strengths_weaknesses.weaknesses.map((weakness, index) => (
                <div key={index} className="bg-amber-50 p-3 rounded-lg flex items-center">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mr-3">
                    <span className="text-amber-600 font-bold">{weakness.score}%</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{weakness.subject}</h4>
                    <p className="text-sm text-gray-600">Focus on improving</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Recommendations Section */}
        {performanceData.recommendations?.length > 0 && (
          <motion.div variants={itemVariants}>
            <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
              </svg>
              Personalized Recommendations
            </h3>
            <ul className="space-y-3">
              {performanceData.recommendations.map((recommendation, index) => (
                <motion.li 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-3 rounded-lg flex items-start ${getRecommendationStyle(recommendation.type)}`}
                >
                  {getRecommendationIcon(recommendation.type)}
                  <p className="text-gray-700">{recommendation.message}</p>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
        
        {/* Empty State */}
        {!performanceData.strengths_weaknesses?.strengths?.length && 
         !performanceData.strengths_weaknesses?.weaknesses?.length && 
         !performanceData.recommendations?.length && (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Insights Available</h3>
            <p className="text-gray-500 mb-4 max-w-md mx-auto">
              Complete more assignments to generate personalized insights about your academic performance.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Helper function to get recommendation styling
const getRecommendationStyle = (type) => {
  switch (type) {
    case 'improvement':
      return 'bg-blue-50 border border-blue-100';
    case 'tutor':
      return 'bg-purple-50 border border-purple-100';
    case 'attendance':
      return 'bg-amber-50 border border-amber-100';
    default:
      return 'bg-gray-50 border border-gray-100';
  }
};

// Helper function to get recommendation icon
const getRecommendationIcon = (type) => {
  switch (type) {
    case 'improvement':
      return (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center mr-3 text-blue-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </div>
      );
    case 'tutor':
      return (
        <div className="w-8 h-8 rounded-full bg-purple-100 flex-shrink-0 flex items-center justify-center mr-3 text-purple-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
          </svg>
        </div>
      );
    case 'attendance':
      return (
        <div className="w-8 h-8 rounded-full bg-amber-100 flex-shrink-0 flex items-center justify-center mr-3 text-amber-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
        </div>
      );
    default:
      return (
        <div className="w-8 h-8 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center mr-3 text-gray-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
      );
  }
};

export default PerformanceInsightsPanel; 