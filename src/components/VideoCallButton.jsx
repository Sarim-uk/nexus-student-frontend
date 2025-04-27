import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * A button component that initiates a ZegoCloud video call session
 * 
 * @param {Object} props - The component props
 * @param {string} props.lessonId - The ID of the lesson to create a room for
 * @param {string} props.label - The button label text (default: "Join Video Call")
 * @param {Object} props.className - Additional CSS classes for the button
 * @param {boolean} props.disabled - Whether the button is disabled
 * @param {Function} props.onClick - Optional callback when the button is clicked
 * @returns {JSX.Element} The rendered component
 */
const VideoCallButton = ({ 
  lessonId, 
  label = "Join Video Call", 
  className = "", 
  disabled = false,
  onClick
}) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    // If an onClick handler is provided, call it first
    if (onClick) {
      onClick(e);
    }

    if (!e.defaultPrevented && !disabled) {
      // Create a consistent room ID format based on the lesson ID
      const roomId = `lesson_${lessonId}`;
      
      // Navigate to the video room
      navigate(`/room/${roomId}`);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`px-6 py-2 rounded-md font-medium flex items-center justify-center ${
        disabled 
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
          : 'bg-primary text-white hover:bg-primary/90 transition-colors'
      } ${className}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
      </svg>
      {label}
    </button>
  );
};

export default VideoCallButton; 