import React from 'react';
import PropTypes from 'prop-types';

/**
 * Component to display a tutor recommendation card
 * 
 * @param {Object} props - Component props
 * @param {Object} props.tutor - Tutor data
 * @param {string} props.tutor.tutor_id - Tutor ID
 * @param {string} props.tutor.tutor_name - Tutor name
 * @param {string} props.tutor.tutor_email - Tutor email
 * @param {number} props.tutor.match_probability - Match probability (0-100)
 * @param {number} props.tutor.confidence - Confidence score (0-100)
 * @param {Function} props.onViewProfile - Function to call when View Profile button is clicked
 */
const TutorRecommendationCard = ({ tutor, onViewProfile }) => {
  // Ensure we have valid values with fallbacks
  const tutorId = tutor.tutor_id || tutor.id || 'unknown';
  const tutorName = tutor.tutor_name || `${tutor.first_name || ''} ${tutor.last_name || ''}`.trim() || 'Unknown Tutor';
  const tutorEmail = tutor.tutor_email || tutor.email || 'No email available';
  const matchProbability = typeof tutor.match_probability === 'number' ? tutor.match_probability : 75;
  const confidence = typeof tutor.confidence === 'number' ? tutor.confidence : 60;

  const getMatchColor = (match) => {
    if (match >= 80) return 'text-success bg-success/10 border-success/20';
    if (match >= 60) return 'text-accent bg-accent/10 border-accent/20';
    return 'text-gray-600 bg-gray-100 border-gray-200';
  };

  const getInitials = (name) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getExpertise = () => {
    // This is a placeholder. In a real app, you'd get this from the tutor data
    const subjects = ['Mathematics', 'Physics', 'Literature', 'History', 'Computer Science', 'Economics'];
    const index = Math.floor(tutorId.toString().charCodeAt(0) % subjects.length);
    return subjects[index];
  };

  return (
    <div className="bg-white rounded-lg shadow-card hover:shadow-card-hover transition-all duration-300 border border-gray-100 overflow-hidden group">
      <div className="relative p-4 pb-3">
        {/* Top gradient accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary"></div>
        
        {/* Match badge */}
        <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-xs font-semibold ${getMatchColor(matchProbability)} border`}>
          {Math.round(matchProbability)}% Match
        </div>
        
        {/* Tutor avatar and name */}
        <div className="flex items-center mb-4 mt-2">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mr-3 text-primary font-medium overflow-hidden border-2 border-primary/10">
            {tutor.profile_picture_url ? (
              <img src={tutor.profile_picture_url} alt={tutorName} className="w-full h-full object-cover" />
            ) : (
              <span>{getInitials(tutorName)}</span>
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800 leading-tight">{tutorName}</h3>
            <p className="text-xs text-gray-500 truncate max-w-[160px]">{tutorEmail}</p>
          </div>
        </div>
        
        {/* Expertise */}
        <div className="mb-4">
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <svg className="w-4 h-4 mr-2 text-primary" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
            </svg>
            <span className="font-medium">{getExpertise()}</span>
          </div>
          
          <div className="text-xs text-gray-500 flex items-center">
            <svg className="w-3 h-3 mr-1 text-gold" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-medium">Confidence:</span>
            <span className="ml-1">{Math.round(confidence)}%</span>
          </div>
        </div>
      </div>
      
      {/* Button */}
      <button
        onClick={() => onViewProfile(tutorId)}
        className="w-full py-2.5 flex items-center justify-center bg-primary text-white hover:bg-primary-dark transition-colors text-sm font-medium group-hover:bg-secondary"
      >
        <span>View Profile</span>
        <svg className="w-4 h-4 ml-1 transform transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </div>
  );
};

TutorRecommendationCard.propTypes = {
  tutor: PropTypes.shape({
    tutor_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    tutor_name: PropTypes.string,
    first_name: PropTypes.string,
    last_name: PropTypes.string,
    tutor_email: PropTypes.string,
    email: PropTypes.string,
    profile_picture_url: PropTypes.string,
    match_probability: PropTypes.number,
    confidence: PropTypes.number
  }).isRequired,
  onViewProfile: PropTypes.func.isRequired
};

export default TutorRecommendationCard; 