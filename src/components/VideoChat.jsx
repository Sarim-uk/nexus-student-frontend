import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, IconButton, Typography, Tooltip, Button, CircularProgress } from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import CallEndIcon from '@mui/icons-material/CallEnd';
import styled from '@emotion/styled';
import zegoCloudService from '../services/zegocloud';

const VideoContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  height: '100%',
  backgroundColor: '#000',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
});

const RemoteVideoContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  height: 'calc(100% - 80px)',
  backgroundColor: '#000',
  overflow: 'hidden',
});

const LocalVideoContainer = styled(Box)({
  position: 'absolute',
  width: '160px',
  height: '120px',
  top: '20px',
  right: '20px',
  backgroundColor: '#333',
  borderRadius: '8px',
  overflow: 'hidden',
  zIndex: 2,
  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
  border: '2px solid rgba(255, 255, 255, 0.2)',
});

const VideoControlsContainer = styled(Box)({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px',
  backgroundColor: '#1a1a1a',
  height: '80px',
  width: '100%',
  gap: '12px',
});

const Video = styled('video')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
});

const FallbackIndicator = styled(Box)({
  position: 'absolute',
  top: '5px',
  left: '5px',
  backgroundColor: 'rgba(255, 165, 0, 0.7)',
  color: 'white',
  fontSize: '10px',
  padding: '2px 6px',
  borderRadius: '4px',
  zIndex: 5,
});

const ConnectionQualityIndicator = styled(Box)({
  position: 'absolute',
  top: '5px',
  right: '5px',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  color: 'white',
  fontSize: '10px',
  padding: '2px 6px',
  borderRadius: '4px',
  zIndex: 5,
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
});

const UserLabel = styled(Typography)({
  position: 'absolute',
  bottom: '10px',
  left: '10px',
  padding: '4px 8px',
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  color: 'white',
  borderRadius: '4px',
  zIndex: 1,
});

const LoadingOverlay = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  zIndex: 10,
  color: 'white',
});

