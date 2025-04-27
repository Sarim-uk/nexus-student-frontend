import React, { useEffect } from 'react';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { APP_ID, APP_SIGN } from '../config/zegoCloud';
import { useNavigate } from 'react-router-dom';

const ZegoRoom = ({ roomId, userName, userId, role = 'Host', onLeaveRoom }) => {
  const navigate = useNavigate();
  const roomRef = React.useRef(null);

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
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        APP_ID,
        APP_SIGN,
        roomId,
        userId,
        userName || `User-${userId}`
      );

      // Create instance
      const zp = ZegoUIKitPrebuilt.create(kitToken);

      // Join room
      zp.joinRoom({
        container: element,
        scenario: {
          mode: ZegoUIKitPrebuilt.OneONoneCall,
        },
        sharedLinks: [
          {
            name: 'Copy Link',
            url: `${window.location.origin}/room/${roomId}`,
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
        maxUsers: 50,
        layout: "Grid",
        showLayoutButton: true,
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

  return (
    <div className="w-full h-full min-h-[600px] bg-background rounded-lg overflow-hidden">
      <div
        className="w-full h-full"
        ref={roomRef}
      ></div>
    </div>
  );
};

export default ZegoRoom; 