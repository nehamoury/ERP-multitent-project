import { Server, Socket } from 'socket.io';

export const handleChatEvents = (io: Server, socket: Socket) => {
  
  socket.on('typing', ({ roomId }) => {
    const { vendorId, userId } = socket.data;
    const channelName = `private-vendor-${vendorId}-room-${roomId}`;
    socket.to(channelName).emit('user-typing', { userId, roomId });
  });

  socket.on('stop-typing', ({ roomId }) => {
    const { vendorId, userId } = socket.data;
    const channelName = `private-vendor-${vendorId}-room-${roomId}`;
    socket.to(channelName).emit('user-stop-typing', { userId, roomId });
  });

};