const VideoChat = ({ sessionId, participant, onEndCall, onClose }) => {
  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = userData.id || localStorage.getItem('user_id');
  const userName = userData.name || localStorage.getItem('user_name') || 'Student';
  const navigate = useNavigate();
  
  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const containerRef = useRef(null);
  
  // State
  const [connectionState, setConnectionState] = useState('connecting');
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoDisabled, setIsVideoDisabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [remoteUser, setRemoteUser] = useState(participant || null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [usingFallback, setUsingFallback] = useState(false);
  const [error, setError] = useState(null);
  const [screenStream, setScreenStream] = useState(null);
  const [screenStreamId, setScreenStreamId] = useState(null);
  
  useEffect(() => {
    const initializeVideoChat = async () => {
      if (!sessionId || !userId) {
        setError('Session ID or user ID missing');
        return;
      }
      
      setConnectionState('connecting');
      
      // Setup callbacks for the ZegoCloud service
      zegoCloudService.onLocalStream = (stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        setLocalStream(stream);
      };

      zegoCloudService.onRemoteStreamAdded = (peerId, stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        
        setRemoteStreams(prev => ({
          ...prev,
          [peerId]: stream
        }));
      };

      zegoCloudService.onConnectionStateChanged = (state) => {
        if (state === 'CONNECTED') {
          setConnectionState('connected');
        } else if (state === 'DISCONNECTED') {
          setConnectionState('disconnected');
        } else if (state === 'CONNECTING') {
          setConnectionState('connecting');
        }
      };

      zegoCloudService.onError = (errorMsg) => {
        console.error('Video chat error:', errorMsg);
        // Only show critical errors that prevent the call
        if (errorMsg.includes('Failed to access camera') || errorMsg.includes('Permission denied')) {
          setError(errorMsg);
          setConnectionState('error');
        }
      };

      zegoCloudService.onRoomUserUpdate = (roomID, updateType, userList) => {
        if (updateType === 'ADD') {
          // Someone joined
          userList.forEach(user => {
            // If it's not us, set as remote user
            if (user.userID !== userId) {
              setRemoteUser({
                id: user.userID,
                name: user.userName
              });
            }
          });
        } else if (updateType === 'DELETE') {
          // Someone left
          userList.forEach(user => {
            // If it was our remote user, clear it
            if (remoteUser && user.userID === remoteUser.id) {
              setRemoteUser(null);
            }
          });
        }
      };
      
      // Try to initialize the ZegoCloud service
      try {
        // Initialize the service with userId
        await zegoCloudService.initialize(userId, userName);
        
        // Join the room 
        await zegoCloudService.joinRoom(sessionId);
        
        // Start local stream
        await zegoCloudService.startLocalStream({ video: true, audio: true });
        
        // Publish the stream
        await zegoCloudService.publishStream();
        
        setConnectionState('connected');
      } catch (err) {
        console.error('Failed to start video chat:', err);
        setError('Failed to initialize video chat. Please check your camera and microphone permissions.');
        setConnectionState('error');
      }
    };
    
    // Initialize the video chat
    initializeVideoChat();
    
    // Clean up on unmount
    return () => {
      zegoCloudService.leaveRoom();
    };
  }, [sessionId, userId, userName, remoteUser]);
  
  // Toggle audio
  const toggleAudio = async () => {
    if (localStream) {
      const newMutedState = !isAudioMuted;
      await zegoCloudService.muteAudio(newMutedState);
      setIsAudioMuted(newMutedState);
    }
  };
  
  // Toggle video
  const toggleVideo = async () => {
    if (localStream) {
      const newDisabledState = !isVideoDisabled;
      await zegoCloudService.muteVideo(newDisabledState);
      setIsVideoDisabled(newDisabledState);
    }
  };
  
  // Toggle screen sharing
  const toggleScreenShare = async () => {
    if (isScreenSharing && screenStream) {
      // Stop screen sharing
      await zegoCloudService.stopScreenSharing(screenStream, screenStreamId);
      setScreenStream(null);
      setScreenStreamId(null);
      setIsScreenSharing(false);
    } else {
      // Start screen sharing
      try {
        const stream = await zegoCloudService.startScreenSharing();
        if (stream) {
          setScreenStream(stream);
          setScreenStreamId(`${sessionId}-${userId}-screen`);
          setIsScreenSharing(true);
        }
      } catch (error) {
        console.error('Failed to start screen sharing:', error);
      }
    }
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      } else if (containerRef.current.msRequestFullscreen) {
        containerRef.current.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
      setIsFullscreen(false);
    }
  };
  
  const handleEndCall = () => {
    zegoCloudService.leaveRoom();
    if (onEndCall) {
      onEndCall();
    } else if (onClose) {
      onClose();
    }
  };
  
  // Handle errors and loading states
  if (error) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        padding: 3,
        backgroundColor: '#1a1a1a',
        color: 'white'
      }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
        <Typography variant="body2" sx={{ mb: 3 }}>
          Please check your camera and microphone permissions and try again.
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={onClose || (() => navigate(-1))}
        >
          Go Back
        </Button>
      </Box>
    );
  }
  
  return (
    <VideoContainer ref={containerRef}>
      {/* Remote Video */}
      <RemoteVideoContainer>
        {connectionState === 'connected' && Object.keys(remoteStreams).length > 0 ? (
          <Video ref={remoteVideoRef} autoPlay playsInline />
        ) : connectionState === 'connecting' ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            color: 'white'
          }}>
            <CircularProgress color="primary" size={48} sx={{ mb: 2 }} />
            <Typography variant="body1">
              Connecting to session...
            </Typography>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            height: '100%',
            color: 'white'
          }}>
            <Typography variant="body1">
              Waiting for others to join...
            </Typography>
          </Box>
        )}
        
        {/* Connection status indicator */}
        {usingFallback && (
          <Box 
            sx={{ 
              position: 'absolute', 
              top: 10, 
              left: 10, 
              backgroundColor: 'rgba(0,0,0,0.5)', 
              color: 'white', 
              px: 1.5, 
              py: 0.5, 
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Box 
              sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                backgroundColor: 'warning.main' 
              }} 
            />
            <Typography variant="caption">
              Limited Connection
            </Typography>
          </Box>
        )}
        
        {/* Local Video (Picture-in-picture) */}
        <LocalVideoContainer>
          <Video ref={localVideoRef} autoPlay playsInline muted />
          {isVideoDisabled && (
            <Box 
              sx={{ 
                position: 'absolute', 
                top: 0, left: 0, right: 0, bottom: 0, 
                backgroundColor: 'rgba(0,0,0,0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <VideocamOffIcon sx={{ color: 'white', opacity: 0.8 }} />
            </Box>
          )}
        </LocalVideoContainer>
      </RemoteVideoContainer>
      
      {/* Video Controls */}
      <VideoControlsContainer>
        {/* Mute/Unmute */}
        <Tooltip title={isAudioMuted ? "Unmute" : "Mute"}>
          <IconButton 
            onClick={toggleAudio} 
            sx={{ 
              backgroundColor: isAudioMuted ? 'rgba(255,255,255,0.15)' : 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: isAudioMuted ? 'rgba(255,255,255,0.25)' : 'primary.dark'
              }
            }}
          >
            {isAudioMuted ? <MicOffIcon /> : <MicIcon />}
          </IconButton>
        </Tooltip>
        
        {/* Video Toggle */}
        <Tooltip title={isVideoDisabled ? "Turn Video On" : "Turn Video Off"}>
          <IconButton 
            onClick={toggleVideo}
            sx={{ 
              backgroundColor: isVideoDisabled ? 'rgba(255,255,255,0.15)' : 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: isVideoDisabled ? 'rgba(255,255,255,0.25)' : 'primary.dark'
              }
            }}
          >
            {isVideoDisabled ? <VideocamOffIcon /> : <VideocamIcon />}
          </IconButton>
        </Tooltip>
        
        {/* Screen Share */}
        <Tooltip title={isScreenSharing ? "Stop Sharing" : "Share Screen"}>
          <IconButton 
            onClick={toggleScreenShare}
            sx={{ 
              backgroundColor: isScreenSharing ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)',
              color: 'white',
              '&:hover': {
                backgroundColor: isScreenSharing ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.2)'
              }
            }}
          >
            {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
          </IconButton>
        </Tooltip>
        
        {/* Fullscreen Toggle */}
        <Tooltip title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
          <IconButton 
            onClick={toggleFullscreen}
            sx={{ 
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: 'white',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)'
              }
            }}
          >
            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Tooltip>
        
        {/* End Call */}
        <Tooltip title="End Call">
          <IconButton 
            onClick={handleEndCall}
            sx={{ 
              backgroundColor: 'error.main',
              color: 'white',
              ml: 2,
              '&:hover': {
                backgroundColor: 'error.dark'
              }
            }}
          >
            <CallEndIcon />
          </IconButton>
        </Tooltip>
      </VideoControlsContainer>
    </VideoContainer>
  );
};

export default VideoChat; 