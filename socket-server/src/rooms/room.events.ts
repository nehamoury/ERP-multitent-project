import { Server, Socket } from 'socket.io';

export const handleRoomEvents = (io: Server, socket: Socket) => {
  
  socket.on('join-room', async ({ roomId }) => {
    try {
      const { vendorId, userId } = socket.data;

      // In a strict implementation, we would make an HTTP request to the Next.js ERP
      // to double check if this user is a participant of this roomId.
      // fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/internal/rooms/${roomId}/validate`, { headers: { vendorId, userId, secret } })
      
      // For now, assume validation passed if token is valid (or implement internal fetch)
      
      const channelName = `private-vendor-${vendorId}-room-${roomId}`;
      socket.join(channelName);
      
      console.log(`[SERVER AUDIT] User ${userId} joined room ${roomId}. Channel: ${channelName}`);
      
      // Notify room about presence
      socket.to(channelName).emit('user-joined', { userId });
      
    } catch (error) {
      console.error(`[SERVER AUDIT] Failed to join room:`, error);
      socket.emit('error', 'Failed to join room');
    }
  });

  socket.on('join-multiple-rooms', ({ roomIds }: { roomIds: string[] }) => {
    try {
      const { vendorId, userId } = socket.data;
      if (!Array.isArray(roomIds)) return;
      
      const channels = roomIds.map(roomId => `private-vendor-${vendorId}-room-${roomId}`);
      socket.join(channels);
      
      console.log(`[SERVER AUDIT] User ${userId} joined multiple rooms. Subscription count: ${channels.length}`);
      
    } catch (error) {
      console.error(`[SERVER AUDIT] Failed to join multiple rooms:`, error);
    }
  });

  socket.on('leave-room', ({ roomId }) => {
    const { vendorId, userId } = socket.data;
    const channelName = `private-vendor-${vendorId}-room-${roomId}`;
    
    socket.leave(channelName);
    socket.to(channelName).emit('user-left', { userId });
  });
};
