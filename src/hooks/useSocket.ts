import { useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { initializeSocket, getSocket, disconnectSocket } from '@/lib/socket-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const connectSocket = async () => {
      try {
        const response = await fetch('/api/chat/token');
        if (!response.ok) {
          throw new Error('Failed to fetch socket token');
        }
        const data = await response.json();
        
        const socketInstance = initializeSocket(data.token);
        
        socketInstance.on('connect', () => {
          console.log(`[CLIENT AUDIT] Socket connected: ${socketInstance.id}`);
          if (mounted) setIsConnected(true);
        });

        socketInstance.on('disconnect', () => {
          if (mounted) setIsConnected(false);
        });

        socketInstance.on('connect_error', (err) => {
          if (mounted) setError(err.message);
        });

        if (mounted) setSocket(socketInstance);
      } catch (err: any) {
        if (mounted) setError(err.message);
      }
    };

    if (!getSocket()) {
      connectSocket();
    } else {
      setSocket(getSocket());
      setIsConnected(getSocket()?.connected || false);
    }

    return () => {
      mounted = false;
      // Depending on the architecture, you might not want to disconnect on unmount 
      // if the socket is used across the entire app. For a dedicated chat page, disconnecting is fine.
    };
  }, []);

  const joinRoom = useCallback((roomId: string) => {
    if (socket && isConnected) {
      console.log(`[CLIENT AUDIT] Emitting join-room for roomId: ${roomId}`);
      socket.emit('join-room', { roomId });
    } else {
      console.log(`[CLIENT AUDIT] Cannot join room ${roomId} yet. Socket: ${!!socket}, Connected: ${isConnected}`);
    }
  }, [socket, isConnected]);

  const joinMultipleRooms = useCallback((roomIds: string[]) => {
    if (socket && isConnected && roomIds.length > 0) {
      console.log(`[CLIENT AUDIT] Emitting join-multiple-rooms for ${roomIds.length} rooms`);
      socket.emit('join-multiple-rooms', { roomIds });
    }
  }, [socket, isConnected]);

  const leaveRoom = useCallback((roomId: string) => {
    if (socket && isConnected) {
      socket.emit('leave-room', { roomId });
    }
  }, [socket, isConnected]);

  return { socket, isConnected, error, joinRoom, joinMultipleRooms, leaveRoom };
};
