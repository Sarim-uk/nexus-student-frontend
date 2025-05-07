import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TutoringSession from '../components/TutoringSession';

const VideoRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get user data from localStorage
    try {           
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || localStorage.getItem('user_id');
      const userName = user.name || localStorage.getItem('user_name') || `Student-${userId}`;
      
      if (userId) {
        setUserData({
          userId,
          userName
        });
      } else {
        // No user ID, redirect to login
        navigate('/login');
      }
    } catch (error) {
      console.error('Failed to get user data:', error);
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const handleLeaveRoom = () => {
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!userData || !userData.userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Required</h2>
          <p className="text-gray-700 mb-4">
            You need to be logged in to join a video room.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      <div className="container mx-auto px-4 py-2">
        <div className="mb-2">
          <h1 className="text-2xl font-serif font-semibold text-dark">
            Video Session <span className="text-primary">Room</span>
          </h1>
          <p className="text-sm text-gray-600">
            Room ID: {roomId}
          </p>
        </div>
      </div>
      
      <div className="flex-grow bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>
        <TutoringSession />
      </div>
    </div>
  );
};

export default VideoRoom; 