import { toast } from 'react-toastify';

class VideoChatService {
  constructor() {
    this.peerConnections = {};
    this.localStream = null;
    this.screenStream = null;
    this.websocket = null;
    this.configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        // Add TURN servers for production deployment
      ]
    };
    this.userId = null;
    this.sessionId = null;
    this.onParticipantJoined = null;
    this.onParticipantLeft = null;
    this.onRemoteStreamAdded = null;
    this.onLocalStream = null;
    this.onConnectionStateChange = null;
    this.onError = null;
    this.onConnected = null;
    this.onDisconnected = null;
    this.useHTTPFallback = false;
    this.httpPollInterval = null;
    this.lastMessageTimestamp = null;
    this.directConnection = false;
    this.pollErrorCount = 0;
    this.httpErrorCount = 0;
  }

  // Initialize media devices and WebSocket connection
  async initialize(sessionId, userId, token) {
    try {
      this.sessionId = sessionId;
      this.userId = userId;

      // Get user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      // Notify callback about local stream
      if (this.onLocalStream) {
        this.onLocalStream(this.localStream);
      }

      // Connect to WebSocket server
      await this.connectWebSocket(sessionId, token);

      return this.localStream;
    } catch (error) {
      console.error('Failed to initialize video chat:', error);
      if (this.onError) {
        this.onError('Failed to access camera and microphone. Please check your device permissions.');
      }
      throw error;
    }
  }

  // Connect to WebSocket server
  async connectWebSocket(sessionId, token) {
    return new Promise((resolve, reject) => {
      try {
        // First try to connect to the WebSocket
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = process.env.REACT_APP_WS_URL || window.location.host;
        const wsUrl = `${wsProtocol}//${wsHost}/ws/videochat/${sessionId}/?token=${token}`;
        
        this.websocket = new WebSocket(wsUrl);

        this.websocket.onopen = () => {
          console.log('WebSocket connection established');
          if (this.onConnected) {
            this.onConnected();
          }

          // Send join message
          this.sendMessage({
            type: 'join',
            user: {
              id: this.userId
            }
          });

          resolve();
        };

        this.websocket.onmessage = (event) => {
          const message = JSON.parse(event.data);
          this.handleSignalingMessage(message);
        };

        this.websocket.onclose = () => {
          console.log('WebSocket connection closed');
          if (this.onDisconnected) {
            this.onDisconnected();
          }
        };

        this.websocket.onerror = (error) => {
          console.error('WebSocket error:', error);
          // Don't reject here - we'll fall back to HTTP instead
          this.fallbackToHTTP(sessionId, token);
        };
        
        // Add timeout to check if WebSocket connects
        setTimeout(() => {
          if (this.websocket.readyState !== WebSocket.OPEN) {
            console.log('WebSocket connection timeout, falling back to HTTP');
            this.fallbackToHTTP(sessionId, token);
          }
        }, 3000);
      } catch (error) {
        console.error('Error establishing WebSocket connection:', error);
        this.fallbackToHTTP(sessionId, token);
      }
    });
  }

  // Fallback to HTTP long polling when WebSocket is unavailable
  fallbackToHTTP(sessionId, token) {
    console.log('Falling back to HTTP polling for signaling');
    this.useHTTPFallback = true;
    
    if (this.onConnected) {
      this.onConnected();
    }
    
    // Set up polling interval for HTTP fallback
    this.lastMessageTimestamp = Date.now();
    this.httpPollInterval = setInterval(() => {
      this.pollMessages(sessionId, token);
    }, 2000); // Poll every 2 seconds
    
    // Send initial join message via HTTP
    this.sendMessageHTTP({
      type: 'join',
      user: {
        id: this.userId
      }
    }, sessionId, token);
  }

  // Poll for new messages using HTTP
  async pollMessages(sessionId, token) {
    try {
      // Get the API base URL (default to current host if not specified)
      const apiBase = process.env.REACT_APP_API_URL || '';
      
      // Construct the API URL
      const apiUrl = `${apiBase}/api/videochat/${sessionId}/messages/`;
      
      const response = await fetch(`${apiUrl}?since=${this.lastMessageTimestamp}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Check for HTML response (404 page, etc.)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        console.error('Received HTML instead of JSON');
        this.httpErrorCount++;
        return;
      }
      
      const data = await response.json();
      
      // Update the last message timestamp
      if (data.timestamp) {
        this.lastMessageTimestamp = data.timestamp;
      }
      
      // Process messages if any were received
      if (data.messages && data.messages.length > 0) {
        // Process each message through the signaling handler
        data.messages.forEach(message => {
          this.handleSignalingMessage(message);
        });
        
        // Reset error counter on success
        this.httpErrorCount = 0;
      }
    } catch (error) {
      console.error('Error polling messages:', error);
      this.httpErrorCount++;
      
      // If too many errors, try direct connection
      if (this.httpErrorCount > 5) {
        console.log('Too many HTTP polling errors, attempting direct connection');
        this.attemptDirectConnection();
      }
    }
  }

  // Send signaling message via WebSocket or HTTP fallback
  sendMessage(message) {
    // Add sender ID to the message
    message.sender = this.userId;
    
    if (this.useHTTPFallback) {
      this.sendMessageHTTP(message, this.sessionId);
    } else if (this.directConnection) {
      // In direct connection mode, handle messages directly
      this.handleDirectSignalingMessage(message);
    } else if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    } else {
      console.error('Cannot send message: WebSocket not connected and no fallback available');
      if (this.onError) {
        this.onError('Cannot send message: Communication channel not available');
      }
    }
  }

  // Send message via HTTP POST
  async sendMessageHTTP(message, sessionId, token) {
    try {
      if (!token) {
        token = localStorage.getItem('access_token');
      }
      
      // Get the API base URL (default to current host if not specified)
      const apiBase = process.env.REACT_APP_API_URL || '';
      
      // Construct the API URL
      const apiUrl = `${apiBase}/api/videochat/${sessionId}/message/`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(message)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Reset error counter on success
      this.pollErrorCount = 0;
    } catch (error) {
      console.error('Error sending message via HTTP:', error);
      this.pollErrorCount++;
      
      // If too many errors, try direct connection
      if (this.pollErrorCount > 5) {
        console.log('Too many HTTP send errors, attempting direct connection');
        this.attemptDirectConnection();
      }
    }
  }

  // Handle incoming signaling messages
  async handleSignalingMessage(message) {
    const { type, sender, sdp, candidate, user } = message;

    switch (type) {
      case 'user_join':
        console.log('User joined:', user);
        if (this.onParticipantJoined) {
          this.onParticipantJoined(user);
        }

        // Create a peer connection for this user
        this.createPeerConnection(user.id, true);
        break;

      case 'user_leave':
        console.log('User left:', user);
        if (this.onParticipantLeft) {
          this.onParticipantLeft(user.id);
        }

        // Close and clean up the peer connection
        if (this.peerConnections[user.id]) {
          this.peerConnections[user.id].close();
          delete this.peerConnections[user.id];
        }
        break;

      case 'offer':
        console.log('Received offer from:', sender);
        if (!this.peerConnections[sender]) {
          this.createPeerConnection(sender, false);
        }

        const pc = this.peerConnections[sender];
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        this.sendMessage({
          type: 'answer',
          target: sender,
          sdp: pc.localDescription
        });
        break;

      case 'answer':
        console.log('Received answer from:', sender);
        if (this.peerConnections[sender]) {
          await this.peerConnections[sender].setRemoteDescription(
            new RTCSessionDescription(sdp)
          );
        }
        break;

      case 'ice_candidate':
        if (this.peerConnections[sender]) {
          await this.peerConnections[sender].addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        }
        break;

      default:
        console.log('Unknown message type:', type);
    }
  }

  // Create a peer connection
  createPeerConnection(peerId, isInitiator) {
    const pc = new RTCPeerConnection(this.configuration);
    this.peerConnections[peerId] = pc;

    // Add local tracks to the peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendMessage({
          type: 'ice_candidate',
          target: peerId,
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state for peer ${peerId}:`, pc.connectionState);
      if (this.onConnectionStateChange) {
        this.onConnectionStateChange(peerId, pc.connectionState);
      }
    };

    // Handle receiving remote tracks
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (this.onRemoteStreamAdded) {
        this.onRemoteStreamAdded(peerId, stream);
      }
    };

    // If we're the initiator, create and send an offer
    if (isInitiator) {
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .then(() => {
          this.sendMessage({
            type: 'offer',
            target: peerId,
            sdp: pc.localDescription
          });
        })
        .catch(error => {
          console.error('Error creating offer:', error);
          if (this.onError) {
            this.onError('Failed to establish connection with peer');
          }
        });
    }

    return pc;
  }

  // Toggle audio stream
  toggleAudio(mute) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !mute;
      });
      return !mute;
    }
    return false;
  }

  // Toggle video stream
  toggleVideo(disable) {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = !disable;
      });
      return !disable;
    }
    return false;
  }

  // Share screen
  async toggleScreenShare() {
    try {
      if (this.screenStream) {
        // Stop screen sharing
        this.screenStream.getTracks().forEach(track => {
          track.stop();
        });
        this.screenStream = null;
        
        // Replace screen tracks with original video tracks
        if (this.localStream) {
          const senders = Object.values(this.peerConnections).map(pc => 
            pc.getSenders().find(sender => sender.track && sender.track.kind === 'video')
          );
          
          // Get the original video track
          const videoTrack = this.localStream.getVideoTracks()[0];
          
          if (videoTrack && senders) {
            // Replace the screen track with the original video track
            senders.forEach(sender => {
              if (sender) {
                sender.replaceTrack(videoTrack);
              }
            });
          }
        }
        
        return false;
      } else {
        // Start screen sharing
        this.screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true,
          audio: true
        });
        
        // Replace video tracks with screen tracks
        const screenVideoTrack = this.screenStream.getVideoTracks()[0];
        
        if (screenVideoTrack) {
          // Replace the track in all peer connections
          Object.values(this.peerConnections).forEach(pc => {
            const senders = pc.getSenders().filter(sender => 
              sender.track && sender.track.kind === 'video'
            );
            
            senders.forEach(sender => {
              sender.replaceTrack(screenVideoTrack);
            });
          });
          
          // Add listener for when user stops sharing screen from browser UI
          screenVideoTrack.onended = () => {
            this.toggleScreenShare();
          };
        }
        
        return true;
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      if (this.onError) {
        this.onError('Failed to share screen. Please check your permissions.');
      }
      return false;
    }
  }

  // End the call and clean up resources
  endCall() {
    // Clear any fallback mechanisms
    if (this.httpPollInterval) {
      clearInterval(this.httpPollInterval);
      this.httpPollInterval = null;
    }
    
    this.useHTTPFallback = false;
    this.directConnection = false;
    
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
    }

    // Close all peer connections
    Object.values(this.peerConnections).forEach(pc => pc.close());
    this.peerConnections = {};

    // Close WebSocket connection
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }

    this.localStream = null;
    this.screenStream = null;
    this.sessionId = null;
  }

  // Attempt direct connection when signaling server is unavailable
  attemptDirectConnection() {
    console.log('Attempting direct connection without signaling server');
    this.useHTTPFallback = false;
    this.directConnection = true;
    
    // Clear HTTP polling if active
    if (this.httpPollInterval) {
      clearInterval(this.httpPollInterval);
      this.httpPollInterval = null;
    }
    
    // Notify that we're now connected (but in direct mode)
    if (this.onConnected) {
      this.onConnected();
    }
    
    toast.warning('Using direct connection mode. Limited functionality available.');
  }

  // Handle signaling messages in direct connection mode
  handleDirectSignalingMessage(message) {
    // Handle direct connection messages
    // This is a simplified version without a server
    console.log('Handling direct message:', message);
    
    // In direct connection mode, we would typically use a data channel
    // to exchange messages between peers
    // This is a placeholder for a more complex implementation
  }
}

// Create a singleton instance
const videoChatService = new VideoChatService();
export default videoChatService; 