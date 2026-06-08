import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { authMiddleware } from './auth/auth.middleware';
import { handleChatEvents } from './chat/chat.events';
import { handleRoomEvents } from './rooms/room.events';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // In production, replace with specific origins
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Internal webhook endpoint for ERP to trigger socket events
app.post('/api/internal/webhook', (req, res) => {
  const { event, channel, data, secret } = req.body;
  
  console.log(`[SERVER AUDIT] Webhook received. Event: ${event}, Channel: ${channel}`);
  
  if (secret !== process.env.SOCKET_SECRET) {
    console.log(`[SERVER AUDIT] Webhook unauthorized! Secret mismatch.`);
    return res.status(401).json({ error: 'Unauthorized webhook request' });
  }

  // Broadcast event to the specified channel (room)
  if (Array.isArray(channel)) {
    console.log(`[SERVER AUDIT] Broadcasting event ${event} to ${channel.length} channels`);
    channel.forEach(c => io.to(c).emit(event, data));
  } else {
    console.log(`[SERVER AUDIT] Broadcasting event ${event} to channel ${channel}`);
    io.to(channel).emit(event, data);
  }
  
  res.status(200).json({ success: true });
});

// Apply authentication middleware
io.use(authMiddleware);

// Handle socket connections
io.on('connection', (socket) => {
  const userChannel = `private-vendor-${socket.data.vendorId}-user-${socket.data.userId}`;
  socket.join(userChannel);
  
  console.log(`Socket connected: ${socket.id} for user: ${socket.data.userId} (Tenant: ${socket.data.vendorId}). Joined: ${userChannel}`);

  // Register modular event handlers
  handleRoomEvents(io, socket);
  handleChatEvents(io, socket);

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3002;

httpServer.listen(PORT, () => {
  console.log(`Socket Gateway is running on port ${PORT}`);
});
