import { useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { initializeSocket, getSocket, disconnectSocket } from '@/lib/socket-client';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const setupListeners = (socketInstance: Socket) => {
      if (socketInstance.connected) {
        if (mounted) setIsConnected(true);
      }

      const onConnect = () => {
        console.log(`[CLIENT AUDIT] Socket connected: ${socketInstance.id}`);
        if (mounted) setIsConnected(true);
      };
      
      const onDisconnect = () => {
        if (mounted) setIsConnected(false);
      };
      
      const onConnectError = (err: any) => {
        if (mounted) setError(err.message);
      };

      socketInstance.on('connect', onConnect);
      socketInstance.on('disconnect', onDisconnect);
      socketInstance.on('connect_error', onConnectError);

      return () => {
        socketInstance.off('connect', onConnect);
        socketInstance.off('disconnect', onDisconnect);
        socketInstance.off('connect_error', onConnectError);
      };
    };

    const connectSocket = async () => {
      try {
        const response = await fetch('/api/chat/token');
        if (!response.ok) throw new Error('Failed to fetch socket token');
        const data = await response.json();
        
        const socketInstance = initializeSocket(data.token);
        if (mounted) setSocket(socketInstance);
        
        return setupListeners(socketInstance);
      } catch (err: any) {
        if (mounted) setError(err.message);
      }
    };

    let cleanupListeners: (() => void) | undefined;

    if (!getSocket()) {
      connectSocket().then(cleanup => {
        cleanupListeners = cleanup;
      });
    } else {
      const instance = getSocket();
      if (instance) {
        setSocket(instance);
        cleanupListeners = setupListeners(instance);
      }
    }

    return () => {
      mounted = false;
      if (cleanupListeners) cleanupListeners();
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
