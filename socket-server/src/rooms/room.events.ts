import { Server, Socket } from 'socket.io';

const INTERNAL_API_URL = process.env.INTERNAL_API_URL || 'http://localhost:3000';
const INTERNAL_API_SECRET = process.env.INTERNAL_API_SECRET;

async function validateRoomAccess(roomId: string, userId: string, vendorId: string): Promise<boolean> {
  if (!INTERNAL_API_SECRET) {
    console.error('[SERVER AUDIT] INTERNAL_API_SECRET not configured');
    return false;
  }

  try {
    const res = await fetch(
      `${INTERNAL_API_URL}/api/internal/rooms/${roomId}/validate`,
      {
        headers: {
          'x-internal-secret': INTERNAL_API_SECRET,
          'x-user-id': userId,
          'x-vendor-id': vendorId,
        },
      }
    );
    return res.ok;
  } catch (error) {
    console.error(`[SERVER AUDIT] Room validation request failed:`, error);
    return false;
  }
}

export const handleRoomEvents = (io: Server, socket: Socket) => {
  
  socket.on('join-room', async ({ roomId }) => {
    try {
      const { vendorId, userId } = socket.data;

      const isValid = await validateRoomAccess(roomId, userId, vendorId);
      if (!isValid) {
        console.error(`[SERVER AUDIT] User ${userId} denied access to room ${roomId}`);
        socket.emit('error', 'Access denied to this room');
        return;
      }
      
      const channelName = `private-vendor-${vendorId}-room-${roomId}`;
      socket.join(channelName);
      
      console.log(`[SERVER AUDIT] User ${userId} joined room ${roomId}. Channel: ${channelName}`);
      
      socket.to(channelName).emit('user-joined', { userId });
      
    } catch (error) {
      console.error(`[SERVER AUDIT] Failed to join room:`, error);
      socket.emit('error', 'Failed to join room');
    }
  });

  socket.on('join-multiple-rooms', async ({ roomIds }: { roomIds: string[] }) => {
    try {
      const { vendorId, userId } = socket.data;
      if (!Array.isArray(roomIds)) return;

      const validRooms: string[] = [];
      for (const roomId of roomIds) {
        const isValid = await validateRoomAccess(roomId, userId, vendorId);
        if (isValid) {
          validRooms.push(roomId);
        }
      }

      const channels = validRooms.map(roomId => `private-vendor-${vendorId}-room-${roomId}`);
      if (channels.length > 0) {
        socket.join(channels);
      }
      
      console.log(`[SERVER AUDIT] User ${userId} joined ${validRooms.length}/${roomIds.length} rooms.`);
      
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
