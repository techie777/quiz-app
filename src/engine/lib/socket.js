import { io } from 'socket.io-client';

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(socketUrl, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      console.log('📡 Socket Engine Initialized');
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
