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
    if (match >= 80) return 'text-green-600';
    if (match >= 60) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getExpertise = () => {
    // This is a placeholder. In a real app, you'd get this from the tutor data
    const subjects = ['Math', 'Science', 'Language', 'Humanities'];
    const index = Math.floor(tutorId.toString().charCodeAt(0) % subjects.length);
    return subjects[index];
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{tutorName}</h3>
        <div className={`text-sm font-bold ${getMatchColor(matchProbability)}`}>
          {Math.round(matchProbability)}% Match
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-600 text-sm">
          <span className="font-medium">Expertise:</span> {getExpertise()}
        </p>
        <p className="text-gray-500 text-xs mt-1">
          <span className="font-medium">Confidence:</span> {Math.round(confidence)}%
        </p>
        <p className="text-gray-400 text-xs mt-1 truncate">
          {tutorEmail}
        </p>
      </div>
      
      <button
        onClick={() => onViewProfile(tutorId)}
        className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        View Profile
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
    match_probability: PropTypes.number,
    confidence: PropTypes.number
  }).isRequired,
  onViewProfile: PropTypes.func.isRequired
};

export default TutorRecommendationCard; 