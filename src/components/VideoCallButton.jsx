import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e) => {
    // If an onClick handler is provided, call it first
    if (onClick) {
      onClick(e);
    }

    if (!e.defaultPrevented && !disabled) {
      setIsLoading(true);
      try {
        // Get the access token from localStorage
        const token = localStorage.getItem('access_token');
        if (!token) {
          console.error('No access token found');
          alert('Please log in again to join the video call.');
          return;
        }

        console.log('Fetching session data for lesson ID:', lessonId);
        
        const response = await axios.get(`http://localhost:8000/sessions/details/${lessonId}/`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Session data response:', response.data);
        
        // Check if we have the tutor_room_id in the response
        if (response.data && response.data.tutor_room_id) {
          console.log('Found tutor room ID:', response.data.tutor_room_id);
          // Navigate to the video room with just the room ID as a query parameter
          navigate(`/room?roomID=${response.data.tutor_room_id}`);
        } else {
          console.error('Session data missing tutor_room_id:', response.data);
          alert('Unable to join the video call. Please try again.');
        }
      } catch (error) {
        console.error('Error fetching session data:', error);
        if (error.response) {
          console.error('Error response:', error.response.data);
          console.error('Error status:', error.response.status);
          if (error.response.status === 401) {
            alert('Your session has expired. Please log in again.');
          } else {
            alert('Unable to join the video call. Please try again.');
          }
        } else {
          alert('Unable to join the video call. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={`px-6 py-2 rounded-md font-medium flex items-center justify-center ${
        disabled || isLoading
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
          : 'bg-primary text-white hover:bg-primary/90 transition-colors'
      } ${className}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
      </svg>
      {isLoading ? 'Loading...' : label}
    </button>
  );
};

export default VideoCallButton; 