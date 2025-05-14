import React, { useEffect, useState, useRef } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import axios from 'axios';

const ZegoRoom = ({ roomId, userName, userId, sessionId, role = 'Host', onLeaveRoom }) => {
  const navigate = useNavigate();
  const roomRef = React.useRef(null);
  const [emotion, setEmotion] = useState('Detecting...');
  const videoRef = useRef(null);

  useEffect(() => {
    if (!roomId || !userId) {
      console.error("Room ID and User ID are required");
      return;
    }

    // Get the actual DOM element
    const element = roomRef.current;
    if (!element) return;

    // Create a room instance
    const initRoom = async () => {
      // Get token
      const appID = 1107019978;
      const serverSecret = "127d2f6d02d86b17d71284c585bb8b44";
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        roomId,
        userId,
        userName || `Student-${userId}`
      );

      // Create instance
      const zp = ZegoUIKitPrebuilt.create(kitToken);

      // Join room
      zp.joinRoom({
        container: element,
        scenario: {
          mode: ZegoUIKitPrebuilt.VideoConference,
        },
        sharedLinks: [
          {
            name: 'Personal link',
            url: `${window.location.protocol}//${window.location.host}${window.location.pathname}?roomID=${roomId}`,
          },
        ],
        turnOnMicrophoneWhenJoining: true,
        turnOnCameraWhenJoining: true,
        showMyCameraToggleButton: true,
        showMyMicrophoneToggleButton: true,
        showAudioVideoSettingsButton: true,
        showScreenSharingButton: true,
        showTextChat: true,
        showUserList: true,
        maxUsers: 2,
        layout: "Auto",
        showLayoutButton: false,
        onLeaveRoom: () => {
          // Handle leaving room
          if (onLeaveRoom) {
            onLeaveRoom();
          } else {
            navigate('/dashboard');
          }
        }
      });
    };

    initRoom();

    // Cleanup function
    return () => {
      // Any cleanup code
    };
  }, [roomId, userId, userName, onLeaveRoom, navigate]);

  // Set up emotion detection
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((error) => {
        console.error('Error accessing camera:', error);
      });
    
    const interval = setInterval(() => {
      captureFrame();
    }, 3000); // Capture every 3 seconds to reduce load
    
    // Cleanup function
    return () => {
      // Clear the emotion detection interval
      clearInterval(interval);
      
      // Clean up video stream
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, [roomId, userId]);

  const captureFrame = async () => {
    if (!videoRef.current || !videoRef.current.srcObject || !roomId || !userId) return;
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('image', blob);
      formData.append('session_id', sessionId);
      formData.append('user_id', userId);
      
      try {
        const response = await axios.post('http://localhost:8000/vidchat/detect-emotion/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setEmotion(response.data.emotions[0] || 'No emotion detected');
      } catch (error) {
        console.error('Error detecting emotion:', error);
      }
    }, 'image/jpeg');
  };

  return (
    <Box 
      sx={{
        width: '100%',
        height: '100%',
        minHeight: '600px',
        backgroundColor: 'background.paper',
        borderRadius: 1,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
    >
      {(!roomId || !userId) && (
        <Box 
          sx={{ 
            p: 3, 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%'
          }}
        >
          <Typography variant="h6" color="error">
            Missing room information
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Room ID and User ID are required to join a meeting.
          </Typography>
        </Box>
      )}
      
      {/* Hidden video element for emotion detection */}
      <video
        ref={videoRef}
        autoPlay
        muted
        style={{
          visibility: 'hidden',
          position: 'absolute',
          width: '1px',
          height: '1px',
          opacity: 0
        }}
      />
      
      {/* Remove Emotion Display from student view */}
      
      <Box
        ref={roomRef}
        sx={{
          width: '100%',
          height: '100%',
          flex: 1
        }}
      />
    </Box>
  );
};

export default ZegoRoom;