import { io } from 'socket.io-client';

// Dynamic socket URL detection for production and localhost
const getSocketUrl = () => {
  // Check for explicit environment variable first
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  
  // For production, use the current window's origin
  if (typeof window !== 'undefined' && window.location) {
    const { hostname, protocol, port } = window.location;
    const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
    const httpProtocol = protocol === 'https:' ? 'https:' : 'http:';
    
    // For WebSocket connections, we need the HTTP URL
    return `${httpProtocol}//${hostname}${port ? `:${port}` : ''}`;
  }
  
  // Fallback to localhost for development
  return 'http://localhost:3000';
};

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      const socketUrl = getSocketUrl();
      
      this.socket = io(socketUrl, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        forceNew: true,
        transports: ['websocket'] // Force WebSocket to avoid XHR polling errors
      });
      
      console.log('???? Socket Engine Initialized:', socketUrl);
      
      // Add connection error logging
      this.socket.on('connect_error', (error) => {
        console.error('???? Socket Connection Error:', error.message);
        console.error('???? Attempted URL:', socketUrl);
      });
      
      this.socket.on('connect', () => {
        console.log('???? Socket Connected Successfully');
      });
      
      this.socket.on('disconnect', (reason) => {
        console.warn('???? Socket Disconnected:', reason);
      });
    }
    return this.socket;
  }

  getSocket() {
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
export default socketService;
